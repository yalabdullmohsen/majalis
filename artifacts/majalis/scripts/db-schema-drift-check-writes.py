# db-schema-drift-check-writes.py
#
# مكمِّل لـdb-schema-drift-check.py: ذاك يفحص استعلامات القراءة (.eq/.order)،
# هذا يفحص مفاتيح .insert({...})/.update({...})/.upsert({...}) — البُعد
# الآخر الضروري، فحقول تُكتب فقط ولا تُقرأ بشرط أبدًا (مثل profiles.email)
# لا تظهر إطلاقًا في فحص القراءة وحده (راجع "العطل التاسع" في
# CONTINUATION_PLAN.md لأمثلة حقيقية اكتُشفت بهذا السكربت تحديدًا).
#
# الاستخدام (من جذر المشروع artifacts/majalis)، ونفس خطوات المقارنة
# الموصوفة في db-schema-drift-check.py:
#   python3 scripts/db-schema-drift-check-writes.py > /tmp/insert-pairs.json
#
# نفس القيود المعروفة: heuristic بسيط (أقرب .from() سابق ضمن 3000 حرف)،
# وقد يُخطئ في حالات نادرة (اسم عمود عام كـ"status" يظهر في نداء .insert
# غير مرتبط فعليًا بالجدول الذي عُثر عليه قريبًا منه). راجع الملف المصدر
# عند الشك بنتيجة قبل تعديل أي مخطط قاعدة بيانات بناءً عليها.

import re, os, json

results = []
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
        for m in re.finditer(r'\.(insert|update|upsert)\(\s*\{', text):
            start = m.end() - 1
            depth = 0
            i = start
            while i < len(text):
                if text[i] == '{':
                    depth += 1
                elif text[i] == '}':
                    depth -= 1
                    if depth == 0:
                        break
                i += 1
            block = text[start:i + 1]

            key_re = re.compile(r'^\s*(?:\.\.\.|)([A-Za-z_][A-Za-z0-9_]*|"[^"]+"|\'[^\']+\')\s*:')
            parts = []
            cur = ""
            depth3 = 0
            for ch in block[1:-1]:
                if ch in "{[(":
                    depth3 += 1
                elif ch in "}])":
                    depth3 -= 1
                if ch == "," and depth3 == 0:
                    parts.append(cur)
                    cur = ""
                else:
                    cur += ch
            if cur.strip():
                parts.append(cur)

            keys = []
            for p in parts:
                km = key_re.match(p)
                if km:
                    keys.append(km.group(1).strip('"\''))

            best = None
            for fm in from_matches:
                if fm.start() < m.start() and (best is None or fm.start() > best.start()):
                    if m.start() - fm.start() < 3000:
                        best = fm
            if best:
                table = best.group(1)
                for k in keys:
                    results.append((path, table, k, m.group(1)))

pairs = {}
for path, table, col, kind in results:
    pairs.setdefault((table, col), []).append(path)

print(json.dumps({f"{t}.{c}": list(set(paths)) for (t, c), paths in pairs.items()}, ensure_ascii=False))
