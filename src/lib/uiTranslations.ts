import english from './uiEnglish.json';
const messages: Record<string, string> = english;
export function translateUiText(text: string, lang: 'ko' | 'en'): string {
  if (lang === 'ko') return text;
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return text;
  const exact = messages[trimmed];
  if (exact !== undefined) return (text.match(/^\s*/)?.[0] || '') + exact + (text.match(/\s*$/)?.[0] || '');
  // Only bounded UI formats are translated; provider prose and place names stay original.
  const formats: [RegExp, (...parts: string[]) => string][] = [
    [/^(\d+)박 (\d+)일$/, (_, n, d) => `${n} nights / ${d} days`],
    [/^날짜 미정 · (.+)$/, (_, rest) => `Dates undecided · ${translateUiText(rest, lang)}`],
    [/^(\d+)일차(.*)$/, (_, d, rest) => `Day ${d}${translateUiText(rest, lang)}`],
    [/^접근성 정보 (\d+)\/6항목$/, (_, n) => `Accessibility information: ${n}/6 items`],
    [/^사진 (\d+) 보기$/, (_, n) => `View photo ${n}`],
    [/^약 (\d+(?:\.\d+)?)시간 체류$/, (_, n) => `Approx. ${n} hours at this place`],
    [/^이동 약 (\d+)분$/, (_, n) => `Approx. ${n} min travel`],
    [/^이동 약 (\d+)분 · 직선 (.+)$/, (_, n, km) => `Approx. ${n} min travel · ${km} straight-line`],
    [/^직선 (.+)$/, (_, km) => `${km} straight-line`],
    [/^(\d+)시간 (\d+)분$/, (_, h, m) => `${h}h ${m}m`],
    [/^(\d+)분$/, (_, m) => `${m} min`],
    [/^(\d+)곳$/, (_, n) => `${n} places`],
    [/^· (\d+)곳$/, (_, n) => `· ${n} places`],
    [/^(\d+)명$/, (_, n) => `${n} travelers`],
    [/^(.+) 이후$/, (_, date) => `after ${date}`],
    [/^정보 수신: (.+) \(현장 확인일 아님\)$/, (_, date) => `Received: ${date} (not an on-site verification date)`],
    [/^담은 (\d+)곳으로 날짜별 일정 만들기$/, (_, n) => `Create a daily itinerary with ${n} saved places`],
    [/^관광공사 제주 정보 · (\d+)곳$/, (_, n) => `Korea Tourism Organization · ${n} places`],
    [/^제주관광공사 비짓제주 · (\d+)곳 · 목록의 중복 장소는 통합 표시$/, (_, n) => `Visit Jeju · ${n} places · duplicate listings combined`],
  ];
  for (const [pattern, format] of formats) {
    const match = trimmed.match(pattern);
    if (match) return format(...match);
  }
  return text;
}
