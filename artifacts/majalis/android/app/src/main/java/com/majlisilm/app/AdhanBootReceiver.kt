package com.majlisilm.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * بعد إعادة تشغيل الجهاز — يفتح التطبيق بصمت لإعادة جدولة أذان أندroid (Exact Alarm).
 * مواقيت الصلاة تُحسب في JS؛ لا تُكرَّر هنا.
 */
class AdhanBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED &&
            intent?.action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            return
        }
        val launch = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(MainActivity.EXTRA_ADHAN_RESCHEDULE, true)
        }
        context.startActivity(launch)
    }
}
