/**
 * CD deployment notifications — Slack, Discord, generic webhook.
 */

export async function sendDeploymentNotification(event) {
  const payload = buildNotificationPayload(event);
  const results = [];

  const webhook = process.env.CD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (webhook) {
    results.push(await postWebhook(webhook, payload));
  }

  if (process.env.GITHUB_ACTIONS === "true") {
    const level = event.status === "success" ? "notice" : "error";
    console.log(`::${level} title=${event.title}::${payload.text}`);
  }

  return { ok: results.every((r) => r.ok !== false), results, payload };
}

function buildNotificationPayload(event) {
  const emoji = {
    success: "✅",
    failure: "❌",
    rollback: "⏪",
    healing: "🔧",
    warning: "⚠️",
  }[event.status] || "ℹ️";

  const lines = [
    `${emoji} **${event.title}**`,
    event.reason ? `Reason: ${event.reason}` : null,
    event.commit ? `Commit: \`${event.commit.slice(0, 7)}\`` : null,
    event.branch ? `Branch: ${event.branch}` : null,
    event.durationMs ? `Duration: ${Math.round(event.durationMs / 1000)}s` : null,
    event.fixApplied ? `Fix: ${event.fixApplied}` : null,
  ].filter(Boolean);

  return {
    text: lines.join("\n"),
    blocks: lines.map((l) => ({ type: "section", text: { type: "mrkdwn", text: l } })),
    embeds: [{
      title: event.title,
      description: event.reason || "",
      color: event.status === "success" ? 0x22c55e : event.status === "rollback" ? 0xf59e0b : 0xef4444,
      fields: [
        event.commit && { name: "Commit", value: event.commit.slice(0, 7), inline: true },
        event.branch && { name: "Branch", value: event.branch, inline: true },
        event.durationMs && { name: "Duration", value: `${Math.round(event.durationMs / 1000)}s`, inline: true },
      ].filter(Boolean),
    }],
  };
}

async function postWebhook(url, payload) {
  try {
    const body = url.includes("discord.com")
      ? { content: payload.text, embeds: payload.embeds }
      : { text: payload.text, blocks: payload.blocks };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
