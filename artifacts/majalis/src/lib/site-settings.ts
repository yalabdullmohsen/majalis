import type { CondolenceForm } from "@/components/condolences/CondolenceCard";
import { defaultCondolenceForm } from "@/components/condolences/CondolenceCard";

const STORAGE_KEY = "majalis-site-settings";

export type SiteSettings = {
  condolencesEnabled: boolean;
  condolencesDefaults: Partial<CondolenceForm>;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

const DEFAULTS: SiteSettings = {
  condolencesEnabled: true,
  condolencesDefaults: {},
  maintenanceMode: false,
  maintenanceMessage: "المنصة تحت الصيانة. سنعود قريبًا.",
};

function load(): SiteSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return {
      ...DEFAULTS,
      ...parsed,
      condolencesDefaults: parsed.condolencesDefaults ?? {},
    };
  } catch {
    return DEFAULTS;
  }
}

function save(settings: SiteSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getSiteSettings(): SiteSettings {
  return load();
}

export function updateSiteSettings(partial: Partial<SiteSettings>) {
  const next = { ...load(), ...partial };
  save(next);
  return next;
}

export function getCondolenceDefaults(): CondolenceForm {
  const { condolencesDefaults } = load();
  return { ...defaultCondolenceForm, ...condolencesDefaults };
}

export function isCondolencesEnabled(): boolean {
  return load().condolencesEnabled;
}

export function isMaintenanceMode(): boolean {
  return load().maintenanceMode;
}
