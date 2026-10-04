import type {Content} from '../types';
export type EnglishPlace={id:string;status:'available'|'unavailable';fields:Partial<Record<'name'|'region'|'desc',string>>;hashtags:string[];source:'visitjeju';sourceUrl:string;checkedAt:string};
const KEY='jeju_official_english_v1',TTL=86400000;
const cache=new Map<string,{t:number;data:EnglishPlace}>(),pending=new Map<string,Promise<EnglishPlace>>();
const listeners=new Set<()=>void>();let loaded=false,active=0;
const queue:Array<()=>void>=[];
export function englishSourceId(place:Content):string|undefined {
 // Shared records remain user-provided; only lookup a recognized official source ID.
 const id=place.provenance?.source==='visitjeju'?place.provenance.sourceId:place.accessSources?.find(s=>s.source==='visitjeju')?.sourceId;
 return id&&/^(CNTS|CONT)_[0-9]{15}$/.test(id)?id:undefined;
}
function valid(data:unknown,id:string):data is EnglishPlace {
 const d=data as EnglishPlace;
 return !!d&&d.id===id&&['available','unavailable'].includes(d.status)&&d.source==='visitjeju'&&d.sourceUrl==='https://www.visitjeju.net/en/detail/view?contentsid='+id&&!!d.fields&&Object.values(d.fields).every(v=>typeof v==='string'&&v.length<=4000)&&Array.isArray(d.hashtags)&&d.hashtags.length<=12&&d.hashtags.every(t=>typeof t==='string'&&t.length<=100)&&Number.isFinite(Date.parse(d.checkedAt));
}
function hydrate(){
 if(loaded)return;loaded=true;
 try{const entries=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(entries))for(const [id,v] of entries.slice(-300)){if(v&&valid(v.data,id)&&Number.isFinite(v.t))cache.set(id,v);}}catch{/* corrupt or unavailable storage */}
}
export function readEnglish(id?:string):EnglishPlace|undefined {
 hydrate();if(!id)return;
 const hit=cache.get(id);return hit&&Date.now()-hit.t<(hit.data.status==='available'?TTL:3600000)?hit.data:undefined;
}
export function subscribeEnglish(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
function pump(){while(active<2&&queue.length){active++;queue.shift()!();}}
export function fetchEnglish(id:string):Promise<EnglishPlace>{
 const existing=readEnglish(id);if(existing)return Promise.resolve(existing);
 const running=pending.get(id);if(running)return running;
 const job=new Promise<EnglishPlace>((resolve,reject)=>{
  queue.push(async()=>{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
   try{
    const r=await fetch('/api/place-english?id='+encodeURIComponent(id),{signal:controller.signal});if(!r.ok)throw Error('english_unavailable');
    const data:unknown=await r.json();if(!valid(data,id))throw Error('english_format');
    if(cache.size>=300)cache.delete(cache.keys().next().value!);cache.set(id,{t:Date.now(),data});
    try{localStorage.setItem(KEY,JSON.stringify([...cache]));}catch{/* memory cache remains available */}
    for(const fn of listeners)fn();resolve(data);
   }catch(e){reject(e);}finally{clearTimeout(timeout);active--;pump();}
  });pump();
 }).finally(()=>pending.delete(id));pending.set(id,job);return job;
}
