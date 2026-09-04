package com.majlisilm.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String EXTRA_ADHAN_RESCHEDULE = "majlis_adhan_reschedule";

    private boolean pendingAdhanReschedule = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Android 12+ Splash Screen API — قبل super حتى لا يومض أبيض
        SplashScreen.installSplashScreen(this);
        registerPlugin(MajlisMediaPlaybackPlugin.class);
        registerPlugin(MajlisAdhanAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        if (getIntent() != null && getIntent().getBooleanExtra(EXTRA_ADHAN_RESCHEDULE, false)) {
            pendingAdhanReschedule = true;
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (!pendingAdhanReschedule || getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        pendingAdhanReschedule = false;
        getBridge().getWebView().evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('majalis:boot-adhan-reschedule'));",
            null
        );
    }
}
