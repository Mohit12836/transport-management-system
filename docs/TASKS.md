# TASKS & MILESTONE ROADMAP: NextGen TMS

## Milestone 0: Workspace & Documentation Foundation
- [x] Create isolated workspace folder `transport-management-system/`
- [x] Author living documentation system in `docs/` (`PROJECT_BRIEF.md`, `REQUIREMENTS.md`, `REFERENCE_AUDIT.md`, `SCREEN_INVENTORY.md`, `WORKFLOW_CATALOG.md`, `GITHUB_RESEARCH.md`, `LICENSE_COMPLIANCE.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_SPECIFICATION.md`, `UI_UX_SPECIFICATION.md`, `SECURITY_PLAN.md`, `TEST_STRATEGY.md`, `DEPLOYMENT_GUIDE.md`, `BACKUP_RECOVERY.md`, `ARCHITECTURE_DECISIONS.md`)
- [x] Establish `AGENTS.md` rules for TMS development

## Milestone 1: Discovery & Architecture Review
- [x] Audit reference demo `https://tms.zdctech.in/` across all 6 roles
- [x] Evaluate open source alternatives (Fleetbase, Frappe, Traccar)
- [x] Author database schema and REST API contracts
- [x] Deliver comprehensive Phase 1 discovery and audit report

## Milestone 2: Foundation & Functional LR Prototype
- [x] Set up isolated Next.js application foundation in `transport-management-system/` with clear separation of Demo Mode vs Production Mode (`isDemoMode: true`)
- [x] Implement multi-role simulation hub with distinct perspectives for Super Admin, Owner, Manager, Accountant, Driver, and Vendor (strictly labeled as client-side simulation without exposing privileged secrets)
- [x] Build functional Consignment Booking & LR / Bilty Generator with pure validation engine (`validateLRConsignment`) and live freight & tax calculations
- [x] Build authentic Three-Copy Printable LR Document (`ThreeCopyLRPrint`) from a single shared source record with CRC checksum verification, print-optimized CSS, and demo watermark
- [x] Author reviewed PostgreSQL database migration `migrations/001_initial_schema.sql` matching normalized multi-tenant schema
- [x] Implement automated test suite (`tests/lr-validation.test.mjs`, `tests/three-copy-consistency.test.mjs`) with 100% passing tests (9/9 pass)
- [x] Run type-check (`tsc --noEmit`) with 0 errors

## Milestone 3: Core Operations & Dashboards
- [x] Build functional Vehicle Management module (Registration, RC/Fitness/Insurance/Permit/PUC compliance radars, maintenance history, 360° details modal, conflict prevention)
- [x] Build functional Driver Management module (Profiles, commercial licence category & expiry verification, masked Aadhaar KYC, emergency contacts, advance ledger integration, duplicate prevention)
- [x] Build visual Trip Dispatch Board & Pipeline with validated state machine (`Draft` -> `Scheduled` -> `In-Transit` -> `Delivered` -> `Closed`) and audited cancellation workflows
- [x] Build Proof of Delivery (POD) Audit & Verification Queue with photo inspection, receiver details, shortage/damage reporting, and approval/rejection decision audit trails
- [x] Enforce Invoice Eligibility Gate (Blocks customer GST invoice generation unless POD is verified)
- [x] Author reviewed migration `migrations/002_fleet_dispatch_enhancements.sql` for timeline events, maintenance logs, and composite indexes
- [x] Add automated test suite in `tests/fleet-dispatch.test.mjs` with 100% passing tests (20/20 total assertions across test suites)
- [x] Run TypeScript check (`tsc --noEmit`) with 0 errors

