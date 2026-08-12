import { BaseSourceConnector } from "./base-connector.mjs";
import { importFromUrl } from "../url-importer.mjs";

export class WebConnector extends BaseSourceConnector {
  async discover() {
    const imported = await importFromUrl(this.source.url);
    return {
      items: [
        {
          title: imported.title,
          link: imported.finalUrl || this.source.url,
          description: imported.description,
          imageUrl: imported.imageUrl,
          externalId: imported.finalUrl || this.source.url,
        },
      ],
      connectorHint: null,
    };
  }

  get label() {
    return "Website";
  }
}
