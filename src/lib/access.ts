import type { AccessKey, AccessSource, AccessState, Content, UserProfile } from '../types';
export const ACCESS_LABELS: Record<AccessKey,string> = {stepFree:'단차 없는 주 출입구',ramp:'경사로·우회 출입구',route:'휠체어 내부 이동로',restroom:'장애인 화장실',parking:'장애인 주차구역',elevator:'승강기'};
export const STATE_LABELS: Record<AccessState,string> = {available:'있음',unavailable:'없음',conditional:'조건부 · 확인 필요',unknown:'정보 없음',conflict:'출처 간 차이 · 확인 필요'};
export function mergeAccessSources(...groups:(AccessSource[]|undefined)[]):AccessSource[] {
  const all=new Map<string,AccessSource>();
  for(const s of groups.flatMap(g=>g??[])) if(s && ['tourapi','visitjeju'].includes(s.source) && typeof s.sourceId==='string') {
    const k=s.source+':'+s.sourceId,old=all.get(k);
    if(!old || s.receivedAt>=old.receivedAt) all.set(k,s);
  }
  return [...all.values()];
}
const patterns:Record<AccessKey,RegExp> = {stepFree:/주?출입구.*단차|단차.*출입구/,ramp:/경사로|우회.*출입구/,route:/휠체어.*(?:이동로|관람로)|(?:이동로|관람로).*휠체어/,restroom:/장애인.*화장실/,parking:/장애인.*주차/,elevator:/승강기|엘리베이터/};
function interpret(key:AccessKey,text:string,tag:boolean):AccessState {
  const compact=text.replace(/\s/g,'');
  if(/일부|보조|도움|동반|가파|급경사|예약|문의|계단|협소|고장|공사|잠금|운영시간|외부|인근|주변/.test(compact)) return 'conditional';
  if(/없|불가|미설치/.test(compact)&&/있음|구비|마련/.test(compact))return 'conditional';
  if(key==='stepFree') {
    if(/단차없|턱없|무단차/.test(compact))return 'available';
    if(/단차있|턱있/.test(compact))return 'unavailable';
    return 'conditional';
  }
  if(/없|불가|불가능|미설치|미제공|이용제한/.test(compact))return 'unavailable';
  if(/있음|가능|설치|구비|마련/.test(compact))return 'available';
  // Exact provider tags assert presence; longer prose needs review.
  const exact:Partial<Record<AccessKey,RegExp>>={restroom:/^장애인(?:전용)?화장실$/,parking:/^장애인(?:전용)?주차(?:구역|장)?$/,elevator:/^(승강기|엘리베이터)$/,ramp:/^경사로$/};
  return tag && exact[key]?.test(compact) ? 'available' : 'conditional';
}
export function accessRows(place:Content) {
  const sources=place.provenance?.source==='shared'?[]:mergeAccessSources(place.accessSources);
  return (Object.keys(ACCESS_LABELS) as AccessKey[]).map(key=>{
    const evidence=sources.flatMap(source=>{
      const values=[...(source.tags??[]).filter(t=>typeof t==='string'&&patterns[key].test(t)).map(text=>({text,tag:true})), ...(source.fields?.[key]?[{text:source.fields[key]!,tag:false}]:[])];
      return values.map(v=>({...v,source,state:interpret(key,v.text,v.tag)}));
    });
    const states=new Set(evidence.map(e=>e.state));
    const state:AccessState=states.has('available')&&states.has('unavailable')?'conflict':states.has('conditional')?'conditional':states.has('unavailable')?'unavailable':states.has('available')?'available':'unknown';
    return {key,label:ACCESS_LABELS[key],state,evidence};
  });
}
export function requiredAccess(access?:UserProfile['access']):AccessKey[] {
  const keys=(access?.required??[]).filter(k=>k in ACCESS_LABELS);
  // Legacy wheelchair/stroller choices are needs, never proof of accessibility.
  if(access?.barrierFree||access?.stroller) keys.push('stepFree','route');
  return [...new Set(keys)];
}
export function accessFit(place:Content,access?:UserProfile['access']):'met'|'check'|'mismatch'|'none' {
  const required=requiredAccess(access);if(!required.length)return 'none';
  const rows=accessRows(place).filter(r=>required.includes(r.key));
  if(rows.some(r=>r.state==='unavailable'))return 'mismatch';
  return rows.every(r=>r.state==='available')?'met':'check';
}
export function accessSourceUrl(source:AccessSource):string {
 return source.source==='visitjeju'?`https://www.visitjeju.net/kr/detail/view?contentsid=${encodeURIComponent(source.sourceId)}`:'https://access.visitkorea.or.kr/';
}

export function linkAccessSources(places:Content[]):Content[] {
 const result=places.map(p=>({...p})), groups=new Map<string,Content[]>();
 for(const p of result){
  const key=p.contentType+':'+p.name.normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'');
  const matches=groups.get(key)??[];
  for(const q of matches) if(p.provenance?.source!==q.provenance?.source && p.lat!=null&&p.lng!=null&&q.lat!=null&&q.lng!=null && Math.hypot(p.lat-q.lat,(p.lng-q.lng)*0.84)<0.0009){
   const sources=mergeAccessSources(p.accessSources,q.accessSources);p.accessSources=sources;q.accessSources=sources;
  }
  groups.set(key,[...matches,p]);
 }
 return result;
}
