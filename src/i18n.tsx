import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'ko' | 'en';
const KEY = 'jeju_lang';

function load(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

type Dict = Record<string, string>;

const ko: Dict = {
  'nav.curation': '큐레이션',
  'nav.mytrip': '내 여행',
  'nav.taste': '취향 설정',
  // Home
  'home.feed': '큐레이션 피드',
  'home.profile': '내 여행 취향 프로필',
  'home.reset': '취향 재설정',
  'home.clean.title': '100% 광고·협찬 없는 클린 추천',
  'home.clean.desc': '실제 평판 데이터와 취향 매칭 지수만으로 계산되었습니다.',
  'home.wish.title': '직접 하고 싶은 것',
  'home.wish.ph': '예) 흑돼지, 일몰, 아이랑 물놀이, 감성카페…',
  'home.wish.found': '관련 장소를 찾았어요',
  'home.access.only': '접근성 맞는 곳만 보기',
  'home.food.only': '식단 맞는 곳만 보기',
  'home.reason': '왜 이 여행자에게 추천하나요?',
  'home.save': '일정에 담기',
  'home.saved': '담기 완료',
  'tab.all': '전체보기',
  'tab.stay': '머무를 곳',
  'tab.activity': '즐길 거리',
  'tab.food': '제주의 맛',
  'sec.stay': '🏡 머무를 곳',
  'sec.activity': '🌊 즐길 거리',
  'sec.food': '🍊 제주의 맛',
  'empty.cat': '조건에 맞는 장소를 찾지 못했어요.',
  // Onboarding
  'onb.progress': '1분 취향 프로필',
  'onb.done': '완료',
  'onb.title1': '나만의 제주 여행',
  'onb.title2': '취향 찾기',
  'onb.sub': '딱 1분이면 여행 스타일에 꼭 맞는 장소를 큐레이션해 드려요.',
  'onb.period': '여행 기간과 인원',
  'onb.days': '며칠 동안 머무시나요?',
  'onb.people': '인원수',
  'onb.people.desc': '함께 여행하는 총 인원',
  'onb.q1': '어떤 여행을 꿈꾸고 계신가요?',
  'onb.q2': '누구와 함께 떠나시나요?',
  'onb.q3': '특별 케어가 필요한 동행이 있나요?',
  'onb.q4': '관심 테마',
  'onb.food': '식단 · 회피음식',
  'onb.food.desc': '종교·알러지·식습관에 맞는 미식 장소만 추천해 드려요.',
  'onb.required': '필수',
  'onb.optional': '선택',
  'onb.cta': '취향 분석하고 맞춤 추천받기',
  'onb.trust': '로그인 없이 브라우저에 안전하게 저장됩니다',
  'onb.mobility': '이동 편의 조건 (선택)',
  // detail / planner / mytrip
  'd.locroute': '위치 · 길찾기',
  'd.kakaoRoute': '카카오맵 길찾기',
  'd.menu': '메뉴',
  'd.reviews': '방문자 후기',
  'd.culture': '문화 팁 (외국인 여행자용)',
  'd.access': '접근성 · 편의',
  'd.food': '식단 · 알러지',
  'd.venue': '매장 현장 안내 (외국인용)',
  'mt.title': '내 여행 보관함',
  'mt.share': '공유',
  'mt.route': 'AI 스마트 루트 만들기',
  'pl.title': '제주 올인 스마트 루트',
  'common.popular': '인기',
  'unit.places': '곳',
  'onb.pet': '반려견 동반',
  'onb.pet.desc': '반려견과 함께라면 동반 가능한 곳만 추천해 드려요.',
  'pet.with': '반려견과 함께',
  'pet.small': '소형견',
  'pet.medium': '중형견',
  'pet.large': '대형견',
  'home.pet.only': '반려견 동반 가능만 보기',
  'pet.badge': '반려견 동반',
  'd.pet': '반려견 동반 안내',
  'pet.sizeMax': '동반 가능 크기',
  'pet.offLeash': '오프리시(마당) 가능',
  'pet.indoor': '실내 동반 가능',
  'pet.fee': '반려견 요금',
  'speak.play': '음성 안내',
  'speak.stop': '정지',
};

const en: Dict = {
  'nav.curation': 'Curation',
  'nav.mytrip': 'My Trip',
  'nav.taste': 'Taste',
  'home.feed': 'Curation Feed',
  'home.profile': 'Your travel taste profile',
  'home.reset': 'Reset taste',
  'home.clean.title': '100% ad-free clean recommendations',
  'home.clean.desc': 'Ranked only by real reputation data and taste-match score.',
  'home.wish.title': 'What you want to do',
  'home.wish.ph': 'e.g. black pork, sunset, kids water play, cafe…',
  'home.wish.found': 'places found',
  'home.access.only': 'Accessible places only',
  'home.food.only': 'Diet-friendly places only',
  'home.reason': 'Why recommended for you?',
  'home.save': 'Add to trip',
  'home.saved': 'Added',
  'tab.all': 'All',
  'tab.stay': 'Stay',
  'tab.activity': 'Activity',
  'tab.food': 'Food',
  'sec.stay': '🏡 Stay',
  'sec.activity': '🌊 Activities',
  'sec.food': '🍊 Local Food',
  'empty.cat': 'No places match your filters.',
  'onb.progress': '1-min taste profile',
  'onb.done': 'done',
  'onb.title1': 'Find your own',
  'onb.title2': 'Jeju taste',
  'onb.sub': 'Just 1 minute to get places that fit your travel style.',
  'onb.period': 'Trip length & group',
  'onb.days': 'How many days?',
  'onb.people': 'Group size',
  'onb.people.desc': 'Total number of travelers',
  'onb.q1': 'What kind of trip do you dream of?',
  'onb.q2': 'Who are you traveling with?',
  'onb.q3': 'Anyone who needs special care?',
  'onb.q4': 'Interests',
  'onb.food': 'Diet · food to avoid',
  'onb.food.desc': 'We recommend only dining places that fit your diet.',
  'onb.required': 'required',
  'onb.optional': 'optional',
  'onb.cta': 'Analyze & get recommendations',
  'onb.trust': 'Saved safely in your browser, no login',
  'onb.mobility': 'Mobility needs (optional)',
  'd.locroute': 'Location · Directions',
  'd.kakaoRoute': 'KakaoMap directions',
  'd.menu': 'Menu',
  'd.reviews': 'Reviews',
  'd.culture': 'Culture tips (for visitors)',
  'd.access': 'Accessibility',
  'd.food': 'Diet · allergy',
  'd.venue': 'In-store guide (for visitors)',
  'mt.title': 'My Saved Trip',
  'mt.share': 'Share',
  'mt.route': 'Create AI smart route',
  'pl.title': 'Jeju All-In Smart Route',
  'common.popular': 'Popular',
  'unit.places': ' places',
  'onb.pet': 'Traveling with a dog',
  'onb.pet.desc': 'We recommend only pet-friendly places if you travel with a dog.',
  'pet.with': 'With my dog',
  'pet.small': 'Small',
  'pet.medium': 'Medium',
  'pet.large': 'Large',
  'home.pet.only': 'Pet-friendly only',
  'pet.badge': 'Pet-friendly',
  'd.pet': 'Pet policy',
  'pet.sizeMax': 'Max dog size',
  'pet.offLeash': 'Off-leash (yard) OK',
  'pet.indoor': 'Indoor allowed',
  'pet.fee': 'Pet fee',
  'speak.play': 'Listen',
  'speak.stop': 'Stop',
};

const dict: Record<Lang, Dict> = { ko, en };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: 'ko',
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>(load);
  const setLang = useCallback((l: Lang) => {
    setLangS(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  const t = useCallback((k: string) => dict[lang][k] ?? ko[k] ?? k, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-full bg-white shadow-card overflow-hidden text-[11px] font-bold shrink-0">
      {(['ko', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 ${lang === l ? 'bg-primary text-white' : 'text-muted'}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
