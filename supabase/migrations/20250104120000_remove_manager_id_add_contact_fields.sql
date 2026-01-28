-- Complete removal of manager_id and all dependencies
-- Defensive approach: only drop what actually exists

-- PART 1: Temporarily disable RLS to avoid policy conflicts
DO $$
BEGIN
    -- Only disable RLS if tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estates') THEN
        ALTER TABLE public.estates DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estate_analytics') THEN
        ALTER TABLE public.estate_analytics DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- PART 2: Drop ALL policies on affected tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop policies on estates if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estates') THEN
        FOR r IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'estates'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.estates';
        END LOOP;
    END IF;
    
    -- Drop policies on estate_analytics if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estate_analytics') THEN
        FOR r IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'estate_analytics'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.estate_analytics';
        END LOOP;
    END IF;
    
    -- Drop policies on estate_residents if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estate_residents') THEN
        FOR r IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'estate_residents'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.estate_residents';
        END LOOP;
    END IF;
END $$;

-- PART 3: Drop dependent objects
DROP TABLE IF EXISTS public.estate_residents CASCADE;
DROP INDEX IF EXISTS public.idx_estates_manager;

-- PART 4: Drop columns only if they exist
DO $$
BEGIN
    -- Drop manager_id if it exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'estates' 
        AND column_name = 'manager_id'
    ) THEN
        ALTER TABLE public.estates DROP COLUMN manager_id CASCADE;
    END IF;
    
    -- Drop manager_name if it exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'estates' 
        AND column_name = 'manager_name'
    ) THEN
        ALTER TABLE public.estates DROP COLUMN manager_name CASCADE;
    END IF;
    
    -- Drop manager_email if it exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'estates' 
        AND column_name = 'manager_email'
    ) THEN
        ALTER TABLE public.estates DROP COLUMN manager_email CASCADE;
    END IF;
    
    -- Drop manager_phone if it exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'estates' 
        AND column_name = 'manager_phone'
    ) THEN
        ALTER TABLE public.estates DROP COLUMN manager_phone CASCADE;
    END IF;
END $$;

-- PART 5: Re-enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estates') THEN
        ALTER TABLE public.estates ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estate_analytics') THEN
        ALTER TABLE public.estate_analytics ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- PART 6: Recreate essential policies WITHOUT manager_id references
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estates') THEN
        -- Drop policy if it already exists to avoid duplicate error
        DROP POLICY IF EXISTS "Users can view approved estates" ON public.estates;
        
        CREATE POLICY "Users can view approved estates"
        ON public.estates
        FOR SELECT
        TO authenticated
        USING (is_approved = true AND is_active = true);
        
        -- Drop policy if it already exists to avoid duplicate error
        DROP POLICY IF EXISTS "Public can view approved estates" ON public.estates;
        
        CREATE POLICY "Public can view approved estates"
        ON public.estates
        FOR SELECT
        TO anon
        USING (is_approved = true AND is_active = true);
    END IF;
END $$;

-- PART 7: Add documentation
COMMENT ON TABLE public.estates IS 'Estates table - manager information removed as estates are registered without user accounts';
