import { useEffect, useState } from "react";
import { getPageNote, savePageNote } from "@/lib/mushaf/mushaf-storage";

type Props = {
  page: number;
};

export function MushafPageNotes({ page }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNote(getPageNote(page));
    setSaved(false);
  }, [page]);

  const persist = () => {
    savePageNote(page, note);
    setSaved(true);
    setOpen(false);
  };

  const hasNote = Boolean(getPageNote(page));

  return (
    <>
      <button
        type="button"
        className={`km-btn km-btn--sm${hasNote ? " is-active" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="ملاحظة على الصفحة"
      >
        {hasNote ? "ملاحظة ✓" : "ملاحظة"}
      </button>
      {open && (
        <div className="km-notes-overlay" role="dialog" aria-modal="true" aria-label="ملاحظة الصفحة">
          <div className="km-notes-drawer">
            <header className="km-notes-header">
              <strong>ملاحظة — صفحة {page}</strong>
              <button type="button" className="km-btn km-btn--sm" onClick={() => setOpen(false)}>إغلاق</button>
            </header>
            <textarea
              className="ds-input km-notes-body"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ملاحظتك الخاصة…"
              rows={5}
            />
            <div className="km-notes-actions">
              <button type="button" className="km-btn" onClick={() => { setNote(""); savePageNote(page, ""); setOpen(false); }}>
                حذف
              </button>
              <button type="button" className="km-btn km-btn--primary" onClick={persist}>حفظ</button>
            </div>
            {saved && <p className="km-notes-saved">تم الحفظ</p>}
          </div>
        </div>
      )}
    </>
  );
}

export default MushafPageNotes;
