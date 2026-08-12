import { useMemo, useState } from "react";
import {
  REVIEW_STATUS_LABELS,
  listSubmissions,
  adminSetSubmissionStatus,
  listImportLogs,
  runDailyImportDry,
  findDuplicateCandidates,
  listPublishedResearches,
  RESEARCH_IMPORT_SOURCES,
  computeResearchStats,
  type ReviewStatus,
} from "@/lib/researches";

export function ResearchesSection() {
  const [tab, setTab] = useState<"queue" | "published" | "import" | "dupes">("queue");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const submissions = useMemo(() => listSubmissions(), [tick]);
  const published = useMemo(() => listPublishedResearches(), [tick]);
  const logs = useMemo(() => listImportLogs(), [tick]);
  const stats = useMemo(() => computeResearchStats(published), [published]);
  const dupes = useMemo(() => findDuplicateCandidates(published, 50), [published]);

  return (
    <div className="admin-section" dir="rtl">
      <h2 style={{ marginTop: 0 }}>إدارة الأبحاث الشرعية</h2>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
        المراجعة من هنا واجهة تشغيل. صلاحيات الكتابة النهائية على الخادم عبر Service Role بعد تطبيق researches_v1.sql.
        المنشور: {stats.published} — طلبات: {submissions.length}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {([
          ["queue", "قائمة المراجعة"],
          ["published", "المنشور"],
          ["import", "الاستيراد اليومي"],
          ["dupes", "المكررات"],
        ] as const).map(([k, label]) => (
          <button key={k} type="button" className="sr-btn sr-btn--outline" onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <div>
          {submissions.length === 0 && <p>لا طلبات بعد.</p>}
          {submissions.map((s) => (
            <div key={s.id} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <strong>{s.title}</strong>
              <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                {s.authorName} — {REVIEW_STATUS_LABELS[s.status]}
                {s.isPersonal ? " — شخصي" : ""}
              </div>
              {s.statusNote && <p style={{ fontSize: "0.85rem" }}>{s.statusNote}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {(["needs_revision", "rejected", "accepted", "published", "rights_hold"] as ReviewStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      adminSetSubmissionStatus(s.id, st, "admin_reviewer", `تحديث إداري → ${REVIEW_STATUS_LABELS[st]}`);
                      refresh();
                    }}
                  >
                    {REVIEW_STATUS_LABELS[st]}
                  </button>
                ))}
              </div>
              <details style={{ marginTop: 8 }}>
                <summary>سجل المراجعة</summary>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(s.reviewLog, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {tab === "published" && (
        <ul>
          {published.map((r) => (
            <li key={r.id}>{r.title} {r.isDemo ? "(تجريبي)" : ""}</li>
          ))}
          {published.length === 0 && <li>لا منشورات إنتاجية بعد.</li>}
        </ul>
      )}

      {tab === "import" && (
        <div>
          <button
            type="button"
            onClick={() => {
              runDailyImportDry({ force: true });
              refresh();
            }}
          >
            تشغيل الاستيراد يدويًا (جاف / آمن)
          </button>
          <h3>المصادر</h3>
          <ul>
            {RESEARCH_IMPORT_SOURCES.map((s) => (
              <li key={s.id}>
                {s.name} — {s.active ? "نشط" : "متوقف"} — بيانات وصفية فقط
              </li>
            ))}
          </ul>
          <h3>سجل التشغيل</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(logs.slice(0, 5), null, 2)}</pre>
        </div>
      )}

      {tab === "dupes" && (
        <ul>
          {dupes.length === 0 && <li>لا مرشحي تكرار.</li>}
          {dupes.map((d) => (
            <li key={`${d.aId}-${d.bId}`}>
              {d.aId} ↔ {d.bId} ({d.score}) — {d.reasons.join("، ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
