"use client";

import { useEffect, useState } from "react";
import { getBookmark, removeBookmark, upsertBookmark } from "@/lib/local-bookmarks";

type Props = {
  contentKey: string;
  title: string;
  href: string;
  position?: string;
};

export function BookmarkNoteButton({ contentKey, title, href, position }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [hasBookmark, setHasBookmark] = useState(false);

  useEffect(() => {
    const bm = getBookmark(contentKey);
    setHasBookmark(Boolean(bm));
    setNote(bm?.note || "");
  }, [contentKey]);

  const save = () => {
    upsertBookmark({ contentKey, title, href, note, position });
    setHasBookmark(true);
    setOpen(false);
  };

  const remove = () => {
    removeBookmark(contentKey);
    setHasBookmark(false);
    setNote("");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`bookmark-note-btn${hasBookmark ? " bookmark-note-btn--active" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="إشارة مرجعية"
      >
        {hasBookmark ? "📌 مرجع" : "📌"}
      </button>
      {open && (
        <div className="bookmark-note-modal-backdrop" role="dialog" aria-modal="true">
          <div className="bookmark-note-modal">
            <h3>إشارة مرجعية</h3>
            <p className="bookmark-note-modal__title">{title}</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ملاحظتك..."
              rows={4}
            />
            <div className="bookmark-note-modal__actions">
              <button type="button" className="page-action-btn" onClick={save}>
                حفظ
              </button>
              {hasBookmark && (
                <button type="button" className="settings-danger-btn" onClick={remove}>
                  حذف
                </button>
              )}
              <button type="button" className="page-action-btn page-action-btn--secondary" onClick={() => setOpen(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookmarkNoteButton;
