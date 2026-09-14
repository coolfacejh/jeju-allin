import type { Content } from '../types';

// Supabase Edge Function(프록시) 호출 → 실시간 제주 관광 데이터.
// 여기 담기는 값은 '공개키(anon)'와 함수 URL뿐 — TourAPI 서비스키는 서버(Vault)에만 있음.
const FN_URL = 'https://imatwnttwyiiqtecyuec.supabase.co/functions/v1/tourapi-jeju';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltYXR3bnR0d3lpaXF0ZWN5dWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjI5MDUsImV4cCI6MjA3ODQ5ODkwNX0.WDFoCX253q6t77kG_WMJ-mIxlWDPK3SU9mBell9L4lQ';

const CACHE_KEY = 'jeju_live_cache_v2'; // v2: 분류코드(cat1/2/3) 포함
const TTL = 1000 * 60 * 60 * 24; // 24시간

type Cache = { t: number; items: Content[] };

export function loadLiveCache(): Content[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cache;
    if (Date.now() - c.t < TTL && Array.isArray(c.items) && c.items.length) return c.items;
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchLivePlaces(opts?: { pages?: number; force?: boolean }): Promise<Content[]> {
  if (!opts?.force) {
    const cached = loadLiveCache();
    if (cached) return cached;
  }
  const pages = opts?.pages ?? 1;
  const res = await fetch(`${FN_URL}?pages=${pages}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`live ${res.status}`);
  const json = await res.json();
  const items = ((json?.items ?? []) as Content[]).map((it) => ({
    ...it,
    image: typeof it.image === 'string' ? it.image.replace(/^http:\/\//, 'https://') : it.image,
  }));
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), items }));
  } catch {
    /* ignore */
  }
  return items;
}

export function clearLiveCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// --- 무장애(배리어프리) 정보 ---
const BF_KEY = 'jeju_bf_ids_v1';

export async function fetchBarrierFreeIds(force = false): Promise<number[]> {
  if (!force) {
    try {
      const raw = localStorage.getItem(BF_KEY);
      if (raw) {
        const c = JSON.parse(raw) as { t: number; ids: number[] };
        if (Date.now() - c.t < TTL && Array.isArray(c.ids)) return c.ids;
      }
    } catch {
      /* ignore */
    }
  }
  const res = await fetch(`${FN_URL}?bf=list&pages=3`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`bf ${res.status}`);
  const json = await res.json();
  const ids = (json?.ids ?? []) as number[];
  try {
    localStorage.setItem(BF_KEY, JSON.stringify({ t: Date.now(), ids }));
  } catch {
    /* ignore */
  }
  return ids;
}

export type AccessDetail = {
  has: boolean;
  wheelchair?: string;
  parking?: string;
  restroom?: string;
  stroller?: string;
  elevator?: string;
  exit?: string;
  helpdog?: string;
  audioguide?: string;
  braileblock?: string;
  lactationroom?: string;
  route?: string;
  publictransport?: string;
};

export async function fetchAccessDetail(contentId: number): Promise<AccessDetail | null> {
  try {
    const res = await fetch(`${FN_URL}?bf=detail&id=${contentId}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as AccessDetail;
  } catch {
    return null;
  }
}
