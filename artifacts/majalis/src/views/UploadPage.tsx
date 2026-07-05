import { useState, useRef, type ChangeEvent, type DragEvent, type FormEvent } from "react";
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

// ─── File Drop Zone ────────────────────────────────────────────────────────────
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
        style={{
          border: `2px dashed ${dragging ? "#134a3a" : file ? "#86efac" : "#d1d5db"}`,
          borderRadius: "0.875rem",
          padding: "1.5rem",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "#f0fdf4" : file ? "#f8fffe" : "#fafafa",
          transition: "all 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: "none" }}
        />
        {file ? (
          <div>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--majalis-emerald)" }}>
              {file.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem" }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
            >
              إزالة الملف
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--majalis-ink-soft)" }}>
              اسحب وأفلت أو اضغط للاختيار
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
              {hint} · الحجم الأقصى {maxMb} MB
            </div>
          </div>
        )}
      </div>
      {err && <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.35rem" }}>{err}</div>}
    </div>
  );
}

// ─── Adhan Form ───────────────────────────────────────────────────────────────
function AdhanForm() {
  const [file, setFile]           = useState<File | null>(null);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [style, setStyle]         = useState(ADHAN_STYLES[0]);
  const [country, setCountry]     = useState("");
  const [origin, setOrigin]       = useState("");
  const [prayerType, setPrayerType] = useState<"general" | "fajr" | "both">("general");
  const [uploadState, setUpload]  = useState<UploadState>("idle");
  const [message, setMessage]     = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) { setMessage("الرجاء اختيار ملف صوتي."); return; }
    setUpload("uploading");
    setMessage("");

    const res = await submitAdhan({
      file,
      title:         title || `أذان ${name}`,
      description:   desc,
      submitterName: name,
      submitterEmail: email || undefined,
      meta:          { muezzin_style: style, country, origin, prayer_type: prayerType },
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Info banner */}
      <div style={infoBanner}>
        <span style={{ fontSize: "1.1rem" }}>🎙️</span>
        <span style={{ fontSize: "0.82rem", color: "var(--majalis-emerald)" }}>
          ارفع تسجيلاً صوتياً للأذان · يُراجَع من قِبل الفريق قبل نشره في المكتبة.
        </span>
      </div>

      {/* File drop */}
      <Field label="ملف الأذان (MP3 / AAC / WAV) *">
        <FileDropZone
          accept="audio/*"
          maxMb={MAX_AUDIO_MB}
          onFile={setFile}
          file={file}
          hint="MP3, AAC, WAV, OGG"
        />
      </Field>

      <div style={row2}>
        <Field label="اسمك / اسم المؤذن *">
          <input value={name} onChange={(e) => setName(e.target.value)} required style={inp} placeholder="مثال: أحمد الكويتي" />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} placeholder="للتواصل عند القبول" />
        </Field>
      </div>

      <Field label="عنوان الأذان *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inp} placeholder="مثال: أذان فجر خاشع" />
      </Field>

      <div style={row2}>
        <Field label="الدولة *">
          <input value={country} onChange={(e) => setCountry(e.target.value)} required style={inp} placeholder="مثال: الكويت" />
        </Field>
        <Field label="المدينة">
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} style={inp} placeholder="مثال: الكويت العاصمة" />
        </Field>
      </div>

      <div style={row2}>
        <Field label="أسلوب الأذان *">
          <select value={style} onChange={(e) => setStyle(e.target.value)} style={inp}>
            {ADHAN_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="نوع الأذان *">
          <select value={prayerType} onChange={(e) => setPrayerType(e.target.value as typeof prayerType)} style={inp}>
            {ADHAN_PRAYER_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="وصف إضافي (اختياري)">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="معلومات إضافية عن التسجيل..." />
      </Field>

      <Feedback state={uploadState} message={message} />

      <SubmitBtn loading={uploadState === "uploading"} label="📤 إرسال الأذان للمراجعة" />
    </form>
  );
}

