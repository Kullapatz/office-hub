import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { clockIn, clockOut, getNetworkStatus } from "./attendance.functions";

export const COMPANY_DOMAIN = "wandersiam.com";
export const LEAVE_QUOTA = { Sick: 6, Personal: 6, Annual: 6 } as const;

export type LeaveType = keyof typeof LEAVE_QUOTA;
export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type Role = "employee" | "hr";

export type Employee = {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  role: Role;
  active: boolean;
  linked: boolean;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: LeaveType;
  start: string;
  end: string;
  days: number;
  reason: string;
  attachment?: string | undefined;
  status: LeaveStatus;
  comment?: string | undefined;
  submittedAt: string;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string | undefined;
  checkOut?: string | undefined;
  ip?: string | undefined;
  status: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  category: "News" | "Memo" | "Event";
  read: boolean;
};

export type Holiday = { date: string; name: string; kind: "national" | "company" };
export type OfficeNetwork = { id: string; cidr: string; label: string };
export type Result = { ok: boolean; error?: string };

export const iso = (d: Date) => d.toISOString().slice(0, 10);

const timeOf = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(value))
    : undefined;

type Store = {
  currentUser: Employee | null;
  hydrated: boolean;
  loading: boolean;
  clientIp: string;
  onOfficeNetwork: boolean;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  holidays: Holiday[];
  officeNetworks: OfficeNetwork[];
  todayRecord: AttendanceRecord | undefined;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  checkIn: () => Promise<Result>;
  checkOut: () => Promise<Result>;
  submitLeave: (r: {
    type: LeaveType;
    start: string;
    end: string;
    days: number;
    reason: string;
    file?: File | null;
  }) => Promise<Result>;
  decideLeave: (id: string, status: LeaveStatus, comment?: string) => Promise<Result>;
  attachmentUrl: (path: string) => Promise<string | null>;
  saveEmployee: (e: Employee) => Promise<Result>;
  deleteEmployee: (id: string) => Promise<Result>;
  addAnnouncement: (a: { title: string; body: string; category: Announcement["category"] }) => Promise<Result>;
  markAllRead: () => Promise<void>;
  addOfficeNetwork: (cidr: string, label: string) => Promise<Result>;
  removeOfficeNetwork: (id: string) => Promise<Result>;
  addHoliday: (date: string, name: string, kind: Holiday["kind"]) => Promise<Result>;
  removeHoliday: (date: string, name: string) => Promise<Result>;
  quotaFor: (employeeId: string) => Record<LeaveType, { used: number; quota: number }>;
};

const HrContext = createContext<Store | null>(null);

