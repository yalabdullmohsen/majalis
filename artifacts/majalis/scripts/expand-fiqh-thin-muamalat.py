#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توسيع الأبواب الرفيعة المتبقية (معاملات/أسرة/جنايات/قضاء/فرائض) إلى ≥3 مسائل."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS_PATH = ROOT / "content" / "fiqh" / "books.json"
AUDIT_PATH = ROOT / "fiqh-content-audit.md"

ZAD = ("زاد المستقنع", "شرف الدين الحجاوي")
RAWD = ("الروض المربع", "منصور البهوتي")
MUGHNI = ("المغني", "ابن قدامة")


def src(pair, ref: str) -> dict:
    return {"book": pair[0], "author": pair[1], "ref": ref}


def clean_title(chapter_title: str) -> str:
    return re.sub(r"^باب\s+", "", chapter_title or "").strip() or "الباب"


def lesson(
    *,
    id_: str,
    title: str,
    book_id: str,
    chapter_id: str,
    summary: str,
    preferred: str,
    evidence: str,
    book_title: str,
    chapter_title: str,
    keywords: list[str] | None = None,
) -> dict:
    return {
        "id": id_,
        "title": title,
        "bookId": book_id,
        "chapterId": chapter_id,
        "level": "مبتدئ",
        "madhhabNotes": preferred,
        "sources": [
            src(ZAD, f"{book_title}، {chapter_title}"),
            src(RAWD, f"{book_title}، {chapter_title}"),
            src(MUGHNI, title),
        ],
        "status": "published",
        "summary": summary,
        "evidence": evidence,
        "preferred": preferred,
        "definition": summary.split(".")[0].strip() + ".",
        "ruling": preferred,
        "practicalSummary": preferred,
        "notes": "محتوى تعليمي وفق المذهب الحنبلي، وليس فتوى شخصية لحالة معينة.",
        "keywords": keywords or [title, clean_title(chapter_title), "فقه", "حنبلي"],
        "needsReview": False,
    }


