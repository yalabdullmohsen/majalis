#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توسيع الكتب الرفيعة في الفقه الحنبلي (تعليمي بمصادر)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS_PATH = ROOT / "content" / "fiqh" / "books.json"
AUDIT_PATH = ROOT / "fiqh-content-audit.md"

ZAD = ("زاد المستقنع", "شرف الدين الحجاوي")
RAWD = ("الروض المربع", "منصور البهوتي")
UMDA = ("عمدة الفقه", "ابن قدامة")
MUGHNI = ("المغني", "ابن قدامة")


def src(pair, ref: str) -> dict:
    return {"book": pair[0], "author": pair[1], "ref": ref}


def lesson(**kw) -> dict:
    summary = kw["summary"]
    preferred = kw["preferred"]
    needs = bool(kw.get("needs_review", False))
    return {
        "id": kw["id"],
        "title": kw["title"],
        "bookId": kw["book_id"],
        "chapterId": kw["chapter_id"],
        "level": kw.get("level", "مبتدئ"),
        "madhhabNotes": preferred,
        "sources": kw.get("sources")
        or [src(ZAD, kw["title"]), src(RAWD, kw["title"])],
        "status": "draft" if needs else "published",
        "summary": summary,
        "evidence": kw["evidence"],
        "preferred": preferred,
        "definition": kw.get("definition") or (summary.split(".")[0].strip() + "."),
        "ruling": preferred,
        "practicalSummary": preferred,
        "notes": kw.get("notes")
        or "محتوى تعليمي وفق المذهب الحنبلي، وليس فتوى شخصية لحالة معينة.",
        "keywords": kw.get("keywords") or [kw["title"], "فقه", "حنبلي"],
        "needsReview": needs,
    }


def add_to_chapter(book: dict, chapter_id: str, items: list[dict]) -> int:
    for ch in book["chapters"]:
        if ch["id"] != chapter_id:
            continue
        have = {x["id"] for x in ch.get("lessons") or []}
        n = 0
        for item in items:
            if item["id"] in have:
                continue
            if item.get("needsReview") or item.get("status") == "draft":
                continue  # لا تُعرض للمستخدم
            ch.setdefault("lessons", []).append(item)
            n += 1
        return n
    raise KeyError(f"missing chapter {book['id']}/{chapter_id}")


def add_chapter(book: dict, ch: dict) -> int:
    for ex in book["chapters"]:
        if ex["id"] == ch["id"]:
            return add_to_chapter(book, ch["id"], ch.get("lessons") or [])
    lessons = []
    for item in ch.get("lessons") or []:
        if item.get("needsReview") or item.get("status") == "draft":
            continue
        lessons.append(item)
    if not lessons:
        return 0
    ch = dict(ch)
    ch["lessons"] = lessons
    book["chapters"].append(ch)
    book["chapters"].sort(key=lambda x: x.get("order", 0))
    return len(lessons)


def chapter_shell(
    *,
    id: str,
    title: str,
    order: int,
    definition: str,
    summary: str,
    evidence: str,
    notes: str,
    topics: list[str],
    lessons: list[dict],
) -> dict:
    return {
        "id": id,
        "title": title,
        "order": order,
        "status": "published",
        "definition": definition,
        "topics": topics,
        "summary": summary,
        "evidence": evidence,
        "notes": notes,
        "sources": [src(ZAD, title), src(RAWD, title)],
        "lessons": lessons,
    }


