#!/usr/bin/env python3
"""تحقُّق آليّ من استشهادات القرآن الكريم في أي محتوى مخزَّن.

يقرأ مصفوفة JSON من صفوف المحتوى، وينتزع من الحقل المطلوب كل مقتبس قرآني
بين ﴿﴾ مع وسم موضعه [سورة: آية]، ثم يقابل نصّ المقتبس بنصّ **الآية المُشار
إليها بعينها** — لا ببحث حرّ في المصحف — فيكشف خطأ النصّ وخطأ الموضع معًا.

المصدر: نصّ المصحف المحلّي في `public/data/quran/surah-XXX.json` (رواية حفص
عن عاصم، الرسم العثماني، نصّ مشروع تنزيل عبر AlQuran Cloud — راجع
`docs/quran-data-source.md`)، وسلامته محقَّقة ببصمات SHA-256 في
`manifest.json` عبر `scripts/verify-quran-integrity.mjs`.

المقابلة على ثلاث طبقات متدرِّجة، وحالة كل استشهاد هي أعلى طبقة تطابق فيها:
  OK                — مطابقة حرفيّة للرسم العثماني بعد إزالة التشكيل.
  OK_IMLAI          — تطابق بعد إسقاط الألف والهمزة وحدهما (`rasm`)، أي نفس
                      النصّ مكتوبًا بالرسم الإملائي المعاصر: أَمْوَٰلِهِمْ =
                      أَمْوَالِهِمْ، ءَايَٰتٍ = آيَاتٍ. فرق رسم لا فرق نصّ.
  OK_SKELETON_ONLY  — لم يتطابق إلا الهيكل الصامت (`skel`) الذي يُسقط حروف
                      العلّة كلها ⇒ **يجب قراءته يدويًّا**: هنا تختبئ الفروق في
                      واو أو ياء، ككلمة «وَإِذَا» مكان «إِذَا» (واو مقحَمة لا
                      وجود لها في الآية) — وهي خطأ نصّ حقيقيّ يعميه الهيكل.
  MISMATCH          — لا تطابق أصلًا: خطأ في النصّ أو في الموضع.
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


def rasm(s: str) -> str:
    """طبقة وسطى بين المطابقة الحرفيّة والهيكل الصامت.

    تُسقط الألف والهمزة فقط (فيتساوى الرسم العثماني الذي يكتب الألف المحذوفة
    ألفًا خنجرية: أَمْوَٰلِهِمْ = أَمْوَالِهِمْ، وءَايَٰتٍ = آيَاتٍ) وتُبقي الواو
    والياء. فأيّ فرق في واو أو ياء — كواو مقحَمة في أول المقتبس — يظهر هنا،
    وهو ما يعميه الهيكل الصامت لأنه يُسقط حروف العلّة كلها.
    """
    return re.sub(r'[\sاء]', '', norm(s))


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
        miss_rasm = [p for p in parts if rasm(p) not in rasm(raw)]
        miss_skel = [p for p in parts if skel(p) not in skel(raw)]
        if not miss_skel:
            # OK = مطابقة حرفيّة للرسم العثماني، OK_IMLAI = نفس النصّ بالرسم
            # الإملائي، OK_SKELETON_ONLY = لم يتطابق إلا الهيكل الصامت ⇒ **يجب**
            # قراءته يدويًّا: هنا يختبئ الفرق في واو أو ياء (واو مقحَمة مثلًا).
            res['status'] = ('OK' if not miss_exact else
                             'OK_IMLAI' if not miss_rasm else 'OK_SKELETON_ONLY')
            if miss_rasm and miss_exact:
                res['needs_read'] = [norm(p) for p in miss_rasm]
        else:
            res['status'] = 'MISMATCH'
            res['missing'] = [norm(p) for p in miss_skel]
            probe = skel(max(parts, key=len))
            res['found_at'] = [f"{s2}:{a2}" for s2, ays in SURAHS.items()
                               for a2, t2 in ays.items() if probe and probe in skel(t2)][:6]
        out.append(res)
    return out


def bump_ayah_numbers(text: str) -> str:
    """ضبط سالب: إزاحة رقم كل آية في وسوم المواضع بواحد.

    وتُزاح أرقام المدى كلها («٢٣-٢٤» ⇐ «٢٤-٢٥») والأرقام اللاتينية كما
    العربية: فلو استُثني طرفا المدى أو الرقم اللاتيني لنجا الاستشهاد من
    الضبط لا لصحّته بل لعجز الإزاحة عنه، فيصير الضبط شهادةَ زورٍ لنفسه.
    """
    def bump_digits(m):
        d = m.group(0)
        v = str(int(d.translate(AR_DIGITS)) + 1)
        return v.translate(EN_DIGITS) if d[0] in '٠١٢٣٤٥٦٧٨٩' else v

    def fix_tag(m):
        inner = m.group(1)
        head, sep, nums = inner.partition(':') if ':' in inner else inner.partition('،')
        if not sep:
            return m.group(0)
        return '[' + head + sep + re.sub(r'[\d٠-٩]+', bump_digits, nums) + ']'

    return re.sub(r'\[([^\]]+)\]', fix_tag, text or '')


SELF_TEST = [
    # (نصّ الاستشهاد، الحالة المتوقَّعة، وصف الحالة المختبَرة)
    ('﴿إِنَّا كُلَّ شَىْءٍ خَلَقْنَٰهُ بِقَدَرٍۢ﴾ [القمر: ٤٩]', 'OK',
     'مطابقة حرفيّة للرسم العثماني'),
    ('﴿خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ﴾ [التوبة: ١٠٣]', 'OK_IMLAI',
     'الرسم الإملائي: أَمْوَالِهِمْ = أَمْوَٰلِهِمْ — فرق رسم لا نصّ'),
    ('﴿وَإِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ﴾ [الطلاق: ١]',
     'OK_SKELETON_ONLY',
     'واو مقحَمة لا وجود لها في الآية — يعميها الهيكل الصامت ويكشفها rasm()'),
    ('﴿إِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ﴾ [الطلاق: ١]', 'OK',
     'المقتبس نفسه بعد حذف الواو ⇒ يصعد من الهيكل إلى المطابقة الحرفيّة'),
    ('﴿إِنَّا كُلَّ شَىْءٍ خَلَقْنَٰهُ بِقَدَرٍۢ﴾ [القمر: ٥٠]', 'MISMATCH',
     'نصّ صحيح وموضع خاطئ'),
    ('﴿الحمد لله رب العالمين أجمعين﴾ [الفاتحة: ٢]', 'MISMATCH',
     'زيادة كلمة ليست في الآية'),
]


# ضبطُ الضبطِ السالب نفسِه: كلُّ رقمِ آيةٍ يجب أن يُزاح مهما كان شكلُه، وإلا
# نجا الاستشهادُ من الضبط لعجزِ الإزاحة عنه لا لصحّته.
BUMP_TEST = [
    ('﴿كذا﴾ [البقرة: ٢٧٥]', '﴿كذا﴾ [البقرة: ٢٧٦]', 'رقمٌ عربيّ مفرد'),
    ('﴿كذا﴾ [البقرة: 275]', '﴿كذا﴾ [البقرة: 276]', 'رقمٌ لاتينيّ لا يُستثنى'),
    ('﴿كذا﴾ [الكهف: ٢٣-٢٤]', '﴿كذا﴾ [الكهف: ٢٤-٢٥]', 'طرفا المدى معًا'),
    ('﴿كذا﴾ [ال عمران]', '﴿كذا﴾ [ال عمران]', 'وسمٌ بلا رقم يُترك كما هو'),
]


def self_test() -> int:
    bad = 0
    for text, want, desc in SELF_TEST:
        got = check(text)[0]['status']
        ok = got == want
        bad += not ok
        print(f"{'✔' if ok else '✘'} {desc}\n    المتوقَّع={want} الناتج={got}")
    for text, want, desc in BUMP_TEST:
        got = bump_ayah_numbers(text)
        ok = got == want
        bad += not ok
        print(f"{'✔' if ok else '✘'} ضبط سالب: {desc}\n    المتوقَّع={want} الناتج={got}")
    n = len(SELF_TEST) + len(BUMP_TEST)
    print(f"\n=== اختبار ذاتي: {n - bad}/{n} نجح")
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(description='تحقُّق من استشهادات القرآن في محتوى مخزَّن')
    if '--self-test' in sys.argv:
        return self_test()
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
        reads = [r for r in rs if r['status'] == 'OK_SKELETON_ONLY']
        for r in rs:
            counts[r['status']] = counts.get(r['status'], 0) + 1
        rid = str(x.get(a.id_field, ''))[:8]
        label = str(x.get(a.label_field, ''))[:60]
        if flags or reads or not a.quiet:
            mark = ('✘' if flags else '⚠' if reads else '✔') if rs else '∅'
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
        for r in reads:
            print(f"    ⚠ تطابق هيكليّ فقط — اقرأه كلمةً كلمةً: {r.get('surah')}:{r.get('ayahs')}")
            print(f"      المقتبس={r['quote'][:160]}")
            print(f"      الجزء المشتبه={r.get('needs_read')}")

    n_read = counts.get('OK_SKELETON_ONLY', 0)
    print(f"\n=== صفوف={len(rows)} بلا استشهاد قرآني={no_quote} خلل={bad}"
          f" يحتاج قراءة يدوية={n_read} | {counts}")
    if a.negative_control:
        ok = sum(v for k, v in counts.items() if k.startswith('OK'))
        print(f"=== ضبط سالب: {ok} استشهادًا نجح رغم إزاحة رقم الآية (المرغوب: 0)")
        return 1 if ok else 0
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