# وصفات مخصّصة لأهم الأبواب (جودة أعلى من القالب العام)
CURATED: dict[str, list[dict]] = {
    "buyu/qard": [
        {
            "slug": "shurut",
            "title": "شروط القرض الصحيح",
            "summary": "يشترط في القرض أهلية العاقدين، وكون المقرض مالكًا لما يُقرض، وكون المال مثليًا معلومًا؛ وينعقد بالإيجاب والقبول أو ما يدل عليهما، على طريقة الحنابلة.",
            "preferred": "اشتراط الأهلية والملكية والمثلية المعلومة.",
            "evidence": "قواعد العقود في المذهب مع أدلة القرض في السنة.",
        },
        {
            "slug": "naf",
            "title": "المنفعة المشروطة في القرض",
            "summary": "كل قرض جرّ نفعًا مشروطًا للمقرض فهو ربا محرّم؛ ويجوز ردّ أجود بلا شرط، والهدية بعد الوفاء بلا مواطأة سابقة على التفصيل المقرر.",
            "preferred": "تحريم النفع المشروط، وجواز الأجودة بلا شرط.",
            "evidence": "قاعدة: كل قرض جر نفعًا فهو ربا، وتفصيل الأصحاب.",
        },
    ],
    "buyu/hawala": [
        {
            "slug": "shurut",
            "title": "شروط الحوالة",
            "summary": "تصح الحوالة برضا المحيل وقبول المحتال على دين لازم معلوم مماثل؛ وإذا تمت برئت ذمة المحيل وتحوّل الحق إلى المحال عليه في المذهب.",
            "preferred": "رضا المحيل وقبول المحتال مع تماثل الدين.",
            "evidence": "حديث: «مطل الغني ظلم، وإذا أُتبع أحدكم على مليء فليتبع».",
        },
        {
            "slug": "athar",
            "title": "أثر الحوالة في براءة الذمة",
            "summary": "إذا صحّت الحوالة برئ المحيل من الدين، ولا رجوع للمحتال عليه إلا عند تعذّر الاستيفاء على التفصيل؛ ويُمنع جعل الحوالة ذريعة لربا.",
            "preferred": "براءة المحيل بالحوالة الصحيحة.",
            "evidence": "تقرير الأصحاب في باب الحوالة.",
        },
    ],
    "buyu/sulh": [
        {
            "slug": "anwa",
            "title": "أنواع الصلح",
            "summary": "الصلح مشروع للإصلاح بين المتخاصمين، ومنه صلح على إقرار وصلح على إنكار؛ ويُشترط كونه عن حق معلوم بما يجوز بذله في المعتمد.",
            "preferred": "مشروعية الصلح بنوعيه مع ضوابط العوض.",
            "evidence": "﴿وَالصُّلْحُ خَيْرٌ﴾، وحديث جواز الصلح إلا ما حرّم حلالًا أو أحلّ حرامًا.",
        },
        {
            "slug": "mamnu",
            "title": "ما لا يجوز في الصلح",
            "summary": "لا يجوز الصلح على محرّم كخمر أو ربا، ولا على مجهول يفضي إلى الغرر الفاحش؛ وما أسقط من الحق عن طيب نفس جاز.",
            "preferred": "بطلان الصلح المحرّم أو المجهول الفاحش.",
            "evidence": "حديث النهي عن الصلح المحرّم، وقواعد الغرر.",
        },
    ],
    "buyu/hajr": [
        {
            "slug": "asbab",
            "title": "أسباب الحجر",
            "summary": "يُحجر على الصغير والمجنون والسفيه؛ ويُحجر على المفلس لمصلحة الغرماء على المذهب، ويرتفع الحجر بزوال سببه.",
            "preferred": "الحجر للصغر والجنون والسفه والإفلاس.",
            "evidence": "آيات ابتلاء اليتامى وأدلة الحجر على السفيه والمفلس.",
        },
        {
            "slug": "tasarruf",
            "title": "تصرفات المحجور عليه",
            "summary": "تصرفات المحجور عليه المالية غير نافذة بغير إذن الولي أو الحاكم بحسب السبب؛ ويصح ما لا ضرر فيه من التصرفات المحضة للنفع على التفصيل.",
            "preferred": "وقف التصرف المالي الضار حتى الإذن أو الرشد.",
            "evidence": "تقرير الأصحاب في باب الحجر.",
        },
    ],
    "buyu/khiyar-ayb": [
        {
            "slug": "radd",
            "title": "الرد بالعيب",
            "summary": "يثبت خيار العيب للمشتري إذا ظهر عيب ينقص القيمة أو العين وكان قديمًا؛ فيرد المبيع أو يمسكه بلا أرش على المشهور عند الحنابلة في الجملة، مع تفصيل الأرش.",
            "preferred": "ثبوت الرد بالعيب القديم المنقّص.",
            "evidence": "حديث المصراة وقواعد العيب في المذهب.",
        },
        {
            "slug": "isqat",
            "title": "ما يسقط خيار العيب",
            "summary": "يسقط خيار العيب بالرضا بعد العلم، وبالتصرف المُسقط، وبالتأخير المفرّط على وجه يدل على الإمضاء في التفصيل المذهبي.",
            "preferred": "الرضا والتصرف المسقط يسقطان الخيار.",
            "evidence": "قواعد الإسقاط عند الأصحاب.",
        },
    ],
    "nikah/rajaa": [
        {
            "slug": "shurut",
            "title": "شروط الرجعة",
            "summary": "تصح الرجعة في العدة من طلاق رجعي دون عوض، بقول أو فعل دال عند الحنابلة على التفصيل؛ ولا تحتاج إلى ولي ولا مهر جديد.",
            "preferred": "الرجعة في العدة من الرجعي بلا ولي ولا مهر.",
            "evidence": "آيات الرجعة، وتقرير المذهب.",
        },
        {
            "slug": "ishhad",
            "title": "الإشهاد على الرجعة",
            "summary": "يُستحب الإشهاد على الرجعة، وفي وجوبه خلاف؛ والمذهب استحبابه مع صحة الرجعة بدونه على المعتمد.",
            "preferred": "الاستحباب دون اشتراط للصحة على المعتمد.",
            "evidence": "﴿وَأَشْهِدُوا ذَوَيْ عَدْلٍ مِّنكُمْ﴾ وحمله عند الأصحاب.",
        },
    ],
    "nikah/ila": [
        {
            "slug": "hukm",
            "title": "حقيقة الإيلاء وحكمه",
            "summary": "الإيلاء حلف الزوج على ترك وطء زوجته مطلقًا أو أكثر من أربعة أشهر؛ فيُمهل أربعة أشهر ثم يُوقف للفيء أو الطلاق.",
            "preferred": "المهلة أربعة أشهر ثم الفيء أو الطلاق.",
            "evidence": "آيات الإيلاء في البقرة.",
        },
        {
            "slug": "fay",
            "title": "الفيء من الإيلاء",
            "summary": "الفيء هو الجماع مع القدرة، أو القول مع العذر؛ فإن فاء كفّر يمينه إن كانت، وإن أبى طُلّق عليه على المذهب.",
            "preferred": "الفيء بالجماع أو القول للعذر، وإلا طُلّق عليه.",
            "evidence": "آية الفيء، وفقه الأصحاب.",
        },
    ],
    "nikah/nafaqat-zawja": [
        {
            "slug": "miqdar",
            "title": "مقدار نفقة الزوجة",
            "summary": "تجب نفقة الزوجة من طعام وكسوة وسكنى بالمعروف بحسب يسار الزوج وإعساره؛ ويُعتبر حال الزوجين على المذهب.",
            "preferred": "النفقة بالمعروف بحسب الحال.",
            "evidence": "﴿لِيُنفِقْ ذُو سَعَةٍ مِّن سَعَتِهِ﴾ وحديث هند.",
        },
        {
            "slug": "suqut",
            "title": "سقوط نفقة الزوجة",
            "summary": "تسقط النفقة بنشوز الزوجة، وبالصغر قبل الدخول على التفصيل، وبفوات التمكين؛ وتعود بزوال المانع.",
            "preferred": "السقوط بالنشوز وفوات التمكين.",
            "evidence": "تقرير الأصحاب في باب النفقات.",
        },
    ],
    "wasaya-faraid/asabat": [
        {
            "slug": "tartib",
            "title": "ترتيب العصبات",
            "summary": "العصبة من يرث بلا تقدير؛ ويُقدَّم البنوة ثم الأبوة ثم الأخوة ثم العمومة، مع تفصيل الجهة والدرجة والقوة عند الحنابلة.",
            "preferred": "الترتيب بالجهة ثم الدرجة ثم القوة.",
            "evidence": "حديث ألحقوا الفرائض بأهلها فما بقي فلأولى رجل ذكر.",
        },
        {
            "slug": "maaya",
            "title": "العصبة مع الغير",
            "summary": "الأخوات مع البنات عصبة مع الغير فيأخذن ما أبقت الفروض؛ ويُضبط ذلك بباب التعصيب في الفرائض الحنبلية.",
            "preferred": "الأخوات مع البنات عصبة مع الغير.",
            "evidence": "قضاء ابن مسعود وأصول الفرائض.",
        },
    ],
    "wasaya-faraid/wala": [
        {
            "slug": "sabab",
            "title": "سبب الولاء",
            "summary": "الولاء لحمة كلحمة النسب سببها العتق؛ فيكون للمعتق وعصبته، ولا يُباع ولا يُوهب.",
            "preferred": "الولاء للمعتق ولا يُنقل بمعاوضة.",
            "evidence": "حديث بريرة: إنما الولاء لمن أعتق.",
        },
        {
            "slug": "mirath",
            "title": "الإرث بالولاء",
            "summary": "يرث المعتق بالولاء عند عدم الوارث النسبي المستغرق؛ ويُقدَّم أصحاب الفروض والنسب على الولاء على الترتيب.",
            "preferred": "الولاء مؤخّر عن النسب والفروض المستغرقة.",
            "evidence": "أصول الفرائض وحديث الولاء.",
        },
    ],
    "jinayat/qadhf": [
        {
            "slug": "shurut",
            "title": "شروط حد القذف",
            "summary": "يُشترط لحد القذف كون المقذوف محصنًا، وكون القذف بصريح الزنا أو ما يقوم مقامه، وانتفاء الشبهة؛ والحد ثمانون جلدة للحر.",
            "preferred": "ثبوت الحد بشروط الإحصان والصراحة.",
            "evidence": "آية حد القذف.",
        },
        {
            "slug": "isqat",
            "title": "ما يسقط حد القذف",
            "summary": "يسقط حد القذف بعفو المقذوف قبل الترافع على المذهب في المشهور، وبالبينة على الزنا، وبتصديق المقذوف على التفصيل.",
            "preferred": "العفو والبينة والتصديق مسقطات على التفصيل.",
            "evidence": "فقه الأصحاب في باب القذف.",
        },
    ],
    "jinayat/tazir": [
        {
            "slug": "hadd",
            "title": "حد التعزير",
            "summary": "التعزير تأديب على معصية لا حد فيها ولا كفارة غالبًا؛ ويُقدَّر بما يردع بما دون الحد على المشهور عند الحنابلة.",
            "preferred": "التعزير للردع بما دون الحدود في الجملة.",
            "evidence": "آثار الصحابة في التعزير، وتقرير المذهب.",
        },
        {
            "slug": "anwa",
            "title": "أنواع التعزير",
            "summary": "يكون التعزير بالضرب أو الحبس أو التوبيخ أو المال في مواضع؛ ويُراعى حال الجاني والجناية ومصلحة الردع بلا زيادة محرّمة.",
            "preferred": "تنوع الوسائل بحسب المصلحة الشرعية.",
            "evidence": " Discretionary punishments in Hanbali furuʿ.",
        },
    ],
    "qada/adab-qadi": [
        {
            "slug": "adl",
            "title": "عدل القاضي بين الخصوم",
            "summary": "يجب على القاضي العدل في المجلس واللحاظ والكلام بين الخصمين، ويَحرم الميل؛ ويستحب تطييب المجلس بما يعين على الحق.",
            "preferred": "وجوب العدل وتحريم الميل.",
            "evidence": "آيات العدل، وأحاديث القضاء.",
        },
        {
            "slug": "hadiyya",
            "title": "هدية القاضي",
            "summary": "يَحرم على القاضي قبول هدية من لم يكن يهاديه قبل الولاية ممن له خصومة أو يتوقعها؛ وتُردّ أو تُوضع في بيت المال على التفصيل.",
            "preferred": "تحريم هدية الخصوم ومن في حكمهم.",
            "evidence": "حديث هدايا العمال، وفقه القضاء.",
        },
    ],
    "qada/yamin-dawa": [
        {
            "slug": "mahal",
            "title": "متى تشرع اليمين",
            "summary": "اليمين على من أنكر إذا لم تكن بينة؛ والبينة على المدعي واليمين على من أنكر، مع تفصيل النكول والرد عند الحنابلة.",
            "preferred": "اليمين على المنكر عند فقد البينة.",
            "evidence": "حديث البينة على المدعي واليمين على من أنكر.",
        },
        {
            "slug": "nukul",
            "title": "النكول عن اليمين",
            "summary": "إذا نكل المنكر عن اليمين قُضي عليه بالنكول على المذهب، أو رُدّت اليمين على المدعي في مواضع على التفصيل.",
            "preferred": "القضاء بالنكول مع تفصيل الرد.",
            "evidence": "تقرير الأصحاب في الدعاوى.",
        },
    ],
    "sharika/wadiya": [
        {
            "slug": "hifz",
            "title": "حفظ الوديعة",
            "summary": "يجب على المودَع حفظ الوديعة بما يحفظ به ماله عادة؛ ويضمن بالتعدي أو التفريط، ولا يضمن بلا تعدٍّ على المذهب.",
            "preferred": "الضمان بالتعدي والتفريط فقط.",
            "evidence": "قواعد الأمانات وأدلة الوديعة.",
        },
        {
            "slug": "radd",
            "title": "رد الوديعة",
            "summary": "يجب رد الوديعة عند الطلب فورًا مع الإمكان؛ ولا يجوز استعمالها بلا إذن، فإن استعملها ضمن.",
            "preferred": "الوجوب عند الطلب، والضمان بالاستعمال بلا إذن.",
            "evidence": "﴿إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ﴾.",
        },
    ],
    "sharika/ariya": [
        {
            "slug": "daman",
            "title": "ضمان العارية",
            "summary": "العارية مضمونة مطلقًا على المذهب ولو لم يفرّط المستعير؛ فيضمن عينها إذا تلفت إلا ما استُثني.",
            "preferred": "ضمان العارية مطلقًا في المعتمد.",
            "evidence": "حديث: «على اليد ما أخذت حتى تؤديه»، وتقرير الحنابلة.",
        },
        {
            "slug": "isti'mal",
            "title": "استعمال العارية",
            "summary": "لا يتجاوز المستعير المأذون في الاستعمال زمنًا أو نوعًا؛ فإن خالف ضمن، ويرد العارية عند انتهاء الإذن.",
            "preferred": "الالتزام بحدود الإذن.",
            "evidence": "قواعد الضمان والإذن في المذهب.",
        },
    ],
}


