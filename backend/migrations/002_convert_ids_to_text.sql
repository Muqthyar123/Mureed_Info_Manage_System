-- Migration 002: Safely convert live Supabase PostgreSQL UUID columns to TEXT/VARCHAR
-- Reconciles live database tables with application string IDs ("mr-1", "MRD-00001", "usr-main-admin").

-- Step 1: Drop dependent RLS policies that reference id or user_id columns
DROP POLICY IF EXISTS "admins manage peers" ON peers;
DROP POLICY IF EXISTS "admins manage mureeds" ON mureeds;
DROP POLICY IF EXISTS "mureeds read own record" ON mureeds;
DROP POLICY IF EXISTS "users read own profile" ON profiles;
DROP POLICY IF EXISTS "main admins manage approval requests" ON admin_approval_requests;

-- Step 2: Drop foreign key constraints that depend on UUID columns or reference auth.users(id)
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS mureeds DROP CONSTRAINT IF EXISTS mureeds_peer_id_fkey;
ALTER TABLE IF EXISTS mureeds DROP CONSTRAINT IF EXISTS mureeds_user_id_fkey;
ALTER TABLE IF EXISTS admin_approval_requests DROP CONSTRAINT IF EXISTS admin_approval_requests_user_id_fkey;
ALTER TABLE IF EXISTS admin_approval_requests DROP CONSTRAINT IF EXISTS admin_approval_requests_reviewed_by_fkey;
ALTER TABLE IF EXISTS user_accounts DROP CONSTRAINT IF EXISTS user_accounts_mureed_id_fkey;

-- Step 3: Remove gen_random_uuid() defaults if configured
ALTER TABLE IF EXISTS peers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS mureeds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS admin_approval_requests ALTER COLUMN id DROP DEFAULT;

-- Step 4: Convert ID column data types from UUID to TEXT
ALTER TABLE IF EXISTS profiles ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE IF EXISTS peers ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE IF EXISTS mureeds ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE IF EXISTS mureeds ALTER COLUMN peer_id TYPE text USING peer_id::text;
ALTER TABLE IF EXISTS mureeds ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE IF EXISTS admin_approval_requests ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE IF EXISTS admin_approval_requests ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS admin_approval_requests ALTER COLUMN reviewed_by TYPE text USING reviewed_by::text;

ALTER TABLE IF EXISTS user_accounts ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE IF EXISTS user_accounts ALTER COLUMN mureed_id TYPE text USING mureed_id::text;

-- Step 5: Re-create foreign key constraints matching TEXT ID types
ALTER TABLE IF EXISTS mureeds
    ADD CONSTRAINT mureeds_peer_id_fkey FOREIGN KEY (peer_id) REFERENCES peers(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS mureeds
    ADD CONSTRAINT mureeds_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS admin_approval_requests
    ADD CONSTRAINT admin_approval_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS admin_approval_requests
    ADD CONSTRAINT admin_approval_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS user_accounts
    ADD CONSTRAINT user_accounts_mureed_id_fkey FOREIGN KEY (mureed_id) REFERENCES mureeds(id) ON DELETE SET NULL;

-- Step 6: Update helper functions for TEXT user IDs
CREATE OR REPLACE FUNCTION app_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()::text
          AND role IN ('MAIN_ADMIN', 'ADMIN')
          AND status IN ('ACTIVE', 'Active')
    );
$$;

CREATE OR REPLACE FUNCTION app_is_main_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()::text
          AND role = 'MAIN_ADMIN'
          AND status IN ('ACTIVE', 'Active')
    );
$$;

-- Step 7: Re-create RLS policies using TEXT ID matching
CREATE POLICY "admins manage peers" ON peers
    FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY "admins manage mureeds" ON mureeds
    FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

CREATE POLICY "mureeds read own record" ON mureeds
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "users read own profile" ON profiles
    FOR SELECT USING (id = auth.uid()::text OR app_is_admin());

CREATE POLICY "main admins manage approval requests" ON admin_approval_requests
    FOR ALL USING (app_is_main_admin()) WITH CHECK (app_is_main_admin());

-- Step 8: Update check constraints for status columns to accept Title Case values
ALTER TABLE IF EXISTS peers DROP CONSTRAINT IF EXISTS peers_status_check;
ALTER TABLE IF EXISTS peers ADD CONSTRAINT peers_status_check CHECK (status IN ('Active', 'Inactive', 'ACTIVE', 'INACTIVE'));

ALTER TABLE IF EXISTS mureeds DROP CONSTRAINT IF EXISTS mureeds_status_check;
ALTER TABLE IF EXISTS mureeds ADD CONSTRAINT mureeds_status_check CHECK (status IN ('Available', 'Passed Out', 'AVAILABLE', 'PASSED_OUT'));

-- Step 9: Reconcile missing columns in admin_approval_requests and mureeds
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_approval_requests' AND column_name = 'auth_provider'
    ) THEN
        ALTER TABLE admin_approval_requests RENAME COLUMN auth_provider TO auth_method;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_approval_requests' AND column_name = 'requested_at'
    ) THEN
        ALTER TABLE admin_approval_requests RENAME COLUMN requested_at TO requested_date;
        ALTER TABLE admin_approval_requests ALTER COLUMN requested_date TYPE varchar(10) USING requested_date::text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mureeds' AND column_name = 'peer_name'
    ) THEN
        ALTER TABLE mureeds ADD COLUMN peer_name text NOT NULL DEFAULT '';
    END IF;
END $$;
