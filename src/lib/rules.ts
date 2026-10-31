// ============================================================================
// Welche Regeln HART sind und welche WEICH – eine Liste für Anzeige, Prüfung
// und Vorschläge.
//
// Luật cứng: der Planer bricht sie nie. Steht trotzdem etwas im Plan, das sie
// verletzt (Hand-Änderung, unmögliche Vorgabe), ist das ein Fehler.
// Luật mềm: der Planer versucht es; geht es nicht, bleibt der Plan brauchbar,
// die Abweichung wird gemeldet und „Tìm cách xếp khác" sucht eine Änderung.
// ============================================================================

export type RuleKind = "hard" | "soft";

export type RuleId =
  // hart
  | "open-hours"
  | "closing"
  | "shift-length"
  | "max-days"
  | "days-off"
  | "employment-period"
  | "two-stores"
  | "contract-max"
  | "fixed-shift"
  | "holiday-duty"
  // weich
  | "contract-hours"
  | "peak-staff"
  | "day-weights"
  | "own-shift-length"
  | "spread-evenly"
  | "preferred-windows"
  | "spread-service";

export type Rule = { id: RuleId; kind: RuleKind; title: string; detail: string };

export const RULES: readonly Rule[] = [
  { id: "open-hours", kind: "hard", title: "Chỉ trong giờ mở cửa", detail: "T2–T6 09:30–19:30; T7 10:00–18:00. Nghỉ Chủ nhật và ngày lễ NRW." },
  { id: "shift-length", kind: "hard", title: "Ca liền, nghỉ đúng luật", detail: "GLORIA cho phép ca từ 1 giờ để phủ khung thiếu; tối đa 8 giờ công/ngày. Không chia ca gãy; giờ giải lao không tính nhân sự." },
  { id: "max-days", kind: "hard", title: "Tối đa 6 ngày liên tiếp", detail: "Không vượt 6 ngày liên tiếp và không vượt „Số ngày làm / tuần\" đã đặt." },
  { id: "days-off", kind: "hard", title: "Ngày nghỉ cố định", detail: "Không xếp ca vào ngày nghỉ cố định của người đó." },
  { id: "employment-period", kind: "hard", title: "Ngày vào làm / nghỉ việc", detail: "Không xếp ca trước ngày vào làm hoặc sau ngày nghỉ việc." },
  { id: "contract-max", kind: "hard", title: "Không quá giờ hợp đồng", detail: "Không xếp quá giờ tháng (hoặc giờ tuần với hợp đồng theo tuần)." },
  { id: "fixed-shift", kind: "hard", title: "Ca cố định", detail: "Người có ca cố định chỉ làm đúng khung giờ đó." },
  { id: "contract-hours", kind: "soft", title: "Đủ giờ định mức", detail: "Xếp đủ giờ định mức của 3 nhân viên hưởng lương; chủ tiệm có mặt cả ngày, không tính giờ hợp đồng." },
  { id: "peak-staff", kind: "soft", title: "Số người giờ cao điểm", detail: "Ưu tiên cao điểm 16–19h trong giờ mở cửa; ngày đông T5, T6, T7." },
  { id: "day-weights", kind: "soft", title: "Ngày đông nhiều giờ hơn", detail: "T5/T6 ×1,5; T7 ×1,375 theo giờ mở, tương đương tổng giờ mục tiêu cao hơn T2 10%. Chủ nhật và ngày lễ nghỉ." },
  { id: "own-shift-length", kind: "soft", title: "Độ dài ca riêng", detail: "Mỗi ngày làm nằm trong khoảng giờ đã đặt cho người đó." },
  { id: "spread-evenly", kind: "soft", title: "Rải đều trong tháng", detail: "Hợp đồng tháng phân bổ trên toàn tháng, không khóa vào ngân sách từng tuần. Độ dài ca mong muốn là ưu tiên mềm." },
  { id: "preferred-windows", kind: "soft", title: "Khung giờ ưu tiên", detail: "Xếp vào ngày và giờ người đó muốn, nếu số người và giờ định mức cho phép." },
];

export const ruleById = (id: RuleId): Rule => RULES.find((r) => r.id === id) ?? { id, kind: "hard", title: "Kiểm tra cấu hình", detail: "Kiểm tra giờ làm theo cấu hình GLORIA." };

/** GLORIA has one optional peak staffing rule; no station or closing rules. */
export function staffingRuleId(_label: string): RuleId { return "peak-staff"; }
