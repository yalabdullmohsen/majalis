import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { feedForAccount, loadHarvestAccounts, loadHarvestFeed } from "@/lib/harvest-feed";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/sources-directory.css";

export default function SourcesDirectoryPage() {
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof loadHarvestAccounts>>>([]);
  const [feed, setFeed] = useState<Awaited<ReturnType<typeof loadHarvestFeed>>>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/sources",
      title: "دليل الجهات | سُنّة",
      description: "دليل الحسابات والجهات الدعوية والتعليمية في الكويت — روابط مباشرة للمصدر دون إعادة استضافة المحتوى.",
      keywords: ["دليل جهات", "دروس الكويت", "حلقات قرآن", "مصادر"],
    });
    Promise.all([loadHarvestAccounts(), loadHarvestFeed()])
      .then(([a, f]) => {
        setAccounts(a);
        setFeed(f);
      })
      .catch(() => {
        setAccounts([]);
        setFeed([]);
      });
  }, []);

  const enabled = useMemo(() => accounts.filter((a) => a.enabled), [accounts]);

  return (
    <SectionLobby
      lobbyId="hub"
      title="دليل الجهات"
      groups={[]}
      className="sources-directory-page"
    >
      <p className="sources-policy-note">
        المحتوى مملوك لأصحابه، وسُنّة يعرض روابطه فقط.
        {" "}
        <Link href="/data-licenses">التراخيص</Link>
        {" · "}
        <a href="https://github.com/yalabdullmohsen/majalis/blob/main/artifacts/majalis/docs/SOURCES_POLICY.md" target="_blank" rel="noopener noreferrer">
          سياسة المصادر
        </a>
      </p>
      <div className="sources-directory-grid">
        {enabled.map((acc) => {
          const count = feedForAccount(feed, acc.id).length;
          return (
            <Link key={acc.id} href={`/sources/${acc.id}`} className="sources-directory-card">
              <span className="sources-directory-card__kind">{acc.kind}</span>
              <h2 className="sources-directory-card__title">{acc.name_ar}</h2>
              <p className="sources-directory-card__meta">
                {acc.platform} · {acc.region_ar}
                {count > 0 ? ` · ${count} منشور` : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </SectionLobby>
  );
}
