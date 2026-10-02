// Preview-only harness for prototipo-interativo.html. Lives outside .spx-pda-page.
(function () {
  "use strict";

  const api = window.CrossCheckPrototype;
  if (!api) return;

  const $ = (selector) => document.querySelector(selector);
  const bindText = (name, value) => {
    const element = $(`[data-bind="${name}"]`);
    if (element) element.textContent = value;
  };
  const logList = $('[data-bind="log"]');
  const now = () => new Date().toTimeString().slice(0, 8);

  bindText("to", api.toNumber);
  bindText("dest", api.toDestination);
  $('[data-sim="pin"]').textContent = api.pin;

  const log = (text, tone) => {
    const item = document.createElement("li");
    item.className = tone ? `is-${tone}` : "";
    item.innerHTML = `<time>${now()}</time><span>${text}</span>`;
    logList.prepend(item);
  };

  const stepFor = (detail) => {
    if (detail.view === "result") return 6;
    if (detail.overlay === "closure") return 5;
    if (detail.overlay === "alert") return 2;
    if (detail.overlay === "removed") return 3;
    if (detail.pendencies.length) return 4;
    return 1;
  };

  let previous = null;

  const describe = (detail, before) => {
    if (!before) return;
    if (detail.view === "result" && before.view !== "result") {
      return detail.released
        ? log(`PIN do supervisor liberou ${detail.released} pendência(s) · TO <b>Packed</b>`, "ok")
        : log("Sem pendências · TO fechada direto como <b>Packed</b>", "ok");
    }
    if (detail.view === "scan" && before.view === "result") return log("TO reaberta para bipagem");
    if (detail.overlay === "alert" && before.overlay !== "alert") {
      return log(`Cross-Check: <b>${detail.alertId}</b> não pertence à TO · pop-up exibido`, "bad");
    }
    if (detail.overlay === "alert" && detail.feedback && before.overlay === "alert") {
      return log("Re-scan com pacote diferente · pop-up continua aberto", "bad");
    }
    if (detail.overlay === "removed" && before.overlay !== "removed") {
      return log(`Re-scan confirmado: <b>${before.alertId}</b> não entrou na TO · volta para a esteira`, "ok");
    }
    if (detail.pendencies.length > before.pendencies.length) {
      const entry = detail.pendencies[0];
      return log(`Pop-up fechado · pendência registrada: <b>${entry.id}</b> · ${entry.operator} · ${entry.time.slice(11)}`, "warn");
    }
    if (detail.overlay === "closure" && before.overlay !== "closure") {
      return log(`Complete: ${detail.pendencies.length} pendência(s) · PIN do supervisor solicitado`, "warn");
    }
    if (detail.pinError && detail.pinError !== before.pinError) return log("PIN incorreto · TO não fechada", "bad");
    if (detail.pinError && before.overlay === "closure" && detail.overlay === "closure") return log("PIN incorreto · TO não fechada", "bad");
    if (before.overlay === "closure" && !detail.overlay && detail.view === "scan") {
      return log("Sem supervisor disponível · TO permanece em <b>Packing</b>", "warn");
    }
    if (detail.packages > before.packages && detail.feedback.state === "success") {
      return log(`Pacote aceito na TO · ${detail.packages} pacote(s)`, "ok");
    }
  };

  document.addEventListener("crosscheck:change", (event) => {
    const detail = event.detail;
    describe(detail, previous);
    previous = detail;

    bindText("status", detail.view === "result" ? "Packed" : "Packing");
    bindText("packages", String(detail.packages));
    bindText("pendencies", String(detail.pendencies.length));
    $('[data-bind="status"]').className = detail.view === "result" ? "is-ok" : "";
    $('[data-bind="pendencies"]').className = detail.pendencies.length ? "is-bad" : "";

    const scanning = detail.view === "scan";
    $('[data-sim="correct"]').disabled = !scanning || (detail.overlay && detail.overlay !== "alert");
    $('[data-sim="wrong"]').disabled = !scanning || Boolean(detail.overlay);
    $('[data-sim="rescan"]').disabled = detail.overlay !== "alert";

    const step = stepFor(detail);
    document.querySelectorAll("[data-step]").forEach((button) => {
      const value = Number(button.dataset.step);
      button.classList.toggle("is-current", value === step);
      button.classList.toggle("is-done", value < step && !(value === 3 && step >= 4 && !detail.released && detail.pendencies.length));
      button.setAttribute("aria-current", value === step ? "step" : "false");
    });
  });

  $('[data-sim="correct"]').addEventListener("click", () => api.scanCorrect());
  $('[data-sim="wrong"]').addEventListener("click", () => api.scanWrong());
  $('[data-sim="rescan"]').addEventListener("click", () => api.rescanFlagged());
  $('[data-sim="pin"]').addEventListener("click", (event) => {
    navigator.clipboard?.writeText(api.pin).catch(() => {});
    const pin = document.querySelector('[data-input="pin"]');
    if (pin) {
      pin.value = api.pin;
      pin.dispatchEvent(new Event("input", { bubbles: true }));
      pin.focus();
      log("PIN do supervisor preenchido");
    } else {
      event.currentTarget.textContent = "copiado";
      setTimeout(() => (event.currentTarget.textContent = api.pin), 900);
    }
  });
  $('[data-sim="reset"]').addEventListener("click", () => {
    logList.innerHTML = "";
    previous = null;
    api.load("scan");
    log("TO reiniciada · 3 pacotes já bipados");
  });

  const stepNames = { scan: "Scan", alert: "Pop-up de Cross-Check", removed: "Re-scan · correção", pendency: "Pendência registrada", closure: "Fechar TO com pendências", packed: "Packed" };
  document.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => {
      previous = null;
      api.load(button.dataset.load);
      log(`Etapa carregada: ${stepNames[button.dataset.load]}`);
    });
  });

  api.refresh();
  log("Comece bipando um pacote · 3 pacotes já estão na TO");
})();
