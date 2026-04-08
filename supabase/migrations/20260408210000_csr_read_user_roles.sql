-- CSR (and admin, though admin already has full access) can SELECT user_roles
-- so the CSR triage page can list agents for assignment.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='user_roles') THEN
    DROP POLICY IF EXISTS "CSR and admin read roles" ON public.user_roles;
    CREATE POLICY "CSR and admin read roles"
      ON public.user_roles FOR SELECT TO authenticated
      USING (
        public.has_role(auth.uid(), 'customer_rep'::app_role)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      );
  END IF;
END $$;
