import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { loadReasonsOn, saveReasonsOn, loadEvents, clearEvents } from '../lib/storage';
import { useToast } from '../components/Toast';

export default function Lab() {
  const navigate = useNavigate();
  const { show, node: toast } = useToast();
  const [reasonsOn, setReasonsOn] = useState(loadReasonsOn());
  const [tick, setTick] = useState(0); // 리렌더용

  const events = loadEvents();
  const saves = events.filter((e) => e.type === 'save');

  function stat(on: boolean) {
    const g = saves.filter((e) => e.reasonsOn === on);
    const withMs = g.filter((e) => typeof e.ms === 'number');
    const avg = withMs.length
      ? withMs.reduce((s, e) => s + (e.ms as number), 0) / withMs.length / 1000
      : 0;
    return { count: g.length, avg };
  }
  const on = stat(true);
  const off = stat(false);

  function toggleReasons() {
    const v = !reasonsOn;
    setReasonsOn(v);
    saveReasonsOn(v);
  }

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(events, null, 2));
      show('로그가 복사되었어요');
    } catch {
      show('복사에 실패했어요');
    }
  }

  function reset() {
    clearEvents();
    setTick((n) => n + 1);
    show('로그를 초기화했어요');
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-ink pb-10" key={tick}>
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-line">
        <div className="app-shell mx-auto h-16 px-4 flex items-center gap-2">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary active:scale-95"
            aria-label="뒤로"
          >
            <Icon name="arrow_back" className="text-[22px]" />
          </button>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Experiment</span>
            <span className="font-bold text-[17px]">추천 검증 실험실</span>
          </div>
        </div>
      </header>

      <main className="app-shell mx-auto pt-16 px-4 flex flex-col gap-4">
        <p className="text-sm text-sub mt-4">
          가설: <strong className="text-primary">“추천 이유가 있을 때 사용자가 더 빠르고 자신 있게 장소를 고른다.”</strong>
          아래 스위치로 이유 표시를 켜고/끄며 큐레이션을 사용해 보세요. 담기까지 걸린 시간이 자동 기록됩니다.
        </p>

        {/* 이유 표시 토글 */}
        <button
          onClick={toggleReasons}
          className={`flex items-center justify-between rounded-2xl p-4 shadow-card transition-all active:scale-[0.99] ${
            reasonsOn ? 'bg-primary text-white' : 'bg-white text-ink'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" className="text-[20px]" />
            <div className="text-left">
              <div className="font-bold text-[15px]">추천 이유 표시</div>
              <div className={`text-xs ${reasonsOn ? 'text-white/80' : 'text-muted'}`}>
                {reasonsOn ? '카드에 ‘왜 추천’ 이유를 보여줍니다' : '이유 없이 장소만 보여줍니다 (대조군)'}
              </div>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${reasonsOn ? 'bg-white/20' : 'bg-surface-sub'}`}>
            {reasonsOn ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 결과 비교 */}
        <div className="grid grid-cols-2 gap-3">
          <ResultCard title="이유 ON" count={on.count} avg={on.avg} highlight />
          <ResultCard title="이유 OFF" count={off.count} avg={off.avg} />
        </div>

        {on.count > 0 && off.count > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-4 text-sm">
            <div className="flex items-center gap-1.5 text-primary font-bold mb-1">
              <Icon name="insights" className="text-[18px]" /> 관찰
            </div>
            <p className="text-sub">
              이유 ON일 때 평균 선택 시간이{' '}
              <strong className={on.avg <= off.avg ? 'text-primary' : 'text-accent'}>
                {off.avg > 0 ? Math.round(((off.avg - on.avg) / off.avg) * 100) : 0}%
              </strong>{' '}
              {on.avg <= off.avg ? '더 짧습니다.' : '더 깁니다.'} (표본 ON {on.count} · OFF {off.count})
            </p>
            <p className="text-[11px] text-muted mt-1">* 표본이 쌓일수록 신뢰도가 올라갑니다.</p>
          </div>
        )}

        {/* 로그 관리 */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="text-xs text-muted mb-2">기록된 이벤트 {events.length}개 (담기 {saves.length}회)</div>
          <div className="flex gap-2">
            <button onClick={copyLog} className="flex-1 py-2.5 rounded-full bg-surface-sub text-primary text-sm font-bold active:scale-95">
              로그 복사(JSON)
            </button>
            <button onClick={reset} className="flex-1 py-2.5 rounded-full bg-surface-sub text-accent text-sm font-bold active:scale-95">
              초기화
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted text-center px-2">
          측정 지표: 피드 진입 후 ‘일정에 담기’까지 걸린 시간(초)과 담은 횟수. 이유 ON/OFF별로 비교합니다.
        </p>
      </main>
      {toast}
    </div>
  );
}

function ResultCard({ title, count, avg, highlight }: { title: string; count: number; avg: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-card ${highlight ? 'bg-primary-light' : 'bg-white'}`}>
      <div className="text-xs font-bold text-muted mb-1">{title}</div>
      <div className="text-[22px] font-extrabold text-primary leading-none">
        {avg > 0 ? `${avg.toFixed(1)}초` : '—'}
      </div>
      <div className="text-[11px] text-muted mt-1">평균 선택 시간</div>
      <div className="text-xs text-sub mt-2">담기 {count}회</div>
    </div>
  );
}
