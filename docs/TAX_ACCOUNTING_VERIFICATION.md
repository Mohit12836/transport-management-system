# Indian Goods Transport Agency (GTA) Taxation & Double-Entry Accounting Verification Note

**Project:** NextGen Transport Management System (`transport-management-system/`)  
**Statutory Framework:**  
1. Goods and Services Tax (GST) Act, 2017 — Services Accounting Code (SAC) 996511 (Goods Transport by Road)
2. Central Goods and Services Tax (CGST) Notification No. 11/2017-Central Tax (Rate) as amended
3. Notification No. 13/2017-Central Tax (Rate) — Reverse Charge Mechanism (RCM)
4. Income Tax Act, 1961 — Section 194C (Payments to Contractors / Transporters)
5. Income Tax Act, 1961 — Section 206AA (Higher deduction for non-furnishing of PAN)
6. Double-Entry General Ledger Accounting Principles (ICAI Guidance Note)

---

## 1. GST on Goods Transport Agency (SAC 996511)

### A. Core Tax Regimes
Under Indian GST law, a Goods Transport Agency (GTA) provides service in relation to transport of goods by road and issues a Consignment Note (LR/Bilty). The tax rates are:

1. **Reverse Charge Mechanism (RCM) — 5% Rate (Default / Standard):**
   - **Rate:** 5% (Intra-State: 2.5% CGST + 2.5% SGST; Inter-State: 5.0% IGST).
   - **Input Tax Credit (ITC):** No ITC available to the GTA.
   - **Tax Payer:** The recipient (Consignor or Consignee who pays or is liable to pay freight) discharges the GST liability directly under Reverse Charge (Section 9(3) CGST Act).
   - **Invoice Annotation:** The invoice must explicitly state: *"GST payable under Reverse Charge Mechanism (RCM) by recipient: Yes"*.

2. **Forward Charge Mechanism (FCM) — 12% or 5% with Declaration:**
   - **Rate:** 12% with full ITC available to the GTA, or 5% without ITC under Annexure V declaration filed on the GST portal before 15th March of the preceding financial year.
   - **Tax Payer:** GTA collects and pays tax on forward charge basis.

### B. Mathematical Verification in Code
Implemented in `src/lib/tax-rules.ts` and verified by `tests/financial-settlement.test.mjs`:
- **Intra-State (e.g. Origin RJ, Destination RJ):**
  $$\text{CGST} = \text{round}(\text{Taxable Amount} \times 0.025)$$
  $$\text{SGST} = \text{round}(\text{Taxable Amount} \times 0.025)$$
  $$\text{IGST} = 0.00$$
- **Inter-State (e.g. Origin RJ, Destination DL):**
  $$\text{CGST} = 0.00$$
  $$\text{SGST} = 0.00$$
  $$\text{IGST} = \text{round}(\text{Taxable Amount} \times 0.050)$$

---

## 2. Tax Deducted at Source (TDS) Under Section 194C & 206AA

When a logistics company hires third-party market trucks, attached fleet, or transport brokers, TDS must be deducted on the freight hire charges:

### A. TDS Rates Under Section 194C:
1. **Individual / HUF Contractor:** 1% TDS (`0.01`).
2. **Company / Partnership Firm:** 2% TDS (`0.02`).
3. **Exemption under Section 194C(6):** 
   - No TDS (0%) if the contractor owns $\le 10$ goods carriages at any time during the previous year and furnishes a statutory declaration along with valid PAN.

### B. Penal TDS Under Section 206AA:
- If the transporter / truck owner fails to furnish a valid Permanent Account Number (PAN), TDS is statutorily deducted at the higher penal rate of **20%** (`0.20`).

### C. Mathematical Verification in Code
Implemented in `src/lib/tax-rules.ts`:
```typescript
export function computeTdsDeduction(grossAmount: number, vendorType: 'individual' | 'company', hasPan: boolean, hasExemptionDeclaration: boolean): number {
  if (!hasPan) return roundToCurrency(grossAmount * 0.20); // Section 206AA
  if (hasExemptionDeclaration) return 0.00; // Section 194C(6)
  const rate = vendorType === 'individual' ? 0.01 : 0.02;
  return roundToCurrency(grossAmount * rate);
}
```

---

## 3. Driver Trip Settlement Reconciliations

### Formula:
$$\text{Net Balance} = \text{Total Cash Advances Given} - \text{Total Approved In-Trip Expenses} - \text{Shortage/Damage Deductions}$$

- If $\text{Net Balance} > 0$: **Driver Refund Required** (The driver spent less than the cash advance and must refund the remaining cash to the company cashier).
- If $\text{Net Balance} < 0$: **Company Reimbursement Due** (The driver spent out-of-pocket beyond the advance and company owes the driver $|\text{Net Balance}|$).
- If $\text{Net Balance} == 0$: **Exact Zero Settlement**.

---

## 4. Double-Entry Balanced General Ledger Architecture

Every financial transaction generated in NextGen TMS strictly respects the fundamental accounting equation:
$$\sum \text{Debits} == \sum \text{Credits}$$

### A. Customer Invoicing Journal Voucher:
| Account Head | Category | Debit (₹) | Credit (₹) |
|---|---|---|---|
| **Trade Debtors (Customer Receivable)** | Asset | $\text{Grand Total}$ | — |
| **Freight Revenue** | Revenue | — | $\text{Taxable Base Freight}$ |
| **Loading & Handling Charges** | Revenue | — | $\text{Surcharges}$ |
| **Output GST Payable (Forward Charge only)** | Liability | — | $\text{CGST + SGST or IGST}$ |

*(Note: Under RCM, Output GST Payable is ₹0 in the GTA's book of accounts).*

### B. Driver Trip Settlement Journal Voucher:
| Account Head | Category | Debit (₹) | Credit (₹) |
|---|---|---|---|
| **Trip Operating Expenses (Fuel, Toll, Loading)** | Expense | $\text{Total Approved Expenses}$ | — |
| **Transit Shortage / Loss Recoverable** | Asset/Expense | $\text{Shortage Value}$ | — |
| **Driver Cash Advance Clearing** | Asset (Credit) | — | $\text{Total Cash Advance}$ |
| **Cash / Bank Payable (if Reimbursement)** | Liability/Asset | — | $\text{Net Reimbursement}$ |
| **Cash In Hand (if Refund)** | Asset (Debit) | $\text{Net Refund Received}$ | — |

---

## 5. Automated Verification Evidence
All formulas above are strictly tested and verified by our automated test suite:
- `Tax Rules - GST Intra-State vs Inter-State and RCM Calculations` -> **PASS (11.7ms)**
- `Tax Rules - TDS Section 194C & 206AA Verification` -> **PASS (0.88ms)**
- `Financial Engine - Driver Trip Settlement Calculation` -> **PASS (1.11ms)**
- `Financial Engine - Double-Entry Balanced Journal Generation & Ledger Integrity` -> **PASS (37.6ms)**
