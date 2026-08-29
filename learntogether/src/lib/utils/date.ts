/** Local-date helpers. Streaks are about the learner's own days, so never UTC. */

/** "YYYY-MM-DD" in the device's own timezone. */
export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function previousDateKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

/** Start of the local day containing `date`, as a timestamp. */
export function startOfDay(date: Date = new Date()): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

/** "5 minutes", "2 hours 10 minutes" — for the caregiver dashboard. */
export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.round(milliseconds / 60000);
  if (totalMinutes < 1) return "Less than a minute";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** "Today", "Yesterday" or a short date. */
export function formatRelativeDay(timestamp: number, now: Date = new Date()): string {
  const key = toDateKey(new Date(timestamp));
  const todayKey = toDateKey(now);
  if (key === todayKey) return "Today";
  if (key === previousDateKey(todayKey)) return "Yesterday";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
