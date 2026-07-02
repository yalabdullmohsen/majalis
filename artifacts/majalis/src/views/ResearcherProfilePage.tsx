import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import {
  getResearcherProfile,
  saveResearcherProfile,
  SPECIALIZATION_OPTIONS,
  INTEREST_TAGS,
  type ResearcherProfile,
} from "@/lib/researcher-profile-service";

// ─── Interest Tag Toggle ───────────────────────────────────────────────────────

function InterestTag({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`rp-tag${selected ? " rp-tag--active" : ""}`}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

// ─── Publication Item ────────────────────────────────────────────────────────

function PublicationInput({
  value,
  onChange,
  onRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rp-pub-row">
      <input
        type="text"
        className="rp-input"
        placeholder="عنوان البحث أو الكتاب أو المقالة…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" className="rp-pub-remove" onClick={onRemove} aria-label="حذف">✕</button>
    </div>
  );
}

// ─── Share Banner ─────────────────────────────────────────────────────────────

function ShareBanner({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/researcher/${userId}`;

  const copy = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rp-share-banner">
      <span className="rp-share-banner__label">🔗 رابط ملفك العام:</span>
      <span className="rp-share-banner__url">{url}</span>
      <button type="button" className="vault-btn vault-btn--sm vault-btn--primary" onClick={copy}>
        {copied ? "✓ تم النسخ" : "نسخ"}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResearcherProfilePage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Partial<ResearcherProfile>>({
    display_name: "",
    bio: "",
    institution: "",
    specialization: "",
    research_interests: [],
    publications: [],
    is_public: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pubInput, setPubInput] = useState<string[]>([""]);

  useEffect(() => {
    if (!user?.id) return;
    getResearcherProfile(user.id).then((data) => {
      if (data) {
        setProfile(data);
        if (data.publications && data.publications.length > 0) {
          setPubInput([...data.publications, ""]);
        }
      }
      setLoading(false);
    });
  }, [user?.id]);

  const toggleInterest = (tag: string) => {
    setProfile((prev) => {
      const cur = prev.research_interests ?? [];
      return {
        ...prev,
        research_interests: cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
      };
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const pubs = pubInput.filter((p) => p.trim());
    await saveResearcherProfile(user.id, {
      ...profile,
      publications: pubs,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (authLoading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="profile-loading">
          <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow" dir="rtl" style={{ textAlign: "center", paddingTop: "3rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
        <p style={{ color: "var(--majalis-ink-soft)", marginBottom: "1rem" }}>
          سجّل الدخول لإنشاء ملفك البحثي.
        </p>
        <Link href="/login?next=/researcher" className="ui-card-btn">تسجيل الدخول</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="profile-loading" style={{ margin: "3rem auto" }}>
          <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell narrow rp-page" dir="rtl">
      <PageHeader
        eyebrow="البحث العلمي"
        title="🎓 ملف الباحث"
        subtitle="أنشئ ملفاً بحثياً يُعرّف بك وباهتماماتك العلمية في الدراسات الإسلامية."
      />

      <div className="rp-form">
        {/* Public toggle */}
        <div className="rp-public-row">
          <label className="rp-public-label">
            <input
              type="checkbox"
              checked={profile.is_public ?? false}
              onChange={(e) => setProfile((p) => ({ ...p, is_public: e.target.checked }))}
            />
            <span>الملف عام (يمكن للآخرين رؤيته)</span>
          </label>
          {profile.is_public && user?.id && <ShareBanner userId={user.id} />}
        </div>

        {/* Basic info */}
        <div className="rp-section">
          <h2 className="rp-section-title">المعلومات الأساسية</h2>

          <label className="rp-label">الاسم العلمي</label>
          <input
            type="text"
            className="rp-input"
            placeholder="الاسم الذي تُعرَّف به في البحث العلمي"
            value={profile.display_name ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
          />

          <label className="rp-label">الجهة / المؤسسة</label>
          <input
            type="text"
            className="rp-input"
            placeholder="الجامعة أو المعهد أو المركز البحثي"
            value={profile.institution ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, institution: e.target.value }))}
          />

          <label className="rp-label">التخصص</label>
          <select
            className="rp-input rp-select"
            value={profile.specialization ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, specialization: e.target.value }))}
          >
            <option value="">اختر تخصصك…</option>
            {SPECIALIZATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <label className="rp-label">نبذة بحثية</label>
          <textarea
            className="rp-input rp-textarea"
            placeholder="تعريف موجز بمسارك البحثي وأهدافك العلمية…"
            value={profile.bio ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            rows={4}
          />
        </div>

        {/* Research interests */}
        <div className="rp-section">
          <h2 className="rp-section-title">الاهتمامات البحثية</h2>
          <p className="rp-hint">اختر مجالات اهتمامك البحثي:</p>
          <div className="rp-tags-grid">
            {INTEREST_TAGS.map((tag) => (
              <InterestTag
                key={tag}
                label={tag}
                selected={(profile.research_interests ?? []).includes(tag)}
                onToggle={() => toggleInterest(tag)}
              />
            ))}
          </div>
        </div>

        {/* Publications */}
        <div className="rp-section">
          <h2 className="rp-section-title">الأعمال والأبحاث</h2>
          <p className="rp-hint">أضف عناوين كتبك أو أبحاثك أو مقالاتك المنشورة:</p>
          <div className="rp-pubs-list">
            {pubInput.map((pub, i) => (
              <PublicationInput
                key={i}
                value={pub}
                onChange={(v) => {
                  const next = [...pubInput];
                  next[i] = v;
                  if (i === pubInput.length - 1 && v.trim()) next.push("");
                  setPubInput(next);
                }}
                onRemove={() => {
                  if (pubInput.length === 1) { setPubInput([""]); return; }
                  setPubInput(pubInput.filter((_, idx) => idx !== i));
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="vault-btn vault-btn--ghost rp-add-pub"
            onClick={() => setPubInput((p) => [...p, ""])}
          >
            ＋ إضافة عنوان
          </button>
        </div>

        {/* Save */}
        <div className="rp-save-row">
          {saved && <span className="rp-saved-msg">✓ تم الحفظ بنجاح</span>}
          <button
            type="button"
            className="vault-btn vault-btn--primary rp-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "جارٍ الحفظ…" : "حفظ الملف"}
          </button>
        </div>
      </div>
    </div>
  );
}
