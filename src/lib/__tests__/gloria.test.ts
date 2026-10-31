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

import { weightedDailyTargets } from "../staffing";
import { weekdayKeyOf, parseIsoDate } from "../demand";
it("Saturday target remains slightly above Monday despite shorter opening", () => {
 const store=STORES[0];
 const targets=weightedDailyTargets(["2026-10-05","2026-10-08","2026-10-10"], 30,
 d=>weekdayKeyOf(parseIsoDate(d)), d=>d.endsWith("10")?480:600,store.dayWeights);
 expect(targets.get("2026-10-10")!).toBeGreaterThan(targets.get("2026-10-05")!);
 expect(targets.get("2026-10-10")! / targets.get("2026-10-05")!).toBeCloseTo(1.12);
});

import { generateSchedule } from "../scheduler";
import { singlePoolTargets } from "../peakBalance";
it("single pool preserves paid budget and peak/day ratios", () => {
 const slots = [
  { date:"mon", minute:600, duration:30, weight:1, peak:false, demand:1 },
  { date:"mon", minute:960, duration:30, weight:1, peak:true, demand:1.8 },
  { date:"thu", minute:600, duration:30, weight:1.5, peak:false, demand:1 },
  { date:"thu", minute:960, duration:30, weight:1.5, peak:true, demand:1.8 },
 ];
 const targets=singlePoolTargets(slots,120);
 const at=(day:string,minute:number)=>targets.get(day)!.get(minute)!;
 expect(at("mon",960).service / at("mon",600).service).toBeCloseTo(1.8);
 expect(at("thu",960).service / at("mon",960).service).toBeCloseTo(1.5);
 expect(slots.reduce((sum,s)=>sum+at(s.date,s.minute).service*s.duration,0)).toBeCloseTo(120);
 expect(slots.every(s=>at(s.date,s.minute).kitchen===0)).toBe(true);
});
it("generated October schedule favors busy days without owner payroll", () => {
 const store=STORES[0]; const schedule=initialScheduleFor(store);
 const shifts=generateSchedule({ ...schedule, rules:store.staffingRules, weights:store.dayWeights, demandProfile:store.demandProfile, storeTag:store.id });
 const totals=new Map<string,number>();
 for(const s of shifts) {
  expect(s.employeeId).not.toBe("gl-owner");
  const day=weekdayKeyOf(parseIsoDate(s.date));
  expect(day).not.toBe("sunday");
  totals.set(day,(totals.get(day)??0)+s.paidMinutes);
 }
 const mon=totals.get("monday")!/4;
 const thu=totals.get("thursday")!/5;
 const fri=totals.get("friday")!/5;
 const sat=totals.get("saturday")!/4;
 expect(thu).toBeGreaterThan(mon);
 expect(fri).toBeGreaterThan(mon);
 expect(sat).toBeGreaterThan(mon);
 for(const e of schedule.employees.filter(e=>!e.ownerSupport)) {
 const paid=shifts.filter(s=>s.employeeId===e.id).reduce((sum,s)=>sum+s.paidMinutes,0);
 expect(Math.abs(paid-e.targetMinutes)).toBeLessThan(30);
 }
},60000);

import { RULES, staffingRuleId, ruleById } from "../rules";
import { DEFAULT_WORK_HOURS } from "../workHours";
import { STAFFING_RULES, workloadAt } from "../staffing";
it("runtime defaults and rule panel contain only GLORIA staffing",()=>{
 expect(DEFAULT_WORK_HOURS).toEqual(STORES[0].workHours);
 expect(STAFFING_RULES).toEqual(STORES[0].staffingRules);
 expect(STAFFING_RULES.map(r=>r.label)).toEqual(["Nhân viên ngày đông","Nhân viên giờ cao điểm","Nhân viên giờ thường"]);
 expect(ruleById(staffingRuleId(STAFFING_RULES[0].label)).kind).toBe("hard");
 expect(RULES.some(r=>["two-stores","holiday-duty","spread-service"].includes(r.id))).toBe(false);
 expect(workloadAt(960,"monday")).toBe(1.8);
 expect(workloadAt(720,"monday")).toBe(1);
});

import { auditSchedule } from "../scheduleAudit";
it("covers busy days with paid employees throughout opening hours",()=>{
 const store=STORES[0], schedule=initialScheduleFor(store);
 const shifts=generateSchedule({...schedule,rules:store.staffingRules,weights:store.dayWeights,demandProfile:store.demandProfile,storeTag:store.id});
 const report=auditSchedule({...schedule,shifts},store);
 const busy=report.days.filter(d=>!d.closed && ["thursday","friday","saturday"].includes(d.weekday));
 expect(busy.reduce((sum,d)=>sum+d.windows.reduce((n,w)=>n+w.uncoveredMinutes,0),0)).toBe(0);
});
