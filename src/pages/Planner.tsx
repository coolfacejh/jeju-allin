import { AllinPlanGreeting } from '../components/AllinMascot';
import PlaceText from '../components/PlaceText';
import Localize from '../components/Localize';
import { resolvePlaces } from '../lib/places';
import RouteMap from '../components/RouteMap';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import ScheduleForm from '../components/ScheduleForm';
import { DEFAULT_SCHEDULE, dateForDay, type VisitWindow } from '../lib/schedule';
import { currentTrip, makeTrip, saveTrip, saveTripSelection } from '../lib/trip';
import { loadProfile, saveProfile, loadSavedIds } from '../lib/storage';
import { scheduleDay, orderRoute, recommendDays, lodgingLast, previousLodging } from '../lib/planner';
import { nightsLabel } from './Onboarding';
import { kakaoRouteUrl } from '../lib/maps';
import { buildTripText, shareUrl, doShare } from '../lib/share';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import SpeakButton from '../components/SpeakButton';
import type { Content } from '../types';

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  stay: { emoji: '🏡', label: '숙소' },
  food: { emoji: '🍊', label: '미식' },
  activity: { emoji: '🌊', label: '액티비티' },
};

// 도착 시각(HH:MM) → 추천 시간대 라벨
function band(hhmm: string): { label: string; icon: string } {
  if (hhmm === '확인 필요') return { label: '시간 확인 필요', icon: 'help' };
  if (hhmm.startsWith('+')) return { label: '다음 날로 초과', icon: 'warning' };
  const h = parseInt(hhmm.slice(0, 2), 10);
  if (h < 12) return { label: '오전', icon: 'wb_sunny' };
  if (h < 14) return { label: '점심', icon: 'lunch_dining' };
  if (h < 17) return { label: '오후', icon: 'wb_cloudy' };
  if (h < 20) return { label: '저녁', icon: 'dinner_dining' };
  return { label: '밤', icon: 'bedtime' };
}

function stayLabel(item: Content, duration?: number): string {
  const m = duration ?? item.avgStayMinutes ?? (item.contentType === 'food' ? 60 : 90);
  if (item.contentType === 'stay') return '체크인·휴식';
  if (m >= 60) return `약 ${Math.round((m / 60) * 10) / 10}시간 체류`;
  return `약 ${m}분 체류`;
}

// 대략 경비(1인) 추정 — 입장·식사 근사치
function estimateCost(items: Content[]): number {
  let sum = 0;
  for (const c of items) {
    if (c.contentType === 'food') sum += c.menu?.[0]?.price ?? 13000;
    else if (c.contentType === 'activity') sum += 20000;
    // 숙소는 1인 경비 추정에서 제외(숙박비 별도)
    if (c.pet?.fee) sum += c.pet.fee;
  }
  return sum;
}

