import jejusi from '../data/restrooms.json';
import seogwipo from '../data/seogwipoRestrooms.json';
export type Restroom = (typeof jejusi.items)[number] & {accessibleRegistered?:boolean;accessibleLayout?:string;sourceRow?:number};
const catalogue = {retrievedAt: [jejusi.retrievedAt,seogwipo.retrievedAt].sort()[1],items:[...jejusi.items,...seogwipo.items] as Restroom[]};
export const RESTROOM_CATALOGUE = catalogue;
// Future EasyJeju records are separate evidence, matched only by a reviewed stable ID.
export interface RestroomAccessSurvey { restroomId:string; sourceUrl:string; checkedAt:string|null; receivedAt:string; entrance:string; step:string; route:string; }
export const RESTROOM_SURVEYS: RestroomAccessSurvey[] = [];
export function validJejuPoint(lat:unknown,lng:unknown):boolean { return typeof lat==='number'&&typeof lng==='number'&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=33&&lat<=34&&lng>=126&&lng<=127; }
export function distanceKm(lat:number,lng:number,toLat:number,toLng:number) {
 const r=Math.PI/180,a=Math.sin((toLat-lat)*r/2)**2+Math.cos(lat*r)*Math.cos(toLat*r)*Math.sin((toLng-lng)*r/2)**2;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(a)));
}
export function accessibleToilet(p:Restroom):'available'|'unavailable'|'unknown' {
 if(p.accessibleRegistered===true)return 'available';
 if(p.accessibleRegistered===false)return 'unavailable';
 if((p.maleAccessible??0)>0||(p.femaleAccessible??0)>0)return 'available';
 return p.maleAccessible===0&&p.femaleAccessible===0?'unavailable':'unknown';
}
export function nearbyRestrooms(lat:unknown,lng:unknown,radius=3,onlyAccessible=false,items:Restroom[]=catalogue.items) {
 if(!validJejuPoint(lat,lng)||!Number.isFinite(radius)||radius<=0)return [];
 return items.filter(p=>validJejuPoint(p.lat,p.lng)&&(!onlyAccessible||accessibleToilet(p)==='available')).map(p=>({...p,distance:distanceKm(lat as number,lng as number,p.lat!,p.lng!)})).filter(p=>p.distance<=radius).sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
}

// Unlocated records remain searchable by address, never assigned fabricated distances.
export function addressRestrooms(query='',onlyAccessible=false,city='서귀포시',items:Restroom[]=catalogue.items) {
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return items.filter(p=>!validJejuPoint(p.lat,p.lng)&&p.address.includes(city)&&(!onlyAccessible||accessibleToilet(p)==='available')&&terms.every(t=>`${p.name} ${p.address}`.toLowerCase().includes(t)));
}
