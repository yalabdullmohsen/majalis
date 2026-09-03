import type { LibraryBook } from "./library-catalog";
import type { ContentProvenance } from "./content-provenance";

export type LibraryProvenance = ContentProvenance & {
  sourceName: string;
  hostedBySsunnah: boolean;
  license: string;
};

/** يشتق حقوق الكتاب من الكتالوج — لا نُضمّن نصًا كاملًا؛ الروابط خارجية فقط. */
export function resolveLibraryProvenance(book: LibraryBook): LibraryProvenance {
  const sourceUrl = book.sourceUrl || book.external_url || null;
  const hostedBySsunnah = book.hostedBySsunnah ?? Boolean(book.file_url);
  const license =
    book.license ||
    (hostedBySsunnah
      ? "requires_explicit_license"
      : sourceUrl
        ? "external_link_only"
        : "bibliographic_reference");

  return {
    sourceName: book.sourceName || `${book.author} — ${book.title}`,
    sourceUrl,
    reference: book.author,
    license,
    usageNote:
      book.usageNote ||
      (hostedBySsunnah
        ? "نص مستضاف — يُعرض وفق الترخيص المذكور"
        : sourceUrl
          ? "رابط للمصدر — لا إعادة استضافة للنص الكامل"
          : "بطاقة مرجعية — العنوان والمؤلف دون نص كامل"),
    reviewed: book.reviewed ?? book.contentStatus !== "needs_review",
    lastVerifiedAt: book.lastVerifiedAt ?? null,
    needsSource: !book.author?.trim(),
    publicDomain: book.publicDomain ?? !hostedBySsunnah,
    hostedBySsunnah,
  };
}
