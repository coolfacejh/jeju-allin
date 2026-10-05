import { matchesAccessRequirements, confirmedAccessDefault } from '../src/lib/access';
import { nearbyRestrooms, addressRestrooms, accessibleToilet, RESTROOM_CATALOGUE } from '../src/lib/restrooms';
import { confirmedPictograms } from '../src/lib/accessPictograms';
import { olleSegmentFacts, olleSegmentId, olleSegmentPlace, isOlleSegment } from '../src/lib/olle';
import { saveOlleVisit } from '../src/lib/olleTrip';
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
import { scheduleDay, orderRoute, recommendDays, balanceNearbyDays } from '../src/lib/planner';
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


test('Olle access segments have separate stable IDs and never inherit full-course times or facility claims', () => {
  const courses = OLLE_COURSES.filter(c => c.accessSegment);
  assert.equal(courses.length, 10);
  for (const c of courses) {
    assert.ok(olleSegmentFacts(c));
    assert.notEqual(olleSegmentId(c), ollePlaceId(c));
    assert.ok(isOlleSegment(olleSegmentId(c)));
    const p = olleSegmentPlace(c, 125);
    assert.equal(p.avgStayMinutes, 125);
    assert.equal(p.lat, undefined);
    assert.equal(p.accessibility, undefined);
    assert.equal(p.accessSources, undefined);
    const plan = scheduleDay([p]);
    assert.ok(plan.warnings.some(w => w.includes('공식 소요시간 아님')));
    assert.ok(!plan.warnings.some(w => w.includes('공식 도보')));
  }
  for (const duration of [0,-1,1.5,NaN,1441]) assert.throws(() => olleSegmentPlace(courses[0], duration));
  assert.throws(() => olleSegmentPlace(OLLE_COURSES.find(c => !c.accessSegment)!,120));
});

test('saving only an Olle segment preserves dates, order, notes and portable user duration', () => {
  saveProfile(profile);
  const c = OLLE_COURSES[0], segment = olleSegmentPlace(c,120);
  assert.equal(saveOlleVisit(segment,1),null);
  assert.deepEqual(currentTrip().days,[[],[segment.id],[]]);
  const t = currentTrip(); t.notes[segment.id]='휴식 포함'; saveTrip(t);
  assert.equal(saveOlleVisit(external, 1), '계획 시간은 1~1440분 사이로 입력해 주세요.');
  assert.equal(saveOlleVisit({...external, avgStayMinutes:60},1),null);
  assert.equal(saveOlleVisit(olleSegmentPlace(c,150),1),null);
  assert.deepEqual(currentTrip().days[1],[segment.id,external.id]);
  assert.equal(currentTrip().notes[segment.id],'휴식 포함');
  const shared = decodeTrip(encodeTrip(currentTrip()))!;
  assert.equal(shared.schedule!.visits[segment.id].durationMin,150);
  assert.ok(shared.places[0].name.includes('일부 구간'));
  assert.equal(saveOlleVisit(olleSegmentPlace(c,150),2),null);
  assert.deepEqual(currentTrip().days,[[],[external.id],[segment.id]]);
  assert.ok(!currentTrip().days.flat().includes(ollePlaceId(c)));
  assert.equal(saveOlleVisit(segment,9),'여행 날짜가 바뀌었어요. 화면을 다시 열고 날짜를 선택해 주세요.');
});


test('pictograms only represent equivalent confirmed facilities, never inferred grades', () => {
 assert.deepEqual(confirmedPictograms(accessPlace(['장애인 전용 주차구역','장애인 화장실','승강기'])).map(p=>p.pictogram.id),[14,12,16]);
 assert.deepEqual(confirmedPictograms(accessPlace(['주차장','화장실','경사로','단차 없음'])),[]);
 assert.deepEqual(confirmedPictograms(accessPlace(['장애인 화장실 도움 필요','승강기 없음'])),[]);
 const shared={...accessPlace(['장애인 화장실']),provenance:{source:'shared' as const}};
 assert.deepEqual(confirmedPictograms(shared),[]);
 const conflict=accessPlace(['장애인 화장실']);
 conflict.accessSources!.push({source:'tourapi',sourceId:'X',receivedAt:'2026-09-27',fields:{restroom:'없음'}});
 assert.deepEqual(confirmedPictograms(conflict),[]);
});


