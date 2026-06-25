import type { FiqhCouncilItem } from "./fiqh-council-types";
import { FIQH_ITEM_TYPE_LABELS, formatFiqhItemMeta } from "./fiqh-council-types";

function buildExportText(item: FiqhCouncilItem): string {
  const lines = [
    item.title,
    "═".repeat(40),
    formatFiqhItemMeta(item),
    "",
    item.summary ? `الملخص:\n${item.summary}` : "",
    item.ruling_text ? `\nالحكم:\n${item.ruling_text}` : "",
    item.content ? `\nالمحتوى:\n${item.content.replace(/\*\*/g, "")}` : "",
    item.key_points?.length ? `\nالنقاط الرئيسية:\n${item.key_points.map((p) => `• ${p}`).join("\n")}` : "",
    item.evidence?.length
      ? `\nالأدلة:\n${item.evidence.map((e) => `- ${e.type || ""}: ${e.text}${e.source ? ` (${e.source})` : ""}`).join("\n")}`
      : "",
    item.source_name ? `\nالمصدر: ${item.source_name}` : "",
    item.source_url ? `الرابط: ${item.source_url}` : "",
    "",
    "— المجلس العلمي — المجمع الفقهي الإسلامي",
  ].filter(Boolean);

  return lines.join("\n");
}

export function downloadFiqhItemTxt(item: FiqhCouncilItem) {
  const text = buildExportText(item);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fiqh-${item.slug}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printFiqhItemPdf(item: FiqhCouncilItem) {
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${item.title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 2rem; line-height: 1.8; color: #1a1a1a; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #1b5e3b; padding-bottom: 0.5rem; }
    .meta { color: #555; font-size: 0.9rem; margin: 0.5rem 0 1.5rem; }
    h2 { font-size: 1.1rem; color: #1b5e3b; margin-top: 1.5rem; }
    ul { padding-right: 1.5rem; }
    footer { margin-top: 2rem; font-size: 0.8rem; color: #888; border-top: 1px solid #ddd; padding-top: 1rem; }
  </style>
</head>
<body>
  <h1>${item.title}</h1>
  <p class="meta">${formatFiqhItemMeta(item)} · ${FIQH_ITEM_TYPE_LABELS[item.type]}</p>
  ${item.summary ? `<h2>الملخص</h2><p>${item.summary}</p>` : ""}
  ${item.ruling_text ? `<h2>الحكم</h2><p>${item.ruling_text}</p>` : ""}
  ${item.content ? `<h2>المحتوى</h2><div>${item.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")}</div>` : ""}
  ${item.key_points?.length ? `<h2>النقاط الرئيسية</h2><ul>${item.key_points.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
  ${item.source_name ? `<p><strong>المصدر:</strong> ${item.source_name}${item.source_url ? ` — <a href="${item.source_url}">${item.source_url}</a>` : ""}</p>` : ""}
  <footer>المجلس العلمي — المجمع الفقهي الإسلامي</footer>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
