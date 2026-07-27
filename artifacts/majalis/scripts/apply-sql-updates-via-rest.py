#!/usr/bin/env python3
"""تطبيقُ ملفِّ UPDATE مولَّدٍ آليًّا على Supabase عبر REST (PostgREST).

مسارٌ بديلٌ عن `npx supabase db query --linked -f` حين يحتبسُ اتصالُ الـpooler
(عائقُ ج-٢٧٣). لا يُغيِّر حرفًا من محتوى الملفّ: يقرأ الجُملَ كما وُلِّدت،
ويُثبِتُ قبلَ كلِّ كتابةٍ أنّ نزعَ وسومِ الآيات يُرجعُ النصَّ إلى نصِّ الصفِّ
في قاعدةِ البيانات حرفًا بحرف — فما خالف ذلك لا يُكتَب.

    python3 scripts/apply-sql-updates-via-rest.py <file.sql> [--table T] [--dry-run]
    python3 scripts/apply-sql-updates-via-rest.py --self-test
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

# وسمُ الآية الذي تضيفه أدواتُ العزو: [اسم السورة: رقم/نطاق بالأرقام العربية]
AYAH_TAG = re.compile(r'\s*\[[^\[\]]{1,40}?:\s*[٠-٩۰-۹\d]+(?:\s*[-–]\s*[٠-٩۰-۹\d]+)?\]')

STMT = re.compile(
    r"UPDATE\s+(?P<table>\w+)\s+SET\s+(?P<field>\w+)\s*=\s*'(?P<value>(?:[^']|'')*)'\s*"
    r"WHERE\s+id\s*=\s*'(?P<id>[0-9a-fA-F-]{36})'\s*;",
    re.DOTALL,
)


def parse_sql(text: str) -> list[dict]:
    """يستخرجُ جُملَ UPDATE ذاتِ الحقلِ الواحد ومعرِّفِ الصفّ."""
    out = []
    for m in STMT.finditer(text):
        out.append({
            'table': m.group('table'),
            'field': m.group('field'),
            'id': m.group('id'),
            'value': m.group('value').replace("''", "'"),
        })
    return out


def strip_tags(text: str) -> str:
    return AYAH_TAG.sub('', text)


def env_credentials() -> tuple[str, str]:
    url = os.environ.get('SUPABASE_URL', '')
    key = os.environ.get('SUPABASE_ANON_KEY', '')
    if not (url and key):
        for line in open('.env.local', encoding='utf-8'):
            line = line.strip()
            if '=' not in line or line.startswith('#'):
                continue
            name, _, val = line.partition('=')
            val = val.strip().strip('"').strip("'")
            if name.endswith('SUPABASE_URL') and not url:
                url = val
            elif name.endswith('SUPABASE_ANON_KEY') and not key:
                key = val
    if not (url and key):
        raise SystemExit('تعذَّر إيجادُ SUPABASE_URL/SUPABASE_ANON_KEY')
    return url.rstrip('/'), key


def request(method: str, url: str, key: str, body: dict | None = None) -> tuple[int, str]:
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('apikey', key)
    req.add_header('Authorization', f'Bearer {key}')
    if data is not None:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode('utf-8')


def self_test() -> int:
    checks = []

    sql = """BEGIN;
-- تعليق
UPDATE qa_questions SET
      answer = 'نصٌّ ﴿آية﴾ [البقرة: ٢٥٥] فيه ''قوس'' مفرد'
  WHERE id = '15d97eaa-b63d-4634-8651-0f3742cf1431';
