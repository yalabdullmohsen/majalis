import { telegramAdapter } from "./telegram.mjs";
import { webAdapter } from "./web.mjs";
import { youtubeAdapter } from "./youtube.mjs";
import { instagramAdapter } from "./instagram.mjs";

/** @type {Record<string, {id:string, fetch: Function}>} */
export const ADAPTERS = {
  telegram: telegramAdapter,
  web: webAdapter,
  youtube: youtubeAdapter,
  instagram: instagramAdapter,
};

export function adapterFor(platform) {
  return ADAPTERS[platform] ?? null;
}
