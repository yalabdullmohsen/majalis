import Foundation

/// Production configuration for native networking (Supabase Auth + Vercel API).
/// Values are read from Info.plist keys so Release/Debug can differ via xcconfig.
@MainActor
final class AppConfig {
    static let shared = AppConfig()

    let supabaseURL: URL
    let supabaseAnonKey: String
    let vercelAPIBaseURL: URL
    let appIdentifier: String
    let environmentName: String

    private init() {
        let bundle = Bundle.main
        let supabaseURLString = Self.plistString("SUPABASE_URL", bundle: bundle)
            ?? "https://example.supabase.co"
        let anon = Self.plistString("SUPABASE_ANON_KEY", bundle: bundle) ?? ""
        let vercelBase = Self.plistString("VERCEL_API_BASE_URL", bundle: bundle)
            ?? "https://example.com"
        let envName = Self.plistString("APP_ENVIRONMENT", bundle: bundle) ?? "production"

        guard let supabaseURL = URL(string: supabaseURLString),
              let vercelAPIBaseURL = URL(string: vercelBase)
        else {
            preconditionFailure("Invalid SUPABASE_URL or VERCEL_API_BASE_URL in Info.plist")
        }

        self.supabaseURL = supabaseURL
        self.supabaseAnonKey = anon
        self.vercelAPIBaseURL = vercelAPIBaseURL
        self.appIdentifier = bundle.bundleIdentifier ?? "com.yousef.majlisilm"
        self.environmentName = envName
    }

    var isConfigured: Bool {
        !supabaseAnonKey.isEmpty && supabaseURL.host != nil
    }

    var supabaseAuthURL: URL {
        supabaseURL.appendingPathComponent("auth/v1")
    }

    var supabaseRESTURL: URL {
        supabaseURL.appendingPathComponent("rest/v1")
    }

    private static func plistString(_ key: String, bundle: Bundle) -> String? {
        guard let raw = bundle.object(forInfoDictionaryKey: key) as? String else { return nil }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty || trimmed.hasPrefix("$(") { return nil }
        return trimmed
    }
}

/// Session tokens persisted after Supabase Auth.
struct AuthSession: Codable, Equatable, Sendable {
    var accessToken: String
    var refreshToken: String
    var expiresAt: Date
    var userId: String?

    var isExpired: Bool {
        Date().addingTimeInterval(30) >= expiresAt
    }
}

/// Typed networking / auth failures with offline awareness.
enum NetworkServiceError: Error, LocalizedError, Sendable {
    case notConfigured
    case invalidURL
    case offline
    case unauthorized
    case httpStatus(Int, String)
    case decoding(String)
    case transport(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Supabase/Vercel configuration is missing from Info.plist."
        case .invalidURL:
            return "Could not construct a valid request URL."
        case .offline:
            return "No network connectivity. Showing cached/offline fallback."
        case .unauthorized:
            return "Session expired or unauthorized."
        case .httpStatus(let code, let body):
            return "HTTP \(code): \(body)"
        case .decoding(let message):
            return "Decoding failed: \(message)"
        case .transport(let message):
            return message
        }
    }
}
