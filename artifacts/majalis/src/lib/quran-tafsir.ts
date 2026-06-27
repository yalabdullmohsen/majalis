export type TafsirSource = {
  id: string;
  name: string;
  author: string;
  edition: string;
  description: string;
  apiEdition?: string;
  searchHref?: (surahName: string, ayah?: number) => string;
};

export const TAFSIR_SOURCES: TafsirSource[] = [
  {
    id: "muyassar",
    name: "التفسير الميسر",
    author: "مجمع الملك فهد",
    edition: "ar.muyassar",
    description: "تفسير ميسّر للمعاني العامة بأسلوب واضح، مناسب للقراءة السريعة.",
    apiEdition: "ar.muyassar",
  },
  {
    id: "ibn-kathir",
    name: "تفسير ابن كثير",
    author: "ابن كثير",
    edition: "ibn-kathir",
    description: "من أشهر كتب التفسير بالمأثور، يُعرض عبر البحث الداخلي في المنصة.",
    searchHref: (surah) => `/search/${encodeURIComponent(`تفسير ابن كثير ${surah}`)}`,
  },
  {
    id: "saadi",
    name: "تفسير السعدي",
    author: "الشيخ عبدالرحمن السعدي",
    edition: "saadi",
    description: "تفسير مختصر يركز على المقاصد والفوائد العملية.",
    searchHref: (surah) => `/search/${encodeURIComponent(`تفسير السعدي ${surah}`)}`,
  },
  {
    id: "tabari",
    name: "تفسير الطبري",
    author: "ابن جرير الطبري",
    edition: "tabari",
    description: "جامع البيان — مرجع تفسيري تاريخي عظيم.",
    searchHref: (surah) => `/search/${encodeURIComponent(`جامع البيان ${surah}`)}`,
  },
  {
    id: "baghawi",
    name: "تفسير البغوي",
    author: "البغوي",
    edition: "baghawi",
    description: "معالم التنزيل — تفسير بالمأثور مع تركيز على الأحكام.",
    searchHref: (surah) => `/search/${encodeURIComponent(`معالم التنزيل ${surah}`)}`,
  },
  {
    id: "qurtubi",
    name: "تفسير القرطبي",
    author: "القرطبي",
    edition: "qurtubi",
    description: "الجامع لأحكام القرآن — تفسير فقهي شامل.",
    searchHref: (surah) => `/search/${encodeURIComponent(`تفسير القرطبي ${surah}`)}`,
  },
  {
    id: "jalalayn",
    name: "تفسير الجلالين",
    author: "الجلالين",
    edition: "jalalayn",
    description: "تفسير الجلال الدين المحلي والسيوطي — مختصر وواضح.",
    searchHref: (surah) => `/search/${encodeURIComponent(`تفسير الجلالين ${surah}`)}`,
  },
];

export type TafsirAyah = {
  ayah: number;
  text: string;
};

export async function fetchTafsirAyahs(
  surahNumber: number,
  edition: string,
): Promise<TafsirAyah[]> {
  const response = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/${edition}`,
    { signal: AbortSignal.timeout(20_000) },
  );
  if (!response.ok) throw new Error("تعذر تحميل التفسير");
  const json = await response.json();
  return (json.data?.ayahs || []).map((a: { numberInSurah: number; text: string }) => ({
    ayah: a.numberInSurah,
    text: a.text,
  }));
}

const TAFSIR_PREF_KEY = "majalis-quran-tafsir-v1";

export function getSavedTafsirId(): string {
  try {
    return localStorage.getItem(TAFSIR_PREF_KEY) || "muyassar";
  } catch {
    return "muyassar";
  }
}

export function saveTafsirId(id: string) {
  try {
    localStorage.setItem(TAFSIR_PREF_KEY, id);
  } catch {
    /* ignore */
  }
}
