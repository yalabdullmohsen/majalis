package com.majlisilm.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Android 12+ Splash Screen API — قبل super حتى لا يومض أبيض
        SplashScreen.installSplashScreen(this);
        registerPlugin(MajlisSpeechRecognitionPlugin.class);
        registerPlugin(MajlisMediaPlaybackPlugin.class);
        registerPlugin(MajlisAdhanAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
