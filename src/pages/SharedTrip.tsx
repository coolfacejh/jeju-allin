import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeTrip } from '../lib/share';
import { rememberPlaces } from '../lib/places';
import { loadSavedIds, loadProfile } from '../lib/storage';
import { saveTrip } from '../lib/trip';
import { nightsLabel } from './Onboarding';
import { dateForDay, TRANSPORT_LABEL } from '../lib/schedule';
import { kakaoMapUrl } from '../lib/maps';

export default function SharedTrip() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const encoded = params.get('d') ?? '';
  const data = useMemo(() => decodeTrip(encoded), [encoded]);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  function importTrip() {
    if (!data) return;
    if (loadSavedIds().length && !confirm) { setConfirm(true); return; }
    const keys = ['jeju_place_snapshots_v1', 'jeju_trip_v2', 'jeju_saved_trip_ids', 'jeju_allin_profile'];
    const backup = new Map<string, string | null>();
    try {
      keys.forEach(key => backup.set(key, localStorage.getItem(key)));
      if (!rememberPlaces(data.places) || !saveTrip(data)) throw new Error();
      localStorage.setItem('jeju_saved_trip_ids', JSON.stringify(data.days.flat()));
      const profile = loadProfile();
      if (profile) localStorage.setItem('jeju_allin_profile', JSON.stringify({ ...profile, nights: data.nights, headcount: data.headcount }));
      navigate('/planner');
    } catch {
      backup.forEach((value, key) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* best effort rollback */ } });
      setError('저장하지 못했어요. 저장 공간을 확인한 뒤 다시 시도해 주세요.');
    }
  }

  if (!data || !data.places.length) return <main className="max-w-md mx-auto p-8 text-center">
    <h1 className="text-xl font-bold">공유 여행을 열 수 없어요</h1>
    <p className="my-4 text-sm">링크가 손상되었거나, 이전 링크에 장소 정보가 포함되지 않았습니다. 작성자에게 새 링크를 요청해 주세요.</p>
    <button onClick={() => navigate('/home')} className="underline">홈으로</button>
  </main>;

  return <div className="min-h-screen bg-surface text-ink pb-32">
    <header className="bg-primary text-white px-4 py-8"><div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold">함께 떠나요, 제주 여행</h1>
      <p className="mt-2">{nightsLabel(data.nights)} · {data.headcount}명 · {data.places.length}곳</p>
      {data.schedule && <p className="text-sm mt-2">{data.schedule.startDate || '시작일 미정'} · {TRANSPORT_LABEL[data.schedule.transport]} · 활동 {data.schedule.dayStart}~{data.schedule.dayEnd}</p>}
      <p className="text-xs mt-2">공유할 당시의 일정입니다. 장소 정보는 공유자가 전달했으며 운영 여부는 별도 확인이 필요합니다.</p>
    </div></header>
    <main className="max-w-md mx-auto p-4 flex flex-col gap-5">
      {data.days.map((ids, day) => <section key={day}>
        <h2 className="text-lg font-bold mb-2">{day + 1}일차 {dateForDay(data.schedule?.startDate, day)}</h2>
        {!ids.length && <p className="text-sm text-muted">자유 일정</p>}
        {ids.map((id, index) => { const p = data.places.find(place => place.id === id)!; return <article key={id} className="bg-white rounded-xl p-4 mb-2 shadow-card">
          <h3 className="font-bold">{index + 1}. {p.name}</h3>
          <a className="text-sm text-primary underline" href={kakaoMapUrl(p.name, p.lat, p.lng)} target="_blank" rel="noreferrer">{p.region || '지도에서 위치 보기'}</a>
          {data.schedule?.visits[id] && <p className="text-xs mt-2">직접 입력한 방문 시간: {data.schedule.visits[id].open || '미정'} ~ {data.schedule.visits[id].close || '미정'} · 체류 {data.schedule.visits[id].durationMin ?? '기본'}분</p>}
          {data.notes[id] && <p className="text-sm mt-2 whitespace-pre-wrap">메모: {data.notes[id]}</p>}
        </article>; })}
      </section>)}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {confirm && <div role="alert" className="p-4 bg-amber-50 rounded-xl text-sm">현재 보관함과 일정이 이 여행으로 바뀝니다. 기존 일정이 필요하면 먼저 공유 링크를 보관해 주세요.
        <button onClick={() => setConfirm(false)} className="block underline mt-2">취소</button>
      </div>}
    </main>
    <footer className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-line">
      <button onClick={importTrip} className="block max-w-md mx-auto w-full p-3 rounded-full bg-primary text-white font-bold">{confirm ? '현재 일정을 이 여행으로 바꾸기' : '이 일정을 내 여행으로 저장'}</button>
    </footer>
  </div>;
}
