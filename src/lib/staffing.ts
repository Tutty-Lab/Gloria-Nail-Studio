import { GLORIA_STAFFING_RULES, GLORIA_DEMAND } from "./gloriaConfig";
import type { Employee, Shift } from "../types";
import { DAY_WEIGHTS, type WeekdayKey } from "./demand";
import type { DayBlocks, DayWindow } from "./workHours";

export type StaffingWindow = {
  label: string;
  startMinutes: number;
  endMinutes: number;
  minStaff: number;
  maxStaff: number;
  /** Nur diese Leute zählen (z. B. nur Bếp); fehlt = alle. */
  who?: (employee: Employee) => boolean;
  weight?: number;
  priority?: "required" | "preparation" | "coverage";
};

/**
 * Eine Besetzungsregel: WO (Zeitspanne je Öffnungsblock) und WIE VIELE.
 *
 * minStaff/maxStaff sind der Wert eines Normaltags (Gewicht 1,0). Bei
 * scaled = true werden sie mit dem Tagesgewicht (DAY_WEIGHTS) multipliziert und
 * aufgerundet – starke Tage tragen so automatisch mehr.
 *
 * Einzige Quelle für Scheduler, Độ phủ-Bericht und Tab „Tài liệu": wer die
 * Besetzung eines Ladens ändert, ändert nur diese Liste.
 */
export type StaffingRule = {
  /** Compare peak/kitchen staffing, preparation, coverage, preferences in that order. */
  priority?: "required" | "preparation" | "coverage";
  label: string;
  /** Kurzbeschreibung der Zeitspanne für den Tab „Tài liệu". */
  when: string;
  minStaff: number;
  maxStaff: number;
  scaled: boolean;
  /** Nur an diesen (effektiven) Wochentagen; fehlt = an jedem offenen Tag. */
  weekdays?: readonly WeekdayKey[];
  /** Nur diese Leute zählen (Bếp, Phục vụ, Lái xe); fehlt = alle. */
  who?: (employee: Employee) => boolean;
  /** false = gilt nicht an Feiertagen (obwohl die wie Sonntag zählen). */
  onHolidays?: boolean;
  windows: (blocks: DayBlocks) => DayWindow[];
  /** Kosten je fehlender Personenminute im Planer; fehlt = 500 (Gruppe 5000). */
  weight?: number;
};

/** Schneidet eine feste Uhrzeitspanne mit jedem Öffnungsblock. */
export const clip = (from: number, to: number) => (blocks: DayBlocks): DayWindow[] =>
  blocks
    .map((block) => ({ startMinutes: Math.max(from, block.startMinutes), endMinutes: Math.min(to, block.endMinutes) }))
    .filter((window) => window.endMinutes > window.startMinutes);

export const STAFFING_RULES = GLORIA_STAFFING_RULES;

/** Mindest-/Höchstzahl einer Regel an einem Wochentag (Gewicht angewandt, aufgerundet). */
export function ruleRange(rule: StaffingRule, weekday: WeekdayKey): { minStaff: number; maxStaff: number } {
  const weight = rule.scaled ? DAY_WEIGHTS[weekday] : 1;
  return {
    minStaff: Math.ceil(rule.minStaff * weight),
    maxStaff: Number.isFinite(rule.maxStaff) ? Math.ceil(rule.maxStaff * weight) : Infinity,
  };
}

export function ruleAppliesOn(rule: StaffingRule, weekday: WeekdayKey): boolean {
  return !rule.weekdays || rule.weekdays.includes(weekday);
}

export function staffingWindows(
  blocks: DayBlocks,
  weekday: WeekdayKey,
  rules: readonly StaffingRule[] = STAFFING_RULES,
  holiday = false,
): StaffingWindow[] {
  return rules.filter((rule) => ruleAppliesOn(rule, weekday) && !(holiday && rule.onHolidays === false)).flatMap((rule) => {
    const range = ruleRange(rule, weekday);
    return rule.windows(blocks).map((window) => ({ label: rule.label, ...window, ...range, who: rule.who, weight: rule.weight, priority: rule.priority }));
  });
}

export type DemandBand = { startMinutes: number; endMinutes: number; level: number; label: string };
export function demandProfileOf(_weekday: WeekdayKey, _weights: Record<WeekdayKey,number> = DAY_WEIGHTS): readonly DemandBand[] {
 return GLORIA_DEMAND;
}

