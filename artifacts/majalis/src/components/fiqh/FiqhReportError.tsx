import { useMemo, useState } from "react";

const REPORT_KINDS = [
  { id: "lang", label: "خطأ لغوي" },
  { id: "source", label: "خطأ في المصدر" },
  { id: "ruling", label: "خطأ في الحكم" },
  { id: "link", label: "رابط لا يعمل" },
  { id: "other", label: "ملاحظة أخرى" },
] as const;

type Props = {
  lessonTitle: string;
  lessonHref: string;
  bookTitle: string;
};

/**
 * إبلاغ بسيط في آخر درس الفقه — mailto يعمل بلا تسجيل.
 */
export function FiqhReportError({ lessonTitle, lessonHref, bookTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof REPORT_KINDS)[number]["id"]>("lang");
  const [note, setNote] = useState("");

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(`إبلاغ فقه: ${lessonTitle}`);
    const body = encodeURIComponent(
      [
        `النوع: ${REPORT_KINDS.find((k) => k.id === kind)?.label ?? kind}`,
        `الكتاب: ${bookTitle}`,
        `المسألة: ${lessonTitle}`,
        `الرابط: https://www.ssunnah.com${lessonHref}`,
        "",
        "التفاصيل:",
        note.trim() || "(بدون تفاصيل إضافية)",
      ].join("\n"),
    );
    return `mailto:info@ssunnah.com?subject=${subject}&body=${body}`;
  }, [bookTitle, kind, lessonHref, lessonTitle, note]);

  return (
    <div className="fiqh-report">
      <button
        type="button"
        className="fiqh-report__toggle mj-pressable"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        إبلاغ عن خطأ
      </button>
      {open ? (
        <div className="fiqh-report__panel">
          <p className="fiqh-report__hint">اختر نوع البلاغ، ثم أرسل عبر بريدك.</p>
          <div className="fiqh-report__kinds" role="group" aria-label="نوع البلاغ">
            {REPORT_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                className={`fiqh-report__chip${kind === k.id ? " is-active" : ""}`}
                onClick={() => setKind(k.id)}
              >
                {k.label}
              </button>
            ))}
          </div>
          <label className="fiqh-report__note">
            <span className="sr-only">تفاصيل إضافية</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="تفاصيل إضافية (اختياري)"
            />
          </label>
          <a className="fiqh-report__send mj-pressable" href={mailto}>
            إرسال البلاغ
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default FiqhReportError;
