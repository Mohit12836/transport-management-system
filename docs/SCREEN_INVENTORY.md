# SCREEN INVENTORY: NextGen Transport Management System

## 1. Master Screen & Route Mapping

| Screen ID | Module | Route Path | Authorized Roles | Purpose & Primary Actions | Audit Status |
|---|---|---|---|---|---|
| **SCR-001** | Landing & Demo | `/` | Public | High-converting landing page, interactive role demo switcher, module explorer, demo request form | Verified |
| **SCR-002** | Authentication | `/login` | Public | Multi-role quick login switcher, credentials auth, password recovery | Verified |
| **SCR-003** | Super Admin Hub | `/admin/saas` | Super Admin | Tenant organizations, plan management, system logs, platform health | Inferred |
| **SCR-004** | Owner Dashboard | `/dashboard` | Owner, Manager | Live fleet KPI stats, revenue vs expense charts, trip count, active alerts | Verified |
| **SCR-005** | Fleet Roster | `/fleet/vehicles` | Owner, Manager, Accountant | List vehicles (Owned/Market/Attached), add truck, filter by status, RC/Fitness countdown | Verified |
| **SCR-006** | Vehicle Details & History | `/fleet/vehicles/[id]` | Owner, Manager | Vehicle 360 view: specs, tyre history, service logs, assigned driver, compliance docs | Verified |
| **SCR-007** | Driver Management | `/fleet/drivers` | Owner, Manager, Accountant | Driver list, license validity, KYC verification, active trip status, emergency contact | Verified |
| **SCR-008** | Driver Profile & Ledger | `/fleet/drivers/[id]` | Owner, Accountant | Driver trip history, running advance balance, salary slip generation, penalty/incentive records | Verified |
| **SCR-009** | Consignment & Booking | `/bookings` | Manager, Owner | Booking order list, search by Consignor/Consignee, rate agreement binding | Verified |
| **SCR-010** | LR / Bilty Generator | `/bookings/lr/create` | Manager, Owner | Create Consignment Note (LR/Bilty), e-Way bill entry, freight calculation (To-Pay/Paid/TBB) | Verified |
| **SCR-011** | LR View & Print Format | `/bookings/lr/[id]` | Manager, Owner, Accountant | Indian standard 3-copy LR format (Consignor, Consignee, Driver/Office copy), PDF export | Verified |
| **SCR-012** | Trip Dispatch Board | `/trips` | Manager, Owner | Active trip board (Scheduled, In-Transit, Delayed, Delivered, Closed), truck assignment | Verified |
| **SCR-013** | Trip Dispatch Detail | `/trips/[id]` | Manager, Owner, Accountant | Route map, milestone checkpoint logs, fuel slips, toll entries, breakdown reassignment | Verified |
| **SCR-014** | Proof of Delivery (POD) Hub | `/trips/pod` | Manager, Accountant | Pending POD list, verified POD approval, physical copy dispatch tracking | Verified |
| **SCR-015** | Driver Mobile Portal | `/driver-portal` | Driver | Mobile-optimized task card: current trip, start trip, upload POD photo, submit diesel slip | Verified |
| **SCR-016** | Customer Invoicing | `/finance/invoices` | Accountant, Owner | Generate GST invoices from delivered LRs, tax breakdown (CGST/SGST/IGST), PDF invoice | Verified |
| **SCR-017** | Driver Advance & Settlement | `/finance/driver-settlement` | Accountant, Owner | Settle trip expenses: advances (-) vs diesel, toll, loading expenses (+) -> final payout | Verified |
| **SCR-018** | Vendor & Broker Bills | `/finance/vendor-bills` | Accountant, Owner | Market vehicle hire bills, TDS deduction (1% / 2%), broker commission voucher | Verified |
| **SCR-019** | Fuel & FASTag Ledger | `/finance/fuel-fastag` | Accountant, Manager | Petrol pump credit ledgers, fuel card tracking, FASTag toll statement upload | Verified |
| **SCR-020** | Trip Profitability (P&L) | `/reports/profitability` | Owner, Accountant | Trip-wise & vehicle-wise revenue minus all operating costs = Net Margin % | Verified |
| **SCR-021** | Compliance & Renewals | `/compliance` | Manager, Owner | Insurance, National Permit, Fitness, PUC, Driver Licence expiry countdown & alerts | Verified |
| **SCR-022** | Branch & User Access | `/settings/organization` | Owner, Super Admin | Branch setup, staff user creation, role permission toggles, company header/letterhead | Verified |

## 2. Universal Screen Layout Standards
- **Header:** Organization switcher, branch selector, quick action "+ Create Trip / LR", global search (LR#, Truck#, Driver#), profile avatar.
- **Sidebar:** Collapsible responsive navigation with badge indicators for pending PODs, expiring compliance, and unsettled trips.
- **Data Tables:** Column sorting, multi-column search, date-range filters, bulk export to Excel/CSV, pagination with configurable page size (10/25/50/100).
- **Responsive Drawer / Modals:** Smooth spring slide-overs for quick creation (Add Expense, Record Advance, Upload POD) without losing context.
