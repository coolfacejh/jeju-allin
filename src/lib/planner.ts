import type { Content } from '../types';

// P0: 담은 장소로 하루 동선 자동 생성 (MVP 단순안)
// - 좌표(위경도) 기반 최근접(nearest-neighbor) 순서
// - 이동시간은 직선거리 × 평균 렌터카 속도(40km/h)로 근사
// - 숙소(stay)가 있으면 출발 기준점으로 사용
// 2차에서 카카오/TMAP 경로 API로 실제 시간 대체 예정.

const AVG_SPEED_KMH = 40;
const START_HOUR = 10; // 10:00 출발

export interface RouteLeg {
  km: number;
  minutes: number;
}

export interface RouteStop {
  item: Content;
  arrive: string; // "HH:MM"
  depart: string; // "HH:MM"
  legFromPrev: RouteLeg | null; // 이전 지점 → 이 지점 이동
}

export interface RoutePlan {
  stops: RouteStop[];
  totalKm: number;
  totalTravelMin: number;
}

function haversineKm(a: Content, b: Content): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fmt(totalMinutes: number): string {
  const m = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function defaultStay(item: Content): number {
  // 숙소는 하루 동선의 출발/기준점 — 체크인 시간만 반영(장기 체류시간 제외)
  if (item.contentType === 'stay') return 30;
  if (item.contentType === 'food') return 60;
  return item.avgStayMinutes ?? 90;
}

// 좌표 기반 최근접 순서 정렬 (숙소를 출발점으로)
export function orderRoute(items: Content[]): Content[] {
  if (items.length <= 1) return items.slice();
  const startIdx = items.findIndex((i) => i.contentType === 'stay');
  const remaining = items.slice();
  const start = remaining.splice(startIdx === -1 ? 0 : startIdx, 1)[0];
  const ordered: Content[] = [start];
  let current = start;
  while (remaining.length > 0) {
    let best = 0;
    let bestKm = Infinity;
    remaining.forEach((cand, i) => {
      const km = haversineKm(current, cand);
      if (km < bestKm) {
        bestKm = km;
        best = i;
      }
    });
    current = remaining.splice(best, 1)[0];
    ordered.push(current);
  }
  return ordered;
}

// 이미 정해진 순서를 여러 날로 균등 분배 (연속 청크)
export function chunkIntoDays(ordered: Content[], days: number): Content[][] {
  const d = Math.max(1, days);
  const buckets: Content[][] = Array.from({ length: d }, () => []);
  if (ordered.length === 0) return buckets;
  const per = Math.ceil(ordered.length / d);
  ordered.forEach((item, i) => {
    const day = Math.min(d - 1, Math.floor(i / per));
    buckets[day].push(item);
  });
  return buckets;
}

// 주어진 순서(재정렬 반영)로 타임라인 스케줄만 계산
export function scheduleDay(ordered: Content[]): RoutePlan {
  const stops: RouteStop[] = [];
  let clock = START_HOUR * 60;
  let totalKm = 0;
  let totalTravelMin = 0;

  ordered.forEach((item, i) => {
    let leg: RouteLeg | null = null;
    if (i > 0) {
      const km = haversineKm(ordered[i - 1], item);
      const minutes = Math.round((km / AVG_SPEED_KMH) * 60);
      leg = { km: Math.round(km * 10) / 10, minutes };
      clock += minutes;
      totalKm += km;
      totalTravelMin += minutes;
    }
    const arrive = clock;
    const stay = defaultStay(item);
    clock += stay;
    stops.push({ item, arrive: fmt(arrive), depart: fmt(clock), legFromPrev: leg });
  });

  return {
    stops,
    totalKm: Math.round(totalKm * 10) / 10,
    totalTravelMin,
  };
}

// 단일 일정: 최근접 정렬 + 스케줄 (하위 호환)
export function planRoute(items: Content[]): RoutePlan {
  return scheduleDay(orderRoute(items));
}
