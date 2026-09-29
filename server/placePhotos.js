const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function extractPhotos(html) {
 const photos=[];
 for(const tag of html.match(/<img\b[^>]*>/gi)||[]) {
  const attrs=Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
  // Only official introduction/gallery images; exclude reviews and related places.
  if(!/ 이미지 \d+\/\d+$/.test(attrs.alt||'')&&!/(?:^| )gallery-image(?: |$)/.test(attrs.class||''))continue;
  const url=(attrs.src||'').replace(/^\/\//,'https://');
  if(!/^https:\/\/api\.cdn\.visitjeju\.net\/photomng\/imgpath\/[^<>" ]+$/.test(url))continue;
  if(!photos.some(p=>p.url===url))photos.push({url,alt:(attrs.alt||'장소 소개 사진').slice(0,200)});
  if(photos.length===20)break;
 }
 return photos;
}
export async function fetchPlacePhotos(id,fetcher=fetch) {
 if(!/^(CNTS|CONT)_[0-9]{15}$/.test(id))throw new Error('invalid_id');
 const sourceUrl='https://www.visitjeju.net/kr/detail/view?contentsid='+encodeURIComponent(id);
 const r=await fetcher(sourceUrl,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!r.ok)throw new Error('upstream');
 const html=await r.text();if(html.length>4000000)throw new Error('too_large');
 return {photos:extractPhotos(html),sourceUrl};
}
