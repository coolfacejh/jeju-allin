import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CONTENTS } from '../src/data/contents';
import { loadPlaces, rememberPlaces, resolvePlaces } from '../src/lib/places';
import { currentTrip, makeTrip, saveTrip, validTrip } from '../src/lib/trip';
import { encodeTrip, decodeTrip, shareUrl, doShare } from '../src/lib/share';
import { saveSavedIds, saveProfile } from '../src/lib/storage';
import { calculateCuration } from '../src/lib/curate';
import { scheduleDay } from '../src/lib/planner';
import { DEFAULT_SCHEDULE, dateForDay, validSchedule } from '../src/lib/schedule';
import type { Content, UserProfile } from '../src/types';

const memory = new Map<string, string>();
const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); }, removeItem: (k: string) => { memory.delete(k); } };
const external: Content = { id: 990001, name: '외부 장소 한글 🍊', contentType: 'food', region: '제주시', image: '🍊', desc: '', rating: 0, reviewCount: 0, lat: 33.5, lng: 126.5, tags: { travelType: [], companion: [], themes: [] } };
const a = CONTENTS[0], b = CONTENTS[1];
const profile: UserProfile = { travelType: 'healing', companion: 'family', hasChild: true, hasSenior: true, themes: ['sunset'], nights: 2, headcount: 4, createdAt: '' };
beforeEach(() => { memory.clear(); Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true }); });

test('catalogue excludes sample businesses, ratings and reviews', () => {
  assert.ok(CONTENTS.length > 20);
  assert.ok(CONTENTS.every(p => p.id >= 100 && p.contentType === 'activity' && p.rating === 0 && !p.reviews && !p.menu));
});
test('external saved snapshot survives expired live cache and preserves order', () => {
  rememberPlaces([external]);
  memory.set('jeju_live_cache_v2', JSON.stringify({ t: 0, items: [external] }));
  assert.deepEqual(resolvePlaces([external.id, b.id, a.id]).map(p => p.id), [external.id, b.id, a.id]);
  assert.equal(loadPlaces([external, external]).filter(p => p.id === external.id).length, 1);
});
test('new trip includes external places and one-place trips', () => {
  rememberPlaces([external]); saveSavedIds([external.id]); saveProfile(profile);
  assert.deepEqual(currentTrip().days, [[external.id], [], []]);
});
test('day changes, order and Korean notes survive save and reload', () => {
  rememberPlaces([external]); saveSavedIds([a.id, external.id, b.id]); saveProfile(profile);
  const t = makeTrip([[b, external], [], [a]], 2, 4, { [external.id]: '오후 1시 예약 🍊\n창가 자리' });
  assert.equal(saveTrip(t), true);
  assert.deepEqual(currentTrip().days, t.days);
  assert.deepEqual(currentTrip().notes, t.notes);
});
test('add/remove reconciles without reshuffling existing stops', () => {
  rememberPlaces([external]); saveProfile(profile); saveSavedIds([b.id, a.id]);
  saveTrip(makeTrip([[b, a], [], []], 2, 4, {}));
  saveSavedIds([b.id, external.id]);
  assert.deepEqual(currentTrip().days, [[b.id], [external.id], []]);
});
test('shortened trip retains all stops from removed days', () => {
  saveSavedIds([a.id, b.id]); saveProfile(profile); saveTrip(makeTrip([[b], [], [a]], 2, 4, {}));
  saveProfile({ ...profile, nights: 0 });
  assert.deepEqual(currentTrip().days, [[b.id, a.id]]);
});
test('share opens in empty storage with identical dates order and notes', () => {
  const t = makeTrip([[external, b], [], [a]], 2, 4, { [external.id]: '오후 1시 예약 🍊' });
  const link = encodeTrip(t); memory.clear(); const decoded = decodeTrip(link)!;
  assert.deepEqual(decoded.days, t.days); assert.deepEqual(decoded.notes, t.notes);
  assert.equal(decoded.places[0].name, external.name); assert.equal(decoded.headcount, 4);
  assert.equal(decoded.places[0].provenance?.source, 'shared');
});
test('legacy share preserves ID order and rejects unavailable places', () => {
  const link = btoa(JSON.stringify({ i: [b.id, a.id], n: 0, h: 2 }));
  assert.deepEqual(decodeTrip(link)?.days, [[b.id, a.id]]);
  assert.equal(decodeTrip(btoa(JSON.stringify({ i: [99999], n: 0, h: 2 }))), null);
});
test('invalid shares and duplicate/dangling references are rejected', () => {
  assert.equal(decodeTrip('garbage'), null); assert.equal(decodeTrip('x'.repeat(17000)), null);
  const t = makeTrip([[a]], 0, 1, {});
  assert.equal(validTrip({ ...t, days: [[a.id, a.id]] }), false);
  assert.equal(validTrip({ ...t, days: [[123456]] }), false);
  assert.equal(validTrip({ ...t, notes: { [a.id]: 'x'.repeat(501) } }), false);
  assert.equal(validTrip({ ...t, places: [{ ...a, avgStayMinutes: -1 }] }), false);
});
test('storage quota errors are surfaced', () => {
  Object.defineProperty(globalThis, 'localStorage', { value: { ...storage, setItem() { throw new Error('quota'); } }, configurable: true });
  assert.equal(saveTrip(makeTrip([[a]], 0, 1, {})), false); assert.equal(rememberPlaces([external]), false); assert.equal(saveSavedIds([a.id]), false);
});
test('recommendation does not invent facilities from child/senior tags', () => {
  const p = { ...a, tags: { ...a.tags, hasChild: true, hasSenior: true } };
  const reasons = calculateCuration([p], profile)[0].reasons.join(' ');
  assert.doesNotMatch(reasons, /수유|키즈존|안전 시설|완만한 보행|완벽/);
});
test('file-based app cannot create unusable relative share links', () => {
  Object.defineProperty(globalThis, 'location', { value: { protocol: 'file:' }, configurable: true });
  assert.throws(() => shareUrl(makeTrip([[a]], 0, 1, {})), /웹 주소/);
});
test('cancel share does not silently copy to clipboard', async () => {
  let copied = false;
  Object.defineProperty(globalThis, 'navigator', { value: { share: async () => { throw new DOMException('cancel', 'AbortError'); }, clipboard: { writeText: async () => { copied = true; } } }, configurable: true });
  assert.equal(await doShare('trip', 'text'), 'cancelled'); assert.equal(copied, false);
});


