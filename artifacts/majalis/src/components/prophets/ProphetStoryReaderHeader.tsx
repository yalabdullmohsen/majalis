/**
 * رأس قراءة مركّز لقصص الأنبياء — رجوع + عنوان + أدوات.
 * يظهر فقط داخل ProphetStoryReader (مسار immersive).
 */
import type { ReactNode } from "react";

type Props = {
  title: string;
  onBack: () => void;
  actions?: ReactNode;
};

export function ProphetStoryReaderHeader({ title, onBack, actions }: Props) {
  return (
    <header
      className="prophet-reader-header"
      data-component="ProphetStoryReaderHeader"
      data-testid="prophet-reader-header"
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
      <div className="prophet-reader-header__actions">{actions}</div>
    </header>
  );
}