/** Relative workload at a minute (1 outside all bands). */
export function workloadAt(
  minute: number,
  weekday: WeekdayKey,
  weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
  profile?: readonly DemandBand[],
): number {
  return (profile ?? demandProfileOf(weekday, weights)).find((b) => minute >= b.startMinutes && minute < b.endMinutes)?.level ?? 1;
}

/**
 * Số người mục tiêu cho từng 30 phút mở cửa:
 *   mục tiêu = giờ công của ngày × mức nhu cầu ÷ tổng mức cả ngày (tính theo phút).
 * Trả về [phút bắt đầu, số người mục tiêu].
 */
export function slotTargets(
  blocks: DayBlocks,
  weekday: WeekdayKey,
  targetHours: number,
  slot = 30,
  weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
  profile?: readonly DemandBand[],
): [number, number][] {
  const slots: [number, number][] = [];
  for (const block of blocks) {
    for (let minute = block.startMinutes; minute < block.endMinutes; minute += slot) {
      slots.push([minute, workloadAt(minute, weekday, weights, profile)]);
    }
  }
  const levelMinutes = slots.reduce((sum, [, level]) => sum + level * slot, 0);
  const scale = levelMinutes > 0 ? (targetHours * 60) / levelMinutes : 0;
  return slots.map(([minute, level]) => [minute, level * scale]);
}

export function validPause(shift: Shift): boolean {
  const start = shift.pauseStartMinutes;
  return start != null && shift.pauseMinutes > 0 && start > shift.startMinutes &&
    start + shift.pauseMinutes < shift.endMinutes && start - shift.startMinutes <= 360 &&
    shift.endMinutes - start - shift.pauseMinutes <= 360;
}

export function workingAt(shift: Shift, minute: number): boolean {
  return shift.startMinutes <= minute && shift.endMinutes > minute &&
    !(validPause(shift) && minute >= shift.pauseStartMinutes! && minute < shift.pauseStartMinutes! + shift.pauseMinutes);
}

/** Assign flexible staff to service when another cook is working; otherwise
 * keep one flexible employee in the kitchen. Never count one person twice. */
export function staffAt(shifts: Shift[], employees: Map<string, Employee>, minute: number): Employee[] {
  const present = [...new Set(shifts.filter(s => workingAt(s, minute)).map(s => s.employeeId))]
    .map(id => employees.get(id)).filter((e): e is Employee => !!e);
  return assignStations([...present, ...[...employees.values()].filter(e => e.ownerSupport && !present.some(p => p.id === e.id))],
    0);
}

/** Shared role resolution for reports and the scheduler's cached slot masks. */
export function assignStations(present: Employee[], kitchenNeeded = 1): Employee[] {
  const flexible = present.filter(e => e.station === "BOTH").sort((a, b) => a.id.localeCompare(b.id));
  const pureKitchen = present.filter(e => e.station === "KITCHEN").length;
  const hasService = present.some(e => e.station !== "KITCHEN" && e.station !== "BOTH");
  const needed = Math.max(1 - pureKitchen, Math.min(kitchenNeeded - pureKitchen, flexible.length - (hasService ? 0 : 1)), 0);
  const cooks = new Set(flexible.slice(0, needed).map(e => e.id));
  return present.map(e => e.station === "BOTH" ? { ...e, station: cooks.has(e.id) ? "KITCHEN" : "SERVICE" } : e);
}

export function coveragePoints(shifts: Shift[], from: number, to: number): number[] {
  return [...new Set([from, to, ...shifts.flatMap((s) => [s.startMinutes, s.endMinutes,
    ...(validPause(s) ? [s.pauseStartMinutes!, s.pauseStartMinutes! + s.pauseMinutes] : []),
  ]).filter((t) => t > from && t < to)])].sort((a, b) => a - b);
}

/**
 * Giờ công mục tiêu mỗi ngày, chuẩn hoá trong từng ISO-week (không mượn giữa các tuần):
 *   giờ ngày = giờ tuần × (hệ số × phút mở) ÷ Σ(hệ số × phút mở)
 * Nhân phút mở để hệ số là MẬT ĐỘ người. Không truyền openMinutesOf => chỉ theo hệ số.
 */
export function weightedDailyTargets(
  dates: string[],
  total: number,
  weekdayOf: (date: string) => WeekdayKey,
  openMinutesOf?: (date: string) => number,
  weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
): Map<string, number> {
  const factor = (date: string) => weights[weekdayOf(date)] * (openMinutesOf ? openMinutesOf(date) : 1);
  const sum = dates.reduce((acc, date) => acc + factor(date), 0);
  return new Map(dates.map((date) => [date, sum > 0 ? total * factor(date) / sum : 0]));
}
