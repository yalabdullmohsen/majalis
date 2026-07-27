#!/usr/bin/env python3
"""إصلاحُ الملخَّصات المبتورة التي قُطع فيها اقتباسٌ قرآنيّ في وسط كلمة.

المشكلة التي يعالجها: حقلُ `summary` في `sharia_rulings` مقطوعٌ عند ١٦٠ حرفًا
بلا علامةِ حذف، وفي بعض الصفوف وقع القطعُ **داخل آيةٍ بين ﴿﴾** فبقي المصحف
معروضًا مبتورًا في وسط الكلمة (﴿وَارْكَع، ﴿لَّا يَمَسُّهُ إِلَّا الْمُ) —
وهذا أشدُّ من مجرّدِ بترِ جملة.

والإصلاحُ **نقلٌ حرفيّ لا إنشاء**: نصُّ الملخَّص موجودٌ بحرفه داخل `body`
الخاصِّ بالصفِّ نفسِه (فُحص: ١٦٧ من ١٧٥ مبتورًا هي سلاسلُ فرعيّةٌ من `body`)،
فيُمَدّ الملخَّصُ من `body` نفسِه حتى ينغلقَ الاقتباسُ بـ﴾، ويُلتقَط معه
وسمُ الموضع `[سورة: رقم]` إن تلاه مباشرةً، ثم تُختَم بـ«…» إن بقي في `body`
كلامٌ بعده. فلا يُضاف حرفٌ من خارج الصفّ، ولا تُعادُ صياغةُ شيء.

وبوابةُ الأمان: كلُّ اقتباسٍ في النصّ الناتج يُعرَض على
`verify-quran-citations.py` فلا يُكتَب SQL إن سقط منها اقتباسٌ واحد.

الاستعمال:
    python3 scripts/repair-truncated-summaries.py rows.json
    python3 scripts/repair-truncated-summaries.py rows.json --sql out.sql --table sharia_rulings
    python3 scripts/repair-truncated-summaries.py --self-test
"""
from __future__ import annotations
import argparse, json, re, sys

# قوسا الآية في محتوى المنصّة: ﴿ (U+FD3F) و﴾ (U+FD3E)
OPEN, CLOSE = '﴿', '﴾'

# وسمُ الموضع الذي يلي الاقتباسَ مباشرةً: [البقرة: ٤٣] أو [النساء: ٤٨ و١١٦]
TAG_RE = re.compile(r'^\s*\[[^\[\]]+?:\s*[٠-٩۰-۹0-9\sو\-]+\]')
ELLIPSIS = '…'


def needs_repair(summary: str) -> bool:
    """يُصلَح ما فيه ﴿ بلا ﴾ يقابلها — أي اقتباسٌ مبتورٌ في وسطه."""
    return summary.count(OPEN) != summary.count(CLOSE)


def repair(summary: str, body: str):
    """يمدّ الملخَّصَ من `body` حتى ينغلقَ الاقتباس. يرجع (النصّ، الحالة)."""
    if not needs_repair(summary):
        return summary, 'NO_CHANGE'
    idx = body.find(summary)
    if idx < 0:
        return summary, 'NOT_IN_BODY'
    rest = body[idx + len(summary):]
    close = rest.find(CLOSE)
    if close < 0:
        return summary, 'NO_CLOSE_IN_BODY'
    end = close + 1
    tag = TAG_RE.match(rest[end:])
    if tag:
        end += tag.end()
    out = summary + rest[:end]
    if rest[end:].strip():
        out += ELLIPSIS
    if needs_repair(out):
        return summary, 'STILL_UNBALANCED'
    return out, 'REPAIRED'