// ─── Lesson Form ──────────────────────────────────────────────────────────────
function LessonForm() {
  const [file, setFile]         = useState<File | null>(null);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [sheikh, setSheikh]     = useState("");
  const [duration, setDuration] = useState("");
  const [topic, setTopic]       = useState(LESSON_TOPICS[0]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [uploadState, setUpload] = useState<UploadState>("idle");
  const [message, setMessage]   = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setUpload("uploading");
    setMessage("");

    const res = await submitLesson({
      file: file ?? undefined,
      title,
      description: desc,
      submitterName: name,
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
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Info banner */}
      <div style={infoBanner}>
        <span style={{ fontSize: "1.1rem" }}>📚</span>
        <span style={{ fontSize: "0.82rem", color: "var(--majalis-emerald)" }}>
          أضف درساً علمياً موثّقاً · يمكن رفع ملف صوت/فيديو أو إرسال معلومات الدرس فقط.
        </span>
      </div>

      {/* File — optional for lessons */}
      <Field label="ملف الدرس (اختياري — صوت أو فيديو)">
        <FileDropZone
          accept="audio/*,video/*"
          maxMb={MAX_VIDEO_MB}
          onFile={setFile}
          file={file}
          hint="MP3, MP4, M4A, WebM"
        />
      </Field>

      <div style={row2}>
        <Field label="اسمك *">
          <input value={name} onChange={(e) => setName(e.target.value)} required style={inp} placeholder="الاسم الكامل" />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} placeholder="للتواصل" />
        </Field>
      </div>

      <Field label="عنوان الدرس *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inp} placeholder="مثال: شرح حديث إنما الأعمال بالنيات" />
      </Field>

      <div style={row2}>
        <Field label="اسم الشيخ / المحاضر *">
          <input value={sheikh} onChange={(e) => setSheikh(e.target.value)} required style={inp} placeholder="مثال: الشيخ محمد العثيمين" />
        </Field>
        <Field label="المدة (بالدقائق)">
          <input type="number" min="1" max="600" value={duration} onChange={(e) => setDuration(e.target.value)} style={inp} placeholder="مثال: 45" />
        </Field>
      </div>

      <div style={row2}>
        <Field label="الموضوع *">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} style={inp}>
            {LESSON_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="رابط المصدر (اختياري)">
          <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} style={inp} placeholder="https://..." />
        </Field>
      </div>

      <Field label="وصف الدرس *">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} style={{ ...inp, resize: "vertical" }} placeholder="اكتب ملخصاً للدرس ومحتواه..." />
      </Field>

      <Feedback state={uploadState} message={message} />

      <SubmitBtn loading={uploadState === "uploading"} label="📤 إرسال الدرس للمراجعة" />
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const [tab, setTab] = useState<Tab>("adhan");

  return (
    <div style={{ direction: "rtl", maxWidth: 680, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--majalis-emerald)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.25rem" }}>
          المشاركة
        </p>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--majalis-ink)", margin: "0 0 0.35rem" }}>
          📤 رفع محتوى إسلامي
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: 0 }}>
          شارك أذاناً أو درساً علمياً · يُراجَع من فريق المجالس قبل النشر.
        </p>
      </div>

      {/* Notice */}
      <div style={{
        background: "rgba(14,110,82,0.06)",
        border: "1.5px solid #fde68a",
        borderRadius: "0.875rem",
        padding: "0.875rem 1rem",
        marginBottom: "1.5rem",
        display: "flex",
        gap: "0.625rem",
      }}>
        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
        <div style={{ fontSize: "0.8rem", color: "var(--majalis-emerald)", lineHeight: 1.6 }}>
          <strong>تنبيه:</strong> يُشترط أن يكون المحتوى موثوقاً من علماء معتمدين.
          لا يُقبل المحتوى المجهول المصدر أو المخالف لأهل السنة والجماعة.
          الفريق يراجع كل الطلبات ويحتفظ بحق القبول أو الرفض.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.25rem" }}>
        {([
          { id: "adhan",  icon: "🎙️", label: "رفع أذان"  },
          { id: "lesson", icon: "📚", label: "رفع درس"   },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "0.65rem",
              borderRadius: "0.55rem",
              border: "none",
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#134a3a" : "#6b7280",
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Form card */}
      <div style={{ background: "var(--majalis-panel, rgba(255,255,255,0.08))", borderRadius: "1rem", border: "1.5px solid rgba(255,255,255,0.10)", padding: "1.25rem 1.25rem 1.5rem" }}>
        {tab === "adhan"  ? <AdhanForm  /> : <LessonForm />}
      </div>

      {/* Steps */}
      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[
          { icon: "1️⃣", text: "ترسل الملف والمعلومات" },
          { icon: "2️⃣", text: "يراجع الفريق المحتوى خلال 2–5 أيام" },
          { icon: "3️⃣", text: "عند القبول يُضاف للمكتبة ويُنسب لك" },
        ].map((s) => (
          <div key={s.icon} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
            <span>{s.icon}</span>
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--majalis-ink-soft)" }}>
      {label}
      {children}
    </label>
  );
}

function Feedback({ state, message }: { state: UploadState; message: string }) {
  if (!message) return null;
  const isSuccess = state === "success";
  return (
    <div style={{
      padding: "0.75rem 1rem",
      borderRadius: "0.6rem",
      border: `1px solid ${isSuccess ? "#86efac" : "#fca5a5"}`,
      background: isSuccess ? "#f0fdf4" : "#fef2f2",
      color: isSuccess ? "#065f46" : "#991b1b",
      fontSize: "0.85rem",
      fontWeight: 600,
    }}>
      {isSuccess ? "✅ " : "❌ "}{message}
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%",
        padding: "0.875rem",
        borderRadius: "0.875rem",
        border: "none",
        background: loading ? "#9ca3af" : "linear-gradient(135deg, #134a3a, #0c3020)",
        color: "#fff",
        fontSize: "0.9rem",
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
      }}
    >
      {loading ? (
        <>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
          جارٍ الرفع...
        </>
      ) : label}
    </button>
  );
}

const infoBanner: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.625rem",
  padding: "0.7rem 0.875rem",
  background: "rgba(46,139,103,0.10)",
  border: "1px solid rgba(46,139,103,0.25)",
  borderRadius: "0.75rem",
};

const row2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75rem",
};

const inp: React.CSSProperties = {
  padding: "0.6rem 0.75rem",
  border: "1.5px solid rgba(255,255,255,0.10)",
  borderRadius: "0.6rem",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  background: "#fafafa",
  color: "var(--majalis-ink)",
  direction: "rtl",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};
