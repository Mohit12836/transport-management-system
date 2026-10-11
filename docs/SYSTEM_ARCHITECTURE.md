# SYSTEM ARCHITECTURE: NextGen Transport Management System (TMS Pro)

## 1. Architectural Overview
NextGen TMS is designed as a **Modular Full-Stack Next.js 16 Application with PostgreSQL / Supabase Real-Time Backend**. It emphasizes zero rate-limit execution, high-concurrency data persistence, instant optimistic UI updates, and strict multi-tenant isolation.

```
                                  [ Client Layer ]
        +--------------------------------+--------------------------------+
        |   Desktop Ops & Account Hub    |     Mobile Driver Web App      |
        |   (Managers, Owners, Acc.)     |     (Drivers, Field Agents)    |
        +--------------------------------+--------------------------------+
                                         |
                                (HTTPS / TLS 1.3)
                                         |
                                         v
                         +-------------------------------+
                         |   Next.js 16 App Router Edge  |
                         |   - Middleware Auth & RBAC    |
                         |   - Route Handlers (REST API) |
                         |   - React Server Components   |
                         +-------------------------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
+-------------------------------+                  +-------------------------------+
|  Supabase PostgreSQL Database |                  |    Async Job / Cron Worker    |
|  - Row Level Security (RLS)   |                  |    - Compliance Expiry Check  |
|  - Multi-Tenant org_id Scope  |                  |    - FASTag Sync Scheduler    |
|  - Financial Ledgers & Audits |                  |    - WhatsApp Broadcast Alert |
+-------------------------------+                  +-------------------------------+
               |                                                   |
               +-------------------------+-------------------------+
                                         |
                                         v
                         +-------------------------------+
                         |     External Integration      |
                         |  - WhatsApp Cloud API (WACA)  |
                         |  - Razorpay / Bank Payouts    |
                         |  - FASTag / VAHAN Telematics  |
                         |  - AWS S3 / Cloud POD Storage |
                         +-------------------------------+
```

## 2. Core Architectural Pillars

### A. Strict Multi-Tenancy & Row-Level Security (RLS)
- Every single core table contains an `organization_id` foreign key referencing the `organizations` tenant table.
- PostgreSQL Row-Level Security policies ensure that queries executed under a user's session token can never view or mutate data belonging to other companies.
- Multi-Branch filtering via `branch_id` allows enterprise transport firms to isolate daily bookings between regional hubs (e.g., Delhi, Mumbai, Jaipur, Bangalore) while aggregating P&L at the corporate level.

### B. High-Fidelity UI & Motion Engine
- Built with **Tailwind CSS 4** and **Framer Motion / Motion.dev**.
- Adheres to the permanent system rules: 100% fluid `clamp()` auto-fit typography, auto-fit wrapping CSS grids, and snappy spring physics (`stiffness: 400, damping: 30` on buttons; `stiffness: 260, damping: 20` on modals and side-drawers).
- Touch-friendly design with 48px+ touch targets for drivers using mobile devices on the road.

### C. Financial Immutability & Double-Entry Integrity
- The system prevents direct `UPDATE` or `DELETE` on finalized financial rows (Invoices, Driver Settlement Vouchers, Vendor Settlement Memos).
- Any correction requires an explicit adjustment entry or credit/debit note with mandatory audit reason.
- High precision arithmetic (`NUMERIC(12, 2)`) avoids floating-point rounding errors in GST and freight calculations.

### D. Asynchronous Job & Notification Architecture
- Background schedulers for:
  1. Daily compliance expiration sweeps (30/15/7/0 day alerts for Insurance, Fitness, Driver Licence, National Permit).
  2. Scheduled WhatsApp & SMS notifications to consignors upon trip dispatch and delivery.
  3. PDF invoice & LR background generation with CDN document URLs.
