(function (global) {
  const CONFIG = global.CoreBankingConfig || {};
  const CoreApi = global.CoreApi;

  if (!CoreApi) {
    console.error("CoreApi is not loaded. Ensure services/shared/coreApi.js is included before clientService.js.");
    return;
  }

  const HOST = (CONFIG.apiHostUrl || "").replace(/\/+$/, "");
  const CORE_BASE = `${HOST}/api/v1`;

  const endpoints = {
    getClient: `${CORE_BASE}/ClientMaintenance/GetClient`,
    createClient: `${CORE_BASE}/ClientMaintenance/CreateClient`,
    updateClient: `${CORE_BASE}/ClientMaintenance/UpdateClient`,
    searchClients: `${CORE_BASE}/Shared/GetSystemSearch`,
    getSystemCode: `${CORE_BASE}/Shared/GetSystemCode`
  };

  const clientService = {
    getClient(payload) {
      return CoreApi.request(endpoints.getClient, { body: CoreApi.makeRequestEnvelope(payload) });
    },
    getSystemCode(payload) {
      return CoreApi.request(endpoints.getSystemCode, { body: CoreApi.makeRequestEnvelope(payload) });
    },
    searchClients(payload) {
      return CoreApi.request(endpoints.searchClients, { body: CoreApi.makeRequestEnvelope(payload) });
    },
    createClient(payload) {
      return CoreApi.request(endpoints.createClient, { body: CoreApi.makeRequestEnvelope(payload) });
    },
    updateClient(payload) {
      return CoreApi.request(endpoints.updateClient, { body: CoreApi.makeRequestEnvelope(payload) });
    },
    setHeader(name, value) {
      CoreApi.DEFAULT_HEADERS[name] = value;
    }
  };

  global.ClientService = clientService;
})(window);
