import type { Content } from '../types';
import stayLinkData from './naverStayLinks.json';
const stayLinks=stayLinkData as Array<{name:string;region:string;url:string;checkedAt:string;sourceId:string;sourceUrl:string}>;
import { matchesBooking, isNaverStayUrl } from './stayBookingLookup';

// Only operator-confirmed, address-matched links belong here. Never infer booking IDs.
// Verified 2026-10-06 against both the operator and the destination business page.
export const NAVER_BOOKING_LINKS = [{
 names:['9.81파크','9.81파크 제주','9.81 파크 제주','9.81 PARK JEJU'],
 address:'천덕로880-24', url:'https://booking.naver.com/booking/12/bizes/255349',
 source:'https://www.981park.com/board/117', checkedAt:'2026-10-06'
}];
export const STAY_BOOKING_LINKS = [{
 names:['제주 호텔 더원','호텔더원','호텔 더원','호텔 더 원','Hotel The One'],
 city:'제주시',address:'사장3길33',url:'https://be4.wingsbooking.com/HTO1?lang_type=KO',
 source:'http://www.hoteltheone.com/',checkedAt:'2026-10-06'
}];
const normalized=(s:string)=>s.normalize('NFKC').replace(/\s/g,'').toLowerCase();
export function naverBookingLink(place:Pick<Content,'name'|'region'> & Partial<Pick<Content,'contentType'>>, now=new Date()):{kind:'booking'|'search'|'official'|'unavailable';url:string;checkedAt?:string} {
 if(place.contentType==='stay'){
  const naver=stayLinks.find(entry=>matchesBooking(place,entry)&&isNaverStayUrl(entry.url));
  if(naver){const age=now.getTime()-Date.parse(naver.checkedAt);if(age>=0&&age<30*86400000)return {kind:'booking',url:naver.url,checkedAt:naver.checkedAt};}

  const hotel=STAY_BOOKING_LINKS.find(entry=>entry.names.some(name=>normalized(name)===normalized(place.name))&&normalized(place.region).includes(entry.city)&&normalized(place.region).includes(entry.address)&&!/^[-0-9]/.test(normalized(place.region).split(entry.address)[1]??''));
  if(hotel){const age=now.getTime()-Date.parse(hotel.checkedAt+'T00:00:00+09:00');if(age>=0&&age<180*86400000)return {kind:'official',url:hotel.url,checkedAt:hotel.checkedAt};}
  return {kind:'unavailable',url:''};
 }
 const found=NAVER_BOOKING_LINKS.find(entry=>entry.names.some(name=>normalized(name)===normalized(place.name))&&normalized(place.region).includes('제주시')&&/천덕로880-24(?![0-9-])/.test(normalized(place.region)));
 if(found){const age=now.getTime()-Date.parse(found.checkedAt+'T00:00:00+09:00');
  // Revert to search when the mapping needs review, instead of claiming an old link is current.
  if(age>=0&&age<180*86400000)return {kind:'booking',url:found.url,checkedAt:found.checkedAt};
 }
 const query=[place.name,place.region||'제주','예약'].join(' ');
 return {kind:'search',url:'https://search.naver.com/search.naver?query='+encodeURIComponent(query)};
}
