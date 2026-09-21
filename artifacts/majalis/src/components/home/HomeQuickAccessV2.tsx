/**
 * وصول سريع — أيقونات Rounded Premium (Visual Redesign V2).
 * مسارات موجودة فقط · بلا ميزات جديدة.
 */
import { Link } from "wouter";
import { BookMarked, BookOpen, Clock, GraduationCap } from "lucide-react";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import "@/styles/components/home-quick-access-v2.css";

const QUICK = [
  { href: "/quran-hub", label: "القرآن", Icon: BookMarked },
  { href: "/adhkar", label: "الأذكار", Icon: BookOpen },
  { href: "/lessons", label: "التعلم", Icon: GraduationCap },
  { href: "/prayer-times", label: "الصلاة", Icon: Clock },
] as const;

function QuickTile({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: (typeof QUICK)[number]["Icon"];
}) {
  const { ref, onPointerEnter, onPointerDown, onFocus } = usePrefetchRoute(href);
  return (
    <div ref={ref} className="hq2-tile-host">
      <Link
        href={href}
        className="hq2-tile mj-pressable"
        onPointerEnter={onPointerEnter}
        onPointerDown={onPointerDown}
        onFocus={onFocus}
        aria-label={label}
      >
        <span className="hq2-tile__icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className="hq2-tile__label">{label}</span>
      </Link>
    </div>
  );
}

export function HomeQuickAccessV2() {
  return (
    <nav className="hq2" aria-label="الوصول السريع" data-testid="home-quick-access-v2">
      {QUICK.map((item) => (
        <QuickTile key={item.href} {...item} />
      ))}
    </nav>
  );
}
