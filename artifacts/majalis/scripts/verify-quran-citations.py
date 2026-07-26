#!/usr/bin/env python3
"""تحقُّق آليّ من استشهادات القرآن الكريم في أي محتوى مخزَّن.

يقرأ مصفوفة JSON من صفوف المحتوى، وينتزع من الحقل المطلوب كل مقتبس قرآني
بين ﴿﴾ مع وسم موضعه [سورة: آية]، ثم يقابل نصّ المقتبس بنصّ **الآية المُشار
إليها بعينها** — لا ببحث حرّ في المصحف — فيكشف خطأ النصّ وخطأ الموضع معًا.

المصدر: نصّ المصحف المحلّي في `public/data/quran/surah-XXX.json` (رواية حفص
عن عاصم، الرسم العثماني، نصّ مشروع تنزيل عبر AlQuran Cloud — راجع
`docs/quran-data-source.md`)، وسلامته محقَّقة ببصمات SHA-256 في
`manifest.json` عبر `scripts/verify-quran-integrity.mjs`.

المقابلة تُطبّع التشكيل وتُوحّد الألف والياء والتاء المربوطة وتُسقط حروف العلّة
والهمزات وتطوي الحرف المكرَّر، ليتساوى الرسم العثماني (يكتب الألف المحذوفة
ألفًا خنجرية: ٱلطَّلَٰقُ) بالرسم الإملائي المعاصر (الطَّلَاقُ) — وهما نصّ واحد.
والحذف من وسط المقتبس يُعلَن بـ«...» أو «…» فيُقابَل كل جزء على حِدة.

الاستعمال:
    python3 scripts/verify-quran-citations.py rows.json [--field evidence]
                                              [--id-field id] [--quiet]
    python3 scripts/verify-quran-citations.py rows.json --negative-control

`--negative-control` يُعيد الفحص كله بعد إزاحة رقم كل آية بواحد؛ ويجب أن
تسقط الاستشهادات كلها (أو جُلّها) — وهو ضبط سلامة المقابلة نفسها.

رمز الخروج: 0 إن لم يظهر أي خلل، و1 إن ظهر.
"""
from __future__ import annotations
import argparse, glob, json, os, re, sys, unicodedata

QDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'data', 'quran')

# التشكيل وعلامات الوقف والضبط العثماني — تُزال كلها قبل المقابلة
DIAC = ''.join(chr(c) for c in list(range(0x064B, 0x0660)) + [0x0640, 0x0670]
               + list(range(0x06D6, 0x06EE)) + [0x0653, 0x0654, 0x0655])
WEAK = 'اويىأإآٱؤئء'
AR_DIGITS = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
EN_DIGITS = str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩')

# أسماء سور تُكتب في الاستشهادات بغير صيغة ترويسة المصحف
ALIAS = {'ال عمران': 3, 'الاسراء': 17, 'الاسرا': 17, 'التوبه': 9, 'الفاتحه': 1,
         'المومنون': 23, 'المومن': 40, 'غافر': 40, 'الانسان': 76, 'الدهر': 76,
         'الشرح': 94, 'الانشراح': 94, 'المطففين': 83, 'الاحقاف': 46}


