# db-schema-drift-check.py
#
# يستخرج كل أزواج (جدول، عمود) المستخدَمة في استعلامات .eq()/.order()/...
# عبر src/ كاملة، لمقارنتها لاحقًا بأعمدة الجداول الفعلية في قاعدة البيانات
# الحية واكتشاف "كود صحيح ينتظر عمودًا/جدولًا لم يُنشأ قط عبر migration" —
# نمط عطل تكرر 6 مرات في جلسة 2026-07-23 (راجع CONTINUATION_PLAN.md).
#
# الاستخدام (من جذر المشروع artifacts/majalis):
#   python3 scripts/db-schema-drift-check.py > /tmp/query-pairs.json
#   ثم جلب الأعمدة الفعلية للجداول المذكورة عبر:
#     npx supabase db query --linked \
#       "select table_name, column_name from information_schema.columns
#        where table_name in ('جدول1','جدول2',...);"
#   ثم مقارنة الاثنين (جدول مفقود بالكامل، أو عمود غير موجود على جدول قائم).
#
# قيود معروفة: heuristic بسيط (أقرب .from() سابق ضمن 3000 حرف) — قد يُخطئ
# نادرًا في استعلامات متداخلة معقدة؛ راجع الملف المصدر عند الشك بنتيجة.

import re, os, json

results = []  # (file, table, column, call_type)
for root, dirs, files in os.walk("src"):
    dirs[:] = [d for d in dirs if d != "node_modules" and "__tests__" not in d]
    for fn in files:
        if not (fn.endswith(".ts") or fn.endswith(".tsx")):
            continue
        path = os.path.join(root, fn)
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except Exception:
            continue
        from_matches = list(re.finditer(r'\.from\(["\'](\w+)["\']\)', text))
        if not from_matches:
            continue
        call_matches = list(re.finditer(r'\.(eq|order|neq|gt|gte|lt|lte|is|not)\(\s*["\'](\w+)["\']', text))
        for cm in call_matches:
            best = None
            for fm in from_matches:
                if fm.start() < cm.start() and (best is None or fm.start() > best.start()):
                    if cm.start() - fm.start() < 3000:
                        best = fm
            if best:
                table = best.group(1)
                col = cm.group(2)
                results.append((path, table, col, cm.group(1)))

pairs = {}
for path, table, col, kind in results:
    pairs.setdefault((table, col), []).append(path)

print(json.dumps({f"{t}.{c}": list(set(paths)) for (t, c), paths in pairs.items()}, ensure_ascii=False))
