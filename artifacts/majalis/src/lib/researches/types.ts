/**
 * أنواع مكتبة الأبحاث الشرعية — مستقلة عن واجهة العرض.
 * التصنيفات والحالات قابلة للتوسّع دون تعديل جذري.
 */

export type ResearchKind =
  | "undergraduate"
  | "graduation_project"
  | "course_paper"
  | "masters_thesis"
  | "phd_dissertation"
  | "peer_reviewed"
  | "journal_article"
  | "analytical_study"
  | "comparative_study"
  | "manuscript_edition"
  | "research_proposal"
  | "research_abstract"
  | "book_review"
  | "personal_research"
  | "unpublished"
  | "published_journal"
  | "conference_paper";

export type AcademicLevel =
  | "undergraduate"
  | "masters"
  | "phd"
  | "postdoc"
  | "faculty"
  | "independent"
  | "other";

export type ReviewStatus =
  | "draft"
  | "submitted"
  | "auto_screening"
  | "awaiting_review"
  | "needs_revision"
  | "rejected"
  | "accepted"
  | "published"
  | "withdrawn"
  | "rights_hold";

export type AccessType = "metadata_only" | "abstract_only" | "fulltext_view" | "fulltext_download";

export type LicenseType =
  | "all_rights_reserved"
  | "cc_by"
  | "cc_by_sa"
  | "cc_by_nc"
  | "cc_by_nc_sa"
  | "cc_by_nd"
  | "cc0"
  | "publisher_permission"
  | "author_permission"
  | "unknown";

export type SubmitterRole =
  | "author"
  | "coauthor"
  | "supervisor"
  | "university"
  | "publisher"
  | "aggregator";

export type ResearchSort =
  | "relevance"
  | "newest"
  | "oldest"
  | "most_viewed"
  | "most_cited"
  | "reliability"
  | "peer_reviewed"
  | "theses";

export type ResearchCategoryId = string;

export interface ResearchCategory {
  id: ResearchCategoryId;
  label: string;
  parentId?: ResearchCategoryId | null;
  description?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface ResearchAuthor {
  name: string;
  role?: "author" | "coauthor" | "supervisor";
  orcid?: string;
  /** لا يُعرض للعامة */
  emailPrivate?: string;
}

export interface ResearchRecord {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  kind: ResearchKind;
  categoryIds: ResearchCategoryId[];
  authors: ResearchAuthor[];
  supervisor?: string;
  university?: string;
  college?: string;
  department?: string;
  academicLevel?: AcademicLevel;
  country?: string;
  year?: number;
  language: "ar" | "en" | "other";
  pageCount?: number;
  abstract: string;
  keywords: string[];
  problemStatement?: string;
  objectives?: string[];
  methodology?: string;
  findings?: string[];
  recommendations?: string[];
  tableOfContents?: string;
  referencesNote?: string;
  sourceUrl?: string;
  doi?: string;
  publisher?: string;
  journalName?: string;
  volumeIssue?: string;
  reviewStatus: ReviewStatus;
  license: LicenseType;
  accessType: AccessType;
  copyrightNote?: string;
  peerReviewed?: boolean;
  featured?: boolean;
  isPersonal?: boolean;
  /** بيانات تجريبية للتطوير فقط — لا تُحسب في إنتاج بلا تفعيل صريح */
  isDemo?: boolean;
  viewCount?: number;
  downloadCount?: number;
  citationCount?: number;
  sourceReliability?: number;
  importedFrom?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** ملف PDF مسموح فقط عند accessType يسمح بذلك وإذن صريح */
  filePath?: string;
  coverImageUrl?: string;
}

export interface ResearchFilters {
  q?: string;
  categoryId?: string;
  kind?: ResearchKind;
  academicLevel?: AcademicLevel;
  university?: string;
  college?: string;
  country?: string;
  yearFrom?: number;
  yearTo?: number;
  language?: string;
  author?: string;
  supervisor?: string;
  reviewStatus?: ReviewStatus;
  accessType?: AccessType;
  peerReviewed?: boolean;
  thesesOnly?: boolean;
  keyword?: string;
  pageMin?: number;
  pageMax?: number;
  sort?: ResearchSort;
}

export interface ResearchSubmissionInput {
  title: string;
  titleEn?: string;
  kind: ResearchKind;
  categoryId: string;
  subcategoryId?: string;
  authorName: string;
  authorEmail: string;
  submitterRole: SubmitterRole;
  coauthors?: string;
  supervisor?: string;
  university?: string;
  college?: string;
  department?: string;
  academicLevel?: AcademicLevel;
  country?: string;
  year?: number;
  language: "ar" | "en" | "other";
  abstract: string;
  keywords: string;
  objectives?: string;
  methodology?: string;
  findings?: string;
  recommendations?: string;
  sourceUrl?: string;
  doi?: string;
  license: LicenseType;
  copyrightNote?: string;
  permissionProofNote?: string;
  acceptTerms: boolean;
  attestOwnership: boolean;
}

export interface ResearchSubmission extends ResearchSubmissionInput {
  id: string;
  status: ReviewStatus;
  statusNote?: string;
  createdAt: string;
  updatedAt: string;
  ownerKey: string;
  isPersonal: boolean;
  reviewLog: Array<{
    at: string;
    by: string;
    from: ReviewStatus;
    to: ReviewStatus;
    note?: string;
  }>;
}

export interface ResearchStats {
  published: number;
  theses: number;
  peerReviewed: number;
  categoriesUsed: number;
  universities: number;
  countries: number;
}

export interface ImportSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  kind: "institutional_repo" | "open_api" | "rss" | "oai_pmh" | "open_data";
  active: boolean;
  respectsRobots: true;
  metadataOnly: true;
  notes: string;
  /** لا يُستدعى فعليًا إلا إذا وُجدت موافقة/مفتاح واختبار */
  requiresApiKey?: boolean;
  lastRunAt?: string | null;
  lastResult?: string | null;
}

export interface DailyImportReport {
  ranAt: string;
  discovered: number;
  accepted: number;
  duplicates: number;
  rejected: number;
  needsReview: number;
  failedSources: string[];
  notes: string[];
}
