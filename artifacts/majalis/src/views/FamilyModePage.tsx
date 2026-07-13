import { useEffect, useRef, useState } from "react";
import { Award, Baby, BookOpen, Bookmark, CheckCircle2, Lock, PartyPopper, User, Users } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import { supabase } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FamilyLink = {
  id: string;
  parent_id: string;
  child_id: string | null;
  invite_code: string;
  status: "pending" | "active" | "revoked";
  created_at: string;
};

type ChildStats = {
  child_id: string;
  invite_code: string;
  email?: string;
  completedLessons: number;
  savedItems: number;
  badgesCount: number;
};

// ─── Invite code generator ────────────────────────────────────────────────────

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── Parent view ──────────────────────────────────────────────────────────────

function ParentView({ userId }: { userId: string }) {
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [childStats, setChildStats] = useState<ChildStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  const loadLinks = async () => {
    const { data } = await supabase
      .from("family_links")
      .select("*")
      .eq("parent_id", userId)
      .neq("status", "revoked")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as FamilyLink[];
    setLinks(rows);

    // Fetch stats for active links
    const active = rows.filter((l) => l.status === "active" && l.child_id);
    const stats = await Promise.all(
      active.map(async (link) => {
        const [lessonsRes, bookmarksRes, badgesRes] = await Promise.all([
          supabase
            .from("lesson_registrations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", link.child_id!)
            .eq("status", "completed"),
          supabase
            .from("bookmarks")
            .select("id", { count: "exact", head: true })
            .eq("user_id", link.child_id!),
          supabase
            .from("achievements")
            .select("id", { count: "exact", head: true })
            .eq("user_id", link.child_id!),
        ]);
        return {
          child_id: link.child_id!,
          invite_code: link.invite_code,
          completedLessons: lessonsRes.count ?? 0,
          savedItems: bookmarksRes.count ?? 0,
          badgesCount: badgesRes.count ?? 0,
        } as ChildStats;
      }),
    );
    setChildStats(stats);
    setLoading(false);
  };

  useEffect(() => { loadLinks(); }, [userId]);

  const createInvite = async () => {
    setCreating(true);
    const code = genCode();
    await supabase.from("family_links").insert({
      parent_id: userId,
      invite_code: code,
      status: "pending",
    });
    await loadLinks();
    setCreating(false);
  };

  const revokeLink = async (id: string) => {
    await supabase.from("family_links").update({ status: "revoked" }).eq("id", id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    setChildStats((prev) => prev.filter((s) => {
      const link = links.find((l) => l.id === id);
      return !link || s.child_id !== link.child_id;
    }));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopied(code);
    copyTimerRef.current = setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="profile-loading fm-loading-wrap">
        <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
      </div>
    );
  }

  return (
    <div className="fm-parent">
      <div className="fm-section-head">
        <h2 className="fm-section-title">أبناؤك المرتبطون</h2>
        <button
          type="button"
          className="fm-btn fm-btn--primary"
          onClick={createInvite}
          disabled={creating}
        >
          {creating ? "…" : "＋ دعوة ابن جديد"}
        </button>
      </div>

      {links.length === 0 && (
        <p className="fm-empty">لا يوجد أبناء مرتبطون بعد. أنشئ رمز دعوة وأعطه لابنك.</p>
      )}

      {/* Pending invites */}
      {links.filter((l) => l.status === "pending").map((link) => (
        <div key={link.id} className="fm-invite-card">
          <div className="fm-invite-card__body">
            <span className="fm-invite-card__label">رمز الدعوة</span>
            <span className="fm-invite-card__code">{link.invite_code}</span>
            <span className="fm-invite-card__hint">في انتظار الانضمام</span>
          </div>
          <div className="fm-invite-card__actions">
            <button
              type="button"
              className="fm-btn fm-btn--sm"
              onClick={() => copyCode(link.invite_code)}
            >
              {copied === link.invite_code ? "✓ تم النسخ" : "نسخ"}
            </button>
            <button
              type="button"
              className="fm-btn fm-btn--sm fm-btn--danger"
              onClick={() => revokeLink(link.id)}
            >
              إلغاء
            </button>
          </div>
        </div>
      ))}

      {/* Active children */}
      {childStats.map((child) => (
        <div key={child.child_id} className="fm-child-card">
          <div className="fm-child-card__avatar" aria-hidden="true"><User size={22} strokeWidth={1.5} /></div>
          <div className="fm-child-card__info">
            <span className="fm-child-card__name">ابن ({child.invite_code})</span>
            <div className="fm-child-card__stats">
              <span><BookOpen size={12} strokeWidth={1.8} aria-hidden="true" /> {child.completedLessons} درس</span>
              <span><Bookmark size={12} strokeWidth={1.8} aria-hidden="true" /> {child.savedItems} محفوظ</span>
              <span><Award size={12} strokeWidth={1.8} aria-hidden="true" /> {child.badgesCount} شارة</span>
            </div>
          </div>
          <button
            type="button"
            className="fm-btn fm-btn--sm fm-btn--danger"
            onClick={() => {
              const link = links.find((l) => l.child_id === child.child_id);
              if (link) revokeLink(link.id);
            }}
          >
            إزالة
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Child view ───────────────────────────────────────────────────────────────

function ChildView({ userId }: { userId: string }) {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingLink, setExistingLink] = useState<FamilyLink | null>(null);

  useEffect(() => {
    supabase
      .from("family_links")
      .select("*")
      .eq("child_id", userId)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => setExistingLink(data as FamilyLink | null));
  }, [userId]);

  const joinFamily = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError("الرمز يجب أن يكون 6 أحرف"); return; }
    setLoading(true);
    setError("");
    const { data: link, error: fetchErr } = await supabase
      .from("family_links")
      .select("*")
      .eq("invite_code", trimmed)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchErr || !link) {
      setError("رمز غير صحيح أو منتهي الصلاحية. تحقق من الرمز مع ولي أمرك.");
      setLoading(false);
      return;
    }

    await supabase
      .from("family_links")
      .update({ child_id: userId, status: "active" })
      .eq("id", (link as FamilyLink).id);

    setJoined(true);
    setLoading(false);
  };

  if (existingLink) {
    return (
      <div className="fm-joined">
        <div className="fm-joined__icon" aria-hidden="true"><CheckCircle2 size={36} strokeWidth={1.4} /></div>
        <p>أنت مرتبط بحساب ولي الأمر. يمكنه متابعة إنجازاتك.</p>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="fm-joined">
        <div className="fm-joined__icon" aria-hidden="true"><PartyPopper size={36} strokeWidth={1.4} /></div>
        <p>تم الانضمام بنجاح! يمكن لولي أمرك الآن متابعة تقدمك.</p>
      </div>
    );
  }

  return (
    <div className="fm-child">
      <h2 className="fm-section-title">انضم إلى حساب العائلة</h2>
      <p className="fm-child__hint">أدخل رمز الدعوة الذي أعطاك إياه ولي أمرك:</p>
      <div className="fm-child__form">
        <input
          type="text"
          className="fm-code-input"
          aria-label="ABC123" placeholder="ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          dir="ltr"
        />
        <button
          type="button"
          className="fm-btn fm-btn--primary"
          onClick={joinFamily}
          disabled={loading || code.trim().length !== 6}
        >
          {loading ? "…" : "انضم"}
        </button>
      </div>
      {error && <p className="fm-child__error">{error}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FamilyModePage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [role, setRole] = useState<"parent" | "child" | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/family",
      title: "الوضع العائلي | المجلس العلمي",
      description: "إدارة التعلم العائلي، خصص المحتوى لكل فرد في العائلة وتابع التقدم في التعلم الشرعي.",
      keywords: ["وضع عائلي", "تعلم العائلة", "تعليم أطفال", "الأسرة المسلمة"],
      robots: "noindex, follow",
    });
  }, []);

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
      <div className="page-shell narrow fm-login-prompt" dir="rtl">
        <div className="fm-login-icon" aria-hidden="true"><Lock size={40} strokeWidth={1.3} /></div>
        <p className="fm-login-msg">
          سجّل الدخول للوصول إلى الوضع العائلي.
        </p>
        <Link href="/login?next=/family" className="ui-card-btn">تسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="page-shell narrow fm-page" dir="rtl">
      <PageHeader
        eyebrow="المجتمع"
        title="الوضع العائلي"
        subtitle="ولي الأمر يتابع تقدم أبنائه في طلب العلم، روابط آمنة بدون مشاركة كلمة المرور."
      />

      {!role && (
        <div className="fm-role-picker">
          <button
            type="button"
            className="fm-role-btn"
            onClick={() => setRole("parent")}
          >
            <span className="fm-role-btn__icon"><Users size={28} strokeWidth={1.4} /></span>
            <span className="fm-role-btn__label">أنا ولي الأمر</span>
            <span className="fm-role-btn__sub">أتابع إنجازات أبنائي</span>
          </button>
          <button
            type="button"
            className="fm-role-btn"
            onClick={() => setRole("child")}
          >
            <span className="fm-role-btn__icon"><Baby size={28} strokeWidth={1.4} /></span>
            <span className="fm-role-btn__label">أنا الابن/البنت</span>
            <span className="fm-role-btn__sub">أدخل رمز ولي أمري</span>
          </button>
        </div>
      )}

      {role === "parent" && user?.id && <ParentView userId={user.id} />}
      {role === "child" && user?.id && <ChildView userId={user.id} />}

      {role && (
        <button
          type="button"
          className="fm-btn fm-btn--back"
          onClick={() => setRole(null)}
        >
          ← رجوع
        </button>
      )}
    </div>
  );
}