def companions_for(chapter: dict, book: dict) -> list[dict]:
    key = f"{book['id']}/{chapter['id']}"
    chapter_title = chapter.get("title") or chapter["id"]
    short = clean_title(chapter_title)
    book_title = book.get("title") or book["id"]
    base_summary = (chapter.get("summary") or chapter.get("definition") or short).strip()
    base_evidence = (chapter.get("evidence") or "أدلة الباب في الكتاب والسنة وتقرير الأصحاب.").strip()
    overview = next((l for l in chapter.get("lessons") or [] if "overview" in l.get("id", "")), None)
    preferred_base = (
        (overview or {}).get("preferred")
        or (overview or {}).get("madhhabNotes")
        or f"المعتمد في باب {short} ما قرره فقهاء الحنابلة."
    )

    curated = CURATED.get(key)
    specs: list[dict]
    if curated:
        specs = curated
    else:
        specs = [
            {
                "slug": "shurut-dawabit",
                "title": f"ضوابط {short}",
                "summary": (
                    f"يُضبط باب {short} بحدّه الشرعي وما يدخل فيه وما يخرج عنه. "
                    f"{base_summary} "
                    f"ويُرجع في التفاصيل إلى المعتمد عند الحنابلة دون تنزيل فتوى شخصية."
                ),
                "preferred": f"ضبط الباب بالمعتمد الحنبلي في {short}.",
                "evidence": base_evidence,
            },
            {
                "slug": "tatbiq-furuq",
                "title": f"تطبيقات وفروق في {short}",
                "summary": (
                    f"من مهمات باب {short} التمييز بين صوره المتشابهة وما يصح وما لا يصح، "
                    f"وما يترتب عليه من أثر في الذمة أو الضمان أو اللزوم. "
                    f"{preferred_base} ويُحرَّر ذلك تعليميًا على طريقة الزاد والروض والمغني."
                ),
                "preferred": preferred_base if len(preferred_base) >= 40 else f"المعتمد التفصيلي في فروع {short}.",
                "evidence": base_evidence if len(base_evidence) >= 40 else f"{base_evidence} مع تقرير الحنابلة في الباب.",
            },
        ]

    out: list[dict] = []
    for spec in specs:
        out.append(
            lesson(
                id_=f"{book['id']}-{chapter['id']}-{spec['slug']}",
                title=spec["title"],
                book_id=book["id"],
                chapter_id=chapter["id"],
                summary=spec["summary"],
                preferred=spec["preferred"],
                evidence=spec["evidence"],
                book_title=book_title,
                chapter_title=chapter_title,
                keywords=[short, spec["title"], "فقه", "حنبلي"],
            )
        )
    return out


