// Compatibility entrypoint: a classic script keeps file:// design previews usable without a server.
(function () {
  "use strict";

  const buttons = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll("[data-flow]"));

  cards.forEach((card) => {
    const label = card.querySelector(".spx-gallery-label");
    const frame = card.querySelector(".spx-gallery-frame");
    if (!label || !frame) return;

    const openLink = document.createElement("a");
    openLink.className = "spx-gallery-open";
    openLink.href = frame.src.replace(/embed=1&?/, "");
    openLink.textContent = "Open page";
    openLink.setAttribute("aria-label", `Open ${frame.title}`);
    label.appendChild(openLink);
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      buttons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
      cards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.flow !== filter;
      });
    });
  });
})();
