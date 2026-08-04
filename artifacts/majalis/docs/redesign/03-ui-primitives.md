# Checkpoint 3 — UI Primitives (IGDS)

## المكوّنات (`src/components/igds/`)
| مكوّن | الملف |
|-------|------|
| AppShell | `IgdsAppShell.tsx` |
| Button | `IgdsButton.tsx` |
| Card | `IgdsCard.tsx` |
| Badge | `IgdsBadge.tsx` |
| PageHeader | `IgdsPageHeader.tsx` |
| SectionHeader | `IgdsSectionHeader.tsx` |
| SearchInput | `IgdsSearchInput.tsx` |
| FilterChips | `IgdsFilterChips.tsx` |
| Loading / Empty / Error / Skeleton | `IgdsStates.tsx` |

## الأنماط
`src/styles/igds/components.css` — يُحمَّل مع `IgdsAppShell` (أو أي استيراد من barrel عبر AppShell لاحقاً).

## قاعدة الاستبدال
في Checkpoints التالية: OldButton/Card/Header/Nav/Loading → مكافئ IGDS. لا خليط بصري على الشاشات المعاد تصميمها.
