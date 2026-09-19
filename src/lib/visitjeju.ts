import type { Content } from '../types';
const KEY = 'jeju_visitjeju_cache_v1';
const TTL = 86400000;
let sessionCache: {t:number;items:Content[]} | undefined;
export function loadVisitCache(): Content[] {
  if (sessionCache && Date.now()-sessionCache.t<TTL) return sessionCache.items;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return c && Date.now()-c.t<TTL && Array.isArray(c.items) ? c.items : [];
  } catch { return []; }
}
let pending: Promise<Content[]> | undefined;
export function fetchVisitPlaces(force = false): Promise<Content[]> {
  if (pending) return pending;
  const cached = loadVisitCache();
  if (!force && cached.length) return Promise.resolve(cached);
  pending = (async () => {
    async function page(n: number) {
      const r = await fetch(`/api/visitjeju?page=${n}`);
      if (!r.ok) throw new Error('visitjeju_unavailable');
      const d = await r.json();
      if (!Array.isArray(d.items) || d.page !== n || !Number.isInteger(d.pageCount) || d.pageCount < 1 || d.pageCount>100) throw new Error('visitjeju_format');
      return d as {items:Content[];page:number;pageCount:number};
    }
    const first = await page(1), items = [...first.items];
    // Two pages at a time to avoid bursts against the provider.
    for (let n=2;n<=first.pageCount;n+=2) {
      const pages = await Promise.all([page(n), ...(n<first.pageCount?[page(n+1)]:[])]);
      for (const d of pages) {
        if (d.pageCount!==first.pageCount) throw new Error('visitjeju_changed');
        items.push(...d.items);
      }
    }
    const result = [...new Map(items.map(p=>[p.id,p])).values()];
    if (!result.length) throw new Error('visitjeju_empty');
    sessionCache = {t:Date.now(),items:result};
    try { localStorage.setItem(KEY, JSON.stringify(sessionCache)); } catch { /* current session remains usable */ }
    return result;
  })().finally(()=>{pending=undefined;});
  return pending;
}
// Conservative catalogue-only deduplication. Saved IDs remain independently resolvable.
export function uniqueCatalogue(places:Content[]):Content[] {
  const result:Content[]=[];
  const names = new Map<string,Content[]>();
  for (const p of [...places].sort((a,b)=>Number(a.provenance?.source==='visitjeju')-Number(b.provenance?.source==='visitjeju'))) {
    const key=p.contentType+':'+p.name.normalize('NFKC').toLowerCase().replace(/[\s\p{P}]/gu,'');
    const matches=names.get(key)??[];
    const duplicate=matches.some(q=>p.provenance?.source!==q.provenance?.source && (
      p.lat!=null&&p.lng!=null&&q.lat!=null&&q.lng!=null&&Math.hypot(p.lat-q.lat,(p.lng-q.lng)*0.84)<0.0009
    ));
    if (!duplicate) {result.push(p); names.set(key,[...matches,p]);}
  }
  return result;
}
