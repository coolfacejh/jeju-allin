import stayLinks from '../src/lib/naverStayLinks.json' with {type:'json'};
// Resolve only the requested official lodging record, not search results or related venues.
const validId=id=>/^(CNTS|CONT)_[0-9]{15}$/.test(id);
export function directNaverUrl(value){
 if(typeof value!=='string'||value.length>2000)return null;
 try{const u=new URL(value.trim());if(!['http:','https:'].includes(u.protocol)||u.hostname!=='booking.naver.com'||u.port||u.username||u.password)return null;
 const match=u.pathname.match(/^\/booking\/(3)\/bizes\/([1-9][0-9]*)(?:\/|$)/);
 return match?'https://booking.naver.com/booking/'+match[1]+'/bizes/'+match[2]:null;
 }catch{return null;}
}
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function extractStayBooking(html,id){
 if(!validId(id))throw Error('invalid_id');
 const block=html.match(/<div\b[^>]*\bid="__SEARCH_DATA__"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
 if(!block)throw Error('missing_record');
 const data=Object.fromEntries([...block.matchAll(/<pre\b[^>]*data-key="([^"]+)"[^>]*>([\s\S]*?)<\/pre>/gi)].map(m=>[m[1],decode(m[2].replace(/<[^>]*>/g,'')).trim()]));
 if(data.contentsid!==id||data.language!=='kr'||!/숙박|숙소/.test(data['contentscd.label']||''))throw Error('mismatched_record');
 if(!data.title||!(data.roadaddress||data.address))throw Error('missing_identity');
 return {name:data.title.slice(0,300),region:(data.roadaddress||data.address).slice(0,600),url:directNaverUrl(data.homepage)};
}
const normalize=s=>s.normalize('NFKC').replace(/제주특별자치도|제주도/g,'제주').replace(/\s/g,'').toLowerCase();
export function confirmsNaverStay(html,place){
 const title=decode(html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]||'').replace(/^네이버 예약\s*::\s*/, '');
 const addressJson=html.match(/"roadAddr":("(?:[^"\\]|\\.)*")/)?.[1];let address='';try{address=JSON.parse(addressJson||'""');}catch{return false;}
 const road=s=>{const match=s.match(/(?:제주시|서귀포시).*?(?:로|길)\s*[0-9]+(?:-[0-9]+)?(?=$|[\s,(])/);return match?normalize(match[0]):undefined;};
 const name=normalize(place.name),actual=normalize(title);
 return name.length>=3&&(actual.includes(name)||name.includes(actual)&&actual.length>=3)&&!!road(place.region)&&road(place.region)===road(address);
}
export async function fetchStayBooking(id,fetcher=fetch){
 if(!validId(id))throw Error('invalid_id');
 const sourceUrl='https://www.visitjeju.net/kr/detail/view?contentsid='+id;
 const r=await fetcher(sourceUrl,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!r.ok)throw Error('upstream');const html=await r.text();if(html.length>4000000)throw Error('too_large');
 const data=extractStayBooking(html,id);
 const known=stayLinks.find(x=>x.sourceId===id&&normalize(x.name)===normalize(data.name));
 // Revalidate curated links as well after their bundled 30-day freshness window.
 if(!data.url&&known)data.url=directNaverUrl(known.url);
 if(data.url){const booking=await fetcher(data.url,{signal:AbortSignal.timeout(10000),redirect:'error'});if(!booking.ok)throw Error('booking_upstream');const page=await booking.text();if(page.length>4000000)throw Error('too_large');if(!confirmsNaverStay(page,data))data.url=null;}
 return {id,...data,status:data.url?'available':'unavailable',sourceUrl,checkedAt:new Date().toISOString()};
}
const cache=new Map(),pending=new Map();
export async function cachedStayBooking(id,fetcher=fetch){
 if(!validId(id))throw Error('invalid_id');const hit=cache.get(id);if(hit&&hit.expires>Date.now())return hit.value;
 if(pending.has(id))return pending.get(id);
 const job=fetchStayBooking(id,fetcher).then(value=>{if(cache.size>=1000)cache.delete(cache.keys().next().value);cache.set(id,{value,expires:Date.now()+86400000});return value;}).finally(()=>pending.delete(id));
 pending.set(id,job);return job;
}
