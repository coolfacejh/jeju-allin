import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.GALLERY_BASE_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  const {extractPhotos}=await import('../server/placePhotos.js');
  const photos=extractPhotos(await (await fetch('https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000018332')).text());
  assert.ok(photos.length>=5);
  if(!process.env.GALLERY_BASE_URL)await ctx.route('**/api/place-photos?*',r=>r.fulfill({json:{photos}}));
  await ctx.route('**/api/visitjeju?*',r=>r.fulfill({json:{items:[],pageCount:1}}));
  await ctx.addInitScript(()=>{
   localStorage.setItem('jeju_visitjeju_cache_v2',JSON.stringify({t:Date.now(),items:[{id:888999,name:'김만덕기념관',contentType:'activity',region:'제주시',image:'🌊',desc:'대한민국 최초의 나눔문화전시관',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]},provenance:{source:'visitjeju',sourceId:'CNTS_000000000018332'}}]}));
   localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:null,companion:null,themes:[]}));
  });
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#/place/888999');
  const gallery=p.getByRole('region',{name:'장소 사진'});
  await p.getByRole('button',{name:'사진 2 보기',exact:true}).click();
  assert.equal(await p.getByRole('link',{name:'현재 사진 원본 보기'}).getAttribute('href'),photos[1].url);
  await p.waitForFunction(()=>{const img=document.querySelector('[aria-label="현재 사진 원본 보기"] img');return img?.naturalWidth>0;});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`output/verification/place-gallery-${width}.png`,fullPage:false});
  assert.deepEqual(errors,[]);console.log(`${width}: official photos load, selection, original link and layout PASS`);await ctx.close();
 }
}finally{await browser.close();server.close();}
