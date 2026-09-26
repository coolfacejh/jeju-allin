import { OLLE_COURSES } from '../src/data/olle';
import { ollePlace, ollePlaceId, filterOlle } from '../src/lib/olle';
import { subcatOf } from '../src/lib/subcat';
import { accessRows, accessFit, linkAccessSources, mergeAccessSources } from '../src/lib/access';
import { uniqueCatalogue, fetchVisitPlaces, loadVisitCache } from '../src/lib/visitjeju';
import { fetchLivePlaces, loadLiveCache, LIVE_PAGES } from '../src/lib/live';
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


test('expanded tourism fetch replaces legacy cache, deduplicates and reuses sufficient cache', async () => {
  memory.set('jeju_live_cache_v2', JSON.stringify({ t: Date.now(), items: [external] }));
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ items: [external, external, { ...external, id: 990002 }] }));
  }) as typeof fetch;
  try {
    assert.equal((await fetchLivePlaces()).length, 2);
    assert.ok(urls[0].endsWith(`pages=${LIVE_PAGES}`));
    assert.equal((await fetchLivePlaces()).length, 2);
    assert.equal(urls.length, 1);
    await fetchLivePlaces({ force: true });
    assert.equal(urls.length, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('failed or empty catalogue refresh preserves existing cached places and saved trip', async () => {
  memory.set('jeju_live_cache_v2', JSON.stringify({ t: Date.now(), items: [external] }));
  rememberPlaces([external]); saveSavedIds([external.id]); saveProfile(profile);
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response(JSON.stringify({ items: [] }))) as typeof fetch;
    await assert.rejects(fetchLivePlaces({ force: true }));
    assert.equal(loadLiveCache()?.[0].id, external.id);
    assert.deepEqual(currentTrip().days.flat(), [external.id]);
    globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;
    await assert.rejects(fetchLivePlaces({ force: true }));
    assert.equal(loadLiveCache()?.[0].id, external.id);
  } finally { globalThis.fetch = originalFetch; }
});


test('VisitJeju deduplication preserves distant branches and saved IDs', () => {
  const visit:Content={...external,id:1000000000001,provenance:{source:'visitjeju'}};
  const original:Content={...external,provenance:{source:'tourapi'}};
  assert.equal(uniqueCatalogue([visit,original]).length,1);
  assert.equal(uniqueCatalogue([visit,{...original,lat:33.9}]).length,2);
  rememberPlaces([visit,original]);
  assert.equal(resolvePlaces([visit.id,original.id]).length,2);
  assert.equal(decodeTrip(encodeTrip(makeTrip([[visit]],0,2,{})))?.places[0].id,visit.id);
});

test('VisitJeju pagination caches only complete results and preserves cache on failure',async()=>{
 const originalFetch=globalThis.fetch;
 let calls=0;
 globalThis.fetch=(async(input:string|URL|Request)=>{calls++;const page=Number(new URL(String(input),'https://local.invalid').searchParams.get('page'));return new Response(JSON.stringify({page,pageCount:3,items:[{...external,id:1000000000000+page,provenance:{source:'visitjeju'}}]}));}) as typeof fetch;
 try {
  assert.equal((await fetchVisitPlaces()).length,3);assert.equal(calls,3);
  assert.equal((await fetchVisitPlaces()).length,3);assert.equal(calls,3);
  globalThis.fetch=(async()=>{throw new Error('offline');}) as typeof fetch;
  await assert.rejects(fetchVisitPlaces(true));assert.equal(loadVisitCache().length,3);
 }finally{globalThis.fetch=originalFetch;}
});


const accessPlace=(tags:string[]):Content=>({...external,provenance:{source:'visitjeju'},accessSources:[{source:'visitjeju',sourceId:'TEST',receivedAt:'2026-09-19',tags}]});
test('accessibility presence, absence, qualification and missing information stay distinct',()=>{
 const p=accessPlace(['주출입구 단차 없음','장애인 화장실 없음','장애인 전용 주차구역','경사로 있음 (가파름)','유모차 대여']);
 const rows=Object.fromEntries(accessRows(p).map(r=>[r.key,r.state]));
 assert.equal(rows.stepFree,'available');assert.equal(rows.restroom,'unavailable');assert.equal(rows.parking,'available');assert.equal(rows.ramp,'conditional');assert.equal(rows.route,'unknown');assert.equal(rows.elevator,'unknown');
});
test('required access distinguishes unknown from mismatch, legacy registration is not proof',()=>{
 const need={barrierFree:false,stroller:false,avoidNoKids:false,required:['restroom'] as const};
 const access={...need,required:[...need.required]};
 assert.equal(accessFit(accessPlace(['장애인 화장실']),access),'met');
 assert.equal(accessFit(accessPlace(['장애인 화장실 없음']),access),'mismatch');
 assert.equal(accessFit(accessPlace(['화장실','주차장']),access),'check');
 assert.equal(accessFit({...external,accessibility:{barrierFree:true}}, {...access,barrierFree:true}),'check');
});
test('different official sources retain contradictory evidence and nearby aliases keep IDs',()=>{
 const p=accessPlace(['장애인 화장실']);const q:Content={...external,id:100,provenance:{source:'tourapi'},accessSources:[{source:'tourapi',sourceId:'100',receivedAt:'2026-09-19',fields:{restroom:'없음'}}]};
 const linked=linkAccessSources([p,q]);assert.equal(linked.length,2);assert.deepEqual(linked.map(x=>x.id),[p.id,q.id]);
 assert.equal(accessRows(linked[0]).find(r=>r.key==='restroom')?.state,'conflict');
 assert.equal(accessRows(linked[1]).find(r=>r.key==='restroom')?.evidence.length,2);
 assert.equal(accessRows(linkAccessSources([p,{...q,lat:33.9}])[0]).find(r=>r.key==='restroom')?.state,'available');
});
test('source refresh supersedes older evidence and sharing does not certify facilities',()=>{
 const p=accessPlace(['장애인 화장실']);
 assert.deepEqual(mergeAccessSources(p.accessSources,[{...p.accessSources![0],receivedAt:'2026-09-20',tags:['장애인 화장실 없음']}])[0].tags,['장애인 화장실 없음']);
 const shared=decodeTrip(encodeTrip(makeTrip([[p]],0,2,{})))!;
 assert.equal(shared.places[0].accessSources,undefined);
 assert.ok(accessRows(shared.places[0]).every(r=>r.state==='unknown'));
});


