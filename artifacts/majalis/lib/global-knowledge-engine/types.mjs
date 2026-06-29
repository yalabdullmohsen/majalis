/**
 * GKE shared types (JSDoc) — Single Source of Truth contracts.
 * @typedef {Object} GkeSourceRecord
 * @property {string} id
 * @property {string} name
 * @property {string} [country]
 * @property {string} [language]
 * @property {string} source_type
 * @property {number} trust_score
 * @property {string} publish_policy
 * @property {number} refresh_interval_hours
 * @property {string} [cron_expression]
 * @property {string} status
 * @property {string} [last_sync_at]
 * @property {number} [item_count]
 * @property {number} [success_rate]
 * @property {string} registry_origin
 *
 * @typedef {Object} GkePipelineItem
 * @property {string} [id]
 * @property {string} external_key
 * @property {string} source_id
 * @property {string} content_kind
 * @property {string} [title]
 * @property {string} [body]
 * @property {Record<string, unknown>} [metadata]
 * @property {number} [quality_score]
 * @property {string} [status]
 *
 * @typedef {Object} GkeLayerResult
 * @property {boolean} ok
 * @property {string} layer
 * @property {number} phase
 * @property {string} [message]
 * @property {unknown} [data]
 * @property {number} [duration_ms]
 *
 * @typedef {Object} GkeHealthReport
 * @property {string} version
 * @property {number} phase
 * @property {string} status
 * @property {number} score
 * @property {Array<{id:string,label:string,phase:number,status:string,delegate?:string[]}>} layers
 * @property {Record<string, unknown>} subsystems
 */

export {};
