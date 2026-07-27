#!/usr/bin/env python3
"""تحديدُ موضعِ كلِّ اقتباسٍ قرآنيّ غيرِ موسومٍ في محتوًى مخزَّن.

المشكلة التي يعالجها: محتوًى منشورٌ يعرض آيةً بين ﴿﴾ **بلا عزوٍ** إلى سورتها
ورقمها، فيبقى النصّ بلا مستنَدٍ مسمًّى يُراجَع عليه. وهذا يُحدِّد الموضعَ
**بمقابلةِ نصّ المصحف نفسِه لا بالتذكُّر**: يُطابَق المقتبسُ بنصّ المصحف
المحلّي في `public/data/quran/surah-XXX.json` (رواية حفص، وسلامتُه محقَّقةٌ
ببصمات SHA-256 عبر `scripts/verify-quran-integrity.mjs`)، فلا يُوسَم موضعٌ إلا
إذا وُجد المقتبسُ فيه **حرفيًّا**.

والمطابقةُ على السورة كلِّها متّصلةً (لا آيةً آيةً) لأنّ المقتبس قد يعبُر
حدَّ الآية (﴿... * ...﴾ = آيتان متتاليتان)، وكلُّ كلمةٍ في النصّ المتّصل
موسومةٌ برقم آيتها، فيُستخرَج من مدى المطابقة **مدى الآيات** بدقّة.

وطبقاتُ المقابلة هي طبقاتُ `verify-quran-citations.py` نفسُها متدرِّجةً:
حرفيّةً (`norm`)، ثم رسمًا إملائيًّا (`rasm`)، ثم هيكلًا صامتًا (`skel`)؛
وحالةُ الموضع هي أعلى طبقةٍ طابق فيها. ولا يُقبل موضعٌ إلا إن كان **وحيدًا**
في المصحف كلِّه: فإن تعدَّد (كقوله ﴿لَا يَمَسُّهُ إِلَّا الْمُطَهَّرُونَ﴾
لو تكرَّر) رُدَّ الأمرُ إلى النظر، ولم يُخترَع له ترجيح.

الاستعمال:
    python3 scripts/locate-quran-quotes.py rows.json [--field body] [--id-field id]
    python3 scripts/locate-quran-quotes.py rows.json --sql out.sql --table sharia_rulings
    python3 scripts/locate-quran-quotes.py --self-test

رمز الخروج: 0 إن حُدِّد موضعُ كلِّ اقتباسٍ غيرِ موسوم، و1 إن بقي واحدٌ مبهمًا.
"""
from __future__ import annotations
import argparse, importlib.util, json, os, re, sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    'verify_quran_citations', os.path.join(_HERE, 'verify-quran-citations.py'))
vq = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(vq)                      # يحمّل المصحف ويتحقّق من تمامه

norm, rasm, skel = vq.norm, vq.rasm, vq.skel
EN2AR = str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩')

# فواصل الحذف والانتقال بين آيتين داخل مقتبسٍ واحد
SPLIT_RE = re.compile(r'\.\.\.|…|\s\*\s|\s۞\s')


def build_index():
    """لكلِّ سورةٍ: قائمةُ كلماتٍ مطبَّعة، ورقمُ آيةِ كلِّ كلمة."""
    idx = {}
    for s, ayahs in vq.SURAHS.items():
        words, owner = [], []
        for a in sorted(ayahs):
            t = vq.ayah_text(s, a) or ''
            for w in norm(t).split():
                words.append(w)
                owner.append(a)
        idx[s] = (words, owner)
    return idx


INDEX = build_index()
LAYERS = (('OK', norm), ('OK_IMLAI', rasm), ('OK_SKELETON_ONLY', skel))


def _find(words_needle, layer_fn, s):
    """مواضعُ تطابقِ متتاليةِ كلماتٍ داخل سورةٍ واحدة بطبقةٍ بعينها."""
    words, owner = INDEX[s]
    n, m = len(words), len(words_needle)
    if m == 0 or m > n:
        return []
    hay = [layer_fn(w) for w in words]
    needle = [layer_fn(w) for w in words_needle]
    if any(not x for x in needle):
        needle = [x for x in needle if x]
        m = len(needle)
        if m == 0:
            return []
    out = []
    for i in range(n - m + 1):
        if hay[i:i + m] == needle:
            out.append((owner[i], owner[i + m - 1]))
    return out


