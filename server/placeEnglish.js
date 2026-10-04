const validId = id => /^(CNTS|CONT)_[0-9]{15}$/.test(id);
const decode = text => text.replace(/&(?:amp|quot|apos|lt|gt|nbsp|#39|#\d+|#x[\da-f]+);/gi, entity => {
 const known={'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
 if(known[entity])return known[entity];
 const value=entity.toLowerCase().startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
 return Number.isInteger(value)&&value>0&&value<=0x10ffff?String.fromCodePoint(value):'';
});
export function extractEnglishPlace(html,id) {
 if(!validId(id))throw Error('invalid_id');
 // Use the official page's structured place data, never surrounding navigation or related places.
 const block=html.match(/<div\b[^>]*\bid="__SEARCH_DATA__"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
 if(!block)return null;
 const data={};
 for(const m of block.matchAll(/<pre\b[^>]*data-key="([^"]+)"[^>]*>([\s\S]*?)<\/pre>/gi))data[m[1]]=decode(m[2].replace(/<[^>]*>/g,'')).trim();
 if(data.language!=='en'||data.contentsid!==id)return null;
 const text=(value,max)=>typeof value==='string'&&/[a-z]/i.test(value)&&!/[가-힣]/.test(value)?value.slice(0,max):undefined;
 const fields={name:text(data.title,300),region:text(data.roadaddress||data.address,600),desc:text(data.introduction,4000)};
 const hashtags=(data.tag||'').split(',').map(t=>text(t.trim(),100)).filter(Boolean).slice(0,12);
 if(!Object.values(fields).some(Boolean))return null;
 return {fields,hashtags};
}
export async function fetchEnglishPlace(id,fetcher=fetch) {
 if(!validId(id))throw Error('invalid_id');
 const sourceUrl='https://www.visitjeju.net/en/detail/view?contentsid='+id;
 const r=await fetcher(sourceUrl,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!r.ok)throw Error('upstream');
 const html=await r.text();if(html.length>4000000)throw Error('too_large');
 const data=extractEnglishPlace(html,id);
 return {id,status:data?'available':'unavailable',...(data||{fields:{},hashtags:[]}),source:'visitjeju',sourceUrl,checkedAt:new Date().toISOString()};
}
const cached=new Map(),pending=new Map();
export async function cachedEnglishPlace(id,fetcher=fetch) {
 if(!validId(id))throw Error('invalid_id');
 const hit=cached.get(id);if(hit&&hit.expires>Date.now())return hit.value;
 if(pending.has(id))return pending.get(id);
 const job=fetchEnglishPlace(id,fetcher).then(value=>{
  if(cached.size>=300)cached.delete(cached.keys().next().value);
  cached.set(id,{value,expires:Date.now()+(value.status==='available'?86400000:3600000)});return value;
 }).finally(()=>pending.delete(id));pending.set(id,job);return job;
}
