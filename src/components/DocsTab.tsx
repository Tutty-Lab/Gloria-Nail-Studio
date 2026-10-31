import type { StoreConfig } from "../lib/stores";
import { minutesToTime } from "../lib/time";
import { WEEKDAY_LABELS_VI, type WeekdayKey } from "../lib/demand";
export function DocsTab({ stores }: { stores: StoreConfig[] }) {
  return <div className="space-y-4">
    {stores.map(store => <section key={store.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <h2 className="font-semibold">{store.name}</h2><p>{store.address}</p><p className="text-sm">{store.notes}</p>
      <ul className="text-sm space-y-2">{(Object.keys(store.workHours!.perWeekday) as WeekdayKey[]).map(day =>
        <li key={day}>{WEEKDAY_LABELS_VI[day]}: {store.workHours!.closedWeekdays[day] ? "Nghỉ" : store.workHours!.perWeekday[day].map(b => `${minutesToTime(b.startMinutes)}–${minutesToTime(b.endMinutes)}`).join(" / ")}</li>)}</ul>
      <p className="text-sm">Ngày lễ NRW: nghỉ. Không tính Nachtzuschlag và Sonntagszuschlag.</p>
    </section>)}
    <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm space-y-2">
      <h2 className="font-semibold">Lương và giờ tham khảo</h2>
      <p>3 nhân viên: 2.406,38 € Brutto/tháng; 173,12 giờ tham khảo. Lương giờ 13,90 €. Định mức tính từ lương, làm tròn đến phút.</p>
      <p>Chủ tiệm có mặt cả ngày; không tính vào giờ hưởng lương của 3 nhân viên.</p>
      <p>PDF Stundenzettel: trước mỗi bảng có 1 tờ thông số; ô Gesamtstunden để trống cho chủ tự điền.</p>
    </section>
  </div>;
}
