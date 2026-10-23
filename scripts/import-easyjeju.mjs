import {writeFileSync} from 'node:fs';
const clean=s=>s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
const records=[];
let last=1;
for(let page=1;page<=last;page++){
 const url='https://easyjeju.net/pages.php?p=tourist&folders=tour&page='+page;
 const res=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error('HTTP '+res.status);
 const html=await res.text();
 if(page===1)last=Math.max(1,...[...html.matchAll(/&page=(\d+)/g)].map(m=>Number(m[1])));
 if(last>100)throw Error('Unexpected pagination');
 let count=0;
 for(const m of html.matchAll(/<a href="\.\/pages\.php\?p=tourist&folders=tour&no=(\d+)"[^>]*>([\s\S]*?)<\/a>/g)){
  const body=m[2],name=clean(body.match(/class="item_subject"[^>]*>([\s\S]*?)<\/div>/)?.[1]||''),region=clean(body.match(/class="item_day"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'');
  const ids=[...new Set([...body.matchAll(/\/res\/images\/mqs2\/vt(\d+)\.png/g)].map(x=>Number(x[1])))];
  if(!name||!region||ids.some(id=>id<1||id>37))throw Error('Unexpected record '+m[1]);
  records.push({id:m[1],name,region,pictograms:ids,url:'https://easyjeju.net/pages.php?p=tourist&folders=tour&no='+m[1]});count++;
 }
 if(!count)throw Error('Empty page '+page);
 console.log('EasyJeju page '+page+'/'+last+': '+count);
 await new Promise(r=>setTimeout(r,180));
}
// Fetch official street addresses to match road-address records without guessing districts.
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{
 while(cursor<records.length){const record=records[cursor++];
  const res=await fetch(record.url,{signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error('Detail HTTP '+res.status);
  const html=await res.text();record.address=clean(html.match(/<span>주소<\/span>\s*<blockquote>([\s\S]*?)<\/blockquote>/)?.[1]||'');
  await new Promise(r=>setTimeout(r,150));
 }
}));
if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('Duplicate records');
writeFileSync(new URL('../src/data/easyJejuPlaces.json',import.meta.url),JSON.stringify({retrievedAt:new Date().toISOString(),source:'https://easyjeju.net/pages.php?p=tourist&folders=tour',records},null,2)+'\n');
console.log('Saved '+records.length+' records');
