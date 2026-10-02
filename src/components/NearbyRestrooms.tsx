import { useState } from 'react';
import type { Content } from '../types';
import { RESTROOM_CATALOGUE, RESTROOM_SURVEYS, accessibleToilet, nearbyRestrooms, validJejuPoint } from '../lib/restrooms';
import { AccessCategoryIcon } from './AccessPictograms';
import { kakaoMapUrl, kakaoRouteUrl } from '../lib/maps';
export default function NearbyRestrooms({place}:{place:Content}) {
 const [radius,setRadius]=useState(3),[only,setOnly]=useState(false),[limit,setLimit]=useState(5);
 const valid=validJejuPoint(place.lat,place.lng),rows=nearbyRestrooms(place.lat,place.lng,radius,only);
 return <section aria-label="주변 공중화장실" className="bg-white rounded-2xl shadow-card p-5 space-y-4">
  <h2 className="text-lg font-bold">주변 공중화장실</h2>
  <p className="text-sm text-sub">선택한 장소 주변의 별도 시설입니다. 숙소·관광지 내부 시설이나 이용 가능 경로를 보장하지 않습니다.</p>
  <p className="text-xs text-muted">제주시·서귀포시 공개 자료 중 위치가 확인된 시설만 거리순으로 표시합니다. 좌표가 없는 자료는 제외합니다. · 자료 수신 {RESTROOM_CATALOGUE.retrievedAt}</p>
  {!valid?<p role="status" className="text-sm text-sub">이 장소의 좌표가 없어 가까운 순서를 계산할 수 없습니다.</p>:<>
   <div className="flex flex-wrap items-center gap-4"><label className="text-sm">검색 반경 <select aria-label="화장실 검색 반경" className="border border-line rounded-lg p-2" value={radius} onChange={e=>{setRadius(Number(e.target.value));setLimit(5);}}>{[3,5,10].map(n=><option key={n} value={n}>{n}km</option>)}</select></label><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={only} onChange={e=>{setOnly(e.target.checked);setLimit(5);}} />장애인용 변기 등록 시설만</label></div>
   <p role="status" className="text-xs text-sub">반경 {radius}km 내 등록 자료 {rows.length}곳 · 직선거리순 (실제 이동 거리·시간 아님)</p>
   {!rows.length&&<p className="text-sm text-sub">이 조건으로 표시할 등록 자료가 없습니다. 실제 화장실이 없다는 뜻은 아닙니다. 반경을 넓히거나 지도에서 확인해 주세요.</p>}
   <div className="grid md:grid-cols-2 gap-3">{rows.slice(0,limit).map(p=>{const state=accessibleToilet(p),survey=RESTROOM_SURVEYS.find(s=>s.restroomId===p.id);return <article key={p.id} data-restroom={p.id} className="border border-line rounded-xl p-4 space-y-2 min-w-0">
    <div className="flex items-center gap-3"><AccessCategoryIcon kind="restroom" state={state} /><div className="min-w-0"><h3 className="font-bold text-sm">{p.name}</h3><p className="text-xs text-primary">직선 약 {p.distance<1?`${Math.round(p.distance*1000)}m`:`${p.distance.toFixed(1)}km`}</p></div></div>
    <p className="text-xs text-sub break-words">{p.address}</p>
    <p className="text-sm">장애인용 대변기: {state==='available'?`남 ${p.maleAccessible??'미확인'}개 · 여 ${p.femaleAccessible??'미확인'}개`:state==='unavailable'?'등록 수량 0개':'정보 없음'}</p>
    <p className="text-xs text-sub">기저귀 교환대: {p.diaper===true?'있음':p.diaper===false?'없음':'정보 없음'} · 개방시간: {p.hours||'정보 없음'}</p>
    <p className="text-xs text-muted">실시간 개방 여부·출입구 단차·휠체어 진입 가능 여부는 별도 확인이 필요합니다.</p>
    {survey&&<p className="text-xs text-sub">접근성 조사: {survey.entrance} · {survey.step} · {survey.route} · 조사일 {survey.checkedAt||'미확인'} <a href={survey.sourceUrl} target="_blank" rel="noreferrer" className="underline">조사 원문</a></p>}
    <div className="flex flex-wrap gap-3 text-sm text-primary"><a href={kakaoMapUrl(p.name,p.lat!,p.lng!)} target="_blank" rel="noreferrer" className="underline">지도 보기</a><a href={kakaoRouteUrl(p.name,p.lat!,p.lng!)} target="_blank" rel="noreferrer" className="underline">길찾기</a>{/^[+\d()\s-]{5,30}$/.test(p.phone)&&<a href={`tel:${p.phone.replace(/[^+\d]/g,'')}`} className="underline">전화 확인</a>}</div>
    <p className="text-xs text-muted">{p.operator} · 기준일 {p.referenceDate||'미확인'} · <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="underline">{p.source} 원문</a></p>
   </article>})}</div>
   {rows.length>limit&&<button type="button" className="text-primary border border-line rounded-xl px-4 py-2" onClick={()=>setLimit(n=>n+5)}>화장실 더 보기</button>}
  </>}
  <a href={kakaoMapUrl(`${place.name} 주변 공중화장실`)} target="_blank" rel="noreferrer" className="inline-block text-sm text-primary underline">지도에서 주변 화장실 검색 ↗</a>
  <p className="text-xs text-muted">화장실 픽토그램: 이지제주. 시설 정보는 제주시·서귀포시 공개 자료이며 이지제주 현장 조사와는 별개입니다.</p>
 </section>;
}
