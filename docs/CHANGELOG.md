# CHANGELOG: NextGen Transport Management System

## [1.5.0-remediation] - 2026-10-11
### Security Hardening & Remediation
- **Critical Security Fix (Phase 1):** Hardened `src/lib/supabase/api-guard.ts` to strictly block `x-mock-*` spoofing headers in production with `403 SPOOFING_ATTEMPT_BLOCKED`. Development test harness is strictly isolated (`NODE_ENV !== 'production'`). Added regression test in `tests/production-rls-api.test.mjs` verifying production spoofing attempts are blocked.
- **Persistent Database Write Handlers (Phase 2):** Converted all 16 Next.js REST API route handlers to execute real Supabase table inserts, updates, and selects (`lr_consignment_notes`, `vehicles`, `drivers`, `trips`, `trip_expenses`, `proofs_of_delivery`, `driver_settlements`, `customer_invoices_v2`, `vendor_settlements`, `journal_entries`). Ensured production requests fail closed (`503 DATABASE_UNAVAILABLE`) when database is unconfigured.
- **Frontend API Client & Mode Switcher (Phase 3):** Authored typed `src/lib/api-client.ts` for authenticated REST operations. Enhanced `src/components/layout/DemoModeBanner.tsx` with dual-mode badge (Interactive Simulation vs Live/Staging API Mode) and manual server sync button. Updated `src/lib/demo-context.tsx` with non-blocking background API persistence and server data sync.
- **Staging Migration Checklist (Phase 4):** Created `docs/STAGING_MIGRATION_CHECKLIST.md` documenting sequential migration execution (`001` -> `002` -> `003` -> `004`), table verification queries, storage bucket configuration, and rollback strategies.
- **Staging Test Matrix (Phase 5):** Authored `docs/STAGING_TEST_PLAN.md` with an 11-step end-to-end multi-tenant test matrix using synthetic organizations (`org-alpha-101`, `org-beta-202`).
- **Test Baseline:** 39/39 tests passing across all 5 test suites. 0 TypeScript compiler errors.

