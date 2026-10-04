import {useI18n} from '../i18n';
// Reviewed phrase-level translations only. Do not infer accessibility from general descriptions.
const reviewed:Record<string,string>={
 '장애인 화장실':'Accessible restroom', '장애인 화장실 있음':'Accessible restroom listed as available', '장애인 화장실 없음':'No accessible restroom listed',
 '장애인 전용 화장실':'Designated accessible restroom', '장애인 주차장':'Accessible parking', '장애인 주차구역':'Accessible parking space',
 '장애인 전용 주차장':'Designated accessible parking', '장애인 전용 주차구역':'Designated accessible parking space', '장애인 주차구역 있음':'Accessible parking space listed as available',
 '주출입구 단차 없음':'No step at the main entrance', '주 출입구 단차 없음':'No step at the main entrance', '단차 없음':'No step listed',
 '경사로':'Ramp', '경사로 있음':'Ramp listed as available', '경사로 없음':'No ramp listed', '엘리베이터':'Elevator', '승강기':'Elevator',
 '엘리베이터 있음':'Elevator listed as available', '엘리베이터 없음':'No elevator listed', '승강기 있음':'Elevator listed as available', '승강기 없음':'No elevator listed',
 '휠체어 이동로':'Wheelchair circulation route', '휠체어 이동 가능':'Wheelchair movement listed as possible', '도움 필요':'Assistance required',
 '동행자 도움 필요':'Companion assistance required', '예약 필요':'Reservation required', '확인 필요':'Confirmation required', '미확인':'Not verified',
};
export default function AccessEvidenceText({text}:{text:string}){
 const {lang}=useI18n();if(lang==='ko')return <p translate="no">“{text}”</p>;
 const en=reviewed[text.trim()];
 return <div translate="no">{en?<p lang="en">{en}</p>:<p className="text-muted">Original Korean evidence · English translation unavailable</p>}<p lang="ko" className="mt-1">“{text}”</p></div>;
}