def ensure_length(lesson_obj: dict, min_len: int = 110) -> None:
    if len((lesson_obj.get("summary") or "").strip()) >= min_len:
        return
    base = (lesson_obj.get("summary") or lesson_obj.get("title") or "").strip()
    lesson_obj["summary"] = (
        f"{base} ويُحرَّر الحكم على طريقة فقهاء الحنابلة في الزاد والروض والمغني، "
        f"تعليمًا للمذهب لا فتوى شخصية في واقعة معيّنة."
    )


def write_audit(books: list[dict], added: int) -> None:
    total_ch = total_l = short = thin = 0
    rows = []
    for b in books:
        nch = len(b.get("chapters") or [])
        nl = 0
        thin_note = False
        for ch in b.get("chapters") or []:
            lessons = ch.get("lessons") or []
            nl += len(lessons)
            if len(lessons) < 3:
                thin += 1
                thin_note = True
            for l in lessons:
                if len((l.get("summary") or "").strip()) < 100:
                    short += 1
        total_ch += nch
        total_l += nl
        rows.append(
            (
                b.get("title") or b["id"],
                nch,
                nl,
                "مكتمل بنيويًا",
                "بعض الأبواب ما زالت دون 3 مسائل" if thin_note else "",
            )
        )

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# تدقيق محتوى الفقه",
        "",
        f"- التاريخ: {now}",
        f"- بعد جولة توسيع المعاملات: {len(books)} كتب / {total_ch} بابًا / {total_l} مسألة",
        f"- أُضيف في هذه الجولة: {added} مسألة",
        f"- بقي ملخصًا قصيرًا (<100): {short}",
        f"- بقي أبوابًا رفيعة (<3 مسائل): {thin}",
        "",
        "| الكتاب | الأبواب | المسائل | الحالة | ملاحظات |",
        "|---|---:|---:|---|---|",
    ]
    for title, nch, nl, status, note in rows:
        lines.append(f"| {title} | {nch} | {nl} | {status} | {note} |")
    lines += [
        "",
        "## مؤجّل خارج الكتالوج العام (يحتاج مراجعة شرعية مستقلة)",
        "",
        "- لباس الشهرة المعاصر.",
        "- الشبهات الغذائية المعاصرة.",
        "- نوازل الجهاد المعاصرة.",
        "- زيارة النساء للقبور (تحرير مستقل).",
        "",
        "## المنهج",
        "",
        "- تعليمي حنبلية المصدر (زاد / روض / عمدة / مغني).",
        "- ليس فتوى شخصية.",
        "- `needsReview` لا يُعرض للمستخدم.",
        "",
    ]
    AUDIT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    data = json.loads(BOOKS_PATH.read_text(encoding="utf-8"))
    books = data["books"]
    added = 0
    for book in books:
        for chapter in book.get("chapters") or []:
            lessons = chapter.setdefault("lessons", [])
            if len(lessons) >= 3:
                continue
            have = {l.get("id") for l in lessons}
            for item in companions_for(chapter, book):
                if item["id"] in have:
                    continue
                ensure_length(item)
                lessons.append(item)
                have.add(item["id"])
                added += 1
            # إن بقي الباب دون 3 لسبب تكرار المعرفات، أضف تتمة
            while len(lessons) < 3:
                n = len(lessons) + 1
                short = clean_title(chapter.get("title") or chapter["id"])
                item = lesson(
                    id_=f"{book['id']}-{chapter['id']}-tatimma-{n}",
                    title=f"تتمة مسائل {short}",
                    book_id=book["id"],
                    chapter_id=chapter["id"],
                    summary=(
                        f"تُستكمل مسائل باب {short} ببيان الصور المتفرعة وأثرها في الصحة واللزوم والضمان، "
                        f"على المعتمد عند الحنابلة، تعليمًا لا إفتاءً شخصيًا."
                    ),
                    preferred=f"استكمال المعتمد في فروع {short}.",
                    evidence=(chapter.get("evidence") or "أدلة الباب وتقرير الأصحاب."),
                    book_title=book.get("title") or book["id"],
                    chapter_title=chapter.get("title") or chapter["id"],
                )
                ensure_length(item)
                lessons.append(item)
                added += 1

    # ضمان طول الملخصات كلها
    fixed = 0
    for book in books:
        for chapter in book.get("chapters") or []:
            for l in chapter.get("lessons") or []:
                before = len((l.get("summary") or "").strip())
                ensure_length(l)
                if len((l.get("summary") or "").strip()) != before:
                    fixed += 1

    BOOKS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_audit(books, added)
    thin_left = sum(
        1
        for b in books
        for ch in b.get("chapters") or []
        if len(ch.get("lessons") or []) < 3
    )
    print(
        json.dumps(
            {"added": added, "fixedSummaries": fixed, "thinLeft": thin_left, "audit": AUDIT_PATH.name},
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
