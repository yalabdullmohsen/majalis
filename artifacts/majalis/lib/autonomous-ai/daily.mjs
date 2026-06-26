/**
 * Daily content rotation — hadith, ayah, dhikr, dua, faida, question, weekly picks.
 * Uses verified seed pools; no AI-generated religious text.
 */

import { logPipelineEvent } from "./audit.mjs";
import { DAILY_CONTENT_TYPES } from "./config.mjs";

const DAILY_POOLS = {
  hadith: [
    { id: "h1", body: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", title: "حديث اليوم", source_name: "متفق عليه", metadata: { narrator: "عمر بن الخطاب", grade: "صحيح" } },
    { id: "h2", body: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", title: "حديث اليوم", source_name: "متفق عليه", metadata: { grade: "صحيح" } },
    { id: "h3", body: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", title: "حديث اليوم", source_name: "البخاري ومسلم", metadata: { grade: "صحيح" } },
  ],
  ayah: [
    { id: "a1", body: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", title: "آية اليوم", source_name: "القرآن", metadata: { surah: "الفاتحة", ayah: 5 } },
    { id: "a2", body: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ", title: "آية اليوم", source_name: "القرآن", metadata: { surah: "الذاريات", ayah: 56 } },
    { id: "a3", body: "فَاذْكُرُونِي أَذْكُرْكُمْ", title: "آية اليوم", source_name: "القرآن", metadata: { surah: "البقرة", ayah: 152 } },
  ],
  dhikr: [
    { id: "d1", body: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", title: "ذكر اليوم", source_name: "مسلم", metadata: { count: 100 } },
    { id: "d2", body: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", title: "ذكر اليوم", source_name: "البخاري ومسلم" },
  ],
  dua: [
    { id: "du1", body: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", title: "دعاء اليوم", source_name: "القرآن" },
    { id: "du2", body: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى", title: "دعاء اليوم", source_name: "مسلم" },
  ],
  faida: [
    { id: "f1", body: "طلب العلم فريضة على كل مسلم", title: "فائدة اليوم", source_name: "ابن ماجه", metadata: { category: "العلم" } },
    { id: "f2", body: "من سلك طريقًا يلتمس فيه علمًا سهل الله له طريقًا إلى الجنة", title: "فائدة اليوم", source_name: "مسلم" },
  ],
  question: [
    { id: "q1", body: "ما حكم ترك صلاة الجماعة؟", title: "سؤال اليوم", metadata: { category: "الفقه" } },
    { id: "q2", body: "ما شروط صحة الوضوء؟", title: "سؤال اليوم", metadata: { category: "الطهارة" } },
  ],
  book_week: [
    { id: "bw1", body: "رياض الصالحين — للإمام النووي", title: "كتاب الأسبوع", source_name: "النووي" },
    { id: "bw2", body: "العقيدة الواسطية — للإمام ابن تيمية", title: "كتاب الأسبوع", source_name: "ابن تيمية" },
  ],
  scholar_week: [
    { id: "sw1", body: "الإمام محمد بن عبد الوهاب — داعية ومصلح", title: "عالم الأسبوع" },
    { id: "sw2", body: "الإمام النووي — حافظ ومحدث", title: "عالم الأسبوع" },
  ],
  lesson_week: [
    { id: "lw1", body: "درس في التوحيد — أركان الإسلام", title: "درس الأسبوع", metadata: { topic: "العقيدة" } },
    { id: "lw2", body: "درس في الفقه — أحكام الصلاة", title: "درس الأسبوع", metadata: { topic: "الفقه" } },
  ],
};

function kuwaitDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function getNextRotationIndex(admin, contentType, poolSize) {
  if (!admin || poolSize <= 0) {
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return dayIndex % poolSize;
  }

  try {
    const { data } = await admin
      .from("autonomous_daily_rotation")
      .select("*")
      .eq("content_type", contentType)
      .maybeSingle();

    let nextIndex = 0;
    if (data) {
      nextIndex = (data.last_index + 1) % poolSize;
      const cycleCompleted = nextIndex === 0 ? (data.cycle_completed || 0) + 1 : (data.cycle_completed || 0);

      await admin.from("autonomous_daily_rotation").upsert(
        {
          content_type: contentType,
          pool_size: poolSize,
          last_index: nextIndex,
          cycle_completed: cycleCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "content_type" },
      );
    } else {
      await admin.from("autonomous_daily_rotation").insert({
        content_type: contentType,
        pool_size: poolSize,
        last_index: 0,
      });
    }

    return nextIndex;
  } catch {
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    return dayIndex % poolSize;
  }
}

export async function rotateDailyContent(admin, runId) {
  const today = kuwaitDateString();
  let published = 0;
  const items = [];

  for (const contentType of DAILY_CONTENT_TYPES) {
    const pool = DAILY_POOLS[contentType] || [];
    if (!pool.length) continue;

    const index = await getNextRotationIndex(admin, contentType, pool.length);
    const pick = pool[index];

    const row = {
      content_date: today,
      content_type: contentType,
      content_id: pick.id,
      title: pick.title,
      body: pick.body,
      metadata: pick.metadata || {},
      source_name: pick.source_name || null,
      verification_status: "verified",
    };

    if (admin) {
      try {
        await admin.from("autonomous_daily_content").upsert(row, { onConflict: "content_date,content_type" });
      } catch {
        /* table may not exist */
      }
    }

    items.push(row);
    published++;

    await logPipelineEvent(admin, {
      runId,
      stage: "publish",
      eventType: "daily_content",
      contentKind: contentType,
      contentId: pick.id,
      message: `Daily ${contentType}: ${pick.title}`,
    });
  }

  return { ok: true, published, date: today, items };
}

export async function getDailyContent(admin, date) {
  const contentDate = date || kuwaitDateString();

  if (admin) {
    try {
      const { data } = await admin
        .from("autonomous_daily_content")
        .select("*")
        .eq("content_date", contentDate);
      if (data?.length) return data;
    } catch {
      /* fallback */
    }
  }

  return DAILY_CONTENT_TYPES.map((type) => {
    const pool = DAILY_POOLS[type] || [];
    const index = Math.floor(Date.now() / 86_400_000) % Math.max(pool.length, 1);
    const pick = pool[index];
    return pick ? { content_type: type, ...pick, content_date: contentDate } : null;
  }).filter(Boolean);
}

export { DAILY_POOLS, kuwaitDateString };
