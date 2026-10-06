import {useEffect,useState} from 'react';
import {bookingSourceId,fetchStayBooking,matchesBooking,type BookingPlace,type StayBookingResult} from '../lib/stayBookingLookup';
import { useI18n } from '../i18n';
import { naverBookingLink } from '../lib/naverBooking';
export default function NaverBooking({place,compact=false}:{place:BookingPlace;compact?:boolean}){
 const {lang}=useI18n();const en=lang==='en';const initial=naverBookingLink(place);const sourceId=place.contentType==='stay'?bookingSourceId(place):undefined;
 const [result,setResult]=useState<StayBookingResult>();const [loading,setLoading]=useState(false);
 useEffect(()=>{let alive=true;setResult(undefined);setLoading(false);
  if(sourceId&&initial.kind!=='booking'){setLoading(true);fetchStayBooking(sourceId).then(data=>{if(alive)setResult(data);}).catch(()=>{}).finally(()=>{if(alive)setLoading(false);});}
  return()=>{alive=false;};
 },[sourceId,place.name,place.region,initial.kind]);
 const link=result&&result.id===sourceId&&result.status==='available'&&matchesBooking(place,result)?{kind:'booking' as const,url:result.url!}:initial;
 if(link.kind==='unavailable')return <section className="naver-booking booking-unavailable"><p role="status">{loading?(en?'Checking the property’s Naver booking link…':'숙소의 네이버 예약 연결을 확인하고 있어요…'):(en?'A Naver booking link has not been verified for this property yet.':'이 숙소의 네이버 예약 주소는 아직 확인되지 않았습니다.')}</p></section>;
 const official=link.kind==='official';
 const label=official?(en?'Book rooms on the official site':'공식 객실 예약하기'):link.kind==='booking'?(en?'Book on Naver':'네이버에서 예약하기'):(en?'Search on Naver':'네이버에서 검색하기');
 return <section className={'naver-booking '+(compact?'compact':'')} aria-label={en?'Booking connection':'예약 연결'}>
 {!compact&&<h2>{official?(en?'Room reservations':'객실 예약'):(en?'Check reservations before visiting':'방문 전 예약 확인')}</h2>}
 <a href={link.url} target="_blank" rel="noopener noreferrer" data-naver-kind={link.kind} aria-label={label+(en?' (opens in a new tab)':' (새 창)')}><span aria-hidden="true" className="naver-booking-mark">{official?'▣':'N'}</span>{label}<span aria-hidden="true">↗</span></a>
 <p>{official?(en?'Opens the hotel’s official booking system. Select your check-in/out dates, guests and room there.':'호텔 공식 예약 시스템으로 바로 연결됩니다. 이동한 화면에서 체크인·체크아웃 날짜, 인원과 객실을 선택해 주세요.'):link.kind==='booking'?(en?'Check availability, prices and complete your booking on Naver.':'예약 가능 날짜·가격 확인과 예약은 네이버에서 진행합니다.'):(en?'A direct booking link has not been verified. Check the business name, address and booking options in Naver search.':'직접 예약 링크가 확인되지 않은 장소입니다. 검색 결과에서 업체명·주소와 예약 제공 여부를 확인해 주세요.')}</p>
 {compact&&<p>{en?'Booking status is not synced automatically. Save confirmed details in your itinerary note.':'예약 상태는 자동으로 연동되지 않습니다. 예약 후 확정 내용을 일정 메모에 남겨 주세요.'}</p>}
 </section>;
}
