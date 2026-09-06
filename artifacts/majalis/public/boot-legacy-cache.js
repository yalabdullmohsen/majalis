/* Legacy cache purge — keep old cache name tokens for one-time migration. */
(function () {
        var FLAG = "ssunnah-refreshing-version";
        if (navigator.webdriver) return;
        if (location.hostname === "127.0.0.1" || location.hostname === "localhost") return;
        try {
          if (sessionStorage.getItem(FLAG) === "1") {
            sessionStorage.removeItem(FLAG);
            return;
          }
        } catch (_) {}
        var prev = null;
        try {
          prev = localStorage.getItem("majalis_app_version");
        } catch (_) {}
        var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        var timer =
          ctrl &&
          setTimeout(function () {
            try {
              ctrl.abort();
            } catch (_) {}
          }, 2500);
        fetch("/version.json?t=" + Date.now(), {
          cache: "no-store",
          signal: ctrl ? ctrl.signal : undefined,
        })
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(function (j) {
            if (timer) clearTimeout(timer);
            if (!j) return;
            var live = String(j.commitSha || j.shortCommit || j.commit || "").slice(0, 8);
            if (!live) return;
            /* أول زيارة: خزّن النسخة فقط — بلا reload */
            if (!prev) {
              try {
                localStorage.setItem("majalis_app_version", live);
              } catch (_) {}
              return;
            }
            var same =
              live === prev ||
              prev.indexOf(live) === 0 ||
              live.indexOf(prev) === 0;
            if (same) return;
            try {
              sessionStorage.setItem(FLAG, "1");
              localStorage.setItem("majalis_force_cache_purge", "1");
              /* لا تكتب live في majalis_app_version هنا —
                 وإلا boot-sequence يرى prev=live وbaked=قديم فيُعيد التحميل مجددًا.
                 النسخة تُحدَّث بعد المسح من النسخة المضمَّنة في البناء فقط. */
            } catch (_) {}
            var reloadOnce = function () {
              try {
                var u = new URL(location.href);
                u.searchParams.set("v", live);
                location.replace(u.toString());
              } catch (_) {
                location.reload();
              }
            };
            if (!window.caches || !caches.keys) {
              reloadOnce();
              return;
            }
            caches
              .keys()
              .then(function (keys) {
                return Promise.all(
                  keys.map(function (k) {
                    /* امسح كاشات التطبيق القديمة؛ لا تمس كاشات غير ذات صلة إن وُجدت */
                    if (
                      /ssunnah|majalis|majlisilm|workbox|vite|static-json|shell|offline/i.test(k) ||
                      (k.indexOf("ssunnah-v") === 0 && k.indexOf(live) < 0)
                    ) {
                      return caches.delete(k);
                    }
                    return Promise.resolve(false);
                  }),
                );
              })
              .catch(function () {})
              .then(function () {
                reloadOnce();
              });
          })
          .catch(function () {
            if (timer) clearTimeout(timer);
          });
      })();
