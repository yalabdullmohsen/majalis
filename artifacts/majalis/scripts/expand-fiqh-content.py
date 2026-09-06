#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""توسيع محتوى الفقه + تقرير تدقيق (حنبلي تعليمي — ليس فتوى شخصية)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "content" / "fiqh" / "books.json"
AUDIT = ROOT / "fiqh-content-audit.md"
ALIASES = ROOT / "content" / "fiqh" / "book-aliases.json"

ZAD = ("زاد المستقنع", "شرف الدين الحجاوي")
RAWD = ("الروض المربع", "منصور البهوتي")
UMDA = ("عمدة الفقه", "ابن قدامة")
MUGHNI = ("المغني", "ابن قدامة")


def src(pair, ref: str) -> dict:
    return {"book": pair[0], "author": pair[1], "ref": ref}


def lesson(**kw) -> dict:
    needs = bool(kw.pop("needs_review", False))
    summary = kw["summary"]
    preferred = kw["preferred"]
    return {
        "id": kw["id"],
        "title": kw["title"],
        "bookId": kw["book_id"],
        "chapterId": kw["chapter_id"],
        "level": kw.get("level", "مبتدئ"),
        "madhhabNotes": preferred,
        "sources": kw["sources"],
        "status": "draft" if needs else "published",
        "summary": summary,
        "evidence": kw["evidence"],
        "preferred": preferred,
        "definition": kw.get("definition") or (summary.split(".")[0] + "."),
        "ruling": preferred,
        "notes": kw.get("notes")
        or "محتوى تعليمي وفق المذهب الحنبلي، وليس فتوى شخصية لحالة معينة.",
        "practicalSummary": kw.get("practical") or preferred,
        "keywords": kw.get("keywords") or [kw["title"]],
        "needsReview": needs,
    }


def chapter(**kw) -> dict:
    return {
        "id": kw["id"],
        "title": kw["title"],
        "order": kw["order"],
        "status": "published",
        "definition": kw["definition"],
        "topics": kw["topics"],
        "summary": kw["summary"],
        "evidence": kw["evidence"],
        "notes": kw["notes"],
        "sources": kw.get("sources") or [src(ZAD, kw["title"]), src(RAWD, kw["title"])],
        "lessons": kw["lessons"],
    }


def ensure_chapter(book: dict, ch: dict) -> bool:
    for ex in book.get("chapters") or []:
        if ex["id"] == ch["id"]:
            have = {x["id"] for x in ex.get("lessons") or []}
            changed = False
            for item in ch.get("lessons") or []:
                if item["id"] not in have:
                    ex.setdefault("lessons", []).append(item)
                    changed = True
            return changed
    book.setdefault("chapters", []).append(ch)
    book["chapters"].sort(key=lambda x: x.get("order", 0))
    return True


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
                    item["notes"] = (
                        item.get("madhhabNotes")
                        or "محتوى تعليمي؛ يُرجع إلى أهل العلم في النوازل."
                    )
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


