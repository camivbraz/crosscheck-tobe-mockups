// Compatibility entrypoint: a classic script keeps file:// design previews usable without a server.
(function () {
  "use strict";

  const rendererScriptUrl = document.currentScript ? document.currentScript.src : "";

  const icon = (name, size) =>
    `<span class="ssc-icon${size ? ` is-${size}` : ""}" data-component="Icon" data-icon="${name}" aria-hidden="true"></span>`;

  const button = (label, primary, iconName, disabled, options = {}) =>
    `<button class="ssc-button${primary ? " is-primary" : ""}${options.variant === "neutral" ? " is-neutral" : ""}${options.iconOnly ? " is-icon-only" : ""}${options.tertiary ? " is-tertiary" : ""}" data-component="Button"${disabled ? " disabled" : ""}${options.iconOnly ? ` aria-label="${label}"` : ""}>${iconName ? icon(iconName, options.iconSize || 20) : ""}${options.iconOnly ? "" : `<span>${label}</span>`}${options.trailingIcon ? icon(options.trailingIcon, 20) : ""}</button>`;

  const navbar = (title, actionIcon) => `
    <div class="ssc-statusbar" data-module="SystemStatusBar" aria-label="PDA system status"></div>
    <nav class="ssc-navbar" data-component="Navbar" data-title-position="left">
      <button class="ssc-navbar-action" data-component="Button" aria-label="Back">${icon("IconBack", 24)}</button>
      <div class="ssc-navbar-title">${title}</div>
      <button class="ssc-navbar-action${actionIcon ? "" : " is-empty"}" data-component="Button" aria-label="${actionIcon ? "Page action" : "No action"}">${actionIcon ? icon(actionIcon, 24) : ""}</button>
    </nav>`;

  const lifecycleTabs = (labels, active) => `
    <div class="spx-lifecycle-tabs" data-component="Tabs" data-module="TaskLifecycleTabs">
      ${labels.map((label, index) => `<button class="spx-lifecycle-tab${index === active ? " is-active" : ""}" data-component="Tab">${label}</button>`).join("")}
    </div>`;

  const categoryTabs = (labels, active) =>
    labels && labels.length
      ? `<div class="spx-category-tabs" data-component="Tabs">
          ${labels.map((label, index) => `<button class="spx-category-tab${index === active ? " is-active" : ""}" data-component="Tab">${label}</button>`).join("")}
        </div>`
      : "";

  const scanInput = (placeholder, options = {}) => `
    <div class="spx-scan-input" data-component="Input">
      ${icon("IconBarcodeOutline", 20)}
      <span class="spx-scan-input-value${options.focused ? " is-focused" : ""}">${placeholder}</span>
      ${options.hideMethod ? "" : `<button class="spx-scan-input-action" data-component="Button" aria-label="Choose scan method">${icon("IconMethodOutline", 20)}</button>`}
    </div>`;

  const scanFeedback = (state, message, detail) => {
    const stateClass = state === "success" ? " is-success" : state === "error" ? " is-error" : "";
    const stateIcon = state === "success" ? "IconSuccessFeedback" : state === "error" ? "IconHardBlock" : "IconScanResultDefault";
    const feedbackCopy =
      state === "success" || state === "error"
        ? `<span class="spx-feedback-copy"><strong>${message || "Scan failed"}</strong><span>${detail || ""}</span></span>`
        : `<span>${message || "Scan Result"}</span>`;
    return `<div class="spx-scan-feedback${stateClass}" data-module="ScanFeedback" data-feedback-state="${state || "default"}">
      ${icon(stateIcon, 42)}
      ${feedbackCopy}
    </div>`;
  };

  const scanCard = (placeholder, feedback, message, detail, options = {}) => `
    <section class="spx-scan-card" data-module="ScanWorkspace">
      ${scanInput(placeholder, options)}
      ${scanFeedback(feedback, message, detail)}
    </section>`;

  const labelCopy = (label) =>
    label.endsWith("*")
      ? `${label.slice(0, -1)}<span class="spx-required">*</span>`
      : label;

  const valueCopy = (value) => {
    const [copy, action] = value.split(/\s+·\s+/);
    return action
      ? `<span>${copy}</span><span class="spx-inline-action">${action}</span>`
      : `<span>${value}</span>`;
  };

  const listCell = (label, value, affordance) => `
    <div class="ssc-list-cell" data-component="ListCell">
      <span class="ssc-list-label">${labelCopy(label)}</span>
      <span class="ssc-list-value">${valueCopy(value)}</span>
      ${affordance === "arrow" ? icon("IconArrowRightOutline", 16) : ""}
      ${affordance === "edit" ? icon("IconEditOutline", 20) : ""}
    </div>`;

  const contextCard = (rows) =>
    rows && rows.length
      ? `<section class="ssc-card spx-context-card" data-module="TaskContextCard">
          ${rows.map((row) => listCell(row[0], row[1], row[2])).join("")}
        </section>`
      : "";

  const emptyState = (copy) => `
    <div class="spx-empty-state" data-component="EmptyState">
      <div class="spx-empty-illustration">${icon("IconEmptyPda", 90)}</div>
      <span>${copy}</span>
    </div>`;

  const objectList = (items) =>
    items && items.length
      ? `<div class="spx-object-list" data-module="ScannedObjectList">
          ${items
            .map(
              (item) => `<div class="spx-object-row">
                <div class="spx-object-copy">
                  <span class="spx-object-id">${item.id}</span>
                  ${item.meta ? `<span class="spx-object-meta">${item.meta}</span>` : ""}
                </div>
                ${item.action === "input" ? icon("IconInputOutline", 20) : item.action === "edit" ? icon("IconEditOutline") : item.action === "arrow" ? icon("IconArrowRightOutline") : item.action === "none" ? "" : icon("IconDeleteOutline", item.iconSize)}
              </div>`
            )
            .join("")}
        </div>`
      : "";

  const destinationList = (items) =>
    items && items.length
      ? `<div class="spx-destination-list" data-module="DestinationProgressList">
          ${items
            .map(
              (item) => `<div class="spx-destination-card">
                <div class="spx-destination-head">
                  <span class="spx-destination-name">${item.id}</span>
                  <span class="spx-destination-progress"><strong>${item.progressValue}</strong> / ${item.progressTotal}</span>
                </div>
                <div class="spx-destination-metrics">
                  <span><strong>${item.primaryValue}</strong> ${item.primaryUnit}</span>
                  <span><strong>${item.secondaryValue}</strong> ${item.secondaryUnit}</span>
                  ${icon("IconArrowRightOutline", 16)}
                </div>
              </div>`
            )
            .join("")}
        </div>`
      : "";

  const summaryCard = (config) => `
    <section class="ssc-card spx-summary-card" data-module="AggregateMetricsCard">
      <h2 class="spx-summary-title">${config.identifier}</h2>
      <div class="spx-metric-row">
        <div class="spx-metric"><span class="spx-metric-value">${config.primaryValue}</span><span class="spx-metric-unit">${config.primaryUnit}</span></div>
        ${config.variant === "linehaul" ? icon("IconArrowRightOutline", 16) : ""}
        ${config.metricDivider ? '<span class="spx-metric-divider" aria-hidden="true"></span>' : ""}
        ${config.secondaryValue !== undefined ? `<div class="spx-metric"><span class="spx-metric-value">${config.secondaryValue}</span><span class="spx-metric-unit">${config.secondaryUnit}</span></div>` : ""}
      </div>
      ${
        config.categories && config.categories.length
          ? `<div class="spx-category-metrics${config.categories.length === 1 ? " is-single" : ""}">
              ${config.categories.map((entry) => `<div class="spx-category-metric"><span class="spx-category-label">${entry[0]}</span><span class="spx-category-value">${entry[1]}</span>${entry[2] === "info" ? icon("IconInfoOutline", 16) : ""}</div>`).join("")}
            </div>`
          : ""
      }
      ${config.variant === "linehaul" ? destinationList(config.items) : objectList(config.items)}
      ${!config.items || !config.items.length ? emptyState(config.emptyText || "Scan to add") : ""}
    </section>`;

  const countdownCard = (urgent) => `
    <section class="ssc-card spx-countdown-card${urgent ? " is-urgent" : ""}" data-module="DepartureCountdown">
      <div>
        <div class="spx-countdown-title">Time to Departure</div>
        <div class="spx-countdown-value">${urgent ? "00:08:23" : "01:22:23"}</div>
      </div>
      <div class="spx-std">
        <div class="spx-std-label">STD</div>
        <div class="spx-std-value">01 June 12:24</div>
        <span class="ssc-label ${urgent ? "is-error" : "is-info"}" data-component="Tag">${urgent ? "Attention" : "Scheduled"}</span>
      </div>
    </section>`;

  const sealedCountdownCard = (urgent) => `
    <section class="ssc-card spx-sealed-countdown-card${urgent ? " is-urgent" : ""}" data-module="DepartureCountdown">
      <div class="spx-sealed-timer">
        <div class="spx-sealed-countdown-title">${icon("IconTimeOutline", 16)}<span>Time to Departure</span></div>
        <div class="spx-sealed-countdown-value">
          <span class="spx-sealed-time-digit">01</span><span class="spx-sealed-time-colon">:</span>
          <span class="spx-sealed-time-digit">22</span><span class="spx-sealed-time-colon">:</span>
          <span class="spx-sealed-time-digit">23</span>
        </div>
      </div>
      <div class="spx-sealed-std">
        <span class="spx-sealed-std-label">STD</span>
        <span class="spx-sealed-std-value">01 June 12:24</span>
        <span class="ssc-label is-info" data-component="Tag">COT/MDT</span>
      </div>
    </section>`;

  const sealedAuditCard = (rows) => `
    <section class="ssc-card spx-sealed-audit-card" data-module="TaskAuditInfo">
      ${rows.map((row) => listCell(row[0], row[1])).join("")}
    </section>`;

  const sealedDestinationList = (items) => `
    <div class="spx-sealed-destination-list" data-module="DestinationLoadList">
      ${items
        .map(
          (item) => `<div class="spx-sealed-destination-card">
            <div class="spx-sealed-destination-name">${item.id}</div>
            <div class="spx-sealed-destination-metrics">
              <span><strong>${item.primaryValue}</strong><small>${item.primaryUnit}</small></span>
              <i aria-hidden="true"></i>
              <span><strong>${item.secondaryValue}</strong><small>${item.secondaryUnit}</small></span>
              ${item.direction === "right" ? icon("IconArrowRightOutline", 16) : item.direction === "down" ? icon("IconArrowDownOutline", 16) : ""}
            </div>
          </div>`
        )
        .join("")}
    </div>`;

  const sealedSummaryCard = (config) => `
    <section class="ssc-card spx-sealed-summary-card" data-module="AggregateMetricsCard">
      <div class="spx-sealed-summary-metrics">
        <div class="spx-sealed-primary-metric">
          <div class="spx-metric"><span class="spx-metric-value">${config.primaryValue}</span><span class="spx-metric-unit">${config.primaryUnit}</span></div>
          ${icon("IconArrowRightOutline", 16)}
        </div>
        <div class="spx-metric"><span class="spx-metric-value">${config.secondaryValue}</span><span class="spx-metric-unit">${config.secondaryUnit}</span></div>
      </div>
      <div class="spx-sealed-category-metrics">
        ${config.categories.map((entry) => `<div><span>${entry[0]}</span><strong>${entry[1]}</strong></div>`).join("")}
      </div>
      ${sealedDestinationList(config.items)}
    </section>`;

  const bottomActions = (actions) =>
    actions && actions.length
      ? `<div class="ssc-bottom-action-bar" data-module="TaskActionMatrix">
          ${actions.map((action) => button(action.label, action.primary, action.icon, action.disabled, action)).join("")}
        </div>`
      : "";

  const dialogOverlay = (overlay) => {
    if (!overlay) return "";
    if (overlay.type === "order-detail") {
      return `<div class="spx-overlay" data-component="Modal">
        <section class="spx-bottom-sheet" data-component="BottomSheet" data-module="OrderDetailSheet">
          <header class="spx-sheet-header"><h2 class="spx-sheet-title">Order Detail</h2><button class="ssc-navbar-action" data-component="Button">${icon("IconCloseOutline", 24)}</button></header>
          <div class="spx-sheet-body">${objectList(
            Array.from({ length: 11 }, () => ({
              id: "SPX202007131401W",
              action: "delete"
            }))
          )}</div>
        </section>
      </div>`;
    }
    if (overlay.type === "cage-confirm") {
      return `<div class="spx-overlay" data-component="Modal">
        <section class="spx-dialog is-cage-confirm" data-component="Dialog" data-module="CageLoadConfirmation">
          <div class="spx-dialog-content">
            ${icon("IconNoticeColored", 48)}
            <div class="spx-dialog-message">
              <h2 class="spx-dialog-title">Load onto Linehaul</h2>
              <p class="spx-dialog-description">Please load the whole cage onto vehicle.</p>
            </div>
          </div>
          <div class="spx-dialog-actions">${button("OK", false)}</div>
        </section>
      </div>`;
    }
    if (overlay.type === "cage-disposition") {
      return `<div class="spx-overlay" data-component="Modal">
        <section class="spx-dialog is-cage-disposition" data-component="Dialog" data-module="CageTransferDisposition">
          <div class="spx-dialog-content">
            <div class="spx-dialog-message">
              <h2 class="spx-dialog-title">${overlay.detached ? "Where this cage going ?" : "Complete Cage"}</h2>
              <p class="spx-dialog-copy">Select how this cage will be used after packing.You can modify this via Cage Management before Linehaul Loading.</p>
            </div>
            <div class="spx-radio-group" role="radiogroup" aria-label="Cage disposition">
              <label class="spx-radio-row" data-component="Radio">
                <input class="ssc-radio-control" type="radio" name="cage-disposition" value="reuse" checked>
                <span class="spx-radio-label">Reuse in Station ${icon("IconQuestionOutline", 16)}</span>
              </label>
              <label class="spx-radio-row" data-component="Radio">
                <input class="ssc-radio-control" type="radio" name="cage-disposition" value="linehaul">
                <span class="spx-radio-label">Load onto Linehaul ${icon("IconQuestionOutline", 16)}</span>
              </label>
            </div>
          </div>
          <div class="spx-dialog-actions">
            ${button("Cancel", false)}
            <span class="spx-dialog-action-divider" aria-hidden="true"></span>
            ${button("Confirm", false)}
          </div>
        </section>
        <div class="ssc-tooltip spx-cage-disposition-tooltip" data-component="Tooltip" role="tooltip">
          <div class="spx-tooltip-surface"><span>Cage stays at this station.Asset ID released</span> <span>when scanned at LH loading.</span></div>
          <span class="spx-tooltip-pointer" aria-hidden="true"></span>
        </div>
      </div>`;
    }
    return "";
  };

  const taskCard = (item) => `
    <article class="ssc-card spx-task-card" data-module="TaskListCard">
      <div class="spx-task-card-main">
        <span class="spx-task-card-id">${item.id}</span>
        ${item.tag ? `<span class="spx-task-type-tag" data-component="Tag">${item.tag}</span>` : ""}
        ${icon("IconArrowRightOutline")}
      </div>
      <div class="spx-task-card-meta">${item.meta.map((copy) => `<span>${copy}</span>`).join("")}</div>
    </article>`;

  const taskListScreen = (config) => `
    ${navbar(config.title, "IconSearchOutline")}
    ${config.searchPlaceholder ? `<div class="spx-scan-card">${scanInput(config.searchPlaceholder, { hideMethod: config.searchMethod === false })}</div>` : ""}
    ${categoryTabs(config.categories, 0)}
    ${lifecycleTabs(config.lifecycle, 0)}
    <div class="ssc-page-body has-bottom-actions">
      <div class="spx-task-list" data-template="scan-task-list" data-module="ScanTaskList">
        ${config.items.map(taskCard).join("")}
      </div>
    </div>
    ${bottomActions(config.actions)}
    ${config.toast ? `<div class="spx-toast" data-component="Toast">${icon("IconCreateSuccessToast", 36)}<span>${config.toast}</span></div>` : ""}`;

  const resultActions = (actions) => `
    <div class="spx-result-actions" data-module="TaskActionMatrix">
      ${actions.map((action) => button(action.label, action.primary === true, action.icon, action.disabled, action)).join("")}
    </div>`;

  const operationStatus = (status) => `
    <section class="spx-operation-status" data-module="TaskCompletionSummary">
      ${icon("IconSuccessInfoColored", 24)}
      <span>${status}</span>
    </section>`;

  const operationScreen = (config) => `
    ${navbar(config.title)}
    ${config.topStatus ? operationStatus(config.topStatus) : ""}
    ${config.topActions ? resultActions(config.topActions) : ""}
    <div class="ssc-page-body${config.actions && config.actions.length ? " has-bottom-actions" : ""}">
      ${scanCard(config.scanPlaceholder, config.feedback, config.feedbackMessage, config.feedbackDetail, { focused: config.scanFocused === true })}
      ${config.countdown ? countdownCard(config.countdown === "urgent") : ""}
      ${contextCard(config.context)}
      ${summaryCard(config.summary)}
    </div>
    ${bottomActions(config.actions)}
    ${dialogOverlay(config.overlay)}`;

  const sealedScreen = (config) => `
    ${navbar(config.title)}
    ${operationStatus(config.topStatus)}
    ${resultActions(config.topActions)}
    <div class="ssc-page-body spx-sealed-page-body">
      ${sealedCountdownCard(config.countdown === "urgent")}
      ${sealedAuditCard(config.audit)}
      ${sealedSummaryCard(config.summary)}
    </div>`;

  const departedScreen = (config) => `
    ${navbar(config.title)}
    <div class="spx-departed-header">
      <section class="spx-departed-status" data-module="TaskCompletionSummary">
        ${icon("IconSuccessCompleted", 24)}
        <span>${config.status}</span>
      </section>
      <div class="spx-departed-actions" data-module="TaskActionMatrix">
        ${button("Print", false, "IconPrintOutline", false, { iconSize: 20 })}
      </div>
    </div>
    <div class="ssc-page-body spx-departed-page-body">
      ${sealedAuditCard(config.audit)}
      ${sealedSummaryCard(config.summary)}
    </div>`;

  const countdownFooter = (urgent) => `
    <div class="spx-countdown-footer" data-module="DepartureCountdownFooter">
      ${sealedCountdownCard(urgent)}
      ${button("To Seal", true)}
    </div>`;

  const countdownFooterScreen = (config) => `
    ${navbar(config.title)}
    <div class="ssc-page-body spx-countdown-footer-page-body">
      ${scanCard(config.scanPlaceholder, config.feedback)}
      ${contextCard(config.context)}
      ${summaryCard(config.summary)}
    </div>
    ${countdownFooter(config.countdown === "urgent")}`;

  const resultScreen = (config) => `
    ${navbar(config.title)}
    <div class="ssc-page-body spx-result-page-body">
      <section class="spx-completed-header" data-module="TaskCompletionSummary">${icon("IconSuccessCompleted", 24)}<span>${config.status || "Completed"}</span></section>
      ${config.actions && config.actions.length ? resultActions(config.actions) : ""}
      <div class="spx-result-content">
        ${config.scanPlaceholder ? `<section class="spx-scan-card">${scanInput(config.scanPlaceholder, { hideMethod: config.scanMethod === false, focused: config.scanFocused === true })}<p class="spx-sheet-helper">${config.scanHelper || ""}</p></section>` : ""}
        ${contextCard(config.audit)}
        ${summaryCard(config.summary)}
      </div>
    </div>`;

  const selectSheet = (selected) => `
    <div class="spx-overlay" data-component="Modal">
      <section class="spx-bottom-sheet" data-component="BottomSheet" data-module="CageTypeSheet">
        <header class="spx-sheet-header"><h2 class="spx-sheet-title">Select Cage Type</h2>${icon("IconCloseOutline", 24)}</header>
        <div class="spx-sheet-body">
          ${Array.from({ length: 9 }, (_, index) => `<label class="spx-radio-row" data-component="Radio"><input class="ssc-radio-control" type="radio" name="cage-type" value="option-${index + 1}"${index === selected ? " checked" : ""}><span>Option1</span></label>`).join("")}
          ${Array.from({ length: 3 }, () => '<div class="spx-sheet-choice-label">Pack Type1</div>').join("")}
        </div>
      </section>
    </div>`;

  const bindSheet = (allowLater) => `
    <div class="spx-overlay" data-component="Modal">
      <section class="spx-bottom-sheet${allowLater ? " is-bind-later" : ""}" data-component="BottomSheet" data-module="CageAssetBinding">
        <header class="spx-sheet-header"><h2 class="spx-sheet-title">${allowLater ? "Bind CageAsset ID" : "Bind Cage Asset ID"}</h2>${allowLater ? icon("IconCloseOutline", 24) : ""}</header>
        <div class="spx-sheet-body">
          ${scanInput("Cage Asset ID", { hideMethod: allowLater, focused: allowLater })}
          <p class="spx-sheet-helper">${allowLater ? "Bind a Cage Asset ID to enable asset tracking." : "This Cage requires Cage Asset ID before Create. Scan or input Cage Asset ID to continue."}</p>
        </div>
        <div class="spx-sheet-actions">${button(allowLater ? "Bind Later" : "Cancel", false)}${button("Confirm", true, null, true)}</div>
        ${allowLater ? '<div class="spx-keyboard-viewport" data-module="SystemKeyboard"><img src="../assets/images/create-cage-keyboard.png" alt="System numeric keyboard"></div>' : ""}
      </section>
    </div>`;

  const createCageScreen = (config) => `
    ${navbar("Create Cage")}
    <p class="spx-form-helper">Please scan the Grid ID and&nbsp; new TO Number for replacement.</p>
    <div class="ssc-page-body has-bottom-actions">
      <section class="ssc-card spx-create-cage-form" data-template="create-cage" data-module="CageAssetBinding">
        <div class="spx-form-row" data-component="Select"><span class="spx-form-label">Cage Type<span class="spx-required">*</span></span><span class="spx-form-control spx-select-control"><span class="spx-form-value${config.type ? "" : " is-placeholder"}">${config.type || "Select"}</span>${icon("IconArrowDownOutline")}</span></div>
        ${config.sheet === "type" || config.sheet === "bind-later" ? '<div class="spx-form-row spx-flat-value-row" data-component="ListCell"><span class="spx-form-label">Cage ID</span><span class="spx-form-value">CG0001</span></div>' : ""}
        <div class="spx-form-row" data-component="Input"><span class="spx-form-label">${config.sheet === "type" ? "Sack" : "Cage"} Asset ID<span class="spx-required">*</span></span><span class="spx-form-control spx-asset-control"><span class="spx-form-value">${config.asset || "-"}</span><button class="ssc-button spx-inline-action" data-component="Button"${config.ready ? "" : " disabled"}>${config.asset ? "Rebind" : "Bind Asset"}</button></span></div>
      </section>
    </div>
    ${bottomActions([{ label: "Confirm", primary: true, disabled: !config.ready }])}
    ${config.sheet === "type" ? selectSheet(0) : config.sheet === "bind-required" ? bindSheet(false) : config.sheet === "bind-later" ? bindSheet(true) : ""}`;

  const sharedReceivingItems = [
    { id: "SPX202007131401W", action: "edit" },
    { id: "SPX202007131402W", action: "edit" },
    { id: "SPX202007131403W", action: "edit" },
    { id: "SPX202007131404W", action: "edit" }
  ];

  const activeReceivingItems = Array.from({ length: 4 }, () => ({
    id: "SPX202007131401W",
    action: "input"
  }));

  const completedReceivingItems = Array.from({ length: 7 }, () => ({
    id: "SPX202007131401W",
    action: "none"
  }));

  const activeMassReceivingItems = Array.from({ length: 3 }, () => ({
    id: "TO202007131401W",
    action: "none"
  }));

  const sharedToItems = Array.from({ length: 4 }, () => ({
    id: "SPX202007131401W",
    action: "delete"
  }));

  const sharedCageItems = [
    { id: "TO202007131401W", meta: "6 Orders", action: "delete" },
    { id: "TO202007131402W", meta: "6 Orders", action: "delete" },
    { id: "TO202007131403W", meta: "20 Orders", action: "delete" }
  ];

  const activeCageItems = [
    { id: "TO202007131401W", meta: "6 Orders", action: "delete", iconSize: 20 },
    { id: "TO202007131401W", meta: "6 Orders", action: "delete", iconSize: 20 },
    { id: "TO202007131401W", meta: "6 Orders", action: "delete", iconSize: 20 },
    { id: "SPXID202007131401W", meta: "-", action: "delete", iconSize: 20 },
    { id: "TO202007131401W", meta: "6 Orders", action: "delete", iconSize: 20 }
  ];

  const completedCageItems = [
    { id: "TO202007131401W", meta: "6 Orders", action: "none" },
    { id: "TO202007131401W", meta: "6 Orders", action: "none" },
    { id: "TO202007131401W", meta: "6 Orders", action: "none" },
    { id: "SPXID202007131401W", meta: "-", action: "none" },
    { id: "TO202007131401W", meta: "6 Orders", action: "delete", iconSize: 20 }
  ];

  const linehaulSummary = (loaded) => ({
    variant: "linehaul",
    identifier: "LH202406010024",
    primaryValue: loaded ? "16/20" : "15/20",
    primaryUnit: "TO(s)",
    secondaryValue: loaded ? "12.00" : "11.00",
    secondaryUnit: "kg",
    categories: [["Exception Order", "0"]],
    items: [
      {
        id: "To Bandung Hub",
        progressValue: "4000",
        progressTotal: "8000 Order",
        primaryValue: loaded ? "16" : "15",
        primaryUnit: "TO(s)",
        secondaryValue: loaded ? "208" : "200",
        secondaryUnit: "Order(s)"
      },
      {
        id: "To Korol Hub",
        progressValue: "4000",
        progressTotal: "8000 Order",
        primaryValue: loaded ? "5" : "4",
        primaryUnit: "TO(s)",
        secondaryValue: loaded ? "24" : "20",
        secondaryUnit: "Order(s)"
      },
      {
        id: "To Cakung Hub",
        progressValue: "3000",
        progressTotal: "6000 Order",
        primaryValue: "3",
        primaryUnit: "TO(s)",
        secondaryValue: "15",
        secondaryUnit: "Order(s)"
      }
    ]
  });

  const sealedLinehaulAudit = [
    ["Dock Name", "Dock_1"],
    ["Operator", "kaibin.liu@shopee.com"],
    ["Created Time", "2024-03-20 12:00"],
    ["Completed Time", "2024-03-20 14:00"]
  ];

  const sealedLinehaulSummary = {
    primaryValue: "20/20",
    primaryUnit: "TO(s)",
    secondaryValue: "12.00",
    secondaryUnit: "kg",
    categories: [["High Value", "0"], ["Liquidation TO", "0"], ["Disposal TO", "0"]],
    items: [
      { id: "To Bandung Hub (4/100)", primaryValue: "4", primaryUnit: "TO(s)", secondaryValue: "20", secondaryUnit: "Order(s)", direction: "right" },
      { id: "To Cakung Hub (12/100)", primaryValue: "3", primaryUnit: "TO(s)", secondaryValue: "15", secondaryUnit: "Order(s)", direction: "down" },
      { id: "To Bandung Hub", primaryValue: "16", primaryUnit: "TO(s)", secondaryValue: "80", secondaryUnit: "Order(s)" }
    ]
  };

  const configs = {
    "receiving-task-list": {
      kind: "task-list",
      taskListVariant: "receiving",
      title: "Receive",
      categories: ["Normal Receive", "Pickup Handover", "Manifest Receive"],
      lifecycle: ["Created(4)", "Doing(2)", "Done(2)"],
      items: Array.from({ length: 8 }, () => ({
        id: "RT2020090710A01",
        tag: "Single",
        meta: ["2022-07-09 18:53:09"]
      })),
      actions: [{ label: "Mass Receive" }, { label: "Single Receive", primary: true }]
    },
    "to-packing-task-list": {
      kind: "task-list",
      taskListVariant: "to-packing",
      title: "Pack TO",
      categories: ["Normal TO", "Ad hoc TO", "Non-Integrated 3PL"],
      lifecycle: ["Created(4)", "Doing(2)", "Done(2)"],
      items: Array.from({ length: 4 }, () => ({
        id: "TO2020090710A01",
        tag: "Pack1",
        meta: ["2022-07-09 18:53:09"]
      })),
      actions: [{ label: "Scan TO Label" }, { label: "Create Task", primary: true }]
    },
    "cage-task-list": {
      kind: "task-list",
      taskListVariant: "cage-packing",
      title: "Pack Cage",
      searchPlaceholder: "Scan Cage ID",
      searchMethod: false,
      lifecycle: ["Created(4)", "Packing(4)", "Packed(2)"],
      items: [{ id: "CG01", meta: ["Create Time: 01/31/2024", "Cage Type: Inbound"] }],
      actions: [{ label: "Create", primary: true }]
    },
    "cage-task-list-created": {
      kind: "task-list",
      taskListVariant: "cage-packing",
      title: "Pack Cage",
      searchPlaceholder: "Scan Cage ID",
      searchMethod: false,
      lifecycle: ["Created(4)", "Packing(4)", "Packed(2)"],
      items: [
        { id: "CG0001", meta: ["Create Time: 01/31/2024", "Cage Type: Outbound"] },
        { id: "CG01", meta: ["Create Time: 01/31/2024", "Cage Type: Inbound"] }
      ],
      actions: [{ label: "Create", primary: true }],
      toast: "Create Successful"
    },
    "linehaul-outbound-idle": {
      kind: "operation",
      title: "Outbound",
      scanPlaceholder: "TO Number",
      feedback: "default",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(false),
      actions: [{ label: "To Seal", primary: true }]
    },
    "linehaul-outbound-scan-success": {
      kind: "operation",
      title: "Outbound",
      scanPlaceholder: "TO Number",
      feedback: "success",
      feedbackMessage: "Scanned Success.",
      feedbackDetail: "TO202203210A1 at 2023-11-23 12:00",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(true),
      actions: [{ label: "To Seal", primary: true }]
    },
    "linehaul-outbound-hard-block": {
      kind: "operation",
      title: "Outbound",
      scanPlaceholder: "TO Number",
      feedback: "error",
      feedbackMessage: "The item should only be loaded when the loading station is Station X",
      feedbackDetail: "TO2024082100A1 at 2023-11-23 12:00",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(false),
      actions: [{ label: "To Seal", primary: true }]
    },
    "linehaul-outbound-cage-confirm": {
      kind: "operation",
      title: "Outbound",
      scanPlaceholder: "SPX TN/TO/Cage",
      feedback: "success",
      feedbackMessage: "Scanned Success.",
      feedbackDetail: "CG0004 at 2023-11-23 12:00",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(true),
      actions: [{ label: "To Seal", primary: true }],
      overlay: { type: "cage-confirm" }
    },
    "linehaul-outbound-ready-to-seal": {
      kind: "operation",
      title: "Outbound",
      scanPlaceholder: "TO Number",
      feedback: "default",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(true),
      actions: [{ label: "To Seal", primary: true }]
    },
    "linehaul-outbound-order-detail": {
      kind: "operation",
      title: "Outbound",
      scanPlaceholder: "TO Number",
      feedback: "default",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(true),
      actions: [{ label: "To Seal", primary: true }],
      overlay: { type: "order-detail" }
    },
    "linehaul-outbound-sealed": {
      kind: "sealed",
      title: "Outbound",
      topStatus: "Trip Sealed",
      topActions: [
        { label: "Departed", variant: "neutral" },
        { label: "Unseal", variant: "neutral" },
        { label: "Print", icon: "IconPrintOutline", iconOnly: true, variant: "neutral" }
      ],
      countdown: "normal",
      audit: sealedLinehaulAudit,
      summary: sealedLinehaulSummary
    },
    "linehaul-outbound-countdown-normal": {
      kind: "countdown-footer",
      title: "Outbound",
      scanPlaceholder: "TO Number",
      feedback: "default",
      context: [["Dock Name*", "Dock Name1", "arrow"]],
      summary: linehaulSummary(false),
      countdown: "urgent"
    },
    "linehaul-outbound-countdown-urgent": {
      kind: "sealed",
      title: "Outbound",
      topStatus: "Trip Sealed",
      topActions: [
        { label: "Departed", variant: "neutral" },
        { label: "Unseal", variant: "neutral" },
        { label: "Print", icon: "IconPrintOutline", iconOnly: true, variant: "neutral" }
      ],
      countdown: "urgent",
      audit: sealedLinehaulAudit,
      summary: sealedLinehaulSummary
    },
    "linehaul-outbound-departed": {
      kind: "departed",
      title: "Outbound",
      status: "Trip Departed",
      audit: sealedLinehaulAudit,
      summary: sealedLinehaulSummary
    },
    "receiving-by-order-empty": {
      kind: "operation",
      title: "Receive By Order",
      scanPlaceholder: "SPX TN",
      feedback: "default",
      summary: {
        identifier: "RT2020091510B4K",
        primaryValue: "0",
        primaryUnit: "Order(s)",
        categories: [["Forward Order", "0"], ["Return Order", "0"], ["Exception Order", "0"]],
        items: [],
        emptyText: 'Scan order to receive or change to <span class="spx-empty-link">Receive By TO/Driver/Manifest</span>'
      },
      actions: []
    },
    "receiving-by-order-active": {
      kind: "operation",
      title: "Receive By Order",
      scanPlaceholder: "SPX TN",
      feedback: "default",
      summary: {
        identifier: "RT2020091510B4K",
        primaryValue: "4",
        primaryUnit: "Order(s)",
        categories: [["Forward Order", "4"], ["Return Order", "0"], ["Exception Order", "0"]],
        items: activeReceivingItems
      },
      actions: [{ label: "Complete", primary: true }]
    },
    "receiving-mass-empty": {
      kind: "operation",
      title: "Mass Receive",
      scanPlaceholder: "TO Number",
      feedback: "default",
      summary: {
        identifier: "RT2020091510B4K",
        primaryValue: "0",
        primaryUnit: "TO(s)",
        secondaryValue: "0",
        secondaryUnit: "Order(s)",
        metricDivider: true,
        categories: [["Disposal TO(s)", "0"], ["Liquidation TO(s)", "0", "info"]],
        items: [],
        emptyText: "There is no bag in this task, please scan the barcode"
      },
      actions: []
    },
    "receiving-mass-active": {
      kind: "operation",
      title: "Mass Receive",
      scanPlaceholder: "TO Number",
      feedback: "default",
      summary: {
        identifier: "RT2020091510B4K",
        primaryValue: "3",
        primaryUnit: "TO(s)",
        secondaryValue: "45",
        secondaryUnit: "Order(s)",
        metricDivider: true,
        categories: [["Disposal TO(s)", "0"], ["Liquidation TO(s)", "0", "info"]],
        items: activeMassReceivingItems
      },
      actions: [{ label: "Complete", primary: true }]
    },
    "receiving-by-order-completed": {
      kind: "result",
      title: "Receive By Order",
      actions: [{ label: "Print" }, { label: "Add New Task", icon: "IconAddOutline" }],
      audit: [["Operator", "kaibin.liu@shopee.com"], ["Created Time", "2024-03-20 12:00"], ["Completed Time", "2024-03-20 14:00"]],
      summary: {
        identifier: "RT232311235BBTW",
        primaryValue: "45",
        primaryUnit: "Order(s)",
        categories: [["Forward Order", "4"], ["Return Order", "0"], ["Exception Order", "0"], ["Disposal Order", "0"]],
        items: completedReceivingItems
      }
    },
    "receiving-mass-completed": {
      kind: "result",
      title: "Mass Receive",
      actions: [{ label: "Print" }, { label: "Create New Task", icon: "IconAddOutline" }],
      audit: [["Operator", "kaibin.liu@shopee.com"], ["Created Time", "2024-03-20 12:00"], ["Completed Time", "2024-03-20 14:00"]],
      summary: {
        identifier: "RT232311235BBTW",
        primaryValue: "3",
        primaryUnit: "TO(s)",
        secondaryValue: "45",
        secondaryUnit: "Order(s)",
        categories: [["Disposal TO(s)", "0"], ["Liquidation TO(s)", "0", "info"]],
        items: activeMassReceivingItems
      }
    },
    "to-packing-empty": {
      kind: "operation",
      title: "Pack Normal TO",
      scanPlaceholder: "SPX TN",
      feedback: "default",
      context: [["TO Pack*", "Bag", "arrow"], ["Receiver", "-"], ["Shipment Number", "-"]],
      summary: {
        identifier: "TO2020091510B4K",
        primaryValue: "0",
        primaryUnit: "Order(s)",
        secondaryValue: "0.00",
        secondaryUnit: "kg",
        categories: [["Forward Order...", "0"], ["HV Order", "0"], ["NDD Order", "0"], ["Return Order", "0"]],
        items: [],
        emptyText: "Scan to add to TO"
      },
      actions: []
    },
    "to-packing-active-rfid": {
      kind: "operation",
      title: "Pack Normal TO",
      scanPlaceholder: "SPX TN",
      feedback: "default",
      context: [["TO Pack*", "Bag", "arrow"], ["Receiver", "Test SOC"]],
      summary: {
        identifier: "TO2020091510B4K",
        primaryValue: "12",
        primaryUnit: "Order(s)",
        secondaryValue: "6.20",
        secondaryUnit: "kg",
        categories: [["Forward Order...", "12"], ["HV Order", "0"], ["NDD Order", "0"], ["Return Order", "0"]],
        items: sharedToItems
      },
      actions: [{ label: "Scan RFID" }, { label: "Complete", primary: true }]
    },
    "to-packing-empty-context": {
      kind: "operation",
      title: "Pack Normal TO",
      scanPlaceholder: "SPX TN",
      feedback: "default",
      context: [["TO Pack*", "Bag", "arrow"], ["Receiver", "-"]],
      summary: {
        identifier: "TO2020091510B4K",
        primaryValue: "0",
        primaryUnit: "Order(s)",
        secondaryValue: "0.00",
        secondaryUnit: "kg",
        categories: [["Forward Order...", "0"], ["HV Order", "0"], ["NDD Order", "0"], ["Return Order", "0"]],
        items: [],
        emptyText: "Scan to add to TO"
      },
      actions: []
    },
    "to-packing-active-print": {
      kind: "operation",
      title: "Pack Normal TO",
      scanPlaceholder: "SPX TN",
      feedback: "default",
      context: [["TO Pack*", "Bag", "arrow"], ["Receiver", "Test SOC"]],
      summary: {
        identifier: "TO2020091510B4K",
        primaryValue: "12",
        primaryUnit: "Order(s)",
        secondaryValue: "6.20",
        secondaryUnit: "kg",
        categories: [["Forward Order...", "0"], ["HV Order", "0"], ["NDD Order", "0"], ["Return Order", "0"]],
        items: sharedToItems
      },
      actions: [{ label: "Print", tertiary: true, trailingIcon: "IconArrowDownOutline" }, { label: "Complete", primary: true }]
    },
    "to-packing-completed": {
      kind: "result",
      title: "Pack Normal TO",
      actions: [{ label: "Print" }, { label: "Reopen" }, { label: "Create New Task", icon: "IconAddOutline" }],
      scanPlaceholder: "Scan TO Label",
      scanMethod: false,
      scanHelper: "Scan TO label to start.",
      audit: [["Receiver", "Test SOC"], ["TO Pack", "Nylon Bag"], ["Shipment Number", "1213123"], ["Operator", "kaibin.liu@shopee.com"], ["Created Time", "2024-03-20 12:00"], ["Completed Time", "2024-03-20 14:00"]],
      summary: {
        identifier: "TO232311235BBTW",
        primaryValue: "45",
        primaryUnit: "Order(s)",
        secondaryValue: "12.00",
        secondaryUnit: "kg",
        categories: [["Forward Order...", "45"], ["HV Order", "0"], ["NDD Order", "0"], ["Return Order", "0"]],
        items: completedReceivingItems
      }
    },
    "cage-packing-empty": {
      kind: "operation",
      title: "Add to Cage",
      scanPlaceholder: "TO Number or SPX TN",
      scanFocused: true,
      feedback: "default",
      context: [["Cage Type*", "Outbound", "arrow"], ["Cage Asset ID*", "CGAS28324234 · Rebind"]],
      summary: {
        identifier: "CG01",
        primaryValue: "0",
        primaryUnit: "TO(s)",
        secondaryValue: "0",
        secondaryUnit: "Order(s)",
        items: [],
        emptyText: "Scan to add to cage"
      },
      actions: []
    },
    "cage-packing-active": {
      kind: "operation",
      title: "Add to Cage",
      scanPlaceholder: "TO Number or SPX TN",
      scanFocused: true,
      feedback: "default",
      context: [["Cage Type*", "Outbound"], ["Cage Asset ID*", "CGAS28324234 · Rebind"]],
      summary: {
        identifier: "CG01",
        primaryValue: "3",
        primaryUnit: "TO(s)",
        secondaryValue: "32",
        secondaryUnit: "Order(s)",
        items: activeCageItems
      },
      actions: [{ label: "Complete", primary: true }]
    },
    "cage-packing-complete-dialog": {
      kind: "operation",
      title: "Add to Cage",
      scanPlaceholder: "TO Number or SPX TN",
      scanFocused: true,
      feedback: "default",
      context: [["Cage Type*", "Outbound"], ["Cage Asset ID*", "CGAS28324234 · Rebind"]],
      summary: {
        identifier: "CG01",
        primaryValue: "3",
        primaryUnit: "TO(s)",
        secondaryValue: "32",
        secondaryUnit: "Order(s)",
        items: activeCageItems
      },
      actions: [{ label: "Complete", primary: true }],
      overlay: { type: "cage-disposition" }
    },
    "cage-packing-completed": {
      kind: "result",
      title: "Add to Cage",
      scanPlaceholder: "Scan Cage ID",
      scanFocused: true,
      scanMethod: false,
      scanHelper: "Scan or input cage id to start.",
      actions: [],
      audit: [["Cage Type", "Outbound"], ["Cage Asset ID", "CGAS28324234  ·  Rebind"], ["Transfer Type", "Load onto Linehaul", "edit"], ["Operator", "kaibin.liu@shopee.com"], ["Created Time", "2024-03-20 12:00"], ["Completed Time", "2024-03-20 14:00"]],
      summary: {
        identifier: "CG01",
        primaryValue: "3",
        primaryUnit: "TO(s)",
        secondaryValue: "32",
        secondaryUnit: "Order(s)",
        items: completedCageItems
      }
    },
    "create-cage-empty": { kind: "create-cage", ready: false },
    "create-cage-type-sheet": { kind: "create-cage", ready: false, sheet: "type" },
    "create-cage-bind-required-sheet": { kind: "create-cage", ready: false, sheet: "bind-required" },
    "create-cage-ready": { kind: "create-cage", ready: true, type: "Outbound", asset: "CGAS28324234" },
    "create-cage-bind-later-sheet": { kind: "create-cage", ready: false, sheet: "bind-later" }
  };

  const root = document.getElementById("app");
  const screenName = document.body.dataset.screen;
  const config = configs[screenName];

  if (!root || !config) {
    throw new Error(`Unknown SPX PDA screen: ${screenName || "missing"}`);
  }

  root.dataset.renderKind = config.kind;
  if (config.taskListVariant) root.dataset.taskListVariant = config.taskListVariant;

  if (config.kind === "task-list") root.innerHTML = taskListScreen(config);
  if (config.kind === "operation") root.innerHTML = operationScreen(config);
  if (config.kind === "sealed") root.innerHTML = sealedScreen(config);
  if (config.kind === "departed") root.innerHTML = departedScreen(config);
  if (config.kind === "countdown-footer") root.innerHTML = countdownFooterScreen(config);
  if (config.kind === "result") root.innerHTML = resultScreen(config);
  if (config.kind === "create-cage") root.innerHTML = createCageScreen(config);

  if (
    rendererScriptUrl &&
    window.self === window.top &&
    !new URLSearchParams(window.location.search).has("embed")
  ) {
    const navigationScript = document.createElement("script");
    navigationScript.src = new URL("spx-pda-navigation.js?v=20260801-28", rendererScriptUrl).href;
    document.body.appendChild(navigationScript);
  }
})();
