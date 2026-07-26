#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
أداة تدقيق استشهادات الحديث — مقابلة نصّ المقتبس بنصّ الحديث في طبعة مسمّاة
=========================================================================

نظيرة `verify-quran-citations.py` (ج-٢٢٦/ج-٢٢٧) لكن لبُعد الحديث: تأخذ المقتبس
المكتوب بين «…» في حقل قاعدة البيانات، وتبحث عنه **داخل كتاب بعينه بطبعة بعينها**
على المكتبة الشاملة، ثم تجلب صفحة النتيجة وتنتزع منها **رقم الحديث ونصّه كاملًا**،
ثم تقابل المقتبس بالنصّ المنقول كلمةً كلمةً بعد التطبيع.

الطبعتان المعتمدتان (وهما نفسهما المعتمَدتان في `lesson_citations_hadith_takhrij_final_five.sql`
لمطابقة ترقيمهما ترقيمَ الاستشهادات):
  * صحيح البخاري — ط السلطانية      shamela.ws/book/1681
  * صحيح مسلم   — ت محمد فؤاد عبد الباقي  shamela.ws/book/1727

درجات المقابلة (من الأقوى إلى الأضعف):
  OK            — المقتبس نصٌّ متّصل من الحديث حرفًا بعد إزالة التشكيل فقط.
  OK_NORMALIZED — يطابق بعد التطبيع الإملائي (الألف/الياء/التاء المربوطة/الهمزات).
  OK_GAPPED     — المقتبس فيه «...» معلَنة، وكل أجزائه موجودة بالترتيب في الحديث.
  PARTIAL       — أكثر كلماته موجودة بالترتيب لكن بفجوات غير معلَنة ⇒ **تجب قراءته يدويًّا**.
  NOT_FOUND     — لم يوجد في الكتاب المطلوب ⇒ نسبة مشكوك فيها، لا تُعتمَد.

الاستعمال:
  python3 scripts/verify-hadith-citations.py --phrase "غسل يوم الجمعة واجب" --book bukhari
  python3 scripts/verify-hadith-citations.py --batch rows.json        # [{"id":..,"phrase":..,"book":..}]
  python3 scripts/verify-hadith-citations.py --self-test

الشبكة: طلبات الشاملة تُخزَّن في ذاكرة مؤقّتة على القرص (SHAMELA_CACHE، افتراضيًّا
/tmp/shamela-cache) فإعادة التشغيل لا تُعيد تحميل ما حُمِّل.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

BOOKS = {
    "bukhari": {"id": "1681", "name": "صحيح البخاري", "edition": "ط السلطانية"},
    "muslim": {"id": "1727", "name": "صحيح مسلم", "edition": "ت محمد فؤاد عبد الباقي"},
}

BASE = "https://shamela.ws"
CACHE = os.environ.get("SHAMELA_CACHE", "/tmp/shamela-cache")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# ── التطبيع ──────────────────────────────────────────────────────────────────
TASHKEEL = re.compile(r"[ً-ْٓ-ٰٕۖ-ۭـ]")
HONORIFIC = re.compile("[\uFDFA\uFDFB\uFD3E-\uFDFF\u0610-\u0615]")  # \uFDFA \uFD41 ونحوهما
PAGE_MARK = re.compile("\u2997[^\u2998]*\u2998")  # علامة انتقال الصفحة في نصّ الشاملة
PUNCT = re.compile(r"[«»\"'“”()\[\]{}،؛,.:!؟?\-–—… ]+")


def strip_marks(s: str) -> str:
    """إزالة التشكيل وعلامات الترضّي والترقيم فقط — بلا مسّ رسم الحروف."""
    s = PAGE_MARK.sub(" ", s)
    s = HONORIFIC.sub(" ", s)
    s = TASHKEEL.sub("", s)
    s = PUNCT.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip()


def normalize(s: str) -> str:
    """التطبيع الإملائي: توحيد الألف والياء والتاء المربوطة والهمزات."""
    s = strip_marks(s)
    s = re.sub(r"[آأإاٱ]", "ا", s)
    s = re.sub(r"[ىي]", "ي", s)
    s = s.replace("ة", "ه")  # ة → ه
    s = re.sub(r"[ؤئء]", "", s)  # الهمزات المفردة
    return re.sub(r"\s+", " ", s).strip()


ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def to_int(s: str) -> int:
    return int(s.translate(ARABIC_DIGITS))


# ── الشبكة + الذاكرة المؤقّتة ────────────────────────────────────────────────
def _cache_path(key: str) -> str:
    os.makedirs(CACHE, exist_ok=True)
    return os.path.join(CACHE, hashlib.sha256(key.encode()).hexdigest() + ".html")


