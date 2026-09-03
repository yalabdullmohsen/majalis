      (function () {
        var el = document.getElementById("mj-launch-splash");
        if (!el) return;
        var KEY = "mj.launch-splash.session.v2";
        var done = false;
        var appReady = false;
        var MIN_MS = 120;
        var SOFT_MAX_MS = 420;
        var MAX_MS = 1400;
        var EXIT_MS = 90;
        var bootReady = false;
        var shellStable = false;
        var start = (window.performance && performance.now) ? performance.now() : Date.now();
        try { window.__mjSplashStart = start; } catch (e) {}
        function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
        function fontsLikelyReady() {
          try {
            if (!document.fonts || !document.fonts.check) return true;
            return document.fonts.check('16px "Amiri"');
          } catch (e) { return true; }
        }
        function dismiss(immediate) {
          if (done) return;
          done = true;
          try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
          if (!el.parentNode) return;
          if (immediate) {
            try { el.remove(); } catch (e) {}
            return;
          }
          el.classList.add("mj-launch-splash--out");
          window.setTimeout(function () { if (el.parentNode) el.remove(); }, EXIT_MS);
        }
        function tryDismiss() {
          if (done) return;
          var elapsed = now() - start;
          if (elapsed < MIN_MS) return;
          var fontsOk = bootReady || fontsLikelyReady();
          if (!fontsOk && elapsed < MAX_MS) return;
          if (!appReady && !bootReady && elapsed < MAX_MS) return;
          /* انتظر رفع app-booting حتى لا يظهر #root ثم يخفى */
          if (!shellStable && document.documentElement.classList.contains("app-booting") && elapsed < MAX_MS) return;
          if (fontsOk && (bootReady || appReady)) {
            dismiss(false);
            return;
          }
          if (elapsed >= MAX_MS) dismiss(false);
        }
        try { window.__mjDismissSplash = dismiss; } catch (e) {}
        try {
          var forceBench = /[?&]splash_timing=1(?:&|$)/.test(location.search);
          if (!forceBench && (navigator.webdriver || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
            try {
              document.documentElement.classList.remove("app-booting");
              document.documentElement.dataset.appBooting = "0";
            } catch (e2) {}
            dismiss(true);
            return;
          }
          if (!forceBench && sessionStorage.getItem(KEY) === "1") {
            try {
              document.documentElement.classList.remove("app-booting");
              document.documentElement.dataset.appBooting = "0";
            } catch (e2) {}
            dismiss(true);
            return;
          }
        } catch (e) {}
        window.addEventListener("mj:app-painted", function () {
          appReady = true;
          tryDismiss();
        }, { once: true });
        window.addEventListener("mj:boot-ready", function () {
          bootReady = true;
          appReady = true;
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              shellStable = !document.documentElement.classList.contains("app-booting");
              tryDismiss();
            });
          });
        }, { once: true });
        window.addEventListener("mj:shell-stable", function () {
          shellStable = true;
          tryDismiss();
        }, { once: true });
        window.setTimeout(function () {
          appReady = true;
          bootReady = true;
          shellStable = true;
          tryDismiss();
          try {
            var C = window.Capacitor;
            if (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.SplashScreen) {
              C.Plugins.SplashScreen.hide({ fadeOutDuration: 0 });
            }
          } catch (eCap) {}
        }, MAX_MS);
        window.setTimeout(tryDismiss, MIN_MS);
        void SOFT_MAX_MS;
      })();
