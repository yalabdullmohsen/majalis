import { useEffect, useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { applyPageSeo } from "@/lib/seo";
import { submitAdhan, submitLesson } from "@/lib/user-submissions-service";

type Tab = "adhan" | "lesson";
type UploadState = "idle" | "uploading" | "success" | "error";

const ADHAN_STYLES = ["خاشع", "رسمي", "تقليدي", "كلاسيكي"];
const ADHAN_PRAYER_TYPES = [
  { value: "general", label: "أذان عام (لجميع الصلوات)" },
  { value: "fajr",    label: "أذان الفجر فقط" },
  { value: "both",    label: "كلاهما (عام + فجر)" },
];
const LESSON_TOPICS = ["فقه", "عقيدة", "تفسير", "حديث", "سيرة", "أخلاق", "تزكية", "أخرى"];

const MAX_AUDIO_MB = 30;
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
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`ulp-dropzone${dragging ? " is-dragging" : file ? " has-file" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="ulp-hidden"
        />
        {file ? (
          <div>
            <div className="ulp-dropzone__success-icon">✅</div>
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
            <div className="ulp-dropzone__empty-icon">📁</div>
            <div className="ulp-dropzone__empty-text">اسحب وأفلت أو اضغط للاختيار</div>
            <div className="ulp-dropzone__hint">{hint} · الحجم الأقصى {maxMb} MB</div>
          </div>
        )}
      </div>
      {err && <div className="ulp-dropzone__error">{err}</div>}
    </div>
  );
}

function AdhanForm() {
  const [file, setFile]             = useState<File | null>(null);
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [style, setStyle]           = useState(ADHAN_STYLES[0]);
  const [country, setCountry]       = useState("");
  const [origin, setOrigin]         = useState("");
  const [prayerType, setPrayerType] = useState<"general" | "fajr" | "both">("general");
  const [uploadState, setUpload]    = useState<UploadState>("idle");
  const [message, setMessage]       = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) { setMessage("الرجاء اختيار ملف صوتي."); return; }
    setUpload("uploading");
    setMessage("");

    const res = await submitAdhan({
      file,
      title:          title || `أذان ${name}`,
      description:    desc,
      submitterName:  name,
      submitterEmail: email || undefined,
      meta:           { muezzin_style: style, country, origin, prayer_type: prayerType },
    });

    if (res.ok) {
      setUpload("success");
      setMessage("تم إرسال الأذان بنجاح! سيراجعه الفريق قريباً.");
      setFile(null); setName(""); setEmail(""); setTitle(""); setDesc("");
      setCountry(""); setOrigin("");
    } else {
      setUpload("error");
      setMessage(res.error ?? "حدث خطأ، حاول مرة أخرى.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ulp-form">
      <div className="ulp-banner">
        <span className="ulp-banner__icon">🎙️</span>
        <span className="ulp-banner__text">
          ارفع تسجيلاً صوتياً للأذان · يُراجَع من قِبل الفريق قبل نشره في المكتبة.
        </span>
      </div>

      <Field label="ملف الأذان (MP3 / AAC / WAV) *">
        <FileDropZone accept="audio/*" maxMb={MAX_AUDIO_MB} onFile={setFile} file={file} hint="MP3, AAC, WAV, OGG" />
      </Field>

      <div className="ulp-row2">
        <Field label="اسمك / اسم المؤذن *">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="ulp-inp" placeholder="مثال: أحمد الكويتي" />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ulp-inp" placeholder="للتواصل عند القبول" />
        </Field>
      </div>

      <Field label="عنوان الأذان *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="ulp-inp" placeholder="مثال: أذان فجر خاشع" />
      </Field>

      <div className="ulp-row2">
        <Field label="الدولة *">
          <input value={country} onChange={(e) => setCountry(e.target.value)} required className="ulp-inp" placeholder="مثال: الكويت" />
        </Field>
        <Field label="المدينة">
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="ulp-inp" placeholder="مثال: الكويت العاصمة" />
        </Field>
      </div>

      <div className="ulp-row2">
        <Field label="أسلوب الأذان *">
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="ulp-inp">
            {ADHAN_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="نوع الأذان *">
          <select value={prayerType} onChange={(e) => setPrayerType(e.target.value as typeof prayerType)} className="ulp-inp">
            {ADHAN_PRAYER_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="وصف إضافي (اختياري)">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="ulp-inp ulp-inp--textarea" placeholder="معلومات إضافية عن التسجيل..." />
      </Field>

      <Feedback state={uploadState} message={message} />
      <SubmitBtn loading={uploadState === "uploading"} label="📤 إرسال الأذان للمراجعة" />
    </form>
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
        <span className="ulp-banner__icon">📚</span>
        <span className="ulp-banner__text">
          أضف درساً علمياً موثّقاً · يمكن رفع ملف صوت/فيديو أو إرسال معلومات الدرس فقط.
        </span>
      </div>

      <Field label="ملف الدرس (اختياري — صوت أو فيديو)">
        <FileDropZone accept="audio/*,video/*" maxMb={MAX_VIDEO_MB} onFile={setFile} file={file} hint="MP3, MP4, M4A, WebM" />
      </Field>

      <div className="ulp-row2">
        <Field label="اسمك *">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="ulp-inp" placeholder="الاسم الكامل" />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ulp-inp" placeholder="للتواصل" />
        </Field>
      </div>

      <Field label="عنوان الدرس *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="ulp-inp" placeholder="مثال: شرح حديث إنما الأعمال بالنيات" />
      </Field>

      <div className="ulp-row2">
        <Field label="اسم الشيخ / المحاضر *">
          <input value={sheikh} onChange={(e) => setSheikh(e.target.value)} required className="ulp-inp" placeholder="مثال: الشيخ محمد العثيمين" />
        </Field>
        <Field label="المدة (بالدقائق)">
          <input type="number" min="1" max="600" value={duration} onChange={(e) => setDuration(e.target.value)} className="ulp-inp" placeholder="مثال: 45" />
        </Field>
      </div>

      <div className="ulp-row2">
        <Field label="الموضوع *">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="ulp-inp">
            {LESSON_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="رابط المصدر (اختياري)">
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="ulp-inp" placeholder="https://..." />
        </Field>
      </div>

      <Field label="وصف الدرس *">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} className="ulp-inp ulp-inp--textarea" placeholder="اكتب ملخصاً للدرس ومحتواه..." />
      </Field>

      <Feedback state={uploadState} message={message} />
      <SubmitBtn loading={uploadState === "uploading"} label="📤 إرسال الدرس للمراجعة" />
    </form>
  );
}

export default function UploadPage() {
  const [tab, setTab] = useState<Tab>("adhan");

  useEffect(() => {
    applyPageSeo({
      path: "/upload",
      title: "رفع أذان أو درس | المجلس العلمي",
      description: "أرسل تسجيل أذان أو درس علمي للمجلس العلمي — شارك العلم وأسهم في إثراء المكتبة الإسلامية.",
      keywords: ["رفع أذان", "تسجيل درس", "رفع ملف صوتي", "مشاركة علمية", "المجلس العلمي"],
    });
  }, []);

  return (
    <div className="ulp-page">
      <div className="ulp-header">
        <p className="ulp-eyebrow">المشاركة</p>
        <h1 className="ulp-title">📤 رفع محتوى إسلامي</h1>
        <p className="ulp-subtitle">شارك أذاناً أو درساً علمياً · يُراجَع من فريق المجالس قبل النشر.</p>
      </div>

      <div className="ulp-notice">
        <span className="ulp-notice__icon">⚠️</span>
        <div className="ulp-notice__text">
          <strong>تنبيه:</strong> يُشترط أن يكون المحتوى موثوقاً من علماء معتمدين.
          لا يُقبل المحتوى المجهول المصدر أو المخالف لأهل السنة والجماعة.
          الفريق يراجع كل الطلبات ويحتفظ بحق القبول أو الرفض.
        </div>
      </div>

      <div className="ulp-tabs">
        {([
          { id: "adhan",  icon: "🎙️", label: "رفع أذان" },
          { id: "lesson", icon: "📚", label: "رفع درس"  },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`ulp-tab${tab === t.id ? " is-active" : ""}`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="ulp-form-card">
        {tab === "adhan" ? <AdhanForm /> : <LessonForm />}
      </div>

      <div className="ulp-steps">
        {[
          { icon: "1️⃣", text: "ترسل الملف والمعلومات" },
          { icon: "2️⃣", text: "يراجع الفريق المحتوى خلال 2–5 أيام" },
          { icon: "3️⃣", text: "عند القبول يُضاف للمكتبة ويُنسب لك" },
        ].map((s) => (
          <div key={s.icon} className="ulp-step">
            <span>{s.icon}</span>
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
  const isSuccess = state === "success";
  return (
    <div className={`ulp-feedback${isSuccess ? " ulp-feedback--success" : " ulp-feedback--error"}`}>
      {isSuccess ? "✅ " : "❌ "}{message}
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} className={`ulp-submit-btn${loading ? " is-loading" : ""}`}>
      {loading ? (
        <><span className="ulp-submit-btn__spinner">⏳</span>جارٍ الرفع...</>
      ) : label}
    </button>
  );
}
