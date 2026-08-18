import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const COMPANY_DOMAIN = "wandersiam.com";
export const OFFICE_IP = "203.154.88.42";
export const OFFICE_SUBNET = "203.154.88.0/24";
export const EXTERNAL_IP = "171.6.204.19";

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

const today = new Date();
export const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number) => iso(new Date(today.getTime() + days * 86400000));
const y = today.getFullYear();

const employees: Employee[] = [
  { id: "e1", name: "Kullapat Jullarerk", position: "Operations Lead", department: "Operations", email: `kullapat@${COMPANY_DOMAIN}`, role: "employee", active: true },
  { id: "e2", name: "Naruemon Sittipong", position: "HR Manager", department: "People", email: `naruemon@${COMPANY_DOMAIN}`, role: "hr", active: true },
  { id: "e3", name: "Somchai Preechaya", position: "Tour Consultant", department: "Sales", email: `somchai@${COMPANY_DOMAIN}`, role: "employee", active: true },
  { id: "e4", name: "Ploy Wattana", position: "Content Designer", department: "Marketing", email: `ploy@${COMPANY_DOMAIN}`, role: "employee", active: true },
  { id: "e5", name: "Anucha Kritsada", position: "Accountant", department: "Finance", email: `anucha@${COMPANY_DOMAIN}`, role: "employee", active: false },
  { id: "e6", name: "Mint Chaiyaporn", position: "Local Guide", department: "Operations", email: `mint@${COMPANY_DOMAIN}`, role: "employee", active: true },
];

const leaves: LeaveRequest[] = [
  { id: "l1", employeeId: "e3", type: "Sick", start: shift(-4), end: shift(-4), days: 1, reason: "Fever, doctor visit", attachment: "medical-cert.pdf", status: "Pending", submittedAt: shift(-5) },
  { id: "l2", employeeId: "e4", type: "Annual", start: shift(3), end: shift(5), days: 3, reason: "Family trip to Chiang Mai", status: "Pending", submittedAt: shift(-1) },
  { id: "l3", employeeId: "e1", type: "Personal", start: shift(-12), end: shift(-12), days: 1, reason: "Government office errand", status: "Approved", comment: "Approved, please hand over tasks.", submittedAt: shift(-15) },
  { id: "l4", employeeId: "e1", type: "Sick", start: shift(-30), end: shift(-29), days: 2, reason: "Flu", attachment: "clinic-note.jpg", status: "Approved", submittedAt: shift(-31) },
  { id: "l5", employeeId: "e6", type: "Annual", start: shift(7), end: shift(8), days: 2, reason: "Songkran with family", status: "Approved", submittedAt: shift(-3) },
  { id: "l6", employeeId: "e3", type: "Personal", start: shift(-20), end: shift(-20), days: 1, reason: "Moving apartment", status: "Rejected", comment: "Peak season, please reschedule.", submittedAt: shift(-22) },
];

const attendance: AttendanceRecord[] = [
  { id: "a1", employeeId: "e2", date: iso(today), checkIn: "08:41", ip: OFFICE_IP },
  { id: "a2", employeeId: "e3", date: iso(today), checkIn: "08:55", ip: OFFICE_IP },
  { id: "a3", employeeId: "e4", date: iso(today), checkIn: "09:12", ip: OFFICE_IP },
  { id: "a4", employeeId: "e1", date: shift(-1), checkIn: "08:47", checkOut: "18:04", ip: OFFICE_IP },
];

const announcements: Announcement[] = [
  { id: "n1", title: "New attendance policy from next month", body: "Check-in must be completed before 09:00 on the office network. Remote days require prior approval from your department lead.", date: shift(-1), category: "Memo", read: false },
  { id: "n2", title: "Team outing: Kanchanaburi weekend", body: "Join us for a two-day trip. Sign up with People team before the end of this week. Transport and accommodation covered.", date: shift(-3), category: "Event", read: false },
  { id: "n3", title: "Q3 all-hands meeting", body: "All departments meet in the main room at 15:00. Department leads please prepare a 5-minute update.", date: shift(-6), category: "News", read: true },
];

export const holidays: Holiday[] = [
  { date: `${y}-01-01`, name: "New Year's Day", kind: "national" },
  { date: `${y}-04-13`, name: "Songkran Festival", kind: "national" },
  { date: `${y}-04-14`, name: "Songkran Festival", kind: "national" },
  { date: `${y}-05-01`, name: "Labour Day", kind: "national" },
  { date: `${y}-07-28`, name: "H.M. the King's Birthday", kind: "national" },
  { date: `${y}-08-12`, name: "Mother's Day", kind: "national" },
  { date: `${y}-10-23`, name: "Chulalongkorn Day", kind: "national" },
  { date: `${y}-12-05`, name: "Father's Day", kind: "national" },
  { date: `${y}-12-31`, name: "New Year's Eve", kind: "national" },
  { date: shift(10), name: "WanderSiam Founding Day", kind: "company" },
  { date: shift(24), name: "Company Retreat (office closed)", kind: "company" },
];

