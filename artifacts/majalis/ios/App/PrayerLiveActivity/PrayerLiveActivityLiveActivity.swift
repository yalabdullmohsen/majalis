import ActivityKit
import WidgetKit
import SwiftUI

/// ألوان هوية المجلس العلمي — أخضر زمردي داكن، تُطابق التدرّج المستخدم في
/// شريط تنبيه الصلاة داخل التطبيق (index.css / elite-2026.css §193b).
private enum MajalisColor {
    static let emeraldDeep = Color(red: 0x0B / 255, green: 0x4D / 255, blue: 0x35 / 255)
    static let emerald = Color(red: 0x0E / 255, green: 0x6E / 255, blue: 0x52 / 255)
    static let emeraldDark = Color(red: 0x13 / 255, green: 0x3D / 255, blue: 0x2A / 255)
    static let gold = Color(red: 0xD4 / 255, green: 0xAF / 255, blue: 0x6A / 255)
}

private func prayerSymbol(for key: String) -> String {
    switch key.lowercased() {
    case "fajr": return "moon.stars.fill"
    case "dhuhr": return "sun.max.fill"
    case "asr": return "sun.haze.fill"
    case "maghrib": return "sunset.fill"
    case "isha": return "moon.fill"
    default: return "building.columns.fill"
    }
}

struct PrayerLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PrayerActivityAttributes.self) { context in
            // ── شاشة القفل ──
            LockScreenPrayerView(attributes: context.attributes, state: context.state)
                .activityBackgroundTint(MajalisColor.emeraldDark)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: prayerSymbol(for: context.attributes.prayerKey))
                        .font(.title3)
                        .foregroundStyle(MajalisColor.gold)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.hasStarted {
                        Text("الآن")
                            .font(.headline)
                            .foregroundStyle(.white)
                    } else {
                        Text(timerInterval: Date.now...context.state.prayerTime, countsDown: true)
                            .font(.headline.monospacedDigit())
                            .foregroundStyle(.white)
                            .frame(maxWidth: 64)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.prayerName)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.state.hasStarted
                             ? "حان الآن وقت صلاة \(context.state.prayerName)"
                             : "أذان \(context.state.prayerName) — \(context.state.prayerTime.formatted(date: .omitted, time: .shortened))")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.85))
                        Spacer()
                        if !context.state.locationLabel.isEmpty {
                            Text(context.state.locationLabel)
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.6))
                        }
                    }
                }
            } compactLeading: {
                Image(systemName: prayerSymbol(for: context.attributes.prayerKey))
                    .foregroundStyle(MajalisColor.gold)
            } compactTrailing: {
                if context.state.hasStarted {
                    Text("الآن")
                        .font(.caption2.bold())
                        .foregroundStyle(.white)
                } else {
                    Text(timerInterval: Date.now...context.state.prayerTime, countsDown: true)
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.white)
                        .frame(maxWidth: 44)
                }
            } minimal: {
                Image(systemName: prayerSymbol(for: context.attributes.prayerKey))
                    .foregroundStyle(MajalisColor.gold)
            }
            .widgetURL(URL(string: "majlisilm://prayer-times"))
            .keylineTint(MajalisColor.emerald)
        }
    }
}

/// بطاقة شاشة القفل — واضحة في الوضعين الفاتح والداكن (خلفية داكنة ثابتة
/// عبر activityBackgroundTint، فلا تتأثر بوضع النظام، مطابقة لهوية المجلس).
private struct LockScreenPrayerView: View {
    let attributes: PrayerActivityAttributes
    let state: PrayerActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(MajalisColor.emerald.opacity(0.35))
                    .frame(width: 44, height: 44)
                Image(systemName: prayerSymbol(for: attributes.prayerKey))
                    .font(.title3)
                    .foregroundStyle(MajalisColor.gold)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(state.hasStarted ? "حان الآن وقت صلاة \(state.prayerName)" : "صلاة \(state.prayerName) القادمة")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(state.prayerTime.formatted(date: .omitted, time: .shortened))
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.75))
                    if !state.locationLabel.isEmpty {
                        Text("•")
                            .foregroundStyle(.white.opacity(0.4))
                        Text(state.locationLabel)
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.75))
                    }
                }
            }

            Spacer(minLength: 8)

            if !state.hasStarted {
                Text(timerInterval: Date.now...state.prayerTime, countsDown: true)
                    .font(.title3.monospacedDigit().bold())
                    .foregroundStyle(.white)
                    .frame(minWidth: 64, alignment: .trailing)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .environment(\.layoutDirection, .rightToLeft)
    }
}
