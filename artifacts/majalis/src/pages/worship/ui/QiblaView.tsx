import { useEffect, useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { useQiblaCompass } from "@/hooks/useQiblaCompass";
import {
  angularDistance,
  distanceToKaabaKm,
  qiblaBearing,
} from "@/lib/qibla-math";
import {
  formatCoordPair,
  QIBLA_CITIES,
  readSavedGeoLocation,
  writeSavedGeoLocation,
} from "@/lib/qibla-location";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/qibla.css";

function QiblaCompass({
  bearing,
  heading,
  aligned,
}: {
  bearing: number;
  heading: number | null;
  aligned: boolean;
}) {
  const headDeg = heading ?? 0;
  const diskRot = -headDeg;
  const arrowRot = bearing - headDeg;

  const ticks = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const a = (i * 5 * Math.PI) / 180;
        const major = i % 18 === 0;
        const med = i % 6 === 0 && !major;
        const r1 = major ? 79 : med ? 83 : 85;
        return {
          x1: 100 + r1 * Math.sin(a),
          y1: 100 - r1 * Math.cos(a),
          x2: 100 + 88 * Math.sin(a),
          y2: 100 - 88 * Math.cos(a),
          major,
          med,
        };
      }),
    [],
  );

  return (
    <div className={`qibla-dial${aligned ? " qibla-dial--aligned" : ""}`}>
      <svg
        viewBox="0 0 200 200"
        className="qibla-svg"
        aria-label={`وصلة القبلة، الزاوية ${Math.round(bearing)} درجة`}
      >
        <defs>
          <radialGradient id="qibla-face" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="var(--qibla-face-hi, #ECFDF5)" />
            <stop offset="100%" stopColor="var(--qibla-face-lo, #F0FDF4)" />
          </radialGradient>
          <filter id="qibla-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="97"
          fill="url(#qibla-face)"
          stroke={aligned ? "rgba(22,163,74,0.55)" : "rgba(22,163,74,0.18)"}
          strokeWidth={aligned ? 2.5 : 1.5}
        />

        <line
          x1="100"
          y1="100"
          x2={100 + 86 * Math.sin((arrowRot * Math.PI) / 180)}
          y2={100 - 86 * Math.cos((arrowRot * Math.PI) / 180)}
          stroke="rgba(22,163,74,0.12)"
          strokeWidth="1"
        />

        <g transform={`rotate(${diskRot} 100 100)`}>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={
                t.major
                  ? "rgba(24,54,42,0.45)"
                  : t.med
                    ? "rgba(24,54,42,0.25)"
                    : "rgba(24,54,42,0.12)"
              }
              strokeWidth={t.major ? "1.5" : "0.75"}
            />
          ))}
          <text x="100" y="11" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--majalis-danger, #9B1C1C)">
            ش
          </text>
          <text x="100" y="196" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(24,54,42,0.55)">
            ج
          </text>
          <text x="191" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(24,54,42,0.55)">
            ق
          </text>
          <text x="9" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(24,54,42,0.55)">
            غ
          </text>
        </g>

        <g transform={`rotate(${arrowRot} 100 100)`} filter={aligned ? "url(#qibla-glow)" : undefined}>
          <polygon
            points="100,18 96,78 100,88 104,78"
            fill={aligned ? "var(--majalis-emerald, var(--mj-brand-deep))" : "#22C55E"}
            opacity={aligned ? 1 : 0.9}
          />
          <polygon
            points="100,182 96,122 100,112 104,122"
            fill="var(--majalis-emerald-muted, rgba(23,61,53,0.18))"
          />
          <polygon points="100,6 93,20 107,20" fill="var(--majalis-emerald, var(--mj-brand-deep))" opacity="0.85" />
          <circle cx="100" cy="100" r="7" fill={aligned ? "var(--majalis-emerald, var(--mj-brand-deep))" : "#22C55E"} />
          <circle cx="100" cy="100" r="3" fill="#fff" />
        </g>

        {aligned && (
          <circle cx="100" cy="100" r="95" fill="none" stroke="#16A34A" strokeWidth="3" opacity="0.4">
            <animate attributeName="opacity" values="0.35;0.75;0.35" dur="1.4s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}

export default function QiblaPage() {
  const [initialGeo] = useState(() =>
    typeof window !== "undefined" ? readSavedGeoLocation() : null,
  );
  const [bearing, setBearing] = useState<number | null>(() =>
    initialGeo ? qiblaBearing(initialGeo.lat, initialGeo.lon) : null,
  );
  const [dist, setDist] = useState<number | null>(() =>
    initialGeo ? distanceToKaabaKm(initialGeo.lat, initialGeo.lon) : null,
  );
  const [coordsLabel, setCoordsLabel] = useState(() =>
    initialGeo ? formatCoordPair(initialGeo.lat, initialGeo.lon) : "",
  );
  const [placeLabel, setPlaceLabel] = useState(() => initialGeo?.label ?? "");
  const [error, setError] = useState("");
  const [manualMode, setManualMode] = useState<boolean>(
    () => !initialGeo && typeof navigator !== "undefined" && !navigator.geolocation,
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    initialGeo?.label && QIBLA_CITIES.some((c) => c.name === initialGeo.label)
      ? initialGeo.label
      : QIBLA_CITIES[0].name,
  );
  const [calibDismissed, setCalibDismissed] = useState(false);

  const {
    heading,
    accuracy,
    needsCalibration,
    permission,
    requestPermission,
    aligned,
  } = useQiblaCompass(bearing);

  useEffect(() => {
    applyPageSeo({
      path: "/qibla",
      title: "اتجاه القبلة | المجلس العلمي",
      description:
        "حدد اتجاه القبلة من موقعك الحالي بدقة، بوصلة رقمية تعتمد على GPS للمسلمين في كل مكان.",
      keywords: ["اتجاه القبلة", "قبلة", "بوصلة إسلامية", "اتجاه مكة", "صلاة"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "اتجاه القبلة",
          url: "https://majlisilm.com/qibla",
          about: { "@type": "Thing", name: "بوصلة القبلة للمسلمين" },
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      if (!initialGeo) {
        setError("المتصفح لا يدعم تحديد الموقع التلقائي.");
        setManualMode(true);
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setBearing(qiblaBearing(lat, lon));
        setDist(distanceToKaabaKm(lat, lon));
        setCoordsLabel(formatCoordPair(lat, lon));
        setPlaceLabel("موقعك الحالي");
        writeSavedGeoLocation({ lat, lon, label: "موقعك الحالي", source: "gps" });
        setError("");
        setManualMode(false);
      },
      () => {
        if (!initialGeo) {
          setError("لم يُمنح إذن تحديد الموقع. اختر مدينتك يدوياً:");
          setManualMode(true);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  }, []);

  function applyManualCity(cityName: string) {
    const city = QIBLA_CITIES.find((c) => c.name === cityName);
    if (!city) return;
    setBearing(qiblaBearing(city.lat, city.lon));
    setDist(distanceToKaabaKm(city.lat, city.lon));
    setCoordsLabel(formatCoordPair(city.lat, city.lon));
    setPlaceLabel(city.name);
    writeSavedGeoLocation({
      lat: city.lat,
      lon: city.lon,
      label: city.name,
      source: "city",
    });
    setError("");
  }

  const delta =
    bearing != null && heading != null ? angularDistance(bearing, heading) : null;

  const showCalib = needsCalibration && !calibDismissed;

  return (
    <div className="page-shell narrow qibla-page">
      <PageHeader
        eyebrow="الأدوات"
        title="اتجاه القبلة"
        subtitle="وجّه الجهاز حتى يشير السهم إلى الكعبة المشرفة."
      />

      <div className="qibla-wrap">
        {manualMode && (
          <div className="qibla-manual" role="region" aria-label="اختيار المدينة يدوياً">
            {error && <p className="qibla-error">{error}</p>}
            <label htmlFor="qibla-city-select" className="qibla-manual-label">
              اختر مدينتك:
            </label>
            <div className="qibla-manual-row">
              <select
                id="qibla-city-select"
                className="qibla-city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                dir="rtl"
              >
                {QIBLA_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="qibla-manual-btn"
                onClick={() => applyManualCity(selectedCity)}
              >
                احسب القبلة
              </button>
            </div>
          </div>
        )}

        {!manualMode && bearing == null && (
          <p className="qibla-loading">جارٍ تحديد موقعك…</p>
        )}

        {bearing != null && (
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
                <strong className="qibla-info-value">
                  {toArabicDigits(String(Math.round(bearing)))}°
                </strong>
              </div>
              {dist != null && (
                <div className="qibla-info-card">
                  <span className="qibla-info-label">المسافة إلى الكعبة</span>
                  <strong className="qibla-info-value">
                    {toArabicDigits(Math.round(dist).toLocaleString("en-US"))} كم
                  </strong>
                </div>
              )}
              {delta != null && (
                <div className="qibla-info-card">
                  <span className="qibla-info-label">الانحراف</span>
                  <strong className={`qibla-info-value${aligned ? " qibla-aligned" : ""}`}>
                    {toArabicDigits(delta.toFixed(1))}°
                  </strong>
                </div>
              )}
            </div>

            {(placeLabel || coordsLabel) && (
              <p className="qibla-geo-meta" dir="rtl">
                {placeLabel && <span className="qibla-geo-place">{placeLabel}</span>}
                {coordsLabel && <span className="qibla-geo-coords">{coordsLabel}</span>}
                {accuracy != null && (
                  <span className="qibla-geo-acc">
                    دقة البوصلة ≈ {toArabicDigits(String(Math.round(accuracy)))}°
                  </span>
                )}
              </p>
            )}

            {permission === "needed" && (
              <button type="button" className="qibla-permit-btn" onClick={() => void requestPermission()}>
                تفعيل مستشعر الاتجاه
              </button>
            )}

            {heading == null && permission !== "needed" && (
              <p className="qibla-hint">
                <Smartphone size={13} className="inline ms-1" />
                على الجوال: وجّه الهاتف في الاتجاه الذي يشير فيه السهم.
              </p>
            )}
          </>
        )}
      </div>

      {showCalib && (
        <div
          className="qibla-calib-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qibla-calib-title"
        >
          <div className="qibla-calib-modal">
            <p className="qibla-calib-figure" aria-hidden="true">
              ٨
            </p>
            <h2 id="qibla-calib-title" className="qibla-calib-title">
              معايرة البوصلة
            </h2>
            <p className="qibla-calib-body">
              دقة المستشعر منخفضة. حرّك الهاتف على شكل الرقم «٨» في الهواء عدة مرات بعيداً عن المعادن
              والمغناطيس، ثم أعد المحاولة.
            </p>
            <button
              type="button"
              className="qibla-permit-btn"
              onClick={() => setCalibDismissed(true)}
            >
              حسناً
            </button>
          </div>
        </div>
      )}

      <RelatedKnowledge kind="fatwa" query="القبلة والصلاة" title="معرفة ذات صلة بالقبلة" limit={6} />
      <div className="twh-share">
        <ShareButtons title="اتجاه القبلة — المجلس العلمي" url="https://majlisilm.com/qibla" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="fiqh" title="اختبر معلوماتك في أحكام القبلة والصلاة" count={4} />
      </div>
    </div>
  );
}