def norm(s: str) -> str:
    """تطبيع محافظ: إزالة التشكيل وتوحيد الألف والياء والتاء المربوطة."""
    s = unicodedata.normalize('NFC', s)
    s = ''.join(ch for ch in s if ch not in DIAC)
    s = re.sub('[آأإاٱ]', 'ا', s)
    s = s.replace('ى', 'ي').replace('ی', 'ي').replace('ة', 'ه')
    s = re.sub(r'[^ء-ي\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def skel(s: str) -> str:
    """هيكل صامت يتساوى فيه الرسمان العثماني والإملائي."""
    s = ''.join(ch for ch in norm(s) if ch not in WEAK)
    s = re.sub(r'(.)\1+', r'\1', s)          # طيّ الحرف المكرَّر (الشدّة مُزالة أصلًا)
    return re.sub(r'\s+', ' ', s).strip()


def load_mushaf():
    surahs, names, name2num = {}, {}, dict(ALIAS)
    files = sorted(glob.glob(os.path.join(QDIR, 'surah-*.json')))
    if len(files) != 114:
        sys.exit(f"خطأ: المتوقَّع 114 ملف سورة في {QDIR}، والموجود {len(files)}."
                 " شغّل `node scripts/fetch-quran-data.mjs` أولًا.")
    for f in files:
        d = json.load(open(f, encoding='utf8'))
        n = d['number']
        surahs[n] = {a['numberInSurah']: a['text'] for a in d['ayahs']}
        names[n] = d['name']
        name2num[norm(d['name']).replace('سوره ', '')] = n
    total = sum(len(v) for v in surahs.values())
    if total != 6236:
        sys.exit(f"خطأ: مجموع الآيات {total} لا 6236 — النصّ المحلّي ناقص أو تالف.")
    return surahs, names, name2num


SURAHS, NAMES, NAME2NUM = load_mushaf()
BSM = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'


def ayah_text(s: int, a: int):
    t = SURAHS.get(s, {}).get(a)
    if t is None:
        return None
    if a == 1 and s not in (1, 9):          # البسملة مُصدَّرة لأول آية في هذا الإصدار
        t = re.sub(r'^' + re.escape(BSM) + r'\s*', '', t)
    return t


def resolve_tag(tag: str):
    """يحوّل «البقرة: ٢٢٩» أو «النساء: ١١-١٢» إلى (رقم السورة، قائمة الآيات)."""
    tt = tag.translate(AR_DIGITS)
    m = re.match(r'^\s*(?:سورة\s+)?(.+?)\s*[:،]\s*([\d\s\-–,و]+)\s*$', tt)
    if not m:
        return None, None, 'BAD_TAG'
    sname, anums = norm(m.group(1)), m.group(2)
    snum = (NAME2NUM.get(sname) or NAME2NUM.get('ال' + sname)
            or NAME2NUM.get(sname.replace('ال', '', 1)))
    if not snum:
        return None, None, 'UNKNOWN_SURAH'
    nums = [int(x) for x in re.findall(r'\d+', anums)]
    if ('-' in anums or '–' in anums) and len(nums) >= 2:
        nums = list(range(nums[0], nums[-1] + 1))
    missing = [a for a in nums if a not in SURAHS[snum]]
    if missing:
        return snum, nums, 'AYAH_OUT_OF_RANGE'
    return snum, nums, None


def check(text: str):
    """يرجع نتيجة لكل مقتبس قرآني في النصّ."""
    out = []
    for m in re.finditer(r'﴿(.+?)﴾\s*(?:\[([^\]]+)\])?', text or '', re.S):
        quote, tag = m.group(1).strip(), (m.group(2) or '').strip()
        res = {'quote': quote, 'tag': tag}
        if not tag:
            res['status'] = 'NO_TAG'
            out.append(res); continue
        snum, nums, err = resolve_tag(tag)
        res['surah'], res['ayahs'] = snum, nums
        if err:
            res['status'] = err
            out.append(res); continue
        raw = ' '.join(filter(None, (ayah_text(snum, a) for a in nums)))
        parts = [p for p in re.split(r'\.\.\.|…', quote) if norm(p)]
        miss_exact = [p for p in parts if norm(p) not in norm(raw)]
        miss_skel = [p for p in parts if skel(p) not in skel(raw)]
        if not miss_skel:
            # OK = مطابقة حرفيّة للرسم العثماني، OK_IMLAI = نفس النصّ بالرسم الإملائي
            res['status'] = 'OK' if not miss_exact else 'OK_IMLAI'
        else:
            res['status'] = 'MISMATCH'
            res['missing'] = [norm(p) for p in miss_skel]
            probe = skel(max(parts, key=len))
            res['found_at'] = [f"{s2}:{a2}" for s2, ays in SURAHS.items()
                               for a2, t2 in ays.items() if probe and probe in skel(t2)][:6]
        out.append(res)
    return out


def bump_ayah_numbers(text: str) -> str:
    """ضبط سالب: إزاحة رقم كل آية في وسوم المواضع بواحد."""
    def b(m):
        return str(int(m.group(0).translate(AR_DIGITS)) + 1).translate(EN_DIGITS)
    return re.sub(r'(?<=[:،]\s)[٠-٩]+(?=\s*\])', b, text or '')


def main():
    ap = argparse.ArgumentParser(description='تحقُّق من استشهادات القرآن في محتوى مخزَّن')
    ap.add_argument('rows', help='ملف JSON يحوي مصفوفة صفوف (أو - للقراءة من stdin)')
    ap.add_argument('--field', default='evidence', help='الحقل الحامل للاستشهاد (افتراضيًّا evidence)')
    ap.add_argument('--id-field', default='id')
    ap.add_argument('--label-field', default='question', help='حقل يُطبع للتعريف بالصفّ')
    ap.add_argument('--quiet', action='store_true', help='اطبع الخلل فقط')
    ap.add_argument('--negative-control', action='store_true')
    a = ap.parse_args()

    rows = json.load(sys.stdin if a.rows == '-' else open(a.rows, encoding='utf8'))
    counts, bad, no_quote = {}, 0, 0
    for x in rows:
        text = x.get(a.field) or ''
        if a.negative_control:
            text = bump_ayah_numbers(text)
        rs = check(text)
        if not rs:
            no_quote += 1
        flags = [r for r in rs if not r['status'].startswith('OK')]
        for r in rs:
            counts[r['status']] = counts.get(r['status'], 0) + 1
        rid = str(x.get(a.id_field, ''))[:8]
        label = str(x.get(a.label_field, ''))[:60]
        if flags or not a.quiet:
            mark = '✔' if rs and not flags else ('∅' if not rs else '✘')
            locs = ' '.join(f"{r.get('surah')}:{r.get('ayahs')}={r['status']}" for r in rs)
            print(f"{mark} [{rid}] {label} || {locs}")
        for r in flags:
            bad += 1
            print(f"    الوسم={r['tag']!r} الحالة={r['status']}")
            print(f"    المقتبس={r['quote'][:160]}")
            if r.get('missing'):
                print(f"    غير موجود في الآية={r['missing']}")
            if r.get('found_at'):
                print(f"    وُجد في={r['found_at']}")

    print(f"\n=== صفوف={len(rows)} بلا استشهاد قرآني={no_quote} خلل={bad} | {counts}")
    if a.negative_control:
        ok = sum(v for k, v in counts.items() if k.startswith('OK'))
        print(f"=== ضبط سالب: {ok} استشهادًا نجح رغم إزاحة رقم الآية (المرغوب: 0)")
        return 1 if ok else 0
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
