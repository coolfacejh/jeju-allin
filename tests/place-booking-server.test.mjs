import {test} from 'node:test';
import assert from 'node:assert/strict';
import {directNaverUrl,extractStayBooking,fetchStayBooking,cachedStayBooking,confirmsNaverStay} from '../server/placeBooking.js';
import handler from '../api/place-booking.js';
const id='CNTS_300000000012962';
const record=(changes={})=>'<div id="__SEARCH_DATA__">'+Object.entries({language:'kr',contentsid:id,'contentscd.label':'숙박',title:'숙소',roadaddress:'제주시 테스트로 10',homepage:'https://booking.naver.com/booking/3/bizes/123?area=bmp',...changes}).map(([k,v])=>'<pre data-key="'+k+'">'+v+'</pre>').join('')+'</div>';
test('only direct lodging reservation URLs survive; no search, spoofed hosts or tracking',()=>{
 assert.equal(directNaverUrl('http://booking.naver.com/booking/3/bizes/123/items/456?area=bmp'),'https://booking.naver.com/booking/3/bizes/123');
 for(const url of ['https://booking.naver.com/','https://booking.naver.com.evil.test/booking/3/bizes/123','https://evil@booking.naver.com/booking/3/bizes/123','javascript:alert(1)','https://booking.naver.com/booking/12/bizes/123','https://booking.naver.com/booking/3/bizes/123bad'])assert.equal(directNaverUrl(url),null);
});
test('booking links belong to the exact official lodging record',()=>{
 assert.equal(extractStayBooking(record(),id).url,'https://booking.naver.com/booking/3/bizes/123');
 assert.equal(extractStayBooking(record({homepage:'https://example.com'})+'<a href="https://booking.naver.com/booking/3/bizes/999">related hotel</a>',id).url,null);
 assert.throws(()=>extractStayBooking(record({contentsid:'CONT_000000000000001'}),id));
 assert.throws(()=>extractStayBooking(record({'contentscd.label':'관광지'}),id));
 assert.throws(()=>extractStayBooking('<html>maintenance</html>',id));
});
test('lookup validates IDs, keeps errors separate from unlisted links and coalesces requests',async()=>{
 await assert.rejects(fetchStayBooking('https://evil.test'));await assert.rejects(fetchStayBooking(id,async()=>new Response('',{status:503})));
 const absent=await fetchStayBooking(id,async()=>new Response(record({homepage:''})));assert.equal(absent.status,'unavailable');assert.equal(absent.url,null);
 let calls=0;const fetcher=async url=>{calls++;return new Response(url.includes('booking.naver.com')?'<title>네이버 예약 :: 테스트숙소</title><script>{"roadAddr":"제주시 테스트로 10"}</script>':record({title:'테스트숙소'}));};const [a,b]=await Promise.all([cachedStayBooking(id,fetcher),cachedStayBooking(id,fetcher)]);assert.equal(calls,2);assert.deepEqual(a,b);assert.equal(a.status,'available');
});
test('API blocks arbitrary URLs and writes before fetching',async()=>{
 const res={code:0,setHeader(){},status(n){this.code=n;return this;},json(d){this.data=d;return this;}};
 await handler({method:'POST',url:'/api/place-booking'},res);assert.equal(res.code,405);
 await handler({method:'GET',url:'/api/place-booking?id=https://evil.test'},res);assert.equal(res.code,400);
});

test('destination must identify the same lodging and exact street number, not an unavailable booking page',()=>{
 const place={name:'테스트숙소',region:'제주특별자치도 제주시 해안로 10'};
 const page=n=>'<title data-react-helmet="true">네이버 예약 :: 테스트숙소</title><script>{"roadAddr":"제주 제주시 해안로 '+n+'"}</script>';
 assert.equal(confirmsNaverStay(page('10'),place),true);assert.equal(confirmsNaverStay(page('100'),place),false);assert.equal(confirmsNaverStay(page('10-1'),place),false);assert.equal(confirmsNaverStay('<title>네이버 예약</title>',place),false);
});

test('nested street names preserve the final building number',()=>{
 const p={name:'제주신라호텔',region:'제주도 서귀포시 중문관광로 72번길 75'};
 const h=n=>'<title>네이버 예약 :: 제주신라호텔</title><script>{"roadAddr":"제주특별자치도 서귀포시 중문관광로72번길 '+n+'"}</script>';
 assert.equal(confirmsNaverStay(h('75'),p),true);assert.equal(confirmsNaverStay(h('35'),p),false);
});
