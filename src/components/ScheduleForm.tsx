import { DEFAULT_SCHEDULE, type ScheduleSettings } from '../lib/schedule';

export default function ScheduleForm({ value, onChange }: { value: ScheduleSettings; onChange: (value: ScheduleSettings) => void }) {
  const set = <K extends keyof ScheduleSettings>(key: K, next: ScheduleSettings[K]) => onChange({ ...value, [key]: next });
  const inputClass = 'block w-full min-w-0 rounded-lg border border-line bg-white p-2 mt-1 text-sm';
  return <section className="bg-white p-4 rounded-2xl shadow-card mt-4">
    <h2 className="font-bold mb-3">여행 시간 설정</h2>
    <div className="grid grid-cols-2 gap-3 text-xs">
      <label>여행 시작일<input aria-label="여행 시작일" type="date" min="2000-01-01" max="2100-12-01" value={value.startDate ?? ''} onChange={e => set('startDate', e.target.value)} className={inputClass} /></label>
      <label>이동수단<select aria-label="이동수단" value={value.transport} onChange={e => set('transport', e.target.value as ScheduleSettings['transport'])} className={inputClass}>
        <option value="car">자동차 · 추정</option><option value="walk">도보 · 추정</option><option value="transit">대중교통 · 시간 확인 필요</option>
      </select></label>
    </div>
    <details className="mt-3 text-sm"><summary className="cursor-pointer text-primary font-bold py-2">활동 시간 · 항공편 전후 여유시간</summary>
      <div className="grid grid-cols-2 gap-3 text-xs mt-2">
        <label>하루 활동 시작<input type="time" value={value.dayStart} onChange={e => set('dayStart', e.target.value || DEFAULT_SCHEDULE.dayStart)} className={inputClass} /></label>
        <label>하루 활동 종료<input type="time" value={value.dayEnd} onChange={e => set('dayEnd', e.target.value || DEFAULT_SCHEDULE.dayEnd)} className={inputClass} /></label>
        <label>첫날 제주 도착<input type="time" value={value.arrival ?? ''} onChange={e => set('arrival', e.target.value)} className={inputClass} /></label>
        <label>마지막 날 제주 출발<input type="time" value={value.departure ?? ''} onChange={e => set('departure', e.target.value)} className={inputClass} /></label>
        <label>도착 후 확보시간(분)<input type="number" min="0" max="720" value={value.arrivalBuffer} onChange={e => set('arrivalBuffer', Number(e.target.value))} className={inputClass} /></label>
        <label>출발 전 확보시간(분)<input type="number" min="0" max="720" value={value.departureBuffer} onChange={e => set('departureBuffer', Number(e.target.value))} className={inputClass} /></label>
      </div>
      <p className="text-xs text-muted mt-3">확보시간에는 공항 이동·렌터카 인수/반납·수속 시간을 합쳐 직접 입력해 주세요. 공항 이동시간은 자동 계산하지 않습니다. 모든 시각은 제주 현지 시간입니다.</p>
    </details>
  </section>;
}
