import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import BottomNav from '../components/BottomNav';
import PlaceMap from '../components/PlaceMap';
import { loadExplore, saveExplore } from '../lib/explore';
import { loadPlaces, rememberPlaces } from '../lib/places';
import { calculateCuration, TRAVEL_TYPE_NAME, THEME_NAME } from '../lib/curate';
import { nightsLabel } from './Onboarding';
import { loadProfile, loadSavedIds, saveSavedIds, loadWish, saveWish, loadReasonsOn, logEvent, loadMySpots, saveMySpots, type MySpot } from '../lib/storage';
import { fetchLivePlaces, loadLiveCache, fetchBarrierFreeIds } from '../lib/live';
import { useI18n, LangToggle } from '../i18n';
import { regionOf, REGION_LABEL, REGION_DESC, type Region4 } from '../lib/region';
import { subcatOf, subcatChips } from '../lib/subcat';
import type { Content, ContentType, CuratedContent } from '../types';

const REGION_EN: Record<Region4, string> = { east: 'East', west: 'West', south: 'South', north: 'North' };

const TABS: { key: 'all' | ContentType; tkey: string; emoji: string }[] = [
  { key: 'all', tkey: 'tab.all', emoji: '' },
  { key: 'stay', tkey: 'tab.stay', emoji: '🏡 ' },
  { key: 'activity', tkey: 'tab.activity', emoji: '🌊 ' },
  { key: 'food', tkey: 'tab.food', emoji: '🍊 ' },
];

const TYPE_SECTIONS: { key: ContentType; tkey: string }[] = [
  { key: 'stay', tkey: 'sec.stay' },
  { key: 'activity', tkey: 'sec.activity' },
  { key: 'food', tkey: 'sec.food' },
];

const GRADE_STYLE: Record<string, { badge: string; icon: string }> = {
  적합: { badge: 'bg-primary text-white', icon: 'spa' },
  높음: { badge: 'bg-tertiary-light text-tertiary', icon: 'thumb_up' },
  보통: { badge: 'bg-surface-sub text-muted', icon: 'thumb_up' },
};