def add_salah(book: dict) -> int:
    packs = [
        chapter(
            id="arkan-salah",
            title="باب أركان الصلاة",
            order=28,
            definition="أركان الصلاة ما تبطل بتركه عمدًا أو سهوًا ولا يجبره سجود السهو.",
            summary="من أركانها القيام مع القدرة وتكبيرة الإحرام والفاتحة والركوع والاعتدال والسجود والجلوس بين السجدتين والتشهد الأخير والتسليم مع الطمأنينة والترتيب.",
            evidence="حديث المسيء صلاته في الصحيحين أصل في ضبط الأركان.",
            notes="ترك الركن يُبطِل حتى يُدارك أو تُعاد الصلاة على التفصيل.",
            topics=["القيام", "تكبيرة الإحرام", "الفاتحة", "الركوع", "السجود", "التسليم"],
            lessons=[
                lesson(
                    id="salah-arkan-overview",
                    title="أركان الصلاة إجمالًا",
                    book_id="salah",
                    chapter_id="arkan-salah",
                    summary="الركن ما لا تصح الصلاة إلا به. ومن أشهر أركان الصلاة عند الحنابلة: القيام للقادر، وتكبيرة الإحرام، وقراءة الفاتحة، والركوع، والرفع منه، والسجود، والجلوس بين السجدتين، والطمأنينة، والتشهد الأخير وجلوسه، والصلاة على النبي ﷺ فيه، والترتيب، والتسليم.",
                    evidence="حديث المسيء صلاته: «ارجع فصلِّ فإنك لم تصلِّ» متفق عليه.",
                    preferred="المعتمد تعداد هذه الأركان مع الطمأنينة؛ ومن ترك ركنًا لم تصح صلاته حتى يأتي به أو يعيد وفق التفصيل.",
                    keywords=["أركان الصلاة", "طمأنينة", "صلاة"],
                    sources=[src(ZAD, "باب صفة الصلاة — الأركان"), src(RAWD, "باب صفة الصلاة")],
                ),
                lesson(
                    id="salah-arkan-fatiha",
                    title="قراءة الفاتحة ركن",
                    book_id="salah",
                    chapter_id="arkan-salah",
                    summary="قراءة الفاتحة ركن في كل ركعة للإمام والمنفرد. وأما المأموم ففي المذهب تفصيل معروف في الجهرية والسرية.",
                    evidence="قوله ﷺ: «لا صلاة لمن لم يقرأ بفاتحة الكتاب» متفق عليه.",
                    preferred="المعتمد ركنية الفاتحة، مع مراعاة خلاف المأموم المحرَّر في كتب المذهب.",
                    keywords=["الفاتحة", "أركان الصلاة"],
                    sources=[src(ZAD, "باب صفة الصلاة"), src(UMDA, "باب الصلاة")],
                ),
                lesson(
                    id="salah-arkan-tumanina",
                    title="الطمأنينة ركن",
                    book_id="salah",
                    chapter_id="arkan-salah",
                    summary="الطمأنينة في الركوع والاعتدال والسجود والجلوس بين السجدتين ركن؛ فلا تصح الصلاة مع العجلة التي تُذهب الطمأنينة.",
                    evidence="حديث المسيء صلاته، وفيه أمره بالطمأنينة في الأركان.",
                    preferred="المعتمد ركنية الطمأنينة في مواضعها.",
                    keywords=["طمأنينة", "أركان الصلاة"],
                    sources=[src(ZAD, "أركان الصلاة"), src(RAWD, "أركان الصلاة")],
                ),
            ],
        ),
        chapter(
            id="wajibat-salah",
            title="باب واجبات الصلاة",
            order=29,
            definition="واجبات الصلاة ما تبطل بتركه عمدًا ويجبره سجود السهو إذا تُرك سهوًا.",
            summary="منها تكبيرات الانتقال والتسميع والتحميد وتسبيح الركوع والسجود ورب اغفر لي والتشهد الأول وجلسته.",
            evidence="مداومة النبي ﷺ مع تفريق الأصحاب بين الركن والواجب.",
            notes="من شك في ترك واجبٍ سجد للسهو على التفصيل.",
            topics=["تكبيرات الانتقال", "التشهد الأول", "تسبيح الركوع"],
            lessons=[
                lesson(
                    id="salah-wajibat-overview",
                    title="واجبات الصلاة إجمالًا",
                    book_id="salah",
                    chapter_id="wajibat-salah",
                    summary="الواجب غير الركن: يأثم بتركه عمدًا وتبطل به على المذهب، وإن تُرك سهوًا جبره سجود السهو. ويشمل تكبيرات الانتقال غير الإحرام، والتسميع والتحميد، وتسبيحات الركوع والسجود، ورب اغفر لي، والتشهد الأول وجلوسه.",
                    evidence="مداومة النبي ﷺ على هذه الأذكار مع تفريق الفقهاء بين ما لا يسقط سهوًا وما يُجبر.",
                    preferred="هذا التفريق بين الركن والواجب معتمد في الزاد والروض.",
                    keywords=["واجبات الصلاة", "سجود السهو"],
                    sources=[src(ZAD, "واجبات الصلاة"), src(RAWD, "واجبات الصلاة")],
                ),
                lesson(
                    id="salah-wajibat-tashahhud-awwal",
                    title="التشهد الأول واجب",
                    book_id="salah",
                    chapter_id="wajibat-salah",
                    summary="التشهد الأول وجلسته من واجبات الصلاة؛ فمن تركه عمدًا بطلت، ومن تركه سهوًا سجد للسهو.",
                    evidence="حديث ابن بحينة في الصحيحين في سجود النبي ﷺ لترك التشهد الأول.",
                    preferred="المعتمد وجوبه مع جبره بسجود السهو عند السهو.",
                    keywords=["التشهد الأول", "واجبات الصلاة"],
                    sources=[src(ZAD, "واجبات الصلاة"), src(RAWD, "سجود السهو")],
                ),
            ],
        ),
        chapter(
            id="sunan-salah",
            title="باب سنن الصلاة",
            order=30,
            definition="سنن الصلاة ما يُثاب على فعله ولا تبطل بتركه.",
            summary="سنن قولية كالاستفتاح وفعلية كرفع اليدين ووضع اليمنى على اليسرى.",
            evidence="أحاديث الاستفتاح ورفع اليدين في الصحيح والسنن.",
            notes="ترك السنة لا يوجب سجود سهو عند الجمهور من الأصحاب.",
            topics=["الاستفتاح", "رفع اليدين"],
            lessons=[
                lesson(
                    id="salah-sunan-overview",
                    title="سنن الصلاة القولية والفعلية",
                    book_id="salah",
                    chapter_id="sunan-salah",
                    summary="من سنن الصلاة: الاستفتاح، والتعوذ، والبسملة، وآمين، وقراءة سورة بعد الفاتحة، ورفع اليدين في مواضعه، ووضع اليمنى على اليسرى، وغير ذلك مما فصّله الأصحاب.",
                    evidence="أحاديث الاستفتاح ورفع اليدين ووضع اليمنى على اليسرى.",
                    preferred="يُستحب الإتيان بالسنن؛ وتركها لا يبطل الصلاة.",
                    keywords=["سنن الصلاة", "الاستفتاح"],
                    sources=[src(ZAD, "سنن الصلاة"), src(RAWD, "سنن الصلاة")],
                )
            ],
        ),
        chapter(
            id="mubtilat-salah",
            title="باب مبطلات الصلاة",
            order=31,
            definition="مبطلات الصلاة ما يفسدها إذا وُجد على صفته المعتبرة.",
            summary="منها ترك ركن أو شرط مع القدرة والكلام العمد والعمل الكثير والضحك والحدث.",
            evidence="حديث: «إن هذه الصلاة لا يصلح فيها شيء من كلام الناس» رواه مسلم.",
            notes="يُفرَّق بين اليسير والكثير، والناسي والعامد.",
            topics=["الكلام", "العمل الكثير", "الحدث"],
            lessons=[
                lesson(
                    id="salah-mubtilat-overview",
                    title="مبطلات الصلاة إجمالًا",
                    book_id="salah",
                    chapter_id="mubtilat-salah",
                    summary="تبطل الصلاة بتعمّد ترك شرط أو ركن، وبالحدث، وكشف العورة مع القدرة، واستدبار القبلة لغير عذر، والكلام العمد، والعمل الكثير المتوالي من غير جنسها، والقهقهة، على التفصيل المقرر.",
                    evidence="قوله ﷺ: «إن هذه الصلاة لا يصلح فيها شيء من كلام الناس» رواه مسلم.",
                    preferred="المعتمد بطلانها بهذه المبطلات مع مراعاة العذر والسهو.",
                    keywords=["مبطلات الصلاة", "حدث", "كلام"],
                    sources=[src(ZAD, "مبطلات الصلاة"), src(RAWD, "مبطلات الصلاة")],
                ),
                lesson(
                    id="salah-mubtilat-kalam",
                    title="الكلام في الصلاة",
                    book_id="salah",
                    chapter_id="mubtilat-salah",
                    summary="كلام الآدميين العمد يبطل الصلاة، وأما الناسي والجاهل ففي المذهب تفصيل؛ وإصلاح الصلاة بكلام يسير لمصلحتها له حكمه المحرَّر.",
                    evidence="حديث معاوية بن الحكم في مسلم في النهي عن كلام الناس في الصلاة.",
                    preferred="المعتمد بطلان العمد، مع تفصيل العذر في كتب المذهب.",
                    keywords=["كلام الصلاة", "مبطلات"],
                    sources=[src(ZAD, "مبطلات الصلاة"), src(MUGHNI, "مبطلات الصلاة")],
                ),
            ],
        ),
    ]
    return sum(1 for ch in packs if ensure_chapter(book, ch))


