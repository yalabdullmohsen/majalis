import { forwardRef } from "react";
import {
  FONTS,
  PALETTES,
  getCssFilter,
  type BuilderForm,
  type ColorPalette,
  type Font,
  type ImageFilter,
} from "@/lib/condolence-builder";

export const CARD_W = 1080;
export const CARD_H = 1350;

type CardProps = {
  form: BuilderForm;
  isExport?: boolean;
};

// ─── Helper sub-components ──────────────────────────────────────────────────

function OrnamentLine({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 40px" }}>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.5 }} />
      <div style={{ width: 8, height: 8, background: color, transform: "rotate(45deg)", opacity: 0.8 }} />
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.5 }} />
    </div>
  );
}

function PhotoCircle({
  url, filter, brightness, borderColor, size,
}: {
  url: string | null;
  filter: ImageFilter;
  brightness: number;
  borderColor: string;
  size: number;
}) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      border: `6px solid ${borderColor}`,
      overflow: "hidden",
      background: url ? "transparent" : "rgba(0,0,0,0.1)",
      flexShrink: 0,
      boxShadow: `0 0 0 3px ${borderColor}44`,
    }}>
      {url ? (
        <img
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: getCssFilter(filter, brightness) }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, opacity: 0.4 }}>
          ✦
        </div>
      )}
    </div>
  );
}

// ─── Template renderers ─────────────────────────────────────────────────────

