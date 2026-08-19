-- Enums
CREATE TYPE public.app_role AS ENUM ('hr','employee');
CREATE TYPE public.leave_type AS ENUM ('Sick','Personal','Annual');
CREATE TYPE public.leave_status AS ENUM ('Pending','Approved','Rejected');

-- Profiles (employees)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT 'Operations',
  active boolean NOT NULL DEFAULT true,
  linked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_hr()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'hr')
$$;

CREATE POLICY "Signed-in users can read the directory" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "HR can insert employees" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_hr());
CREATE POLICY "HR can update employees" ON public.profiles FOR UPDATE TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());
CREATE POLICY "HR can delete employees" ON public.profiles FOR DELETE TO authenticated USING (public.is_hr());

CREATE POLICY "Users can read roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_hr());

-- Leave balances
CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.leave_type NOT NULL,
  quota integer NOT NULL DEFAULT 6,
  used integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_balances TO authenticated;
GRANT ALL ON public.leave_balances TO service_role;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read balances" ON public.leave_balances FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage balances" ON public.leave_balances FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

-- Attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  work_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  check_in timestamptz,
  check_out timestamptz,
  ip text,
  status text NOT NULL DEFAULT 'On time',
  UNIQUE (user_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own attendance" ON public.attendance FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_hr());
CREATE POLICY "Users insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own attendance" ON public.attendance FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "HR manages attendance" ON public.attendance FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

-- Leave requests
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL DEFAULT 1,
  reason text NOT NULL DEFAULT '',
  attachment_path text,
  status public.leave_status NOT NULL DEFAULT 'Pending',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own leave, HR reads all" ON public.leave_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_hr());
CREATE POLICY "Users create own leave" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users cancel own pending leave" ON public.leave_requests FOR DELETE TO authenticated USING (user_id = auth.uid() AND status = 'Pending');
CREATE POLICY "HR manages leave" ON public.leave_requests FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

-- Approved team leave visible to everyone signed in (calendar)
CREATE OR REPLACE VIEW public.approved_team_leave
WITH (security_invoker = false) AS
  SELECT id, user_id, type, start_date, end_date, days, status FROM public.leave_requests WHERE status = 'Approved';
GRANT SELECT ON public.approved_team_leave TO authenticated;

-- Auto-deduct balances on approval
CREATE OR REPLACE FUNCTION public.sync_leave_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'Approved' AND COALESCE(OLD.status::text, '') <> 'Approved' THEN
    INSERT INTO public.leave_balances (user_id, type, used) VALUES (NEW.user_id, NEW.type, NEW.days)
    ON CONFLICT (user_id, type) DO UPDATE SET used = public.leave_balances.used + NEW.days;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'Approved' AND NEW.status <> 'Approved' THEN
    UPDATE public.leave_balances SET used = GREATEST(used - OLD.days, 0)
    WHERE user_id = OLD.user_id AND type = OLD.type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER leave_balance_sync AFTER INSERT OR UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_leave_balance();

-- Holidays
CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'national'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR manages holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'News',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR manages announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

CREATE TABLE public.announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reads" ON public.announcement_reads FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Office IP whitelist
CREATE TABLE public.office_networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr cidr NOT NULL,
  label text NOT NULL DEFAULT 'Office',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_networks TO authenticated;
GRANT ALL ON public.office_networks TO service_role;
ALTER TABLE public.office_networks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read office networks" ON public.office_networks FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR manages office networks" ON public.office_networks FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

CREATE OR REPLACE FUNCTION public.ip_allowed(_ip text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _ip IS NULL OR _ip = '' THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.office_networks WHERE _ip::inet <<= cidr);
EXCEPTION WHEN others THEN RETURN false;
END;
$$;

-- Bootstrap the signed-in user's employee profile (company domain only).
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  mail text;
  existing_id uuid;
  first_user boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT lower(email) INTO mail FROM auth.users WHERE id = uid;
  IF mail IS NULL OR mail NOT LIKE '%@wandersiam.com' THEN
    RAISE EXCEPTION 'Only @wandersiam.com company accounts are allowed';
  END IF;

  first_user := NOT EXISTS (SELECT 1 FROM public.user_roles);

  SELECT id INTO existing_id FROM public.profiles WHERE lower(email) = mail;
  IF existing_id IS NULL THEN
    INSERT INTO public.profiles (id, email, name, linked)
    VALUES (uid, mail, COALESCE(NULLIF(_name, ''), split_part(mail, '@', 1)), true);
  ELSIF existing_id <> uid THEN
    UPDATE public.profiles SET id = uid, linked = true WHERE id = existing_id;
    UPDATE public.leave_balances SET user_id = uid WHERE user_id = existing_id;
  ELSE
    UPDATE public.profiles SET linked = true WHERE id = uid;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, CASE WHEN first_user THEN 'hr'::public.app_role ELSE 'employee'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.leave_balances (user_id, type)
  SELECT uid, t FROM unnest(ARRAY['Sick','Personal','Annual']::public.leave_type[]) AS t
  ON CONFLICT (user_id, type) DO NOTHING;
END;
$$;

-- Seed holidays and the sample office network
INSERT INTO public.holidays (holiday_date, name, kind) VALUES
  ((date_trunc('year', now())::date + interval '0 day')::date, 'New Year''s Day', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 4, 13), 'Songkran Festival', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 4, 14), 'Songkran Festival', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 4, 15), 'Songkran Festival', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 5, 1), 'Labour Day', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 7, 28), 'H.M. the King''s Birthday', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 8, 12), 'Mother''s Day', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 10, 23), 'Chulalongkorn Day', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 12, 5), 'Father''s Day', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 12, 31), 'New Year''s Eve', 'national'),
  (make_date(EXTRACT(YEAR FROM now())::int, 11, 20), 'WanderSiam Founding Day', 'company');

INSERT INTO public.office_networks (cidr, label) VALUES ('203.154.88.0/24', 'WanderSiam Bangkok office');

INSERT INTO public.announcements (title, body, category) VALUES
  ('Attendance policy', 'Clock in before 09:00 from the office network. Requests to work remotely need prior approval from your department lead.', 'Memo'),
  ('Welcome to the new HR portal', 'Attendance, leave requests and the company calendar now live here. Sign in with your @wandersiam.com account.', 'News');