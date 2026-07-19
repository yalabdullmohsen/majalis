import { useCallback, useEffect, useRef, useState } from "react";
import { VERSION_CHECK_INTERVAL_MS, getLoadedCommit, isNewVersionAvailable } from "@/lib/version-check";

/**
 * يفحص دوريًا (كل بضع دقائق + فور رجوع التبويب من الخلفية) هل صار هناك
 * نشر أحدث من الذي حُمِّلت به هذه الجلسة، بمقارنة commit الحيّ في
 * /version.json بما حُمِّل فعليًا عند بدء الجلسة. **لا يُعيد التحميل
 * تلقائيًا مطلقًا ولا يُكرِّره في حلقة** — فقط يرفع `updateAvailable`
 * ليعرض عنصر الواجهة زر تحديث اختياريًا؛ `applyUpdate` هو المسار
 * الوحيد لإعادة التحميل، ولا يُستدعى إلا بضغطة المستخدم.
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loadedCommit] = useState(() => getLoadedCommit());
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (!loadedCommit || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const found = await isNewVersionAvailable(loadedCommit);
      if (found) setUpdateAvailable(true);
    } finally {
      checkingRef.current = false;
    }
  }, [loadedCommit]);

  useEffect(() => {
    if (!loadedCommit || updateAvailable) return; // dev/local build أو تم الاكتشاف بالفعل

    const interval = window.setInterval(() => { void check(); }, VERSION_CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadedCommit, updateAvailable, check]);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  return { updateAvailable, applyUpdate };
}
