import type { Content } from '../types';

// 실제 제주 명소·맛집·숙소 (권역: 좌표 기반 동/서/남/북 자동 분류).
// 좌표는 실제 위치 근사값. 평점/후기수는 대표 표시용.
// image는 이모지 폴백(외부 이미지 의존 제거).

type Seed = {
  id: number;
  name: string;
  t: Content['contentType'];
  region: string;
  lat: number;
  lng: number;
  img: string;
  desc: string;
  rating: number;
  rc: number;
  travel: Content['tags']['travelType'];
  comp: Content['tags']['companion'];
  themes: Content['tags']['themes'];
  child?: boolean;
  senior?: boolean;
  stay?: number;
  tags?: string[];
};

const SEEDS: Seed[] = [
  // ===== 북부 (제주시·조천·함덕) =====
  { id: 101, name: '함덕 서우봉 해변', t: 'activity', region: '제주시 조천읍 함덕리', lat: 33.543, lng: 126.669, img: '🏖️', desc: '에메랄드빛 얕은 바다, 아이와 물놀이 좋은 해변', rating: 4.7, rc: 3120, travel: ['healing', 'activity'], comp: ['family', 'couple'], themes: ['surf', 'sunset'], child: true, stay: 120, tags: ['#가족물놀이', '#인생사진'] },
  { id: 102, name: '삼양 검은모래 해변', t: 'activity', region: '제주시 삼양동', lat: 33.520, lng: 126.591, img: '🏖️', desc: '검은모래 찜질로 유명한 조용한 해변', rating: 4.4, rc: 860, travel: ['healing'], comp: ['family', 'solo'], themes: ['surf'], senior: true, stay: 60 },
  { id: 103, name: '용두암', t: 'activity', region: '제주시 용담이동', lat: 33.516, lng: 126.512, img: '🌋', desc: '용 머리를 닮은 화산 기암, 해안 산책', rating: 4.2, rc: 2540, travel: ['activity'], comp: ['friends', 'family'], themes: ['cultural', 'sunset'], stay: 40 },
  { id: 104, name: '이호테우 말등대 해변', t: 'activity', region: '제주시 이호일동', lat: 33.498, lng: 126.453, img: '🐴', desc: '말 모양 등대와 노을 명소', rating: 4.3, rc: 1980, travel: ['healing'], comp: ['couple', 'friends'], themes: ['sunset', 'surf'], stay: 60 },
  { id: 105, name: '한라수목원', t: 'activity', region: '제주시 연동', lat: 33.464, lng: 126.492, img: '🌳', desc: '도심 속 산책 숲, 야간 개장', rating: 4.5, rc: 1740, travel: ['healing'], comp: ['family', 'solo'], themes: ['trekking'], child: true, senior: true, stay: 90 },
  { id: 106, name: '사라봉 일몰 전망', t: 'activity', region: '제주시 건입동', lat: 33.520, lng: 126.552, img: '🌅', desc: '제주 10경 사봉낙조, 완만한 오름', rating: 4.4, rc: 920, travel: ['healing'], comp: ['couple', 'solo'], themes: ['sunset', 'oreum'], senior: true, stay: 50 },
  { id: 107, name: '삼성혈', t: 'activity', region: '제주시 이도일동', lat: 33.508, lng: 126.529, img: '🏛️', desc: '탐라 신화 발상지, 도심 사적', rating: 4.1, rc: 640, travel: ['activity'], comp: ['family'], themes: ['cultural'], child: true, stay: 40 },
  { id: 108, name: '노형 실내 테마파크', t: 'activity', region: '제주시 노형동', lat: 33.474, lng: 126.478, img: '🎡', desc: '날씨 상관없는 실내 놀이, 아이 동반 최적', rating: 4.3, rc: 1120, travel: ['activity', 'camping_family'], comp: ['family'], themes: ['animal'], child: true, stay: 150 },
  { id: 109, name: '제주 흑돼지 골목', t: 'food', region: '제주시 건입동', lat: 33.514, lng: 126.532, img: '🥩', desc: '연탄 직화 흑돼지 노포 밀집', rating: 4.6, rc: 4200, travel: ['activity'], comp: ['friends', 'family'], themes: ['food'], stay: 80 },
  { id: 110, name: '동문시장 야시장', t: 'food', region: '제주시 일도일동', lat: 33.512, lng: 126.528, img: '🌃', desc: '흑돼지꼬치·회국수 등 길거리 먹거리', rating: 4.5, rc: 5300, travel: ['activity'], comp: ['friends', 'couple'], themes: ['market', 'food'], stay: 70 },
  { id: 111, name: '제주항 근처 고등어쌈밥', t: 'food', region: '제주시 건입동', lat: 33.517, lng: 126.540, img: '🐟', desc: '통통한 제철 고등어 정식', rating: 4.4, rc: 780, travel: ['healing'], comp: ['family'], themes: ['food'], senior: true, stay: 60 },
  { id: 112, name: '제주시 시티 호텔', t: 'stay', region: '제주시 연동', lat: 33.489, lng: 126.494, img: '🏨', desc: '공항 10분, 노형·연동 중심 접근성', rating: 4.4, rc: 2100, travel: ['workation', 'luxury'], comp: ['solo', 'couple'], themes: ['cafe'], stay: 720 },
  { id: 113, name: '함덕 오션뷰 펜션', t: 'stay', region: '제주시 조천읍 함덕리', lat: 33.541, lng: 126.667, img: '🏡', desc: '함덕 해변 도보, 통유리 오션뷰', rating: 4.7, rc: 940, travel: ['healing'], comp: ['couple', 'family'], themes: ['surf'], child: true, stay: 720 },
  { id: 114, name: '조천 돌집 독채', t: 'stay', region: '제주시 조천읍', lat: 33.535, lng: 126.635, img: '🏠', desc: '옛 제주 돌집을 개조한 프라이빗 독채', rating: 4.8, rc: 410, travel: ['healing', 'workation'], comp: ['couple', 'solo'], themes: ['cultural'], stay: 720 },

  // ===== 동부 (구좌·성산·표선·우도) =====
  { id: 120, name: '성산일출봉', t: 'activity', region: '서귀포시 성산읍', lat: 33.458, lng: 126.942, img: '🌋', desc: '유네스코 세계자연유산, 분화구 일출', rating: 4.7, rc: 8800, travel: ['activity', 'healing'], comp: ['couple', 'friends', 'family'], themes: ['sunset', 'cultural', 'trekking'], stay: 90 },
  { id: 121, name: '우도', t: 'activity', region: '제주시 우도면', lat: 33.505, lng: 126.951, img: '🐄', desc: '배로 15분, 해안도로·땅콩 명물의 섬', rating: 4.6, rc: 6100, travel: ['activity', 'healing'], comp: ['friends', 'couple'], themes: ['surf', 'sunset'], stay: 240 },
  { id: 122, name: '월정리 해변', t: 'activity', region: '제주시 구좌읍 월정리', lat: 33.556, lng: 126.796, img: '🏖️', desc: '카페와 하늘색 바다, 대표 감성 해변', rating: 4.5, rc: 4300, travel: ['healing'], comp: ['couple', 'friends'], themes: ['cafe', 'surf', 'sunset'], stay: 90 },
  { id: 123, name: '세화 해변 & 벨롱장', t: 'activity', region: '제주시 구좌읍 세화리', lat: 33.525, lng: 126.859, img: '🌊', desc: '주말 플리마켓과 잔잔한 바다', rating: 4.4, rc: 1600, travel: ['healing'], comp: ['couple', 'solo'], themes: ['market', 'surf'], stay: 80 },
  { id: 124, name: '섭지코지', t: 'activity', region: '서귀포시 성산읍', lat: 33.424, lng: 126.928, img: '🌊', desc: '등대·성당·바다 절경 산책로', rating: 4.5, rc: 3400, travel: ['healing', 'activity'], comp: ['couple', 'family'], themes: ['sunset', 'cultural'], stay: 90 },
  { id: 125, name: '광치기 해변', t: 'activity', region: '서귀포시 성산읍', lat: 33.451, lng: 126.925, img: '🌅', desc: '썰물 때 드러나는 이끼 암반, 일출 포인트', rating: 4.4, rc: 1500, travel: ['healing'], comp: ['couple', 'solo'], themes: ['sunset'], stay: 50 },
  { id: 126, name: '아부오름', t: 'activity', region: '제주시 구좌읍', lat: 33.421, lng: 126.756, img: '⛰️', desc: '완만해 오르기 쉬운 분화구 오름', rating: 4.4, rc: 720, travel: ['healing'], comp: ['family', 'couple'], themes: ['oreum', 'trekking'], senior: true, stay: 60 },
  { id: 127, name: '다랑쉬오름', t: 'activity', region: '제주시 구좌읍', lat: 33.478, lng: 126.845, img: '🥾', desc: '동부 오름의 여왕, 탁 트인 분화구', rating: 4.6, rc: 980, travel: ['activity'], comp: ['friends', 'solo'], themes: ['oreum', 'trekking'], stay: 90 },
  { id: 128, name: '성읍민속마을', t: 'activity', region: '서귀포시 표선면', lat: 33.386, lng: 126.797, img: '🏘️', desc: '옛 제주 초가와 돌담이 보존된 민속촌', rating: 4.3, rc: 1100, travel: ['activity'], comp: ['family'], themes: ['cultural'], child: true, senior: true, stay: 80 },
  { id: 129, name: '표선 해비치 해변', t: 'activity', region: '서귀포시 표선면', lat: 33.325, lng: 126.842, img: '🏖️', desc: '넓은 백사장과 얕은 물, 가족 물놀이', rating: 4.5, rc: 1900, travel: ['healing', 'camping_family'], comp: ['family'], themes: ['surf'], child: true, stay: 120 },
  { id: 130, name: '김녕미로공원', t: 'activity', region: '제주시 구좌읍 김녕리', lat: 33.552, lng: 126.760, img: '🌿', desc: '사철나무 미로, 아이와 술래잡기', rating: 4.4, rc: 860, travel: ['activity', 'camping_family'], comp: ['family'], themes: ['trekking'], child: true, stay: 60 },
  { id: 131, name: '성산 갈치조림 맛집', t: 'food', region: '서귀포시 성산읍', lat: 33.462, lng: 126.927, img: '🍲', desc: '통갈치조림·고등어구이 정식', rating: 4.6, rc: 2300, travel: ['activity'], comp: ['family', 'friends'], themes: ['food'], senior: true, stay: 70 },
  { id: 132, name: '구좌 당근케이크 카페', t: 'food', region: '제주시 구좌읍', lat: 33.545, lng: 126.800, img: '🥕', desc: '구좌 당근으로 만든 시그니처 디저트', rating: 4.5, rc: 1400, travel: ['healing'], comp: ['couple', 'friends'], themes: ['cafe'], stay: 60 },
  { id: 133, name: '종달리 소금빵 카페', t: 'food', region: '제주시 구좌읍 종달리', lat: 33.500, lng: 126.905, img: '🥐', desc: '한적한 마을 골목의 베이커리 카페', rating: 4.4, rc: 900, travel: ['healing', 'workation'], comp: ['solo', 'couple'], themes: ['cafe'], stay: 60 },
  { id: 134, name: '성산 오션뷰 호텔', t: 'stay', region: '서귀포시 성산읍', lat: 33.460, lng: 126.930, img: '🏨', desc: '일출봉 전망, 일출 명소 도보권', rating: 4.6, rc: 1600, travel: ['luxury', 'healing'], comp: ['couple'], themes: ['sunset'], stay: 720 },
  { id: 135, name: '세화 감성 스테이', t: 'stay', region: '제주시 구좌읍 세화리', lat: 33.524, lng: 126.855, img: '🏡', desc: '동부 바다 앞 소규모 감성 숙소', rating: 4.7, rc: 520, travel: ['healing', 'workation'], comp: ['couple', 'solo'], themes: ['surf', 'cafe'], stay: 720 },
  { id: 136, name: '표선 한옥 게스트하우스', t: 'stay', region: '서귀포시 표선면', lat: 33.388, lng: 126.795, img: '🏠', desc: '민속마을 인근 조용한 한옥 스테이', rating: 4.5, rc: 340, travel: ['healing'], comp: ['family', 'solo'], themes: ['cultural'], senior: true, stay: 720 },

  // ===== 서부 (한림·한경·대정·안덕·애월) =====
  { id: 150, name: '협재 해변', t: 'activity', region: '제주시 한림읍 협재리', lat: 33.394, lng: 126.240, img: '🏖️', desc: '비양도 배경의 에메랄드 바다', rating: 4.7, rc: 5600, travel: ['healing', 'activity'], comp: ['family', 'couple'], themes: ['surf', 'sunset'], child: true, stay: 120 },
  { id: 151, name: '금능 해변', t: 'activity', region: '제주시 한림읍 금능리', lat: 33.389, lng: 126.238, img: '🏖️', desc: '협재 옆 한적한 물놀이 해변', rating: 4.6, rc: 2100, travel: ['healing', 'camping_family'], comp: ['family'], themes: ['surf'], child: true, stay: 120 },
  { id: 152, name: '한림공원', t: 'activity', region: '제주시 한림읍', lat: 33.389, lng: 126.263, img: '🌴', desc: '야자수길·동굴·정원의 종합 관광지', rating: 4.4, rc: 3200, travel: ['activity'], comp: ['family'], themes: ['trekking'], child: true, senior: true, stay: 120 },
  { id: 153, name: '곽지 해변 & 한담 산책로', t: 'activity', region: '제주시 애월읍', lat: 33.451, lng: 126.305, img: '🚶', desc: '애월 해안 절경 산책과 노을', rating: 4.5, rc: 2400, travel: ['healing'], comp: ['couple', 'friends'], themes: ['sunset', 'cafe'], stay: 90 },
  { id: 154, name: '새별오름', t: 'activity', region: '제주시 애월읍', lat: 33.373, lng: 126.357, img: '🌋', desc: '억새와 들불축제로 유명한 오름', rating: 4.5, rc: 1800, travel: ['activity', 'healing'], comp: ['couple', 'friends'], themes: ['oreum', 'sunset'], stay: 70 },
  { id: 155, name: '금오름', t: 'activity', region: '제주시 한림읍', lat: 33.348, lng: 126.302, img: '⛰️', desc: '정상 분화구 습지, 패러글라이딩 명소', rating: 4.5, rc: 1500, travel: ['activity'], comp: ['friends', 'couple'], themes: ['oreum', 'trekking'], stay: 80 },
  { id: 156, name: '수월봉 지질트레일', t: 'activity', region: '제주시 한경면', lat: 33.293, lng: 126.166, img: '🌅', desc: '화산 지층 절벽과 일몰', rating: 4.4, rc: 780, travel: ['healing'], comp: ['solo', 'couple'], themes: ['sunset', 'trekking'], stay: 60 },
  { id: 157, name: '오설록 티 뮤지엄', t: 'activity', region: '서귀포시 안덕면', lat: 33.305, lng: 126.290, img: '🍵', desc: '녹차밭 전망과 티 카페·박물관', rating: 4.5, rc: 4100, travel: ['healing'], comp: ['couple', 'family'], themes: ['cafe', 'cultural'], child: true, stay: 100 },
  { id: 158, name: '산방산', t: 'activity', region: '서귀포시 안덕면 사계리', lat: 33.236, lng: 126.313, img: '🌋', desc: '종 모양 용암 돔과 산방굴사', rating: 4.4, rc: 2600, travel: ['activity'], comp: ['family', 'friends'], themes: ['cultural', 'trekking'], senior: true, stay: 80 },
  { id: 159, name: '용머리해안', t: 'activity', region: '서귀포시 안덕면 사계리', lat: 33.232, lng: 126.315, img: '🌊', desc: '바다로 뻗은 사암 절벽 트레일(물때 확인)', rating: 4.5, rc: 1900, travel: ['activity'], comp: ['couple', 'friends'], themes: ['trekking', 'sunset'], stay: 60 },
  { id: 160, name: '사계 해변 & 형제섬', t: 'activity', region: '서귀포시 안덕면 사계리', lat: 33.225, lng: 126.310, img: '🏝️', desc: '형제섬 배경의 노을과 조간대', rating: 4.4, rc: 1200, travel: ['healing'], comp: ['couple'], themes: ['sunset', 'surf'], stay: 60 },
  { id: 161, name: '송악산 둘레길', t: 'activity', region: '서귀포시 대정읍', lat: 33.204, lng: 126.291, img: '🥾', desc: '해안 절벽 따라 걷는 완만한 둘레길', rating: 4.5, rc: 1700, travel: ['healing', 'activity'], comp: ['friends', 'couple'], themes: ['trekking', 'sunset'], stay: 80 },
  { id: 162, name: '한림칼국수 보말집', t: 'food', region: '제주시 한림읍', lat: 33.412, lng: 126.267, img: '🍜', desc: '진한 보말(고둥) 칼국수', rating: 4.5, rc: 2200, travel: ['healing'], comp: ['family', 'solo'], themes: ['food'], senior: true, stay: 50 },
  { id: 163, name: '모슬포 방어·고등어회', t: 'food', region: '서귀포시 대정읍 모슬포', lat: 33.216, lng: 126.250, img: '🐟', desc: '겨울 최남단 방어 산지 직송회', rating: 4.6, rc: 1400, travel: ['activity'], comp: ['friends'], themes: ['food'], stay: 80 },
  { id: 164, name: '애월 오션뷰 대형카페', t: 'food', region: '제주시 애월읍', lat: 33.462, lng: 126.310, img: '☕', desc: '통유리 바다 전망의 베이커리 카페', rating: 4.5, rc: 3300, travel: ['healing', 'workation'], comp: ['couple', 'friends'], themes: ['cafe', 'sunset'], stay: 70 },
  { id: 165, name: '협재 흑돼지 연탄구이', t: 'food', region: '제주시 한림읍 협재리', lat: 33.393, lng: 126.245, img: '🥩', desc: '두툼한 흑돼지 연탄 직화', rating: 4.6, rc: 2600, travel: ['activity'], comp: ['friends', 'family'], themes: ['food'], stay: 80 },
  { id: 166, name: '협재 오션뷰 풀빌라', t: 'stay', region: '제주시 한림읍 협재리', lat: 33.393, lng: 126.244, img: '🏨', desc: '협재 바다 전망 프라이빗 풀빌라', rating: 4.8, rc: 640, travel: ['luxury', 'healing'], comp: ['couple', 'family'], themes: ['surf'], stay: 720 },
  { id: 167, name: '안덕 산방산뷰 펜션', t: 'stay', region: '서귀포시 안덕면', lat: 33.240, lng: 126.320, img: '🏡', desc: '산방산·바다를 함께 보는 조용한 숙소', rating: 4.6, rc: 380, travel: ['healing', 'workation'], comp: ['couple', 'solo'], themes: ['sunset'], stay: 720 },
  { id: 168, name: '한림 오션 글램핑', t: 'stay', region: '제주시 한림읍', lat: 33.400, lng: 126.255, img: '⛺', desc: '바다 근처 불멍 가능한 글램핑', rating: 4.5, rc: 720, travel: ['camping_family', 'activity'], comp: ['family', 'friends'], themes: ['camping'], child: true, stay: 720 },

  // ===== 남부 (서귀포·중문) =====
  { id: 180, name: '천지연폭포', t: 'activity', region: '서귀포시 천지동', lat: 33.247, lng: 126.554, img: '💧', desc: '도심에서 가까운 야간 조명 폭포', rating: 4.5, rc: 3600, travel: ['healing'], comp: ['family', 'couple'], themes: ['trekking'], child: true, senior: true, stay: 60 },
  { id: 181, name: '정방폭포', t: 'activity', region: '서귀포시 동홍동', lat: 33.244, lng: 126.573, img: '🌊', desc: '바다로 직접 떨어지는 해안 폭포', rating: 4.5, rc: 2400, travel: ['activity'], comp: ['couple', 'friends'], themes: ['sunset'], stay: 50 },
  { id: 182, name: '천제연폭포', t: 'activity', region: '서귀포시 중문동', lat: 33.253, lng: 126.418, img: '💧', desc: '3단 폭포와 선임교 산책', rating: 4.4, rc: 2100, travel: ['healing'], comp: ['family'], themes: ['trekking'], child: true, senior: true, stay: 70 },
  { id: 183, name: '중문색달 해변', t: 'activity', region: '서귀포시 중문동', lat: 33.240, lng: 126.410, img: '🏄', desc: '서핑과 대형 파도로 유명한 해변', rating: 4.5, rc: 3000, travel: ['activity'], comp: ['friends', 'couple'], themes: ['surf', 'sunset'], stay: 120 },
  { id: 184, name: '주상절리대(대포)', t: 'activity', region: '서귀포시 중문동', lat: 33.238, lng: 126.427, img: '🧱', desc: '육각 기둥 절벽에 부딪히는 파도', rating: 4.4, rc: 2800, travel: ['activity'], comp: ['family', 'couple'], themes: ['cultural'], senior: true, stay: 50 },
  { id: 185, name: '외돌개', t: 'activity', region: '서귀포시 서홍동', lat: 33.238, lng: 126.554, img: '🪨', desc: '홀로 선 바위와 해안 산책로', rating: 4.5, rc: 2200, travel: ['healing'], comp: ['couple', 'solo'], themes: ['trekking', 'sunset'], stay: 60 },
  { id: 186, name: '쇠소깍', t: 'activity', region: '서귀포시 하효동', lat: 33.256, lng: 126.612, img: '🛶', desc: '민물과 바다가 만나는 협곡, 투명카약', rating: 4.5, rc: 1900, travel: ['activity', 'healing'], comp: ['couple', 'family'], themes: ['trekking'], child: true, stay: 80 },
  { id: 187, name: '서귀포 매일올레시장', t: 'food', region: '서귀포시 서귀동', lat: 33.249, lng: 126.563, img: '🛍️', desc: '회국수·감귤·꽁치김밥 등 먹거리 시장', rating: 4.5, rc: 4100, travel: ['activity'], comp: ['family', 'friends'], themes: ['market', 'food'], stay: 80 },
  { id: 188, name: '이중섭 거리', t: 'activity', region: '서귀포시 서귀동', lat: 33.245, lng: 126.564, img: '🎨', desc: '화가 이중섭 거주지와 예술 골목', rating: 4.2, rc: 640, travel: ['healing'], comp: ['couple', 'solo'], themes: ['cultural'], stay: 50 },
  { id: 189, name: '여미지 식물원', t: 'activity', region: '서귀포시 중문동', lat: 33.248, lng: 126.417, img: '🌸', desc: '온실 정원과 전망대, 아이 동반 좋음', rating: 4.3, rc: 1200, travel: ['healing'], comp: ['family'], themes: ['trekking'], child: true, senior: true, stay: 80 },
  { id: 190, name: '테디베어 뮤지엄', t: 'activity', region: '서귀포시 중문동', lat: 33.245, lng: 126.412, img: '🧸', desc: '테마 전시로 아이·연인 모두 인기', rating: 4.3, rc: 1500, travel: ['activity'], comp: ['family', 'couple'], themes: ['cultural'], child: true, stay: 70 },
  { id: 191, name: '중문 해물뚝배기', t: 'food', region: '서귀포시 중문동', lat: 33.243, lng: 126.415, img: '🍲', desc: '전복·게 들어간 얼큰 해물뚝배기', rating: 4.5, rc: 1800, travel: ['healing'], comp: ['family'], themes: ['food'], senior: true, stay: 60 },
  { id: 192, name: '서귀포 흑돼지 두루치기', t: 'food', region: '서귀포시 서귀동', lat: 33.251, lng: 126.560, img: '🥩', desc: '자박한 양념 흑돼지 두루치기', rating: 4.5, rc: 1300, travel: ['activity'], comp: ['friends', 'family'], themes: ['food'], stay: 70 },
  { id: 193, name: '중문 오션뷰 대형카페', t: 'food', region: '서귀포시 중문동', lat: 33.245, lng: 126.420, img: '☕', desc: '바다 전망 통창의 베이커리 카페', rating: 4.5, rc: 2600, travel: ['healing', 'workation'], comp: ['couple', 'friends'], themes: ['cafe', 'sunset'], stay: 70 },
  { id: 194, name: '중문 리조트 스위트', t: 'stay', region: '서귀포시 중문동', lat: 33.242, lng: 126.413, img: '🏨', desc: '중문관광단지 내 오션뷰 리조트', rating: 4.7, rc: 2900, travel: ['luxury', 'healing'], comp: ['couple', 'family'], themes: ['sunset'], child: true, stay: 720 },
  { id: 195, name: '서귀포 감귤팜 스테이', t: 'stay', region: '서귀포시 남원읍', lat: 33.270, lng: 126.590, img: '🍊', desc: '감귤밭 체험이 있는 가족 숙소', rating: 4.5, rc: 460, travel: ['healing', 'camping_family'], comp: ['family'], themes: ['cultural'], child: true, senior: true, stay: 720 },
  { id: 196, name: '서귀포 원도심 게스트하우스', t: 'stay', region: '서귀포시 서귀동', lat: 33.252, lng: 126.565, img: '🛏️', desc: '올레시장·이중섭거리 도보권 저예산 숙소', rating: 4.3, rc: 880, travel: ['workation', 'activity'], comp: ['solo', 'friends'], themes: ['market'], stay: 720 },
];

export const JEJU_PLACES: Content[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  contentType: s.t,
  region: s.region,
  rating: s.rating,
  reviewCount: s.rc,
  image: s.img,
  desc: s.desc,
  tags: {
    travelType: s.travel,
    companion: s.comp,
    themes: s.themes,
    ...(s.child ? { hasChild: true } : {}),
    ...(s.senior ? { hasSenior: true } : {}),
  },
  lat: s.lat,
  lng: s.lng,
  avgStayMinutes: s.stay ?? 60,
  hashtags: s.tags,
}));
