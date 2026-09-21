// 2단계 세부 카테고리 분류.
// 우선순위: TourAPI 분류코드(cat1/2/3) → 이름 키워드 → 테마.
// 데이터에 실제로 존재하는 세부분류만 화면에 칩으로 노출한다(빈 칩 없음).

type AnyPlace = {
  contentType: 'stay' | 'food' | 'activity';
  contentTypeId?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  name?: string;
  desc?: string;
  hashtags?: string[];
  providerCategory?: string;
  tags?: { themes?: string[] };
};

const FOOD_CAT3: Record<string, string> = {
  A05020100: '한식',
  A05020200: '양식',
  A05020300: '일식',
  A05020400: '중식',
  A05020700: '이색음식',
  A05020900: '카페·찻집',
};

const STAY_CAT3: Record<string, string> = {
  B02010100: '호텔·리조트',
  B02010500: '호텔·리조트',
  B02010600: '펜션·독채',
  B02011100: '게스트하우스',
  B02010900: '게스트하우스',
  B02011600: '캠핑·글램핑',
  B02011000: '민박·기타',
};

const LEISURE_CAT3: Record<string, string> = {
  A03020600: '카트',
  A03020700: '골프',
  A03021100: '승마',
  A03021700: '캠핑',
  A03022700: '트레킹',
  A03030100: '제트·윈드서핑',
  A03030200: '카약·카누',
  A03030300: '요트',
  A03030400: '스쿠버·스노클',
  A03030600: '낚시',
  A03030700: '수영장',
  A03030900: '서핑',
  A03040300: '패러글라이딩',
  A03050100: '복합레포츠',
};

export function subcatOf(p: AnyPlace): string {
  const c1 = p.cat1 || '';
  const c2 = p.cat2 || '';
  const c3 = p.cat3 || '';
  const name = p.name || '';
  const ctid = p.contentTypeId || '';
  const themes = p.tags?.themes || [];

  if (p.contentType === 'food') {
    if (FOOD_CAT3[c3]) return FOOD_CAT3[c3];
    if (/카페|커피|로스터|베이커리|디저트|찻집|브런치/.test(name)) return '카페·찻집';
    return '한식';
  }

  if (p.contentType === 'stay') {
    if (STAY_CAT3[c3]) return STAY_CAT3[c3];
    if (/글램핑|캠핑|카라반/.test(name)) return '캠핑·글램핑';
    if (/게스트하우스|호스텔/.test(name)) return '게스트하우스';
    if (/호텔|리조트|풀빌라/.test(name)) return '호텔·리조트';
    if (/펜션|독채|스테이|빌라|한옥|민박/.test(name)) return '펜션·독채';
    return '펜션·독채';
  }

  // Preserve provider categories before applying cross-provider golf rules.
  if (ctid === '38' || c1 === 'A04' || /쇼핑/.test(p.providerCategory || '')) return '쇼핑';
  if (ctid === '15' || /축제|행사/.test(p.providerCategory || '')) return '축제·공연';
  if (ctid === '14') return '문화·전시';
  const golfTag = (p.hashtags || []).some(t => /^(골프|golf)$/i.test(t.trim()));
  const golfContext = /골프|컨트리클럽|country\s*club|golf|[CG]C(?:$|\s)/i.test(name) || golfTag || c3 === 'A03020700';
  if (golfContext) {
    if (/웨어|용품|골프채|골프숍|골프샵/.test(name)) return '쇼핑';
    if (/대회|마스터스|페스티벌|박람회|홀인런/.test(name)) return '축제·공연';
    if (/박물관|전시관/.test(name)) return '문화·전시';
    if (/파크\s*골프|미니\s*골프|그라운드\s*골프/.test(name)) return '파크·미니골프';
    if (/연습장|스크린\s*골프|골프\s*연습/.test(name)) return '골프연습장';
    if (c3 === 'A03020700' || /골프(?:장|클럽|리조트|앤리조트)|컨트리\s*클럽|country\s*club|golf\s*club|[CG]C(?:$|[\s"'])/i.test(name)
      || (golfTag && /골프장|골프코스|골프\s*코스/.test(p.desc || '') && !/인근|근처|주변/.test(p.desc || ''))) return '골프';
  }
  // activity
  if (ctid === '28' || c1 === 'A03') {
    if (LEISURE_CAT3[c3]) return LEISURE_CAT3[c3];
    if (/스쿠버|다이빙|스노클/.test(name)) return '스쿠버·스노클';
    if (/서핑|서프/.test(name)) return '서핑';
    if (/요트/.test(name)) return '요트';
    if (/카약|카누/.test(name)) return '카약·카누';
    if (/패러|글라이딩/.test(name)) return '패러글라이딩';
    if (/승마/.test(name)) return '승마';
    if (/카트/.test(name)) return '카트';
    if (/낚시/.test(name)) return '낚시';
    if (/캠핑|글램핑/.test(name)) return '캠핑';
    if (/트레킹|올레|둘레/.test(name)) return '트레킹';
    return '기타레포츠';
  }
  if (ctid === '15' || c2 === 'A0207' || c2 === 'A0208') return '축제·공연';
  if (ctid === '14' || c2 === 'A0206') return '문화·전시';
  if (c1 === 'A01') return '자연·명소';
  if (c2 === 'A0201' || c2 === 'A0204' || c2 === 'A0205') return '문화·역사';
  if (c2 === 'A0202' || c2 === 'A0203') return '테마·체험';

  // 손수 만든 데이터(코드 없음) — 테마로 추정
  if (themes.includes('cultural') || themes.includes('market')) return '문화·역사';
  if (themes.includes('animal')) return '테마·체험';
  if (themes.includes('camping')) return '캠핑';
  if (themes.includes('surf') || themes.includes('sunset') || themes.includes('oreum') || themes.includes('trekking'))
    return '자연·명소';
  return '자연·명소';
}

// 현재 목록에 존재하는 세부분류를 개수 많은 순으로 반환
export function subcatChips(list: AnyPlace[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of list) {
    const s = subcatOf(p);
    map.set(s, (map.get(s) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
