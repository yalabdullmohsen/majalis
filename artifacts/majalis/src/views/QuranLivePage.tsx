import { Link } from "wouter";

export default function QuranLivePage() {
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "2rem auto",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        direction: "rtl",
        fontFamily: "inherit",
      }}
    >
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "#6b7280", fontSize: "0.85rem", textDecoration: "none" }}>
          ← الرئيسية
        </Link>
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0D1B2A" }}>
        بث القرآن الكريم
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "2rem" }}>
        استمع إلى إذاعات القرآن الكريم المباشرة.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        {QURAN_STATIONS.map((station) => (
          <div
            key={station.name}
            style={{
              padding: "1rem 1.25rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              background: "#fafaf9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0D1B2A", marginBottom: "0.2rem" }}>
                {station.name}
              </h2>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>{station.country}</p>
            </div>
            <a
              href={station.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "0.45rem 1.1rem",
                background: "#C9A84C",
                color: "#fff",
                borderRadius: "0.375rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              ▶ استمع
            </a>
          </div>
        ))}
      </div>

      <p style={{ marginTop: "2rem", color: "#9ca3af", fontSize: "0.8rem", textAlign: "center" }}>
        الروابط تفتح في المشغّل الخارجي — تأكد من تشغيل الصوت
      </p>
    </div>
  );
}

const QURAN_STATIONS = [
  { name: "إذاعة القرآن الكريم من مكة المكرمة", country: "المملكة العربية السعودية", url: "https://Qurango.net/radio/tarateel" },
  { name: "إذاعة القرآن الكريم من المدينة المنورة", country: "المملكة العربية السعودية", url: "https://Qurango.net/radio/quranfm" },
  { name: "إذاعة القرآن الكريم الكويتية", country: "الكويت", url: "https://Qurango.net/radio/kuwait" },
  { name: "إذاعة القرآن الكريم المصرية", country: "مصر", url: "https://Qurango.net/radio/egypt" },
];
