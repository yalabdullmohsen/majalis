import { supabase } from "@/lib/supabase";

export type VaultNote = {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string | null;
  content_title: string | null;
  note_text: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type BookmarkItem = {
  id: string;
  content_type: string;
  content_id: string;
  title: string | null;
  thumbnail?: string | null;
  created_at: string;
};

export type ResumeItem = {
  id: string;
  content_type: string;
  content_id: string;
  content_title: string | null;
  content_url: string | null;
  last_opened_at: string;
};

export type VaultData = {
  bookmarks: BookmarkItem[];
  resume: ResumeItem[];
  notes: VaultNote[];
};

export async function getVaultData(userId: string): Promise<VaultData> {
  const [bookmarksRes, resumeRes, notesRes] = await Promise.all([
    supabase
      .from("bookmarks")
      .select("id, content_type, content_id, title, thumbnail, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("reading_resume")
      .select("id, content_type, content_id, content_title, content_url, last_opened_at")
      .eq("user_id", userId)
      .order("last_opened_at", { ascending: false })
      .limit(30),
    supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    bookmarks: (bookmarksRes.data ?? []) as BookmarkItem[],
    resume: (resumeRes.data ?? []) as ResumeItem[],
    notes: (notesRes.data ?? []) as VaultNote[],
  };
}

export async function addNote(
  userId: string,
  note: {
    note_text: string;
    content_type?: string;
    content_id?: string;
    content_title?: string;
    tags?: string[];
  },
): Promise<VaultNote | null> {
  const { data, error } = await supabase
    .from("user_notes")
    .insert({
      user_id: userId,
      note_text: note.note_text,
      content_type: note.content_type ?? "general",
      content_id: note.content_id ?? null,
      content_title: note.content_title ?? null,
      tags: note.tags ?? [],
    })
    .select()
    .single();

  if (error) return null;
  return data as VaultNote;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", userId);
}

export async function updateNote(
  userId: string,
  noteId: string,
  note_text: string,
): Promise<void> {
  await supabase
    .from("user_notes")
    .update({ note_text, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("user_id", userId);
}

export function getContentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    lesson: "درس",
    book: "كتاب",
    hadith: "حديث",
    fawaid: "فائدة",
    ruling: "حكم",
    qa: "سؤال",
    general: "ملاحظة",
    article: "مقالة",
    lesson_registration: "درس",
    library_item: "كتاب",
  };
  return map[type] ?? type;
}

export function getContentTypeIcon(type: string): string {
  const map: Record<string, string> = {
    lesson: "🎓",
    lesson_registration: "🎓",
    book: "📚",
    library_item: "📚",
    hadith: "📜",
    fawaid: "💡",
    ruling: "⚖️",
    qa: "❓",
    general: "📝",
    article: "📄",
  };
  return map[type] ?? "📌";
}
