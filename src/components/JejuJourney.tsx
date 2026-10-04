import Localize from './Localize';
export default function JejuJourney({intro=false}:{intro?:boolean}){return <Localize><section className={`journey-hero ${intro?'journey-intro':''}`} aria-label="제주 여행 소개">
 <div className="journey-copy"><p className="journey-eyebrow"><span />{intro?'JEJU TASTE JOURNEY':'YOUR OWN JEJU'}</p>
 <h1>{intro?<>나에게 맞는 제주,<br />함께 떠나볼까요?</>:<>제주를 만나는<br /><em>나만의 방식.</em></>}</h1>
 <p className="journey-description">{intro?<>여행 날짜와 필요한 편의시설을 골라 주세요.<br />나와 동행자에게 맞는 제주를 찾아드릴게요.</>:<>머무를 곳, 즐길 거리, 로컬 미식까지.<br />내게 맞는 장소를 담아 하나의 여행으로.</>}</p>
 <span className="journey-caption">{intro?'날짜 선택 → 장소 탐색 → 나만의 일정':'무광고 큐레이션 · 정보 출처 확인'}</span></div>
 <svg className="journey-art" viewBox="0 0 520 330" role="img" aria-label="감귤빛 해와 한라산, 에메랄드 바다를 그린 제주 일러스트">
 <circle cx="379" cy="99" r="62" fill="#FFEDD5"/><circle cx="379" cy="99" r="38" fill="#F97316"/>
 <path d="M56 108c9-19 31-19 40-4 17-9 34 1 36 13H56Z" fill="white"/><path d="M253 37c6-13 24-12 30-2 12-6 25 1 26 10h-56Z" fill="white"/>
 <path d="M49 222 215 64 358 222Z" fill="#79B7A9"/><path d="m173 104 42-40 35 39-25-7-11 13-18-12Z" fill="#E6F4F2"/>
 <path d="m165 223 144-112 173 112Z" fill="#0A6E6D"/><path d="M0 228c84-42 121 20 205-5s181-51 315-1v108H0Z" fill="#AADBD3"/>
 <path d="M0 266c104-54 155 31 264-2s158-12 256 6v60H0Z" fill="#0A6E6D"/>
 <path d="M20 290c94-37 141 28 249-1s141-7 228 7" fill="none" stroke="#E6F4F2" strokeWidth="3"/>
 <path d="m328 204 25-18 25 18v24h-50Z" fill="#FFF8EC"/><path d="m323 204 30-23 30 23" fill="none" stroke="#064E4D" strokeWidth="6" strokeLinejoin="round"/><path d="M350 214v14" stroke="#F97316" strokeWidth="9"/>
 <path d="M403 199v26m-16-17 16-25 16 25Z" fill="#064E4D" stroke="#064E4D" strokeWidth="4"/>
 <path d="M80 209c27-33 90 8 125-13" stroke="white" strokeWidth="3" strokeDasharray="5 8" fill="none"/><circle cx="78" cy="211" r="6" fill="#F97316"/>
 </svg><span className="journey-coordinate" aria-hidden="true">33.38° N / 126.53° E</span>
 </section></Localize>}
