#!/usr/bin/env python3
"""جلبُ صفوفِ جدولٍ من Supabase عبر REST بصيغةِ JSON التي تقرأها أدواتُ التدقيق.

مسارٌ بديلٌ عن `npx supabase db query --linked` حين يحتبسُ اتصالُ الـpooler.
يقرأ فقط (مفتاحُ anon لا يملكُ الكتابةَ فعليًّا)، ويُصفِّح النتائجَ بـRange.

    python3 scripts/fetch-rows-rest.py sharia_rulings --select id,title,evidence --out rows.json
    python3 scripts/fetch-rows-rest.py qa_questions --select id,answer --like 'answer=ilike.*﴿*'
"""
from __future__ import annotations

import argparse
import importlib.util as _ilu
import json
import urllib.parse

# استيرادٌ مباشرٌ للدالّتين من ملفٍّ اسمُه ذو شُرَط لا يقبلُه import العاديّ
_spec = _ilu.spec_from_file_location(
    'rest_helper', __file__.rsplit('/', 1)[0] + '/apply-sql-updates-via-rest.py')
_mod = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
env_credentials, request = _mod.env_credentials, _mod.request

PAGE = 500


def fetch(table: str, select: str, filters: list[str]) -> list[dict]:
    url, key = env_credentials()
    rows: list[dict] = []
    offset = 0
    query = [f'select={urllib.parse.quote(select)}']
    query.extend(filters)
    while True:
        endpoint = f'{url}/rest/v1/{table}?' + '&'.join(query) + f'&limit={PAGE}&offset={offset}'
        status, body = request('GET', endpoint, key)
        if status != 200:
            raise SystemExit(f'فشلت القراءة ({status}): {body[:300]}')
        batch = json.loads(body)
        rows.extend(batch)
        if len(batch) < PAGE:
            return rows
        offset += PAGE


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('table')
    ap.add_argument('--select', default='*')
    ap.add_argument('--filter', action='append', default=[],
                    help="مرشِّحُ PostgREST خامًا، مثال: answer=ilike.*%E2%9F%A9*")
    ap.add_argument('--out')
    args = ap.parse_args()

    rows = fetch(args.table, args.select, args.filter)
    payload = json.dumps(rows, ensure_ascii=False, indent=1)
    if args.out:
        open(args.out, 'w', encoding='utf-8').write(payload)
        print(f'{args.table}: {len(rows)} صفًّا ⇐ {args.out}')
    else:
        print(payload)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
