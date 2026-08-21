import UIKit
import Capacitor
import AVFoundation
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Do not activate AVAudioSession at launch — plugins configure category on demand.
        _ = AppConfig.shared
        _ = NetworkService.shared
        // امسح كاش الشبكة وعمال الخدمة فقط — لا localStorage/الكوكيز حتى تبقى شاشة البدء مرة واحدة.
        var cacheTypes: Set<String> = [
            WKWebsiteDataTypeDiskCache,
            WKWebsiteDataTypeMemoryCache,
            WKWebsiteDataTypeOfflineWebApplicationCache,
            WKWebsiteDataTypeFetchCache,
        ]
        if #available(iOS 16.4, *) {
            cacheTypes.insert(WKWebsiteDataTypeServiceWorkerRegistrations)
        }
        WKWebsiteDataStore.default().removeData(
            ofTypes: cacheTypes,
            modifiedSince: Date.distantPast
        ) {}
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMediaServicesReset),
            name: AVAudioSession.mediaServicesWereResetNotification,
            object: nil
        )
        return true
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handleMediaServicesReset(_ notification: Notification) {
        NSLog("[AppDelegate] AVAudioSession media services were reset — WebView plugins must reconfigure")
        NotificationCenter.default.post(name: Notification.Name("MajlisMediaServicesReset"), object: nil)
    }

    func applicationWillResignActive(_ application: UIApplication) {
        NotificationCenter.default.post(name: Notification.Name("MajlisAppWillResignActive"), object: nil)
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        NotificationCenter.default.post(name: Notification.Name("MajlisAppDidEnterBackground"), object: nil)
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        NotificationCenter.default.post(name: Notification.Name("MajlisAppWillEnterForeground"), object: nil)
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        NotificationCenter.default.post(name: Notification.Name("MajlisAppDidBecomeActive"), object: nil)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        NotificationCenter.default.removeObserver(self)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // MARK: - APNs → Capacitor Push Notifications
    // Local Notifications remain primary for prayer / daily Quran schedules.
    // Remote Push is registered from JS via @capacitor/push-notifications.

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        NSLog("[MajlisAPNs] registered for remote notifications. length=%lu", UInt(token.count))
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        NSLog("[MajlisAPNs] registration failed: %@", error.localizedDescription)
    }

}
