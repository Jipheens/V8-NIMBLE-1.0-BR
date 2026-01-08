# Core Banking Experience (Static Prototype)

This repository contains a framework-free HTML/JavaScript/Bootstrap prototype that mirrors the multi-module experience of the larger core banking solution. The goal is to iterate quickly on UX flows (login, common dashboard, customer management, etc.) without spinning up Angular.

```
BRNET-FRONTEND-V8/
├── README.md
├── package.json            # Optional dev tooling (Live Server)
└── public/
    ├── assets/
    │   ├── css/styles.css  # Theme overrides and layout helpers
    │   └── js/app.js       # Shared auth/session utilities, nav wiring
    ├── login.html          # Entry point
    ├── dashboard.html      # Hub that lists available modules
    └── modules/
        └── customer-management/
            └── client-maintenance.html
```

### Roadmap
- Add additional module folders under `public/modules/` as new workstreams (loans, treasury, etc.).
- Keep shared behaviours inside `assets/js/app.js` (or split into multiple files as complexity grows).
- Use Bootstrap 5 components plus the lightweight custom styles to stay close to enterprise design guidelines.

### Architectural notes (work in progress)
- `assets/js/services/clientService.js` will encapsulate all HTTP calls used by the Angular `EmployeeService`, exposing a familiar API (`getClient`, `searchClients`, `createClient`, `updateClient`, etc.).
- `assets/js/models/clientFormModel.js` will handle schema defaults, validation helpers, derived computed fields, and transformations required before sending data downstream.
- `assets/js/services/lookupService.js` + `assets/js/ui/lookupField.js` hydrate dropdowns with the same static + remote data Angular relied on (client types, countries, resident statuses, relationship managers, etc.).
- Feature pages import these modules to keep view logic thin, making it easier to plug in additional modules later.

### Running locally
```bash
npm install
npm run dev
```
The dev script simply serves the `public/` directory via `live-server`. You can also open the HTML files directly in a browser if CDN access is available.
"# V8-NIMBLE-1.0-BR" 
