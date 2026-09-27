import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.PICTOGRAM_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin&&!r.request().url().includes('/api/')?r.continue():r.fulfill({json:{items:[],pageCount:1}}));
  await ctx.addInitScript(()=>{
   localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:'healing',companion:'solo',hasChild:false,hasSenior:false,themes:[],nights:0,headcount:1,createdAt:''}));
   const p={id:990001,name:'검증용 장소',contentType:'activity',region:'제주시',image:'🍊',desc:'',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]},provenance:{source:'visitjeju'},accessSources:[{source:'visitjeju',sourceId:'TEST',receivedAt:'2026-09-27',tags:['장애인 전용 주차구역','장애인 화장실','승강기']}]};
   localStorage.setItem('jeju_place_snapshots_v1',JSON.stringify([p,{...p,id:990002,accessSources:[]}]));
  });
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/access-guide');
  await p.locator('[data-pictogram]').last().waitFor();
  assert.equal(await p.locator('[data-pictogram]').count(),37);
  await p.waitForFunction(()=>[...document.querySelectorAll('[data-pictogram] img')].every(i=>i.complete&&i.naturalWidth>0));
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`output/verification/pictograms-${width}.png`});
  await p.getByRole('button',{name:'영유아·돌봄',exact:true}).click();assert.equal(await p.locator('[data-pictogram]').count(),4);
  await p.getByRole('button',{name:'전체',exact:true}).click();
  await p.getByPlaceholder('예: 화장실, 경사로, 대여').fill('경사로');assert.equal(await p.locator('[data-pictogram]').count(),3);
  await p.getByPlaceholder('예: 화장실, 경사로, 대여').fill('존재하지않는항목');assert.equal(await p.locator('[data-pictogram]').count(),0);
  await p.goto(origin+'/#/place/990001');await p.locator('[data-access-row]').last().waitFor();
  assert.equal(await p.locator('[data-access-icon]').count(),6);
  assert.equal(await p.locator('[data-access-state="available"]').count(),3);
  await p.locator('[aria-label="접근성 상세 정보"]').scrollIntoViewIfNeeded();
  await p.screenshot({path:`output/verification/place-icons-${width}.png`});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.goto(origin+'/#/place/990002');await p.locator('[data-access-row]').last().waitFor();
  assert.equal(await p.locator('[data-access-icon]').count(),6);
  assert.equal(await p.locator('[data-access-state="unknown"]').count(),6);
  await p.getByRole('link',{name:'픽토그램 뜻 보기',exact:true}).click();await p.getByRole('heading',{name:'무장애 관광자료',exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log(`${width}: 37 images, groups/search, evidence-only facilities, place entry, no overflow/errors PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
