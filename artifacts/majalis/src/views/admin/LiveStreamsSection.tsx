import { useCallback, useEffect, useState } from "react";
import {
  LIVE_STREAM_CHANNELS,
  getResolvedLiveStreamChannels,
  saveLiveStreamAdminOverride,
  type LiveStreamChannel,
} from "@/lib/quran-live-streams";
import {
  checkChannelHealth,
  checkAllLiveStreamHealth,
  healthStatusLabel,
  type ChannelHealthSummary,
} from "@/lib/live-stream-health";
import { C } from "@/lib/theme";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

const BTN: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "0.25rem",
  border: `1px solid ${C.line}`,
  background: C.panel,
  cursor: "pointer",
  fontSize: "0.75rem",
  fontFamily: "inherit",
};

const STATUS_COLOR: Record<string, string> = {
  working: C.emerald,
  broken: "#dc2626",
  needs_update: "#d97706",
};

export function LiveStreamsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [channels, setChannels] = useState<LiveStreamChannel[]>(() => getResolvedLiveStreamChannels());
  const [healthMap, setHealthMap] = useState<Record<string, ChannelHealthSummary>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);

  const reloadChannels = useCallback(() => {
    setChannels(getResolvedLiveStreamChannels());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void checkAllLiveStreamHealth().then((map) => {
      if (!cancelled) setHealthMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [channels]);

  const runHealthCheckAll = async () => {
    setCheckingAll(true);
    try {
      const map = await checkAllLiveStreamHealth(true);
      setHealthMap(map);
      showSuccess("تم فحص جميع قنوات البث.");
    } catch {
      showError("تعذّر إكمال فحص القنوات.");
    } finally {
      setCheckingAll(false);
    }
  };

  const testChannel = async (channel: LiveStreamChannel) => {
    setTestingId(channel.id);
    try {
      const summary = await checkChannelHealth(channel);
      setHealthMap((prev) => ({ ...prev, [channel.id]: summary }));
      showSuccess(
        summary.status === "working"
          ? `${channel.name}: تعمل (${summary.workingUrl})`
          : `${channel.name}: ${healthStatusLabel(summary.status)}`,
      );
    } catch {
      showError(`تعذّر اختبار ${channel.name}.`);
    } finally {
      setTestingId(null);
    }
  };

  const saveUrls = (channelId: string, streamUrl: string, fallbackRaw: string) => {
    const fallbackUrls = fallbackRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!streamUrl.trim()) {
      showError("رابط البث الأساسي مطلوب.");
      return;
    }
    saveLiveStreamAdminOverride(channelId, {
      streamUrl: streamUrl.trim(),
      fallbackUrls,
    });
    reloadChannels();
    showSuccess("تم حفظ روابط القناة.");
  };

  return (
    <div>
      <AdminSectionToolbar
        title="قنوات البث المباشر"
        actions={
          <button type="button" style={BTN} onClick={() => void runHealthCheckAll()} disabled={checkingAll}>
            {checkingAll ? "جاري الفحص…" : "فحص جميع القنوات"}
          </button>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {channels.map((ch) => {
          const base = LIVE_STREAM_CHANNELS.find((c) => c.id === ch.id)!;
          const health = healthMap[ch.id];
          return (
            <div
              key={ch.id}
              className="ui-card"
              style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ fontSize: "1rem" }}>{ch.name}</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: C.inkSoft }}>{ch.description}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {health && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: STATUS_COLOR[health.status] ?? C.inkSoft,
                      }}
                    >
                      {healthStatusLabel(health.status)}
                    </span>
                  )}
                  <button
                    type="button"
                    style={BTN}
                    disabled={testingId === ch.id}
                    onClick={() => void testChannel(ch)}
                  >
                    {testingId === ch.id ? "جاري الاختبار…" : "اختبار"}
                  </button>
                </div>
              </div>

              <ChannelUrlForm
                key={`${ch.id}-${ch.streamUrl}-${(ch.fallbackUrls ?? []).join(",")}`}
                channelId={ch.id}
                streamUrl={ch.streamUrl}
                fallbackUrls={ch.fallbackUrls ?? []}
                defaultStreamUrl={base.streamUrl}
                defaultFallbacks={(base.fallbackUrls ?? []).join("\n")}
                lastCheck={health?.checkedAt}
                onSave={saveUrls}
              />

              {health?.results?.length ? (
                <details style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  <summary style={{ cursor: "pointer" }}>تفاصيل آخر فحص</summary>
                  <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.25rem" }}>
                    {health.results.map((r) => (
                      <li key={r.url} style={{ marginBottom: "0.25rem" }}>
                        <code style={{ fontSize: "0.7rem", wordBreak: "break-all" }}>{r.url}</code>
                        {" — "}
                        {healthStatusLabel(r.status)}: {r.detail}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelUrlForm({
  channelId,
  streamUrl,
  fallbackUrls,
  defaultStreamUrl,
  defaultFallbacks,
  lastCheck,
  onSave,
}: {
  channelId: string;
  streamUrl: string;
  fallbackUrls: string[];
  defaultStreamUrl: string;
  defaultFallbacks: string;
  lastCheck?: string;
  onSave: (id: string, primary: string, fallbacks: string) => void;
}) {
  const [primary, setPrimary] = useState(streamUrl);
  const [fallbacks, setFallbacks] = useState(fallbackUrls.join("\n"));

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.75rem" }}>
        رابط البث الأساسي
        <input
          type="url"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          dir="ltr"
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.25rem",
            padding: "0.4rem 0.5rem",
            fontSize: "0.75rem",
            borderRadius: "0.25rem",
            border: `1px solid ${C.line}`,
          }}
        />
      </label>
      <label style={{ fontSize: "0.75rem" }}>
        روابط احتياطية (سطر لكل رابط)
        <textarea
          value={fallbacks}
          onChange={(e) => setFallbacks(e.target.value)}
          dir="ltr"
          rows={2}
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.25rem",
            padding: "0.4rem 0.5rem",
            fontSize: "0.75rem",
            borderRadius: "0.25rem",
            border: `1px solid ${C.line}`,
            fontFamily: "monospace",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" style={BTN} onClick={() => onSave(channelId, primary, fallbacks)}>
          حفظ
        </button>
        <button
          type="button"
          style={BTN}
          onClick={() => {
            setPrimary(defaultStreamUrl);
            setFallbacks(defaultFallbacks);
          }}
        >
          استعادة الافتراضي
        </button>
        {lastCheck && (
          <span style={{ fontSize: "0.7rem", color: C.inkSoft }}>
            آخر فحص: {new Date(lastCheck).toLocaleString("ar-KW")}
          </span>
        )}
      </div>
    </div>
  );
}
