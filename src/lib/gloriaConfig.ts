import type { WorkHoursConfig } from "./workHours";
import type { StaffingRule, DemandBand } from "./staffing";
import type { WeekdayKey } from "./demand";
export const GLORIA_WORK_HOURS: WorkHoursConfig = {
 perWeekday: {
  monday:[{startMinutes:570,endMinutes:1170}], tuesday:[{startMinutes:570,endMinutes:1170}],
  wednesday:[{startMinutes:570,endMinutes:1170}], thursday:[{startMinutes:570,endMinutes:1170}],
  friday:[{startMinutes:570,endMinutes:1170}], saturday:[{startMinutes:600,endMinutes:1080}], sunday:[],
 }, holiday:[],
 closedWeekdays:{monday:false,tuesday:false,wednesday:false,thursday:false,friday:false,saturday:false,sunday:true},
};
export const GLORIA_DAY_WEIGHTS: Record<WeekdayKey,number> = {monday:1,tuesday:1,wednesday:1,thursday:1.5,friday:1.5,saturday:1.4,sunday:0};
export const GLORIA_DEMAND: readonly DemandBand[] = [
 {startMinutes:570,endMinutes:960,level:1,label:"Giờ thường"},
 {startMinutes:960,endMinutes:1140,level:1.8,label:"Cao điểm"},
 {startMinutes:1140,endMinutes:1170,level:0.8,label:"Cuối ngày"},
];
export const GLORIA_STAFFING_RULES: readonly StaffingRule[] = [
 {priority:"required",label:"Nhân viên ngày đông",when:"T5–T7 suốt giờ mở cửa",weekdays:["thursday","friday","saturday"],minStaff:1,maxStaff:Infinity,scaled:false,who:e=>!e.ownerSupport,windows:blocks=>blocks},
 {priority:"preparation",label:"Nhân viên giờ cao điểm",when:"16:00–19:00 trong giờ mở cửa",minStaff:1,maxStaff:Infinity,scaled:false,who:e=>!e.ownerSupport,
 windows:blocks=>blocks.map(b=>({startMinutes:Math.max(960,b.startMinutes),endMinutes:Math.min(1140,b.endMinutes)})).filter(b=>b.endMinutes>b.startMinutes)},
 {priority:"coverage",label:"Nhân viên giờ thường",when:"Giờ còn lại, sau ngày đông và cao điểm",minStaff:1,maxStaff:Infinity,scaled:false,who:e=>!e.ownerSupport,windows:blocks=>blocks},
];
