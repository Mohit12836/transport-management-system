# TEST STRATEGY & QUALITY ASSURANCE: NextGen TMS

## 1. Testing Pyramid & Automation Strategy

| Tier | Focus Area | Framework / Tool | Coverage Target |
|---|---|---|---|
| **Unit Tests** | Financial arithmetic (GST, TDS, freight rates, driver advance reconciliation) | Vitest / Jest | 100% Core Math |
| **API Integration Tests** | Tenant isolation, RBAC role restrictions, LR lifecycle transitions | Playwright / Supertest | 90% Routes |
| **End-to-End (E2E)** | Full user journeys: Booking -> LR -> Dispatch -> POD Upload -> Invoice | Playwright E2E | Core Workflows |
| **Visual & Responsive** | 320px Mobile, 768px Tablet, 1280px Laptop, 1920px+ 4K display testing | Chrome DevTools / Playwright | Zero Overflow |

## 2. Key Acceptance Test Scenarios
1. **Scenario TC-01 (Tenant Isolation):** User from Organization A attempts to fetch LR details with ID belonging to Organization B via direct API URL -> System must return `404 Not Found` or `403 Forbidden`.
2. **Scenario TC-02 (Driver Role Sandboxing):** Driver logs in and tries to access `/finance/invoices` -> System redirects to `/driver-portal` with permission alert.
3. **Scenario TC-03 (Driver Settlement Math):**
   - Trip Advance Disbursed = ₹15,000
   - Diesel Slip (Paid by Driver) = ₹9,200
   - Toll Charges (Paid by Driver) = ₹1,800
   - Loading Labor = ₹500
   - Total Approved Expense = ₹11,500
   - Net Recoverable / Balance = ₹15,000 - ₹11,500 = ₹3,500 (Driver returns to Cashier). Verified automated balance reconciliation.
4. **Scenario TC-04 (POD Verification Gate):** System must block customer invoice generation for an LR if POD status is still `pending_verification`.
