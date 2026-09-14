import type { Content } from '../types';
import { JEJU_PLACES } from './jeju-places';

// 샘플 장소 데이터 (MVP) — 실제 서비스에서는 DB/CMS로 대체.
// image 필드는 이모지 폴백(외부 이미지 의존 제거).
export const CONTENTS: Content[] = [
  {
    id: 1,
    name: '돌담 너머 중산간 스테이',
    contentType: 'stay',
    region: '제주시 애월읍 중산간서로',
    rating: 4.9,
    reviewCount: 142,
    image: '🏡',
    desc: '조용한 중산간, 잔디 마당이 있는 프라이빗 독채',
    tags: {
      travelType: ['healing', 'camping_family'],
      companion: ['family', 'couple'],
      hasChild: true,
      hasSenior: true,
      themes: ['oreum', 'trekking'],
    },
    lat: 33.463,
    lng: 126.333,
    avgStayMinutes: 720,
    accessibility: { strollerOK: true, elevator: false },
    hashtags: ['#키즈웰컴', '#불멍가든'],
  },
  {
    id: 2,
    name: '목장 숲길 조랑말 동물교감 체험',
    contentType: 'activity',
    region: '서귀포시 표선면 녹산로',
    rating: 4.8,
    reviewCount: 98,
    image: '🐴',
    desc: '유아·어린이 전용 안전 교감 산책 코스',
    tags: {
      travelType: ['activity', 'healing'],
      companion: ['family', 'friends'],
      hasChild: true,
      themes: ['animal', 'trekking'],
    },
    lat: 33.325,
    lng: 126.788,
    avgStayMinutes: 90,
    accessibility: { strollerOK: true },
    hashtags: ['#유모차진입가능', '#숲길산책'],
  },
  {
    id: 3,
    name: '구좌 해녀밥상 & 전복돌솥',
    contentType: 'food',
    region: '제주시 구좌읍 해맞이해안로',
    rating: 4.7,
    reviewCount: 210,
    image: '🍲',
    desc: '자극 없는 해녀 채취 해산물, 부모님·유아 동반 최적',
    tags: {
      travelType: ['healing', 'luxury'],
      companion: ['family'],
      hasChild: true,
      hasSenior: true,
      themes: ['food'],
    },
    lat: 33.556,
    lng: 126.797,
    avgStayMinutes: 60,
    food: { noPork: true, allergenFree: ['견과'] },
    venueGuide: {
      languages: ['ko', 'en'],
      allergens: ['해산물', '대두'],
      payment: { krw: true, card: true, wechatPay: false },
    },
    hashtags: ['#아기의자보유', '#바다전망'],
  },
  {
    id: 4,
    name: '곶자왈 마음숲 고사리 산책',
    contentType: 'activity',
    region: '제주시 한경면 곶자왈로',
    rating: 4.95,
    reviewCount: 76,
    image: '🌿',
    desc: '토닥이와 함께하는 10분 마음 회복 숲길 산책',
    tags: {
      travelType: ['healing'],
      companion: ['solo', 'couple'],
      hasSenior: true,
      themes: ['trekking', 'oreum'],
    },
    lat: 33.32,
    lng: 126.235,
    avgStayMinutes: 40,
    accessibility: { barrierFree: true },
    walkGuide: {
      available: true,
      durationMin: 10,
      scenes: ['숨을 만나요', '마음을 들어요', '나를 토닥여요'],
      prompts: [
        '세 번 천천히 호흡하며 지금 이곳에 도착해요.',
        '마음에 닿는 풍경 하나를 오래 바라봐요.',
        '오늘의 나에게 꼭 필요한 한마디를 건네요.',
      ],
    },
    hashtags: ['#곶자왈', '#마음회복'],
  },
  {
    id: 5,
    name: '월정 에메랄드 투명 카약',
    contentType: 'activity',
    region: '제주시 구좌읍 월정리 해변',
    rating: 4.92,
    reviewCount: 95,
    image: '🛶',
    desc: '초보자 친화 코스, 인생 사진 촬영 지원',
    tags: {
      travelType: ['activity'],
      companion: ['friends', 'couple'],
      themes: ['surf', 'sunset'],
    },
    lat: 33.557,
    lng: 126.795,
    avgStayMinutes: 80,
    hashtags: ['#안전강습포함', '#일몰추천'],
  },
  {
    id: 6,
    name: '바람의 정원 감성 독채',
    contentType: 'stay',
    region: '제주시 한림읍 협재리',
    rating: 4.95,
    reviewCount: 128,
    image: '🛖',
    desc: '자쿠지와 프라이빗 돌담, 조용한 쉼',
    tags: {
      travelType: ['luxury', 'healing'],
      companion: ['couple', 'solo'],
      themes: ['cafe', 'sunset'],
    },
    lat: 33.394,
    lng: 126.24,
    avgStayMinutes: 720,
    accessibility: { noKidsZone: true },
    hashtags: ['#돌담스파', '#노키즈클린존'],
  },
  {
    id: 7,
    name: '오설록 티 뮤지엄 & 녹차밭',
    contentType: 'activity',
    region: '서귀포시 안덕면 신화역사로',
    rating: 4.6,
    reviewCount: 320,
    image: '🍵',
    desc: '드넓은 녹차밭과 감성 카페, 전시 관람',
    tags: {
      travelType: ['luxury', 'workation'],
      companion: ['couple', 'friends', 'family'],
      themes: ['cafe', 'cultural'],
    },
    lat: 33.305,
    lng: 126.29,
    avgStayMinutes: 90,
    accessibility: { strollerOK: true, barrierFree: true },
    hashtags: ['#감성카페', '#전시'],
  },
  {
    id: 8,
    name: '세화 오일장 로컬 마켓',
    contentType: 'food',
    region: '제주시 구좌읍 세화리',
    rating: 4.5,
    reviewCount: 154,
    image: '🧺',
    desc: '5·10일 열리는 제주 로컬 오일장, 향토 먹거리',
    tags: {
      travelType: ['workation', 'healing'],
      companion: ['solo', 'friends'],
      themes: ['market', 'food'],
    },
    lat: 33.524,
    lng: 126.86,
    avgStayMinutes: 60,
    hashtags: ['#오일장', '#로컬미식'],
  },
];

