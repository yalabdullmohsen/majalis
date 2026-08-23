import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { SourceItemCard } from "@/components/lessons/SourceItemCard";
import { feedForAccount, loadHarvestAccounts, loadHarvestFeed } from "@/lib/harvest-feed";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/sources-directory.css";

export default function SourceDetailPage() {
  const params = useParams<{ id: string }>();
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof loadHarvestAccounts>>>([]);
  const [feed, setFeed] = useState<Awaited<ReturnType<typeof loadHarvestFeed>>>([]);

  useEffect(() => {
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

  const account = useMemo(
    () => accounts.find((a) => a.id === params.id),
    [accounts, params.id],
  );

  const posts = useMemo(
    () => (account ? feedForAccount(feed, account.id) : []),
    [account, feed],
  );

  useEffect(() => {
    if (!account) return;
    applyPageSeo({
      path: `/sources/${account.id}`,
      title: `${account.name_ar} | دليل الجهات`,
      description: `منشورات ${account.name_ar} — روابط مباشرة للمصدر.`,
    });
  }, [account]);

  if (!account) {
    return (
      <div className="sources-detail" dir="rtl">
        <p>الجهة غير موجودة.</p>
        <Link href="/sources">العودة لدليل الجهات</Link>
      </div>
    );
  }

  return (
    <div className="sources-detail" dir="rtl">
      <nav className="sources-detail__crumb">
        <Link href="/sources">دليل الجهات</Link>
        <span aria-hidden> · </span>
        <span>{account.name_ar}</span>
      </nav>
      <header className="sources-detail__head">
        <h1>{account.name_ar}</h1>
        <p>
          {account.kind} · {account.platform}
          {account.site ? (
            <>
              {" · "}
              <a href={account.site} target="_blank" rel="noopener noreferrer">
                الموقع
              </a>
            </>
          ) : null}
          {" · "}
          <a href={account.url} target="_blank" rel="noopener noreferrer">
            الحساب
          </a>
        </p>
      </header>
      <div className="sources-detail__grid">
        {posts.map((card) => (
          <SourceItemCard key={card.id} card={card} />
        ))}
      </div>
      {posts.length === 0 ? <p className="sources-detail__empty">لا منشورات محصودة لهذه الجهة بعد.</p> : null}
    </div>
  );
}
