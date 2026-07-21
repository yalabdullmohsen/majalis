const BASE = "/api/universities";
const ADMIN = "/api/admin/universities";

export type DegreeLevel = "دبلوم" | "بكالوريوس" | "ماجستير" | "دكتوراه" | "دبلوم_عالي";
export type StudyMode   = "حضوري" | "عن_بعد" | "هجين";
export type AccreditationStatus = "accredited" | "provisional" | "unverified" | "unknown";
export type ReminderType = "annual_check" | "deadline_approaching" | "data_incomplete";
export type ReminderStatus = "pending" | "reviewed" | "dismissed";

export interface AdmissionRequirements {
  id:                    string;
  program_id:            string;
  requirements:          string[];
  required_documents:    string[];
  application_steps:     { step: number; text: string }[];
  application_deadline:  string;
  application_url:       string;
  notes:                 string;
}

export interface UniversityProgram {
  id:                 string;
  university_id:      string;
  program_name:       string;
  faculty_department: string;
  specialization:     string;
  degree_level:       DegreeLevel;
  study_language:     string;
  study_mode:         StudyMode;
  duration:           string;
  tuition_fees:       number | null;
  currency:           string;
  has_scholarship:    boolean;
  scholarship_details:string;
  is_active:          boolean;
  admission_requirements?: AdmissionRequirements[];
}

export interface UniversityFaq {
  id:           string;
  university_id:string;
  question:     string;
  answer:       string;
  order_index:  number;
}

export interface University {
  id:                   string;
  slug:                 string;
  name_ar:              string;
  name_en:              string;
  country:              string;
  city:                 string;
  logo_url:             string;
  about:                string;
  website_url:          string;
  social_links:         Record<string, string>;
  accreditation_status: AccreditationStatus;
  is_verified:          boolean;
  is_published:         boolean;
  last_updated_at:      string;
  last_reviewed_by:     string;
  created_at:           string;
  university_programs?: UniversityProgram[];
  university_faqs?:     UniversityFaq[];
}

export interface ReviewReminder {
  id:            string;
  university_id: string;
  program_id?:   string;
  reminder_type: ReminderType;
  due_date:      string;
  status:        ReminderStatus;
  notes:         string;
  created_at:    string;
  reviewed_at?:  string;
  reviewed_by?:  string;
  universities?: Pick<University, "id" | "slug" | "name_ar" | "name_en" | "website_url">;
  university_programs?: Pick<UniversityProgram, "id" | "program_name" | "degree_level">;
}

export interface UniversityFilters {
  country?:       string;
  degree_level?:  DegreeLevel | "";
  study_mode?:    StudyMode | "";
  has_scholarship?:boolean;
  study_language?: string;
  is_verified?:   boolean;
  search?:        string;
  limit?:         number;
  offset?:        number;
}

export const DEGREE_LEVELS: DegreeLevel[] = ["دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "دبلوم_عالي"];
export const STUDY_MODES:   StudyMode[]   = ["حضوري", "عن_بعد", "هجين"];
export const LANGUAGES = ["العربية", "الإنجليزية", "الفرنسية", "الماليزية", "الأردية"];

export const ACCREDITATION_LABELS: Record<AccreditationStatus, string> = {
  accredited:   "معتمدة رسمياً",
  provisional:  "اعتماد مبدئي",
  unverified:   "غير متحقق",
  unknown:      "غير محدد",
};

export const ACCREDITATION_COLOR: Record<AccreditationStatus, string> = {
  accredited:  "#15803d",
  provisional: "#173D35",
  unverified:  "#6b7280",
  unknown:     "#9ca3af",
};

// ── Public API ─────────────────────────────────────────────────────────────

export async function fetchUniversities(filters: UniversityFilters = {}): Promise<{
  items: University[]; total: number; seed_needed?: boolean;
}> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  }
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) return { items: [], total: 0 };
  return res.json();
}

export async function fetchUniversity(slug: string): Promise<University | null> {
  const res = await fetch(`${BASE}/${slug}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.university || null;
}

export async function compareUniversities(slugs: string[]): Promise<University[]> {
  const res = await fetch(`${BASE}/compare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slugs }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.universities || [];
}

// ── Admin API ──────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch { return null; }
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  return fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}

export async function adminFetchUniversities(): Promise<University[]> {
  const res = await authFetch(`${ADMIN}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function adminCreateUniversity(body: Partial<University>): Promise<University | null> {
  const res = await authFetch(ADMIN, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.university || null;
}

export async function adminUpdateUniversity(id: string, body: Partial<University>): Promise<University | null> {
  const res = await authFetch(`${ADMIN}/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.university || null;
}

export async function adminAddProgram(universityId: string, body: Partial<UniversityProgram>): Promise<UniversityProgram | null> {
  const res = await authFetch(`${ADMIN}/${universityId}/programs`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.program || null;
}

export async function adminUpdateProgram(id: string, body: Partial<UniversityProgram>): Promise<UniversityProgram | null> {
  const res = await authFetch(`/api/admin/programs/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.program || null;
}

export async function adminDeleteProgram(id: string): Promise<boolean> {
  const res = await authFetch(`/api/admin/programs/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function adminSaveRequirements(programId: string, body: Partial<AdmissionRequirements>): Promise<AdmissionRequirements | null> {
  const res = await authFetch(`/api/admin/requirements/${programId}`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.requirements || null;
}

export async function adminAddFaq(universityId: string, body: Partial<UniversityFaq>): Promise<UniversityFaq | null> {
  const res = await authFetch(`/api/admin/faqs/${universityId}`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) return null;
  const data = await res.json();
  return data.faq || null;
}

export async function adminDeleteFaq(id: string): Promise<boolean> {
  const res = await authFetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function adminFetchReminders(): Promise<ReviewReminder[]> {
  const res = await authFetch("/api/admin/reminders");
  if (!res.ok) return [];
  const data = await res.json();
  return data.reminders || [];
}

export async function adminUpdateReminder(id: string, status: ReminderStatus, notes?: string): Promise<boolean> {
  const res = await authFetch(`/api/admin/reminders/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status, notes }),
  });
  return res.ok;
}

// ── Compare Context helpers ────────────────────────────────────────────────
export const MAX_COMPARE = 4;

export function groupProgramsByDegree(programs: UniversityProgram[]): Record<string, UniversityProgram[]> {
  return programs.reduce<Record<string, UniversityProgram[]>>((acc, p) => {
    if (!acc[p.degree_level]) acc[p.degree_level] = [];
    acc[p.degree_level].push(p);
    return acc;
  }, {});
}