SELF_TESTS = [
    # (الملخَّص، المتن، المتوقَّع، الحالة)
    ('قال تعالى: ' + OPEN + 'وَارْكَع',
     'س: قال تعالى: ' + OPEN +
     'وَارْكَعُوا' + CLOSE +
     ' [البقرة: ٤٣] وزيادة',
     'قال تعالى: ' + OPEN + 'وَارْكَعُوا' +
     CLOSE + ' [البقرة: ٤٣]' + ELLIPSIS, 'REPAIRED'),
    # لا شيء بعد الوسم في المتن ⇒ لا تُضاف «…»
    ('أ ' + OPEN + 'ب', 'س أ ' + OPEN + 'بج' + CLOSE + ' [النور: ٢٧]',
     'أ ' + OPEN + 'بج' + CLOSE + ' [النور: ٢٧]', 'REPAIRED'),
    # اقتباسٌ مكتملٌ أصلًا ⇒ لا يُمَسّ
    ('أ ' + OPEN + 'ب' + CLOSE + ' ج', 'أ ' + OPEN + 'ب' + CLOSE + ' ج د',
     'أ ' + OPEN + 'ب' + CLOSE + ' ج', 'NO_CHANGE'),
    # الملخَّص ليس داخل المتن ⇒ لا يُخمَّن، يُترَك
    ('أ ' + OPEN + 'ب', 'نصٌّ آخر تمامًا', 'أ ' + OPEN + 'ب', 'NOT_IN_BODY'),
    # وسمٌ بموضعين (النساء: ٤٨ و١١٦) يُلتقَط كاملًا
    ('أ ' + OPEN + 'ب', 'أ ' + OPEN + 'بج' + CLOSE + ' [النساء: ٤٨ و١١٦]. تتمّة',
     'أ ' + OPEN + 'بج' + CLOSE + ' [النساء: ٤٨ و١١٦]' + ELLIPSIS, 'REPAIRED'),
    # المتنُ نفسُه لا يُغلق الاقتباس ⇒ يُترَك ويُبلَّغ
    ('أ ' + OPEN + 'ب', 'أ ' + OPEN + 'بج بلا إغلاق', 'أ ' + OPEN + 'ب', 'NO_CLOSE_IN_BODY'),
    # اقتباسان مكتملان ⇒ متوازنٌ فلا يُمَسّ
    ('أ ' + OPEN + 'ب' + CLOSE + ' و' + OPEN + 'ج' + CLOSE, 'أ...',
     'أ ' + OPEN + 'ب' + CLOSE + ' و' + OPEN + 'ج' + CLOSE, 'NO_CHANGE'),
]


def self_test() -> int:
    ok = 0
    for summary, body, want, want_st in SELF_TESTS:
        got, st = repair(summary, body)
        good = got == want and st == want_st
        ok += good
        print(('✔' if good else '✘'), st, '|', repr(got[:60]))
        if not good:
            print('    المتوقَّع=', want_st, repr(want[:60]))
    print(f'\n=== اختبار ذاتي: {ok}/{len(SELF_TESTS)} نجح')
    return 0 if ok == len(SELF_TESTS) else 1


def main() -> int:
    ap = argparse.ArgumentParser(description='إصلاحُ الملخَّصات المبتورة داخل اقتباسٍ قرآنيّ')
    ap.add_argument('rows', nargs='?')
    ap.add_argument('--field', default='summary')
    ap.add_argument('--body-field', default='body')
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
    stats, updates = {}, []
    for r in rows:
        summary, body = r.get(a.field) or '', r.get(a.body_field) or ''
        out, st = repair(summary, body)
        stats[st] = stats.get(st, 0) + 1
        mark = '✔' if st == 'REPAIRED' else ('·' if st == 'NO_CHANGE' else '✘')
        if st != 'NO_CHANGE':
            print(f"{mark} {r.get(a.label_field, '')[:60]}\n    {st}: {out[-80:]!r}")
        if st == 'REPAIRED':
            updates.append((r[a.id_field], out))

    print(f"\n=== صفوف={len(rows)} مُصلَحة={len(updates)} | {stats}")
    if a.sql and updates:
        with open(a.sql, 'w', encoding='utf-8') as f:
            f.write('-- إصلاحُ الملخَّصات المبتورة داخل اقتباسٍ قرآنيّ.\n')
            f.write('-- وُلِّد آليًّا بـ scripts/repair-truncated-summaries.py: كلُّ حرفٍ مُضافٍ\n')
            f.write('-- منقولٌ بحرفه من حقل body الخاصِّ بالصفِّ نفسِه، لا من خارجه.\n')
            f.write('BEGIN;\n')
            for rid, text in updates:
                esc = text.replace("'", "''")
                f.write(f"UPDATE {a.table} SET {a.field} = '{esc}'\n  WHERE {a.id_field} = '{rid}';\n")
            f.write('COMMIT;\n')
        print(f'=== كُتب SQL: {a.sql}')
    return 0 if not any(k not in ('REPAIRED', 'NO_CHANGE') for k in stats) else 1


if __name__ == '__main__':
    sys.exit(main())
