# AGENTS.md — Transport Management System (TMS) Engineering & Agent Rules

## 1. Project Identity & Context
- **Project Name:** NextGen Transport Management System (TMS Platform)
- **Domain:** Enterprise Logistics, Multi-Branch Transport Operations, LR/Bilty Management, Fleet Telematics, FastTag/Fuel Accounting, Driver Payroll, and Vendor Settlement.
- **Reference Target:** Inspired by verified Indian & Global transport business workflows (`https://tms.zdctech.in/`).
- **Standard:** Production-Grade, Zero-Breakage, Multi-Tenant SaaS with Strict Role & Branch Isolation.

## 2. Non-Negotiable Engineering Rules
1. **Audit & Evidence First:** Never write application code without verifying requirements, data relations, and security boundaries.
2. **Strict Folder Isolation:** All TMS documents, backend, frontend, migrations, and assets live exclusively inside `transport-management-system/`.
3. **Immutability of Financial Transactions:** Never allow direct edit or deletion of approved LR/Bilty, generated invoices, disbursed driver advances, or settled vendor payments. Use debit/credit notes, adjustments, and audited reversal workflows.
4. **Data Isolation:** All queries must explicitly filter by `organization_id` (and `branch_id` where applicable). Never trust client-supplied tenant identifiers.
5. **No Secrets in Code:** Passwords, API tokens (FastTag, GPS, WACA WhatsApp, SMS gateways, Payment gateways) must reside in environment variables (`.env.local` / Secret Vaults).
6. **Zero Silent Regressions:** Every component modification must respect surrounding typings, models, and UI responsiveness (320px to 1920px+).

## 3. Living Documentation Protocol
Before starting and after concluding any task or milestone:
- Check `docs/CURRENT_STATE.md`
- Check `docs/TASKS.md`
- Check `docs/HANDOVER.md`
- Keep `docs/CHANGELOG.md` updated with exact changes and rationale.