def _fetch(url: str, data: bytes = None, key: str = None) -> str:
    key = key or (url + (data.decode("utf-8", "ignore") if data else ""))
    path = _cache_path(key)
    if os.path.exists(path):
        return open(path, encoding="utf-8").read()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": UA,
            "Accept-Language": "ar",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": BASE + "/search",
        },
    )
    for attempt in range(3):
        try:
            html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "ignore")
            break
        except Exception as exc:  # noqa: BLE001
            if attempt == 2:
                raise
            time.sleep(2 + 2 * attempt)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)
    return html


def search_in_book(term: str, book_id: str, exact: bool = True, result_pages: int = 3):
    """POST ajax/search داخل كتاب واحد ⇒ أرقام صفحات المطابقة.

    الشاملة تُرجع عشر نتائج في كل طلب مرتَّبةً بالملاءمة لا بترتيب الكتاب، فتُطلب
    عدّة صفحات نتائج حتى لا يفوت موضعٌ أسبقُ في الكتاب من المواضع العشرة الأولى.
    """
    quoted = '"%s"' % term if exact else term
    out, seen = [], set()
    for rp in range(1, result_pages + 1):
        fields = {"term": quoted, "books[]": book_id}
        if rp > 1:
            fields["page"] = str(rp)
        data = urllib.parse.urlencode(fields).encode()
        html = _fetch(BASE + "/ajax/search", data=data)
        links = re.findall(r'href="(%s/book/%s/(\d+))"' % (re.escape(BASE), book_id), html)
        if not links:
            break
        for _url, page in links:
            if page not in seen:
                seen.add(page)
                out.append(int(page))
    return out


PAGE_NASS = re.compile(r'<div[^>]*class="[^"]*nass[^"]*"[^>]*>(.*?)</div>\s*(?:<div|<hr|<section|$)', re.S)
NUM_AT_START = re.compile(r"(?<![٠-٩\d])([٠-٩]{1,5})\s*-\s")


def page_text(book_id: str, page: int) -> str:
    html = _fetch("%s/book/%s/%d" % (BASE, book_id, page))
    m = PAGE_NASS.search(html)
    seg = m.group(1) if m else ""
    seg = re.sub(r"<span class=\"hadith-num\">", " ", seg)
    seg = re.sub(r"<[^>]+>", " ", seg)
    seg = seg.replace("&nbsp;", " ")
    return re.sub(r"[ \t]+", " ", seg).strip()


PAREN_NUM = re.compile(r"^\s*\(([٠-٩]{1,5})\)")


def hadiths_on_page(book_id: str, page: int):
    """تقطيع نصّ الصفحة إلى (رقم الحديث، نصّه) بحسب الترقيم المطبوع في الطبعة.

    فرق جوهريّ بين الطبعتين، وإغفاله يعطي أرقامًا خاطئة تمامًا:
      * البخاري ط السلطانية: رقم واحد متسلسل في الكتاب كلّه: «٨٧٩ - حدثنا…».
      * مسلم ت عبد الباقي: رقمان معًا: «٥٢ - (٩٤٥) وحدثني…» — الأوّل تسلسل الحديث
        **داخل بابه**، والثاني بين قوسين هو **رقم الحديث المتعارَف عليه في الترقيم
        العامّ** وهو المقصود عند قولنا «مسلم ٩٤٥». فيُؤخَذ الذي بين القوسين، ويرثه
        ما بعده من طرق الحديث نفسه إذا لم يُصرَّح فيها برقم جديد.
    """
    txt = page_text(book_id, page)
    marks = list(NUM_AT_START.finditer(txt))
    out = []
    if marks and marks[0].start() > 0:
        out.append((None, txt[: marks[0].start()]))  # ذيل حديثٍ بدأ في صفحة سابقة
    inherited = None
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(txt)
        body = txt[m.end(): end]
        num = to_int(m.group(1))
        pm = PAREN_NUM.match(body)
        if pm:
            num = to_int(pm.group(1))
            inherited = num
            body = body[pm.end():]
        elif inherited is not None:
            num = inherited  # طريق أخرى للحديث نفسه في طبعة مسلم
        out.append((num, body))
    if not marks:
        out.append((None, txt))
    return out


def last_number_before(book_id: str, page: int, back: int = 3):
    """رقم آخر حديث في الصفحات السابقة — لحديثٍ امتدّ عبر صفحتين."""
    for p in range(page - 1, max(0, page - 1 - back), -1):
        nums = [n for n, _ in hadiths_on_page(book_id, p) if n is not None]
        if nums:
            return nums[-1], p
    return None, None