// --- 확장 샘플 (id 9~24) : 종류별 다양화 ---
CONTENTS.push(
  {
    id: 9, name: '한라산 성판악 숲길 트레킹', contentType: 'activity',
    region: '제주시 조천읍 성판악', rating: 4.8, reviewCount: 512, image: '⛰️',
    desc: '초록 원시림을 걷는 대표 트레킹 코스',
    tags: { travelType: ['activity', 'healing'], companion: ['solo', 'friends', 'couple'], hasSenior: false, themes: ['trekking', 'oreum'] },
    lat: 33.386, lng: 126.61, avgStayMinutes: 240, hashtags: ['#한라산', '#숲길'],
  },
  {
    id: 10, name: '성산일출봉 일출 명소', contentType: 'activity',
    region: '서귀포시 성산읍 성산리', rating: 4.7, reviewCount: 890, image: '🌅',
    desc: '유네스코 세계자연유산, 장엄한 일출',
    tags: { travelType: ['healing', 'activity'], companion: ['couple', 'family', 'solo'], hasSenior: true, themes: ['sunset', 'oreum'] },
    lat: 33.458, lng: 126.942, avgStayMinutes: 90, accessibility: { barrierFree: false }, hashtags: ['#일출', '#세계유산'],
  },
  {
    id: 11, name: '협재 흑돼지 연탄구이', contentType: 'food',
    region: '제주시 한림읍 협재리', rating: 4.6, reviewCount: 430, image: '🥩',
    desc: '제주 흑돼지 오겹살, 멜젓과 함께',
    tags: { travelType: ['activity', 'luxury'], companion: ['friends', 'family', 'couple'], themes: ['food'] },
    lat: 33.394, lng: 126.239, avgStayMinutes: 80,
    food: { noSeafood: true }, venueGuide: { languages: ['ko', 'en'], allergens: ['돼지고기', '대두'], payment: { krw: true, card: true, wechatPay: false } },
    hashtags: ['#흑돼지', '#로컬맛집'],
  },
  {
    id: 12, name: '애월 오션뷰 감성 베이커리', contentType: 'food',
    region: '제주시 애월읍 곽지리', rating: 4.5, reviewCount: 620, image: '🥐',
    desc: '바다를 보며 즐기는 수제 빵과 커피',
    tags: { travelType: ['workation', 'luxury', 'healing'], companion: ['couple', 'solo', 'friends'], themes: ['cafe', 'sunset'] },
    lat: 33.451, lng: 126.307, avgStayMinutes: 70,
    food: { vegetarian: true }, hashtags: ['#오션뷰카페', '#베이커리'],
  },
  {
    id: 13, name: '서귀포 스쿠버 스노클링', contentType: 'activity',
    region: '서귀포시 법환동', rating: 4.7, reviewCount: 210, image: '🤿',
    desc: '맑은 남부 바다에서 즐기는 수중 체험',
    tags: { travelType: ['activity'], companion: ['friends', 'couple'], themes: ['surf'] },
    lat: 33.234, lng: 126.51, avgStayMinutes: 120, hashtags: ['#스노클링', '#바다체험'],
  },
  {
    id: 14, name: '보롬왓 감성 꽃밭', contentType: 'activity',
    region: '서귀포시 표선면 성읍리', rating: 4.5, reviewCount: 340, image: '🌸',
    desc: '계절 꽃과 메밀밭, 인생샷 포토존',
    tags: { travelType: ['healing', 'luxury'], companion: ['couple', 'family', 'friends'], hasChild: true, themes: ['cafe', 'cultural'] },
    lat: 33.386, lng: 126.8, avgStayMinutes: 90, accessibility: { strollerOK: true }, hashtags: ['#꽃밭', '#포토존'],
  },
  {
    id: 15, name: '제주 4·3 평화기념관', contentType: 'activity',
    region: '제주시 봉개동', rating: 4.6, reviewCount: 180, image: '🕊️',
    desc: '제주 현대사를 배우는 역사·문화 공간',
    tags: { travelType: ['workation', 'healing'], companion: ['solo', 'family', 'couple'], hasSenior: true, themes: ['cultural'] },
    lat: 33.5, lng: 126.573, avgStayMinutes: 90, accessibility: { barrierFree: true, elevator: true }, hashtags: ['#역사', '#전시'],
  },
  {
    id: 16, name: '카멜리아힐 동백 수목원', contentType: 'activity',
    region: '서귀포시 안덕면 상창리', rating: 4.6, reviewCount: 410, image: '🌺',
    desc: '동백과 야생화가 가득한 정원 산책',
    tags: { travelType: ['healing', 'luxury'], companion: ['couple', 'family'], hasChild: true, hasSenior: true, themes: ['trekking', 'cafe'] },
    lat: 33.288, lng: 126.365, avgStayMinutes: 90, accessibility: { strollerOK: true, barrierFree: true }, hashtags: ['#수목원', '#동백'],
  },
  {
    id: 17, name: '함덕 서우봉 글램핑', contentType: 'stay',
    region: '제주시 조천읍 함덕리', rating: 4.7, reviewCount: 156, image: '⛺',
    desc: '에메랄드 해변 옆 감성 글램핑, 불멍',
    tags: { travelType: ['camping_family', 'activity'], companion: ['friends', 'family', 'couple'], hasChild: true, themes: ['camping', 'surf', 'sunset'] },
    lat: 33.543, lng: 126.669, avgStayMinutes: 720, hashtags: ['#글램핑', '#불멍'],
  },
  {
    id: 18, name: '중문 오션 스위트 호텔', contentType: 'stay',
    region: '서귀포시 색달동 중문', rating: 4.8, reviewCount: 940, image: '🏨',
    desc: '풀빌라·스파 갖춘 럭셔리 리조트',
    tags: { travelType: ['luxury', 'workation'], companion: ['couple', 'family'], hasChild: true, hasSenior: true, themes: ['sunset', 'cafe'] },
    lat: 33.246, lng: 126.412, avgStayMinutes: 720, accessibility: { barrierFree: true, elevator: true, strollerOK: true }, hashtags: ['#풀빌라', '#스파'],
  },
  {
    id: 19, name: '표선 해비치 가족 리조트', contentType: 'stay',
    region: '서귀포시 표선면 표선리', rating: 4.6, reviewCount: 720, image: '🛎️',
    desc: '키즈풀·해변 인접, 가족 여행 최적',
    tags: { travelType: ['healing', 'camping_family', 'luxury'], companion: ['family'], hasChild: true, hasSenior: true, themes: ['surf', 'cafe'] },
    lat: 33.324, lng: 126.842, avgStayMinutes: 720, accessibility: { strollerOK: true, elevator: true }, hashtags: ['#키즈풀', '#가족'],
  },
  {
    id: 20, name: '동문시장 야시장 먹거리', contentType: 'food',
    region: '제주시 이도1동', rating: 4.5, reviewCount: 1120, image: '🏮',
    desc: '흑돼지 꼬치·딱새우회 등 야시장 미식',
    tags: { travelType: ['activity', 'workation'], companion: ['friends', 'solo', 'couple'], themes: ['market', 'food'] },
    lat: 33.512, lng: 126.529, avgStayMinutes: 60, hashtags: ['#야시장', '#길거리음식'],
  },
  {
    id: 21, name: '월정리 감성 카페거리', contentType: 'food',
    region: '제주시 구좌읍 월정리', rating: 4.4, reviewCount: 560, image: '☕',
    desc: '에메랄드 해변 앞 감성 카페 골목',
    tags: { travelType: ['workation', 'luxury', 'healing'], companion: ['couple', 'friends', 'solo'], themes: ['cafe', 'surf', 'sunset'] },
    lat: 33.556, lng: 126.795, avgStayMinutes: 60, food: { vegan: true }, hashtags: ['#카페거리', '#오션뷰'],
  },
  {
    id: 22, name: '조랑말 승마 & 목장 체험', contentType: 'activity',
    region: '제주시 애월읍 어음리', rating: 4.5, reviewCount: 230, image: '🐎',
    desc: '초원에서 즐기는 승마와 먹이주기',
    tags: { travelType: ['activity', 'camping_family'], companion: ['family', 'friends'], hasChild: true, themes: ['animal', 'trekking'] },
    lat: 33.42, lng: 126.31, avgStayMinutes: 90, accessibility: { strollerOK: true }, hashtags: ['#승마', '#동물교감'],
  },
  {
    id: 23, name: '비자림 천년의 숲', contentType: 'activity',
    region: '제주시 구좌읍 평대리', rating: 4.7, reviewCount: 680, image: '🌲',
    desc: '천년 비자나무 사이 무장애 힐링 숲길',
    tags: { travelType: ['healing'], companion: ['couple', 'family', 'solo'], hasSenior: true, hasChild: true, themes: ['trekking', 'oreum'] },
    lat: 33.49, lng: 126.81, avgStayMinutes: 80, accessibility: { barrierFree: true, strollerOK: true }, hashtags: ['#비자림', '#무장애숲길'],
  },
  {
    id: 24, name: '우도 땅콩아이스크림 & 해안', contentType: 'food',
    region: '제주시 우도면', rating: 4.4, reviewCount: 780, image: '🍦',
    desc: '우도 특산 땅콩 아이스크림과 해안 드라이브',
    tags: { travelType: ['activity', 'healing'], companion: ['couple', 'friends', 'family'], hasChild: true, themes: ['surf', 'cafe', 'sunset'] },
    lat: 33.505, lng: 126.952, avgStayMinutes: 120, hashtags: ['#우도', '#땅콩아이스크림'],
  },
);

