import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=process.env.MAP_BASE_URL || `http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950}});
  await ctx.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.hostname==='server.arcgisonline.com' || (u.origin===origin && !u.pathname.startsWith('/api/'))) return r.continue();
   return r.fulfill({json:{items:[],ids:[],page:1,pageCount:1,totalCount:0}});
  });
  await ctx.addInitScript(()=>{
   localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:'healing',companion:'solo',hasChild:false,hasSenior:false,themes:[],nights:0,headcount:1,createdAt:''}));
   sessionStorage.setItem('jeju_explore_v1',JSON.stringify({tab:'all',sub:'all',view:'map',region:'all'}));
   if(!sessionStorage.getItem('jeju_explore_map_v1')) sessionStorage.setItem('jeju_explore_map_v1',JSON.stringify({lat:33.245,lng:126.565,zoom:19}));
  });
  const p=await ctx.newPage(), levels=[], errors=[];
  p.on('pageerror',e=>errors.push(e.stack));
  p.on('request',r=>{const m=r.url().match(/World_Street_Map\/MapServer\/tile\/(\d+)\//);if(m)levels.push(Number(m[1]));});
  await p.goto(origin+'/#/home');
  await p.locator('.leaflet-tile-loaded').first().waitFor();
  assert.ok(levels.length>0 && levels.every(z=>z<=13),`invalid tile requests: ${levels}`);
  assert.equal(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom),19);
  await p.locator('.leaflet-control-zoom-out').click();
  await p.waitForFunction(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom===18);
  await p.reload();await p.locator('.leaflet-tile-loaded').first().waitFor();
  assert.equal(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom),18);
  await p.locator('.leaflet-container').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({path:`output/verification/map-zoom-${width}.png`});
  await p.goto(origin+'/#/olle/01');await p.locator('.leaflet-tile-loaded').first().waitFor();
  for(let i=0;i<5;i++) { await p.locator('.leaflet-control-zoom-in').click(); await p.waitForTimeout(300); }
  assert.ok(levels.every(z=>z<=13));assert.deepEqual(errors,[]);
  console.log(`${width}: restored z19, zoom out/reload preserved, Home and Olle only request available z13 or lower tiles`);
  await ctx.close();
 }
}finally{await browser.close();server.close();}
