-- Migration 002: Fleet Management, Dispatch Pipeline & POD Enhancements
-- Strictly reviewed, non-destructive migration extending 001_initial_schema.sql

BEGIN;

-- 1. Trip Timeline Events Audit Stream
CREATE TABLE IF NOT EXISTS trip_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    event_title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150),
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Vehicle Maintenance Logs
CREATE TABLE IF NOT EXISTS vehicle_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- Engine Overhaul, Brake Service, Oil Change, Tyre Replacement
    workshop_name VARCHAR(200) NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    odometer_km NUMERIC(10, 2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. High Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_trips_status_org ON trips(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_active ON trips(vehicle_id, status) WHERE status IN ('scheduled', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_trips_driver_active ON trips(driver_id, status) WHERE status IN ('scheduled', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_pod_lr_status ON proofs_of_delivery(lr_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_compliance_expiry ON vehicle_compliance(vehicle_id, valid_until);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(organization_id, license_expiry_date);

-- 4. Constraint Check: Positive Carrying Capacity & Non-Negative Weights
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS chk_vehicle_capacity_positive;
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicle_capacity_positive CHECK (carrying_capacity_ton > 0);

ALTER TABLE lr_consignment_notes DROP CONSTRAINT IF EXISTS chk_lr_weight_positive;
ALTER TABLE lr_consignment_notes ADD CONSTRAINT chk_lr_weight_positive CHECK (actual_weight_ton > 0 AND charged_weight_ton >= actual_weight_ton);

COMMIT;
