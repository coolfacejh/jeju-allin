import type { Content } from '../types';
import LZString from 'lz-string';
import { kakaoMapUrl } from './maps';
import { type Trip, validTrip, makeTrip } from './trip';
import { resolvePlaces } from './places';
import { chunkIntoDays } from './planner';

// Portable snapshot: does not require the recipient's cache or a new backend.
export function encodeTrip(trip: Trip): string {
  if (!validTrip(trip)) throw new Error('여행 정보가 올바르지 않아요. 최대 100곳까지 공유할 수 있어요.');
  const compact: Trip = { ...trip, places: trip.places.map(p => ({
    id: p.id, name: p.name, contentType: p.contentType, region: p.region,
    lat: p.lat, lng: p.lng, avgStayMinutes: p.avgStayMinutes,
    desc: '', image: ({ stay: '🏡', food: '🍊', activity: '🌊' })[p.contentType],
    rating: 0, reviewCount: 0, tags: { travelType: [], companion: [], themes: [] },
    provenance: { source: 'shared' },
  })) };
  const encoded = 'v2.' + LZString.compressToEncodedURIComponent(JSON.stringify(compact));
  if (encoded.length > 16000) throw new Error('공유할 내용이 너무 길어요. 장소 수나 메모를 줄여 주세요.');
  return encoded;
}

export function decodeTrip(s: string): Trip | null {
  try {
    if (!s || s.length > 16000) return null;
    if (s.startsWith('v2.')) {
      const raw = LZString.decompressFromEncodedURIComponent(s.slice(3));
      if (!raw || raw.length > 200000) return null;
      const t: unknown = JSON.parse(raw);
      if (!validTrip(t)) return null;
      // A shared link never establishes verified facilities, reviews or provenance.
      return { ...t, places: t.places.map(p => ({
        id: p.id, name: p.name, contentType: p.contentType, region: p.region,
        lat: p.lat, lng: p.lng, avgStayMinutes: p.avgStayMinutes,
        desc: '', image: ({ stay: '🏡', food: '🍊', activity: '🌊' })[p.contentType],
        rating: 0, reviewCount: 0, tags: { travelType: [], companion: [], themes: [] },
        provenance: { source: 'shared' },
      })) };
    }
    const old = JSON.parse(atob(decodeURIComponent(s)));
    if (!Array.isArray(old.i) || old.i.length > 100 || !old.i.every((id: unknown) => Number.isSafeInteger(id))) return null;
    const places = resolvePlaces(old.i);
    if (places.length !== old.i.length || !Number.isInteger(old.n) || old.n < 0 || old.n > 30) return null;
    const t = makeTrip(chunkIntoDays(places, old.n + 1), old.n, old.h, {});
    return validTrip(t) ? t : null;
  } catch { return null; }
}

export function shareUrl(trip: Trip): string {
  if (!['http:', 'https:'].includes(location.protocol)) throw new Error('공유 링크는 웹 주소로 앱을 열었을 때 만들 수 있어요.');
  return `${location.origin}${location.pathname}#/trip?d=${encodeTrip(trip)}`;
}

// 공유용 텍스트 생성
export function buildTripText(items: Content[], nightsLabel: string, headcount: number, url: string): string {
  const lines = items.map(
    (c, i) => `${i + 1}. ${c.name} (${c.region})\n   📍 ${kakaoMapUrl(c.name, c.lat, c.lng)}`,
  );
  return [
    `🍊 제주올인 추천 여행`,
    `${nightsLabel} · ${headcount}명 · 총 ${items.length}곳`,
    ``,
    ...lines,
    ``,
    `함께 확인해요 👇`,
    url,
  ].join('\n');
}

// Web Share API → 실패 시 클립보드 복사
export async function doShare(title: string, text: string): Promise<'shared' | 'copied' | 'failed' | 'cancelled'> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
