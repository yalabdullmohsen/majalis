/**
 * Startup Stabilizer — مصدر بوابات CI (يُضمَّن inline في index.html).
 */
(function () {
  try {
    var html = document.documentElement;
    html.setAttribute("lang", "ar");
    html.setAttribute("dir", "rtl");
    html.classList.add("startup-lock");
    var _dsv = "v10-pwa-single-paint-2026-08";
    if (localStorage.getItem("majalis-design-v") !== _dsv) {
      localStorage.setItem("majalis-design-v", _dsv);
      localStorage.removeItem("majalis-font-preference");
      try {
        localStorage.removeItem("majalis_app_version");
        localStorage.setItem("majalis_force_cache_purge", "1");
      } catch (_) {}
    }
    var storedTheme = localStorage.getItem("majalis-theme");
    var resolved = "light";
    if (storedTheme === "dark") {
      resolved = "dark";
    } else if (storedTheme === "auto") {
      resolved =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    }
    html.dataset.theme = resolved;
    if (resolved === "dark") {
      html.classList.add("dark", "theme-dark");
      html.classList.remove("light", "theme-light");
    } else {
      html.classList.add("light", "theme-light");
      html.classList.remove("dark", "theme-dark");
    }
    html.style.colorScheme = resolved === "dark" ? "dark" : "light";
    var splashBg = resolved === "dark" ? "#101614" : "#F2F4F3";
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute("content", splashBg);
      m.removeAttribute("media");
    });
    var csMeta = document.querySelector('meta[name="color-scheme"]');
    if (csMeta) {
      csMeta.setAttribute("content", resolved === "dark" ? "dark light" : "light");
    }
    var storedFont = localStorage.getItem("majalis-font-preference-v2");
    html.dataset.font =
      storedFont === "naskh" || storedFont === "default" ? storedFont : "naskh";
    try {
      var prefs = JSON.parse(localStorage.getItem("majalis-user-settings-v1") || "{}");
      var scale = prefs.seniorMode
        ? "1.16"
        : prefs.fontSize === "صغير"
          ? "0.92"
          : prefs.fontSize === "كبير"
            ? "1.08"
            : "1";
      html.style.setProperty("--ui-font-scale", scale);
      html.style.setProperty(
        "--ui-density-scale",
        prefs.seniorMode ? "1" : prefs.uiDensity === "compact" ? "0.92" : "1",
      );
      if (scale !== "1") {
        html.style.fontSize = "calc(1rem * var(--ui-font-scale))";
      }
    } catch (e) {}
    window.addEventListener(
      "mj:app-painted",
      function () {
        html.classList.remove("startup-lock");
      },
      { once: true },
    );
  } catch (e) {}
})();
