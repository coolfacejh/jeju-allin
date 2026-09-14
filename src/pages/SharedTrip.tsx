import { useSearchParams, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { CONTENTS } from '../data/contents';
import { decodeTrip } from '../lib/share';
import { loadSavedIds, saveSavedIds } from '../lib/storage';
import { nightsLabel } from './Onboarding';
import { kakaoMapUrl } from '../lib/maps';

const TYPE_EMOJI: Record<string, string> = { stay: '🏡', food: '🍊', activity: '🌊' };

export default function SharedTrip() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = decodeTrip(params.get('d') ?? '');
  const items = data ? CONTENTS.filter((c) => data.ids.includes(c.id)) : [];

  function importTrip() {
    if (!data) return;
    const merged = Array.from(new Set([...loadSavedIds(), ...data.ids]));
    saveSavedIds(merged);
    navigate('/my-trip');
  }

  if (!data || items.length === 0) {
    return (
      <div className="min-h-screen bg-surface font-sans flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="link_off" className="text-[40px] text-muted" />
        <p className="font-bold">공유 링크를 열 수 없어요</p>
        <button onClick={() => navigate('/home')} className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-sm">
          큐레이션 보러가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink pb-24">
      <header className="bg-gradient-to-br from-primary-dark to-primary text-white px-4 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-light">🍊 Jeju All-In</span>
          <h1 className="text-[22px] font-extrabold mt-1">함께 떠나요, 제주 여행</h1>
          <p className="text-sm text-white/85 mt-1">
            {nightsLabel(data.nights)} · {data.headcount}명 · 총 {items.length}곳
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-3 flex flex-col gap-3">
        {items.map((c, i) => (
          <article key={c.id} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center text-2xl shrink-0">
              {c.image}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-sub text-muted">{TYPE_EMOJI[c.contentType]}</span>
                <h3 className="font-bold text-[15px] truncate">{c.name}</h3>
              </div>
              <a href={kakaoMapUrl(c.name, c.lat, c.lng)} target="_blank" rel="noreferrer" className="text-xs text-muted flex items-center gap-1 mt-0.5 hover:text-primary w-fit">
                <Icon name="location_on" className="text-[13px]" />
                {c.region}
              </a>
            </div>
            <span className="text-xs text-muted shrink-0">{i + 1}</span>
          </article>
        ))}
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-md border-t border-line">
        <div className="max-w-md mx-auto px-4 py-3">
          <button onClick={importTrip} className="w-full h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-1.5 active:scale-95">
            <Icon name="bookmark_add" className="text-[20px]" />
            내 보관함에 담기
          </button>
        </div>
      </div>
    </div>
  );
}
