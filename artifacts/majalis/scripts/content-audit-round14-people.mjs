/**
 * إثراء تعاريف شخصيات قصيرة — الجولة 14
 * Usage: node scripts/content-audit-round14-people.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(root, "public/data/quran-people/people.json");
const data = JSON.parse(readFileSync(path, "utf8"));

const EXPANSIONS = {
  nuh: {
    definition:
      "نبي الله نوح عليه السلام من أولي العزم؛ دعا قومه ألف سنة إلا خمسين عامًا، فصبر على التكذيب حتى جاء الطوفان ونجا من ركب معه في الفلك.",
  },
  hud: {
    definition:
      "نبي الله هود عليه السلام؛ أُرسل إلى عاد بالأحقاف فدعاهم إلى التوحيد وترك الاستكبار، فكذّبوه فأهلكهم الله بريح صرصر عاتية.",
  },
  salih: {
    definition:
      "نبي الله صالح عليه السلام؛ أُرسل إلى ثمود بالحجر، وآتاه الله آية الناقة بيّنة، فعتوا عن أمر ربهم فعاقبهم الله بالصيحة.",
  },
  ibrahim: {
    definition:
      "أبو الأنبياء وخليل الرحمن إبراهيم عليه السلام؛ دعا إلى التوحيد وكسر الأصنام، وابتُلي بالذبح فصدق، وبنى الكعبة مع إسماعيل.",
  },
  lut: {
    definition:
      "نبي الله لوط عليه السلام؛ أُرسل إلى قومه فنهاهم عن الفاحشة والمنكر، فكذبوه فأهلكهم الله ونجّى أهله إلا امرأته كانت من الغابرين.",
  },
  ismail: {
    definition:
      "نبي الله إسماعيل عليه السلام؛ ابن إبراهيم، وشارك أباه في بناء البيت الحرام، وصبر على ذبح الرؤيا فكان من الصادقين.",
  },
  "is-haq": {
    definition:
      "نبي الله إسحاق عليه السلام؛ ابن إبراهيم من سارة، وبُشّر به على الكبر، وهو أبو يعقوب في سلسلة النبوة في بني إسرائيل.",
  },
  yaqub: {
    definition:
      "نبي الله يعقوب عليه السلام الملقّب بإسرائيل؛ ابن إسحاق وأبو يوسف والأسباط، وصبر على فراق يوسف حتى كُشف الضر.",
  },
  yusuf: {
    definition:
      "نبي الله يوسف عليه السلام؛ قصته في سورة كاملة: الحسد والرق والسجن ثم التمكين والعفو عند المقدرة وحسن تدبير الرزق.",
  },
  ayyub: {
    definition:
      "نبي الله أيوب عليه السلام؛ ابتُلي في جسده وماله وأهله فصبر صبرًا جميلًا، ثم كشف الله ضره وردّ عليه أهله ومثلهم معهم.",
  },
  harun: {
    definition:
      "نبي الله هارون عليه السلام؛ أخو موسى وشريكه في الرسالة إلى فرعون وبني إسرائيل، وكان أفصح لسانًا فطُلب شدّ أزره.",
  },
  dawud: {
    definition:
      "نبي الله داود عليه السلام؛ أوتي الملك والنبوة والزبور، وسخّر الله له الجبال يسبّحن معه، وقُتل جالوت على يديه بإذن الله.",
  },
};

let changed = 0;
for (const person of data.people) {
  const exp = EXPANSIONS[person.slug];
  if (!exp) continue;
  Object.assign(person, exp);
  changed += 1;
}

data.updatedAt = "2026-08-22";
data.notes =
  "دفعة ١١ (جولة ١٤): إثراء تعاريف مختصرة بعد اكتمال خمسة دروس لكل شخصية.";

writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`content-audit-round14-people: updated ${changed} entries`);