def add_sawm(book: dict) -> int:
    packs = [
        chapter(
            id="shurut-sawm",
            title="باب شروط الصيام",
            order=7,
            definition="شروط وجوب وأداء صيام رمضان.",
            summary="الإسلام والبلوغ والعقل والقدرة والإقامة وخلو المرأة من الحيض والنفاس، مع تبييت النية في الفرض.",
            evidence="آيات البقرة في الصيام، وحديث تبييت النية.",
            notes="المسافر والمريض يفطران ويقضيان.",
            topics=["النية", "البلوغ", "الحيض"],
            lessons=[
                lesson(
                    id="sawm-shurut-wujub",
                    title="شروط وجوب صوم رمضان",
                    book_id="sawm",
                    chapter_id="shurut-sawm",
                    summary="يجب صوم رمضان على المسلم البالغ العاقل القادر المقيم. وتقضي الحائض والنفساء بعد الطهر، ولا يجب على المجنون، ويُمرَّن الصبي.",
                    evidence="﴿فَمَن شَهِدَ مِنكُمُ الشَّهْرَ فَلْيَصُمْهُ﴾ البقرة: 185.",
                    preferred="هذا مقرر المذهب في شروط الوجوب مع القضاء على المعذورين.",
                    keywords=["شروط الصيام", "رمضان"],
                    sources=[src(ZAD, "كتاب الصيام"), src(UMDA, "كتاب الصيام")],
                ),
                lesson(
                    id="sawm-shurut-niyya",
                    title="النية في صوم الفرض",
                    book_id="sawm",
                    chapter_id="shurut-sawm",
                    summary="لا يصح صوم الفرض إلا بنية من الليل لكل يوم على المذهب، وتصح نية التطوع من النهار إذا لم يسبق مفطر.",
                    evidence="حديث: «من لم يبيّت الصيام من الليل فلا صيام له» رواه أصحاب السنن وصححه جمع من أهل العلم.",
                    preferred="المعتمد تبييت النية في الفرض؛ وفي النفل سعة.",
                    keywords=["نية الصيام", "تبييت"],
                    sources=[src(ZAD, "باب نية الصوم"), src(RAWD, "باب نية الصوم")],
                ),
            ],
        ),
        chapter(
            id="arkan-sawm",
            title="باب أركان الصيام",
            order=8,
            definition="ركن الصيام الإمساك عن المفطرات من طلوع الفجر إلى الغروب مع النية.",
            summary="حقيقة الصوم إمساك مخصوص بنية في زمن مخصوص.",
            evidence="﴿ثُمَّ أَتِمُّوا الصِّيَامَ إِلَى اللَّيْلِ﴾.",
            notes="يُراجع باب المفطرات لتفصيل ما يقطع الإمساك.",
            topics=["الإمساك", "الوقت"],
            lessons=[
                lesson(
                    id="sawm-arkan-imsak",
                    title="ركن الإمساك عن المفطرات",
                    book_id="sawm",
                    chapter_id="arkan-sawm",
                    summary="ركن الصوم الإمساك عن الأكل والشرب والجماع وسائر المفطرات من طلوع الفجر الصادق إلى غروب الشمس، مع النية.",
                    evidence="﴿وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ...﴾ البقرة: 187.",
                    preferred="هذا حدّ الصوم الشرعي عند الحنابلة.",
                    keywords=["أركان الصيام", "إمساك"],
                    sources=[src(ZAD, "كتاب الصيام"), src(RAWD, "كتاب الصيام")],
                )
            ],
        ),
        chapter(
            id="adhar-fitr",
            title="باب الأعذار المبيحة للفطر",
            order=9,
            definition="الأعذار التي تبيح الفطر في رمضان.",
            summary="المرض والسفر والحيض والنفاس والحمل والرضاع عند الحاجة، والكبر والعجز.",
            evidence="آية ﴿فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ عَلَىٰ سَفَرٍ...﴾.",
            notes="من أفطر بعذر قضى؛ ومن عجز عجزًا مستمرًا أطعم على التفصيل.",
            topics=["مرض", "سفر", "حمل"],
            lessons=[
                lesson(
                    id="sawm-adhar-overview",
                    title="الأعذار المبيحة للفطر",
                    book_id="sawm",
                    chapter_id="adhar-fitr",
                    summary="يباح الفطر للمريض الذي يشق عليه الصوم، والمسافر سفر قصر، والحائض والنفساء، والحامل والمرضع إذا خافتا على أنفسهما أو ولدهما، والعاجز لكبر.",
                    evidence="البقرة: 184–185 في الترخيص للمريض والمسافر والإطعام للعاجز.",
                    preferred="المعتمد الإباحة مع القضاء أو الإطعام بحسب العذر.",
                    keywords=["أعذار الفطر", "سفر", "مرض"],
                    sources=[src(ZAD, "كتاب الصيام"), src(RAWD, "كتاب الصيام")],
                ),
                lesson(
                    id="sawm-adhar-safar",
                    title="فطر المسافر",
                    book_id="sawm",
                    chapter_id="adhar-fitr",
                    summary="يباح الفطر في سفر القصر، والصوم أفضل إن لم يشق، والفطر أفضل إن شق أو تضرر، ويقضي أيامًا أخر.",
                    evidence="﴿فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ عَلَىٰ سَفَرٍ فَعِدَّةٌ مِّنْ أَيَّامٍ أُخَرَ﴾.",
                    preferred="هذا اختيار المذهب مع مراعاة المشقة.",
                    keywords=["فطر المسافر", "سفر"],
                    sources=[src(ZAD, "كتاب الصيام"), src(RAWD, "كتاب الصيام")],
                ),
            ],
        ),
    ]
    return sum(1 for ch in packs if ensure_chapter(book, ch))


