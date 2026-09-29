import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.GEO_ROUTE_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  await ctx.route('**/*',r=>(new URL(r.request().url()).hostname.endsWith('openfreemap.org') || ['fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(r.request().url()).hostname) || (new URL(r.request().url()).origin===origin&&!r.request().url().includes('/api/')))?r.continue():r.fulfill({json:{items:[],pageCount:1}}));
  await ctx.addInitScript(()=>{
   if(localStorage.getItem('route-seeded'))return;
   localStorage.setItem('route-seeded','1');
   const places=['stay','food','food','activity','activity','activity','activity'].map((contentType,i)=>({id:770001+i,name:['서쪽숙소','동쪽식당','서쪽식당','동쪽관광1','서쪽관광1','동쪽관광2','서쪽관광2'][i],contentType,region:'제주',lat:33.35+i*.002,lng:[126.32,126.86,126.32,126.86,126.32,126.86,126.32][i],image:'🌊',desc:'',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]}}));
   localStorage.setItem('jeju_allin_profile',JSON.stringify({nights:1,headcount:2,travelType:null,companion:null,themes:[]}));
   localStorage.setItem('jeju_saved_trip_ids',JSON.stringify(places.map(p=>p.id)));
   localStorage.setItem('jeju_trip_v2',JSON.stringify({version:2,nights:1,headcount:2,days:[places.map(p=>p.id),[]],places,notes:{770001:'메모 유지'},schedule:{startDate:'2026-10-01',transport:'car',dayStart:'10:00',dayEnd:'20:00',arrivalBuffer:60,departureBuffer:120,visits:{}}}));
  });
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/planner');
  await p.getByRole('button',{name:'권역별로 날짜까지 다시 추천'}).click();
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')).days[1].length>0);
  const trip=await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')));
  for(const day of trip.days)assert.equal(new Set(day.map(id=>trip.places.find(p=>p.id===id).lng)).size,1);
  assert.equal(trip.days[0].at(-1),770001);assert.equal(trip.notes['770001'],'메모 유지');
  await p.locator('[data-basemap=vector-ready]').waitFor({timeout:60000});
  assert.equal(await p.locator('.route-stop-marker').count(),trip.days[0].length);
  assert.equal(await p.locator('.leaflet-overlay-pane path').count(),trip.days[0].length-1);
  await p.locator('[aria-label="일정 방문 순서 지도"]').scrollIntoViewIfNeeded();
  await p.screenshot({path:`output/verification/geographic-route-${width}.png`});
  await p.getByRole('button',{name:'날짜 재배정 되돌리기'}).click();
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')).days[1].length===0);
  await p.getByRole('button',{name:'권역별로 날짜까지 다시 추천'}).click();
  await p.reload();await p.getByRole('button',{name:/2일차/}).click();
  await p.locator('[data-basemap=vector-ready]').waitFor({timeout:60000});
  assert.equal(await p.locator('.route-stop-marker').count(),trip.days[1].length);
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')).days),trip.days);
  assert.deepEqual(errors,[]);console.log(`${width}: east/west separation, real vector map lines, undo and persistence PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
