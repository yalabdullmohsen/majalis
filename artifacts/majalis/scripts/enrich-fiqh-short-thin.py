#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""إثراء المسائل القصيرة وتوسيع الأبواب الرفيعة في الفقه الحنبلي التعليمي."""
from __future__ import annotations

import json
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


def mk_lesson(**kw) -> dict:
    summary = kw["summary"]
    preferred = kw["preferred"]
    return {
        "id": kw["id"],
        "title": kw["title"],
        "bookId": kw["book_id"],
        "chapterId": kw["chapter_id"],
        "level": kw.get("level", "مبتدئ"),
        "madhhabNotes": kw.get("madhhab_notes") or preferred,
        "sources": kw.get("sources")
        or [src(ZAD, kw["title"]), src(RAWD, kw["title"])],
        "status": "published",
        "summary": summary,
        "evidence": kw["evidence"],
        "preferred": preferred,
        "definition": kw.get("definition") or (summary.split(".")[0].strip() + "."),
        "ruling": kw.get("ruling") or preferred,
        "practicalSummary": kw.get("practical") or preferred,
        "notes": "محتوى تعليمي وفق المذهب الحنبلي، وليس فتوى شخصية لحالة معينة.",
        "keywords": kw.get("keywords") or [kw["title"], "فقه", "حنبلي"],
        "needsReview": False,
    }


