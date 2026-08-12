/**
 * AI Agents — audit logging to governance_audit_log.
 */

import { logGovernanceEvent } from "../governance/audit.mjs";

export async function logAgentRun(admin, { agentId, action, outcome, metadata = {}, actorId = "ai_agent" }) {
  return logGovernanceEvent(admin, {
    action: action || `agent.${agentId}`,
    actor_id: actorId,
    actor_role: "system",
    resource_type: "ai_agent",
    resource_id: agentId,
    outcome: outcome || "success",
    source: "ai_agents",
    metadata: { agent: agentId, ...metadata },
  });
}

export async function logAgentError(admin, agentId, error, metadata = {}) {
  return logAgentRun(admin, {
    agentId,
    action: `agent.${agentId}.error`,
    outcome: "failed",
    metadata: { error: String(error?.message || error), ...metadata },
  });
}
