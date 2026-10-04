import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractEnglishPlace,fetchEnglishPlace,cachedEnglishPlace} from '../server/placeEnglish.js';
import handler from '../api/place-english.js';
const id='CNTS_000000000018332';
const html=(lang='en',source=id)=>`<div id="__SEARCH_DATA__"><pre data-key="language">${lang}</pre><pre data-key="contentsid">${source}</pre><pre data-key="title">Official Hall</pre><pre data-key="roadaddress">7 Sanji-ro</pre><pre data-key="introduction">History &amp; culture &#39;hall&#39;</pre><pre data-key="tag">history,museum</pre></div><pre data-key="title">Unrelated attraction</pre>`;
test('official English is matched to exact ID and language, never page chrome or related places',()=>{
 assert.equal(extractEnglishPlace(html(),id).fields.name,'Official Hall');assert.equal(extractEnglishPlace(html(),id).fields.desc,"History & culture 'hall'");
 assert.equal(extractEnglishPlace(html('kr'),id),null);assert.equal(extractEnglishPlace(html('en','CNTS_000000000000002'),id),null);assert.equal(extractEnglishPlace('<title>Visit Jeju</title>',id),null);
 const p=extractEnglishPlace(html().replace('7 Sanji-ro','제주시'),id);assert.equal(p.fields.region,undefined);assert.equal(p.fields.name,'Official Hall');assert.equal(p.accessSources,undefined);
});
test('lookup uses fixed official host and bounded ID, returns source and independent retrieval timestamp',async()=>{
 const data=await fetchEnglishPlace(id,async (url,options)=>{assert.equal(url,`https://www.visitjeju.net/en/detail/view?contentsid=${id}`);assert.equal(options.redirect,'error');return new Response(html());});
 assert.equal(data.status,'available');assert.equal(data.source,'visitjeju');assert.ok(Date.parse(data.checkedAt));assert.ok(!('checkedAtOnSite' in data));
 await assert.rejects(fetchEnglishPlace('https://other.example/'));
 await assert.rejects(fetchEnglishPlace(id,async()=>new Response('',{status:500})));
 assert.equal((await fetchEnglishPlace(id,async()=>new Response('<p>No record</p>'))).status,'unavailable');
});
test('parallel and repeated official lookups reuse cache',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return new Response(html());};
 await Promise.all([cachedEnglishPlace(id,fetcher),cachedEnglishPlace(id,fetcher)]);await cachedEnglishPlace(id,fetcher);assert.equal(calls,1);
});
test('endpoint rejects arbitrary URLs, duplicate IDs, extra query and non-GET before network',async()=>{
 for(const req of [{method:'POST',url:'/api/place-english?id='+id},{method:'GET',url:'/api/place-english?id=https://other.example'},{method:'GET',url:`/api/place-english?id=${id}&id=${id}`},{method:'GET',url:`/api/place-english?id=${id}&text=private`}]){
 const res={statusCode:0,setHeader(){},status(n){this.statusCode=n;return this;},json(d){this.data=d;return this;}};await handler(req,res);assert.ok([400,405].includes(res.statusCode));
 }
});
