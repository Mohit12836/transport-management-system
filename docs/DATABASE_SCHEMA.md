# DATABASE SCHEMA: NextGen Transport Management System (PostgreSQL / Supabase)

## 1. Schema Design Principles
- Fully relational, 3rd normal form (3NF) design.
- Multi-tenancy guaranteed via `organization_id` foreign key on all tenant data.
- Strict indexing on frequently queried columns (`organization_id`, `status`, `created_at`, `vehicle_id`, `driver_id`, `lr_number`).
- Auditing enabled on all state-changing tables.

## 2. Complete PostgreSQL / Supabase SQL Schema

```sql
-- ============================================================================
-- NEXTGEN TMS POSTGRESQL PRODUCTION DDL
-- ============================================================================

-- 1. Tenant & Identity Management
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address TEXT,
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'pro', -- starter, pro, enterprise
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    branch_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT,
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    is_head_office BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, branch_code)
);

CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'manager', 'accountant', 'driver', 'vendor');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'manager',
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fleet & Driver Assets
CREATE TYPE vehicle_ownership AS ENUM ('owned', 'attached', 'market');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_transit', 'maintenance', 'out_of_service');

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(20) NOT NULL, -- e.g., RJ14GB4592
    vehicle_type VARCHAR(50) NOT NULL, -- 10-Wheeler, 12-Wheeler, Container, Trailer
    ownership_type vehicle_ownership NOT NULL DEFAULT 'owned',
    chassis_number VARCHAR(50),
    engine_number VARCHAR(50),
    gps_device_id VARCHAR(100),
    fastag_wallet_id VARCHAR(100),
    carrying_capacity_ton NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    status vehicle_status NOT NULL DEFAULT 'available',
    odometer_km NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, vehicle_number)
);

CREATE TABLE vehicle_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- RC, Insurance, National_Permit, Fitness, PUC, Road_Tax
    document_number VARCHAR(100) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    document_file_url TEXT,
    reminder_alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    license_number VARCHAR(50) NOT NULL,
    license_expiry_date DATE NOT NULL,
    aadhaar_number VARCHAR(20),
    permanent_address TEXT,
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    current_advance_balance NUMERIC(10, 2) DEFAULT 0.00,
    monthly_salary NUMERIC(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Commercial Customers & Third-Party Vendors
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    billing_address TEXT NOT NULL,
    credit_period_days INT DEFAULT 30,
    outstanding_balance NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL, -- Fuel_Station, Truck_Broker, Maintenance_Workshop, Tyre_Vendor
    contact_person VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    tds_rate_percent NUMERIC(4, 2) DEFAULT 1.00, -- 1% Individual, 2% Company
    outstanding_payable NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookings, LR / Bilty & Trips
CREATE TYPE lr_payment_type AS ENUM ('to_pay', 'paid', 'tbb');
CREATE TYPE lr_status AS ENUM ('draft', 'generated', 'dispatched', 'delivered', 'billed', 'cancelled');
CREATE TYPE trip_status AS ENUM ('scheduled', 'in_transit', 'unloading', 'completed', 'settled', 'cancelled');

CREATE TABLE lr_consignment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    lr_number VARCHAR(50) NOT NULL,
    lr_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consignor_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    consignor_name VARCHAR(255) NOT NULL,
    consignor_address TEXT NOT NULL,
    consignor_gstin VARCHAR(15),
    consignee_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    consignee_name VARCHAR(255) NOT NULL,
    consignee_address TEXT NOT NULL,
    consignee_gstin VARCHAR(15),
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    eway_bill_number VARCHAR(20),
    eway_bill_valid_until TIMESTAMPTZ,
    goods_description TEXT NOT NULL,
    packages_count INT NOT NULL DEFAULT 1,
    package_type VARCHAR(50) DEFAULT 'Bags/Boxes',
    actual_weight_ton NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    charged_weight_ton NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    freight_rate_per_ton NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_freight_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    loading_charges NUMERIC(10, 2) DEFAULT 0.00,
    unloading_charges NUMERIC(10, 2) DEFAULT 0.00,
    insurance_charges NUMERIC(10, 2) DEFAULT 0.00,
    net_total_amount NUMERIC(12, 2) NOT NULL,
    payment_type lr_payment_type NOT NULL DEFAULT 'tbb',
    status lr_status NOT NULL DEFAULT 'generated',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, lr_number)
);

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    trip_number VARCHAR(50) NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL, -- If hired market truck
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    start_odometer_km NUMERIC(10, 2),
    end_odometer_km NUMERIC(10, 2),
    total_km_run NUMERIC(10, 2),
    start_time TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    status trip_status NOT NULL DEFAULT 'scheduled',
    total_freight_revenue NUMERIC(12, 2) DEFAULT 0.00,
    total_trip_expenses NUMERIC(12, 2) DEFAULT 0.00,
    net_profit_loss NUMERIC(12, 2) DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, trip_number)
);

CREATE TABLE trip_lrs (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    lr_id UUID NOT NULL REFERENCES lr_consignment_notes(id) ON DELETE RESTRICT,
    PRIMARY KEY (trip_id, lr_id)
);

-- 5. Trip Expenses, Advances & Digital Proof of Delivery
CREATE TABLE trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    expense_category VARCHAR(50) NOT NULL, -- Fuel, Toll_FASTag, Loading, Police_RTO, Repair, Driver_Allowance
    amount NUMERIC(10, 2) NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    paid_by VARCHAR(50) NOT NULL, -- Driver_Advance, Company_Bank, Fuel_Card
    slip_number VARCHAR(100),
    receipt_image_url TEXT,
    is_approved BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE driver_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL, -- Cash, Bank_Transfer, UPI, Fuel_Card
    transaction_ref VARCHAR(100),
    disbursed_at TIMESTAMPTZ DEFAULT NOW(),
    is_settled BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE proofs_of_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lr_id UUID NOT NULL REFERENCES lr_consignment_notes(id) ON DELETE RESTRICT,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pod_image_url TEXT NOT NULL,
    received_by_name VARCHAR(150),
    shortage_quantity INT DEFAULT 0,
    damage_remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification', -- pending_verification, verified, rejected
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Financial Invoicing & Settlements
CREATE TABLE customer_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    subtotal_amount NUMERIC(12, 2) NOT NULL,
    cgst_rate_percent NUMERIC(4, 2) DEFAULT 2.50,
    cgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    sgst_rate_percent NUMERIC(4, 2) DEFAULT 2.50,
    sgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    igst_rate_percent NUMERIC(4, 2) DEFAULT 0.00,
    igst_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_rcm_applicable BOOLEAN DEFAULT false,
    grand_total NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partially_paid, paid
    due_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, invoice_number)
);

CREATE TABLE invoice_lrs (
    invoice_id UUID NOT NULL REFERENCES customer_invoices(id) ON DELETE CASCADE,
    lr_id UUID NOT NULL REFERENCES lr_consignment_notes(id) ON DELETE RESTRICT,
    PRIMARY KEY(invoice_id, lr_id)
);

-- 7. Audit & Event Stream
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_name VARCHAR(100) NOT NULL, -- trips, invoices, lr_consignment_notes
    entity_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE_STATUS, REVERSE, CANCEL, APPROVE
    old_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```
