import { useEffect, useRef, useState } from "react";
import type { IslamicLandmark } from "@/lib/islamic-landmarks-data";

/** Leaflet يُحمَّل كسولًا لتجنب مشاكل SSR. */
let L: typeof import("leaflet") | null = null;

async function getLeaflet() {
  if (!L) {
    L = await import("leaflet");
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }
  return L;
}

type MapStatus = "loading" | "ready" | "empty" | "error";

interface Props {
  landmarks: IslamicLandmark[];
  onSelect: (lm: IslamicLandmark) => void;
}

/**
 * خريطة المشاهد — تهيئة واحدة، تحديث علامات فقط، invalidateSize بعد استقرار الأبعاد.
 * لا تطبّق RTL/transform على حاوية البلاط (يكسر نصف الخريطة).
 */
export default function LandmarksMap({ landmarks, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [status, setStatus] = useState<MapStatus>("loading");
  const mapReadyRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;
    let roTimer: ReturnType<typeof setTimeout> | null = null;

    const invalidate = () => {
      mapRef.current?.invalidateSize({ animate: false });
    };

    const onVis = () => {
      if (document.visibilityState === "visible") invalidate();
    };

    void getLeaflet()
      .then((Leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = Leaflet.map(containerRef.current, {
          center: [25, 40],
          zoom: 3,
          zoomControl: true,
          attributionControl: true,
        });

        Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
          className: "ilm-map-tiles",
        }).addTo(map);

        const layer = Leaflet.layerGroup().addTo(map);
        mapRef.current = map;
        layerRef.current = layer;
        mapReadyRef.current = true;
        setStatus("ready");

        requestAnimationFrame(() => {
          invalidate();
          window.setTimeout(invalidate, 80);
          window.setTimeout(invalidate, 320);
        });

        resizeObs = new ResizeObserver(() => {
          if (roTimer) clearTimeout(roTimer);
          roTimer = setTimeout(invalidate, 60);
        });
        resizeObs.observe(containerRef.current);

        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("orientationchange", invalidate);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (roTimer) clearTimeout(roTimer);
      resizeObs?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("orientationchange", invalidate);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        mapReadyRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current || !layerRef.current) return;

    void getLeaflet().then((Leaflet) => {
      if (!layerRef.current || !mapRef.current || !mapReadyRef.current) return;
      layerRef.current.clearLayers();

      if (!landmarks.length) {
        setStatus((s) => (s === "error" ? s : "empty"));
        return;
      }
      setStatus((s) => (s === "error" ? s : "ready"));

      const bounds: import("leaflet").LatLngExpression[] = [];
      for (const lm of landmarks) {
        if (!Number.isFinite(lm.lat) || !Number.isFinite(lm.lng)) continue;
        const marker = Leaflet.marker([lm.lat, lm.lng]);
        const safeName = String(lm.name).replace(/[<>&"]/g, "");
        const safeCity = String(lm.city).replace(/[<>&"]/g, "");
        const safeCountry = String(lm.country).replace(/[<>&"]/g, "");
        marker.bindPopup(
          `<div dir="rtl" style="font-family:inherit;min-width:160px;max-width:240px;">
            <strong style="font-size:0.9rem;display:block;margin-bottom:4px;">${safeName}</strong>
            <span style="font-size:0.78rem;color:#6b7280;">${safeCity}، ${safeCountry}</span>
          </div>`,
        );
        marker.on("click", () => onSelectRef.current(lm));
        marker.addTo(layerRef.current!);
        bounds.push([lm.lat, lm.lng]);
      }

      if (bounds.length === 1) {
        mapRef.current.setView(bounds[0] as [number, number], 10);
      } else if (bounds.length > 1) {
        mapRef.current.fitBounds(Leaflet.latLngBounds(bounds), {
          padding: [28, 28],
          maxZoom: 12,
        });
      }
      mapRef.current.invalidateSize({ animate: false });
    });
  }, [landmarks]);

  return (
    <div className="ilm-map-root" data-map-status={status}>
      <div
        ref={containerRef}
        className="ilm-map-canvas"
        dir="ltr"
        role="presentation"
        aria-label="خريطة المواقع الإسلامية"
      />
      {status === "loading" && (
        <p className="ilm-map-state" role="status">
          جاري تجهيز الخريطة…
        </p>
      )}
      {status === "empty" && (
        <p className="ilm-map-state" role="status">
          لا مواقع ضمن التصفية الحالية — اعرض القائمة أدناه.
        </p>
      )}
      {status === "error" && (
        <div className="ilm-map-state ilm-map-state--error" role="alert">
          <p>تعذّر تحميل بلاط الخريطة. يمكنك تصفّح المواقع من القائمة.</p>
          <button
            type="button"
            className="ilm-map-retry"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}