function ClassicElegant({ form, palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  const hasPhoto = Boolean(form.imageDataUrl);
  return (
    <div style={{ width: "100%", height: "100%", background: palette.background, display: "flex", flexDirection: "column", fontFamily: font.css }}>
      {/* Photo area */}
      <div style={{
        height: hasPhoto ? 420 : 160,
        background: hasPhoto ? "transparent" : `linear-gradient(135deg, ${palette.accent}22, ${palette.accent}11)`,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}>
        {hasPhoto && (
          <img src={form.imageDataUrl!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: getCssFilter(form.imageFilter, form.imageBrightness) }} />
        )}
        {!hasPhoto && (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, opacity: 0.3, color: palette.accent }}>
            ✦ ✦ ✦
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 60px 40px", gap: 28, direction: "rtl", textAlign: "center" }}>
        <p style={{ fontSize: 26, color: palette.accent, margin: 0, letterSpacing: "0.05em" }}>
          بسم الله الرحمن الرحيم
        </p>

        <OrnamentLine color={palette.accent} />

        {form.name && (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: palette.primary, margin: 0, lineHeight: 1.5 }}>
            {form.name}
          </p>
        )}
        {!form.name && (
          <p style={{ fontSize: form.headingSize * 0.8, color: palette.secondary, margin: 0, opacity: 0.5 }}>
            اسم المتوفى
          </p>
        )}

        <OrnamentLine color={palette.accent} />

        <p style={{ fontSize: form.bodySize, color: palette.secondary, margin: 0, lineHeight: 1.9, maxWidth: 820 }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: palette.secondary, margin: 0, lineHeight: 1.9, opacity: 0.85 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          {form.familyName && (
            <p style={{ fontSize: form.bodySize - 4, color: palette.primary, margin: "0 0 8px", fontWeight: 600 }}>
              {form.familyName}
            </p>
          )}
          {form.date && (
            <p style={{ fontSize: form.bodySize - 6, color: palette.secondary, margin: 0 }}>{form.date}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DarkLuxury({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  const gold = "#d4af37";
  const goldLight = "#f0d060";
  return (
    <div style={{ width: "100%", height: "100%", background: "#0e0e0e", display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 60px 50px", fontFamily: font.css, direction: "rtl", textAlign: "center" }}>
      {/* Ornate top */}
      <p style={{ fontSize: 20, color: gold, letterSpacing: "0.12em", margin: "0 0 30px" }}>
        ✦ بسم الله الرحمن الرحيم ✦
      </p>

      {/* Photo */}
      <PhotoCircle url={form.imageDataUrl} filter={form.imageFilter} brightness={form.imageBrightness} borderColor={gold} size={300} />

      {/* Golden divider */}
      <div style={{ width: 200, height: 2, background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, margin: "36px 0" }} />

      {/* Name */}
      {form.name && (
        <p style={{ fontSize: form.headingSize, fontWeight: 700, color: goldLight, margin: "0 0 12px", lineHeight: 1.5 }}>
          {form.name}
        </p>
      )}
      {!form.name && (
        <p style={{ fontSize: form.headingSize * 0.8, color: gold, margin: "0 0 12px", opacity: 0.4 }}>
          اسم المتوفى
        </p>
      )}

      {/* Divider */}
      <div style={{ width: 300, height: 1, background: `linear-gradient(90deg, transparent, ${gold}88, transparent)`, margin: "24px 0" }} />

      {/* Phrase */}
      <p style={{ fontSize: form.bodySize, color: "#e8e8e8", margin: "0 0 24px", lineHeight: 2, maxWidth: 820 }}>
        {form.phrase}
      </p>

      {form.extraText && (
        <p style={{ fontSize: form.bodySize - 4, color: "#aaaaaa", margin: "0 0 24px", lineHeight: 1.9 }}>
          {form.extraText}
        </p>
      )}

      {/* Footer */}
      <div style={{ marginTop: "auto" }}>
        <div style={{ width: 160, height: 1, background: gold, opacity: 0.4, margin: "0 auto 20px" }} />
        {form.familyName && <p style={{ fontSize: form.bodySize - 4, color: gold, margin: "0 0 8px" }}>{form.familyName}</p>}
        {form.date && <p style={{ fontSize: form.bodySize - 6, color: "#888", margin: 0 }}>{form.date}</p>}
      </div>
    </div>
  );
}

function IslamicGreen({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  const green = "#1b5e20";
  const lightGreen = "#4caf50";
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #f1fff1 0%, #e8f5e9 100%)", display: "flex", flexDirection: "column", fontFamily: font.css }}>
      {/* Green header */}
      <div style={{ background: `linear-gradient(135deg, ${green}, #2e7d32)`, padding: "36px 60px", textAlign: "center" }}>
        <p style={{ fontSize: 22, color: "#ffffff", margin: 0, letterSpacing: "0.08em" }}>بسم الله الرحمن الرحيم</p>
      </div>

      {/* Border pattern */}
      <div style={{ height: 6, background: `repeating-linear-gradient(90deg, ${green} 0px, ${green} 12px, transparent 12px, transparent 24px)` }} />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 60px", gap: 24, direction: "rtl", textAlign: "center" }}>
        <PhotoCircle url={form.imageDataUrl} filter={form.imageFilter} brightness={form.imageBrightness} borderColor={lightGreen} size={260} />

        <OrnamentLine color={green} />

        {form.name && (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: green, margin: 0, lineHeight: 1.5 }}>
            {form.name}
          </p>
        )}
        {!form.name && (
          <p style={{ fontSize: form.headingSize * 0.8, color: green, margin: 0, opacity: 0.4 }}>اسم المتوفى</p>
        )}

        <OrnamentLine color={green} />

        <p style={{ fontSize: form.bodySize, color: "#2d2d2d", margin: 0, lineHeight: 1.9, maxWidth: 820 }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: "#555", margin: 0, lineHeight: 1.9 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          {form.familyName && <p style={{ fontSize: form.bodySize - 4, fontWeight: 600, color: green, margin: "0 0 8px" }}>{form.familyName}</p>}
          {form.date && <p style={{ fontSize: form.bodySize - 6, color: "#777", margin: 0 }}>{form.date}</p>}
        </div>
      </div>

      {/* Green footer border */}
      <div style={{ height: 6, background: `repeating-linear-gradient(90deg, ${green} 0px, ${green} 12px, transparent 12px, transparent 24px)` }} />
      <div style={{ background: `linear-gradient(135deg, ${green}, #2e7d32)`, padding: "18px", textAlign: "center" }}>
        <p style={{ fontSize: 18, color: "#ffffffbb", margin: 0 }}>إنا لله وإنا إليه راجعون</p>
      </div>
    </div>
  );
}

function ModernMinimal({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  const hasPhoto = Boolean(form.imageDataUrl);
  return (
    <div style={{
      width: "100%", height: "100%",
      background: hasPhoto ? "transparent" : "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      position: "relative", fontFamily: font.css, overflow: "hidden",
    }}>
      {/* Background photo */}
      {hasPhoto && (
        <img
          src={form.imageDataUrl!}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: getCssFilter(form.imageFilter, form.imageBrightness) }}
        />
      )}
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)" }} />

      {/* Content over overlay */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px", direction: "rtl", textAlign: "center", gap: 32 }}>
        <p style={{ fontSize: 22, color: "rgba(255,255,255,0.75)", margin: 0, letterSpacing: "0.1em" }}>
          بسم الله الرحمن الرحيم
        </p>

        <div style={{ width: 200, height: 1, background: "rgba(255,255,255,0.4)" }} />

        {form.name ? (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: 1.5, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {form.name}
          </p>
        ) : (
          <p style={{ fontSize: form.headingSize * 0.8, color: "rgba(255,255,255,0.4)", margin: 0 }}>اسم المتوفى</p>
        )}

        <div style={{ width: 200, height: 1, background: "rgba(255,255,255,0.4)" }} />

        <p style={{ fontSize: form.bodySize, color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 2, maxWidth: 820, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.9 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: 20 }}>
          {form.familyName && <p style={{ fontSize: form.bodySize - 4, color: "rgba(255,255,255,0.8)", margin: "0 0 8px" }}>{form.familyName}</p>}
          {form.date && <p style={{ fontSize: form.bodySize - 6, color: "rgba(255,255,255,0.6)", margin: 0 }}>{form.date}</p>}
        </div>
      </div>
    </div>
  );
}

function WarmCream({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  const brown = "#3e2210";
  const accent = "#c8874a";
  return (
    <div style={{ width: "100%", height: "100%", background: "#f5ede0", fontFamily: font.css, direction: "rtl", textAlign: "center", position: "relative" }}>
      {/* Top ornate border */}
      <div style={{ height: 20, background: `repeating-linear-gradient(135deg, ${accent} 0px, ${accent} 10px, #f5ede0 10px, #f5ede0 20px)` }} />
      <div style={{ height: 4, background: accent }} />
      <div style={{ height: 4, background: `${accent}66` }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 60px", gap: 26 }}>
        <p style={{ fontSize: 24, color: accent, margin: 0, letterSpacing: "0.06em" }}>
          ✦ بسم الله الرحمن الرحيم ✦
        </p>

        <PhotoCircle url={form.imageDataUrl} filter={form.imageFilter} brightness={form.imageBrightness} borderColor={accent} size={260} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 60, height: 1, background: accent }} />
          <p style={{ fontSize: 20, color: accent, margin: 0 }}>✦</p>
          <div style={{ width: 60, height: 1, background: accent }} />
        </div>

        {form.name ? (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: brown, margin: 0, lineHeight: 1.5 }}>
            {form.name}
          </p>
        ) : (
          <p style={{ fontSize: form.headingSize * 0.8, color: brown, margin: 0, opacity: 0.4 }}>اسم المتوفى</p>
        )}

        <OrnamentLine color={accent} />

        <p style={{ fontSize: form.bodySize, color: "#5a3a1e", margin: 0, lineHeight: 1.9, maxWidth: 820, fontStyle: "italic" }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: "#7a5a3e", margin: 0, lineHeight: 1.9 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          {form.familyName && <p style={{ fontSize: form.bodySize - 4, fontWeight: 600, color: brown, margin: "0 0 8px" }}>{form.familyName}</p>}
          {form.date && <p style={{ fontSize: form.bodySize - 6, color: "#9a7a5e", margin: 0 }}>{form.date}</p>}
        </div>
      </div>

      {/* Bottom ornate border */}
      <div style={{ height: 4, background: `${accent}66` }} />
      <div style={{ height: 4, background: accent }} />
      <div style={{ height: 20, background: `repeating-linear-gradient(135deg, ${accent} 0px, ${accent} 10px, #f5ede0 10px, #f5ede0 20px)` }} />
    </div>
  );
}

function BlueCalm({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #0d2b5e 0%, #1565c0 70%, #1976d2 100%)", fontFamily: font.css, direction: "rtl", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 60px 50px", gap: 28, height: "100%", boxSizing: "border-box" }}>
        {/* Top crescent ornament */}
        <p style={{ fontSize: 24, color: "#90caf9", margin: 0, letterSpacing: "0.08em" }}>
          ☽ بسم الله الرحمن الرحيم ☾
        </p>

        <PhotoCircle url={form.imageDataUrl} filter={form.imageFilter} brightness={form.imageBrightness} borderColor="#90caf9" size={280} />

        <div style={{ width: 200, height: 2, background: "linear-gradient(90deg, transparent, #90caf9, transparent)" }} />

        {form.name ? (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: 1.5 }}>
            {form.name}
          </p>
        ) : (
          <p style={{ fontSize: form.headingSize * 0.8, color: "#64b5f6", margin: 0, opacity: 0.5 }}>اسم المتوفى</p>
        )}

        <div style={{ width: 300, height: 1, background: "rgba(144,202,249,0.4)" }} />

        <p style={{ fontSize: form.bodySize, color: "rgba(255,255,255,0.88)", margin: 0, lineHeight: 1.9, maxWidth: 820 }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.9 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          <div style={{ width: 120, height: 1, background: "#90caf966", margin: "0 auto 16px" }} />
          {form.familyName && <p style={{ fontSize: form.bodySize - 4, color: "#90caf9", margin: "0 0 8px" }}>{form.familyName}</p>}
          {form.date && <p style={{ fontSize: form.bodySize - 6, color: "rgba(255,255,255,0.55)", margin: 0 }}>{form.date}</p>}
        </div>
      </div>
    </div>
  );
}

function SoftRose({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  const deepRose = "#880e4f";
  const rose = "#c2185b";
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #fde8ef 0%, #fce4ec 50%, #f8bbd9 100%)", fontFamily: font.css, direction: "rtl", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 60px 48px", gap: 26, height: "100%", boxSizing: "border-box" }}>
        <p style={{ fontSize: 22, color: rose, margin: 0, letterSpacing: "0.06em" }}>
          ❀ بسم الله الرحمن الرحيم ❀
        </p>

        <PhotoCircle url={form.imageDataUrl} filter={form.imageFilter} brightness={form.imageBrightness} borderColor={rose} size={270} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 80, height: 1, background: rose, opacity: 0.5 }} />
          <div style={{ width: 6, height: 6, background: rose, borderRadius: "50%", opacity: 0.7 }} />
          <div style={{ width: 80, height: 1, background: rose, opacity: 0.5 }} />
        </div>

        {form.name ? (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: deepRose, margin: 0, lineHeight: 1.5 }}>
            {form.name}
          </p>
        ) : (
          <p style={{ fontSize: form.headingSize * 0.8, color: deepRose, margin: 0, opacity: 0.4 }}>اسم المتوفى</p>
        )}

        <OrnamentLine color={rose} />

        <p style={{ fontSize: form.bodySize, color: "#4a1228", margin: 0, lineHeight: 1.9, maxWidth: 820 }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: "#6d2040", margin: 0, lineHeight: 1.9 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          {form.familyName && <p style={{ fontSize: form.bodySize - 4, fontWeight: 600, color: deepRose, margin: "0 0 8px" }}>{form.familyName}</p>}
          {form.date && <p style={{ fontSize: form.bodySize - 6, color: "#9a5070", margin: 0 }}>{form.date}</p>}
        </div>
      </div>
    </div>
  );
}

