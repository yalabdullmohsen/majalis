# 07 — المصادقة والأمن والخصوصية

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## تدفقات

| تدفق | الملفات | ملاحظات مثبتة |
|---|---|---|
| Signup | `supabase.signUp`, LoginView/Register | Hosted: تأكيد بريد → لا جلسة فورية (`AGENTS.md`) |
| Login | `signIn` | |
| Logout | `signOut` + AuthProvider | |
| Password reset | `resetPasswordForEmail` → `/auth/callback` → UpdatePassword | |
| Session restore | `AuthProvider` + `onAuthStateChange` | |
| OAuth Google/Apple | دوال موجودة؛ أعلام تمكين **false** | Confirmed استكشاف |
| Roles/Admin | `is_admin()` في SQL + فحوصات عميل admin | Hosted role state Unknown |

## تخزين

- جلسة Supabase في تخزين المتصفح (سلوك المكتبة الافتراضي).
- تفضيلات عبادة/صلاة في `localStorage` بمفاتيح `majalis-*`.
- Capacitor Preferences لبعض الإعدادات الأصلية.
- Device/push tokens: محلي + api-server ملف JSON + جدول `push_subscriptions`.

## أسرار

- أسماء فقط في `.env.local.example` (انظر ملف البيئات).
- **ممنوع** قراءة/إخراج `.env.local` القيم.
- `VITE_*` و`EXPO_PUBLIC_*` تصبح عامة في الحزمة — لا تضع service role فيها.

## رفع ملفات / APIs خارجية

- مسارات admin import/upload موجودة؛ حدودها الأمنية تعتمد RLS + أسرار خادم.
- Assistant يحتاج `ANTHROPIC_API_KEY` خادمًا (`AGENTS.md`).
- Instagram/OpenAI/Upstash مذكورة كأسماء env اختيارية.

## Rate limiting / Logging

- Upstash مذكور للحد.
- `admin_audit_logs` وerror logs في المخططات.
- Client error logs section في admin UI (اسم مكوّن في البناء).

## خصوصية

- صفحات `/privacy`, `/privacy-policy`, `/privacy-center`, `/account-deletion`.
- خريطة بيانات: `PRIVACY_DATA_MAP.md` (جذر).

## مشكلات موثّقة (توصية عامة بلا تنفيذ)

| مشكلة | دليل | أثر | شدة |
|---|---|---|---|
| Signup بلا جلسة بسبب تأكيد البريد | AGENTS.md | ارتباك UX | P1 |
| Service role إن تسرّب للعميل | نمط VITE | اختراق بيانات | P0 محتمل إن حدث — لا دليل تسريب في الكود المفحوص |
| Runtime DDL ممنوع | verify:no-runtime-ddl | حماية | حوكمة |
| لوحة Auth MFA/Leaked password | REQUIRES_EXPLICIT_APPROVAL | حسابات | P1 مالك |
| Schema drift | docs/security | سياسات ناقصة | P1 Unknown مستضاف |

لا اختبار هجومي نُفّذ في هذه المهمة.
