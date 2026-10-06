# 숙소 네이버 예약 연결 점검 (2026-10-06)

- 대상: 앱 관광정보 캐시의 비짓제주 숙소 918곳. 네이버 전체 숙소 목록이 아님.
- 관광공사 상세 자료 조회 성공 917곳, 실패 1곳.
- 홈페이지 등록 735곳. 접근 가능한 숙소 사이트의 홈페이지와 명시된 예약 링크를 확인함. SNS/예약 중개 플랫폼, 접속 실패, 자바스크립트 전용 예약 화면은 자동 확인 범위에 포함하지 못함.
- 네이버 예약 페이지의 업체명·도로명주소를 대조해 18곳을 연결함.
- 종료되거나 주소가 다른 예약 페이지는 제외. 확인 불가는 네이버 예약을 운영하지 않는다는 뜻이 아님.
- 신규/미등록 숙소는 공식 상세정보에 숙박형 네이버 예약 URL이 있는 경우 서버에서 해당 예약 페이지의 업체명·주소까지 확인. 응답 1일 캐시. 실패는 미등록으로 영구 저장하지 않음.
- 사전 점검 목록은 30일 이후 재확인 필요. 일정의 예약 완료 상태·실시간 잔여 객실과 가격은 동기화하지 않음.

## 확인된 숙소

|숙소|네이버 예약|확인 근거|
|---|---|---|
|카이리조트|https://booking.naver.com/booking/3/bizes/191043|http://jejukai.com/|
|바다의향기|https://booking.naver.com/booking/3/bizes/674225|https://xn--ok0b52guvjwvl61ao2bky2c.com/|
|중문통나무펜션리조트|https://booking.naver.com/booking/3/bizes/14106|https://www.jejulog.com/|
|씨스테이호텔|https://booking.naver.com/booking/3/bizes/762826|http://www.seastayhotel.com/|
|수키하우스|https://booking.naver.com/booking/3/bizes/746590|https://sookihouse.com/|
|벨룸리조트|https://booking.naver.com/booking/3/bizes/526611|https://www.velum.co.kr/|
|제주도아이랑 파미유리조트 키즈가족펜션|https://booking.naver.com/booking/3/bizes/237606|https://www.jejufamille.co.kr/reservation|
|빌라비 하우스 펜션|https://booking.naver.com/booking/3/bizes/363558|https://booking.naver.com/booking/3/bizes/363558|
|서귀포 늘바다 애견동반펜션|https://booking.naver.com/booking/3/bizes/297606|https://www.oceanlogps.kr/|
|호텔 서귀피안 서귀포본점|https://booking.naver.com/booking/3/bizes/250783|https://hotelseogwipean.com/|
|해뜨는초록마을|https://booking.naver.com/booking/3/bizes/231957|http://sogvill.co.kr/index.php|
|제주올레하우스팬션|https://booking.naver.com/booking/3/bizes/15060|http://ollehouse.kr/|
|제주 순진한가 펜션|https://booking.naver.com/booking/3/bizes/297597|https://ivyterrace.kr/|
|제주 벨루가|https://booking.naver.com/booking/3/bizes/239456|https://xn--o39at8vj0ccup95a.com/|
|제주 베스트힐 글램핑 & 펜션|https://booking.naver.com/booking/3/bizes/172898|http://www.jejubesthill.com/|
|제주신라호텔|https://booking.naver.com/booking/3/bizes/167605|https://booking.naver.com/booking/3/bizes/167605|
|롯데호텔 제주|https://booking.naver.com/booking/3/bizes/167596|https://booking.naver.com/booking/3/bizes/167596|
|제주구도|https://booking.naver.com/booking/3/bizes/799462|https://booking.naver.com/booking/3/bizes/799462|

## 추가 확인이 필요한 범위

공식 자료에 주소가 없거나 홈페이지에서 확인할 수 없는 숙소, 한국관광공사에만 등록된 숙소, 새로 등록된 숙소는 아직 전수 연결을 보장하지 않음. 업체가 제공한 정확한 네이버 예약 URL 또는 네이버 측 공식 제공 데이터가 필요함. 검색 URL이나 추정 업체 ID를 예약 링크로 사용하지 않음.