export default function Home() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const profile = loadProfile();
  const [initialExplore] = useState(loadExplore);
  const [tab, setTab] = useState<'all' | ContentType>(initialExplore.tab);
  const [sub, setSub] = useState<string>(initialExplore.sub); // 세부 카테고리
  const [view, setView] = useState<'list' | 'map'>(initialExplore.view); // 목록/지도
  const [mySpots, setMySpots] = useState<MySpot[]>(() => loadMySpots());
  const [addMode, setAddMode] = useState(false);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [mapOnlyBF, setMapOnlyBF] = useState(initialExplore.mapOnlyBF); // 지도: 무장애만
  const [region, setRegion] = useState<'all' | Region4>(initialExplore.region);
  const [visibleCount, setVisibleCount] = useState(initialExplore.visibleCount); // 더보기 페이지네이션
  const [saved, setSaved] = useState<number[]>(() => loadSavedIds());
  const [wish, setWish] = useState<string>(() => loadWish());
  const reasonsOn = loadReasonsOn(); // 실험: 추천 이유 표시 여부
  const feedAt = useRef(Date.now());
  useEffect(() => {
    feedAt.current = Date.now();
    logEvent('feed_view', { reasonsOn });
  }, [reasonsOn]);
  const access = profile?.access;
  const hasAccessNeed = !!(access && (access.barrierFree || access.stroller || access.avoidNoKids));
  const [accessOn, setAccessOn] = useState(initialExplore.accessOn);
  const foodPref = profile?.foodPref;
  const hasFoodNeed = !!(foodPref && Object.values(foodPref).some(Boolean));
  const [foodOn, setFoodOn] = useState(initialExplore.foodOn);
  const pet = profile?.pet;
  const hasPetNeed = !!(pet && pet.withPet);
  const [petOn, setPetOn] = useState(initialExplore.petOn);

  // 실시간 관광 데이터 (Supabase 프록시 → TourAPI)
  const [live, setLive] = useState<Content[]>(() => loadLiveCache() ?? []);
  const [liveState, setLiveState] = useState<'loading' | 'done' | 'error'>(
    () => (loadLiveCache() ? 'done' : 'loading'),
  );
  useEffect(() => {
    let alive = true;
    fetchLivePlaces()
      .then((items) => { if (alive) { setLive(items); setLiveState('done'); } })
      .catch(() => { if (alive) setLiveState('error'); });
    return () => { alive = false; };
  }, []);
  function refreshLive() {
    setLiveState('loading');
    fetchLivePlaces({ force: true })
      .then((items) => { setLive(items); setLiveState('done'); })
      .catch(() => setLiveState('error'));
  }

  // 무장애 등록 장소 id (배리어프리 서비스)
  const [bfIds, setBfIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    let alive = true;
    fetchBarrierFreeIds()
      .then((ids) => { if (alive) setBfIds(new Set(ids)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  // 실시간 장소에 무장애 표시 부여
  const liveAug = useMemo(
    () =>
      live.map((x) =>
        bfIds.has(x.id)
          ? { ...x, accessibility: { ...(x.accessibility || {}), barrierFree: true } }
          : x,
      ),
    [live, bfIds],
  );

  const curated = useMemo(
    () => (profile ? calculateCuration(loadPlaces(liveAug), profile) : []),
    [profile, liveAug],
  );
  // 카테고리·권역·검색 시 실시간 데이터까지 합친 전체 풀
  const pool = useMemo(
    () => (profile ? calculateCuration(loadPlaces(liveAug), profile) : []),
    [profile, liveAug],
  );



  const q = wish.trim().toLowerCase();
  function matchesWish(c: (typeof curated)[number]) {
    if (!q) return true;
    const themeNames = c.tags.themes.map((t) => THEME_NAME[t]).join(' ');
    const hay = `${c.name} ${c.desc} ${c.region} ${(c.hashtags ?? []).join(' ')} ${themeNames}`.toLowerCase();
    return q.split(/\s+/).some((w) => hay.includes(w));
  }

  function matchesAccess(c: (typeof curated)[number]) {
    if (!accessOn || !access) return true;
    if (access.barrierFree && !c.accessibility?.barrierFree) return false;
    if (access.stroller && !c.accessibility?.strollerOK) return false;
    if (access.avoidNoKids && c.accessibility?.noKidsZone !== false) return false;
    return true;
  }

  function matchesFood(c: (typeof curated)[number]) {
    if (!foodOn || !foodPref) return true;
    if (c.contentType !== 'food') return true; // 음식 조건은 미식 장소에만 적용
    const f = c.food;
    if (foodPref.halal && !f?.halal) return false;
    if (foodPref.vegetarian && !(f?.vegetarian || f?.vegan)) return false;
    if (foodPref.vegan && !f?.vegan) return false;
    if (foodPref.noSeafood && !f?.noSeafood) return false;
    if (foodPref.noPork && !f?.noPork) return false;
    return true;
  }

  const SIZE_RANK: Record<string, number> = { small: 1, medium: 2, large: 3 };
  function matchesPet(c: (typeof curated)[number]) {
    if (!petOn || !pet?.withPet) return true;
    if (!c.pet?.petFriendly) return false;
    if (!c.pet.sizeMax || SIZE_RANK[c.pet.sizeMax] < SIZE_RANK[pet.size]) return false;
    return true;
  }

  function matchesRegion(c: (typeof curated)[number]) {
    if (region === 'all') return true;
    return regionOf(c.lat, c.lng) === region;
  }

  const grouped = tab === 'all' && !q && region === 'all';
  // 기본 피드는 큐레이션(엄선) 데이터, 필터를 걸면 실시간 포함 전체 풀에서 탐색
  const base = grouped ? curated : pool;
  const filtered = base.filter(
    (c) =>
      (tab === 'all' || c.contentType === tab) &&
      matchesWish(c) &&
      matchesAccess(c) &&
      matchesFood(c) &&
      matchesPet(c) &&
      matchesRegion(c),
  );
  // 세부 카테고리(2단계): 탭 선택 시 실제 존재하는 종류만 칩으로
  const subChips = tab !== 'all' ? subcatChips(filtered) : [];
  const subFiltered =
    tab !== 'all' && sub !== 'all' ? filtered.filter((c) => subcatOf(c) === sub) : filtered;

  // 지도는 실시간 포함 전체 풀을 항상 사용(기본 화면에서도 모든 핀 표시)
  const mapList = useMemo(() => {
    const pf = pool.filter(
      (c) =>
        (tab === 'all' || c.contentType === tab) &&
        matchesWish(c) &&
        matchesAccess(c) &&
        matchesFood(c) &&
        matchesPet(c) &&
        matchesRegion(c),
    );
    let r = tab !== 'all' && sub !== 'all' ? pf.filter((c) => subcatOf(c) === sub) : pf;
    if (mapOnlyBF) r = r.filter((c) => c.accessibility?.barrierFree);
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, tab, sub, region, q, accessOn, foodOn, petOn, mapOnlyBF]);

  // Reset dependent filters only on an actual selection change, never on remount.
  const previousFilters = useRef(JSON.stringify([tab, sub, region, q, accessOn, foodOn, petOn]));
  useEffect(() => {
    const signature = JSON.stringify([tab, sub, region, q, accessOn, foodOn, petOn]);
    if (signature !== previousFilters.current) setVisibleCount(24);
    previousFilters.current = signature;
  }, [tab, sub, region, q, accessOn, foodOn, petOn]);
  useEffect(() => {
    saveExplore({ tab, sub, view, region, visibleCount, mapOnlyBF, accessOn, foodOn, petOn });
  }, [tab, sub, view, region, visibleCount, mapOnlyBF, accessOn, foodOn, petOn]);

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    let restoring = true;
    let frame = 0;
    const target = initialExplore.scrollY;
    const restore = () => {
      if (!restoring) return;
      window.scrollTo(0, target);
      if (Math.abs(window.scrollY - target) <= 2) restoring = false;
    };
    // Retry if async data makes a long list tall enough to restore its position.
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore); });
    observer.observe(document.body);
    frame = requestAnimationFrame(restore);
    const stopRestoring = () => { restoring = false; };
    const track = () => { if (!restoring) saveExplore({ scrollY: window.scrollY }); };
    window.addEventListener('scroll', track, { passive: true });
    window.addEventListener('wheel', stopRestoring, { passive: true });
    window.addEventListener('touchstart', stopRestoring, { passive: true });
    window.addEventListener('pointerdown', stopRestoring, { passive: true });
    window.addEventListener('keydown', stopRestoring);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', track);
      window.removeEventListener('wheel', stopRestoring);
      window.removeEventListener('touchstart', stopRestoring);
      window.removeEventListener('pointerdown', stopRestoring);
      window.removeEventListener('keydown', stopRestoring);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [initialExplore]);

  function openPlace(id: number) {
    saveExplore({ tab, sub, view, region, visibleCount, mapOnlyBF, accessOn, foodOn, petOn, scrollY: window.scrollY });
    navigate(`/place/${id}`);
  }

  const filterActive =
    tab !== 'all' || sub !== 'all' || region !== 'all' || !!q || !accessOn || !foodOn || !petOn || mapOnlyBF;
  function resetFilters() {
    setTab('all');
    setSub('all');
    setRegion('all');
    setWish('');
    saveWish('');
    setAccessOn(true);
    setFoodOn(true);
    setPetOn(true);
    setMapOnlyBF(false);
    setVisibleCount(24);
  }

  function pickSpot(lat: number, lng: number) {
    if (!addMode) return;
    setPending({ lat, lng });
    setPendingName('');
  }
  function saveMySpot() {
    if (!pending) return;
    const name = pendingName.trim() || '내 스팟';
    const next = [...mySpots, { id: Date.now(), name, lat: pending.lat, lng: pending.lng }];
    setMySpots(next);
    saveMySpots(next);
    setPending(null);
    setPendingName('');
    setAddMode(false);
  }
  function deleteMySpot(id: number) {
    const next = mySpots.filter((s) => s.id !== id);
    setMySpots(next);
    saveMySpots(next);
  }

  function toggleSave(id: number) {
    if (!saved.includes(id) && saved.length >= 100) { window.alert('한 여행에는 최대 100곳까지 담을 수 있어요.'); return; }
    const place = pool.find(p => p.id === id);
    if (place && !rememberPlaces([place])) {
      window.alert('장소를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');
      return;
    }
    setSaved((prev) => {
      const adding = !prev.includes(id);
      const next = adding ? [...prev, id] : prev.filter((x) => x !== id);
      if (!saveSavedIds(next)) { window.alert('저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); return prev; }
      if (adding) {
        logEvent('save', { id, reasonsOn, ms: Date.now() - feedAt.current });
      }
      return next;
    });
  }

  if (!profile) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="app-shell mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="explore" className="text-[20px]" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Jeju All-In</span>
              <span className="font-bold text-[17px]">{t('home.feed')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <button
              onClick={() => navigate('/lab')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary"
              aria-label="실험실"
            >
              <Icon name="science" className="text-[22px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell mx-auto pt-16 pb-28 px-4 flex flex-col gap-6">
        {/* 취향 요약 */}
        <section className="flex flex-col gap-2 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1 text-primary">
                <Icon name="psychology" className="text-[18px]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('home.profile')}</span>
              </div>
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-sub text-muted text-[11px] active:scale-95"
              >
                {t('home.reset')} <Icon name="refresh" className="text-[14px]" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <Chip accent>📅 {nightsLabel(profile.nights ?? 1)} · {profile.headcount ?? 2}명</Chip>
              <Chip>🌿 {TRAVEL_TYPE_NAME[profile.travelType]}</Chip>
              {profile.hasChild && <Chip accent>👶 아이 동반</Chip>}
              {profile.hasSenior && <Chip accent>🧓 시니어 동반</Chip>}
              {profile.themes.slice(0, 3).map((t) => (
                <Chip key={t}>#{t}</Chip>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-card flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Icon name="verified" className="text-[15px]" fill />
            </div>
            <div>
              <div className="text-xs font-bold">{t('home.clean.title')}</div>
              <p className="text-xs text-muted">{t('home.clean.desc')}</p>
            </div>
          </div>
        </section>

        {/* 직접 하고 싶은 것 입력 */}
        <div className="bg-white rounded-xl p-3 shadow-card">
          <div className="flex items-center gap-1.5 mb-2 text-primary">
            <Icon name="edit_note" className="text-[18px]" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('home.wish.title')}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface rounded-full px-3 py-2">
            <Icon name="search" className="text-[18px] text-muted" />
            <input
              value={wish}
              onChange={(e) => {
                setWish(e.target.value);
                saveWish(e.target.value);
              }}
              placeholder={t('home.wish.ph')}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted"
            />
            {wish && (
              <button onClick={() => { setWish(''); saveWish(''); }} className="text-muted active:scale-90" aria-label="지우기">
                <Icon name="close" className="text-[18px]" />
              </button>
            )}
          </div>
          {q && (
            <p className="text-[11px] text-muted mt-1.5">
'{wish.trim()}' · {filtered.length} {t('home.wish.found')}
            </p>
          )}
        </div>

        {/* 접근성(여행 약자) 필터 */}
        {hasAccessNeed && (
          <button
            onClick={() => setAccessOn((v) => !v)}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all ${
              accessOn ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted shadow-card'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Icon name="accessible" className="text-[18px]" />
              {t('home.access.only')}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${accessOn ? 'bg-white/20' : 'bg-surface-sub'}`}>
              {[access?.barrierFree && '무장애', access?.stroller && '유모차', access?.avoidNoKids && '노키즈존 제외']
                .filter(Boolean)
                .join(' · ')} {accessOn ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* 식단·회피음식 필터 */}
        {hasFoodNeed && (
          <button
            onClick={() => setFoodOn((v) => !v)}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all ${
              foodOn ? 'bg-accent text-white shadow-sm' : 'bg-white text-muted shadow-card'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Icon name="restaurant" className="text-[18px]" />
              {t('home.food.only')}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${foodOn ? 'bg-white/20' : 'bg-surface-sub'}`}>
              {[
                foodPref?.halal && '할랄',
                foodPref?.vegetarian && '베지테리언',
                foodPref?.vegan && '비건',
                foodPref?.noSeafood && '해산물 제외',
                foodPref?.noPork && '돼지고기 제외',
              ]
                .filter(Boolean)
                .join(' · ')} {foodOn ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* 반려견 동반 필터 */}
        {hasPetNeed && (
          <button
            onClick={() => setPetOn((v) => !v)}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all ${
              petOn ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted shadow-card'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Icon name="pets" className="text-[18px]" />
              {t('home.pet.only')}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${petOn ? 'bg-white/20' : 'bg-surface-sub'}`}>
              {t(`pet.${pet?.size ?? 'small'}`)} {petOn ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* 카테고리 탭 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              aria-pressed={tab === tb.key}
              onClick={() => { if (tab !== tb.key) { setTab(tb.key); setSub('all'); } }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === tb.key ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted'
              }`}
            >
              {tb.emoji}{t(tb.tkey)}
            </button>
          ))}
        </div>

        {/* 세부 카테고리 (2단계) */}
        {tab !== 'all' && subChips.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mt-2">
            <button
              onClick={() => setSub('all')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                sub === 'all' ? 'bg-ink text-white shadow-sm' : 'bg-white text-muted'
              }`}
            >
              {lang === 'en' ? 'All' : '전체'} {filtered.length}
            </button>
            {subChips.map((s) => (
              <button
                key={s.label}
                onClick={() => setSub(s.label)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sub === s.label ? 'bg-ink text-white shadow-sm' : 'bg-white text-muted'
                }`}
              >
                {s.label} {s.count}
              </button>
            ))}
          </div>
        )}

        {/* 전체 선택 초기화 (항상 표시) */}
        <button
          onClick={resetFilters}
          disabled={!filterActive}
          className={`-mt-2 flex items-center justify-center gap-1.5 w-full rounded-full font-bold text-sm py-2.5 transition-all active:scale-95 ${
            filterActive ? 'bg-accent text-white shadow-sm' : 'bg-surface-sub text-muted'
          }`}
        >
          <Icon name="restart_alt" className="text-[18px]" />
          {lang === 'en' ? 'Reset all selections' : '전체 선택 초기화'}
        </button>

        {/* 권역(동서남북) 필터 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mt-2">
          <span className="text-[11px] text-muted font-bold shrink-0 flex items-center gap-0.5">
            <Icon name="explore" className="text-[14px]" /> {lang === 'en' ? 'Area' : '권역'}
          </span>
          {(['all', 'north', 'east', 'south', 'west'] as const).map((r) => {
            const on = region === r;
            const label = r === 'all' ? (lang === 'en' ? 'All' : '전체') : lang === 'en' ? REGION_EN[r] : REGION_LABEL[r];
            return (
              <button
                key={r}
                aria-pressed={on}
                onClick={() => setRegion(r)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  on ? 'bg-tertiary text-white shadow-sm' : 'bg-white text-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {region !== 'all' && (
          <p className="text-[11px] text-muted -mt-3">
            {lang === 'en' ? REGION_EN[region] : `${REGION_LABEL[region]} (${REGION_DESC[region]})`} · {filtered.length}
            {t('unit.places')}
          </p>
        )}

        {/* 목록 / 지도 전환 */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-surface-sub -mt-1">
          <button
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            className={`flex items-center justify-center gap-1 py-2 rounded-full text-sm font-bold transition-all ${
              view === 'list' ? 'bg-white text-primary shadow-sm' : 'text-muted'
            }`}
          >
            <Icon name="view_list" className="text-[18px]" /> {lang === 'en' ? 'List' : '목록'}
          </button>
          <button
            aria-pressed={view === 'map'}
            onClick={() => setView('map')}
            className={`flex items-center justify-center gap-1 py-2 rounded-full text-sm font-bold transition-all ${
              view === 'map' ? 'bg-white text-primary shadow-sm' : 'text-muted'
            }`}
          >
            <Icon name="map" className="text-[18px]" /> {lang === 'en' ? 'Map' : '지도'}
          </button>
        </div>

        {/* 실시간 관광정보 상태 */}
        <div className="flex items-center justify-between -mt-2 px-1">
          <span className="text-[11px] text-muted flex items-center gap-1">
            <Icon name="cloud" className="text-[14px]" />
            {liveState === 'loading' && (lang === 'en' ? 'Loading tourism information…' : '관광공사 정보 불러오는 중…')}
            {liveState === 'done' &&
              (lang === 'en'
                ? `Korea Tourism Organization · ${live.length} places`
                : `관광공사 제주 정보 · ${live.length}곳`)}
            {liveState === 'error' && (lang === 'en' ? 'Update failed · showing available data' : '갱신 실패 · 기존 정보를 표시합니다')}
          </span>
          <button
            onClick={refreshLive}
            disabled={liveState === 'loading'}
            className="text-[11px] text-primary font-bold flex items-center gap-0.5 active:scale-95 disabled:opacity-40"
          >
            <Icon name="refresh" className="text-[14px]" /> {lang === 'en' ? 'Refresh' : '새로고침'}
          </button>
        </div>
        {!grouped && liveState === 'done' && (
          <p className="text-[11px] text-muted -mt-3 px-1">
            {lang === 'en' ? 'Includes Korea Tourism Organization data.' : '한국관광공사 제주 관광정보를 포함한 결과입니다.'}
          </p>
        )}

        {/* 지도 보기 */}
        {view === 'map' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-muted">
                  {lang === 'en' ? `${mapList.length} places` : `지도에 ${mapList.length}곳`}
                  {mySpots.length > 0 && ` · ${lang === 'en' ? 'My' : '내 스팟'} ${mySpots.length}`}
                </p>
                <button
                  onClick={() => setMapOnlyBF((v) => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold active:scale-95 transition-all ${
                    mapOnlyBF ? 'bg-tertiary text-white shadow-sm' : 'bg-white shadow-card text-tertiary'
                  }`}
                >
                  <Icon name="accessible" className="text-[14px]" />
                  {lang === 'en' ? 'Barrier-free' : '무장애만'}
                </button>
              </div>
              <button
                onClick={() => {
                  setAddMode((v) => !v);
                  setPending(null);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all ${
                  addMode ? 'bg-pink-600 text-white shadow-sm' : 'bg-white shadow-card text-pink-600'
                }`}
              >
                <Icon name={addMode ? 'close' : 'add_location_alt'} className="text-[16px]" />
                {addMode ? (lang === 'en' ? 'Cancel' : '취소') : lang === 'en' ? 'Add spot' : '내 스팟 추가'}
              </button>
            </div>
            {addMode && !pending && (
              <p className="text-[11px] text-pink-600 font-bold px-1 -mt-1">
                {lang === 'en' ? 'Tap the map to place your spot.' : '지도를 눌러 내 스팟 위치를 지정하세요.'}
              </p>
            )}
            {pending && (
              <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-card">
                <input
                  autoFocus
                  value={pendingName}
                  onChange={(e) => setPendingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveMySpot()}
                  placeholder={lang === 'en' ? 'Spot name' : '스팟 이름 (예: 우리 숙소)'}
                  className="flex-1 bg-surface rounded-full px-3 py-2 text-sm outline-none"
                />
                <button onClick={saveMySpot} className="px-3 py-2 rounded-full bg-pink-600 text-white text-xs font-bold active:scale-95">
                  {lang === 'en' ? 'Save' : '저장'}
                </button>
                <button onClick={() => setPending(null)} className="px-2 py-2 rounded-full bg-surface-sub text-muted text-xs font-bold active:scale-95">
                  {lang === 'en' ? 'Cancel' : '취소'}
                </button>
              </div>
            )}
            <PlaceMap
              places={mapList}
              onOpen={openPlace}
              addMode={addMode}
              onPick={addMode ? pickSpot : undefined}
              mySpots={mySpots}
              onDeleteMySpot={deleteMySpot}
            />
          </div>
        )}

        {/* 카드 피드 */}
        {view === 'list' && (grouped ? (
          <div className="flex flex-col gap-7">
            {TYPE_SECTIONS.map((sec) => {
              const list = filtered.filter((c) => c.contentType === sec.key);
              if (list.length === 0) return null;
              return (
                <section key={sec.key} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-[18px]">{t(sec.tkey)}</h2>
                    <span className="text-xs text-muted bg-surface-sub px-2 py-0.5 rounded-full">{list.length}{t('unit.places')}</span>
                  </div>
                  <div className="place-grid">
                  {list.map((c) => (
                    <Card key={c.id} item={c} saved={saved.includes(c.id)} onToggle={() => toggleSave(c.id)} onOpen={() => openPlace(c.id)} showReason={reasonsOn} />
                  ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="place-grid">
            {subFiltered.slice(0, visibleCount).map((c) => (
              <Card key={c.id} item={c} saved={saved.includes(c.id)} onToggle={() => toggleSave(c.id)} onOpen={() => openPlace(c.id)} showReason={reasonsOn} />
            ))}
            {subFiltered.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((n) => n + 24)}
                className="grid-span-all mx-auto mt-1 flex items-center gap-1 px-5 py-2.5 rounded-full bg-white shadow-card text-primary text-sm font-bold active:scale-95"
              >
                <Icon name="expand_more" className="text-[18px]" />
                {lang === 'en'
                  ? `Show more (${subFiltered.length - visibleCount})`
                  : `더보기 (${subFiltered.length - visibleCount})`}
              </button>
            )}
            {subFiltered.length === 0 && (
              <div className="grid-span-all text-center py-10">
                <p className="text-sm text-muted">{t('empty.cat')}</p>
              </div>
            )}
          </section>
        ))}
      </main>

      <BottomNav savedCount={saved.length} />
    </div>
  );
}

function AccessBadges({ item }: { item: CuratedContent }) {
  const a = item.accessibility;
  const badges: { label: string }[] = [];
  if (a?.barrierFree) badges.push({ label: '♿ 무장애' });
  if (a?.strollerOK) badges.push({ label: '🚼 유모차 OK' });
  if (a?.elevator) badges.push({ label: '🛗 엘리베이터' });
  if (a?.noKidsZone) badges.push({ label: '🚫 노키즈존' });
  if (item.pet?.petFriendly) badges.push({ label: '🐕 반려견' });
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span key={b.label} className="text-[11px] px-2 py-0.5 rounded-full bg-tertiary-light text-tertiary font-medium">
          {b.label}
        </span>
      ))}
    </div>
  );
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${
        accent ? 'bg-accent-light text-accent' : 'bg-primary/10 text-primary'
      }`}
    >
      {children}
    </span>
  );
}

function Card({
  item,
  saved,
  onToggle,
  onOpen,
  showReason = true,
}: {
  item: CuratedContent;
  saved: boolean;
  onToggle: () => void;
  onOpen: () => void;
  showReason?: boolean;
}) {
  const { t } = useI18n();
  const g = GRADE_STYLE[item.matchGrade];
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <article onClick={onOpen} className="bg-white rounded-2xl overflow-hidden shadow-raised flex flex-col cursor-pointer active:scale-[0.99] transition-transform">
      <div className="relative w-full aspect-[16/10] bg-primary-light flex items-center justify-center text-6xl overflow-hidden">
        {/^https?:\/\//.test(item.image) ? (
          <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          item.image
        )}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md ${g.badge}`}>
          <Icon name={g.icon} className="text-[15px]" fill />
          {item.matchScore}점 {item.matchGrade === '적합' ? '태그 일치' : item.matchGrade === '높음' ? '취향 부합' : '참고'}
        </div>
        <button
          onClick={stop(onToggle)}
          aria-label={saved ? `${item.name} 담기 취소` : `${item.name} 담기`}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 ${
            saved ? 'text-accent' : 'text-muted'
          }`}
        >
          <Icon name="favorite" className="text-[20px]" fill={saved} />
        </button>
        {item.walkGuide?.available && (
          <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-ink/75 text-white text-[10px] backdrop-blur-sm flex items-center gap-1">
            <Icon name="self_improvement" className="text-[13px]" /> 토닥이 산책 {item.walkGuide.durationMin}분
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[17px] truncate">{item.name}</h3>
            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <Icon name="location_on" className="text-[14px]" />
              {item.region}
            </p>
          </div>
          {item.rating > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-light text-accent shrink-0">
              <Icon name="star" className="text-[16px]" fill />
              <span className="text-xs font-bold">{item.rating}</span>
              <span className="text-[10px] text-muted">({item.reviewCount})</span>
            </div>
          )}
        </div>

        <AccessBadges item={item} />

        {showReason && item.reasons.length > 0 && (
          <div className="bg-surface rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 text-primary">
              <Icon name="auto_awesome" className="text-[16px]" />
              <span className="text-[11px] font-bold">{t('home.reason')}</span>
            </div>
            <ul className="text-xs flex flex-col gap-1">
              {item.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(item.hashtags ?? []).map((h) => (
              <span key={h} className="px-2 py-0.5 rounded-md bg-surface-sub text-muted text-[11px]">
                {h}
              </span>
            ))}
          </div>
          <button
            onClick={stop(onToggle)}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
              saved ? 'bg-surface-sub text-primary' : 'bg-primary text-white'
            }`}
          >
            <Icon name={saved ? 'check_circle' : 'add'} className="text-[16px]" fill={saved} />
            {saved ? t('home.saved') : t('home.save')}
          </button>
        </div>
      </div>
    </article>
  );
}
