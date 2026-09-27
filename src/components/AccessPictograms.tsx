import { Link } from 'react-router-dom';
import type { AccessKey, AccessState, Content } from '../types';
import { ACCESS_PICTOGRAMS, confirmedPictograms, PICTOGRAM_SOURCE } from '../lib/accessPictograms';
export function AccessGuideLink() {
 return <Link to="/access-guide" className="block rounded-xl border border-line bg-white p-4 text-primary text-sm font-bold">♿ 무장애 관광자료 · 픽토그램 37종 알아보기 →</Link>;
}
export default function AccessPictograms({place}:{place:Content}) {
 const confirmed=confirmedPictograms(place);
 return <div className="my-4 space-y-3">
  {confirmed.length>0 && <><h3 className="text-sm font-bold">제공 자료에 ‘있음’으로 표시된 시설</h3><div className="flex flex-wrap gap-3">{confirmed.map(({pictogram:p})=><div key={p.id} className="flex gap-2 items-center border border-line rounded-lg p-2"><img src={p.image} alt="" className="w-10 h-10 object-contain" /><span className="text-xs">{p.label}<br /><span className="text-muted">자료상 있음 · 이용 조건 확인</span></span></div>)}</div><p className="text-xs text-muted">시설 근거는 아래 비짓제주·한국관광공사 원문에서 확인하세요. 이지제주의 해당 장소 평가를 가져온 것은 아닙니다.</p><a className="text-xs underline text-primary" href={PICTOGRAM_SOURCE} target="_blank" rel="noreferrer">픽토그램 출처: 이지제주 · 관광약자접근성안내센터</a></>}
  <AccessGuideLink />
 </div>;
}


// Category symbols describe the row, not a measured slope/step or access grade.
export function AccessCategoryIcon({kind,state}:{kind:AccessKey;state:AccessState}) {
 const id=({parking:12,restroom:14,elevator:16} as Partial<Record<AccessKey,number>>)[kind];
 const icon=id?ACCESS_PICTOGRAMS.find(p=>p.id===id):undefined;
 return <span aria-hidden="true" data-access-icon={kind} className={`inline-flex w-12 h-12 shrink-0 rounded-lg items-center justify-center ${state==='available'?'bg-primary/10':'bg-slate-100'}`}>
 {icon?<img src={icon.image} alt="" className={`w-10 h-10 object-contain ${state==='unknown'||state==='unavailable'?'grayscale opacity-50':''}`} />:
 <svg viewBox="0 0 48 48" className={`w-10 h-10 ${state==='available'?'text-primary':'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 {kind==='stepFree'?<><path d="M7 38h34M16 38V9h18v29M22 38V15h12"/><circle cx="29" cy="26" r="1"/><path d="m5 29 5 5 5-5M10 21v13"/></>:kind==='ramp'?<><path d="M5 38h38L5 25zM7 18l33 12M10 20v6M36 28v8"/></>:<><circle cx="23" cy="10" r="3"/><path d="m22 17-2 11h12l6 10h5M21 22h11M16 24a10 10 0 1 0 13 13M6 43h35"/></>}
 </svg>}
 </span>;
}
