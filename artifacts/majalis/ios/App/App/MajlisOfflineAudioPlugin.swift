import Capacitor
import Foundation

/// تخزين تلاوات دون اتصال في Application Support — مُستثنى من iCloud backup.
@objc(MajlisOfflineAudioPlugin)
public class MajlisOfflineAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MajlisOfflineAudioPlugin"
    public let jsName = "MajlisOfflineAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "writeSurah", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteSurah", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteReciter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listReciterSurahs", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSurahPlaybackUrl", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStorageUsage", returnType: CAPPluginReturnPromise),
    ]

    private let folderName = "MajlisOfflineAudio"

    private func rootDir() throws -> URL {
        guard
            let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
        else {
            throw NSError(domain: "MajlisOfflineAudio", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Application Support unavailable",
            ])
        }
        let dir = base.appendingPathComponent(folderName, isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var mutable = dir
        try mutable.setResourceValues(values)
        return dir
    }

    private func fileURL(reciterId: String, surah: Int) throws -> URL {
        let safeReciter = reciterId.replacingOccurrences(of: "/", with: "_")
        let dir = try rootDir().appendingPathComponent(safeReciter, isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir.appendingPathComponent(String(format: "%03d.mp3", surah))
    }

    @objc func writeSurah(_ call: CAPPluginCall) {
        guard let reciterId = call.getString("reciterId"), !reciterId.isEmpty else {
            call.reject("reciterId required")
            return
        }
        let surah = call.getInt("surah") ?? 0
        guard surah >= 1, surah <= 114 else {
            call.reject("surah must be 1..114")
            return
        }
        guard let b64 = call.getString("dataBase64"), let data = Data(base64Encoded: b64) else {
            call.reject("dataBase64 required")
            return
        }
        do {
            let url = try fileURL(reciterId: reciterId, surah: surah)
            try data.write(to: url, options: .atomic)
            call.resolve([
                "ok": true,
                "path": url.path,
                "bytes": data.count,
            ])
        } catch {
            call.reject("write failed: \(error.localizedDescription)", nil, error)
        }
    }

    @objc func deleteSurah(_ call: CAPPluginCall) {
        guard let reciterId = call.getString("reciterId"), !reciterId.isEmpty else {
            call.reject("reciterId required")
            return
        }
        let surah = call.getInt("surah") ?? 0
        guard surah >= 1, surah <= 114 else {
            call.reject("surah must be 1..114")
            return
        }
        do {
            let url = try fileURL(reciterId: reciterId, surah: surah)
            if FileManager.default.fileExists(atPath: url.path) {
                try FileManager.default.removeItem(at: url)
            }
            call.resolve(["ok": true])
        } catch {
            call.reject("delete failed", nil, error)
        }
    }

    @objc func deleteReciter(_ call: CAPPluginCall) {
        guard let reciterId = call.getString("reciterId"), !reciterId.isEmpty else {
            call.reject("reciterId required")
            return
        }
        do {
            let safeReciter = reciterId.replacingOccurrences(of: "/", with: "_")
            let dir = try rootDir().appendingPathComponent(safeReciter, isDirectory: true)
            if FileManager.default.fileExists(atPath: dir.path) {
                try FileManager.default.removeItem(at: dir)
            }
            call.resolve(["ok": true])
        } catch {
            call.reject("deleteReciter failed", nil, error)
        }
    }

    @objc func listReciterSurahs(_ call: CAPPluginCall) {
        guard let reciterId = call.getString("reciterId"), !reciterId.isEmpty else {
            call.reject("reciterId required")
            return
        }
        do {
            let safeReciter = reciterId.replacingOccurrences(of: "/", with: "_")
            let dir = try rootDir().appendingPathComponent(safeReciter, isDirectory: true)
            guard FileManager.default.fileExists(atPath: dir.path) else {
                call.resolve(["surahs": []])
                return
            }
            let items = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.fileSizeKey])
            var surahs: [[String: Any]] = []
            for url in items where url.pathExtension.lowercased() == "mp3" {
                let base = url.deletingPathExtension().lastPathComponent
                guard let num = Int(base), num >= 1, num <= 114 else { continue }
                let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
                surahs.append(["surah": num, "bytes": size])
            }
            surahs.sort { ($0["surah"] as? Int ?? 0) < ($1["surah"] as? Int ?? 0) }
            call.resolve(["surahs": surahs])
        } catch {
            call.reject("list failed", nil, error)
        }
    }

    @objc func getSurahPlaybackUrl(_ call: CAPPluginCall) {
        guard let reciterId = call.getString("reciterId"), !reciterId.isEmpty else {
            call.reject("reciterId required")
            return
        }
        let surah = call.getInt("surah") ?? 0
        guard surah >= 1, surah <= 114 else {
            call.reject("surah must be 1..114")
            return
        }
        do {
            let url = try fileURL(reciterId: reciterId, surah: surah)
            guard FileManager.default.fileExists(atPath: url.path) else {
                call.resolve(["url": NSNull()])
                return
            }
            call.resolve(["url": url.absoluteString, "path": url.path])
        } catch {
            call.reject("lookup failed", nil, error)
        }
    }

    @objc func getStorageUsage(_ call: CAPPluginCall) {
        do {
            let root = try rootDir()
            var total = 0
            if let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: [.fileSizeKey]) {
                for case let url as URL in enumerator {
                    total += (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
                }
            }
            call.resolve(["bytes": total, "rootPath": root.path])
        } catch {
            call.reject("usage failed", nil, error)
        }
    }
}
