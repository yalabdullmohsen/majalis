/**
 * Generate compact offline world-cities pack for prayer times.
 * Run: node scripts/generate-world-cities.mjs
 *
 * Row: [id, ar, en, countryCode, countryAr, adminAr, tz, lat, lon, method]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/data/prayer");
mkdirSync(outDir, { recursive: true });

/** @typedef {[string, string, string, string, string, string, number, number, string]} CitySeed */

/** @type {Record<string, { ar: string; method: string; tz?: string; cities: CitySeed[] }>} */
const COUNTRIES = {
  KW: {
    ar: "الكويت",
    method: "Kuwait",
    tz: "Asia/Kuwait",
    cities: [
      ["الكويت", "Kuwait City", "العاصمة", 29.3759, 47.9774],
      ["حولي", "Hawalli", "حولي", 29.3339, 48.0668],
      ["الفروانية", "Farwaniya", "الفروانية", 29.28, 47.96],
      ["الجهراء", "Jahra", "الجهراء", 29.3418, 47.6583],
      ["الأحمدي", "Ahmadi", "الأحمدي", 29.0769, 48.0838],
      ["مبارك الكبير", "Mubarak Al-Kabeer", "مبارك الكبير", 29.22, 48.08],
    ],
  },
  SA: {
    ar: "السعودية",
    method: "UmmAlQura",
    tz: "Asia/Riyadh",
    cities: [
      ["الرياض", "Riyadh", "الرياض", 24.7136, 46.6753],
      ["جدة", "Jeddah", "مكة", 21.4858, 39.1925],
      ["مكة المكرمة", "Makkah", "مكة", 21.3891, 39.8579],
      ["المدينة المنورة", "Madinah", "المدينة", 24.5247, 39.5692],
      ["الدمام", "Dammam", "الشرقية", 26.4207, 50.0888],
      ["الخبر", "Khobar", "الشرقية", 26.2172, 50.1971],
      ["الطائف", "Taif", "مكة", 21.2703, 40.4158],
      ["تبوك", "Tabuk", "تبوك", 28.3838, 36.555],
      ["أبها", "Abha", "عسير", 18.2164, 42.5053],
      ["بريدة", "Buraydah", "القصيم", 26.326, 43.975],
      ["حائل", "Hail", "حائل", 27.5114, 41.7208],
      ["نجران", "Najran", "نجران", 17.565, 44.2272],
      ["جازان", "Jazan", "جازان", 16.8892, 42.5511],
      ["ينبع", "Yanbu", "المدينة", 24.0895, 38.0618],
      ["الجبيل", "Jubail", "الشرقية", 27.0046, 49.646],
    ],
  },
  AE: {
    ar: "الإمارات",
    method: "Dubai",
    tz: "Asia/Dubai",
    cities: [
      ["دبي", "Dubai", "دبي", 25.2048, 55.2708],
      ["أبوظبي", "Abu Dhabi", "أبوظبي", 24.4539, 54.3773],
      ["الشارقة", "Sharjah", "الشارقة", 25.3463, 55.4209],
      ["العين", "Al Ain", "أبوظبي", 24.2075, 55.7447],
      ["عجمان", "Ajman", "عجمان", 25.4052, 55.5136],
      ["رأس الخيمة", "Ras Al Khaimah", "رأس الخيمة", 25.7895, 55.9432],
      ["الفجيرة", "Fujairah", "الفجيرة", 25.1288, 56.3265],
    ],
  },
  QA: {
    ar: "قطر",
    method: "Qatar",
    tz: "Asia/Qatar",
    cities: [
      ["الدوحة", "Doha", "الدوحة", 25.2854, 51.531],
      ["الريان", "Al Rayyan", "الريان", 25.2919, 51.4244],
      ["الوكرة", "Al Wakrah", "الوكرة", 25.1715, 51.6034],
    ],
  },
  BH: {
    ar: "البحرين",
    method: "UmmAlQura",
    tz: "Asia/Bahrain",
    cities: [["المنامة", "Manama", "العاصمة", 26.2285, 50.586]],
  },
  OM: {
    ar: "عُمان",
    method: "UmmAlQura",
    tz: "Asia/Muscat",
    cities: [
      ["مسقط", "Muscat", "مسقط", 23.588, 58.3829],
      ["صلالة", "Salalah", "ظفار", 17.0151, 54.0924],
      ["صحار", "Sohar", "شمال الباطنة", 24.3461, 56.7075],
    ],
  },
  YE: {
    ar: "اليمن",
    method: "UmmAlQura",
    tz: "Asia/Aden",
    cities: [
      ["صنعاء", "Sanaa", "صنعاء", 15.3694, 44.191],
      ["عدن", "Aden", "عدن", 12.7855, 45.0187],
      ["تعز", "Taiz", "تعز", 13.5779, 44.0178],
    ],
  },
  IQ: {
    ar: "العراق",
    method: "UmmAlQura",
    tz: "Asia/Baghdad",
    cities: [
      ["بغداد", "Baghdad", "بغداد", 33.3152, 44.3661],
      ["البصرة", "Basra", "البصرة", 30.5085, 47.7804],
      ["الموصل", "Mosul", "نينوى", 36.3489, 43.1571],
      ["أربيل", "Erbil", "أربيل", 36.1911, 44.0093],
      ["النجف", "Najaf", "النجف", 32.0259, 44.3463],
      ["كربلاء", "Karbala", "كربلاء", 32.616, 44.024],
    ],
  },
  SY: {
    ar: "سوريا",
    method: "Egyptian",
    tz: "Asia/Damascus",
    cities: [
      ["دمشق", "Damascus", "دمشق", 33.5138, 36.2765],
      ["حلب", "Aleppo", "حلب", 36.2021, 37.1343],
      ["حمص", "Homs", "حمص", 34.7324, 36.7137],
    ],
  },
  JO: {
    ar: "الأردن",
    method: "UmmAlQura",
    tz: "Asia/Amman",
    cities: [
      ["عمّان", "Amman", "عمّان", 31.9539, 35.9106],
      ["إربد", "Irbid", "إربد", 32.5568, 35.8469],
      ["الزرقاء", "Zarqa", "الزرقاء", 32.0728, 36.088],
      ["العقبة", "Aqaba", "العقبة", 29.5321, 35.0063],
    ],
  },
  LB: {
    ar: "لبنان",
    method: "Egyptian",
    tz: "Asia/Beirut",
    cities: [
      ["بيروت", "Beirut", "بيروت", 33.8938, 35.5018],
      ["طرابلس", "Tripoli", "الشمال", 34.4367, 35.8497],
      ["صيدا", "Sidon", "الجنوب", 33.5571, 35.3729],
    ],
  },
  PS: {
    ar: "فلسطين",
    method: "Egyptian",
    tz: "Asia/Gaza",
    cities: [
      ["القدس", "Jerusalem", "القدس", 31.7683, 35.2137],
      ["غزة", "Gaza", "غزة", 31.5017, 34.4668],
      ["نابلس", "Nablus", "نابلس", 32.2211, 35.2544],
      ["الخليل", "Hebron", "الخليل", 31.5326, 35.0998],
    ],
  },
  EG: {
    ar: "مصر",
    method: "Egyptian",
    tz: "Africa/Cairo",
    cities: [
      ["القاهرة", "Cairo", "القاهرة", 30.0444, 31.2357],
      ["الإسكندرية", "Alexandria", "الإسكندرية", 31.2001, 29.9187],
      ["الجيزة", "Giza", "الجيزة", 30.0131, 31.2089],
      ["المنصورة", "Mansoura", "الدقهلية", 31.0409, 31.3785],
      ["أسيوط", "Asyut", "أسيوط", 27.1809, 31.1837],
      ["الأقصر", "Luxor", "الأقصر", 25.6872, 32.6396],
      ["أسوان", "Aswan", "أسوان", 24.0889, 32.8998],
      ["بورسعيد", "Port Said", "بورسعيد", 31.2653, 32.3019],
      ["طنطا", "Tanta", "الغربية", 30.7865, 31.0004],
      ["الزقازيق", "Zagazig", "الشرقية", 30.5877, 31.502],
    ],
  },
  LY: {
    ar: "ليبيا",
    method: "Egyptian",
    tz: "Africa/Tripoli",
    cities: [
      ["طرابلس", "Tripoli", "طرابلس", 32.8872, 13.1913],
      ["بنغازي", "Benghazi", "بنغازي", 32.1167, 20.0667],
      ["مصراتة", "Misrata", "مصراتة", 32.3754, 15.0925],
    ],
  },
  TN: {
    ar: "تونس",
    method: "Egyptian",
    tz: "Africa/Tunis",
    cities: [
      ["تونس", "Tunis", "تونس", 36.8065, 10.1815],
      ["صفاقس", "Sfax", "صفاقس", 34.7398, 10.76],
      ["سوسة", "Sousse", "سوسة", 35.8254, 10.636],
    ],
  },
  DZ: {
    ar: "الجزائر",
    method: "Egyptian",
    tz: "Africa/Algiers",
    cities: [
      ["الجزائر", "Algiers", "الجزائر", 36.7538, 3.0588],
      ["وهران", "Oran", "وهران", 35.6971, -0.6308],
      ["قسنطينة", "Constantine", "قسنطينة", 36.365, 6.6147],
    ],
  },
  MA: {
    ar: "المغرب",
    method: "MuslimWorldLeague",
    tz: "Africa/Casablanca",
    cities: [
      ["الرباط", "Rabat", "الرباط", 34.0209, -6.8416],
      ["الدار البيضاء", "Casablanca", "الدار البيضاء", 33.5731, -7.5898],
      ["مراكش", "Marrakesh", "مراكش", 31.6295, -7.9811],
      ["فاس", "Fes", "فاس", 34.0181, -5.0078],
      ["طنجة", "Tangier", "طنجة", 35.7595, -5.834],
      ["أغادير", "Agadir", "سوس ماسة", 30.4278, -9.5981],
    ],
  },
  SD: {
    ar: "السودان",
    method: "Egyptian",
    tz: "Africa/Khartoum",
    cities: [
      ["الخرطوم", "Khartoum", "الخرطوم", 15.5007, 32.5599],
      ["أم درمان", "Omdurman", "الخرطوم", 15.6445, 32.4777],
      ["بورتسودان", "Port Sudan", "البحر الأحمر", 19.6158, 37.2164],
    ],
  },
  SO: {
    ar: "الصومال",
    method: "Egyptian",
    tz: "Africa/Mogadishu",
    cities: [["مقديشو", "Mogadishu", "بنادر", 2.0469, 45.3182]],
  },
  MR: {
    ar: "موريتانيا",
    method: "MuslimWorldLeague",
    tz: "Africa/Nouakchott",
    cities: [["نواكشوط", "Nouakchott", "نواكشوط", 18.0735, -15.9582]],
  },
  TR: {
    ar: "تركيا",
    method: "Turkey",
    tz: "Europe/Istanbul",
    cities: [
      ["إسطنبول", "Istanbul", "إسطنبول", 41.0082, 28.9784],
      ["أنقرة", "Ankara", "أنقرة", 39.9334, 32.8597],
      ["إزمير", "Izmir", "إزمير", 38.4237, 27.1428],
      ["بورصة", "Bursa", "بورصة", 40.1885, 29.061],
      ["أنطاليا", "Antalya", "أنطاليا", 36.8969, 30.7133],
      ["قونية", "Konya", "قونية", 37.8746, 32.4932],
      ["غازي عنتاب", "Gaziantep", "غازي عنتاب", 37.0662, 37.3833],
      ["أدنة", "Adana", "أدنة", 37.0, 35.3213],
    ],
  },
  IR: {
    ar: "إيران",
    method: "Tehran",
    tz: "Asia/Tehran",
    cities: [
      ["طهران", "Tehran", "طهران", 35.6892, 51.389],
      ["مشهد", "Mashhad", "خراسان", 36.2605, 59.6168],
      ["أصفهان", "Isfahan", "أصفهان", 32.6546, 51.668],
      ["شيراز", "Shiraz", "فارس", 29.5918, 52.5836],
    ],
  },
  PK: {
    ar: "باكستان",
    method: "Karachi",
    tz: "Asia/Karachi",
    cities: [
      ["كراتشي", "Karachi", "السند", 24.8607, 67.0011],
      ["لاهور", "Lahore", "البنجاب", 31.5204, 74.3587],
      ["إسلام آباد", "Islamabad", "إسلام آباد", 33.6844, 73.0479],
      ["راولبندي", "Rawalpindi", "البنجاب", 33.5651, 73.0169],
      ["فيصل آباد", "Faisalabad", "البنجاب", 31.4504, 73.135],
      ["بيشاور", "Peshawar", "خيبر بختونخوا", 34.0151, 71.5249],
      ["ملتان", "Multan", "البنجاب", 30.1575, 71.5249],
      ["كويتا", "Quetta", "بلوشستان", 30.1798, 66.975],
    ],
  },
  IN: {
    ar: "الهند",
    method: "Karachi",
    tz: "Asia/Kolkata",
    cities: [
      ["نيودلهي", "New Delhi", "دلهي", 28.6139, 77.209],
      ["مومباي", "Mumbai", "مهاراشترا", 19.076, 72.8777],
      ["بنغالور", "Bengaluru", "كارناتاكا", 12.9716, 77.5946],
      ["حيدر آباد", "Hyderabad", "تيلانغانا", 17.385, 78.4867],
      ["تشيناي", "Chennai", "تاميل نادو", 13.0827, 80.2707],
      ["كولكاتا", "Kolkata", "بنغال الغربية", 22.5726, 88.3639],
      ["لكناو", "Lucknow", "أوتار براديش", 26.8467, 80.9462],
      ["أحمد آباد", "Ahmedabad", "غوجارات", 23.0225, 72.5714],
    ],
  },
  BD: {
    ar: "بنغلاديش",
    method: "Karachi",
    tz: "Asia/Dhaka",
    cities: [
      ["دكا", "Dhaka", "دكا", 23.8103, 90.4125],
      ["شيتاغونغ", "Chittagong", "شيتاغونغ", 22.3569, 91.7832],
    ],
  },
  ID: {
    ar: "إندونيسيا",
    method: "Singapore",
    tz: "Asia/Jakarta",
    cities: [
      ["جاكرتا", "Jakarta", "جاكرتا", -6.2088, 106.8456],
      ["سورابايا", "Surabaya", "جاوا الشرقية", -7.2575, 112.7521],
      ["باندونغ", "Bandung", "جاوا الغربية", -6.9175, 107.6191],
      ["ميدان", "Medan", "سومطرة الشمالية", 3.5952, 98.6722],
      ["ماكاسار", "Makassar", "سولاويسي", -5.1477, 119.4327],
      ["يوجياكارتا", "Yogyakarta", "يوجياكارتا", -7.7956, 110.3695],
      ["بالي", "Denpasar", "بالي", -8.6705, 115.2126],
    ],
  },
  MY: {
    ar: "ماليزيا",
    method: "Singapore",
    tz: "Asia/Kuala_Lumpur",
    cities: [
      ["كوالالمبور", "Kuala Lumpur", "كوالالمبور", 3.139, 101.6869],
      ["جورج تاون", "George Town", "بينانغ", 5.4141, 100.3288],
      ["جوهور بهرو", "Johor Bahru", "جوهور", 1.4927, 103.7414],
      ["إيبوه", "Ipoh", "بيراق", 4.5975, 101.0901],
    ],
  },
  BN: {
    ar: "بروناي",
    method: "Singapore",
    tz: "Asia/Brunei",
    cities: [["بندر سري بكاوان", "Bandar Seri Begawan", "بروناي-موارا", 4.9031, 114.9398]],
  },
  SG: {
    ar: "سنغافورة",
    method: "Singapore",
    tz: "Asia/Singapore",
    cities: [["سنغافورة", "Singapore", "سنغافورة", 1.3521, 103.8198]],
  },
  TH: {
    ar: "تايلاند",
    method: "MuslimWorldLeague",
    tz: "Asia/Bangkok",
    cities: [
      ["بانكوك", "Bangkok", "بانكوك", 13.7563, 100.5018],
      ["فوكيت", "Phuket", "فوكيت", 7.8804, 98.3923],
    ],
  },
  PH: {
    ar: "الفلبين",
    method: "MuslimWorldLeague",
    tz: "Asia/Manila",
    cities: [
      ["مانيلا", "Manila", "مانيلا", 14.5995, 120.9842],
      ["داواو", "Davao", "داواو", 7.1907, 125.4553],
    ],
  },
  CN: {
    ar: "الصين",
    method: "MuslimWorldLeague",
    tz: "Asia/Shanghai",
    cities: [
      ["بكين", "Beijing", "بكين", 39.9042, 116.4074],
      ["شنغهاي", "Shanghai", "شنغهاي", 31.2304, 121.4737],
      ["أورومتشي", "Urumqi", "شينجيانغ", 43.8256, 87.6168],
      ["ييتشنغ", "Yinchuan", "نينغشيا", 38.4872, 106.2309],
    ],
  },
  JP: {
    ar: "اليابان",
    method: "MuslimWorldLeague",
    tz: "Asia/Tokyo",
    cities: [
      ["طوكيو", "Tokyo", "طوكيو", 35.6762, 139.6503],
      ["أوساكا", "Osaka", "أوساكا", 34.6937, 135.5023],
    ],
  },
  KR: {
    ar: "كوريا الجنوبية",
    method: "MuslimWorldLeague",
    tz: "Asia/Seoul",
    cities: [["سيول", "Seoul", "سيول", 37.5665, 126.978]],
  },
  AU: {
    ar: "أستراليا",
    method: "MuslimWorldLeague",
    cities: [
      ["سيدني", "Sydney", "نيو ساوث ويلز", -33.8688, 151.2093, "Australia/Sydney"],
      ["ملبورن", "Melbourne", "فيكتوريا", -37.8136, 144.9631, "Australia/Melbourne"],
      ["بريزبان", "Brisbane", "كوينزلاند", -27.4698, 153.0251, "Australia/Brisbane"],
      ["بيرث", "Perth", "أستراليا الغربية", -31.9505, 115.8605, "Australia/Perth"],
      ["أديلايد", "Adelaide", "جنوب أستراليا", -34.9285, 138.6007, "Australia/Adelaide"],
    ],
  },
  NZ: {
    ar: "نيوزيلندا",
    method: "MuslimWorldLeague",
    tz: "Pacific/Auckland",
    cities: [["أوكلاند", "Auckland", "أوكلاند", -36.8485, 174.7633]],
  },
  GB: {
    ar: "المملكة المتحدة",
    method: "MuslimWorldLeague",
    tz: "Europe/London",
    cities: [
      ["لندن", "London", "إنجلترا", 51.5074, -0.1278],
      ["برمنغهام", "Birmingham", "إنجلترا", 52.4862, -1.8904],
      ["مانشستر", "Manchester", "إنجلترا", 53.4808, -2.2426],
      ["ليدز", "Leeds", "إنجلترا", 53.8008, -1.5491],
      ["غلاسكو", "Glasgow", "إسكتلندا", 55.8642, -4.2518],
      ["إدنبرة", "Edinburgh", "إسكتلندا", 55.9533, -3.1883],
      ["كارديف", "Cardiff", "ويلز", 51.4816, -3.1791],
      ["بلفاست", "Belfast", "أيرلندا الشمالية", 54.5973, -5.9301],
      ["برادفورد", "Bradford", "إنجلترا", 53.796, -1.7594],
      ["ليستر", "Leicester", "إنجلترا", 52.6369, -1.1398],
    ],
  },
  IE: {
    ar: "أيرلندا",
    method: "MuslimWorldLeague",
    tz: "Europe/Dublin",
    cities: [["دبلن", "Dublin", "دبلن", 53.3498, -6.2603]],
  },
  FR: {
    ar: "فرنسا",
    method: "FranceUOIF",
    tz: "Europe/Paris",
    cities: [
      ["باريس", "Paris", "إيل دو فرانس", 48.8566, 2.3522],
      ["مارسيليا", "Marseille", "بروفانس", 43.2965, 5.3698],
      ["ليون", "Lyon", "رون ألب", 45.764, 4.8357],
      ["ليل", "Lille", "أو دو فرانس", 50.6292, 3.0573],
      ["تولوز", "Toulouse", "أوكسيتاني", 43.6047, 1.4442],
      ["ستراسبورغ", "Strasbourg", "الألزاس", 48.5734, 7.7521],
      ["نيس", "Nice", "بروفانس", 43.7102, 7.262],
      ["نانت", "Nantes", "لوار", 47.2184, -1.5536],
    ],
  },
  DE: {
    ar: "ألمانيا",
    method: "MuslimWorldLeague",
    tz: "Europe/Berlin",
    cities: [
      ["برلين", "Berlin", "برلين", 52.52, 13.405],
      ["ميونخ", "Munich", "بافاريا", 48.1351, 11.582],
      ["هامبورغ", "Hamburg", "هامبورغ", 53.5511, 9.9937],
      ["كولونيا", "Cologne", "شمال الراين", 50.9375, 6.9603],
      ["فرانكفورت", "Frankfurt", "هيسن", 50.1109, 8.6821],
      ["شتوتغارت", "Stuttgart", "بادن فورتمبيرغ", 48.7758, 9.1829],
    ],
  },
  NL: {
    ar: "هولندا",
    method: "MuslimWorldLeague",
    tz: "Europe/Amsterdam",
    cities: [
      ["أمستردام", "Amsterdam", "شمال هولندا", 52.3676, 4.9041],
      ["روتردام", "Rotterdam", "جنوب هولندا", 51.9244, 4.4777],
      ["لاهاي", "The Hague", "جنوب هولندا", 52.0705, 4.3007],
    ],
  },
  BE: {
    ar: "بلجيكا",
    method: "MuslimWorldLeague",
    tz: "Europe/Brussels",
    cities: [
      ["بروكسل", "Brussels", "بروكسل", 50.8503, 4.3517],
      ["أنتويرب", "Antwerp", "فلاندرز", 51.2194, 4.4025],
    ],
  },
  ES: {
    ar: "إسبانيا",
    method: "MuslimWorldLeague",
    tz: "Europe/Madrid",
    cities: [
      ["مدريد", "Madrid", "مدريد", 40.4168, -3.7038],
      ["برشلونة", "Barcelona", "كتالونيا", 41.3851, 2.1734],
      ["بلنسية", "Valencia", "بلنسية", 39.4699, -0.3763],
      ["إشبيلية", "Seville", "الأندلس", 37.3891, -5.9845],
      ["غرناطة", "Granada", "الأندلس", 37.1773, -3.5986],
      ["قرطبة", "Cordoba", "الأندلس", 37.8882, -4.7794],
    ],
  },
  IT: {
    ar: "إيطاليا",
    method: "MuslimWorldLeague",
    tz: "Europe/Rome",
    cities: [
      ["روما", "Rome", "لاتسيو", 41.9028, 12.4964],
      ["ميلانو", "Milan", "لومبارديا", 45.4642, 9.19],
      ["نابولي", "Naples", "كامبانيا", 40.8518, 14.2681],
      ["تورينو", "Turin", "بييمونتي", 45.0703, 7.6869],
    ],
  },
  SE: {
    ar: "السويد",
    method: "MuslimWorldLeague",
    tz: "Europe/Stockholm",
    cities: [
      ["ستوكهولم", "Stockholm", "ستوكهولم", 59.3293, 18.0686],
      ["غوتنبرغ", "Gothenburg", "فاسترا يوتالاند", 57.7089, 11.9746],
      ["مالمو", "Malmö", "سكونة", 55.605, 13.0038],
    ],
  },
  NO: {
    ar: "النرويج",
    method: "MuslimWorldLeague",
    tz: "Europe/Oslo",
    cities: [["أوسلو", "Oslo", "أوسلو", 59.9139, 10.7522]],
  },
  DK: {
    ar: "الدنمارك",
    method: "MuslimWorldLeague",
    tz: "Europe/Copenhagen",
    cities: [["كوبنهاغن", "Copenhagen", "هوفدستادن", 55.6761, 12.5683]],
  },
  FI: {
    ar: "فنلندا",
    method: "MuslimWorldLeague",
    tz: "Europe/Helsinki",
    cities: [["هلسنكي", "Helsinki", "أوسيما", 60.1699, 24.9384]],
  },
  RU: {
    ar: "روسيا",
    method: "MuslimWorldLeague",
    cities: [
      ["موسكو", "Moscow", "موسكو", 55.7558, 37.6173, "Europe/Moscow"],
      ["سانت بطرسبرغ", "Saint Petersburg", "سانت بطرسبرغ", 59.9311, 30.3609, "Europe/Moscow"],
      ["قازان", "Kazan", "تتارستان", 55.8304, 49.0661, "Europe/Moscow"],
      ["محج قلعة", "Makhachkala", "داغستان", 42.9849, 47.5047, "Europe/Moscow"],
      ["أوفا", "Ufa", "باشكورستان", 54.7388, 55.9721, "Asia/Yekaterinburg"],
    ],
  },
  UA: {
    ar: "أوكرانيا",
    method: "MuslimWorldLeague",
    tz: "Europe/Kyiv",
    cities: [
      ["كييف", "Kyiv", "كييف", 50.4501, 30.5234],
      ["أوديسا", "Odesa", "أوديسا", 46.4825, 30.7233],
    ],
  },
  PL: {
    ar: "بولندا",
    method: "MuslimWorldLeague",
    tz: "Europe/Warsaw",
    cities: [["وارسو", "Warsaw", "مازوفيا", 52.2297, 21.0122]],
  },
  AT: {
    ar: "النمسا",
    method: "MuslimWorldLeague",
    tz: "Europe/Vienna",
    cities: [["فيينا", "Vienna", "فيينا", 48.2082, 16.3738]],
  },
  CH: {
    ar: "سويسرا",
    method: "MuslimWorldLeague",
    tz: "Europe/Zurich",
    cities: [
      ["زيورخ", "Zurich", "زيورخ", 47.3769, 8.5417],
      ["جنيف", "Geneva", "جنيف", 46.2044, 6.1432],
    ],
  },
  GR: {
    ar: "اليونان",
    method: "MuslimWorldLeague",
    tz: "Europe/Athens",
    cities: [["أثينا", "Athens", "أتيكا", 37.9838, 23.7275]],
  },
  PT: {
    ar: "البرتغال",
    method: "MuslimWorldLeague",
    tz: "Europe/Lisbon",
    cities: [["لشبونة", "Lisbon", "لشبونة", 38.7223, -9.1393]],
  },
  US: {
    ar: "الولايات المتحدة",
    method: "NorthAmerica",
    cities: [
      ["نيويورك", "New York", "نيويورك", 40.7128, -74.006, "America/New_York"],
      ["لوس أنجلوس", "Los Angeles", "كاليفورنيا", 34.0522, -118.2437, "America/Los_Angeles"],
      ["شيكاغو", "Chicago", "إلينوي", 41.8781, -87.6298, "America/Chicago"],
      ["هيوستن", "Houston", "تكساس", 29.7604, -95.3698, "America/Chicago"],
      ["فيرفاكس", "Fairfax", "فيرجينيا", 38.8462, -77.3064, "America/New_York"],
      ["ديربورن", "Dearborn", "ميشيغان", 42.3223, -83.1763, "America/Detroit"],
      ["باترسون", "Paterson", "نيوجيرسي", 40.9168, -74.1717, "America/New_York"],
      ["سياتل", "Seattle", "واشنطن", 47.6062, -122.3321, "America/Los_Angeles"],
      ["ميامي", "Miami", "فلوريدا", 25.7617, -80.1918, "America/New_York"],
      ["دالاس", "Dallas", "تكساس", 32.7767, -96.797, "America/Chicago"],
      ["واشنطن", "Washington DC", "كولومبيا", 38.9072, -77.0369, "America/New_York"],
      ["بوسطن", "Boston", "ماساتشوستس", 42.3601, -71.0589, "America/New_York"],
      ["سان فرانسيسكو", "San Francisco", "كاليفورنيا", 37.7749, -122.4194, "America/Los_Angeles"],
      ["أتلانتا", "Atlanta", "جورجيا", 33.749, -84.388, "America/New_York"],
      ["فيلادلفيا", "Philadelphia", "بنسلفانيا", 39.9526, -75.1652, "America/New_York"],
    ],
  },
  CA: {
    ar: "كندا",
    method: "NorthAmerica",
    cities: [
      ["تورونتو", "Toronto", "أونتاريو", 43.6532, -79.3832, "America/Toronto"],
      ["مونتريال", "Montreal", "كيبيك", 45.5017, -73.5673, "America/Toronto"],
      ["فانكوفر", "Vancouver", "كولومبيا البريطانية", 49.2827, -123.1207, "America/Vancouver"],
      ["كالغاري", "Calgary", "ألبرتا", 51.0447, -114.0719, "America/Edmonton"],
      ["أوتاوا", "Ottawa", "أونتاريو", 45.4215, -75.6972, "America/Toronto"],
      ["إدمونتون", "Edmonton", "ألبرتا", 53.5461, -113.4938, "America/Edmonton"],
    ],
  },
  MX: {
    ar: "المكسيك",
    method: "NorthAmerica",
    tz: "America/Mexico_City",
    cities: [["مدينة المكسيك", "Mexico City", "المكسيك", 19.4326, -99.1332]],
  },
  BR: {
    ar: "البرازيل",
    method: "MuslimWorldLeague",
    cities: [
      ["ساو باولو", "Sao Paulo", "ساو باولو", -23.5505, -46.6333, "America/Sao_Paulo"],
      ["ريو دي جانيرو", "Rio de Janeiro", "ريو", -22.9068, -43.1729, "America/Sao_Paulo"],
      ["برازيليا", "Brasilia", "المقاطعة الاتحادية", -15.8267, -47.9218, "America/Sao_Paulo"],
    ],
  },
  AR: {
    ar: "الأرجنتين",
    method: "MuslimWorldLeague",
    tz: "America/Argentina/Buenos_Aires",
    cities: [["بوينس آيرس", "Buenos Aires", "بوينس آيرس", -34.6037, -58.3816]],
  },
  ZA: {
    ar: "جنوب أفريقيا",
    method: "MuslimWorldLeague",
    tz: "Africa/Johannesburg",
    cities: [
      ["جوهانسبرغ", "Johannesburg", "خاوتينغ", -26.2041, 28.0473],
      ["كيب تاون", "Cape Town", "الكاب الغربية", -33.9249, 18.4241],
      ["ديربان", "Durban", "كوازولو ناتال", -29.8587, 31.0218],
    ],
  },
  NG: {
    ar: "نيجيريا",
    method: "Egyptian",
    tz: "Africa/Lagos",
    cities: [
      ["لاغوس", "Lagos", "لاغوس", 6.5244, 3.3792],
      ["كانو", "Kano", "كانو", 12.0022, 8.592],
      ["أبوجا", "Abuja", "FCT", 9.0765, 7.3986],
    ],
  },
  KE: {
    ar: "كينيا",
    method: "Egyptian",
    tz: "Africa/Nairobi",
    cities: [
      ["نairobi", "Nairobi", "نairobi", -1.2921, 36.8219],
      ["مومباسا", "Mombasa", "مومباسا", -4.0435, 39.6682],
    ],
  },
  ET: {
    ar: "إثيوبيا",
    method: "Egyptian",
    tz: "Africa/Addis_Ababa",
    cities: [["أديس أبابا", "Addis Ababa", "أديس أبابا", 9.032, 38.7469]],
  },
  TZ: {
    ar: "تنزانيا",
    method: "Egyptian",
    tz: "Africa/Dar_es_Salaam",
    cities: [
      ["دار السلام", "Dar es Salaam", "دار السلام", -6.7924, 39.2083],
      ["زنجبار", "Zanzibar", "زنجبار", -6.1659, 39.2026],
    ],
  },
  SN: {
    ar: "السنغال",
    method: "MuslimWorldLeague",
    tz: "Africa/Dakar",
    cities: [["داكار", "Dakar", "داكار", 14.7167, -17.4677]],
  },
  GH: {
    ar: "غانا",
    method: "MuslimWorldLeague",
    tz: "Africa/Accra",
    cities: [["أكرا", "Accra", "أكرا", 5.6037, -0.187]],
  },
  AF: {
    ar: "أفغانستان",
    method: "Karachi",
    tz: "Asia/Kabul",
    cities: [
      ["كابل", "Kabul", "كابل", 34.5553, 69.2075],
      ["هرات", "Herat", "هرات", 34.3482, 62.1997],
    ],
  },
  UZ: {
    ar: "أوزبكستان",
    method: "MuslimWorldLeague",
    tz: "Asia/Tashkent",
    cities: [
      ["طشقند", "Tashkent", "طشقند", 41.2995, 69.2401],
      ["سمرقند", "Samarkand", "سمرقند", 39.627, 66.975],
    ],
  },
  KZ: {
    ar: "كازاخستان",
    method: "MuslimWorldLeague",
    tz: "Asia/Almaty",
    cities: [
      ["ألماتي", "Almaty", "ألماتي", 43.222, 76.8512],
      ["أستانا", "Astana", "أستانا", 51.1694, 71.4491],
    ],
  },
  AZ: {
    ar: "أذربيجان",
    method: "MuslimWorldLeague",
    tz: "Asia/Baku",
    cities: [["باكو", "Baku", "باكو", 40.4093, 49.8671]],
  },
  GE: {
    ar: "جورجيا",
    method: "MuslimWorldLeague",
    tz: "Asia/Tbilisi",
    cities: [["تبليسي", "Tbilisi", "تبليسي", 41.7151, 44.8271]],
  },
  AL: {
    ar: "ألبانيا",
    method: "MuslimWorldLeague",
    tz: "Europe/Tirane",
    cities: [["تيرانا", "Tirana", "تيرانا", 41.3275, 19.8187]],
  },
  BA: {
    ar: "البوسنة",
    method: "MuslimWorldLeague",
    tz: "Europe/Sarajevo",
    cities: [["سراييفو", "Sarajevo", "سراييفو", 43.8563, 18.4131]],
  },
  XK: {
    ar: "كوسوفو",
    method: "MuslimWorldLeague",
    tz: "Europe/Belgrade",
    cities: [["بريشتينا", "Pristina", "بريشتينا", 42.6629, 21.1655]],
  },
  LK: {
    ar: "سريلانكا",
    method: "Karachi",
    tz: "Asia/Colombo",
    cities: [["كولومبو", "Colombo", "الغرب", 6.9271, 79.8612]],
  },
  MV: {
    ar: "المالديف",
    method: "Karachi",
    tz: "Indian/Maldives",
    cities: [["ماليه", "Male", "ماليه", 4.1755, 73.5093]],
  },
};

