// 제주를 동/서/남/북 권역으로 분할 (좌표 기반 근사)
// 기준점: 제주 중심 대략 (위도 33.38, 경도 126.53)
export type Region4 = 'east' | 'west' | 'south' | 'north';

const CENTER_LAT = 33.38;
const CENTER_LNG = 126.53;

export function regionOf(lat?: number, lng?: number): Region4 | null {
  if (lat == null || lng == null) return null;
  const dx = lng - CENTER_LNG; // 동(+)/서(-)
  const dy = lat - CENTER_LAT; // 북(+)/남(-)
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'east' : 'west';
  return dy >= 0 ? 'north' : 'south';
}

export const REGION_LABEL: Record<Region4, string> = {
  east: '동부',
  west: '서부',
  south: '남부',
  north: '북부',
};

export const REGION_DESC: Record<Region4, string> = {
  east: '구좌·성산·표선',
  west: '한림·한경·대정·안덕',
  south: '서귀포·중문',
  north: '제주시·조천·애월',
};