def _chains(per_part):
    """تركيباتُ المواضع الصالحة: سورةٌ واحدة، وأجزاءُ المقتبس فيها متتابعةٌ ترتيبًا.

    فإن ورد جزءٌ من المقتبس في مواضعَ عدّة (كآيةٍ مكرَّرةٍ في السورة نفسِها)
    تعدَّدت التركيباتُ فيُردّ الأمرُ إلى النظر ولا يُوسَم.
    """
    chains = [[h] for h in per_part[0]]
    for found in per_part[1:]:
        nxt = []
        for ch in chains:
            s, _, hi = ch[-1]
            nxt.extend(ch + [h] for h in found if h[0] == s and h[1] >= hi)
        chains = nxt
        if not chains:
            return []
    return chains


def locate(quote: str):
    """يرجع (الحالة، المواضع) لمقتبسٍ واحد؛ الموضع = (سورة، أولُ آية، آخرُها)."""
    parts = [p for p in SPLIT_RE.split(quote) if norm(p)]
    if not parts:
        return 'EMPTY', []
    for status, fn in LAYERS:
        per_part = [sorted({(s, lo, hi) for s in INDEX for (lo, hi) in _find(norm(p).split(), fn, s)})
                    for p in parts]
        if any(not f for f in per_part):
            continue
        chains = _chains(per_part)
        spans = sorted({(ch[0][0], min(h[1] for h in ch), max(h[2] for h in ch)) for ch in chains})
        if len(spans) == 1:
            return status, spans
        return 'AMBIGUOUS', spans[:8]
    return 'NOT_FOUND', []


def tag_for(s: int, lo: int, hi: int) -> str:
    name = ''.join(ch for ch in vq.NAMES[s] if ch not in vq.DIAC)
    name = re.sub(r'^سورة\s+', '', name).strip()
    nums = str(lo) if lo == hi else f"{lo}-{hi}"
    return f"[{name}: {nums.translate(EN2AR)}]"


def process(text: str):
    """يُعيد (النصّ الموسوم، سجلّ كلّ اقتباسٍ عولج)."""
    log, out, pos = [], [], 0
    for m in re.finditer(r'﴿(.+?)﴾(\s*\[[^\]]+\])?', text or '', re.S):
        quote, existing = m.group(1).strip(), m.group(2)
        out.append(text[pos:m.end()])
        pos = m.end()
        if existing:
            log.append({'quote': quote, 'status': 'ALREADY_TAGGED', 'tag': existing.strip()})
            continue
        status, hits = locate(quote)
        rec = {'quote': quote, 'status': status,
               'hits': [f"{vq.NAMES[s]} {lo}-{hi}" for s, lo, hi in hits]}
        if len(hits) == 1 and status.startswith('OK'):
            s, lo, hi = hits[0]
            tag = tag_for(s, lo, hi)
            out.append(' ' + tag)
            rec['tag'] = tag
        log.append(rec)
    out.append(text[pos:])
    return ''.join(out), log


SELF_TEST = [
    ('﴿وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟﴾', '[البقرة: ٢٧٥]', 'OK',
     'مقتبسٌ بالرسم العثماني داخل آيةٍ واحدة'),
    ('﴿وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا﴾', '[البقرة: ٢٧٥]', 'OK_SKELETON_ONLY',
     'المقتبسُ نفسُه بالرسم الإملائي: «الربا» مقابل «ٱلرِّبَوٰا۟» فرقُ واوٍ في الرسم'
     ' ⇒ لا يصعد فوق الهيكل، ويُحدَّد موضعُه'),
    ('﴿وَلَا تَقُولَنَّ لِشَيْءٍ إِنِّي فَاعِلٌ ذَٰلِكَ غَدًا * إِلَّا أَن يَشَاءَ اللَّهُ﴾',
     '[الكهف: ٢٣-٢٤]', 'OK_IMLAI', 'مقتبسٌ يعبُر حدَّ الآية ⇒ يُوسَم بمداه لا بآخره'),
    ('﴿ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ﴾', None, 'AMBIGUOUS',
     'يُظنّ الفاتحةَ وحدها، وهو في ستّة مواضعَ من المصحف ⇒ لا يُخترَع له ترجيح'),
    ('﴿فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ﴾', None, 'AMBIGUOUS',
     'آيةٌ مكرَّرةٌ في السورة نفسِها ⇒ لا تُدمَج مواضعُها في مدًى واحد'),
    ('﴿الحمد لله رب العالمين أجمعين﴾', None, 'NOT_FOUND',
     'زيادةُ كلمةٍ ليست في القرآن ⇒ لا يُوسَم'),
    ('﴿وَأَحَلَّ اللَّهُ الْبَيْعَ﴾ [البقرة: ٢٧٥]', '[البقرة: ٢٧٥]', 'ALREADY_TAGGED',
     'الموسومُ سلفًا لا يُمَسّ'),
]


