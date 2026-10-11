-- Milestone 4 Database Migration: Financial Engine, Ledgers & TDS Sec 194C
-- Safe, idempotent PostgreSQL schema with foreign keys, checks, and performance indexes

-- 1. DRIVER ADVANCES TABLE
CREATE TABLE IF NOT EXISTS driver_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(30) NOT NULL CHECK (payment_mode IN ('Cash', 'Bank_Transfer', 'UPI', 'Fuel_Card', 'Cheque')),
    transaction_ref VARCHAR(100),
    disbursed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disbursed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRIP EXPENSES TABLE (with duplicate prevention support)
CREATE TABLE IF NOT EXISTS trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    expense_category VARCHAR(50) NOT NULL CHECK (expense_category IN ('Fuel', 'Toll_FASTag', 'Loading', 'Unloading', 'Repair', 'Driver_Allowance', 'Miscellaneous')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    paid_by VARCHAR(30) NOT NULL DEFAULT 'Driver_Advance' CHECK (paid_by IN ('Driver_Advance', 'Company_Bank', 'Fuel_Card')),
    slip_number VARCHAR(100),
    vendor_name VARCHAR(255),
    receipt_image_url TEXT,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DRIVER SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS driver_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    settlement_number VARCHAR(50) NOT NULL UNIQUE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_advance_disbursed NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_approved_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_rejected_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shortage_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_payable_or_recoverable NUMERIC(12, 2) NOT NULL, -- positive = driver owes company; negative = company owes driver
    settlement_status VARCHAR(30) NOT NULL DEFAULT 'settled' CHECK (settlement_status IN ('draft', 'settled', 'disputed')),
    settled_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VENDOR & BROKER SETTLEMENTS (TDS Sec 194C)
CREATE TABLE IF NOT EXISTS vendor_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    gross_freight NUMERIC(12, 2) NOT NULL CHECK (gross_freight >= 0),
    advance_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tds_section VARCHAR(30) NOT NULL CHECK (tds_section IN ('194C_INDIVIDUAL', '194C_COMPANY', '194C_6_EXEMPT', '206AA_HIGHER')),
    tds_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tds_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shortage_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(12, 2) NOT NULL,
    settlement_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'approved', 'paid')),
    pan_number VARCHAR(10),
    payment_ref VARCHAR(100),
    payment_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CUSTOMER INVOICES ENHANCEMENT (Intra vs Inter-State GST & RCM)
CREATE TABLE IF NOT EXISTS customer_invoices_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_gstin VARCHAR(15),
    billing_address TEXT NOT NULL,
    origin_state VARCHAR(100) NOT NULL,
    destination_state VARCHAR(100) NOT NULL,
    is_rcm_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    subtotal_amount NUMERIC(12, 2) NOT NULL CHECK (subtotal_amount >= 0),
    cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL CHECK (grand_total >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CUSTOMER INVOICE ITEMS (Mapping to verified LRs)
CREATE TABLE IF NOT EXISTS customer_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES customer_invoices_v2(id) ON DELETE CASCADE,
    lr_id UUID NOT NULL REFERENCES consignments(id) ON DELETE RESTRICT,
    lr_number VARCHAR(50) NOT NULL,
    charged_weight_ton NUMERIC(8, 2) NOT NULL,
    freight_amount NUMERIC(12, 2) NOT NULL,
    surcharges_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_item_amount NUMERIC(12, 2) NOT NULL
);

-- 7. DOUBLE-ENTRY JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('INVOICE', 'DRIVER_ADVANCE', 'DRIVER_SETTLEMENT', 'VENDOR_SETTLEMENT', 'TRIP_EXPENSE')),
    reference_id VARCHAR(100) NOT NULL,
    total_debit NUMERIC(12, 2) NOT NULL,
    total_credit NUMERIC(12, 2) NOT NULL,
    is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    debit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    credit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_driver_advances_driver_trip ON driver_advances(driver_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_status ON trip_expenses(trip_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_trip ON driver_settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_vendor ON vendor_settlements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer ON customer_invoices_v2(customer_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_ref ON journal_entries(reference_type, reference_id);
