import { createHash } from 'node:crypto';
const clean = (v, max = 2000) => typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, max) : '';
export function normalizePlace(raw, retrievedAt) {
  const sourceId = clean(raw.contentsid, 100), name = clean(raw.title, 200);
  const category = clean(raw.contentscd?.label, 80);
  const contentType = /숙박|숙소/.test(category) ? 'stay' : /음식|식당|맛집/.test(category) ? 'food' : /관광|쇼핑|축제|행사|레저|레포츠/.test(category) ? 'activity' : null;
  if (!sourceId || !name || !contentType) return null;
  const latitude = Number(raw.latitude), longitude = Number(raw.longitude);
  const located = latitude >= 33 && latitude <= 34 && longitude >= 126 && longitude <= 127.1;
  const photo = raw.repPhoto?.photoid;
  const image = clean(photo?.thumbnailpath || photo?.imgpath, 2000).replace(/^http:\/\//, 'https://');
  const tags = clean(raw.tag, 1000).split(',').map(x => x.trim()).filter(Boolean);
  const themes = [];
  const themeTags = { cafe: /카페/, oreum: /오름/, camping: /캠핑/, trekking: /트레킹|숲길|산책/, sunset: /일몰/, market: /시장/, cultural: /미술관|박물관|전시/, surf: /서핑/, animal: /동물/ };
  for (const [theme, pattern] of Object.entries(themeTags)) if (tags.some(t => pattern.test(t))) themes.push(theme);
  return {
    id: 1000000000000 + Number.parseInt(createHash('sha256').update('visitjeju:'+sourceId).digest('hex').slice(0, 12), 16),
    name, contentType, region: clean(raw.roadaddress || raw.address || raw.region1cd?.label, 500),
    desc: clean(raw.introduction), image: /^https:\/\//.test(image) ? image : ({stay:'🏡',food:'🍊',activity:'🌊'})[contentType],
    ...(located ? {lat:latitude,lng:longitude} : {}), rating:0,reviewCount:0,
    tags:{travelType:[],companion:[],themes}, hashtags:tags.slice(0,12),
    provenance:{source:'visitjeju',sourceId,retrievedAt},
  };
}
export async function fetchPage(page, key, fetcher = fetch) {
  const url = new URL('https://api.visitjeju.net/vsjApi/contents/searchList');
  url.search = new URLSearchParams({apiKey:key,locale:'kr',page:String(page)}).toString();
  const response = await fetcher(url, {signal:AbortSignal.timeout(18000),redirect:'error'});
  if (!response.ok) throw new Error('upstream_http');
  const data = await response.json();
  if (!['200','00'].includes(String(data.result)) || !Array.isArray(data.items)) throw new Error('upstream_response');
  const pageCount = Number(data.pageCount), totalCount = Number(data.totalCount);
  if (!Number.isInteger(pageCount) || pageCount < 0 || !Number.isInteger(totalCount) || totalCount < 0) throw new Error('upstream_format');
  if (Number(data.currentPage) !== page) throw new Error('upstream_page');
  const retrievedAt = new Date().toISOString();
  const items = data.items.map(x => normalizePlace(x, retrievedAt)).filter(Boolean);
  return {items,page,pageCount,totalCount,received:data.items.length,skipped:data.items.length-items.length,retrievedAt};
}
