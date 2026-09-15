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
  const ctx = await context(); const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(p => {
    localStorage.setItem('jeju_allin_profile', JSON.stringify({ ...p, nights: 0 }));
    localStorage.setItem('jeju_saved_trip_ids', JSON.stringify([101,102]));
  }, profile);
  await page.goto(origin + '/#/planner');
  await page.getByLabel('함덕 서우봉 해변 메모', { exact: true }).fill('예약 메모');
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_trip_v2')));
  await page.getByRole('button', { name: '함덕 서우봉 해변 일정에서 제외', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '함덕 서우봉 해변 일정에서 제외', exact: true }).count(), 0);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_saved_trip_ids'))), [102]);
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  assert.equal(await page.getByLabel('함덕 서우봉 해변 메모', { exact: true }).inputValue(), '예약 메모');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_trip_v2')).days), before.days);
  await page.getByRole('button', { name: '함덕 서우봉 해변 일정에서 제외', exact: true }).click();
  await page.reload();
  assert.equal(await page.getByRole('button', { name: '함덕 서우봉 해변 일정에서 제외', exact: true }).count(), 0);
  await page.getByRole('button', { name: '삼양 검은모래 해변 일정에서 제외', exact: true }).click();
  await page.getByRole('heading', { name: '동선을 만들려면 장소를 담아주세요', exact: true }).waitFor();
  await page.getByRole('button', { name: '되돌리기', exact: true }).click();
  await page.getByRole('button', { name: '삼양 검은모래 해변 일정에서 제외', exact: true }).waitFor();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { if(key === 'jeju_saved_trip_ids') throw new DOMException('quota', 'QuotaExceededError'); return original.call(this,key,value); };
  });
  await page.getByRole('button', { name: '삼양 검은모래 해변 일정에서 제외', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '삼양 검은모래 해변 일정에서 제외', exact: true }).count(), 1);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('jeju_trip_v2')).days), [[102]]);
  assert.deepEqual(errors, []);
  console.log('PASS: route exclusion, saved-list sync, undo order+notes, reload, last-place empty state, undo empty state, storage failure rollback.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
