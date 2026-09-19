import { loadVisitCache } from './visitjeju';
import { CONTENTS } from '../data/contents';
import { loadLiveCache } from './live';
import type { Content } from '../types';

const KEY = 'jeju_place_snapshots_v1';

export function validPlace(value: unknown): value is Content {
  if (!value || typeof value !== 'object') return false;
  const p = value as Content;
  return Number.isSafeInteger(p.id) && p.id > 0 && typeof p.name === 'string' && p.name.length > 0 && p.name.length <= 200
    && ['stay', 'food', 'activity'].includes(p.contentType) && typeof p.region === 'string'
    && p.region.length <= 500 && typeof p.image === 'string' && typeof p.desc === 'string'
    && (p.avgStayMinutes == null || (Number.isFinite(p.avgStayMinutes) && p.avgStayMinutes >= 0 && p.avgStayMinutes <= 1440))
    && !!p.tags && Array.isArray(p.tags.travelType) && Array.isArray(p.tags.companion) && Array.isArray(p.tags.themes)
    && (p.lat == null || (Number.isFinite(p.lat) && Math.abs(p.lat) <= 90))
    && (p.lng == null || (Number.isFinite(p.lng) && Math.abs(p.lng) <= 180));
}

function snapshots(): Content[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(value) ? value.filter(validPlace) : [];
  } catch { return []; }
}

// Saved place snapshots have no cache expiry. Fresh API data takes precedence.
export function loadPlaces(extra: Content[] = []): Content[] {
  const all = [...CONTENTS, ...snapshots(), ...loadVisitCache(), ...(loadLiveCache() ?? []), ...extra];
  return [...new Map(all.filter(validPlace).map(p => [p.id, p])).values()];
}

export function rememberPlaces(places: Content[]): boolean {
  try {
    const merged = [...new Map([...snapshots(), ...places].filter(validPlace).map(p => [p.id, p])).values()];
    localStorage.setItem(KEY, JSON.stringify(merged));
    return true;
  } catch { return false; }
}

export function resolvePlaces(ids: number[], pool = loadPlaces()): Content[] {
  const index = new Map(pool.map(p => [p.id, p]));
  return ids.flatMap(id => index.has(id) ? [index.get(id)!] : []);
}
