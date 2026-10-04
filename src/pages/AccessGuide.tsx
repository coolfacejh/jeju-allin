import Localize from '../components/Localize';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { ACCESS_PICTOGRAMS, PICTOGRAM_GROUPS, PICTOGRAM_SOURCE } from '../lib/accessPictograms';
import { loadSavedIds } from '../lib/storage';
export default function AccessGuide() {
 const [query,setQuery]=useState(''),[group,setGroup]=useState('전체');
 const shown=ACCESS_PICTOGRAMS.filter(p=>(group==='전체'||p.group===group)&&`${p.label} ${p.description}`.includes(query.trim()));
 return <Localize><div className="min-h-screen bg-surface text-ink pb-24"><main className="app-shell mx-auto px-4 py-6 space-y-5">
  <Link to="/home" className="inline-block text-primary py-2">← 큐레이션 피드</Link>
  <header className="rounded-3xl bg-primary text-white p-6 md:p-8"><p className="text-sm">여행 전에 알아두는 접근성 표시</p><h1 className="text-2xl md:text-3xl font-bold mt-2">무장애 관광자료</h1><p className="mt-3">이지제주 픽토그램 37종을 뜻과 이용 조건별로 살펴보세요.</p></header>
  <section className="bg-white border border-line rounded-2xl p-5 space-y-3"><h2 className="font-bold">아이콘은 세부 안내와 함께 확인하세요</h2><p className="text-sm text-sub">이 페이지는 픽토그램의 뜻을 알려주는 자료입니다. 아이콘이 목록에 있다고 모든 장소에 해당 시설이 있는 것은 아닙니다. 장소별 상세 정보의 출처와 조건을 함께 확인하세요.</p><p className="text-sm text-sub">파랑·초록·빨강과 ‘하·중·상’은 이지제주의 도움·경사로·단차 분류입니다. 색만으로 안전 여부를 판단하지 마세요. 일반 주차장과 장애인 전용 주차구역, 단차 없음과 단독접근가능은 서로 다른 뜻입니다.</p><a href={PICTOGRAM_SOURCE} target="_blank" rel="noreferrer" className="inline-block text-sm underline text-primary">이지제주 공식 픽토그램 기준 확인 ↗</a></section>
  <section aria-label="픽토그램 찾기" className="space-y-3"><label className="block text-sm font-bold">픽토그램 이름·설명 검색<input className="block mt-2 w-full border border-line bg-white p-3 rounded-xl font-normal" placeholder="예: 화장실, 경사로, 대여" value={query} onChange={e=>setQuery(e.target.value)} /></label><div className="flex flex-wrap gap-2">{['전체',...PICTOGRAM_GROUPS].map(g=><button key={g} type="button" aria-pressed={group===g} onClick={()=>setGroup(g)} className={`px-4 py-2 rounded-full text-sm ${group===g?'bg-primary text-white':'bg-white border border-line'}`}>{g}</button>)}</div><p role="status" className="text-sm text-sub">픽토그램 {shown.length}개 · 장소 검색 결과가 아닙니다</p></section>
  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{shown.map(p=><article key={p.id} data-pictogram={p.id} className="bg-white border border-line rounded-2xl p-4 flex items-start gap-4"><img src={p.image} alt="" width="56" height="56" className="w-14 h-14 shrink-0 object-contain" /><div className="min-w-0"><p className="text-xs text-muted">{p.group}</p><h2 className="font-bold mt-1">{p.label}</h2><p className="text-sm text-sub mt-2 leading-relaxed">{p.description}</p></div></article>)}</div>
  {!shown.length&&<p className="p-6 text-center text-sub">맞는 픽토그램이 없어요. 검색어 또는 분류를 바꿔 주세요.</p>}
  <section className="bg-white rounded-2xl border border-line p-5 space-y-3"><h2 className="font-bold">제주 무장애 여행 정보 더 보기</h2><p className="text-sm text-sub">이지제주에서 여행지별 접근성 세부 안내와 관광약자 지원 정보를 확인할 수 있습니다.</p><a href="https://easyjeju.net/" target="_blank" rel="noreferrer" className="block text-primary underline text-sm">이지제주 관광약자접근성안내센터 ↗</a><a href="tel:15664669" className="block text-primary underline text-sm">센터 문의 · 1566-4669</a><Link to="/olle" className="block text-primary underline text-sm">올레길 접근성 구간 살펴보기 →</Link><p className="text-xs text-muted">픽토그램 출처·저작권: 제주특별자치도 관광약자접근성안내센터(이지제주). 공식 안내 게시일 2023-06-23, 자료 확인 2026-09-27. 설명은 제주올인에서 요약하고 방문 전 확인 사항을 덧붙였습니다.</p></section>
 </main><BottomNav savedCount={loadSavedIds().length} /></div></Localize>;
}
