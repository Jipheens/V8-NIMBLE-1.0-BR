const routeMap = {
  login: "login.html",
  dashboard: "dashboard.html",
  clientMaintenance: "modules/customer-management/client-maintenance.html",
  customerModuleDashboard: "modules/customer-management/dashboard.html"
};

const START_MENU_REGISTRY = {
  customer: {
    title: "Customer Management",
    items: [
      { label: "Client Maintenance", icon: "fas fa-address-card", modalId: "clientModal" },
      { label: "Overdraft Setup", icon: "fas fa-wave-square", modalId: "overdraftModal" },
      { label: "Workflow Queue", icon: "fas fa-route", modalId: "workflowModal" },
      { label: "Reports Center", icon: "fas fa-file-lines", modalId: "reportsModal" }
    ]
  },
  accounts: {
    title: "Accounts Suite",
    items: [
      { label: "Product Factory", icon: "fas fa-piggy-bank", modalId: "accountsModal" },
      { label: "Templates Library", icon: "fas fa-table-list", modalId: "accountsModal" }
    ]
  },
  loans: {
    title: "Loans Origination",
    items: [
      { label: "Origination Queue", icon: "fas fa-building-columns", modalId: "loansModal" },
      { label: "Disbursement Prep", icon: "fas fa-credit-card", modalId: "loansModal" }
    ]
  },
  treasury: {
    title: "Treasury & Markets",
    items: [
      { label: "Dealer Board", icon: "fas fa-coins", modalId: "treasuryModal" },
      { label: "Liquidity Sweeps", icon: "fas fa-water", modalId: "treasuryModal" }
    ]
  },
  workflow: {
    title: "Workflow Desk",
    items: [
      { label: "Work Manager", icon: "fas fa-route", modalId: "workflowModal" },
      { label: "Maker Checker", icon: "fas fa-user-check", modalId: "workflowModal" }
    ]
  },
  security: {
    title: "System Security",
    items: [
      { label: "User Access", icon: "fas fa-user-shield", modalId: "securityModal" },
      { label: "System BR.NET", icon: "fas fa-gear", modalId: "systemModal" }
    ]
  },
  reports: {
    title: "Reports Center",
    items: [
      { label: "Daily KYC Exceptions", icon: "fas fa-file-circle-check", modalId: "reportsModal" },
      { label: "Dormant Clients", icon: "fas fa-user-clock", modalId: "reportsModal" },
      { label: "Maker Checker Items", icon: "fas fa-list-check", modalId: "reportsModal" }
    ]
  }
};

const CORPORATE_CLIENT_TYPES = new Set(["C", "B"]);
const CLIENT_SCOPE = {
  INDIVIDUAL: "individual",
  CORPORATE: "corporate"
};

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const operatorIdField = form.querySelector("[name=operatorId]");
  const branchField = form.querySelector("[name=branchId]");
  const passwordField = form.querySelector("[name=password]");

  const operatorId = operatorIdField?.value.trim() || "";
  const password = passwordField?.value || "";
  const branchId = branchField?.value || "";

  const feedback = form.querySelector("#loginFeedback");
  const loginBtn = form.querySelector("button[type=submit]");

  if (!operatorId || !password || !branchId) {
    feedback.textContent = "Operator ID, password, and branch are all required.";
    feedback.classList.remove("d-none");
    return;
  }

  // Add loading state
  const originalBtnText = loginBtn.textContent;
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
  feedback.classList.add("d-none");

  try {
    if (typeof AuthService === 'undefined') {
      throw new Error("AuthService not loaded");
    }

    const result = await AuthService.login(operatorId, password, branchId);

    if (result.success) {
      window.location.replace(routeMap.dashboard);
    } else {
      feedback.textContent = result.message || "Login failed. Please check your credentials.";
      feedback.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Login Error", error);
    feedback.textContent = "An unexpected error occurred. Please try again.";
    feedback.classList.remove("d-none");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = originalBtnText;
  }
}

function requireAuth() {
  if (typeof AuthService === 'undefined') return; // Safety check if script not loaded yet

  if (!AuthService.isAuthenticated()) {
    window.location.replace(routeMap.login);
  }
}

function populateUserMeta() {
  if (typeof AuthService === 'undefined') return;

  const session = AuthService.getSession();
  if (!session) return;

  const nameTarget = document.querySelector("[data-user-name]");
  // const emailTarget = document.querySelector("[data-user-email]");

  if (nameTarget) {
    // Prefer Name, then RoleName, then OperatorID
    nameTarget.innerText = session.name || session.roleName || session.operatorID || "User";
  }
}

function wireLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof AuthService !== 'undefined') {
        AuthService.logout();
      } else {
        window.location.replace(routeMap.login);
      }
    });
  });
}

function resolveScopeFromClientType(clientType) {
  if (!clientType) {
    return CLIENT_SCOPE.INDIVIDUAL;
  }

  return CORPORATE_CLIENT_TYPES.has(clientType.trim().toUpperCase())
    ? CLIENT_SCOPE.CORPORATE
    : CLIENT_SCOPE.INDIVIDUAL;
}

function parseScopeList(node) {
  return (node.dataset.clientScope || "all")
    .split(",")
    .map((scope) => scope.trim().toLowerCase())
    .filter(Boolean);
}

function nodeSupportsScope(node, scope) {
  const scopes = parseScopeList(node);
  if (!scopes.length) return true;
  return scopes.includes("all") || scopes.includes(scope);
}

function toggleFieldState(field, shouldDisable) {
  if (shouldDisable) {
    if (field.required) {
      field.dataset.scopeRequired = "true";
      field.required = false;
    }
    if (!field.disabled) {
      field.dataset.scopeDisabled = "true";
      field.disabled = true;
    }
    return;
  }

  if (field.dataset.scopeRequired) {
    field.required = true;
    delete field.dataset.scopeRequired;
  }

  if (field.dataset.scopeDisabled) {
    field.disabled = false;
    delete field.dataset.scopeDisabled;
  }
}

function toggleFieldsWithinNode(node, shouldDisable) {
  const fieldSelector = "input, select, textarea";
  const targets = node.matches(fieldSelector) ? [node] : node.querySelectorAll(fieldSelector);
  targets.forEach((field) => toggleFieldState(field, shouldDisable));
}

function applyScopeToNode(node, scope) {
  const shouldShow = nodeSupportsScope(node, scope);
  const isTabTrigger = node.matches?.("[data-bs-toggle='tab']");
  const isTabPane = node.classList?.contains("tab-pane");

  node.classList.toggle("d-none", !shouldShow);

  if (isTabTrigger) {
    node.classList.toggle("disabled", !shouldShow);
    node.setAttribute("tabindex", shouldShow ? "0" : "-1");
    node.setAttribute("aria-hidden", (!shouldShow).toString());
    if (!shouldShow) {
      node.classList.remove("active");
    }
  } else if (!shouldShow) {
    node.setAttribute("aria-hidden", "true");
  } else {
    node.removeAttribute("aria-hidden");
  }

  if (isTabPane && !shouldShow) {
    node.classList.remove("show", "active");
  }

  toggleFieldsWithinNode(node, !shouldShow);
}

function ensureActiveTabMatchesScope(scope) {
  const activePane = document.querySelector(".tab-pane.active.show");
  if (activePane && nodeSupportsScope(activePane, scope)) {
    return;
  }

  const eligibleButton = Array.from(document.querySelectorAll("[data-bs-toggle='tab'][data-client-scope]"))
    .find((button) => nodeSupportsScope(button, scope));

  if (!eligibleButton) {
    return;
  }

  const bootstrapLib = window.bootstrap;
  if (bootstrapLib?.Tab) {
    const existingInstance = bootstrapLib.Tab.getInstance(eligibleButton) || new bootstrapLib.Tab(eligibleButton);
    existingInstance.show();
  } else {
    eligibleButton.click();
  }
}

function applyClientScope(scope) {
  document.body.dataset.activeClientScope = scope;
  document.querySelectorAll("[data-client-scope]").forEach((node) => applyScopeToNode(node, scope));
  ensureActiveTabMatchesScope(scope);
}

function initClientTypeScopeWatcher() {
  const clientTypeSelect = document.querySelector('select[name="ClientTypeID"]');
  if (!clientTypeSelect) return;

  const handleScopeChange = () => {
    const scope = resolveScopeFromClientType(clientTypeSelect.value);
    applyClientScope(scope);
    if (clientFormModel) {
      clientFormModel.updateField("ClientTypeID", clientTypeSelect.value);
    }
  };

  clientTypeSelect.addEventListener("change", handleScopeChange);
  handleScopeChange();
}

let clientFormModel;

function getFieldValue(input) {
  if (input.type === "checkbox") {
    return input.checked;
  }
  return input.value;
}

