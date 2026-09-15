import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const runtime = process.env.PLAYWRIGHT_MODULE;
if (!runtime) throw new Error('Set PLAYWRIGHT_MODULE to the installed playwright index.mjs');
const { chromium } = await import(pathToFileURL(runtime).href);
const html = await readFile('dist/index.html');
const server = createServer((_req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const errors = [];
const external = { id: 990001, name: '외부 장소 테스트', contentType: 'food', region: '제주시', image: '🍊', desc: '시험용 응답', rating: 0, reviewCount: 0, lat: 33.5, lng: 126.5, tags: { travelType: ['healing'], companion: ['family'], themes: ['food'] } };
const profile = { travelType: 'healing', companion: 'family', hasChild: false, hasSenior: false, themes: ['sunset'], nights: 2, headcount: 4, createdAt: '' };
async function context() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname.endsWith('supabase.co')) return route.fulfill({ json: url.searchParams.has('bf') ? { ids: [], has: false } : { items: [external] } });
    if (['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'].includes(url.hostname)) return route.continue();
    return route.abort();
  });
  return ctx;
}
try {
  const author = await context(); const page = await author.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(p => localStorage.setItem('jeju_allin_profile', JSON.stringify(p)), profile);
  await page.goto(origin + '/#/home');
  for (const name of ['외부 장소 테스트', '함덕 서우봉 해변', '삼양 검은모래 해변']) {
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
    // The home feed initially shows a limited number of cards. Search to locate each one.
    if (!(await card.count())) {
      await page.getByPlaceholder('예) 흑돼지, 일몰, 아이랑 물놀이, 감성카페…').fill(name);
    }
    await card.getByRole('button', { name: '일정에 담기', exact: false }).click();
    await page.getByPlaceholder('예) 흑돼지, 일몰, 아이랑 물놀이, 감성카페…').fill('');
  }
  await page.goto(origin + '/#/my-trip');
  await page.getByRole('heading', { name: '외부 장소 테스트', exact: true }).waitFor();
  await page.getByRole('button', { name: /여행 일정 만들기/ }).click();
  await page.getByRole('combobox', { name: /방문 날짜$/ }).first().selectOption('2');
  await page.getByRole('button', { name: /3일차/ }).click();
  const inputs = page.locator('input[maxlength="500"]');
  await inputs.first().fill('오후 1시 예약 🍊');
  if (await page.getByRole('button', { name: '아래로', exact: true }).count() > 1) await page.getByRole('button', { name: '아래로', exact: true }).first().click();
  await page.getByLabel('여행 시작일', { exact: true }).fill('2027-05-01');
  await page.getByLabel('이동수단', { exact: true }).selectOption('walk');
  await page.getByText('활동 시간 · 항공편 전후 여유시간', { exact: true }).click();
  await page.getByLabel('마지막 날 제주 출발', { exact: true }).fill('16:00');
  await page.getByLabel('출발 전 확보시간(분)', { exact: true }).fill('120');
  await page.getByText('직접 확인한 방문 시간 · 체류시간', { exact: true }).first().click();
  await page.getByRole('spinbutton', { name: /체류시간$/ }).first().fill('180');
  await page.getByRole('alert').filter({ hasText: '일정 조정이 필요해요' }).waitFor();
  const expected = await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_trip_v2')));
  assert.ok(expected.places.some(p => p.id === external.id));
  await page.reload();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_trip_v2')).days), expected.days);
  await page.getByRole('button', { name: /3일차/ }).click();
  assert.equal(await page.getByLabel('여행 시작일', { exact: true }).inputValue(), '2027-05-01');
  assert.equal(await page.getByLabel('이동수단', { exact: true }).inputValue(), 'walk');
  assert.ok((await inputs.evaluateAll(nodes => nodes.map(n => n.value))).includes('오후 1시 예약 🍊'));
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__share = text; } }, configurable: true });
  });
  await page.getByRole('button', { name: '공유', exact: false }).click();
  await page.waitForFunction(() => !!window.__share);
  const text = await page.evaluate(() => window.__share);
  const url = text.split('\n').find(line => line.startsWith(origin));
  assert.ok(url && url.includes('v2.'));
  const recipient = await context(); const other = await recipient.newPage(); other.on('pageerror', e => errors.push(e.message));
  await other.goto(url);
  await other.getByRole('heading', { name: '함께 떠나요, 제주 여행' }).waitFor();
  assert.equal(await other.locator('article').count(), 3);
  assert.ok((await other.textContent('main')).includes('오후 1시 예약 🍊'));
  await other.getByRole('button', { name: '이 일정을 내 여행으로 저장', exact: true }).click();
  await other.waitForURL('**/#/planner');
  const actual = await other.evaluate(() => JSON.parse(localStorage.getItem('jeju_trip_v2')));
  assert.deepEqual(actual.days, expected.days); assert.deepEqual(actual.notes, expected.notes);
  assert.deepEqual(actual.schedule, expected.schedule);
  assert.equal(actual.headcount, 4); assert.equal(actual.nights, 2);
  // Expiring API data must not erase a saved place or its detail screen.
  await page.evaluate(() => localStorage.removeItem('jeju_live_cache_v2'));
  await page.goto(origin + '/#/place/990001');
  await page.getByRole('heading', { name: '외부 장소 테스트', exact: true }).waitFor();
  await page.goto(origin + '/#/planner'); await page.getByRole('button', { name: /3일차/ }).click();
  await mkdir('output/verification', { recursive: true });
  await page.screenshot({ path: 'output/verification/planner.png', fullPage: true });
  await other.goto(url); await other.screenshot({ path: 'output/verification/shared-trip.png', fullPage: true });
  await other.getByRole('button', { name: '이 일정을 내 여행으로 저장', exact: true }).click();
  assert.equal(await other.getByRole('button', { name: '현재 일정을 이 여행으로 바꾸기', exact: true }).count(), 1);
  await other.getByRole('button', { name: '취소', exact: true }).click();
  await other.goto(origin + '/#/trip?d=broken');
  await other.getByRole('heading', { name: '공유 여행을 열 수 없어요' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: UI save, external place, day move, reorder, note, reload, clean-browser share/import, expiry, overwrite confirmation and broken-link handling. Travel date, flight deadline, walking mode, visit duration and warnings also verified. No browser runtime errors.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
