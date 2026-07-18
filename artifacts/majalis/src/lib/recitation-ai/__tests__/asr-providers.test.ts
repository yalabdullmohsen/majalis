/**
 * اختبارات مزوّدات QuranASRProvider — src/lib/recitation-ai/providers/*
 * ومنتقي المزوّد provider-registry.ts، وgate إتاحة التجويد precision-level.ts.
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/asr-providers.test.ts
 */
import { MockQuranASRProvider } from "../providers/mock-provider";
import { ServerQuranASRProvider } from "../providers/server-provider";
import { WebSpeechQuranASRProvider } from "../providers/web-speech-provider";
import { checkTajweedAvailability } from "../precision-level";
import { selectBestProvider } from "../provider-registry";
import { ASRProviderUnavailableError } from "../asr-provider";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

async function main() {
  console.log("═══ MockQuranASRProvider — تدفّق جلسة كامل ═══");
  {
    const provider = new MockQuranASRProvider();
    assert(await provider.isAvailable(), "المزوّد الوهمي متاح دومًا");
    const session = await provider.startSession({ language: "ar-SA", precisionLevel: "hifz" });
    const heard: string[] = [];
    const unsubscribe = provider.onPartialWord!(session, (w) => heard.push(w));
    provider.feedScriptedWord(session, "الحمد", 100);
    provider.feedScriptedWord(session, "لله", 200);
    unsubscribe();
    provider.feedScriptedWord(session, "رب", 300); // بعد إلغاء الاشتراك — يجب ألا يصل
    const final = await provider.endSession(session);
    assert(heard.length === 2 && heard[0] === "الحمد" && heard[1] === "لله", "الاستماع يستقبل كلمتين فقط قبل إلغاء الاشتراك");
    assert(final.words.length === 3, "النتيجة النهائية تشمل كل الكلمات المُغذَّاة (3) بصرف النظر عن الاشتراك");
  }

  console.log("═══ ServerQuranASRProvider — لا نتائج وهمية أبدًا ═══");
  {
    const provider = new ServerQuranASRProvider();
    assert(!(await provider.isAvailable()), "غير متاح صراحة (لم يُوصَل بنموذج حقيقي)");
    let threw = false;
    try {
      await provider.startSession({ language: "ar-SA", precisionLevel: "tajweed" });
    } catch (e) {
      threw = e instanceof ASRProviderUnavailableError && (e as ASRProviderUnavailableError).detail.code === "NOT_CONFIGURED";
    }
    assert(threw, "startSession يرفض بخطأ NOT_CONFIGURED بدل نتيجة وهمية");
  }

  console.log("═══ checkTajweedAvailability — قاعدة عدم المحاكاة ═══");
  {
    const server = new ServerQuranASRProvider();
    const result = await checkTajweedAvailability(server);
    assert(result.available === false, "التجويد غير متاح — whisper-large-v3 عام (supportsTajweed=false) لا محرك تجويد متخصص");

    const mock = new MockQuranASRProvider(); // supportsTajweed=false تصميميًا
    const result2 = await checkTajweedAvailability(mock);
    assert(result2.available === false, "التجويد غير متاح للمزوّد الوهمي (supportsTajweed=false)");
  }

  console.log("═══ WebSpeechQuranASRProvider — بيئة Node بلا window ═══");
  {
    const provider = new WebSpeechQuranASRProvider();
    assert(!(await provider.isAvailable()), "غير متاح في Node (لا window/SpeechRecognition) — صادق لا Mock");
    let threw = false;
    try {
      await provider.startSession({ language: "ar-SA", precisionLevel: "hifz" });
    } catch (e) {
      threw = e instanceof ASRProviderUnavailableError;
    }
    assert(threw, "startSession يرفض بخطأ واضح بدل نتيجة وهمية حين لا يتوفر Web Speech API");
  }

  console.log("═══ selectBestProvider — بيئة اختبار بلا Capacitor أصلي ولا متصفح ═══");
  {
    const online = await selectBestProvider(true);
    assert(online.provider === null, "بلا Capacitor أصلي وخادم غير مُهيَّأ وبلا متصفح ← لا مزوّد متاح (صادق، لا Mock تلقائي)");
    const offline = await selectBestProvider(false);
    assert(offline.provider === null, "نفس النتيجة دون اتصال (لا مصدر جهازي/متصفحي في بيئة Node الاختبارية)");
  }

  console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
  if (failed > 0) process.exit(1);
}

main();
