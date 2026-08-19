DROP VIEW IF EXISTS public.approved_team_leave;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_hr() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ip_allowed(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bootstrap_current_user(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_leave_balance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ip_allowed(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.team_leave()
RETURNS TABLE (id uuid, user_id uuid, employee_name text, type public.leave_type, start_date date, end_date date, days integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.user_id, p.name, l.type, l.start_date, l.end_date, l.days
  FROM public.leave_requests l
  JOIN public.profiles p ON p.id = l.user_id
  WHERE l.status = 'Approved' AND auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.team_leave() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.team_leave() TO authenticated;

-- Medical certificate storage rules (files live under <user-id>/...)
CREATE POLICY "Users upload own certificates" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own certificates" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-certificates' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_hr()));
CREATE POLICY "Users delete own certificates" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'medical-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);