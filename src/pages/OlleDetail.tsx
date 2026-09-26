import OlleAccessCard from '../components/OlleAccessCard';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import L from 'leaflet';
import BottomNav from '../components/BottomNav';
import { OLLE_COURSES, OLLE_CHECKED_AT, type OlleCourse } from '../data/olle';
import { olleDuration, ollePlace, ollePlaceId, olleSourceUrl } from '../lib/olle';
import { currentTrip, makeTrip, saveTripSelection } from '../lib/trip';
import { rememberPlaces } from '../lib/places';
import { loadSavedIds } from '../lib/storage';
import { DEFAULT_SCHEDULE } from '../lib/schedule';

function Endpoints({ course: c }: { course: OlleCourse }) {
  const ref = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    if (!ref.current) return;
    setStatus('loading');
    const map = L.map(ref.current, { scrollWheelZoom: false });
    let failed = false;
    const timer = window.setTimeout(() => setStatus('error'), 12000);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 })
      .on('tileload', () => { window.clearTimeout(timer); if (!failed) setStatus('ready'); })
      .on('tileerror', () => { failed = true; window.clearTimeout(timer); setStatus('error'); }).addTo(map);
    [c.start,c.end].forEach((p,i) => L.marker([p.lat,p.lng], { icon: L.divIcon({ className: '', html: `<span style="display:block;background:${i ? '#dc713d' : '#007e80'};color:white;border:2px solid white;border-radius:20px;width:42px;text-align:center;padding:5px;font-size:12px">${i ? '도착' : '출발'}</span>`, iconSize: [42,32] }) }).addTo(map).bindTooltip(`${i ? '도착' : '출발'}: ${p.name}`));
    map.fitBounds(L.latLngBounds([[c.start.lat,c.start.lng],[c.end.lat,c.end.lng]]).pad(0.3), { maxZoom: 13 });
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(ref.current);
    return () => { window.clearTimeout(timer); resize.disconnect(); map.remove(); };
  }, [c, attempt]);
  return <div className="space-y-2"><div ref={ref} role="img" aria-label="공식 출발·도착 위치 지도. 실제 걷는 경로는 공식 지도에서 확인" className="h-64 md:h-80 rounded-xl relative z-0" />
    {status !== 'ready' && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{status === 'loading' ? '지도를 불러오는 중입니다…' : '지도 배경을 모두 불러오지 못했어요. 인터넷 연결을 확인하거나 아래 길찾기·공식 지도 링크를 이용해 주세요.'}</p>}
    <button type="button" className="text-sm text-primary underline py-2" onClick={() => setAttempt(n => n+1)}>지도 다시 불러오기</button>
  </div>;
}
const mapUrl = (p: OlleCourse['start']) => `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
export default function OlleDetail() {
  const { slug } = useParams();
  const c = OLLE_COURSES.find(c => c.slug === slug);
  return c ? <Detail key={c.slug} course={c} /> : <main className="app-shell mx-auto p-8"><h1>코스를 찾을 수 없어요.</h1><Link className="underline" to="/olle">올레길 목록으로</Link></main>;
}
function Detail({ course: c }: { course: OlleCourse }) {
  const location = useLocation();
  useEffect(() => { if (new URLSearchParams(location.search).get('segment') === '1') document.getElementById('olle-access')?.scrollIntoView(); }, [location.search]);
  const trip = currentTrip();
  const id = ollePlaceId(c);
  const [saved, setSaved] = useState(() => loadSavedIds().includes(id));
  const [rest, setRest] = useState(() => {
    const previous = trip.schedule?.visits[id]?.durationMin ?? trip.places.find(p => p.id === id)?.avgStayMinutes;
    const extra = previous === undefined ? 30 : previous - c.hours[1] * 60;
    return [0,30,60,90,120].includes(extra) ? extra : 30;
  });
  const [day, setDay] = useState(() => Math.max(0, trip.days.findIndex(d => d.includes(id))));
  const [message, setMessage] = useState('');
  const [, refreshSaved] = useState(0);
  const duration = olleDuration(c, rest);
  function add() {
    const latest = currentTrip();
    const ids = loadSavedIds();
    if (!ids.includes(id) && ids.length >= 100) { setMessage('한 여행에는 최대 100곳까지 담을 수 있어요.'); return; }
    const place = ollePlace(c, rest);
    if (!rememberPlaces([place])) { setMessage('저장 공간이 부족해 코스를 담지 못했어요.'); return; }
    const target = Math.min(day, latest.nights);
    const originalDay = latest.days.findIndex(d => d.includes(id));
    const buckets = latest.days.map((d,i) => d.filter(x => x !== id || i === target).map(x => x === id ? place : latest.places.find(p => p.id === x)!));
    if (originalDay !== target) buckets[target].push(place);
    const base = latest.schedule ?? DEFAULT_SCHEDULE;
    const schedule = { ...base, visits: { ...base.visits, [id]: { ...base.visits[id], durationMin: duration } } };
    const next = makeTrip(buckets, latest.nights, latest.headcount, latest.notes, schedule);
    if (!saveTripSelection(next, ids.includes(id) ? ids : [...ids,id])) { setMessage('저장하지 못했어요. 저장 공간을 확인해 주세요.'); return; }
    setSaved(true); setMessage(`${target+1}일차에 ${duration}분으로 담았어요. 출발·도착 이동 시간은 별도 확인해 주세요.`);
  }
  return <div className="min-h-screen bg-surface text-ink pb-24"><main className="app-shell mx-auto px-4 py-6 space-y-5">
    <Link to="/olle" className="inline-block text-primary py-2">← 올레길 목록</Link>
    <header className="bg-primary text-white p-6 md:p-8 rounded-3xl"><p>{c.region} · {c.code}코스</p><h1 className="text-2xl md:text-3xl font-bold mt-2">{c.name}</h1><p className="mt-4 text-lg">{c.distanceKm}km · {c.hours.join('~')}시간 · 난이도 {c.difficulty}</p></header>
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <div className="space-y-5">
        <section className="bg-white rounded-2xl border border-line p-5 space-y-4"><h2 className="text-lg font-bold">코스와 지도</h2><Endpoints course={c} /><dl className="text-sm space-y-3"><div><dt className="text-muted">출발</dt><dd>{c.start.name} <a className="text-primary underline ml-2" href={mapUrl(c.start)} target="_blank" rel="noreferrer">출발점 길찾기</a></dd></div><div><dt className="text-muted">도착</dt><dd>{c.end.name} <a className="text-primary underline ml-2" href={mapUrl(c.end)} target="_blank" rel="noreferrer">도착점 위치</a></dd></div></dl><p className="text-xs text-muted">표시는 공식 출발·도착 좌표입니다. 실제 걷는 경로와 경유지·스탬프 위치는 공식 상세 지도에서 확인해 주세요.</p><a className="block text-primary font-bold underline" href={olleSourceUrl(c)} target="_blank" rel="noreferrer">공식 코스 지도·경유지·스탬프 확인 ↗</a></section>
        <OlleAccessCard course={c} onSaved={() => refreshSaved(n => n+1)} />
      </div>
      <div className="space-y-5">
        <section className="bg-white rounded-2xl border border-line p-5 space-y-4"><h2 className="text-lg font-bold">내 일정에 담기</h2><p className="text-sm text-sub">전체 코스의 공식 소요시간 상한 {c.hours[1]}시간을 기준으로 여유 시간을 더합니다. 걷는 속도·식사·휴식에 맞게 조정하세요.</p><div className="grid grid-cols-2 gap-3"><label className="text-sm">여행 날짜<select value={day} onChange={e => setDay(Number(e.target.value))} className="block w-full p-3 border border-line rounded-xl mt-1">{trip.days.map((_,i) => <option key={i} value={i}>{i+1}일차</option>)}</select></label><label className="text-sm">추가 여유 시간<select value={rest} onChange={e => setRest(Number(e.target.value))} className="block w-full p-3 border border-line rounded-xl mt-1">{[0,30,60,90,120].map(n => <option key={n} value={n}>{n}분</option>)}</select></label></div><p className="bg-surface-sub p-3 rounded-xl font-bold">계획 시간: {Math.floor(duration/60)}시간 {duration%60 ? `${duration%60}분` : ''} <span className="text-sm font-normal">({duration}분)</span></p><p className="text-sm text-sub">숙소에서 출발점까지, 종점에서 다음 장소까지의 이동과 배편은 포함되지 않습니다.</p><button className="w-full bg-primary text-white p-3 rounded-xl font-bold" onClick={add}>{saved ? '담은 코스 일정 업데이트' : '이 코스 일정에 담기'}</button><p role="status" className="text-sm text-primary">{message}</p>{saved && <Link to="/my-trip" className="block text-center underline text-primary">담은 일정 확인</Link>}</section>
        <section className="bg-white rounded-2xl border border-line p-5 space-y-3"><h2 className="text-lg font-bold">교통·편의시설·통제 안내</h2><ul className="list-disc pl-5 space-y-2 text-sm text-sub"><li>주차, 화장실, 식수·휴식 장소의 운영 상태는 미확인입니다. 공식 코스 지도와 방문 전 문의로 확인해 주세요.</li><li>돌아오는 교통편과 일몰 전 도착 가능 시간을 먼저 확인하세요.</li>{c.island && <li className="font-bold text-amber-800">{c.island} 코스는 배편 예약·결항 여부·마지막 배 시간을 확인하세요.</li>}<li>공사·날씨에 따른 통제와 우회 여부는 실시간 연동되지 않습니다.</li></ul><a className="block text-primary underline" href="https://www.jejuolle.org/trail" target="_blank" rel="noreferrer">공식 사이트에서 최신 공지 확인 ↗</a><a className="block text-primary underline" href="tel:0647622190">제주올레 문의 064-762-2190</a></section>
        <p className="text-xs text-muted">출처: <a href={olleSourceUrl(c)} target="_blank" rel="noreferrer" className="underline">제주올레 공식 코스 상세</a> · 정보 확인 {OLLE_CHECKED_AT}. 공식 안내의 변경 사항은 다음 정보 갱신 전까지 반영되지 않을 수 있습니다.</p>
      </div>
    </div></main><BottomNav savedCount={loadSavedIds().length} /></div>;
}
