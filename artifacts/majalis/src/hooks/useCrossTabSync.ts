import { useCallback, useEffect, useState } from "react";
import {
  broadcastAzkarProgress,
  broadcastBookmarkChanged,
  broadcastDailyProgress,
  broadcastIdbWrite,
  broadcastStreakIncrement,
  getCrossTabId,
  isBroadcastChannelSupported,
  publishCrossTabEvent,
  subscribeCrossTab,
  type CrossTabEventType,
  type CrossTabMessage,
} from "@/lib/cross-tab-sync";

/** Cross-tab BroadcastChannel sync — logic only. */
export function useCrossTabSync(opts?: {
  onMessage?: (msg: CrossTabMessage) => void;
  types?: CrossTabEventType[];
}) {
  const [lastMessage, setLastMessage] = useState<CrossTabMessage | null>(null);
  const supported = isBroadcastChannelSupported();
  const tabId = getCrossTabId();

  useEffect(() => {
    return subscribeCrossTab((msg) => {
      if (opts?.types && !opts.types.includes(msg.type)) return;
      setLastMessage(msg);
      opts?.onMessage?.(msg);
    });
  }, [opts?.onMessage, opts?.types]);

  const publish = useCallback(<T,>(type: CrossTabEventType, payload: T, key?: string) => {
    return publishCrossTabEvent(type, payload, key);
  }, []);

  return {
    supported,
    tabId,
    lastMessage,
    publish,
    broadcastBookmarkChanged,
    broadcastAzkarProgress,
    broadcastStreakIncrement,
    broadcastIdbWrite,
    broadcastDailyProgress,
  };
}
