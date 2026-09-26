import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { OLLE_COURSES, OLLE_CHECKED_AT } from '../data/olle';
import { filterOlle, ollePlaceId, type OlleFilters } from '../lib/olle';
import { loadSavedIds } from '../lib/storage';

const EMPTY: OlleFilters = { query: '', region: '', difficulty: '', time: '', island: false };
const KEY = 'jeju_olle_filters_v1';
function initial(): OlleFilters {
  try { const v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (v && ['query','region','difficulty','time'].every(k => typeof v[k] === 'string') && typeof v.island === 'boolean') return v;
  } catch { /* use defaults */ } return EMPTY;
}
export default function Olle() {
  const [filters, setFilters] = useState(initial);
  const saved = loadSavedIds();
  useEffect(() => { try { window.scrollTo(0, Number(sessionStorage.getItem('jeju_olle_scroll_v1')) || 0); } catch { /* optional */ } }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(filters)); } catch { /* optional */ } }, [filters]);
  const courses = filterOlle(OLLE_COURSES, filters);
  const update = (patch: Partial<OlleFilters>) => setFilters(f => ({ ...f, ...patch }));
  return <div className="min-h-screen bg-surface text-ink pb-24">
    <main className="app-shell mx-auto px-4 py-8 space-y-6">
      <header className="rounded-3xl bg-primary text-white p-6 md:p-10">
        <p className="text-sm mb-2">제주를 천천히, 내 걸음으로</p>
        <h1 className="text-3xl font-bold">제주 올레길</h1>
        <p className="mt-3">27개 코스 · A/B 경로를 구분한 29개 선택지</p>
        <p className="text-sm mt-2 opacity-90">거리와 시간을 비교하고, 하루에 무리 없는 코스를 담아보세요.</p>
      </header>
      <section aria-label="코스 찾기" className="bg-white p-5 rounded-2xl border border-line space-y-4">
        <label className="block text-sm font-bold">코스 검색<input className="mt-2 w-full border border-line rounded-xl p-3 font-normal" placeholder="코스 번호, 출발·도착 지역 검색" value={filters.query} onChange={e => update({ query: e.target.value })} /></label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">지역<select className="block w-full border border-line rounded-xl p-3 mt-1" value={filters.region} onChange={e => update({ region: e.target.value })}><option value="">전체 지역</option>{['동부','남부','서부','북부','우도','가파도','추자도'].map(r => <option key={r}>{r}</option>)}</select></label>
          <label className="text-sm">난이도<select className="block w-full border border-line rounded-xl p-3 mt-1" value={filters.difficulty} onChange={e => update({ difficulty: e.target.value })}><option value="">모든 난이도</option>{['쉬움','보통','어려움'].map(r => <option key={r}>{r}</option>)}</select></label>
          <label className="text-sm">공식 소요시간<select className="block w-full border border-line rounded-xl p-3 mt-1" value={filters.time} onChange={e => update({ time: e.target.value })}><option value="">전체 시간</option><option value="short">최대 4시간</option><option value="medium">최대 5~6시간</option><option value="long">최대 7시간 이상</option></select></label>
        </div>
        <div className="flex items-center justify-between gap-3"><label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={filters.island} onChange={e => update({ island: e.target.checked })} />섬 코스만 보기</label><button className="text-sm underline p-2" onClick={() => setFilters(EMPTY)}>필터 초기화</button></div>
      </section>
      <div className="flex justify-between text-sm"><p role="status">{courses.length}개 경로</p><span className="text-muted">휴식·교통 시간 별도</span></div>
      <div className="place-grid">{courses.map(c => <Link data-olle-card onClick={() => { try { sessionStorage.setItem('jeju_olle_scroll_v1', String(window.scrollY)); } catch { /* optional */ } }} key={c.slug} to={`/olle/${c.slug}`} className="block bg-white rounded-2xl border border-line p-5 space-y-4 hover:border-primary focus-visible:ring-2 focus-visible:ring-primary">
        <div className="flex justify-between gap-2"><span className="font-bold text-primary">{c.code}코스</span><span className="text-xs text-sub">{saved.includes(ollePlaceId(c)) ? '♥ 담은 코스' : c.region}</span></div>
        <h2 className="text-lg font-bold">{c.name}</h2>
        <div className="flex flex-wrap gap-2 text-sm"><span className="rounded-lg bg-surface-sub px-2 py-1">{c.distanceKm}km</span><span className="rounded-lg bg-surface-sub px-2 py-1">{c.hours.join('~')}시간</span><span className="rounded-lg bg-surface-sub px-2 py-1">{c.difficulty}</span></div>
        <p className="text-xs text-sub">{c.island ? '배편·마지막 배 시간 확인 필요' : `${c.start.name} → ${c.end.name}`}</p>
        {c.accessSegment && <p className="text-xs text-primary">일부 구간 휠체어 안내 있음 · 전체 코스와 별도</p>}
        <p className="text-sm text-primary font-bold">코스 자세히 보기 →</p>
      </Link>)}</div>
      {!courses.length && <p className="p-10 text-center text-sub">조건에 맞는 코스가 없어요. 필터를 조정해 주세요.</p>}
      <p className="text-xs text-muted leading-relaxed">출처: 제주올레 공식 코스 상세 · 정보 확인 {OLLE_CHECKED_AT}. 지역은 탐색 편의를 위한 앱 분류입니다. 쉬운 코스도 휠체어·유모차 이용이 보장되는 것은 아닙니다. 방문 전 최신 통제 안내를 확인해 주세요.</p>
    </main><BottomNav savedCount={saved.length} />
  </div>;
}
