# RBI System Design Document – Spec Alignment

This file maps the Software Documentation / System Design Document to the implementation.

## Roles

| Spec (Section 1.3, 4.1) | System role | Notes |
|-------------------------|-------------|--------|
| Barangay Secretary      | secretary   | Main system administrator |
| Barangay Staff          | encoder     | Encode and update resident data |
| Barangay Captain        | punong_barangay | View reports and statistics |
| SK Officials            | viewer      | Limited (read-only) viewing access |
| Admin                   | admin       | Full system access (optional) |
| Resident                | resident    | Household head / resident self-service |

## Authentication

- **Login:** Username or email + password (Section 4.1, 8.1). Backend accepts either in the same field; frontend label: "Username or email".
- **Password:** Encrypted (bcrypt). JWT for session.

## Data model field mapping

| Spec field (Section 6) | Schema / API field |
|------------------------|--------------------|
| household_id           | _id (MongoDB) |
| head_of_family         | headOfFamily |
| number_of_members      | numberOfMembers |
| philsys_number         | philSysCardNo (Form B / Inhabitant) |
| suffix                 | nameExtension |
| residence_address      | residenceAddress |
| education_level / status | highestEducationalAttainment, graduateOrUndergraduate, courseSpecification |
| date_accomplished      | dateAccomplished (Form B) |

## Routes and pages

| Spec (Section 8) | Route / page |
|------------------|--------------|
| Login            | `/login`, Login.jsx |
| Dashboard        | `/`, Dashboard.jsx (stats, chart, recent registrations) |
| Resident management | `/form-b`, FormBList, FormBForm, FormBView |
| Household (Form A) | `/households`, HouseholdList, HouseholdForm, HouseholdView |
| Reports          | `/reports`, Reports.jsx (summary, senior list, PWD list, PDF/Excel export) |
| Certificate generation | Form B view → Generate certificate (clearance, residency, indigency, good moral) |

## Reports (Section 4.5)

- Total population, by gender, by age group: summary API + Reports page; Chart.js on dashboard and reports.
- Senior citizen list: `GET /api/reports/senior-citizens`.
- PWD list: `GET /api/reports/pwd-list`.
- Export: `GET /api/reports/export/pdf`, `GET /api/reports/export/excel`.

## Search (Section 4.4)

- Household list: query params `search`, `address`, `householdNumber`.
- Form B list: query params `search` (name), `philsys`, `address`, `householdNumber`.

## Non-functional (Section 5)

- **Security:** JWT, role-based access, activity logging (see docs/OPERATIONS.md).
- **Backup:** See docs/BACKUP.md.
- **Performance:** Indexes on main collections; pagination on list endpoints.
