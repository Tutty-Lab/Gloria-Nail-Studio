// Lemontaste: một quán.

import type { Employee, Schedule } from "../types";
import { type WeekdayKey } from "./demand";
import { type DemandBand, type StaffingRule } from "./staffing";
import { DEFAULT_WORK_HOURS } from "./workHours";
import { lemontasteEmployees } from "./restaurantData";
import { clip } from "./staffing";
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

const open = { startMinutes: 570, endMinutes: 1170 };
const gloriaHours: WorkHoursConfig = {
  perWeekday: { monday: [open], tuesday: [open], wednesday: [open], thursday: [open],
    friday: [open], saturday: [{ startMinutes: 600, endMinutes: 1080 }], sunday: [] },
  holiday: [],
  closedWeekdays: { monday: false, tuesday: false, wednesday: false, thursday: false,
    friday: false, saturday: false, sunday: true },
};
const rules: readonly StaffingRule[] = [
  { priority: "coverage", label: "Nhân viên giờ cao điểm", when: "16:00–19:00 trong giờ mở cửa", minStaff: 2, maxStaff: Infinity,
    scaled: false, who: (e: Employee) => !e.ownerSupport, windows: clip(960, 1140) },
];
export const STORES: StoreConfig[] = [
  { id: "gloria", name: "GLORIA – Nails, Eyelashes & Cosmetic", shortName: "GLORIA",
    address: "Hohenstaufenring 55, 50674 Köln", sampleEmployees: lemontasteEmployees,
    workHours: gloriaHours, staffingRules: rules,
    demandProfile: [
      { startMinutes: 570, endMinutes: 960, level: 1, label: "Giờ thường" },
      { startMinutes: 960, endMinutes: 1140, level: 1.8, label: "Cao điểm" },
      { startMinutes: 1140, endMinutes: 1170, level: 0.8, label: "Cuối ngày" },
    ],
    dayWeights: { monday: 1, tuesday: 1, wednesday: 1, thursday: 1.5, friday: 1.5, saturday: 1.2, sunday: 0 },
    notes: "T2–T6 09:30–19:30; T7 10:00–18:00. Nghỉ Chủ nhật và ngày lễ NRW. Đông T5, T6, T7; T7 đông hơn T2 một chút. Cao điểm 16:00–19:00 (T7 đến 18:00). Chủ tiệm có mặt cả ngày, ngoài định mức lương. Mục tiêu 2 nhân viên cao điểm là mặc định có thể chỉnh. Điện thoại: 0221/56066581 | 0152/36110859. Website: gloria-cosmetic.de." },
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

/**
 * Ältere Stände (gespeichert, bevor Nieu 37 dazukam) kennen noch keinen
 * personKey. Dann erkennt „Tạo lịch làm việc" nicht, dass Bá Việt Nguyen im
 * Shin und im Nieu derselbe Mensch ist, und plant ihn am selben Tag in beiden
 * Läden. Fehlt der personKey, übernimmt ein Mitarbeiter mit derselben id und
 * demselben Namen wie in der Startbelegschaft personKey und – nur in diesem
 * einen Schritt – auch maxDaysPerWeek. Danach steht der personKey im Stand, und
 * ein später geleertes „tối đa … ngày/tuần" bleibt leer. Löst man die
 * Verbindung im Tab Nhân viên, steht dort "" statt nichts.
 */
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

/** Startstand einer Filiale: September 2026 mit der Belegschaft aus der Angabe. */
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
