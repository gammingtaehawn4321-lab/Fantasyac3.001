# 판타지악 4.0.4 — 도시 서비스 / 시장 경제 확장

## 버전
- 앱: 4.0.4
- 게임 데이터: 4.0.4.0

## 실제 기능 연결
- MARKET: 정착지별 시장 상인회를 실제 상인으로 생성하고 4.0.2 상점 엔진을 재사용한다. 재고는 12시간 주기로 갱신되며 일반 점포보다 넓은 혼합 재고를 사용한다.
- NOTICE_BOARD: 각 정착지별 게시판 의뢰 2종(물자 조달 / 주변 순찰)을 생성하고 기존 퀘스트 DB와 수락 흐름에 연결한다.
- GUILD: 지부 가입, 지역 게시판 계약 완료 수 기반 지부 등급, 1일 1회 등급별 보급품 수령을 구현했다.
- BANK: 전 정착지 공유 예치금 계좌의 예치 / 인출 기능을 구현했다.
- BLACK_MARKET / FENCE: 야간에 정보상을 통해 위치를 해금한 뒤 실제 점포가 노출되도록 연결했다. SECRET 상점은 암시장 해금과 분리해 계속 숨김 처리한다.
- AUCTION: 경매 전용 UI를 추가했다. 각 출품품은 하루 1회 입찰 가능하며 80% / 90% / 100% 입찰가에 따라 낙찰 확률이 달라진다. 100% 입찰가는 확정 낙찰이다.

## 지역 경제
- 정착지 / 지역 / 날짜 / 시장 부문을 기반으로 GENERAL, FOOD, MATERIAL, EQUIPMENT, MAGIC, LUXURY 6개 시장 지수를 생성한다.
- 시장 지수는 정착지 economyTags와 일자별 결정론적 변동을 합산하며 0.82~1.18 범위로 제한한다.
- 구매가에는 시장 지수를 그대로, 매입가에는 완화된 비율로 반영한다.
- 기존 CHEAP/EXPENSIVE/HIGH_DEMAND/LOW_DEMAND 계열 경제 태그와 함께 적용된다.
- 정착지 UI 상단에서 부문별 현재 지수를 100% 기준으로 확인할 수 있다.

## 저장 / 호환
- SettlementRuntimeState schemaVersion 2.
- bankBalance, guildMemberships, blackMarketUnlockedSettlementIds, recentAuctionBidKeys를 저장한다.
- 구 세이브는 sanitize 시 자동으로 기본값을 생성한다.
- 은행 / 길드 / 경매 / 시장 거래는 SettlementModal의 onUpdatePlayer 경로에서 즉시 자동 저장된다.

## 검증
- 19개 정착지 / 88개 상인(기존 83 + 시장 상인회 5) 연결 확인.
- MARKET 5 / GUILD 4 / BANK 4 / NOTICE_BOARD 5 시설 연결 확인.
- 모든 MARKET 시설에 대응 merchantId 존재 확인.
- 정착지별 게시판 의뢰 2종 및 퀘스트 DB 등록 확인.
- 은행 예치/인출, 길드 가입/보급 중복 수령 방지, 암시장 해금, 시장 재고 생성, 경매 확정 낙찰/중복 입찰 차단 스모크 테스트 통과.
