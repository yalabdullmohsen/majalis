/**
 * generate-icons.ts
 * -----------------
 * دليل توليد أيقونات iOS لتطبيق مجالس العلم
 *
 * الخطوة اليدوية المطلوبة بعد الحصول على أيقونة 1024×1024 رسمية:
 *
 * 1. ضع الملف resources/icon.png (1024×1024 PNG، خلفية زمردية #153025)
 * 2. ضع الملف resources/splash.png (2732×2732 PNG، خلفية زمردية #153025)
 * 3. نفّذ:
 *
 *    npx @capacitor/assets generate \
 *      --ios \
 *      --iconBackgroundColor '#153025' \
 *      --splashBackgroundColor '#153025' \
 *      --iconBackgroundColorDark '#0E6E52' \
 *      --splashBackgroundColorDark '#0E6E52'
 *
 * 4. يُولّد الأمر تلقائياً جميع أحجام الأيقونات في:
 *    ios/App/App/Assets.xcassets/AppIcon.appiconset/
 *
 * ملاحظة: resources/icon.png المرفقة حالياً هي placeholder تصميمي.
 * يجب استبدالها بالأيقونة الرسمية قبل رفع التطبيق للمتجر.
 *
 * متطلبات الأيقونة:
 * - الحجم: 1024×1024 بكسل
 * - الصيغة: PNG، بدون شفافية (alpha channel)
 * - الخلفية: زمردية داكنة #153025
 * - الشعار: خطاطة "المجلس العلمي" من public/logo-calligraphy.png
 * - لا حواف دائرية — iOS يطبقها تلقائياً
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname ?? __dirname, "..");
const ICON_PATH = join(ROOT, "resources", "icon.png");
const SPLASH_PATH = join(ROOT, "resources", "splash.png");

function main() {
  if (!existsSync(ICON_PATH)) {
    console.error(
      `❌ resources/icon.png غير موجود.\n` +
        `   ضع ملف PNG بحجم 1024×1024 في المسار:\n` +
        `   ${ICON_PATH}`
    );
    process.exit(1);
  }

  if (!existsSync(SPLASH_PATH)) {
    console.warn(
      `⚠️  resources/splash.png غير موجود — سيُستخدم اللون الافتراضي #153025 للـ Splash.`
    );
  }

  console.log("🚀 توليد الأيقونات باستخدام @capacitor/assets...");

  try {
    execSync(
      `npx @capacitor/assets generate \
        --ios \
        --iconBackgroundColor '#153025' \
        --splashBackgroundColor '#153025' \
        --iconBackgroundColorDark '#0E6E52' \
        --splashBackgroundColorDark '#0E6E52'`,
      { cwd: ROOT, stdio: "inherit" }
    );
    console.log("✅ تمّ توليد الأيقونات بنجاح.");
  } catch (err) {
    console.error("❌ فشل توليد الأيقونات:", err);
    process.exit(1);
  }
}

main();
