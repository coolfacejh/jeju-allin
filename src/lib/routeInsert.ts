import type { Content, UserProfile } from '../types';
import { eventVisible } from './events';
import { dateForDay, type ScheduleSettings } from './schedule';
import { matchesAccessRequirements } from './access';

// Insert without reordering existing stops or any other day. Lodging stays last.
export function insertRoutePlace(buckets:Content[][], day:number, index:number, place:Content):Content[][] {
 if(!buckets[day] || !Number.isInteger(index) || index<0 || index>buckets[day].length) throw Error('Invalid insertion point');
 if(buckets.flat().some(p=>p.id===place.id)) throw Error('Already scheduled');
 if(buckets.flat().length>=100) throw Error('Trip limit');
 const next=buckets.map(b=>b.slice());
 const stay=next[day].findIndex(p=>p.contentType==='stay');
 const at=place.contentType==='stay'?next[day].length:Math.min(index,stay<0?next[day].length:stay);
 next[day].splice(at,0,place); return next;
}
export function insertionEligible(place:Content, settings:ScheduleSettings, day:number, access?:UserProfile['access']):boolean {
 return eventVisible(place,{startDate:dateForDay(settings.startDate,day),nights:0})
   && matchesAccessRequirements(place,access,true)
   && (!access?.avoidNoKids || place.accessibility?.noKidsZone===false);
}
export function nearbyKm(a?:Content,b?:Content):number|null {
 if(!a||!b||a.lat==null||a.lng==null||b.lat==null||b.lng==null)return null;
 const rad=Math.PI/180, dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2)));
}
