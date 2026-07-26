import { arabicMatchAny } from "./arabic-search";

export const FAWAID_CATEGORIES = [
  "فوائد قرآنية",
  "فوائد حديثية",
  "فوائد عقدية",
  "فوائد فقهية",
  "فوائد تربوية",
  "فوائد دعوية",
  "آداب وأخلاق"
] as const;

export const SEED_FAWAID = [
  // ──────────────────── فوائد قرآنية ────────────────────
  {
    id: "seed-fawaid-1",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-2",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-3",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-4",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-5",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-6",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-8",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-9",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-10",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-11",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-12",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-13",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-14",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-15",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-17",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-18",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-19",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-20",
    documentation_status: "sourced",
    status: "approved",
  },

  // ──────────────────── فوائد حديثية ────────────────────
  {
    id: "seed-fawaid-21",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-24",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-25",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-26",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-27",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-28",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-29",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-30",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-31",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-34",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-35",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-37",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-38",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-39",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-40",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-41",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-42",
    documentation_status: "sourced",
    status: "approved",
  },

  // ──────────────────── فوائد عقدية ────────────────────
  {
    id: "seed-fawaid-43",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-44",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-45",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-46",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-47",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-48",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-49",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-50",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-51",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-52",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-53",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-54",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-55",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-56",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-57",
    documentation_status: "sourced",
    status: "approved",
  },

  // ──────────────────── فوائد فقهية ────────────────────
  {
    id: "seed-fawaid-58",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-59",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-60",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-61",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-62",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-63",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-64",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-65",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-66",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-67",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-68",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-69",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-70",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-71",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-72",
    documentation_status: "sourced",
    status: "approved",
  },

  // ──────────────────── فوائد تربوية ────────────────────
  {
    id: "seed-fawaid-73",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-74",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-75",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-76",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-77",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-78",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-79",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-80",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-81",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-82",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-83",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-84",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-85",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-86",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-87",
    documentation_status: "sourced",
    status: "approved",
  },

  // ──────────────────── فوائد دعوية ────────────────────
  {
    id: "seed-fawaid-88",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-89",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-90",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-91",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-92",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-93",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-94",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-95",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-96",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-97",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-98",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-99",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-100",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-101",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-102",
    documentation_status: "sourced",
    status: "approved",
  },

  // ──────────────────── آداب وأخلاق ────────────────────
  {
    id: "seed-fawaid-103",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-104",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-105",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-106",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-107",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-108",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-109",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-110",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-111",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-112",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-113",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-114",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-115",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-116",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-117",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-118",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-119",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-120",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد قرآنية (121-140) ────────────────────
  {
    id: "seed-fawaid-121",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-122",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-123",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-124",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-125",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-126",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-127",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-128",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-129",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-130",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-131",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-132",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-133",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-134",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-135",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-136",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-137",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-138",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-139",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-140",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد حديثية (141-165) ────────────────────
  {
    id: "seed-fawaid-141",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-142",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-143",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-145",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-146",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-147",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-148",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-149",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-150",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-151",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-152",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-153",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-155",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-156",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-157",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-158",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-159",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-160",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-161",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-163",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-164",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد عقدية (166-185) ────────────────────
  {
    id: "seed-fawaid-166",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-168",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-169",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-170",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-171",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-172",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-173",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-174",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-175",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-176",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-177",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-178",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-179",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-180",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-181",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-182",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-183",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-184",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-185",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد فقهية (186-210) ────────────────────
  {
    id: "seed-fawaid-186",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-187",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-188",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-189",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-191",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-192",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-193",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-194",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-195",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-196",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-197",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-198",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-199",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-201",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-202",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-203",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-204",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-205",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-206",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-207",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-208",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-209",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-210",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد تربوية (211-230) ────────────────────
  {
    id: "seed-fawaid-211",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-212",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-213",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-214",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-215",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-216",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-217",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-218",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-219",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-220",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-221",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-222",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-223",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-224",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-225",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-226",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-227",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-228",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-229",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-230",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد دعوية (231-245) ────────────────────
  {
    id: "seed-fawaid-231",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-232",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-233",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-234",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-235",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-236",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-237",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-238",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-239",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-240",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-241",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-242",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-243",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-244",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-245",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── آداب وأخلاق (246-270) ────────────────────
  {
    id: "seed-fawaid-246",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-248",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-249",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-252",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-253",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-254",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-256",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-257",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-258",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-260",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-261",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-262",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-263",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-264",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-265",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-266",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-267",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-268",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-269",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-270",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-271",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-272",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-273",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-274",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-275",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-276",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-277",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-278",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-279",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-280",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-281",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-282",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-283",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-284",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-285",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-286",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-287",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-288",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-290",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-291",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-292",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-293",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-294",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-295",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-296",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-297",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-298",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-299",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-300",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-301",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-302",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-303",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-304",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-305",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-306",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-307",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-308",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-309",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-310",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-311",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-312",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-313",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-314",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-315",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-316",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-317",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-318",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-319",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-320",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-321",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-322",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-323",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-324",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-325",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-326",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-327",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-328",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-329",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-330",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-331",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-332",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-333",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-334",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-335",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-337",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-338",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-339",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-340",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-341",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-342",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-343",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-344",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-345",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-346",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-347",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-348",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-349",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-350",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-351",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-352",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-353",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-354",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-355",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-356",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-357",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-358",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-359",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-360",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-361",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-362",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-363",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-364",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-365",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-366",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-367",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-368",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-369",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-370",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-371",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-372",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-373",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-374",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-375",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-376",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-377",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-378",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-379",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-380",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-381",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-382",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-383",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-384",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-385",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-386",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-387",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-388",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-389",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-390",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-391",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-392",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-393",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-394",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-395",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-396",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-397",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-398",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-399",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-400",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-401",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-402",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-403",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-404",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-405",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-406",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-407",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-408",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-409",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-410",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-411",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-412",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-413",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-414",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-415",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-416",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-417",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-418",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-419",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-420",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-421",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-422",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-423",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-424",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-425",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-426",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-427",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-428",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-429",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-430",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-431",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-432",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-433",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-434",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-435",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-436",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-437",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-438",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-439",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-440",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-441",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-442",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-443",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-444",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-445",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-446",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-447",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-448",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-449",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-450",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-451",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-452",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-453",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-454",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-455",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-456",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-457",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-458",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-459",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-460",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-461",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-462",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-463",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-464",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-465",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-466",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-467",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-468",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-469",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-470",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-471",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-472",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-473",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-474",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-475",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-476",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-477",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-478",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-479",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-480",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-481",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-482",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-483",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-484",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-485",
    documentation_status: "sourced",
    status: "approved",
  },
  /* ───────── فوائد علمية (486-490) ───────── */
  {
    id: "seed-fawaid-486",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-487",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-488",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-489",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-490",
    documentation_status: "sourced",
    status: "approved",
  },
  /* ───────── فوائد دعوية (491-495) ───────── */
  {
    id: "seed-fawaid-491",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-492",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-493",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-494",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-495",
    documentation_status: "sourced",
    status: "approved",
  },
  /* ───────── فوائد تاريخية (496-500) ───────── */
  {
    id: "seed-fawaid-496",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-497",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-498",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-499",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-500",
    documentation_status: "sourced",
    status: "approved",
  },
  /* ───────── فوائد لغوية (501-505) ───────── */
  {
    id: "seed-fawaid-501",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-502",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-503",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-504",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-505",
    documentation_status: "sourced",
    status: "approved",
  },
  /* ───────── فوائد سلوكية (506-510) ───────── */
  {
    id: "seed-fawaid-506",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-507",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-508",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-509",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-510",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد فقهية (511-513): آيات الأحكام ────────────────────
  {
    id: "seed-fawaid-511",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-512",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-513",
    documentation_status: "sourced",
    status: "approved",
  },
  // ──────────────────── فوائد عقدية + فقهية (514-517): أقسام التوحيد وآية الزكاة ────────────────────
  {
    id: "seed-fawaid-514",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-515",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-516",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-517",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-518",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-519",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-520",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-521",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-522",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-523",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-524",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-525",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-526",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-527",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-528",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-529",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-530",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-531",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-532",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-533",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-534",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-535",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-536",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-537",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-538",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-539",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-540",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-541",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-542",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-543",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-544",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-545",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-546",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-547",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-548",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-549",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-550",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-551",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-552",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-553",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-554",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-555",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-556",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-557",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-558",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-559",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-560",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-561",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-562",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-563",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-564",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-565",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-566",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-567",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-568",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-569",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-570",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-571",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-572",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-573",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-574",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-575",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-576",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-577",
    documentation_status: "sourced",
    status: "approved",
  },
  {
    id: "seed-fawaid-578",
    text: "حفر الخندق بمشورة سلمان يدل على أن الحكمة ضالة المؤمن؛ يستفيد الإمام من الرأي السديد ولو جاء من غير العرب.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-579",
    text: "زكاة الفطر طهرة للصائم وطعمة للمساكين؛ تُخرج قبل صلاة العيد من قوت البلد عند الجمهور.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-580",
    text: "لا إله إلا الله نفي وإثبات: نفي استحقاق العبادة عن غير الله، وإثباتها لله وحده.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-581",
    text: "قصة أصحاب الكهف تربي الشباب على أن الثبات على التوحيد أحب من مجالسة أهل الشرك.",
    category: "فوائد تربوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-582",
    text: "قول ملكة سبأ كما في سورة النمل ﴿وَأَسْلَمْتُ مَعَ سُلَيْمَانَ لِلَّهِ﴾ — واسم «بلقيس» لم يثبت في الوحي — يعلّم أن الرجوع إلى الحق بعد ظهور البرهان سيادة لا هزيمة.",
    category: "فوائد قرآنية",
    source: "سورة النمل؛ منهج الاقتصار على ما ثبت في الوحي",
  },
  {
    id: "seed-fawaid-583",
    text: "بر الوالدين يُقرن بالتوحيد؛ والتأفف أول درجات العقوق فكيف بما فوقه.",
    category: "آداب وأخلاق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-584",
    text: "«من غش فليس منا» أصل في تحريم الغش في المعاملات والديانة.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-585",
    text: "الطمأنينة في الصلاة ركن عند الجمهور؛ والعجلة المخلّة تبطلها كما في حديث المسيء صلاته.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-586",
    text: "خطبة جعفر عند النجاشي نموذج للدعوة بالبيان الحسن قبل الصدام.",
    category: "فوائد دعوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-587",
    text: "نسيبة أم عمارة تُظهر أن صدق النصرة يظهر عند الخوف لا في الرخاء فقط.",
    category: "فوائد تربوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-588",
    text: "الاحتجاج بالقدر على المعصية باطل؛ القدر يُسلّم له بعد المصيبة ولا يُبرَّر به الذنب.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-589",
    text: "من أصبح جنبًا وهو صائم صح صومه؛ والسنة والاغتسال للصلاة لا للصوم وحده.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-590",
    text: "ليلة القدر خير من ألف شهر؛ والعمل في العشر مبني على الطلب لا على الجزم بتاريخ يقطع الاحتياط.",
    category: "فوائد قرآنية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-591",
    text: "طلب العلم للرياء من المهلكات؛ الإخلاص شرط قبول العمل.",
    category: "آداب وأخلاق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-592",
    text: "المتواتر يفيد العلم؛ والآحاد الصحيح يوجب العمل عند أهل السنة في الأحكام.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-593",
    text: "بيع العينة حيلة على الربا؛ العبرة بالمقاصد لا بصور العقود فحسب.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-594",
    text: "كثرة الذنوب تورث الران؛ وعلاجها التوبة وكثرة الذكر والاستغفار.",
    category: "فوائد تربوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-595",
    text: "أبو بكر في الردة علّم الأمة أن حفظ الأركان أولى من مداراة القبائل.",
    category: "فوائد دعوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-596",
    text: "أصحاب الكهف علّمونا أن العبرة بالهداية لا بعدد الفتية واسم كلبهم.",
    category: "فوائد قرآنية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-597",
    text: "قاعدة العادة محكمة تضبط الأعراف في المعاملات ما لم تصادم نصًا.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-598",
    text: "تبوك علّمت الأمة أن الصدق يظهر عند العسرة لا في الرخاء.",
    category: "فوائد دعوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-599",
    text: "بيعتا العقبة بنيتا على السمع والطاعة في المنشط والمكره.",
    category: "فوائد تاريخية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-600",
    text: "أصحاب الفيل برهان أن حماية البيت بيد الله لا بحلف البشر وحدهم.",
    category: "فوائد قرآنية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-601",
    text: "عين جالوت تُظهر أن ثبات الأمة بعد المحنة يعيد ميزان القوة.",
    category: "فوائد تاريخية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-602",
    text: "عقبة بن نافع جمع بين الفتح وبناء قاعدة علم في القيروان.",
    category: "فوائد دعوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-603",
    text: "مختصر الخرقي أصل متون الحنابلة؛ والمغني شرح عليه لا بديل عن تحريره.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-604",
    text: "ابن الهمام في فتح القدير يحرّر الدليل مع المذهب فلا يُغفل عند الخلاف الحنفي.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-605",
    text: "مختصر خليل عمدة المالكية المتأخرين؛ يحتاج طالبُه إلى شروح محقّقة.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-606",
    text: "الجرح والتعديل صيانة للدين؛ بلا نقد الرواة تختلط السنة بالوضع.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-607",
    text: "نصب الراية يعلّم الفقيه التخريج قبل الاحتجاج بحديث المتن.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-608",
    text: "النجش خيانة للسوق؛ النهي عنه يحفظ الثقة في المعاملات.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-609",
    text: "زيادة الإيمان ونقصه ميزان عملي: الطاعة ترفعه والمعصية تخفضه.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-610",
    text: "الإقلاب مثال على دقة التجويد في حفظ أداء الوحي.",
    category: "فوائد قرآنية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-611",
    text: "حق الطريق عبادة اجتماعية: كف الأذى جزء من الإيمان.",
    category: "آداب وأخلاق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-612",
    text: "حفظ النسل مقصد كلي؛ الزنا يهدمه والقذف يجرحه.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-613",
    text: "الذكر طمأنينة؛ والغفلة قسوة ولو كثرت العلوم الظاهرة.",
    category: "الرقائق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-614",
    text: "خيبر علّمت أن النصر مع محبة الله ورسوله لا مع الدعوى المجردة.",
    category: "فوائد تاريخية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-615",
    text: "زكاة مال الصبي تربية على حق المال قبل البلوغ.",
    category: "فوائد تربوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-616",
    text: "الكبر حجاب العلم؛ والتواضع مفتاحه.",
    category: "آداب وأخلاق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-617",
    text: "القسطلاني قرّب البخاري للمتأخرين؛ والرجوع للصحيح أصلٌ فوق الشرح.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-618",
    text: "أم سلمة علّمت أن الرأي السديد قد يأتي من غير مجلس الشورى الرسمي إذا وافق الحكمة.",
    category: "فوائد تاريخية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-619",
    text: "سمية أثبتت أن سبق الشهادة ليس للرجال وحدهم.",
    category: "فوائد دعوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-620",
    text: "بيت أبي أيوب نموذج الإيثار: المنزل يُقدَّم للنبوة قبل الراحة.",
    category: "آداب وأخلاق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-621",
    text: "زيد بن حارثة يعلّم أن الولاء للإيمان أعلى من نسب الجاهلية.",
    category: "فوائد تربوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-622",
    text: "عمار صبر على العذاب ثم ثبت في المشاهد؛ الابتلاء مدرسة إيمان.",
    category: "فوائد دعوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-623",
    text: "سعد بن معاذ جمع السيادة مع الانقياد لحكم الله لا لهواه.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-624",
    text: "الدردير قرّب خليل للفتوى؛ والمتن بلا تحقيق خطر.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-625",
    text: "حاشية الدسوقي تُظهر أن الفقه المتأخر طبقات شروح لا استغناء عن الأصول.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-626",
    text: "مواهب الجليل مثال سعة النقل المالكي مع الحاجة لتمييز الراجح.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-627",
    text: "الباقلاني دافع عن النبوة بالعقل والنقل؛ الرد على الشبه عبادة علم.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-628",
    text: "أم البراهين متن موجز؛ الإيجاز لا يغني عن دليل الكتاب والسنة.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-629",
    text: "التأمين بعد الفاتحة سنّة عملية تجمع المصلين على التأمين الجماعي.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-630",
    text: "تلقي الركبان نهيٌ عن استغلال جهل الجالب؛ السوق عدل.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-631",
    text: "الشرك الأصغر باب خفي؛ محاسبة النية حصن التوحيد.",
    category: "فوائد عقدية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-632",
    text: "المعلّق في البخاري يُفهم في ضوء شرطه ووصل الحفاظ لا الإسقاط.",
    category: "فوائد حديثية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-633",
    text: "الإظهار الحلقي يحفظ مخارج الحروف كما أُنزلت.",
    category: "فوائد قرآنية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-634",
    text: "إماطة الأذى عبادة يومية رخيصة الأجر عظيمة.",
    category: "آداب وأخلاق",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-635",
    text: "حفظ المال مقصد؛ الإسراف والتبذير يناقضانه كما السرقة.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-636",
    text: "برّ الأم مقدَّم في الخدمة غالبًا؛ والنصوص صرّحت بالتكرار في حقها.",
    category: "فوائد تربوية",
    source: "مقررات أهل العلم المعتمدة",
  },
  {
    id: "seed-fawaid-637",
    text: "شرح الخرشي يُظهر أن مختصر خليل لا يُفتَى منه بلا واسطة شرح.",
    category: "فوائد فقهية",
    source: "مقررات أهل العلم المعتمدة",
  },
];

export function searchFawaid(query: string) {
  const q = query.trim();
  if (!q) return SEED_FAWAID;
  return SEED_FAWAID.filter(
    (f) =>
      arabicMatchAny([f.text, f.category, f.source ?? "", f.author_name ?? ""], q),
  );
}

/** @deprecated use searchFawaid */
export const filterSeedFawaid = searchFawaid;

export function getFawaidByCategory(category: string) {
  return SEED_FAWAID.filter((f) => f.category === category);
}
