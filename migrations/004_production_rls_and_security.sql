-- Migration 004: Production Row-Level Security (RLS) & Multi-Tenant Isolation
-- Enforces default-deny access, strict organization boundaries, role-based RBAC,
-- driver trip isolation, vendor isolation, and immutable financial ledgers.
-- Reference: docs/SECURITY_PLAN.md and docs/DATABASE_SCHEMA.md

BEGIN;

-- 1. SECURITY DEFINER HELPER FUNCTIONS FOR SUPABASE AUTH CONTEXT
-- These functions extract organization and role directly from the authenticated user profile
-- without trusting client-side claims.

CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION auth_user_record()
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    branch_id UUID,
    role VARCHAR,
    is_active BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.id, u.organization_id, u.branch_id, u.role::VARCHAR, u.is_active
    FROM users u
    WHERE u.id = auth_user_id() AND u.is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_organization_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.organization_id
    FROM users u
    WHERE u.id = auth_user_id() AND u.is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS VARCHAR
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.role::VARCHAR
    FROM users u
    WHERE u.id = auth_user_id() AND u.is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_linked_driver_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT d.id
    FROM drivers d
    JOIN users u ON u.phone = d.phone AND u.organization_id = d.organization_id
    WHERE u.id = auth_user_id() AND u.is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_linked_vendor_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT v.id
    FROM vendors v
    JOIN users u ON u.phone = v.phone AND u.organization_id = v.organization_id
    WHERE u.id = auth_user_id() AND u.is_active = true
    LIMIT 1;
$$;

-- 2. ENABLE ROW-LEVEL SECURITY ON ALL EXPOSED TABLES (DEFAULT-DENY)

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lr_consignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_invoices_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES: ORGANIZATIONS
CREATE POLICY org_select_policy ON organizations
    FOR SELECT USING (
        id = auth_user_organization_id() OR auth_user_role() = 'superadmin'
    );

CREATE POLICY org_modify_policy ON organizations
    FOR ALL USING (
        (id = auth_user_organization_id() AND auth_user_role() = 'owner')
        OR auth_user_role() = 'superadmin'
    );

-- 4. RLS POLICIES: BRANCHES
CREATE POLICY branch_select_policy ON branches
    FOR SELECT USING (
        organization_id = auth_user_organization_id() OR auth_user_role() = 'superadmin'
    );

CREATE POLICY branch_modify_policy ON branches
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

-- 5. RLS POLICIES: USERS
CREATE POLICY users_select_policy ON users
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR id = auth_user_id()
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY users_modify_policy ON users
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

-- 6. RLS POLICIES: VEHICLES & COMPLIANCE
CREATE POLICY vehicles_select_policy ON vehicles
    FOR SELECT USING (
        organization_id = auth_user_organization_id() OR auth_user_role() = 'superadmin'
    );

CREATE POLICY vehicles_modify_policy ON vehicles
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY compliance_select_policy ON vehicle_compliance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vehicles v
            WHERE v.id = vehicle_compliance.vehicle_id
            AND (v.organization_id = auth_user_organization_id() OR auth_user_role() = 'superadmin')
        )
    );

CREATE POLICY compliance_modify_policy ON vehicle_compliance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vehicles v
            WHERE v.id = vehicle_compliance.vehicle_id
            AND v.organization_id = auth_user_organization_id()
            AND auth_user_role() IN ('owner', 'manager')
        )
        OR auth_user_role() = 'superadmin'
    );

-- 7. RLS POLICIES: DRIVERS
CREATE POLICY drivers_select_policy ON drivers
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR (organization_id = auth_user_organization_id() AND id = auth_linked_driver_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY drivers_modify_policy ON drivers
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

-- 8. RLS POLICIES: CUSTOMERS & VENDORS
CREATE POLICY customers_policy ON customers
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY vendors_select_policy ON vendors
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR (organization_id = auth_user_organization_id() AND id = auth_linked_vendor_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY vendors_modify_policy ON vendors
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

-- 9. RLS POLICIES: LR CONSIGNMENT NOTES
CREATE POLICY lr_select_policy ON lr_consignment_notes
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR (
            organization_id = auth_user_organization_id()
            AND auth_user_role() = 'driver'
            AND EXISTS (
                SELECT 1 FROM trips t
                WHERE t.driver_id = auth_linked_driver_id()
                AND t.id = lr_consignment_notes.trip_id
            )
        )
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY lr_modify_policy ON lr_consignment_notes
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

-- 10. RLS POLICIES: TRIPS & TIMELINE EVENTS
-- Drivers can only view and update trips explicitly assigned to them!
CREATE POLICY trips_select_policy ON trips
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR (organization_id = auth_user_organization_id() AND auth_user_role() = 'driver' AND driver_id = auth_linked_driver_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY trips_update_policy ON trips
    FOR UPDATE USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR (
            organization_id = auth_user_organization_id()
            AND auth_user_role() = 'driver'
            AND driver_id = auth_linked_driver_id()
            AND status IN ('scheduled', 'in_transit')
        )
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY trips_insert_delete_policy ON trips
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY trip_events_select_policy ON trip_timeline_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips t
            WHERE t.id = trip_timeline_events.trip_id
            AND (
                t.organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant')
                OR (t.driver_id = auth_linked_driver_id() AND auth_user_role() = 'driver')
                OR auth_user_role() = 'superadmin'
            )
        )
    );

CREATE POLICY trip_events_insert_policy ON trip_timeline_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips t
            WHERE t.id = trip_timeline_events.trip_id
            AND (
                t.organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager')
                OR (t.driver_id = auth_linked_driver_id() AND auth_user_role() = 'driver')
                OR auth_user_role() = 'superadmin'
            )
        )
    );

