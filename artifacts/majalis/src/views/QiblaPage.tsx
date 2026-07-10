import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";

const MECCA_LAT = 21.4225;
const MECCA_LON = 39.8262;

function qiblaBearing(lat: number, lon: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const Δλ = ((MECCA_LON - lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function distanceKm(lat: number, lon: number): number {
  const R = 6371;
  const dφ = ((MECCA_LAT - lat) * Math.PI) / 180;
  const dλ = ((MECCA_LON - lon) * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── وصلة SVG ── */
function QiblaCompass({
  bearing,
  heading,
  aligned,
}: {
  bearing: number;
  heading: number | null;
  aligned: boolean;
}) {
  const headDeg  = heading ?? 0;
  const diskRot  = -headDeg;                 // دوران قرص الوصلة عكس اتجاه الجهاز
  const arrowRot = bearing - headDeg;        // السهم المطلق نسبةً للشاشة

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a  = (i * 5 * Math.PI) / 180;
    const major = i % 18 === 0;
    const med   = i % 6  === 0 && !major;
    const r1 = major ? 79 : med ? 83 : 85;
    const x1 = 100 + r1 * Math.sin(a);
    const y1 = 100 - r1 * Math.cos(a);
    const x2 = 100 + 88 * Math.sin(a);
    const y2 = 100 - 88 * Math.cos(a);
    return { x1, y1, x2, y2, major, med };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className="qibla-svg"
      aria-label={`وصلة القبلة، الزاوية ${Math.round(bearing)} درجة`}
    >
      {/* دائرة الخلفية */}
      <circle cx="100" cy="100" r="97" fill="var(--qibla-bg, #F0FDF4)" stroke="rgba(22,163,74,0.18)" strokeWidth="1.5" />

      {/* شعاع الاتجاه */}
      <line
        x1="100" y1="100"
        x2={100 + 86 * Math.sin((arrowRot * Math.PI) / 180)}
        y2={100 - 86 * Math.cos((arrowRot * Math.PI) / 180)}
        stroke="rgba(22,163,74,0.12)"
        strokeWidth="1"
      />

      {/* قرص الوصلة يدور مع الجهاز */}
      <g transform={`rotate(${diskRot} 100 100)`}>
        {/* علامات الدرجات */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.major ? "rgba(24,54,42,0.45)" : t.med ? "rgba(24,54,42,0.25)" : "rgba(24,54,42,0.12)"}
            strokeWidth={t.major ? "1.5" : "0.75"}
          />
        ))}
        {/* الجهات الأصلية */}
        <text x="100" y="11" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--majalis-danger, #9B1C1C)">ش</text>
        <text x="100" y="196" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(24,54,42,0.55)">ج</text>
        <text x="191" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(24,54,42,0.55)">ق</text>
        <text x="9"   y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(24,54,42,0.55)">غ</text>
      </g>

      {/* سهم القبلة الثابت المتجه نحو مكة */}
      <g transform={`rotate(${arrowRot} 100 100)`}>
        {/* جسم السهم */}
        <polygon
          points="100,18 96,78 100,88 104,78"
          fill={aligned ? "var(--majalis-emerald, #1F4D3A)" : "#22C55E"}
          opacity={aligned ? 1 : 0.9}
        />
        <polygon
          points="100,182 96,122 100,112 104,122"
          fill="var(--majalis-emerald-muted, rgba(14,110,82,0.18))"
        />
        {/* رأس السهم: القبلة */}
        <polygon points="100,6 93,20 107,20" fill="var(--majalis-emerald, #1F4D3A)" opacity="0.75" />
        {/* مركز الوصلة */}
        <circle cx="100" cy="100" r="7" fill={aligned ? "var(--majalis-emerald, #1F4D3A)" : "#22C55E"} />
        <circle cx="100" cy="100" r="3" fill="#fff" />
      </g>

      {/* توهج عند الاتجاه الصحيح */}
      {aligned && (
        <circle cx="100" cy="100" r="95" fill="none" stroke="#16A34A" strokeWidth="3" opacity="0.35">
          <animate attributeName="opacity" values="0.35;0.7;0.35" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export default function QiblaPage() {
  const [bearing,  setBearing]  = useState<number | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/qibla",
      title: "اتجاه القبلة | المجلس العلمي",
      description: "حدد اتجاه القبلة من موقعك الحالي بدقة، بوصلة رقمية تعتمد على GPS للمسلمين في كل مكان.",
      keywords: ["اتجاه القبلة", "قبلة", "بوصلة إسلامية", "اتجاه مكة", "صلاة"],
    });
  }, []);
  const [heading,  setHeading]  = useState<number | null>(null);
  const [dist,     setDist]     = useState<number | null>(null);
  const [error,    setError]    = useState("");
  const [permReq,  setPermReq]  = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setBearing(qiblaBearing(lat, lon));
        setDist(distanceKm(lat, lon));
      },
      () => setError("فعّل إذن الموقع لحساب اتجاه القبلة."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as DeviceOrientationEvent;
      if (ev.alpha != null) setHeading(360 - ev.alpha);
    };

    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      setPermReq(true);
    } else {
      window.addEventListener("deviceorientation", handler);
    }
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  async function requestOrient() {
    try {
      const fn = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
      if (fn) {
        const res = await fn();
        if (res === "granted") {
          setPermReq(false);
          window.addEventListener("deviceorientation", (e: Event) => {
            const ev = e as DeviceOrientationEvent;
            if (ev.alpha != null) setHeading(360 - ev.alpha);
          });
        }
      }
    } catch { /* ignore */ }
  }

  const delta = bearing != null && heading != null
    ? Math.abs(((bearing - heading + 540) % 360) - 180)
    : null;
  const aligned = delta != null && delta < 8;

  return (
    <div className="page-shell narrow qibla-page">
      <PageHeader
        eyebrow="الأدوات"
        title="اتجاه القبلة"
        subtitle="وجّه الجهاز حتى يشير السهم إلى الكعبة المشرفة."
      />

      <div className="qibla-wrap">
        {error ? (
          <p className="qibla-error">{error}</p>
        ) : bearing == null ? (
          <p className="qibla-loading">جارٍ تحديد موقعك…</p>
        ) : (
          <>
            <QiblaCompass bearing={bearing} heading={heading} aligned={aligned} />

            {aligned && (
              <div className="qibla-aligned-badge" role="status" aria-live="polite">
                ✓ أنت متجه نحو القبلة
              </div>
            )}

            <div className="qibla-info-row">
              <div className="qibla-info-card">
                <span className="qibla-info-label">الاتجاه من الشمال</span>
                <strong className="qibla-info-value">{Math.round(bearing)}°</strong>
              </div>
              {dist != null && (
                <div className="qibla-info-card">
                  <span className="qibla-info-label">المسافة إلى مكة</span>
                  <strong className="qibla-info-value">{Math.round(dist).toLocaleString("ar")} كم</strong>
                </div>
              )}
              {delta != null && (
                <div className="qibla-info-card">
                  <span className="qibla-info-label">الدقة</span>
                  <strong className={`qibla-info-value${aligned ? " qibla-aligned" : ""}`}>
                    {Math.max(0, 100 - Math.round(delta * 3))}%
                  </strong>
                </div>
              )}
            </div>

            {permReq && (
              <button type="button" className="qibla-permit-btn" onClick={requestOrient}>
                تفعيل مستشعر الاتجاه
              </button>
            )}

            {heading == null && !permReq && (
              <p className="qibla-hint">
                <Smartphone size={13} className="inline ml-1" />على الجوال: وجّه الهاتف في الاتجاه الذي يشير فيه السهم.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