## [1.4.0-milestone5] - 2026-10-11
### Added
- `@supabase/ssr` server and browser client integration with Next.js cookie handling (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`).
- `migrations/004_production_rls_and_security.sql`: Complete production DDL migration defining Security Definer functions (`auth_user_id()`, `auth_user_organization_id()`, `auth_user_role()`, `auth_linked_driver_id()`, `auth_linked_vendor_id()`), Row Level Security policies with default-deny across all 20 tables, driver/vendor isolation, and append-only database trigger `trg_prevent_journal_update` preventing mutation of general ledger entries.
- `src/lib/supabase/api-guard.ts`: Production API security guard enforcing default-deny (401), role-based RBAC (403), tenant isolation (403), and test authentication harness (`x-mock-role`, `x-mock-org-id`).
- `src/lib/supabase/storage.ts`: Secure private file storage manager with MIME verification, 10MB file limit, and tenant-isolated storage path generation.
- 16 Production Next.js REST API Route Handlers:
  - `src/app/api/v1/auth/login/route.ts` & `logout/route.ts` & `me/route.ts`
  - `src/app/api/v1/bookings/lr/route.ts`: Server-side consignment booking with pure functional validation.
  - `src/app/api/v1/fleet/vehicles/route.ts`: Fleet inventory with duplicate registration check.
  - `src/app/api/v1/fleet/drivers/route.ts`: Driver registry with commercial licence validation and Aadhaar masking.
  - `src/app/api/v1/trips/route.ts`: Trip dispatch board with driver role confinement.
  - `src/app/api/v1/trips/[id]/status/route.ts`: Server-side trip lifecycle state machine transition validator.
  - `src/app/api/v1/trips/[id]/expenses/route.ts`: En-route trip expenses with duplicate fuel slip rejection (409 Conflict).
  - `src/app/api/v1/trips/[id]/pod/route.ts`: Digital POD submission and verification audit trail.
  - `src/app/api/v1/trips/[id]/settlement/route.ts`: Driver trip reconciliation and balanced accounting journal generation.
  - `src/app/api/v1/finance/invoices/route.ts`: Customer GST tax invoicing with server-side verified POD gate.
  - `src/app/api/v1/finance/vendor-bills/route.ts`: Market vehicle hire billing with Section 194C TDS calculation and vendor confinement.
  - `src/app/api/v1/finance/journals/route.ts`: General ledger query with real-time double-entry audit balance verification.
  - `src/app/api/v1/storage/upload/route.ts`: Signed URL upload endpoint for private POD receipts and compliance docs.
  - `src/app/api/v1/integrations/status/route.ts`: External integration hub transparently reporting live vs unconfigured integration states.
- `tests/production-rls-api.test.mjs`: Automated integration test suite covering 12 scenarios across auth, RBAC, tenant isolation, POD gates, duplicate expense blocks, state transitions, settlements, TDS 194C, journal audits, secure storage, and external integrations (100% pass rate).
- `.env.example`: Production environment configuration file with security documentation.

## [1.3.0-milestone4] - 2026-10-11
### Added
- `src/lib/tax-rules.ts`: Indian logistics tax computation engine with Intra-State (CGST 2.5% + SGST 2.5%) vs Inter-State (IGST 5.0%), Reverse Charge Mechanism (RCM - Sec 9(3)), and Section 194C / 206AA TDS calculations with PAN validation.
- `src/lib/financial-engine.ts`: Exact-decimal financial engine, driver trip settlement reconciliation, duplicate expense detection, POD invoice eligibility gate, and double-entry balanced journal generators.
- `src/components/finance/DriverSettlementModal.tsx`: Trip reconciliation modal with live expense approvals/rejections and net refund/payout computation.
- `src/components/finance/DriverSettlementPrint.tsx`: Original printable settlement voucher with accounting debit/credit lines.
- `src/components/finance/DriverLedgerView.tsx`: Driver advance disbursement ledger and trip reconciliation view.
- `src/components/finance/InvoiceGeneratorModal.tsx`: Customer GST tax invoice generator with strict POD verification gate.
- `src/components/finance/CustomerInvoicePrint.tsx`: Standard 3-copy Indian GST tax invoice with SAC 996511, bank details, and RCM disclosure.
- `src/components/finance/VendorSettlementModal.tsx`: Vendor & broker freight settlement voucher with Section 194C TDS calculation.
- `src/components/finance/VendorSettlementPrint.tsx`: Printable vendor payment certificate / Form 16A extract.
- `src/components/finance/FinancialJournalView.tsx`: Double-entry general ledger with real-time audit balance validator ($\sum \text{Debit} == \sum \text{Credit}$, discrepancy ₹0.00).
- `src/components/roles/DriverView.tsx`: Mobile-first driver field app with odometer checkpoints, en-route expense entry, digital camera POD capture, and offline queue simulation.
- `src/components/roles/AccountantView.tsx`: Multi-tab Financial Hub uniting Customer Invoices, Driver Ledgers, Vendor 194C TDS Vouchers, and General Ledger Audit.
- `migrations/003_financial_engine_ledgers.sql`: Production PostgreSQL migration for advances, expenses, settlements, invoices, and double-entry journals.
- `tests/financial-settlement.test.mjs`: Automated unit test suite verifying tax rules, TDS, driver settlements, duplicate detection, POD invoice gate, and balanced journals (6 new tests, 26 total across test suites, 100% pass rate).


### Added
- `src/lib/dispatch-engine.ts`: Core fleet availability, conflict detection, trip state machine validator (`validateTripTransition`), POD audit decision validator, and compliance days calculator.
- `src/components/fleet/VehicleRoster.tsx`: Searchable and filterable vehicle registry with status badges and compliance warning chips.
- `src/components/fleet/VehicleDetailsModal.tsx`: 360° vehicle modal with document validity matrix and workshop maintenance ledger.
- `src/components/fleet/VehicleFormModal.tsx`: Vehicle registration modal with duplicate number detection and capacity validation.
- `src/components/fleet/DriverRoster.tsx`: Driver profile grid with commercial licence categories, masked Aadhaar KYC, and advance balance chips.
- `src/components/fleet/DriverDetailsModal.tsx` and `DriverFormModal.tsx`: Driver inspection and registration modals.
- `src/components/dispatch/DispatchBoard.tsx`: Visual Kanban dispatch pipeline across Scheduled, In-Transit, Delivered, and Closed states.
- `src/components/dispatch/TripAssignmentModal.tsx`: Schedule trip modal with real-time truck/driver conflict detection.
- `src/components/dispatch/TripDetailsModal.tsx`: Route timeline audit trail and audited trip cancellation workflow.
- `src/components/pod/PODReviewQueue.tsx`: Manager/Accountant POD review queue with photo preview, shortage reporting, and Invoice Eligibility Gate badge.
- `src/components/compliance/ComplianceDashboard.tsx`: Fleet-wide statutory expiry radar with WhatsApp renewal dispatch simulation.
- `migrations/002_fleet_dispatch_enhancements.sql`: Timeline events, maintenance logs, and composite indexes.
- `tests/fleet-dispatch.test.mjs`: 11 new automated test cases (20 total across test suites, 100% pass rate).

## [1.1.0-milestone2] - 2026-10-10
### Added
- Functional isolated application foundation inside `transport-management-system/`.
- `src/types/tms.ts`: Complete TypeScript models for Multi-Tenant Organizations, Branches, Vehicles, Drivers, Customers, Consignments, Trips, and Invoices.
- `src/lib/validators.ts`: Pure functional validation engine for LR Consignment data (GSTIN regex, 12-digit e-Way bill check, weight limits).
- `src/lib/lr-math.ts`: Strict mathematical calculation engine for freight, GST, and 3-copy LR document generation with CRC checksum and anti-tamper verification.
- `src/components/layout/DemoModeBanner.tsx`: Persistent banner explicitly separating simulation mode from production authentication.
- `src/components/layout/Navbar.tsx`: Modern top bar with active role badge and quick action triggers.
- `src/components/roles/RoleSwitcher.tsx`: 6-role interactive persona switcher for Super Admin, Owner, Manager, Accountant, Driver, and Vendor.
- `src/components/roles/`: Dedicated role views (`SuperAdminView.tsx`, `OwnerView.tsx`, `ManagerView.tsx`, `AccountantView.tsx`, `DriverView.tsx`, `VendorView.tsx`).
- `src/components/lr/LRBookingForm.tsx`: Interactive LR generator with live freight computation and error envelope.
- `src/components/lr/ThreeCopyLRPrint.tsx`: Original 3-copy printable LR view (Consignor, Consignee, Office/Driver) with print CSS (`@media print`) and demo watermark.
- `migrations/001_initial_schema.sql`: Full normalized PostgreSQL DDL migration script.
- `tests/lr-validation.test.mjs` and `tests/three-copy-consistency.test.mjs`: Automated unit test suite with 9 passing assertions.

## [1.0.0-discovery] - 2026-10-10
### Added
- Created dedicated workspace folder `transport-management-system/` to ensure 100% clean isolation from existing projects.
- Initialized comprehensive documentation hierarchy in `docs/`:
  - `PROJECT_BRIEF.md`: Vision, business problems, and persona mappings.
  - `REFERENCE_AUDIT.md`: Deep technical audit of `https://tms.zdctech.in/` (ZDC Tech Global Solutions Demo).
  - `SCREEN_INVENTORY.md`: 22 core screens mapped by route, module, and RBAC permissions.
  - `WORKFLOW_CATALOG.md`: Complete Mermaid lifecycle diagrams for Consignment/LR, Trip Dispatch, Driver Advance Settlement, and Compliance Expirations.
  - `GITHUB_RESEARCH.md`: Systematic evaluation of Fleetbase, Frappe Fleet Management, Kaporeal, and Traccar with decision matrix.
  - `LICENSE_COMPLIANCE.md`: IP protection and open-source license audit.
  - `SYSTEM_ARCHITECTURE.md`: Next.js 16 + PostgreSQL multi-tenant architecture with Row-Level Security.
  - `DATABASE_SCHEMA.md`: Complete production-ready PostgreSQL / Supabase SQL schema.
  - `API_SPECIFICATION.md`: REST API route catalog and request/response envelopes.
  - `UI_UX_SPECIFICATION.md`: Fluid clamp typography, motion physics, and interactive 6-role demo design.
  - `SECURITY_PLAN.md`: RBAC, tenant isolation, immutable financial ledgers, and upload protections.
  - `TEST_STRATEGY.md`: Test pyramid, financial math assertions, and security test cases.
  - `DEPLOYMENT_GUIDE.md`: Environment variables and production build instructions.
  - `BACKUP_RECOVERY.md`: PITR and disaster recovery specifications.
  - `ARCHITECTURE_DECISIONS.md`: ADR-001 through ADR-003.
  - `CURRENT_STATE.md`, `TASKS.md`, `HANDOVER.md`.
