import { subcatOf } from './subcat';
import { courseForPlace, isOlleSegment } from './olle';
import type { Content } from '../types';
import { DEFAULT_SCHEDULE, minutes, type ScheduleSettings } from './schedule';

// P0: 담은 장소로 하루 동선 자동 생성 (MVP 단순안)
// - 좌표(위경도) 기반 최근접(nearest-neighbor) 순서
// - 자동차(40km/h)·도보(4km/h)는 직선거리 / 속도로 추정
// - 숙소는 마지막, 식당은 점심/저녁 시간대를 우선
// 2차에서 카카오/TMAP 경로 API로 실제 시간 대체 예정.


export interface RouteLeg {
  km: number | null;
  minutes: number | null;
}

export interface RouteStop {
  waitMin?: number;
  item: Content;
  arrive: string; // "HH:MM"
  depart: string; // "HH:MM"
  legFromPrev: RouteLeg | null; // 이전 지점 → 이 지점 이동
}

export interface RoutePlan {
  stops: RouteStop[];
  totalKm: number;
  totalTravelMin: number;
  complete: boolean;
  warnings: string[];
  deadline: string;
}

function haversineKm(a: Content, b: Content): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fmt(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  const m = ((rounded % 1440) + 1440) % 1440;
  const day = Math.floor(rounded / 1440);
  const prefix = day > 0 ? `+${day}일 ` : day < 0 ? '전날 ' : '';
  return `${prefix}${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function defaultStay(item: Content): number {
  // 숙소는 마지막 체크인 시간만 반영(숙박 시간 제외)
  if (item.contentType === 'stay') return 30;
  if (item.contentType === 'food') return 60;
  return item.avgStayMinutes ?? 90;
}

export function isMealStop(item:Content):boolean {
 return item.contentType==='food' && subcatOf(item)!=='카페·찻집';
}
// Prefer meals before a long next activity would miss the meal window; keep all lodgings last.
export function orderRoute(items:Content[],settings:ScheduleSettings=DEFAULT_SCHEDULE,day=0,nights=0):Content[] {
 const stays=items.filter(p=>p.contentType==='stay');
 const meals=items.filter(isMealStop);
 const activities=items.filter(p=>p.contentType!=='stay'&&!isMealStop(p));
 const ordered:Content[]=[];
 const nearest=(pool:Content[])=>pool.reduce((best,p)=>!ordered.length||haversineKm(ordered[ordered.length-1],best)<=haversineKm(ordered[ordered.length-1],p)?best:p,pool[0]);
 const start=Math.max(minutes(settings.dayStart)??600,day===0?(minutes(settings.arrival)??-settings.arrivalBuffer)+settings.arrivalBuffer:0);
 let eaten=0;
 while(activities.length||meals.length){
  let pick:Content;
  if(!activities.length)pick=nearest(meals);
  else if(!meals.length)pick=nearest(activities);
  else {
   const activity=nearest(activities),meal=nearest(meals);
   const trial=scheduleDay([...ordered,activity,meal],{...settings,mealAware:true},day,nights);
   const arrival=minutes(trial.stops[trial.stops.length-1].arrive);
   const target=start>=14*60||eaten>0?18*60:12*60;
   // Unknown travel times: interleave a meal after two activities, without claiming an arrival time.
   pick=arrival===null ? (ordered.filter(p=>!isMealStop(p)).length>=(eaten+1)*2?meal:activity) : arrival>target+60?meal:activity;
  }
  ordered.push(pick);
  if(isMealStop(pick)){meals.splice(meals.indexOf(pick),1);eaten++;}else activities.splice(activities.indexOf(pick),1);
 }
 return [...ordered,...stays];
}
export function recommendDays(items:Content[],days:number,settings:ScheduleSettings=DEFAULT_SCHEDULE):Content[][] {
 const count=Math.max(1,days),buckets=chunkIntoDays(orderRoute(items.filter(p=>p.contentType!=='stay'&&!isMealStop(p)),settings),count);
 items.filter(isMealStop).forEach((p,i)=>buckets[i%count].push(p));
 items.filter(p=>p.contentType==='stay').forEach((p,i)=>buckets[Math.min(i,Math.max(0,count-2))].push(p));
 return buckets.map((b,i)=>orderRoute(b,settings,i,count-1));
}

// 이미 정해진 순서를 여러 날로 균등 분배 (연속 청크)
export function chunkIntoDays(ordered: Content[], days: number): Content[][] {
  const d = Math.max(1, days);
  const buckets: Content[][] = Array.from({ length: d }, () => []);
  if (ordered.length === 0) return buckets;
  const per = Math.ceil(ordered.length / d);
  ordered.forEach((item, i) => {
    const day = Math.min(d - 1, Math.floor(i / per));
    buckets[day].push(item);
  });
  return buckets;
}

// This estimates elapsed time, never actual road/transit travel or live opening hours.
export function scheduleDay(ordered: Content[], settings: ScheduleSettings = DEFAULT_SCHEDULE, day = 0, nights = 0): RoutePlan {
  const warnings: string[] = [];
  const stops: RouteStop[] = [];
  const baseStart = minutes(settings.dayStart) ?? 600;
  const baseEnd = minutes(settings.dayEnd) ?? 1080;
  const arrival = day === 0 ? minutes(settings.arrival) : null;
  const departure = day === nights ? minutes(settings.departure) : null;
  let clock: number | null = Math.max(baseStart, arrival === null ? 0 : arrival + settings.arrivalBuffer);
  const deadline = Math.min(baseEnd, departure === null ? 1440 : departure - settings.departureBuffer);
  if (deadline <= clock) warnings.push('여행 가능한 시간이 없습니다. 도착·출발 시각과 확보시간을 조정해 주세요.');
  let mealCount=0;
  const firstMealTarget=clock>=14*60?18*60:12*60;
  if(ordered.filter(p=>p.contentType==='stay').length>1)warnings.push('하루에 숙소가 여러 곳입니다. 실제 숙박할 곳과 날짜를 확인해 주세요.');
  let totalKm = 0, totalTravelMin = 0;
  let complete = true;
  ordered.forEach((item, i) => {
    let leg: RouteLeg | null = null;
    if (i > 0) {
      const previous = ordered[i - 1];
      const km = haversineKm(previous, item);
      const ferry = /우도|마라도|가파도/.test(previous.name + item.name);
      const unknown = !Number.isFinite(km) || ferry || settings.transport === 'transit';
      const travel = unknown ? null : Math.ceil(km / (settings.transport === 'walk' ? 4 : 40) * 60);
      leg = { km: Number.isFinite(km) ? Math.round(km * 10) / 10 : null, minutes: travel };
      if (Number.isFinite(km)) totalKm += km;
      if (travel === null) {
        complete = false; clock = null;
        warnings.push(`${previous.name} → ${item.name}: ${!Number.isFinite(km) ? '좌표 정보 없음' : ferry ? '배편 확인 필요' : '대중교통 시간표 확인 필요'}. 이후 도착 시각을 계산하지 않습니다.`);
      } else {
        totalTravelMin += travel;
        if (clock !== null) clock += travel;
      }
    }
    const course = courseForPlace(item.id);
    if (course) {
      complete = false;
      warnings.push(`${item.name}: ${isOlleSegment(item.id) ? '일부 구간 · 사용자가 입력한 계획 시간(공식 소요시간 아님)' : `공식 도보 ${course.hours.join('~')}시간`}. 계획 시간에 출발점까지·종점 이후의 이동 및 배편은 포함되지 않습니다. 코스 상세에서 확인해 주세요.`);
    }
    const visit = settings.visits[item.id] ?? {};
    const open = minutes(visit.open), close = minutes(visit.close);
    if (open !== null && close !== null && close <= open) warnings.push(`${item.name}: 방문 가능 마감은 시작보다 늦어야 합니다. 자정을 넘는 영업은 별도 확인해 주세요.`);
    const beforeWait=clock;
    if (clock !== null && open !== null) clock = Math.max(clock, open);
    if(settings.mealAware && isMealStop(item)) {
      const target=mealCount===0?firstMealTarget:18*60;
      if(clock!==null) {
        if(mealCount<2)clock=Math.max(clock,target);
        if(mealCount>=(firstMealTarget===18*60?1:2)||clock>target+120)warnings.push(`${item.name}: 점심·저녁 권장 시간대에 배치하기 어렵습니다. 식당 수나 앞선 방문 시간을 조정해 주세요.`);
      } else warnings.push(`${item.name}: 이동시간이 불확실해 식사 시간도 확인이 필요합니다.`);
      mealCount++;
    }
    const arrive = clock;
    if (clock !== null) clock += visit.durationMin ?? defaultStay(item);
    if (clock !== null && close !== null && clock > close) warnings.push(`${item.name}: 입력한 방문 가능 마감 ${visit.close}를 넘습니다. 방문 순서나 체류시간을 바꿔 주세요.`);
    if (clock !== null && clock > deadline) warnings.push(`${item.name}: 일정 종료 한도 ${fmt(deadline)}를 넘습니다. 다른 날로 옮기거나 체류시간을 줄여 주세요.`);
    stops.push({ item, waitMin:clock!==null && arrive!==null && beforeWait!==null?Math.max(0,arrive-beforeWait):0, arrive: arrive === null ? '확인 필요' : fmt(arrive), depart: clock === null ? '확인 필요' : fmt(clock), legFromPrev: leg });
  });
  return { stops, totalKm: Math.round(totalKm * 10) / 10, totalTravelMin, complete, warnings, deadline: fmt(deadline) };
}

export function planRoute(items: Content[]): RoutePlan {
  return scheduleDay(orderRoute(items));
}