// --- 식당 메뉴 · 후기 (샘플) : 실서비스에선 네이버/카카오 플레이스 API로 대체 ---
const FOOD_DETAILS: Record<number, { menu: import('../types').MenuItem[]; reviews: import('../types').Review[] }> = {
  3: {
    menu: [
      { name: '전복 해녀돌솥밥', price: 16000, note: '싱싱한 전복 4미', popular: true },
      { name: '해물 된장 정식', price: 13000, note: '자극 없는 집된장' },
      { name: '문어 숙회', price: 25000, note: '2~3인' },
      { name: '보말 미역국', price: 11000 },
    ],
    reviews: [
      { author: '여행자 민서', rating: 5, text: '아이 아기의자도 있고 자극적이지 않아 부모님이 아주 좋아하셨어요.', date: '2026-08-21' },
      { author: 'Sarah K.', rating: 5, text: 'Fresh abalone, ocean view was amazing. Staff spoke basic English.', date: '2026-08-10' },
      { author: '제주러버', rating: 4, text: '전복돌솥밥 강추. 웨이팅이 조금 있었어요.', date: '2026-07-30' },
    ],
  },
  11: {
    menu: [
      { name: '흑돼지 오겹살(200g)', price: 19000, note: '멜젓과 함께', popular: true },
      { name: '흑돼지 목살(200g)', price: 18000 },
      { name: '된장찌개', price: 7000 },
      { name: '냉면', price: 8000 },
    ],
    reviews: [
      { author: '고기사랑', rating: 5, text: '연탄향 제대로. 멜젓 찍어 먹으니 인생 오겹살이었어요.', date: '2026-08-18' },
      { author: '제주 3박4일', rating: 4, text: '고기 질 좋음. 다만 저녁엔 사람 많아 예약 추천.', date: '2026-08-05' },
      { author: 'Mike', rating: 5, text: 'Best Korean BBQ, English menu available.', date: '2026-07-22' },
    ],
  },
  20: {
    menu: [
      { name: '흑돼지 꼬치', price: 5000, popular: true },
      { name: '딱새우회', price: 15000, note: '제철' },
      { name: '한치 물회', price: 12000 },
      { name: '오메기떡(3개)', price: 5000 },
    ],
    reviews: [
      { author: '야시장왕', rating: 4, text: '종류가 정말 많아요. 딱새우회 꼭 드세요.', date: '2026-08-25' },
      { author: '뚜벅이여행', rating: 4, text: '사람이 많아 정신없지만 그게 야시장 매력!', date: '2026-08-12' },
    ],
  },
  21: {
    menu: [
      { name: '핸드드립 커피', price: 6500, popular: true },
      { name: '제주 말차 라떼', price: 7000 },
      { name: '당근 케이크', price: 7500, note: '비건' },
      { name: '감귤 에이드', price: 6000 },
    ],
    reviews: [
      { author: '카페투어', rating: 5, text: '월정리 바다 보며 마시는 커피 최고. 비건 케이크도 맛있어요.', date: '2026-08-20' },
      { author: 'Emma', rating: 4, text: 'Great ocean view, a bit crowded on weekends.', date: '2026-08-02' },
    ],
  },
  24: {
    menu: [
      { name: '우도 땅콩 아이스크림', price: 5000, popular: true },
      { name: '땅콩 막걸리', price: 8000 },
      { name: '한치 물회', price: 13000 },
    ],
    reviews: [
      { author: '섬여행', rating: 5, text: '우도 오면 무조건 먹어야 하는 땅콩 아이스크림!', date: '2026-08-15' },
      { author: '가족여행중', rating: 4, text: '아이들이 너무 좋아했어요. 해안 뷰도 예뻐요.', date: '2026-07-28' },
    ],
  },
  8: {
    menu: [
      { name: '오메기떡', price: 1000, note: '개당', popular: true },
      { name: '빙떡', price: 1500 },
      { name: '고사리 나물', price: 5000 },
    ],
    reviews: [
      { author: '오일장매니아', rating: 5, text: '5·10일에만 열려요. 로컬 정취 가득!', date: '2026-08-10' },
    ],
  },
};
CONTENTS.forEach((c) => {
  const d = FOOD_DETAILS[c.id];
  if (d) {
    c.menu = d.menu;
    c.reviews = d.reviews;
  }
});

