import {useEffect,useRef,useState} from 'react';
import type {Content} from '../types';
import {useI18n} from '../i18n';
import {englishSourceId,fetchEnglish,readEnglish,subscribeEnglish} from '../lib/placeEnglish';
import Localize from './Localize';
function useEnglish(place:Content){
 const {lang}=useI18n(),id=englishSourceId(place),ref=useRef<HTMLSpanElement>(null);
 const [revision,setRevision]=useState(0),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 const data=readEnglish(id);
 useEffect(()=>subscribeEnglish(()=>setRevision(n=>n+1)),[]);
 useEffect(()=>{
  if(lang!=='en'||!id||readEnglish(id))return;
  let alive=true;const start=()=>{setError(false);fetchEnglish(id).then(()=>{if(alive)setRevision(n=>n+1);}).catch(()=>{if(alive)setError(true);});};
  if(!ref.current){start();return()=>{alive=false;};}
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();start();}},{rootMargin:'120px'});
  observer.observe(ref.current);return()=>{alive=false;observer.disconnect();};
 },[lang,id,attempt]);
 void revision;
 return {lang,id,ref,data,error,retry:()=>setAttempt(n=>n+1)};
}
export default function PlaceText({place,field,original=field!=='desc'}:{place:Content;field:'name'|'region'|'desc';original?:boolean}){
 const {lang,ref,data}=useEnglish(place),ko=place[field]||'',en=data?.fields[field];
 if(lang==='ko')return <>{ko}</>;
 return <span ref={ref} translate="no" className="min-w-0 break-words" data-place-language={en?'en':'ko'}><span lang={en?'en':'ko'}>{en||ko}</span>{en&&original&&en!==ko&&<span lang="ko" className="block text-xs font-normal text-muted mt-1">{ko}</span>}</span>;
}
export function PlaceTags({place,limit=12}:{place:Content;limit?:number}){
 const {lang,ref,data}=useEnglish(place);const tags=lang==='en'&&data?.hashtags.length?data.hashtags:place.hashtags||[];
 return <Localize><span ref={ref} className="flex items-center gap-1.5 flex-wrap">{tags.slice(0,limit).map(h=><span key={h} className="px-2 py-0.5 rounded-md bg-surface-sub text-muted text-[11px]">{h}</span>)}</span></Localize>;
}
export function PlaceLanguageStatus({place}:{place:Content}){
 const {lang,ref,id,data,error,retry}=useEnglish(place);if(lang==='ko')return null;
 return <div className="text-xs text-sub rounded-xl bg-surface-sub p-3 space-y-2" translate="no"><span ref={ref}>
 {!id?'No linked official English record. The original Korean is shown.':error?'The English source could not be loaded. The original Korean is shown.':!data?'Checking the official English listing…':data.status==='unavailable'?'No official English text was found for this place. The original Korean is shown.':'English text: official Visit Jeju listing. Fields without English retain their Korean original.'}
 </span>{error&&<button type="button" className="underline text-primary ml-2" onClick={retry}>Retry English lookup</button>}
 {data?.status==='available'&&<p><a href={data.sourceUrl} target="_blank" rel="noreferrer" className="underline text-primary">View official English source ↗</a><span> · Retrieved {new Date(data.checkedAt).toLocaleDateString('en-GB')}</span></p>}
 {data?.fields.desc&&place.desc&&<details><summary className="cursor-pointer">Original Korean description</summary><p lang="ko" className="mt-2">{place.desc}</p></details>}
 <p>Accessibility evidence is checked separately from the English introduction. A description does not establish that a facility is available.</p>
 </div>;
}
