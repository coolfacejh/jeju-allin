import { Link } from 'react-router-dom';
import type { Content } from '../types';
import { confirmedPictograms, PICTOGRAM_SOURCE } from '../lib/accessPictograms';
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