def expand_itikaf(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "tarif-itikaf",
        [
            lesson(
                id="itikaf-mashruiyya",
                title="مشروعية الاعتكاف",
                book_id="itikaf",
                chapter_id="tarif-itikaf",
                summary="الاعتكاف مشروع بالكتاب والسنة، وهو لزوم المسجد لطاعة الله، وأفضله في العشر الأواخر من رمضان.",
                evidence="﴿وَلَا تُبَاشِرُوهُنَّ وَأَنتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾، وحديث اعتكاف النبي ﷺ في الصحيحين.",
                preferred="المشروعية ثابتة؛ والاستحباب في العشر الأواخر آكد.",
                keywords=["اعتكاف", "مشروعية"],
                sources=[src(ZAD, "باب الاعتكاف"), src(UMDA, "الاعتكاف")],
            ),
            lesson(
                id="itikaf-hukm",
                title="حكم الاعتكاف",
                book_id="itikaf",
                chapter_id="tarif-itikaf",
                summary="الاعتكاف سنة وقربة، ويجب بالنذر، وليس واجبًا ابتداءً من غير نذر.",
                evidence="مواظبة النبي ﷺ، وحديث من نذر أن يطيع الله فليطعه.",
                preferred="سنة مؤكدة في العشر، وواجب بالنذر.",
                keywords=["حكم الاعتكاف"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "shurut-itikaf",
        [
            lesson(
                id="itikaf-masjid",
                title="شرط المسجد للاعتكاف",
                book_id="itikaf",
                chapter_id="shurut-itikaf",
                summary="لا يصح الاعتكاف إلا في مسجد تُقام فيه الجماعة على المذهب.",
                evidence="آية العكوف في المساجد، وعمل النبي ﷺ.",
                preferred="المعتمد كونه في المسجد الذي تُقام فيه الجماعة.",
                keywords=["مسجد", "شروط الاعتكاف"],
            ),
            lesson(
                id="itikaf-sawm-shart",
                title="الصوم مع الاعتكاف",
                book_id="itikaf",
                chapter_id="shurut-itikaf",
                summary="يُشترط الصوم للاعتكاف على المشهور من المذهب.",
                evidence="أثر عائشة في اشتراط الصوم، وفقه الحنابلة.",
                preferred="المشهور اشتراط الصوم.",
                keywords=["صوم الاعتكاف"],
                sources=[src(ZAD, "الاعتكاف"), src(MUGHNI, "الاعتكاف")],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "ahkam-itikaf",
        [
            lesson(
                id="itikaf-khuruj",
                title="خروج المعتكف من المسجد",
                book_id="itikaf",
                chapter_id="ahkam-itikaf",
                summary="يخرج المعتكف لما لا بد منه كحاجة الإنسان والطهارة؛ وما زاد ففيه تفصيل.",
                evidence="فعل النبي ﷺ وخروجه للحاجة.",
                preferred="يباح الخروج للحاجة؛ وغيره بحسب العذر والشرط.",
                keywords=["خروج المعتكف"],
            ),
            lesson(
                id="itikaf-wat",
                title="الوطء في الاعتكاف",
                book_id="itikaf",
                chapter_id="ahkam-itikaf",
                summary="الجماع يبطل الاعتكاف بالنص، ودواعيه محرَّمة فيه.",
                evidence="﴿وَلَا تُبَاشِرُوهُنَّ وَأَنتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾.",
                preferred="الوطء مبطل.",
                keywords=["مباشرة", "مبطلات"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "mubtilat-itikaf",
        [
            lesson(
                id="itikaf-mubtilat-list",
                title="مبطلات الاعتكاف إجمالًا",
                book_id="itikaf",
                chapter_id="mubtilat-itikaf",
                summary="يبطل بالخروج لغير عذر، وبالوطء، وبالردة على التفصيل؛ وينتهي بانتهاء مدته.",
                evidence="آية المباشرة، وقواعد العبادة.",
                preferred="هذا إجمال المبطلات في المذهب.",
                keywords=["مبطلات الاعتكاف"],
            ),
            lesson(
                id="itikaf-riddah",
                title="الردة أثناء الاعتكاف",
                book_id="itikaf",
                chapter_id="mubtilat-itikaf",
                summary="الردة تُبطل الاعتكاف؛ لأنها تنافي العبادة.",
                evidence="قواعد بطلان العبادة بالردة.",
                preferred="مبطل.",
                keywords=["ردة", "اعتكاف"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "itikaf-niyya",
        [
            lesson(
                id="itikaf-niyya-shart",
                title="النية في الاعتكاف",
                book_id="itikaf",
                chapter_id="itikaf-niyya",
                summary="لا يصح الاعتكاف إلا بنية، ويُميَّز نذره من نفله.",
                evidence="حديث «إنما الأعمال بالنيات».",
                preferred="النية لا بد منها.",
                keywords=["نية الاعتكاف"],
            )
        ],
    )
    n += add_to_chapter(
        book,
        "itikaf-mustahabb",
        [
            lesson(
                id="itikaf-quran-dhikr",
                title="اشتغال المعتكف بالقرآن والذكر",
                book_id="itikaf",
                chapter_id="itikaf-mustahabb",
                summary="يُستحب الإكثار من التلاوة والذكر والدعاء، واجتناب فضول الكلام.",
                evidence="مقصد الاعتكاف الانقطاع للعبادة.",
                preferred="هذا الأدب المستحب.",
                keywords=["آداب الاعتكاف"],
            ),
            lesson(
                id="itikaf-ashr",
                title="اعتكاف العشر الأواخر",
                book_id="itikaf",
                chapter_id="itikaf-mustahabb",
                summary="يُستحب اعتكاف العشر الأواخر من رمضان طلبًا لليلة القدر.",
                evidence="حديث عائشة في الصحيحين.",
                preferred="مستحب مؤكد.",
                keywords=["عشر أواخر", "ليلة القدر"],
            ),
            lesson(
                id="itikaf-bay",
                title="البيع والشراء أثناء الاعتكاف",
                book_id="itikaf",
                chapter_id="itikaf-mustahabb",
                summary="يُكره للمعتكف الاشتغال بالبيع والشراء في المسجد بما يخرجه عن مقصود الاعتكاف.",
                evidence="أدب المسجد، وكلام الأصحاب.",
                preferred="الكراهة لما يشغل عن العبادة.",
                keywords=["بيع", "مسجد"],
            ),
        ],
    )
    return n


def expand_janaza(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "kafan",
        [
            lesson(
                id="janaza-kafan-wujub",
                title="وجوب تكفين الميت",
                book_id="janaza",
                chapter_id="kafan",
                summary="تكفين الميت فرض كفاية، ويُكفَّن الرجل في ثلاث لفائف والمرأة في خمس على المذهب.",
                evidence="تكفين النبي ﷺ في ثلاثة أثواب بيض.",
                preferred="الوجوب كفاية، والثلاث للرجل معتمدة.",
                keywords=["كفن"],
            ),
            lesson(
                id="janaza-kafan-nafaqa",
                title="نفقة الكفن من مال الميت",
                book_id="janaza",
                chapter_id="kafan",
                summary="يُقدَّم الكفن من تركة الميت بالمعروف، ثم ممن تلزمه نفقته، ثم المسلمين.",
                evidence="فقه تقديم مؤن التجهيز على الوصية والإرث.",
                preferred="هذا ترتيب المذهب.",
                keywords=["نفقة الكفن"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "haml-janaiz",
        [
            lesson(
                id="janaza-haml-sunan",
                title="سنن حمل الجنازة",
                book_id="janaza",
                chapter_id="haml-janaiz",
                summary="يُستحب الإسراع بالجنازة دون خبب، مع الوقار وترك رفع الصوت.",
                evidence="حديث «أسرعوا بالجنازة» في الصحيحين.",
                preferred="الإسراع المعتدل سنة.",
                keywords=["حمل الجنازة"],
            ),
            lesson(
                id="janaza-ittiba",
                title="اتباع الجنازة",
                book_id="janaza",
                chapter_id="haml-janaiz",
                summary="اتباع الجنازة سنة ومن حقوق المسلم، ويعظم الأجر بتمام الاتباع إلى الدفن.",
                evidence="حديث حقوق المسلم، وحديث من تبع جنازة.",
                preferred="مستحب مؤكد.",
                keywords=["اتباع الجنازة"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "taziya",
        [
            lesson(
                id="janaza-taziya-hukm",
                title="حكم التعزية",
                book_id="janaza",
                chapter_id="taziya",
                summary="التعزية مستحبة بما يخفف المصيبة من الكلام المشروع، بلا نياحة ولا اجتماع منكر.",
                evidence="تعزية النبي ﷺ أصحابه، والنهي عن النياحة.",
                preferred="مستحبة مع اجتناب المحرَّم.",
                keywords=["تعزية"],
            ),
            lesson(
                id="janaza-bukaa",
                title="البكاء على الميت",
                book_id="janaza",
                chapter_id="taziya",
                summary="البكاء بدمع العين لا بأس به، ويحرم النوح والصراخ وشق الجيوب.",
                evidence="بكاء النبي ﷺ على إبراهيم، والنهي عن النياحة.",
                preferred="جواز الدمع وتحريم النياحة.",
                keywords=["بكاء", "نياحة"],
                sources=[src(RAWD, "الجنائز"), src(MUGHNI, "الجنائز")],
            ),
            lesson(
                id="janaza-sabr",
                title="الصبر عند المصيبة",
                book_id="janaza",
                chapter_id="taziya",
                summary="يجب الصبر والرضا بقضاء الله، ويُستحب قول الاسترجاع والدعاء للميت.",
                evidence="﴿الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ...﴾.",
                preferred="الصبر واجب، والاسترجاع مستحب.",
                keywords=["صبر", "مصيبة"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "ziyarat-qubur",
        [
            lesson(
                id="janaza-ziyara-rijal",
                title="زيارة القبور للرجال",
                book_id="janaza",
                chapter_id="ziyarat-qubur",
                summary="تُشرع زيارة القبور للرجال للاتعاظ والدعاء للموتى، بلا سؤال أصحاب القبور.",
                evidence="حديث «كنت نهيتكم عن زيارة القبور فزوروها».",
                preferred="مشروعة للرجال بهذه الضوابط.",
                keywords=["زيارة القبور"],
            ),
            lesson(
                id="janaza-salam-qubur",
                title="سلام الزيارة والدعاء للموتى",
                book_id="janaza",
                chapter_id="ziyarat-qubur",
                summary="يُسن السلام على أهل القبور والدعاء لهم بالمأثور، دون تمسح أو طواف بالقبر.",
                evidence="سلام النبي ﷺ على أهل البقيع.",
                preferred="السلام والدعاء مشروعان.",
                keywords=["سلام القبور"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "ihda-qurab",
        [
            lesson(
                id="janaza-sadaqa-an-mayyit",
                title="الصدقة عن الميت",
                book_id="janaza",
                chapter_id="ihda-qurab",
                summary="الصدقة عن الميت مشروعة ويصل ثوابها.",
                evidence="حديث سعد في الصدقة عن أمه.",
                preferred="مشروعة ونافعة.",
                keywords=["صدقة عن الميت"],
            ),
            lesson(
                id="janaza-dua-mayyit",
                title="الدعاء والاستغفار للميت",
                book_id="janaza",
                chapter_id="ihda-qurab",
                summary="الدعاء والاستغفار للميت من أعظم ما ينفعه باتفاق.",
                evidence="آيات الاستغفار للمؤمنين، ودعوات الجنازة.",
                preferred="مشروع متفق على نفعه.",
                keywords=["دعاء للميت"],
            ),
            lesson(
                id="janaza-qada-sawm-mayyit",
                title="قضاء الصوم عن الميت",
                book_id="janaza",
                chapter_id="ihda-qurab",
                summary="من مات وعليه صوم نذر صام عنه وليّه؛ وفي قضاء رمضان تفصيل معروف في المذهب.",
                evidence="حديث «من مات وعليه صيام صام عنه وليّه».",
                preferred="يُفصَّل بين النذر ورمضان كما في كتب المذهب.",
                keywords=["قضاء صوم الميت"],
                sources=[src(ZAD, "الصيام"), src(RAWD, "الجنائز")],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "salat-mayyit",
        [
            lesson(
                id="janaza-salat-arkan",
                title="أركان الصلاة على الميت",
                book_id="janaza",
                chapter_id="salat-mayyit",
                summary="من أركانها: النية والقيام والتكبيرات والفاتحة والصلاة على النبي ﷺ والدعاء للميت والتسليم على تفصيل المذهب.",
                evidence="أحاديث صفة الصلاة على الميت.",
                preferred="هذا تعداد الأركان في الزاد والروض.",
                keywords=["صلاة الجنازة", "أركان"],
            ),
            lesson(
                id="janaza-salat-ghaib",
                title="الصلاة على الغائب",
                book_id="janaza",
                chapter_id="salat-mayyit",
                summary="تجوز الصلاة على الغائب إذا لم يُصلَّ عليه كصلاة النبي ﷺ على النجاشي؛ وفي تعميمها تفصيل.",
                evidence="حديث الصلاة على النجاشي في الصحيحين.",
                preferred="تجوز في الصورة الواردة؛ والتعميم له تفصيل.",
                keywords=["صلاة الغائب"],
                sources=[src(RAWD, "الجنائز"), src(MUGHNI, "الجنائز")],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "dafn",
        [
            lesson(
                id="janaza-talqin",
                title="التلقين بعد الدفن",
                book_id="janaza",
                chapter_id="dafn",
                summary="استحب جماعة من الأصحاب التلقين بعد الدفن، وهو معروف في المذهب مع خلاف في القوة.",
                evidence="أثر معروف عند أهل الشام، وكلام الأصحاب.",
                preferred="مستحب عند كثير من الحنابلة.",
                keywords=["تلقين"],
                sources=[src(RAWD, "الدفن"), src(MUGHNI, "الجنائز")],
            )
        ],
    )
    return n


def expand_libas(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "libas-awra",
        [
            lesson(
                id="libas-awra-rajul",
                title="عورة الرجل",
                book_id="libas",
                chapter_id="libas-awra",
                summary="عورة الرجل ما بين السرة والركبة على المذهب، فيجب سترها.",
                evidence="أحاديث الفخذ وحد العورة عند الأصحاب.",
                preferred="المعتمد ما بين السرة والركبة.",
                keywords=["عورة الرجل"],
            ),
            lesson(
                id="libas-awra-marah",
                title="عورة المرأة في الصلاة",
                book_id="libas",
                chapter_id="libas-awra",
                summary="الحرة البالغة تستتر في الصلاة جميع بدنها إلا وجهها، وفي الكفين والقدمين روايات.",
                evidence="حديث الخمار، وآية الزينة.",
                preferred="ستر جميع البدن إلا الوجه في الصلاة.",
                keywords=["عورة المرأة"],
            ),
            lesson(
                id="libas-awra-nazar",
                title="عورة النظر خارج الصلاة",
                book_id="libas",
                chapter_id="libas-awra",
                summary="يُفرَّق بين عورة الصلاة وعورة النظر؛ فضابط نظر الأجنبي أشد من ستر الصلاة.",
                evidence="آيات غض البصر وأدلة الحجاب.",
                preferred="التفريق معتمد عند الأصحاب.",
                keywords=["نظر", "عورة"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "libas-haram",
        [
            lesson(
                id="libas-harir",
                title="حرير الرجال",
                book_id="libas",
                chapter_id="libas-haram",
                summary="يحرم على الذكر البالغ لبس الحرير إلا لرخصة شرعية كحكة، ويباح للنساء.",
                evidence="حديث تحريم الحرير والذهب على ذكور الأمة.",
                preferred="التحريم مع الرخص.",
                keywords=["حرير"],
            ),
            lesson(
                id="libas-dhahab",
                title="التختم بالذهب للرجال",
                book_id="libas",
                chapter_id="libas-haram",
                summary="يحرم على الرجال التختم بالذهب، ويباح خاتم الفضة على التفصيل.",
                evidence="حديث تحريم الذهب على الذكور.",
                preferred="التحريم على الرجال.",
                keywords=["ذهب", "خاتم"],
            ),
            lesson(
                id="libas-tashabbuh",
                title="التشبه في اللباس",
                book_id="libas",
                chapter_id="libas-haram",
                summary="يحرم تشبه الرجال بالنساء والعكس، ويُمنع التشبه بشعار الكفار على التفصيل.",
                evidence="أحاديث لعن المتشبهين، وحديث «من تشبّه بقوم فهو منهم».",
                preferred="تحريم التشبه المحرَّم.",
                keywords=["تشبه"],
                sources=[src(RAWD, "اللباس"), src(MUGHNI, "اللباس")],
            ),
            lesson(
                id="libas-isbal",
                title="إسبال الثوب خيلاء",
                book_id="libas",
                chapter_id="libas-haram",
                summary="يحرم إسبال الإزار خيلاء؛ وما كان لغير الخيلاء ففيه خلاف، والمذهب يشدد في الإسبال.",
                evidence="أحاديث الإسبال في الصحيحين.",
                preferred="تحريم الخيلاء، والحذر من الإسبال مطلقًا على المعروف عند الأصحاب.",
                keywords=["إسبال"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "libas-zina",
        [
            lesson(
                id="libas-khidaab",
                title="خضاب الشعر",
                book_id="libas",
                chapter_id="libas-zina",
                summary="يُشرع تغيير الشيب بالحناء والكتم؛ وفي السواد خلاف مشهور.",
                evidence="أحاديث تغيير الشيب، وحديث السواد عند أبي داود.",
                preferred="الحناء مشروع؛ والسواد فيه توقف وتحرير.",
                keywords=["خضاب"],
                sources=[src(RAWD, "الزينة"), src(MUGHNI, "الزينة")],
            ),
            lesson(
                id="libas-ittib",
                title="التطيب للرجال",
                book_id="libas",
                chapter_id="libas-zina",
                summary="التطيب للرجال مستحب، وقد كان النبي ﷺ يحب الطيب.",
                evidence="حديث محبة النبي ﷺ للطيب.",
                preferred="مستحب.",
                keywords=["طيب"],
            ),
            lesson(
                id="libas-marah-teeb-khuruj",
                title="طيب المرأة عند الخروج",
                book_id="libas",
                chapter_id="libas-zina",
                summary="يُنهى عن تطيب المرأة عند الخروج على وجه يثير الفتنة كما ورد.",
                evidence="أحاديث نهي المرأة عن التطيب في خروجها.",
                preferred="المنع في صورة الفتنة ثابت.",
                keywords=["طيب المرأة"],
            ),
        ],
    )
    n += add_chapter(
        book,
        chapter_shell(
            id="libas-salat",
            title="باب لباس الصلاة",
            order=4,
            definition="ما يُراعى من اللباس لصحة الصلاة وكمالها.",
            summary="يشترط ستر العورة، ويُستحب أخذ الزينة، ولا يكفي الشفاف الواصف.",
            evidence="﴿خُذُوا زِينَتَكُمْ عِندَ كُلِّ مَسْجِدٍ﴾.",
            notes="يُربط بباب شروط الصلاة.",
            topics=["ستر", "زينة"],
            lessons=[
                lesson(
                    id="libas-zina-masjid",
                    title="أخذ الزينة عند المسجد",
                    book_id="libas",
                    chapter_id="libas-salat",
                    summary="يُستحب لبس أحسن الثياب للصلاة، خصوصًا الجمعة، بلا إسراف ولا خيلاء.",
                    evidence="آية الأعراف.",
                    preferred="مستحب.",
                    keywords=["زينة الصلاة"],
                ),
                lesson(
                    id="libas-wasf-badan",
                    title="اللباس الواصف أو الشفاف",
                    book_id="libas",
                    chapter_id="libas-salat",
                    summary="الثوب الشفاف أو الذي يصف العورة لا يحصل به الستر المعتبر.",
                    evidence="معنى الستر في شروط الصلاة.",
                    preferred="لا تصح الصلاة بدون الستر المعتبر.",
                    keywords=["شفاف", "ستر"],
                ),
            ],
        ),
    )
    n += add_chapter(
        book,
        chapter_shell(
            id="libas-sabiy",
            title="باب لباس الصبيان",
            order=5,
            definition="أحكام إلباس الصغار الحرير والذهب.",
            summary="يُمنع إلباس الصبي الحرير والذهب على المذهب في الجملة.",
            evidence="عموم أدلة التحريم مع كلام الأصحاب.",
            notes="التفصيل في المطوّلات.",
            topics=["صبي", "حرير"],
            lessons=[
                lesson(
                    id="libas-sabiy-harir",
                    title="إلباس الصبي الحرير والذهب",
                    book_id="libas",
                    chapter_id="libas-sabiy",
                    summary="يحرم على الولي إلباس الصبي الحرير والذهب على المذهب.",
                    evidence="عموم النهي وتعليل التربية على المشروع.",
                    preferred="المعتمد المنع.",
                    keywords=["صبي", "حرير"],
                )
            ],
        ),
    )
    return n


def expand_ayman(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "jami-ayman",
        [
            lesson(
                id="ayman-laghw",
                title="يمين اللغو",
                book_id="ayman",
                chapter_id="jami-ayman",
                summary="لغو اليمين ما يجري بلا قصد، أو على ظن صادق؛ ولا كفارة فيه.",
                evidence="﴿لَا يُؤَاخِذُكُمُ اللَّهُ بِاللَّغْوِ فِي أَيْمَانِكُمْ﴾.",
                preferred="لا كفارة في اللغو.",
                keywords=["لغو اليمين"],
            ),
            lesson(
                id="ayman-ghamus",
                title="اليمين الغموس",
                book_id="ayman",
                chapter_id="jami-ayman",
                summary="الغموس الحلف كاذبًا على ماضٍ عمدًا، وهي كبيرة؛ والمشهور لا كفارة مع وجوب التوبة.",
                evidence="تعظيم اليمين الفاجرة في السنة.",
                preferred="التوبة واجبة؛ والمشهور عدم الكفارة.",
                keywords=["يمين غموس"],
                sources=[src(ZAD, "الأيمان"), src(MUGHNI, "الأيمان")],
            ),
            lesson(
                id="ayman-yamin-mustaqbal",
                title="اليمين على المستقبل",
                book_id="ayman",
                chapter_id="jami-ayman",
                summary="تنعقد اليمين على مستقبل ممكن، وتجب الكفارة بالحنث.",
                evidence="آية الكفارة في المائدة.",
                preferred="هذا ضابط الانعقاد.",
                keywords=["يمين مستقبل"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "ahd-wad",
        [
            lesson(
                id="ayman-wafaa-ahd",
                title="الوفاء بالعهد",
                book_id="ayman",
                chapter_id="ahd-wad",
                summary="الوفاء بالعهد واجب إذا كان في طاعة أو التزام مشروع.",
                evidence="﴿وَأَوْفُوا بِالْعَهْدِ﴾.",
                preferred="الوجوب في الوفاء المشروع.",
                keywords=["عهد"],
            ),
            lesson(
                id="ayman-khulf-wad",
                title="إخلاف الوعد",
                book_id="ayman",
                chapter_id="ahd-wad",
                summary="يُذم إخلاف الوعد، ويحرم إن عزم على الكذب من أول الأمر.",
                evidence="آيات وصف المنافقين بإخلاف الوعد.",
                preferred="الوفاء ديانةً مطلوب.",
                keywords=["وعد"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "nudhur-shurut",
        [
            lesson(
                id="nudhur-mubah",
                title="نذر المباح",
                book_id="ayman",
                chapter_id="nudhur-shurut",
                summary="نذر المباح لا يلزم لزوم نذر الطاعة على المذهب.",
                evidence="حديث «لا نذر إلا فيما ابتُغي به وجه الله».",
                preferred="عدم لزوم نذر المباح كلزوم الطاعة.",
                keywords=["نذر مباح"],
            ),
            lesson(
                id="nudhur-lajaj",
                title="نذر اللجاج والغضب",
                book_id="ayman",
                chapter_id="nudhur-shurut",
                summary="نذر اللجاج يُخرَّج على كفارة اليمين أو فعل المنذور على تفصيل المذهب.",
                evidence="تخريج الأصحاب على باب الأيمان.",
                preferred="كفارة أو وفاء بحسب الصورة.",
                keywords=["نذر لجاج"],
            ),
            lesson(
                id="nudhur-maasiya",
                title="نذر المعصية",
                book_id="ayman",
                chapter_id="nudhur-shurut",
                summary="لا نذر في معصية، ولا يجوز الوفاء به، وفي الكفارة قولان والمذهب يثبتها في الجملة.",
                evidence="حديث «من نذر أن يعصي الله فلا يعصه».",
                preferred="لا وفاء بالمعصية.",
                keywords=["نذر معصية"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "kaffarat",
        [
            lesson(
                id="ayman-kaffara-tartib",
                title="ترتيب كفارة اليمين",
                book_id="ayman",
                chapter_id="kaffarat",
                summary="إطعام عشرة مساكين أو كسوتهم أو تحرير رقبة، فمن لم يجد فصيام ثلاثة أيام.",
                evidence="المائدة: 89.",
                preferred="تخيير ثم صيام للعاجز.",
                keywords=["كفارة اليمين"],
            ),
            lesson(
                id="ayman-kaffara-taam",
                title="مقدار الإطعام في الكفارة",
                book_id="ayman",
                chapter_id="kaffarat",
                summary="يُطعم كل مسكين مدًّا من بر أو نحوه مما يجزئ في الكفارة على المذهب.",
                evidence="فقه الكفارات عند الحنابلة.",
                preferred="المدّ مجزئ على المعتمد.",
                keywords=["إطعام", "كفارة"],
            ),
        ],
    )
    n += add_chapter(
        book,
        chapter_shell(
            id="ayman-hinth",
            title="باب الحنث في اليمين",
            order=8,
            definition="الحنث مخالفة المحلوف عليه.",
            summary="إذا حنث في يمين منعقدة لزمته الكفارة، ويُستحب الحنث إن كان الخير في غيره.",
            evidence="حديث «فليأت الذي هو خير وليكفّر».",
            notes="الاستثناء بمشيئة الله يمنع الحنث إن اتصل.",
            topics=["حنث", "استثناء"],
            lessons=[
                lesson(
                    id="ayman-hinth-overview",
                    title="متى تجب الكفارة بالحنث",
                    book_id="ayman",
                    chapter_id="ayman-hinth",
                    summary="تجب الكفارة بالحنث في اليمين المنعقدة على مستقبل ممكن.",
                    evidence="آية المائدة وحديث التكفير.",
                    preferred="هذا أصل الباب.",
                    keywords=["حنث"],
                ),
                lesson(
                    id="ayman-istithna",
                    title="الاستثناء بمشيئة الله",
                    book_id="ayman",
                    chapter_id="ayman-hinth",
                    summary="من قال إن شاء الله متصلًا بيمينه لم يحنث.",
                    evidence="حديث الاستثناء في اليمين.",
                    preferred="الاستثناء المتصل مانع.",
                    keywords=["إن شاء الله"],
                ),
            ],
        ),
    )
    return n


def expand_jihad(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "jihad-hukm",
        [
            lesson(
                id="jihad-fard-ayn",
                title="متى يتعين الجهاد",
                book_id="jihad",
                chapter_id="jihad-hukm",
                summary="يتعين إذا حضر الصف، أو استنفر الإمام، أو دهم العدو البلد.",
                evidence="آيات النفير، وحديث «إذا استُنفرتم فانفروا».",
                preferred="كفاية أصلًا، ويتعيّن في هذه الأحوال.",
                keywords=["فرض عين", "جهاد"],
            ),
            lesson(
                id="jihad-idhn-walidayn",
                title="إذن الوالدين في جهاد الطلب",
                book_id="jihad",
                chapter_id="jihad-hukm",
                summary="في فرض الكفاية يُشترط إذن الأبوين المسلمين؛ وإذا تعيّن لم يُعتبر.",
                evidence="حديث من استأذن وله أبوان.",
                preferred="التفريق بين الكفاية والتعيين.",
                keywords=["إذن الوالدين"],
            ),
            lesson(
                id="jihad-niyya",
                title="النية في الجهاد",
                book_id="jihad",
                chapter_id="jihad-hukm",
                summary="لا يُقبل الجهاد إلا بإخلاص كون القتال لإعلاء كلمة الله.",
                evidence="حديث «من قاتل لتكون كلمة الله هي العليا».",
                preferred="الإخلاص شرط للأجر.",
                keywords=["نية الجهاد"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "qismat-ghanima",
        [
            lesson(
                id="jihad-ghanima-khums",
                title="خمس الغنيمة",
                book_id="jihad",
                chapter_id="qismat-ghanima",
                summary="يُخرج الخمس لأهله، والباقي للغانمين على سهامهم.",
                evidence="﴿وَاعْلَمُوا أَنَّمَا غَنِمْتُم مِّن شَيْءٍ فَأَنَّ لِلَّهِ خُمُسَهُ﴾.",
                preferred="أصل القسمة في المذهب.",
                keywords=["خمس", "غنيمة"],
            ),
            lesson(
                id="jihad-salab",
                title="السلب للقاتل",
                book_id="jihad",
                chapter_id="qismat-ghanima",
                summary="السلب للقاتل إذا قتله في المعركة على الصفة المعروفة.",
                evidence="حديث «من قتل قتيلًا فله سلبه».",
                preferred="يستحقه بالشرط.",
                keywords=["سلب"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "aman",
        [
            lesson(
                id="jihad-aman-aqd",
                title="عقد الأمان",
                book_id="jihad",
                chapter_id="aman",
                summary="الأمان يَحرُم به التعرض للمحارَب، ويصح من الإمام ومن آحاد المسلمين في الجملة.",
                evidence="آية الاستجارة، وحديث ذمة المسلمين.",
                preferred="ملزم بشروطه.",
                keywords=["أمان"],
            ),
            lesson(
                id="jihad-aman-wafaa",
                title="الوفاء بالأمان",
                book_id="jihad",
                chapter_id="aman",
                summary="يجب الوفاء بالأمان، ويحرم الغدر بعد إعطائه.",
                evidence="النصوص في الوفاء بالعهد وتحريم الغدر.",
                preferred="الوجوب والتحريم قاطعان.",
                keywords=["وفاء", "غدر"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "hudna",
        [
            lesson(
                id="jihad-hudna-maslaha",
                title="المهادنة للمصلحة",
                book_id="jihad",
                chapter_id="hudna",
                summary="تجوز المهادنة إن رأى الإمام المصلحة، كما في صلح الحديبية.",
                evidence="صلح الحديبية، وقواعد السياسة الشرعية.",
                preferred="الجواز للمصلحة.",
                keywords=["هدنة"],
            )
        ],
    )
    n += add_to_chapter(
        book,
        "jizya",
        [
            lesson(
                id="jihad-jizya-hukm",
                title="معنى الجزية وحكمها",
                book_id="jihad",
                chapter_id="jizya",
                summary="الجزية مال يُؤخذ من أهل الكتاب عند عقد الذمة في سياقها الفقهي المقرر.",
                evidence="آية التوبة في الجزية.",
                preferred="مشروعة في بابها الفقهي.",
                keywords=["جزية"],
            )
        ],
    )
    n += add_to_chapter(
        book,
        "fay",
        [
            lesson(
                id="jihad-fay-diff",
                title="الفرق بين الفيء والغنيمة",
                book_id="jihad",
                chapter_id="fay",
                summary="الغنيمة ما أُخذ بقتال، والفيء ما حصل بلا قتال؛ ومصارفهما مفصّلة في المذهب.",
                evidence="آيات الأنفال والحشر.",
                preferred="هذا التفريق المعتمد.",
                keywords=["فيء", "غنيمة"],
            )
        ],
    )
    n += add_chapter(
        book,
        chapter_shell(
            id="jihad-adab",
            title="باب آداب القتال والنهي عن الغدر",
            order=11,
            definition="ما يُشرع من الآداب وما يحرم من الغدر والغلول.",
            summary="يحرم الغدر والغلول، ويُنهى عن قتل غير المقاتلين على الأصل.",
            evidence="وصايا النبي ﷺ للجيوش.",
            notes="النوازل المعاصرة تُعرض على أهل العلم.",
            topics=["غدر", "غلول"],
            lessons=[
                lesson(
                    id="jihad-ghadr",
                    title="تحريم الغدر",
                    book_id="jihad",
                    chapter_id="jihad-adab",
                    summary="الغدر ونقض العهد بلا موجب شرعي محرَّم.",
                    evidence="أحاديث ذم الغدر.",
                    preferred="محرَّم.",
                    keywords=["غدر"],
                ),
                lesson(
                    id="jihad-ghulul",
                    title="الغلول من الغنيمة",
                    book_id="jihad",
                    chapter_id="jihad-adab",
                    summary="الغلول أخذ شيء من الغنيمة قبل القسمة محرَّم.",
                    evidence="آية الغلول وأحاديث الوعيد.",
                    preferred="محرَّم.",
                    keywords=["غلول"],
                ),
                lesson(
                    id="jihad-nahy-qatl-nisa",
                    title="النهي عن قتل النساء والصبيان",
                    book_id="jihad",
                    chapter_id="jihad-adab",
                    summary="يُنهى عن قتل النساء والصبيان غير المقاتلين في الأصل.",
                    evidence="نهي النبي ﷺ عن قتل النساء والصبيان.",
                    preferred="النهي محكم في أصله.",
                    keywords=["نساء", "صبيان"],
                ),
            ],
        ),
    )
    return n


def expand_itq(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "tadbir",
        [
            lesson(
                id="itq-tadbir-hukm",
                title="تعريف التدبير وحكمه",
                book_id="itq",
                chapter_id="tadbir",
                summary="التدبير تعليق العتق بالموت، وهو مشروع، ويُعتق من الثلث.",
                evidence="حديث التدبير، وفقه الوصايا.",
                preferred="صحيح نافذ من الثلث.",
                keywords=["تدبير"],
            ),
            lesson(
                id="itq-tadbir-raj",
                title="الرجوع عن التدبير",
                book_id="itq",
                chapter_id="tadbir",
                summary="في الرجوع عن التدبير وبيعه خلاف؛ ويُراجع المعتمد عند الحاجة.",
                evidence="روايات المذهب في المغني والزاد.",
                preferred="يُحرَّر من المطوّلات.",
                keywords=["رجوع التدبير"],
                sources=[src(ZAD, "التدبير"), src(MUGHNI, "التدبير")],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "ummahat-awlad",
        [
            lesson(
                id="itq-umm-walad",
                title="أحكام أم الولد",
                book_id="itq",
                chapter_id="ummahat-awlad",
                summary="أم الولد لا تُباع وتُعتق بموت سيدها من رأس المال على المذهب.",
                evidence="آثار الصحابة في أمهات الأولاد.",
                preferred="معتمد الحنابلة.",
                keywords=["أم ولد"],
            ),
            lesson(
                id="itq-umm-vs-mudabbar",
                title="الفرق بين أم الولد والمدبَّر",
                book_id="itq",
                chapter_id="ummahat-awlad",
                summary="أم الولد من رأس المال، والمدبَّر من الثلث؛ ولا تُباع أم الولد.",
                evidence="تفريق الأصحاب بين البابين.",
                preferred="هذا الفرق المعتمد.",
                keywords=["أم ولد", "مدبر"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "itq-fadl",
        [
            lesson(
                id="itq-kaffara",
                title="العتق في الكفارات",
                book_id="itq",
                chapter_id="itq-fadl",
                summary="العتق واجب في كفارات الظهار والقتل وجماع رمضان على الترتيب الشرعي.",
                evidence="آيات الكفارات.",
                preferred="يُفهم ضمن أبواب الكفارات.",
                keywords=["كفارة", "عتق"],
            ),
            lesson(
                id="itq-sarih",
                title="ألفاظ العتق",
                book_id="itq",
                chapter_id="itq-fadl",
                summary="للعتق صريح ينفذ بلا نية، وكناية تفتقر إلى نية.",
                evidence="قواعد الصريح والكناية.",
                preferred="الصريح بلا نية والكناية بالنية.",
                keywords=["ألفاظ العتق"],
            ),
            lesson(
                id="itq-fadl-ajr",
                title="فضل العتق",
                book_id="itq",
                chapter_id="itq-fadl",
                summary="العتق من أعظم القربات، وقد ورد فيه فضل عظيم في السنة.",
                evidence="أحاديث فضل العتق في الصحيحين.",
                preferred="قربة عظيمة في بابها.",
                keywords=["فضل العتق"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "kitaba",
        [
            lesson(
                id="itq-kitaba-hukm",
                title="الكتابة مشروعة",
                book_id="itq",
                chapter_id="kitaba",
                summary="الكتابة عقد يُكاتَب به الرقيق على مال فيعتق بالأداء، وهي مشروعة مندوبة عند الطلب مع القوة.",
                evidence="﴿فَكَاتِبُوهُمْ إِنْ عَلِمْتُمْ فِيهِمْ خَيْرًا﴾.",
                preferred="مشروعة مندوبة بالشرط.",
                keywords=["كتابة"],
            )
        ],
    )
    n += add_chapter(
        book,
        chapter_shell(
            id="itq-wala",
            title="باب الولاء",
            order=6,
            definition="الولاء رابطة للمُعتِق كعصوبة سببية.",
            summary="الولاء لمن أعتق، ولا يُباع ولا يُوهب.",
            evidence="حديث «إنما الولاء لمن أعتق».",
            notes="يُدرس لفهم الفرائض في التراث.",
            topics=["ولاء", "إرث"],
            lessons=[
                lesson(
                    id="itq-wala-overview",
                    title="الولاء لمن أعتق",
                    book_id="itq",
                    chapter_id="itq-wala",
                    summary="الولاء حق للمعتق وعصبته، ولا يصح بيعه ولا هبته.",
                    evidence="حديث بريرة في الصحيحين.",
                    preferred="نص المذهب.",
                    keywords=["ولاء"],
                ),
                lesson(
                    id="itq-wala-mirath",
                    title="إرث الولاء",
                    book_id="itq",
                    chapter_id="itq-wala",
                    summary="يرث المعتق عتيقه بالولاء إذا لم يُقدَّم وارث نسبي.",
                    evidence="حديث الولاء وأبواب الفرائض.",
                    preferred="معتمد الفرائض الحنبلية.",
                    keywords=["إرث الولاء"],
                    sources=[src(ZAD, "الولاء"), src(UMDA, "الفرائض")],
                ),
            ],
        ),
    )
    return n


def expand_sawm(book: dict) -> int:
    n = 0
    n += add_to_chapter(
        book,
        "ahkam-saim",
        [
            lesson(
                id="sawm-siwak",
                title="السواك للصائم",
                book_id="sawm",
                chapter_id="ahkam-saim",
                summary="يباح السواك للصائم طوال النهار على المذهب ولا يفطر.",
                evidence="عموم أحاديث السواك.",
                preferred="مباح.",
                keywords=["سواك"],
            ),
            lesson(
                id="sawm-kuhl",
                title="الكحل للصائم",
                book_id="sawm",
                chapter_id="ahkam-saim",
                summary="الكحل لا يفطر على الصحيح من المذهب.",
                evidence="آثار السلف واختيار الأصحاب.",
                preferred="لا فطر.",
                keywords=["كحل"],
            ),
            lesson(
                id="sawm-ghiba",
                title="الغيبة للصائم",
                book_id="sawm",
                chapter_id="ahkam-saim",
                summary="الغيبة محرمة وتنقص الأجر ولا تفطر عند الأصحاب.",
                evidence="حديث ترك قول الزور في البخاري.",
                preferred="تحريم بلا إفطار.",
                keywords=["غيبة"],
            ),
            lesson(
                id="sawm-suhoor",
                title="السحور وتأخيره وتعجيل الفطر",
                book_id="sawm",
                chapter_id="ahkam-saim",
                summary="يُستحب السحور وتأخيره، وتعجيل الفطر.",
                evidence="أحاديث السحور وتعجيل الفطر في الصحيح.",
                preferred="مستحب.",
                keywords=["سحور", "فطر"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "sawm-tatawwu",
        [
            lesson(
                id="sawm-ashura",
                title="صوم عاشوراء",
                book_id="sawm",
                chapter_id="sawm-tatawwu",
                summary="يُستحب صوم عاشوراء، ويُستحب معه التاسع.",
                evidence="أحاديث عاشوراء والتاسع.",
                preferred="مستحب مؤكد.",
                keywords=["عاشوراء"],
            ),
            lesson(
                id="sawm-arafah",
                title="صوم يوم عرفة",
                book_id="sawm",
                chapter_id="sawm-tatawwu",
                summary="يُستحب لغير الحاج؛ ويكفّر سنتين.",
                evidence="حديث مسلم في صوم عرفة.",
                preferred="مستحب لغير الحاج.",
                keywords=["عرفة"],
            ),
            lesson(
                id="sawm-ayyam-bid",
                title="صوم أيام البيض",
                book_id="sawm",
                chapter_id="sawm-tatawwu",
                summary="يُستحب صوم الثالث عشر والرابع عشر والخامس عشر.",
                evidence="أحاديث أيام البيض.",
                preferred="مستحب.",
                keywords=["أيام البيض"],
            ),
            lesson(
                id="sawm-ithnayn-khamis",
                title="صوم الإثنين والخميس",
                book_id="sawm",
                chapter_id="sawm-tatawwu",
                summary="يُستحب صوم الإثنين والخميس.",
                evidence="أحاديث عرض الأعمال فيهما.",
                preferred="مستحب.",
                keywords=["إثنين", "خميس"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "laylat-qadr",
        [
            lesson(
                id="sawm-laylat-qadr-talab",
                title="تحري ليلة القدر",
                book_id="sawm",
                chapter_id="laylat-qadr",
                summary="تُتحرَّى في العشر الأواخر، وآكدها الأوتار.",
                evidence="أحاديث الصحيحين.",
                preferred="سنة التحري.",
                keywords=["ليلة القدر"],
            ),
            lesson(
                id="sawm-laylat-qadr-dua",
                title="دعاء ليلة القدر",
                book_id="sawm",
                chapter_id="laylat-qadr",
                summary="يُستحب: «اللهم إنك عفو تحب العفو فاعف عني».",
                evidence="حديث عائشة.",
                preferred="مستحب.",
                keywords=["دعاء ليلة القدر"],
            ),
        ],
    )
    n += add_to_chapter(
        book,
        "arkan-sawm",
        [
            lesson(
                id="sawm-waqt-imsak",
                title="وقت الإمساك والإفطار",
                book_id="sawm",
                chapter_id="arkan-sawm",
                summary="الإمساك من طلوع الفجر الصادق إلى غروب الشمس.",
                evidence="آية البقرة في تبيّن الخيط الأبيض.",
                preferred="هذا حدّ الزمن الشرعي.",
                keywords=["إمساك", "فطر"],
            )
        ],
    )
    return n


def enrich(books: list[dict]) -> int:
    n = 0
    for b in books:
        for c in b.get("chapters") or []:
            for item in c.get("lessons") or []:
                changed = False
                if not item.get("definition"):
                    s = (item.get("summary") or "").strip()
                    item["definition"] = (s.split(".")[0] + ".") if s else item.get("title", "")
                    changed = True
                if not item.get("ruling"):
                    item["ruling"] = item.get("preferred") or ""
                    changed = True
                if not item.get("practicalSummary"):
                    item["practicalSummary"] = item.get("preferred") or ""
                    changed = True
                if not item.get("notes"):
                    item["notes"] = "محتوى تعليمي؛ يُرجع إلى أهل العلم في النوازل."
                    changed = True
                if not item.get("keywords"):
                    item["keywords"] = [
                        item.get("title", ""),
                        c.get("title", ""),
                        b.get("title", ""),
                        "فقه",
                        "حنبلي",
                    ]
                    changed = True
                if "needsReview" not in item:
                    item["needsReview"] = False
                    changed = True
                if changed:
                    n += 1
    return n


def count(books: list[dict]) -> dict:
    ch = sum(len(b.get("chapters") or []) for b in books)
    les = sum(
        len(c.get("lessons") or []) for b in books for c in (b.get("chapters") or [])
    )
    return {"books": len(books), "chapters": ch, "lessons": les}


def write_audit(books: list[dict], before: dict, after: dict) -> None:
    notes = {
        "itikaf": "توسعة مكثفة",
        "janaza": "توسعة كفن/تعزية/زيارة/إهداء",
        "libas": "توسعة عورة/محرّم/صلاة/صبيان",
        "ayman": "توسعة لغو/غموس/حنث/نذر",
        "jihad": "توسعة حكم/غنيمة/آداب",
        "itq": "توسعة تدبير/ولاء/كفارات",
        "sawm": "توسعة تطوع وآداب الصائم",
    }
    rows = [
        "# تدقيق محتوى الفقه",
        "",
        f"- التاريخ: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"- قبل هذه الجولة: {before['books']} كتب / {before['chapters']} بابًا / {before['lessons']} مسألة",
        f"- بعد: {after['books']} كتب / {after['chapters']} بابًا / {after['lessons']} مسألة",
        "",
        "| الكتاب | الأبواب | المسائل | الحالة | ملاحظات |",
        "|---|---:|---:|---|---|",
    ]
    for b in books:
        chs = b.get("chapters") or []
        les = [x for c in chs for x in (c.get("lessons") or [])]
        st = "يحتاج توسعة" if len(les) < 15 else "مكتمل"
        rows.append(
            f"| {b['title']} | {len(chs)} | {len(les)} | {st} | {notes.get(b['id'], '')} |"
        )
    rows += [
        "",
        "## يحتاج مراجعة شرعية (مؤجّل خارج الكتالوج العام)",
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
    AUDIT_PATH.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    data = json.loads(BOOKS_PATH.read_text(encoding="utf-8"))
    books = data["books"]
    before = count(books)
    by = {b["id"]: b for b in books}
    added = 0
    added += expand_itikaf(by["itikaf"])
    added += expand_janaza(by["janaza"])
    added += expand_libas(by["libas"])
    added += expand_ayman(by["ayman"])
    added += expand_jihad(by["jihad"])
    added += expand_itq(by["itq"])
    added += expand_sawm(by["sawm"])
    enriched = enrich(books)
    after = count(books)
    if isinstance(data.get("version"), int):
        data["version"] += 1
    data["generatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["books"] = books
    BOOKS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_audit(books, before, after)
    print(
        json.dumps(
            {"before": before, "after": after, "added": added, "enriched": enriched},
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
