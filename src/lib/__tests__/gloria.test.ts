import { describe, it, expect } from "vitest";
import { STORES, initialScheduleFor } from "../stores";
import { publicHolidays } from "../holidays";
describe("GLORIA defaults", () => {
 it("loads independent store, staff and opening hours", () => {
 const store = STORES[0]; const schedule = initialScheduleFor(store);
 expect(store.id).toBe("gloria");
 expect(schedule.address).toBe("Hohenstaufenring 55, 50674 Köln");
 const staff = schedule.employees.filter(e => !e.ownerSupport);
 expect(staff.map(e => e.name)).toEqual(["Thanh Le Nguyen", "Mai Thi Nguyen", "Van Tuan Nguyen"]);
 expect(staff.reduce((sum,e) => sum + e.monthlySalary!,0)).toBeCloseTo(2406.38);
 expect(staff.every(e => e.hourlyRate === 13.9)).toBe(true);
 expect(schedule.workHours.perWeekday.monday).toEqual([{startMinutes:570,endMinutes:1170}]);
 expect(schedule.workHours.perWeekday.saturday).toEqual([{startMinutes:600,endMinutes:1080}]);
 expect(schedule.workHours.closedWeekdays.sunday).toBe(true);
 expect(schedule.workHours.holiday).toEqual([]);
 expect(schedule.employees.filter(e=>e.ownerSupport)).toHaveLength(1);
 });
 it("uses NRW holidays", () => {
 const days=publicHolidays(2026);
 expect(days.has("2026-01-06")).toBe(false);
 expect(days.has("2026-08-15")).toBe(false);
 expect(days.has("2026-11-01")).toBe(true);
 expect(days.has("2026-06-04")).toBe(true);
 });
});
