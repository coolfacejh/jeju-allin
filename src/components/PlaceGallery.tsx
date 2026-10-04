import Localize from './Localize';
import {useEffect,useState} from 'react';
import type {Content} from '../types';
type Photo={url:string;alt:string};
const cache=new Map<string,Photo[]>();
export default function PlaceGallery({place}:{place:Content}) {
 const source=place.provenance?.source==='visitjeju'?place.provenance.sourceId:place.accessSources?.find(s=>s.source==='visitjeju')?.sourceId;
 const initial=/^https?:\/\//.test(place.image)?[{url:place.image,alt:place.name+' 대표 사진'}]:[];
 const [photos,setPhotos]=useState<Photo[]>(initial),[selected,setSelected]=useState(0),[failed,setFailed]=useState<string[]>([]),[status,setStatus]=useState('');
 useEffect(()=>{
  if(!source)return;
  const controller=new AbortController();
  if(cache.has(source)){setPhotos(cache.get(source)!);return;}
  setStatus('장소 소개 사진 불러오는 중');
  fetch('/api/place-photos?id='+encodeURIComponent(source),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{
   if(!Array.isArray(d.photos))throw Error();
   const images=d.photos.filter((p:Photo)=>typeof p.url==='string'&&p.url.startsWith('https://api.cdn.visitjeju.net/photomng/imgpath/')).slice(0,20);
   if(images.length){cache.set(source,images);setPhotos(images);setSelected(0);setStatus('');}else setStatus('추가 소개 사진이 없습니다.');
  }).catch(()=>{if(!controller.signal.aborted)setStatus('추가 사진을 불러오지 못했습니다. 공식 소개에서 확인해 주세요.');});
  return()=>controller.abort();
 },[source]);
 const available=photos.filter(p=>!failed.includes(p.url)),current=available[selected]||available[0];
 return <Localize><section aria-label="장소 사진" className="place-gallery w-full bg-slate-900 text-white">
  <div className="h-64 md:h-[460px] flex items-center justify-center">
   {current?<a href={current.url} target="_blank" rel="noreferrer" className="w-full h-full flex justify-center" aria-label="현재 사진 원본 보기"><img src={current.url} alt={current.alt} className="max-w-full h-full object-contain" onError={()=>{setFailed(v=>[...v,current.url]);setSelected(0);}} /></a>:<p className="text-base">등록된 사진을 표시할 수 없습니다.</p>}
  </div>
  <div className="px-4 py-3 text-xs space-y-2">
   <div className="flex gap-2 overflow-x-auto" aria-label="사진 선택">{available.map((p,i)=><button type="button" key={p.url} aria-label={`사진 ${i+1} 보기`} aria-pressed={i===selected} onClick={()=>setSelected(i)} className={`shrink-0 rounded-lg overflow-hidden border-2 ${i===selected?'border-white':'border-transparent'}`}><img src={p.url} alt={p.alt} loading="lazy" className="w-20 h-14 object-cover" /></button>)}</div>
   {current&&<p>{Math.min(selected+1,available.length)} / {available.length} · {current.alt}</p>}
   {status&&<p role="status">{status}</p>}
   {source&&<a href={'https://www.visitjeju.net/kr/detail/view?contentsid='+encodeURIComponent(source)} target="_blank" rel="noreferrer" className="underline">사진 출처: 제주관광공사 비짓제주 · 공식 소개 보기</a>}
  </div>
 </section></Localize>;
}
