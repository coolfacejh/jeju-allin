import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.SMART_ROUTE_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin&&!r.request().url().includes('/api/')?r.continue():r.fulfill({json:{items:[],pageCount:1}}));
  await ctx.addInitScript(()=>{
   if(localStorage.getItem('route-seeded'))return;
   localStorage.setItem('route-seeded','1');
   const places=['stay','food','food','activity','activity','activity'].map((contentType,i)=>({id:770001+i,name:['숙소','점심식당','저녁식당','관광1','관광2','관광3'][i],contentType,region:'제주시',lat:33.5,lng:126.5,image:'🌊',desc:'',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]}}));
   localStorage.setItem('jeju_allin_profile',JSON.stringify({nights:0,headcount:2,travelType:null,companion:null,themes:[]}));
   localStorage.setItem('jeju_saved_trip_ids',JSON.stringify(places.map(p=>p.id)));
   localStorage.setItem('jeju_trip_v2',JSON.stringify({version:2,nights:0,headcount:2,days:[places.map(p=>p.id)],places,notes:{770001:'메모 유지'},schedule:{startDate:'2026-10-01',transport:'car',dayStart:'10:00',dayEnd:'20:00',arrivalBuffer:60,departureBuffer:120,visits:{}}}));
  });
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/planner');
  await p.getByRole('button',{name:'숙소·식사 시간 기준으로 다시 추천'}).click();
  await p.waitForFunction(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')).days[0].at(-1)===770001);
  const trip=await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')));
  assert.equal(trip.notes['770001'],'메모 유지');assert.equal(trip.schedule.startDate,'2026-10-01');assert.equal(trip.schedule.mealAware,true);
  await p.getByText('예상 방문 18:00 ~ 19:00',{exact:true}).waitFor();
  await p.getByText(/식사·방문 가능 시간까지 여유·대기/).waitFor();
  await p.reload();await p.getByText('예상 방문 18:00 ~ 19:00',{exact:true}).waitFor();
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_trip_v2')).days),trip.days);
  assert.deepEqual(errors,[]);console.log(`${width}: lodging last, lunch/dinner times, notes/date persistence PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
