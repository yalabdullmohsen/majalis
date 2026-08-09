package com.majlisilm.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * يستقبل منبّه AlarmManager ويبدأ خدمة الأذان الأمامية.
 */
class AdhanAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val url = intent?.getStringExtra(AdhanPlaybackService.EXTRA_URL) ?: return
        val title = intent.getStringExtra(AdhanPlaybackService.EXTRA_TITLE) ?: "الأذان"
        val prayerKey = intent.getStringExtra(AdhanPlaybackService.EXTRA_PRAYER_KEY) ?: "adhan"
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
    }
}
