/**
 * هيكل مسار كسول — منطقة المحتوى فقط أثناء تحميل حزمة الصفحة.
 * هيكل ثابت فورًا بلا نص «تحميل» ظاهر؛ aria فقط لقارئ الشاشة.
 * لا يشبه الرئيسية ولا يُعيد رسم الكروم.
 */
import { STATUS } from "@/lib/ui-copy";

export function LazyRouteFallback() {
  const path =
    typeof window !== "undefined" ? window.location.pathname.split("?")[0] || "/" : "/";
  const prophetsShell = /^\/(prophets|prophet-stories|prophets-stories|anbiya)(\/|$)/.test(path);
  const prophetDetail = /^\/(prophets|prophet-stories|prophets-stories|anbiya)\/[^/]+/.test(path);
  const prayerShell = /^\/(prayer-times|prayer|salah)(\/|$)/.test(path);
  const settingsShell = /^\/(settings|more|adhan-settings|notification-settings)(\/|$)/.test(path);
  const searchShell = /^\/search(\/|$)/.test(path);
  const adhkarShell = /^\/(adhkar|tasbih|duas)(\/|$)/.test(path);

  return (
    <div
      className={[
        "lrf-wrap",
        "lrf-wrap--skel",
        "lrf-wrap--instant",
        "lrf-wrap--page",
        "lrf-wrap--silent",
        prophetsShell ? "lrf-wrap--prophets" : "",
        prophetDetail ? "lrf-wrap--prophet-detail" : "",
        prayerShell ? "lrf-wrap--prayer" : "",
        settingsShell ? "lrf-wrap--settings" : "",
        searchShell ? "lrf-wrap--search" : "",
        adhkarShell ? "lrf-wrap--adhkar" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-busy="true"
      aria-label={STATUS.updating}
      data-prophets-shell={prophetsShell ? "1" : undefined}
      data-route-fallback="1"
      data-route-shell={
        prayerShell
          ? "prayer"
          : settingsShell
            ? "settings"
            : searchShell
              ? "search"
              : adhkarShell
                ? "adhkar"
                : undefined
      }
    >
      <div className="lrf-skel lrf-skel--page" aria-hidden="true">
        <div className="lrf-skel__eyebrow" />
        <div className="lrf-skel__title" />
        <div className="lrf-skel__line" />
        <div className="lrf-skel__line lrf-skel__line--short" />
        <div className="lrf-skel__block" />
        <div className="lrf-skel__block lrf-skel__block--short" />
      </div>
    </div>
  );
}

/** اسم مستقر للواجهات — نفس LazyRouteFallback */
export const RouteFallback = LazyRouteFallback;
