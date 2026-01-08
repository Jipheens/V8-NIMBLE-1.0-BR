(function (global) {
  const CONFIG = global.CoreBankingConfig || {};

  const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "skipToken": "true"
  };

  const fallbackUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const makeRequestEnvelope = (data = {}) => ({
    RequestID: data.RequestID || (global.crypto?.randomUUID?.() ?? fallbackUUID()),
    RequestData: data.RequestData ?? data,
    RequestTime: new Date().toISOString(),
    AppName: CONFIG.appName
  });

  const parseResponse = async (response) => {
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = { ResponseCode: "XX", ResponseMessage: text };
      }
    }
    if (!response.ok) {
      const error = new Error(payload?.ResponseMessage || response.statusText);
      error.payload = payload;
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const request = async (url, options = {}) => {
    if (!url) {
      throw new Error("CoreApi endpoint missing. Check config.js");
    }
    const method = options.method || "POST";
    const fetchOptions = {
      method,
      headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) }
    };
    if (method === "GET") {
      fetchOptions.body = undefined;
    } else {
      fetchOptions.body = JSON.stringify(options.body || {});
    }

    if (CONFIG.enableLogging) {
      console.groupCollapsed(`[CoreApi] ${method} ${url}`);
      console.info("Payload", options.body);
      console.groupEnd();
    }

    const response = await fetch(url, fetchOptions);
    return parseResponse(response);
  };

  const CoreApi = {
    DEFAULT_HEADERS,
    fallbackUUID,
    makeRequestEnvelope,
    parseResponse,
    request
  };

  global.CoreApi = CoreApi;
})(window);
