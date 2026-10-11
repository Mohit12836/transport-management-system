# API SPECIFICATION: NextGen Transport Management System (REST / Next.js Route Handlers)

## 1. Global Conventions
- **Base URL:** `/api/v1`
- **Content-Type:** `application/json`
- **Authentication:** Bearer JWT in `Authorization` header.
- **Tenant Context:** Automatically injected into session token payload (`tenantId`, `branchId`, `role`).
- **Standard Response Envelope:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalCount": 150
  },
  "timestamp": "2026-10-10T22:30:00.000Z"
}
```

## 2. API Endpoint Catalog

### A. Auth & Session
| Method | Route | Description | Auth Roles |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate with email & password | Public |
| `POST` | `/api/v1/auth/logout` | Revoke session cookie/token | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch active user profile and tenant scope | Authenticated |

### B. Fleet & Driver Management
| Method | Route | Description | Auth Roles |
|---|---|---|---|
| `GET` | `/api/v1/fleet/vehicles` | List fleet vehicles with compliance status | Owner, Manager, Accountant |
| `POST` | `/api/v1/fleet/vehicles` | Register a new vehicle & compliance docs | Owner, Manager |
| `GET` | `/api/v1/fleet/vehicles/:id` | Get 360-degree vehicle profile | Owner, Manager |
| `GET` | `/api/v1/fleet/drivers` | List drivers with advance balances | Owner, Manager, Accountant |
| `POST` | `/api/v1/fleet/drivers` | Add driver with licence & bank KYC | Owner, Manager |
| `POST` | `/api/v1/fleet/drivers/:id/advances` | Issue driver advance cash/fuel voucher | Owner, Accountant |

### C. Consignment (LR/Bilty) & Trips
| Method | Route | Description | Auth Roles |
|---|---|---|---|
| `GET` | `/api/v1/bookings/lr` | Search & filter LR records | Owner, Manager, Accountant |
| `POST` | `/api/v1/bookings/lr` | Generate new LR Consignment Note | Owner, Manager |
| `GET` | `/api/v1/bookings/lr/:id/print` | Render printable 3-copy LR HTML/PDF | Owner, Manager, Accountant |
| `POST` | `/api/v1/trips` | Create trip dispatch & assign truck/driver | Owner, Manager |
| `PATCH` | `/api/v1/trips/:id/status` | Update trip milestone status | Owner, Manager, Driver |
| `POST` | `/api/v1/trips/:id/expenses` | Add en-route diesel / toll / repair slip | Owner, Manager, Driver |
| `POST` | `/api/v1/trips/:id/pod` | Upload digital POD with photo & remarks | Manager, Driver |
| `POST` | `/api/v1/trips/:id/settlement` | Calculate & finalize driver trip settlement | Owner, Accountant |

### D. Billing, Invoices & Vendor Memos
| Method | Route | Description | Auth Roles |
|---|---|---|---|
| `POST` | `/api/v1/finance/invoices` | Create GST invoice from delivered LRs | Owner, Accountant |
| `GET` | `/api/v1/finance/invoices/:id` | View invoice details & payment history | Owner, Accountant |
| `POST` | `/api/v1/finance/invoices/:id/payments` | Record customer payment receipt | Owner, Accountant |
| `POST` | `/api/v1/finance/vendor-bills` | Create vendor freight bill with TDS | Owner, Accountant |
| `GET` | `/api/v1/reports/profitability` | Trip-wise & vehicle-wise P&L breakdown | Owner, Accountant |
