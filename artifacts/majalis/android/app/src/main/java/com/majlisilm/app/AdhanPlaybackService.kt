package com.majlisilm.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * خدمة أمامية لتشغيل ملف الأذان كاملًا بلا حد زمني للإشعار.
 * تُشغَّل من AdhanAlarmReceiver أو MajlisAdhanAlarmPlugin.
 */
class AdhanPlaybackService : Service() {
    private var player: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopPlayback()
                return START_NOT_STICKY
            }
            else -> {
                val title = intent?.getStringExtra(EXTRA_TITLE) ?: "الأذان"
                val prayerKey = intent?.getStringExtra(EXTRA_PRAYER_KEY) ?: "adhan"
                val url = intent?.getStringExtra(EXTRA_URL)
                if (url.isNullOrBlank()) {
                    stopSelf()
                    return START_NOT_STICKY
                }
                startForeground(NOTIFICATION_ID, buildNotification(title, prayerKey))
                acquireWakeLock()
                startPlayer(url)
            }
        }
        return START_STICKY
    }

    private fun startPlayer(url: String) {
        try {
            player?.release()
            player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build(),
                )
                setDataSource(url)
                setOnPreparedListener { it.start() }
                setOnCompletionListener { stopPlayback() }
                setOnErrorListener { _, _, _ ->
                    stopPlayback()
                    true
                }
                prepareAsync()
            }
        } catch (_: Exception) {
            stopPlayback()
        }
    }

    private fun stopPlayback() {
        try {
            player?.stop()
        } catch (_: Exception) {
            /* ignore */
        }
        player?.release()
        player = null
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "majlisilm:adhan").apply {
            setReferenceCounted(false)
            acquire(10 * 60 * 1000L)
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (_: Exception) {
            /* ignore */
        }
        wakeLock = null
    }

    private fun buildNotification(title: String, prayerKey: String): Notification {
        ensureChannel(prayerKey)
        val launch = packageManager.getLaunchIntentForPackage(packageName)
        val contentPi = PendingIntent.getActivity(
            this,
            0,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val stopIntent = Intent(this, AdhanPlaybackService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPi = PendingIntent.getService(
            this,
            2,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, channelIdFor(prayerKey))
            .setContentTitle(title)
            .setContentText("جارٍ تشغيل الأذان — اضغط لإيقاف")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentPi)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(0, "إيقاف", stopPi)
            .build()
    }

    private fun ensureChannel(prayerKey: String) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val mgr = getSystemService(NotificationManager::class.java) ?: return
        val id = channelIdFor(prayerKey)
        val channel = NotificationChannel(
            id,
            "أذان ${prayerLabel(prayerKey)}",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "تشغيل الأذان الكامل لصلاة ${prayerLabel(prayerKey)}"
            setSound(null, null)
            enableVibration(true)
        }
        mgr.createNotificationChannel(channel)
    }

    override fun onDestroy() {
        stopPlayback()
        super.onDestroy()
    }

    companion object {
        const val NOTIFICATION_ID = 42027
        const val ACTION_STOP = "com.majlisilm.app.STOP_ADHAN_PLAYBACK"
        const val ACTION_PLAY = "com.majlisilm.app.PLAY_ADHAN"
        const val EXTRA_TITLE = "title"
        const val EXTRA_URL = "url"
        const val EXTRA_PRAYER_KEY = "prayerKey"

        fun channelIdFor(prayerKey: String): String = "majlis_adhan_$prayerKey"

        fun prayerLabel(prayerKey: String): String = when (prayerKey) {
            "fajr" -> "الفجر"
            "dhuhr" -> "الظهر"
            "asr" -> "العصر"
            "maghrib" -> "المغرب"
            "isha" -> "العشاء"
            else -> "الصلاة"
        }
    }
}
