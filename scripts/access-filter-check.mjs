import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.ACCESS_FILTER_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  const fixtures=[['모두충족',['장애인 주차장','승강기']],['주차만',['장애인 주차장']],['시설없음',['장애인 주차장','승강기 없음']]].map(([name,tags],i)=>({id:880001+i,name,contentType:'activity',region:'제주시',lat:33.5,lng:126.5+i*.01,image:'🌊',desc:'',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]},provenance:{source:'visitjeju'},accessSources:[{source:'visitjeju',sourceId:String(i),receivedAt:'2026-09-28',tags}]}));
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin&&!r.request().url().includes('/api/')?r.continue():r.fulfill({json:{items:[],pageCount:1}}));
  await ctx.addInitScript(items=>{
   if(localStorage.getItem('seeded'))return;
   localStorage.setItem('seeded','1');localStorage.setItem('jeju_visitjeju_cache_v2',JSON.stringify({t:Date.now(),items}));
   localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:null,companion:null,themes:[],nights:1,headcount:2,access:{required:['parking','elevator'],confirmedOnly:false}}));
   sessionStorage.setItem('jeju_explore_v1',JSON.stringify({confirmedOnly:false,accessOn:false}));
  },fixtures);
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/onboarding');
  assert.equal(await p.getByRole('radio').nth(1).isChecked(),true);
  await p.getByRole('button',{name:/이 조건으로 장소 살펴보기/}).filter({visible:true}).click();
  await p.waitForURL('**/#/home');
  const strict=p.getByRole('checkbox',{name:'필수 조건이 확인된 곳만 표시'});
  assert.equal(await strict.isChecked(),true);
  await p.getByText('모두충족',{exact:true}).waitFor();
  assert.equal(await p.getByText('주차만',{exact:true}).count(),0);
  assert.equal(await p.getByText('시설없음',{exact:true}).count(),0);
  await p.getByRole('button',{name:'지도',exact:true}).click();
  await p.getByText('지도에 1곳',{exact:true}).waitFor();
  await strict.uncheck();
  await p.getByRole('button',{name:'목록',exact:true}).click();
  await p.getByRole('textbox').first().fill('주차만');
  await p.getByText('주차만',{exact:true}).waitFor();
  await p.getByRole('textbox').first().fill('시설없음');
  assert.equal(await p.getByText('시설없음',{exact:true}).count(),0);
  await p.getByRole('textbox').first().fill('');
  await strict.check();
  await p.getByRole('button',{name:'지도',exact:true}).click();await p.reload();
  await p.getByText('지도에 1곳',{exact:true}).waitFor();
  await p.goto(origin+'/#/onboarding');
  await p.getByRole('button',{name:/장애인 화장실 장애인 화장실 시설 정보/}).click();
  await p.getByRole('button',{name:/이 조건으로 장소 살펴보기/}).filter({visible:true}).click();
  await p.getByText('지도에 0곳',{exact:true}).waitFor();
  await p.getByText(/현재 불러온 자료에서 조건에 맞는 장소가 없습니다/).waitFor();
  assert.deepEqual(errors,[]);console.log(`${width}: strict AND filters, legacy migration, map/list consistency, empty results PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
