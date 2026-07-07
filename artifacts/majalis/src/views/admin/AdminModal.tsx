interface AdminModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-field__label">{label}</label>
      {children}
    </div>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="adm-field-row">{children}</div>;
}

export function AdminModal({ title, open, onClose, onSave, saving, children }: AdminModalProps) {
  if (!open) return null;
  return (
    <div className="adm-modal__overlay" onClick={onClose}>
      <div className="adm-modal__dialog" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal__header">
          <button onClick={onClose} className="adm-modal__close">×</button>
          <h2 className="adm-modal__title">{title}</h2>
        </div>
        <div className="adm-modal__body">{children}</div>
        <div className="adm-modal__footer">
          <button onClick={onSave} disabled={saving} className={`adm-modal__save${saving ? " adm-modal__save--saving" : ""}`}>
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          <button onClick={onClose} disabled={saving} className="adm-modal__cancel">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
