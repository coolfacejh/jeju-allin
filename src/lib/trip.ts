import type { Content } from '../types';
import { validSchedule, type ScheduleSettings } from './schedule';
import { loadSavedIds, loadProfile, loadPlanNotes } from './storage';
import { resolvePlaces, validPlace } from './places';
import { chunkIntoDays, orderRoute } from './planner';

export interface Trip {
  version: 2;
  schedule?: ScheduleSettings;
  nights: number;
  headcount: number;
  days: number[][];
  places: Content[];
  notes: Record<string, string>;
}
export const TRIP_KEY = 'jeju_trip_v2';

export function validTrip(value: unknown): value is Trip {
  if (!value || typeof value !== 'object') return false;
  const t = value as Trip;
  if (t.version !== 2 || !Number.isInteger(t.nights) || t.nights < 0 || t.nights > 30
    || !Number.isInteger(t.headcount) || t.headcount < 1 || t.headcount > 100
    || !Array.isArray(t.days) || t.days.length !== t.nights + 1
    || !t.days.every(d => Array.isArray(d) && d.every(id => Number.isSafeInteger(id) && id > 0))
    || !Array.isArray(t.places) || t.places.length > 100 || !t.places.every(validPlace)
    || !t.notes || typeof t.notes !== 'object' || Array.isArray(t.notes)) return false;
  const ids = t.days.flat();
  const placeIds = new Set(t.places.map(p => p.id));
  return (t.schedule === undefined || validSchedule(t.schedule, ids)) && ids.length <= 100 && new Set(ids).size === ids.length && placeIds.size === t.places.length
    && ids.length === t.places.length && ids.every(id => placeIds.has(id))
    && Object.entries(t.notes).every(([id, note]) => ids.includes(Number(id)) && typeof note === 'string' && note.length <= 500);
}

export function loadTrip(): Trip | null {
  try { const t: unknown = JSON.parse(localStorage.getItem(TRIP_KEY) ?? 'null'); return validTrip(t) ? t : null; }
  catch { return null; }
}

export function saveTrip(trip: Trip): boolean {
  if (!validTrip(trip)) return false;
  try { localStorage.setItem(TRIP_KEY, JSON.stringify(trip)); return true; }
  catch { return false; }
}

export function makeTrip(buckets: Content[][], nights: number, headcount: number, notes: Record<string, string>, schedule?: ScheduleSettings): Trip {
  const places = buckets.flat();
  const cleanSchedule = schedule ? { ...schedule, visits: Object.fromEntries(Object.entries(schedule.visits).filter(([id]) => places.some(p => p.id === Number(id)))) } : undefined;
  return { version: 2, schedule: cleanSchedule, nights, headcount, days: buckets.map(d => d.map(p => p.id)), places,
    notes: Object.fromEntries(places.filter(p => notes[p.id]).map(p => [p.id, notes[p.id].slice(0, 500)])) };
}

// Reconcile additions/deletions without discarding the user's existing order.
export function currentTrip(): Trip {
  const stored = loadTrip();
  const profile = loadProfile();
  const requestedNights = profile?.nights ?? stored?.nights ?? 0;
  const nights = Number.isInteger(requestedNights) ? Math.max(0, Math.min(30, requestedNights)) : 0;
  const requestedHeadcount = profile?.headcount ?? stored?.headcount ?? 1;
  const headcount = Number.isInteger(requestedHeadcount) ? Math.max(1, Math.min(100, requestedHeadcount)) : 1;
  const ids = [...new Set(loadSavedIds())];
  const places = resolvePlaces(ids);
  const pool = new Map([...(stored?.places ?? []), ...places].map(p => [p.id, p]));
  const available = ids.flatMap(id => pool.has(id) ? [pool.get(id)!] : []);
  if (!stored) return makeTrip(chunkIntoDays(orderRoute(available), nights + 1), nights, headcount, loadPlanNotes());
  const buckets: Content[][] = Array.from({ length: nights + 1 }, () => []);
  stored.days.forEach((day, i) => day.forEach(id => {
    if (ids.includes(id) && pool.has(id)) buckets[Math.min(i, nights)].push(pool.get(id)!);
  }));
  const assigned = new Set(buckets.flat().map(p => p.id));
  available.filter(p => !assigned.has(p.id)).forEach(p => {
    const shortest = buckets.reduce((best, b, i) => b.length < buckets[best].length ? i : best, 0);
    buckets[shortest].push(p);
  });
  return makeTrip(buckets, nights, headcount, stored.notes, stored.schedule);
}
