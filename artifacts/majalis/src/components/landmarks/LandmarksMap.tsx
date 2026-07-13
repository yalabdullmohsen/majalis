import { useEffect, useRef } from "react";
import type { IslamicLandmark } from "@/lib/islamic-landmarks-data";

// Leaflet يُستورد ديناميكيًا لتجنب مشاكل SSR
let L: typeof import("leaflet") | null = null;

async function getLeaflet() {
  if (!L) {
    L = await import("leaflet");
    // إصلاح أيقونات Leaflet الافتراضية في Vite
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }
  return L;
}

interface Props {
  landmarks: IslamicLandmark[];
  onSelect: (lm: IslamicLandmark) => void;
}

export default function LandmarksMap({ landmarks, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  // تهيئة الخريطة مرة واحدة
  useEffect(() => {
    if (!containerRef.current) return;

    let map: import("leaflet").Map;

    getLeaflet().then((Leaflet) => {
      if (!containerRef.current || mapRef.current) return;

      map = Leaflet.map(containerRef.current, {
        center: [25, 40],
        zoom: 3,
        zoomControl: true,
        attributionControl: true,
      });

      Leaflet.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }
      ).addTo(map);

      const layer = Leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  // تحديث العلامات عند تغيُّر القائمة
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    getLeaflet().then((Leaflet) => {
      if (!layerRef.current) return;
      layerRef.current.clearLayers();

      landmarks.forEach((lm) => {
        const marker = Leaflet!.marker([lm.lat, lm.lng]);
        marker.bindPopup(
          `<div dir="rtl" style="font-family:inherit;min-width:180px;">
            <strong style="font-size:0.9rem;display:block;margin-bottom:4px;">${lm.name}</strong>
            <span style="font-size:0.78rem;color:#6b7280;">${lm.city}، ${lm.country}</span>
            <br/><span style="font-size:0.75rem;color:#0E6E52;font-weight:700;">${lm.type} · ${lm.era}</span>
          </div>`
        );
        marker.on("click", () => onSelect(lm));
        marker.addTo(layerRef.current!);
      });
    });
  }, [landmarks, onSelect]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
