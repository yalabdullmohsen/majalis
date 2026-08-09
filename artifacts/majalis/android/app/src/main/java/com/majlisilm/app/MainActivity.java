package com.majlisilm.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MajlisSpeechRecognitionPlugin.class);
        registerPlugin(MajlisMediaPlaybackPlugin.class);
        registerPlugin(MajlisAdhanAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