// --- 식단(알러지·회피음식) 보강 + 문화 팁 ---
const COMMON_DINING_TIPS = [
  '수저·젓가락은 보통 테이블 옆면 서랍이나 통에 있어요.',
  '한국에선 가위로 면·고기를 자르는 게 자연스러워요.',
  '팁 문화는 없습니다. 계산은 보통 카운터에서 해요.',
];
const CULTURE_EXTRA: Record<number, { food?: Partial<import('../types').FoodOptions>; tips?: string[] }> = {
  3: { food: { noPork: true, halal: false }, tips: ['해산물·젓갈이 들어가 알러지 있으면 미리 말씀하세요.', ...COMMON_DINING_TIPS] },
  8: { tips: ['5·10일에만 열리는 오일장이에요.', '현금을 챙기면 편해요.'] },
  11: { food: { noSeafood: true, noPork: false }, tips: ['돼지고기 전문점이라 무슬림·채식은 주의하세요.', ...COMMON_DINING_TIPS] },
  12: { food: { vegetarian: true, vegan: true }, tips: ['비건 베이커리 메뉴가 있어요.', '실내에선 정숙을 부탁드려요.'] },
  20: { tips: ['야시장은 현금이 편하고, 사람이 많아 소지품에 유의하세요.', '분리배출(캔·페트·일반)을 지켜주세요.'] },
  21: { food: { vegetarian: true, vegan: true }, tips: ['비건 케이크 옵션이 있어요.', '주말엔 웨이팅이 있을 수 있어요.'] },
  24: { tips: ['우도는 배로 들어가요(도항선). 왕복 시간 확인 필요.'] },
};
CONTENTS.forEach((c) => {
  const e = CULTURE_EXTRA[c.id];
  if (!e) return;
  if (e.food) c.food = { ...(c.food ?? {}), ...e.food };
  if (e.tips) c.cultureTips = e.tips;
});