# ── المقابلة ────────────────────────────────────────────────────────────────
def grade(phrase: str, hadith: str):
    """درجة مقابلة المقتبس بنصّ الحديث."""
    parts = [p for p in re.split(r"\.{3}|…", phrase) if strip_marks(p)]
    exact_h, norm_h = strip_marks(hadith), normalize(hadith)
    if strip_marks(phrase) and strip_marks(phrase) in exact_h:
        return "OK", None
    if normalize(phrase) and normalize(phrase) in norm_h:
        return "OK_NORMALIZED", None
    if len(parts) > 1:
        pos, ok = 0, True
        for p in parts:
            np = normalize(p)
            idx = norm_h.find(np, pos)
            if idx < 0:
                ok = False
                break
            pos = idx + len(np)
        if ok:
            return "OK_GAPPED", None
    words = normalize(phrase).split()
    pos, missing = 0, []
    for w in words:
        idx = norm_h.find(w, pos)
        if idx < 0:
            missing.append(w)
        else:
            pos = idx + len(w)
    if words and len(missing) <= max(1, len(words) // 5):
        return "PARTIAL", " ".join(missing)
    return "NOT_FOUND", " ".join(missing[:8])


def longest_searchable(phrase: str) -> str:
    """أطول مقطع متّصل بلا «...» — هو ما يُبحث به (الشاملة تبحث بالعبارة كما هي)."""
    parts = [strip_marks(p) for p in re.split(r"\.{3}|…", phrase)]
    parts = [p for p in parts if p]
    return max(parts, key=len) if parts else strip_marks(phrase)


ORDER = {"OK": 4, "OK_NORMALIZED": 3, "OK_GAPPED": 2, "PARTIAL": 1, "NOT_FOUND": 0}


def locate(phrase: str, book: str, max_pages: int = 40, verbose: bool = False):
    """كل مواضع المقتبس في الكتاب مرتَّبة: الأقوى درجةً ثم **الأسبق رقمًا**.

    الحديث الواحد يتكرّر في الصحيحين بمواضع عدّة، والشاملة تُرجع نتائجها بترتيب
    ملاءمتها لا بترتيب الكتاب؛ فتُجمع المطابقات كلها ويُختار أوّلها في الكتاب
    (أصغر رقم) — وهو الموضع الذي يُحال إليه عادةً — وتبقى البقية معلَنة للمراجعة.
    """
    book_id = BOOKS[book]["id"]
    term = longest_searchable(phrase)
    # بحث العبارة الحرفية في الشاملة يفوته الموضع الذي دخلت على أوّله واو أو فاء
    # («ومن كذب عليّ…»)، فيُضاف بحث ثانٍ بذيل العبارة بعد إسقاط أوّل كلمة، ويُوحَّد الناتج.
    tail = " ".join(term.split()[1:])
    pages = search_in_book(term, book_id, exact=True)
    if tail and len(tail.split()) >= 3:
        for pg in search_in_book(tail, book_id, exact=True):
            if pg not in pages:
                pages.append(pg)
    if not pages:
        # تراجع: بحث بالكلمات (الشاملة تُخفق في العبارة الحرفية لفروق التشكيل/الرسم)
        pages = search_in_book(term, book_id, exact=False)
    # صفحات الشاملة مرتَّبة بترتيب الكتاب، فتصاعُد رقم الصفحة = تقدُّم الموضع في الكتاب.
    # تُفحص تصاعديًّا ويُتوقَّف عند أوّل مطابقة مقبولة ⇒ هي **أسبق مواضع اللفظ**، بلا
    # الحاجة إلى تحميل كل نتائج البحث.
    found = []
    for page in sorted(pages)[:max_pages]:
        hit = False
        for num, text in hadiths_on_page(book_id, page):
            g, miss = grade(phrase, text)
            if verbose:
                print("   … ص%s ح%s ⇒ %s" % (page, num, g), file=sys.stderr)
            if ORDER[g] == 0:
                continue
            real_num, real_page = num, page
            if num is None:
                real_num, real_page = last_number_before(book_id, page)
            found.append({"grade": g, "number": real_num, "page": page,
                          "num_page": real_page, "text": text.strip(), "missing": miss})
            if ORDER[g] >= ORDER["OK_GAPPED"]:
                hit = True
        if hit:
            break
    if not found:
        return None, []
    best_grade = max(ORDER[f["grade"]] for f in found)
    top = [f for f in found if ORDER[f["grade"]] == best_grade]
    top.sort(key=lambda f: (f["number"] is None, f["number"] or 0))
    return top[0], found


def report(phrase: str, book: str, verbose: bool = False):
    best, allm = locate(phrase, book, verbose=verbose)
    info = BOOKS[book]
    if best is None:
        return {"grade": "NOT_FOUND", "book": info["name"], "edition": info["edition"],
                "number": None, "page": None, "url": None, "text": "", "phrase": phrase,
                "other_numbers": []}
    others = sorted({f["number"] for f in allm if f["number"] not in (None, best["number"])})
    return {
        "grade": best["grade"],
        "book": info["name"],
        "edition": info["edition"],
        "number": best["number"],
        "page": best["page"],
        "url": "%s/book/%s/%s" % (BASE, info["id"], best["page"]),
        "text": best["text"],
        "missing": best["missing"],
        "other_numbers": others,
        "phrase": phrase,
    }


# ── الاختبار الذاتي ─────────────────────────────────────────────────────────
SELF_TESTS = [
    # (المقتبس، الكتاب، رقم الحديث المتوقَّع أو None إن وجب ألّا يوجد، الدرجة الدنيا المقبولة)
    # ٨٥٨ لا ٨٧٩: لفظه «الْغُسْلُ يَوْمَ الْجُمُعَةِ…» والمقتبس جزء منه حرفًا («غسل يوم
    # الجمعة» داخل «الغسل يوم الجمعة»)، وهو أسبق في الكتاب. فالأداة تُرجع أسبق المواضع
    # المطابقة، ويبقى على المدقِّق اختيار الموضع الذي لفظه هو لفظ المقتبس بعينه إن تعدّدت.
    ("غسل يوم الجمعة واجب على كل محتلم", "bukhari", 858, "OK"),
    ("من كذب علي متعمدا فليتبوأ مقعده من النار", "muslim", 3, "OK_NORMALIZED"),
    # الحديث المتكرّر: يجب أن يُختار أوّل مواضعه في الكتاب لا أوّل نتائج البحث
    ("البيعان بالخيار ما لم يتفرقا", "bukhari", 2079, "OK_NORMALIZED"),
    # ضبط سالب: لفظ مختلَق بصياغة قريبة يجب ألّا يُقبَل مطابقةً حرفيّة
    ("غسل يوم الخميس واجب على كل محتلم", "bukhari", None, "NOT_FOUND"),
    # حذف معلَن بـ«...» بلفظ مسلم: يُقبل عند مسلم…
    ("من شهد الجنازة حتى يصلي عليها فله قيراط... ومن شهدها حتى تدفن فله قيراطان", "muslim", 945, "OK_GAPPED"),
    # …ولا يُقبل مطابقةً عند البخاري لأن لفظه مختلف («حتى يصلي فله قيراط، ومن شهد
    # حتى تدفن كان له قيراطان») — وهذا هو التمييز الذي تُبنى عليه صحّة النسبة.
    ("من شهد الجنازة حتى يصلي عليها فله قيراط... ومن شهدها حتى تدفن فله قيراطان", "bukhari", None, "NOT_FOUND"),
]


def self_test() -> int:
    order = {"OK": 4, "OK_NORMALIZED": 3, "OK_GAPPED": 2, "PARTIAL": 1, "NOT_FOUND": 0}
    failed = 0
    for phrase, book, expect_num, min_grade in SELF_TESTS:
        r = report(phrase, book)
        ok_grade = order[r["grade"]] >= order[min_grade]
        if expect_num is None:
            ok = r["grade"] == "NOT_FOUND" or order[r["grade"]] <= order["PARTIAL"]
            ok_num = True
        else:
            ok = ok_grade
            ok_num = r["number"] == expect_num
        status = "✔" if (ok and ok_num) else "✘"
        if not (ok and ok_num):
            failed += 1
        print("%s [%s] %s → %s ح%s (المنتظر: %s ح%s)" % (
            status, book, phrase[:45], r["grade"], r["number"], min_grade, expect_num))
    print("\n%d/%d نجحت" % (len(SELF_TESTS) - failed, len(SELF_TESTS)))
    return 1 if failed else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="تدقيق استشهادات الحديث على المكتبة الشاملة")
    ap.add_argument("--phrase")
    ap.add_argument("--book", choices=sorted(BOOKS), default="bukhari")
    ap.add_argument("--batch", help="ملف JSON: [{id, phrase, book}]")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    if args.batch:
        rows = json.load(open(args.batch, encoding="utf-8"))
        out = []
        for row in rows:
            for book in ([row["book"]] if row.get("book") else sorted(BOOKS)):
                r = report(row["phrase"], book, verbose=args.verbose)
                r["id"] = row.get("id")
                out.append(r)
                if r["grade"] == "OK":
                    break
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0

    if not args.phrase:
        ap.error("--phrase أو --batch أو --self-test")
    print(json.dumps(report(args.phrase, args.book, verbose=args.verbose), ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
