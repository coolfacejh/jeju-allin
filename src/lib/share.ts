import type { Content } from '../types';
import { kakaoMapUrl } from './maps';

// 여행 코스를 URL에 인코딩 (호스팅 시 공유 링크로 복원 가능)
export function encodeTrip(ids: number[], nights: number, headcount: number): string {
  try {
    return encodeURIComponent(btoa(JSON.stringify({ i: ids, n: nights, h: headcount })));
  } catch {
    return '';
  }
}

export function decodeTrip(s: string): { ids: number[]; nights: number; headcount: number } | null {
  try {
    const obj = JSON.parse(atob(decodeURIComponent(s)));
    if (!Array.isArray(obj.i)) return null;
    return { ids: obj.i.map(Number), nights: Number(obj.n) || 0, headcount: Number(obj.h) || 1 };
  } catch {
    return null;
  }
}

export function shareUrl(ids: number[], nights: number, headcount: number): string {
  const d = encodeTrip(ids, nights, headcount);
  const origin = location.origin === 'null' ? '' : location.origin;
  return `${origin}${location.pathname}#/trip?d=${d}`;
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
export async function doShare(title: string, text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch {
    /* 사용자가 취소했거나 미지원 → 복사로 폴백 */
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
