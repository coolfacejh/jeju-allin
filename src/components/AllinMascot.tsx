import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import welcome from '../assets/mascot/welcome.webp';
import calm from '../assets/mascot/calm.webp';

export default function AllinMascot({mood='welcome',className=''}:{mood?:'welcome'|'calm';className?:string}) {
 return <img className={'allin-mascot '+className} src={mood==='welcome'?welcome:calm} alt="" aria-hidden="true" width="560" height="560" decoding="async" />;
}
export function AllinPlanGreeting(){const {lang}=useI18n();return <div className="allin-plan-greeting"><AllinMascot /><div><strong>{lang==='en'?'Your itinerary draft is ready!':'여행 일정 초안이 준비됐어요!'}</strong><p>{lang==='en'?'Check the visit order and times before you set off.':'떠나기 전, 방문 순서와 시간을 확인해 주세요.'}</p></div></div>;}
export function useAllinSaved(){
 const {lang}=useI18n();const [visible,setVisible]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>>();
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function show(){clearTimeout(timer.current);setVisible(true);timer.current=setTimeout(()=>setVisible(false),3200);}
 const node=<div className="allin-save-live" role="status" aria-live="polite" aria-atomic="true">{visible&&<div className="allin-save-toast"><AllinMascot /><span>{lang==='en'?'Saved to your trip!':'내 여행에 담았어요!'}</span><button type="button" onClick={()=>setVisible(false)} aria-label={lang==='en'?'Dismiss notification':'알림 닫기'}>×</button></div>}</div>;
 return {show,node};
}
