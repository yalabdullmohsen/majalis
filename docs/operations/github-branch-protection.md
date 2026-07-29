# حماية فرع main — GitHub

## المطلوب (يدوي في Settings → Branches)

| القاعدة | القيمة |
|---|---|
| Direct push | ممنوع |
| PR إلزامي | نعم |
| Approvals | ≥ 1 إن أمكن |
| Conversation resolution | مطلوب |
| Force push | ممنوع |
| Deletion | ممنوع |
| Require branches up to date | نعم |
| Auto-merge الافتراضي | معطّل على مستوى المستودع إن أمكن |

## Required Checks المقترحة

- `CI / quality`
- `CI / migration-check`
- `CI / postgres-integration`
- `Vercel – majalis-majalis` (Preview جاهز)

اختياري لاحقًا عند تفعيلها فعليًا:

- `CI / api-contract-tests`
- `CI / route-smoke-tests`
- `CI / playwright-mobile`
- `CI / preview-smoke`

## سياسات Workflow

- **ممنوع:** `gh pr merge` / undraft / `enablePullRequestAutoMerge` بدون Label يدوي صريح.
- التحقق الآلي: `pnpm verify:no-unsafe-auto-merge`
- Workflow التعليقات فقط: `pr-status-no-automerge.yml`

## Production deploy

- من `main` فقط عبر Vercel Git Integration بعد دمج بشري.
- لا تنشر من فروع الإصلاح مباشرة.
