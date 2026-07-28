import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyHintState,
  isVoiceVerificationAvailable,
  VoiceRecitationVerifier,
  type RecitationHintState,
  type VoiceVerifyStats,
  getVoiceVerifyStats,
} from "@/lib/voice-recitation-verify";

/** Voice recitation verification — logic only; never stops ayah audio. */
export function useVoiceRecitationVerify(targetText: string) {
  const verifierRef = useRef<VoiceRecitationVerifier | null>(null);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<RecitationHintState>(emptyHintState);
  const [transcript, setTranscript] = useState("");
  const [stats, setStats] = useState<VoiceVerifyStats>(() => getVoiceVerifyStats());
  const available = isVoiceVerificationAvailable();

  useEffect(() => {
    verifierRef.current?.setTargetText(targetText);
  }, [targetText]);

  useEffect(() => {
    return () => {
      verifierRef.current?.stop();
      verifierRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!verifierRef.current) verifierRef.current = new VoiceRecitationVerifier();
    const ok = verifierRef.current.start(
      { targetText },
      {
        onHint: setHint,
        onTranscript: (t) => setTranscript(t),
        onEnd: () => {
          setListening(false);
          setStats(getVoiceVerifyStats());
        },
        onError: () => setListening(false),
      },
    );
    setListening(ok);
    return ok;
  }, [targetText]);

  const stop = useCallback(() => {
    verifierRef.current?.stop();
    setListening(false);
    setStats(getVoiceVerifyStats());
  }, []);

  return { available, listening, hint, transcript, stats, start, stop };
}