## Milestone 4: Financial Engine & Driver App
- [x] Implement Driver Advance & Settlement reconciliation calculator (`src/lib/financial-engine.ts`, `DriverSettlementModal.tsx`, `DriverLedgerView.tsx`, `DriverSettlementPrint.tsx`)
- [x] Implement Customer GST Invoice generator with PDF export and POD verification gate (`InvoiceGeneratorModal.tsx`, `CustomerInvoicePrint.tsx`, `src/lib/tax-rules.ts`)
- [x] Implement Mobile-First Driver Portal with camera POD upload, odometer checkpoint logging, en-route fuel/toll slips, and offline queue simulation (`src/components/roles/DriverView.tsx`)
- [x] Implement Vendor & Broker freight settlement with Section 194C / 206AA TDS ledger and PAN verification (`VendorSettlementModal.tsx`, `VendorSettlementPrint.tsx`)
- [x] Implement Balanced Double-Entry General Ledger with real-time audit balance verification (`FinancialJournalView.tsx`)
- [x] Author reviewed migration `migrations/003_financial_engine_ledgers.sql` covering advances, expenses, settlements, invoices, and journal entries
- [x] Implement automated financial unit test suite (`tests/financial-settlement.test.mjs`) with 100% pass rate (26/26 tests total)
- [x] Verify production build (`npm run build`) and TypeScript checks (`tsc --noEmit`) with 0 errors

## Milestone 5: Production Readiness, Supabase Security & Real Integration
- [x] Install and configure `@supabase/ssr` with Next.js cookie handling and admin service role client
- [x] Author migration `migrations/004_production_rls_and_security.sql` with Security Definer helper functions and default-deny RLS across all 20 tables
- [x] Implement database trigger `trg_prevent_journal_update` preventing mutation/deletion of financial journals
- [x] Build API security guard `src/lib/supabase/api-guard.ts` enforcing default-deny (401), role RBAC (403), tenant isolation (403), and test authentication harness
- [x] Build secure private storage manager `src/lib/supabase/storage.ts` with MIME verification, 10MB limit, and tenant path isolation
- [x] Implement all 16 Next.js REST API route handlers (`src/app/api/v1/...`) with strict server-side validation and atomic state operations
- [x] Implement integration status handler `src/app/api/v1/integrations/status/route.ts` reporting transparent statuses (WhatsApp, FASTag, GPS, Razorpay, E-Way Bill)
- [x] Create automated integration test suite `tests/production-rls-api.test.mjs` verifying default-deny, RBAC, tenant isolation, POD gate, and journal balance
- [x] Create comprehensive `.env.example` documenting all production and Supabase variables
- [x] Verify full regression test suite (38/38 tests passing across all 5 test files)
- [x] Verify production Turbopack build (`npm run build`) and TypeScript checks (`tsc --noEmit`) with 0 errors
- [x] Synchronize all living documentation in `docs/` (`CURRENT_STATE.md`, `TASKS.md`, `CHANGELOG.md`, `HANDOVER.md`, `SECURITY_PLAN.md`, `API_SPECIFICATION.md`, `DATABASE_SCHEMA.md`, `DEPLOYMENT_GUIDE.md`, `BACKUP_RECOVERY.md`, `TEST_STRATEGY.md`)

## Milestone 6: Prototype to Database-Backed Remediation
- [x] Phase 1: Security Guard Hardening — Block `x-mock-*` client headers in production with `403 SPOOFING_ATTEMPT_BLOCKED` in `src/lib/supabase/api-guard.ts` + regression tests (39/39 passing)
- [x] Phase 2: Persistent Database Write Handlers — Update all 16 mutating API route handlers with real Supabase table persistence, POD invoice gates, and balanced ledger writes, failing closed (`503 DATABASE_UNAVAILABLE`) in production
- [x] Phase 3: Frontend API Client & Mode Switcher — Author `src/lib/api-client.ts`, update `DemoModeBanner.tsx` with live mode toggle & sync trigger, wire background sync into `src/lib/demo-context.tsx`
- [x] Phase 4: Staging Migration Checklist — Author `docs/STAGING_MIGRATION_CHECKLIST.md` detailing sequential SQL execution (`001` -> `002` -> `003` -> `004`), table verification, and rollback scripts
- [x] Phase 5: Isolated Staging Test Matrix — Author `docs/STAGING_TEST_PLAN.md` detailing 11 synthetic multi-tenant test scenarios across `org-alpha-101` and `org-beta-202`
- [ ] Phase 6: Live Staging Execution — Connect staging project credentials in `.env.local`, execute migrations on live Supabase, and verify with automated E2E test suite

