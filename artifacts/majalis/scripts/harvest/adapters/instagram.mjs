import { fetchViaOembed } from "./instagram-oembed.mjs";
import { fetchViaProvider, getInstagramIngestMode, getInstagramProviderStatus } from "./instagram-provider.mjs";

/** @type {import('../types.mjs')} */
export const instagramAdapter = {
  id: "instagram",
  async fetch(account, since) {
    const mode = getInstagramIngestMode();
    if (mode === "off") return [];
    if (mode === "provider") return fetchViaProvider(account, since);
    return fetchViaOembed(account);
  },
};

export { getInstagramIngestMode, getInstagramProviderStatus };
