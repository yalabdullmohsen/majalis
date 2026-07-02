/**
 * Adhan audio engine — muezzin catalogue + HTMLAudioElement playback.
 * All audio served via jsDelivr CDN from mohsalvi/adhan-audio (open source).
 */

const CDN = "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main";

export type MuezzinStyle = "تقليدي" | "خاشع" | "رسمي" | "كلاسيكي";

export type Muezzin = {
  id: string;
  name: string;
  origin: string;        // المدينة
  country: string;       // الدولة
  style: MuezzinStyle;
  category: string;      // "حرم مكي" | "مصري كلاسيكي" | ...
  tags: string[];        // ["خاشع","عميق","تقليدي"]
  biography: string;     // نبذة مختصرة
  rating: number;        // 4.0–5.0
  totalRatings: number;
  followers: number;
  durationSec: number;
  audioUrl: string;
  fajrUrl?: string;      // أذان الفجر (الصلاة خير من النوم)
};

export const MUEZZINS: Muezzin[] = [
  {
    id: "alafasy",
    name: "مشاري راشد العفاسي",
    origin: "الكويت",
    country: "الكويت",
    style: "خاشع",
    category: "كويتي معاصر",
    tags: ["خاشع", "رقيق", "روحاني"],
    biography: "قارئ كويتي بارز، يتميز صوته بالخشوع والحنين، واسع الانتشار في أرجاء العالم الإسلامي.",
    rating: 4.9,
    totalRatings: 218000,
    followers: 450000,
    durationSec: 195,
    audioUrl: `${CDN}/general/mishary-alafasy-01.mp3`,
    fajrUrl:  `${CDN}/fajr/mishary-alafasy-fajr-01.mp3`,
  },
  {
    id: "makkah",
    name: "الحرم المكي",
    origin: "مكة المكرمة",
    country: "السعودية",
    style: "رسمي",
    category: "حرم مكي",
    tags: ["رسمي", "مهيب", "تقليدي"],
    biography: "أذان الحرم المكي الشريف من أم القرى، يُبثّ مباشرةً من أقدس بقعة على الأرض.",
    rating: 4.95,
    totalRatings: 380000,
    followers: 720000,
    durationSec: 130,
    audioUrl: `${CDN}/general/makkah-haram-01.mp3`,
    fajrUrl:  `${CDN}/fajr/makkah-fajr-01.mp3`,
  },
  {
    id: "madinah",
    name: "الحرم النبوي",
    origin: "المدينة المنورة",
    country: "السعودية",
    style: "رسمي",
    category: "حرم نبوي",
    tags: ["رسمي", "هادئ", "روحاني"],
    biography: "أذان المسجد النبوي الشريف من مدينة الرسول ﷺ، يحمل عبق السكينة والنور.",
    rating: 4.92,
    totalRatings: 295000,
    followers: 580000,
    durationSec: 110,
    audioUrl: `${CDN}/general/madinah-01.mp3`,
  },
  {
    id: "alharam",
    name: "أذان الحرمين الكلاسيكي",
    origin: "مكة المكرمة",
    country: "السعودية",
    style: "كلاسيكي",
    category: "حرم مكي",
    tags: ["كلاسيكي", "أصيل", "عميق"],
    biography: "تسجيل كلاسيكي من الحرم المكي يعكس الطابع الأصيل للأذان السعودي التقليدي.",
    rating: 4.85,
    totalRatings: 142000,
    followers: 310000,
    durationSec: 160,
    audioUrl: `${CDN}/general/al-haram-01.mp3`,
  },
  {
    id: "egypt",
    name: "الأذان المصري التقليدي",
    origin: "القاهرة",
    country: "مصر",
    style: "كلاسيكي",
    category: "مصري كلاسيكي",
    tags: ["كلاسيكي", "حنين", "أزهري"],
    biography: "أذان بالطابع المصري الأصيل، يستحضر ذاكرة القاهرة العريقة ومآذن الأزهر الشريف.",
    rating: 4.8,
    totalRatings: 165000,
    followers: 270000,
    durationSec: 145,
    audioUrl: `${CDN}/general/egypt-traditional-01.mp3`,
  },
  {
    id: "abdulbasit",
    name: "عبد الباسط عبد الصمد",
    origin: "القاهرة",
    country: "مصر",
    style: "خاشع",
    category: "مصري معاصر",
    tags: ["خاشع", "عميق الصوت", "مؤثر"],
    biography: "من أبرز قراء القرآن في التاريخ، يمتاز أذانه بعمق الصوت والخشوع الذي يلمس القلوب.",
    rating: 4.88,
    totalRatings: 198000,
    followers: 390000,
    durationSec: 170,
    audioUrl: `${CDN}/general/abdul-basit-abdul-samad-01.mp3`,
  },
  {
    id: "qatami",
    name: "ناصر القطامي",
    origin: "الكويت",
    country: "الكويت",
    style: "خاشع",
    category: "كويتي خاشع",
    tags: ["خاشع", "هادئ", "رقيق"],
    biography: "صوت كويتي رقيق يتميز بالهدوء والخشوع، يُريح الروح ويستدعي التأمل.",
    rating: 4.82,
    totalRatings: 134000,
    followers: 245000,
    durationSec: 150,
    audioUrl: `${CDN}/general/nasser-al-qatami-01.mp3`,
  },
  {
    id: "nafees",
    name: "أحمد النفيس",
    origin: "الرياض",
    country: "السعودية",
    style: "تقليدي",
    category: "سعودي تقليدي",
    tags: ["تقليدي", "أصيل", "قوي"],
    biography: "مؤذن سعودي بأسلوب تقليدي أصيل، تتجلى في صوته قوة الأذان الحجازي العريق.",
    rating: 4.75,
    totalRatings: 89000,
    followers: 165000,
    durationSec: 140,
    audioUrl: `${CDN}/general/ahmad-al-nafees-01.mp3`,
  },
  {
    id: "mansour",
    name: "منصور الزهراني",
    origin: "جدة",
    country: "السعودية",
    style: "رسمي",
    category: "سعودي رسمي",
    tags: ["رسمي", "واضح", "قوي"],
    biography: "أذان سعودي بصوت واضح وقوي، يعكس الطابع الرسمي للمؤذنين في المساجد الكبرى بالمملكة.",
    rating: 4.78,
    totalRatings: 102000,
    followers: 188000,
    durationSec: 135,
    audioUrl: `${CDN}/general/mansour-al-zahrani-01.mp3`,
    fajrUrl:  `${CDN}/fajr/mansour-al-zahrani-fajr-01.mp3`,
  },
];