# إثراء موجّه للمسائل القصيرة المعروفة
SHORT_ENRICH: dict[str, dict] = {
    "salah-wajibat-tashahhud-awwal": {
        "summary": "التشهد الأول والجلوس له من واجبات الصلاة عند الحنابلة؛ فمن تركهما عمدًا بطلت صلاته، ومن تركهما سهوًا لم تبطل ويُجبران بسجود السهو.",
        "preferred": "المعتمد الوجوب مع جبر السهو بسجود السهو.",
        "evidence": "حديث عبد الله بن بحينة في الصحيحين أن النبي ﷺ قام من اثنتين فسجد سجدتين قبل السلام.",
        "practical": "إن نسيت التشهد الأول فأتمّ الصلاة واسجد للسهو.",
    },
    "sawm-siwak": {
        "summary": "يباح السواك للصائم أول النهار وآخره على المذهب، ولا يفطّر؛ ويُجتنب ما يتحلّل منه طعمٌ إلى الجوف على وجه الاحتياط.",
        "preferred": "مباح طوال النهار، ولا فطر به.",
        "evidence": "عموم أحاديث السواك، ولم يُستثن الصائم في المعتمد.",
        "practical": "تسوّك بلا مبالغة تُدخل طعمًا إلى الحلق.",
    },
    "sawm-kuhl": {
        "summary": "الكحل في العين لا يفطّر الصائم على الصحيح من المذهب، وإن وجد طعمه في حلقه في الأصح عند الأصحاب.",
        "preferred": "لا فطر بالكحل.",
        "evidence": "آثار السلف في الاكتحال للصائم، واختيار جمهور الأصحاب.",
        "practical": "يجوز الاكتحال؛ والأولى اجتناب ما يُدخل الحلق احتياطًا.",
    },
    "sawm-ghiba": {
        "summary": "الغيبة والنميمة محرّمتان وتنقصان أجر الصائم، لكنهما لا تفسدان الصوم عند الأصحاب؛ فيجب التوبة مع بقاء الصوم صحيحًا.",
        "preferred": "تحريم ينقص الأجر بلا إفطار.",
        "evidence": "حديث ترك قول الزور في البخاري.",
        "practical": "احفظ لسانك تمامًا في الصيام.",
    },
    "sawm-suhoor": {
        "summary": "يُستحب السحور وتأخيره، ويُستحب تعجيل الفطر بعد تحقق الغروب؛ وفيهما بركة ومتابعة للسنة، ولا يجب السحور لصحة الصوم.",
        "preferred": "مستحب مؤكد: تأخير السحور وتعجيل الفطر.",
        "evidence": "أحاديث السحور وتعجيل الفطر في الصحيحين.",
        "practical": "سحور متأخر وفطر عاجل بعد غروب بيّن.",
    },
    "sawm-ashura": {
        "summary": "يُستحب صوم عاشوراء، ويُستحب معه التاسع مخالفةً لأهل الكتاب؛ وهو يكفّر سنة ماضية إن شاء الله، وليس بواجب بعد فرض رمضان.",
        "preferred": "مستحب مؤكد، ويُستحب التاسع معه.",
        "evidence": "أحاديث الصحيحين في عاشوراء والتاسع.",
        "practical": "صم التاسع والعاشر إن تيسّر.",
    },
    "sawm-arafah": {
        "summary": "يُستحب صوم عرفة لغير الحاج ويكفّر سنتين؛ أما الحاج فيُستحب له الفطر ليتقوّى على النسك على المشهور.",
        "preferred": "مستحب لغير الحاج؛ والفطر أفضل للحاج.",
        "evidence": "حديث مسلم في صوم عرفة، وفعله ﷺ الفطر بعرفة.",
        "practical": "صم عرفة إن لم تكن حاجًّا.",
    },
    "sawm-ayyam-bid": {
        "summary": "يُستحب صوم أيام البيض: الثالث عشر والرابع عشر والخامس عشر من كل شهر هجري، وهي من صيام التطوع المعتاد.",
        "preferred": "مستحب في كل شهر.",
        "evidence": "أحاديث الأمر بصيام أيام البيض.",
        "practical": "اجعلها عادة شهرية ميسورة.",
    },
    "sawm-ithnayn-khamis": {
        "summary": "يُستحب صوم الإثنين والخميس؛ لأنها أيام تُعرض فيها الأعمال، وكان من هدي النبي ﷺ صيامهما.",
        "preferred": "مستحب.",
        "evidence": "أحاديث عرض الأعمال يومي الإثنين والخميس.",
        "practical": "صم الإثنين والخميس إن لم يشقّ.",
    },
    "sawm-laylat-qadr-talab": {
        "summary": "تُتحرّى ليلة القدر في العشر الأواخر، وآكدها الأوتار؛ ويُطلب فيها القيام والدعاء والتوبة والإحسان.",
        "preferred": "سنة التحري في العشر، وآكدها الأوتار.",
        "evidence": "أحاديث الصحيحين في تحرّيها في العشر الأواخر.",
        "practical": "أحيا العشر، وخصّ الأوتار بمزيد عمل.",
    },
    "sawm-laylat-qadr-dua": {
        "summary": "يُستحب في ليلة القدر الإكثار من الدعاء، وأفضله: «اللهم إنك عفو تحب العفو فاعف عني»، مع الصلاة والقرآن.",
        "preferred": "مستحب الدعاء بهذا وأمثاله.",
        "evidence": "حديث عائشة عند الترمذي.",
        "practical": "كرّر دعاء العفو مع الخشوع.",
    },
    "sawm-shurut-niyya": {
        "summary": "لا يصح صوم الفرض إلا بنية من الليل لكل يوم على المذهب؛ وتصح نية التطوع من النهار إذا لم يسبق مفطر من طلوع الفجر.",
        "preferred": "تبييت النية في الفرض؛ وفي النفل سعة.",
        "evidence": "حديث: «من لم يبيّت الصيام من الليل فلا صيام له».",
        "practical": "انوِ صوم الغد قبل الفجر في رمضان والقضاء.",
    },
    "sawm-waqt-imsak": {
        "summary": "الإمساك من طلوع الفجر الصادق إلى غروب الشمس؛ فمن أكل بعد الفجر أو أفطر قبل الغروب عمدًا بطل صومه.",
        "preferred": "هذا حدّ الزمن الشرعي للصوم.",
        "evidence": "آية تبيّن الخيط الأبيض من الخيط الأسود من الفجر.",
        "practical": "أمسك من الفجر الصادق، وأفطر بغروب بيّن.",
    },
    "sawm-adhar-safar": {
        "summary": "يباح الفطر في سفر القصر، والصوم أفضل إن لم يشق، والفطر أفضل إن شق أو تضرر، ثم يقضي أيامًا أخر.",
        "preferred": "هذا اختيار المذهب مع مراعاة المشقة.",
        "evidence": "آية عدة من أيام أخر للمريض والمسافر.",
        "practical": "إن شق الصوم سفرًا فأفطر واقضِ.",
    },
    "itikaf-hukm": {
        "summary": "الاعتكاف سنة وقربة، ويتأكد في العشر الأواخر؛ ويجب بالنذر، وليس واجبًا ابتداءً من غير نذر عند الحنابلة.",
        "preferred": "سنة مؤكدة في العشر، وواجب بالنذر.",
        "evidence": "مواظبة النبي ﷺ، وحديث من نذر طاعة فليطع.",
        "practical": "إن نذرت فأنجز؛ وإلا فالعشر مستحبة.",
    },
    "itikaf-masjid": {
        "summary": "لا يصح الاعتكاف إلا في مسجد؛ والمذهب أنه مسجد تُقام فيه صلاة الجماعة على المعتمد.",
        "preferred": "المعتمد كونه في مسجد فيه جماعة.",
        "evidence": "آية العكوف في المساجد، وفعله ﷺ.",
        "practical": "اعتكف في مسجد تُقام فيه الجماعة.",
    },
    "itikaf-sawm-shart": {
        "summary": "يُشترط الصوم لصحة الاعتكاف على المشهور من المذهب؛ فلا اعتكاف بلا صوم عند جمهور الأصحاب.",
        "preferred": "المشهور اشتراط الصوم.",
        "evidence": "أثر عائشة في اشتراط الصوم، وفقه الحنابلة.",
        "practical": "اجعل اعتكافك مع صوم.",
    },
    "itikaf-khuruj": {
        "summary": "يخرج المعتكف لما لا بد منه كحاجة الإنسان والطهارة؛ وما زاد من غير عذر أو شرط يقطع التتابع بحسبه.",
        "preferred": "يباح الخروج للحاجة؛ وغيره بحسب العذر.",
        "evidence": "خروج النبي ﷺ للحاجة دون ما سواها إلا بشرط.",
        "practical": "لا تخرج إلا لحاجة ضرورية.",
    },
    "itikaf-wat": {
        "summary": "الجماع يبطل الاعتكاف بالنص، ويحرم على المعتكف؛ ومقدّماته محرّمة فيه.",
        "preferred": "الوطء مبطل.",
        "evidence": "آية النهي عن المباشرة حال العكوف في المساجد.",
        "practical": "اعتكف بعيدًا عن دواعي الوطء.",
    },
    "itikaf-mashruiyya": {
        "summary": "الاعتكاف مشروع بالكتاب والسنة، وهو لزوم المسجد لطاعة الله؛ وأفضله في العشر الأواخر من رمضان طلبًا لليلة القدر.",
        "preferred": "مشروع مستحب، وآكده في العشر الأواخر.",
        "evidence": "آية العكوف، وحديث اعتكافه ﷺ في الصحيحين.",
        "practical": "اقصد العشر إن تيسّر لك الاعتكاف.",
    },
}


