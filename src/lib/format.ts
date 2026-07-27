export function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-IN");
}

export function fmtCr(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L Cr`;
  return `₹${fmtInt(Math.round(n))} Cr`;
}

export function fmtPct(n: number, withSign = true): string {
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtSigned(n: number, decimals = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${fmtNum(n, decimals)}`;
}

export function fmtTimeIST(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  return `${date}, ${time}`;
}

/** Market hours: NSE 09:15–15:30 IST, Mon–Fri. Approximation — real impl needs holiday calendar (PRD §6). */
export function isMarketOpen(date = new Date()): boolean {
  const ist = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
}
