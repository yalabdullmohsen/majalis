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
        // امسح كاش WKWebView / Service Worker عند كل إقلاع حتى يُحمَّل الموقع الحي بلا بقايا قديمة.
        WKWebsiteDataStore.default().removeData(
            ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
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

    // MARK: - APNs stubs (inactive)
    // Primary strategy: Capacitor Local Notifications (prayer + daily Quran).
    // Remote Push is NOT registered — App.entitlements has no aps-environment.
    // These callbacks only fire if the app later opts into remote registration.
    // To enable later: add Push Notifications capability, aps-environment entitlement,
    // @capacitor/push-notifications, then register for remote notifications after permission.

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        NSLog("[MajlisAPNs] unexpected token registration (Remote Push disabled). length=%lu", UInt(token.count))
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NSLog("[MajlisAPNs] registration failed (expected while Local Notifications are primary): %@", error.localizedDescription)
    }

}