test('arrival buffer delays only the first day and departure buffer limits the last', () => {
  const settings = { ...DEFAULT_SCHEDULE, arrival: '12:00', arrivalBuffer: 60, departure: '16:00', departureBuffer: 120 };
  assert.equal(scheduleDay([a], settings, 0, 2).stops[0].arrive, '13:00');
  assert.equal(scheduleDay([a], settings, 1, 2).stops[0].arrive, '10:00');
  assert.equal(scheduleDay([a], settings, 2, 2).deadline, '14:00');
});
test('same-day flight conflict produces an explicit warning', () => {
  const plan = scheduleDay([a], { ...DEFAULT_SCHEDULE, arrival: '14:00', departure: '16:00' });
  assert.ok(plan.warnings.some(w => w.includes('여행 가능한 시간이 없습니다')));
});
test('walking estimate is slower than driving estimate', () => {
  const drive = scheduleDay([a, b]);
  const walk = scheduleDay([a, b], { ...DEFAULT_SCHEDULE, transport: 'walk' });
  assert.ok(walk.totalTravelMin > drive.totalTravelMin);
});
test('unknown coordinates do not masquerade as a zero-minute trip', () => {
  const noCoordinates = { ...b, lat: undefined, lng: undefined };
  const plan = scheduleDay([a, noCoordinates]);
  assert.equal(plan.complete, false); assert.equal(plan.stops[1].legFromPrev?.minutes, null);
  assert.equal(plan.stops[1].arrive, '확인 필요'); assert.equal(plan.stops[1].legFromPrev?.km, null);
});
test('ferry and transit segments suppress invented arrival times', () => {
  for (const plan of [scheduleDay([a, { ...b, name: '우도' }]), scheduleDay([a, b], { ...DEFAULT_SCHEDULE, transport: 'transit' })]) {
    assert.equal(plan.complete, false); assert.equal(plan.stops[1].arrive, '확인 필요'); assert.ok(plan.warnings.length);
  }
});
test('manual opening window waits and flags closing-time violations', () => {
  const plan = scheduleDay([a], { ...DEFAULT_SCHEDULE, visits: { [a.id]: { open: '13:00', close: '14:00', durationMin: 90 } } });
  assert.equal(plan.stops[0].arrive, '13:00'); assert.equal(plan.stops[0].depart, '14:30');
  assert.ok(plan.warnings.some(w => w.includes('방문 가능 마감')));
});
test('midnight overflow stays visible rather than silently wrapping to morning', () => {
  const plan = scheduleDay([a], { ...DEFAULT_SCHEDULE, dayStart: '23:00', dayEnd: '23:59', visits: { [a.id]: { durationMin: 120 } } });
  assert.equal(plan.stops[0].depart, '+1일 01:00'); assert.ok(plan.warnings.length);
});
test('calendar arithmetic handles leap years and rejects impossible dates', () => {
  assert.equal(dateForDay('2028-02-28', 1), '2028-02-29');
  assert.equal(dateForDay('2028-02-28', 2), '2028-03-01');
  assert.equal(validSchedule({ ...DEFAULT_SCHEDULE, startDate: '2027-02-29' }, []), false);
  assert.equal(validSchedule({ ...DEFAULT_SCHEDULE, dayStart: ['10:00'] }, []), false);
});
test('travel settings survive persistence, sharing and place removal', () => {
  const settings = { ...DEFAULT_SCHEDULE, startDate: '2027-05-01', transport: 'walk' as const, visits: { [a.id]: { durationMin: 45 }, [b.id]: { open: '12:00' } } };
  const trip = makeTrip([[a, b]], 0, 2, {}, settings);
  assert.equal(saveTrip(trip), true); saveSavedIds([a.id, b.id]);
  assert.deepEqual(currentTrip().schedule, settings);
  assert.deepEqual(decodeTrip(encodeTrip(trip))?.schedule, settings);
  saveSavedIds([b.id]); assert.deepEqual(currentTrip().schedule?.visits, { [b.id]: { open: '12:00' } });
});
test('invalid imported travel settings are rejected', () => {
  const trip = makeTrip([[a]], 0, 1, {});
  for (const schedule of [ { ...DEFAULT_SCHEDULE, departureBuffer: -1 }, { ...DEFAULT_SCHEDULE, visits: { [a.id]: { durationMin: 0 } } }, { ...DEFAULT_SCHEDULE, transport: 'plane' }, { ...DEFAULT_SCHEDULE, visits: { 999999: { durationMin: 45 } } } ]) {
    assert.equal(validTrip({ ...trip, schedule }), false);
  }
});
