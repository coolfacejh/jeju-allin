// 외부 지도앱 딥링크 (설치 시 앱, 아니면 웹으로 열림)
export function kakaoMapUrl(name: string, lat?: number, lng?: number): string {
  if (lat == null || lng == null) return `https://map.kakao.com/?q=${encodeURIComponent(name)}`;
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}

export function kakaoRouteUrl(name: string, lat?: number, lng?: number): string {
  if (lat == null || lng == null) return `https://map.kakao.com/?q=${encodeURIComponent(name)}`;
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}

export function naverMapUrl(name: string): string {
  return `https://map.naver.com/v5/search/${encodeURIComponent(name)}`;
}

export function googleMapUrl(name: string, lat?: number, lng?: number): string {
  if (lat == null || lng == null)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
