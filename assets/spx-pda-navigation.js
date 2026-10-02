// Shared file://-compatible navigation for the Cross-Check at Scan prototype.
// Review tooling only: mounted outside .spx-pda-page and suppressed in iframes / ?embed=1.
(function () {
  "use strict";

  if (window.SpxPdaNavigation) return;

  const previewRevision = "20261002-1";

  const screens = [
    { file: "to-packing-scan.html", flow: "1 · Scan", label: "Scanning TO (correct destination)" },
    { file: "cross-check-alert.html", flow: "2 · Cross-Check pop-up", label: "Wrong destination pop-up" },
    { file: "cross-check-alert-mismatch.html", flow: "2 · Cross-Check pop-up", label: "Re-scan · different package" },
    { file: "cross-check-removed.html", flow: "3 · Re-scan", label: "Correction confirmed" },
    { file: "pendency-registered.html", flow: "4 · Dismiss", label: "Pendency registered" },
    { file: "pendency-list.html", flow: "4 · Dismiss", label: "Pendency list" },
    { file: "close-to-pendencies.html", flow: "5 · Close TO", label: "Pendencies · supervisor PIN" },
    { file: "close-to-pin-error.html", flow: "5 · Close TO", label: "Incorrect PIN" },
    { file: "close-to-kept-packing.html", flow: "5 · Close TO", label: "No supervisor · stays Packing" },
    { file: "to-packed.html", flow: "6 · Packed", label: "Packed · no pendency" },
    { file: "to-packed-released.html", flow: "6 · Packed", label: "Packed · pendencies released" }
  ];

  const fileName = decodeURIComponent(window.location.pathname.split("/").pop() || "");
  const isScreenPage = window.location.pathname.includes("/screens/");
  const isHome = fileName === "index.html" || fileName === "";
  const rootUrl = new URL(isScreenPage ? "../" : "./", window.location.href);
  const screenUrl = (file) => new URL(`screens/${file}?v=${previewRevision}`, rootUrl).href;
  const currentIndex = isScreenPage ? screens.findIndex((screen) => screen.file === fileName) : -1;

  const groupedOptions = () => {
    const groups = new Map();
    screens.forEach((screen, index) => {
      if (!groups.has(screen.flow)) groups.set(screen.flow, []);
      groups.get(screen.flow).push({ ...screen, index });
    });
    return Array.from(groups.entries())
      .map(
        ([flow, items]) => `<optgroup label="${flow}">
          ${items.map((screen) => `<option value="${screenUrl(screen.file)}"${screen.index === currentIndex ? " selected" : ""}>${screen.label}</option>`).join("")}
        </optgroup>`
      )
      .join("");
  };

  const navigationLink = (label, href, current) =>
    `<a class="spx-preview-nav-link${current ? " is-current" : ""}" href="${href}"${current ? ' aria-current="page"' : ""}>${label}</a>`;

  const mount = () => {
    if (
      document.querySelector("[data-preview-navigation]") ||
      window.self !== window.top ||
      new URLSearchParams(window.location.search).has("embed")
    ) {
      return;
    }

    const current = currentIndex >= 0 ? screens[currentIndex] : null;
    const previous = current ? screens[(currentIndex - 1 + screens.length) % screens.length] : screens[screens.length - 1];
    const next = current ? screens[(currentIndex + 1) % screens.length] : screens[0];
    const navigation = document.createElement("nav");

    navigation.className = "spx-preview-navigation";
    navigation.dataset.previewNavigation = "";
    navigation.setAttribute("aria-label", "Prototype preview navigation");
    navigation.innerHTML = `
      <div class="spx-preview-nav-primary">
        <div class="spx-preview-nav-brand">
          <strong>Cross-Check at Scan · PDA Prototype</strong>
          <span>${current ? `${current.flow} · ${current.label} · ${currentIndex + 1}/${screens.length}` : "Flow overview"}</span>
        </div>
        <div class="spx-preview-nav-destinations">
          ${navigationLink("Flow Overview", new URL(`index.html?v=${previewRevision}`, rootUrl).href, isHome)}
        </div>
      </div>
      <div class="spx-preview-nav-switcher">
        ${navigationLink("Previous", screenUrl(previous.file), false)}
        <label class="spx-preview-nav-select">
          <span>Jump to state</span>
          <select aria-label="Jump to a prototype state">
            ${current ? "" : '<option value="" selected>Select a state…</option>'}
            ${groupedOptions()}
          </select>
        </label>
        ${navigationLink("Next", screenUrl(next.file), false)}
      </div>
      ${
        window.CrossCheckPrototype
          ? `<div class="spx-preview-nav-scanner" aria-label="Scanner simulator">
              <span>Scanner simulator</span>
              <button type="button" data-sim="correct">Scan correct package</button>
              <button type="button" data-sim="wrong">Scan wrong-destination package</button>
              <span>Supervisor PIN <code>${window.CrossCheckPrototype.pin}</code></span>
            </div>`
          : ""
      }`;

    navigation.querySelector("select").addEventListener("change", (event) => {
      if (event.target.value) window.location.href = event.target.value;
    });
    navigation.querySelector('[data-sim="correct"]')?.addEventListener("click", () => window.CrossCheckPrototype.scanCorrect());
    navigation.querySelector('[data-sim="wrong"]')?.addEventListener("click", () => window.CrossCheckPrototype.scanWrong());

    document.body.classList.add("spx-preview-with-nav");
    document.body.prepend(navigation);
  };

  window.SpxPdaNavigation = { mount, screens };
  mount();
})();
