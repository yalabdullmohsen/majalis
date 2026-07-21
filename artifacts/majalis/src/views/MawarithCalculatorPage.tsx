import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { calculateInheritance } from "@/lib/inheritance/engine";
import { computeEstateBreakdown, type EstateBreakdown } from "@/lib/inheritance/estate";
import { INHERITANCE_PRESETS, type InheritancePreset } from "@/lib/inheritance/presets";
import { listSavedCases, saveCase, deleteSavedCase, type SavedInheritanceCase } from "@/lib/inheritance/case-storage";
import {
  DEFAULT_FIQH_CONFIG,
  InheritanceInputError,
  type Asset,
  type EstateInput,
  type FiqhConfig,
  type HeirKey,
  type HeirsInput,
  type InheritanceResult,
  type ShareBasis,
} from "@/lib/inheritance/types";

type WizardStep = "heirs" | "estate" | "result";

const HEIR_LABELS: Record<HeirKey, string> = {
  husband: "الزوج",
  wife: "الزوجة",
  father: "الأب",
  mother: "الأم",
  paternalGrandfather: "الجدّ لأب",
  paternalGrandmother: "الجدّة لأب",
  maternalGrandmother: "الجدّة لأم",
  sons: "الابن",
  daughters: "البنت",
  sonsOfSon: "ابن الابن",
  daughtersOfSon: "بنت الابن",
  fullBrothers: "الأخ الشقيق",
  fullSisters: "الأخت الشقيقة",
  paternalBrothers: "الأخ لأب",
  paternalSisters: "الأخت لأب",
  maternalBrothers: "الأخ لأم",
  maternalSisters: "الأخت لأم",
};

const BASIS_LABELS: Record<ShareBasis, string> = {
  fixed: "فرض",
  asaba: "تعصيب",
  "asaba-with-daughters": "تعصيب مع الغير",
  radd: "فرض + ردّ",
  "dhawil-arham": "ذوو أرحام",
};

const HEIR_GROUPS: { title: string; keys: HeirKey[] }[] = [
  { title: "الأصول", keys: ["father", "mother", "paternalGrandfather", "paternalGrandmother", "maternalGrandmother"] },
  { title: "الفروع", keys: ["sons", "daughters", "sonsOfSon", "daughtersOfSon"] },
  { title: "الحواشي (الإخوة والأخوات)", keys: ["fullBrothers", "fullSisters", "paternalBrothers", "paternalSisters", "maternalBrothers", "maternalSisters"] },
];

const EMPTY_HEIRS: HeirsInput = {};

function CounterRow({ label, value, onChange, max = 20 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="mwc-counter-row">
      <span className="mwc-counter-row__label">{label}</span>
      <div className="mwc-counter-row__control">
        <button type="button" className="mwc-counter-row__btn" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label={`إنقاص عدد ${label}`}>−</button>
        <span className="mwc-counter-row__value">{value}</span>
        <button type="button" className="mwc-counter-row__btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`زيادة عدد ${label}`}>+</button>
      </div>
    </div>
  );
}

