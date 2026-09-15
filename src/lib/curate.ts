import type {
  Content,
  CuratedContent,
  UserProfile,
  TravelType,
  Companion,
  ThemeKey,
  MatchGrade,
} from '../types';

const TRAVEL_TYPE_NAME: Record<TravelType, string> = {
  healing: '힐링·휴식',
  activity: '액티비티',
  luxury: '감성 스테이·럭셔리',
  workation: '워케이션',
  camping_family: '자연·감성 캠핑',
};

const COMPANION_NAME: Record<Companion, string> = {
  solo: '나홀로',
  couple: '연인·부부',
  friends: '친구',
  family: '가족',
};

const THEME_NAME: Record<ThemeKey, string> = {
  animal: '동물교감',
  surf: '서핑·해양',
  oreum: '중산간·오름',
  cafe: '감성카페',
  food: '제주향토미식',
  camping: '캠핑·피크닉',
  trekking: '숲길·트레킹',
  sunset: '일몰명소',
  market: '오일장·야시장',
  cultural: '미술관·전시',
};

// 큐레이션 랭킹 알고리즘 — 광고/유료 가중치는 개입하지 않는다.
export function calculateCuration(
  contents: Content[],
  profile: UserProfile,
): CuratedContent[] {
  return contents
    .map((item): CuratedContent => {
      let score = 0;
      const reasons: string[] = [];

      // 1. 여행 유형 일치 (+40)
      if (item.tags.travelType.includes(profile.travelType)) {
        score += 40;
        reasons.push(`${TRAVEL_TYPE_NAME[profile.travelType]} 여행 유형 태그 일치`);
      }

      // 2. 동행 일치 (+25)
      if (item.tags.companion.includes(profile.companion)) {
        score += 25;
        reasons.push(`${COMPANION_NAME[profile.companion]} 동행 유형 태그 일치`);
      }

      // 3. 특별 케어 (+15 각)
      if (profile.hasChild && item.tags.hasChild) {
        score += 15;
        reasons.push('아이 동반 관심 태그 일치 · 편의시설은 별도 확인');
      }
      if (profile.hasSenior && item.tags.hasSenior) {
        score += 15;
        reasons.push('어르신 동반 관심 태그 일치 · 이동 편의는 별도 확인');
      }

      // 4. 관심 테마 교집합 (개당 +10, 최대 +30)
      const matched = item.tags.themes.filter((t) => profile.themes.includes(t));
      if (matched.length > 0) {
        score += Math.min(matched.length * 10, 30);
        const names = matched.slice(0, 2).map((t) => THEME_NAME[t]);
        reasons.push(`관심 테마 '${names.join(', ')}' 일치`);
      }

      let matchGrade: MatchGrade = '보통';
      if (score >= 80) matchGrade = '적합';
      else if (score >= 60) matchGrade = '높음';

      return { ...item, matchScore: score, matchGrade, reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);
}

export { TRAVEL_TYPE_NAME, COMPANION_NAME, THEME_NAME };
