# 제주올인 (Jeju All-In) — v1.1 통합 베이스

취향 큐레이션 여행 앱. 무광고·투명 추천, 이유(Reasons) 기반, 로그인 없는 로컬 저장.

## 스택
React 18 + Vite + TypeScript + Tailwind CSS 3 · react-router-dom(HashRouter)

## 실행
```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 구조
```
src/
  types.ts          # 공통 타입 (+ 차기 기능 확장 필드 자리)
  data/contents.ts  # 샘플 장소 데이터
  lib/curate.ts     # 큐레이션 점수 알고리즘 (여행40·동행25·케어15·테마10)
  lib/storage.ts    # LocalStorage 영속화 (프로필·담은목록·산책메모)
  components/        # Icon, BottomNav
  pages/            # Onboarding, Home, MyTrip
```

## 화면
1. `/onboarding` 취향 진단 → 프로필 저장
2. `/home` 큐레이션 홈 → 점수순 추천 + 이유 박스 + 담기
3. `/my-trip` 보관함 → 필터·삭제, 스마트 루트(예정)

## 차기 기능 (명세서 참고)
`types.ts`에 P0~P3 확장 필드(좌표·accessibility·food·venueGuide·walkGuide·pet)를 미리 정의.
- P0 AI 동선 설계 / P1 여행 약자 필터 / P2 외국인·알러지·매장QR(culture-qr) / P3 문화·힐링산책(토닥이)

## 제주 관광 데이터 연동 (프리페치)

권역(동/서/남/북) 필터는 각 장소의 좌표(`lat`/`lng`)로 계산합니다(`src/lib/region.ts`).

실제 공공 관광 데이터로 채우려면 (서버 없이):
1. 공공데이터포털(data.go.kr)에서 **한국관광공사_국문 관광정보 서비스** 활용신청 → 서비스키 발급
2. `node scripts/fetch-jeju.mjs <서비스키>` 실행 → `src/data/tourapi-jeju.json` 생성 (제주 숙박·음식점·관광지·레포츠…)
3. `src/data/contents.ts`에서 그 JSON을 import해 `CONTENTS`에 합치기(취향 태그·평점은 후속 보강)

TourAPI는 무료·좌표 제공(mapx/mapy)이라 카테고리(contentTypeId)와 권역 분할에 그대로 쓰입니다.
실시간 최신 데이터가 필요하면 프리페치 대신 서버리스 프록시(Cloudflare Workers 등)로 전환하세요.
