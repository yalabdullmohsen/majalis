#!/usr/bin/env python3
"""بحثٌ وقراءةُ صفحاتٍ في كتابٍ **موضعُه بالجزء والصفحة** على الشاملة عبر أداة ج-٢٣٣.

أُنشئت للمغني (ج-٢٣٨) ثم عُمِّمت (ج-٢٤١) على كل مفتاح `paged` في `BOOKS` بلا نسخِ
أداةٍ ثانية: `--book` اختياريّ، وافتراضُه `mughni` فلا تتغيّر الاستعمالات السابقة.

استعمال:
  python3 mughni-lookup.py find "عبارة حرفيّة"      ⇒ صفحات المطابقة بمواضعها
  python3 mughni-lookup.py page 500 [600 ...]      ⇒ نصّ الصفحة كاملًا بموضعها
  python3 mughni-lookup.py quote 500 "بداية" "نهاية" ⇒ قصّ المقتبس بحروفه وتشكيله
  python3 mughni-lookup.py --book kashaf find "…"   ⇒ الأمر نفسه في كشاف القناع
"""
import importlib.util
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "vhc", os.path.join(_HERE, "verify-hadith-citations.py"))
V = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(V)

BOOK = V.BOOKS["mughni"]["id"]


def ref(page: int) -> str:
    juz, printed, chapter = V.page_ref(BOOK, page)
    return "ج%s/ص%s (%s) [/%d]" % (juz, printed, chapter, page)


def _norm_map(txt: str):
    """(النصّ المطبَّع، خريطةُ كلِّ حرفٍ فيه إلى موضعه في الأصل).

    محاكاةٌ حرفًا بحرف لدالّة `normalize` في الأداة، لتُقَصَّ المقتبسات من الأصل
    **بحروفها وتشكيلها** لا من المطبَّع (فالمطبَّع يُسقط التشكيل والهمزات).
    """
    txt = V.PAGE_MARK.sub(" ", txt)
    out, idx = [], []
    for i, ch in enumerate(txt):
        if V.TASHKEEL.match(ch) or V.HONORIFIC.match(ch):
            continue
        piece = " " if (ch.isspace() or V.PUNCT.match(ch)) else ch
        if piece != " ":
            piece = {"آ": "ا", "أ": "ا", "إ": "ا", "ٱ": "ا", "ى": "ي",
                     "ة": "ه", "ؤ": "", "ئ": "", "ء": ""}.get(piece, piece)
        if not piece:
            continue
        if piece == " " and (not out or out[-1] == " "):
            continue
        out.append(piece)
        idx.append(i)
    while out and out[-1] == " ":
        out.pop()
        idx.pop()
    return "".join(out), idx


def cut(page: int, start: str, end: str) -> str:
    """قصُّ المقتبس من نصّ الصفحة **بحروفه وتشكيله** بعد تحديده بالتطبيع."""
    txt = V.page_text(BOOK, page)
    norm, idx = _norm_map(txt)
    assert norm == V.normalize(txt), "الخريطة لا تطابق تطبيع الأداة"
    s, e = V.normalize(start), V.normalize(end)
    a = norm.find(s)
    if a < 0:
        return "!! البداية غير موجودة"
    b = norm.find(e, a)
    if b < 0:
        return "!! النهاية غير موجودة"
    # آخرُ حرفٍ في المقتبس تتلوه حركتُه في الأصل («كِفَايَةٍ» ⇒ ة ثم ٍ)، والتطبيع يُسقطها
    # فيقف الفهرس عند الحرف وحدَه ⇒ يُمَدُّ الطرف إلى آخر ما بعده من تشكيل (ج-٢٤١).
    end = idx[b + len(e) - 1] + 1
    while end < len(txt) and (V.TASHKEEL.match(txt[end]) or V.HONORIFIC.match(txt[end])):
        end += 1
    return txt[idx[a]: end]


def main() -> int:
    global BOOK
    argv = sys.argv[1:]
    if argv and argv[0] == "--book":
        key = argv[1]
        if not V.BOOKS[key].get("paged"):
            raise SystemExit("«%s» كتابٌ مُرقَّم بالحديث لا بالصفحة" % key)
        BOOK = V.BOOKS[key]["id"]
        argv = argv[2:]
    sys.argv = [sys.argv[0]] + argv
    cmd = sys.argv[1]
    if cmd == "find":
        term = sys.argv[2]
        rp = int(sys.argv[3]) if len(sys.argv) > 3 else 2
        pages = V.search_in_book(term, BOOK, exact=True, result_pages=rp)
        for p in sorted(pages):
            print(p, ref(p))
        if not pages:
            print("(لا مطابقة حرفيّة)")
    elif cmd == "page":
        for p in sys.argv[2:]:
            p = int(p)
            print("===", ref(p))
            print(V.page_text(BOOK, p))
            print()
    elif cmd == "quote":
        page = int(sys.argv[2])
        print(ref(page))
        print(cut(page, sys.argv[3], sys.argv[4]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