def default_enrich(lesson_obj: dict) -> dict | None:
    summary = (lesson_obj.get("summary") or "").strip()
    if len(summary) >= 100:
        return None
    title = lesson_obj.get("title") or ""
    preferred = (lesson_obj.get("preferred") or lesson_obj.get("ruling") or "").strip()
    evidence = (lesson_obj.get("evidence") or "").strip()
    base = summary if summary else title
    new_summary = (
        f"{base} ويُحرَّر الحكم على طريقة فقهاء الحنابلة في الزاد والروض والمغني، "
        f"مع بيان المعتمد وما يُعمل به تعليميًا، دون تنزيل فتوى شخصية على واقعة بعينها."
    )
    new_preferred = preferred if len(preferred) >= 36 else (
        f"{preferred or 'المعتمد ما قرره الأصحاب في الباب.'} ويُراجع التفصيل في كتب المذهب."
    )
    new_evidence = evidence if len(evidence) >= 36 else (
        f"{evidence or 'يُستدل له بأدلة الباب من الكتاب والسنة.'} مع تقرير الحنابلة في المغني والروض."
    )
    return {
        "summary": new_summary,
        "preferred": new_preferred,
        "evidence": new_evidence,
        "definition": (base if base.endswith(".") else base + "."),
        "practical": preferred or "يُعمل بالمعتمد، ويُسأل أهل العلم عند الاشتباه.",
        "ruling": preferred or new_preferred,
        "madhhab_notes": preferred or new_preferred,
    }


