import type { Employee } from "../types";
import { makeEmployee } from "./sampleData";

// GLORIA: định mức lương theo bảng chủ tiệm; không chia bộ phận.
function staff(id: string, name: string, hours: number, brutto: number): Employee {
 return { ...makeEmployee(id,name,brutto <= 603 ? "MINIJOB" : "TEILZEIT",hours), station:"SERVICE", monthlySalary:brutto };
}
export function gloriaEmployees(): Employee[] {
  return [
    { ...staff("gl-thanh-le", "Thanh Le Nguyen", 86.36, 1200.38), hourlyRate: 13.90, quotaSource: "salary" as const },
    { ...staff("gl-mai-thi", "Mai Thi Nguyen", 43.38, 603), hourlyRate: 13.90, quotaSource: "salary" as const },
    { ...staff("gl-van-tuan", "Van Tuan Nguyen", 43.38, 603), hourlyRate: 13.90, quotaSource: "salary" as const },
    restaurantOwner(),
  ];
}
export const restaurantOwner = (): Employee => ({ id: "gl-owner", name: "Chủ tiệm", employmentType: "VOLLZEIT", station: "SERVICE", targetMinutes: 0, ownerSupport: true });
