#!/usr/bin/env node
/**
 * معالج محتوى فيديوهات سلسلة زغلول النجار — يُستدعى لكل فيdeo بعد توفر التفريغ.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../data/miracles/zaghloul");

function splitParagraphs(text) {
  const markers = [
    "حتى نلقاكم غدا",
    "مشاهدينا الكرام السلام عليكم",
    "احبابي السلام عليكم",
    "بسم الله الرحمن الرحيم مشاهدينا",
  ];
  let parts = [text];
  for (const m of markers) {
    const next = [];
    for (const p of parts) {
      if (p.includes(m) && p.indexOf(m) > 500) {
        const i = p.indexOf(m);
        next.push(p.slice(0, i).trim(), p.slice(i).trim());
      } else next.push(p);
    }
    parts = next.filter(Boolean);
  }
  return parts;
}

function wordCount(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(s, max) {
  const w = s.trim().split(/\s+/);
  if (w.length <= max) return s.trim();
  return w.slice(0, max).join(" ") + "…";
}

function slugify(title) {
  return title
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "article";
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildArticle01() {
  const meta = {
    videoId: "kdGnCMbB7K0",
    index: 1,
    title: "الإعجاز العلمي في القرآن 1 — مفاهيم المعجزة ووجوه الإعجاز وضوابط التعامل",
    slug: "al-ijaz-al-ilmi-fi-al-quran-1",
    channel: "ZElnaggarOfficial",
    duration: "2:32:19",
    published: "2012-02-16",
    sourceUrl: "https://www.youtube.com/watch?v=kdGnCMbB7K0",
    transcriptSource: "تفريغ YouTube آلي (عربي) — يُنصح بمراجعته سمعياً",
  };

  const description =
    "الحلقة الأولى من برنامج الإعجاز العلمي في القرآن الكريم مع الدكتور زغلول النجار: تعريف المعجزة وشروطها، تمييزها عن الكرامة والمعونة والاستدراج والمُخْرِقة، معجزة القرآن الكبرى، وجوه الإعجاز (اللغوي، الديني، التاريخي، العلمي)، والفرق بين التفسير العلمي والإعجاز العلمي وضوابط التعامل معه.";

  const summary = truncateWords(
    "تستهل الحلقة بتمهيد رمضاني وتعريف بالدكتور زغلول النجار، ثم تناقش مفهوم المعجزة لغة وشرعاً وشروطها، وتمييزها عن الكرامة والاستدراج والمُخْرِقة، ومناسبة المعجزة لبيئة كل نبي. وتعرض لماهية معجزة القرآن الكبرى وحفظه، ووجوه الإعجاز المتعددة، وتُعرِّف بالإعجاز العلمي وأدوار الآيات الكونية الأربعة. وتُكمل ببيان الفرق بين التفسير العلمي والإعجاز العلمي، وضوابط التعامل مع الآيات الكونية، وأسباب المؤيدة والمعارضة، مع أمثلة تطبيقية من سور البقرة وهود وغيرها ضمن مداخلات الحلقة الممتدة.",
    300
  );

  const keyIdeas = [
    "القرآن الكريم هو المعجزة الخالدة للنبي الخاتم ﷺ؛ حفظه كلمة كلمة وحرفاً حرفاً على مدى أربعة عشر قرناً معجزة قائمة بذاتها.",
    "المعجزة لغة: أمر خارق للعادة لا يُحاكى؛ وتختص بالأنبياء والرسل، بخلاف الكرامة للصالحين والاستدراج للعصاة.",
    "شروط المعجزة: خارقة للسنن، تعجز البشرية عن مثلها، وتتناسب مع تميز أهل عصر كل نبي (سحر لفرعون، طب لعيسى، بلاغة لمحمد ﷺ).",
    "لفظ «معجزة» لم يرد في القرآن، لكن وردت معانيه بألفاظ: البرهان، الدليل، السلطان.",
    "معجزة القرآن ليست حفظ اللفظ فقط؛ بل معجزة في البيان والنظم والرسالة (عقيدة، عبادة، أخلاق، معاملات) وفي الدقة اللغوية والتاريخية والعلمية.",
    "الإعجاز العلمي: إثبات أن القرآن سبق العلم الحديث بحقائق كونية لم تُدرَك إلا في العصر الحديث — موقف تحدٍّ لا مجرد تفسير.",
    "التفسير العلمي: محاولة بشرية لحسن فهم الآية الكونية؛ يجوز فيه توظيف الحقائق والنظريات السائدة، والمصيب له أجران والمخطئ أجر.",
    "الآيات الكونية (أكثر من ألف آية صريحة بحسب المتحدث) لم تُنزل للإخبار العلمي المباشر، بل لأغراض: الإعجاز بالخلق، التوحيد، البعث، وخطاب أهل العلم في العصر الحديث.",
    "ضوابط التعامل: إتقان العربية، معرفة السياق وأسباب النزول، السنة، جهود المفسرين، التخصص العلمي، جمع الآيات ذات الباب، والوقوف على آخر العلم.",
    "في قضايا الخلق (الكون، الحياة، الإنسان) يجوز للمسلم — بحسب الدكتور — ارتقاء نظرية علمية إلى مقام الحقيقة إذا وافقتها آية أو حديث صحيح، لا لإثبات العلم بل لوجود النص.",
    "دعوة إلى «أسلمة المعرفة»: إعادة صياغة العلوم من منظور إسلامي دون إنكار قيمة الحقائق العلمية.",
    "الفصل بين العلوم الشرعية والكونية مرض معاصٍ؛ والقرآن يحث على التدبر والتفكر في خلق السماوات والأرض.",
  ];

  const quran = [
    {
      surah: "فصلت",
      ayah: "53",
      text: "سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ",
      note: "وردت في تمهيد البرنامج — رقم الآية مُستنتج من النص المذكور (غير مُنطَق صراحة في التفريغ)",
    },
    {
      surah: "الإسراء",
      ayah: "15",
      text: "وَمَا كُنَّا مُعَذِّبِينَ حَتَّىٰ نَبْعَثَ رَسُولًا",
      note: "مذكورة عند الحديث عن عذاب الأمم قبل البعث — الرقم غير مُنطَق في التفريغ",
    },
    {
      surah: "البقرة",
      ayah: "2",
      text: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ",
      note: "ذكرها الدكتور على لسان طبيب أمريكي أسلم — الرقم غير مُنطَق",
    },
    {
      surah: "آل عمران",
      ayah: "19",
      text: "إِنَّ الدِّينَ عِندَ اللَّهِ الْإِسْلَامُ",
      note: "في مداخلة هاتفية — الرقم غير مُنطَق",
    },
    {
      surah: "آل عمران",
      ayah: "85",
      text: "وَمَن يَبْتَغِ غَيْرَ الْإِسْلَامِ دِينًا فَلَن يُقْبَلَ مِنْهُ",
      note: "في مداخلة هاتفية — الرقم غير مُنطَق",
    },
    {
      surah: "يس",
      ayah: "82",
      text: "إِنَّا لَجَمِيعُونَ مُحِيطُونَ بِمَا يَصْنَعُونَ",
      note: "عند ذكر إرم — الرقم غير مُنطَق",
    },
    {
      surah: "الأعراف",
      ayah: "56",
      text: "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا",
      note: "وردت في سياق سورة هود — الرقم غير مُنطَق",
    },
    {
      surah: "الأعراف",
      ayah: "54",
      text: "إِنَّ رَبَّكُمُ اللَّهُ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ فِي سِتَّةِ أَيَّامٍ",
      note: "في سياق سورة هود — الرقم غير مُنطَق",
    },
    {
      surah: "الذاريات",
      ayah: "47",
      text: "وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ",
      note: "عند الحديث عن انبساط الكون — الرقم غير مُنطَق",
    },
    {
      surah: "الانبياء",
      ayah: "30",
      text: "أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا",
      note: "عند نظرية الانفجار العظيم — الرقم غير مُنطَق",
    },
    {
      surah: "فصلت",
      ayah: "11",
      text: "ثُمَّ اسْتَوَىٰ إِلَى السَّمَاءِ وَهِيَ دُخَانٌ",
      note: "عند الدخان الكوني — الرقم غير مُنطَق",
    },
    {
      surah: "النساء",
      ayah: "82",
      text: "أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ",
      note: "مذكورة عند الحديث عن التدبر — الرقم غير مُنطَق في التفريغ",
    },
  ];

  const hadith = [
    {
      text: "الحكمة ضالة المؤمن، أينما وجدها فهو أولى الناس بها.",
      narrator: "غير مُحدَّد في التفريغ",
      source: "غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ — يحتاج تحقيقاً",
    },
    {
      text: "من قال في القرآن برأيه فأصاب فله أجران، ومن قال في القرآن برأيه فأخطأ فله أجر.",
      narrator: "غير مُحدَّد",
      source: "نسب إلى رسول الله ﷺ دون ذكر كتاب — غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ",
    },
    {
      text: "من قال في القرآن بغير علم فليتبوأ مقعده من النار.",
      narrator: "غير مُحدَّد",
      source: "نسب إلى رسول الله ﷺ — غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ",
    },
    {
      text: "اقرأوا القرآن فإن لكم بكل حرف حسنة… أما قلت: ألف لام ميم حرف، ولكن ألف حرف ولام حرف وميم حرف.",
      narrator: "رسول الله ﷺ",
      source: "غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ",
    },
    {
      text: "من قرأ القرآن ولم يعربه أوكل الله إليه ملكاً… ومن قرأ القرآن وعربه أوكل الله إليه أربعة ملائكة…",
      narrator: "رسول الله ﷺ",
      source: "غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ — صيغة التفريغ الآلي غير دقيقة",
    },
    {
      text: "كانت الكعبة خشعة على الماء ثم دحت الأرض من حولها.",
      narrator: "رسول الله ﷺ",
      source: "ذكرها الدكتور في «غريب الحديث» — السند والمصدر غير مُفصَّلين في التفريغ",
      grade: "قال الدكتور: سنده صحيح — دون ذكر كتاب",
    },
    {
      text: "كان الله ولم يكن معه شيء…",
      narrator: "رسول الله ﷺ",
      source: "غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ",
    },
    {
      text: "إني لأعرف حجراً بمكة كان يسلم علي قبل أن أُبعث.",
      narrator: "رسول الله ﷺ",
      source: "غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ",
    },
    {
      text: "أحد جبل يحبنا ونحبه.",
      narrator: "رسول الله ﷺ — عن أحد",
      source: "غير مُحدَّد في التفريغ",
      grade: "غير مُحدَّد في التفريغ",
    },
  ];

  const scientificFacts = [
    "اكتشاف مدينة إرم (عاد) بالرادار عبر الأقمار الصناعية في جنوب شرقي الجزيرة العربية — بحسب ما ذكره الدكتور.",
    "انبساط الكون وتباعد المجرات بسرعات قريبة من سرعة الضوء — نظرية الانفجار العظيم.",
    "تصوير «الدخان الكوني» بتلسكوب هابل — وصفه العلماء بالدخان/الغبار الكوني.",
    "انفجار بعض الصخور المائية (آبار مائية تحت ضغط) ينتج ينابيع وانهارات — ظاهرة عُرفت علمياً في القرن العشرين بحسب الدكتور.",
    "الخسوف الأرضي وتصدع الصخور (مثل أخدود الأردن، البحر الأحمر).",
    "ميل محور الأرض واختلاف نقاط شروق الشمس — المشارق والمغارب.",
    "نشأة اليابسة الأولى من نشاط بركاني تحت محيط — ومركزية مكة في اليابسة بحسب الدكتور حسين كمال الدين (مذكور).",
    "تكوين العناصر في النجوم بالاندماج النووي حتى الحديد؛ وما فوقه في السماء.",
    "وصول ملايين الأطنان من العناصر للأرض سنوياً عبر الشهب والنيازك — بحسب الدكتور.",
    "الشمس لا تُرى إلا في طبقة الغلاف الجوي الرقيق (~100 كم) — بحسب تفسيره لسورة الشمس.",
    "المادة والطاقة وجهان لحقيقة واحدة (نسبية لEinstein — مذكور).",
    "قانون بقاء المادة والطاقة — ونقد صياغته المادية.",
    "أكثر من مليون ونصف نوع حي — و750 ألف نوع حشرات — أرقام ذكرها الدكتور.",
    "علماء الفلك: ما ندركه من السماء لا يتجاوز ~10% من الكتلة المحسوبة (المادة المظلمة — بحسب الدكتور).",
  ];

  const scholars = [
    "الدكتور زغلول النجار",
    "ابن حزم الأندلسي",
    "الإمام أبو حامد الغزالي",
    "الإمام الفخر الرازي",
    "الشيخ محمد رشيد رضا",
    "الإمام محمد عبده",
    "الشيخ طنطاوي الجوهري",
    "الشيخ سيد قطب",
    "عبد القاهر الجرجاني",
    "الوليد بن المغيرة",
    "ابن جني",
    "أبو العلاء المعري",
    "أبو بكر الصديق",
    "مسروق بن الأجدع",
    "الإمام الطبري",
    "نيقولاсон (مستشرق — مذكور)",
    "ألبرت أينشتاين (مذكور)",
    "جيمس جينز (مذكور)",
    "جورج جامow (مذكور)",
    "الدكتور حسين كمال الدين (مذكور)",
    "الخنساء (شعر — مذكورة)",
  ];

  const books = [
    "تفسير المنار — محمد رشيد رضا",
    "تفسير الألوسي / «روح المعاني» — مذكور ضمنياً",
    "تفسير الظلال — سيد قطب",
    "المحلى — ابن حزم",
    "مقالات الأهرام — الدكتور زغلول النجار (ذكر كتابتها الأسبوعية)",
    "بحث: «عن ضرورة إعادة صياغة العلوم من المنظور الإسلامي الصحيح» (1975 — مذكور)",
  ];

  const terms = [
    "الإعجاز العلمي",
    "التفسير العلمي",
    "الآيات الكونية",
    "المعجزة",
    "الكرامة",
    "الاستدراج",
    "المُخْرِقة",
    "الانفجار العظيم",
    "الدخان الكوني",
    "الخسوف الأرضي",
    "الاندماج النووي",
    "أسلمة المعرفة",
    "الإعجاز العددي (سُئِل عنه — يُؤجَّل)",
    "الرتق والفتق",
    "المشارق والمغارب",
  ];

  const keywords = [
    "الإعجاز العلمي",
    "زغلول النجار",
    "معجزة القرآن",
    "الآيات الكونية",
    "التفسير العلمي",
    "ضوابط الإعجاز",
    "إرم",
    "انبساط الكون",
    "التدبر",
  ];

  const references = [
    "تفريغ YouTube آلي للفيديو kdGnCMbB7K0 — المصدر الأساسي لهذا المقال",
    "مراجع علمية حديثة مُحدَّدة: غير مذكورة صراحة في التفريغ",
  ];

  const confidence = {
    level: "متوسط",
    reason:
      "المحتوى مستخرج من تفريغ YouTube آلي بلا تشكيل ودقة لغوية محدودة؛ كثير من الآيات والأحاديث وُجدت بمعناها دون أرقام أو مصادر؛ والمداخلات العلمية تعكس موقف الدكتور زغلول لا إجماعاً علمياً.",
  };

  const controversy =
    "نعم. ذكر الدكتور معارضين للمنهج (رشيد رضا، سيد قطب، وغيرهم) ومعارضة توظيف النظريات غير المثبتة. وفي قضايا الخلق: خلاف بين تبنّي نظرية الانفجار العظيم ونقد جيمس جينز وجورج جامow. وفي تفسيرات (إدراك الجمادات، مركزية مكة) توجد مراتب مختلفة بين العلم والتفسير.";

  const category = "القرآن";
  const subcategory = "مقدمات الإعجاز العلمي";

  const rawPath = path.join(ROOT, "raw/01-transcript-raw.txt");
  const raw = fs.readFileSync(rawPath, "utf8");
  const cleaned = splitParagraphs(raw).join("\n\n");
  fs.writeFileSync(path.join(ROOT, "raw/01-transcript-cleaned.txt"), cleaned, "utf8");

  const transcriptNote =
    "**تنبيه:** التفريغ الآلي من YouTube؛ النص بلا تشكيل كامل وقد يختلط فيه محتوى أكثر من فقرة/جلسة ضمن الملف الطويل. يُراجع سمعياً قبل الاعتماد القطعي.";

  const md = `# ${meta.title}

> **المصدر:** [${meta.title}](${meta.sourceUrl}) — ${meta.channel}  
> **المدة:** ${meta.duration} | **تاريخ النشر:** ${meta.published}  
> **${meta.transcriptSource}**

## نبذة

${description}

## ملخص

${summary}

## أهم الأفكار

${keyIdeas.map((x) => `- ${x}`).join("\n")}

## الآيات القرآنية

${quran
  .map(
    (a) =>
      `### ${a.surah}${a.ayah ? ` (${a.ayah})` : ""}\n> ${a.text}\n\n${a.note ? `*${a.note}*` : ""}`
  )
  .join("\n\n")}

## الأحاديث

${hadith
  .map(
    (h) =>
      `- **النص:** ${h.text}\n  - **الراوي:** ${h.narrator}\n  - **المصدر:** ${h.source}\n  - **الدرجة:** ${h.grade}`
  )
  .join("\n\n")}

## الحقائق العلمية

${scientificFacts.map((x) => `- ${x}`).join("\n")}

## العلاقة بين العلم والنص

الدكتور يربط الآيات الكونية بحقائق مُكتشفة حديثاً (فلك، جيولوجيا، أحياء) لإثبات **سبق القرآن** و**خطاب أهل العصر**، مع التفريق بين:
- **التفسير العلمي:** فهم محاول بشري قابل للخطأ.
- **الإعجاز العلمي:** إثبات عجز البشرية عن إنتاج مثل القرآن في دقة الإشارات.

## العلماء والمفكرون

${scholars.join("، ")}

## الكتب والدراسات

${books.map((b) => `- ${b}`).join("\n")}

## المصطلحات

${terms.join(" · ")}

## الكلمات المفتاحية

${keywords.join(" · ")}

## التصنيف

- **القسم:** ${category}
- **الفرع:** ${subcategory}

## مستوى الثقة العلمي: ${confidence.level}

${confidence.reason}

## خلاف علمي أو فقهي

${controversy}

## المراجع

${references.map((r) => `- ${r}`).join("\n")}

---

## التفريغ الكامل (منقح)

${transcriptNote}

${cleaned}
`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(meta.title)} | المجلس العلمي</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <style>
    :root { --text:#1a1a1a; --muted:#555; --accent:#0f5132; --bg:#faf9f6; --line:#ddd; }
    body { font-family: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif; background: var(--bg); color: var(--text); line-height: 1.9; margin: 0; }
    .wrap { max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    h1 { color: var(--accent); font-size: 1.75rem; margin-bottom: .25rem; }
    .meta { color: var(--muted); font-size: .9rem; margin-bottom: 1.5rem; }
    h2 { color: var(--accent); border-bottom: 1px solid var(--line); padding-bottom: .35rem; margin-top: 2rem; }
    blockquote { border-right: 4px solid var(--accent); margin: 1rem 0; padding: .5rem 1rem; background: #fff; }
    .tag { display: inline-block; background: #e8f5ee; color: var(--accent); padding: .15rem .55rem; border-radius: .25rem; font-size: .8rem; margin: .15rem; }
    ul { padding-right: 1.25rem; }
    .note { background: #fff8e6; border: 1px solid #f0d78c; padding: .75rem 1rem; border-radius: .35rem; }
    .transcript { white-space: pre-wrap; font-size: .95rem; background: #fff; border: 1px solid var(--line); padding: 1rem; border-radius: .35rem; }
  </style>
</head>
<body>
  <article class="wrap">
    <h1>${escapeHtml(meta.title)}</h1>
    <p class="meta">المصدر: <a href="${meta.sourceUrl}">${escapeHtml(meta.sourceUrl)}</a> — ${escapeHtml(meta.channel)} — ${meta.duration}</p>
    <p class="note">${escapeHtml(meta.transcriptSource)}</p>

    <h2>نبذة</h2>
    <p>${escapeHtml(description)}</p>

    <h2>ملخص</h2>
    <p>${escapeHtml(summary)}</p>

    <h2>أهم الأفكار</h2>
    <ul>${keyIdeas.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>

    <h2>الآيات القرآنية</h2>
    ${quran
      .map(
        (a) =>
          `<blockquote><strong>${escapeHtml(a.surah)}${a.ayah ? ` (${a.ayah})` : ""}</strong><br/>${escapeHtml(a.text)}<br/><small>${escapeHtml(a.note || "")}</small></blockquote>`
      )
      .join("")}

    <h2>الأحاديث</h2>
    <ul>${hadith
      .map(
        (h) =>
          `<li><strong>${escapeHtml(h.text)}</strong><br/>الراوي: ${escapeHtml(h.narrator)} — المصدر: ${escapeHtml(h.source)} — الدرجة: ${escapeHtml(h.grade)}</li>`
      )
      .join("")}</ul>

    <h2>الحقائق العلمية</h2>
    <ul>${scientificFacts.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>

    <h2>التصنيف والثقة</h2>
    <p><span class="tag">${escapeHtml(category)}</span> <span class="tag">${escapeHtml(subcategory)}</span> <span class="tag">ثقة: ${escapeHtml(confidence.level)}</span></p>
    <p>${escapeHtml(confidence.reason)}</p>

    <h2>الكلمات المفتاحية</h2>
    <p>${keywords.map((k) => `<span class="tag">${escapeHtml(k)}</span>`).join(" ")}</p>

    <h2>التفريغ الكامل</h2>
    <div class="transcript">${escapeHtml(cleaned.slice(0, 50000))}${cleaned.length > 50000 ? "\n\n[… باقي التفريغ في ملف Markdown …]" : ""}</div>
  </article>
</body>
</html>`;

  const json = {
    title: meta.title,
    slug: meta.slug,
    description,
    summary,
    content: cleaned,
    category,
    subcategory,
    videoId: meta.videoId,
    sourceUrl: meta.sourceUrl,
    duration: meta.duration,
    quran: quran.map(({ note, ...rest }) => rest),
    hadith,
    scientificFacts,
    keyIdeas,
    scholars,
    books,
    terms,
    keywords,
    references,
    confidence: confidence.level,
    confidenceReason: confidence.reason,
    scientificControversy: controversy,
    transcriptQuality: meta.transcriptSource,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const outDir = path.join(ROOT, "articles/01");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "article.md"), md, "utf8");
  fs.writeFileSync(path.join(outDir, "article.html"), html, "utf8");
  fs.writeFileSync(path.join(outDir, "article.json"), JSON.stringify(json, null, 2), "utf8");

  // Index markdown
  const indexMd = `# فهرس سلسلة الإعجاز العلمي — الدكتور زغlول النجار

**قائمة التشغيل:** [PL8hYiaj6HvljNlPHKQlgrtO69hvz7lgjp](https://youtube.com/playlist?list=PL8hYiaj6HvljNlPHKQlgrtO69hvz7lgjp)

| # | العنوان | المدة | الرابط | الحالة |
|---|---------|-------|--------|--------|
${JSON.parse(fs.readFileSync(path.join(ROOT, "index/playlist.json"), "utf8"))
  .videos.map(
    (v) =>
      `| ${v.index} | ${v.title || "غير متاح"} | ${v.duration || "—"} | ${v.url ? `[${v.id}](${v.url})` : "—"} | ${v.index === 1 ? "✅ مُعالَج" : v.title ? "⏳ قيد الانتظار" : "❌ مخفي"} |`
  )
  .join("\n")}

---
*آخر تحديث:* ${new Date().toISOString().slice(0, 10)}
`;
  fs.writeFileSync(path.join(ROOT, "index/README.md"), indexMd.replace("زغlول", "زغلول"), "utf8");

  console.log("Generated:", outDir);
  console.log("Transcript words:", wordCount(cleaned));
}

buildArticle01();
