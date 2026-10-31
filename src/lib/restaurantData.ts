import type { Employee } from "../types";
import { makeEmployee } from "./sampleData";

// Lemontaste (chủ quán, 10/2026): giờ/tháng và Brutto theo bảng của chủ.
// Lương giờ = Brutto / giờ, giữ đúng số giờ trong bảng.
function staff(id: string, name: string, hours: number, brutto: number, maxDaysPerWeek?: number): Employee {
  const type = brutto <= 603 ? "MINIJOB" : hours >= 150 ? "VOLLZEIT" : "TEILZEIT";
  return { ...makeEmployee(id, name, type, hours), station: "SERVICE",
    monthlySalary: brutto, hourlyRate: Math.round(brutto / hours * 100) / 100,
    targetMinutes: Math.round(hours * 60), maxDaysPerWeek,
    // Vollzeit theo chủ: 6 giờ/ngày (mềm – nếu không đủ ngày, app tự kéo dài ca).
    shiftHours: type === "VOLLZEIT" ? { min: 6, max: 6 } : undefined };
}
/** Dinh Bien (Minijob): chỉ ca tối giờ đông khách, ưu tiên 18:00–20:00, không bắt đầu 17:00. */
export const DINH_BIEN_SHIFT = { startMinutes: 18 * 60, endMinutes: 21 * 60 + 30 };

/** Vị trí, ngày làm và ghi chú theo bảng nhân sự 10/2026 của chủ quán. */
export const LEMONTASTE_PATCHES: Record<string, Partial<Employee>> = {
  "lt-ngoc-long": { station: "BOTH" }, // Giấy chủ: nấu, bồi, Vorbereitung… – linh hoạt Bồi/Bếp, mỗi thời điểm một vị trí
  "lt-ngoc-ly-ly": { station: "SERVICE" }, // Giấy chủ: Bồi, Mise, chuẩn bị giấy tờ
  "lt-van-diep": { station: "KITCHEN", endDate: "2026-10-31" }, // Bếp, nghỉ cuối T10
  "lt-thi-huong": { station: "SERVICE", availableWeekdays: ["friday", "saturday", "sunday"] }, // Bồi/Bar, T6–CN
  "lt-van-kien": { station: "KITCHEN" }, // Bếp phụ
  "lt-dinh-bien": {
    station: "SERVICE",
    shiftWindow: DINH_BIEN_SHIFT,
    // Kein „Khung giờ ưu tiên": jede Schicht im Fenster deckt 18:00–20:00 ohnehin ab,
    // sonst meldet die Prüfung jede Schicht bis 21:30 als „ngoài khung".
    preferredWindows: undefined,
  },
  "lt-moi-a": { name: "Thai Hung Nguyen", station: "SERVICE", availableWeekdays: ["friday", "saturday", "sunday"] }, // Bar, T6–CN
  "lt-moi-b": { name: "Tran Dinh Hoang", station: "KITCHEN", maxDaysPerWeek: 5 }, // Bếp, thử việc 8 tháng
};

export function lemontasteEmployees(): Employee[] {
  return [
    { ...staff("gl-thanh-le", "Thanh Le Nguyen", 86.36, 1200.38), hourlyRate: 13.90, quotaSource: "salary" as const },
    { ...staff("gl-mai-thi", "Mai Thi Nguyen", 43.38, 603), hourlyRate: 13.90, quotaSource: "salary" as const },
    { ...staff("gl-van-tuan", "Van Tuan Nguyen", 43.38, 603), hourlyRate: 13.90, quotaSource: "salary" as const },
    restaurantOwner(),
  ];
}
export const restaurantOwner = (): Employee => ({ id: "gl-owner", name: "Chủ tiệm", employmentType: "VOLLZEIT", station: "SERVICE", targetMinutes: 0, ownerSupport: true });
