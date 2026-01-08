(function (global) {
  const DEFAULT_ADDRESS = () => ({
    AddressTypeID: "M",
    Address1: "",
    Address2: "",
    CityID: "",
    CountryID: "KE",
    Mobile: "",
    Email: "",
    IsMailingAddress: false,
    CreatedBy: "System",
    CreatedOn: new Date().toISOString(),
    UpdateCount: 0
  });

  const DEFAULT_NEXT_OF_KIN = () => ({
    ID: null,
    ClientID: "",
    RelatedClientID: "",
    RelationID: "",
    RelationRefNo: 1,
    Remarks: "",
    SharePercent: 0,
    UpdateCount: 0,
    CreatedBy: "System",
    CreatedOn: new Date().toISOString()
  });

  const DEFAULT_EMPLOYMENT = () => ({
    companyName: "",
    workPosition: "",
    startDate: "",
    endDate: ""
  });

  const DEFAULT_DIRECTOR = () => ({
    id: null,
    clientName: "",
    relation: "",
    share: 0
  });

  const DEFAULT_DOCUMENT = () => ({
    DocumentID: "",
    DocumentTypeID: "",
    MimeType: "",
    Description: "",
    ImageID: 0,
    sImage: "",
    Remarks: "",
    CreatedOn: new Date().toISOString(),
    CreatedBy: "System",
    ModifiedBy: "",
    ModifiedOn: "",
    UpdateCount: 0,
    isExistingFile: false,
    fileName: ""
  });

  const BASE_STATE = () => ({
    ClientID: "",
    ClientTypeID: "",
    NationalityID: "",
    CompanyName: "",
    Constitution: "",
    NatureOfBusiness: "",
    RegistrationNumber: "",
    RegisteredAt: "",
    RegisteredOffice: "",
    DateOfRegistration: "",
    Comments: "",
    Website: "",
    LineOfBusiness: "",
    LineOfBusinessOther: "",
    TitleID: "",
    IdentificationTypeID: "",
    PassportNo: "",
    IDExpiryDate: "",
    ResidentID: "",
    RelationshipManager: "",
    FirstName: "",
    MiddleName: "",
    LastName: "",
    DateOfBirth: "",
    IsDOBGiven: false,
    NationalId: "",
    GenderID: "M",
    KRAPin: "",
    Disabled: false,
    DisabledRegNo: "",
    NumberOfHouseMembers: 1,
    CanDonateBlood: false,
    IsSalaried: false,
    PersonalPhone: "",
    AlternativePhone: "",
    AlternativeEmail: "",
    BlackList: false,
    UnderLawSuit: false,
    CloseLawSuit: false,
    CNFSO: false,
    ClientArea: "",
    PersonalStatus: "",
    NBEImportAccountID: "",
    NBEExportAccountID: "",
    TradeLicenseNo: "",
    WFClientStatusID: "A",
    OpenedBy: "System",
    CreatedBy: "System",
    CreatedOn: new Date().toISOString(),
    OpenedDate: new Date().toISOString(),
    UpdateCount: 0,
    CanSendGreetings: false,
    CanSendAssociateSpecialOffer: false,
    CanSendOurSpecialOffers: false,
    eStatementRequired: false,
    MobileAlertRequired: false,
    ParentClientID1: "",
    ParentClientID2: "",
    GroupName: "",
    CenterID: "",
    GroupID: "",
    GroupType: "",
    MeetingDay: "",
    MeetingVenue: "",
    JoinOn: "",
    ContributionCycle: "",
    MaxMembers: 0,
    MaxGroupLoans: 0,
    GroupObjective: "",
    Addresses: [DEFAULT_ADDRESS()],
    NextOfKin: [],
    EmploymentDetails: [],
    Directors: [],
    Documents: []
  });

  const normalizeBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (value === null || value === undefined) return fallback;
    if (typeof value === "number") return value !== 0;
    const normalized = value.toString().trim().toLowerCase();
    return ["true", "1", "y", "yes"].includes(normalized) || fallback;
  };

  const normalizeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === "") return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const normalizeString = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    return value.toString().trim();
  };

  const deepClone = (input) => JSON.parse(JSON.stringify(input));

  const isValidEmailFormat = (value) => {
    if (!value) return true;
    const normalized = value.toString().trim();
    if (!normalized) return true;
    // Simple, robust email pattern – mirrors legacy fnCheckEmail intent
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(normalized);
  };

  const FIELD_LABELS = {
    ClientID: "Client ID",
    ClientTypeID: "Client Type",
    NationalityID: "Nationality",
    CompanyName: "Company Name",
    Constitution: "Constitution",
    NatureOfBusiness: "Nature Of Business",
    RegistrationNumber: "Registration Number",
    RegisteredAt: "Registered At",
    RegisteredOffice: "Registered Office",
    DateOfRegistration: "Date Of Registration",
    TitleID: "Title",
    IdentificationTypeID: "Identification Type",
    PassportNo: "Passport No",
    IDExpiryDate: "Identification Expiry Date",
    ResidentID: "Resident Status",
    RelationshipManager: "Relationship Manager",
    FirstName: "First Name",
    MiddleName: "Middle Name",
    LastName: "Last Name",
    DateOfBirth: "Date Of Birth",
    NationalId: "Identification No",
    GenderID: "Gender",
    KRAPin: "KRA PIN",
    Disabled: "Disabled Flag",
    DisabledRegNo: "Disability Registration No",
    NumberOfHouseMembers: "Number Of House Members",
    CanDonateBlood: "Can Donate Blood",
    IsSalaried: "Income Type",
    PersonalPhone: "Personal Phone",
    AlternativePhone: "Alternative Phone",
    AlternativeEmail: "Alternative Email",
    BlackList: "Black List",
    UnderLawSuit: "Under Law Suit",
    CloseLawSuit: "Close Law Suit",
    CNFSO: "CNFSO",
    ClientArea: "Client Area",
    PersonalStatus: "Personal Status",
    NBEImportAccountID: "NBE Import Account ID",
    NBEExportAccountID: "NBE Export Account ID",
    TradeLicenseNo: "Trade License No",
    LineOfBusiness: "Line Of Business",
    LineOfBusinessOther: "Line Of Business Other",
    WFClientStatusID: "Workflow Status",
    OpenedBy: "Opened By",
    CreatedBy: "Created By",
    CreatedOn: "Created On",
    OpenedDate: "Opened On",
    GroupName: "Group Name",
    CenterID: "Center ID",
    GroupID: "Group ID",
    GroupType: "Group Type",
    MeetingDay: "Meeting Day",
    MeetingVenue: "Meeting Venue",
    JoinOn: "Join On",
    ContributionCycle: "Contribution Cycle",
    MaxMembers: "Max Members",
    MaxGroupLoans: "Max Group Loans",
    GroupObjective: "Group Objective"
  };

  class ClientFormModel {
    constructor(initialState = {}) {
      const base = BASE_STATE();
      this.state = Object.assign(base, this.#normalize(initialState));
      if (!this.state.Addresses.length) this.state.Addresses.push(DEFAULT_ADDRESS());
    }

    #normalize(payload = {}) {
      const normalized = { ...payload };
      normalized.ClientID = normalizeString(payload.ClientID);
      normalized.ClientTypeID = normalizeString(payload.ClientTypeID);
      normalized.NationalityID = normalizeString(payload.NationalityID);
      normalized.CompanyName = normalizeString(payload.CompanyName);
      normalized.Constitution = normalizeString(payload.Constitution);
      normalized.NatureOfBusiness = normalizeString(payload.NatureOfBusiness);
      normalized.RegistrationNumber = normalizeString(payload.RegistrationNumber);
      normalized.RegisteredAt = normalizeString(payload.RegisteredAt);
      normalized.RegisteredOffice = normalizeString(payload.RegisteredOffice);
      normalized.DateOfRegistration = normalizeString(payload.DateOfRegistration);
      normalized.Comments = normalizeString(payload.Comments);
      normalized.Website = normalizeString(payload.Website);
      normalized.LineOfBusiness = normalizeString(payload.LineOfBusiness);
      normalized.LineOfBusinessOther = normalizeString(payload.LineOfBusinessOther);
      normalized.TitleID = normalizeString(payload.TitleID);
      normalized.IdentificationTypeID = normalizeString(payload.IdentificationTypeID);
      normalized.PassportNo = normalizeString(payload.PassportNo);
      normalized.IDExpiryDate = normalizeString(payload.IDExpiryDate);
      normalized.ResidentID = normalizeString(payload.ResidentID);
      normalized.RelationshipManager = normalizeString(payload.RelationshipManager);
      normalized.FirstName = normalizeString(payload.FirstName);
      normalized.MiddleName = normalizeString(payload.MiddleName);
      normalized.LastName = normalizeString(payload.LastName);
      normalized.DateOfBirth = normalizeString(payload.DateOfBirth);
      normalized.IsDOBGiven = normalizeBoolean(payload.IsDOBGiven, !!payload?.DateOfBirth);
      normalized.NationalId = normalizeString(payload.NationalId);
      normalized.GenderID = normalizeString(payload.GenderID || "M");
      normalized.KRAPin = normalizeString(payload.KRAPin);
      normalized.Disabled = normalizeBoolean(payload.Disabled);
      normalized.DisabledRegNo = normalizeString(payload.DisabledRegNo);
      normalized.NumberOfHouseMembers = normalizeNumber(payload.NumberOfHouseMembers, 1);
      normalized.CanDonateBlood = normalizeBoolean(payload.CanDonateBlood);
      normalized.IsSalaried = normalizeBoolean(payload.IsSalaried);
      normalized.PersonalPhone = normalizeString(payload.PersonalPhone);
      normalized.AlternativePhone = normalizeString(payload.AlternativePhone);
      normalized.AlternativeEmail = normalizeString(payload.AlternativeEmail);
      normalized.BlackList = normalizeBoolean(payload.BlackList);
      normalized.UnderLawSuit = normalizeBoolean(payload.UnderLawSuit);
      normalized.CloseLawSuit = normalizeBoolean(payload.CloseLawSuit);
      normalized.CNFSO = normalizeBoolean(payload.CNFSO);
      normalized.ClientArea = normalizeString(payload.ClientArea);
      normalized.PersonalStatus = normalizeString(payload.PersonalStatus);
      normalized.NBEImportAccountID = normalizeString(payload.NBEImportAccountID);
      normalized.NBEExportAccountID = normalizeString(payload.NBEExportAccountID);
      normalized.TradeLicenseNo = normalizeString(payload.TradeLicenseNo);
      normalized.WFClientStatusID = normalizeString(payload.WFClientStatusID || "A");
      normalized.OpenedBy = normalizeString(payload.OpenedBy || "System");
      normalized.CreatedBy = normalizeString(payload.CreatedBy || "System");
      normalized.CreatedOn = payload.CreatedOn || new Date().toISOString();
      normalized.OpenedDate = payload.OpenedDate || new Date().toISOString();
      normalized.UpdateCount = normalizeNumber(payload.UpdateCount, 0);
      normalized.CanSendGreetings = normalizeBoolean(payload.CanSendGreetings);
      normalized.CanSendAssociateSpecialOffer = normalizeBoolean(payload.CanSendAssociateSpecialOffer);
      normalized.CanSendOurSpecialOffers = normalizeBoolean(payload.CanSendOurSpecialOffers);
      normalized.eStatementRequired = normalizeBoolean(payload.eStatementRequired);
      normalized.MobileAlertRequired = normalizeBoolean(payload.MobileAlertRequired);
      normalized.ParentClientID1 = normalizeString(payload.ParentClientID1);
      normalized.ParentClientID2 = normalizeString(payload.ParentClientID2);
      normalized.GroupName = normalizeString(payload.GroupName);
      normalized.CenterID = normalizeString(payload.CenterID);
      normalized.GroupID = normalizeString(payload.GroupID);
      normalized.GroupType = normalizeString(payload.GroupType);
      normalized.MeetingDay = normalizeString(payload.MeetingDay);
      normalized.MeetingVenue = normalizeString(payload.MeetingVenue);
      normalized.JoinOn = normalizeString(payload.JoinOn);
      normalized.ContributionCycle = normalizeString(payload.ContributionCycle);
      normalized.MaxMembers = normalizeNumber(payload.MaxMembers);
      normalized.MaxGroupLoans = normalizeNumber(payload.MaxGroupLoans);
      normalized.GroupObjective = normalizeString(payload.GroupObjective);

      normalized.Addresses = (payload.Addresses || []).map((address) => this.#normalizeAddress(address));
      normalized.NextOfKin = (payload.NextOfKin || []).map((kin) => this.#normalizeNextOfKin(kin));
      normalized.EmploymentDetails = (payload.EmploymentDetails || []).map((job) => this.#normalizeEmployment(job));
      normalized.Directors = (payload.Directors || []).map((director) => this.#normalizeDirector(director));
      normalized.Documents = (payload.Documents || []).map((doc) => this.#normalizeDocument(doc));

      return normalized;
    }

    #normalizeAddress(address = {}) {
      const normalized = DEFAULT_ADDRESS();
      return {
        ...normalized,
        ...address,
        AddressTypeID: normalizeString(address.AddressTypeID || normalized.AddressTypeID),
        Address1: normalizeString(address.Address1),
        Address2: normalizeString(address.Address2),
        CityID: normalizeString(address.CityID),
        CountryID: normalizeString(address.CountryID || "KE"),
        Mobile: normalizeString(address.Mobile),
        Email: normalizeString(address.Email),
        IsMailingAddress: normalizeBoolean(address.IsMailingAddress),
        CreatedBy: normalizeString(address.CreatedBy || normalized.CreatedBy),
        CreatedOn: address.CreatedOn || normalized.CreatedOn,
        UpdateCount: normalizeNumber(address.UpdateCount)
      };
    }

    #normalizeNextOfKin(kin = {}) {
      const normalized = DEFAULT_NEXT_OF_KIN();
      return {
        ...normalized,
        ...kin,
        ClientID: normalizeString(kin.ClientID),
        RelatedClientID: normalizeString(kin.RelatedClientID),
        RelationID: normalizeString(kin.RelationID || ""),
        RelationRefNo: normalizeNumber(kin.RelationRefNo, 1),
        Remarks: normalizeString(kin.Remarks),
        SharePercent: normalizeNumber(kin.SharePercent, 0),
        UpdateCount: normalizeNumber(kin.UpdateCount)
      };
    }

    #normalizeEmployment(job = {}) {
      const normalized = DEFAULT_EMPLOYMENT();
      return {
        ...normalized,
        ...job,
        companyName: normalizeString(job.companyName),
        workPosition: normalizeString(job.workPosition),
        startDate: normalizeString(job.startDate),
        endDate: normalizeString(job.endDate)
      };
    }

    #normalizeDirector(director = {}) {
      const normalized = DEFAULT_DIRECTOR();
      return {
        ...normalized,
        ...director,
        clientName: normalizeString(director.clientName),
        relation: normalizeString(director.relation),
        share: normalizeNumber(director.share, 0)
      };
    }

    #normalizeDocument(document = {}) {
      const normalized = DEFAULT_DOCUMENT();
      return {
        ...normalized,
        ...document,
        DocumentID: normalizeString(document.DocumentID),
        DocumentTypeID: normalizeString(document.DocumentTypeID),
        MimeType: normalizeString(document.MimeType),
        Description: normalizeString(document.Description),
        Remarks: normalizeString(document.Remarks),
        CreatedBy: normalizeString(document.CreatedBy || normalized.CreatedBy),
        CreatedOn: document.CreatedOn || normalized.CreatedOn,
        ModifiedBy: normalizeString(document.ModifiedBy),
        ModifiedOn: normalizeString(document.ModifiedOn),
        UpdateCount: normalizeNumber(document.UpdateCount),
        fileName: normalizeString(document.fileName)
      };
    }

    updateField(key, value) {
      this.state[key] = value;
    }

    addAddress(address = {}) {
      this.state.Addresses.push(this.#normalizeAddress(address));
    }

    removeAddress(index) {
      this.state.Addresses.splice(index, 1);
      if (!this.state.Addresses.length) this.state.Addresses.push(DEFAULT_ADDRESS());
    }

    addNextOfKin(data = {}) {
      this.state.NextOfKin.push(this.#normalizeNextOfKin(data));
    }

    updateNextOfKin(index, data) {
      this.state.NextOfKin[index] = this.#normalizeNextOfKin(data);
    }

    removeNextOfKin(index) {
      this.state.NextOfKin.splice(index, 1);
    }

    addEmployment(data = {}) {
      this.state.EmploymentDetails.push(this.#normalizeEmployment(data));
    }

    updateEmployment(index, data) {
      this.state.EmploymentDetails[index] = this.#normalizeEmployment(data);
    }

    removeEmployment(index) {
      this.state.EmploymentDetails.splice(index, 1);
    }

    addDocument(document = {}) {
      this.state.Documents.push(this.#normalizeDocument(document));
    }

    updateDocument(index, document) {
      this.state.Documents[index] = this.#normalizeDocument(document);
    }

    removeDocument(index) {
      this.state.Documents.splice(index, 1);
    }

    totalNextOfKinShare() {
      return this.state.NextOfKin.reduce((sum, kin) => sum + (Number(kin.SharePercent) || 0), 0);
    }

    totalDirectorShare() {
      return this.state.Directors.reduce((sum, director) => sum + (Number(director.share) || 0), 0);
    }

    validate() {
      const errors = [];
      const baseRequired = ["ClientID", "ClientTypeID", "RelationshipManager", "WFClientStatusID", "OpenedBy", "CreatedBy", "CreatedOn", "OpenedDate"];
      const corporateRequired = [
        "CompanyName",
        "RegistrationNumber",
        "Constitution",
        "NatureOfBusiness",
        "RegisteredAt",
        "RegisteredOffice",
        "DateOfRegistration",
        "KRAPin"
      ];
      const individualRequired = [
        "IdentificationTypeID",
        "ResidentID",
        "FirstName",
        "LastName",
        "DateOfBirth",
        "NationalId",
        "KRAPin",
        "NumberOfHouseMembers",
        "CanDonateBlood",
        "IsSalaried"
      ];

      const requiredFields = baseRequired.concat(this.isCorporateClient() ? corporateRequired : individualRequired);

      requiredFields.forEach((field) => {
        if (!this.state[field]) {
          const label = FIELD_LABELS[field] || field;
          errors.push(`${label} is required.`);
        }
      });

      // Email format checks (mirrors legacy validateEmail behaviour)
      if (this.state.AlternativeEmail && !isValidEmailFormat(this.state.AlternativeEmail)) {
        errors.push("Alternative Email is not a valid email address.");
      }

      // Address-level email validation
      this.state.Addresses.forEach((address, index) => {
        if (address.Email && !isValidEmailFormat(address.Email)) {
          const label = index === 0 ? "Primary address email" : `Address ${index + 1} email`;
          errors.push(`${label} is not a valid email address.`);
        }
      });

      if (!this.isCorporateClient() && this.totalNextOfKinShare() !== 0 && Math.abs(this.totalNextOfKinShare() - 100) > 0.01) {
        errors.push("Next of kin share allocation must equal 100%.");
      }

      if (!this.state.Addresses.length) {
        errors.push("At least one address is required.");
      } else {
        const invalidAddress = this.state.Addresses.some((address) => !address.Address1 || !address.CityID || !address.CountryID);
        if (invalidAddress) {
          errors.push("Provide address line, city, and country for each address card.");
        }
      }

      if (this.isCorporateClient() && this.totalDirectorShare() > 100) {
        errors.push("Director share allocation cannot exceed 100%.");
      }

      const invalidEmployment = this.state.EmploymentDetails.some((job) => {
        const hasAnyValue = Boolean(job.companyName || job.workPosition || job.startDate || job.endDate);
        if (!hasAnyValue) return false;
        return !job.companyName || !job.workPosition || !job.startDate || !job.endDate;
      });
      if (invalidEmployment) {
        errors.push("Employment entries require position plus start and end dates.");
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    isCorporateClient() {
      return ["C", "B"].includes(this.state.ClientTypeID);
    }

    toRequestPayload() {
      const payload = deepClone(this.state);
      payload.Name = this.state.ClientTypeID === "C"
        ? payload.CompanyName || ""
        : [payload.FirstName, payload.MiddleName, payload.LastName].filter(Boolean).join(" ");
      payload.IsDOBGiven = !!payload.DateOfBirth;
      return payload;
    }
  }

  global.ClientFormModel = ClientFormModel;
  global.LegacyClientValidator = {
    /**
     * Basic mandatory check that mirrors the model but works directly on the DOM.
     * This gives immediate feedback before the payload is even built.
     */
    validateMandatory(formEl) {
      const errors = [];
      if (!formEl) {
        return { valid: true, errors };
      }

      const get = (name) => formEl.elements.namedItem(name);
      const valueOf = (name) => {
        const field = get(name);
        if (!field) return "";
        if (field instanceof RadioNodeList) {
          return field.value || "";
        }
        return (field.value || "").trim();
      };

      const clientType = valueOf("ClientTypeID");
      const isCorporate = ["C", "B"].includes(clientType);

      const baseRequired = ["ClientID", "ClientTypeID", "RelationshipManager", "OpenedBy", "OpenedDate"];
      const individualRequired = [
        "TitleID",
        "FirstName",
        "LastName",
        "DateOfBirth",
        "IdentificationTypeID",
        "NationalId",
        "ResidentID",
        "NumberOfHouseMembers"
      ];
      const corporateRequired = ["CompanyName", "RegistrationNumber", "DateOfRegistration", "RegisteredOffice"];

      const required = baseRequired.concat(isCorporate ? corporateRequired : individualRequired);
      required.forEach((name) => {
        if (!valueOf(name)) {
          const label = FIELD_LABELS[name] || name;
          const field = get(name) || null;
          errors.push({ field, name, message: `${label} is required.` });
        }
      });

      return { valid: errors.length === 0, errors };
    }
  };

  // ============================================================================
  // LegacyClientValidator: Replicates legacy mandatory-field validation logic
  // ============================================================================
  const LegacyClientValidator = {
    getField(formEl, legacyId) {
      if (!formEl) return null;
      return formEl.querySelector(`[data-legacy-id="${legacyId}"]`) || formEl.querySelector(`[name="${legacyId}"]`) || formEl.querySelector(`#${legacyId}`);
    },

    isEmpty(el) {
      if (!el) return true;
      if (el.type === "checkbox" || el.type === "radio") {
        return !el.checked;
      }
      const val = (el.value || "").trim();
      return val === "" || val === "--Select--" || val === "0";
    },

    addError(errors, el, message, legacyId) {
      errors.push({
        element: el,
        legacyId: legacyId || (el ? el.name || el.id : "unknown"),
        message
      });
    },

    validateMandatory(formEl) {
      const errors = [];
      if (!formEl) {
        return { valid: false, errors: [{ message: "Form element not found." }] };
      }

      // Read client type
      const clientTypeEl = this.getField(formEl, "ClientTypeID") || formEl.querySelector("[name='ClientTypeID']");
      const clientType = clientTypeEl ? (clientTypeEl.value || "").trim().toUpperCase() : "";

      const isCorporate = ["B", "C", "CNC"].includes(clientType);
      const isIndividual = ["I", "E", "G", "N", "M", "NC"].includes(clientType);

      // --- INDIVIDUAL SIDE (I/E/G/N/M/NC) ---
      if (isIndividual) {
        // Nationality
        const nationalityEl = this.getField(formEl, "NationalityID");
        if (this.isEmpty(nationalityEl)) {
          this.addError(errors, nationalityEl, "Nationality is required.", "NationalityID");
        }

        // Resident status
        const residentEl = this.getField(formEl, "ResidentID");
        if (this.isEmpty(residentEl)) {
          this.addError(errors, residentEl, "Resident Status is required.", "ResidentID");
        }

        // ID Issuance Date
        const idIssueDateEl = this.getField(formEl, "IDIssueDate");
        if (this.isEmpty(idIssueDateEl)) {
          this.addError(errors, idIssueDateEl, "Identification Issue Date is required.", "IDIssueDate");
        }

        // ID Expiry Date
        const idExpiryEl = this.getField(formEl, "IDExpiryDate");
        if (this.isEmpty(idExpiryEl)) {
          this.addError(errors, idExpiryEl, "Identification Expiry Date is required.", "IDExpiryDate");
        }

        // Literacy Level
        const literacyEl = this.getField(formEl, "LiteracyLevel");
        if (this.isEmpty(literacyEl)) {
          this.addError(errors, literacyEl, "Literacy Level is required.", "LiteracyLevel");
        }

        // Mother Name
        const motherNameEl = this.getField(formEl, "MotherName");
        if (this.isEmpty(motherNameEl)) {
          this.addError(errors, motherNameEl, "Mother Name is required.", "MotherName");
        }

        // Occupation/Designation/Company Type/Income
        const occupationEl = this.getField(formEl, "Occupation");
        if (this.isEmpty(occupationEl)) {
          this.addError(errors, occupationEl, "Occupation is required.", "Occupation");
        }

        const designationEl = this.getField(formEl, "Designation");
        if (this.isEmpty(designationEl)) {
          this.addError(errors, designationEl, "Designation is required.", "Designation");
        }

        const companyTypeEl = this.getField(formEl, "CompanyType");
        if (this.isEmpty(companyTypeEl)) {
          this.addError(errors, companyTypeEl, "Company Type is required.", "CompanyType");
        }

        const monthlyIncomeEl = this.getField(formEl, "MonthlyIncome");
        if (this.isEmpty(monthlyIncomeEl)) {
          this.addError(errors, monthlyIncomeEl, "Monthly Income is required.", "MonthlyIncome");
        }

        // Marital Status
        const maritalEl = this.getField(formEl, "MaritalStatus");
        if (this.isEmpty(maritalEl)) {
          this.addError(errors, maritalEl, "Marital Status is required.", "MaritalStatus");
        }

        // KYC PEP radiolist
        const pepEl = this.getField(formEl, "IsPEP");
        if (this.isEmpty(pepEl)) {
          this.addError(errors, pepEl, "PEP Status is required (Yes/No).", "IsPEP");
        } else {
          const pepValue = (pepEl.value || "").trim().toUpperCase();
          if (pepValue === "Y" || pepValue === "YES" || pepValue === "TRUE") {
            const pepOrgEl = this.getField(formEl, "PEPOrganization");
            if (this.isEmpty(pepOrgEl)) {
              this.addError(errors, pepOrgEl, "PEP Organization is required when PEP Status is Yes.", "PEPOrganization");
            }
            const pepPosEl = this.getField(formEl, "PEPPosition");
            if (this.isEmpty(pepPosEl)) {
              this.addError(errors, pepPosEl, "PEP Position is required when PEP Status is Yes.", "PEPPosition");
            }
            const pepSpouseEl = this.getField(formEl, "PEPSpouseName");
            if (this.isEmpty(pepSpouseEl)) {
              this.addError(errors, pepSpouseEl, "PEP Spouse Name is required when PEP Status is Yes.", "PEPSpouseName");
            }
            const pepChildEl = this.getField(formEl, "PEPChildName");
            if (this.isEmpty(pepChildEl)) {
              this.addError(errors, pepChildEl, "PEP Child Name is required when PEP Status is Yes.", "PEPChildName");
            }
          }
        }

        // KYC US Person radiolist
        const usPersonEl = this.getField(formEl, "IsUSPerson");
        if (this.isEmpty(usPersonEl)) {
          this.addError(errors, usPersonEl, "US Person Status is required (Yes/No).", "IsUSPerson");
        } else {
          const usValue = (usPersonEl.value || "").trim().toUpperCase();
          if (usValue === "Y" || usValue === "YES" || usValue === "TRUE") {
            const ssnEl = this.getField(formEl, "SSN");
            if (this.isEmpty(ssnEl)) {
              this.addError(errors, ssnEl, "SSN is required when US Person is Yes.", "SSN");
            }
            const eidEl = this.getField(formEl, "EID");
            if (this.isEmpty(eidEl)) {
              this.addError(errors, eidEl, "EID is required when US Person is Yes.", "EID");
            }
            const ustinEl = this.getField(formEl, "USTIN");
            if (this.isEmpty(ustinEl)) {
              this.addError(errors, ustinEl, "US TIN is required when US Person is Yes.", "USTIN");
            }
          }
        }

        // KYC Data Cleansed radiolist
        const dataCleansedEl = this.getField(formEl, "IsDataCleansed");
        if (this.isEmpty(dataCleansedEl)) {
          this.addError(errors, dataCleansedEl, "Data Cleansed Status is required (Yes/No).", "IsDataCleansed");
        }

        // Conditional "other..." fields
        const occupationCode = (occupationEl && occupationEl.value) ? occupationEl.value.trim().toUpperCase() : "";
        if (["O", "OTH", "OT"].includes(occupationCode)) {
          const occupationOtherEl = this.getField(formEl, "OccupationOther");
          if (this.isEmpty(occupationOtherEl)) {
            this.addError(errors, occupationOtherEl, "Occupation Other is required when 'Other' is selected.", "OccupationOther");
          }
        }

        const designationCode = (designationEl && designationEl.value) ? designationEl.value.trim().toUpperCase() : "";
        if (["O", "OTH", "OT"].includes(designationCode)) {
          const designationOtherEl = this.getField(formEl, "DesignationOther");
          if (this.isEmpty(designationOtherEl)) {
            this.addError(errors, designationOtherEl, "Designation Other is required when 'Other' is selected.", "DesignationOther");
          }
        }

        const companyTypeCode = (companyTypeEl && companyTypeEl.value) ? companyTypeEl.value.trim().toUpperCase() : "";
        if (["O", "OTH", "OT"].includes(companyTypeCode)) {
          const companyTypeOtherEl = this.getField(formEl, "CompanyTypeOther");
          if (this.isEmpty(companyTypeOtherEl)) {
            this.addError(errors, companyTypeOtherEl, "Company Type Other is required when 'Other' is selected.", "CompanyTypeOther");
          }
        }
      }

      // --- CORPORATE SIDE (B/C/CNC) ---
      if (isCorporate) {
        const licenseNoEl = this.getField(formEl, "LicenseNo");
        if (this.isEmpty(licenseNoEl)) {
          this.addError(errors, licenseNoEl, "License Number is required.", "LicenseNo");
        }

        const regDateEl = this.getField(formEl, "DateOfRegistration");
        if (this.isEmpty(regDateEl)) {
          this.addError(errors, regDateEl, "Date of Registration is required.", "DateOfRegistration");
        }

        const tinEl = this.getField(formEl, "TaxId") || this.getField(formEl, "KRAPin");
        if (this.isEmpty(tinEl)) {
          this.addError(errors, tinEl, "Tax Identification Number (TIN/KRA PIN) is required.", "TaxId");
        }

        const incorpCountryEl = this.getField(formEl, "IncorporationCountryID");
        if (this.isEmpty(incorpCountryEl)) {
          this.addError(errors, incorpCountryEl, "Country of Incorporation is required.", "IncorporationCountryID");
        }

        // KYC radiolists for corporate
        const corpPepEl = this.getField(formEl, "IsPEP");
        if (this.isEmpty(corpPepEl)) {
          this.addError(errors, corpPepEl, "PEP Status is required (Yes/No).", "IsPEP");
        } else {
          const pepValue = (corpPepEl.value || "").trim().toUpperCase();
          if (pepValue === "Y" || pepValue === "YES" || pepValue === "TRUE") {
            const pepOrgEl = this.getField(formEl, "PEPOrganization");
            if (this.isEmpty(pepOrgEl)) {
              this.addError(errors, pepOrgEl, "PEP Organization is required when PEP Status is Yes.", "PEPOrganization");
            }
            const pepPosEl = this.getField(formEl, "PEPPosition");
            if (this.isEmpty(pepPosEl)) {
              this.addError(errors, pepPosEl, "PEP Position is required when PEP Status is Yes.", "PEPPosition");
            }
          }
        }

        const corpUsPersonEl = this.getField(formEl, "IsUSPerson");
        if (this.isEmpty(corpUsPersonEl)) {
          this.addError(errors, corpUsPersonEl, "US Person Status is required (Yes/No).", "IsUSPerson");
        } else {
          const usValue = (corpUsPersonEl.value || "").trim().toUpperCase();
          if (usValue === "Y" || usValue === "YES" || usValue === "TRUE") {
            const ssnEl = this.getField(formEl, "SSN");
            if (this.isEmpty(ssnEl)) {
              this.addError(errors, ssnEl, "SSN is required when US Person is Yes.", "SSN");
            }
            const eidEl = this.getField(formEl, "EID");
            if (this.isEmpty(eidEl)) {
              this.addError(errors, eidEl, "EID is required when US Person is Yes.", "EID");
            }
            const ustinEl = this.getField(formEl, "USTIN");
            if (this.isEmpty(ustinEl)) {
              this.addError(errors, ustinEl, "US TIN is required when US Person is Yes.", "USTIN");
            }
          }
        }

        const corpDataCleansedEl = this.getField(formEl, "IsDataCleansed");
        if (this.isEmpty(corpDataCleansedEl)) {
          this.addError(errors, corpDataCleansedEl, "Data Cleansed Status is required (Yes/No).", "IsDataCleansed");
        }

        // Conditional "other..." fields for corporate
        const lineOfBusinessEl = this.getField(formEl, "LineOfBusiness");
        if (lineOfBusinessEl) {
          const lobCode = (lineOfBusinessEl.value || "").trim().toUpperCase();
          if (["O", "OTH", "OT"].includes(lobCode)) {
            const lobOtherEl = this.getField(formEl, "LineOfBusinessOther");
            if (this.isEmpty(lobOtherEl)) {
              this.addError(errors, lobOtherEl, "Line of Business Other is required when 'Other' is selected.", "LineOfBusinessOther");
            }
          }
        }

        const subCityEl = this.getField(formEl, "SubCityID");
        if (subCityEl) {
          const subCityCode = (subCityEl.value || "").trim();
          if (["506", "24", "103"].includes(subCityCode)) {
            const subCityOtherEl = this.getField(formEl, "SubCityOther");
            if (this.isEmpty(subCityOtherEl)) {
              this.addError(errors, subCityOtherEl, "Sub City Other is required for this selection.", "SubCityOther");
            }
          }
        }

        const cityEl = this.getField(formEl, "CityID");
        if (cityEl) {
          const cityCode = (cityEl.value || "").trim();
          if (["506", "24", "103"].includes(cityCode)) {
            const cityOtherEl = this.getField(formEl, "CityOther");
            if (this.isEmpty(cityOtherEl)) {
              this.addError(errors, cityOtherEl, "City Other is required for this selection.", "CityOther");
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  };

  global.LegacyClientValidator = LegacyClientValidator;
})(window);
