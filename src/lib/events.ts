import type { Content, UserProfile } from '../types';
import { eventDates, calendarDate } from '../../server/eventDates.js';
import { dateForDay } from './schedule';
export function koreaToday(now=new Date()):string { return new Date(now.getTime()+9*3600000).toISOString().slice(0,10); }
export function eventVisible(place:Content, profile:Pick<UserProfile,'startDate'|'nights'>, today=koreaToday()):boolean {
 const event=eventDates(place);
 if(!event)return true;
 if(!event.start||!event.end)return false;
 const start=calendarDate(profile.startDate);
 if(!start)return event.end>=today;
 const end=dateForDay(start,Number.isInteger(profile.nights)?Math.max(0,Math.min(30,profile.nights)):0);
 return event.end>=start&&event.start<=end;
}
export function eventPeriod(place:Content):string {
 const event=eventDates(place);
 return event ? (event.start&&event.end?`${event.start} ~ ${event.end}`:'행사 일정 확인 필요') : '';
}