COMMIT;"""
    rows = parse_sql(sql)
    checks.append(('جملةٌ واحدةٌ تُستخرَج', len(rows) == 1))
    checks.append(('فكُّ تضعيفِ القوس المفرد', rows and "'قوس'" in rows[0]['value']))
    checks.append(('الحقلُ والمعرِّف', rows and rows[0]['field'] == 'answer'
                   and rows[0]['id'] == '15d97eaa-b63d-4634-8651-0f3742cf1431'))

    checks.append(('نزعُ وسمِ الآية', strip_tags('قال ﴿آية﴾ [البقرة: ٢٥٥] ثم') == 'قال ﴿آية﴾ ثم'))
    checks.append(('نزعُ وسمِ النطاق', strip_tags('﴿آية﴾ [الأحزاب: ٩-١٠].') == '﴿آية﴾.'))
    # ما ليس وسمًا لا يُنزَع: قوسٌ بلا نقطتين، وقوسٌ نصُّه غيرُ رقميّ
    checks.append(('لا يُنزَعُ ما ليس وسمًا', strip_tags('[تنبيه] و[سورة: كذا]') == '[تنبيه] و[سورة: كذا]'))
    # النصُّ بلا وسومٍ لا يتغيَّر
    checks.append(('النصُّ الخالي ثابت', strip_tags('لا وسمَ هنا') == 'لا وسمَ هنا'))

    ok = all(passed for _, passed in checks)
    for name, passed in checks:
        print(f"{'✔' if passed else '✘'} {name}")
    print(f"النتيجة: {sum(p for _, p in checks)}/{len(checks)}")
    return 0 if ok else 1


def main() -> int:
    if '--self-test' in sys.argv:
        return self_test()
    ap = argparse.ArgumentParser()
    ap.add_argument('sql_file')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    rows = parse_sql(open(args.sql_file, encoding='utf-8').read())
    if not rows:
        print('لا جُملَ في الملفّ')
        return 1
    url, key = env_credentials()

    applied = skipped = refused = 0
    for row in rows:
        endpoint = f"{url}/rest/v1/{row['table']}?id=eq.{row['id']}&select={row['field']}"
        status, body = request('GET', endpoint, key)
        if status != 200:
            print(f"✘ {row['id']}: تعذَّرت القراءة ({status}) {body[:120]}")
            refused += 1
            continue
        current = json.loads(body)
        if len(current) != 1:
            print(f"✘ {row['id']}: عددُ الصفوف {len(current)} لا ١")
            refused += 1
            continue
        db_text = current[0][row['field']] or ''

        if db_text == row['value']:
            print(f"= {row['id']}/{row['field']}: مطبَّقٌ سلفًا")
            skipped += 1
            continue
        # البرهان: الفرقُ وسومٌ فقط، والنصُّ المجرَّد واحدٌ حرفًا بحرف
        if strip_tags(db_text) != strip_tags(row['value']):
            print(f"✘ {row['id']}/{row['field']}: الفرقُ ليس وسومًا فقط — لا يُكتَب")
            refused += 1
            continue
        if args.dry_run:
            print(f"~ {row['id']}/{row['field']}: جاهزٌ للكتابة (تجريب)")
            applied += 1
            continue
        status, body = request(
            'PATCH', f"{url}/rest/v1/{row['table']}?id=eq.{row['id']}", key,
            {row['field']: row['value']},
        )
        if status not in (200, 204):
            print(f"✘ {row['id']}/{row['field']}: فشلت الكتابة ({status}) {body[:200]}")
            refused += 1
            continue
        status, body = request('GET', endpoint, key)
        after = json.loads(body)[0][row['field']] if status == 200 else None
        if after != row['value']:
            print(f"✘ {row['id']}/{row['field']}: التحقُّقُ بعد الكتابة لم يطابق")
            refused += 1
            continue
        print(f"✔ {row['id']}/{row['field']}: كُتب وتُحقِّق منه")
        applied += 1

    print(f"\nالحصيلة: مكتوبٌ {applied} | مطبَّقٌ سلفًا {skipped} | مرفوضٌ {refused} | الجملة {len(rows)}")
    return 0 if refused == 0 else 1


if __name__ == '__main__':
    raise SystemExit(main())
