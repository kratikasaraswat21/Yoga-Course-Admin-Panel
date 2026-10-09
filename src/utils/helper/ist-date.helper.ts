// Course schedule dates are whole days in India time (IST). The backend stores them as 12:00 AM IST.

const IST_TIME_ZONE = "Asia/Kolkata";

/** Today's date in IST as YYYY-MM-DD. */
export const getIstToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

/** Adds whole days to a YYYY-MM-DD date. */
export const addDaysToDate = (date: string, days: number) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

/** "2026-10-12" -> "12 Oct 2026" */
export const formatScheduleDate = (date?: string | null) => {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
};

export const isValidDateInput = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && formatScheduleDate(value) !== "";
