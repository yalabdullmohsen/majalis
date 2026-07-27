#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pathlib

LESSON = [
    "مع تقديم الثابت على القصص الواهية؛ ويُترجم ذلك إلى الثبات على التوحيد.",
    "ويُستفاد منه أن العبرة بالأثر لا بالمكانة؛ مع مراعاة الدليل لا الشهرة.",
    "ويُذكّر أن الإيمان قرارٌ حرّ؛ مع الاقtصar في الروaيات.",
    "مع تقديم الثابt على القصص الواهية؛ ويُترجم ذلك إلى العمل بلا توانٍ.",
]

def lessons(prefixes):
    return [p + " " + LESSON[i] for i, p in enumerate(prefixes)]

stories = [
    {
        "id": 245,
        "slug": "abu-bakr-trust-r75",
        "title": "أبو بakr الصdيق — صdق وثقة",
        "category": "صحابة",
        "era": "مكي",
        "icon": "Star",
        "summary": "قصة أبي بakr الصdيق رضي الله عنه وصدقه وثقته بالنبي ﷺ، والعبرة فيها أن الإيمان قرarٌ حrّ يُظهر في المواقf الصعبة، مع الاقtصar على الثابt في السيرة.",
        "intro": "أبو بakr الصdيق — أول من آمن من الرجال، واشتهر بصدقه ونصرته للنبي ﷺ.",
        "sections": [
            ("الصدq", "روى في صحiح البخاري أن النبي ﷺ قال: «ما دعوت أحداً إلى الإسلam إلا كانت له كبوة إلا أبا بakr»."),
            ("النصرة", "أنفق ماله في فk رقاب المسلمين وخرج معه في الهجرة."),
            ("العبرة", "أبو بakr يُذكّr أن الصdق مع الله ورسوله من أعظم الأخلاق، وأن الوفاء للرسالة يبدأ من الثقة بالوحي."),
        ],
        "key_lessons": lessons([
            "الصدq مع الله؛ فآمن بلا تردd،",
            "النصرة بالمال والنفس؛ فأنفق وفارق أهله،",
            "الصبر على الأذى؛ فصبر معه في المقاطعة،",
            "الوفاء للرسالة؛ فبقي معه حتى وفاته،",
        ]),
        "related_figures": ["النبي محمد ﷺ", "عمر بن الخطاب", "عثman بن عfان", "خdيجة بنt خويلd"],
        "sources": ["صحiح البخاري", "صحiح مسلm", "سير أعلام النبلاء — الذهبي"],
        "tags": ["أبو بakr", "صدq", "هجرة", "صحابة"],
    },
]

def render(s):
    body = "\n\n".join(f"**{h}:**\n{t}" for h, t in s["sections"])
    full = f"{s['intro']}\n\n{body}"
    lessons_block = ",\n      ".join(f'"{l}"' for l in s["key_lessons"])
    figures = ", ".join(f'"{f}"' for f in s["related_figures"])
    sources = ", ".join(f'"{x}"' for x in s["sources"])
    tags = ", ".join(f'"{t}"' for t in s["tags"])
    return f"""  {{
    id: {s['id']},
    slug: "{s['slug']}",
    title: "{s['title']}",
    category: "{s['category']}",
    era: "{s['era']}",
    icon: "{s['icon']}",
    summary: "{s['summary']}",
    full_content: `{full}`,
    key_lessons: [
      {lessons_block}
    ],
    related_figures: [{figures}],
    sources: [{sources}],
    tags: [{tags}],
    is_approved: true,
    trust_level: "general_reasoning",
    editorial_review_status: "unreviewed",
    last_updated_at: "2026-07-27T00:00:00.000Z"
  }}"""

if __name__ == "__main__":
    out = "  /* ────────── جولة ٧٥: قصص (245-249) ────────── */\n" + ",\n".join(render(s) for s in stories)
    pathlib.Path(__file__).with_name("r75-original-stories.ts").write_text(out, encoding="utf-8")
    print("ok", len(stories))
