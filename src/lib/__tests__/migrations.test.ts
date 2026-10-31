import { expect,it } from "vitest";
import { applyMigrations } from "../migrations";
import { initialScheduleFor, STORES } from "../stores";
it("removes old migration markers without importing old staff or restrictions",()=>{
 const base=initialScheduleFor(STORES[0]);
 const old={...base,migrations:["2026-10-lemontaste-staff","2026-10-thu-van-nieu"],employees:base.employees.map(e=>({...e,station:"KITCHEN" as const}))};
 const next=applyMigrations("gloria",old);
 expect(next.migrations).toEqual([]);
 expect(next.employees.map(e=>e.id)).toEqual(base.employees.map(e=>e.id));
 expect(next.employees.every(e=>e.station==="SERVICE")).toBe(true);
 expect(next.shifts).toEqual(old.shifts);
 expect(applyMigrations("gloria",next)).toEqual(next);
});