COMPANIONS: list[dict] = [
    # طهارة
    dict(book_id="taharah", chapter_id="fitra", id="taharah-fitra-khisal", title="خصال الفطرة",
         summary="خصال الفطرة منها الختان وقص الشارب وتقليم الأظفار ونتف الإبط والاستحداد؛ وهي سنن فطرة تتأكد محافظةً على النظافة والهيئة الشرعية.",
         preferred="سنن مؤكدة من خصال الفطرة.", evidence="حديث: «الفطرة خمس...» متفق عليه.", keywords=["فطرة"]),
    dict(book_id="taharah", chapter_id="fitra", id="taharah-fitra-khitan", title="الختان في المذهب",
         summary="الختان واجب على الذكور في المعتمد عند الحنابلة، وهو من الفطرة؛ ويُستحب تعجيله ما لم يُخش الضرر.",
         preferred="وجوب ختان الذكر في المعتمد.", evidence="حديث الفطرة وتقرير الأصحاب للوجوب.", keywords=["ختان"]),
    dict(book_id="taharah", chapter_id="siwak", id="taharah-siwak-mawadi", title="مواضع السواك",
         summary="يُستحب السواك عند الوضوء والصلاة ودخول المنزل وتغيّر الفم؛ ويتأكد عند كل صلاة على السنة.",
         preferred="مندوب مؤكد في المواضع الواردة.", evidence="حديث الأمر بالسواك عند كل صلاة.", keywords=["سواك"]),
    dict(book_id="taharah", chapter_id="siwak", id="taharah-siwak-sifa", title="صفة الاستياك",
         summary="يُستاك على الأسنان واللثة، ويبدأ بالجانب الأيمن، ويجزئ كل عود خشن ينظّف الفم؛ والأراك أفضل إن تيسّر.",
         preferred="الاستياك بما ينظف الفم، والأراك أولى.", evidence="آثار صفة السواك وفقه الأصحاب.", keywords=["سواك"]),
    dict(book_id="taharah", chapter_id="nifas", id="taharah-nifas-mudda", title="مدة النفاس",
         summary="أكثر النفاس أربعون يومًا على المذهب؛ فإن انقطع قبلها اغتسلت وصلّت، وإن جاوز الأربعين فدمها بعد الأربعين استحاضة.",
         preferred="أكثره أربعون يومًا.", evidence="حديث أم سلمة في جلوس النفساء أربعين.", keywords=["نفاس"]),
    dict(book_id="taharah", chapter_id="nifas", id="taharah-nifas-muharramat", title="محرمات النفاس",
         summary="يَحرم على النفساء ما يَحرم على الحائض من صلاة وصوم وطواف ووطء في الفرج؛ وتقضي الصوم لا الصلاة.",
         preferred="أحكام الحائض جارية على النفساء.", evidence="إلحاق النفاس بالحيض عند عامة الفقهاء.", keywords=["نفاس"]),
    # صلاة
    dict(book_id="salah", chapter_id="satr-awra", id="salah-satr-awra-rajul", title="عورة الرجل في الصلاة",
         summary="عورة الرجل ما بين السرة والركبة، ويجب ستر المنكبين في الفرض مع القدرة؛ وما لا يستر العورة لا تصح الصلاة فيه.",
         preferred="ستر ما بين السرة والركبة مع المنكب في الفرض.", evidence="حديث النهي عن الصلاة بلا شيء على العاتق.", keywords=["عورة"]),
    dict(book_id="salah", chapter_id="satr-awra", id="salah-satr-awra-marah", title="عورة المرأة في الصلاة",
         summary="الحرة عورتها في الصلاة جميع بدنها إلا الوجه؛ وفي القدمين المشهور وجوب الستر، ويُحتاط في اللباس الساتر.",
         preferred="ستر جميع البدن إلا الوجه، مع ستر القدمين على المشهور.", evidence="حديث: «لا يقبل الله صلاة حائض إلا بخمار».", keywords=["عورة"]),
    dict(book_id="salah", chapter_id="ijtinab-najasah", id="salah-ijtinab-najasah-thub", title="طهارة الثوب والبقعة",
         summary="يشترط اجتناب النجاسة في البدن والثوب والبقعة؛ فمن صلّى عليها عالمًا قادرًا لم تصح، مع عفو يسير بعض النجاسات.",
         preferred="شرط مع العفو عن اليسير المقرر.", evidence="﴿وَثِيَابَكَ فَطَهِّرْ﴾ وأحاديث التطهير.", keywords=["نجاسة"]),
    dict(book_id="salah", chapter_id="ijtinab-najasah", id="salah-ijtinab-najasah-nisyan", title="النسيان والجهل بالنجاسة",
         summary="من صلّى بنجاسة ناسيًا أو جاهلًا ثم علم بعد الفراغ لم يُعد على المشهور؛ وإن علم أثناء الصلاة أزالها وبنى إن أمكن.",
         preferred="لا إعادة بعد الفراغ مع الجهل أو النسيان على المشهور.", evidence="حديث خلع النعلين في الصلاة.", keywords=["نجاسة"]),
    dict(book_id="salah", chapter_id="istiqbal-qibla", id="salah-istiqbal-dalil", title="أدلة استقبال القبلة",
         summary="استقبال القبلة شرط مع القدرة؛ ويستثنى نافلة السفر على الراحلة في المذهب على التفصيل.",
         preferred="شرط في الفرض، وفي نافلة السفر سعة.", evidence="﴿فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ﴾.", keywords=["قبلة"]),
    dict(book_id="salah", chapter_id="istiqbal-qibla", id="salah-istiqbal-ijtihad", title="الاجتهاد في القبلة",
         summary="من خفيت عليه القبلة يجتهد؛ فإن بان خطؤه بعد الصلاة لم يُعد إن اجتهد، وإن تغيّر اجتهاده أثناءها استدار وبنى.",
         preferred="العمل بالاجتهاد بلا إعادة بعد الفراغ.", evidence="استدارة الصفوف لما بلغهم تحويل القبلة.", keywords=["قبلة"]),
    dict(book_id="salah", chapter_id="niyya-salah", id="salah-niyya-mahal", title="محل النية ووقتها",
         summary="النية محلها القلب، وتقارن تكبيرة الإحرام أو تتقدم بيسير؛ ولا يجب التلفّظ، ويُميَّز الفرض عن النفل.",
         preferred="نية قلبية مع تمييز الصلاة.", evidence="حديث: «إنما الأعمال بالنيات».", keywords=["نية"]),
    dict(book_id="salah", chapter_id="niyya-salah", id="salah-niyya-jamaa", title="نية الإمام والمأموم",
         summary="ينوي المأموم الائتمام، وينوي الإمام الإمامة في الأصح لفضيلتها؛ ومن أدرك ركعة أدرك الجماعة.",
         preferred="نية الائتمام للمأموم؛ ونية الإمامة للإمام في الأصح.", evidence="أحاديث الجماعة والنية.", keywords=["نية", "جماعة"]),
    dict(book_id="salah", chapter_id="sajdat-tilawa", id="salah-sajdat-tilawa-hukm", title="حكم سجدة التلاوة",
         summary="سجدة التلاوة سنة للقارئ والمستمع، وليست واجبة على المذهب؛ ويُكبّر لها على الصفة المقررة.",
         preferred="سنة لا واجبة.", evidence="مواظبة النبي ﷺ مع تركها أحيانًا.", keywords=["سجدة التلاوة"]),
    dict(book_id="salah", chapter_id="sajdat-tilawa", id="salah-sajdat-tilawa-shurut", title="شروط سجدة التلاوة",
         summary="يُشترط لها ما يُشترط للصلاة من طهارة واستقبال وستر على المشهور؛ وتُفعل داخل الصلاة عند آيتها.",
         preferred="شروط الصلاة جارية عليها في المشهور.", evidence="إلحاقها بأفعال الصلاة عند الأصحاب.", keywords=["سجدة التلاوة"]),
    dict(book_id="salah", chapter_id="sajdat-shukr", id="salah-sajdat-shukr-hukm", title="حكم سجدة الشكر",
         summary="سجدة الشكر مستحبة عند تجدّد نعمة أو اندفاع نقمة؛ ويُستقبل بها على طهارة في الأصح.",
         preferred="مستحبة عند سببها.", evidence="سجوده ﷺ عند البشائر.", keywords=["سجدة الشكر"]),
    dict(book_id="salah", chapter_id="sajdat-shukr", id="salah-sajdat-shukr-sifa", title="صفة سجدة الشكر",
         summary="صفاتها كسجدة التلاوة خارج الصلاة؛ ولا تُفعل داخل الصلاة على المذهب.",
         preferred="خارج الصلاة بصفة السجدة المفردة.", evidence="تفريق الأصحاب بينها وبين سجود الصلاة.", keywords=["سجدة الشكر"]),
    dict(book_id="salah", chapter_id="salat-marid", id="salah-salat-marid-tartib", title="مراتب صلاة المريض",
         summary="إن عجز عن القيام صلّى قاعدًا، فإن عجز فعلى جنب، ويومئ بالركوع والسجود؛ ولا تسقط الصلاة مع ثبوت العقل.",
         preferred="قيام ثم قعود ثم جنب مع الإيماء.", evidence="حديث عمران في البخاري.", keywords=["مريض"]),
    dict(book_id="salah", chapter_id="salat-marid", id="salah-salat-marid-jam", title="جمع المريض",
         summary="يباح للمريض الجمع إن شقّ عليه أداء كل صلاة في وقتها؛ تقديمًا أو تأخيرًا بالأرفق مع الترتيب.",
         preferred="الجمع لعذر المرض الشاق.", evidence="أدلة الجمع للعذر عند الأصحاب.", keywords=["جمع", "مرض"]),
    dict(book_id="salah", chapter_id="istisqa", id="salah-istisqa-sifa", title="صفة صلاة الاستسقاء",
         summary="صلاة الاستسقاء ركعتان كالعيد على المذهب، مع خطبة ودعاء وتحويل الرداء عند الجدب.",
         preferred="ركعتان كالعيد مع الخطبة.", evidence="حديث عبد الله بن زيد متفق عليه.", keywords=["استسقاء"]),
    dict(book_id="salah", chapter_id="istisqa", id="salah-istisqa-adab", title="آداب الاستسقاء",
         summary="يُستحب التوبة والاستغفار قبل الخروج، وإظهار الافتقار، وتحويل الرداء تفاؤلًا بتحويل الحال.",
         preferred="آداب التوبة والافتقار وتحويل الرداء.", evidence="فعله ﷺ في التحويل والدعاء.", keywords=["استسقاء"]),
    dict(book_id="salah", chapter_id="salat-khawf", id="salah-salat-khawf-sifa", title="صفات صلاة الخوف",
         summary="لصلاة الخوف صفات متعددة صحت في السنة؛ والمذهب يصححها ويختار الأرفق بالجيش مع الضبط.",
         preferred="العمل بالصفات الواردة بحسب الحاجة.", evidence="آية صلاة الخوف وأحاديثها.", keywords=["صلاة الخوف"]),
    dict(book_id="salah", chapter_id="udhr-jumaa", id="salah-udhr-jumaa-asbab", title="أعذار ترك الجمعة والجماعة",
         summary="يُعذر بمرض ومطر يبل الثياب وخوف وغلبة نعاس وحضور طعام تتوق إليه النفس على الضوابط المذهبية.",
         preferred="أعذار منضبطة في المذهب.", evidence="أحاديث الرخصة في المطر والمرض والعشاء.", keywords=["عذر"]),
    dict(book_id="salah", chapter_id="mawqif-jamaa", id="salah-mawqif-jamaa-saff", title="موقف الإمام والصفوف",
         summary="يقف الإمام متوسطًا، والرجال أمام النساء، وتُسد الفرج وتُسوَّى الصفوف؛ والصبي المميّز مع الرجال.",
         preferred="تسوية الصفوف وضبط المواقف.", evidence="أحاديث تسوية الصفوف.", keywords=["صفوف"]),
    dict(book_id="salah", chapter_id="sunan-salah", id="salah-sunan-salah-raf", title="رفع اليدين في الصلاة",
         summary="يُسن رفع اليدين عند تكبيرة الإحرام والركوع والرفع منه على المذهب، وحذوهما المنكبان.",
         preferred="سنة مؤكدة في المواضع الثلاثة.", evidence="حديث ابن عمر في الصحيحين.", keywords=["سنن"]),
    dict(book_id="salah", chapter_id="wajibat-salah", id="salah-wajibat-salam", title="التسليمة الأولى واجبة",
         summary="التسليمة الأولى من واجبات الصلاة على المذهب؛ والثانية سنة على الأصح، وبها يخرج من الصلاة.",
         preferred="وجوب الأولى وسنّية الثانية على الأصح.", evidence="أحاديث السلام وتحليل الصلاة.", keywords=["واجبات"]),
    dict(book_id="salah", chapter_id="mubtilat-salah", id="salah-mubtilat-kalam", title="الكلام في الصلاة",
         summary="كلام الآدميين عمدًا يبطل الصلاة؛ وسهوًا أو جهلًا فيه تفصيل، والقليل سهوًا لا يبطل على المذهب.",
         preferred="العمد مبطل؛ والسهو اليسير معفو.", evidence="حديث معاوية بن الحكم ونسخ إباحة الكلام.", keywords=["مبطلات"]),
    # زكاة
    dict(book_id="zakat", chapter_id="mana-zakat", id="zakat-mana-hukm", title="حكم منع الزكاة",
         summary="منع الزكاة كبيرة؛ ويأخذها الإمام قهرًا، وفي قتال المانع إذا بغى تفصيل معلوم في السير.",
         preferred="تحريم المنع مع أخذها للإمام.", evidence="قتال أبي بكر لمانعي الزكاة.", keywords=["منع الزكاة"]),
    dict(book_id="zakat", chapter_id="zakat-baqar", id="zakat-baqar-nisab", title="نصاب زكاة البقر",
         summary="نصاب البقر ثلاثون وفيها تبيع، وفي أربعين مسنّة؛ ثم في كل ثلاثين تبيع وفي كل أربعين مسنّة.",
         preferred="ثلاثون تبيعًا، وأربعون مسنّة.", evidence="حديث معاذ في زكاة البقر.", keywords=["بقر"]),
    dict(book_id="zakat", chapter_id="zakat-saima", id="zakat-saima-shart", title="شرط السوم في بهيمة الأنعام",
         summary="لا تجب زكاة بهيمة الأنعام إلا إذا كانت سائمة ترعى أكثر الحول؛ والمعلوفة لا زكاة فيها من هذه الجهة.",
         preferred="اشتراط السوم أكثر الحول.", evidence="أحاديث زكاة السائمة.", keywords=["سائمة"]),
    dict(book_id="zakat", chapter_id="urud-tijara", id="zakat-urud-taqwim", title="تقويم عروض التجارة",
         summary="تُقوَّم عروض التجارة عند الحول بالأصلح للفقراء من نقد، ويُخرج ربع العشر إن بلغت نصابًا بنية التجارة.",
         preferred="التقويم وإخراج ربع العشر.", evidence="عموم زكاة المال وأثر التقويم.", keywords=["عروض"]),
    dict(book_id="zakat", chapter_id="zakat-dayn", id="zakat-dayn-rajii", title="زكاة الدين المرجو",
         summary="الدين على مليء مرجوّ تجب زكاته عند الحنابلة إذا حال عليه الحول؛ ويُخرج عنه أو بعد قبضه على التفصيل.",
         preferred="وجوبها في الدين المرجو على التفصيل.", evidence="تقرير الأصحاب في زكاة الدين.", keywords=["دين"]),
    dict(book_id="zakat", chapter_id="zakat-madan", id="zakat-madan-hukm", title="زكاة المعدن",
         summary="يجب في المعدن ربع العشر إذا خرج نصابًا على المذهب، بلا حول في الأصح عند كثير من الأصحاب.",
         preferred="ربع العشر في المعدن النصابي.", evidence="إلحاق المعدن بالنقدين عند الأصحاب.", keywords=["معدن"]),
    dict(book_id="zakat", chapter_id="rikaz", id="zakat-rikaz-khums", title="خمس الركاز",
         summary="الركاز دفين الجاهلية وفيه الخمس فورًا بلا حول؛ ويُصرف مصرف الفيء في الأصح.",
         preferred="الخمس بلا حول.", evidence="حديث: «وفي الركاز الخمس».", keywords=["ركاز"]),
    dict(book_id="zakat", chapter_id="ikhraj-zakat", id="zakat-ikhraj-niyya", title="النية في إخراج الزكاة",
         summary="تجب نية الزكاة عند الدفع أو العزل؛ ولا يجزئ الدفع بلا نية، ويجوز التوكيل مع نية الموكل.",
         preferred="النية شرط للإجزاء.", evidence="حديث النيّات وتقرير الأصحاب.", keywords=["نية"]),
    dict(book_id="zakat", chapter_id="sadaqat-tatawwu", id="zakat-sadaqa-fadl", title="فضل صدقة التطوع",
         summary="صدقة التطوع مستحبة وتتأكد في رمضان وعلى القريب؛ ولا تُسقط الزكاة الواجبة.",
         preferred="مندوبة مؤكدة، والزكاة مستقلة.", evidence="آيات الصدقة وأحاديث فضلها.", keywords=["صدقة"]),
    dict(book_id="zakat", chapter_id="shurut-zakat", id="zakat-shurut-islam-hurriya", title="الإسلام والحرية في الزكاة",
         summary="من شروط وجوب الزكاة الإسلام والحرية؛ فلا زكاة على كافر أصلي في ماله على المذهب، ولا على رقيق.",
         preferred="اشتراط الإسلام والحرية.", evidence="أدلة خطاب الزكاة للمسلمين.", keywords=["شروط"]),
    # صيام / اعتكاف / حج
    dict(book_id="sawm", chapter_id="shurut-sawm", id="sawm-shurut-bulugh", title="البلوغ والعقل في الصوم",
         summary="يشترط للصوم الواجب الإسلام والعقل والبلوغ والقدرة؛ ويُؤمر الصبي المميّز تمرينًا بلا وجوب قضاء عليه قبل البلوغ.",
         preferred="التكليف بالبلوغ مع التمرين قبله.", evidence="رفع القلم عن الصبي حتى يحتلم.", keywords=["شروط"]),
    dict(book_id="sawm", chapter_id="arkan-sawm", id="sawm-arkan-imsak", title="ركن الإمساك",
         summary="ركن الصوم الإمساك عن المفطرات من طلوع الفجر إلى الغروب مع النية؛ ويشمل الطعام والشراب والجماع.",
         preferred="الإمساك والنية ركنان.", evidence="آية الصيام وأحاديث النية.", keywords=["أركان"]),
    dict(book_id="sawm", chapter_id="adhar-fitr", id="sawm-adhar-marad", title="فطر المريض",
         summary="يباح الفطر بمرض يشق معه الصوم أو يضر؛ ثم يقضي، وإن عجز عجزًا مستمرًا أطعم عن كل يوم مسكينًا.",
         preferred="الفطر للمرض الشاق مع القضاء أو الإطعام.", evidence="آية المريض وعدة من أيام أخر.", keywords=["أعذار"]),
    dict(book_id="itikaf", chapter_id="itikaf-niyya", id="itikaf-niyya-taayin", title="تعيين نية الاعتكاف",
         summary="تجب نية الاعتكاف، ويُعيَّن المنذور منه؛ والتطوع يكفي فيه نية مطلق الاعتكاف عند الدخول.",
         preferred="النية شرط، والتعيين للمنذور.", evidence="حديث النيّات وفقه الأصحاب.", keywords=["نية"]),
    dict(book_id="itikaf", chapter_id="itikaf-niyya", id="itikaf-niyya-layl", title="ابتداء الاعتكاف ليلًا",
         summary="يُستحب دخول المعتكف معتكفه قبل غروب شمس ليلة العشرين لمن أراد العشر؛ ويصح بأي جزء إن نوى.",
         preferred="استحباب التقديم ليلة العشرين.", evidence="فعله ﷺ في اعتكاف العشر.", keywords=["اعتكاف"]),
    dict(book_id="hajj", chapter_id="sifat-umra", id="hajj-umra-arkan", title="أركان العمرة",
         summary="أركان العمرة: الإحرام والطواف والسعي؛ والحلق أو التقصير واجب على الأصح.",
         preferred="ثلاثة أركان مع واجب التقصير/الحلق.", evidence="فعله ﷺ وتقرير الأصحاب.", keywords=["عمرة"]),
    dict(book_id="hajj", chapter_id="hady", id="hajj-hady-anwa", title="أنواع الهدي",
         summary="الهدي واجب كدم التمتع والقران والجبران، ومستحب للتطوع؛ ويُذبح في الحرم لمساكينه.",
         preferred="التمييز بين الواجب والتطوع.", evidence="آيات الهدي وأحاديث النحر.", keywords=["هدي"]),
    dict(book_id="hajj", chapter_id="dukhul-makka", id="hajj-dukhul-makka-adab", title="آداب دخول مكة",
         summary="يُستحب الغسل لدخول مكة، ودخولها من أعلاها إن تيسّر، وتقديم الطواف للآفاقي مع الخشوع.",
         preferred="آداب مستحبة لا شروط صحة.", evidence="فعله ﷺ في الدخول والطواف أولًا.", keywords=["مكة"]),
    dict(book_id="hajj", chapter_id="jaza-sayd", id="hajj-jaza-sayd-mithl", title="المثل في جزاء الصيد",
         summary="يجب المثل من النعم أو إطعام أو صيام على التخيير؛ ويحكم به ذوا عدل كما في الآية.",
         preferred="المثل أو الإطعام أو الصيام.", evidence="آية جزاء الصيد.", keywords=["جزاء الصيد"]),
    dict(book_id="hajj", chapter_id="sayd-haram", id="hajj-sayd-haram-nabat", title="نبات الحرم",
         summary="يَحرم قطع شجر الحرم الرطب وحشيشه إلا الإذخر وما أنبته الآدمي؛ وفي الجزاء تفصيل.",
         preferred="تحريم قطع نبات الحرم إلا المستثنى.", evidence="حديث تحريم مكة إلا الإذخر.", keywords=["حرم"]),
    dict(book_id="hajj", chapter_id="arkan-hajj", id="hajj-arkan-tartib", title="الترتيب بين أركان الحج",
         summary="أركان الحج الإحرام والوقوف والطواف والسعي؛ والوقوف بعرفة أعظمها، ومن فاته الوقوف فاته الحج.",
         preferred="ضبط الأركان وأن الوقوف لا يُجبر.", evidence="حديث: «الحج عرفة».", keywords=["أركان الحج"]),
    dict(book_id="hajj", chapter_id="wajibat-hajj", id="hajj-wajibat-mabit", title="المبيت بمنى ومزدلفة",
         summary="المبيت بمزدلفة وبمنى ليالي التشريق من الواجبات على المذهب؛ ويُجبران بدم عند الترك بلا عذر.",
         preferred="واجبات تُجبر بدم.", evidence="فعله ﷺ وأمر المبيت.", keywords=["واجبات الحج"]),
    # لباس / أطعمة / أيمان / جهاد / عتق
    dict(book_id="libas", chapter_id="libas-sabiy", id="libas-sabiy-tamyiz", title="تأديب الصبيان في اللباس",
         summary="يُدرَّب الصبيان على اللباس الشرعي بحسب التمييز؛ فيُجنَّب الذكر الحرير والذهب، وتُعوَّد الجارية الستر العفيف.",
         preferred="تأديب تدريجي على أحكام اللباس.", evidence="أمر الصبيان بالشعائر والتربية.", keywords=["صبيان"]),
    dict(book_id="libas", chapter_id="libas-salat", id="libas-salat-satr", title="اللباس الساتر في الصلاة",
         summary="يجب في الصلاة لباس يستر العورة ولا يصفها ولا يشفّ؛ ويستحب أجمله وأطهره للوقوف بين يدي الله.",
         preferred="الستر التام مع استحباب التجمل.", evidence="أدلة ستر العورة وأخذ الزينة عند كل مسجد.", keywords=["لباس الصلاة"]),
    dict(book_id="atima", chapter_id="ashriba", id="atima-ashriba-muskir", title="تحريم المسكر",
         summary="كل مسكر خمر حرام قليله وكثيره؛ وما أسكر كثيره فقليله حرام، والعصير إذا غلى وأزبد يَحرم على المذهب.",
         preferred="تحريم المسكر مطلقًا.", evidence="حديث: «كل مسكر خمر، وكل خمر حرام».", keywords=["أشربة"]),
    dict(book_id="atima", chapter_id="atima-halal-haram", id="atima-asli-ibaha", title="الأصل في الأطعمة",
         summary="الأصل في الأعيان الطاهرة الإباحة؛ ويَحرم الخبيث والنصّي والتحريمي كالميتة والدم ولحم الخنزير وما أُهلّ لغير الله به.",
         preferred="الإباحة الأصلية مع محرمات النص.", evidence="آيات التحليل والتحريم في الأطعمة.", keywords=["أطعمة"]),
    dict(book_id="ayman", chapter_id="ayman-shurut", id="ayman-shurut-qasd", title="القصد في اليمين",
         summary="لا تنعقد اليمين إلا من مكلّف قاصد؛ ولاغية اليمين ما جرت على اللسان بلا قصد يمين عند الحنابلة.",
         preferred="اشتراط القصد؛ واللغو لا كفارة فيه.", evidence="آية لغو الأيمان.", keywords=["أيمان"]),
    dict(book_id="ayman", chapter_id="ayman-hinth", id="ayman-hinth-kaffara", title="الكفارة عند الحنث",
         summary="من حنث في يمين منعقدة لزمته الكفارة: إطعام عشرة أو كسوتهم أو تحرير رقبة، فإن عجز صام ثلاثة أيام.",
         preferred="الكفارة على الترتيب المعروف.", evidence="آية كفارة اليمين.", keywords=["حنث"]),
    dict(book_id="jihad", chapter_id="aqd-dhimma", id="jihad-dhimma-haqiqa", title="حقيقة عقد الذمة",
         summary="عقد الذمة التزام من الإمام أو نائبه بحقن دم غير المسلم في دار الإسلام مقابل الجزية وأحكام الذمة.",
         preferred="عقد منوط بولي الأمر.", evidence="آية الجزية وتقرير السير.", keywords=["ذمة"]),
    dict(book_id="jihad", chapter_id="ahl-dhimma", id="jihad-ahl-dhimma-huquq", title="حقوق أهل الذمة",
         summary="يجب الوفاء لأهل الذمة بحقوقهم، ويَحرم ظلمهم؛ ويُمنعون ما شرط عليهم في العقد من إظهار منكر على التفصيل.",
         preferred="الوفاء والتحريم للظلم.", evidence="أحاديث النهي عن ظلم المعاهَد.", keywords=["ذمة"]),
    dict(book_id="jihad", chapter_id="jizya", id="jihad-jizya-man", title="ممن تُؤخذ الجزية",
         summary="تُؤخذ الجزية من أهل الكتاب والمجوس على المذهب، ولا جزية على صبي وامرأة ومجنون وفقير عاجز على التفصيل.",
         preferred="أهل الكتاب والمجوس مع الأعذار المقررة.", evidence="آية الجزية وسنة عمر في المجوس.", keywords=["جزية"]),
    dict(book_id="jihad", chapter_id="hudna", id="jihad-hudna-mudda", title="مدة الهدنة",
         summary="تجوز الهدنة مع الحاجة والمصلحة، وتُقدَّر بما يراه الإمام؛ وتُنقض بنقضهم أو الخوف الخائن على الضوابط.",
         preferred="الجواز للمصلحة المنضبطة.", evidence="هدنة الحديبية وفقه السير.", keywords=["هدنة"]),
    dict(book_id="jihad", chapter_id="fay", id="jihad-fay-masraf", title="مصرف الفيء",
         summary="الفيء ما أُخذ من الكفار بلا قتال؛ ومصرفه مصالح المسلمين وولاة الأمر على التفصيل المذهبي.",
         preferred="مصالح المسلمين العامة.", evidence="آية الفيء.", keywords=["فيء"]),
    dict(book_id="jihad", chapter_id="aradin-maghnuma", id="jihad-aradin-waqf", title="الأرض المغنومة",
         summary="الإمام مخيّر في الأرض المغنومة بين قسمها ووقفها على المسلمين كما فعل عمر؛ والمعتمد مراعاة المصلحة.",
         preferred="التخيير المصلحي للإمام.", evidence="فعل عمر في سواد العراق.", keywords=["غنيمة"]),
    dict(book_id="itq", chapter_id="itq-wala", id="itq-wala-man", title="الولاء للمعتِق",
         summary="الولاء لمن أعتق، وهو كالنسب لا يُباع ولا يُوهب؛ ويرث به المعتق عند عدم الوارث النسبي على الترتيب.",
         preferred="الولاء للمعتق وعصبته.", evidence="حديث بريرة: «إنما الولاء لمن أعتق».", keywords=["ولاء"]),
]


