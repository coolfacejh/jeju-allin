import type { Content } from '../types';
import { OLLE_COURSES, type OlleCourse } from '../data/olle';

// Reserved IDs below the VisitJeju range; derive from the code, never array position.
export function ollePlaceId(c: OlleCourse): number {
  const [main, branch] = c.slug.split('_');
  return 900_000_000_000 + Number(main) * 10 + ({ A: 3, B: 4 }[branch] ?? Number(branch || 0));
}
export function courseForPlace(id: number): OlleCourse | undefined {
  return OLLE_COURSES.find(c => ollePlaceId(c) === id);
}
export const olleSourceUrl = (c: OlleCourse) => `https://www.jejuolle.org/trail#/road/${c.slug}`;
export function olleDuration(c: OlleCourse, rest = 30): number {
  return c.hours[1] * 60 + rest;
}
export function ollePlace(c: OlleCourse, rest = 30): Content {
  return { id: ollePlaceId(c), name: `제주올레 ${c.code}코스 · ${c.name}`, contentType: 'activity',
    region: c.region, image: '🥾', rating: 0, reviewCount: 0,
    desc: `${c.distanceKm}km · 공식 ${c.hours.join('~')}시간 · ${c.difficulty}. 일정 ${olleDuration(c, rest)}분(공식 소요시간 상한 + 여유 ${rest}분). 출발·도착 이동 별도.`,
    avgStayMinutes: olleDuration(c, rest), provenance: { source: 'local', sourceId: `olle:${c.slug}` },
    tags: { travelType: ['healing','activity'], companion: [], themes: ['trekking'] } };
  // No single-point coordinates: a walking course finishes somewhere else.
}
export interface OlleFilters { query: string; region: string; difficulty: string; time: string; island: boolean }
export function filterOlle(courses: OlleCourse[], f: OlleFilters): OlleCourse[] {
  const q = f.query.trim().toLowerCase();
  return courses.filter(c => (!q || `${c.code} ${c.name} ${c.region}`.toLowerCase().includes(q))
    && (!f.region || c.region === f.region) && (!f.difficulty || c.difficulty === f.difficulty)
    && (!f.island || !!c.island) && (!f.time || (f.time === 'short' ? c.hours[1] <= 4 : f.time === 'medium' ? c.hours[1] > 4 && c.hours[1] <= 6 : c.hours[1] > 6)));
}