function fmtMoney(n: number): string {
  return n.toLocaleString("ar", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export default function MawarithCalculatorPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/mawarith/calculator",
      title: "حاسبة المواريث الإسلامية | المجلس العلمي",
      description: "احسب أنصبة الورثة الشرعية تلقائيًا وفق الفرائض والتعصيب والحجب والعول والردّ، مع شرح خطوة بخطوة.",
      keywords: ["حاسبة المواريث", "حاسبة الفرائض", "تقسيم التركة", "أنصبة الورثة"],
    });
  }, []);

  const [step, setStep] = useState<WizardStep>("heirs");

  const [heirs, setHeirs] = useState<HeirsInput>(EMPTY_HEIRS);
  const spouseType: "none" | "husband" | "wife" = heirs.husband ? "husband" : heirs.wife ? "wife" : "none";

  const setSpouseType = (t: "none" | "husband" | "wife") => {
    setHeirs((prev) => ({ ...prev, husband: t === "husband" ? 1 : 0, wife: t === "wife" ? Math.max(1, prev.wife || 1) : 0 }));
  };
  const setWifeCount = (n: number) => setHeirs((prev) => ({ ...prev, wife: Math.max(1, n), husband: 0 }));
  const setCount = (key: HeirKey, n: number) => setHeirs((prev) => ({ ...prev, [key]: n }));

  const totalHeirsCount = useMemo(() => Object.values(heirs).reduce((s, v) => s + (v ?? 0), 0), [heirs]);

  const [assets, setAssets] = useState<Asset[]>([{ id: "a1", label: "التركة", value: 0 }]);
  const [debts, setDebts] = useState(0);
  const [funeralCosts, setFuneralCosts] = useState(0);
  const [bequest, setBequest] = useState(0);
  const [bequestApprovedByHeirs, setBequestApprovedByHeirs] = useState(false);
  const [fiqhConfig, setFiqhConfig] = useState<FiqhConfig>(DEFAULT_FIQH_CONFIG);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addAsset = () => setAssets((prev) => [...prev, { id: `a${Date.now()}`, label: "", value: 0 }]);
  const removeAsset = (id: string) => setAssets((prev) => (prev.length > 1 ? prev.filter((a) => a.id !== id) : prev));
  const updateAsset = (id: string, patch: Partial<Asset>) => setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const [result, setResult] = useState<InheritanceResult | null>(null);
  const [estateBreakdown, setEstateBreakdown] = useState<EstateBreakdown | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [savedCases, setSavedCases] = useState<SavedInheritanceCase[]>([]);

  useEffect(() => {
    setSavedCases(listSavedCases());
  }, []);

  const applyPreset = (preset: InheritancePreset) => {
    setHeirs(preset.heirs);
    setStep("heirs");
  };

  const loadSavedCase = (c: SavedInheritanceCase) => {
    setHeirs(c.heirs);
    setAssets(c.estate.assets);
    setDebts(c.estate.debts);
    setFuneralCosts(c.estate.funeralCosts);
    setBequest(c.estate.bequest);
    setBequestApprovedByHeirs(c.estate.bequestApprovedByHeirs);
    setFiqhConfig(c.fiqhConfig);
    setStep("heirs");
  };

  const removeSavedCase = (id: string) => {
    deleteSavedCase(id);
    setSavedCases(listSavedCases());
  };

  const runCalculation = () => {
    try {
      const estateInput: EstateInput = { assets, debts, funeralCosts, bequest, bequestApprovedByHeirs };
      const breakdown = computeEstateBreakdown(estateInput);
      const res = calculateInheritance(heirs, fiqhConfig);
      setEstateBreakdown(breakdown);
      setResult(res);
      setCalcError(null);
      setStep("result");
    } catch (e) {
      setCalcError(e instanceof InheritanceInputError || e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء الحساب.");
    }
  };

  const handleSaveCurrent = () => {
    if (!saveTitle.trim()) return;
    saveCase({ title: saveTitle.trim(), heirs, estate: { assets, debts, funeralCosts, bequest, bequestApprovedByHeirs }, fiqhConfig });
    setSaveTitle("");
    setSavedCases(listSavedCases());
  };

  const resetAll = () => {
    setHeirs(EMPTY_HEIRS);
    setAssets([{ id: `a${Date.now()}`, label: "التركة", value: 0 }]);
    setDebts(0);
    setFuneralCosts(0);
    setBequest(0);
    setBequestApprovedByHeirs(false);
    setFiqhConfig(DEFAULT_FIQH_CONFIG);
    setResult(null);
    setEstateBreakdown(null);
    setCalcError(null);
    setStep("heirs");
  };

  const STEP_NUMBERS: Record<WizardStep, number> = { heirs: 1, estate: 2, result: 3 };
  const currentStepNum = STEP_NUMBERS[step];

  return (
    <div className="page-shell narrow mwc-page" dir="rtl">
      <PageHeader
        eyebrow="الفقه والأحكام"
        title="حاسبة المواريث الإسلامية"
        subtitle="حدّد الورثة والتركة، وستحصل على توزيع الأنصبة الشرعية مع شرح كل خطوة."
      />

      <div className="maw-disclaimer" role="note">
        <strong>تنبيه:</strong> هذه الحاسبة أداة <strong>تعليمية مساعدة</strong> تُطبّق قواعد جمهور الفقهاء.
        لا تُعتمَد بديلاً عن <strong>عالم شرعي مختص</strong> أو جهة قضائية معتمدة، خصوصًا في حالات الحمل
        والخنثى المشكل والمفقود ووفاة أكثر من وارث معًا أو قبل القسمة (المناسخات)، وذوي الأرحام
        البعيدين — وكلها حالات تحتاج تقديرًا متخصصًا لا تحسبها هذه الأداة تلقائيًا.
      </div>

      {step !== "result" && (
        <div className="lp-wizard__steps">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`lp-wizard__step-dot${currentStepNum >= n ? " lp-wizard__step-dot--active" : ""}`} />
          ))}
        </div>
      )}

      {/* ── خطوة الورثة ── */}
      {step === "heirs" && (
        <>
          <div className="mwc-presets no-print">
            <span className="mwc-presets__label">أمثلة جاهزة للتجربة:</span>
            <div className="mwc-presets__scroll">
              {INHERITANCE_PRESETS.map((p) => (
                <button key={p.id} type="button" className="mwc-preset-chip" onClick={() => applyPreset(p)} title={p.description}>
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {savedCases.length > 0 && (
            <div className="mwc-saved no-print">
              <span className="mwc-saved__label">مسائل محفوظة على هذا الجهاز:</span>
              <ul className="mwc-saved__list">
                {savedCases.map((c) => (
                  <li key={c.id} className="mwc-saved__item">
                    <button type="button" className="mwc-saved__open" onClick={() => loadSavedCase(c)}>{c.title}</button>
                    <button type="button" className="mwc-saved__delete" onClick={() => removeSavedCase(c.id)} aria-label={`حذف ${c.title}`}>✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="lp-wizard__step">
            <h2 className="lp-wizard__step-title">الزوجية</h2>
            <div className="lp-wizard__options">
              <button type="button" className={`lp-wizard__option${spouseType === "none" ? " lp-wizard__option--selected" : ""}`} onClick={() => setSpouseType("none")}>
                <span className="lp-wizard__option-label">لا يوجد</span>
              </button>
              <button type="button" className={`lp-wizard__option${spouseType === "husband" ? " lp-wizard__option--selected" : ""}`} onClick={() => setSpouseType("husband")}>
                <span className="lp-wizard__option-label">زوج</span>
              </button>
              <button type="button" className={`lp-wizard__option${spouseType === "wife" ? " lp-wizard__option--selected" : ""}`} onClick={() => setSpouseType("wife")}>
                <span className="lp-wizard__option-label">زوجة/زوجات</span>
              </button>
            </div>
            {spouseType === "wife" && (
              <div className="mwc-counter-row">
                <span className="mwc-counter-row__label">عدد الزوجات</span>
                <div className="mwc-counter-row__control">
                  <button type="button" className="mwc-counter-row__btn" onClick={() => setWifeCount((heirs.wife ?? 1) - 1)} disabled={(heirs.wife ?? 1) <= 1}>−</button>
                  <span className="mwc-counter-row__value">{heirs.wife ?? 1}</span>
                  <button type="button" className="mwc-counter-row__btn" onClick={() => setWifeCount((heirs.wife ?? 1) + 1)} disabled={(heirs.wife ?? 1) >= 4}>+</button>
                </div>
              </div>
            )}
          </div>

          {HEIR_GROUPS.map((group) => (
            <div key={group.title} className="mwc-heir-group">
              <h3 className="mwc-heir-group__title">{group.title}</h3>
              {group.keys.map((key) => (
                <CounterRow key={key} label={HEIR_LABELS[key]} value={heirs[key] ?? 0} onChange={(v) => setCount(key, v)} />
              ))}
            </div>
          ))}

          <div className="lp-wizard__nav">
            <button type="button" className="lp-wizard__next" disabled={totalHeirsCount === 0} onClick={() => setStep("estate")}>
              التالي →
            </button>
          </div>
          {totalHeirsCount === 0 && <p className="mwc-hint">حدّد وارثًا واحدًا على الأقل للمتابعة.</p>}
        </>
      )}

      {/* ── خطوة التركة ── */}
      {step === "estate" && (
        <>
          <div className="lp-wizard__step">
            <h2 className="lp-wizard__step-title">أصول التركة</h2>
            <div className="mwc-assets">
              {assets.map((a) => (
                <div key={a.id} className="mwc-asset-row">
                  <input
                    type="text"
                    value={a.label}
                    onChange={(e) => updateAsset(a.id, { label: e.target.value })}
                    placeholder="اسم الأصل (عقار، نقد، ...)"
                    className="mwc-asset-row__label"
                    aria-label="اسم الأصل"
                  />
                  <input
                    type="number"
                    min="0"
                    value={a.value || ""}
                    onChange={(e) => updateAsset(a.id, { value: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="mwc-asset-row__value"
                    aria-label="قيمة الأصل"
                  />
                  {assets.length > 1 && (
                    <button type="button" className="mwc-asset-row__remove" onClick={() => removeAsset(a.id)} aria-label="حذف الأصل">✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="mwc-add-asset" onClick={addAsset}>+ إضافة أصل آخر</button>
            </div>

            <div className="mwc-field">
              <label className="mwc-field__label" htmlFor="mwc-funeral">مؤن التجهيز (تكفين ودفن)</label>
              <input id="mwc-funeral" type="number" min="0" value={funeralCosts || ""} onChange={(e) => setFuneralCosts(Number(e.target.value) || 0)} placeholder="0" className="mwc-field__input" />
            </div>
            <div className="mwc-field">
              <label className="mwc-field__label" htmlFor="mwc-debts">الديون</label>
              <input id="mwc-debts" type="number" min="0" value={debts || ""} onChange={(e) => setDebts(Number(e.target.value) || 0)} placeholder="0" className="mwc-field__input" />
            </div>
            <div className="mwc-field">
              <label className="mwc-field__label" htmlFor="mwc-bequest">الوصية (إن وُجدت)</label>
              <input id="mwc-bequest" type="number" min="0" value={bequest || ""} onChange={(e) => setBequest(Number(e.target.value) || 0)} placeholder="0" className="mwc-field__input" />
            </div>
            {bequest > 0 && (
              <label className="mwc-checkbox">
                <input type="checkbox" checked={bequestApprovedByHeirs} onChange={(e) => setBequestApprovedByHeirs(e.target.checked)} />
                <span>أجاز جميع الورثة تنفيذ الوصية كاملة ولو تجاوزت الثلث</span>
              </label>
            )}

            <button type="button" className="mwc-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? "إخفاء" : "عرض"} الخيارات الفقهية المتقدّمة (مسائل خلافية) ▾
            </button>
            {showAdvanced && (
              <div className="mwc-advanced">
                <div className="mwc-field">
                  <label className="mwc-field__label" htmlFor="mwc-grandfather">الجدّ مع الإخوة</label>
                  <select
                    id="mwc-grandfather"
                    className="mwc-field__input"
                    value={fiqhConfig.grandfatherWithSiblings}
                    onChange={(e) => setFiqhConfig((prev) => ({ ...prev, grandfatherWithSiblings: e.target.value as FiqhConfig["grandfatherWithSiblings"] }))}
                  >
                    <option value="muqasama">مقاسمة الإخوة (قول الجمهور)</option>
                    <option value="grandfatherExcludes">الجدّ يُسقط الإخوة (قول أبي بكر وابن عباس)</option>
                  </select>
                </div>
                <label className="mwc-checkbox">
                  <input type="checkbox" checked={fiqhConfig.raddToSpouse} onChange={(e) => setFiqhConfig((prev) => ({ ...prev, raddToSpouse: e.target.checked }))} />
                  <span>الردّ على أحد الزوجين عند عدم وجود عصبة (خلاف الجمهور)</span>
                </label>
                <label className="mwc-checkbox">
                  <input type="checkbox" checked={fiqhConfig.mushtarakaShareWithMaternalSiblings} onChange={(e) => setFiqhConfig((prev) => ({ ...prev, mushtarakaShareWithMaternalSiblings: e.target.checked }))} />
                  <span>تشريك الإخوة الأشقاء مع إخوة الأم في مسألة المشرَّكة (قول الجمهور)</span>
                </label>
              </div>
            )}
          </div>

          {calcError && <div className="mwc-error" role="alert">{calcError}</div>}

          <div className="lp-wizard__nav">
            <button type="button" className="lp-wizard__back" onClick={() => setStep("heirs")}>← رجوع</button>
            <button type="button" className="lp-wizard__next" onClick={runCalculation}>احسب النتيجة</button>
          </div>
        </>
      )}

      {/* ── خطوة النتيجة ── */}
      {step === "result" && result && estateBreakdown && (
        <div className="mwc-result mwc-print-area">
          {result.warnings.map((w, i) => (
            <div key={i} className="mwc-warning" role="alert">{w}</div>
          ))}

          <div className="mwc-estate-summary">
            <h2 className="mwc-section-title">صافي التركة القابل للتوزيع</h2>
            <div className="mwc-estate-row"><span>إجمالي التركة</span><strong>{fmtMoney(estateBreakdown.grossEstate)}</strong></div>
            <div className="mwc-estate-row"><span>مؤن التجهيز</span><strong>− {fmtMoney(estateBreakdown.funeralCosts)}</strong></div>
            <div className="mwc-estate-row"><span>الديون</span><strong>− {fmtMoney(estateBreakdown.debts)}</strong></div>
            <div className="mwc-estate-row"><span>الوصية المنفَّذة{estateBreakdown.bequestCapped ? " (بحدّ الثلث)" : ""}</span><strong>− {fmtMoney(estateBreakdown.bequestPaid)}</strong></div>
            <div className="mwc-estate-row mwc-estate-row--total"><span>صافي التركة للورثة</span><strong>{fmtMoney(estateBreakdown.netForHeirs)}</strong></div>
            {estateBreakdown.warnings.map((w, i) => (
              <p key={i} className="mwc-estate-note">{w}</p>
            ))}
          </div>

          {result.shares.length > 0 && (
            <div className="mwc-shares">
              <h2 className="mwc-section-title">أنصبة الورثة</h2>
              <div className="mwc-shares-table">
                <div className="mwc-shares-table__head">
                  <span>الوارث</span><span>العدد</span><span>النصيب</span><span>نصيب الفرد</span><span>الأساس</span>
                </div>
                {result.shares.map((s) => {
                  const totalMoney = s.totalShare.mul(estateBreakdown.netForHeirsFraction).toDecimal(2);
                  const perPersonMoney = s.perPersonShare.mul(estateBreakdown.netForHeirsFraction).toDecimal(2);
                  return (
                    <div key={s.heir} className="mwc-shares-table__row" title={s.reason}>
                      <span className="mwc-shares-table__heir">{HEIR_LABELS[s.heir]}{s.count > 1 ? ` (${s.count})` : ""}</span>
                      <span>{s.count}</span>
                      <span>{s.totalShare.toArabicLabel()} — {fmtMoney(totalMoney)}</span>
                      <span>{fmtMoney(perPersonMoney)}</span>
                      <span className="mwc-shares-table__basis">{BASIS_LABELS[s.basis]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mwc-base-info">
            <span>أصل المسألة: {result.originalBase.toString()}</span>
            {result.awlBase !== null && <span>— بعد العول: {result.awlBase.toString()}</span>}
            {result.radd && <span>— وقع ردّ الفائض على أصحاب الفروض</span>}
          </div>

          {result.steps.length > 0 && (
            <details className="mwc-steps">
              <summary>خطوات الحساب بالتفصيل</summary>
              <ol className="mwc-steps__list">
                {result.steps.map((s, i) => (
                  <li key={i}><strong>{s.title}:</strong> {s.detail}</li>
                ))}
              </ol>
            </details>
          )}

          {result.hajbLog.length > 0 && (
            <details className="mwc-steps">
              <summary>سجلّ الحجب (من حُجب ولماذا)</summary>
              <ul className="mwc-steps__list">
                {result.hajbLog.map((h, i) => (
                  <li key={i}>
                    <strong>{HEIR_LABELS[h.heir]}</strong> — {h.type === "hirman" ? "حجب حرمان كامل" : "حجب نقصان"}: {h.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mwc-result-actions no-print">
            <button type="button" className="ui-card-btn" onClick={() => window.print()}>طباعة / PDF</button>
            <button type="button" className="lp-wizard__back" onClick={() => setStep("estate")}>← تعديل البيانات</button>
            <button type="button" className="lp-wizard__back" onClick={resetAll}>مسألة جديدة</button>
          </div>

          <div className="mwc-save-row no-print">
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="اسم لحفظ هذه المسألة على هذا الجهاز..."
              className="mwc-save-row__input"
              aria-label="اسم المسألة للحفظ"
            />
            <button type="button" className="mwc-save-row__btn" disabled={!saveTitle.trim()} onClick={handleSaveCurrent}>حفظ</button>
          </div>

          <div className="maw-disclaimer no-print" role="note">
            <strong>تذكير:</strong> النتائج تقديرية وفق قواعد جمهور الفقهاء المُعدَّة في هذه الأداة، ولا تُغني عن
            استشارة عالم شرعي مختص عند التطبيق الفعلي، خصوصًا في القضايا المعقّدة أو المتنازَع عليها.
          </div>

          <div className="twh-share no-print">
            <ShareButtons title="حاسبة المواريث الإسلامية — المجلس العلمي" url="https://www.majlisilm.com/mawarith/calculator" />
          </div>
        </div>
      )}

      <nav className="mw-related no-print" aria-label="صفحات ذات صلة">
        <div className="mw-related__grid">
          <Link href="/mawarith" className="mw-related__link">دليل المواريث والفرائض</Link>
        </div>
      </nav>
    </div>
  );
}
