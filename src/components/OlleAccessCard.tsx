import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OLLE_CHECKED_AT, type OlleCourse } from '../data/olle';
import { olleSegmentFacts, olleSegmentId, olleSegmentPlace, ollePlaceId, olleSourceUrl } from '../lib/olle';
import { currentTrip } from '../lib/trip';
import { saveOlleVisit } from '../lib/olleTrip';
import { loadSavedIds } from '../lib/storage';

const CONDITIONS = [
  ['노면·폭', '포장 여부와 휠체어가 지날 수 있는 폭을 확인하세요.'],
  ['경사·단차·계단', '급경사나 우회가 필요한 구간, 동행자의 도움이 필요한 곳을 확인하세요.'],
  ['휠체어 화장실', '진입 경로, 이용 가능 시간과 내부 공간을 확인하세요.'],
  ['장애인 주차장', '주차장 위치와 구간 시작점까지의 접근 경로를 확인하세요.'],
  ['휴식 장소', '앉아서 쉴 곳과 그늘, 식수 준비 여부를 확인하세요.'],
];
export default function OlleAccessCard({ course: c, onSaved }: { course: OlleCourse; onSaved: () => void }) {
  const trip = currentTrip(), id = olleSegmentId(c), facts = olleSegmentFacts(c);
  const [day, setDay] = useState(() => Math.max(0, trip.days.findIndex(d => d.includes(id))));
  const [duration, setDuration] = useState(() => String(trip.schedule?.visits[id]?.durationMin ?? trip.places.find(p => p.id === id)?.avgStayMinutes ?? ''));
  const [message, setMessage] = useState('');
  const saved = loadSavedIds().includes(id), wholeSaved = loadSavedIds().includes(ollePlaceId(c));
  function add() {
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) { setMessage('휴식을 포함한 계획 시간을 1~1440분으로 입력해 주세요.'); return; }
    const error = saveOlleVisit(olleSegmentPlace(c, minutes), day);
    setMessage(error ?? `${day+1}일차에 일부 구간만 ${minutes}분으로 담았어요.`);
    if (!error) onSaved();
  }
  return <section id="olle-access" className="bg-white rounded-2xl border border-line p-5 space-y-4 scroll-mt-6">
    <h2 className="text-lg font-bold">접근성 · 구간별 확인</h2>
    {facts && c.accessSegment ? <>
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
        <p className="font-bold text-primary">공식 휠체어 안내 구간 · {facts.distanceKm}km</p>
        <p className="font-bold">{facts.start} → {facts.end}</p>
        <dl className="text-sm space-y-2"><div><dt className="text-sub">구간 시작 주소</dt><dd>{c.accessSegment.startAddress}</dd></div><div><dt className="text-sub">적용 범위</dt><dd>위 일부 구간에 한정 · 전체 코스 이용 가능 판정 아님</dd></div></dl>
        <a className="block text-sm underline text-primary" href={`https://map.kakao.com/link/search/${encodeURIComponent(c.accessSegment.startAddress)}`} target="_blank" rel="noreferrer">구간 시작 주소 지도 검색 ↗</a>
        <p className="text-xs text-sub">주소 검색 결과에서 실제 진입 지점을 확인하세요. 위 지도는 전체 코스의 출발·도착점이며, 이 구간의 경로·정확한 좌표는 아직 표시하지 않습니다.</p>
      </div>
      <div className="space-y-2"><h3 className="font-bold text-sm">이용 조건</h3><p className="text-xs text-sub">공식 구간 안내만으로 개별 시설과 현재 이용 상태까지 확인된 것은 아닙니다.</p>
        <dl className="divide-y divide-line">{CONDITIONS.map(([label,help]) => <div className="py-3" key={label}><div className="flex items-center justify-between gap-2"><dt className="text-sm font-bold">{label}</dt><dd className="text-xs bg-surface-sub rounded-full px-3 py-1">미확인</dd></div><p className="text-xs text-sub mt-1">{help}</p></div>)}</dl>
      </div>
      <p className="text-xs text-sub">자료 미확인은 ‘시설 없음’ 또는 ‘이용 가능’을 뜻하지 않습니다. 수동·전동 휠체어, 유모차와 동행자 도움 여부에 따라 필요한 조건이 다릅니다.</p>
      <div className="text-xs text-muted space-y-1"><p>출처: <a className="underline" href={olleSourceUrl(c)} target="_blank" rel="noreferrer">제주올레 공식 구간 안내</a></p><p>자료 확인 {OLLE_CHECKED_AT} · 현장 확인일 미확인</p></div>
      <a className="block text-primary text-sm underline" href="tel:0647622190">구간 이용 조건 문의: 제주올레 064-762-2190</a>
      <div className="border-t border-line pt-4 space-y-3">
        <h3 className="font-bold">이 구간만 일정에 담기</h3>
        <p className="text-sm text-sub">이 구간의 공식 소요시간은 확보되지 않았습니다. 이동 속도와 휴식을 고려해 직접 계획 시간을 입력하세요.</p>
        {wholeSaved && <p className="rounded-xl bg-amber-50 text-amber-900 p-3 text-sm">같은 코스 전체가 이미 담겨 있어요. 구간을 추가하면 둘 다 남습니다. 구간만 방문한다면 ‘내 여행’에서 전체 코스를 제외해 주세요.</p>}
        <label className="block text-sm">구간 방문 날짜<select value={day} onChange={e => setDay(Number(e.target.value))} className="block w-full border border-line p-3 rounded-xl mt-1">{trip.days.map((_,i) => <option value={i} key={i}>{i+1}일차</option>)}</select></label>
        <label className="block text-sm">구간 계획 시간(휴식 포함, 분)<input type="number" min="1" max="1440" step="1" placeholder="직접 입력 · 예: 120" value={duration} onChange={e => setDuration(e.target.value)} className="block w-full border border-line p-3 rounded-xl mt-1" /></label>
        <p className="text-xs text-sub">직접 입력한 계획 시간이며 공식·검증된 이동 시간은 아닙니다. 구간 전후 이동과 배편은 별도로 확인하세요.</p>
        <button type="button" className="w-full bg-primary text-white rounded-xl p-3 font-bold" onClick={add}>{saved ? '담은 구간 일정 업데이트' : '이 구간만 담기'}</button>
        <p role="status" aria-label="구간 저장 결과" className="text-sm text-primary">{message}</p>
        {saved && <Link to="/my-trip" className="block text-sm underline text-primary">담은 구간 확인</Link>}
      </div>
    </> : <><p className="text-sm">이 앱에서 확인한 휠체어 안내 구간이 없습니다. 이용 불가라는 뜻은 아니며, 공식 안내와 현장 문의가 필요합니다.</p><a className="text-sm underline text-primary" href={olleSourceUrl(c)} target="_blank" rel="noreferrer">공식 접근성 안내 확인 ↗</a></>}
  </section>;
}
