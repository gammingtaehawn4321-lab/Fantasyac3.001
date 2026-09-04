# Fantasyac 4.0.3 — 정착지 · 상인 배치 · 상점 UI

## 버전
- 앱: 4.0.3
- 게임 데이터: 4.0.3.0

## 구현
- 기존 월드맵의 CITY / VILLAGE structureGroupId를 실제 정착지 데이터에 연결.
- 총 19개 정착지 데이터화: 지상/하늘/해저/지하 거점 포함.
- 정착지 등급: 촌락 / 마을 / 도시 / 대도시.
- 도시/대도시 구역 탭, 시설 카드, 영업시간, 경제 태그, 특산 태그.
- 4.0.2의 26종 상점 타입을 실제 상인 83명/점포에 배치. 모든 26종 타입이 최소 1곳 이상 실제 정착지에 배치됨.
- 상점 구매/판매 모바일 UI 추가: 재고, 희귀도, 가격, 수량 선택, 보유금, 매입가, 상인 친밀도, 재입고 시간 표시.
- 상점 가격은 settlementId / regionId / economyTags를 4.0.2 가격 엔진에 전달.
- 야간 상점(암시장/장물아비 등)은 자정을 넘는 영업시간 처리 지원.
- 여관 3등급 숙박: 루피 소비 + 게임 시간 경과 + HP/정신력/마나 비율 회복.
- 방문한 정착지와 마지막 정착지 저장. 구 세이브에는 자동 기본값 생성.
- 월드맵에서 현재 Hex가 동일 structureGroupId 생활권에 있을 때만 정착지 진입 가능.
- 여행 중 정착지 진입 불가.
- 게시판/길드/은행/시장 시설은 4.0.3에서 배치와 영업시간까지 연결하고 세부 기능은 후속 확장 대상으로 유지.

## 데이터 구조
- `src/data/world/settlements/settlementTypes.ts`
- `src/data/world/settlements/settlementCatalog.ts`
- `src/data/world/settlements/settlementEngine.ts`
- `src/components/SettlementModal.tsx`
- `src/components/ShopModal.tsx`

## 검증
- 정착지 19개 로드
- 고유 상인 83명 로드
- 실제 배치 상점 타입 26/26
- 모든 정착지 점포 merchantId 레지스트리 연결 확인
- 자정 교차 영업시간 확인
- 상점/정착지 데이터 TypeScript semantic compile 확인
- 변경 TS/TSX syntax transpile 확인
