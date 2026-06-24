import { C } from "@/lib/theme";

export function getSheikhPhoto(sheikh: any): string | undefined {
  return sheikh?.photo_url || sheikh?.image_url || sheikh?.avatar_url || sheikh?.profile_image_url;
}

export default function SheikhAvatar({ sheikh, size = 56 }: { sheikh: any; size?: number }) {
  const photo = getSheikhPhoto(sheikh);
  const name = sheikh?.name || "شيخ";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        background: C.sage,
        color: C.emeraldDeep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        fontFamily: "Amiri, serif",
        fontSize: Math.max(18, size * 0.42),
        fontWeight: 700,
        border: `2px solid ${C.panel}`,
        boxShadow: "0 8px 18px rgba(36,31,24,0.08)",
      }}
      aria-label={name}
    >
      {photo ? (
        <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        name.charAt(0) || "؟"
      )}
    </div>
  );
}
