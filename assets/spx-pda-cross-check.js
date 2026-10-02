// PRD extension for real-time Cross-Check at TO packing scan. Composes registered SSC/SPX primitives
// on top of the locked TO Packing operation shell and the TO Packing task-result shell.
(function () {
  "use strict";

  const root = document.getElementById("app");
  const initialState = document.body.dataset.prototypeState;
  if (!root || !initialState) return;

  /* ---------- Mock data ---------- */

  const TO_NUMBER = "TO2026100210B4K";
  const TO_DESTINATION = "Campinas Hub";
  const OPERATOR_ID = "BR-OP-10482";
  const SUPERVISOR_PIN = "246810";

  // Packages that do not belong to the TO destination.
  const wrongDestinations = {
    BR2610029981046: "Ribeirão Preto Hub",
    BR2610029981053: "Sorocaba Hub",
    BR2610029981060: "São José dos Campos Hub"
  };
  const wrongQueue = Object.keys(wrongDestinations);
  let correctSerial = 345151;

  const pad = (value) => String(value).padStart(2, "0");
  const timestamp = (date = new Date()) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const fixedTime = (minutes, seconds) => `2026-10-02 14:${pad(minutes)}:${pad(seconds)}`;

  const nextCorrectId = () => {
    correctSerial += 7;
    return `BR2610027${correctSerial}`;
  };

  const nextWrongId = () => {
    const used = new Set(model.pendencies.map((entry) => entry.id).concat(model.removed));
    if (model.alert) used.add(model.alert.id);
    return wrongQueue.find((id) => !used.has(id)) || wrongQueue[0];
  };

  const basePackages = () => [
    { id: "BR2610027345144" },
    { id: "BR2610027345137" },
    { id: "BR2610027345120" }
  ];

  const pendencyOne = {
    id: "BR2610029981046",
    destination: wrongDestinations.BR2610029981046,
    operator: OPERATOR_ID,
    time: fixedTime(32, 8)
  };
  const pendencyTwo = {
    id: "BR2610029981053",
    destination: wrongDestinations.BR2610029981053,
    operator: OPERATOR_ID,
    time: fixedTime(36, 41)
  };

  const freshModel = () => ({
    view: "scan",
    packages: basePackages(),
    pendencies: [],
    removed: [],
    released: 0,
    feedback: { state: "default" },
    overlay: null,
    alert: null,
    alertError: "",
    emailValue: "",
    emailError: "",
    pinValue: "",
    pinError: "",
    toast: null,
    toastSticky: false,
    createdTime: fixedTime(18, 2),
    completedTime: ""
  });
  const model = freshModel();

  const seeds = {
    scan() {},
    alert() {
      const id = "BR2610029981046";
      model.alert = { id, destination: wrongDestinations[id], time: fixedTime(32, 8) };
      model.feedback = { state: "error", message: "Cross-Check failed · Not added to TO", detail: `${id} at 14:32:08` };
      model.overlay = "alert";
    },
    "alert-mismatch"() {
      seeds.alert();
      model.alertError = "This is not the flagged package. Scan BR2610029981046 to confirm.";
    },
    removed() {
      model.removed = ["BR2610029981046"];
      model.alert = { id: "BR2610029981046", destination: wrongDestinations.BR2610029981046, time: fixedTime(32, 8) };
      model.feedback = { state: "error", message: "Not added to TO · Return to conveyor", detail: "BR2610029981046 at 14:32:15" };
      model.overlay = "removed";
    },
    pendency() {
      model.pendencies = [pendencyOne];
      model.packages.unshift({ id: pendencyOne.id, pendency: true });
      model.feedback = { state: "error", message: "Cross-Check pendency registered", detail: `${pendencyOne.id} at 14:32:08` };
      model.toast = { icon: "IconNoticeColored", text: "Pendency registered to TO" };
      model.toastSticky = true;
    },
    "pendency-sheet"() {
      model.pendencies = [pendencyTwo, pendencyOne];
      model.packages = [{ id: pendencyTwo.id, pendency: true }, { id: "BR2610027345158" }, { id: pendencyOne.id, pendency: true }].concat(basePackages());
      model.overlay = "pendency-sheet";
    },
    closure() {
      seeds["pendency-sheet"]();
      model.overlay = "closure";
    },
    "closure-error"() {
      seeds.closure();
      model.emailValue = "supervisor.sp6@shopee.com";
      model.pinValue = "135790";
      model.pinError = "Incorrect supervisor PIN. Try again.";
    },
    "kept-packing"() {
      seeds["pendency-sheet"]();
      model.overlay = null;
      model.toast = { icon: "IconNoticeColored", text: "TO remains in Packing" };
      model.toastSticky = true;
    },
    packed() {
      model.packages = [{ id: "BR2610027345158" }].concat(basePackages());
      model.view = "result";
      model.completedTime = fixedTime(41, 26);
    },
    "packed-released"() {
      seeds["pendency-sheet"]();
      model.overlay = null;
      model.released = 2;
      model.pendencies = [];
      model.view = "result";
      model.completedTime = fixedTime(44, 3);
    }
  };

  /* ---------- Inherited markup (mirrors spx-pda-template.js anatomy) ---------- */

  const icon = (name, size) =>
    `<span class="ssc-icon${size ? ` is-${size}` : ""}" data-component="Icon" data-icon="${name}" aria-hidden="true"></span>`;

  const button = (label, options = {}) =>
    `<button type="button" class="ssc-button${options.primary ? " is-primary" : ""}${options.neutral ? " is-neutral" : ""}${options.tertiary ? " is-tertiary" : ""}" data-component="Button"${options.action ? ` data-action="${options.action}"` : ""}${options.disabled ? " disabled" : ""}>${options.icon ? icon(options.icon, 20) : ""}<span>${label}</span>${options.trailingIcon ? icon(options.trailingIcon, 20) : ""}</button>`;

  const navbar = (title) => `
    <div class="ssc-statusbar" data-module="SystemStatusBar" aria-label="PDA system status"></div>
    <nav class="ssc-navbar" data-component="Navbar" data-title-position="left">
      <button class="ssc-navbar-action" data-component="Button" aria-label="Back">${icon("IconBack", 24)}</button>
      <div class="ssc-navbar-title">${title}</div>
      <button class="ssc-navbar-action is-empty" data-component="Button" aria-label="No action"></button>
    </nav>`;

  const scanInput = (placeholder, options = {}) => `
    <div class="spx-scan-input" data-component="Input">
      ${icon("IconBarcodeOutline", 20)}
      <input class="spx-scan-input-value" type="text" autocomplete="off" spellcheck="false" placeholder="${placeholder}" aria-label="${placeholder}" data-input="${options.name}" value="${options.value || ""}">
      ${options.hideMethod ? "" : `<button class="spx-scan-input-action" data-component="Button" aria-label="Choose scan method">${icon("IconMethodOutline", 20)}</button>`}
    </div>`;

  const scanFeedback = (feedback) => {
    const { state, message, detail } = feedback;
    const stateClass = state === "success" ? " is-success" : state === "error" ? " is-error" : "";
    const stateIcon = state === "success" ? "IconSuccessFeedback" : state === "error" ? "IconHardBlock" : "IconScanResultDefault";
    const copy =
      state === "success" || state === "error"
        ? `<span class="spx-feedback-copy"><strong>${message}</strong><span>${detail || ""}</span></span>`
        : `<span>${message || "Scan Result"}</span>`;
    return `<div class="spx-scan-feedback${stateClass}" data-module="ScanFeedback" data-feedback-state="${state}" role="status" aria-live="polite">
      ${icon(stateIcon, 42)}
      ${copy}
    </div>`;
  };

  const listCell = (label, value, options = {}) => `
    <div class="ssc-list-cell${options.action ? " spx-cc-tappable" : ""}" data-component="ListCell"${options.action ? ` data-action="${options.action}" role="button" tabindex="0"` : ""}>
      <span class="ssc-list-label">${label}</span>
      <span class="ssc-list-value"><span>${value}</span></span>
      ${options.arrow ? icon("IconArrowRightOutline", 16) : ""}
    </div>`;

  const required = (label) => `${label}<span class="spx-required">*</span>`;
  const tag = (copy, tone) => `<span class="ssc-label is-${tone}" data-component="Tag">${copy}</span>`;

  const objectRow = (item, removable) => `
    <div class="spx-object-row">
      <div class="spx-object-copy">
        <span class="spx-object-id">${item.id}</span>
        ${item.pendency ? `<span class="spx-object-meta">${tag("Cross-Check Pendency", "error")}</span>` : ""}
      </div>
      ${removable ? icon("IconDeleteOutline", 20) : ""}
    </div>`;

  const summaryCard = (removable) => {
    const count = model.packages.length;
    const weight = (count * 0.52).toFixed(2);
    return `<section class="ssc-card spx-summary-card" data-module="AggregateMetricsCard">
      <h2 class="spx-summary-title">${TO_NUMBER}</h2>
      <div class="spx-metric-row">
        <div class="spx-metric"><span class="spx-metric-value">${count}</span><span class="spx-metric-unit">Order(s)</span></div>
        <div class="spx-metric"><span class="spx-metric-value">${weight}</span><span class="spx-metric-unit">kg</span></div>
      </div>
      <div class="spx-category-metrics">
        ${[["Forward Order...", count], ["HV Order", 0], ["NDD Order", 0], ["Return Order", 0]]
          .map((entry) => `<div class="spx-category-metric"><span class="spx-category-label">${entry[0]}</span><span class="spx-category-value">${entry[1]}</span></div>`)
          .join("")}
      </div>
      ${
        count
          ? `<div class="spx-object-list" data-module="ScannedObjectList">${model.packages.map((item) => objectRow(item, removable)).join("")}</div>`
          : `<div class="spx-empty-state" data-component="EmptyState"><div class="spx-empty-illustration">${icon("IconEmptyPda", 90)}</div><span>Scan to add to TO</span></div>`
      }
    </section>`;
  };

  const contextCard = () => {
    const rows = [listCell(required("TO Pack"), "Bag", { arrow: true }), listCell("Receiver", TO_DESTINATION)];
    if (model.pendencies.length) {
      rows.push(
        listCell("Cross-Check", tag(`${model.pendencies.length} Pending`, "error"), { arrow: true, action: "open-pendencies" })
      );
    }
    return `<section class="ssc-card spx-context-card" data-module="TaskContextCard">${rows.join("")}</section>`;
  };

  const toastMarkup = () =>
    model.toast
      ? `<div class="spx-toast spx-cc-toast" data-component="Toast" role="status">${icon(model.toast.icon, 36)}<span>${model.toast.text}</span></div>`
      : "";

  /* ---------- Overlays ---------- */

  const comparison = (id, destination) => `
    <div class="spx-cc-compare" data-module="CrossCheckComparison">
      ${listCell("Package", id)}
      ${listCell("Package Destination", tag(destination, "error"))}
      ${listCell("TO Destination", TO_DESTINATION)}
    </div>`;

  const alertDialog = () => {
    const { id, destination } = model.alert;
    return `<div class="spx-overlay" data-component="Modal" data-cc-overlay="alert">
      <section class="spx-dialog is-cross-check" data-component="Dialog" data-module="CrossCheckAlert" role="alertdialog" aria-labelledby="cc-alert-title" aria-describedby="cc-alert-copy">
        <button class="spx-cc-dismiss" type="button" data-component="Button" data-action="dismiss-alert" aria-label="Close and register pendency">${icon("IconCloseOutline", 20)}</button>
        <div class="spx-dialog-content">
          ${icon("IconFailedColored", 48)}
          <div class="spx-dialog-message">
            <h2 class="spx-dialog-title" id="cc-alert-title">Wrong Destination</h2>
            <p class="spx-dialog-description" id="cc-alert-copy">This package does not belong to this TO. Keep it out of the bag and re-scan it to remove it.</p>
          </div>
          ${comparison(id, destination)}
          <div class="spx-cc-rescan">
            ${scanInput("Re-scan SPX TN", { name: "rescan", hideMethod: true, value: model.alertError ? "BR2610027345158" : "" })}
            <p class="spx-cc-helper${model.alertError ? " is-error" : ""}" role="${model.alertError ? "alert" : "note"}">${model.alertError || "Scan the same package again to confirm removal."}</p>
          </div>
        </div>
      </section>
    </div>`;
  };

  const removedDialog = () => {
    const { id } = model.alert;
    return `<div class="spx-overlay" data-component="Modal" data-cc-overlay="removed">
      <section class="spx-dialog is-cross-check is-cross-check-resolved" data-component="Dialog" data-module="CrossCheckCorrection" role="alertdialog" aria-labelledby="cc-removed-title">
        <div class="spx-dialog-content">
          ${icon("IconSuccessColored", 48)}
          <div class="spx-dialog-message">
            <h2 class="spx-dialog-title" id="cc-removed-title">Package Removed from TO</h2>
            <p class="spx-dialog-description"><strong>${id}</strong> did not enter ${TO_NUMBER}. Return it to the conveyor.</p>
          </div>
          <div class="spx-cc-compare">
            ${listCell("TO Status", "Not added")}
            ${listCell("Pendency", "None registered")}
          </div>
        </div>
        <div class="spx-dialog-actions">${button("OK, Back to Scanning", { primary: true, action: "close-removed" })}</div>
      </section>
    </div>`;
  };

  const pendencyCard = (entry) => `
    <article class="spx-cc-pendency" data-module="CrossCheckPendency">
      <div class="spx-cc-pendency-head">
        <strong>${entry.id}</strong>
        ${tag("Pending", "error")}
      </div>
      <div class="spx-cc-pendency-route">${icon("IconParcelOutline", 16)}<span>${entry.destination}</span>${icon("IconArrowRightOutline", 16)}<span>TO: ${TO_DESTINATION}</span></div>
      <div class="spx-cc-pendency-meta"><span>Operator ${entry.operator}</span><span>${entry.time}</span></div>
    </article>`;

  const pendencySheet = () => `<div class="spx-overlay" data-component="Modal" data-cc-overlay="pendency-sheet">
      <section class="spx-bottom-sheet is-cross-check-sheet" data-component="BottomSheet" data-module="CrossCheckPendencyList" role="dialog" aria-labelledby="cc-pendency-title">
        <header class="spx-sheet-header"><h2 class="spx-sheet-title" id="cc-pendency-title">Cross-Check Pendencies (${model.pendencies.length})</h2><button class="ssc-navbar-action" data-component="Button" data-action="close-overlay" aria-label="Close">${icon("IconCloseOutline", 24)}</button></header>
        <div class="spx-sheet-body">
          <p class="spx-cc-sheet-note">Released by a supervisor PIN when the TO is closed.</p>
          ${model.pendencies.map(pendencyCard).join("")}
        </div>
      </section>
    </div>`;

  const closureSheet = () => {
    const count = model.pendencies.length;
    const ready = model.pinValue.length === 6 && /.+@.+\..+/.test(model.emailValue);
    return `<div class="spx-overlay" data-component="Modal" data-cc-overlay="closure">
      <section class="spx-bottom-sheet is-cross-check-sheet is-closure" data-component="BottomSheet" data-module="TOClosurePendencyRelease" role="dialog" aria-labelledby="cc-closure-title">
        <header class="spx-sheet-header"><h2 class="spx-sheet-title" id="cc-closure-title">Close TO</h2><button class="ssc-navbar-action" data-component="Button" data-action="keep-packing" aria-label="Close">${icon("IconCloseOutline", 24)}</button></header>
        <div class="spx-sheet-body">
          <div class="spx-cc-banner" role="note">${icon("IconInfoOutline", 16)}<span>${count} Cross-Check ${count === 1 ? "pendency" : "pendencies"} must be released by a supervisor before ${TO_NUMBER} can be packed.</span></div>
          ${model.pendencies.map(pendencyCard).join("")}
          <label class="spx-cc-pin" data-component="Input">
            <span class="spx-cc-pin-label">Supervisor email<span class="spx-required">*</span></span>
            <input class="spx-cc-pin-input is-text${model.emailError ? " is-error" : ""}" type="email" inputmode="email" autocomplete="off" placeholder="name@shopee.com" data-input="email" value="${model.emailValue}" aria-invalid="${model.emailError ? "true" : "false"}" aria-describedby="cc-email-helper">
            <span class="spx-cc-helper${model.emailError ? " is-error" : ""}" id="cc-email-helper">${model.emailError || "Both the supervisor email and PIN are recorded in the release log."}</span>
          </label>
          <label class="spx-cc-pin" data-component="Input">
            <span class="spx-cc-pin-label">Supervisor PIN<span class="spx-required">*</span></span>
            <input class="spx-cc-pin-input${model.pinError ? " is-error" : ""}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="Enter 6-digit PIN" data-input="pin" value="${model.pinValue}" aria-invalid="${model.pinError ? "true" : "false"}" aria-describedby="cc-pin-helper">
            <span class="spx-cc-helper${model.pinError ? " is-error" : ""}" id="cc-pin-helper">${model.pinError || "No supervisor on shift? Keep packing — the TO stays in Packing status."}</span>
          </label>
        </div>
        <div class="spx-sheet-actions">${button("Keep Packing", { neutral: true, action: "keep-packing" })}${button("Release & Pack", { primary: true, action: "release", disabled: !ready })}</div>
      </section>
    </div>`;
  };

  const overlayMarkup = () => {
    if (model.overlay === "alert") return alertDialog();
    if (model.overlay === "removed") return removedDialog();
    if (model.overlay === "pendency-sheet") return pendencySheet();
    if (model.overlay === "closure") return closureSheet();
    return "";
  };

  /* ---------- Screens ---------- */

  const setShell = (template, state, archetype) => {
    root.dataset.template = template;
    root.dataset.state = state;
    root.dataset.archetype = archetype;
    root.dataset.renderKind = template === "task-result" ? "result" : "operation";
  };

  const operationScreen = () => {
    setShell("to-packing", "active-print", "scan-operation");
    return `
      ${navbar("Pack Normal TO")}
      <div class="ssc-page-body has-bottom-actions">
        <section class="spx-scan-card" data-module="ScanWorkspace">
          ${scanInput("SPX TN", { name: "scan" })}
          ${scanFeedback(model.feedback)}
        </section>
        ${contextCard()}
        ${summaryCard(true)}
      </div>
      <div class="ssc-bottom-action-bar" data-module="TaskActionMatrix">
        ${button("Print", { tertiary: true, trailingIcon: "IconArrowDownOutline" })}
        ${button("Complete", { primary: true, action: "complete", disabled: !model.packages.length })}
      </div>
      ${overlayMarkup()}
      ${toastMarkup()}`;
  };

  const resultScreen = () => {
    setShell("task-result", "to-packing", "result-feedback-page");
    const crossCheck = model.released ? `${model.released} ${model.released === 1 ? "pendency" : "pendencies"} released` : "No pendency";
    const audit = [
      ["Receiver", TO_DESTINATION],
      ["TO Pack", "Nylon Bag"],
      ["Cross-Check", crossCheck],
      ["Operator", OPERATOR_ID],
      ["Created Time", model.createdTime],
      ["Completed Time", model.completedTime]
    ];
    return `
      ${navbar("Pack Normal TO")}
      <div class="ssc-page-body spx-result-page-body">
        <section class="spx-completed-header" data-module="TaskCompletionSummary">${icon("IconSuccessCompleted", 24)}<span>Packed</span></section>
        <div class="spx-result-actions" data-module="TaskActionMatrix">
          ${button("Print")}${button("Reopen", { action: "reopen" })}${button("Create New Task", { icon: "IconAddOutline", action: "new-task" })}
        </div>
        <div class="spx-result-content">
          <section class="spx-scan-card">${scanInput("Scan TO Label", { name: "label", hideMethod: true })}<p class="spx-sheet-helper">Scan TO label to start.</p></section>
          <section class="ssc-card spx-context-card" data-module="TaskAuditInfo">${audit.map((row) => listCell(row[0], row[1])).join("")}</section>
          ${summaryCard(false)}
        </div>
      </div>
      ${toastMarkup()}`;
  };

  /* ---------- Behaviour ---------- */

  let toastTimer = 0;

  const render = (focusTarget) => {
    root.innerHTML = model.view === "result" ? resultScreen() : operationScreen();
    bind();
    const target = focusTarget || (model.overlay === "alert" ? "rescan" : model.overlay === "closure" ? "email" : model.overlay ? null : "scan");
    if (target) root.querySelector(`[data-input="${target}"]`)?.focus({ preventScroll: true });
    if (model.toast && !model.toastSticky) {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        model.toast = null;
        root.querySelector(".spx-cc-toast")?.remove();
      }, 2200);
    }
    // Preview-only state broadcast for the interactive prototype harness.
    document.dispatchEvent(
      new CustomEvent("crosscheck:change", {
        detail: {
          view: model.view,
          overlay: model.overlay,
          packages: model.packages.length,
          pendencies: model.pendencies.map((entry) => ({ ...entry })),
          released: model.released,
          feedback: { ...model.feedback },
          alertId: model.alert ? model.alert.id : null,
          pinError: model.pinError
        }
      })
    );
  };

  const showToast = (iconName, text) => {
    model.toast = { icon: iconName, text };
    model.toastSticky = false;
  };

  const clearTransient = () => {
    if (model.toastSticky) {
      model.toast = null;
      model.toastSticky = false;
    }
  };

  const scanPackage = (rawId) => {
    const id = rawId.trim().toUpperCase();
    if (!id || model.view !== "scan") return;
    clearTransient();
    if (model.overlay === "alert") return confirmRescan(id);
    if (model.overlay) return;
    const time = timestamp();

    if (model.packages.some((item) => item.id === id)) {
      model.feedback = { state: "success", message: "Already in this TO.", detail: `${id} at ${time}` };
      return render();
    }

    const destination = wrongDestinations[id];
    if (destination) {
      // Real-time Cross-Check: the package is held out of the TO until it is re-scanned or dismissed.
      model.alert = { id, destination, time };
      model.alertError = "";
      model.feedback = { state: "error", message: "Cross-Check failed · Not added to TO", detail: `${id} at ${time.slice(11)}` };
      model.overlay = "alert";
      model.toast = null;
      return render();
    }

    model.packages.unshift({ id });
    model.feedback = { state: "success", message: "Scanned Success.", detail: `${id} at ${time}` };
    render();
  };

  const confirmRescan = (id) => {
    const flagged = model.alert.id;
    if (id !== flagged) {
      model.alertError = `This is not the flagged package. Scan ${flagged} to confirm.`;
      return render("rescan");
    }
    model.removed.push(flagged);
    model.alertError = "";
    model.feedback = { state: "error", message: "Not added to TO · Return to conveyor", detail: `${flagged} at ${timestamp().slice(11)}` };
    model.overlay = "removed";
    render();
  };

  const dismissAlert = () => {
    const { id, destination } = model.alert;
    const entry = { id, destination, operator: OPERATOR_ID, time: timestamp() };
    model.pendencies.unshift(entry);
    model.packages.unshift({ id, pendency: true });
    model.feedback = { state: "error", message: "Cross-Check pendency registered", detail: `${id} at ${entry.time.slice(11)}` };
    model.overlay = null;
    model.alert = null;
    model.alertError = "";
    showToast("IconNoticeColored", "Pendency registered to TO");
    render();
  };

  const completeTask = () => {
    clearTransient();
    model.toast = null;
    if (model.pendencies.length) {
      model.overlay = "closure";
      model.emailValue = "";
      model.emailError = "";
      model.pinValue = "";
      model.pinError = "";
      return render();
    }
    model.view = "result";
    model.completedTime = timestamp();
    render(null);
  };

  const release = () => {
    if (!/.+@.+\..+/.test(model.emailValue)) {
      model.emailError = "Enter the supervisor email.";
      return render("email");
    }
    model.emailError = "";
    if (model.pinValue !== SUPERVISOR_PIN) {
      model.pinError = "Incorrect supervisor PIN. Try again.";
      model.pinValue = "";
      return render("pin");
    }
    model.released += model.pendencies.length;
    model.pendencies = [];
    model.packages = model.packages.map((item) => ({ id: item.id }));
    model.overlay = null;
    model.pinError = "";
    model.emailError = "";
    model.view = "result";
    model.completedTime = timestamp();
    render(null);
  };

  const keepPacking = () => {
    model.overlay = null;
    model.emailValue = "";
    model.emailError = "";
    model.pinValue = "";
    model.pinError = "";
    showToast("IconNoticeColored", "TO remains in Packing");
    render();
  };

  const resetTask = (fresh) => {
    model.view = "scan";
    model.overlay = null;
    model.feedback = { state: "default" };
    model.released = 0;
    if (fresh) {
      model.packages = [];
      model.pendencies = [];
      model.removed = [];
      model.createdTime = timestamp();
    }
    render();
  };

  const actions = {
    complete: completeTask,
    rescan: () => {
      const input = root.querySelector('[data-input="rescan"]');
      // The hardware trigger reads the package in hand; an empty field means the flagged package was re-scanned.
      confirmRescan((input && input.value.trim().toUpperCase()) || model.alert.id);
    },
    "dismiss-alert": dismissAlert,
    "close-removed": () => {
      model.overlay = null;
      model.alert = null;
      render();
    },
    "open-pendencies": () => {
      clearTransient();
      model.toast = null;
      model.overlay = "pendency-sheet";
      render();
    },
    "close-overlay": () => {
      model.overlay = null;
      render();
    },
    "keep-packing": keepPacking,
    release,
    reopen: () => resetTask(false),
    "new-task": () => resetTask(true)
  };

  const bind = () => {
    root.querySelectorAll("[data-action]").forEach((element) => {
      const handler = actions[element.dataset.action];
      if (!handler) return;
      element.addEventListener("click", handler);
      if (element.getAttribute("role") === "button") {
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handler();
          }
        });
      }
    });

    root.querySelector('[data-input="scan"]')?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") scanPackage(event.currentTarget.value);
    });

    const rescanInput = root.querySelector('[data-input="rescan"]');
    rescanInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") confirmRescan(event.currentTarget.value.trim().toUpperCase() || model.alert.id);
    });

    const syncRelease = () => {
      const releaseButton = root.querySelector('[data-action="release"]');
      if (releaseButton) releaseButton.disabled = !(model.pinValue.length === 6 && /.+@.+\..+/.test(model.emailValue));
    };

    const emailInput = root.querySelector('[data-input="email"]');
    emailInput?.addEventListener("input", (event) => {
      model.emailValue = event.currentTarget.value.trim();
      syncRelease();
    });
    emailInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") root.querySelector('[data-input="pin"]')?.focus();
    });

    const pinInput = root.querySelector('[data-input="pin"]');
    pinInput?.addEventListener("input", (event) => {
      const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
      event.currentTarget.value = digits;
      model.pinValue = digits;
      syncRelease();
    });
    pinInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && model.pinValue.length === 6) release();
    });

    root.querySelector('[data-input="label"]')?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.currentTarget.value.trim()) resetTask(true);
    });

    // Tapping the dimmed mask does not dismiss Cross-Check: closing must be an explicit, recorded choice.
    root.querySelector('[data-cc-overlay="pendency-sheet"]')?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) actions["close-overlay"]();
    });
  };

  root.dataset.prdPrototype = "cross-check";
  (seeds[initialState] || seeds.scan)();
  render(model.overlay ? undefined : null);

  // Preview-only scanner hooks used by the review toolbar outside the PDA canvas.
  window.CrossCheckPrototype = {
    scanCorrect: () => scanPackage(nextCorrectId()),
    rescanFlagged: () => model.overlay === "alert" && actions.rescan(),
    scanWrong: () => scanPackage(nextWrongId()),
    pin: SUPERVISOR_PIN,
    toNumber: TO_NUMBER,
    toDestination: TO_DESTINATION,
    load: (state) => {
      clearTimeout(toastTimer);
      Object.assign(model, freshModel());
      (seeds[state] || seeds.scan)();
      render(model.overlay ? undefined : null);
    },
    refresh: () => render(null)
  };
  const mountedNavigation = document.querySelector("[data-preview-navigation]");
  if (mountedNavigation && window.SpxPdaNavigation) {
    mountedNavigation.remove();
    window.SpxPdaNavigation.mount();
  }
})();
