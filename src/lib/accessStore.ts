import type { AccessSource, Content } from '../types';
import type { AccessDetail } from './live';
const KEY='jeju_access_sources_v1';
export function readTourSources(): Record<string,AccessSource> {
 try {const d=JSON.parse(localStorage.getItem(KEY)??'{}');return d && typeof d==='object'&&!Array.isArray(d)?d:{};}catch{return {};}
}
export function tourAccessSource(id:number,detail:AccessDetail):AccessSource {
 const fields:AccessSource['fields']={stepFree:detail.exit,ramp:/경사로|우회/.test(detail.exit??'')?detail.exit:undefined,route:detail.route,restroom:detail.restroom,parking:detail.parking,elevator:detail.elevator};
 return {source:'tourapi',sourceId:String(id),receivedAt:new Date().toISOString(),fields:detail.has?fields:{}};
}
export function saveTourSource(id:number,detail:AccessDetail) {
 const s=tourAccessSource(id,detail);
 try {const d=readTourSources();d[id]=s;localStorage.setItem(KEY,JSON.stringify(d));}catch{/* detail remains visible in this session */}
 return s;
}
export function attachTourSources(places:Content[]):Content[]{
 const d=readTourSources();
 return places.map(p=>{
  const source=d[p.id] ?? (p.provenance?.source==='tourapi'?{source:'tourapi' as const,sourceId:String(p.id),receivedAt:p.provenance.retrievedAt??'',fields:{}}:null);
  return source&&p.provenance?.source!=='shared'?{...p,accessSources:[...(p.accessSources??[]).filter(s=>!(s.source==='tourapi'&&s.sourceId===String(p.id))),source]}:p;
 });
}
