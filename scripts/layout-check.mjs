import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
await mkdir('output/verification',{recursive:true});
try {
 for(const width of [390,820,1440]){
 const ctx=await browser.newContext({viewport:{width,height:1000}});
 await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({json: {items:[],ids:[]}}));
 await ctx.addInitScript(()=>{
 localStorage.setItem('jeju_allin_profile',JSON.stringify({travelType:'healing',companion:'family',hasChild:false,hasSenior:false,themes:['sunset'],nights:2,headcount:2,createdAt:''}));
 localStorage.setItem('jeju_saved_trip_ids',JSON.stringify([101,102,103,104,105,106]));
 });
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['onboarding','home','my-trip','planner','place/101']){
 await page.goto(origin+'/#/'+path);await page.waitForTimeout(250);
 const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,main:document.querySelector('main')?.getBoundingClientRect().width,columns:document.querySelector('.place-grid')?getComputedStyle(document.querySelector('.place-grid')).gridTemplateColumns:null}));
 assert.ok(size.scroll<=width,`${path} overflow at ${width}: ${size.scroll}`);
 assert.ok(size.main>(width<768?350:width<1000?750:1200),`${path} too narrow: ${size.main}`);
 if(size.columns)assert.equal(size.columns.split(' ').length,width<768?1:width<1280?2:3);
 console.log(width,path,JSON.stringify(size));
 if(width===1440&&['home','onboarding','planner'].includes(path))await page.screenshot({path:`output/verification/desktop-${path}.png`,fullPage:false});
 }
 assert.deepEqual(errors,[]);await ctx.close();
 }
}finally{await browser.close();server.close();}
