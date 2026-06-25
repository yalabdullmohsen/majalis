import { forwardRef, useMemo } from "react";
import {
  buildDeathAnnouncementCopy,
  DEATH_ANNOUNCEMENT_VERSE,
} from "@/lib/death-announcement-content";
import { fitFontSize, type DeathAnnouncementForm } from "@/lib/condolence-shared";

export type { DeathAnnouncementForm } from "@/lib/condolence-shared";
export { defaultDeathAnnouncementForm } from "@/lib/condolence-shared";

type Props = {
  form: DeathAnnouncementForm;
  width: number;
  height: number;
  preview?: boolean;
  className?: string;
};

function CornerMarks() {
  const corners = ["tl", "tr", "bl", "br"] as const;
  return (
    <>
      {corners.map((pos) => (
        <svg
          key={pos}
          className={`cond-death__corner cond-death__corner--${pos}`}
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <path
            d={
              pos === "tl"
                ? "M2 14 L2 2 L14 2"
                : pos === "tr"
                  ? "M26 2 L38 2 L38 14"
                  : pos === "bl"
                    ? "M2 26 L2 38 L14 38"
                    : "M26 38 L38 38 L38 26"
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle
            cx={pos.includes("t") ? (pos === "tl" ? 6 : 34) : pos === "bl" ? 6 : 34}
            cy={pos.includes("l") ? (pos.startsWith("t") ? 6 : 34) : pos.startsWith("t") ? 6 : 34}
            r="1.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.85"
          />
        </svg>
      ))}
    </>
  );
}

export const DeathAnnouncementCard = forwardRef<HTMLDivElement, Props>(function DeathAnnouncementCard(
  { form, width, height, preview = false, className = "" },
  ref,
) {
  const scale = width / 1080;
  const copy = useMemo(() => buildDeathAnnouncementCopy(form, preview), [form, preview]);

  const nameDisplay = form.name.trim() || (preview ? "اسم المتوفى" : "………………");

  const nameFont = useMemo(
    () => fitFontSize(nameDisplay, 58, 40, 18, 36),
    [nameDisplay],
  );

  const addressFont = useMemo(
    () => fitFontSize(copy.condolenceLine, 38, 28, 28, 52),
    [copy.condolenceLine],
  );

  const verseFont = preview ? 68 : 72;

  return (
    <div
      ref={ref}
      className={["cond-death", preview ? "cond-death--preview" : "", className].filter(Boolean).join(" ")}
      style={{
        width,
        height,
        ["--cond-scale" as string]: scale,
        ["--cond-death-name" as string]: `${nameFont}px`,
        ["--cond-death-address" as string]: `${addressFont}px`,
        ["--cond-death-verse" as string]: `${verseFont}px`,
      }}
      dir="rtl"
    >
      <div className="cond-death__bg" aria-hidden="true" />
      <div className="cond-death__frame" aria-hidden="true" />
      <CornerMarks />

      <div className="cond-death__inner">
        <header className="cond-death__head">
          <p className="cond-death__verse">{DEATH_ANNOUNCEMENT_VERSE}</p>
        </header>

        <section className="cond-death__body">
          <p className="cond-death__transition">{copy.transition}</p>
          <p className="cond-death__name">{nameDisplay}</p>
          <p className="cond-death__detail">{copy.burialLine}</p>
          <p className="cond-death__detail">{copy.prayerLine}</p>
          <p className="cond-death__detail cond-death__detail--address">{copy.condolenceLine}</p>
          <p className="cond-death__phone">{copy.phoneLine}</p>
        </section>

        <footer className="cond-death__foot">
          <p className="cond-death__closing">{copy.closing}</p>
          {form.extraDua.trim() ? (
            <p className="cond-death__extra">{form.extraDua.trim()}</p>
          ) : null}
        </footer>
      </div>
    </div>
  );
});
