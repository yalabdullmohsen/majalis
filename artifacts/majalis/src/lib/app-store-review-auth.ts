/**
 * جلسة مراجعة App Store — محلية، بلا اعتماد على تأكيد بريد Supabase.
 * تُستخدم فقط لـ Guideline 2.1 (حساب تجريبي / Demonstration Mode).
 * ليست صلاحيات إدارة.
 */
const STORAGE_KEY = "ssunnah-app-store-review-session-v1";

/** يُدرج حرفيًا في ملاحظات App Store Connect */
export const APP_STORE_REVIEW_EMAIL = "apple.review@ssunnah.com";
export const APP_STORE_REVIEW_PASSWORD = "SunnahReview-2026!";

export type AppStoreReviewUser = {
  id: string;
  email: string;
  aud: string;
  role: string;
  app_metadata: Record<string, unknown>;
  user_metadata: { full_name: string };
  created_at: string;
  is_owner: boolean;
  governance_role: string;
  profile: {
    id: string;
    full_name: string;
    role: string;
    is_admin: boolean;
    is_super_admin: boolean;
    is_owner: boolean;
    status: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
    governance_role: string;
  };
};

export function matchesAppStoreReviewCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === APP_STORE_REVIEW_EMAIL.toLowerCase() &&
    password === APP_STORE_REVIEW_PASSWORD
  );
}

export function buildAppStoreReviewUser(): AppStoreReviewUser {
  const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const now = new Date().toISOString();
  return {
    id,
    email: APP_STORE_REVIEW_EMAIL,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "app_store_review", providers: ["app_store_review"] },
    user_metadata: { full_name: "App Store Review" },
    created_at: now,
    is_owner: false,
    governance_role: "read_only",
    profile: {
      id,
      full_name: "App Store Review",
      role: "user",
      is_admin: false,
      is_super_admin: false,
      is_owner: false,
      status: "active",
      avatar_url: null,
      created_at: now,
      updated_at: now,
      governance_role: "read_only",
    },
  };
}

export function persistAppStoreReviewSession(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearAppStoreReviewSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasAppStoreReviewSession(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
