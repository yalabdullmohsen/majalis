import Foundation
import Network

/// Production network layer: Supabase Auth (JWT) + authenticated calls to Vercel APIs.
/// Uses Swift Concurrency (`async/await`) and forwards `Authorization: Bearer <JWT>`.
@MainActor
final class NetworkService {
    static let shared = NetworkService()

    private let config: AppConfig
    private let session: URLSession
    private let pathMonitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "com.yousef.majlisilm.network.monitor")
    private var isPathSatisfied = true

    private(set) var sessionTokens: AuthSession?
    private let sessionKeychainAccount = "majlis.auth.session.v1"

    private init(config: AppConfig = .shared, session: URLSession = .shared) {
        self.config = config
        self.session = session
        restoreSession()
        startPathMonitor()
    }

    // MARK: - Connectivity

    private func startPathMonitor() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isPathSatisfied = path.status == .satisfied
            }
        }
        pathMonitor.start(queue: monitorQueue)
    }

    var isOnline: Bool { isPathSatisfied }

    // MARK: - Session persistence (Keychain only — never UserDefaults)

    private func restoreSession() {
        // Purge any legacy insecure UserDefaults token blob if present.
        UserDefaults.standard.removeObject(forKey: "majlis.auth.session.v1")
        do {
            guard let data = try KeychainStore.get(account: sessionKeychainAccount) else { return }
            if let decoded = try? JSONDecoder().decode(AuthSession.self, from: data) {
                sessionTokens = decoded
            }
        } catch {
            NSLog("[NetworkService] Keychain restore failed: %@", error.localizedDescription)
        }
    }

    private func persistSession(_ session: AuthSession?) {
        sessionTokens = session
        do {
            if let session, let data = try? JSONEncoder().encode(session) {
                try KeychainStore.set(data, account: sessionKeychainAccount)
            } else {
                try KeychainStore.delete(account: sessionKeychainAccount)
            }
        } catch {
            NSLog("[NetworkService] Keychain persist failed: %@", error.localizedDescription)
        }
    }

    func clearSession() {
        persistSession(nil)
    }

    // MARK: - Supabase Auth

    /// Password sign-in against Supabase Auth `/token?grant_type=password`.
    func signIn(email: String, password: String) async throws -> AuthSession {
        guard config.isConfigured else { throw NetworkServiceError.notConfigured }
        guard isOnline else { throw NetworkServiceError.offline }

        var components = URLComponents(url: config.supabaseAuthURL.appendingPathComponent("token"), resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "grant_type", value: "password")]
        guard let url = components?.url else { throw NetworkServiceError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(config.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "email": email,
            "password": password,
        ])

        let payload: TokenResponse = try await perform(request, decode: TokenResponse.self)
        let auth = payload.asSession()
        persistSession(auth)
        return auth
    }

    /// Refresh access token using the stored refresh token.
    @discardableResult
    func refreshSessionIfNeeded() async throws -> AuthSession {
        guard config.isConfigured else { throw NetworkServiceError.notConfigured }
        guard var current = sessionTokens else { throw NetworkServiceError.unauthorized }
        if !current.isExpired { return current }
        guard isOnline else { throw NetworkServiceError.offline }

        var components = URLComponents(url: config.supabaseAuthURL.appendingPathComponent("token"), resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "grant_type", value: "refresh_token")]
        guard let url = components?.url else { throw NetworkServiceError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(config.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 30
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "refresh_token": current.refreshToken,
        ])

        let payload: TokenResponse = try await perform(request, decode: TokenResponse.self)
        current = payload.asSession()
        persistSession(current)
        return current
    }

    func signOut() async {
        defer { clearSession() }
        guard config.isConfigured, let token = sessionTokens?.accessToken, isOnline else { return }
        var request = URLRequest(url: config.supabaseAuthURL.appendingPathComponent("logout"))
        request.httpMethod = "POST"
        request.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 15
        _ = try? await session.data(for: request)
    }

    // MARK: - Vercel API (JWT forwarded)

    /// GET a Vercel/API path (e.g. `/api/healthz`, `/api/prayer-times`) with Bearer JWT when available.
    func getVercelAPI<T: Decodable>(
        path: String,
        query: [URLQueryItem] = [],
        as type: T.Type = T.self,
        requireAuth: Bool = false
    ) async throws -> T {
        let request = try await makeVercelRequest(path: path, method: "GET", query: query, body: nil as Data?, requireAuth: requireAuth)
        return try await perform(request, decode: type)
    }

    /// POST JSON to a Vercel/API path with Bearer JWT.
    func postVercelAPI<Body: Encodable, T: Decodable>(
        path: String,
        body: Body,
        as type: T.Type = T.self,
        requireAuth: Bool = true
    ) async throws -> T {
        let data = try JSONEncoder().encode(body)
        let request = try await makeVercelRequest(path: path, method: "POST", query: [], body: data, requireAuth: requireAuth)
        return try await perform(request, decode: type)
    }

    /// Offline-safe fetch: returns cached Data when offline and cache exists.
    func getVercelData(path: String, cacheKey: String, requireAuth: Bool = false) async throws -> Data {
        let cacheURL = offlineCacheURL(for: cacheKey)
        if !isOnline {
            if let cached = try? Data(contentsOf: cacheURL) {
                return cached
            }
            throw NetworkServiceError.offline
        }

        let request = try await makeVercelRequest(path: path, method: "GET", query: [], body: nil as Data?, requireAuth: requireAuth)
        let data = try await performRaw(request)
        try? FileManager.default.createDirectory(at: cacheURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? data.write(to: cacheURL, options: .atomic)
        return data
    }

    // MARK: - Request builders

    private func makeVercelRequest(
        path: String,
        method: String,
        query: [URLQueryItem],
        body: Data?,
        requireAuth: Bool
    ) async throws -> URLRequest {
        if !isOnline { throw NetworkServiceError.offline }

        let trimmed = path.hasPrefix("/") ? path : "/\(path)"
        let base = config.vercelAPIBaseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard var components = URLComponents(string: "\(base)\(trimmed)") else {
            throw NetworkServiceError.invalidURL
        }
        if !query.isEmpty {
            components.queryItems = query
        }
        guard let url = components.url else { throw NetworkServiceError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }

        if requireAuth || sessionTokens != nil {
            let auth = try await refreshSessionIfNeeded()
            request.setValue("Bearer \(auth.accessToken)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    // MARK: - Transport

    private func perform<T: Decodable>(_ request: URLRequest, decode: T.Type) async throws -> T {
        let data = try await performRaw(request)
        do {
            return try JSONDecoder.supabase.decode(T.self, from: data)
        } catch {
            throw NetworkServiceError.decoding(error.localizedDescription)
        }
    }

    private func performRaw(_ request: URLRequest) async throws -> Data {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw NetworkServiceError.transport("Invalid HTTP response")
            }
            switch http.statusCode {
            case 200..<300:
                return data
            case 401, 403:
                throw NetworkServiceError.unauthorized
            default:
                let body = String(data: data, encoding: .utf8) ?? ""
                throw NetworkServiceError.httpStatus(http.statusCode, String(body.prefix(400)))
            }
        } catch let error as NetworkServiceError {
            throw error
        } catch let urlError as URLError where urlError.code == .notConnectedToInternet || urlError.code == .networkConnectionLost {
            throw NetworkServiceError.offline
        } catch {
            throw NetworkServiceError.transport(error.localizedDescription)
        }
    }

    private func offlineCacheURL(for key: String) -> URL {
        let safe = key.replacingOccurrences(of: "/", with: "_")
        let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        return dir.appendingPathComponent("majlis-offline", isDirectory: true)
            .appendingPathComponent("\(safe).json")
    }
}

// MARK: - Supabase token payload

private struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let user: TokenUser?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }

    func asSession() -> AuthSession {
        AuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(expiresIn)),
            userId: user?.id
        )
    }
}

private struct TokenUser: Decodable {
    let id: String
}

private extension JSONDecoder {
    static let supabase: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()
}

/// Convenience façade matching a standardized Supabase client entrypoint.
@MainActor
enum SupabaseClientFactory {
    static var sharedNetwork: NetworkService { .shared }
    static var config: AppConfig { .shared }

    static func requireConfigured() throws {
        guard AppConfig.shared.isConfigured else { throw NetworkServiceError.notConfigured }
    }
}
