import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { CONTENTS } from '../data/contents';
import { loadSavedIds, loadProfile, loadPlanNotes, savePlanNote } from '../lib/storage';
import { orderRoute, chunkIntoDays, scheduleDay } from '../lib/planner';
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
  const h = parseInt(hhmm.slice(0, 2), 10);
  if (h < 12) return { label: '오전', icon: 'wb_sunny' };
  if (h < 14) return { label: '점심', icon: 'lunch_dining' };
  if (h < 17) return { label: '오후', icon: 'wb_cloudy' };
  if (h < 20) return { label: '저녁', icon: 'dinner_dining' };
  return { label: '밤', icon: 'bedtime' };
}

function stayLabel(item: Content): string {
  const m = item.avgStayMinutes ?? (item.contentType === 'food' ? 60 : 90);
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
  const ids = loadSavedIds();
  const profile = loadProfile();
  const items = useMemo(() => CONTENTS.filter((c) => ids.includes(c.id)), [ids]);
  const days = Math.max(1, (profile?.nights ?? 0) + 1);

  // 날짜별 버킷(순서 포함)을 상태로 관리 → 수동 재정렬 가능
  const [buckets, setBuckets] = useState<Content[][]>(() =>
    chunkIntoDays(orderRoute(items), days),
  );
  const [day, setDay] = useState(0);
  const { show, node: toast } = useToast();
  const { t } = useI18n();
  const [notes, setNotes] = useState<Record<string, string>>(() => loadPlanNotes());

  async function share() {
    const ordered = buckets.flat();
    if (ordered.length === 0) return;
    const nights = profile?.nights ?? 0;
    const headcount = profile?.headcount ?? 1;
    const url = shareUrl(ordered.map((c) => c.id), nights, headcount);
    const text = buildTripText(ordered, nightsLabel(nights), headcount, url);
    const res = await doShare('제주올인 추천 동선', text);
    show(res === 'shared' ? '공유했어요' : res === 'copied' ? '동선 정보가 복사되었어요' : '공유에 실패했어요');
  }

  const dayItems = buckets[day] ?? [];
  const plan = useMemo(() => scheduleDay(dayItems), [dayItems]);
  const totalH = Math.floor(plan.totalTravelMin / 60);
  const totalM = plan.totalTravelMin % 60;

  function spokenRoute(): string {
    const head = days > 1 ? `${day + 1}일차 동선.` : '오늘의 동선.';
    const lines = plan.stops.map((s, i) => {
      const leg = s.legFromPrev ? ` 이동 약 ${s.legFromPrev.minutes}분.` : '';
      return `${leg} ${i + 1}. ${s.item.name}, ${s.item.region}, ${band(s.arrive).label}, ${stayLabel(s.item)}.`;
    });
    return head + lines.join('');
  }

  function move(idx: number, dir: -1 | 1) {
    setBuckets((prev) => {
      const next = prev.map((b) => b.slice());
      const arr = next[day];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center gap-2">
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
          {items.length >= 2 && (
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

      <main className="max-w-md mx-auto pt-16 pb-16 px-4 flex flex-col gap-5">
        {items.length < 2 ? (
          <EmptyState onGo={() => navigate('/home')} />
        ) : (
          <>
            {/* 요약 */}
            <section className="mt-4 rounded-2xl bg-gradient-to-br from-primary-dark to-primary text-white p-5 shadow-raised">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon name="auto_awesome" className="text-[18px]" />
                <span className="text-xs font-bold uppercase tracking-wide">AI 추천 동선</span>
              </div>
              <p className="text-sm text-white/85 mb-1">
                담아둔 {items.length}곳을 {profile ? nightsLabel(profile.nights ?? 0) : ''} 일정에 맞춰 배치했어요.
              </p>
              {profile && (
                <p className="text-xs text-white/70 mb-3">
                  {nightsLabel(profile.nights ?? 0)} · {profile.headcount ?? 2}명 기준
                </p>
              )}
              <div className="flex gap-2">
                <Stat icon="pin_drop" value={`${dayItems.length}곳`} label={days > 1 ? `${day + 1}일차` : '방문지'} />
                <Stat icon="alt_route" value={`${plan.totalKm}km`} label="총 이동" />
                <Stat icon="schedule" value={totalH > 0 ? `${totalH}시간 ${totalM}분` : `${totalM}분`} label="이동시간" />
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-white/85">
                <Icon name="payments" className="text-[15px]" />
                예상 경비(1인) 약 {estimateCost(dayItems).toLocaleString()}원
                <span className="text-white/60">· 입장·식사 추정, 숙박 별도</span>
              </div>
            </section>

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
                    {i + 1}일차 <span className="opacity-70">· {b.length}곳</span>
                  </button>
                ))}
              </div>
            )}

            {/* 미니 지도 */}
            {dayItems.length > 0 && <MiniMap stops={dayItems} />}

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
                          이동 약 {s.legFromPrev.minutes}분 · {s.legFromPrev.km}km
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
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
                            <span className="text-[11px] text-muted">· {stayLabel(s.item)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* 순서 조정 */}
                            <button
                              onClick={() => move(i, -1)}
                              disabled={i === 0}
                              className="w-7 h-7 rounded-full bg-surface-sub text-sub flex items-center justify-center active:scale-90 disabled:opacity-30"
                              aria-label="위로"
                            >
                              <Icon name="keyboard_arrow_up" className="text-[18px]" />
                            </button>
                            <button
                              onClick={() => move(i, 1)}
                              disabled={i === plan.stops.length - 1}
                              className="w-7 h-7 rounded-full bg-surface-sub text-sub flex items-center justify-center active:scale-90 disabled:opacity-30"
                              aria-label="아래로"
                            >
                              <Icon name="keyboard_arrow_down" className="text-[18px]" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-2xl shrink-0">
                            {s.item.image}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-[15px] truncate">{s.item.name}</h3>
                            <a
                              href={kakaoRouteUrl(s.item.name, s.item.lat, s.item.lng)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-muted flex items-center gap-1 mt-0.5 truncate hover:text-primary w-fit"
                            >
                              <Icon name="location_on" className="text-[13px]" />
                              {s.item.region}
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
                        <input
                          value={notes[s.item.id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNotes((n) => ({ ...n, [s.item.id]: v }));
                            savePlanNote(s.item.id, v);
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

            <p className="text-[11px] text-muted text-center px-4">
              * 이동시간은 직선거리 기준 근사치입니다. ▲▼로 순서를 바꾸면 시간이 다시 계산됩니다.
            </p>
          </>
        )}
      </main>
      {toast}
    </div>
  );
}

function MiniMap({ stops }: { stops: Content[] }) {
  const pts = stops.filter((s) => s.lat != null && s.lng != null);
  if (pts.length === 0) return null;
  const W = 300, H = 170, PAD = 24;
  const lats = pts.map((p) => p.lat!);
  const lngs = pts.map((p) => p.lng!);
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  // 단일 지점/직선 방지용 최소 폭
  if (maxLat - minLat < 0.02) { minLat -= 0.02; maxLat += 0.02; }
  if (maxLng - minLng < 0.02) { minLng -= 0.02; maxLng += 0.02; }
  const x = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng)) * (W - 2 * PAD);
  const y = (lat: number) => PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - 2 * PAD); // 위도 위쪽이 북
  const coords = pts.map((p) => ({ cx: x(p.lng!), cy: y(p.lat!) }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.cx.toFixed(1)} ${c.cy.toFixed(1)}`).join(' ');

  return (
    <div className="bg-white rounded-2xl shadow-card p-3">
      <div className="flex items-center gap-1 mb-2 text-primary">
        <Icon name="map" className="text-[16px]" />
        <span className="text-[11px] font-bold">이동 경로 미리보기</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-primary-light/40">
        <path d={path} fill="none" stroke="#0A6E6D" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r="11" fill="#0A6E6D" />
            <text x={c.cx} y={c.cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-muted mt-1 text-center">위치를 단순화한 개념도입니다(실제 지도 아님).</p>
    </div>
  );
}

function EmptyState({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white shadow-card gap-2 mt-6">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary">
        <Icon name="alt_route" className="text-[32px]" />
      </div>
      <h3 className="font-bold text-[17px]">동선을 만들려면 2곳 이상 담아주세요</h3>
      <p className="text-xs text-muted max-w-[260px]">
        큐레이션에서 마음에 드는 장소를 담으면 이동 순서를 자동으로 짜드려요.
      </p>
      <button onClick={onGo} className="mt-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm active:scale-95">
        장소 담으러 가기
      </button>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 flex flex-col">
      <Icon name={icon} className="text-[18px] mb-0.5" />
      <span className="font-bold text-sm leading-tight">{value}</span>
      <span className="text-[10px] text-white/70">{label}</span>
    </div>
  );
}