function BalancedGray({ form, palette: _palette, font }: { form: BuilderForm; palette: ColorPalette; font: Font }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#555555", fontFamily: font.css, direction: "rtl", textAlign: "center" }}>
      {/* Top bar */}
      <div style={{ height: 8, background: "#d0d0d0" }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 60px 48px", gap: 28, height: "calc(100% - 16px)", boxSizing: "border-box" }}>
        <p style={{ fontSize: 22, color: "#d0d0d0", margin: 0, letterSpacing: "0.08em" }}>
          بسم الله الرحمن الرحيم
        </p>

        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.25)" }} />

        <PhotoCircle url={form.imageDataUrl} filter={form.imageFilter} brightness={form.imageBrightness} borderColor="#d0d0d0" size={270} />

        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.25)" }} />

        {form.name ? (
          <p style={{ fontSize: form.headingSize, fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: 1.5 }}>
            {form.name}
          </p>
        ) : (
          <p style={{ fontSize: form.headingSize * 0.8, color: "#d0d0d0", margin: 0, opacity: 0.4 }}>اسم المتوفى</p>
        )}

        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.25)" }} />

        <p style={{ fontSize: form.bodySize, color: "rgba(255,255,255,0.88)", margin: 0, lineHeight: 1.9, maxWidth: 820 }}>
          {form.phrase}
        </p>

        {form.extraText && (
          <p style={{ fontSize: form.bodySize - 4, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.9 }}>
            {form.extraText}
          </p>
        )}

        <div style={{ marginTop: "auto" }}>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.25)", marginBottom: 20 }} />
          {form.familyName && <p style={{ fontSize: form.bodySize - 4, color: "#d0d0d0", margin: "0 0 8px" }}>{form.familyName}</p>}
          {form.date && <p style={{ fontSize: form.bodySize - 6, color: "rgba(255,255,255,0.55)", margin: 0 }}>{form.date}</p>}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ height: 8, background: "#d0d0d0" }} />
    </div>
  );
}