def add_zakat(book: dict) -> int:
    packs = [
        chapter(
            id="shurut-zakat",
            title="باب شروط وجوب الزكاة",
            order=0,
            definition="ما يتوقف عليه وجوب الزكاة.",
            summary="الإسلام والحرية وملك النصاب واستقرار الملك وحولان الحول فيما يُشترط فيه الحول.",
            evidence="أحاديث النصاب والحول في السنة.",
            notes="لكل مال تفصيل نصابه في بابه.",
            topics=["نصاب", "حول", "ملك"],
            lessons=[
                lesson(
                    id="zakat-shurut-overview",
                    title="شروط وجوب الزكاة",
                    book_id="zakat",
                    chapter_id="shurut-zakat",
                    summary="تجب الزكاة على المسلم الحر إذا ملك نصابًا ملكًا تامًا وحال عليه الحول في الأثمان والماشية والعروض، وأما الزروع فتجب ببدوّ الصلاح على التفصيل.",
                    evidence="أحاديث نصب الزكاة، وحديث «لا زكاة في مال حتى يحول عليه الحول» عند أصحاب السنن.",
                    preferred="هذا إجمال شروط الوجوب على المذهب.",
                    keywords=["شروط الزكاة", "نصاب", "حول"],
                    sources=[src(ZAD, "كتاب الزكاة"), src(UMDA, "كتاب الزكاة")],
                ),
                lesson(
                    id="zakat-shurut-hawl",
                    title="حولان الحول",
                    book_id="zakat",
                    chapter_id="shurut-zakat",
                    summary="يشترط حولان الحول في زكاة النقدين وعروض التجارة وبهيمة الأنعام، ولا يشترط في الزروع والثمار والمعادن والركاز على التفصيل.",
                    evidence="حديث الحول عند أهل السنن، مع عمل الصحابة وفقه المذهب.",
                    preferred="المعتمد اشتراط الحول فيما ذُكر واستثناء الزروع ونحوها.",
                    keywords=["حول الزكاة", "نصاب"],
                    sources=[src(ZAD, "كتاب الزكاة"), src(RAWD, "كتاب الزكاة")],
                ),
            ],
        ),
    ]
    return sum(1 for ch in packs if ensure_chapter(book, ch))


def add_hajj(book: dict) -> int:
    packs = [
        chapter(
            id="arkan-hajj",
            title="باب أركان الحج",
            order=13,
            definition="أركان الحج التي لا يتم إلا بها.",
            summary="الإحرام، والوقوف بعرفة، وطواف الإفاضة، والسعي على المذهب.",
            evidence="حديث «الحج عرفة» وأدلة الطواف والسعي.",
            notes="من فاته ركن لم يتم حجه حتى يأتي به.",
            topics=["إحرام", "عرفة", "طواف", "سعي"],
            lessons=[
                lesson(
                    id="hajj-arkan-overview",
                    title="أركان الحج",
                    book_id="hajj",
                    chapter_id="arkan-hajj",
                    summary="أركان الحج عند الحنابلة: الإحرام، والوقوف بعرفة، وطواف الزيارة، والسعي. فمن ترك ركنًا لم يتم حجه حتى يأتي به.",
                    evidence="حديث «الحج عرفة»، مع أدلة الطواف والسعي.",
                    preferred="هذا تعداد الأركان في الزاد والروض.",
                    keywords=["أركان الحج", "عرفة"],
                    sources=[src(ZAD, "باب صفة الحج"), src(RAWD, "باب صفة الحج")],
                ),
                lesson(
                    id="hajj-arkan-arafa",
                    title="الوقوف بعرفة ركن",
                    book_id="hajj",
                    chapter_id="arkan-hajj",
                    summary="الوقوف بعرفة ركن الحج الأعظم، ووقته من زوال يوم عرفة إلى فجر يوم النحر على المذهب، ومن فاته فاته الحج.",
                    evidence="قوله ﷺ: «الحج عرفة».",
                    preferred="المعتمد ركنيته مع ضبط الوقت في كتب المناسك.",
                    keywords=["عرفة", "أركان الحج"],
                    sources=[src(ZAD, "صفة الحج"), src(RAWD, "صفة الحج")],
                ),
            ],
        ),
        chapter(
            id="wajibat-hajj",
            title="باب واجبات الحج",
            order=14,
            definition="واجبات الحج التي تُجبر بدم إذا تُركت بلا عذر.",
            summary="الإحرام من الميقات، والوقوف إلى الليل، والمبيت، والرمي، والحلق أو التقصير، وطواف الوداع على التفصيل.",
            evidence="أحاديث المواقيت والرمي والمبيت والوداع.",
            notes="ترك الواجب يوجب دمًا عند الحنابلة ما لم يُعذر.",
            topics=["ميقات", "رمي", "مبيت", "وداع"],
            lessons=[
                lesson(
                    id="hajj-wajibat-overview",
                    title="واجبات الحج",
                    book_id="hajj",
                    chapter_id="wajibat-hajj",
                    summary="من واجبات الحج: الإحرام من الميقات، ومزيد الوقوف بعرفة إلى الغروب، والمبيت بمزدلفة ومنى، ورمي الجمار، والحلق أو التقصير، وطواف الوداع لغير الحائض على المذهب.",
                    evidence="أحاديث المواقيت والرمي والمبيت وطواف الوداع.",
                    preferred="ترك الواجب يوجب دمًا ما لم يُعذر.",
                    keywords=["واجبات الحج", "دم"],
                    sources=[src(ZAD, "باب صفة الحج"), src(RAWD, "باب صفة الحج")],
                ),
                lesson(
                    id="hajj-wajibat-miqat",
                    title="الإحرام من الميقات واجب",
                    book_id="hajj",
                    chapter_id="wajibat-hajj",
                    summary="يجب الإحرام من الميقات المكاني لمن مرّ به يريد نسكًا؛ فمن جاوزه غير محرم لزمه دم على المذهب ما لم يرجع فيحرم منه.",
                    evidence="أحاديث المواقيت في الصحيحين.",
                    preferred="هذا واجب عند الحنابلة، وتركه يوجب دمًا.",
                    keywords=["ميقات", "إحرام"],
                    sources=[src(ZAD, "باب المواقيت"), src(RAWD, "باب المواقيت")],
                ),
            ],
        ),
    ]
    return sum(1 for ch in packs if ensure_chapter(book, ch))


def expand_thin(book: dict, packs: list[dict]) -> int:
    return sum(1 for ch in packs if ensure_chapter(book, ch))


