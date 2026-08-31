import { useEffect, useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, FolderOpen, GraduationCap, Loader2, ScrollText, Upload, XCircle } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { submitLesson } from "@/lib/user-submissions-service";
import "@/styles/pages/upload.css";

type UploadState = "idle" | "uploading" | "success" | "error";

const LESSON_TOPICS = ["فقه", "عقيدة", "تفسير", "حديث", "سيرة", "أخلاق", "تزكية", "أخرى"];

const MAX_VIDEO_MB = 200;

function FileDropZone({ accept, maxMb, onFile, file, hint }: {
  accept: string;
  maxMb: number;
  onFile: (f: File | null) => void;
  file: File | null;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState("");

  function validate(f: File): boolean {
    if (f.size > maxMb * 1024 * 1024) {
      setErr(`الحجم الأقصى ${maxMb} ميغابايت`);
      return false;
    }
    setErr("");
    return true;
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && validate(f)) onFile(f);
    else onFile(null);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && validate(f)) onFile(f);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="اختر ملفًا للرفع أو اسحبه هنا"
        className={`ulp-dropzone${dragging ? " is-dragging" : file ? " has-file" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          aria-label="رفع ملف"
          onChange={handleChange}
          className="ulp-hidden"
        />
        {file ? (
          <div>
            <div className="ulp-dropzone__success-icon"><CheckCircle2 size={36} strokeWidth={1.3} className="icon-emerald" /></div>
            <div className="ulp-dropzone__filename">{file.name}</div>
            <div className="ulp-dropzone__filesize">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="ulp-dropzone__remove"
            >
              إزالة الملف
            </button>
          </div>
        ) : (
          <div>
            <div className="ulp-dropzone__empty-icon"><FolderOpen size={36} strokeWidth={1.3} /></div>
            <div className="ulp-dropzone__empty-text">اسحب وأفلت أو اضغط للاختيار</div>
            <div className="ulp-dropzone__hint">{hint} · الحجم الأقصى {maxMb} MB</div>
          </div>
        )}
      </div>
      {err && <div className="ulp-dropzone__error">{err}</div>}
    </div>
  );
}

function LessonForm() {
  const [file, setFile]           = useState<File | null>(null);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [sheikh, setSheikh]       = useState("");
  const [duration, setDuration]   = useState("");
  const [topic, setTopic]         = useState(LESSON_TOPICS[0]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadState, setUpload]  = useState<UploadState>("idle");
  const [message, setMessage]     = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setUpload("uploading");
    setMessage("");

    const res = await submitLesson({
      file: file ?? undefined,
      title,
      description:    desc,
      submitterName:  name,
      submitterEmail: email || undefined,
      meta: {
        sheikh,
        duration_min: duration ? Number(duration) : undefined,
        topic,
        source_url: sourceUrl || undefined,
      },
    });

    if (res.ok) {
      setUpload("success");
      setMessage("تم إرسال الدرس بنجاح! سيراجعه الفريق قريباً.");
      setFile(null); setName(""); setEmail(""); setTitle(""); setDesc("");
      setSheikh(""); setDuration(""); setSourceUrl("");
    } else {
      setUpload("error");
      setMessage(res.error ?? "حدث خطأ، حاول مرة أخرى.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ulp-form">
      <div className="ulp-banner">
        <span className="ulp-banner__icon" aria-hidden="true"><ScrollText size={22} strokeWidth={1.5} /></span>
        <span className="ulp-banner__text">
          أضف درساً علمياً موثّقاً · يمكن رفع ملف صوت/فيديو أو إرسال معلومات الدرس فقط.
        </span>
      </div>

      <Field label="ملف الدرس (اختياري، صوت أو فيديو)">
        <FileDropZone accept="audio/*,video/*" maxMb={MAX_VIDEO_MB} onFile={setFile} file={file} hint="MP3, MP4, M4A, WebM" />
      </Field>

      <div className="ulp-row2">
        <Field label="اسمك *">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="ulp-inp" aria-label="الاسم الكامل" placeholder="الاسم الكامل" />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ulp-inp" aria-label="للتواصل" placeholder="للتواصل" />
        </Field>
      </div>

      <Field label="عنوان الدرس *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="ulp-inp" aria-label="مثال: شرح حديث إنما الأعمال بالنيات" placeholder="مثال: شرح حديث إنما الأعمال بالنيات" />
      </Field>

      <div className="ulp-row2">
        <Field label="اسم الشيخ / المحاضر *">
          <input value={sheikh} onChange={(e) => setSheikh(e.target.value)} required className="ulp-inp" aria-label="مثال: الشيخ محمد العثيمين" placeholder="مثال: الشيخ محمد العثيمين" />
        </Field>
        <Field label="المدة (بالدقائق)">
          <input type="number" min="1" max="600" value={duration} onChange={(e) => setDuration(e.target.value)} className="ulp-inp" aria-label="مثال: 45" placeholder="مثال: 45" />
        </Field>
      </div>

      <div className="ulp-row2">
        <Field label="الموضوع *">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="ulp-inp">
            {LESSON_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="رابط المصدر (اختياري)">
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="ulp-inp" aria-label="https://" placeholder="https://..." />
        </Field>
      </div>

      <Field label="وصف الدرس *">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} className="ulp-inp ulp-inp--textarea" aria-label="اكتب ملخصاً للدرس ومحتواه" placeholder="اكتب ملخصاً للدرس ومحتواه..." />
      </Field>

      <Feedback state={uploadState} message={message} />
      <SubmitBtn loading={uploadState === "uploading"} label="إرسال الدرس للمراجعة" />
    </form>
  );
}

export default function UploadPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/upload",
      title: "رفع درس علمي | سُنّة",
      description: "أرسل درساً علمياً موثّقاً لسُنّة للمراجعة قبل النشر.",
      keywords: ["تسجيل درس", "رفع ملف صوتي", "مشاركة علمية", "سُنّة"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "رفع درس علمي",
        description: "أرسل درساً علمياً لسُنّة.",
        url: "https://www.ssunnah.com/upload",
        publisher: { "@type": "Organization", name: "سُنّة", url: "https://www.ssunnah.com" },
      }],
    });
  }, []);

  return (
    <div className="ulp-page">
      <div className="ulp-header">
        <p className="ulp-eyebrow">المشاركة</p>
        <h1 className="ulp-title"><Upload size={22} strokeWidth={1.5} aria-hidden="true" /> رفع درس علمي</h1>
        <p className="ulp-subtitle">شارك درساً علمياً موثّقاً · يُراجَع من فريق سُنّة قبل النشر.</p>
      </div>

      <div className="ulp-notice">
        <span className="ulp-notice__icon"><AlertTriangle size={14} /></span>
        <div className="ulp-notice__text">
          <strong>تنبيه:</strong> يُشترط أن يكون المحتوى موثوقاً من علماء معتمدين.
          لا يُقبل المحتوى المجهول المصدر أو المخالف لأهل السنة والجماعة.
          الفريق يراجع كل الطلبات ويحتفظ بحق القبول أو الرفض.
          رفع تسجيلات الأذان أُلغي نهائيًا.
        </div>
      </div>

      <div className="ulp-tabs" aria-hidden="true">
        <div className="ulp-tab is-active">
          <span aria-hidden="true"><GraduationCap size={16} strokeWidth={1.8} /></span>
          <span>رفع درس</span>
        </div>
      </div>

      <div className="ulp-form-card">
        <LessonForm />
      </div>

      <div className="ulp-steps">
        {[
          { num: "١", text: "ترسل الملف والمعلومات" },
          { num: "٢", text: "يراجع الفريق المحتوى خلال 2–5 أيام" },
          { num: "٣", text: "عند القبول يُضاف للدروس ويُنسب لك" },
        ].map((s) => (
          <div key={s.num} className="ulp-step">
            <span>{s.num}</span>
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="ulp-field-label">
      {label}
      {children}
    </label>
  );
}

function Feedback({ state, message }: { state: UploadState; message: string }) {
  if (!message) return null;
  const ok = state === "success";
  const bad = state === "error";
  return (
    <div className={`ulp-feedback${ok ? " is-success" : bad ? " is-error" : ""}`} role="status">
      {ok ? <CheckCircle2 size={16} /> : bad ? <XCircle size={16} /> : null}
      <span>{message}</span>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" className="ulp-submit" disabled={loading}>
      {loading ? <><Loader2 size={16} className="animate-spin" /> جارٍ الإرسال...</> : label}
    </button>
  );
}
