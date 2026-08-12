import Foundation
#if canImport(ActivityKit)
import ActivityKit

/// بنية بيانات Live Activity لتنبيه الصلاة القادمة — مُشتركة بين تطبيق المجلس
/// العلمي الرئيسي (يبدأ/يحدّث/ينهي النشاط) وإضافة الودجت PrayerLiveActivity
/// (تعرض الواجهة في Dynamic Island وشاشة القفل). يجب أن يتطابق هذا الملف
/// حرفياً في كلا الهدفين (Target Membership) وإلا فشل الترجيع (decode).
@available(iOS 16.2, *)
struct PrayerActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// اسم الصلاة بالعربية، مثل "العصر"
        var prayerName: String
        /// وقت الصلاة الفعلي — يُستخدَم لحساب العدّ التنازلي مباشرة في الواجهة
        /// (Text(timerInterval:) يُحدَّث تلقائياً من النظام بلا حاجة لتحديثات متكررة).
        var prayerTime: Date
        /// اسم المدينة/المحافظة المستخدمة في حساب الأوقات
        var locationLabel: String
        /// هل دخل وقت الصلاة فعلياً؟ (يُبدَّل النص من "بعد كذا دقيقة" إلى "حان الآن")
        var hasStarted: Bool
    }

    /// مفتاح الصلاة (fajr/dhuhr/asr/maghrib/isha) — ثابت طوال عمر النشاط
    var prayerKey: String
}
#endif
