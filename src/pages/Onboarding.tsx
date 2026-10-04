import Localize from '../components/Localize';
import JejuBrand from '../components/JejuBrand';
import JejuJourney from '../components/JejuJourney';
import { AccessCategoryIcon } from '../components/AccessPictograms';
import { saveExplore } from '../lib/explore';
import { ACCESS_LABELS, confirmedAccessDefault } from '../lib/access';
import type { AccessKey } from '../types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { saveProfile, loadProfile } from '../lib/storage';
import { useI18n, LangToggle } from '../i18n';
import { validDate, dateForDay } from '../lib/schedule';
import { loadTrip, saveTrip } from '../lib/trip';
import { DEFAULT_SCHEDULE } from '../lib/schedule';
import { saveWish } from '../lib/storage';

export function nightsLabel(n: number): string {
  return n === 0 ? '당일치기' : `${n}박 ${n + 1}일`;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const existing = loadProfile();
  const [nights,setNights]=useState(existing?.nights ?? 1);
  const [startDate,setStartDate]=useState(existing?.startDate ?? '');
  const [error,setError]=useState('');
  const [required, setRequired] = useState<AccessKey[]>(existing?.access?.required ?? []);
  const [confirmedOnly, setConfirmedOnly] = useState(confirmedAccessDefault(existing?.access));
  const [barrierFree, setBarrierFree] = useState<boolean>(existing?.access?.barrierFree ?? false);
  const [strollerNeed, setStrollerNeed] = useState<boolean>(existing?.access?.stroller ?? false);
  const [confirmReset, setConfirmReset] = useState(false);

  function resetAll() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setNights(1);
    setStartDate('');
    setError('');
    setRequired([]);
    setConfirmedOnly(true);
    setBarrierFree(false);
    setStrollerNeed(false);
    setConfirmReset(false);
  }

  const selected = [...new Set([...required,...(barrierFree||strollerNeed?['stepFree','route'] as AccessKey[]:[])])];
  const toggleRequired=(key:AccessKey)=>{setRequired(selected.includes(key)?selected.filter(k=>k!==key):[...selected,key]);setBarrierFree(false);setStrollerNeed(false);};

  function submit() {
    if(!validDate(startDate)){setError('올바른 여행 시작일을 입력해 주세요.');return;}
    const profile={travelType:null,companion:null,hasChild:false,hasSenior:false,themes:[],
      startDate:startDate||undefined,nights,headcount:existing?.headcount??2,
      access:{barrierFree,stroller:strollerNeed,avoidNoKids:false,required,confirmedOnly,filterVersion:2},createdAt:new Date().toISOString()};
    saveProfile(profile);
    if(loadProfile()?.createdAt!==profile.createdAt){setError('조건을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');return;}
    const trip=loadTrip();
    if(trip)saveTrip({...trip,schedule:{...(trip.schedule??DEFAULT_SCHEDULE),startDate:startDate||undefined}});
    saveWish('');
    saveExplore({tab:'all',sub:'all',region:'all',mapOnlyBF:false,accessOn:true,confirmedOnly,filterVersion:2,scrollY:0,visibleCount:24});
    navigate('/home');
  }

  return (
    <Localize><main className="onboarding-page min-h-screen w-full app-shell mx-auto px-4 pb-10 bg-surface text-ink font-sans">
      <div className="onboarding-brandbar"><JejuBrand /><LangToggle /></div>
      <div className="onboarding-tools">
        <button
          onClick={resetAll}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all ${
            confirmReset ? 'bg-red-500 text-white shadow-sm' : 'bg-white shadow-card text-muted'
          }`}
        >
          <Icon name="restart_alt" className="text-[16px]" />
          {confirmReset ? '정말 초기화?' : '선택 조건 초기화'}
        </button>
      </div>
      <JejuJourney intro />
      <div className="journey-steps" aria-label="여행 준비 순서"><span className="is-current"><b>1</b> 여행 조건</span><i /><span><b>2</b> 장소 탐색</span><i /><span><b>3</b> 일정 완성</span></div>
      <section aria-label="여행 일정" className="travel-panel date-panel rounded-2xl bg-white p-5 md:p-6 mb-6">
        <p className="text-primary text-xs font-bold">01 · 여행 일정</p><h2 className="text-xl font-bold mt-2">언제, 얼마나 머무르나요?</h2>
        <div className="flex flex-wrap items-end gap-4 mt-4">
          <label className="text-sm font-bold">여행 시작일<input aria-label="여행 시작일" type="date" min="2000-01-01" max="2100-11-30" value={startDate} onChange={e=>setStartDate(e.target.value)} className="block border border-line rounded-xl p-3 mt-2" /></label>
          <button type="button" onClick={()=>setStartDate('')} aria-pressed={!startDate} className="p-3 rounded-xl bg-surface-sub text-sm">날짜 미정{!startDate?' ✓':''}</button>
          <label className="text-sm font-bold">여행 기간<select aria-label="여행 기간" value={nights} onChange={e=>setNights(Number(e.target.value))} className="block border border-line rounded-xl p-3 mt-2">{Array.from({length:31},(_,n)=><option key={n} value={n}>{nightsLabel(n)}</option>)}</select></label>
        </div>
        <p className="text-sm text-primary mt-4">{startDate&&validDate(startDate)?`${startDate} ~ ${dateForDay(startDate,nights)}`:`날짜 미정 · ${nightsLabel(nights)}`}</p>
        <p className="text-xs text-sub mt-2">날짜를 정하면 여행 기간과 겹치는 행사만 표시합니다. 날짜 미정이면 오늘 기준 종료된 행사를 제외합니다. 개최 기간이 확인되지 않은 행사도 제외합니다.</p>
      </section>
      {error&&<p role="alert" className="text-red-700 p-3">{error}</p>}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
       <section aria-label="여행 접근성 조건" className="travel-panel access-panel bg-white rounded-2xl p-5 md:p-6">
        <p className="text-primary text-xs font-bold">02 · 필요한 접근성 조건</p>
        <h2 className="text-xl md:text-2xl font-bold mt-2">어떤 환경이 필요한가요?</h2>
        <p className="text-sm text-sub mt-2 mb-5">본인과 동행자에게 필요한 조건을 모두 선택하세요. 선택 없이 둘러볼 수도 있습니다.</p>
        <div className="flex flex-wrap gap-2 mb-4"><button type="button" aria-pressed={barrierFree} onClick={()=>{setBarrierFree(v=>!v);}} className="border border-line rounded-full px-4 py-2 text-sm">♿ 휠체어 접근 {barrierFree?'✓':''}</button><button type="button" aria-pressed={strollerNeed} onClick={()=>setStrollerNeed(v=>!v)} className="border border-line rounded-full px-4 py-2 text-sm">유모차 진입 {strollerNeed?'✓':''}</button></div>
        <p className="text-xs text-muted mb-4">빠른 선택은 출입구·이동로 조건을 추가합니다. 아래에서 개별 변경할 수 있어요.</p>
        <div className="grid sm:grid-cols-2 gap-3">{(Object.keys(ACCESS_LABELS) as AccessKey[]).map(key=><button type="button" key={key} aria-pressed={selected.includes(key)} onClick={()=>toggleRequired(key)} className={`access-choice flex items-center gap-3 p-4 rounded-2xl border-2 text-left min-h-[92px] ${selected.includes(key)?'border-primary bg-primary-light':'border-line bg-white'}`}>
         <AccessCategoryIcon kind={key} state={selected.includes(key)?'available':'unknown'} /><span className="flex-1"><span className="block font-bold text-sm">{ACCESS_LABELS[key]}</span><span className="block text-xs text-sub mt-1">{{stepFree:'입구의 턱·계단 정보',ramp:'다른 진입 경로 정보',route:'실내 이동 공간 정보',restroom:'장애인 화장실 시설 정보',parking:'전용 주차구역 정보',elevator:'층간 이동 시설 정보'}[key]}</span></span><span aria-hidden="true" className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${selected.includes(key)?'bg-primary text-white border-primary':'border-line'}`}>{selected.includes(key)?'✓':''}</span>
        </button>)}</div>
        <fieldset className="mt-6 border-t border-line pt-4 space-y-3"><legend className="font-bold text-sm pt-5">정보가 부족한 장소도 보여드릴까요?</legend><label className="flex gap-3 text-sm"><input type="radio" name="accessEvidence" checked={!confirmedOnly} onChange={()=>setConfirmedOnly(false)} /><span>정보가 부족한 곳도 함께 보기<span className="block text-xs text-sub mt-1">미확인·조건부 장소를 포함합니다. 시설이 없다고 확인된 곳은 제외합니다.</span></span></label><label className="flex gap-3 text-sm"><input type="radio" name="accessEvidence" checked={confirmedOnly} onChange={()=>setConfirmedOnly(true)} /><span>선택 조건이 자료상 확인된 곳만 보기<span className="block text-xs text-sub mt-1">선택한 시설이 모두 ‘있음’인 장소만 표시합니다. 기본 검색 방식입니다.</span></span></label></fieldset>
        <p className="mt-4 text-xs text-muted leading-relaxed">아이콘은 원하는 조건을 뜻합니다. 자료상 시설 등록은 현장 이용 가능을 보장하지 않으므로 상세 설명과 이용 조건을 함께 확인하세요.</p>
       </section>
       <aside className="trip-summary lg:sticky lg:top-4 rounded-2xl bg-white p-5 space-y-4" aria-label="선택 조건 요약"><p className="font-bold">이번 여행에서 확인할 조건</p><div className="flex flex-wrap gap-2" aria-live="polite">{selected.length?selected.map(k=><span key={k} className="bg-primary-light text-primary rounded-lg px-3 py-2 text-sm">{ACCESS_LABELS[k]}</span>):<p className="text-sm text-sub">아직 선택한 조건이 없어요.<br />먼저 장소를 둘러봐도 좋습니다.</p>}</div><p className="text-xs text-sub">{confirmedOnly?'선택 조건이 자료상 확인된 곳만':'정보가 부족한 장소도 함께 표시'}</p><button type="button" onClick={submit} className="hidden lg:block bg-primary text-white rounded-xl w-full py-4 font-bold">이 조건으로 장소 살펴보기 →</button><p className="text-xs text-muted">관심 테마는 다음 화면에서 결과를 보며 고를 수 있어요. 인원은 일정 화면에서 변경합니다.</p></aside>
      </div>
      <p className="text-xs text-sub mt-5">접근성 정보는 장소 상세에서 출처와 확인 필요 항목을 함께 볼 수 있습니다. 선택한 조건은 이 브라우저에 저장됩니다.</p>
      <div className="onboarding-submit sticky bottom-0 z-30 lg:hidden pt-3 mt-2">
        <button
          onClick={submit}

          className={`w-full h-14 rounded-full flex items-center justify-center gap-2 font-bold text-[16px] shadow-raised transition-all active:scale-95 bg-primary text-white`}
        >
          이 조건으로 장소 살펴보기
          <Icon name="arrow_forward" className="text-[20px]" />
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-muted">
          <Icon name="lock" className="text-[14px]" />
          <span className="text-[11px]">{t('onb.trust')}</span>
        </div>
      </div>
    </main></Localize>
  );
}
