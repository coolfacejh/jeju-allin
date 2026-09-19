// 제주올인 공통 타입 정의
// 확장 필드(접근성/음식/다국어/매장QR/힐링산책/반려견)는 명세서 v1.1 기준으로
// 자리를 잡아두되, 현재 화면은 핵심 필드만 사용한다.

export type TravelType =
  | 'healing'
  | 'activity'
  | 'luxury'
  | 'workation'
  | 'camping_family';

export type Companion = 'solo' | 'couple' | 'friends' | 'family';

export type ContentType = 'stay' | 'food' | 'activity';

export type PetSize = 'small' | 'medium' | 'large'; // 소형·중형·대형

export type ThemeKey =
  | 'animal'
  | 'surf'
  | 'oreum'
  | 'cafe'
  | 'food'
  | 'camping'
  | 'trekking'
  | 'sunset'
  | 'market'
  | 'cultural';

// 사용자 취향 프로필 (온보딩 결과)
export interface UserProfile {
  travelType: TravelType;
  companion: Companion;
  hasChild: boolean;
  childAge?: 'infant' | 'preschool' | 'elementary'; // 영유아·미취학·초등
  hasSenior: boolean;
  themes: ThemeKey[];
  nights: number; // 숙박 일수 (0 = 당일치기, 1 = 1박2일 ...)
  headcount: number; // 여행 인원수 (1 이상)
  access?: { barrierFree: boolean; stroller: boolean; avoidNoKids: boolean }; // 접근성 조건
  foodPref?: { halal: boolean; vegetarian: boolean; vegan: boolean; noSeafood: boolean; noPork: boolean }; // 식단·회피음식
  pet?: { withPet: boolean; size: PetSize }; // 반려견 동반
  createdAt: string;
}

// --- 확장 필드 (차기 기능 대비, optional) ---
export interface Accessibility {
  barrierFree?: boolean; // 무장애(휠체어)
  elevator?: boolean;
  strollerOK?: boolean; // 유모차 진입
  noKidsZone?: boolean; // 노키즈존
}

export interface FoodOptions {
  halal?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  noSeafood?: boolean;
  noPork?: boolean;
  allergenFree?: string[];
}

// 매장 QR 현장 안내 (culture-qr 통합)
export interface VenueGuide {
  entranceUrl?: string;
  tableUrl?: string;
  languages?: string[];
  allergens?: string[];
  cultureTips?: string[];
  payment?: { krw?: boolean; card?: boolean; wechatPay?: boolean };
}

// 힐링 산책 가이드 (토닥이 통합)
export interface WalkGuide {
  available: boolean;
  durationMin: number;
  scenes: string[];
  prompts: string[];
}

// 장소(콘텐츠) 정의
export interface Content {
  provenance?: { source: 'local' | 'tourapi' | 'visitjeju' | 'shared'; retrievedAt?: string; sourceId?: string };
  id: number;
  name: string;
  contentType: ContentType;
  region: string;
  rating: number;
  reviewCount: number;
  image: string; // 이미지 URL 또는 이모지 폴백
  desc: string;
  tags: {
    travelType: TravelType[];
    companion: Companion[];
    hasChild?: boolean;
    hasSenior?: boolean;
    themes: ThemeKey[];
  };
  // 좌표 (P0 동선 설계용)
  lat?: number;
  lng?: number;
  avgStayMinutes?: number;
  // 확장 필드
  accessibility?: Accessibility;
  food?: FoodOptions;
  venueGuide?: VenueGuide;
  walkGuide?: WalkGuide;
  hashtags?: string[];
  menu?: MenuItem[]; // 식당 메뉴
  reviews?: Review[]; // 방문자 후기
  cultureTips?: string[]; // 외국인 대상 문화 팁
  pet?: { petFriendly: boolean; sizeMax?: PetSize; indoor?: boolean; offLeash?: boolean; fee?: number }; // 반려견 동반
}

export interface MenuItem {
  name: string;
  price: number;
  note?: string;
  popular?: boolean;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

export type MatchGrade = '적합' | '높음' | '보통';

export interface CuratedContent extends Content {
  matchScore: number;
  matchGrade: MatchGrade;
  reasons: string[];
}
