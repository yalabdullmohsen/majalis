/**
 * غلاف وضع القراءة المركّز — يثبت data-attr لإثبات المسار الحي.
 */
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  prophetSlug: string;
};

export function ProphetStoryReader({ children, prophetSlug }: Props) {
  return (
    <div
      className="prophet-story-reader"
      data-component="ProphetStoryReader"
      data-prophets-reader="1"
      data-prophet-slug={prophetSlug}
      data-testid="prophet-story-reader"
    >
      {children}
    </div>
  );
}
