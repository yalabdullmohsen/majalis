#!/usr/bin/env python3
"""حسمُ المقتبسِ القرآنيِّ المتعدِّدِ الموضعِ **بحجّةٍ من الصفِّ نفسِه** لا من الذاكرة.

المشكلة التي يعالجها: `locate-quran-quotes.py` لا يُوسِم إلا الموضعَ **الوحيد**
في المصحف، فإن ورد المقتبسُ في موضعين فأكثر ردَّه `AMBIGUOUS` ولم يُخترَع له
ترجيح. وأكثرُ هذه المبهَمات في المحتوى المعروض **ليست مبهَمةً في سياقها**: هي
شَذْرةٌ من آيةٍ **موسومةٍ في الصفِّ نفسِه** (﴿جُنُودٌ﴾ بعد ﴿... إِذْ جَآءَتْكُمْ
جُنُودٌ ...﴾ [الأحزاب: ٩])، أو آيةٌ **سمّاها النصُّ باسمها** (﴿اللهُ لا إِلَهَ
إِلا هُوَ الْحَيُّ الْقَيُّومُ﴾ بعد «فَاقْرَأْ آيَةَ الْكُرْسِيِّ»).

فالحسمُ هنا بقاعدتين، كلتاهما **مبرهَنةٌ آليًّا** من الصفِّ ومن المصحف المحلّي:

١) `CONTEXT_TAG` — أن يكون مدى أحدِ المواضع المحتمَلة **داخلَ مدى اقتباسٍ
   موسومٍ في الحقل نفسِه**، و**وحدَه** دون بقيّة المحتمَلات. فإن وافق موضعان
   وسمَين في الصفّ لم يُحسَم شيء (شرطُ الوحدة).

٢) `NAMED_AYAH` — أن يسبقَ المقتبسَ في النصّ تسميةٌ صريحة «آيةَ كذا»، وأن تكون
   الكلمةُ المسمّى بها موجودةً في **أحدِ المواضع المحتمَلة دون غيره** بمقابلةِ
   نصِّ المصحف نفسِه (لا بالتذكُّر): «الكرسيّ» في البقرة ٢٥٥ («وَسِعَ
   كُرْسِيُّهُ») وليست في آل عمران ٢.

وما لم تقم له حجّةٌ بإحدى القاعدتين **يُترَك كما هو ولا يُخترَع له ترجيح**.
وكلُّ ما حُسم هنا **ترجيحٌ** — فيُوسَم في `needs-post-review.jsonl`.

الاستعمال:
    python3 scripts/resolve-ambiguous-quote-tags.py rows.json --fields answer,evidence
    python3 scripts/resolve-ambiguous-quote-tags.py rows.json --fields answer --sql out.sql
    python3 scripts/resolve-ambiguous-quote-tags.py --self-test

رمز الخروج: 0 إن سلمت البوابة، و1 إن ظهر خللٌ في نصٍّ ناتج.
"""
from __future__ import annotations
import argparse, importlib.util, json, os, re, sys

_HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name, fname):
    spec = importlib.util.spec_from_file_location(name, os.path.join(_HERE, fname))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


lq = _load('locate_quran_quotes', 'locate-quran-quotes.py')
vq = lq.vq
norm, locate, tag_for = vq.norm, lq.locate, lq.tag_for

QUOTE_RE = re.compile(r'﴿(.+?)﴾(\s*\[([^\]]+)\])?', re.S)
# تسميةُ الآية باسمها بعد التطبيع: «آيَةَ الْكُرْسِيِّ» ⇐ «ايه الكرسي»
NAME_RE = re.compile(r'اي[ةه]\s+(\S{3,})')


def tagged_spans(text: str):
    """مدياتُ الآيات المذكورةِ في وسومِ هذا الحقل: [(سورة، أوّل، آخر)]."""
    out = []
    for m in QUOTE_RE.finditer(text or ''):
        if not m.group(3):
            continue
        snum, nums, err = vq.resolve_tag(m.group(3))
        if err or not snum or not nums:
            continue                      # وسمٌ لا يُفهَم ⇒ لا يُتَّخذ حجّة
        out.append((snum, min(nums), max(nums)))
    return out


def _stem(word: str) -> str:
    w = norm(word).strip()
    w = re.sub(r'[^ء-ي]', '', w)
    return w[2:] if w.startswith('ال') and len(w) > 4 else w


