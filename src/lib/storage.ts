import type { UserProfile } from '../types';

// 로그인 없는 로컬 영속화 — 모든 상태는 브라우저 안에서만 처리
const PROFILE_KEY = 'jeju_allin_profile';
const SAVED_KEY = 'jeju_saved_trip_ids';
const WALK_NOTE_KEY = 'jeju_walk_notes'; // 힐링 산책 '오늘의 한마디'
const WISH_KEY = 'jeju_wish'; // 직접 하고싶은 것 (자유 입력)

const PLAN_NOTE_KEY = 'jeju_plan_notes'; // 동선 장소별 메모
const REASONS_KEY = 'jeju_reasons_on'; // 실험: 추천 이유 표시 여부
const EVENTS_KEY = 'jeju_events'; // 사용 로그(실험용)

export function loadReasonsOn(): boolean {
  try {
    return localStorage.getItem(REASONS_KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveReasonsOn(on: boolean): void {
  try {
    localStorage.setItem(REASONS_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export interface UsageEvent {
  t: number;
  type: string;
  [k: string]: unknown;
}

export function logEvent(type: string, data: Record<string, unknown> = {}): void {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const arr: UsageEvent[] = raw ? JSON.parse(raw) : [];
    arr.push({ t: Date.now(), type, ...data });
    // 최근 500개만 유지
    localStorage.setItem(EVENTS_KEY, JSON.stringify(arr.slice(-500)));
  } catch {
    /* ignore */
  }
}

export function loadEvents(): UsageEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as UsageEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearEvents(): void {
  try {
    localStorage.removeItem(EVENTS_KEY);
  } catch {
    /* ignore */
  }
}

export function loadPlanNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PLAN_NOTE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function savePlanNote(id: number, note: string): void {
  try {
    const n = loadPlanNotes();
    if (note) n[id] = note;
    else delete n[id];
    localStorage.setItem(PLAN_NOTE_KEY, JSON.stringify(n));
  } catch {
    /* ignore */
  }
}

export function loadWish(): string {
  try {
    return localStorage.getItem(WISH_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveWish(wish: string): void {
  try {
    localStorage.setItem(WISH_KEY, wish);
  } catch {
    /* storage unavailable */
  }
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable */
  }
}

export function loadSavedIds(): number[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0))] : [];
  } catch {
    return [];
  }
}

export function saveSavedIds(ids: number[]): boolean {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

export function loadWalkNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(WALK_NOTE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveWalkNote(dateKey: string, note: string): void {
  try {
    const notes = loadWalkNotes();
    notes[dateKey] = note;
    localStorage.setItem(WALK_NOTE_KEY, JSON.stringify(notes));
  } catch {
    /* storage unavailable */
  }
}

// 내 스팟 (지도에서 직접 추가)
export type MySpot = { id: number; name: string; lat: number; lng: number };
const MY_SPOTS_KEY = 'jeju_my_spots';

export function loadMySpots(): MySpot[] {
  try {
    const raw = localStorage.getItem(MY_SPOTS_KEY);
    return raw ? (JSON.parse(raw) as MySpot[]) : [];
  } catch {
    return [];
  }
}

export function saveMySpots(spots: MySpot[]): void {
  try {
    localStorage.setItem(MY_SPOTS_KEY, JSON.stringify(spots));
  } catch {
    /* storage unavailable */
  }
}
