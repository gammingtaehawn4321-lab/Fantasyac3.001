# 판타지악 4.0.1 — 월드맵/인카운터 이동 기반 패치

## 목표
인카운터를 월드맵과 분리된 추상 공간으로 취급하지 않고, 모든 여행/일반 인카운터를 실제 현재 Hex에 종속시킨다.

## 핵심 변경
- 여행 인카운터가 열리기 전에 해당 TravelEncounterUnit의 Hex로 `currentHexId`를 먼저 이동한다.
- 같은 Hex의 두 번째 여행 인카운터는 좌표/비행정 연료를 중복 적용하지 않는다.
- 여행 경로는 `MOVING` / `ENCOUNTER_PAUSED` 상태를 가진다.
- 여행 사건 해결 후 기존 경로를 그대로 이어가되, 다음 Hex에 실제 진입한 뒤 그 Hex의 사건을 시작한다.
- 일반 인카운터에서 걷기/달리기/도주/길을 따라 실제 장소를 벗어나는 행동은 `MOVE_HEX`로 해석할 수 있다.
- `MOVE_HEX`는 실제 현재 Hex의 진입 가능한 인접 Hex만 허용한다.
- 방향(E/NE/NW/W/SW/SE/UP/DOWN/LINK)을 함께 전달하며, Hex ID가 누락돼도 방향이 단일 후보를 가리키면 엔진이 해당 Hex를 복구할 수 있다.
- 방 안 몇 걸음, 자세 변경, 회피 등 장소를 벗어나지 않는 묘사는 Hex 이동으로 취급하지 않는다.
- 인카운터 중 기존 목적지 경로를 벗어나 다른 Hex로 실제 이동하면 기존 TravelSession은 현재 위치에서 중단된다.
- 여행 전투에서 도주하면 기존 목적지 경로를 자동 재개하지 않고 현재 실제 Hex에 남는다.
- 이동 후 Narrator가 읽는 현재 위치도 갱신된 Hex를 사용한다.
- 모델이 존재하지 않거나 차단된 Hex를 반환해도 파서에서 조용히 버리지 않고 게임 엔진이 이동 실패를 확정해 서술/좌표 불일치를 막는다.

## APK / Native Gemini
기존 모바일 네이티브 Gemini 프롬프트에는 실제 인접 Hex ID 목록이 없었다. 4.0.1부터 현재 Hex와 모든 인접 Hex의 방향, 지형, 레이어, 진입 가능 여부를 동적으로 제공한다.

## 저장 호환
기존 TravelSession 필드는 유지하면서 새 필드(`status`, `currentPathIndex`, `pausedAtHexId`)는 선택 필드로 추가했다.
구 세이브에서 활성 여행 인카운터/전투를 불러올 때 이전 버전의 `currentHexId`가 직전 Hex에 남아 있으면 현재 TravelEncounterUnit의 실제 Hex로 자동 보정한다.

## 버전
- 앱 버전: 4.0.1
- 게임 데이터 버전: 4.0.1.0

## 검증
- 변경 TypeScript/TSX 파일 transpile syntax 검사 통과
- 변경 파일 대상 `tsc` 내부 진단: 외부 의존성 미설치 오류를 제외하고 추가 타입 오류 없음
- `node scripts/release/check_release_tree.mjs`: 통과
- 최종 ZIP은 별도 무결성 검사 수행

> 현재 작업 컨테이너에서는 npm 의존성 다운로드가 완료되지 않아 전체 `npm run lint`/`npm run build`를 끝까지 실행하지 못했다. GitHub `Validate Fantasyac`가 최종 실제 의존성 설치/빌드 검증 단계다.
