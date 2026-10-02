import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.RESTROOM_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin&&!r.request().url().includes('/api/')?r.continue():r.fulfill({json:{items:[],pageCount:1}}));
  await ctx.addInitScript(()=>{
   localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:'healing',companion:'solo',hasChild:false,hasSenior:false,themes:[],nights:0,headcount:1,createdAt:''}));
   const p={id:990001,name:'검증용 장소',contentType:'activity',region:'제주시',image:'🍊',desc:'',lat:33.484509,lng:126.500513,rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]},provenance:{source:'visitjeju'},accessSources:[{source:'visitjeju',sourceId:'TEST',receivedAt:'2026-09-27',tags:['장애인 전용 주차구역','장애인 화장실','승강기']}]};
   localStorage.setItem('jeju_place_snapshots_v1',JSON.stringify([p,{...p,id:990002,accessSources:[]}]));
  });
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/place/990001');const panel=p.getByRole('region',{name:'주변 공중화장실'});await panel.waitFor();
  assert.ok(await p.locator('[data-restroom]').count()>0);
  assert.ok(await panel.getByText(/직선 약 0m/).count()>0);
  const first=p.locator('[data-restroom]').first();assert.ok((await first.getByRole('link',{name:'길찾기',exact:true}).getAttribute('href')).includes('/link/to/'));
  await panel.getByRole('checkbox',{name:'장애인용 변기 등록 시설만',exact:true}).check();assert.equal(await panel.getByText('장애인용 대변기: 등록 수량 0개',{exact:true}).count(),0);
  assert.deepEqual(await panel.locator('select option').evaluateAll(nodes=>nodes.map(n=>n.value)),['3','5','10']);
  for(const radius of ['3','5','10']){await panel.getByRole('combobox',{name:'화장실 검색 반경'}).selectOption(radius);assert.ok((await panel.getByRole('status').innerText()).includes(`반경 ${radius}km`));}await panel.scrollIntoViewIfNeeded();
  await p.screenshot({path:`output/verification/restrooms-${width}.png`});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem('jeju_place_snapshots_v1'));a[1].lat=null;a[1].lng=null;localStorage.setItem('jeju_place_snapshots_v1',JSON.stringify(a));});
  await p.goto(origin+'/#/place/990002');await p.getByText('이 장소의 좌표가 없어 가까운 순서를 계산할 수 없습니다.',{exact:true}).waitFor();
  assert.equal(await p.locator('[data-restroom]').count(),0);
  assert.equal(await panel.locator('details').count(),0);
  assert.equal(await p.locator('[data-address-restroom]').count(),0);
  assert.deepEqual(errors,[]);console.log(`${width}: official toilets, distance, accessibility filter, route links, missing coordinates, no overflow/errors PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
