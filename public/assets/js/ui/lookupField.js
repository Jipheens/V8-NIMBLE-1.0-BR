(function (global) {
  const lookupService = global.LookupService;
  if (!lookupService) {
    console.warn("LookupService missing. lookupField helpers disabled.");
    return;
  }

  const lookupMap = {
    clientTypes: "getClientTypes",
    identificationTypes: "getIdentificationTypes",
    residentStatuses: "getResidentStatuses",
    relationshipManagers: "getRelationshipManagers",
    relations: "getRelations",
    countries: "getCountries",
    cities: "getCities",
    titles: "getTitles",
    genders: "getGenders",
    literacyLevels: "getLiteracyLevels",
    maritalStatuses: "getMaritalStatuses",
    bloodGroups: "getBloodGroups",
    industries: "getIndustries",
    addressTypes: "getAddressTypes",
    businessOwnerships: "getBusinessOwnerships",
    businessLines: "getBusinessLines",
    regions: "getRegions",
    subCityZones: "getSubCityZones",
    languages: "getLanguages",
    documents: "getDocuments",
    documentTypes: "getDocumentTypes",
    occupations: "getOccupations",
    designations: "getDesignations",
    companyTypes: "getCompanyTypes"
  };

  function buildOption(option) {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    return element;
  }

  async function populateSelect(select, lookupKey) {
    const methodName = lookupMap[lookupKey];
    if (!methodName || typeof lookupService[methodName] !== "function") {
      console.warn(`Lookup key "${lookupKey}" not registered.`);
      return;
    }

    select.innerHTML = "";
    const placeholder = select.dataset.placeholder || "Select an option";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = !select.value;
    select.appendChild(placeholderOption);

    try {
      const options = await lookupService[methodName]();
      options.forEach((option) => select.appendChild(buildOption(option)));
    } catch (error) {
      console.error(`Failed to populate ${lookupKey}`, error);
    }
  }

  async function initLookupFields(root = document) {
    const selects = root.querySelectorAll("select[data-lookup]");
    await Promise.all(
      Array.from(selects).map((select) => populateSelect(select, select.dataset.lookup))
    );
  }

  global.initLookupFields = initLookupFields;
})(window);
