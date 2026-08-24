/** @typedef {'instagram'|'telegram'|'youtube'|'web'|'x'} HarvestPlatform */

/**
 * @typedef {Object} SourceAccount
 * @property {string} id
 * @property {HarvestPlatform} platform
 * @property {string} handle
 * @property {string} url
 * @property {string} name_ar
 * @property {string} kind
 * @property {string[]} topics
 * @property {'عام'|'رجال'|'نساء'|'نشء'} audience
 * @property {string} region_ar
 * @property {string} [site]
 * @property {string} [contact]
 * @property {boolean} enabled
 * @property {boolean} trusted
 * @property {boolean} autoPublish
 * @property {'high'|'normal'} poll_priority
 * @property {string|null} last_seen_at
 * @property {string|null} [last_seen_post_id]
 * @property {string|null} [last_seen_post_url]
 * @property {string|null} [last_checked_at]
 * @property {string|null} [last_published_at]
 */

/**
 * @typedef {Object} HarvestItem
 * @property {string} sourceId
 * @property {string} externalId
 * @property {string} url
 * @property {string} title
 * @property {string} text
 * @property {string} [imageUrl]
 * @property {string|null} publishedAt
 */

/**
 * @typedef {Object} FeedCard
 * @property {string} id
 * @property {'درس'|'حلقة'|'دورة'|'تسجيل'|'محاضرة'|'مسابقة'|'تنبيه'} type
 * @property {string} title_ar
 * @property {string} summary_ar
 * @property {string|null} sheikh
 * @property {string|null} place
 * @property {'عام'|'رجال'|'نساء'|'نشء'} audience
 * @property {string|null} starts_at
 * @property {string|null} time_text
 * @property {string|null} register_url
 * @property {{id:string,name_ar:string,url:string,post_url:string,platform:string}[]} sources
 * @property {string|null} image_url
 * @property {string} published_at
 * @property {number} confidence
 */

export {};