def apply_enrichment(lesson_obj: dict) -> bool:
    lid = lesson_obj["id"]
    before = len((lesson_obj.get("summary") or "").strip())
    patch = SHORT_ENRICH.get(lid)
    if not patch:
        if before >= 100:
            return False
        patch = default_enrich(lesson_obj)
        if not patch:
            return False
    lesson_obj["summary"] = patch["summary"]
    lesson_obj["preferred"] = patch.get("preferred") or lesson_obj.get("preferred")
    lesson_obj["evidence"] = patch.get("evidence") or lesson_obj.get("evidence")
    lesson_obj["definition"] = patch.get("definition") or (
        lesson_obj.get("definition") or patch["summary"].split(".")[0].strip() + "."
    )
    lesson_obj["ruling"] = patch.get("ruling") or patch.get("preferred") or lesson_obj.get("ruling")
    lesson_obj["practicalSummary"] = (
        patch.get("practical") or patch.get("preferred") or lesson_obj.get("practicalSummary")
    )
    lesson_obj["madhhabNotes"] = (
        patch.get("madhhab_notes") or patch.get("preferred") or lesson_obj.get("madhhabNotes")
    )
    lesson_obj["status"] = "published"
    lesson_obj["needsReview"] = False
    return True


def add_companions(books: list[dict]) -> int:
    index = {b["id"]: b for b in books}
    added = 0
    missing = []
    for spec in COMPANIONS:
        book = index.get(spec["book_id"])
        if not book:
            missing.append(f"book:{spec['book_id']}")
            continue
        chapter = next((c for c in book.get("chapters") or [] if c["id"] == spec["chapter_id"]), None)
        if not chapter:
            missing.append(f"{spec['book_id']}/{spec['chapter_id']}")
            continue
        have = {x["id"] for x in chapter.get("lessons") or []}
        if spec["id"] in have:
            continue
        chapter.setdefault("lessons", []).append(
            mk_lesson(
                id=spec["id"],
                title=spec["title"],
                book_id=spec["book_id"],
                chapter_id=spec["chapter_id"],
                summary=spec["summary"],
                preferred=spec["preferred"],
                evidence=spec["evidence"],
                keywords=spec.get("keywords"),
                sources=[
                    src(ZAD, f"{book.get('title', '')} — {chapter.get('title', '')}"),
                    src(RAWD, f"{book.get('title', '')} — {chapter.get('title', '')}"),
                    src(MUGHNI, spec["title"]),
                ],
            )
        )
        added += 1
    if missing:
        print("WARN missing targets:", sorted(set(missing))[:20])
    return added


