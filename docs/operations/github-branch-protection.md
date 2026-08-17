# Branch protection (manual — requires repo admin)

Required status checks on `main` (do not skip):

1. `Verify build` — يجمع المسارات: tsc/lint/test/build + بوابات المستودع + Color contrast + visual-snapshot عند الحاجة
2. `ci-required` — مجمّع صريح: أي `Skipped` في بوابة إلزامية = فشل (الفحص المطلوب لحماية الفرع مع Verify build)
3. `postgres-integration` — عند المسارات الخطرة / `--full`
4. `xcodebuild-simulator` — when iOS/Capacitor paths change (`ios-native-macos.yml`)
5. `iOS static gates + unit tests` — when Capacitor paths change (`ios-capacitor-gates.yml`)

Also enable:

- Require a pull request before merging
- Require conversation resolution (optional)
- Do **not** allow bypass without admin
- Auto-merge: enabled (squash)
- Delete branch on merge: enabled

CODEOWNERS routes review for workflows/SQL/iOS; required reviews still need enabling in settings if desired.
