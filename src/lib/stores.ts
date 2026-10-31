// GLORIA: một tiệm.

import type { Employee, Schedule } from "../types";
import { type WeekdayKey } from "./demand";
import { type DemandBand, type StaffingRule } from "./staffing";
import { DEFAULT_WORK_HOURS } from "./workHours";
import { gloriaEmployees } from "./restaurantData";
import { GLORIA_WORK_HOURS, GLORIA_DAY_WEIGHTS, GLORIA_DEMAND, GLORIA_STAFFING_RULES } from "./gloriaConfig";
import type { WorkHoursConfig } from "./workHours";

export type StoreConfig = {
  /** Schlüssel der Zeile in store_data – nach dem Anlegen NICHT mehr ändern. */
  id: string;
  name: string;
  /** Kurzname für den Umschalter in der Kopfzeile. */
  shortName: string;
  address: string;
  /** Belegschaft beim allerersten Öffnen. */
  sampleEmployees: () => Employee[];
  workHours?: WorkHoursConfig;
  notes?: string;
  demandProfile?: readonly DemandBand[];
  /** Welche Wochentage stark sind (Umsatz) – steuert die Stundenverteilung. */
  dayWeights: Record<WeekdayKey, number>;
  /** Wie viele Leute wann im Haus sein sollen. */
  staffingRules: readonly StaffingRule[];
};

export const STORES: StoreConfig[] = [
  { id: "gloria", name: "GLORIA – Nails, Eyelashes & Cosmetic", shortName: "GLORIA",
    address: "Hohenstaufenring 55, 50674 Köln", sampleEmployees: gloriaEmployees,
    workHours: GLORIA_WORK_HOURS, staffingRules: GLORIA_STAFFING_RULES,
    demandProfile: GLORIA_DEMAND,
    dayWeights: GLORIA_DAY_WEIGHTS,
    notes: "T2–T6 09:30–19:30; T7 10:00–18:00. Nghỉ Chủ nhật và ngày lễ NRW. Đông T5, T6, T7; T7 đông hơn T2 một chút. Cao điểm 16:00–19:00 (T7 đến 18:00). Chủ tiệm có mặt cả ngày, ngoài định mức lương. Ưu tiên ít nhất 1 nhân viên hưởng lương cao điểm; giờ còn lại phân bổ theo hệ số. T5/T6 ×1,5; T7 ×1,375 theo giờ mở (tổng giờ mục tiêu cao hơn T2 10%). Điện thoại: 0221/56066581 | 0152/36110859. Website: gloria-cosmetic.de." },
];

export const DEFAULT_STORE_ID = STORES[0].id;

/** Merkt sich die zuletzt gewählte Filiale auf diesem Gerät. */
const STORE_KEY = "gloria-app:store";

export function loadStoreId(): string {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && STORES.some((s) => s.id === saved)) return saved;
  } catch {
    /* ignorieren */
  }
  return DEFAULT_STORE_ID;
}

export function saveStoreId(id: string): void {
  try {
    localStorage.setItem(STORE_KEY, id);
  } catch {
    /* ignorieren */
  }
}

export function storeById(id: string): StoreConfig {
  return STORES.find((s) => s.id === id) ?? STORES[0];
}

/** Preserve explicitly configured employee links and limits. */
export function withSharedPersonDefaults(employees: Employee[], store: StoreConfig): Employee[] {
  const starters = new Map(store.sampleEmployees().map((e) => [e.id, e]));
  return employees.map((employee) => {
    const starter = starters.get(employee.id);
    // "" = im Tab Nhân viên bewusst gelöst – dann nicht wieder verbinden.
    if (employee.personKey !== undefined || !starter?.personKey || starter.name !== employee.name) return employee;
    return {
      ...employee,
      personKey: starter.personKey,
      maxDaysPerWeek: employee.maxDaysPerWeek ?? starter.maxDaysPerWeek,
    };
  });
}

/** Startstand einer Filiale: Oktober 2026 mit der Belegschaft aus der Angabe. */
export function initialScheduleFor(store: StoreConfig): Schedule {
  return {
    companyName: store.name,
    address: store.address,
    year: 2026,
    month: 10,
    workHours: structuredClone(store.workHours ?? DEFAULT_WORK_HOURS),
    dateOverrides: [],
    employees: store.sampleEmployees(),
    shifts: [],
  };
}