function slug(cc, en) {
  return `${cc.toLowerCase()}-${en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

const cities = [];
const countries = [];

for (const [cc, meta] of Object.entries(COUNTRIES)) {
  countries.push({ code: cc, nameAr: meta.ar, method: meta.method });
  for (const row of meta.cities) {
    const [ar, en, admin, lat, lon, tzOverride] = row;
    cities.push([
      slug(cc, en),
      ar,
      en,
      cc,
      meta.ar,
      admin || "",
      tzOverride || meta.tz || "UTC",
      Number(lat.toFixed(4)),
      Number(lon.toFixed(4)),
      meta.method,
    ]);
  }
}

cities.sort((a, b) => a[3].localeCompare(b[3]) || a[1].localeCompare(b[1], "ar"));

const pack = {
  v: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  count: cities.length,
  countries: countries.sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar")),
  /** [id, ar, en, cc, countryAr, adminAr, tz, lat, lon, method] */
  cities,
};

const outPath = join(outDir, "world-cities.json");
writeFileSync(outPath, JSON.stringify(pack));
const bytes = Buffer.byteLength(JSON.stringify(pack));
console.log(`Wrote ${cities.length} cities / ${countries.length} countries → ${outPath} (${(bytes / 1024).toFixed(1)} KiB)`);