function hydrateModelFromForm(form) {
  if (!clientFormModel) return;
  const formData = new FormData(form);
  formData.forEach((value, key) => {
    if (key in clientFormModel.state) {
      clientFormModel.updateField(key, value);
    }
  });
  return clientFormModel;
}

async function handleClientSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("formToast");
  hydrateModelFromForm(form);

  const validation = clientFormModel.validate();
  if (!validation.valid) {
    if (feedback) {
      feedback.classList.remove("d-none", "alert-success");
      feedback.classList.add("alert-danger");
      feedback.innerHTML = validation.errors.map((err) => `<div>${err}</div>`).join("");
    }
    return;
  }

  const payload = clientFormModel.toRequestPayload();
  try {
    feedback?.classList.remove("d-none", "alert-danger");
    feedback?.classList.add("alert-info");
    if (feedback) {
      feedback.textContent = "Submitting client details...";
    }

    const response = await window.ClientService?.createClient({ RequestData: payload });
    const isSuccess = response?.ResponseCode === "00";
    if (feedback) {
      feedback.classList.remove("alert-info", "alert-danger");
      feedback.classList.add(isSuccess ? "alert-success" : "alert-warning");
      feedback.textContent = response?.ResponseMessage || (isSuccess ? "Client saved." : "Check response message.");
    }
  } catch (error) {
    console.error("Client submission failed", error);
    if (feedback) {
      feedback.classList.remove("d-none", "alert-success", "alert-info");
      feedback.classList.add("alert-danger");
      feedback.textContent = error?.message || "Failed to save client.";
    }
  }
}

function initClientForm() {
  const form = document.getElementById("client-form");
  if (!form) return;

  if (!window.ClientFormModel) {
    console.warn("ClientFormModel missing. Ensure models/clientFormModel.js is loaded.");
    return;
  }

  clientFormModel = new window.ClientFormModel();

  const syncField = (event) => {
    const input = event.target;
    if (!input?.name || !(input.name in clientFormModel.state)) return;
    clientFormModel.updateField(input.name, getFieldValue(input));
  };

  form.addEventListener("input", syncField);
  form.addEventListener("change", syncField);

  form.addEventListener("submit", handleClientSubmit);
}

function initTabs() {
  const hash = window.location.hash;
  if (!hash) return;
  const trigger = document.querySelector(`button[data-bs-target="${hash}"]`);
  if (trigger) {
    const tab = new bootstrap.Tab(trigger);
    tab.show();
  }
}

