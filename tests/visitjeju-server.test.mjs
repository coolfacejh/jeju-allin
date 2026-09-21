import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlace, fetchPage } from '../server/visitjeju.js';
import handler from '../api/visitjeju.js';
const raw={contentsid:'CONT_123',title:'테스트 숙소',contentscd:{label:'숙박'},latitude:33.4,longitude:126.5,introduction:'<p>소개</p>',tag:'오름,산책',repPhoto:{photoid:{imgpath:'http://example.com/a.jpg'}}};
test('provider mapping has stable isolated IDs, no invented facilities, rejects nonplaces',()=>{
 const p=normalizePlace(raw,'now');assert.ok(Number.isSafeInteger(p.id)&&p.id>1e12);assert.equal(p.id,normalizePlace(raw,'later').id);assert.equal(p.contentType,'stay');assert.equal(p.desc,'소개');assert.equal(p.image,'https://example.com/a.jpg');assert.equal(p.accessibility,undefined);assert.equal(p.rating,0);assert.equal(normalizePlace({...raw,contentscd:{label:'공지사항'}},'now'),null);assert.equal(normalizePlace({...raw,latitude:0},'now').lat,undefined);
});
test('upstream page validates status and page, never passes key through response',async()=>{
 const p=await fetchPage(1,'test-secret',async url=>{assert.equal(url.protocol,'https:');assert.equal(url.searchParams.get('apiKey'),'test-secret');return new Response(JSON.stringify({result:'200',currentPage:1,totalCount:1,pageCount:1,items:[raw]}));});assert.equal(p.items.length,1);assert.ok(!JSON.stringify(p).includes('test-secret'));
 await assert.rejects(fetchPage(2,'key',async()=>new Response(JSON.stringify({result:'200',currentPage:1,totalCount:1,pageCount:1,items:[raw]}))));
});
test('handler rejects invalid requests before touching provider',async()=>{
 const res={statusCode:0,setHeader(){},status(n){this.statusCode=n;return this},json(d){this.data=d;return this}};
 await handler({method:'GET',url:'/api/visitjeju?page=999'},res);assert.equal(res.statusCode,400);
 await handler({method:'POST',url:'/api/visitjeju'},res);assert.equal(res.statusCode,405);
});

test('alltag facilities retain original evidence without promoting ordinary parking or stroller rental',()=>{
 const p=normalizePlace({...raw,alltag:'주차장,장애인 전용 주차구역,장애인 화장실 없음,유모차 대여,주출입구 단차 없음'},'now');
 assert.deepEqual(p.accessSources[0].tags,['장애인 전용 주차구역','장애인 화장실 없음','주출입구 단차 없음']);
 assert.equal(p.accessSources[0].checkedAt,undefined);
});
