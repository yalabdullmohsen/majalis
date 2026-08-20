/**
 * وجهة روابط البحث `/quiz?qa=<id>` — تعرض سؤالاً محدَّداً من بنك الأسئلة
 * التعليمي مباشرةً دون المرور بإعداد اللعبة، مع إبقاء اللعبة الوجهة الوحيدة
 * لهذا المحتوى (لا صفحة /qa مستقلة، حسب قرار qa-to-quiz.ts).
 */
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { loadSeedQa, type SeedQaItem } from "@/lib/qa-seed";
import { QA_DISCLAIMER } from "@/lib/theme";

type Status = "loading" | "found" | "not-found";

function stripAnswerPrefix(answer: string): string {
  return String(answer || "").replace(/^\s*الجواب\s*[:：]\s*/u, "").trim();
}

export function DirectQaCard({ qaId, onDismiss }: { qaId: string; onDismiss: () => void }) {
  const [status, setStatus] = useState<Status>("loading");
  const [item, setItem] = useState<SeedQaItem | null>(null);
  const [highlighted, setHighlighted] = useState(true);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setStatus("loading");
    loadSeedQa()
      .then((rows) => {
        if (cancelled.current) return;
        const found = rows.find((row) => row.id === qaId) ?? null;
        setItem(found);
        setStatus(found ? "found" : "not-found");
      })
      .catch(() => {
        if (!cancelled.current) setStatus("not-found");
      });
    return () => {
      cancelled.current = true;
    };
  }, [qaId]);

  useEffect(() => {
    if (status !== "found") return;
    setHighlighted(true);
    const t = setTimeout(() => setHighlighted(false), 1800);
    return () => clearTimeout(t);
  }, [status, qaId]);

  if (status === "loading") {
    return (
      <div className="qzg-direct-qa qzg-direct-qa--loading" role="status" aria-live="polite">
        جارٍ فتح السؤال…
      </div>
    );
  }

  if (status === "not-found" || !item) {
    return (
      <div className="qzg-direct-qa qzg-direct-qa--missing">
        <p>تعذّر العثور على هذا السؤال، فقد يكون قد أُزيل أو تغيّر رابطه.</p>
        <button type="button" className="qzg-direct-qa__cta" onClick={onDismiss}>
          الذهاب إلى لعبة سين جيم
        </button>
      </div>
    );
  }

  const category = item.qa_categories?.name || "سين جيم";
  const answer = stripAnswerPrefix(item.answer);

  return (
    <div className={`qzg-direct-qa${highlighted ? " qzg-direct-qa--flash" : ""}`}>
      <span className="qzg-direct-qa__badge">
        <Search size={14} aria-hidden="true" /> {category}
      </span>
      <h1 className="qzg-direct-qa__q">{item.question}</h1>
      <p className="qzg-direct-qa__a">{answer}</p>
      <p className="qzg-direct-qa__disclaimer">{QA_DISCLAIMER}</p>
      <button type="button" className="qzg-direct-qa__cta" onClick={onDismiss}>
        الذهاب إلى لعبة سين جيم
      </button>
    </div>
  );
}