function initLegacyModuleDashboard() {
  const startToggle = document.querySelector("[data-start-toggle]");
  const startMenu = document.querySelector("[data-start-menu]");
  const startOverlay = document.querySelector("[data-start-overlay]");
  const navPanel = document.querySelector("[data-nav-panel]");
  const shell = document.querySelector("[data-shell]");
  const bootstrapLib = window.bootstrap;
  let navHoverTimeout = null;
  const modalOptions = {
    backdrop: false,
    focus: false,
    keyboard: true
  };

  const openModal = (modalId) => {
    if (!modalId || !bootstrapLib?.Modal) return;
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    minimizeOtherWindows(modalEl.id);
    const instance = bootstrapLib.Modal.getOrCreateInstance(modalEl, modalOptions);
    instance.show();
  };

  const closeStartMenu = () => {
    if (!startMenu) return;
    startMenu.classList.remove("is-visible");
    startOverlay?.classList.remove("is-visible");
  };

  if (startToggle && startMenu) {
    startToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isVisible = startMenu.classList.toggle("is-visible");
      if (isVisible) {
        startOverlay?.classList.add("is-visible");
      } else {
        startOverlay?.classList.remove("is-visible");
      }
    });

    startOverlay?.addEventListener("click", closeStartMenu);

    document.addEventListener("click", (event) => {
      if (!startMenu.contains(event.target) && !startToggle.contains(event.target)) {
        closeStartMenu();
      }
    });
  }

  const startModules = document.querySelectorAll(".start-module[data-module]");
  const submenuTitle = document.querySelector("[data-submenu-title]");
  const submenuList = document.querySelector("[data-submenu-list]");
  const navModuleButtons = document.querySelectorAll(".nav-item[data-module]");
  const navSubTitle = document.querySelector("[data-nav-subtitle]");
  const navSubList = document.querySelector("[data-nav-sub-list]");
  const taskbarContainer = document.querySelector("[data-taskbar]");

  const renderSubmenu = (moduleKey) => {
    if (!submenuList) return;
    submenuList.innerHTML = "";
    const moduleConfig = START_MENU_REGISTRY[moduleKey];
    if (!moduleConfig) {
      if (submenuTitle) {
        submenuTitle.textContent = "Select module";
      }
      return;
    }

    if (submenuTitle) {
      submenuTitle.textContent = moduleConfig.title;
    }

    moduleConfig.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "start-tile";
      if (item.modalId) {
        button.dataset.launchModal = item.modalId;
      }
      button.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        if (item.modalId) {
          openModal(item.modalId);
        } else if (item.route) {
          window.location.href = item.route;
        }
        closeStartMenu();
      });
      submenuList.appendChild(button);
    });
  };

  const activateStartModule = (targetButton) => {
    startModules.forEach((button) => {
      const isActive = button === targetButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  };

  startModules.forEach((button) => {
    const moduleKey = button.dataset.module;
    const selectModule = () => {
      activateStartModule(button);
      renderSubmenu(moduleKey);
    };
    button.addEventListener("mouseenter", selectModule);
    button.addEventListener("focus", selectModule);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectModule();
    });
  });

  const defaultModuleButton = document.querySelector(".start-module[data-default]") || startModules[0];
  if (defaultModuleButton) {
    activateStartModule(defaultModuleButton);
    renderSubmenu(defaultModuleButton.dataset.module);
  }

  const renderNavSubmenu = (moduleKey) => {
    if (!navSubList) return;
    navSubList.innerHTML = "";
    const moduleConfig = START_MENU_REGISTRY[moduleKey];
    if (!moduleConfig) {
      if (navSubTitle) {
        navSubTitle.textContent = "Sub Modules";
      }
      const placeholder = document.createElement("p");
      placeholder.className = "nav-sub-placeholder";
      placeholder.textContent = "No shortcuts configured for this module.";
      navSubList.appendChild(placeholder);
      return;
    }

    if (navSubTitle) {
      navSubTitle.textContent = moduleConfig.title;
    }

    moduleConfig.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nav-sub-item";
      button.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        if (item.modalId) {
          openModal(item.modalId);
        } else if (item.route) {
          window.location.href = item.route;
        }
        closeStartMenu();
      });
      navSubList.appendChild(button);
    });
  };

  const highlightNavModule = (targetButton) => {
    navModuleButtons.forEach((button) => {
      const isActive = button === targetButton;
      button.classList.toggle("is-highlight", isActive);
    });
  };

  navModuleButtons.forEach((button) => {
    const moduleKey = button.dataset.module;
    const showSubmodules = () => {
      highlightNavModule(button);
      renderNavSubmenu(moduleKey);
    };
    button.addEventListener("mouseenter", showSubmodules);
    button.addEventListener("focus", showSubmodules);
  });

  const defaultNavButton = document.querySelector(".nav-item[data-nav-default]") || navModuleButtons[0];
  if (defaultNavButton) {
    highlightNavModule(defaultNavButton);
    renderNavSubmenu(defaultNavButton.dataset.module);
  }

  const getTaskbarButton = (modalId) => taskbarContainer?.querySelector(`[data-taskbar-modal='${modalId}']`);

  const removeTaskbarButton = (modalId) => {
    const button = getTaskbarButton(modalId);
    if (button) {
      button.remove();
    }
  };

  const setTaskbarState = (modalId, isActive) => {
    const button = getTaskbarButton(modalId);
    if (button) {
      button.classList.toggle("is-active", Boolean(isActive));
    }
  };

  const ensureTaskbarButton = (modalEl) => {
    if (!taskbarContainer || !modalEl?.id) return null;
    let button = getTaskbarButton(modalEl.id);
    if (button) return button;
    const iconClass = modalEl.dataset.windowIcon || "far fa-window-maximize";
    const title = modalEl.dataset.windowTitle || modalEl.querySelector(".modal-title")?.textContent?.trim() || "Window";
    button = document.createElement("button");
    button.type = "button";
    button.className = "taskbar-item";
    button.dataset.taskbarModal = modalEl.id;
    button.innerHTML = `<i class="${iconClass}"></i> ${title}`;
    button.addEventListener("click", () => {
      const isVisible = modalEl.classList.contains("show");
      if (isVisible) {
        minimizeModal(modalEl);
      } else {
        modalEl.dataset.windowState = "active";
        bootstrapLib?.Modal.getOrCreateInstance(modalEl, modalOptions).show();
      }
    });
    taskbarContainer.appendChild(button);
    return button;
  };

  const minimizeModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.dataset.windowState = "minimized";
    ensureTaskbarButton(modalEl);
    closeStartMenu();
    bootstrapLib?.Modal.getOrCreateInstance(modalEl, modalOptions)?.hide();
  };

  const minimizeOtherWindows = (nextModalId) => {
    document.querySelectorAll(".legacy-modal.show").forEach((modalEl) => {
      if (!modalEl.id || modalEl.id === nextModalId) return;
      minimizeModal(modalEl);
    });
  };

  const toggleMaximizeModal = (modalEl, trigger) => {
    if (!modalEl) return;
    const dialog = modalEl.querySelector(".modal-dialog");
    if (!dialog) return;
    const isMaximized = dialog.classList.toggle("is-maximized");
    const icon = trigger?.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-square", !isMaximized);
      icon.classList.toggle("fa-clone", isMaximized);
    }
  };

  const closeModalWindow = (modalEl) => {
    if (!modalEl) return;
    modalEl.dataset.windowState = "closing";
    bootstrapLib?.Modal.getOrCreateInstance(modalEl, modalOptions)?.hide();
  };

  document.querySelectorAll("[data-window-action]").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const modalEl = control.closest(".legacy-modal");
      if (!modalEl) return;
      const action = control.dataset.windowAction;
      if (action === "minimize") {
        minimizeModal(modalEl);
      } else if (action === "maximize") {
        toggleMaximizeModal(modalEl, control);
      } else if (action === "close") {
        closeModalWindow(modalEl);
      }
    });
  });

  const revealNavPanel = () => {
    if (!navPanel) return;
    if (navHoverTimeout) {
      clearTimeout(navHoverTimeout);
      navHoverTimeout = null;
    }
    navPanel.classList.add("is-visible");
    shell?.classList.add("nav-visible");
  };

  const hideNavPanel = () => {
    if (!navPanel) return;
    if (navHoverTimeout) {
      clearTimeout(navHoverTimeout);
    }
    navHoverTimeout = setTimeout(() => {
      navPanel.classList.remove("is-visible");
      shell?.classList.remove("nav-visible");
    }, 120);
  };

  if (startToggle && navPanel) {
    startToggle.addEventListener("mouseenter", revealNavPanel);
    startToggle.addEventListener("mouseleave", hideNavPanel);
  }

  if (navPanel) {
    navPanel.addEventListener("mouseenter", revealNavPanel);
    navPanel.addEventListener("mouseleave", hideNavPanel);
  }

  document.querySelectorAll("[data-launch-modal]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openModal(trigger.dataset.launchModal);
      closeStartMenu();
    });
  });

  document.querySelectorAll(".legacy-modal").forEach((modalEl) => {
    modalEl.setAttribute("data-bs-backdrop", "false");
    modalEl.setAttribute("data-bs-keyboard", "true");
    modalEl.addEventListener("show.bs.modal", () => {
      modalEl.dataset.windowState = "active";
    });

    modalEl.addEventListener("shown.bs.modal", () => {
      modalEl.dataset.windowState = "active";
      setTaskbarState(modalEl.id, true);
    });

    modalEl.addEventListener("hide.bs.modal", () => {
      if (modalEl.dataset.windowState !== "minimized") {
        modalEl.dataset.windowState = "closing";
      }
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      const wasMinimized = modalEl.dataset.windowState === "minimized";
      if (!wasMinimized) {
        removeTaskbarButton(modalEl.id);
        const dialog = modalEl.querySelector(".modal-dialog");
        dialog?.classList.remove("is-maximized");
      }
      setTaskbarState(modalEl.id, false);
      delete modalEl.dataset.windowState;
    });
  });
}

function initApp() {
  const page = document.body.dataset.page;

  if (page === "login") {
    const loginForm = document.getElementById("loginForm");
    loginForm?.addEventListener("submit", handleLogin);
    return;
  }

  requireAuth();
  populateUserMeta();
  wireLogoutButtons();

  if (page === "client") {
    const startClientFlows = () => {
      initClientForm();
      initTabs();
      initClientTypeScopeWatcher();
    };

    if (typeof window.initLookupFields === "function") {
      window
        .initLookupFields()
        .then(startClientFlows)
        .catch((error) => {
          console.error("Lookup initialization failed", error);
          startClientFlows();
        });
    } else {
      startClientFlows();
    }
  }

  if (page === "module-dashboard") {
    initLegacyModuleDashboard();
  }
}

document.addEventListener("DOMContentLoaded", initApp);
