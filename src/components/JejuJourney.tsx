import AllinMascot from './AllinMascot';
import Localize from './Localize';
export default function JejuJourney({intro=false}:{intro?:boolean}){return <Localize><section className={`journey-hero journey-with-mascot ${intro?'journey-intro':''}`} aria-label="제주 여행 소개">
 <div className="journey-copy"><p className="journey-eyebrow"><span />{intro?'JEJU TASTE JOURNEY':'YOUR OWN JEJU'}</p>
 <h1>{intro?<>나에게 맞는 제주,<br />함께 떠나볼까요?</>:<>제주를 만나는<br /><em>나만의 방식.</em></>}</h1>
 <p className="journey-description">{intro?<>여행 날짜와 필요한 편의시설을 골라 주세요.<br />나와 동행자에게 맞는 제주를 찾아드릴게요.</>:<>머무를 곳, 즐길 거리, 로컬 미식까지.<br />내게 맞는 장소를 담아 하나의 여행으로.</>}</p>
 <span className="journey-caption">{intro?'날짜 선택 → 장소 탐색 → 나만의 일정':'무광고 큐레이션 · 정보 출처 확인'}</span></div>
 <div className="allin-hero-art"><AllinMascot /></div><span className="journey-coordinate" aria-hidden="true">33.38° N / 126.53° E</span>
 </section></Localize>}