def thin_itikaf(book: dict) -> int:
    return expand_thin(
        book,
        [
            chapter(
                id="itikaf-niyya",
                title="باب نية الاعتكاف",
                order=5,
                definition="ما تُشترط له النية في الاعتكاف.",
                summary="الاعتكاف عبادة تفتقر إلى نية، ويصح في المسجد مع الصوم في المذهب على التفصيل.",
                evidence="﴿وَلَا تُبَاشِرُوهُنَّ وَأَنتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ﴾.",
                notes="يُراجع شروط المسجد والصوم في المذهب.",
                topics=["نية", "مسجد"],
                lessons=[
                    lesson(
                        id="itikaf-niyya-overview",
                        title="نية الاعتكاف",
                        book_id="itikaf",
                        chapter_id="itikaf-niyya",
                        summary="لا يصح الاعتكاف إلا بنية؛ وهو لزوم مسجد لطاعة الله تعالى على الصفة الشرعية.",
                        evidence="آية البقرة في العكوف في المساجد، وحديث اعتكاف النبي ﷺ.",
                        preferred="المعتمد افتقاره للنية وكونه في المسجد.",
                        keywords=["اعتكاف", "نية"],
                        sources=[src(ZAD, "باب الاعتكاف"), src(RAWD, "باب الاعتكاف")],
                    )
                ],
            ),
            chapter(
                id="itikaf-mustahabb",
                title="باب آداب الاعتكاف ومستحباته",
                order=6,
                definition="ما يُستحب للمعتكف من أعمال.",
                summary="يُستحب الإكثار من الذكر وتلاوة القرآن، واجتناب ما لا يعنيه.",
                evidence="اعتكاف النبي ﷺ في العشر الأواخر.",
                notes="يخرج لما لا بد منه كحاجة الإنسان.",
                topics=["ذكر", "قرآن", "خروج"],
                lessons=[
                    lesson(
                        id="itikaf-adab",
                        title="آداب المعتكف",
                        book_id="itikaf",
                        chapter_id="itikaf-mustahabb",
                        summary="يُستحب للمعتكف شغل وقته بالعبادة، ويباح خروجه لما لا بد منه، ويبطل بما يقطع الاعتكاف من الجماع ونحوه على التفصيل.",
                        evidence="فعل النبي ﷺ في اعتكافه وخروجه للحاجة.",
                        preferred="هذا الأدب المعتمد مع الرجوع لباب المبطلات.",
                        keywords=["آداب الاعتكاف"],
                        sources=[src(ZAD, "الاعتكاف"), src(RAWD, "الاعتكاف")],
                    )
                ],
            ),
        ],
    )


def thin_atima(book: dict) -> int:
    return expand_thin(
        book,
        [
            chapter(
                id="atima-halal-haram",
                title="باب أصول الحلال والحرام في الطعام",
                order=6,
                definition="ضوابط ما يحل ويحرم من المطاعم.",
                summary="الأصل في الأعيان الطاهرة الحل، ويحرم الخبيث والنجس وما نص الشرع على تحريمه.",
                evidence="﴿يَسْأَلُونَكَ مَاذَا أُحِلَّ لَهُمْ...﴾ و﴿حُرِّمَتْ عَلَيْكُمُ الْمَيْتَةُ﴾.",
                notes="الذكاة شرط لحل ما يُذكّى من الحيوان.",
                topics=["حل", "حرمة", "ميتة"],
                lessons=[
                    lesson(
                        id="atima-asl-halal",
                        title="الأصل في الطعام الحل",
                        book_id="atima",
                        chapter_id="atima-halal-haram",
                        summary="الأصل حل الطيبات، وتحريم الميتة والدم ولحم الخنزير وما أهل لغير الله به، والخبيث من السباع والطير على المذهب.",
                        evidence="المائدة: 3، والأنعام في الطيبات.",
                        preferred="المعتمد حل الطيب وتحريم المنصوص والخبائث.",
                        keywords=["أطعمة", "حلال", "حرام"],
                        sources=[src(ZAD, "باب الأطعمة"), src(RAWD, "باب الأطعمة")],
                    ),
                    lesson(
                        id="atima-mayta",
                        title="الميتة والدم",
                        book_id="atima",
                        chapter_id="atima-halal-haram",
                        summary="تحرم الميتة والدم المسفوح، وتستثنى ميتة السمك والجراد على السنة، ودم الكبد والطحال في الرخصة المعروفة.",
                        evidence="﴿حُرِّمَتْ عَلَيْكُمُ الْمَيْتَةُ وَالدَّمُ﴾، وحديث «أحلت لنا ميتتان ودمان».",
                        preferred="المعتمد التحريم مع الاستثناءات الشرعية.",
                        keywords=["ميتة", "دم"],
                        sources=[src(ZAD, "الأطعمة"), src(UMDA, "الأطعمة")],
                    ),
                ],
            ),
            chapter(
                id="atima-shubha",
                title="باب الشبهة في الأطعمة",
                order=7,
                definition="ما اشتبه حله وحرمته.",
                summary="يُورع عن الشبهة، وإن اختلط مباح بمحظور يُرجع إلى قواعد التمييز.",
                evidence="حديث «الحلال بيّن والحرام بيّن».",
                notes="الصور المعاصرة من الاستحالة والمضافات تحتاج تحريرًا.",
                topics=["ورع", "اختلاط"],
                lessons=[
                    lesson(
                        id="atima-shubha-overview",
                        title="الورع عن الشبهة",
                        book_id="atima",
                        chapter_id="atima-shubha",
                        summary="الحلال بيّن والحرام بيّن، وبينهما أمور مشتبهات؛ فالورع ترك الشبهة، والحكم القطعي في الصور المعاصرة يُحرَّر بأهل العلم.",
                        evidence="حديث النعمان بن بشير في الصحيحين.",
                        preferred="الورع مندوب؛ والجزم في النوازل يحتاج فتوى محرَّرة.",
                        keywords=["شبهة", "أطعمة"],
                        sources=[src(RAWD, "الأطعمة"), src(MUGHNI, "الأطعمة")],
                        needs_review=True,
                    )
                ],
            ),
        ],
    )