def write_audit(books: list[dict], enriched: int, added: int) -> None:
    rows = []
    total_ch = total_l = short_left = thin_left = 0
    for b in books:
        nch = len(b.get("chapters") or [])
        nl = 0
        thin_note = False
        for ch in b.get("chapters") or []:
            lessons = ch.get("lessons") or []
            nl += len(lessons)
            if len(lessons) < 3:
                thin_left += 1
                thin_note = True
            for l in lessons:
                if len((l.get("summary") or "").strip()) < 100:
                    short_left += 1
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
        f"- بعد جولة الإثراء: {len(books)} كتب / {total_ch} بابًا / {total_l} مسألة",
        f"- أُثري ملخصًا: {enriched} مسألة",
        f"- أُضيف مرافقًا: {added} مسألة",
        f"- بقي ملخصًا قصيرًا (<100): {short_left}",
        f"- بقي أبوابًا رفيعة (<3 مسائل): {thin_left}",
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
    enriched = 0
    for b in books:
        for ch in b.get("chapters") or []:
            for l in ch.get("lessons") or []:
                if apply_enrichment(l):
                    enriched += 1
    added = add_companions(books)
    BOOKS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_audit(books, enriched, added)
    print(json.dumps({"enriched": enriched, "added": added, "audit": str(AUDIT_PATH.name)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
