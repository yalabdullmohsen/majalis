import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

/// جسر Capacitor بين طبقة React (src/lib/plugins/prayer-live-activity.ts)
/// وActivityKit الأصلي — يبدأ/يحدّث/ينهي Live Activity واحدة كحد أقصى لتنبيه
/// الصلاة القادمة. على iOS < 16.1 كل الدوال تُرجع نتيجة "غير مدعومة" بأمان
/// بلا رمي أي استثناء — البديل الكامل (الشريط + الإشعار المحلي) يعمل بمعزل
/// عن هذا الجسر تماماً.
@objc(PrayerLiveActivityPlugin)
public class PrayerLiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PrayerLiveActivityPlugin"
    public let jsName = "PrayerLiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "areActivitiesSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endActivity", returnType: CAPPluginReturnPromise)
    ]

    @objc func areActivitiesSupported(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            call.resolve(["supported": ActivityAuthorizationInfo().areActivitiesEnabled])
            return
        }
        #endif
        call.resolve(["supported": false])
    }

    @objc func startActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.resolve(["started": false])
                return
            }
            guard
                let prayerKey = call.getString("prayerKey"),
                let prayerName = call.getString("prayerName"),
                let prayerTimeIso = call.getString("prayerTimeIso"),
                let prayerTime = ISO8601DateFormatter().date(from: prayerTimeIso)
            else {
                call.resolve(["started": false])
                return
            }
            let locationLabel = call.getString("locationLabel") ?? ""

            // نشاط واحد كحد أقصى: أنهِ أي نشاط سابق قبل بدء نشاط جديد.
            for activity in Activity<PrayerActivityAttributes>.activities {
                Task { await activity.end(nil, dismissalPolicy: .immediate) }
            }

            let attributes = PrayerActivityAttributes(prayerKey: prayerKey)
            let state = PrayerActivityAttributes.ContentState(
                prayerName: prayerName,
                prayerTime: prayerTime,
                locationLabel: locationLabel,
                hasStarted: false
            )
            do {
                _ = try Activity<PrayerActivityAttributes>.request(
                    attributes: attributes,
                    content: .init(state: state, staleDate: nil)
                )
                call.resolve(["started": true])
            } catch {
                call.resolve(["started": false])
            }
            return
        }
        #endif
        call.resolve(["started": false])
    }

    @objc func updateActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let hasStarted = call.getBool("hasStarted") ?? true
            guard let activity = Activity<PrayerActivityAttributes>.activities.first else {
                call.resolve(["updated": false])
                return
            }
            var state = activity.content.state
            state.hasStarted = hasStarted
            Task {
                await activity.update(.init(state: state, staleDate: nil))
            }
            call.resolve(["updated": true])
            return
        }
        #endif
        call.resolve(["updated": false])
    }

    @objc func endActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let activities = Activity<PrayerActivityAttributes>.activities
            guard !activities.isEmpty else {
                call.resolve(["ended": false])
                return
            }
            for activity in activities {
                Task { await activity.end(nil, dismissalPolicy: .immediate) }
            }
            call.resolve(["ended": true])
            return
        }
        #endif
        call.resolve(["ended": false])
    }
}
