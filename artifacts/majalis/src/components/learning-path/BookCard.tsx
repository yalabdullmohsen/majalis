import { BookOpen, Clock, FileText } from "lucide-react";
import { Link } from "wouter";
import type { LPBook, LPProgress } from "@/lib/learning-path-service";
import { DIFFICULTY_LABELS } from "@/lib/learning-path-service";

interface Props {
  book: LPBook;
  scienceColor?: string;
  progress?: LPProgress;
  onMarkDone?: (bookId: string) => void;
}

export function BookCard({ book, scienceColor = "var(--majalis-emerald, #1F4D3A)", progress, onMarkDone }: Props) {
  const status = progress?.status ?? "not_started";

  return (
    <div className="bc-card">
      {/* غلاف الكتاب أو تدرج لوني */}
      <div
        className={`h-24 relative flex items-center justify-center${book.cover_image_url ? "" : " bc-cover--gradient"}`}
        style={book.cover_image_url ? undefined : { "--bc-color": scienceColor } as React.CSSProperties}
      >
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl opacity-60"><BookOpen size={40} strokeWidth={1.3} /></span>
        )}
        {/* شارة الحالة */}
        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full bc-status-badge bc-status-badge--${status}`}>
          {status === "completed" ? "✓ مكتمل" : status === "in_progress" ? <><Clock size={11} className="inline ml-0.5" />جارٍ</> : "لم يبدأ"}
        </span>
      </div>

      <div className="p-4">
        <Link href={`/learning-path/book/${book.id}`}>
          <h3 className="bc-title line-clamp-2">{book.title}</h3>
        </Link>
        {book.author && (
          <p className="bc-author">{book.author}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bc-difficulty--${book.difficulty}`}>
            {DIFFICULTY_LABELS[book.difficulty]}
          </span>
          {book.estimated_hours > 0 && (
            <span className="bc-meta-tag">⏱ {book.estimated_hours}س</span>
          )}
          {book.pages_count > 0 && (
            <span className="bc-meta-tag">
              <FileText size={11} className="inline ml-0.5" />{book.pages_count}ص
            </span>
          )}
        </div>

        {onMarkDone && status !== "completed" && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onMarkDone(book.id); }}
            className="bc-action-btn"
          >
            {status === "in_progress" ? "✓ تم الإنجاز" : "▶ ابدأ الكتاب"}
          </button>
        )}
      </div>
    </div>
  );
}
