import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.ONBOARDING_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin&&!r.request().url().includes('/api/')?r.continue():r.fulfill({json:{items:[],pageCount:1}}));
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/onboarding');
  await p.getByRole('heading',{name:'어떤 환경이 필요한가요?'}).waitFor();
  await p.getByRole('button',{name:/장애인 화장실 장애인 화장실 시설 정보/}).click();
  assert.equal(await p.getByRole('button',{name:/장애인 화장실 장애인 화장실 시설 정보/}).getAttribute('aria-pressed'),'true');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`output/verification/onboarding-access-${width}.png`,fullPage:true});
  await p.getByRole('button',{name:/이 조건으로 장소 살펴보기/}).filter({visible:true}).click();
  await p.waitForURL('**/#/home');
  const profile=await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_allin_profile')));
  assert.equal(profile.travelType,null);assert.equal(profile.companion,null);assert.deepEqual(profile.access.required,['restroom']);
  await p.goto(origin+'/#/onboarding');
  assert.equal(await p.getByRole('button',{name:/장애인 화장실 장애인 화장실 시설 정보/}).getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('details').nth(0).evaluate(el=>el.open),true);
  await p.getByRole('button',{name:'인원 증가'}).click();
  assert.equal(await p.locator('details').nth(1).evaluate(el=>el.open),true);
  await p.getByRole('button',{name:/힐링 · 온전한 휴식/}).click();
  await p.getByRole('button',{name:/이 조건으로 장소 살펴보기/}).filter({visible:true}).click();await p.waitForURL('**/#/home');
  const edited=await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_allin_profile')));assert.equal(edited.headcount,3);assert.equal(edited.travelType,'healing');assert.deepEqual(edited.access.required,['restroom']);
  assert.deepEqual(errors,[]);console.log(`${width}: accessibility first, optional tastes, saved conditions, preserved controls PASS PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
