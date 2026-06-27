import { BaseSourceConnector } from "./base-connector.mjs";
import { discoverInstagramSource } from "../instagram-connector.mjs";

export class InstagramConnector extends BaseSourceConnector {
  async discover() {
    const result = await discoverInstagramSource(this.source);
    return {
      items: (result.items || []).map((item) => ({
        ...item,
        externalId: item.link || this.source.url,
      })),
      connectorHint: result.connectorRequired ? result.hint : null,
      instagramLimited: result.instagramLimited,
    };
  }

  get label() {
    return "Instagram";
  }
}
