import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  estimateOfflineFootprintHint,
  listOfflinePackStatus,
  type OfflinePackStatus,
} from "@/lib/knowledge-platform";
import "@/styles/pages/knowledge-platform-p0.css";

export default function OfflineCenterView() {
  const [packs, setPacks] = useState<OfflinePackStatus[]>([]);
  const [hint, setHint] = useState("…");
  const [online, setOnline] = useState(true);
  const [engineOk, setEngineOk] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/offline",
      title: "مركز دون اتصال | سُنّة",
      description: "عرض الحزم المحلية المتاحة للعمل دون شبكة، دون تنزيل تلقائي.",
    });
    void (async () => {
      const status = await listOfflinePackStatus();
      setPacks(status.packs);
      setOnline(status.online);
      setEngineOk(status.engineAvailable);
      setHint(await estimateOfflineFootprintHint());
    })();
  }, []);

  return (
    <main className="kp-page" dir="rtl">
      <header className="kp-page__header">
        <h1 className="kp-page__title">مركز دون اتصال</h1>
        <p className="kp-page__lead">
          جرد للحزم المحلية. لا تنزيل تلقائي من هذه الصفحة — استخدم إعدادات المصحف أو المخزن للتنزيل.
        </p>
        <p className="kp-meta">
          الشبكة: {online ? "متصلة" : "غير متصلة"} · المحرك: {engineOk ? "متاح" : "غير متاح"}
        </p>
        <p className="kp-note">{hint}</p>
      </header>

      <section className="kp-section" aria-labelledby="kp-packs">
        <h2 id="kp-packs" className="kp-section__title">المخازن المحلية</h2>
        <ul className="kp-list kp-list--packs">
          {packs.map((p) => (
            <li key={p.store}>
              <strong>{p.label}</strong>
              <span className="kp-meta">{p.available ? `${p.recordCount} سجل` : "فارغ"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kp-section">
        <h2 className="kp-section__title">اختصارات</h2>
        <ul className="kp-list">
          <li>
            <Link href="/mushaf">المصحف</Link>
          </li>
          <li>
            <Link href="/quran/offline-player">مشغّل القرآن دون اتصال</Link>
          </li>
          <li>
            <Link href="/vault">المخزن</Link>
          </li>
          <li>
            <Link href="/settings">الإعدادات</Link>
          </li>
          <li>
            <Link href="/progress">مركز التقدّم</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
