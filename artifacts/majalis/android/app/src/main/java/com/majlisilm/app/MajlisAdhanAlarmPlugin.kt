package com.majlisilm.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * جدولة أذان كامل عبر AlarmManager.setExactAndAllowWhileIdle + تشغيل الخدمة الأمامية.
 */
@CapacitorPlugin(name = "MajlisAdhanAlarm")
class MajlisAdhanAlarmPlugin : Plugin() {
    @PluginMethod
    fun scheduleExact(call: PluginCall) {
        val atMs = call.getLong("atMs")
        val url = call.getString("url")
        val title = call.getString("title") ?: "الأذان"
        val prayerKey = call.getString("prayerKey") ?: "adhan"
        val requestCode = call.getInt("requestCode") ?: prayerKey.hashCode()
        if (atMs == null || url.isNullOrBlank()) {
            call.reject("atMs و url مطلوبان")
            return
        }
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
            call.reject("SCHEDULE_EXACT_ALARM غير ممنوح")
            return
        }
        val pi = alarmPendingIntent(requestCode, url, title, prayerKey)
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi)
        val ret = JSObject()
        ret.put("ok", true)
        ret.put("requestCode", requestCode)
        call.resolve(ret)
    }

    @PluginMethod
    fun cancel(call: PluginCall) {
        val prayerKey = call.getString("prayerKey") ?: "adhan"
        val requestCode = call.getInt("requestCode") ?: prayerKey.hashCode()
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(alarmPendingIntent(requestCode, "", "", prayerKey))
        val stop = Intent(context, AdhanPlaybackService::class.java).apply {
            action = AdhanPlaybackService.ACTION_STOP
        }
        context.startService(stop)
        val ret = JSObject()
        ret.put("ok", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun canScheduleExact(call: PluginCall) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val ok = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            am.canScheduleExactAlarms()
        } else {
            true
        }
        val ret = JSObject()
        ret.put("ok", ok)
        call.resolve(ret)
    }

    @PluginMethod
    fun openExactAlarmSettings(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${context.packageName}")
            }
            activity.startActivity(intent)
        }
        call.resolve(JSObject().put("ok", true))
    }

    @PluginMethod
    fun isIgnoringBatteryOptimizations(call: PluginCall) {
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val ok = pm.isIgnoringBatteryOptimizations(context.packageName)
        call.resolve(JSObject().put("ok", ok))
    }

    @PluginMethod
    fun requestIgnoreBatteryOptimizations(call: PluginCall) {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
        activity.startActivity(intent)
        call.resolve(JSObject().put("ok", true))
    }

    @PluginMethod
    fun playNow(call: PluginCall) {
        val url = call.getString("url")
        val title = call.getString("title") ?: "الأذان"
        val prayerKey = call.getString("prayerKey") ?: "adhan"
        if (url.isNullOrBlank()) {
            call.reject("url مطلوب")
            return
        }
        val play = Intent(context, AdhanPlaybackService::class.java).apply {
            action = AdhanPlaybackService.ACTION_PLAY
            putExtra(AdhanPlaybackService.EXTRA_URL, url)
            putExtra(AdhanPlaybackService.EXTRA_TITLE, title)
            putExtra(AdhanPlaybackService.EXTRA_PRAYER_KEY, prayerKey)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(play)
        } else {
            context.startService(play)
        }
        call.resolve(JSObject().put("ok", true))
    }

    private fun alarmPendingIntent(
        requestCode: Int,
        url: String,
        title: String,
        prayerKey: String,
    ): PendingIntent {
        val intent = Intent(context, AdhanAlarmReceiver::class.java).apply {
            putExtra(AdhanPlaybackService.EXTRA_URL, url)
            putExtra(AdhanPlaybackService.EXTRA_TITLE, title)
            putExtra(AdhanPlaybackService.EXTRA_PRAYER_KEY, prayerKey)
        }
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
