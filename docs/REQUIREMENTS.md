# FUNCTIONAL REQUIREMENTS SPECIFICATION: NextGen TMS

## 1. Classification Methodology
Requirements are tagged with:
- **[OBSERVED REQUIREMENT]:** Directly verified from reference demo inspection (`tms.zdctech.in`).
- **[INFERRED REQUIREMENT]:** Standard requirement logically derived from Indian/global transport domain norms.
- **[PROPOSED ENHANCEMENT]:** Superior architectural/UX capabilities upgrading the system beyond the reference demo.

## 2. Requirements Matrix

### Module A: Organization & Access Control
- **REQ-A1 [OBSERVED]:** System shall support multi-role authentication for `Super Admin`, `Owner`, `Manager`, `Accountant`, `Driver`, and `Vendor`.
- **REQ-A2 [OBSERVED]:** System shall support multi-branch management under an organization with regional isolation.
- **REQ-A3 [PROPOSED]:** 1-Click Interactive Demo Role Switcher enabling prospective buyers to experience all 6 roles instantly in the browser.

### Module B: Consignments & LR / Bilty Generation
- **REQ-B1 [OBSERVED]:** System shall generate standard Indian Consignment Notes (LR/Bilty) with consignor, consignee, package description, and freight terms (`To Pay`, `Paid`, `T.B.B.`).
- **REQ-B2 [OBSERVED]:** System shall record e-Way bill number and validate 12-digit format.
- **REQ-B3 [PROPOSED]:** Instant 3-copy printable LR view (Consignor Copy, Consignee Copy, Driver/Office Copy) with barcode/QR code for digital scanning.

### Module C: Fleet & Trip Dispatch
- **REQ-C1 [OBSERVED]:** System shall maintain vehicle rosters categorized by Owned, Attached, and Market vehicles.
- **REQ-C2 [OBSERVED]:** System shall block or warn when assigning vehicles with expired Insurance, Fitness, or National Permit.
- **REQ-C3 [OBSERVED]:** System shall track trip milestones (`Scheduled` -> `In Transit` -> `Delivered` -> `Closed`).
- **REQ-C4 [PROPOSED]:** Dedicated mobile-first Driver Portal for 1-tap start trip, en-route expense submission, and instant camera POD upload.

### Module D: Finance, Accounting & Settlements
- **REQ-D1 [OBSERVED]:** System shall record driver trip advances and automatically deduct them during final trip settlement against verified fuel/toll expenses.
- **REQ-D2 [OBSERVED]:** System shall generate GST-compliant invoices with CGST/SGST/IGST breakdown and RCM applicability flags.
- **REQ-D3 [OBSERVED]:** System shall calculate trip-wise and vehicle-wise Profit & Loss (Revenue minus Fuel, Toll, Driver Advance, Maintenance, and Brokerage).
- **REQ-D4 [OBSERVED]:** System shall handle vendor freight bills with statutory TDS deductions (1% Individual / 2% Corporate).

### Module E: Compliance & Reminders
- **REQ-E1 [OBSERVED]:** System shall track document validity for RC, Insurance, Fitness, PUC, Permit, and Driver Licences.
- **REQ-E2 [PROPOSED]:** Automated WhatsApp Cloud API & SMS alert dispatch 30, 15, and 7 days prior to document expiration.
