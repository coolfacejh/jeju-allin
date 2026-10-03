import {useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {addBasemap,type MapStatus} from '../lib/mapTiles';
import {courseForPlace} from '../lib/olle';
import type {Content} from '../types';
const located=(p:Content)=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&!courseForPlace(p.id);
export default function RouteMap({stops,origin}:{stops:Content[];origin?:Content}){
 const element=useRef<HTMLDivElement>(null),mapRef=useRef<L.Map|null>(null);
 const [status,setStatus]=useState<MapStatus>('loading');
 useEffect(()=>{
  if(!element.current)return;
  const map=L.map(element.current,{zoomAnimation:false,scrollWheelZoom:false}).setView([33.38,126.53],10);mapRef.current=map;
  const dispose=addBasemap(map,setStatus),points:L.LatLngTuple[]=[];
  if(origin&&located(origin)){
   const point:L.LatLngTuple=[origin.lat!,origin.lng!];points.push(point);
   const label=document.createElement('span');label.textContent=`1. 출발 숙소: ${origin.name}`;
   L.marker(point,{title:`1. 출발 숙소: ${origin.name}`,icon:L.divIcon({className:'route-origin-marker',html:'<span style="background:#92400e;color:white;border:2px solid white;border-radius:16px;padding:5px;white-space:nowrap">1 출발</span>',iconSize:[42,30]})}).addTo(map).bindTooltip(label);
   if(stops[0]&&located(stops[0]))L.polyline([point,[stops[0].lat!,stops[0].lng!]],{color:'#92400e',weight:4,dashArray:'8 8',opacity:.85}).addTo(map);
  }
  stops.forEach((p,i)=>{
   if(!located(p))return;
   const point:L.LatLngTuple=[p.lat!,p.lng!];points.push(point);
   const label=document.createElement('span');label.textContent=`${i+1+(origin?1:0)}. ${p.name}`;
   const popup=document.createElement('div'),name=document.createElement('strong'),link=document.createElement('a');name.textContent=`${i+1+(origin?1:0)}. ${p.name}`;link.textContent='장소 상세 보기';link.href=`#/place/${p.id}`;link.style.cssText='display:block;color:#007e80;text-decoration:underline;padding:8px 0';popup.append(name,link);
   L.marker(point,{title:`${i+1+(origin?1:0)}. ${p.name}`,icon:L.divIcon({className:'route-stop-marker',html:`<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${p.contentType==='stay'?'#92400e':'#007e80'};border:2px solid white;color:white;font-weight:bold">${i+1+(origin?1:0)}</span>`,iconSize:[32,32],iconAnchor:[16,16]})}).addTo(map).bindTooltip(label).bindPopup(popup);
   if(i>0&&located(stops[i-1]))L.polyline([[stops[i-1].lat!,stops[i-1].lng!],point],{color:'#007e80',weight:4,dashArray:'8 8',opacity:.85}).addTo(map);
  });
  if(points.length)map.fitBounds(L.latLngBounds(points),{padding:[35,35],maxZoom:15,animate:false});
  const resize=new ResizeObserver(()=>map.invalidateSize({pan:false}));resize.observe(element.current);
  return()=>{resize.disconnect();dispose();map.remove();mapRef.current=null;};
 },[stops,origin]);
 return <section className="bg-white rounded-2xl p-4 space-y-3 shadow-card"><h2 className="font-bold">오늘의 방문 순서 지도</h2><div ref={element} aria-label="일정 방문 순서 지도" className="h-80 md:h-[440px] rounded-xl relative z-0" />
 <p className="text-xs text-sub">1번 출발 숙소부터 오늘 일정 순서대로 표시합니다. 출발 숙소가 없는 날은 첫 방문지가 1번입니다. 점선은 장소 간 직선 연결이며 실제 도로 경로나 무장애 이동 경로가 아닙니다.</p>
 {stops.some(p=>!located(p))&&<p className="text-xs text-amber-800">좌표가 없거나 올레 코스인 항목은 지도·연결선에서 제외합니다. 해당 항목 전후를 이어 그리지 않습니다.</p>}
 {status!=='ready'&&<p role="status" className="text-xs text-sub">{status==='loading'?'지도를 불러오는 중…':'지도 배경을 불러오지 못했습니다. 일정 목록에서 방문 순서를 확인해 주세요.'}</p>}
 </section>;
}
