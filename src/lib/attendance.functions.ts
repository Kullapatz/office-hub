import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TZ = "Asia/Bangkok";

function requestIp(): string {
  const headers = getRequest()?.headers;
  if (!headers) return "";
  const forwarded = headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return (
    first ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    ""
  );
}

function bangkokParts() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return { date, time };
}

export const getNetworkStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ip = requestIp();
    const { data } = await context.supabase.rpc("ip_allowed", { _ip: ip });
    return { ip, allowed: Boolean(data) };
  });

export const clockIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ip = requestIp();
    const { data: allowed } = await context.supabase.rpc("ip_allowed", { _ip: ip });
    if (!allowed) {
      return {
        ok: false as const,
        error: `Access denied: ${ip || "your network"} is not on the office network whitelist.`,
      };
    }

    const { date, time } = bangkokParts();
    const { data: existing } = await context.supabase
      .from("attendance")
      .select("id, check_in")
      .eq("user_id", context.userId)
      .eq("work_date", date)
      .maybeSingle();

    if (existing?.check_in) return { ok: false as const, error: "You have already clocked in today." };

    const status = time > "09:00" ? "Late" : "On time";
    const payload = {
      user_id: context.userId,
      work_date: date,
      check_in: new Date().toISOString(),
      ip,
      status,
    };

    const { error } = existing
      ? await context.supabase.from("attendance").update(payload).eq("id", existing.id)
      : await context.supabase.from("attendance").insert(payload);

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, status, time };
  });

export const clockOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ip = requestIp();
    const { data: allowed } = await context.supabase.rpc("ip_allowed", { _ip: ip });
    if (!allowed) {
      return {
        ok: false as const,
        error: `Access denied: ${ip || "your network"} is not on the office network whitelist.`,
      };
    }

    const { date } = bangkokParts();
    const { data: existing } = await context.supabase
      .from("attendance")
      .select("id, check_in, check_out")
      .eq("user_id", context.userId)
      .eq("work_date", date)
      .maybeSingle();

    if (!existing?.check_in) return { ok: false as const, error: "You need to clock in first." };
    if (existing.check_out) return { ok: false as const, error: "You have already clocked out today." };

    const { error } = await context.supabase
      .from("attendance")
      .update({ check_out: new Date().toISOString(), ip })
      .eq("id", existing.id);

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