def by_context_tag(hits, spans):
    """المواضعُ المحتمَلةُ الداخلةُ في مدى وسمٍ من الحقل نفسِه."""
    return [h for h in hits
            if any(h[0] == s and h[1] >= lo and h[2] <= hi for s, lo, hi in spans)]


def by_named_ayah(hits, before: str):
    """المواضعُ التي تحوي الكلمةَ التي سُمّيت بها الآيةُ قبل المقتبس."""
    names = NAME_RE.findall(norm(before or ''))
    if not names:
        return []
    stem = _stem(names[-1])
    if len(stem) < 3:
        return []
    keep = []
    for s, lo, hi in hits:
        raw = ' '.join(filter(None, (vq.ayah_text(s, a) for a in range(lo, hi + 1))))
        if stem in norm(raw):
            keep.append((s, lo, hi))
    return keep


def process(text: str):
    """يرجع (النصّ بعد الحسم، سجلُّ كلِّ مبهَمٍ عولج)."""
    text = text or ''
    spans = tagged_spans(text)
    log, out, pos = [], [], 0
    for m in QUOTE_RE.finditer(text):
        out.append(text[pos:m.end()])
        pos = m.end()
        if m.group(3):
            continue
        quote = m.group(1).strip()
        status, hits = locate(quote)
        if status != 'AMBIGUOUS':
            continue
        rec = {'quote': quote, 'rule': None,
               'hits': [f"{vq.NAMES[s]} {lo}-{hi}" for s, lo, hi in hits]}
        for rule, keep in (('CONTEXT_TAG', by_context_tag(hits, spans)),
                           ('NAMED_AYAH', by_named_ayah(hits, text[:m.start()]))):
            if len(keep) == 1:
                s, lo, hi = keep[0]
                rec['rule'], rec['tag'] = rule, tag_for(s, lo, hi)
                out.append(' ' + rec['tag'])
                break
        log.append(rec)
    out.append(text[pos:])
    return ''.join(out), log


Q = lambda t: '﴿' + t + '﴾'
JUNUD = 'ٱذْكُرُوا۟ نِعْمَةَ ٱللَّهِ عَلَيْكُمْ إِذْ جَآءَتْكُمْ جُنُودٌۭ'
KURSI = 'اللهُ لا إِلَهَ إِلا هُوَ الْحَيُّ الْقَيُّومُ'
HAMD = 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ'

SELF_TESTS = [
    (Q(JUNUD) + ' [الأحزاب: ٩] وسمّاهم ' + Q('جُنُودٌۭ'),
     Q(JUNUD) + ' [الأحزاب: ٩] وسمّاهم ' + Q('جُنُودٌۭ') + ' [الأحزاب: ٩]',
     'CONTEXT_TAG', 'شَذْرةٌ من آيةٍ موسومةٍ في الحقل نفسِه ⇒ تُحسَم بوسم جارها'),
    ('فَاقْرَأْ آيَةَ الْكُرْسِيِّ ' + Q(KURSI),
     'فَاقْرَأْ آيَةَ الْكُرْسِيِّ ' + Q(KURSI) + ' [البقرة: ٢٥٥]',
     'NAMED_AYAH', 'النصُّ سمّى الآية، و«كرسيّ» في البقرة ٢٥٥ وحدَها من المحتمَلين'),
    ('لا حجّة هنا ' + Q(HAMD), 'لا حجّة هنا ' + Q(HAMD), None,
     'مبهَمٌ بلا حجّةٍ من السياق ⇒ لا يتغيّر النصُّ حرفًا'),
    (Q('إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ') + ' [النساء: ٤٨] و'
     + Q('إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ') + ' [النساء: ١١٦] ثم '
     + Q('لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ'),
     Q('إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ') + ' [النساء: ٤٨] و'
     + Q('إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ') + ' [النساء: ١١٦] ثم '
     + Q('لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ'),
     None, 'موضعان محتمَلان يوافقان وسمَين ⇒ شرطُ الوحدة يمنع الحسم'),
    ('آيَةَ الْكُرْسِيِّ ' + Q(KURSI) + ' [البقرة: ٢٥٥]',
     'آيَةَ الْكُرْسِيِّ ' + Q(KURSI) + ' [البقرة: ٢٥٥]', None,
     'الموسومُ سلفًا لا يُمَسّ'),
    ('آيَةُ النُّورِ ' + Q(HAMD), 'آيَةُ النُّورِ ' + Q(HAMD), None,
     'اسمٌ لا يوجد في شيءٍ من المواضع المحتمَلة ⇒ لا يُحسَم'),
    ('سياقٌ فيه ' + Q('وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟'),
     'سياقٌ فيه ' + Q('وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟'), None,
     'غيرُ المبهَم لا تمسُّه هذه الأداةُ أصلًا (شأنُ locate-quran-quotes)'),
]


