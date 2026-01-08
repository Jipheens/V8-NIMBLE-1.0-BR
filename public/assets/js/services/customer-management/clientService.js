(function (global) {
  if (!global.ClientService) {
    console.warn("Customer Management clientService shim loaded before core ClientService. Ensure services/clientService.js is included.");
    return;
  }

  // Expose an explicit alias for this module without redefining any shared logic.
  global.CustomerManagementClientService = global.ClientService;
})(window);
