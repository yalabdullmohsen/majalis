export type PermanentCommitteeFatwa = {
  id: string;
  external_key?: string;
  fatwa_number?: string;
  title: string;
  question: string;
  answer: string;
  summary?: string;
  category: string;
  subcategory?: string;
  keywords?: string[];
  reference?: string;
  source_url?: string;
  source_name?: string;
  issued_at?: string;
  status?: string;
  view_count?: number;
  search_count?: number;
  linked_lesson_ids?: string[];
  linked_book_ids?: string[];
  linked_research_ids?: string[];
  published_at?: string;
  created_at?: string;
};

export type PermanentCommitteeCategory = {
  slug: string;
  name: string;
  parent_slug?: string | null;
  subcategories?: PermanentCommitteeCategory[];
};

export type PermanentCommitteeSearchFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
  fatwaNumber?: string;
  keyword?: string;
  limit?: number;
};

export const PC_SOURCE_NAME = "اللجنة الدائمة للبحوث العلمية والإفتاء";
export const PC_BASE_PATH = "/permanent-committee";
