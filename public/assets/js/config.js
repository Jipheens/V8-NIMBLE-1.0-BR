(function (global) {
  // ============================
  // LOCAL / DEV ENVIRONMENT
  // ============================
  const config = {
    appName: "CLIENT_DATA",
    environment: "LOCAL",
    enableLogging: true,
    requestDefaults: {
      channel: "WEB_PORTAL",
      locale: "en-KE"
    },

    // Only host + port here (no path)
    apiHostUrl: "http://localhost:5059"
  };

  // ============================
  // UAT ENVIRONMENT (EXAMPLE)
  // Uncomment this block and comment the LOCAL one when deploying to UAT
  // ============================
  // const config = {
  //   appName: "CLIENT_DATA",
  //   environment: "UAT",
  //   enableLogging: true,
  //   requestDefaults: {
  //     channel: "WEB_PORTAL",
  //     locale: "en-KE"
  //   },
  //
  //   apiHostUrl: "http://172.17.40.51:5059"
  // };

  // ============================
  // PROD ENVIRONMENT (EXAMPLE)
  // ============================
  // const config = {
  //   appName: "CLIENT_DATA",
  //   environment: "PROD",
  //   enableLogging: false,
  //   requestDefaults: {
  //     channel: "WEB_PORTAL",
  //     locale: "en-KE"
  //   },
  //
  //   apiHostUrl: "http://your-prod-host:5059"
  // };

  global.CoreBankingConfig = Object.freeze(config);
})(window);
