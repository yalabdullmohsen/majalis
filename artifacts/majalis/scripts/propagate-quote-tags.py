#!/usr/bin/env python3
"""نقلُ وسمِ موضعِ الاقتباس من حقلٍ موسومٍ إلى حقلٍ آخرَ في الصفِّ نفسِه.

المشكلة التي يعالجها: قد يُوسَم الاقتباسُ القرآنيّ في `body` (كما في ج-٢٦١
وج-٢٦٢) ويبقى **الاقتباسُ نفسُه** في `summary` من الصفِّ نفسِه بلا وسم. وفيه
اقتباساتٌ تعدَّد موضعُها في المصحف فلا تحسمها المقابلةُ وحدَها
(`locate-quran-quotes.py` يردُّها AMBIGUOUS)، وقد **سبق الفصلُ فيها** بحجّةٍ
مكتوبةٍ حين وُسِمت في `body`.

فهذا **ليس ترجيحًا جديدًا**: الوسمُ منقولٌ بحرفه من الحقل الموسوم في الصفِّ
نفسِه، والاقتباسُ يجب أن يكون **متطابقًا حرفيًّا** في الحقلين وإلا رُدّ. ولا
يُنقَل وسمٌ إلى اقتباسٍ موسومٍ أصلًا.

الاستعمال:
    python3 scripts/propagate-quote-tags.py rows.json --from body --to summary
    python3 scripts/propagate-quote-tags.py rows.json --from body --to summary --sql out.sql
    python3 scripts/propagate-quote-tags.py --self-test
"""
from __future__ import annotations
import argparse, json, re, sys

OPEN, CLOSE = '﴿', '﴾'
QUOTE_RE = re.compile(OPEN + r'([^' + OPEN + CLOSE + r']*)' + CLOSE)
TAG_RE = re.compile(r'^\s*\[[^\[\]]+?:\s*[٠-٩0-9\sو\-]+\]')


def tags_in(text: str) -> dict:
    """يرجع {نصُّ الاقتباس: وسمُه} لكلِّ اقتباسٍ موسومٍ في النصّ."""
    out = {}
    for m in QUOTE_RE.finditer(text):
        tag = TAG_RE.match(text[m.end():])
        if tag:
            out.setdefault(m.group(1), tag.group(0).strip())
    return out


def propagate(src: str, dst: str):
    """ينقل الوسومَ من `src` إلى اقتباسات `dst` المتطابقة حرفيًّا."""
    table = tags_in(src)
    if not table:
        return dst, 'NO_TAGS_IN_SOURCE', 0
    moved, out, last = 0, [], 0
    for m in QUOTE_RE.finditer(dst):
        if TAG_RE.match(dst[m.end():]):          # موسومٌ أصلًا ⇒ لا يُمَسّ
            continue
        tag = table.get(m.group(1))
        if not tag:                              # لا مقابلَ حرفيًّا ⇒ لا يُخمَّن
            continue
        out.append(dst[last:m.end()] + ' ' + tag)
        last = m.end()
        moved += 1
    if not moved:
        return dst, 'NO_MATCH', 0
    return ''.join(out) + dst[last:], 'PROPAGATED', moved


