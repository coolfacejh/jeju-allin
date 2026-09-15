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
const external = { id: 990001, name: '복원 테스트 숙소', contentType: 'stay', region: '제주시', image: '🍊', desc: '시험용 응답', rating: 0, reviewCount: 0, lat: 33.5, lng: 126.5, tags: { travelType: ['healing'], companion: ['family'], themes: ['food'] } };
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
  const ctx = await context(); const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(p => localStorage.setItem('jeju_allin_profile', JSON.stringify(p)), profile);
  await page.goto(origin + '/#/home');
  await page.getByRole('button', { name: /머무를 곳/ }).click();
  await page.getByRole('button', { name: '지도', exact: true }).click();
  await page.getByRole('button', { name: '북부', exact: true }).click();
  const map = page.locator('.leaflet-container');
  await map.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.waitForTimeout(400);
  const marker = page.locator('.leaflet-marker-icon').first();
  await marker.click();
  await page.getByRole('button', { name: '상세 보기', exact: true }).waitFor();
  await page.waitForTimeout(400);
  const expectedViewport = await page.evaluate(() => JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')));
  const beforeBox = await marker.boundingBox(); const mapBox = await map.boundingBox();
  const relativeBefore = { x: beforeBox.x - mapBox.x, y: beforeBox.y - mapBox.y };
  await page.getByRole('button', { name: '상세 보기', exact: true }).click();
  await page.waitForURL('**/#/place/990001');
  const expectedScroll = await page.evaluate(() => JSON.parse(sessionStorage.getItem('jeju_explore_v1')).scrollY);
  await page.getByRole('button', { name: '일정에 담기', exact: false }).click();
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await page.waitForURL('**/#/home');
  await map.waitFor();
  await page.waitForTimeout(400);
  assert.equal(await page.getByRole('button', { name: /머무를 곳/ }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: '지도', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: '북부', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.ok(Math.abs((await page.evaluate(() => window.scrollY)) - expectedScroll) <= 3, 'page scroll restored');
  const afterBox = await marker.boundingBox(); const afterMapBox = await map.boundingBox();
  assert.ok(Math.abs(afterBox.x - afterMapBox.x - relativeBefore.x) <= 3, 'map longitude restored');
  assert.ok(Math.abs(afterBox.y - afterMapBox.y - relativeBefore.y) <= 3, 'map latitude restored');
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('jeju_explore_map_v1'))), expectedViewport);
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_saved_trip_ids')).includes(990001)));
  // Browser back, the detail home button and reload should also retain filters.
  for (const back of ['browser', 'home']) {
    await marker.click(); await page.getByRole('button', { name: '상세 보기', exact: true }).click();
    await page.waitForURL('**/#/place/990001');
    if (back === 'browser') await page.goBack();
    else await page.getByRole('button', { name: '큐레이션', exact: true }).click();
    await page.waitForURL('**/#/home');
    await map.waitFor();
    assert.equal(await page.getByRole('button', { name: '북부', exact: true }).getAttribute('aria-pressed'), 'true');
  }
  await page.reload(); await map.waitFor();
  assert.equal(await page.getByRole('button', { name: /머무를 곳/ }).getAttribute('aria-pressed'), 'true');
  await mkdir('output/verification', { recursive: true });
  await page.screenshot({ path: 'output/verification/explore-restored.png', fullPage: true });
  await page.getByRole('button', { name: '전체 선택 초기화', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '전체보기', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.deepEqual(errors, []);
  console.log('PASS: accommodation/map/region selection, saved place, map zoom+center, page scroll, app back, browser back, detail home button, reload and explicit reset.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
