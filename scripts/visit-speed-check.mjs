import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.VISIT_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  let release;const gate=new Promise(r=>release=r);let requests=0;
  await ctx.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.pathname==='/api/visitjeju'){
    requests++;const page=Number(u.searchParams.get('page'));if(page>1)await gate;
    return r.fulfill({json:{page,pageCount:3,items:[{id:770000+page,name:'속도확인 관광지 '+page,contentType:'activity',region:'제주시',image:'🌊',desc:'검증',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]},provenance:{source:'visitjeju'}}]}});
   }
   if(u.origin===origin&&!u.pathname.startsWith('/api/'))return r.continue();
   return r.fulfill({json:{items:[],ids:[],pageCount:1}});
  });
  await ctx.addInitScript(()=>{if(!localStorage.getItem('jeju_allin_profile'))localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:null,companion:null,hasChild:false,hasSenior:false,themes:[],nights:1,headcount:2}));});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/home');
  await p.getByText(/1곳 먼저 표시 · 나머지 갱신 중 1\/3페이지/).waitFor();
  assert.equal(await p.evaluate(()=>localStorage.getItem('jeju_visitjeju_cache_v2')),null);
  release();await p.getByText(/제주관광공사 비짓제주 · 3곳/).waitFor();
  assert.equal(requests,3);await p.reload();await p.getByText(/제주관광공사 비짓제주 · 3곳/).waitFor();assert.equal(requests,3);
  await p.evaluate(()=>{const c=JSON.parse(localStorage.getItem('jeju_visitjeju_cache_v2'));c.t=Date.now()-2*86400000;localStorage.setItem('jeju_visitjeju_cache_v2',JSON.stringify(c));});
  await ctx.route('**/api/visitjeju?**',r=>r.fulfill({status:502,json:{error:'offline'}}));
  await p.reload();await p.getByText(/비짓제주 갱신 실패 · 기존 정보 유지/).waitFor();
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('jeju_visitjeju_cache_v2')).items.length),3);
  assert.deepEqual(errors,[]);console.log(`${width}: progress before final pages, warm zero requests, stale retained on failure PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