Q = lambda t: OPEN + t + CLOSE
SELF_TESTS = [
    # نقلٌ عاديّ لاقتباسٍ متطابقٍ حرفيًّا
    ('ب ' + Q('آ') + ' [البقرة: ١]. تتمّة', 'س ' + Q('آ') + '.',
     'س ' + Q('آ') + ' [البقرة: ١].', 'PROPAGATED', 1),
    # وسمٌ بموضعين يُنقَل كما هو
    ('ب ' + Q('آ') + ' [النساء: ٤٨ و١١٦].', 'س ' + Q('آ') + '.',
     'س ' + Q('آ') + ' [النساء: ٤٨ و١١٦].', 'PROPAGATED', 1),
    # الموسومُ سلفًا لا يُمَسّ
    ('ب ' + Q('آ') + ' [البقرة: ١]', 'س ' + Q('آ') + ' [البقرة: ١]',
     'س ' + Q('آ') + ' [البقرة: ١]', 'NO_MATCH', 0),
    # اختلافُ حرفٍ واحدٍ يمنع النقل — لا تخمين
    ('ب ' + Q('آب') + ' [البقرة: ١]', 'س ' + Q('آج') + '.',
     'س ' + Q('آج') + '.', 'NO_MATCH', 0),
    # المصدرُ بلا وسمٍ أصلًا
    ('ب ' + Q('آ'), 'س ' + Q('آ'), 'س ' + Q('آ'), 'NO_TAGS_IN_SOURCE', 0),
    # اقتباسان: يُنقَل الموافقُ فقط ويبقى الآخرُ بحاله
    ('ب ' + Q('آ') + ' [البقرة: ١] و' + Q('ب') + ' [النور: ٢]',
     'س ' + Q('ج') + ' ثم ' + Q('ب') + '.',
     'س ' + Q('ج') + ' ثم ' + Q('ب') + ' [النور: ٢].', 'PROPAGATED', 1),
]


def self_test() -> int:
    ok = 0
    for src, dst, want, want_st, want_n in SELF_TESTS:
        got, st, n = propagate(src, dst)
        good = got == want and st == want_st and n == want_n
        ok += good
        print(('✔' if good else '✘'), st, n, '|', repr(got))
        if not good:
            print('    المتوقَّع=', want_st, want_n, repr(want))
    print(f'\n=== اختبار ذاتي: {ok}/{len(SELF_TESTS)} نجح')
    return 0 if ok == len(SELF_TESTS) else 1


def main() -> int:
    ap = argparse.ArgumentParser(description='نقلُ وسومِ مواضعِ الاقتباس بين حقلَي الصفّ')
    ap.add_argument('rows', nargs='?')
    ap.add_argument('--from', dest='src', default='body')
    ap.add_argument('--to', dest='dst', default='summary')
    ap.add_argument('--id-field', default='id')
    ap.add_argument('--label-field', default='title')
    ap.add_argument('--table', default='sharia_rulings')
    ap.add_argument('--sql')
    ap.add_argument('--self-test', action='store_true')
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.rows:
        ap.error('يلزم ملفُ الصفوف أو --self-test')

    rows = json.load(sys.stdin if a.rows == '-' else open(a.rows, encoding='utf-8'))
    stats, updates, total = {}, [], 0
    for r in rows:
        out, st, n = propagate(r.get(a.src) or '', r.get(a.dst) or '')
        stats[st] = stats.get(st, 0) + 1
        total += n
        print(('✔' if n else '✘'), f"{r.get(a.label_field, '')[:55]}\n    {st} ({n}): {out[:110]!r}")
        if n:
            updates.append((r[a.id_field], out))

    print(f"\n=== صفوف={len(rows)} صفوفٌ غُيِّرت={len(updates)} وسومٌ منقولة={total} | {stats}")
    if a.sql and updates:
        with open(a.sql, 'w', encoding='utf-8') as f:
            f.write(f'-- نقلُ وسمِ موضعِ الاقتباس من {a.src} إلى {a.dst} في الصفِّ نفسِه.\n')
            f.write('-- وُلِّد آليًّا بـ scripts/propagate-quote-tags.py: كلُّ وسمٍ منقولٌ بحرفه\n')
            f.write('-- عن اقتباسٍ مطابقٍ حرفيًّا في الصفِّ نفسِه، لا ترجيحَ جديدًا فيه.\n')
            f.write('BEGIN;\n')
            for rid, text in updates:
                esc = text.replace("'", "''")
                f.write(f"UPDATE {a.table} SET {a.dst} = '{esc}'\n  WHERE {a.id_field} = '{rid}';\n")
            f.write('COMMIT;\n')
        print(f'=== كُتب SQL: {a.sql}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
