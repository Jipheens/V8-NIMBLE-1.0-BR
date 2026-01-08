(function (global) {
  const countries = global.CoreBankingCountries || [];
  const clientService = global.ClientService;
  const searchService = global.SearchService || clientService;

  const staticLookups = {
    clientTypes: [],
    titles: [],
    genders: [],
    literacyLevels: [],
    maritalStatuses: [],
    identificationTypes: [],
    residentStatuses: [],
    relations: [],
    managers: [],
    bloodGroups: [],
    cities: [],
    addressTypes: [],
    documents: [],
    documentTypes: [],
    industries: []
  };

  const cache = new Map();

  const mapCountries = () =>
    countries.map((country) => ({ value: country.code, label: country.name }));

  const mapSystemCodeDetails = (details = []) =>
    details.map((row) => ({ value: row.SubCodeID, label: row.CodeDescription, order: row.DisplayOrder ?? 0 }))
      .sort((a, b) => a.order - b.order);

  async function getSystemCodeOptions(codeId) {
    if (!clientService) {
      console.warn("ClientService not ready; system-code lookups aborted.");
      return [];
    }
    const cacheKey = `code:${codeId}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const payload = {
      RequestData: {
        CodeID: codeId
      }
    };
    try {
      const response = await clientService.getSystemCode(payload);
      const rows = response?.Details || response?.data || [];
      const options = mapSystemCodeDetails(Array.isArray(rows) ? rows : [rows]);
      cache.set(cacheKey, options);
      return options;
    } catch (error) {
      console.error("SystemCode lookup failed for", codeId, error);
      return [];
    }
  }

  class LookupService {
    async getClientTypes() {
      return getSystemCodeOptions("ClientTypeID");
    }

    async getTitles() {
      return getSystemCodeOptions("TitleID");
    }

    async getGenders() {
      return getSystemCodeOptions("GenderID");
    }

    async getLiteracyLevels() {
      return getSystemCodeOptions("LiteracyLevelID");
    }

    async getMaritalStatuses() {
      return getSystemCodeOptions("MaritalStatusID");
    }

    async getIdentificationTypes() {
      return getSystemCodeOptions("IdentityTypeID");
    }

    async getResidentStatuses() {
      return getSystemCodeOptions("ResidentStatusID");
    }

    async getRelationshipManagers() {
      return getSystemCodeOptions("RelationshipManagerID");
    }

    async getRelations() {
      return getSystemCodeOptions("RelationID");
    }

    async getCountries() {
      return getSystemCodeOptions("CountryID");
    }

    async getCities() {
      return getSystemCodeOptions("CityID");
    }

    async getBloodGroups() {
      return getSystemCodeOptions("BloodGroupID");
    }

    async getIndustries() {
      return getSystemCodeOptions("IndustryID");
    }

    async getRegions() {
      return getSystemCodeOptions("RegionID");
    }

    async getSubCityZones() {
      return getSystemCodeOptions("SubCityZoneID");
    }

    async getLanguages() {
      return getSystemCodeOptions("LanguageID");
    }

    async getOccupations() {
      return getSystemCodeOptions("OccupationID");
    }

    async getDesignations() {
      return getSystemCodeOptions("DesignationID");
    }

    async getCompanyTypes() {
      return getSystemCodeOptions("CompanyTypeID");
    }

    async getBusinessOwnerships() {
      return getSystemCodeOptions("BusinessOwnershipID");
    }

    async getBusinessLines() {
      return getSystemCodeOptions("BusinessLineID");
    }

    async getAddressTypes() {
      return getSystemCodeOptions("AddressTypeID");
    }

    async getDocuments() {
      return getSystemCodeOptions("DocumentID");
    }

    async getDocumentTypes() {
      return getSystemCodeOptions("DocumentTypeID");
    }

    async searchClients(term) {
      if (!term || term.length < 3) {
        return [];
      }
      if (!searchService) {
        console.warn("SearchService not ready; lookup search aborted.");
        return [];
      }

      const payload = {
        RequestData: {
          SearchTerm: term,
          Module: "CLIENT_MAINTENANCE"
        }
      };

      try {
        const response = await searchService.searchClients(payload);
        return response?.Details || response?.data || [];
      } catch (error) {
        console.error("Client search failed", error);
        return [];
      }
    }
  }

  global.LookupService = new LookupService();
})(window);