export const DEFAULT_MUEZZIN_ID = "alafasy";

export function getMuezzin(id: string): Muezzin {
  return MUEZZINS.find((m) => m.id === id) ?? MUEZZINS[0];
}

// ─── Audio Engine ─────────────────────────────────────────────────────────────

let _current: HTMLAudioElement | null = null;

export function playAdhan(muezzin: Muezzin, isFajr = false): HTMLAudioElement {
  stopAdhan();
  const url = isFajr && muezzin.fajrUrl ? muezzin.fajrUrl : muezzin.audioUrl;
  const audio = new Audio(url);
  audio.volume = 1.0;
  audio.play().catch(() => {});
  _current = audio;
  return audio;
}

export function stopAdhan() {
  if (_current) {
    _current.pause();
    _current.currentTime = 0;
    _current = null;
  }
}

export function isAdhanPlaying() {
  return !!_current && !_current.paused;
}

export function previewAdhan(muezzin: Muezzin): HTMLAudioElement {
  stopAdhan();
  const audio = new Audio(muezzin.audioUrl);
  audio.volume = 0.8;
  audio.addEventListener("loadedmetadata", () => {
    setTimeout(() => stopAdhan(), 15_000);
  });
  audio.play().catch(() => {});
  _current = audio;
  return audio;
}
