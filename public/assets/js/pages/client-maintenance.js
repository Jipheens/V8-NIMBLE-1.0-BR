(function (global) {
  if (global.__ClientMaintenanceLoaded) {
    console.warn("client-maintenance.js already loaded; skipping duplicate execution.");
    return;
  }
  global.__ClientMaintenanceLoaded = true;

const CLIENT_SCOPE = {
  INDIVIDUAL: "individual",
  CORPORATE: "corporate"
};

const CLIENT_TYPE_SCOPE_MAP = {
  B: [CLIENT_SCOPE.CORPORATE, "bank"],
  C: [CLIENT_SCOPE.CORPORATE],
  E: [CLIENT_SCOPE.INDIVIDUAL, "employee"],
  I: [CLIENT_SCOPE.INDIVIDUAL],
  M: [CLIENT_SCOPE.INDIVIDUAL, "minor"],
  N: [CLIENT_SCOPE.INDIVIDUAL, "nonresident"],
  G: [CLIENT_SCOPE.INDIVIDUAL, "group"],
  NC: [CLIENT_SCOPE.INDIVIDUAL, "nonclient"],
  default: [CLIENT_SCOPE.INDIVIDUAL]
};

const RELATIONS = {
  S: "Spouse",
  P: "Parent / Guardian",
  C: "Child",
  O: "Other"
};

const PRODUCT_CATALOG = [
  {
    id: "CASA_CURR",
    productTypeId: "CASA",
    productTypeLabel: "CASA",
    description: "Current / Savings Account",
    clientTypes: ["I", "C", "G", "M", "E", "N", "NC", "B"],
    isDefault: true
  },
  {
    id: "TERM_DEP",
    productTypeId: "TD",
    productTypeLabel: "Term Deposit",
    description: "Fixed / Term Deposit",
    clientTypes: ["I", "C", "G", "E", "N", "B"],
    isDefault: false
  },
  {
    id: "ESCROW",
    productTypeId: "ESC",
    productTypeLabel: "Escrow",
    description: "Escrow Account",
    clientTypes: ["C", "G", "B"],
    isDefault: false
  },
  {
    id: "LOAN_STD",
    productTypeId: "LN",
    productTypeLabel: "Loan",
    description: "Standard Loan Facility",
    clientTypes: ["I", "C", "G", "E", "N"],
    isDefault: false
  }
];

const filterProductsForClientType = (clientTypeId) => {
  const type = (clientTypeId || "").trim().toUpperCase();
  return PRODUCT_CATALOG.filter((product) => {
    if (!product.clientTypes || !product.clientTypes.length) return true;
    if (!type) return true;
    return product.clientTypes.includes(type);
  });
};

const SERVICE_CATALOG = [
  { id: "MOBILE", name: "Mobile Banking", category: "Digital" },
  { id: "INTERNET", name: "Internet Banking", category: "Digital" },
  { id: "ATM", name: "ATM / Card Access", category: "Cards" },
  { id: "ALERTS", name: "SMS / Email Alerts", category: "Notifications" },
  { id: "AGENCY", name: "Agency Banking", category: "Branchless" }
];

const MIME_EXTENSION_MAP = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const STEP_SCOPE_ATTR = "stepScope";

const normalizeTokens = (tokens) => {
  if (!tokens) return [];
  if (tokens instanceof Set) {
    return Array.from(tokens).map((token) => token.toLowerCase());
  }
  if (Array.isArray(tokens)) {
    return tokens.filter(Boolean).map((token) => token.toLowerCase());
  }
  return [tokens].filter(Boolean).map((token) => token.toLowerCase());
};

const deriveScopeTokens = (clientType) => {
  const key = (clientType || "").trim().toUpperCase();
  const tokens = CLIENT_TYPE_SCOPE_MAP[key] || CLIENT_TYPE_SCOPE_MAP.default;
  return [...new Set(normalizeTokens(tokens))];
};

const formatScopeToken = (token = "") =>
  token
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const describeScopeTokens = (tokens) => {
  const normalized = normalizeTokens(tokens).filter((value) => value && value !== "all");
  if (!normalized.length) {
    return formatScopeToken(CLIENT_SCOPE.INDIVIDUAL);
  }
  return normalized.map(formatScopeToken).join(" / ");
};

const formatDate = (value, includeTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
};

const toISODate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const generateRandomId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const generateClientId = () => `CL${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const readNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const inferMimeFromName = (fileName) => {
  if (!fileName || !fileName.includes(".")) return "application/octet-stream";
  const ext = fileName.split(".").pop().toLowerCase();
  return MIME_EXTENSION_MAP[ext] || "application/octet-stream";
};

const resolveMimeType = (file) => {
  if (!file) return "application/octet-stream";
  if (file.type) return file.type;
  return inferMimeFromName(file.name);
};

const supportsScope = (node, scopeTokens, attr = STEP_SCOPE_ATTR) => {
  const raw = (node.dataset[attr] || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!raw.length || raw.includes("all")) return true;
  const activeTokens = normalizeTokens(scopeTokens);
  if (!activeTokens.length) return false;
  return raw.some((token) => activeTokens.includes(token));
};

const disableFieldsInNode = (node, shouldDisable) => {
  const selectors = node.matches?.("input, select, textarea") ? [node] : Array.from(node.querySelectorAll("input, select, textarea"));
  selectors.forEach((field) => {
    if (shouldDisable) {
      if (!field.disabled) {
        field.dataset.prevDisabled = "true";
        field.disabled = true;
      }
    } else if (field.dataset.prevDisabled) {
      field.disabled = false;
      delete field.dataset.prevDisabled;
    }
  });
};

const setText = (node, value) => {
  if (!node) return;
  node.textContent = value;
};

class Stepper {
  constructor(root) {
    this.root = root;
    this.triggers = [];
    this.panels = [];
    if (!root) return;
    this.triggers = Array.from(root.querySelectorAll("[data-step-id]"));
    this.panels = Array.from(root.querySelectorAll("[data-step-panel]"));
    const defaultTrigger = this.triggers.find((btn) => btn.hasAttribute("data-step-default")) || this.triggers[0];
    this.activeStep = defaultTrigger?.dataset.stepId || null;
    this.scopeTokens = [CLIENT_SCOPE.INDIVIDUAL];
    this.applyOrdering();
    this.bindTriggers();
    this.sync();
  }

  resolveOrder(trigger) {
    if (!trigger) return Number(trigger?.dataset?.stepIndex) || 99;
    const attr = trigger.dataset.stepOrder;
    if (attr && this.scopeTokens) {
      const mappings = attr
        .split(";")
        .map((entry) => entry.split(":").map((part) => part.trim().toLowerCase()))
        .filter((parts) => parts.length === 2 && parts[0]);
      for (const token of this.scopeTokens) {
        const pair = mappings.find((item) => item[0] === token);
        if (pair) {
          const value = Number(pair[1]);
          if (!Number.isNaN(value)) return value;
        }
      }
      const fallback = mappings.find((item) => item[0] === "all");
      if (fallback) {
        const fallbackValue = Number(fallback[1]);
        if (!Number.isNaN(fallbackValue)) return fallbackValue;
      }
    }
    const fallbackIndex = Number(trigger.dataset.stepIndex);
    return Number.isNaN(fallbackIndex) ? 99 : fallbackIndex;
  }

  applyOrdering() {
    this.triggers.forEach((trigger) => {
      trigger.style.order = this.resolveOrder(trigger);
    });
  }

  bindTriggers() {
    this.triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        if (trigger.hidden) return;
        this.goTo(trigger.dataset.stepId);
      });
    });
  }

  goTo(stepId) {
    if (!stepId) return;
    if (!this.isStepVisible(stepId)) return;
    this.activeStep = stepId;
    this.sync();
  }

  next() {
    const order = this.getVisibleOrder();
    const index = order.indexOf(this.activeStep);
    if (index === -1 || index === order.length - 1) return;
    this.goTo(order[index + 1]);
  }

  prev() {
    const order = this.getVisibleOrder();
    const index = order.indexOf(this.activeStep);
    if (index <= 0) return;
    this.goTo(order[index - 1]);
  }

  getVisibleOrder() {
    return this.triggers
      .filter((btn) => !btn.hidden)
      .sort((a, b) => this.resolveOrder(a) - this.resolveOrder(b))
      .map((btn) => btn.dataset.stepId);
  }

  isStepVisible(stepId) {
    const trigger = this.triggers.find((btn) => btn.dataset.stepId === stepId);
    return trigger ? !trigger.hidden : false;
  }

  setScope(scopeTokens) {
    this.scopeTokens = normalizeTokens(scopeTokens);
    if (!this.scopeTokens.length) {
      this.scopeTokens = [CLIENT_SCOPE.INDIVIDUAL];
    }
    let fallbackStep = null;
    this.triggers.forEach((trigger) => {
      const shouldShow = supportsScope(trigger, this.scopeTokens);
      trigger.hidden = !shouldShow;
      trigger.classList.toggle("is-active", shouldShow && trigger.dataset.stepId === this.activeStep);
      if (!fallbackStep && shouldShow) {
        fallbackStep = trigger.dataset.stepId;
      }
    });

    this.panels.forEach((panel) => {
      const shouldShow = supportsScope(panel, this.scopeTokens);
      panel.hidden = !shouldShow;
      if (!shouldShow) {
        panel.classList.remove("is-active");
      }
    });

    this.applyOrdering();

    if (this.activeStep && !this.isStepVisible(this.activeStep)) {
      this.goTo(fallbackStep);
    } else {
      this.sync();
    }
  }

  sync() {
    this.triggers.forEach((trigger) => {
      trigger.classList.toggle("is-active", trigger.dataset.stepId === this.activeStep && !trigger.hidden);
    });

    this.panels.forEach((panel) => {
      const isActive = panel.dataset.stepPanel === this.activeStep && !panel.hidden;
      panel.classList.toggle("is-active", isActive);
    });

    this.root?.dispatchEvent(
      new CustomEvent("stepchange", {
        detail: { step: this.activeStep }
      })
    );
  }
}

class ClientLookupModal {
  constructor({ clientService, session, onSelect }) {
    this.clientService = clientService;
    this.session = session;
    this.onSelect = onSelect;
    this.modalElement = document.getElementById("clientLookupModal");
    this.bootstrapModal = null;
    this.form = this.modalElement?.querySelector("[data-lookup-form]");
    this.resultsBody = this.modalElement?.querySelector("[data-lookup-results]");
    this.emptyState = this.modalElement?.querySelector("[data-lookup-empty]");
    this.loadingState = this.modalElement?.querySelector("[data-lookup-loading]");
    this.searchButton = this.modalElement?.querySelector("[data-lookup-submit]");
    this.resetButton = this.modalElement?.querySelector("[data-lookup-reset]");
    this.results = [];
    this.prefillValue = "";
    this.autoSelectExact = false;
    this.bindEvents();
  }

  ensureModalInstance() {
    if (!this.modalElement) return null;
    if (this.bootstrapModal) return this.bootstrapModal;
    const ModalCtor = window.bootstrap?.Modal;
    if (!ModalCtor) return null;
    this.bootstrapModal = typeof ModalCtor.getOrCreateInstance === "function"
      ? ModalCtor.getOrCreateInstance(this.modalElement)
      : new ModalCtor(this.modalElement);
    return this.bootstrapModal;
  }

  isReady() {
    return Boolean(this.ensureModalInstance());
  }

  bindEvents() {
    this.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      this.performSearch();
    });
    this.searchButton?.addEventListener("click", (event) => {
      event.preventDefault();
      this.performSearch();
    });
    this.resetButton?.addEventListener("click", (event) => {
      event.preventDefault();
      this.resetCriteria();
    });
    this.resultsBody?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lookup-select]");
      if (!button) return;
      const row = button.closest("tr[data-result-index]");
      if (!row) return;
      this.selectResult(Number(row.dataset.resultIndex));
    });
    this.resultsBody?.addEventListener("dblclick", (event) => {
      const row = event.target.closest("tr[data-result-index]");
      if (!row) return;
      this.selectResult(Number(row.dataset.resultIndex));
    });
  }

  open(prefillValue = "") {
    const modalInstance = this.ensureModalInstance();
    if (!modalInstance) return;
    this.prefillValue = prefillValue?.trim() || "";
    this.autoSelectExact = Boolean(this.prefillValue);
    if (this.form) {
      const idField = this.form.querySelector("[data-lookup-field='clientId']");
      if (idField) idField.value = this.prefillValue;
    }
    modalInstance.show();
    if (this.prefillValue) {
      this.performSearch();
    } else {
      this.showEmptyState("Enter at least one filter above and click Search to query Core Banking clients.");
    }
  }

  close() {
    this.ensureModalInstance()?.hide();
  }

  resetCriteria() {
    this.form?.querySelectorAll("[data-lookup-field]").forEach((field) => {
      field.value = "";
    });
    this.prefillValue = "";
    this.autoSelectExact = false;
    this.renderResults([]);
  }

  collectCriteria() {
    if (!this.form) return [];
    const fields = Array.from(this.form.querySelectorAll("[data-lookup-field]"));
    return fields
      .map((field) => ({
        column: field.dataset.lookupField,
        value: field.value?.trim() || "",
        mode: this.form.querySelector(`[data-lookup-mode='${field.dataset.lookupField}']`)?.value || "Like"
      }))
      .filter((entry) => entry.value);
  }

  buildClause(column, mode, value) {
    if (!column || !value) return null;
    const sanitized = value.replace(/'/g, "''");
    if (mode === "Exact") {
      return `${column} = '${sanitized}'`;
    }
    return `${column} like '%${sanitized}%'`;
  }

  buildSearchPayload() {
    const criteria = this.collectCriteria();
    const clauses = criteria.map((entry) => this.buildClause(entry.column, entry.mode, entry.value)).filter(Boolean);
    const whereStmt = clauses.length ? clauses.join(" AND ") : "clientId like '%%'";
    return {
      RequestID: generateRandomId(),
      RequestData: {
        SearchID: "clientId",
        Filter: "",
        WhereStmt: whereStmt,
        SortBy: "clientId desc",
        PrevOrNext: "1",
        Reference: "",
        LoggedInUserId: this.session?.operatorId || this.session?.name || "web_portal",
        ModuleID: 1000,
        OurBranchID: "002"
      },
      RequestTime: new Date().toISOString(),
      AppName: window.CoreBankingConfig?.appName || "CLIENT_DATA"
    };
  }

  normalizeResults(response) {
    let results = response?.Details?.SearchResults || response?.Details || response?.SearchResults || [];
    if (!Array.isArray(results)) {
      results = results ? [results] : [];
    }
    return results.map((item) => ({
      ClientID: item.ClientID || item.clientId || "",
      Name: item.Name || item.fullName || "",
      IDNumber: item.IDNumber || item.nationalId || "",
      MobileNo: item.MobileNo || item.mobileNo || "",
      LegacyAccountID: item.LegacyAccountID || item.legacyAccountID || ""
    }));
  }

  async performSearch() {
    if (!this.clientService) {
      this.showEmptyState("ClientService not available.");
      return;
    }
    const payload = this.buildSearchPayload();
    this.setLoading(true);
    try {
      const response = await this.clientService.searchClients(payload);
      const results = this.normalizeResults(response);
      this.renderResults(results);
      if (this.autoSelectExact && this.prefillValue) {
        const match = results.find((record) => record.ClientID?.toUpperCase() === this.prefillValue.toUpperCase());
        if (match) {
          this.handleSelect(match);
          return;
        }
      }
    } catch (error) {
      console.error(error);
      this.showEmptyState(error.message || "Unable to fetch clients.");
    } finally {
      this.setLoading(false);
      this.autoSelectExact = false;
    }
  }

  renderResults(results) {
    if (!this.resultsBody) return;
    this.results = results;
    this.resultsBody.innerHTML = "";
    if (!results.length) {
      this.showEmptyState("No clients matched the supplied filters.");
      return;
    }
    this.hideEmptyState();
    results.forEach((record, index) => {
      const row = document.createElement("tr");
      row.dataset.resultIndex = String(index);
      row.innerHTML = `
        <td>${record.ClientID || "-"}</td>
        <td>${record.Name || "-"}</td>
        <td>${record.IDNumber || "-"}</td>
        <td>${record.MobileNo || "-"}</td>
        <td>${record.LegacyAccountID || "-"}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary" data-lookup-select>Select</button>
        </td>
      `;
      this.resultsBody.appendChild(row);
    });
  }

  setLoading(isLoading) {
    if (!this.loadingState) return;
    this.loadingState.classList.toggle("d-none", !isLoading);
    if (isLoading) {
      this.resultsBody && (this.resultsBody.innerHTML = "");
      this.hideEmptyState();
    }
  }

  showEmptyState(message) {
    if (this.emptyState) {
      this.emptyState.textContent = message;
      this.emptyState.classList.remove("d-none");
    }
    this.resultsBody && (this.resultsBody.innerHTML = "");
  }

  hideEmptyState() {
    this.emptyState?.classList.add("d-none");
  }

  selectResult(index) {
    this.applySelection(this.results[index]);
  }

  handleSelect(record) {
    this.applySelection(record);
  }

  applySelection(record) {
    if (!record) return;
    this.onSelect?.(record);
    this.close();
  }
}

class ClientMaintenancePage {
  constructor() {
    this.form = document.getElementById("client-form");
    if (!this.form) return;
    this.stepper = new Stepper(this.form.querySelector("[data-stepper]"));
    this.nameField = this.form.querySelector("[data-client-name-field]");
    this.addressContainer = this.form.querySelector("[data-collection='addresses'] [data-collection-items]");
    this.toast = document.getElementById("formToast");
    this.summaryTargets = {
      headline: document.querySelector("[data-client-name]"),
      status: document.querySelector("[data-client-status]"),
      statusPill: document.querySelector("[data-client-status-pill]"),
      segment: document.querySelector("[data-client-segment]"),
      opened: document.querySelector("[data-client-opened]"),
      openedPill: document.querySelector("[data-client-opened-pill]"),
      modified: document.querySelector("[data-client-modified]"),
      modifiedPill: document.querySelector("[data-client-modified-pill]"),
      createdPill: document.querySelector("[data-client-created-pill]"),
      workflow: document.querySelector("[data-client-workflow]"),
      rm: document.querySelector("[data-client-rm]"),
      summary: document.querySelector("[data-client-summary]")
    };
    this.summaryBadges = {
      mode: this.form.querySelector("[data-summary='mode']"),
      clientId: this.form.querySelector("[data-summary='clientId']"),
      clientType: this.form.querySelector("[data-summary='clientType']"),
      relationshipManager: this.form.querySelector("[data-summary='relationshipManager']"),
      pageFunction: document.querySelector("[data-page-function-pill]")
    };
    this.windowBadges = {
      mode: this.form.querySelector("[data-window-mode]"),
      scope: this.form.querySelector("[data-window-scope]")
    };

    this.products = [];
    this.services = [];
    this.productsBody = this.form.querySelector("[data-products-body]");
    this.servicesBody = this.form.querySelector("[data-services-body]");
    this.selectAllServicesCheckbox = this.form.querySelector("[data-services-select-all]");
    this.productsClientTypeBadge = this.form.querySelector("[data-products-client-type]");

    this.session = window.getAuthSession?.() || null;
    this.model = window.ClientFormModel ? new window.ClientFormModel() : null;
    this.state = {
      scope: CLIENT_SCOPE.INDIVIDUAL,
      scopeTokens: deriveScopeTokens(),
      posting: false,
      editing: { kin: null, employment: null, directors: null },
      pageFunction: "Add",
      requestCode: "",
      prefillClientId: ""
    };

    this.collections = {
      kin: [],
      employment: [],
      directors: []
    };

    this.collapsibles = new Map();
    this.menus = new Map();
    this.boundMenuOutsideHandler = null;
    this.boundMenuKeyHandler = null;

    this.query = new URLSearchParams(window.location.search);
    this.clientService = window.ClientService;
    this.lookupModal = new ClientLookupModal({
      clientService: this.clientService,
      session: this.session,
      onSelect: (record) => this.applyLookupSelection(record)
    });

    this.init();
  }

  bindShellChromeEvents() {
    const navLinks = this.form.querySelectorAll("[data-shell-nav-link]");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const target = link.dataset.stepperTarget;
        if (!target) return;
        this.stepper?.goTo(target);
        this.syncPanelFieldState();
      });
    });

    const stepperRoot = this.form.querySelector("[data-stepper]");
    stepperRoot?.addEventListener("stepchange", (event) => this.syncShellNav(event.detail?.step));

    const modeButtons = this.form.querySelectorAll("[data-shell-mode]");
    modeButtons.forEach((button) => {
      button.addEventListener("click", () => this.setPageFunction(button.dataset.shellMode));
    });

    this.syncShellNav(this.stepper?.activeStep);
  }

  initKycBehaviour() {
    const pepRadios = this.form.querySelectorAll("input[name='IsPEP']");
    const usRadios = this.form.querySelectorAll("input[name='IsUSPerson']");
    const dataCleansedRadios = this.form.querySelectorAll("input[name='IsDataCleansed']");
    const ceoCheckbox = this.form.querySelector("input[data-legacy-id='chkceoinfos']");

    const pepDetails = this.form.querySelectorAll("[data-kyc-section='pep-details']");
    const pepExtended = this.form.querySelectorAll("[data-kyc-section='pep-extended']");
    const usDetails = this.form.querySelectorAll("[data-kyc-section='us-details']");

    const toggleSection = (nodes, visible) => {
      nodes.forEach((node) => {
        node.classList.toggle("d-none", !visible);
        disableFieldsInNode(node, !visible);
      });
    };

    const syncPep = () => {
      const value = this.form.querySelector("input[name='IsPEP']:checked")?.value;
      const isPep = value === "Y";
      toggleSection(pepDetails, isPep);
      const isCeoChecked = Boolean(ceoCheckbox && ceoCheckbox.checked);
      toggleSection(pepExtended, isPep && isCeoChecked);
    };

    const syncUs = () => {
      const value = this.form.querySelector("input[name='IsUSPerson']:checked")?.value;
      const isUs = value === "Y";
      toggleSection(usDetails, isUs);
    };

    const syncCeo = () => {
      const value = this.form.querySelector("input[name='IsPEP']:checked")?.value;
      const isPep = value === "Y";
      const isCeoChecked = Boolean(ceoCheckbox && ceoCheckbox.checked);
      toggleSection(pepExtended, isPep && isCeoChecked);
    };

    pepRadios.forEach((radio) => {
      radio.addEventListener("change", syncPep);
    });
    usRadios.forEach((radio) => {
      radio.addEventListener("change", syncUs);
    });
    dataCleansedRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        // Data Cleansed currently does not drive UI toggles; placeholder for future hooks.
      });
    });
    if (ceoCheckbox) {
      ceoCheckbox.addEventListener("change", syncCeo);
    }

    // Initialise visibility on load
    toggleSection(pepDetails, false);
    toggleSection(pepExtended, false);
    toggleSection(usDetails, false);
    syncPep();
    syncUs();
    syncCeo();
  }

  getCurrentClientType() {
    const raw = this.form.elements.ClientTypeID?.value || "";
    return raw.trim().toUpperCase();
  }

  resetProductsAndServices() {
    this.refreshProductsForClientType();
    this.refreshServices();
  }

  refreshProductsForClientType() {
    if (!this.productsBody) return;
    const clientTypeId = this.getCurrentClientType();
    const products = filterProductsForClientType(clientTypeId).map((product, index) => ({
      ...product,
      serialNo: index + 1
    }));
    this.products = products;

    if (this.productsClientTypeBadge) {
      const label = clientTypeId || "--";
      this.productsClientTypeBadge.textContent = `Client Type · ${label}`;
    }

    this.renderProducts();
  }

  refreshServices() {
    if (!this.servicesBody) return;
    if (!this.services || !this.services.length) {
      this.services = SERVICE_CATALOG.map((service) => ({
        ...service,
        status: false
      }));
    }
    this.renderServices();
  }

  renderProducts() {
    if (!this.productsBody) return;
    this.productsBody.innerHTML = "";
    if (!this.products || !this.products.length) {
      const empty = document.createElement("tr");
      empty.innerHTML = '<td colspan="4" class="text-center text-muted">No eligible products for the selected client type.</td>';
      this.productsBody.appendChild(empty);
      return;
    }

    this.products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.serialNo}</td>
        <td>${product.description}</td>
        <td>${product.productTypeLabel || product.productTypeId || "-"}</td>
        <td>${product.isDefault ? '<span class="badge text-bg-primary">Default</span>' : ""}</td>
      `;
      this.productsBody.appendChild(row);
    });
  }

  renderServices() {
    if (!this.servicesBody) return;
    this.servicesBody.innerHTML = "";
    if (!this.services || !this.services.length) {
      const empty = document.createElement("tr");
      empty.innerHTML = '<td colspan="3" class="text-center text-muted">No services configured.</td>';
      this.servicesBody.appendChild(empty);
      this.syncSelectAllServices();
      return;
    }

    this.services.forEach((service, index) => {
      const row = document.createElement("tr");
      row.dataset.index = String(index);
      row.innerHTML = `
        <td class="text-center">
          <input type="checkbox" class="form-check-input" data-service-checkbox data-service-id="${service.id}" ${
            service.status ? "checked" : ""
          } />
        </td>
        <td>${service.name}</td>
        <td>${service.category || "-"}</td>
      `;
      this.servicesBody.appendChild(row);
    });

    this.syncSelectAllServices();
  }

  syncSelectAllServices() {
    if (!this.selectAllServicesCheckbox) return;
    if (!this.services || !this.services.length) {
      this.selectAllServicesCheckbox.checked = false;
      this.selectAllServicesCheckbox.indeterminate = false;
      return;
    }

    const allSelected = this.services.every((service) => !!service.status);
    const anySelected = this.services.some((service) => !!service.status);
    this.selectAllServicesCheckbox.checked = allSelected;
    this.selectAllServicesCheckbox.indeterminate = !allSelected && anySelected;
  }

  bindProductsServicesEvents() {
    if (this.selectAllServicesCheckbox) {
      this.selectAllServicesCheckbox.addEventListener("change", () => {
        const checked = this.selectAllServicesCheckbox.checked;
        this.services = (this.services || []).map((service) => ({ ...service, status: checked }));
        if (this.servicesBody) {
          this.servicesBody.querySelectorAll("[data-service-checkbox]").forEach((checkbox) => {
            checkbox.checked = checked;
          });
        }
        this.syncSelectAllServices();
      });
    }

    if (this.servicesBody) {
      this.servicesBody.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-service-checkbox]");
        if (!checkbox) return;
        const serviceId = checkbox.dataset.serviceId;
        const isChecked = checkbox.checked;
        const target = (this.services || []).find((service) => service.id === serviceId);
        if (target) {
          target.status = isChecked;
        }
        this.syncSelectAllServices();
      });
    }
  }

  initWindowMenus() {
    if (!this.form) return;
    this.menus.clear();
    const toggles = this.form.querySelectorAll("[data-menu-toggle]");
    if (!toggles.length) return;
    toggles.forEach((toggle) => {
      const targetId = toggle.dataset.menuToggle || toggle.getAttribute("aria-controls");
      if (!targetId) return;
      const panel = this.form.querySelector(`[data-menu-panel='${targetId}']`) || document.getElementById(targetId);
      if (!panel) return;
      const entry = { id: targetId, toggle, panel };
      this.menus.set(targetId, entry);
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        const isOpen = panel.hidden === false;
        this.setMenuState(entry, !isOpen);
      });
      panel.addEventListener("click", (event) => {
        if (event.target.closest(".cm-window-menu__item")) {
          this.setMenuState(entry, false);
        }
      });
    });

    if (!this.boundMenuOutsideHandler) {
      this.boundMenuOutsideHandler = (event) => {
        this.menus.forEach((entry) => {
          if (entry.panel.hidden) return;
          const clickedInside = entry.panel.contains(event.target) || entry.toggle.contains(event.target);
          if (!clickedInside) {
            this.setMenuState(entry, false);
          }
        });
      };
      document.addEventListener("click", this.boundMenuOutsideHandler);
    }

    if (!this.boundMenuKeyHandler) {
      this.boundMenuKeyHandler = (event) => {
        if (event.key === "Escape") {
          this.menus.forEach((entry) => this.setMenuState(entry, false));
        }
      };
      document.addEventListener("keydown", this.boundMenuKeyHandler);
    }
  }

  setMenuState(entryOrId, open) {
    const entry = typeof entryOrId === "string" ? this.menus.get(entryOrId) : entryOrId;
    if (!entry) return;
    const shouldOpen = Boolean(open);
    if (shouldOpen) {
      this.menus.forEach((other) => {
        if (other === entry) return;
        other.panel.hidden = true;
        other.toggle.setAttribute("aria-expanded", "false");
      });
    }
    entry.panel.hidden = !shouldOpen;
    entry.toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  }

  initCollapsiblePanels() {
    if (!this.form) return;
    const toggles = this.form.querySelectorAll("[data-collapse-toggle]");
    toggles.forEach((toggle) => {
      const targetId = toggle.dataset.collapseToggle || toggle.getAttribute("aria-controls");
      const host = toggle.closest("[data-collapsible]");
      if (!targetId || !host) return;
      const panel = this.form.querySelector(`[data-collapse-panel='${targetId}']`) || document.getElementById(targetId);
      if (!panel) return;
      const label = toggle.querySelector("[data-collapse-label]");
      const entry = {
        id: targetId,
        host,
        panel,
        toggle,
        label,
        expandText: label?.dataset.labelExpand || label?.textContent?.trim() || "Expand",
        collapseText: label?.dataset.labelCollapse || "Collapse"
      };
      this.collapsibles.set(targetId, entry);
      const defaultCollapsed = host.dataset.collapseDefault === "collapsed" || host.dataset.collapsed === "true";
      this.setCollapsibleState(entry, defaultCollapsed);
      toggle.addEventListener("click", () => {
        const isCollapsed = host.dataset.collapsed === "true";
        this.setCollapsibleState(entry, !isCollapsed);
      });
    });
  }

  setCollapsibleState(entryOrId, collapsed) {
    const entry = typeof entryOrId === "string" ? this.collapsibles.get(entryOrId) : entryOrId;
    if (!entry) return;
    const { host, panel, toggle, label, expandText, collapseText } = entry;
    const isCollapsed = Boolean(collapsed);
    host.dataset.collapsed = isCollapsed ? "true" : "false";
    if (panel) {
      panel.hidden = isCollapsed;
    }
    if (toggle) {
      toggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    }
    if (label) {
      label.textContent = isCollapsed ? expandText : collapseText || expandText;
    }
  }

  ensureCollapsibleVisibleFor(node) {
    if (!node) return;
    const host = node.closest?.("[data-collapsible]");
    if (!host) return;
    for (const entry of this.collapsibles.values()) {
      if (entry.host === host && host.dataset.collapsed === "true") {
        this.setCollapsibleState(entry, false);
        break;
      }
    }
  }

  setPageFunction(mode) {
    if (!mode) return;
    const normalized = mode === "Edit" ? "Update" : mode;
    if (this.state.pageFunction === normalized) return;
    this.state.pageFunction = normalized;
    this.syncActionButtons();
    this.updateWindowBadges();
  }

  toggleShellNavVisibility() {
    const navItems = this.form.querySelectorAll("[data-shell-scope]");
    if (!navItems.length) return;
    const tokens = new Set(["all", ...(this.state.scopeTokens || [])]);
    navItems.forEach((item) => {
      const scopes = (item.dataset.shellScope || "all")
        .split(",")
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean);
      const shouldShow = !scopes.length || scopes.includes("all") || scopes.some((token) => tokens.has(token));
      item.hidden = !shouldShow;
      item.setAttribute("aria-hidden", shouldShow ? "false" : "true");
      if ("tabIndex" in item) {
        item.tabIndex = shouldShow ? 0 : -1;
      }
      if (!shouldShow) {
        item.classList.remove("is-active");
      }
    });
  }

  syncShellNav(activeStep) {
    const navLinks = this.form.querySelectorAll("[data-shell-nav-link]");
    navLinks.forEach((link) => {
      const isActive = Boolean(activeStep) && link.dataset.stepperTarget === activeStep;
      link.classList.toggle("is-active", isActive);
    });
  }

  updateWindowBadges() {
    if (this.windowBadges.mode) {
      this.windowBadges.mode.textContent = `Mode · ${this.state.pageFunction}`;
    }
    if (this.windowBadges.scope) {
      this.windowBadges.scope.textContent = `Scope · ${describeScopeTokens(this.state.scopeTokens)}`;
    }
  }

  async init() {
    await window.initLookupFields?.(this.form);
    this.parseQueryParams();
    this.bindEvents();
    this.initKycBehaviour();
    this.initWindowMenus();
    this.initCollapsiblePanels();
    this.bootstrapAddresses();
    this.resetProductsAndServices();
    this.setMetaDefaults();
    this.updateScope();
    this.updateClientName();
    this.updateSummaryMeta();
    if (this.state.prefillClientId) {
      this.form.elements.ClientID.value = this.state.prefillClientId;
    }
    if (this.state.requestCode) {
      this.loadClient(this.state.requestCode);
    }
  }

  parseQueryParams() {
    const action = this.query.get("action") || this.query.get("pageFunction") || "Add";
    this.state.pageFunction = action;
    this.state.requestCode = this.query.get("requestCode") || "";
    this.state.prefillClientId = this.query.get("prefillClientId") || "";
    const clientTypeParam = this.query.get("ClientTypeID");
    if (clientTypeParam) {
      this.form.elements.ClientTypeID.value = clientTypeParam;
    }
    if (!this.state.requestCode && this.state.prefillClientId) {
      this.state.requestCode = this.state.prefillClientId;
    }
    this.syncActionButtons();
    this.updateWindowBadges();
  }

  syncActionButtons() {
    const saveBtn = this.form.querySelector('[data-submit-action="save"]');
    const approveBtn = this.form.querySelector('[data-submit-action="approve"]');
    const clearBtn = this.form.querySelector('[data-submit-action="clear"]');
    const cancelBtn = this.form.querySelector('[data-submit-action="cancel"]');

    if (this.state.pageFunction === "Supervise") {
      if (approveBtn) approveBtn.hidden = false;
      if (saveBtn) saveBtn.hidden = true;
      if (clearBtn) clearBtn.hidden = true;
    } else if (this.state.pageFunction === "View") {
      if (approveBtn) approveBtn.hidden = true;
      if (saveBtn) saveBtn.hidden = true;
      if (clearBtn) clearBtn.hidden = true;
    } else {
      if (approveBtn) approveBtn.hidden = true;
      if (saveBtn) saveBtn.hidden = false;
      if (clearBtn) clearBtn.hidden = this.state.pageFunction !== "Add";
    }

    if (cancelBtn) {
      cancelBtn.textContent = this.state.pageFunction === "View" ? "Close" : "Cancel";
    }

    if (this.summaryBadges.pageFunction) {
      this.summaryBadges.pageFunction.textContent = `Mode · ${this.state.pageFunction}`;
    }

    this.toggleReadOnlyMode();
  }

  toggleReadOnlyMode() {
    const lockModes = ["View", "Supervise"];
    const shouldLock = lockModes.includes(this.state.pageFunction);
    const exemptFields = new Set(["ClientID"]);
    this.form.querySelectorAll("input, select, textarea").forEach((field) => {
      if (exemptFields.has(field.name)) return;
      const key = "prevDisabledMode";
      if (shouldLock) {
        if (!field.disabled) {
          field.dataset[key] = "true";
          field.disabled = true;
        }
      } else if (field.dataset[key]) {
        if (!field.dataset.prevDisabled) {
          field.disabled = false;
        }
        delete field.dataset[key];
      }
    });
  }

  bindEvents() {
    this.form.addEventListener("input", (event) => {
      if (["FirstName", "MiddleName", "LastName", "CompanyName"].includes(event.target.name)) {
        this.updateClientName();
      }
      if (event.target.name === "DateOfBirth") {
        this.updateAge();
      }
    });

    this.form.elements.DateOfBirth?.addEventListener("change", () => this.updateAge());

    const clientTypeField = this.form.elements.ClientTypeID;
    clientTypeField?.addEventListener("change", () => {
      this.updateScope();
      this.resetProductsAndServices();
    });

    this.form.elements.RelationshipManager?.addEventListener("change", () => this.updateSummaryMeta());

    const searchButton = this.form.querySelector("[data-client-search]");
    searchButton?.addEventListener("click", (event) => {
      event.preventDefault();
      const typedClientId = this.form.elements.ClientID?.value?.trim();
      const forceLookupModal = event.shiftKey || event.altKey;
      const shouldOpenModal = forceLookupModal || !typedClientId;
      if (!shouldOpenModal && typedClientId) {
        this.handleClientLookup();
        return;
      }
      if (this.lookupModal?.isReady?.()) {
        this.lookupModal.open(forceLookupModal ? typedClientId : "");
      } else if (typedClientId && !forceLookupModal) {
        this.handleClientLookup();
      } else {
        this.showToast("Provide a Client ID before searching or hold Shift to open the lookup.", "danger");
      }
    });

    this.form.querySelector("[data-client-reset]")?.addEventListener("click", () => this.resetForm());

    this.form.querySelectorAll("[data-stepper-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.stepperAction === "next") {
          this.stepper?.next();
        } else {
          this.stepper?.prev();
        }
        this.syncPanelFieldState();
      });
    });

    this.bindShellChromeEvents();

    this.form.querySelectorAll("[data-submit-action]").forEach((button) => {
      button.addEventListener("click", () => this.handlePrimaryAction(button.dataset.submitAction));
    });

    this.form.querySelector("[data-collection-add='addresses']")?.addEventListener("click", () => this.addAddressCard());

    this.addressContainer?.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-remove-address]");
      if (removeBtn) {
        const card = removeBtn.closest("[data-collection-item]");
        if (!card) return;
        if (this.addressContainer.children.length === 1) {
          this.showToast("At least one address is required.", "warning");
          return;
        }
        card.remove();
        this.renumberAddressCards();
      }
    });

    this.bindKinEvents();
    this.bindEmploymentEvents();
    this.bindDirectorEvents();
    this.bindDocumentEvents();
    this.bindProductsServicesEvents();
  }

  applyLookupSelection(record) {
    if (!record?.ClientID) return;
    if (this.form.elements.ClientID) {
      this.form.elements.ClientID.value = record.ClientID;
    }
    this.updateSummaryMeta();
    this.loadClient(record.ClientID);
  }

  bindKinEvents() {
    const kinForm = this.form.querySelector("[data-kin-form]");
    kinForm?.querySelector("[data-kin-action='save']")?.addEventListener("click", () => this.saveKin());
    kinForm?.querySelector("[data-kin-action='cancel']")?.addEventListener("click", () => this.resetKinForm());
    const kinTable = this.form.querySelector('[data-table="kin"]');
    kinTable?.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-index]");
      if (!row) return;
      const index = Number(row.dataset.index);
      if (event.target.closest("[data-action='edit']")) {
        this.editKin(index);
      } else if (event.target.closest("[data-action='delete']")) {
        this.deleteKin(index);
      }
    });
  }

  bindEmploymentEvents() {
    const employmentForm = this.form.querySelector("[data-employment-form]");
    employmentForm?.querySelector("[data-employment-action='save']")?.addEventListener("click", () => this.saveEmployment());
    employmentForm?.querySelector("[data-employment-action='cancel']")?.addEventListener("click", () => this.resetEmploymentForm());
    const employmentTable = this.form.querySelector('[data-table="employment"]');
    employmentTable?.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-index]");
      if (!row) return;
      const index = Number(row.dataset.index);
      if (event.target.closest("[data-action='edit']")) {
        this.editEmployment(index);
      } else if (event.target.closest("[data-action='delete']")) {
        this.deleteEmployment(index);
      }
    });
  }

  bindDirectorEvents() {
    const directorForm = this.form.querySelector("[data-collection='directors']");
    if (!directorForm) return;
    directorForm.querySelector("[data-director-action='save']")?.addEventListener("click", () => this.saveDirector());
    directorForm.querySelector("[data-director-action='cancel']")?.addEventListener("click", () => this.resetDirectorForm());
    const directorsTable = this.form.querySelector('[data-table="directors"]');
    directorsTable?.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-index]");
      if (!row) return;
      const index = Number(row.dataset.index);
      if (event.target.closest("[data-action='edit']")) {
        this.editDirector(index);
      } else if (event.target.closest("[data-action='delete']")) {
        this.deleteDirector(index);
      }
    });
  }

  bindDocumentEvents() {
    const addButton = this.form.querySelector("[data-document-action='add']");
    addButton?.addEventListener("click", () => this.addDocumentRow());
    const documentsTable = this.form.querySelector('[data-table="documents"] tbody');
    documentsTable?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-document-row]");
      if (!row) return;
      if (event.target.closest("[data-document-remove]")) {
        row.remove();
        this.renumberDocuments();
      } else if (event.target.closest("[data-document-preview]") && row.__docData?.sImage) {
        this.previewDocument(row.__docData);
      } else if (event.target.closest("[data-document-download]") && row.__docData?.sImage) {
        this.downloadDocument(row.__docData);
      }
    });
  }

  bootstrapAddresses(addresses = null) {
    if (!this.addressContainer) return;
    this.addressContainer.innerHTML = "";
    if (addresses && Array.isArray(addresses) && addresses.length) {
      addresses.forEach((address) => this.addAddressCard(address));
    } else {
      this.addAddressCard();
    }
  }

  addAddressCard(data = {}) {
    const template = document.getElementById("address-template");
    if (!template || !this.addressContainer) return;
    const clone = template.content.firstElementChild.cloneNode(true);
    this.addressContainer.appendChild(clone);
    window.initLookupFields?.(clone);
    Object.entries(data || {}).forEach(([key, value]) => {
      const field = clone.querySelector(`[name='${key}']`);
      if (!field) return;
      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value || "";
      }
    });
    this.renumberAddressCards();
  }

  renumberAddressCards() {
    if (!this.addressContainer) return;
    Array.from(this.addressContainer.children).forEach((card, index) => {
      const label = card.querySelector("[data-address-index]");
      if (label) label.textContent = index + 1;
    });
  }

  getAddresses() {
    if (!this.addressContainer) return [];
    return Array.from(this.addressContainer.querySelectorAll("[data-collection-item]")).map((card) => ({
      AddressTypeID: card.querySelector("[name='AddressTypeID']")?.value || "M",
      Address1: card.querySelector("[name='Address1']")?.value || "",
      Address2: card.querySelector("[name='Address2']")?.value || "",
      CityID: card.querySelector("[name='CityID']")?.value || "",
      CountryID: card.querySelector("[name='CountryID']")?.value || "",
      Mobile: card.querySelector("[name='Mobile']")?.value || "",
      Email: card.querySelector("[name='Email']")?.value || "",
      IsMailingAddress: card.querySelector("[name='IsMailingAddress']")?.checked || false
    }));
  }

  saveKin() {
    const form = this.form.querySelector("[data-kin-form]");
    if (!form) return;
    const entry = {
      RelatedClientID: form.querySelector('[data-kin-field="RelatedClientID"]').value.trim(),
      RelationID: form.querySelector('[data-kin-field="RelationID"]').value,
      RelationRefNo: readNumber(form.querySelector('[data-kin-field="RelationRefNo"]').value, 1),
      SharePercent: readNumber(form.querySelector('[data-kin-field="SharePercent"]').value, 0),
      Remarks: form.querySelector('[data-kin-field="Remarks"]').value.trim()
    };

    if (!entry.RelatedClientID || !entry.RelationID || !entry.Remarks) {
      this.showToast("Fill in all required next of kin fields.", "danger");
      return;
    }

    if (entry.SharePercent <= 0 || entry.SharePercent > 100) {
      this.showToast("Share percent must be between 1 and 100.", "danger");
      return;
    }

    if (this.state.editing.kin !== null) {
      this.collections.kin[this.state.editing.kin] = entry;
    } else {
      this.collections.kin.push(entry);
    }

    this.resetKinForm();
    this.renderKinTable();
  }

  editKin(index) {
    const data = this.collections.kin[index];
    if (!data) return;
    const form = this.form.querySelector("[data-kin-form]");
    if (!form) return;
    form.querySelector('[data-kin-field="RelatedClientID"]').value = data.RelatedClientID;
    form.querySelector('[data-kin-field="RelationID"]').value = data.RelationID;
    form.querySelector('[data-kin-field="RelationRefNo"]').value = data.RelationRefNo;
    form.querySelector('[data-kin-field="SharePercent"]').value = data.SharePercent;
    form.querySelector('[data-kin-field="Remarks"]').value = data.Remarks;
    this.state.editing.kin = index;
  }

  deleteKin(index) {
    this.collections.kin.splice(index, 1);
    this.renderKinTable();
  }

  resetKinForm() {
    const form = this.form.querySelector("[data-kin-form]");
    if (!form) return;
    form.reset();
    this.state.editing.kin = null;
    this.updateKinSummary();
  }

  renderKinTable() {
    const table = this.form.querySelector('[data-table="kin"] tbody');
    if (!table) return;
    table.innerHTML = "";
    this.collections.kin.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.dataset.index = String(index);
      const relationLabel = RELATIONS[entry.RelationID] || entry.RelationID || "-";
      row.innerHTML = `
        <td>${entry.RelatedClientID}</td>
        <td>${relationLabel}</td>
        <td>${entry.Remarks}</td>
        <td>${entry.SharePercent}%</td>
        <td class="text-end">
          <button type="button" class="btn btn-link" data-action="edit">Edit</button>
          <button type="button" class="btn btn-link text-danger" data-action="delete">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
    if (!this.collections.kin.length) {
      const empty = document.createElement("tr");
      empty.innerHTML = `<td colspan="5" class="text-center text-muted">No next of kin captured.</td>`;
      table.appendChild(empty);
    }
    this.updateKinSummary();
  }

  updateKinSummary() {
    const allocated = this.collections.kin.reduce((sum, entry) => sum + readNumber(entry.SharePercent), 0);
    const summaryRoot = this.form.querySelector("[data-kin-summary]");
    if (!summaryRoot) return;
    summaryRoot.querySelector('[data-kin-total="records"]').textContent = this.collections.kin.length;
    summaryRoot.querySelector('[data-kin-total="allocated"]').textContent = `${allocated.toFixed(2)}%`;
    summaryRoot.querySelector('[data-kin-total="remaining"]').textContent = `${(100 - allocated).toFixed(2)}%`;
  }

  saveEmployment() {
    const form = this.form.querySelector("[data-employment-form]");
    if (!form) return;
    const entry = {
      companyName: form.querySelector('[data-employment-field="companyName"]').value.trim(),
      workPosition: form.querySelector('[data-employment-field="workPosition"]').value.trim(),
      startDate: form.querySelector('[data-employment-field="startDate"]').value,
      endDate: form.querySelector('[data-employment-field="endDate"]').value
    };

    if (!entry.companyName || !entry.workPosition || !entry.startDate || !entry.endDate) {
      this.showToast("Employment history requires company, position, start, and end dates.", "danger");
      return;
    }

    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start > end) {
      this.showToast("Employment end date cannot be earlier than the start date.", "danger");
      return;
    }

    if (this.state.editing.employment !== null) {
      this.collections.employment[this.state.editing.employment] = entry;
    } else {
      this.collections.employment.push(entry);
    }

    this.resetEmploymentForm();
    this.renderEmploymentTable();
  }

  editEmployment(index) {
    const data = this.collections.employment[index];
    if (!data) return;
    const form = this.form.querySelector("[data-employment-form]");
    if (!form) return;
    form.querySelector('[data-employment-field="companyName"]').value = data.companyName;
    form.querySelector('[data-employment-field="workPosition"]').value = data.workPosition;
    form.querySelector('[data-employment-field="startDate"]').value = data.startDate;
    form.querySelector('[data-employment-field="endDate"]').value = data.endDate;
    this.state.editing.employment = index;
  }

  deleteEmployment(index) {
    this.collections.employment.splice(index, 1);
    this.renderEmploymentTable();
  }

  resetEmploymentForm() {
    const form = this.form.querySelector("[data-employment-form]");
    if (!form) return;
    form.reset();
    this.state.editing.employment = null;
  }

  renderEmploymentTable() {
    const table = this.form.querySelector('[data-table="employment"] tbody');
    if (!table) return;
    table.innerHTML = "";
    this.collections.employment.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.dataset.index = String(index);
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.companyName}</td>
        <td>${entry.workPosition}</td>
        <td>${entry.startDate || "-"}</td>
        <td>${entry.endDate || "-"}</td>
        <td class="text-end">
          <button type="button" class="btn btn-link" data-action="edit">Edit</button>
          <button type="button" class="btn btn-link text-danger" data-action="delete">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
    if (!this.collections.employment.length) {
      const empty = document.createElement("tr");
      empty.innerHTML = `<td colspan="6" class="text-center text-muted">No employment history captured.</td>`;
      table.appendChild(empty);
    }
  }

  saveDirector() {
    const root = this.form.querySelector("[data-collection='directors']");
    if (!root) return;
    const entry = {
      clientName: root.querySelector('[data-director-field="clientName"]').value.trim(),
      relation: root.querySelector('[data-director-field="relation"]').value.trim(),
      share: readNumber(root.querySelector('[data-director-field="share"]').value, 0)
    };

    if (!entry.clientName || !entry.relation) {
      this.showToast("Director name and relation are required.", "danger");
      return;
    }

    if (entry.share < 0 || entry.share > 100) {
      this.showToast("Director share must be between 0 and 100.", "danger");
      return;
    }

    if (this.willExceedDirectorShare(entry.share, this.state.editing.directors)) {
      this.showToast("Director share allocation cannot exceed 100%.", "danger");
      return;
    }

    if (this.state.editing.directors !== null) {
      this.collections.directors[this.state.editing.directors] = entry;
    } else {
      this.collections.directors.push(entry);
    }

    this.resetDirectorForm();
    this.renderDirectorsTable();
  }

  editDirector(index) {
    const data = this.collections.directors[index];
    if (!data) return;
    const root = this.form.querySelector("[data-collection='directors']");
    if (!root) return;
    root.querySelector('[data-director-field="clientName"]').value = data.clientName;
    root.querySelector('[data-director-field="relation"]').value = data.relation;
    root.querySelector('[data-director-field="share"]').value = data.share;
    this.state.editing.directors = index;
  }

  deleteDirector(index) {
    this.collections.directors.splice(index, 1);
    this.renderDirectorsTable();
  }

  resetDirectorForm() {
    const root = this.form.querySelector("[data-collection='directors']");
    if (!root) return;
    root.querySelectorAll("[data-director-field]").forEach((field) => (field.value = ""));
    this.state.editing.directors = null;
  }

  renderDirectorsTable() {
    const table = this.form.querySelector('[data-table="directors"] tbody');
    if (!table) return;
    table.innerHTML = "";
    this.collections.directors.forEach((entry, index) => {
      const row = document.createElement("tr");
      row.dataset.index = String(index);
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.clientName}</td>
        <td>${entry.relation}</td>
        <td>${entry.share}%</td>
        <td class="text-end">
          <button type="button" class="btn btn-link" data-action="edit">Edit</button>
          <button type="button" class="btn btn-link text-danger" data-action="delete">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
    if (!this.collections.directors.length) {
      const empty = document.createElement("tr");
      empty.innerHTML = `<td colspan="5" class="text-center text-muted">No directors captured.</td>`;
      table.appendChild(empty);
    }
  }

  totalDirectorShare(excludeIndex = null) {
    return this.collections.directors.reduce((sum, entry, index) => {
      if (excludeIndex !== null && index === excludeIndex) {
        return sum;
      }
      return sum + readNumber(entry.share);
    }, 0);
  }

  willExceedDirectorShare(nextShare, editingIndex = null) {
    return this.totalDirectorShare(editingIndex) + readNumber(nextShare) > 100;
  }

  addDocumentRow(data = null) {
    const template = document.getElementById("document-row-template");
    const tbody = this.form.querySelector('[data-table="documents"] tbody');
    if (!template || !tbody) return;
    const row = template.content.firstElementChild.cloneNode(true);
    row.__docData = data ? { ...data } : {};
    row.querySelectorAll("select, input").forEach((field) => {
      field.addEventListener("change", (event) => this.handleDocumentFieldChange(row, event.target));
    });
    row.querySelector("[data-document-file]")?.addEventListener("change", (event) => this.handleDocumentFile(row, event.target.files));
    if (data) {
      const docId = row.querySelector("[name='DocumentID']");
      const typeId = row.querySelector("[name='DocumentTypeID']");
      const description = row.querySelector("[name='Description']");
      const remarks = row.querySelector("[name='Remarks']");
      if (docId) docId.value = data.DocumentID || "";
      if (typeId) typeId.value = data.DocumentTypeID || "";
      if (description) description.value = data.Description || "";
      if (remarks) remarks.value = data.Remarks || "";
      row.__docData.fileName = data.fileName || data.Description || "";
    }
    tbody.appendChild(row);
    this.renumberDocuments();
  }

  handleDocumentFieldChange(row, field) {
    if (field.name === "Remarks" || field.name === "DocumentID" || field.name === "DocumentTypeID") {
      row.__docData[field.name] = field.value;
    }
  }

  async handleDocumentFile(row, files) {
    const file = files?.[0];
    if (!file) return;
    try {
      const mimeType = resolveMimeType(file);
      const base64 = await this.readFileAsBase64(file);
      row.__docData = {
        ...row.__docData,
        sImage: base64,
        MimeType: mimeType,
        Description: file.name,
        fileName: file.name,
        CreatedOn: row.__docData?.CreatedOn || new Date().toISOString(),
        CreatedBy: row.__docData?.CreatedBy || this.session?.name || "System"
      };
      const descriptionField = row.querySelector("[name='Description']");
      if (descriptionField) {
        descriptionField.value = file.name;
      }
    } catch (error) {
      console.error(error);
      this.showToast("Unable to read the selected document.", "danger");
    }
  }

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        const base64 = result.split(",")[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  renumberDocuments() {
    const rows = this.form.querySelectorAll('[data-table="documents"] tbody tr');
    rows.forEach((row, index) => {
      const target = row.querySelector("[data-document-index]");
      if (target) {
        target.textContent = index + 1;
      }
    });
  }

  previewDocument(doc) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.title = doc.fileName || doc.Description || "document";
    win.document.write(`<iframe src="data:${doc.MimeType};base64,${doc.sImage}" style="width:100%;height:100%" frameborder="0"></iframe>`);
  }

  downloadDocument(doc) {
    const link = document.createElement("a");
    link.href = `data:${doc.MimeType};base64,${doc.sImage}`;
    link.download = doc.fileName || doc.Description || `document-${Date.now()}`;
    link.click();
  }

  handleClientLookup() {
    const clientIdField = this.form.elements.ClientID;
    if (!clientIdField) {
      this.showToast("Client ID field is missing on the form.", "danger");
      return;
    }
    const clientId = clientIdField.value.trim();
    if (!clientId) {
      this.showToast("Provide a Client ID before searching.", "danger");
      return;
    }
    if (!this.clientService) {
      this.showToast("ClientService not available.", "danger");
      return;
    }
    this.loadClient(clientId);
  }

  async loadClient(clientId) {
    try {
      this.showToast(`Loading ${clientId}...`, "info");
      const response = await this.clientService.getClient({ ClientID: clientId });
      const payload = response?.ResponseData || response?.Details || response;
      if (!payload) {
        throw new Error("Client not found");
      }
      this.applyPayload(payload);
      this.showToast(`Client ${clientId} loaded.`, "success");
    } catch (error) {
      console.error(error);
      this.showToast(error.message || "Unable to load client", "danger");
    }
  }

  applyPayload(payload) {
    Object.entries(payload).forEach(([key, value]) => {
      const field = this.form.elements[key];
      if (!field) return;
      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value ?? "";
      }
    });

    this.bootstrapAddresses(payload.Addresses);
    this.collections.kin = payload.NextOfKin || [];
    this.collections.employment = payload.EmploymentDetails || [];
    this.collections.directors = payload.Directors || [];
    this.renderKinTable();
    this.renderEmploymentTable();
    this.renderDirectorsTable();
    this.clearDocumentsTable();
    (payload.Documents || []).forEach((doc) => this.addDocumentRow(doc));

    // Restore products and services into the Products & Services step
    const clientTypeId = payload.ClientTypeID || this.form.elements.ClientTypeID?.value || "";
    this.products = filterProductsForClientType(clientTypeId).map((product, index) => ({
      ...product,
      serialNo: index + 1
    }));
    this.services = SERVICE_CATALOG.map((service) => {
      const matched = (payload.Services || []).find((item) => item.ServiceID === service.id);
      return {
        ...service,
        status: Boolean(matched?.IsSelected)
      };
    });
    this.renderProducts();
    this.renderServices();

    this.updateScope();
    this.updateClientName();
    this.populateClientSummary(payload, payload.ClientID);
    this.state.requestCode = payload.ClientID || this.state.requestCode;
    this.updateSummaryMeta();
  }

  clearDocumentsTable() {
    const tbody = this.form.querySelector('[data-table="documents"] tbody');
    if (!tbody) return;
    tbody.innerHTML = "";
  }

  populateClientSummary(payload, fallbackId) {
    const status = payload?.WFClientStatusID || "Draft";
    const rmField = this.form.elements.RelationshipManager;
    const rmValue = payload?.RelationshipManager ?? "";
    let rm = rmValue || "Unassigned";
    if (rmField) {
      const match = Array.from(rmField.options).find((option) => option.value === String(rmValue));
      if (match?.textContent) {
        rm = match.textContent.trim();
      }
    }
    const opened = payload?.OpenedOn || payload?.OpenedDate || new Date().toISOString();
    const modified = payload?.ModifiedOn || new Date().toISOString();
    const name = payload?.Name || payload?.ClientName || fallbackId || "Choose a client to begin";

    setText(this.summaryTargets.status, status);
    setText(this.summaryTargets.statusPill, status);
    setText(this.summaryTargets.opened, formatDate(opened));
    setText(this.summaryTargets.openedPill, formatDate(opened));
    setText(this.summaryTargets.modified, formatDate(modified, true));
    setText(this.summaryTargets.modifiedPill, formatDate(modified, true));
    setText(this.summaryTargets.createdPill, formatDate(payload?.CreatedOn || opened));
    setText(this.summaryTargets.rm, rm);
    setText(
      this.summaryTargets.summary,
      payload ? `Pulled from core at ${new Date().toLocaleTimeString()}` : "No upstream profile found. Capture the essentials to initiate."
    );
    setText(this.summaryTargets.workflow, payload?.WorkflowStatus || status);
    setText(this.summaryTargets.headline, name);
    if (this.nameField && !this.nameField.value) {
      this.nameField.value = name;
    }
    if (this.summaryTargets.segment) {
      const type = this.form.elements.ClientTypeID.value || payload?.ClientTypeID || "—";
      const segmentLabel = `Segment · ${type}`;
      this.summaryTargets.segment.textContent = segmentLabel;
    }
  }

  setMetaDefaults() {
    const createdBy = this.session?.name || "System";
    const userCode = this.session?.operatorId || createdBy;
    const now = new Date().toISOString();
    if (this.form.elements.CreatedBy) this.form.elements.CreatedBy.value = createdBy;
    if (this.form.elements.OpenedBy && !this.form.elements.OpenedBy.value) this.form.elements.OpenedBy.value = userCode;
    if (this.form.elements.CreatedOn) this.form.elements.CreatedOn.value = now;
    if (this.form.elements.ModifiedOn) this.form.elements.ModifiedOn.value = now;
    if (this.form.elements.OpenedDate && !this.form.elements.OpenedDate.value) {
      this.form.elements.OpenedDate.value = new Date().toISOString().slice(0, 10);
    }
  }

  updateScope() {
    const clientTypeField = this.form.elements.ClientTypeID;
    const clientType = clientTypeField ? clientTypeField.value : "";
    this.state.scopeTokens = deriveScopeTokens(clientType);
    this.state.scope = this.state.scopeTokens.includes(CLIENT_SCOPE.CORPORATE) ? CLIENT_SCOPE.CORPORATE : CLIENT_SCOPE.INDIVIDUAL;
    this.stepper?.setScope(this.state.scopeTokens);
    this.syncPanelFieldState();
    this.toggleScopedFields();
    this.toggleShellNavVisibility();
    this.syncShellNav(this.stepper?.activeStep);
    this.updateWindowBadges();
    this.updateSummaryMeta();
  }

  syncPanelFieldState() {
    this.stepper?.panels.forEach((panel) => disableFieldsInNode(panel, panel.hidden));
  }

  toggleScopedFields() {
    const activeTokens = new Set(["all", ...this.state.scopeTokens]);
    this.form.querySelectorAll("[data-client-scope]").forEach((node) => {
      const attr = (node.dataset.clientScope || "all").split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);
      let shouldShow = false;
      if (!attr.length || attr.includes("all")) {
        shouldShow = true;
      } else {
        shouldShow = attr.some((token) => activeTokens.has(token));
      }
      node.classList.toggle("d-none", !shouldShow);
      disableFieldsInNode(node, !shouldShow);
    });
  }

  updateClientName() {
    const first = this.form.elements.FirstName?.value?.trim() || "";
    const middle = this.form.elements.MiddleName?.value?.trim() || "";
    const last = this.form.elements.LastName?.value?.trim() || "";
    const company = this.form.elements.CompanyName?.value?.trim() || "";
    const name = this.state.scope === CLIENT_SCOPE.CORPORATE ? company : [first, middle, last].filter(Boolean).join(" ");
    if (this.nameField) {
      this.nameField.value = name || "Waiting for inputs";
    }
    setText(this.summaryTargets.headline, name || "Choose a client to begin");
  }

  updateAge() {
    const dobValue = this.form.elements.DateOfBirth?.value;
    const ageField = this.form.elements.Age;
    const ageAsOnField = this.form.elements.AgeAsOn;
    if (!dobValue || !ageField) return;
    const dob = new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return;
    const diff = Date.now() - dob.getTime();
    const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    ageField.value = `${age} yrs`;
    if (ageAsOnField) {
      ageAsOnField.value = new Date().toLocaleDateString();
    }
  }

  updateSummaryMeta() {
    const rmField = this.form.elements.RelationshipManager;
    const clientIdField = this.form.elements.ClientID;
    const clientTypeField = this.form.elements.ClientTypeID;
    if (this.summaryBadges.mode) {
      this.summaryBadges.mode.textContent = this.state.pageFunction;
    }
    if (this.summaryBadges.clientId) {
      this.summaryBadges.clientId.textContent = clientIdField?.value || "—";
    }
    if (this.summaryBadges.clientType) {
      this.summaryBadges.clientType.textContent = clientTypeField?.value || "—";
    }
    const inlineSegment = `Segment · ${clientTypeField?.value || "—"}`;
    setText(this.summaryTargets.segment, inlineSegment);
    if (this.summaryBadges.relationshipManager) {
      let label = "—";
      if (rmField && rmField.options && rmField.selectedIndex > -1) {
        label = rmField.options[rmField.selectedIndex]?.textContent?.trim() || rmField.value || "—";
      }
      this.summaryBadges.relationshipManager.textContent = label;
    }
  }

  collectBaseFields() {
    const data = {};
    Array.from(this.form.elements).forEach((field) => {
      if (!field.name || field.disabled) return;
      if (field.closest("[data-collection-item]") || field.closest("[data-document-row]")) return;
      if (field.type === "checkbox") {
        data[field.name] = field.checked;
      } else if (field.type === "radio") {
        if (field.checked) {
          data[field.name] = field.value;
        }
      } else {
        data[field.name] = field.value;
      }
    });
    return data;
  }

  buildPayload() {
    const base = this.collectBaseFields();
    base.ClientID = base.ClientID || this.state.requestCode || generateClientId();
    base.ClientTypeID = this.form.elements.ClientTypeID.value || base.ClientTypeID || "";
    base.OpenedBy = base.OpenedBy || this.session?.operatorId || this.session?.name || "System";
    base.CreatedBy = base.CreatedBy || this.session?.name || "System";
    base.CreatedOn = toISODate(base.CreatedOn) || new Date().toISOString();
    base.OpenedDate = toISODate(base.OpenedDate) || new Date().toISOString();
    base.ModifiedOn = new Date().toISOString();
    base.WFClientStatusID = base.WFClientStatusID || "A";
    base.IsDOBGiven = Boolean(base.DateOfBirth);
    base.Name = this.nameField?.value && this.nameField.value !== "Waiting for inputs" ? this.nameField.value : base.ClientID;
    base.Addresses = this.getAddresses();
    base.NextOfKin = [...this.collections.kin];
    base.EmploymentDetails = [...this.collections.employment];
    base.Directors = [...this.collections.directors];
    base.Documents = this.getDocumentPayload();
    base.Products = (this.products || []).map((product) => ({
      ProductID: product.id,
      ProductTypeID: product.productTypeId,
      Description: product.description,
      ProductTypeLabel: product.productTypeLabel || product.productTypeId || "",
      IsDefault: Boolean(product.isDefault),
      SerialNo: product.serialNo || 0
    }));
    base.Services = (this.services || [])
      .filter((service) => !!service.status)
      .map((service, index) => ({
        ServiceID: service.id,
        Name: service.name,
        Category: service.category || "",
        IsSelected: true,
        SerialNo: index + 1
      }));
    return base;
  }

  getDocumentPayload() {
    return Array.from(this.form.querySelectorAll('[data-document-row]')).map((row) => ({
      DocumentID: row.querySelector("[name='DocumentID']")?.value || "",
      DocumentTypeID: row.querySelector("[name='DocumentTypeID']")?.value || "",
      Description: row.querySelector("[name='Description']")?.value || row.__docData?.Description || "",
      Remarks: row.querySelector("[name='Remarks']")?.value || row.__docData?.Remarks || "",
      MimeType: row.__docData?.MimeType || "",
      sImage: row.__docData?.sImage || "",
      CreatedOn: row.__docData?.CreatedOn || new Date().toISOString(),
      CreatedBy: row.__docData?.CreatedBy || this.session?.name || "System",
      fileName: row.__docData?.fileName || row.__docData?.Description || ""
    }));
  }

  validateBeforeSubmit(payload, action) {
    let normalizedPayload = payload;
    if (this.state.scope === CLIENT_SCOPE.INDIVIDUAL && this.collections.kin.length) {
      const allocation = this.collections.kin.reduce((sum, entry) => sum + readNumber(entry.SharePercent), 0);
      if (Math.abs(allocation - 100) > 0.01) {
        throw new Error("Next of kin percentages must sum to 100%.");
      }
    }

    if (!payload.Addresses.length || !payload.Addresses[0].Address1) {
      throw new Error("At least one mailing address is required.");
    }

    const invalidAddress = payload.Addresses.some((address) => !address.Address1 || !address.CityID || !address.CountryID);
    if (invalidAddress) {
      throw new Error("Provide address line, city, and country for every address card.");
    }

    // Basic document validations (mirrors legacy document upload checks)
    const documents = Array.isArray(payload.Documents) ? payload.Documents : [];
    if (documents.length) {
      const invalidDocument = documents.some((doc) => !doc.DocumentID || !doc.DocumentTypeID || !doc.sImage);
      if (invalidDocument) {
        throw new Error("Each document row must have a document, type, and uploaded file.");
      }
    }

    if (this.state.scope === CLIENT_SCOPE.CORPORATE && this.totalDirectorShare() > 100) {
      throw new Error("Director share allocation cannot exceed 100%.");
    }

    const invalidEmployment = payload.EmploymentDetails.some((job) => {
      const hasAnyValue = Boolean(job.companyName || job.workPosition || job.startDate || job.endDate);
      if (!hasAnyValue) return false;
      return !job.companyName || !job.workPosition || !job.startDate || !job.endDate;
    });
    if (invalidEmployment) {
      throw new Error("Employment rows must include company, position, start, and end dates.");
    }

    if (window.ClientFormModel) {
      const model = new window.ClientFormModel(payload);
      const validation = model.validate();
      if (!validation.valid) {
        throw new Error(validation.errors.join(" | "));
      }
      normalizedPayload = model.toRequestPayload();
    }

    if (action === "approve") {
      normalizedPayload.WFClientStatusID = "APPROVED";
    }

    return normalizedPayload;
  }

  async handleSubmit(action = "save") {
    if (this.state.posting) return;
    try {
      this.state.posting = true;
      if (window.LegacyClientValidator && this.form) {
        const legacyResult = window.LegacyClientValidator.validateMandatory(this.form);
        if (!legacyResult.valid) {
          const first = legacyResult.errors[0];
          if (first?.element && typeof first.element.focus === "function") {
            this.ensureCollapsibleVisibleFor(first.element);
            first.element.focus();
          }
          throw new Error(legacyResult.errors.map((e) => e.message).join(" | "));
        }
      }
      const payload = this.buildPayload();
      const validatedPayload = this.validateBeforeSubmit(payload, action);
      const envelope = {
        RequestID: generateRandomId(),
        RequestData: validatedPayload,
        RequestTime: new Date().toISOString(),
        AppName: window.CoreBankingConfig?.appName || "CLIENT_DATA"
      };
      const serviceCall = this.resolveServiceCall(action);
      if (!serviceCall) throw new Error("No service available for this action.");
      this.showToast("Posting client request...", "info");
      const response = await serviceCall(envelope);
      const isSuccess = response?.ResponseCode === "00";
      this.showToast(response?.ResponseMessage || (isSuccess ? "Request complete." : "Check service response."), isSuccess ? "success" : "warning");
      if (isSuccess) {
        this.state.requestCode = validatedPayload.ClientID;
        if (action !== "approve" && this.state.pageFunction === "Add") {
          this.state.pageFunction = "Update";
          this.syncActionButtons();
        }
        this.populateClientSummary(validatedPayload, validatedPayload.ClientID);
        this.updateSummaryMeta();
      }
    } catch (error) {
      console.error(error);
      this.showToast(error.message || "Unable to submit request.", "danger");
    } finally {
      this.state.posting = false;
    }
  }

  resolveServiceCall(action) {
    if (!this.clientService) return null;
    if (this.state.pageFunction === "Add") {
      return this.clientService.createClient.bind(this.clientService);
    }
    if (action === "approve" || this.state.pageFunction === "Supervise" || this.state.pageFunction === "Update") {
      return this.clientService.updateClient.bind(this.clientService);
    }
    return this.clientService.createClient.bind(this.clientService);
  }

  handlePrimaryAction(action) {
    if (action === "save") {
      this.handleSubmit("save");
    } else if (action === "approve") {
      this.handleSubmit("approve");
    } else if (action === "cancel") {
      window.history.length > 1 ? window.history.back() : this.resetForm();
    } else if (action === "clear") {
      this.resetForm();
    }
  }

  resetForm() {
    this.form.reset();
    this.state.editing = { kin: null, employment: null, directors: null };
    this.collections = { kin: [], employment: [], directors: [] };
    if (this.state.pageFunction === "Add") {
      this.state.requestCode = "";
    }
    this.bootstrapAddresses();
    this.renderKinTable();
    this.renderEmploymentTable();
    this.renderDirectorsTable();
    this.clearDocumentsTable();
    this.updateScope();
    this.updateClientName();
    this.updateSummaryMeta();
    this.setMetaDefaults();
    const order = this.stepper?.getVisibleOrder?.() || [];
    if (order.length) {
      this.stepper.goTo(order[0]);
    }
    this.showToast("Form cleared.", "info");
  }

  showToast(message, variant = "info") {
    if (!this.toast) return;
    this.ensureCollapsibleVisibleFor(this.toast);
    this.toast.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning", "alert-info");
    this.toast.classList.add(`alert-${variant}`);
    this.toast.textContent = message;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toast.classList.add("d-none"), 4000);
  }
}

function initClientMaintenancePage() {
  const pageId = document.body.dataset.page;
  const supportedPages = ["client", "client-maintenance"];
  if (!supportedPages.includes(pageId)) return;
  new ClientMaintenancePage();
}

document.addEventListener("DOMContentLoaded", initClientMaintenancePage);

})(window);
