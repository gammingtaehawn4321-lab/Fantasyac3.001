# 판타지악 Local AI 1차 통합

기준본: `판타지악_3.3_펫연출_사용자파일분리_20260831.zip`

## AI 역할 분리

- Gemini: 자유 입력 해석 / 구조화 JSON / 사건 의미 판정
- Fantasyac Engine: 실제 수치 / 상태 / 퀘스트 / 아이템 / 시간 확정
- Narrator: 최종 본문 게임 로그

`NARRATOR_PROVIDER=AUTO`가 기본값이다.

1. localhost Local Narrator 시도
2. 성공하면 로컬 로그 사용
3. 로컬 AI가 꺼져 있거나 실패하면 Gemini Narrator fallback

RPG 일반 행동은 Narrator가 성공하기 전에는 `setPlayerState`를 호출하지 않는다. 따라서 Narrator 실패 시 계산된 상태가 먼저 커밋되지 않는다.

## Gemini 출력 절약

일반 RPG `/api/rpg/action`의 `narrative`는 최종 장문이 아니라 Local Narrator용 1~3문장 내부 장면 요약으로 변경했다.

## 펫

기존 `/api/rpg/pet-interaction`도 동일 Narrator 계층을 사용한다. `src/user_content/petReferences.ts`는 기준본과 동일하게 보존했다.

## 로컬 모델

- PC 고품질: Qwen3 14B Q4_K_M / ctx 16384
- PC 균형: Qwen3 8B Q4_K_M / ctx 8192
- Galaxy A17 안전: Qwen3 1.7B Q4_K_M / ctx 3072 / max output 900

Android는 Termux를 사용하지 않고 앱 내부 네이티브 런타임을 붙이는 다음 단계 대상으로 둔다.

## 세이브

저장/불러오기 창에:

- 전체 백업(JSON)
- 백업 가져오기(JSON)

기능을 추가했다. 같은 로컬 설치본/같은 앱 ID를 업데이트하는 동안 IndexedDB는 유지하도록 한다.

## 업데이트

- 앱 버전 상수 추가
- 업데이트 manifest 예제 추가
- `/api/update/status` 체크 API 추가
- 실제 프로그램 파일 교체는 PC/Android 패키지 런처 단계에서 연결한다.

## 검증

- 신규 AI 모듈 독립 TypeScript 타입체크 통과
- 수정 TS/TSX 파일 전부 TypeScript transpile syntax 검사 통과
- 전체 프로젝트 `tsc`는 이 작업 컨테이너에 React/Vite/Express/Google GenAI 의존성이 설치되지 않아 외부 모듈 해석 단계에서 중단됨
- 펫 사용자 연출 파일 SHA-256 기준본과 동일
