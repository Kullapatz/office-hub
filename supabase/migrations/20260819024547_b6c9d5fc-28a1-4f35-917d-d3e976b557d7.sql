GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "HR manages roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());