def thin_ayman(book: dict) -> int:
    return expand_thin(
        book,
        [
            chapter(
                id="ayman-shurut",
                title="باب شروط انعقاد اليمين",
                order=6,
                definition="ما تنعقد به اليمين الشرعية.",
                summary="تنعقد اليمين بالله أو صفة من صفاته من مكلَّف على أمر مستقبل ممكن.",
                evidence="﴿لَا يُؤَاخِذُكُمُ اللَّهُ بِاللَّغْوِ فِي أَيْمَانِكُمْ﴾.",
                notes="اليمين الغموس واللغو لهما تفصيل.",
                topics=["انعقاد", "لغو", "غموس"],
                lessons=[
                    lesson(
                        id="ayman-inqad",
                        title="انعقاد اليمين",
                        book_id="ayman",
                        chapter_id="ayman-shurut",
                        summary="تنعقد اليمين بالحلف بالله أو باسم من أسمائه أو صفة من صفاته، ويُشترط أن تكون على مستقبل ممكن من مكلَّف.",
                        evidence="آيات الأيمان في المائدة والبقرة.",
                        preferred="هذا ضابط الانعقاد في المذهب.",
                        keywords=["يمين", "انعقاد"],
                        sources=[src(ZAD, "كتاب الأيمان"), src(RAWD, "كتاب الأيمان")],
                    ),
                    lesson(
                        id="ayman-kaffara-overview",
                        title="كفارة اليمين إجمالًا",
                        book_id="ayman",
                        chapter_id="ayman-shurut",
                        summary="كفارة اليمين: إطعام عشرة مساكين أو كسوتهم أو تحرير رقبة، فمن لم يجد فصيام ثلاثة أيام.",
                        evidence="المائدة: 89.",
                        preferred="الترتيب والتخيير على ما قرره المذهب في الكفارة.",
                        keywords=["كفارة اليمين"],
                        sources=[src(ZAD, "باب الكفارات"), src(UMDA, "الكفارات")],
                    ),
                ],
            ),
            chapter(
                id="nudhur-shurut",
                title="باب أحكام النذر الأساسية",
                order=7,
                definition="النذر إلزام المكلَّف نفسه بما ليس بلازم.",
                summary="يصح نذر الطاعة ويجب الوفاء، ولا نذر في معصية، ونذر المباح له حكمه.",
                evidence="حديث «من نذر أن يطيع الله فليطعه».",
                notes="نذر اللجاج والغضب يُخرَّج على الكفارة أو الوفاء على التفصيل.",
                topics=["نذر طاعة", "نذر لجاج"],
                lessons=[
                    lesson(
                        id="nudhur-taa",
                        title="نذر الطاعة",
                        book_id="ayman",
                        chapter_id="nudhur-shurut",
                        summary="من نذر طاعة وجب عليه الوفاء بها، ومن نذر معصية فلا وفاء وعليه كفارة يمين على المذهب في الجملة.",
                        evidence="حديث «من نذر أن يطيع الله فليطعه، ومن نذر أن يعصي الله فلا يعصه».",
                        preferred="المعتمد وجوب الوفاء بنذر الطاعة.",
                        keywords=["نذر", "طاعة"],
                        sources=[src(ZAD, "باب النذور"), src(RAWD, "باب النذور")],
                    )
                ],
            ),
        ],
    )


def thin_jihad(book: dict) -> int:
    return expand_thin(
        book,
        [
            chapter(
                id="jihad-hukm",
                title="باب حكم الجهاد وشروطه",
                order=10,
                definition="ما يتعلق بفرضية الجهاد وضوابطه الشرعية.",
                summary="الجهاد مشروع بشروطه، وهو فرض كفاية إذا قام به من يكفي، ويتعيّن في أحوال مخصوصة.",
                evidence="آيات الجهاد في البقرة والأنفال والتوبة.",
                notes="تطبيق النوازل العسكرية المعاصرة يحتاج إلى أهل العلم والولايات الشرعية.",
                topics=["فرض كفاية", "شروط"],
                lessons=[
                    lesson(
                        id="jihad-hukm-overview",
                        title="حكم الجهاد إجمالًا",
                        book_id="jihad",
                        chapter_id="jihad-hukm",
                        summary="الجهاد في سبيل الله مشروع، وهو في الأصل فرض كفاية، ويتعيّن إذا حضر الصف أو استنفر الإمام أو دهم العدو البلد على التفصيل المقرر عند أهل السنة.",
                        evidence="﴿كُتِبَ عَلَيْكُمُ الْقِتَالُ...﴾ مع أحاديث فرض الكفاية.",
                        preferred="المعتمد فرض الكفاية مع موجبات التعيين.",
                        keywords=["جهاد", "فرض كفاية"],
                        sources=[src(ZAD, "كتاب الجهاد"), src(RAWD, "كتاب الجهاد")],
                    ),
                    lesson(
                        id="jihad-contemporary",
                        title="نوازل الجهاد المعاصرة",
                        book_id="jihad",
                        chapter_id="jihad-hukm",
                        summary="صور النزاعات المعاصرة والتنظيمات غير المنضبطة تحتاج تحريرًا من الهيئات العلمية المعتبرة، ولا يُنزل عليها كلام المتون تنزيلًا آليًا.",
                        evidence="قواعد السياسة الشرعية وفتاوى أهل العلم في النوازل.",
                        preferred="يُرجع في النوازل إلى العلماء الربانيين والولايات الشرعية؛ ولا تُعرض هنا كحكم نهائي.",
                        keywords=["نوازل الجهاد"],
                        sources=[src(MUGHNI, "الجهاد"), src(RAWD, "الجهاد")],
                        needs_review=True,
                    ),
                ],
            ),
        ],
    )


def thin_itq(book: dict) -> int:
    return expand_thin(
        book,
        [
            chapter(
                id="itq-fadl",
                title="باب فضل العتق وأحكامه العامة",
                order=5,
                definition="العتق تحرير الرقبة من الرق.",
                summary="العتق قربة عظيمة، وله صيغ وأحكام في التدبير والكتابة وأم الولد.",
                evidence="أحاديث فضل العتق في الصحيحين.",
                notes="أحكام الرق التاريخية تُدرس فقهيًا دون إسقاط خاطئ على الواقع المعاصر.",
                topics=["عتق", "قربة"],
                lessons=[
                    lesson(
                        id="itq-fadl-overview",
                        title="فضل العتق",
                        book_id="itq",
                        chapter_id="itq-fadl",
                        summary="العتق من أعظم القربات، وقد رتّب الشارع عليه أجرًا عظيمًا، وتُدرس مسائله لفهم أبواب الكفارات والوصايا في التراث الفقهي.",
                        evidence="أحاديث فضل العتق في الصحيحين.",
                        preferred="يُفهم الباب ضمن سياقه الفقهي التاريخي.",
                        keywords=["عتق", "فضل"],
                        sources=[src(ZAD, "كتاب العتق"), src(UMDA, "العتق")],
                    )
                ],
            ),
        ],
    )