def self_test() -> int:
    bad = 0
    for text, want_tag, want_status, desc in SELF_TEST:
        new, log = process(text)
        got_status = log[0]['status']
        got_tag = log[0].get('tag')
        ok = got_status == want_status and got_tag == want_tag
        bad += not ok
        print(f"{'✔' if ok else '✘'} {desc}\n    المتوقَّع={want_status}/{want_tag}"
              f" الناتج={got_status}/{got_tag}")
    print(f"\n=== اختبار ذاتي: {len(SELF_TEST) - bad}/{len(SELF_TEST)} نجح")
    return 1 if bad else 0


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def main() -> int:
    if '--self-test' in sys.argv:
        return self_test()
    ap = argparse.ArgumentParser(description='تحديدُ مواضعِ الاقتباسات القرآنية غير الموسومة')
    ap.add_argument('rows', help='ملف JSON يحوي مصفوفة صفوف (أو - للقراءة من stdin)')
    ap.add_argument('--field', default='body')
    ap.add_argument('--id-field', default='id')
    ap.add_argument('--label-field', default='question')
    ap.add_argument('--sql', help='مسارُ ملفِ SQL يُولَّد للصفوف التي تغيّرت')
    ap.add_argument('--table', default='sharia_rulings')
    ap.add_argument('--limit', type=int, help='حدُّ عددِ الصفوف المعالَجة (حجمُ الدفعة)')
    a = ap.parse_args()

    rows = json.load(sys.stdin if a.rows == '-' else open(a.rows, encoding='utf8'))
    counts, changed, pending = {}, [], []
    for x in rows:
        text = x.get(a.field) or ''
        new, log = process(text)
        for r in log:
            counts[r['status']] = counts.get(r['status'], 0) + 1
        untagged = [r for r in log if r['status'] != 'ALREADY_TAGGED']
        if not untagged:
            continue
        stuck = [r for r in untagged if 'tag' not in r]
        if new != text and not stuck and (a.limit is None or len(changed) < a.limit):
            changed.append((x, new, log))
            mark = '✔'
        else:
            pending.append((x, log))
            mark = '✘' if stuck else '·'
        print(f"{mark} {str(x.get(a.label_field, ''))[:64]}")
        for r in untagged:
            print(f"    {r['status']:<18} {r.get('tag') or r.get('hits') or ''}")
            if 'tag' not in r:
                print(f"      المقتبس={r['quote'][:120]}")

    print(f"\n=== صفوف={len(rows)} مُوسَّمة={len(changed)} مؤجَّلة={len(pending)} | {counts}")
    if a.sql and changed:
        with open(a.sql, 'w', encoding='utf8') as f:
            f.write('-- توسيمُ مواضعِ الاقتباسات القرآنية في المحتوى المنشور.\n'
                    '-- وُلِّد آليًّا بـ scripts/locate-quran-quotes.py: كلُّ موضعٍ هنا\n'
                    '-- مقابَلٌ بنصّ المصحف المحلّي ووحيدٌ فيه، ولم يُوسَم ما تعدَّد موضعُه.\n'
                    'BEGIN;\n')
            for x, new, _ in changed:
                f.write(f"UPDATE {a.table} SET {a.field} = '{sql_escape(new)}'\n"
                        f"  WHERE id = '{x[a.id_field]}';\n")
            f.write('COMMIT;\n')
        print(f"=== كُتب SQL: {a.sql}")
    return 1 if pending else 0


if __name__ == '__main__':
    sys.exit(main())
