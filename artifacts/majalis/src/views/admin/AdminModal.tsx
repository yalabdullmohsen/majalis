import * as React from "react";

interface AdminModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const autoId = React.useId();
  const canLink = React.Children.count(children) === 1 && React.isValidElement(children);
  const child = canLink
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, {
        id: (children as React.ReactElement<{ id?: string }>).props.id ?? autoId,
      })
    : children;
  return (
    <div className="adm-field">
      <label className="adm-field__label" htmlFor={canLink ? ((children as React.ReactElement<{ id?: string }>).props.id ?? autoId) : undefined}>
        {label}
      </label>
      {child}
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
          <button type="button" onClick={onClose} className="adm-modal__close" aria-label="إغلاق">×</button>
          <h2 className="adm-modal__title">{title}</h2>
        </div>
        <div className="adm-modal__body">{children}</div>
        <div className="adm-modal__footer">
          <button type="button" onClick={onSave} disabled={saving} className={`adm-modal__save${saving ? " adm-modal__save--saving" : ""}`}>
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          <button type="button" onClick={onClose} disabled={saving} className="adm-modal__cancel">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
