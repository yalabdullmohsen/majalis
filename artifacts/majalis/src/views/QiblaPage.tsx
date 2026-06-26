import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-common";

const MECCA_LAT = 21.4225;
const MECCA_LON = 39.8262;

function qiblaBearing(lat: number, lon: number) {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const Δλ = ((MECCA_LON - lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export default function QiblaPage() {
  const [bearing, setBearing] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setBearing(qiblaBearing(pos.coords.latitude, pos.coords.longitude)),
      () => setError("فعّل الموقع لحساب اتجاه القبلة."),
    );
  }, []);

  useEffect(() => {
    const onOrient = (e: Event) => {
      const ev = e as DeviceOrientationEvent;
      if (ev.alpha != null) setHeading(360 - ev.alpha);
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);

  const delta =
    bearing != null && heading != null ? Math.abs(((bearing - heading + 540) % 360) - 180) : null;

  return (
    <div className="page-shell narrow">
      <PageHeader
        eyebrow="الأدوات"
        title="القبلة"
        subtitle="اتجاه الكعبة المشرفة بحسب موقعك."
      />

      <div className="qibla-panel ui-card">
        {error && <p className="lessons-empty-state">{error}</p>}
        {!error && bearing == null && <p>جاري تحديد الموقع...</p>}

        {bearing != null && (
          <>
            <div
              className="qibla-compass"
              style={{ transform: `rotate(${heading ?? 0}deg)` }}
              aria-hidden="true"
            >
              <div className="qibla-compass__needle" style={{ transform: `rotate(${bearing}deg)` }} />
            </div>
            <p className="qibla-meta">زاوية القبلة: {Math.round(bearing)}°</p>
            {delta != null && (
              <p className="qibla-meta">الدقة التقريبية: {Math.max(0, 100 - Math.round(delta * 2))}%</p>
            )}
            <p className="qibla-help">
              وجّه الهاتف نحو السهم الأخضر. على الحاسوب استخدم الزاوية كمرجع تقريبي.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