test('nearby toilets use valid coordinates, radius and explicit disabled counts without altering place evidence',()=>{
 const p=RESTROOM_CATALOGUE.items[0];
 const fixtures=[{...p,id:'near',lat:33.5,lng:126.5,maleAccessible:1,femaleAccessible:null},{...p,id:'unknown',lat:33.5001,lng:126.5,maleAccessible:null,femaleAccessible:null},{...p,id:'zero',lat:33.501,lng:126.5,maleAccessible:0,femaleAccessible:0},{...p,id:'far',lat:33.8,lng:126.5},{...p,id:'bad',lat:0,lng:0}];
 assert.deepEqual(nearbyRestrooms(33.5,126.5,1,false,fixtures).map(p=>p.id),['near','unknown','zero']);
 assert.deepEqual(nearbyRestrooms(33.5,126.5,1,true,fixtures).map(p=>p.id),['near']);
 assert.equal(accessibleToilet(fixtures[1]),'unknown');assert.equal(accessibleToilet(fixtures[2]),'unavailable');
 assert.deepEqual(nearbyRestrooms(undefined,126.5),[]);assert.deepEqual(nearbyRestrooms(0,0),[]);
 assert.ok(RESTROOM_CATALOGUE.items.length===906 && RESTROOM_CATALOGUE.items.every(p=>p.address.startsWith('제주특별자치도')&&(/^https:\/\/(www.data.go.kr|www.seogwipo.go.kr)\//).test(p.sourceUrl)));
});

test('Seogwipo official records remain searchable without fabricated coordinates or counts',()=>{
 const all=addressRestrooms('',false,'서귀포시');assert.equal(all.length,403);
 assert.equal(addressRestrooms('',true,'서귀포시').length,223);
 assert.ok(addressRestrooms('성산').length>0);
 assert.ok(all.every(p=>p.lat===null&&p.lng===null&&p.maleAccessible===null&&p.femaleAccessible===null));
 assert.equal(new Set(all.map(p=>p.id)).size,403);
 assert.equal(all.filter(p=>p.name==='서귀포자연휴양림').length,6);
 assert.equal(all.filter(p=>p.name==='서귀포자연휴양림'&&accessibleToilet(p)==='available').length,1);
});

test('accessibility-only profiles never invent travel-type or companion preferences',()=>{
 const results=calculateCuration(CONTENTS,{...profile,travelType:null,companion:null,hasChild:false,hasSenior:false,themes:[]});
 assert.ok(results.every(p=>p.matchScore===0&&p.reasons.length===0));
});

test('VisitJeju publishes first page before completion and shares a single fetch with later subscribers',async()=>{
 const original=globalThis.fetch;let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});let first!:()=>void;const ready=new Promise<void>(r=>{first=r;});let calls=0;
 globalThis.fetch=(async(input:string|URL|Request)=>{calls++;const n=Number(new URL(String(input),'https://local.invalid').searchParams.get('page'));if(n>1)await gate;return new Response(JSON.stringify({page:n,pageCount:3,items:[{...external,id:880000+n}]}));}) as typeof fetch;
 try{
  const progress:number[]=[];let finished=false;
  const one=fetchVisitPlaces(true,p=>{progress.push(p.loaded);first();});one.then(()=>{finished=true;});
  await ready;assert.equal(finished,false);assert.deepEqual(progress,[1]);
  const later:number[]=[];const two=fetchVisitPlaces(false,p=>later.push(p.loaded));assert.equal(one,two);assert.deepEqual(later,[1]);
  release();await one;assert.equal(calls,3);assert.deepEqual(progress,[1,3]);assert.deepEqual(later,[1,3]);
 }finally{release();globalThis.fetch=original;}
});

test('required facilities use AND matching and exclude negative evidence even in expanded mode',()=>{
 const needs:UserProfile['access']={barrierFree:false,stroller:false,avoidNoKids:false,required:['parking','elevator']};
 const both=accessPlace(['장애인 주차장','승강기']);
 const partial=accessPlace(['장애인 주차장']);
 const absent=accessPlace(['장애인 주차장','승강기 없음']);
 const conditional=accessPlace(['장애인 주차장','승강기 도움 필요']);
 assert.equal(matchesAccessRequirements(both,needs),true);
 for(const p of [partial,absent,conditional,external])assert.equal(matchesAccessRequirements(p,needs),false);
 assert.equal(matchesAccessRequirements(partial,needs,false),true);
 assert.equal(matchesAccessRequirements(absent,needs,false),false);
 assert.equal(confirmedAccessDefault({...needs,confirmedOnly:false}),true);
 assert.equal(confirmedAccessDefault({...needs,confirmedOnly:false,filterVersion:2}),false);
 assert.equal(matchesAccessRequirements(external),true);
});

const routePlace=(id:number,contentType:Content['contentType'],name:string):Content=>({...external,id,contentType,name,lat:33.5,lng:126.5,avgStayMinutes:90});
test('smart route places lodging last and restaurants at distinct lunch and dinner times',()=>{
 const hotel=routePlace(701,'stay','숙소'),lunch=routePlace(702,'food','식당1'),dinner=routePlace(703,'food','식당2');
 const activities=[704,705,706].map(id=>routePlace(id,'activity','관광'+id));
 const ordered=orderRoute([hotel,lunch,dinner,...activities]);
 assert.equal(ordered.at(-1)?.id,hotel.id);
 assert.deepEqual(new Set(ordered.map(p=>p.id)),new Set([hotel,lunch,dinner,...activities].map(p=>p.id)));
 const plan=scheduleDay(ordered);
 const meals=plan.stops.filter(s=>s.item.contentType==='food');
 assert.ok(meals[0].arrive>='12:00'&&meals[0].arrive<='14:00');assert.equal(meals[1].arrive,'18:00');
 assert.equal(plan.stops.at(-1)?.item.id,hotel.id);
 assert.ok(meals[1].waitMin!>0);
});
test('smart route distinguishes cafes, late arrival, unknown transport and explicit closing limits',()=>{
 const meal=routePlace(710,'food','식당'),cafe=routePlace(711,'food','카페'),hotel=routePlace(712,'stay','숙소');
 assert.equal(scheduleDay([cafe]).stops[0].arrive,'10:00');
 const late=scheduleDay([meal,hotel],{...DEFAULT_SCHEDULE,arrival:'15:00',visits:{[meal.id]:{close:'17:00'}}});
 assert.equal(late.stops[0].arrive,'18:00');assert.ok(late.warnings.some(w=>w.includes('마감')));
 const unknown=scheduleDay([cafe,meal],{...DEFAULT_SCHEDULE,transport:'transit'});
 assert.equal(unknown.stops[1].arrive,'확인 필요');
 const days=recommendDays([hotel,meal,cafe,...[713,714,715].map(id=>routePlace(id,'activity','관광'))],2);
 assert.equal(days[0].at(-1)?.id,hotel.id);assert.equal(new Set(days.flat().map(p=>p.id)).size,6);
});

test('geographic days keep eastern and western meals with nearby sights and lodging',()=>{
 const make=(id:number,side:string,type:Content['contentType']):Content=>({...routePlace(id,type,side+id),lat:33.4,lng:side==='동'?126.9:126.2});
 const places=[make(801,'동','activity'),make(802,'서','activity'),make(803,'서','food'),make(804,'동','food'),make(805,'동','activity'),make(806,'서','activity'),make(807,'서','stay')];
 const days=recommendDays(places,2);
 assert.equal(days[0].at(-1)?.id,807);
 for(const day of days)assert.equal(new Set(day.map(p=>p.name[0])).size,1);
 assert.equal(new Set(days.flat().map(p=>p.id)).size,places.length);
 const mixed=orderRoute(places);let crossings=0;for(let i=1;i<mixed.length;i++)if(mixed[i].name[0]!==mixed[i-1].name[0])crossings++;
 assert.ok(crossings<=1);assert.equal(mixed.at(-1)?.id,807);
 assert.ok(scheduleDay(mixed).warnings.some(w=>w.includes('장거리')));
 const unknown={...make(808,'동','food'),lat:undefined,lng:undefined};
 assert.equal(recommendDays([...places,unknown],3).flat().length,8);
});

test('nearby day balancing respects arrival deadline, lodging and unknown transit',()=>{
 const first=[901,902,903].map(id=>({...routePlace(id,'activity','관광'+id),avgStayMinutes:90}));
 const next=routePlace(904,'activity','다음날 관광'),hotel=routePlace(905,'stay','숙소');
 const settings={...DEFAULT_SCHEDULE,arrival:'15:00',dayEnd:'20:00'};
 const original=[[...first,hotel],[next]];
 const balanced=balanceNearbyDays(original,settings);
 assert.ok(balanced[0].length<original[0].length);
 assert.equal(balanced[0].at(-1)?.id,hotel.id);
 assert.equal(new Set(balanced.flat().map(p=>p.id)).size,5);
 assert.equal(original[0].length,4);
 const far=balanceNearbyDays([[...first,hotel],[{...next,lng:126.95}]],settings);
 assert.equal(far[0].length,4);
 const transit=balanceNearbyDays(original,{...settings,transport:'transit'});
 assert.deepEqual(transit,original);
});

import {eventVisible,koreaToday} from '../src/lib/events';
test('event dates overlap inclusively; expired, future and unknown events do not leak to results',()=>{
 const event={...external,contentType:'activity' as const,name:'제주 축제',event:{start:'2026-10-01',end:'2026-10-04'}};
 assert.equal(eventVisible(event,{startDate:'2026-10-04',nights:0}),true);
 assert.equal(eventVisible(event,{startDate:'2026-10-05',nights:2}),false);
 assert.equal(eventVisible(event,{startDate:'2026-09-28',nights:2}),false);
 assert.equal(eventVisible(event,{startDate:'2026-09-30',nights:1}),true);
 assert.equal(eventVisible({...event,event:{}},{startDate:'2026-10-01',nights:2}),false);
 assert.equal(eventVisible({...event,event:{start:'2026-02-30',end:'2026-10-04'}},{nights:2}),false);
 assert.equal(eventVisible(event,{nights:2},'2026-10-05'),false);
 assert.equal(eventVisible(event,{nights:2},'2026-10-04'),true);
 assert.equal(eventVisible(external,{startDate:'2026-10-05',nights:2}),true);
 assert.equal(koreaToday(new Date('2026-10-01T15:00:00Z')),'2026-10-02');
 assert.equal(eventVisible({...external,contentType:'activity',name:'2024 문화가 있는 날 실버마이크'},{nights:2}),false);
});
test('new itinerary inherits the date selected on onboarding',()=>{
 memory.clear();saveProfile({...profile,startDate:'2026-10-08'});
 assert.equal(currentTrip().schedule?.startDate,'2026-10-08');
});

test('saved legacy events in the reported screenshot cannot reappear in the generated itinerary',()=>{
 const snoopy={...external,id:991101,contentType:'activity' as const,name:"스누피가든 5월 가정의달 이벤트 'Picnic All Together'"};
 const festival={...snoopy,id:991102,name:'2026 숲멍쉬멍 대축제'};
 const permanent={...snoopy,id:991103,name:'스누피가든'};
 saveProfile({...profile,startDate:'2026-10-10'});
 rememberPlaces([snoopy,festival,permanent]);saveSavedIds([snoopy.id,festival.id,permanent.id]);
 saveTrip(makeTrip([[snoopy,festival,permanent],[],[]],2,4,{}));
 assert.equal(eventVisible(snoopy,{startDate:'2026-10-10',nights:2}),false);
 assert.equal(eventVisible(festival,{startDate:'2026-10-10',nights:2}),false);
 assert.deepEqual(currentTrip().places.map(p=>p.id),[permanent.id]);
 assert.equal(resolvePlaces([snoopy.id,festival.id]).length,2);
});

import {previousLodging,lodgingLast} from '../src/lib/planner';
test('lodging closes its day and anchors the next day without a duplicate visit or check-in duration',()=>{
 const hotel={...external,id:991201,name:'숙소',contentType:'stay' as const,lat:33.5,lng:126.5};
 const near={...external,id:991202,contentType:'activity' as const,lat:33.51,lng:126.5};
 const far={...near,id:991203,lat:33.55};
 const days=[lodgingLast([hotel,near]),[far]];
 assert.equal(days[0].at(-1)?.id,hotel.id);
 assert.equal(previousLodging(days,0),undefined);assert.equal(previousLodging(days,1)?.id,hotel.id);
 const plan=scheduleDay([near],DEFAULT_SCHEDULE,1,1,hotel);
 assert.equal(plan.stops.length,1);assert.ok(plan.stops[0].legFromPrev!.minutes!>0);
 assert.equal(plan.totalTravelMin,plan.stops[0].legFromPrev!.minutes);
 assert.equal(plan.stops[0].arrive,'10:02');
 assert.equal(orderRoute([far,near],DEFAULT_SCHEDULE,1,1,hotel)[0].id,near.id);
 assert.equal(scheduleDay([near],DEFAULT_SCHEDULE,1,1,{...hotel,lat:undefined}).complete,false);
 assert.equal(previousLodging([[],[near]],1),undefined);
});

import { insertRoutePlace, insertionEligible, nearbyKm } from '../src/lib/routeInsert';
import { saveTripSelection } from '../src/lib/trip';
test('manual insertion keeps other days, existing order and hotel origin; duplicates and limits are rejected',()=>{
 const sight={...external,id:992001,contentType:'activity' as const};
 const hotel={...external,id:992002,contentType:'stay' as const};
 const nextSight={...sight,id:992003};const cafe={...external,id:992004};
 const before=[[sight,hotel],[nextSight]];const inserted=insertRoutePlace(before,0,2,cafe);
 assert.deepEqual(inserted.map(b=>b.map(p=>p.id)),[[sight.id,cafe.id,hotel.id],[nextSight.id]]);
 assert.deepEqual(before[0].map(p=>p.id),[sight.id,hotel.id]);
 assert.equal(previousLodging(inserted,1)?.id,hotel.id);
 assert.throws(()=>insertRoutePlace(before,1,0,sight));assert.throws(()=>insertRoutePlace(before,2,0,cafe));
 assert.throws(()=>insertRoutePlace([Array.from({length:100},(_,i)=>({...sight,id:10000+i}))],0,0,cafe));
 assert.deepEqual(insertRoutePlace([[]],0,0,cafe)[0],[cafe]);
});
test('insertion candidates respect the individual day and require confirmed accessibility',()=>{
 const festival={...external,event:{start:'2026-10-10',end:'2026-10-10'}};
 const settings={...DEFAULT_SCHEDULE,startDate:'2026-10-09'};
 assert.equal(insertionEligible(festival,settings,0),false);assert.equal(insertionEligible(festival,settings,1),true);assert.equal(insertionEligible(festival,settings,2),false);
 assert.equal(insertionEligible(external,settings,0,{required:['parking']}),false);
 assert.equal(insertionEligible({...external,accessSources:[{source:'visitjeju',sourceId:'test',receivedAt:1,tags:['장애인 주차구역']}]},settings,0,{required:['parking']}),true);
 assert.equal(nearbyKm(external,{...external,lat:undefined}),null);assert.equal(nearbyKm(external,external),0);
});
test('inserted stops survive reload and undo restores selection; failed selection write rolls back',()=>{
 const first={...external,id:992101,contentType:'activity' as const},added={...external,id:992102};
 saveProfile({...profile,nights:0});rememberPlaces([first,added]);
 const original=makeTrip([[first]],0,4,{},DEFAULT_SCHEDULE);
 assert.ok(saveTripSelection(original,[first.id]));
 const next=makeTrip(insertRoutePlace([[first]],0,1,added),0,4,{}, {...DEFAULT_SCHEDULE,visits:{[added.id]:{durationMin:40}}});
 assert.ok(saveTripSelection(next,[first.id,added.id]));assert.deepEqual(currentTrip().days,next.days);
 assert.ok(saveTripSelection(original,[first.id]));assert.deepEqual(currentTrip().days,original.days);
 const old=storage.setItem;let fail=true;storage.setItem=(k,v)=>{if(k==='jeju_saved_trip_ids'&&fail){fail=false;throw Error('quota');}old(k,v);};
 try{assert.equal(saveTripSelection(next,[first.id,added.id]),false);assert.deepEqual(currentTrip().days,original.days);}finally{storage.setItem=old;}
});
