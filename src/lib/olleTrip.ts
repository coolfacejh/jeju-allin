import type { Content } from '../types';
import { currentTrip, makeTrip, saveTripSelection } from './trip';
import { rememberPlaces } from './places';
import { loadSavedIds } from './storage';
import { DEFAULT_SCHEDULE } from './schedule';

export function saveOlleVisit(place: Content, day: number): string | null {
  const latest = currentTrip(), ids = loadSavedIds();
  if (!Number.isInteger(day) || day < 0 || day > latest.nights) return '여행 날짜가 바뀌었어요. 화면을 다시 열고 날짜를 선택해 주세요.';
  const duration = place.avgStayMinutes;
  if (!duration || !Number.isInteger(duration) || duration > 1440) return '계획 시간은 1~1440분 사이로 입력해 주세요.';
  if (!ids.includes(place.id) && ids.length >= 100) return '한 여행에는 최대 100곳까지 담을 수 있어요.';
  if (!rememberPlaces([place])) return '저장 공간이 부족해 담지 못했어요.';
  const originalDay = latest.days.findIndex(d => d.includes(place.id));
  const buckets = latest.days.map((d,i) => d.filter(id => id !== place.id || i === day).map(id => id === place.id ? place : latest.places.find(p => p.id === id)!));
  if (originalDay !== day) buckets[day].push(place);
  const base = latest.schedule ?? DEFAULT_SCHEDULE;
  const schedule = { ...base, visits: { ...base.visits, [place.id]: { ...base.visits[place.id], durationMin: duration } } };
  return saveTripSelection(makeTrip(buckets, latest.nights, latest.headcount, latest.notes, schedule), ids.includes(place.id) ? ids : [...ids,place.id]) ? null : '저장하지 못했어요. 저장 공간을 확인해 주세요.';
}