export function HrProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [officeNetworks, setOfficeNetworks] = useState<OfficeNetwork[]>([]);
  const [balances, setBalances] = useState<
    { user_id: string; type: LeaveType; quota: number; used: number }[]
  >([]);
  const [network, setNetwork] = useState<{ ip: string; allowed: boolean }>({ ip: "", allowed: false });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setHydrated(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setHydrated(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      setEmployees([]);
      setLeaves([]);
      setAttendance([]);
      setAnnouncements([]);
      setBalances([]);
      return;
    }
    setLoading(true);
    const [profiles, roles, leaveRows, attRows, annRows, reads, holRows, netRows, balRows] =
      await Promise.all([
        supabase.from("profiles").select("*").order("name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("leave_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("attendance").select("*").order("work_date", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("announcement_reads").select("announcement_id"),
        supabase.from("holidays").select("*").order("holiday_date"),
        supabase.from("office_networks").select("*").order("created_at"),
        supabase.from("leave_balances").select("*"),
      ]);

    const roleMap = new Map<string, Role>();
    (roles.data ?? []).forEach((r) => {
      if (r.role === "hr") roleMap.set(r.user_id, "hr");
      else if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, "employee");
    });

    setEmployees(
      (profiles.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        department: p.department,
        email: p.email,
        active: p.active,
        linked: p.linked,
        role: roleMap.get(p.id) ?? "employee",
      })),
    );

    setLeaves(
      (leaveRows.data ?? []).map((l) => ({
        id: l.id,
        employeeId: l.user_id,
        type: l.type as LeaveType,
        start: l.start_date,
        end: l.end_date,
        days: l.days,
        reason: l.reason,
        attachment: l.attachment_path ?? undefined,
        status: l.status as LeaveStatus,
        comment: l.comment ?? undefined,
        submittedAt: l.created_at.slice(0, 10),
      })),
    );

    setAttendance(
      (attRows.data ?? []).map((a) => ({
        id: a.id,
        employeeId: a.user_id,
        date: a.work_date,
        checkIn: timeOf(a.check_in),
        checkOut: timeOf(a.check_out),
        ip: a.ip ?? undefined,
        status: a.status,
      })),
    );

    const readSet = new Set((reads.data ?? []).map((r) => r.announcement_id));
    setAnnouncements(
      (annRows.data ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        category: a.category as Announcement["category"],
        date: a.created_at.slice(0, 10),
        read: readSet.has(a.id),
      })),
    );

    setHolidays(
      (holRows.data ?? []).map((h) => ({
        date: h.holiday_date,
        name: h.name,
        kind: h.kind === "company" ? "company" : "national",
      })),
    );
    setOfficeNetworks(
      (netRows.data ?? []).map((n) => ({ id: n.id, cidr: String(n.cidr), label: n.label })),
    );
    setBalances(
      (balRows.data ?? []).map((b) => ({
        user_id: b.user_id,
        type: b.type as LeaveType,
        quota: b.quota,
        used: b.used,
      })),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    void getNetworkStatus()
      .then(setNetwork)
      .catch(() => setNetwork({ ip: "", allowed: false }));
  }, [userId]);

  const value = useMemo<Store>(() => {
    const currentUser = employees.find((e) => e.id === userId) ?? null;
    const todayDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const todayRecord = attendance.find((a) => a.employeeId === userId && a.date === todayDate);

    const wrap = async (fn: () => Promise<Result>): Promise<Result> => {
      const res = await fn();
      await load();
      return res;
    };

    return {
      currentUser,
      hydrated,
      loading,
      clientIp: network.ip,
      onOfficeNetwork: network.allowed,
      employees,
      leaves,
      attendance,
      announcements,
      holidays,
      officeNetworks,
      todayRecord,
      refresh: load,
      logout: async () => {
        await supabase.auth.signOut();
      },
      checkIn: () =>
        wrap(async () => {
          const res = await clockIn();
          setNetwork((n) => n);
          return res.ok ? { ok: true } : { ok: false, error: res.error };
        }),
      checkOut: () =>
        wrap(async () => {
          const res = await clockOut();
          return res.ok ? { ok: true } : { ok: false, error: res.error };
        }),
      submitLeave: (r) =>
        wrap(async () => {
          if (!userId) return { ok: false, error: "Not signed in." };
          let attachmentPath: string | null = null;
          if (r.file) {
            const path = `${userId}/${Date.now()}-${r.file.name.replace(/[^\w.-]/g, "_")}`;
            const { error } = await supabase.storage
              .from("medical-certificates")
              .upload(path, r.file, { upsert: false });
            if (error) return { ok: false, error: `Upload failed: ${error.message}` };
            attachmentPath = path;
          }
          const { error } = await supabase.from("leave_requests").insert({
            user_id: userId,
            type: r.type,
            start_date: r.start,
            end_date: r.end,
            days: r.days,
            reason: r.reason,
            attachment_path: attachmentPath,
          });
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      decideLeave: (id, status, comment) =>
        wrap(async () => {
          const { error } = await supabase
            .from("leave_requests")
            .update({ status, comment: comment ?? null })
            .eq("id", id);
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      attachmentUrl: async (path) => {
        const { data } = await supabase.storage
          .from("medical-certificates")
          .createSignedUrl(path, 300);
        return data?.signedUrl ?? null;
      },
      saveEmployee: (e) =>
        wrap(async () => {
          const exists = employees.some((p) => p.id === e.id);
          const row = {
            email: e.email.trim().toLowerCase(),
            name: e.name.trim(),
            position: e.position,
            department: e.department,
            active: e.active,
          };
          if (exists) {
            const { error } = await supabase.from("profiles").update(row).eq("id", e.id);
            if (error) return { ok: false, error: error.message };
          } else {
            const { data, error } = await supabase
              .from("profiles")
              .insert(row)
              .select("id")
              .single();
            if (error) return { ok: false, error: error.message };
            await supabase.from("leave_balances").insert(
              (["Sick", "Personal", "Annual"] as LeaveType[]).map((type) => ({
                user_id: data.id,
                type,
              })),
            );
            e = { ...e, id: data.id };
          }
          const current = employees.find((p) => p.id === e.id)?.role ?? "employee";
          if (current !== e.role) {
            if (e.role === "hr") await supabase.from("user_roles").insert({ user_id: e.id, role: "hr" });
            else await supabase.from("user_roles").delete().eq("user_id", e.id).eq("role", "hr");
          }
          return { ok: true };
        }),
      deleteEmployee: (id) =>
        wrap(async () => {
          const { error } = await supabase.from("profiles").delete().eq("id", id);
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      addAnnouncement: (a) =>
        wrap(async () => {
          const { error } = await supabase
            .from("announcements")
            .insert({ ...a, created_by: userId });
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      markAllRead: async () => {
        if (!userId) return;
        const unread = announcements.filter((a) => !a.read);
        if (unread.length === 0) return;
        await supabase
          .from("announcement_reads")
          .upsert(unread.map((a) => ({ announcement_id: a.id, user_id: userId })));
        await load();
      },
      addOfficeNetwork: (cidr, label) =>
        wrap(async () => {
          const { error } = await supabase.from("office_networks").insert({ cidr, label });
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      removeOfficeNetwork: (id) =>
        wrap(async () => {
          const { error } = await supabase.from("office_networks").delete().eq("id", id);
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      addHoliday: (date, name, kind) =>
        wrap(async () => {
          const { error } = await supabase
            .from("holidays")
            .insert({ holiday_date: date, name, kind });
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      removeHoliday: (date, name) =>
        wrap(async () => {
          const { error } = await supabase
            .from("holidays")
            .delete()
            .eq("holiday_date", date)
            .eq("name", name);
          return error ? { ok: false, error: error.message } : { ok: true };
        }),
      quotaFor: (employeeId) => {
        const base: Record<LeaveType, { used: number; quota: number }> = {
          Sick: { used: 0, quota: LEAVE_QUOTA.Sick },
          Personal: { used: 0, quota: LEAVE_QUOTA.Personal },
          Annual: { used: 0, quota: LEAVE_QUOTA.Annual },
        };
        balances
          .filter((b) => b.user_id === employeeId)
          .forEach((b) => {
            base[b.type] = { used: b.used, quota: b.quota };
          });
        return base;
      },
    };
  }, [
    userId,
    hydrated,
    loading,
    network,
    employees,
    leaves,
    attendance,
    announcements,
    holidays,
    officeNetworks,
    balances,
    load,
  ]);

  return <HrContext.Provider value={value}>{children}</HrContext.Provider>;
}

export function useHr() {
  const ctx = useContext(HrContext);
  if (!ctx) throw new Error("useHr must be used inside HrProvider");
  return ctx;
}

export function employeeName(list: Employee[], id: string) {
  return list.find((e) => e.id === id)?.name ?? "Unknown";
}
