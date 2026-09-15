import type { ContentType } from '../types';
import type { Region4 } from './region';
export interface ExploreState {
  tab: 'all' | ContentType;
  sub: string;
  view: 'list' | 'map';
  region: 'all' | Region4;
  visibleCount: number;
  mapOnlyBF: boolean;
  accessOn: boolean;
  foodOn: boolean;
  petOn: boolean;
  scrollY: number;
}
export const EXPLORE_KEY = 'jeju_explore_v1';
const defaults: ExploreState = { tab: 'all', sub: 'all', view: 'list', region: 'all', visibleCount: 24, mapOnlyBF: false, accessOn: true, foodOn: true, petOn: true, scrollY: 0 };
// Per-tab browsing state, separate from the saved travel itinerary.
export function loadExplore(): ExploreState {
  try {
    const s = JSON.parse(sessionStorage.getItem(EXPLORE_KEY) ?? '{}');
    if (!s || typeof s !== 'object') return { ...defaults };
    return {
      tab: ['all', 'stay', 'food', 'activity'].includes(s.tab) ? s.tab : defaults.tab,
      sub: typeof s.sub === 'string' && s.sub.length <= 100 ? s.sub : 'all',
      view: s.view === 'map' ? 'map' : 'list',
      region: ['all', 'north', 'east', 'south', 'west'].includes(s.region) ? s.region : 'all',
      visibleCount: Number.isInteger(s.visibleCount) && s.visibleCount >= 24 && s.visibleCount <= 10000 ? s.visibleCount : 24,
      mapOnlyBF: s.mapOnlyBF === true, accessOn: s.accessOn !== false, foodOn: s.foodOn !== false, petOn: s.petOn !== false,
      scrollY: Number.isFinite(s.scrollY) && s.scrollY >= 0 ? Math.min(s.scrollY, 1000000) : 0,
    };
  } catch { return { ...defaults }; }
}
export function saveExplore(patch: Partial<ExploreState>): void {
  try { sessionStorage.setItem(EXPLORE_KEY, JSON.stringify({ ...loadExplore(), ...patch })); } catch { /* Browsing remains usable if storage is disabled. */ }
}
export interface MapViewport { lat: number; lng: number; zoom: number }
const MAP_KEY = 'jeju_explore_map_v1';
export function loadMapViewport(): MapViewport | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(MAP_KEY) ?? 'null');
    return s && Number.isFinite(s.lat) && s.lat >= 33.1 && s.lat <= 33.62
      && Number.isFinite(s.lng) && s.lng >= 126.1 && s.lng <= 127
      && Number.isFinite(s.zoom) && s.zoom >= 9 && s.zoom <= 19 ? s : null;
  } catch { return null; }
}
export function saveMapViewport(viewport: MapViewport): void {
  try { sessionStorage.setItem(MAP_KEY, JSON.stringify(viewport)); } catch { /* optional */ }
}
