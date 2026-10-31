import { expect,it } from "vitest";
import { auditSchedule } from "../scheduleAudit";
import { STORES,initialScheduleFor } from "../stores";
it("audits GLORIA windows, paid staff, breaks and closures",()=>{
 const store=STORES[0], base=initialScheduleFor(store), id=base.employees[0].id;
 const schedule={...base,shifts:[{id:"test",employeeId:id,date:"2026-10-05",startMinutes:960,endMinutes:1140,pauseStartMinutes:1020,pauseMinutes:30,paidMinutes:150,shiftType:"CUSTOM" as const,generated:false}]};
 const report=auditSchedule(schedule,store), day=report.days.find(d=>d.date==="2026-10-05")!;
 expect(report.assignedMinutes).toBe(150);
 expect(day.windows.map(w=>w.openMinutes)).toEqual([150,240,180,30]);
 expect(day.windows[2]).toMatchObject({minEmployees:0,maxEmployees:1,ownerOnlyMinutes:30,uncoveredMinutes:30});
 expect(day.windows.reduce((sum,w)=>sum+w.ownerOnlyMinutes,0)).toBe(450);
 expect(report.days.find(d=>d.date==="2026-10-03")!.closed).toBe(true);
 expect(report.days.find(d=>d.date==="2026-10-04")!.closed).toBe(true);
 expect(report.minijobs.every(e=>e.totalMinutes===0)).toBe(true);
 expect(auditSchedule({...schedule,shifts:[]},store).targetMinutes).toBe(report.targetMinutes);
});
it("clips Saturday peak at 18:00",()=>{
 const store=STORES[0], report=auditSchedule(initialScheduleFor(store),store);
 const day=report.days.find(d=>d.date==="2026-10-10")!;
 expect(day.windows.map(w=>w.openMinutes)).toEqual([120,240,120,0]);
});
