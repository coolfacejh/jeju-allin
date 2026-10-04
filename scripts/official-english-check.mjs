import {createServer} from 'node:http';import {readFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const html=await readFile('dist/index.html');const source='CNTS_000000000018332';
const original={id:990123,name:'김만덕기념관',region:'제주시 산지로 7',desc:'대한민국 최초의 나눔문화전시관',contentType:'activity',image:'🍊',rating:0,reviewCount:0,lat:33.5,lng:126.5,tags:{travelType:[],companion:[],themes:[]},hashtags:['미술관'],provenance:{source:'visitjeju',sourceId:source,retrievedAt:'2026-10-01'},accessSources:[{source:'visitjeju',sourceId:source,receivedAt:'2026-10-01',tags:['장애인 화장실 없음']}]};
const translation={id:source,status:'available',fields:{name:'Kim Man-deok Memorial Hall',region:'7 Sanji-ro, Jeju City',desc:"Korea's first Cultural Sharing (Nanum) Exhibition Hall"},hashtags:['museum'],source:'visitjeju',sourceUrl:'https://www.visitjeju.net/en/detail/view?contentsid='+source,checkedAt:'2026-10-04T00:00:00Z'};
const profile={travelType:null,companion:null,hasChild:false,hasSenior:false,themes:[],nights:1,headcount:2,createdAt:'2026-10-01'};
const server=createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
try{await mkdir('output/verification/official-english',{recursive:true});
for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];let calls=0,unavailable=false;page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/api/place-english'){calls++;return route.fulfill({json:unavailable?{...translation,status:'unavailable',fields:{},hashtags:[]}:translation});}if(u.pathname==='/api/visitjeju')return route.fulfill({json:{items:[original],page:1,pageCount:1}});if(u.pathname.startsWith('/api/'))return route.fulfill({json:{photos:[]}});if(u.hostname.endsWith('supabase.co'))return route.fulfill({json:{items:[],ids:[],has:false}});if(u.origin===origin)return route.continue();return route.abort();});
 await page.goto(origin);await page.evaluate(({profile,original})=>{localStorage.setItem('jeju_allin_profile',JSON.stringify(profile));localStorage.setItem('jeju_place_snapshots_v1',JSON.stringify([original]));localStorage.setItem('jeju_saved_trip_ids',JSON.stringify([original.id]));},{profile,original});
 await page.goto(origin+'/#/home');await page.locator('.destination-card').first().waitFor();assert.equal(calls,0,'no English lookup in Korean mode');await page.locator('.travel-search input').fill(original.name);
 await page.getByRole('button',{name:'English',exact:true}).click();await page.locator('.destination-card').filter({hasText:original.name}).scrollIntoViewIfNeeded();await page.getByText(translation.fields.name,{exact:true}).waitFor();assert.equal(calls,1,'all visible fields share a single lookup');
 assert.ok(await page.getByText(original.name,{exact:true}).count());
 await page.goto(origin+'/#/place/990123');await page.getByRole('heading',{name:/Kim Man-deok Memorial Hall/}).waitFor();await page.getByText(translation.fields.desc,{exact:true}).waitFor();
 await page.getByRole('link',{name:/View official English source/}).waitFor();
 await page.getByText('No accessible restroom listed',{exact:true}).waitFor();
 const row=page.locator('[data-access-row="restroom"]');assert.equal(await row.getAttribute('data-access-state'),'unavailable');assert.ok(await row.getByText('“장애인 화장실 없음”',{exact:true}).count());
 await page.getByText('Original Korean description',{exact:true}).click();await page.getByText(original.desc,{exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no detail overflow');await page.screenshot({path:`output/verification/official-english/detail-${width}.png`,fullPage:true});
 await page.reload();await page.getByText(translation.fields.desc,{exact:true}).waitFor();assert.equal(calls,1,'browser cache survives reload');
 await page.goto(origin+'/#/my-trip');await page.getByText(translation.fields.name,{exact:true}).waitFor();await page.getByRole('button',{name:/Create itinerary/}).click();await page.waitForURL('**/#/planner');await page.getByText(translation.fields.name,{exact:true}).waitFor();
 assert.ok((await page.evaluate(()=>localStorage.getItem('jeju_place_snapshots_v1'))).includes(original.name));assert.equal(calls,1);
 await page.goto(origin+'/#/home');await page.getByRole('button',{name:'한국어',exact:true}).click();await page.getByText(original.name,{exact:true}).waitFor();assert.equal(await page.getByText(translation.fields.name,{exact:true}).count(),0);
 // Empty English source is not a made-up translation and does not change accessibility.
 await page.evaluate(()=>localStorage.removeItem('jeju_official_english_v1'));unavailable=true;await page.reload();await page.getByRole('button',{name:'English',exact:true}).click();await page.goto(origin+'/#/place/990123');
 await page.locator('[data-place-language]').first().scrollIntoViewIfNeeded();
 await page.getByText('No official English text was found for this place. The original Korean is shown.',{exact:true}).waitFor({timeout:5000}).catch(async e=>{console.log({calls,body:(await page.locator('body').innerText()).slice(0,3000),cache:await page.evaluate(()=>localStorage.getItem('jeju_official_english_v1'))});throw e;});assert.equal(await page.locator('[data-access-row="restroom"]').getAttribute('data-access-state'),'unavailable');assert.equal(await page.getByText(translation.fields.desc,{exact:true}).count(),0);
 assert.deepEqual(errors,[]);console.log(`PASS ${width}px: official EN/KO, one request, persistent cache, original preserved, negative accessibility unchanged, missing-English fallback`);await page.close();
}
}finally{await browser.close();await new Promise(r=>server.close(r));}
