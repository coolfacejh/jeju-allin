import type {Content} from '../types';
export type BookingPlace=Pick<Content,'name'|'region'> & Partial<Pick<Content,'contentType'|'provenance'|'accessSources'>>;
export type StayBookingResult={id:string;name:string;region:string;url:string|null;status:'available'|'unavailable';sourceUrl:string;checkedAt:string};
export const bookingIdentity=(s:string)=>s.normalize('NFKC').replace(/\([^)]*\)/g,'').replace(/\s/g,'').toLowerCase();
export function bookingSourceId(place:BookingPlace){const id=place.provenance?.source==='visitjeju'?place.provenance.sourceId:place.accessSources?.find(s=>s.source==='visitjeju')?.sourceId;return id&&/^(CNTS|CONT)_[0-9]{15}$/.test(id)?id:undefined;}
export function matchesBooking(place:BookingPlace,data:Pick<StayBookingResult,'name'|'region'>){return bookingIdentity(place.name)===bookingIdentity(data.name)&&bookingIdentity(place.region)===bookingIdentity(data.region);}
export function isNaverStayUrl(value:unknown):value is string{return typeof value==='string'&&/^https:\/\/booking\.naver\.com\/booking\/3\/bizes\/[1-9][0-9]*$/.test(value);}
const cache=new Map<string,{t:number;data:StayBookingResult}>(),pending=new Map<string,Promise<StayBookingResult>>();
export function fetchStayBooking(id:string):Promise<StayBookingResult>{
 if(!/^(CNTS|CONT)_[0-9]{15}$/.test(id))return Promise.reject(Error('invalid_id'));
 const hit=cache.get(id);if(hit&&Date.now()-hit.t<86400000)return Promise.resolve(hit.data);
 const running=pending.get(id);if(running)return running;
 const job=(async()=>{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),27000);
 try{const r=await fetch('/api/place-booking?id='+encodeURIComponent(id),{signal:controller.signal});if(!r.ok)throw Error('lookup_unavailable');const d=await r.json();
 if(d.id!==id||!['available','unavailable'].includes(d.status)||typeof d.name!=='string'||typeof d.region!=='string'||!Number.isFinite(Date.parse(d.checkedAt))||d.sourceUrl!=='https://www.visitjeju.net/kr/detail/view?contentsid='+id||(d.status==='available'?!isNaverStayUrl(d.url):d.url!==null))throw Error('invalid_response');
 if(cache.size>=1000)cache.delete(cache.keys().next().value!);cache.set(id,{t:Date.now(),data:d});return d as StayBookingResult;
 }finally{clearTimeout(timeout);}})().finally(()=>pending.delete(id));pending.set(id,job);return job;
}
