export type ResearchDegreeType =
  | "phd"
  | "masters"
  | "bachelors"
  | "graduation"
  | "peer_reviewed"
  | "scientific_paper"
  | "working_paper"
  | "sharia_research"
  | "academic";

export type ResearchStatus =
  | "draft"
  | "pending_review"
  | "revision_requested"
  | "published"
  | "hidden"
  | "archived"
  | "rejected";

export type CopyrightType =
  | "all_rights_reserved"
  | "download_only"
  | "read_only"
  | "cite_with_attribution"
  | "creative_commons"
  | "custom";

export type ResearchSortBy =
  | "newest"
  | "views"
  | "downloads"
  | "rating"
  | "saves";

export type ResearchPaper = {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  abstract_short?: string | null;
  abstract_full?: string | null;
  degree_type: ResearchDegreeType;
  category_slug?: string | null;
  specialization?: string | null;
  author_id?: string | null;
  author_name: string;
  author_email?: string | null;
  supervisor_name?: string | null;
  university?: string | null;
  faculty?: string | null;
  department?: string | null;
  country?: string | null;
  defense_date?: string | null;
  publication_year?: number | null;
  page_count?: number | null;
  language: string;
  keywords?: string[];
  cover_url?: string | null;
  pdf_url?: string | null;
  file_type?: string | null;
  file_size_bytes?: number | null;
  copyright_type: CopyrightType;
  copyright_terms?: string | null;
  license_url?: string | null;
  status: ResearchStatus;
  ai_summary_short?: string | null;
  ai_summary_medium?: string | null;
  ai_keywords?: string[];
  views_count: number;
  downloads_count: number;
  shares_count: number;
  saves_count: number;
  rating_avg?: number | null;
  rating_count?: number;
  published_at?: string | null;
  created_at?: string;
};

export type ResearchAuthor = {
  id: string;
  slug: string;
  full_name: string;
  email?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  university?: string | null;
  specialization?: string | null;
  degree?: string | null;
  country?: string | null;
  social_links?: Record<string, string>;
  papers_count: number;
  views_count: number;
  downloads_count: number;
};

export type ResearchCategory = {
  slug: string;
  name_ar: string;
  icon?: string;
  parent_slug?: string | null;
};

export type ResearchListOptions = {
  category?: string;
  degree?: ResearchDegreeType | "all";
  university?: string;
  country?: string;
  year?: number;
  language?: string;
  fileType?: string;
  search?: string;
  sort?: ResearchSortBy;
  limit?: number;
  offset?: number;
};

export type ResearchUploadPayload = {
  title: string;
  author_name: string;
  author_email?: string;
  university?: string;
  faculty?: string;
  department?: string;
  degree_type: ResearchDegreeType;
  supervisor_name?: string;
  defense_date?: string;
  specialization?: string;
  category_slug?: string;
  keywords?: string[];
  abstract_full?: string;
  copyright_type: CopyrightType;
  copyright_terms?: string;
  language?: string;
  country?: string;
  pdf_url?: string;
  cover_url?: string;
};
