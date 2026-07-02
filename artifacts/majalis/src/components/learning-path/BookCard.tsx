import { Link } from "wouter";
import type { LPBook, LPProgress } from "@/lib/learning-path-service";
import { DIFFICULTY_LABELS } from "@/lib/learning-path-service";

interface Props {
  book: LPBook;
  scienceColor?: string;
  progress?: LPProgress;
  onMarkDone?: (bookId: string) => void;
}

const DIFFICULTY_COLORS = {
  easy:   "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
  hard:   "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

export function BookCard({ book, scienceColor = "#059669", progress, onMarkDone }: Props) {
  const status = progress?.status ?? "not_started";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* غلاف الكتاب أو تدرج لوني */}
      <div
        className="h-24 relative flex items-center justify-center"
        style={{
          background: book.cover_image_url
            ? undefined
            : `linear-gradient(135deg, ${scienceColor}22, ${scienceColor}44)`,
        }}
      >
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl opacity-60">📗</span>
        )}
        {/* شارة الحالة */}
        <span
          className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: status === "completed" ? "#dcfce7" : status === "in_progress" ? "#fef9c3" : "#f3f4f6",
            color: status === "completed" ? "#15803d" : status === "in_progress" ? "#854d0e" : "#6b7280",
          }}
        >
          {status === "completed" ? "✓ مكتمل" : status === "in_progress" ? "⏳ جاري" : "لم يبدأ"}
        </span>
      </div>

      <div className="p-4">
        <Link href={`/learning-path/book/${book.id}`}>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer line-clamp-2">
            {book.title}
          </h3>
        </Link>
        {book.author && (
          <p className="text-xs text-gray-500 mb-2">{book.author}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[book.difficulty]}`}>
            {DIFFICULTY_LABELS[book.difficulty]}
          </span>
          {book.estimated_hours > 0 && (
            <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              ⏱ {book.estimated_hours}س
            </span>
          )}
          {book.pages_count > 0 && (
            <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              📄 {book.pages_count}ص
            </span>
          )}
        </div>

        {onMarkDone && status !== "completed" && (
          <button
            onClick={(e) => { e.preventDefault(); onMarkDone(book.id); }}
            className="w-full text-xs font-medium py-1.5 rounded-xl border border-emerald-200 text-emerald-700 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            {status === "in_progress" ? "✓ تم الإنجاز" : "▶ ابدأ الكتاب"}
          </button>
        )}
      </div>
    </div>
  );
}