export default function Planner() {
  const navigate = useNavigate();
  const location=useLocation();
  const [initial] = useState(()=>{
    const trip=currentTrip();
    if(!location.state?.smartRoute)return trip;
    const schedule={...(trip.schedule??DEFAULT_SCHEDULE),mealAware:true};
    return makeTrip(recommendDays(trip.places,trip.nights+1,schedule),trip.nights,trip.headcount,trip.notes,schedule);
  });
  useEffect(()=>{if(location.state?.smartRoute)navigate(location.pathname,{replace:true,state:null});},[]);
  const [headcount,setHeadcount]=useState(initial.headcount);
  const profile = { nights: initial.nights, headcount };
  const days = initial.nights + 1;
  const [buckets, setBuckets] = useState<Content[][]>(() => initial.days.map(d => d.map(id => initial.places.find(p => p.id === id)!)).map(lodgingLast));
  const items = buckets.flat();
  const [removed, setRemoved] = useState<{ item: Content; day: number; index: number; savedIndex: number } | null>(null);
  const [day, setDay] = useState(0);
  const { show, node: toast } = useToast();
  const { t } = useI18n();
  const [notes, setNotes] = useState(initial.notes);
  const [settings, setSettings] = useState(() => initial.schedule ?? { ...DEFAULT_SCHEDULE, visits: {} });
  function setVisit(id: number, patch: VisitWindow) {
    setSettings(previous => ({ ...previous, visits: { ...previous.visits, [id]: { ...previous.visits[id], ...patch } } }));
  }
  const [saveFailed, setSaveFailed] = useState(false);
  const [beforeRegroup,setBeforeRegroup]=useState<Content[][]|null>(null);
  const missing = loadSavedIds().filter(id => !resolvePlaces([id]).length).length;
  useEffect(() => {
    setSaveFailed(!saveTrip(makeTrip(buckets, profile.nights, profile.headcount, notes, settings)));
  }, [buckets, notes, settings, profile.nights, profile.headcount]);

  function excludePlace(id: number) {
    const sourceDay = buckets.findIndex(bucket => bucket.some(place => place.id === id));
    if (sourceDay < 0) return;
    const index = buckets[sourceDay].findIndex(place => place.id === id);
    const item = buckets[sourceDay][index];
    const ids = loadSavedIds();
    const next = buckets.map(bucket => bucket.filter(place => place.id !== id));
    if (!saveTripSelection(makeTrip(next, profile.nights, profile.headcount, notes, settings), ids.filter(saved => saved !== id))) {
      show('제외하지 못했어요. 저장 공간을 확인해 주세요.'); return;
    }
    setRemoved({ item, day: sourceDay, index, savedIndex: ids.indexOf(id) });
    setBuckets(next);
  }

  function undoExclude() {
    if (!removed) return;
    const next = buckets.map(bucket => bucket.filter(place => place.id !== removed.item.id));
    next[removed.day].splice(removed.index, 0, removed.item);
    const ids = loadSavedIds().filter(id => id !== removed.item.id);
    ids.splice(Math.max(0, removed.savedIndex), 0, removed.item.id);
    if (!saveTripSelection(makeTrip(next, profile.nights, profile.headcount, notes, settings), ids)) {
      show('되돌리지 못했어요. 저장 공간을 확인해 주세요.'); return;
    }
    setBuckets(next); setDay(removed.day); setRemoved(null);
  }

  function moveDay(id: number, target: number) {
    setBuckets(previous => {
      const place = previous.flat().find(p => p.id === id);
      if (!place) return previous;
      const next = previous.map(d => d.filter(p => p.id !== id));
      next[target].push(place);
      next[target]=lodgingLast(next[target]);
      return next;
    });
  }

  async function share() {
    const ordered = buckets.flat();
    if (ordered.length === 0) return;
    const nights = profile?.nights ?? 0;
    const headcount = profile?.headcount ?? 1;
    try {
      const url = shareUrl(makeTrip(buckets, nights, headcount, notes, settings));
      const text = buildTripText(ordered, nightsLabel(nights), headcount, url);
      const res = await doShare('제주올인 추천 동선', text);
      if (res === 'cancelled') return;
      show(res === 'shared' ? '공유했어요' : res === 'copied' ? '동선 정보가 복사되었어요' : '공유에 실패했어요');
    } catch (error) { show(error instanceof Error ? error.message : '공유에 실패했어요'); }
  }

  const dayItems = buckets[day] ?? [];
  const origin=previousLodging(buckets,day);
  const plan = useMemo(() => scheduleDay(dayItems, settings, day, initial.nights,origin), [dayItems, settings, day, initial.nights,origin]);
  const totalH = Math.floor(plan.totalTravelMin / 60);
  const totalM = plan.totalTravelMin % 60;

  function spokenRoute(): string {
    const head = days > 1 ? `${day + 1}일차 동선.` : '오늘의 동선.';
    const lines = plan.stops.map((s, i) => {
      const leg = s.legFromPrev ? s.legFromPrev.minutes === null ? ' 이동시간 확인 필요.' : ` 이동 약 ${s.legFromPrev.minutes}분.` : '';
      return `${leg} ${i + 1 + (origin ? 1 : 0)}. ${s.item.name}, ${s.item.region}, ${band(s.arrive).label}, ${stayLabel(s.item, settings.visits[s.item.id]?.durationMin)}.`;
    });
    return head + (origin ? `1. ${origin.name}, ${settings.dayStart} 숙소 출발. ` : '') + lines.join('');
  }

  function move(idx: number, dir: -1 | 1) {
    setBuckets((prev) => {
      const next = prev.map((b) => b.slice());
      const arr = next[day];
      const j = idx + dir;
      if (j < 0 || j >= arr.length || arr[idx].contentType==='stay' || arr[j].contentType==='stay') return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return next;
    });
  }

  return (
    <Localize><div className="planner-page min-h-screen bg-surface font-sans text-ink">
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="app-shell mx-auto h-16 px-4 flex items-center gap-2">
          <button
            onClick={() => navigate('/my-trip')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary active:scale-95"
            aria-label="뒤로"
          >
            <Icon name="arrow_back" className="text-[22px]" />
          </button>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Smart Route</span>
            <span className="font-bold text-[17px]">{t('pl.title')}</span>
          </div>
          {items.length >= 1 && (
            <div className="ml-auto flex items-center gap-2">
              <SpeakButton getText={spokenRoute} />
              <button
                onClick={share}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white shadow-card text-primary text-xs font-bold active:scale-95"
              >
                <Icon name="ios_share" className="text-[16px]" />
                {t('mt.share')}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-shell mx-auto pt-16 pb-16 px-4 flex flex-col gap-5">
        {removed && <div role="status" className="mt-4 rounded-xl bg-primary-light p-4 text-sm flex items-center justify-between gap-3">
          <span>{removed.item.name}을(를) 일정과 보관함에서 제외했어요.</span>
          <button type="button" onClick={undoExclude} className="shrink-0 font-bold text-primary underline p-2">되돌리기</button>
        </div>}
        {saveFailed && <p role="alert" className="mt-4 text-sm text-red-700">일정을 저장하지 못했어요. 입력값 범위와 브라우저 저장 공간을 확인해 주세요.</p>}
        {missing > 0 && <p role="alert" className="mt-4 text-sm text-amber-800">기존에 담은 {missing}곳의 정보를 찾을 수 없어요. 보관함에서 확인해 주세요.</p>}
        {items.length < 1 ? (
          <EmptyState onGo={() => navigate('/home')} />
        ) : (
          <>
            <label className="text-sm font-bold">여행 인원<select aria-label="여행 인원" className="ml-3 border border-line rounded-xl p-2" value={headcount} onChange={e=>{const n=Number(e.target.value);setHeadcount(n);const p=loadProfile();if(p)saveProfile({...p,headcount:n});}}>{Array.from({length:100},(_,i)=><option key={i+1} value={i+1}>{i+1}명</option>)}</select></label>
            <ScheduleForm value={settings} onChange={next=>{setSettings(next);const p=loadProfile();if(p)saveProfile({...p,startDate:next.startDate});}} />
            <div className="rounded-xl bg-primary-light p-4 text-sm space-y-2">
              <p>스마트루트: 숙소는 마지막, 다음 날은 전날 숙소에서 출발 · 점심 12~14시 · 저녁 18~20시. 카페는 식사와 구분합니다. 이동시간은 추정치이며 영업시간은 별도 확인이 필요합니다.</p>
              <button type="button" className="block font-bold underline text-primary" onClick={()=>{const next={...settings,mealAware:true};setBeforeRegroup(buckets);setSettings(next);setBuckets(recommendDays(items,days,next));setDay(0);show('날짜별 장소를 가까운 권역끼리 다시 묶었어요. 메모와 방문 설정은 유지했습니다.');}}>권역별로 날짜까지 다시 추천</button>
              {beforeRegroup&&<button type="button" className="block text-primary underline" onClick={()=>{setBuckets(beforeRegroup);setBeforeRegroup(null);setDay(0);}}>날짜 재배정 되돌리기</button>}
              <p className="text-xs text-sub">동·서부를 오간다면 위 버튼으로 날짜 배정까지 바꿔 주세요. 아래 버튼은 현재 날짜 안의 순서만 바꿉니다.</p>
              <button type="button" className="font-bold underline text-primary" onClick={()=>{const next={...settings,mealAware:true};setSettings(next);setBuckets(prev=>prev.map((b,i)=>orderRoute(b,next,i,profile.nights,previousLodging(prev,i))));show('날짜와 메모는 유지하고 숙소·식사 시간 기준으로 재정렬했어요.');}}>숙소·식사 시간 기준으로 다시 추천</button>
            </div>
            {/* 요약 */}
            <AllinPlanGreeting />
            <section className="mt-4 rounded-2xl bg-gradient-to-br from-primary-dark to-primary text-white p-5 shadow-raised">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon name="auto_awesome" className="text-[18px]" />
                <span className="text-xs font-bold uppercase tracking-wide">거리 기준 일정 초안</span>
              </div>
              <p className="text-sm text-white/85 mb-1">
                담아둔 {items.length}곳을 {profile ? nightsLabel(profile.nights ?? 0) : ''} 일정에 맞춰 배치했어요.
              </p>
              {profile && (
                <p className="text-xs text-white/70 mb-3">
                  {nightsLabel(profile.nights ?? 0)} · {profile.headcount ?? 2}명 기준
                </p>
              )}
              <p className="text-xs text-white/85 mb-3">입력한 방문 시간과 여유시간을 반영합니다. 이동은 직선거리 추정이며 실제 도로·교통상황·영업시간은 자동 조회하지 않습니다.</p>
              <div className="flex gap-2">
                <Stat icon="pin_drop" value={`${dayItems.length + (origin ? 1 : 0)}곳`} label={days > 1 ? `${day + 1}일차` : '방문지'} />
                <Stat icon="alt_route" value={`${plan.totalKm}km`} label="확인된 직선거리 합" />
                <Stat icon="schedule" value={!plan.complete ? '확인 필요' : totalH > 0 ? `${totalH}시간 ${totalM}분` : `${totalM}분`} label="추정 이동시간" />
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-white/85">
                <Icon name="payments" className="text-[15px]" />
                예상 경비(1인) 약 {estimateCost(dayItems).toLocaleString()}원
                <span className="text-white/60">· 입장·식사 추정, 숙박 별도</span>
              </div>
            </section>

            <p className="text-sm text-primary font-bold">{dateForDay(settings.startDate, day) || `${day + 1}일차`} · 일정 종료 한도 {plan.deadline}</p>
            {plan.warnings.length > 0 && <section role="alert" className="p-4 bg-amber-50 text-amber-900 rounded-xl text-sm">
              <h2 className="font-bold mb-2">일정 조정이 필요해요</h2>
              <ul className="list-disc pl-4 space-y-2">{plan.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>
            </section>}
            {/* 날짜 탭 */}
            {days > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {buckets.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => setDay(i)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      day === i ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted'
                    }`}
                  >
                    {i + 1}일차 {dateForDay(settings.startDate, i).slice(5)} <span className="opacity-70">· {b.length + (previousLodging(buckets,i) ? 1 : 0)}곳</span>
                  </button>
                ))}
              </div>
            )}

            <div className="planner-columns">
            <div className="planner-map">
            {/* 미니 지도 */}
            {(dayItems.length > 0 || origin) && <RouteMap stops={dayItems} origin={origin} />}

            </div>
            <div className="min-w-0">
            {origin&&<article className="flex gap-3 mb-3" data-lodging-origin={origin.id} aria-label="1번 일정 · 전날 숙소에서 출발">
              <div className="flex flex-col items-center"><span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span><div className="w-0.5 flex-1 bg-line my-1" /></div>
              <div className="flex-1 bg-white rounded-2xl shadow-card p-4"><p className="text-xs text-primary font-bold mb-3">첫 일정 · 숙소 출발</p><div className="flex items-center gap-3">{/^https?:/.test(origin.image)&&<img src={origin.image} alt="" className="w-12 h-12 rounded-xl object-cover" />}<div><h3 className="font-bold"><PlaceText place={origin} field="name" /></h3><p className="text-xs text-muted"><PlaceText place={origin} field="region" /></p></div></div><p className="text-primary font-bold text-sm mt-3">{settings.dayStart} 출발</p><p className="text-xs text-sub mt-2">전날 마지막 숙소에서 출발합니다. 다음 장소까지의 이동시간을 일정에 포함합니다.</p></div>
            </article>}
            {/* 타임라인 (수동 재정렬) */}
            {dayItems.length === 0 ? (
              <p className="text-center text-sm text-muted py-8">이 날은 아직 비어 있어요.</p>
            ) : (
              <section className="flex flex-col">
                {plan.stops.map((s, i) => (
                  <div key={s.item.id}>
                    {s.legFromPrev && (
                      <div className="flex items-center gap-2 pl-6 py-1 text-muted">
                        <Icon name="directions_car" className="text-[16px]" />
                        <span className="text-[11px]">
                          {s.legFromPrev.minutes === null ? '이동시간 확인 필요' : `이동 약 ${s.legFromPrev.minutes}분`} · {s.legFromPrev.km === null ? '좌표 없음' : `직선 ${s.legFromPrev.km}km`}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1 + (origin ? 1 : 0)}
                        </div>
                        {i < plan.stops.length - 1 && <div className="w-0.5 flex-1 bg-line my-1" />}
                      </div>
                      <div className="flex-1 mb-3 bg-white rounded-2xl shadow-card p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold flex items-center gap-0.5">
                              <Icon name={band(s.arrive).icon} className="text-[13px]" />
                              {band(s.arrive).label}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-sub text-muted">
                              {TYPE_META[s.item.contentType].emoji} {TYPE_META[s.item.contentType].label}
                            </span>
                            <span className="text-[11px] text-muted">· {stayLabel(s.item, settings.visits[s.item.id]?.durationMin)}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* 순서 조정 */}
                            <button
                              onClick={() => move(i, -1)}
                              disabled={i === 0 || s.item.contentType==='stay'}
                              className="w-7 h-7 rounded-full bg-surface-sub text-sub flex items-center justify-center active:scale-90 disabled:opacity-30"
                              aria-label="위로"
                            >
                              <span aria-hidden="true">↑</span>
                            </button>
                            <button
                              onClick={() => move(i, 1)}
                              disabled={i === plan.stops.length - 1 || s.item.contentType==='stay' || plan.stops[i+1]?.item.contentType==='stay'}
                              className="w-7 h-7 rounded-full bg-surface-sub text-sub flex items-center justify-center active:scale-90 disabled:opacity-30"
                              aria-label="아래로"
                            >
                              <span aria-hidden="true">↓</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-2xl shrink-0">
                            {/^https?:/.test(s.item.image) ? <img src={s.item.image} alt={s.item.name} className="w-full h-full object-cover rounded-xl" /> : s.item.image}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-[15px] truncate"><PlaceText place={s.item} field="name" /></h3>
                            <a
                              href={kakaoRouteUrl(s.item.name, s.item.lat, s.item.lng)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-muted flex items-center gap-1 mt-0.5 truncate hover:text-primary w-fit"
                            >
                              <Icon name="location_on" className="text-[13px]" />
                              <PlaceText place={s.item} field="region" />
                              <Icon name="directions" className="text-[13px] text-primary" />
                            </a>
                          </div>
                        </div>
                        {s.item.walkGuide?.available && (
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-primary bg-primary-light rounded-lg px-2 py-1 w-fit">
                            <Icon name="self_improvement" className="text-[14px]" />
                            토닥이 산책 {s.item.walkGuide.durationMin}분 포함
                          </div>
                        )}
                        {days > 1 && <label className="flex items-center gap-2 text-xs mt-3">방문 날짜
                          <select aria-label={`${s.item.name} 방문 날짜`} value={day} onChange={e => moveDay(s.item.id, Number(e.target.value))} className="p-2 rounded-lg border border-line">
                            {buckets.map((_, index) => <option key={index} value={index}>{index + 1}일차</option>)}
                          </select>
                        </label>}
                        <button type="button" aria-label={`${s.item.name} 일정에서 제외`} onClick={() => excludePlace(s.item.id)} className="mt-3 min-h-10 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50">
                          일정에서 제외
                        </button>
                        <p className="text-xs text-primary font-bold mt-3">예상 방문 {s.arrive} ~ {s.depart}</p>
                        {!!s.waitMin && <p className="text-xs text-sub">식사·방문 가능 시간까지 여유·대기 {s.waitMin}분 포함</p>}
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-primary py-2">직접 확인한 방문 시간 · 체류시간</summary>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <label>방문 가능 시작<input aria-label={`${s.item.name} 방문 가능 시작`} type="time" value={settings.visits[s.item.id]?.open ?? ''} onChange={e => setVisit(s.item.id, { open: e.target.value })} className="w-full min-w-0 p-2 border border-line rounded-lg" /></label>
                            <label>방문 가능 마감<input aria-label={`${s.item.name} 방문 가능 마감`} type="time" value={settings.visits[s.item.id]?.close ?? ''} onChange={e => setVisit(s.item.id, { close: e.target.value })} className="w-full min-w-0 p-2 border border-line rounded-lg" /></label>
                            <label className="col-span-2">체류시간(분)<input aria-label={`${s.item.name} 체류시간`} type="number" min="1" max="1440" placeholder="기본값 사용" value={settings.visits[s.item.id]?.durationMin ?? ''} onChange={e => setVisit(s.item.id, { durationMin: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full p-2 border border-line rounded-lg" /></label>
                          </div>
                          <p className="text-muted mt-2">운영시간·휴무·예약 여부를 직접 확인해 입력해 주세요. 입력하지 않은 장소의 영업 여부는 판단하지 않습니다.</p>
                        </details>
                        <input
                          aria-label={`${s.item.name} 메모`}
                          maxLength={500}
                          value={notes[s.item.id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNotes((n) => ({ ...n, [s.item.id]: v }));

                          }}
                          placeholder="＋ 메모 (예약시간, 준비물…)"
                          className="w-full mt-2 text-xs px-2.5 py-2 rounded-lg bg-surface border border-line outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            </div>
            </div>
            <p className="text-[11px] text-muted text-center px-4">
              * 이동시간은 직선거리 기준 근사치입니다. ▲▼로 순서를 바꾸면 시간이 다시 계산됩니다.
            </p>
          </>
        )}
      </main>
      {toast}
    </div></Localize>
  );
}

function EmptyState({ onGo }: { onGo: () => void }) {
  return (
    <Localize><div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white shadow-card gap-2 mt-6">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary">
        <Icon name="alt_route" className="text-[32px]" />
      </div>
      <h3 className="font-bold text-[17px]">동선을 만들려면 장소를 담아주세요</h3>
      <p className="text-xs text-muted max-w-[260px]">
        큐레이션에서 마음에 드는 장소를 담으면 이동 순서를 자동으로 짜드려요.
      </p>
      <button onClick={onGo} className="mt-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm active:scale-95">
        장소 담으러 가기
      </button>
    </div></Localize>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <Localize><div className="flex-1 rounded-xl bg-white/15 px-3 py-2 flex flex-col">
      <Icon name={icon} className="text-[18px] mb-0.5" />
      <span className="font-bold text-sm leading-tight">{value}</span>
      <span className="text-[10px] text-white/70">{label}</span>
    </div></Localize>
  );
}
