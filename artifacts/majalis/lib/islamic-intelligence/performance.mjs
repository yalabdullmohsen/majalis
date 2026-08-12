/**
 * AI Performance Optimizer — analyze slow queries, pages, cache, indexes.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getSearchAnalytics } from "../scholarly-intelligence/analytics.mjs";
import { getSystemHealth } from "../system-health.mjs";

export async function runPerformanceOptimizer(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = Date.now();

  const [searchAnalytics, systemHealth] = await Promise.all([
    getSearchAnalytics(admin, 7),
    getSystemHealth().catch(() => ({ ok: false })),
  ]);

  const suggestions = [];

  if (searchAnalytics.avg_response_ms > 1000) {
    suggestions.push({
      area: "search",
      issue: `متوسط زمن البحث ${searchAnalytics.avg_response_ms}ms`,
      recommendation: "تفعيل cache أطول أو تقليل limit النتائج",
      impact: "high",
      estimated_gain: "30-50% faster searches",
      auto_apply: false,
    });
  }

  if (searchAnalytics.avg_response_ms > 2000) {
    suggestions.push({
      area: "database",
      issue: "استعلامات بحث بطيئة",
      recommendation: "إضافة فهرس GIN على search_analytics_events.query و content_fts",
      impact: "high",
      estimated_gain: "60-80% faster full-text search",
      auto_apply: false,
    });
  }

  if (searchAnalytics.zero_result_queries?.length > 5) {
    suggestions.push({
      area: "content",
      issue: `${searchAnalytics.zero_result_queries.length} استعلام بدون نتائج`,
      recommendation: "إثراء المحتوى للموضوعات الأكثر بحثاً",
      impact: "medium",
      estimated_gain: "Better user satisfaction",
      auto_apply: false,
    });
  }

  const cronCount = systemHealth.cron?.routes?.length || 12;
  if (cronCount > 10) {
    suggestions.push({
      area: "cron",
      issue: `${cronCount} cron jobs متداخلة`,
      recommendation: "دمج crons في islamic-intelligence orchestrator",
      impact: "medium",
      estimated_gain: "Reduced serverless invocations",
      auto_apply: false,
    });
  }

  suggestions.push({
    area: "cache",
    issue: "In-memory search cache (60s TTL)",
    recommendation: "Consider Redis/Upstash for distributed cache at scale",
    impact: "medium",
    estimated_gain: "Sub-100ms repeat queries",
    auto_apply: false,
  });

  suggestions.push({
    area: "images",
    issue: "Large images not analyzed automatically",
    recommendation: "Add image size audit in knowledge auditor — flag >500KB",
    impact: "low",
    estimated_gain: "Faster page loads",
    auto_apply: false,
  });

  suggestions.push({
    area: "indexes",
    issue: "content_relations may lack composite index",
    recommendation: "CREATE INDEX idx_relations_from_type ON content_relations(from_ref_id, relation_type)",
    impact: "medium",
    estimated_gain: "Faster graph traversal",
    auto_apply: false,
  });

  const result = {
    id: runId,
    agent: "performance_optimizer",
    status: "completed",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    metrics: {
      avg_search_ms: searchAnalytics.avg_response_ms,
      total_searches: searchAnalytics.total_searches,
      click_through_rate: searchAnalytics.click_through_rate,
      system_health_ok: systemHealth.ok,
    },
    suggestions,
    high_impact: suggestions.filter((s) => s.impact === "high"),
    policy: "جميع التحسينات تُقترح مع بيان الأثر — لا تُطبّق تلقائياً",
  };

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "performance_optimizer",
        status: "completed",
        items_checked: suggestions.length,
        issues_found: suggestions.filter((s) => s.impact === "high").length,
        fixes_suggested: suggestions.length,
        report: result,
        started_at: result.started_at,
        finished_at: result.finished_at,
      });
    } catch {
      /* table may not exist */
    }
  }

  return result;
}