-- 11. RLS POLICIES: PROOFS OF DELIVERY (POD)
CREATE POLICY pod_select_policy ON proofs_of_delivery
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR (
            organization_id = auth_user_organization_id()
            AND auth_user_role() = 'driver'
            AND EXISTS (
                SELECT 1 FROM trips t WHERE t.id = proofs_of_delivery.trip_id AND t.driver_id = auth_linked_driver_id()
            )
        )
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY pod_insert_policy ON proofs_of_delivery
    FOR INSERT WITH CHECK (
        (
            organization_id = auth_user_organization_id()
            AND auth_user_role() = 'driver'
            AND EXISTS (
                SELECT 1 FROM trips t WHERE t.id = proofs_of_delivery.trip_id AND t.driver_id = auth_linked_driver_id()
            )
        )
        OR (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY pod_update_policy ON proofs_of_delivery
    FOR UPDATE USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'manager', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

-- 12. RLS POLICIES: FINANCIALS (ADVANCES, EXPENSES, SETTLEMENTS, INVOICES, JOURNALS)
CREATE POLICY advances_select_policy ON driver_advances
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant', 'manager'))
        OR (organization_id = auth_user_organization_id() AND auth_user_role() = 'driver' AND driver_id = auth_linked_driver_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY advances_modify_policy ON driver_advances
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY expenses_select_policy ON trip_expenses
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant', 'manager'))
        OR (organization_id = auth_user_organization_id() AND auth_user_role() = 'driver' AND driver_id = auth_linked_driver_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY expenses_insert_policy ON trip_expenses
    FOR INSERT WITH CHECK (
        (
            organization_id = auth_user_organization_id()
            AND auth_user_role() = 'driver'
            AND driver_id = auth_linked_driver_id()
        )
        OR (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant', 'manager'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY expenses_update_policy ON trip_expenses
    FOR UPDATE USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY driver_settlements_policy ON driver_settlements
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR (organization_id = auth_user_organization_id() AND auth_user_role() = 'driver' AND driver_id = auth_linked_driver_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY driver_settlements_modify_policy ON driver_settlements
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY vendor_settlements_policy ON vendor_settlements
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR (organization_id = auth_user_organization_id() AND auth_user_role() = 'vendor' AND vendor_id = auth_linked_vendor_id())
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY vendor_settlements_modify_policy ON vendor_settlements
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY invoices_policy ON customer_invoices_v2
    FOR ALL USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY invoice_items_policy ON customer_invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM customer_invoices_v2 inv
            WHERE inv.id = customer_invoice_items.invoice_id
            AND (
                (inv.organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
                OR auth_user_role() = 'superadmin'
            )
        )
    );

-- 13. IMMUTABLE GENERAL LEDGER (JOURNAL ENTRIES): STRICT APPEND-ONLY
CREATE POLICY journal_entries_select_policy ON journal_entries
    FOR SELECT USING (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY journal_entries_insert_policy ON journal_entries
    FOR INSERT WITH CHECK (
        (organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
        OR auth_user_role() = 'superadmin'
    );

CREATE POLICY journal_lines_select_policy ON journal_entry_lines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_lines.journal_entry_id
            AND (
                (je.organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
                OR auth_user_role() = 'superadmin'
            )
        )
    );

CREATE POLICY journal_lines_insert_policy ON journal_entry_lines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.id = journal_entry_lines.journal_entry_id
            AND (
                (je.organization_id = auth_user_organization_id() AND auth_user_role() IN ('owner', 'accountant'))
                OR auth_user_role() = 'superadmin'
            )
        )
    );

-- Trigger to disallow any UPDATE or DELETE on closed journal entries
CREATE OR REPLACE FUNCTION prevent_journal_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial journal entries are immutable audit records and cannot be updated or deleted. Post a compensating adjustment entry instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_journal_update ON journal_entries;
CREATE TRIGGER trg_prevent_journal_update
    BEFORE UPDATE OR DELETE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_journal_mutation();

DROP TRIGGER IF EXISTS trg_prevent_journal_line_update ON journal_entry_lines;
CREATE TRIGGER trg_prevent_journal_line_update
    BEFORE UPDATE OR DELETE ON journal_entry_lines
    FOR EACH ROW EXECUTE FUNCTION prevent_journal_mutation();

COMMIT;
