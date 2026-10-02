// Explicit dates only: never turn an old annual event into this year's event.
export function calendarDate(value) {
 if(typeof value !== 'string') return undefined;
 const m=value.trim().match(/^(\d{4})[-./년\s]?(\d{1,2})[-./월\s]?(\d{1,2})(?:일)?$/);
 if(!m)return undefined;
 const s=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
 const d=new Date(s+'T00:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:undefined;
}
export function eventDates(raw) {
 const category=raw.providerCategory||raw.contentscd?.label||'';
 const name=raw.name||raw.title||'';
 const detected=raw.event || String(raw.contenttypeid)==='15' || /축제|행사/.test(category) || /축제|페스티벌|박람회|이벤트|행사(?!장)/.test(name) || (raw.contentType==='activity' && /(?:^|\s)20\d{2}(?:년|\s)/.test(name));
 if(!detected)return undefined;
 let start=calendarDate(raw.event?.start||raw.eventstartdate||raw.festivalstartdate);
 let end=calendarDate(raw.event?.end||raw.eventenddate||raw.festivalenddate);
 // Only accept an explicitly written full-date range from the event introduction.
 if(!start||!end){
  const text=String(raw.introduction||raw.desc||'').replace(/<[^>]*>/g,' ');
  const range=text.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})\s*[~～–—]\s*(\d{4}[-./]\d{1,2}[-./]\d{1,2})/);
  if(range){start=start||calendarDate(range[1]);end=end||calendarDate(range[2]);}
 }
 return start&&end&&start<=end?{start,end}:{};
}
