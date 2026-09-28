import { mergeAccessSources } from './access';
import type { Content } from '../types';
const KEY = 'jeju_visitjeju_cache_v2';
const TTL = 86400000;
let sessionCache: {t:number;items:Content[]} | undefined;
export function loadVisitCache(maxAge=7*TTL): Content[] {
  if (sessionCache && Date.now()-sessionCache.t<maxAge) return sessionCache.items;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if(c && Number.isFinite(c.t) && Date.now()-c.t<maxAge && Array.isArray(c.items)) {sessionCache=c;return c.items;}
    return [];
  } catch { return []; }
}
export type VisitProgress={items:Content[];loaded:number;total:number};
type Listener=(progress:VisitProgress)=>void;
const listeners=new Set<Listener>();
let latest:VisitProgress|undefined;
let pending:Promise<Content[]>|undefined;
export function fetchVisitPlaces(force=false,onProgress?:Listener):Promise<Content[]> {
 const cached=loadVisitCache();
 if(!pending&&!force&&loadVisitCache(TTL).length)return Promise.resolve(loadVisitCache(TTL));
 if(onProgress){listeners.add(onProgress);if(latest&&pending)onProgress(latest);}
 if(!pending){
  latest=undefined;
  pending=(async()=>{
   async function page(n:number){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),22000);
    try {
     const r=await fetch(`/api/visitjeju?page=${n}&schema=2`,{signal:controller.signal});
     if(!r.ok)throw new Error('visitjeju_unavailable');
     const d=await r.json();
     if(!Array.isArray(d.items)||d.page!==n||!Number.isInteger(d.pageCount)||d.pageCount<1||d.pageCount>100)throw new Error('visitjeju_format');
     return d as {items:Content[];page:number;pageCount:number};
    } finally {clearTimeout(timer);}
   }
   const first=await page(1),items=[...first.items];
   function publish(loaded:number){
    latest={items:[...new Map([...cached,...items].map(p=>[p.id,p])).values()],loaded,total:first.pageCount};
    for(const fn of listeners){try{fn(latest);}catch{/* UI listener cannot cancel data loading */}}
   }
   publish(1);
   // Keep provider concurrency at two; render each completed batch instead of waiting for all pages.
   for(let n=2;n<=first.pageCount;n+=2){
    const pages=await Promise.all([page(n),...(n<first.pageCount?[page(n+1)]:[])]);
    for(const d of pages){if(d.pageCount!==first.pageCount)throw new Error('visitjeju_changed');items.push(...d.items);}
    publish(Math.min(n+1,first.pageCount));
   }
   const result=[...new Map(items.map(p=>[p.id,p])).values()];
   if(!result.length)throw new Error('visitjeju_empty');
   sessionCache={t:Date.now(),items:result};
   try{localStorage.setItem(KEY,JSON.stringify(sessionCache));}catch{/* memory cache remains available */}
   return result;
  })().finally(()=>{pending=undefined;latest=undefined;listeners.clear();});
 }
 return pending;
}
// Conservative catalogue-only deduplication. Saved IDs remain independently resolvable.
export function uniqueCatalogue(places:Content[]):Content[] {
  const result:Content[]=[];
  const names = new Map<string,Content[]>();
  for (const p of [...places].sort((a,b)=>Number(a.provenance?.source==='visitjeju')-Number(b.provenance?.source==='visitjeju'))) {
    const key=p.contentType+':'+p.name.normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'');
    const matches=names.get(key)??[];
    const duplicate=matches.find(q=>p.provenance?.source!==q.provenance?.source && (
      p.lat!=null&&p.lng!=null&&q.lat!=null&&q.lng!=null&&Math.hypot(p.lat-q.lat,(p.lng-q.lng)*0.84)<0.0009
    ));
    if (!duplicate) {const copy={...p}; result.push(copy); names.set(key,[...matches,copy]);}
    else { duplicate.accessSources = mergeAccessSources(duplicate.accessSources, p.accessSources); }
  }
  return result;
}
