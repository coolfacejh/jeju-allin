import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import BottomNav from '../components/BottomNav';
import { resolvePlaces } from '../lib/places';
import { currentTrip } from '../lib/trip';
import { loadSavedIds, saveSavedIds } from '../lib/storage';
import { buildTripText, shareUrl, doShare } from '../lib/share';
import { nightsLabel } from './Onboarding';
import { useToast } from '../components/Toast';
import { useI18n } from '../i18n';
import type { ContentType } from '../types';

const FILTERS: { key: 'all' | ContentType; label: string }[] = [
  { key: 'all', label: '전체보기' },
  { key: 'stay', label: '🏡 숙소' },
  { key: 'food', label: '🍊 미식' },
  { key: 'activity', label: '🌊 액티비티' },
];

export default function MyTrip() {
  const navigate = useNavigate();
  const [ids, setIds] = useState<number[]>(() => loadSavedIds());
  const [filter, setFilter] = useState<'all' | ContentType>('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const { show, node: toast } = useToast();
  const { t } = useI18n();

  async function share() {
    if (items.length === 0) return;
    const trip = currentTrip();
    const nights = trip.nights;
    const headcount = trip.headcount;
    try {
      const url = shareUrl(trip);
      const text = buildTripText(items, nightsLabel(nights), headcount, url);
      const res = await doShare('제주올인 추천 여행', text);
      if (res === 'cancelled') return;
      show(res === 'shared' ? '공유했어요' : res === 'copied' ? '여행 정보가 복사되었어요' : '공유에 실패했어요');
    } catch (error) { show(error instanceof Error ? error.message : '공유에 실패했어요'); }
  }

  const items = useMemo(() => resolvePlaces(ids), [ids]);
  const missing = ids.filter(id => !items.some(p => p.id === id));
  const visible = items.filter((c) => filter === 'all' || c.contentType === filter);

  function remove(id: number) {
    setIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (!saveSavedIds(next)) { show('보관함 변경을 저장하지 못했어요.'); return prev; }
      return next;
    });
  }

  function clearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (!saveSavedIds([])) { show('보관함 변경을 저장하지 못했어요.'); return; }
    setIds([]);
    setConfirmClear(false);
    show('담은 목록을 모두 비웠어요');
  }

  const count = (k: 'all' | ContentType) =>
    k === 'all' ? items.length : items.filter((c) => c.contentType === k).length;

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <main className="app-shell mx-auto pt-6 pb-28 px-4 flex flex-col gap-6">
        {missing.length > 0 && <div role="alert" className="p-4 rounded-xl bg-amber-50 text-sm">
          기존에 담은 {missing.length}곳은 정보가 없거나 샘플 목록에서 제외된 장소입니다.
          <button className="block underline mt-2" onClick={() => { const next = ids.filter(id => !missing.includes(id)); if (saveSavedIds(next)) setIds(next); else show('보관함 변경을 저장하지 못했어요.'); }}>찾을 수 없는 장소를 보관함에서 제거</button>
        </div>}

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-bold">{t('mt.title')}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                총 {items.length}곳
              </span>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAll}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all ${
                    confirmClear ? 'bg-red-500 text-white shadow-sm' : 'bg-white shadow-card text-muted'
                  }`}
                >
                  <Icon name={confirmClear ? 'delete_forever' : 'delete_sweep'} className="text-[16px]" />
                  {confirmClear ? '정말 비우기?' : '전체 비우기'}
                </button>
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
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white shadow-card text-muted">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="verified_user" className="text-[18px]" fill />
            </div>
            <p className="text-xs leading-snug">
              취향에 맞게 담아둔 장소들입니다. <span className="text-primary font-medium">이 브라우저에 보관</span>되고 있어요.
            </p>
          </div>
        </section>

        {/* 동선 만들기 — 상단 노출 CTA */}
        {items.length > 0 && (
          <button
            onClick={() => items.length >= 1 && navigate('/planner')}
            disabled={items.length < 1}
            className={`flex items-center justify-between gap-2 rounded-2xl p-4 shadow-raised transition-all active:scale-[0.99] ${
              items.length >= 1 ? 'bg-gradient-to-br from-primary-dark to-primary text-white' : 'bg-white text-muted'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${items.length >= 1 ? 'bg-white/20 text-white' : 'bg-surface-sub text-muted'}`}>
                <Icon name="alt_route" className="text-[22px]" />
              </div>
              <div>
                <div className="font-bold text-[15px]">{t('mt.route')}</div>
                <div className={`text-xs ${items.length >= 1 ? 'text-white/80' : 'text-muted'}`}>
                  {items.length >= 1 ? `담은 ${items.length}곳으로 날짜별 일정 만들기` : '장소를 담으면 일정을 만들 수 있어요'}
                </div>
              </div>
            </div>
            <Icon name="arrow_forward" className="text-[20px] shrink-0" />
          </button>
        )}

        {items.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                  filter === f.key ? 'bg-primary text-white shadow-sm' : 'bg-white text-muted'
                }`}
              >
                {f.label}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                    filter === f.key ? 'bg-white/20 text-white' : 'bg-surface-sub text-muted'
                  }`}
                >
                  {count(f.key)}
                </span>
              </button>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white shadow-card gap-2 mt-2">
            <div className="w-20 h-20 rounded-full bg-accent-light flex items-center justify-center text-accent mb-1">
              <Icon name="favorite" className="text-[40px]" />
            </div>
            <h3 className="font-bold text-[17px]">아직 담은 여행지가 없어요</h3>
            <p className="text-xs text-muted max-w-[260px]">
              취향 큐레이션에서 하트를 눌러 나만의 제주 핫플레이스를 모아보세요.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="mt-2 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-md active:scale-95"
            >
              <Icon name="explore" className="text-[18px]" /> 취향 큐레이션 보러가기
            </button>
          </div>
        ) : (
          <section className="place-grid">
            {visible.map((c) => (
              <article key={c.id} onClick={() => navigate(`/place/${c.id}`)} className="rounded-2xl bg-white overflow-hidden shadow-raised cursor-pointer active:scale-[0.99] transition-transform">
                <div className="relative w-full h-40 bg-primary-light flex items-center justify-center text-5xl overflow-hidden">
                  {/^https?:\/\//.test(c.image) ? (
                    <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    c.image
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold">
                    {c.rating > 0 ? `${c.rating}★ · ` : ''}{c.contentType === 'stay' ? '숙소' : c.contentType === 'food' ? '미식' : '액티비티'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md text-muted hover:text-red-500 flex items-center justify-center active:scale-90"
                    aria-label="담기 취소"
                  >
                    <Icon name="close" className="text-[18px]" />
                  </button>
                  <div className="absolute bottom-3 right-3 text-white text-[11px] flex items-center gap-1 drop-shadow">
                    <Icon name="location_on" className="text-[14px]" /> {c.region}
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="font-bold text-[17px]">{c.name}</h3>
                  <p className="text-xs text-sub">{c.desc}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(c.hashtags ?? []).map((h) => (
                      <span key={h} className="px-2 py-0.5 rounded-full bg-surface-sub text-muted text-[11px]">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            {/* 스마트 루트 안내 (상세) */}
            <section className="grid-span-all rounded-2xl bg-surface-sub p-4 flex items-start gap-3">
              <Icon name="auto_awesome" className="text-primary text-[20px] shrink-0 mt-0.5" />
              <p className="text-xs text-sub leading-relaxed">
                숙소를 기준으로 이동시간이 가장 짧은 순서의 하루 코스를 만들어 드려요. 여러 날 일정은 날짜별로 자동 분배됩니다. 위의
                <strong className="text-primary"> ‘AI 스마트 루트 만들기’</strong>를 눌러보세요.
              </p>
            </section>
          </section>
        )}
      </main>

      <BottomNav savedCount={items.length} />
      {toast}
    </div>
  );
}
