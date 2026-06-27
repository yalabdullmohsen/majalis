import { BaseSourceConnector } from "./base-connector.mjs";
import { discoverInstagramSource } from "../instagram-connector.mjs";

export class InstagramConnector extends BaseSourceConnector {
  async discover() {
    const result = await discoverInstagramSource(this.source);
    return {
      items: (result.items || []).map((item) => ({
        ...item,
        externalId: item.externalId || item.link || this.source.url,
      })),
      connectorHint: result.manualAssistMode ? result.hint : result.connectorRequired ? result.hint : null,
      manualAssistMode: result.manualAssistMode,
      instagramLimited: result.instagramLimited,
      graphApi: result.graphApi,
    };
  }

  get label() {
    return "Instagram";
  }
}