def self_test() -> int:
    bad = 0
    for text, want, want_rule, desc in SELF_TESTS:
        new, log = process(text)
        got_rule = next((r['rule'] for r in log if r.get('rule')), None)
        ok = new == want and got_rule == want_rule
        bad += not ok
        print(f"{'✔' if ok else '✘'} {desc}"
              + ('' if ok else f"\n    المتوقَّع={want!r}/{want_rule}\n    الناتج={new!r}/{got_rule}"))
    print(f"\n=== اختبار ذاتي: {len(SELF_TESTS) - bad}/{len(SELF_TESTS)} نجح")
    return 1 if bad else 0


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def main() -> int:
    if '--self-test' in sys.argv:
        return self_test()
    ap = argparse.ArgumentParser(description='حسمُ المقتبسات المبهَمة بحجّةٍ من الصفّ')
    ap.add_argument('rows')
    ap.add_argument('--fields', default='answer,evidence')
    ap.add_argument('--id-field', default='id')
    ap.add_argument('--label-field', default='question')
    ap.add_argument('--table', default='qa_questions')
    ap.add_argument('--sql')
    a = ap.parse_args()

    rows = json.load(sys.stdin if a.rows == '-' else open(a.rows, encoding='utf8'))
    fields = [f.strip() for f in a.fields.split(',') if f.strip()]
    changed, stuck, counts = [], 0, {}
    for x in rows:
        sets = []
        for f in fields:
            new, log = process(x.get(f) or '')
            for r in log:
                key = r['rule'] or 'UNRESOLVED'
                counts[key] = counts.get(key, 0) + 1
                if not r['rule']:
                    stuck += 1
            if not log:
                continue
            print(f"{'✔' if new != (x.get(f) or '') else '✘'} "
                  f"{str(x.get(a.label_field, ''))[:56]} [{f}]")
            for r in log:
                print(f"    {r['rule'] or 'UNRESOLVED':<12} {r.get('tag') or r['hits']}")
                print(f"      المقتبس={r['quote'][:100]}")
            if new != (x.get(f) or ''):
                sets.append((f, new))
        if sets:
            changed.append((x, sets))

    total_tags = sum(len(s) for _, s in changed)
    print(f"\n=== صفوف={len(rows)} محسومة={total_tags} باقٍ مبهَمًا={stuck} | {counts}")

    bad = 0
    for x, sets in changed:                    # بوابةُ الاستشهاد على كلِّ نصٍّ ناتج
        for f, new in sets:
            for res in vq.check(new):
                if res['status'] not in ('OK', 'OK_IMLAI', 'OK_SKELETON_ONLY', 'NO_TAG'):
                    bad += 1
                    print(f"  ✘ [{f}] {res['status']} {res['quote'][:60]}")
    print(f"=== بوابةُ الاستشهاد: {'سليمة' if not bad else f'{bad} خلل'}")
    if bad:
        return 1

    if a.sql and changed:
        with open(a.sql, 'w', encoding='utf8') as fh:
            fh.write('-- حسمُ المقتبسات القرآنية المتعدِّدةِ الموضع بحجّةٍ من الصفِّ نفسِه.\n'
                     '-- وُلِّد آليًّا بـ scripts/resolve-ambiguous-quote-tags.py:\n'
                     '-- CONTEXT_TAG = مدى الموضع داخلَ وسمٍ في الحقل نفسِه ووحدَه،\n'
                     '-- NAMED_AYAH  = النصُّ سمّى الآية والاسمُ في موضعٍ واحدٍ منها.\n'
                     'BEGIN;\n')
            for x, sets in changed:
                assigns = ',\n      '.join(f"{f} = '{sql_escape(v)}'" for f, v in sets)
                fh.write(f"-- {str(x.get(a.label_field, ''))[:70]}\n"
                         f"UPDATE {a.table} SET\n      {assigns}\n"
                         f"  WHERE {a.id_field} = '{x[a.id_field]}';\n")
            fh.write('COMMIT;\n')
        print(f"=== كُتب SQL: {a.sql}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