test('VisitJeju golf courses classify without TourAPI codes including names without golf',()=>{
 for(const name of ['핀크스골프클럽','중문CC','해비치 컨트리클럽 제주','클럽나인브릿지','아난티 클럽 제주'])
  assert.equal(subcatOf({contentType:'activity',name,hashtags:['골프'],desc:'제주의 골프장'}),'골프',name);
 assert.equal(subcatOf({contentType:'activity',cat1:'A03',cat3:'A03020700',name:'시험 CC'}),'골프');
});
test('golf stores, events, accommodation and small-course activities are not full golf courses',()=>{
 const check=(name:string,expected:string)=>assert.equal(subcatOf({contentType:'activity',name,hashtags:['골프']}),expected,name);
 check('라온CC골프연습장','골프연습장');check('디아넥스 파크골프','파크·미니골프');check('제주 미니골프','파크·미니골프');
 check('말본골프 서귀포점','자연·명소');
 assert.equal(subcatOf({contentType:'activity',name:'말본골프 서귀포점',providerCategory:'쇼핑',hashtags:['골프']}),'쇼핑');
 check('제주 골프웨어 매장','쇼핑');check('제주 골프 마스터스','축제·공연');
 assert.equal(subcatOf({contentType:'stay',name:'테디밸리 골프앤리조트',hashtags:['골프']}),'호텔·리조트');
 assert.equal(subcatOf({contentType:'food',name:'미니골프카페',hashtags:['골프']}),'카페·찻집');
 assert.equal(subcatOf({contentType:'activity',name:'골프 입문 이야기',hashtags:['골프']}),'자연·명소');
});


test('Olle catalogue distinguishes alternatives and filters by full upper duration', () => {
  assert.equal(OLLE_COURSES.length, 29);
  assert.equal(new Set(OLLE_COURSES.map(ollePlaceId)).size, 29);
  for (const c of OLLE_COURSES) {
    assert.ok(c.distanceKm > 0 && c.hours[0] <= c.hours[1]);
    assert.ok(c.start.lat > 33 && c.end.lat < 34.1);
  }
  const f = { query: '', region: '', difficulty: '', time: 'short', island: false };
  assert.ok(filterOlle(OLLE_COURSES, f).every(c => c.hours[1] <= 4));
  assert.equal(filterOlle(OLLE_COURSES, { ...f, time: '', island: true }).length, 4);
  assert.deepEqual(filterOlle(OLLE_COURSES, { ...f, time: '', query: '3-' }).map(c => c.code), ['3-A', '3-B']);
});

test('Olle walking time survives storage and sharing without pretending it is a point route', () => {
  const c = OLLE_COURSES.find(c => c.slug === '03_A')!;
  const p = ollePlace(c, 60);
  assert.equal(p.avgStayMinutes, 480);
  assert.equal(p.lat, undefined);
  rememberPlaces([p]); saveSavedIds([p.id]);
  const trip = currentTrip();
  const decoded = decodeTrip(encodeTrip(trip));
  assert.ok(decoded);
  assert.equal(decoded!.places[0].avgStayMinutes, 480);
  const plan = scheduleDay([p], { ...DEFAULT_SCHEDULE, dayStart: '10:00', dayEnd: '17:00' });
  assert.equal(plan.stops[0].depart, '18:00');
  assert.equal(plan.complete, false);
  assert.ok(plan.warnings.some(w => w.includes('종점 이후')));
  assert.ok(plan.warnings.some(w => w.includes('일정 종료 한도')));
  const multi = scheduleDay([p, external]);
  assert.equal(multi.stops[1].arrive, '확인 필요');
});
