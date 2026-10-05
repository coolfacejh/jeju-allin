import { useEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../types';
import { loadPlaces } from '../lib/places';
import { loadProfile, loadSavedIds } from '../lib/storage';
import { requiredAccess, ACCESS_LABELS } from '../lib/access';
import { insertRoutePlace, insertionEligible, nearbyKm } from '../lib/routeInsert';
import { previousLodging, scheduleDay } from '../lib/planner';
import { dateForDay, type ScheduleSettings } from '../lib/schedule';
import { subcatOf } from '../lib/subcat';
import { useI18n } from '../i18n';
import PlaceText from './PlaceText';
import Localize from './Localize';

export default function RouteInsertDialog({buckets,day,index,settings,onClose,onAdd}:{buckets:Content[][];day:number;index:number;settings:ScheduleSettings;onClose:()=>void;onAdd:(p:Content,day:number,index:number,duration:number)=>boolean}) {
 const {lang}=useI18n();const tr=(ko:string,en:string)=>lang==='en'?en:ko;
 const dialog=useRef<HTMLDialogElement>(null);
 const [pool]=useState(()=>loadPlaces(buckets.flat()));const [saved]=useState(()=>new Set(loadSavedIds()));const [profile]=useState(loadProfile);
 const [error,setError]=useState(false);const [query,setQuery]=useState('');const [kind,setKind]=useState('all');const [radius,setRadius]=useState(10);const [selected,setSelected]=useState<Content|null>(null);const [duration,setDuration]=useState(60);const [limit,setLimit]=useState(24);
 useEffect(()=>{const el=dialog.current!;const active=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';el.showModal();return()=>{el.close();document.body.style.overflow=overflow;active?.focus();};},[]);
 const origin=previousLodging(buckets,day),before=buckets[day][index-1]??origin,after=buckets[day][index];
 const used=new Set(buckets.flat().map(p=>p.id));
 const distance=(p:Content)=>{const ds=[nearbyKm(before,p),nearbyKm(after,p)].filter((v):v is number=>v!==null);return ds.length?Math.min(...ds):null;};
 const list=useMemo(()=>pool.filter(p=>insertionEligible(p,settings,day,profile?.access))
 .filter(p=>!query.trim()||(p.name+' '+p.region).toLowerCase().includes(query.trim().toLowerCase()))
 .filter(p=>kind==='all'||kind==='saved'&&saved.has(p.id)||kind==='cafe'&&subcatOf(p)==='카페·찻집'||kind==='food'&&p.contentType==='food'&&subcatOf(p)!=='카페·찻집'||kind==='activity'&&p.contentType==='activity'||kind==='stay'&&p.contentType==='stay')
 .filter(p=>!radius||!(before||after)||distance(p)!==null&&distance(p)!<=radius)
 .sort((a,b)=>(distance(a)??Infinity)-(distance(b)??Infinity)||a.name.localeCompare(b.name)),[pool,query,kind,radius,settings,day,profile,before,after]);
 const preview=selected&&!used.has(selected.id)&&buckets.flat().length<100?insertRoutePlace(buckets,day,index,selected):null;
 const nextSettings=selected?{...settings,visits:{...settings.visits,[selected.id]:{...settings.visits[selected.id],durationMin:duration}}}:settings;
 const original=scheduleDay(buckets[day],settings,day,buckets.length-1,origin);
 const proposed=preview?scheduleDay(preview[day],nextSettings,day,buckets.length-1,origin):null;
 function pick(p:Content){setError(false);setSelected(p);setDuration(settings.visits[p.id]?.durationMin??(p.contentType==='stay'?30:p.avgStayMinutes??(p.contentType==='food'?60:90)));}
 return <dialog ref={dialog} className="route-insert-dialog" onCancel={onClose} aria-labelledby="route-insert-title">
 <div className="route-insert-heading"><h2 id="route-insert-title">{tr('일정에 장소 추가','Add a stop')}</h2><button type="button" onClick={onClose} aria-label={tr('닫기','Close')}>×</button></div>
 <p>{day+1}{tr('일차',' · Day')} {dateForDay(settings.startDate,day)} · {before?<PlaceText place={before} field="name"/>:tr('일정 시작','Start')} → {after?<PlaceText place={after} field="name"/>:tr('일정 끝','End')}</p>
 <p className="route-insert-hint">{tr('앞뒤 장소에서 가까운 순서입니다. 거리와 시간은 직선거리 기반 추정이며 영업시간은 별도 확인해 주세요. 숙소는 마지막에 배치합니다.','Sorted by proximity to adjacent stops. Distance and time are straight-line estimates. Check opening hours separately. Lodging goes last.')}</p>
 {requiredAccess(profile?.access).length>0&&<p className="route-insert-hint"><Localize>선택 시설: {requiredAccess(profile?.access).map(k=>ACCESS_LABELS[k]).join(' · ')} · 선택한 시설이 모두 있음으로 확인된 장소만 표시합니다.</Localize></p>}
 <div className="route-insert-controls"><label>{tr('장소 검색','Search')}<input autoFocus value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}} placeholder={tr('장소 이름 또는 지역','Place or area')}/></label>
 <label>{tr('분류','Category')}<select value={kind} onChange={e=>{setKind(e.target.value);setLimit(24);}}>{[['all','전체','All'],['saved','내 보관함','Saved'],['cafe','카페','Cafes'],['food','음식점','Restaurants'],['activity','관광지','Attractions'],['stay','숙소','Lodging']].map(([v,ko,en])=><option key={v} value={v}>{tr(ko,en)}</option>)}</select></label>
 <label>{tr('앞뒤 장소 반경','Nearby radius')}<select value={radius} onChange={e=>{setRadius(Number(e.target.value));setLimit(24);}}>{[3,5,10,0].map(n=><option key={n} value={n}>{n?n+' km':tr('거리 제한 없음','Any distance')}</option>)}</select></label></div>
 <div className="route-insert-results" aria-label={tr('추가할 장소 목록','Available stops')}>
 {!list.length&&<p>{tr('조건에 맞는 장소가 없습니다. 검색어나 반경을 바꿔 보세요. 현재 불러온 관광정보에서 검색하며 접근성 조건은 유지합니다.','No matching places in loaded data. Try another search or radius. Accessibility requirements stay active.')}</p>}
 {list.slice(0,limit).map(p=><button type="button" className={'route-insert-result '+(selected?.id===p.id?'selected':'')} key={p.id} disabled={used.has(p.id)} onClick={()=>pick(p)}>
 <strong><PlaceText place={p} field="name"/></strong><span><PlaceText place={p} field="region"/></span><small>{used.has(p.id)?tr('이미 일정에 있음','Already scheduled'):distance(p)===null?tr('거리 확인 필요','Distance unknown'):tr('가까운 앞뒤 장소에서 직선 약 ','About ')+distance(p)!.toFixed(1)+' km'}{saved.has(p.id)?tr(' · 보관함',' · Saved'):''}</small></button>)}
 {list.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+24)}>{tr('더 보기','Show more')}</button>}</div>
 {selected&&proposed&&<div className="route-insert-preview" aria-live="polite"><strong><PlaceText place={selected} field="name"/></strong>
 <label>{tr('체류시간(분)','Stay (minutes)')}<input type="number" min={0} max={1440} value={duration} onChange={e=>setDuration(Math.max(0,Math.min(1440,Number(e.target.value)||0)))}/></label>
 <p>{proposed.complete&&original.complete?tr('예상 이동시간 변화: ','Estimated travel change: ')+(proposed.totalTravelMin-original.totalTravelMin)+' '+tr('분','min'):tr('이동시간 확인 필요: 시간 변화를 계산할 수 없습니다.','Travel time is uncertain; time changes cannot be calculated.')}</p>
 <p>{tr('마지막 장소 종료: ','Last stop ends: ')}{original.stops[original.stops.length-1]?.depart??settings.dayStart} → {proposed.stops[proposed.stops.length-1]?.depart}</p>
 {proposed.warnings.length>0&&<Localize><ul className="route-insert-warnings">{proposed.warnings.map(w=><li key={w}>{w}</li>)}</ul></Localize>}
 <p className="route-insert-hint">{tr('기존 방문 순서는 유지됩니다. 시간이 맞지 않으면 취소하고 다른 날짜에서 추가할 수 있어요.','Existing stop order is preserved. Cancel and choose another day if the timing does not work.')}</p>
 <button type="button" className="route-insert-confirm" onClick={()=>{if(onAdd(selected,day,index,duration))onClose();else setError(true);}}>{tr('이 위치에 추가','Add here')}</button></div>}
 {error&&<p role="alert">{tr('추가하지 못했어요. 보관함 최대 100곳 또는 브라우저 저장 공간을 확인해 주세요.','Could not add the place. Check the 100-place limit and browser storage.')}</p>}
 {buckets.flat().length>=100&&<p role="alert">{tr('일정은 최대 100곳까지 담을 수 있어요.','An itinerary can contain up to 100 places.')}</p>}
 <button type="button" className="route-insert-cancel" onClick={onClose}>{tr('취소','Cancel')}</button>
 </dialog>;
}