// --- 반려견 동반 정보 + 전용 장소 ---
CONTENTS.push(
  {
    id: 25, name: '애월 펫 동반 오션뷰 풀빌라', contentType: 'stay',
    region: '제주시 애월읍 고내리', rating: 4.9, reviewCount: 210, image: '🐩',
    desc: '대형견까지 환영, 마당·전용 풀 완비',
    tags: { travelType: ['luxury', 'healing', 'camping_family'], companion: ['couple', 'family', 'friends'], themes: ['sunset', 'cafe'] },
    lat: 33.463, lng: 126.31, avgStayMinutes: 720,
    accessibility: { strollerOK: true },
    pet: { petFriendly: true, sizeMax: 'large', offLeash: true, indoor: true, fee: 30000 },
    hashtags: ['#반려견동반', '#오션뷰풀빌라'],
  },
  {
    id: 26, name: '중산간 반려견 놀이터 카페', contentType: 'food',
    region: '제주시 애월읍 유수암리', rating: 4.7, reviewCount: 340, image: '🐕',
    desc: '넓은 잔디 운동장, 소·중형견 오프리시 가능',
    tags: { travelType: ['activity', 'healing'], companion: ['friends', 'couple', 'family'], themes: ['cafe', 'animal'] },
    lat: 33.44, lng: 126.33, avgStayMinutes: 90,
    accessibility: { strollerOK: true, barrierFree: true },
    pet: { petFriendly: true, sizeMax: 'medium', offLeash: true, indoor: false, fee: 5000 },
    food: { vegetarian: true },
    hashtags: ['#반려견놀이터', '#잔디마당'],
  },
);
const PET_EXTRA: Record<number, import('../types').Content['pet']> = {
  1: { petFriendly: true, sizeMax: 'large', offLeash: true, indoor: false, fee: 20000 },
  6: { petFriendly: true, sizeMax: 'medium', indoor: true, offLeash: false, fee: 15000 },
  12: { petFriendly: true, sizeMax: 'small', indoor: false, offLeash: false },
  17: { petFriendly: true, sizeMax: 'large', offLeash: true, indoor: false, fee: 10000 },
  21: { petFriendly: true, sizeMax: 'medium', indoor: false, offLeash: false },
  24: { petFriendly: true, sizeMax: 'large', indoor: false, offLeash: false },
};
CONTENTS.forEach((c) => {
  const p = PET_EXTRA[c.id];
  if (p) c.pet = p;
});

// 실제 제주 명소·맛집·숙소 추가 (권역 필터·카테고리 탐색용)
CONTENTS.push(...JEJU_PLACES);
