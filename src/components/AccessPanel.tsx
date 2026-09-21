import { ACCESS_LABELS, accessRows, accessFit, accessSourceUrl, STATE_LABELS } from '../lib/access';
import type { Content, UserProfile } from '../types';
export function AccessSummary({place,access}:{place:Content;access?:UserProfile['access']}) {
 const fit=accessFit(place,access), rows=accessRows(place), known=rows.filter(r=>r.state!=='unknown').length;
 return <p className="text-xs leading-relaxed text-sub mt-2">{fit==='met'?'선택한 접근성 조건 충족':fit==='mismatch'?'접근성 조건 불일치':fit==='check'?'접근성 조건 확인 필요':`접근성 정보 ${known}/6항목`}</p>;
}
export default function AccessPanel({place}:{place:Content}) {
 const rows=accessRows(place);
 return <section className="rounded-2xl bg-white shadow-card p-5" aria-label="접근성 상세 정보">
  <h2 className="font-bold text-lg">방문 전 접근성 확인</h2>
  <p className="text-xs text-muted mt-2 mb-4">제공기관의 설명을 정리한 정보입니다. 시설 등록은 모든 구간의 이용 가능을 보장하지 않습니다. 정보가 없으면 이용 불가로 판단하지 않습니다.</p>
  <div className="grid md:grid-cols-2 gap-3">
   {rows.map(row=><div key={row.key} className="rounded-xl border border-line p-3 min-w-0">
    <div className="flex flex-wrap justify-between gap-2"><b className="text-sm">{ACCESS_LABELS[row.key]}</b><span className={`text-xs ${row.state==='available'?'text-primary':row.state==='unknown'?'text-muted':'text-amber-800'}`}>{STATE_LABELS[row.state]}</span></div>
    {row.evidence.map((e,i)=><div key={i} className="text-xs text-sub mt-2 break-words">
      <p>“{e.text}”</p>
      <a className="underline text-primary" target="_blank" rel="noreferrer" href={accessSourceUrl(e.source)}>{e.source.source==='visitjeju'?'비짓제주 원문':'한국관광공사 무장애여행 안내'}</a>
      <p className="text-muted">수신 {new Date(e.source.receivedAt).toLocaleDateString('ko-KR')} · 현장 확인일 {e.source.checkedAt||'미확인'}</p>
    </div>)}
   </div>)}
  </div>
  <details className="mt-4 text-sm"><summary className="cursor-pointer text-primary">전화로 확인할 질문</summary><p className="mt-2 text-sub">출입구에 턱이나 계단이 있나요? 경사로는 혼자 이용할 수 있나요? 장애인 화장실과 주차구역을 방문 시간에 사용할 수 있나요?</p></details>
  {place.phone && /^[+\d()\s-]{5,30}$/.test(place.phone) && <a className="inline-block mt-3 text-sm text-primary underline" href={`tel:${place.phone.replace(/[^+\d]/g,'')}`}>전화 확인 · {place.phone}</a>}
 </section>;
}