// ─── Main Card Preview ────────────────────────────────────────────────────────

export const CondolenceCardPreview = forwardRef<HTMLDivElement, CardProps>(function CondolenceCardPreview({ form, isExport = false }, ref) {
  const palette = PALETTES.find((p) => p.id === form.paletteId)!;
  const font = FONTS.find((f) => f.id === form.fontId)!;

  const inner = (() => {
    switch (form.templateId) {
      case "classic-elegant": return <ClassicElegant form={form} palette={palette} font={font} />;
      case "dark-luxury":     return <DarkLuxury form={form} palette={palette} font={font} />;
      case "islamic-green":   return <IslamicGreen form={form} palette={palette} font={font} />;
      case "modern-minimal":  return <ModernMinimal form={form} palette={palette} font={font} />;
      case "warm-cream":      return <WarmCream form={form} palette={palette} font={font} />;
      case "blue-calm":       return <BlueCalm form={form} palette={palette} font={font} />;
      case "soft-rose":       return <SoftRose form={form} palette={palette} font={font} />;
      case "balanced-gray":   return <BalancedGray form={form} palette={palette} font={font} />;
      default:                return <ClassicElegant form={form} palette={palette} font={font} />;
    }
  })();

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        position: "relative",
        overflow: "hidden",
        borderRadius: isExport ? 0 : 0,
        flexShrink: 0,
      }}
    >
      {inner}
    </div>
  );
});
