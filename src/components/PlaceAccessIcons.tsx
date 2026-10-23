import type {Content} from '../types';
import {ACCESS_PICTOGRAMS,confirmedPictograms} from '../lib/accessPictograms';
import {easyJejuMatch} from '../lib/easyJeju';
export default function PlaceAccessIcons({place}:{place:Content}){
 const record=easyJejuMatch(place);
 const icons=record?ACCESS_PICTOGRAMS.filter(p=>record.pictograms.includes(p.id)):confirmedPictograms(place).map(x=>x.pictogram);
 if(!icons.length)return <p className="text-xs text-muted">장소별 접근성 픽토그램 정보 미확인</p>;
 const groups=[{title:'이동 조건',items:icons.filter(p=>p.id<=10)},{title:'편의시설·서비스',items:icons.filter(p=>p.id>10)}];
 return <section className="space-y-3 my-3" aria-label="장소별 접근성 픽토그램">
  <p className="text-xs font-bold text-primary">{record?'이지제주 접근성 안내':'관광정보에서 확인된 시설'}</p>
  {groups.filter(g=>g.items.length).map(g=><div key={g.title} className="space-y-2" role="group" aria-label={g.title}>
   <h4 className="text-xs font-bold text-sub">{g.title}</h4>
   <ul className="flex flex-wrap gap-2" style={{listStyle:'none',padding:0}}>{g.items.map(p=><li key={p.id} title={p.description} className="flex flex-col items-center gap-1" style={{width:58}}><img src={p.image} alt="" width={40} height={40} loading="lazy"/><span className="text-center text-[11px] leading-tight">{p.label}</span></li>)}</ul>
   {g.title==='이동 조건' && g.items.some(p=>p.id>=2&&p.id<=10) && <div className="rounded-lg bg-surface p-2 text-[11px] text-sub space-y-1" aria-label="이동 조건 색상 설명">
    <p>도움 필요·경사로·단차 등급</p>
    <div className="flex flex-wrap gap-x-3 gap-y-1">{[{color:'#00a5df',text:'파랑 · 하'},{color:'#00a651',text:'초록 · 중'},{color:'#ed1c24',text:'빨강 · 상'}].map(x=><span key={x.text} className="inline-flex items-center gap-1"><span aria-hidden="true" style={{backgroundColor:x.color,width:10,height:10,borderRadius:3,display:'inline-block'}}/>{x.text}</span>)}</div>
    <p>‘하’도 혼자 이용할 수 있다는 뜻은 아닙니다.</p>
   </div>}
   {g.title==='편의시설·서비스' && <p className="text-[11px] text-sub">회색은 시설·서비스 종류 표시이며, 이용 불가나 정보 없음이라는 뜻이 아닙니다.</p>}
  </div>)}
  {record?<><a className="text-xs underline text-primary inline-block py-1" href={record.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>이지제주 해당 장소 원문 ↗</a><p className="text-[11px] text-muted">자료 수신 {record.retrievedAt.slice(0,10)} · 현장 확인일 미확인</p><p className="text-[11px] text-sub">도움·경사·단차 등급은 주의 정보입니다. 원문의 접근성 세부 안내도 확인하세요.</p></>:<p className="text-[11px] text-muted">비짓제주·한국관광공사 자료 기준 · 이지제주 장소 평가와는 별개입니다.</p>}
 </section>;
}