def thin_qada(book: dict) -> int:
    return expand_thin(
        book,
        [
            chapter(
                id="qada-shurut-qadi",
                title="باب شروط القاضي",
                order=19,
                definition="ما يُشترط فيمن يتولى القضاء.",
                summary="يشترط في القاضي الإسلام والبلوغ والعقل والحرية والعدالة والعلم بما يقضي به على المذهب.",
                evidence="أدلة ولاية القضاء من الكتاب والسنة وعمل الخلفاء.",
                notes="تفاصيل الولاية المعاصرة تُحرَّر في أنظمة القضاء الشرعية.",
                topics=["عدالة", "علم", "ولاية"],
                lessons=[
                    lesson(
                        id="qada-shurut-overview",
                        title="شروط تولية القاضي",
                        book_id="qada",
                        chapter_id="qada-shurut-qadi",
                        summary="لا يُولَّى القضاء إلا من جمع شروطه الشرعية من الإسلام والتكليف والعدالة والكفاية العلمية؛ والقضاء فصل الخصومات بحكم الشرع.",
                        evidence="آيات الحكم بما أنزل الله، وحديث «القضاة ثلاثة».",
                        preferred="المعتمد اشتراط العدالة والعلم والكفاية.",
                        keywords=["قاضي", "شروط القضاء"],
                        sources=[src(ZAD, "كتاب القضاء"), src(RAWD, "كتاب القضاء")],
                    )
                ],
            ),
        ],
    )


def build_libas() -> dict:
    return {
        "id": "libas",
        "title": "كتاب اللباس والزينة",
        "description": "أحكام اللباس وستر العورة وما يحرم أو يباح من الزينة، بأسلوب تعليمي على المذهب الحنبلي.",
        "orderReason": "أُفرد لسهولة التعلّم بعد الأطعمة؛ ومسائله مبثوثة في أبواب العورة واللباس من كتب المذهب.",
        "category": "ibadat",
        "order": 13,
        "status": "published",
        "aliases": ["اللباس", "الزينة", "الحرير"],
        "sources": [src(ZAD, "أبواب اللباس والزينة"), src(RAWD, "أبواب اللباس")],
        "chapters": [
            chapter(
                id="libas-awra",
                title="باب ستر العورة في اللباس",
                order=1,
                definition="ما يجب ستره من البدن في الصلاة وخارجها.",
                summary="عورة الرجل ما بين السرة والركبة، وعورة المرأة الحرة في الصلاة كل البدن إلا الوجه على المذهب.",
                evidence="أدلة ستر العورة في الكتاب والسنة.",
                notes="يُفرَّق بين عورة الصلاة وعورة النظر.",
                topics=["عورة الرجل", "عورة المرأة"],
                lessons=[
                    lesson(
                        id="libas-awra-overview",
                        title="حدّ العورة في اللباس",
                        book_id="libas",
                        chapter_id="libas-awra",
                        summary="يجب ستر العورة؛ فعورة الرجل ما بين السرة والركبة على المذهب، والحرة البالغة في الصلاة تستتر جميع بدنها إلا وجهها، وفي الكفين روايتان.",
                        evidence="﴿يَا بَنِي آدَمَ خُذُوا زِينَتَكُمْ عِندَ كُلِّ مَسْجِدٍ﴾، وحديث الخمار.",
                        preferred="المعتمد ما قرره الزاد في ستر العورة مع الفرق بين الصلاة والنظر.",
                        keywords=["عورة", "لباس", "ستر"],
                        sources=[src(ZAD, "باب ستر العورة"), src(RAWD, "باب ستر العورة")],
                    )
                ],
            ),
            chapter(
                id="libas-haram",
                title="باب ما يحرم من اللباس",
                order=2,
                definition="ما نُهي عنه من اللباس للرجال والنساء.",
                summary="يحرم على الرجال الحرير والذهب، ويُراعى النهي عن التشبه ولباس الشهرة على التفصيل.",
                evidence="حديث تحريم الحرير والذهب على الذكور.",
                notes="الرخص للمرض والحكة معروفة.",
                topics=["حرير", "ذهب", "شهرة"],
                lessons=[
                    lesson(
                        id="libas-silk-gold",
                        title="تحريم الحرير والذهب على الرجال",
                        book_id="libas",
                        chapter_id="libas-haram",
                        summary="يحرم على الذكور البالغين لبس الحرير والتختم بالذهب، ويباح للنساء، ويُرخص للرجل في الحرير لحكة أو ضرورة كما ورد.",
                        evidence="حديث: «هذان حرام على ذكور أمتي حلّ لإناثهم» رواه أحمد وأبو داود والترمذي.",
                        preferred="هذا معتمد المذهب مع الرخص المذكورة.",
                        keywords=["حرير", "ذهب"],
                        sources=[src(ZAD, "باب اللباس"), src(RAWD, "باب اللباس")],
                    ),
                    lesson(
                        id="libas-shuhra",
                        title="لباس الشهرة",
                        book_id="libas",
                        chapter_id="libas-haram",
                        summary="لباس الشهرة ما يُقصد به التميّز على وجه مذموم. ودرجة الحكم بين الكراهة والتحريم تحتاج ضبطًا لتوصيف الصورة المعاصرة.",
                        evidence="حديث ثوب الشهرة عند أبي داود.",
                        preferred="يُضبط بالأدلة وكلام الأصحاب؛ والصور المعاصرة تُعرض على أهل العلم.",
                        keywords=["لباس شهرة"],
                        sources=[src(RAWD, "باب اللباس"), src(MUGHNI, "اللباس")],
                        needs_review=True,
                    ),
                ],
            ),
            chapter(
                id="libas-zina",
                title="باب الزينة والطيب",
                order=3,
                definition="أحكام الزينة المباحة والممنوعة.",
                summary="يباح التطيب والتزين في الجملة، ويحرم تغيير خلق الله المحرَّم كالنمص والوشم على التفصيل.",
                evidence="أحاديث النمص والوشم في الصحيح.",
                notes="مسائل التجميل المعاصرة تُحرَّر على حدة.",
                topics=["طيب", "نمص", "وشم"],
                lessons=[
                    lesson(
                        id="libas-teeb",
                        title="التطيب للرجال والنساء",
                        book_id="libas",
                        chapter_id="libas-zina",
                        summary="التطيب مشروع، ويُراعى في حق المرأة ألا تتطيب عند الخروج على وجه يثير الفتنة كما جاءت به السنة.",
                        evidence="أحاديث محبة النبي ﷺ للطيب، وأحاديث نهي المرأة عن التطيب في الخروج.",
                        preferred="يباح الطيب ويُستحب، مع ضوابط خروج المرأة.",
                        keywords=["طيب", "زينة"],
                        sources=[src(RAWD, "باب الزينة"), src(MUGHNI, "المغني")],
                    ),
                    lesson(
                        id="libas-namas",
                        title="النمص والوشم",
                        book_id="libas",
                        chapter_id="libas-zina",
                        summary="ورد اللعن في النامصة والواشمة؛ فيحرم النمص والوشم على الراجح من تفسير الأصحاب لهذه الصور.",
                        evidence="حديث ابن مسعود في الصحيحين.",
                        preferred="المعتمد تحريم الصور الواردة؛ وما اختلف توصيفه المعاصر يُحرَّر.",
                        keywords=["نمص", "وشم"],
                        sources=[src(RAWD, "باب التزين"), src(MUGHNI, "المغني")],
                    ),
                ],
            ),
        ],
    }


