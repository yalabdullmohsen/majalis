/**
 * Base connector for Phase 5 plugin architecture.
 */
export class BaseSourceConnector {
  constructor(source) {
    this.source = source;
    this.platform = source.source_type || source.platform || "website";
  }

  get id() {
    return this.source.id;
  }

  /** Discover new items from source. Returns [{ title, link, description, imageUrl, mediaUrls[], externalId }] */
  async discover() {
    return { items: [], connectorHint: null, instagramLimited: false };
  }

  /** Platform label for logs */
  get label() {
    return this.platform;
  }
}
