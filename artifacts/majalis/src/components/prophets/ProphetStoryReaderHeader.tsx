/**
 * رأس قراءة مركّز لقصص الأنبياء — رجوع + عنوان فقط.
 * يظهر فقط داخل ProphetStoryReader (مسار immersive).
 * بلا استماع ولا تكبير/تصغير خط (PR-1 إعادة التصميم).
 */
import type { ReactNode } from "react";

type Props = {
  title: string;
  onBack: () => void;
  /** اختياري — إجراءات حقيقية فقط؛ لا تُمرَّر أدوات استماع/خط */
  actions?: ReactNode;
};

export function ProphetStoryReaderHeader({ title, onBack, actions }: Props) {
  return (
    <header
      className="prophet-reader-header"
      data-component="ProphetStoryReaderHeader"
      data-testid="prophet-reader-header"
      data-has-actions={actions ? "1" : "0"}
    >
      <button
        type="button"
        className="prophet-reader-header__back mj-pressable"
        onClick={onBack}
        aria-label="العودة إلى قائمة الأنبياء"
        data-testid="prophet-reader-back"
      >
        رجوع
      </button>
      <h1 className="prophet-reader-header__title">{title}</h1>
      {actions ? <div className="prophet-reader-header__actions">{actions}</div> : null}
    </header>
  );
}
