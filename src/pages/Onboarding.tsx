import { ACCESS_LABELS } from '../lib/access';
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
  const [confirmedOnly, setConfirmedOnly] = useState(existing?.access?.confirmedOnly ?? false);
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
    setConfirmedOnly(false);
    setBarrierFree(false);
    setStrollerNeed(false);
    setAvoidNoKids(false);
    setFood({ halal: false, vegetarian: false, vegan: false, noSeafood: false, noPork: false });
    setWithPet(false);
    setPetSize('small');
    setConfirmReset(false);
  }

  const valid = travelType !== null && companion !== null;
  let pct = 25;
  if (travelType) pct += 35;
  if (companion) pct += 30;
  if (themes.length > 0) pct += 10;

  function toggleTheme(t: ThemeKey) {
    setThemes((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 5) return prev;
      return [...prev, t];
    });
  }

  function submit() {
    if (!valid) return;
    saveProfile({
      travelType: travelType!,
      companion: companion!,
      hasChild,
      childAge: hasChild ? childAge : undefined,
      hasSenior,
      themes,
      nights,
      headcount,
      access: { barrierFree, stroller: strollerNeed, avoidNoKids, required, confirmedOnly },
      foodPref: food,
      pet: { withPet, size: petSize },
      createdAt: new Date().toISOString(),
    });
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
          {confirmReset ? '정말 초기화?' : '취향 초기화'}
        </button>
        <LangToggle />
      </div>
      {/* 헤더 */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-primary-light shadow-card mb-5 mt-3">
        <div className="h-40 w-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-white text-5xl">
          🌊🍊
        </div>
        <div className="absolute top-3 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm">
          <Icon name="spa" className="text-accent text-[16px]" fill />
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            Jeju Taste Journey
          </span>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className={`h-1.5 flex-1 rounded-full ${travelType ? 'bg-primary' : 'bg-line'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${themes.length ? 'bg-primary' : 'bg-line'}`} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary">{t('onb.progress')}</span>
          <span className="text-xs text-muted">{Math.min(pct, 100)}% {t('onb.done')}</span>
        </div>
        <h1 className="text-[26px] leading-8 font-extrabold mt-1">
          {t('onb.title1')}<br />
          <span className="text-primary">{t('onb.title2')}</span>
        </h1>
        <p className="text-sm text-sub mt-1.5">{t('onb.sub')}</p>
      </div>

      <div className="preferences-grid">
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

      {/* Q1 여행 유형 */}
      <Section num="1" title={t('onb.q1')} required>
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

      {/* Q2 동행 */}
      <Section num="2" title={t('onb.q2')} required>
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
        <p className="text-xs text-muted mb-1">동선 난이도와 편의시설(유모차, 무장애길)을 배려해 드립니다.</p>
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
        <div className="flex items-center gap-1.5 mt-3 mb-1 text-primary">
          <Icon name="accessible" className="text-[16px]" />
          <span className="text-xs font-bold">{t('onb.mobility')}</span>
        </div>
        <CareRow icon="accessible" label="무장애 · 휠체어 접근" desc="출입구와 내부 이동로 정보를 우선 확인합니다" checked={barrierFree} onToggle={() => setBarrierFree((v) => !v)} />
        <CareRow icon="stroller" label="유모차 진입 필요" desc="단차와 내부 이동로 정보를 확인합니다" checked={strollerNeed} onToggle={() => setStrollerNeed((v) => !v)} />
        <fieldset className="mt-3 rounded-xl bg-white p-3">
          <legend className="text-sm font-bold">꼭 필요한 접근성 조건</legend>
          <div className="grid grid-cols-2 gap-3">{(Object.keys(ACCESS_LABELS) as AccessKey[]).map(key=><label key={key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={required.includes(key)} onChange={()=>setRequired(v=>v.includes(key)?v.filter(k=>k!==key):[...v,key])}/>{ACCESS_LABELS[key]}</label>)}</div>
          <label className="flex items-center gap-2 text-xs mt-4"><input type="checkbox" checked={confirmedOnly} onChange={e=>setConfirmedOnly(e.target.checked)}/>필수 조건이 확인된 곳만 표시</label>
          <p className="text-xs text-muted mt-2">기본 설정에서는 정보가 부족한 장소도 ‘확인 필요’로 표시합니다.</p>
        </fieldset>
        <CareRow icon="block" label="노키즈존 제외" desc="아이 입장 가능한 곳만 추천" checked={avoidNoKids} onToggle={() => setAvoidNoKids((v) => !v)} />
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

      </div>
      <div className="p-4 rounded-2xl bg-primary-light flex items-start gap-3 mt-4">
        <Icon name="auto_awesome" className="text-primary text-[20px] shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-primary">제주올인 AI 큐레이터 팁</div>
          <p className="text-xs text-sub mt-0.5">
            취향 데이터는 광고·협찬 없이 오직 매칭 지수만으로 계산되어, 숨은 비경까지 안내합니다.
          </p>
        </div>
      </div>

      <div className="sticky bottom-2 z-30 pt-3 mt-2">
        <button
          onClick={submit}
          disabled={!valid}
          className={`w-full h-14 rounded-full flex items-center justify-center gap-2 font-bold text-[16px] shadow-raised transition-all active:scale-95 ${
            valid ? 'bg-primary text-white' : 'bg-primary/40 text-white cursor-not-allowed'
          }`}
        >
          {t('onb.cta')}
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
