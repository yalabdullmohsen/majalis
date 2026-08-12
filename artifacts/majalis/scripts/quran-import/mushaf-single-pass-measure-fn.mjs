/**
 * تمريرة قياس واحدة لصفحة مصحف — تُجمَع كل المقاييس داخل evaluate واحدة.
 * تُحقَن كنص عبر addInitScript ثم تُستدعى من الصفحة.
 */
export { MUSHAF_REF_VIEWPORT as MEASURE_VIEWPORT } from "./mushaf-viewports.mjs";
export { resolveGateViewport } from "./mushaf-viewports.mjs";

/** مصدر المتصفح — يعرّف window.__mushafSinglePassMeasure */
export const MUSHAF_SINGLE_PASS_MEASURE_SOURCE = `
window.__mushafSinglePassMeasure = function __mushafSinglePassMeasure(expectedPage) {
  /* إظهار شريط الأدوات للقياس (تراكب / نطاقات) */
  document.querySelector(".quran-shell--ayah")?.classList.remove("quran-shell--chrome-hidden");
  document.querySelector(".mpv-toolbar--ayah")?.classList.remove("mpv-toolbar--hidden");

  const root = window.__mushafLinesRoot?.();
  const active = window.__mushafActiveRoot?.();
  if (!root || !active) return { error: "no active lines", page: expectedPage ?? null };

  const rectOf = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top, bottom: r.bottom, left: r.left, right: r.right,
      width: r.width, height: r.height,
      midX: (r.left + r.right) / 2, midY: (r.top + r.bottom) / 2,
    };
  };
  const inkBounds = (el) => {
    if (!el) return null;
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      if (rects.length) {
        return {
          top: Math.min(...rects.map((r) => r.top)),
          bottom: Math.max(...rects.map((r) => r.bottom)),
          left: Math.min(...rects.map((r) => r.left)),
          right: Math.max(...rects.map((r) => r.right)),
        };
      }
    } catch (_) { /* fall through */ }
    return rectOf(el);
  };
  const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) || 0 : 0);
  const ov = (a, b) => {
    if (!a || !b) return { ox: 0, oy: 0, area: 0 };
    const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return { ox, oy, area: ox * oy };
  };

  const cr = root.getBoundingClientRect();
  const blockH = Math.max(1, cr.height);
  const limitBot = cr.bottom + 0.5;
  const limitTop = cr.top - 0.5;

  const lineEls = (() => {
    const slotted = window.__mushafQueryAll(".mf2-grid-slot--line .mf2-line");
    return slotted.length ? slotted : window.__mushafQueryAll(".mf2-line");
  })();

  const lines = [];
  let visibleFull = 0;
  let clipped = 0;
  let missingInk = 0;
  const clipDetails = [];
  for (const el of lineEls) {
    const text = (el.textContent || "").trim();
    const slotEl = el.closest("[data-grid-slot]");
    const slot = Number(slotEl?.getAttribute("data-grid-slot") || 0);
    const box = rectOf(el);
    const ink = inkBounds(el);
    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    const fontSize = px(el);
    if (!text) {
      missingInk += 1;
      lines.push({ slot, hasText: false, box, ink, scrollWidth, clientWidth, fontSize, fullyInside: false, clipped: false });
      continue;
    }
    const top = ink?.top ?? box?.top ?? 0;
    const bot = ink?.bottom ?? box?.bottom ?? 0;
    const fullyInside = top >= limitTop && bot <= limitBot;
    const partiallyOut = bot > limitBot + 0.5 || top < limitTop - 0.5;
    if (fullyInside) visibleFull += 1;
    else if (partiallyOut) {
      clipped += 1;
      clipDetails.push({
        line: el.getAttribute("data-line"),
        overBot: +(bot - limitBot).toFixed(2),
        overTop: +(limitTop - top).toFixed(2),
      });
    }
    lines.push({
      slot, hasText: true, box, ink, scrollWidth, clientWidth, fontSize,
      fullyInside, clipped: partiallyOut && !fullyInside,
      overBot: +(bot - limitBot).toFixed(2),
      overTop: +(limitTop - top).toFixed(2),
      dataLine: el.getAttribute("data-line"),
    });
  }

  const overflowBad = [];
  for (const sel of [".mf2-lines", ".mf2-grid-slot", ".mf2-line", ".mf2-grid-slot--line"]) {
    for (const el of window.__mushafQueryAll(sel).slice(0, 4)) {
      const cs = getComputedStyle(el);
      if (cs.overflowY === "hidden" || cs.overflowY === "clip" || cs.overflow === "hidden" || cs.overflow === "clip") {
        overflowBad.push({ sel, overflowY: cs.overflowY, overflow: cs.overflow });
      }
    }
  }

  const sideClear = 2;
  const hOverflow = [];
  for (const ln of lines) {
    if (!ln.ink || !ln.hasText) continue;
    const overL = Math.max(0, cr.left + sideClear - ln.ink.left);
    const overR = Math.max(0, ln.ink.right - (cr.right - sideClear));
    if (overL > 0.35 || overR > 0.35) hOverflow.push({ slot: ln.slot, overL, overR });
  }

  const bannerSlot = root.querySelector(".mf2-grid-slot--banner");
  const banner = root.querySelector(".mf2-surah-banner");
  const bannerBox = rectOf(banner || bannerSlot);
  const bannerSvg = banner?.querySelector("svg");
  const wingParts = bannerSvg ? {
    medallion: bannerSvg.querySelectorAll('[data-wing-part="medallion"]').length,
    spiral: bannerSvg.querySelectorAll('[data-wing-part="spiral"]').length,
    mesh: bannerSvg.querySelectorAll('[data-wing-part="mesh"]').length,
    knot: bannerSvg.querySelectorAll('[data-wing-part="knot"]').length,
    pattern: bannerSvg.querySelectorAll("pattern").length,
  } : null;

  const basmalaEl =
    root.querySelector(".mf2-grid-slot--basmala .mf2-bismillah") ||
    root.querySelector(".mf2-bismillah");
  const basmalaStacked = root.querySelector(".mf2-bismillah--stacked");
  const basmalaBox = rectOf(basmalaEl);
  const basmalaInk = inkBounds(basmalaEl);
  let basmalaGap = null;
  let stacked = false;
  if (bannerBox && basmalaEl && root.querySelector(".mf2-grid-slot--basmala")) {
    basmalaGap = basmalaEl.getBoundingClientRect().top - (banner || bannerSlot).getBoundingClientRect().bottom;
  } else if (bannerSlot && basmalaStacked) {
    stacked = true;
    const nextLine = root.querySelector(".mf2-grid-slot--line .mf2-line");
    if (nextLine) {
      basmalaGap = nextLine.getBoundingClientRect().top - basmalaStacked.getBoundingClientRect().bottom;
    }
  }

  const slots = [...root.querySelectorAll("[data-grid-slot]")].map((el) => {
    const inkEl =
      el.querySelector(".mf2-line, .mf2-bismillah, .mf2-surah-banner, .mf2-surah-header__cartouche, .mf2-surah-header") || el;
    /* نفس بوابة ink-collision: صندوق العنصر لا Range (لتفادي تقاطع تشكيلي كاذب) */
    const r = rectOf(inkEl);
    const kind = el.classList.contains("mf2-grid-slot--basmala")
      ? "basmala"
      : el.classList.contains("mf2-grid-slot--banner")
        ? "banner"
        : "line";
    return {
      slot: Number(el.getAttribute("data-grid-slot") || 0),
      kind,
      top: r?.top ?? 0, bottom: r?.bottom ?? 0, left: r?.left ?? 0, right: r?.right ?? 0,
      h: r?.height ?? 0,
    };
  }).filter((s) => s.h > 2 && s.bottom > s.top);

  const OVERLAP_EPS = 1.5;
  const inkOverlaps = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      /* تداخل خانات الأسطر/الشارة متوقع (slotH ٧٫٢٪ > خطوة ٦٫٥٧٪) — نتجاهله.
       * البوابة تفشل عند تقاطع بسملة مع شارة أو آية. */
      if (a.kind === "line" && b.kind === "line") continue;
      if (a.kind === "banner" && b.kind === "banner") continue;
      if (
        (a.kind === "banner" && b.kind === "line") ||
        (b.kind === "banner" && a.kind === "line")
      ) {
        continue;
      }
      const critical = a.kind === "basmala" || b.kind === "basmala";
      if (!critical) continue;
      const yOverlap = a.top < b.bottom - OVERLAP_EPS && a.bottom > b.top + OVERLAP_EPS;
      const xOverlap = a.left < b.right - OVERLAP_EPS && a.right > b.left + OVERLAP_EPS;
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (yOverlap && xOverlap && overlapY > 2.5) {
        inkOverlaps.push({ a: a.kind + "@" + a.slot, b: b.kind + "@" + b.slot, y: overlapY });
      }
    }
  }

  const header = document.querySelector(".mpv-ayah-header");
  const footer = document.querySelector(".mpv-ayah-footer");
  const toolbar = document.querySelector(".mpv-toolbar--ayah:not(.mpv-toolbar--hidden), .mpv-toolbar--ayah, .mpv-toolbar");
  const cartouche = document.querySelector(".mpv-ayah-page-badge");
  const numeral = document.querySelector(".mpv-ayah-page-badge__num");
  const footerMeta = document.querySelector(".mpv-ayah-footer__meta");
  const bannerName = document.querySelector(".mf2-surah-banner__name");
  const shell = document.querySelector(".quran-shell--immersive.quran-shell--ayah, .quran-shell--ayah");
  const frame = active.querySelector("[data-opening-frame], .mf2-opening-frame");

  const headerBox = rectOf(header);
  const footerBox = rectOf(footer);
  const toolbarBox = rectOf(toolbar);
  const cartoucheBox = rectOf(cartouche);
  const pageCenterX = window.innerWidth / 2;

  let lastInkBot = -Infinity;
  let lastInk = null;
  for (const ln of lines) {
    if (!ln.ink) continue;
    if (ln.ink.bottom > lastInkBot) {
      lastInkBot = ln.ink.bottom;
      lastInk = ln.ink;
    }
  }

  const toolbarOverlaps = [];
  if (toolbarBox) {
    for (const ln of lines) {
      if (!ln.ink) continue;
      const o = ov(toolbarBox, ln.ink);
      if (o.ox > 0.5 && o.oy > 0.5) toolbarOverlaps.push({ slot: ln.slot, ox: o.ox, oy: o.oy });
    }
    if (bannerBox) {
      const o = ov(toolbarBox, bannerBox);
      if (o.ox > 0.5 && o.oy > 0.5) toolbarOverlaps.push({ slot: "banner", ox: o.ox, oy: o.oy });
    }
    if (cartoucheBox) {
      const o = ov(toolbarBox, cartoucheBox);
      if (o.ox > 0.5 && o.oy > 0.5) toolbarOverlaps.push({ slot: "cartouche", ox: o.ox, oy: o.oy });
    }
  }

  const ayahLineEls = lineEls;
  const hasBasSlot = Boolean(root.querySelector(".mf2-grid-slot--basmala"));
  const firstAyah = hasBasSlot ? ayahLineEls[0] : ayahLineEls[1];
  const ayahOnly = hasBasSlot ? ayahLineEls : ayahLineEls.slice(1);
  let bannerToBas = null;
  let basToLine = null;
  const banEl = banner || bannerSlot;
  if (banEl && basmalaEl) {
    bannerToBas = basmalaEl.getBoundingClientRect().top - banEl.getBoundingClientRect().bottom;
  }
  if (basmalaEl && firstAyah) {
    const bi = inkBounds(basmalaEl);
    const fi = inkBounds(firstAyah);
    if (bi && fi) basToLine = fi.top - bi.bottom;
  }

  const inkSorted = lines.filter((l) => l.hasText && l.ink).map((l) => l.ink).sort((a, b) => a.top - b.top);
  const lineGaps = [];
  for (let i = 1; i < inkSorted.length; i++) lineGaps.push(inkSorted[i].top - inkSorted[i - 1].bottom);

  const ayahInkGaps = [];
  const ayahHeights = [];
  for (let i = 0; i < ayahOnly.length; i++) {
    ayahHeights.push(ayahOnly[i].getBoundingClientRect().height);
    if (i < ayahOnly.length - 1) {
      const ai = inkBounds(ayahOnly[i]);
      const bi = inkBounds(ayahOnly[i + 1]);
      if (ai && bi) ayahInkGaps.push(bi.top - ai.bottom);
    }
  }
  const lineGapAvg = ayahInkGaps.length
    ? ayahInkGaps.reduce((a, b) => a + b, 0) / ayahInkGaps.length
    : (lineGaps.length ? lineGaps.reduce((a, b) => a + b, 0) / lineGaps.length : null);
  const lineGapMin = ayahInkGaps.length ? Math.min(...ayahInkGaps) : (lineGaps.length ? Math.min(...lineGaps) : null);
  const avgLineH = ayahHeights.length ? ayahHeights.reduce((a, b) => a + b, 0) / ayahHeights.length : null;

  const baselines = [...root.querySelectorAll(".mf2-grid-slot--line[data-grid-slot]")].map((el) => {
    const slot = Number(el.getAttribute("data-grid-slot") || 0);
    const r = el.getBoundingClientRect();
    return {
      slot,
      mid: r.top + r.height / 2,
      centerPct: (((r.top + r.height / 2) - cr.top) / blockH) * 100,
      topPct: ((r.top - cr.top) / blockH) * 100,
      heightPct: (r.height / blockH) * 100,
    };
  });

  const S = px(root) || parseFloat(getComputedStyle(root).getPropertyValue("--mushaf-S")) || 0;
  const openingFlag = root.dataset.mf2Opening === "1" || root.classList.contains("mf2-lines--opening");
  const bannerTopPct = bannerBox ? ((bannerBox.top - cr.top) / blockH) * 100 : null;
  const bannerTopPx = bannerBox ? bannerBox.top - cr.top : null;

  const stretched = window.__mushafQueryAll(".mf2-line").filter((el) => {
    const sx =
      el.style.getPropertyValue("--mf2-line-sx").trim() ||
      getComputedStyle(el).getPropertyValue("--mf2-line-sx").trim();
    return sx && sx !== "1" && Number(sx) > 1.02;
  }).length;

  const gapToCart = cartoucheBox && lastInkBot > 0 ? cartoucheBox.top - lastInkBot : null;
  const toolbarTop = toolbarBox && toolbarBox.height > 1 ? toolbarBox.top : (footerBox ? footerBox.bottom : null);
  const gapToToolbar = cartoucheBox && toolbarTop != null ? toolbarTop - cartoucheBox.bottom : null;
  const inkToContentBot = lastInk ? cr.bottom - lastInk.bottom : null;

  const shellRect = shell?.getBoundingClientRect();
  const linesStyle = getComputedStyle(root);
  const shellPos = shell ? getComputedStyle(shell).position : null;

  const ayahMarkers = window.__mushafQueryAll(
    '[data-ayah-numeral], .mf2-ayah-marker, .mf2-word--ayah-end',
  ).length;

  return {
    error: null,
    page: Number(expectedPage) || Number(root.closest("[data-page]")?.getAttribute("data-page") || 0) || null,
    contentBand: { top: cr.top, bottom: cr.bottom, left: cr.left, right: cr.right, height: cr.height, width: cr.width },
    dataset: {
      mf2Size: root.dataset.mf2Size || null,
      mf2ContentBand: root.dataset.mf2ContentBand || null,
      mf2InkBotClear: root.dataset.mf2InkBotClear || null,
      mf2BannerTopPct: root.dataset.mf2BannerTopPct || null,
      mf2BasmalaGap: root.dataset.mf2BasmalaGap || null,
      mf2LineGapAvg: root.dataset.mf2LineGapAvg || null,
      mf2Opening: root.dataset.mf2Opening || null,
    },
    lines,
    lineDom: lines.length,
    visibleFull,
    clipped,
    missingInk,
    clipDetails: clipDetails.slice(0, 8),
    overflowBad,
    hOverflow,
    slots,
    inkOverlaps,
    stacked,
    basmalaGap,
    banner: bannerBox ? {
      ...bannerBox,
      topPct: bannerTopPct,
      topPx: bannerTopPx,
      heightPct: (bannerBox.height / blockH) * 100,
      ornament: banner?.getAttribute("data-ornament") || null,
      densityTarget: banner?.getAttribute("data-wing-density-target") || null,
      wingParts,
    } : null,
    basmala: basmalaBox ? { ...basmalaBox, ink: basmalaInk, gapFromBanner: basmalaGap, stacked } : null,
    header: headerBox,
    footer: footerBox,
    toolbar: toolbarBox ? {
      ...toolbarBox,
      overlaps: toolbarOverlaps,
      cssBottom: toolbar ? getComputedStyle(toolbar).bottom : null,
    } : null,
    cartouche: cartoucheBox ? {
      ...cartoucheBox,
      pageCenterX,
      centerDx: Math.abs(cartoucheBox.midX - pageCenterX),
      gapToCart,
      gapToToolbar,
    } : null,
    lastInk,
    gapContentFooter: footerBox && lastInk ? footerBox.top - lastInk.bottom : null,
    layoutOverlaps: {
      badgeInk: ov(cartoucheBox, lastInk),
      metaInk: ov(rectOf(footerMeta), lastInk),
      toolbarInk: ov(toolbarBox, lastInk),
      toolbarBadge: ov(toolbarBox, cartoucheBox),
      toolbarBanner: ov(toolbarBox, bannerBox),
      toolbarFrame: ov(toolbarBox, rectOf(frame)),
      toolbarLines: ov(toolbarBox, { top: cr.top, bottom: cr.bottom, left: cr.left, right: cr.right }),
    },
    typescale: {
      S,
      body: S,
      basmala: px(basmalaEl),
      surahBanner: px(bannerName),
      pageNumeral: px(numeral),
      headerMeta: px(header),
      footerHizb: px(footerMeta),
    },
    baselines,
    lineGaps,
    lineGapAvg,
    lineGapMin,
    avgLineH,
    gapOverS: lineGapMin != null && S ? lineGapMin / S : null,
    ayahMarkers,
    stretched,
    opening: {
      isOpening: openingFlag,
      hasFrame: Boolean(frame),
      bannerTopPct,
      bannerTopPx,
      bannerToBas,
      basToLine,
      stretched,
      inkToCart: gapToCart,
      inkToContentBot,
      fontSizes: ayahOnly.map((el) => px(el)),
    },
    render: {
      lineCount: lineEls.length,
      nonEmptyLines: lines.filter((l) => l.hasText).length,
      shellTop: shellRect ? Math.round(shellRect.top) : null,
      shellHeight: shellRect ? Math.round(shellRect.height) : null,
      position: shellPos,
      linesOpacity: linesStyle.opacity,
      linesDisplay: linesStyle.display,
      inViewport: !!shellRect && shellRect.top < window.innerHeight && shellRect.bottom > 0 && shellRect.height > 40,
    },
    vh: window.innerHeight,
    vw: window.innerWidth,
  };
};
`;