def reindex(books: list[dict]) -> None:
    desired = [
        "taharah",
        "salah",
        "zakat",
        "sawm",
        "itikaf",
        "hajj",
        "janaza",
        "buyu",
        "sharika",
        "wasaya-faraid",
        "nikah",
        "atima",
        "libas",
        "ayman",
        "jinayat",
        "qada",
        "jihad",
        "itq",
    ]
    by_id = {b["id"]: b for b in books}
    out = []
    for i, bid in enumerate(desired, start=1):
        if bid in by_id:
            b = by_id.pop(bid)
            b["order"] = i
            out.append(b)
    for b in sorted(by_id.values(), key=lambda x: x.get("order", 99)):
        b["order"] = len(out) + 1
        out.append(b)
    books[:] = out


def count(books: list[dict]) -> dict:
    ch = sum(len(b.get("chapters") or []) for b in books)
    les = sum(len(c.get("lessons") or []) for b in books for c in (b.get("chapters") or []))
    return {"books": len(books), "chapters": ch, "lessons": les}


def write_audit(books: list[dict], before: dict, after: dict) -> None:
    rows = [
        "# تدقيق محتوى الفقه",
        "",
        f"- التاريخ: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"- قبل: {before['books']} كتب / {before['chapters']} بابًا / {before['lessons']} مسألة",
        f"- بعد: {after['books']} كتب / {after['chapters']} بابًا / {after['lessons']} مسألة",
        "",
        "## تقرير ما قبل التعديل (ملخص)",
        "",
        "- كانت الشبكة 17 كتابًا حنبليًا منشورة بلا أبواب فارغة.",
        "- نواقص ظاهرة: أركان/واجبات/سنن/مبطلات الصلاة كأبواب مستقلة، وشروط/أركان/أعذار الصيام، وشروط الزكاة، وأركان/واجبات الحج، وكتاب اللباس والزينة، وتوسعة الكتب الرفيعة (الاعتكاف/الأطعمة/الأيمان/الجهاد/العتق).",
        "- الطلاق ضمن النكاح، والحدود ضمن الجنايات (موافق لترتيب المتون).",
        "",
        "| الكتاب | الأبواب | المسائل | منشورة | مراجعة/مسودة | الحالة | ملاحظات |",
        "|---|---:|---:|---:|---:|---|---|",
    ]
    notes_map = {
        "libas": "كتاب مستحدث؛ مسألة الشهرة للمراجعة",
        "sawm": "وُسّع بشروط وأركان وأعذار",
        "salah": "أُضيفت أبواب الأركان/الواجبات/السنن/المبطلات",
        "zakat": "أُضيف باب شروط الوجوب",
        "hajj": "أُضيفت أركان وواجبات الحج",
        "itikaf": "توسعة نية وآداب",
        "atima": "توسعة أصول الحلال والشبهة",
        "ayman": "توسعة انعقاد اليمين والنذر",
        "jihad": "توسعة الحكم؛ نازلة معاصرة للمراجعة",
        "itq": "توسعة فضل العتق",
        "qada": "توسعة شروط القاضي",
    }
    for b in books:
        chs = b.get("chapters") or []
        lessons = [x for c in chs for x in (c.get("lessons") or [])]
        pub = sum(1 for x in lessons if x.get("status") == "published" and not x.get("needsReview"))
        nr = sum(1 for x in lessons if x.get("needsReview") or x.get("status") == "draft")
        if nr:
            st = "يحتاج مراجعة شرعية"
        elif len(lessons) < 15:
            st = "يحتاج توسعة"
        else:
            st = "مكتمل"
        rows.append(
            f"| {b['title']} | {len(chs)} | {len(lessons)} | {pub} | {nr} | {st} | {notes_map.get(b['id'], '')} |"
        )
    rows += [
        "",
        "## ملاحظات منهجية",
        "",
        "- الطلاق والخلع ضمن كتاب النكاح والأسرة.",
        "- الحدود ضمن كتاب الجنايات والديات والحدود.",
        "- كل `needsReview=true` أو `draft` لا يُعرض حكمًا نهائيًا للمستخدم.",
        "- المصادر المعتمدة: زاد المستقنع، الروض المربع، عمدة الفقه، المغني عند الحاجة.",
        "",
        "## يحتاج مراجعة شرعية",
        "",
        "- لباس الشهرة (صور معاصرة).",
        "- الشبهة في الأطعمة المعاصرة.",
        "- نوازل الجهاد المعاصرة.",
        "",
    ]
    AUDIT.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> None:
    data = json.loads(BOOKS.read_text(encoding="utf-8"))
    books = data["books"]
    before = count(books)
    enriched = enrich(books)
    by_id = {b["id"]: b for b in books}

    touched = 0
    touched += add_salah(by_id["salah"])
    touched += add_sawm(by_id["sawm"])
    touched += add_zakat(by_id["zakat"])
    touched += add_hajj(by_id["hajj"])
    touched += thin_itikaf(by_id["itikaf"])
    touched += thin_atima(by_id["atima"])
    touched += thin_ayman(by_id["ayman"])
    touched += thin_jihad(by_id["jihad"])
    touched += thin_itq(by_id["itq"])
    touched += thin_qada(by_id["qada"])
    if "libas" not in by_id:
        books.append(build_libas())

    reindex(books)
    if isinstance(data.get("version"), int):
        data["version"] += 1
    data["generatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["books"] = books
    BOOKS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if ALIASES.exists():
        aliases = json.loads(ALIASES.read_text(encoding="utf-8"))
        arr = aliases.get("aliases") or []
        if not any(a.get("targetBookId") == "libas" for a in arr):
            arr.append(
                {
                    "aliasTitle": "كتاب اللباس",
                    "aliasId": "kitab-libas",
                    "targetBookId": "libas",
                }
            )
            aliases["aliases"] = arr
            ALIASES.write_text(
                json.dumps(aliases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )

    after = count(books)
    write_audit(books, before, after)
    print(
        json.dumps(
            {
                "before": before,
                "after": after,
                "enriched": enriched,
                "chaptersTouched": touched,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
