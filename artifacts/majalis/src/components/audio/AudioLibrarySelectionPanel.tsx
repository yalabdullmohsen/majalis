/**
 * لوحة اختيار القرّاء والمؤذنين — تبويبان، RTL، ألوان الهوية.
 */
import { useState } from "react";
import { Link } from "wouter";
import { Mic2, Volume2 } from "lucide-react";
import {
  listFamousReciters,
  listFamousMuezzins,
  describeMuezzinAdhanCapability,
} from "@/lib/audio-library-engine";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  SELECTED_MUEZZIN_STORAGE_KEY,
} from "@/lib/adhan-preferences";
import { clampSelectableMuezzinId, type SelectableMuezzinId } from "@/lib/adhan-muezzin-library";
import "@/styles/components/audio-library-selection.css";

type Tab = "muezzins" | "reciters";

export function AudioLibrarySelectionPanel() {
  const [tab, setTab] = useState<Tab>("muezzins");
  const [selectedMuezzin, setSelectedMuezzin] = useState<SelectableMuezzinId>(() =>
    clampSelectableMuezzinId(loadAdhanPrefs().defaultMuezzinId),
  );
  const [isFullAdhan, setIsFullAdhan] = useState(
    () => loadAdhanPrefs().playbackMode === "full",
  );

  const muezzins = listFamousMuezzins();
  const reciters = listFamousReciters();

  function selectMuezzin(id: SelectableMuezzinId) {
    setSelectedMuezzin(id);
    patchAdhanPrefs({ defaultMuezzinId: id });
    try {
      localStorage.setItem(SELECTED_MUEZZIN_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  function toggleFullAdhan(full: boolean) {
    setIsFullAdhan(full);
    patchAdhanPrefs({ playbackMode: full ? "full" : "short" });
  }

  return (
    <section className="als-panel" aria-labelledby="als-panel-title">
      <div className="als-head">
        <h2 id="als-panel-title" className="als-title">
          مكتبة الصوت
        </h2>
        <p className="als-sub">قرّاء التلاوة ومؤذنو الأذان — بث مباشر وتنزيل أوفلاين</p>
      </div>

      <div className="als-tabs" role="tablist" aria-label="نوع المكتبة">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "muezzins"}
          className={`als-tab${tab === "muezzins" ? " is-active" : ""}`}
          onClick={() => setTab("muezzins")}
        >
          <Volume2 size={15} aria-hidden="true" />
          المؤذنون
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reciters"}
          className={`als-tab${tab === "reciters" ? " is-active" : ""}`}
          onClick={() => setTab("reciters")}
        >
          <Mic2 size={15} aria-hidden="true" />
          القرّاء
        </button>
      </div>

      {tab === "muezzins" ? (
        <div role="tabpanel" className="als-body">
          <div className="als-row-toggle">
            <div>
              <span className="als-row-toggle__label">تشغيل الأذان كاملاً</span>
              <p className="als-row-toggle__hint">
                {describeMuezzinAdhanCapability(selectedMuezzin, isFullAdhan)}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isFullAdhan}
              aria-label="تشغيل الأذان كاملاً"
              className={`als-switch${isFullAdhan ? " is-on" : ""}`}
              onClick={() => toggleFullAdhan(!isFullAdhan)}
            >
              <span className="als-switch__thumb" />
            </button>
          </div>

          <ul className="als-list">
            {muezzins.map((m) => {
              const selected = selectedMuezzin === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`als-card${selected ? " is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => selectMuezzin(m.id)}
                  >
                    <span className="als-card__main">
                      <span className="als-card__title">{m.name}</span>
                      <span className="als-card__sub">{m.location}</span>
                    </span>
                    <span className="als-card__meta">
                      {!m.bundled ? "بث" : "محلي"}
                      {selected ? " ✓" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Link href="/adhan-settings" className="als-link">
            إعدادات الأذان والتنبيهات
          </Link>
        </div>
      ) : (
        <div role="tabpanel" className="als-body">
          <p className="als-hint">
            البث المباشر MP3 مع تخزين مؤقت — تنزيل السور كاملة للأوفلاين من الأسفل.
          </p>
          <ul className="als-list">
            {reciters.map((r) => (
              <li key={r.id}>
                <div className="als-card als-card--static">
                  <span className="als-card__main">
                    <span className="als-card__title">{r.name}</span>
                    <span className="als-card__sub">
                      {r.rewayah} · {r.style} · {r.qualityLabel}
                    </span>
                  </span>
                  {r.offlineCapable ? (
                    <span className="als-card__meta">أوفلاين</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <Link href="/mushaf" className="als-link">
            فتح المصحف واختيار القارئ
          </Link>
        </div>
      )}
    </section>
  );
}
