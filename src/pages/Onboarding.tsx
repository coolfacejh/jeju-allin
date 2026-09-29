import { AccessCategoryIcon } from '../components/AccessPictograms';
import { saveExplore } from '../lib/explore';
import { ACCESS_LABELS, confirmedAccessDefault } from '../lib/access';
import type { AccessKey } from '../types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { saveProfile, loadProfile } from '../lib/storage';
import { useI18n, LangToggle } from '../i18n';
import type { TravelType, Companion, ThemeKey, PetSize } from '../types';

const TRAVEL_TYPES: { value: TravelType; icon: string; title: string; desc: string }[] = [
  { value: 'healing', icon: 'spa', title: '힐링 · 온전한 휴식', desc: '바다 멍때리기, 돌담 쉼표, 숲길 산책' },
  { value: 'activity', icon: 'surfing', title: '액티비티 · 이색 체험', desc: '서핑, ATV, 해안 승마, 요트 투어' },
  { value: 'luxury', icon: 'photo_camera', title: '감성 스테이 · 럭셔리', desc: '건축미 독채, 오션뷰 다이닝' },
  { value: 'workation', icon: 'laptop_mac', title: '워케이션 · 롱스테이', desc: '작업하기 좋은 카페, 로컬 살기' },
  { value: 'camping_family', icon: 'cabin', title: '자연 · 감성 캠핑', desc: '오름 백패킹, 글램핑, 별밤 불멍' },
];

const COMPANIONS: { value: Companion; icon: string; title: string; desc: string }[] = [
  { value: 'solo', icon: 'person', title: '혼자 떠나요', desc: '자유로운 나홀로 여행' },
  { value: 'couple', icon: 'favorite', title: '연인 · 부부', desc: '로맨틱 감성 투어' },
  { value: 'friends', icon: 'groups', title: '친구와 함께', desc: '인생샷 & 핫플레이스' },
  { value: 'family', icon: 'family_restroom', title: '소중한 가족과', desc: '편안하고 알찬 휴식' },
];

const THEMES: { value: ThemeKey; icon: string; label: string }[] = [
  { value: 'animal', icon: 'pets', label: '#동물교감' },
  { value: 'surf', icon: 'waves', label: '#서핑·해양' },
  { value: 'oreum', icon: 'landscape', label: '#중산간·오름' },
  { value: 'cafe', icon: 'local_cafe', label: '#감성카페' },
  { value: 'food', icon: 'restaurant', label: '#제주향토미식' },
  { value: 'camping', icon: 'outdoor_grill', label: '#캠핑·피크닉' },
  { value: 'trekking', icon: 'hiking', label: '#숲길·트레킹' },
  { value: 'sunset', icon: 'wb_twilight', label: '#일몰명소' },
  { value: 'market', icon: 'storefront', label: '#오일장·야시장' },
  { value: 'cultural', icon: 'museum', label: '#미술관·전시' },
];

