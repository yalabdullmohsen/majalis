package com.majlisilm.app

import android.content.Intent
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * جسر Capacitor لبدء/إيقاف خدمة التشغيل الأمامية على Android.
 * يُستدعى من طبقة التلاوة عند enablePlayback / deactivate.
 */
@CapacitorPlugin(name = "MajlisMediaPlayback")
class MajlisMediaPlaybackPlugin : Plugin() {
    @PluginMethod
    fun startForeground(call: PluginCall) {
        val title = call.getString("title") ?: "تلاوة القرآن"
        val artist = call.getString("artist") ?: "المجلس العلمي"
        val intent = Intent(context, MediaPlaybackService::class.java).apply {
            putExtra(MediaPlaybackService.EXTRA_TITLE, title)
            putExtra(MediaPlaybackService.EXTRA_ARTIST, artist)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        val ret = JSObject()
        ret.put("ok", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun stopForeground(call: PluginCall) {
        val intent = Intent(context, MediaPlaybackService::class.java).apply {
            action = MediaPlaybackService.ACTION_STOP
        }
        context.startService(intent)
        val ret = JSObject()
        ret.put("ok", true)
        call.resolve(ret)
    }
}
