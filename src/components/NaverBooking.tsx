import type { Content } from '../types';
import { useI18n } from '../i18n';
import { naverBookingLink } from '../lib/naverBooking';
export default function NaverBooking({place,compact=false}:{place:Pick<Content,'name'|'region'>;compact?:boolean}){
 const {lang}=useI18n();const en=lang==='en';const link=naverBookingLink(place);
 const label=link.kind==='booking'?(en?'Book on Naver':'네이버에서 예약하기'):(en?'Search on Naver':'네이버에서 검색하기');
 return <section className={'naver-booking '+(compact?'compact':'')} aria-label={en?'Naver booking connection':'네이버 예약 연결'}>
 {!compact&&<h2>{en?'Check reservations before visiting':'방문 전 예약 확인'}</h2>}
 <a href={link.url} target="_blank" rel="noopener noreferrer" data-naver-kind={link.kind} aria-label={label+(en?' (opens in a new tab)':' (새 창)')}><span aria-hidden="true" className="naver-booking-mark">N</span>{label}<span aria-hidden="true">↗</span></a>
 <p>{link.kind==='booking'?(en?'Check availability, prices and complete your booking on Naver.':'예약 가능 날짜·가격 확인과 예약은 네이버에서 진행합니다.'):(en?'A direct booking link has not been verified. Check the business name, address and booking options in Naver search.':'직접 예약 링크가 확인되지 않은 장소입니다. 검색 결과에서 업체명·주소와 예약 제공 여부를 확인해 주세요.')}</p>
 {compact&&<p>{en?'After booking, enter the confirmed time in visit settings and keep the details in your note. Booking status is not synced automatically.':'예약 후 확정 시간을 방문 시간 설정에 입력하고 메모에 남겨 주세요. 예약 상태는 자동으로 연동되지 않습니다.'}</p>}
 </section>;
}
