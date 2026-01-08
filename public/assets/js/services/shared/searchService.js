(function (global) {
  const CONFIG = global.CoreBankingConfig || {};
  const CoreApi = global.CoreApi;

  if (!CoreApi) {
    console.error("CoreApi is not loaded. Ensure services/shared/coreApi.js is included before searchService.js.");
    return;
  }

  const HOST = (CONFIG.apiHostUrl || "").replace(/\/+$/, "");
  const CORE_BASE = `${HOST}/api/v1`;
  const SEARCH_ENDPOINT = `${CORE_BASE}/Shared/GetSystemCode`;

  const SearchService = {
    /**
     * Perform a client search using the Shared/GetSystemSearch endpoint.
     * Accepts either a full envelope-like payload or a bare RequestData object;
     * everything is wrapped using CoreApi.makeRequestEnvelope for consistency.
     */
    async searchClients(payloadOrRequestData = {}) {
      let payload = payloadOrRequestData || {};

      // If the caller passed bare RequestData, wrap it.
      if (!payload.RequestData) {
        payload = { RequestData: payload };
      }

      return CoreApi.request(SEARCH_ENDPOINT, {
        body: CoreApi.makeRequestEnvelope(payload)
      });
    }
  };

  global.SearchService = SearchService;
})(window);
