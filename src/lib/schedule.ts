export interface VisitWindow {
  durationMin?: number;
  open?: string;
  close?: string;
}
export interface ScheduleSettings {
  startDate?: string;
  transport: 'car' | 'walk' | 'transit';
  dayStart: string;
  dayEnd: string;
  arrival?: string;
  departure?: string;
  arrivalBuffer: number;
  departureBuffer: number;
  visits: Record<string, VisitWindow>;
}
export const DEFAULT_SCHEDULE: ScheduleSettings = {
  transport: 'car', dayStart: '10:00', dayEnd: '18:00', arrivalBuffer: 60, departureBuffer: 120, visits: {},
};
export const TRANSPORT_LABEL = { car: '자동차', walk: '도보', transit: '대중교통' };
export function minutes(value?: string): number | null {
  if (typeof value !== 'string' || !value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}
export function validDate(value?: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2100;
}
export function dateForDay(start: string | undefined, day: number): string {
  if (!start || !validDate(start)) return '';
  const date = new Date(start + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString().slice(0, 10);
}
export function validSchedule(value: unknown, ids: number[]): value is ScheduleSettings {
  if (!value || typeof value !== 'object') return false;
  const s = value as ScheduleSettings;
  const optionalTime = (v: unknown) => v === undefined || v === '' || (typeof v === 'string' && minutes(v) !== null);
  if (!['car', 'walk', 'transit'].includes(s.transport) || minutes(s.dayStart) === null || minutes(s.dayEnd) === null
    || !optionalTime(s.arrival) || !optionalTime(s.departure)
    || (s.startDate !== undefined && (typeof s.startDate !== 'string' || !validDate(s.startDate)))
    || ![s.arrivalBuffer, s.departureBuffer].every(n => Number.isInteger(n) && n >= 0 && n <= 720)
    || !s.visits || typeof s.visits !== 'object' || Array.isArray(s.visits)) return false;
  return Object.entries(s.visits).every(([id, w]) => ids.includes(Number(id)) && w && typeof w === 'object'
    && (w.durationMin === undefined || (Number.isInteger(w.durationMin) && w.durationMin >= 1 && w.durationMin <= 1440))
    && optionalTime(w.open) && optionalTime(w.close));
}
