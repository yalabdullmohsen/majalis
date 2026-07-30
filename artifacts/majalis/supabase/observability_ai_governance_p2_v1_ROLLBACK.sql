-- Rollback for observability_ai_governance_p2_v1.sql
-- Does NOT drop production data without explicit operator approval beyond this script.
-- Prefer disable/revoke first; DROP is gated for non-prod / explicit apply.

DROP TABLE IF EXISTS observability_metric_samples CASCADE;
DROP TABLE IF EXISTS ai_error_aggregates CASCADE;
DROP TABLE IF EXISTS ai_content_cache CASCADE;
DROP TABLE IF EXISTS ai_request_dedup CASCADE;
DROP TABLE IF EXISTS ai_spend_ledger CASCADE;