export function nightsLabel(n: number): string {
  return n === 0 ? '당일치기' : `${n}박 ${n + 1}일`;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const existing = loadProfile();
  const [travelType, setTravelType] = useState<TravelType | null>(existing?.travelType ?? null);
  const [companion, setCompanion] = useState<Companion | null>(existing?.companion ?? null);
  const [hasChild, setHasChild] = useState<boolean>(existing?.hasChild ?? false);
  const [childAge, setChildAge] = useState<'infant' | 'preschool' | 'elementary'>(
    existing?.childAge ?? 'preschool',
  );
  const [hasSenior, setHasSenior] = useState<boolean>(existing?.hasSenior ?? false);
  const [themes, setThemes] = useState<ThemeKey[]>(existing?.themes ?? []);
  const [nights, setNights] = useState<number>(existing?.nights ?? 1);
  const [headcount, setHeadcount] = useState<number>(existing?.headcount ?? 2);
  const [required, setRequired] = useState<AccessKey[]>(existing?.access?.required ?? []);
  const [confirmedOnly, setConfirmedOnly] = useState(confirmedAccessDefault(existing?.access));
  const [barrierFree, setBarrierFree] = useState<boolean>(existing?.access?.barrierFree ?? false);
  const [strollerNeed, setStrollerNeed] = useState<boolean>(existing?.access?.stroller ?? false);
  const [avoidNoKids, setAvoidNoKids] = useState<boolean>(existing?.access?.avoidNoKids ?? false);
  const [food, setFood] = useState(
    existing?.foodPref ?? { halal: false, vegetarian: false, vegan: false, noSeafood: false, noPork: false },
  );
  const toggleFood = (k: keyof typeof food) => setFood((f) => ({ ...f, [k]: !f[k] }));
  const [withPet, setWithPet] = useState<boolean>(existing?.pet?.withPet ?? false);
  const [petSize, setPetSize] = useState<PetSize>(existing?.pet?.size ?? 'small');
  const [confirmReset, setConfirmReset] = useState(false);

  function resetAll() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setTravelType(null);
    setCompanion(null);
    setHasChild(false);
    setChildAge('preschool');
    setHasSenior(false);
    setThemes([]);
    setNights(1);
    setHeadcount(2);
    setRequired([]);
    setConfirmedOnly(true);
    setBarrierFree(false);
    setStrollerNeed(false);
    setAvoidNoKids(false);
    setFood({ halal: false, vegetarian: false, vegan: false, noSeafood: false, noPork: false });
    setWithPet(false);
    setPetSize('small');
    setConfirmReset(false);
  }

  const selected = [...new Set([...required,...(barrierFree||strollerNeed?['stepFree','route'] as AccessKey[]:[])])];
  const toggleRequired=(key:AccessKey)=>{setRequired(selected.includes(key)?selected.filter(k=>k!==key):[...selected,key]);setBarrierFree(false);setStrollerNeed(false);};

  function toggleTheme(t: ThemeKey) {
    setThemes((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 5) return prev;
      return [...prev, t];
    });
  }

  function submit() {

    saveProfile({
      travelType,
      companion,
      hasChild,
      childAge: hasChild ? childAge : undefined,
      hasSenior,
      themes,
      nights,
      headcount,
      access: { barrierFree, stroller: strollerNeed, avoidNoKids, required, confirmedOnly, filterVersion: 2 },
      foodPref: food,
      pet: { withPet, size: petSize },
      createdAt: new Date().toISOString(),
    });
    saveExplore({accessOn:true,confirmedOnly,filterVersion:2,scrollY:0,visibleCount:24});
    navigate('/home');
  }

  return (
    <main className="min-h-screen w-full app-shell mx-auto px-4 pb-10 bg-surface text-ink font-sans">
      <div className="flex justify-between items-center pt-3">
        <button
          onClick={resetAll}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all ${
            confirmReset ? 'bg-red-500 text-white shadow-sm' : 'bg-white shadow-card text-muted'
          }`}
        >
          <Icon name="restart_alt" className="text-[16px]" />
          {confirmReset ? '정말 초기화?' : '선택 조건 초기화'}
        </button>
        <LangToggle />
      </div>
      <header className="mt-4 mb-6 rounded-3xl bg-primary text-white px-5 py-6 md:px-10 md:py-10 relative overflow-hidden">
        <p className="text-sm font-bold tracking-wide text-white/90">JEJU ALL-IN · 제주 무장애 여행</p>
        <h1 className="text-[25px] md:text-4xl font-extrabold leading-tight mt-4 break-keep">내게 필요한 조건부터,<br />제주 여행을 시작하세요.</h1>
        <p className="text-sm md:text-base text-white/90 mt-4 leading-relaxed">출입구, 이동로, 화장실 정보를 확인하고<br className="md:hidden" /> 나와 동행자에게 맞는 여행을 준비하세요.</p>
        <div className="flex flex-wrap gap-2 mt-5 text-xs"><span className="border border-white/30 rounded-full px-3 py-2">시설 정보와 출처 확인</span><span className="border border-white/30 rounded-full px-3 py-2">주변 공중화장실 찾기</span><span className="border border-white/30 rounded-full px-3 py-2">내 여행 일정에 담기</span></div>
      </header>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
       <section aria-label="여행 접근성 조건" className="bg-white rounded-3xl border border-line p-5 md:p-6">
        <p className="text-primary text-xs font-bold">먼저, 편하게 여행할 수 있는 환경을 골라 주세요</p>
        <h2 className="text-xl md:text-2xl font-bold mt-2">어떤 환경이 필요한가요?</h2>
        <p className="text-sm text-sub mt-2 mb-5">본인과 동행자에게 필요한 조건을 모두 선택하세요. 선택 없이 둘러볼 수도 있습니다.</p>
        <div className="flex flex-wrap gap-2 mb-4"><button type="button" aria-pressed={barrierFree} onClick={()=>{setBarrierFree(v=>!v);}} className="border border-line rounded-full px-4 py-2 text-sm">♿ 휠체어 접근 {barrierFree?'✓':''}</button><button type="button" aria-pressed={strollerNeed} onClick={()=>setStrollerNeed(v=>!v)} className="border border-line rounded-full px-4 py-2 text-sm">유모차 진입 {strollerNeed?'✓':''}</button></div>
        <p className="text-xs text-muted mb-4">빠른 선택은 출입구·이동로 조건을 추가합니다. 아래에서 개별 변경할 수 있어요.</p>
        <div className="grid sm:grid-cols-2 gap-3">{(Object.keys(ACCESS_LABELS) as AccessKey[]).map(key=><button type="button" key={key} aria-pressed={selected.includes(key)} onClick={()=>toggleRequired(key)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left min-h-[92px] ${selected.includes(key)?'border-primary bg-primary-light':'border-line bg-white'}`}>
         <AccessCategoryIcon kind={key} state={selected.includes(key)?'available':'unknown'} /><span className="flex-1"><span className="block font-bold text-sm">{ACCESS_LABELS[key]}</span><span className="block text-xs text-sub mt-1">{{stepFree:'입구의 턱·계단 정보',ramp:'다른 진입 경로 정보',route:'실내 이동 공간 정보',restroom:'장애인 화장실 시설 정보',parking:'전용 주차구역 정보',elevator:'층간 이동 시설 정보'}[key]}</span></span><span aria-hidden="true" className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${selected.includes(key)?'bg-primary text-white border-primary':'border-line'}`}>{selected.includes(key)?'✓':''}</span>
        </button>)}</div>
        <fieldset className="mt-6 border-t border-line pt-4 space-y-3"><legend className="font-bold text-sm pt-5">정보가 부족한 장소도 보여드릴까요?</legend><label className="flex gap-3 text-sm"><input type="radio" name="accessEvidence" checked={!confirmedOnly} onChange={()=>setConfirmedOnly(false)} /><span>정보가 부족한 곳도 함께 보기<span className="block text-xs text-sub mt-1">미확인·조건부 장소를 포함합니다. 시설이 없다고 확인된 곳은 제외합니다.</span></span></label><label className="flex gap-3 text-sm"><input type="radio" name="accessEvidence" checked={confirmedOnly} onChange={()=>setConfirmedOnly(true)} /><span>선택 조건이 자료상 확인된 곳만 보기<span className="block text-xs text-sub mt-1">선택한 시설이 모두 ‘있음’인 장소만 표시합니다. 기본 검색 방식입니다.</span></span></label></fieldset>
        <p className="mt-4 text-xs text-muted leading-relaxed">아이콘은 원하는 조건을 뜻합니다. 자료상 시설 등록은 현장 이용 가능을 보장하지 않으므로 상세 설명과 이용 조건을 함께 확인하세요.</p>
       </section>
       <aside className="lg:sticky lg:top-4 rounded-3xl bg-white border border-line p-5 space-y-4" aria-label="선택 조건 요약"><p className="font-bold">이번 여행에서 확인할 조건</p><div className="flex flex-wrap gap-2" aria-live="polite">{selected.length?selected.map(k=><span key={k} className="bg-primary-light text-primary rounded-lg px-3 py-2 text-sm">{ACCESS_LABELS[k]}</span>):<p className="text-sm text-sub">아직 선택한 조건이 없어요.<br />먼저 장소를 둘러봐도 좋습니다.</p>}</div><p className="text-xs text-sub">{confirmedOnly?'선택 조건이 자료상 확인된 곳만':'정보가 부족한 장소도 함께 표시'}</p><button type="button" onClick={submit} className="hidden lg:block bg-primary text-white rounded-xl w-full py-4 font-bold">이 조건으로 장소 살펴보기 →</button><p className="text-xs text-muted">기간과 취향은 아래에서 추가할 수 있어요. 나중에 언제든 변경할 수 있습니다.</p></aside>
      </div>
      <details open className="mt-6 rounded-2xl border border-line bg-white p-5"><summary className="font-bold text-lg cursor-pointer">여행 기본정보 · 기간과 인원</summary><p className="text-sm text-sub my-3">일정을 위한 기본값은 {nightsLabel(nights)}, {headcount}명입니다. 필요할 때 변경하세요.</p>
      <div className="preferences-grid mt-4">

      {/* 여행 기간 · 인원 */}
      <section className="flex flex-col gap-3 mb-8 bg-white rounded-2xl shadow-card p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            <Icon name="event" className="text-[18px]" />
          </div>
          <h2 className="font-bold text-[16px]">{t('onb.period')}</h2>
        </div>

        {/* 몇 박 며칠 */}
        <div>
          <p className="text-xs text-muted mb-1.5">{t('onb.days')}</p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setNights(n)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${
                  nights === n ? 'bg-primary text-white' : 'bg-surface-sub text-sub'
                }`}
              >
                {nightsLabel(n)}
              </button>
            ))}
          </div>
        </div>

        {/* 인원수 */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-bold">{t('onb.people')}</p>
            <p className="text-xs text-muted">{t('onb.people.desc')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setHeadcount((v) => Math.max(1, v - 1))}
              className="w-9 h-9 rounded-full bg-surface-sub text-sub flex items-center justify-center active:scale-90 disabled:opacity-40"
              disabled={headcount <= 1}
              aria-label="인원 감소"
            >
              <Icon name="remove" className="text-[20px]" />
            </button>
            <span className="w-10 text-center font-bold text-[18px] text-primary">{headcount}명</span>
            <button
              onClick={() => setHeadcount((v) => Math.min(20, v + 1))}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center active:scale-90"
              aria-label="인원 증가"
            >
              <Icon name="add" className="text-[20px]" />
            </button>
          </div>
        </div>
      </section>

      {/* Q2 동행 */}
      <Section num="2" title={t('onb.q2')}>
        <div className="grid grid-cols-2 gap-2.5">
          {COMPANIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCompanion(c.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-white shadow-card text-center transition-all ${
                companion === c.value ? 'ring-2 ring-primary' : 'hover:shadow-raised'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  companion === c.value ? 'bg-primary text-white' : 'bg-surface-sub text-muted'
                }`}
              >
                <Icon name={c.icon} className="text-[24px]" />
              </div>
              <span className="font-bold text-sm">{c.title}</span>
              <span className="text-xs text-muted mt-0.5">{c.desc}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Q3 특별 케어 */}
      <Section num="3" title={t('onb.q3')}>
        <p className="text-xs text-muted mb-1">동행자 정보를 추가할 수 있습니다. 실제 이동 조건은 장소별 안내를 확인하세요.</p>
        <CareRow icon="child_friendly" label="아이 · 어린이 동반" desc="유모차 진입 · 키즈존 중심" checked={hasChild} onToggle={() => setHasChild((v) => !v)} />
        {hasChild && (
          <div className="flex gap-2 ml-1">
            {([
              ['infant', '영유아 (0~3세)'],
              ['preschool', '미취학 (4~7세)'],
              ['elementary', '초등 (8~13세)'],
            ] as ['infant' | 'preschool' | 'elementary', string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setChildAge(k)}
                className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95 ${
                  childAge === k ? 'bg-accent-light text-accent' : 'bg-surface-sub text-sub'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <CareRow icon="elderly" label="부모님 · 시니어 동반" desc="완만한 보행로 · 안락 동선" checked={hasSenior} onToggle={() => setHasSenior((v) => !v)} />
        <CareRow icon="block" label="노키즈존 제외" desc="아이 입장 가능한 곳만 추천" checked={avoidNoKids} onToggle={() => setAvoidNoKids((v) => !v)} />
      </Section>

      </div></details>
      <details open className="mt-4 rounded-2xl border border-line bg-white p-5"><summary className="font-bold text-lg cursor-pointer">여행 취향 더하기 · 선택사항</summary><p className="text-sm text-sub my-3">좋아하는 여행, 음식, 동반 반려동물과 관심 테마를 추가하세요.</p><div className="preferences-grid mt-4">
      {/* Q1 여행 유형 */}
      <Section num="1" title={t('onb.q1')}>
        <div className="grid grid-cols-1 gap-2.5">
          {TRAVEL_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTravelType(t.value)}
              className={`flex items-center gap-3.5 p-3.5 rounded-2xl bg-white shadow-card text-left transition-all ${
                travelType === t.value ? 'ring-2 ring-primary' : 'hover:shadow-raised'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  travelType === t.value ? 'bg-primary text-white' : 'bg-primary-light text-primary'
                }`}
              >
                <Icon name={t.icon} className="text-[24px]" />
              </div>
              <div>
                <div className="font-bold text-[15px]">{t.title}</div>
                <div className="text-xs text-muted">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* 식단 · 회피음식 */}
      <section className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high bg-primary-light text-primary text-[11px] font-bold">
            <Icon name="restaurant" className="text-[15px]" />
          </span>
          <h2 className="font-bold text-[17px]">{t('onb.food')}</h2>
          <span className="text-[10px] text-muted bg-surface-sub px-2 py-0.5 rounded-full">{t('onb.optional')}</span>
        </div>
        <p className="text-xs text-muted ml-8">{t('onb.food.desc')}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {([
            ['halal', '할랄'],
            ['vegetarian', '베지테리언'],
            ['vegan', '비건'],
            ['noSeafood', '해산물 제외'],
            ['noPork', '돼지고기 제외'],
          ] as [keyof typeof food, string][]).map(([k, label]) => {
            const on = food[k];
            return (
              <button
                key={k}
                onClick={() => toggleFood(k)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all active:scale-95 ${
                  on ? 'bg-accent text-white' : 'bg-white text-sub'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 반려견 동반 */}
      <section className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-light text-primary text-[11px] font-bold">
            <Icon name="pets" className="text-[15px]" />
          </span>
          <h2 className="font-bold text-[17px]">{t('onb.pet')}</h2>
          <span className="text-[10px] text-muted bg-surface-sub px-2 py-0.5 rounded-full">{t('onb.optional')}</span>
        </div>
        <p className="text-xs text-muted ml-8">{t('onb.pet.desc')}</p>
        <CareRow
          icon="pets"
          label={t('pet.with')}
          desc={t('onb.pet.desc')}
          checked={withPet}
          onToggle={() => setWithPet((v) => !v)}
        />
        {withPet && (
          <div className="flex gap-2 mt-1 ml-1">
            {(['small', 'medium', 'large'] as PetSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setPetSize(s)}
                className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-95 ${
                  petSize === s ? 'bg-primary text-white' : 'bg-surface-sub text-sub'
                }`}
              >
                {t(`pet.${s}`)}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Q4 테마 */}
      <Section num="4" title={t('onb.q4')} counter={`${themes.length} / 5`}>
        <p className="text-xs text-muted mb-1">최대 5개까지 골라보세요.</p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => {
            const on = themes.includes(t.value);
            return (
              <button
                key={t.value}
                onClick={() => toggleTheme(t.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all active:scale-95 ${
                  on ? 'bg-primary text-white' : 'bg-white text-sub'
                }`}
              >
                <Icon name={t.icon} className="text-[16px]" />
                {t.label}
              </button>
            );
          })}
        </div>
      </Section>

      </div></details>
      <p className="text-xs text-sub mt-5">접근성 정보는 장소 상세에서 출처와 확인 필요 항목을 함께 볼 수 있습니다. 선택한 조건은 이 브라우저에 저장됩니다.</p>
      <div className="sticky bottom-2 z-30 lg:hidden pt-3 mt-2">
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
    </main>
  );
}

function Section({
  num,
  title,
  required,
  counter,
  children,
}: {
  num: string;
  title: string;
  required?: boolean;
  counter?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className="flex flex-col gap-2 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold">
            {num}
          </span>
          <h2 className="font-bold text-[17px]">{title}</h2>
        </div>
        {required && (
          <span className="text-[10px] font-bold text-accent bg-accent-light px-2 py-0.5 rounded-full">{t('onb.required')}</span>
        )}
        {counter && (
          <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full">{counter}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function CareRow({
  icon,
  label,
  desc,
  checked,
  onToggle,
}: {
  icon: string;
  label: string;
  desc: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={checked}
      onClick={onToggle}
      className="flex items-center justify-between p-3.5 rounded-2xl bg-white shadow-card mt-1 text-left transition-all hover:shadow-raised w-full"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent">
          <Icon name={icon} className="text-[22px]" />
        </div>
        <div>
          <div className="font-bold text-sm">{label}</div>
          <div className="text-xs text-muted">{desc}</div>
        </div>
      </div>
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
          checked ? 'bg-accent text-white' : 'bg-surface-sub text-transparent'
        }`}
      >
        <Icon name="check" className="text-[16px]" />
      </div>
    </button>
  );
}
