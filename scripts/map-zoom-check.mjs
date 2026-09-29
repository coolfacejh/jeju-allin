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
 for(const width of [360,1440]) {
  const ctx=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:width===360?3:1});
  await ctx.route('**/*',r=>{
   const u=new URL(r.request().url());
   if((u.hostname.endsWith('openfreemap.org')||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com') || (u.origin===origin && !u.pathname.startsWith('/api/'))) return r.continue();
   return r.fulfill({json:{items:[],ids:[],page:1,pageCount:1,totalCount:0}});
  });
  await ctx.addInitScript(()=>{
   localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:'healing',companion:'solo',hasChild:false,hasSenior:false,themes:[],nights:0,headcount:1,createdAt:''}));
   localStorage.setItem('jeju_visitjeju_cache_v2',JSON.stringify({t:Date.now(),items:[{id:770001,name:'지도 선택 확인',contentType:'activity',region:'서귀포시',lat:33.245,lng:126.565,image:'🌊',desc:'',rating:0,reviewCount:0,tags:{travelType:[],companion:[],themes:[]}}]}));
   sessionStorage.setItem('jeju_explore_v1',JSON.stringify({tab:'all',sub:'all',view:'map',region:'all'}));
   if(!sessionStorage.getItem('jeju_explore_map_v1')) sessionStorage.setItem('jeju_explore_map_v1',JSON.stringify({lat:33.245,lng:126.565,zoom:19}));
  });
  const p=await ctx.newPage(), levels=[], errors=[];
  p.on('pageerror',e=>errors.push(e.stack));
  p.on('request',r=>{if(r.url().includes('.pbf'))levels.push(r.url());});
  await p.goto(origin+'/#/home');
  await p.locator('[data-basemap=vector-ready]').first().waitFor({timeout:60000});
  assert.ok(levels.length>0,'vector tiles and fonts were requested');
  const dimensions=await p.locator('.maplibregl-canvas').evaluate(c=>({w:c.width,display:c.getBoundingClientRect().width}));assert.ok(dimensions.w>=dimensions.display*(width===360?2.5:0.9));
  assert.equal(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom),19);
  await p.locator('.leaflet-control-zoom-out').click();
  await p.waitForFunction(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom===18);
  await p.reload();await p.locator('[data-basemap=vector-ready]').first().waitFor({timeout:60000});
  assert.equal(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom),18);
  await p.locator('.leaflet-container').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({path:`output/verification/map-zoom-${width}.png`});
  const markerIndex=await p.locator('.leaflet-marker-icon').evaluateAll(nodes=>{
   const box=document.querySelector('.leaflet-container').getBoundingClientRect();
   return nodes.findIndex(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom;});
  });
  assert.ok(markerIndex>=0);await p.locator('.leaflet-marker-icon').nth(markerIndex).click();
  await p.locator('.jmap-open').click();
  await p.waitForURL('**/#/place/770001');
  await p.getByRole('button',{name:'뒤로',exact:true}).click();
  await p.locator('[data-basemap=vector-ready]').first().waitFor({timeout:60000});
  assert.equal(await p.evaluate(()=>JSON.parse(sessionStorage.getItem('jeju_explore_map_v1')).zoom),18);
  await p.goto(origin+'/#/olle/01');await p.locator('[data-basemap=vector-ready]').first().waitFor({timeout:60000});
  for(let i=0;i<5;i++) { await p.locator('.leaflet-control-zoom-in').click(); await p.waitForTimeout(300); }
  assert.ok(levels.length>0);assert.deepEqual(errors,[]);
  console.log(`${width}: vector map at z19 with device-resolution canvas, zoom restore and Olle PASS`);
  await ctx.close();
 }
}finally{await browser.close();server.close();}
