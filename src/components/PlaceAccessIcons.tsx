import type {Content} from '../types';
import {ACCESS_PICTOGRAMS,confirmedPictograms} from '../lib/accessPictograms';
import {easyJejuMatch} from '../lib/easyJeju';
export default function PlaceAccessIcons({place}:{place:Content}){
 const record=easyJejuMatch(place);
 const icons=record?ACCESS_PICTOGRAMS.filter(p=>record.pictograms.includes(p.id)):confirmedPictograms(place).map(x=>x.pictogram);
 if(!icons.length)return <p className="text-xs text-muted">장소별 접근성 픽토그램 정보 미확인</p>;
 return <section className="space-y-2 my-3" aria-label="장소별 접근성 픽토그램">
  <p className="text-xs font-bold text-primary">{record?'이지제주 접근성 안내':'관광정보에서 확인된 시설'}</p>
  <ul className="flex flex-wrap gap-2" style={{listStyle:'none',padding:0}}>{icons.map(p=><li key={p.id} title={p.description} className="flex flex-col items-center gap-1" style={{width:58}}><img src={p.image} alt="" width={40} height={40} loading="lazy"/><span className="text-center text-[11px] leading-tight">{p.label}</span></li>)}</ul>
  {record?<><a className="text-xs underline text-primary inline-block py-1" href={record.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>이지제주 해당 장소 원문 ↗</a><p className="text-[11px] text-muted">자료 수신 {record.retrievedAt.slice(0,10)} · 현장 확인일 미확인</p><p className="text-[11px] text-sub">도움·경사·단차 등급은 주의 정보입니다. 원문의 접근성 세부 안내도 확인하세요.</p></>:<p className="text-[11px] text-muted">비짓제주·한국관광공사 자료 기준 · 이지제주 장소 평가와는 별개입니다.</p>}
 </section>;
}
