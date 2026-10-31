import type { Schedule } from "../types";
/** GLORIA keeps employee settings; no migrations from other stores apply. */
export function applyMigrations(storeId: string, schedule: Schedule): Schedule {
 if (storeId !== "gloria") return schedule;
 const employees = schedule.employees.map(e => e.station === "SERVICE" ? e : { ...e, station: "SERVICE" as const });
 const migrations = (schedule.migrations ?? []).filter(id => id.startsWith("gloria-"));
 return { ...schedule, employees, migrations };
}
