package com.majlisilm.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * خدمة أمامية لإبقاء تشغيل التلاوة حيّاً في الخلفية مع إشعار تحكم بسيط.
 * تُدار من MajlisMediaPlaybackPlugin (Capacitor). لا تُعيد استضافة ملفات صوت.
 */
class MediaPlaybackService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                val title = intent?.getStringExtra(EXTRA_TITLE) ?: "تلاوة القرآن"
                val artist = intent?.getStringExtra(EXTRA_ARTIST) ?: "المجلس العلمي"
                startForeground(NOTIFICATION_ID, buildNotification(title, artist))
            }
        }
        return START_STICKY
    }

    private fun buildNotification(title: String, artist: String): Notification {
        ensureChannel()
        val launch = packageManager.getLaunchIntentForPackage(packageName)
        val contentPi = PendingIntent.getActivity(
            this,
            0,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val stopIntent = Intent(this, MediaPlaybackService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPi = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(artist)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentPi)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(0, "إيقاف", stopPi)
            .build()
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val mgr = getSystemService(NotificationManager::class.java) ?: return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "تشغيل التلاوة",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "إشعار التلاوة أثناء التشغيل في الخلفية"
            setShowBadge(false)
        }
        mgr.createNotificationChannel(channel)
    }

    companion object {
        const val CHANNEL_ID = "majlis_quran_playback"
        const val NOTIFICATION_ID = 42017
        const val ACTION_STOP = "com.majlisilm.app.STOP_PLAYBACK_SERVICE"
        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
    }
}
