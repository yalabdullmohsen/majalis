import { arabicMatchAny } from "@/lib/arabic-search";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl, resolveLessonSheikhImage, parseLessonSchedule } from "@/lib/sheikh-image";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getSheikhs } from "@/lib/supabase";
import { DEMO_SHEIKHS, demoNoticeText } from "@/lib/demo-content";
import { PageHeader, Loading, Empty, DemoNotice } from "@/components/ui-common";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const loadSheikhs = async () => {
    setLoading(true);
    try {
      const { data, usingSeed } = await getSheikhs();
      setSheikhs(data);
      setUsingDemo(Boolean(usingSeed));
    } catch {
      setSheikhs(DEMO_SHEIKHS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheikhs();
  }, []);

  const source = sheikhs;

  const filtered = useMemo(() => {
    const s = search.trim();
    return source.filter((sh) => {
      if (verifiedOnly && !sh.is_verified) return false;
      if (!s) return true;
      return arabicMatchAny(
        [sh.name, sh.ijazah, sh.city, sh.bio, ...(sh.specialties || [])],
        s
      );
    });
  }, [source, search, verifiedOnly]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      <div className="page-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو التخصص أو المدينة..."
          className="page-search-input"
        />
        <button
          type="button"
          onClick={() => setVerifiedOnly((v) => !v)}
          className={verifiedOnly ? "page-toggle-btn active" : "page-toggle-btn"}
        >
          المعتمدون فقط
        </button>
      </div>

      {usingDemo && <DemoNotice text={demoNoticeText("المشايخ")} />}

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text={sheikhs.length === 0 ? "لا يوجد مشايخ بعد." : "لا توجد نتائج مطابقة."} />
      ) : (
        <div className="page-card-grid sheikhs-grid">
          {filtered.map((s: any) => (
            <Link key={s.id} href={usingDemo ? "/sheikhs" : `/sheikhs/${s.id}`} className="page-card sheikh-card">
              <div className="sheikh-card-top">
                <SheikhAvatar
                  src={resolveSheikhImageUrl(s)}
                  name={s.name}
                  size="responsive"
                />
                <div>
                  <p className="sheikh-name">{s.name}</p>
                  {s.is_verified && <span className="verified-badge">معتمد</span>}
                </div>
              </div>
              {s.ijazah && <p className="page-meta">{s.ijazah}</p>}
              <p className="page-meta">
                {[s.city, s.years_experience ? `${s.years_experience} سنة خبرة` : null].filter(Boolean).join(" · ")}
              </p>
              {s.specialties?.length > 0 && (
                <div className="page-chip-row compact">
                  {s.specialties.slice(0, 3).map((sp: string) => (
                    <span key={sp} className="page-soft-tag">{sp}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