type Store = {
  currentUser: Employee | null;
  onOfficeNetwork: boolean;
  clientIp: string;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  login: (email: string) => { ok: boolean; error?: string };
  logout: () => void;
  setOnOfficeNetwork: (v: boolean) => void;
  checkIn: () => { ok: boolean; error?: string };
  checkOut: () => { ok: boolean; error?: string };
  todayRecord: AttendanceRecord | undefined;
  submitLeave: (r: Omit<LeaveRequest, "id" | "employeeId" | "status" | "submittedAt">) => void;
  decideLeave: (id: string, status: LeaveStatus, comment?: string) => void;
  saveEmployee: (e: Employee) => void;
  deleteEmployee: (id: string) => void;
  addAnnouncement: (a: Omit<Announcement, "id" | "date" | "read">) => void;
  markAllRead: () => void;
  quotaFor: (employeeId: string) => Record<LeaveType, { used: number; quota: number }>;
};

const HrContext = createContext<Store | null>(null);

const nowTime = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function HrProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [onOfficeNetwork, setOnOfficeNetwork] = useState(true);
  const [emps, setEmps] = useState(employees);
  const [lv, setLv] = useState(leaves);
  const [att, setAtt] = useState(attendance);
  const [ann, setAnn] = useState(announcements);

  const clientIp = onOfficeNetwork ? OFFICE_IP : EXTERNAL_IP;

  const value = useMemo<Store>(() => {
    const todayRecord = att.find((a) => a.employeeId === currentUser?.id && a.date === iso(new Date()));
    const guard = () =>
      onOfficeNetwork
        ? undefined
        : "Access Denied: You must be connected to the office Wi-Fi/Network.";

    return {
      currentUser,
      onOfficeNetwork,
      clientIp,
      employees: emps,
      leaves: lv,
      attendance: att,
      announcements: ann,
      todayRecord,
      setOnOfficeNetwork,
      login: (email) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized.endsWith(`@${COMPANY_DOMAIN}`))
          return { ok: false, error: `Please sign in with your @${COMPANY_DOMAIN} company email.` };
        if (!onOfficeNetwork)
          return { ok: false, error: "Access Denied: You must be connected to the office Wi-Fi/Network." };
        const found = emps.find((e) => e.email.toLowerCase() === normalized);
        if (!found) return { ok: false, error: "No employee profile found for this email." };
        if (!found.active) return { ok: false, error: "This account has been deactivated. Contact HR." };
        setCurrentUser(found);
        return { ok: true };
      },
      logout: () => setCurrentUser(null),
      checkIn: () => {
        const err = guard();
        if (err) return { ok: false, error: err };
        if (!currentUser) return { ok: false, error: "Not signed in." };
        const date = iso(new Date());
        if (todayRecord?.checkIn) return { ok: false, error: "You have already checked in today." };
        setAtt((prev) => [
          ...prev,
          { id: `a${Date.now()}`, employeeId: currentUser.id, date, checkIn: nowTime(), ip: clientIp },
        ]);
        return { ok: true };
      },
      checkOut: () => {
        const err = guard();
        if (err) return { ok: false, error: err };
        if (!todayRecord?.checkIn) return { ok: false, error: "You need to check in first." };
        if (todayRecord.checkOut) return { ok: false, error: "You have already checked out today." };
        setAtt((prev) =>
          prev.map((a) => (a.id === todayRecord.id ? { ...a, checkOut: nowTime(), ip: clientIp } : a)),
        );
        return { ok: true };
      },
      submitLeave: (r) => {
        if (!currentUser) return;
        setLv((prev) => [
          {
            ...r,
            id: `l${Date.now()}`,
            employeeId: currentUser.id,
            status: "Pending",
            submittedAt: iso(new Date()),
          },
          ...prev,
        ]);
      },
      decideLeave: (id, status, comment) =>
        setLv((prev) => prev.map((l) => (l.id === id ? { ...l, status, comment } : l))),
      saveEmployee: (e) =>
        setEmps((prev) => (prev.some((p) => p.id === e.id) ? prev.map((p) => (p.id === e.id ? e : p)) : [...prev, e])),
      deleteEmployee: (id) => setEmps((prev) => prev.filter((e) => e.id !== id)),
      addAnnouncement: (a) =>
        setAnn((prev) => [{ ...a, id: `n${Date.now()}`, date: iso(new Date()), read: true }, ...prev]),
      markAllRead: () => setAnn((prev) => prev.map((a) => ({ ...a, read: true }))),
      quotaFor: (employeeId) => {
        const base = { Sick: { used: 0, quota: LEAVE_QUOTA.Sick }, Personal: { used: 0, quota: LEAVE_QUOTA.Personal }, Annual: { used: 0, quota: LEAVE_QUOTA.Annual } };
        lv.filter((l) => l.employeeId === employeeId && l.status === "Approved").forEach((l) => {
          base[l.type].used += l.days;
        });
        return base;
      },
    };
  }, [currentUser, onOfficeNetwork, clientIp, emps, lv, att, ann]);

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
