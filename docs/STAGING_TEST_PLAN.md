# END-TO-END STAGING VERIFICATION & TEST PLAN
**Transport Management System (TMS Pro)**  
**Version:** 1.0.0-rc1  
**Target Environment:** Isolated Supabase Staging Project  

---

## 1. Test Architecture & Objectives

The goal of this staging test plan is to definitively validate that:
1. All application operations persist into a real PostgreSQL database instance.
2. PostgreSQL Row-Level Security (RLS) guarantees tenant and role isolation even if application code is bypassed.
3. Financial ledger triggers prevent tampering with posted accounting journals.
4. Business gates (such as the POD requirement before GST invoicing) are enforced at the database and API tiers.

---

## 2. Test Personas & Synthetic Organizations

| Organization | Tenant ID | User Role | Test User Email | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Alpha Logistics Ltd.** | `org-alpha-101` | Super Admin | `admin@alpha.test` | System setup and branch audit |
| **Alpha Logistics Ltd.** | `org-alpha-101` | Owner | `owner@alpha.test` | Full tenant operational management |
| **Alpha Logistics Ltd.** | `org-alpha-101` | Manager | `manager@alpha.test` | Dispatch, LR booking, POD approval |
| **Alpha Logistics Ltd.** | `org-alpha-101` | Accountant | `accounts@alpha.test` | Invoicing, driver/vendor settlements |
| **Alpha Logistics Ltd.** | `org-alpha-101` | Driver | `driver.ramesh@alpha.test` | Mobile portal: POD upload, slips |
| **Alpha Logistics Ltd.** | `org-alpha-101` | Vendor | `vendor.iocl@alpha.test` | Fuel & broker voucher review |
| **Beta Carriers Corp.** | `org-beta-202` | Owner | `owner@beta.test` | Cross-tenant isolation verification |
| **Beta Carriers Corp.** | `org-beta-202` | Driver | `driver.suresh@beta.test` | Cross-driver isolation verification |

---

## 3. Comprehensive Test Matrix (11 Synthetic Scenarios)

### Scenario 1: Multi-Tenant Confinement (Negative Test)
- **Actor:** `owner@beta.test` (`org-beta-202`)
- **Action:** Sends `GET /api/v1/bookings/lr` attempting to query consignment records belonging to `org-alpha-101`.
- **Expected Result:**
  - HTTP `200 OK` returning an empty array `[]` (RLS filter) OR `403 Forbidden` (`TENANT_ISOLATION_VIOLATION`).
  - Zero rows leaked across organizations.

### Scenario 2: Role-Based Access Control (Negative Test)
- **Actor:** `driver.ramesh@alpha.test` (`role: driver`)
- **Action:** Sends `POST /api/v1/fleet/vehicles` attempting to register a new vehicle.
- **Expected Result:**
  - HTTP `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
  - Request blocked by API security guard and database RLS.

### Scenario 3: Real LR Consignment Creation & Persistence
- **Actor:** `manager@alpha.test` (`org-alpha-101`)
- **Action:** Sends `POST /api/v1/bookings/lr` with consignment payload (consignor, consignee, goods, GSTIN, e-Way bill).
- **Expected Result:**
  - HTTP `201 Created` with generated `lrNumber`.
  - Record inserted into PostgreSQL table `lr_consignment_notes` with `organization_id = 'org-alpha-101'`.
  - Database verification: `SELECT id FROM lr_consignment_notes WHERE id = :id` returns 1 row.

### Scenario 4: Trip Scheduling & Asset Lock
- **Actor:** `manager@alpha.test` (`org-alpha-101`)
- **Action:** Sends `POST /api/v1/trips` assigning Vehicle `NL-01-K-4421` and Driver `drv-01` to newly booked LR.
- **Expected Result:**
  - HTTP `201 Created` with `status = 'scheduled'`.
  - Both vehicle and driver operational statuses update to `in_transit`.
  - Subsequent attempt to assign the same vehicle to a concurrent trip is rejected with HTTP `422 Unprocessable Entity` (`ASSET_UNAVAILABLE`).

### Scenario 5: Mobile Driver Portal POD Submission
- **Actor:** `driver.ramesh@alpha.test` (`role: driver`)
- **Action:** Sends `POST /api/v1/trips/:tripId/pod` with receiver name, shortage quantity 0, and photo upload.
- **Expected Result:**
  - HTTP `201 Created` with `status = 'pending_verification'`.
  - Record inserted into `proofs_of_delivery`.
  - Trip status transitions to `delivered`.

### Scenario 6: Strict Invoice Gate Enforcement (Negative Test)
- **Actor:** `accounts@alpha.test` (`role: accountant`)
- **Action:** Sends `POST /api/v1/finance/invoices` for an LR whose POD is still `pending_verification`.
- **Expected Result:**
  - HTTP `422 Unprocessable Entity` (`INVOICE_GATE_POD_UNVERIFIED`).
  - Zero invoice rows or journal records inserted.

### Scenario 7: POD Verification Approval
- **Actor:** `manager@alpha.test` (`role: manager`)
- **Action:** Sends `PATCH /api/v1/trips/:tripId/pod` with `decision = 'verify'`.
- **Expected Result:**
  - HTTP `200 OK` with POD `status = 'verified'` and `verified_by` timestamp recorded.

### Scenario 8: Customer GST Invoicing & Balanced Journal Creation
- **Actor:** `accounts@alpha.test` (`role: accountant`)
- **Action:** Sends `POST /api/v1/finance/invoices` for the now-verified LR.
- **Expected Result:**
  - HTTP `201 Created`.
  - Record inserted into `customer_invoices_v2`.
  - Balanced double-entry journal entry inserted into `journal_entries` with lines debiting Accounts Receivable and crediting Freight Revenue and GST Output Ledger ($\sum\text{Debit} == \sum\text{Credit}$).

### Scenario 9: Duplicate Expense Receipt Rejection
- **Actor:** `driver.ramesh@alpha.test` (`role: driver`)
- **Action:** Submits fuel expense with receipt number `IOCL-STAGING-991`. Submits a duplicate request with the identical receipt number.
- **Expected Result:**
  - Request 1: HTTP `201 Created`.
  - Request 2: HTTP `409 Conflict` (`DUPLICATE_EXPENSE_RECEIPT`).

### Scenario 10: Section 194C TDS Vendor Settlement
- **Actor:** `accounts@alpha.test` (`role: accountant`)
- **Action:** Sends `POST /api/v1/finance/vendor-bills` for Truck Broker with ₹100,000 gross freight under TDS Section 194C (2% rate).
- **Expected Result:**
  - HTTP `201 Created`.
  - TDS calculated: ₹2,000; Net payable: ₹98,000.
  - Record inserted into `vendor_settlements`.

### Scenario 11: Database-Level Ledger Immutability (Direct SQL Test)
- **Actor:** Direct PostgreSQL connection using Service Role / Admin credentials.
- **Action:** Executes direct SQL mutation:
  ```sql
  UPDATE journal_entries SET total_debit = 0 WHERE id = :journal_id;
  ```
- **Expected Result:**
  - PostgreSQL transaction aborts with error:
    `ERROR: 42501: Mutation of posted financial journal entries is prohibited by system audit rules.`
  - Trigger `trg_prevent_journal_update` successfully defends financial book ledger integrity.

---

## 4. Test Completion Criteria

Staging verification is certified only when:
- [ ] All 11 test scenarios pass with zero failures.
- [ ] Database queries confirm persistent storage of all created records.
- [ ] No unhandled exceptions or 500 errors occur in server logs.
- [ ] Both test organizations report 100% clean data isolation.
