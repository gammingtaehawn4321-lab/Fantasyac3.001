# 판타지악 v3.0 운명 사용자 수정 가이드

## 1. 기본 운명 데이터
기본 종족 전용 운명은 `src/data/world/fateData.ts`에 있습니다.

현재 기본 전용 운명은 다음 10개 종족/세부종 각각 4개씩, 총 40개입니다.

- 인간 4
- 엘프 4
- 여우 수인 4
- 고양이 수인 4
- 개 수인 4
- 늑대 수인 4
- 새 수인 4
- 설인 4
- 인어족 4
- 용족 4

기본 운명은 캐릭터 생성 시 선택한 시작 지역에 맞추어 시작 위치를 자동으로 바꿉니다.
기존 v1.0의 9개 운명 ID는 구 세이브 호환용으로 숨겨 보존됩니다.

---

## 2. 사용자가 직접 쓰는 운명 슬롯
수정 파일:

`src/data/world/fateUserDefinitions.ts`

여기에는 사용자가 직접 작성하는 슬롯이 있습니다.

### 성인 테마 사용자 슬롯
다음 종족/세부종에는 각각 2개씩 빈 슬롯이 있습니다.

- 인간
- 엘프
- 여우 수인
- 고양이 수인
- 개 수인
- 늑대 수인
- 새 수인
- 설인
- 인어족
- 용족

총 20개입니다.

이 슬롯은 기본값이 `enabled:false`이며, 내용도 모두 비어 있습니다.
빈 상태에서는 캐릭터 생성 UI에도 나타나지 않고 Gemini에도 전달되지 않습니다.

### 설인 슬롯
`user_fate_yeti_custom_01`, `user_fate_yeti_custom_02` 두 슬롯도 성인 테마 예약 슬롯입니다.
다른 성인 운명과 동일하게 신체적 나이 18세 이상에서만 노출되며, 이번 변경에서는 설인 종족 자체의 연령/외형/캐릭터 생성 구조는 수정하지 않습니다. 해당 종족 구조 개편은 후속 단계에서 별도로 진행합니다.

---

## 3. 한 슬롯을 활성화하는 방법
예시 구조:

```ts
{
  id: 'user_fate_human_adult_01',
  enabled: false,
  theme: 'ADULT',
  race: 'HUMAN',
  allowedRegions: ['GRANDIA', 'SEIRE', 'SANTIMAC'],

  name: '',
  description: '',
  introSituation: '',
  userNarrativeReference: '',

  chapterTitles: ['', '', '', '', ''],
  endingNames: ['', ''],

  completionRewardName: '',
  completionRewardDescription: '',

  startingRupees: 100,
  startingItems: [],
}
```

사용 순서:

1. `name` 작성
2. `description` 작성
3. `introSituation` 작성
4. `chapterTitles` 5칸 모두 작성
5. `endingNames` 2칸 모두 작성
6. 필요하면 `completionRewardName`, `completionRewardDescription` 작성
7. 필요하면 `startingRupees`, `startingItems` 수정
8. 필요하면 `userNarrativeReference` 작성
9. 마지막에 `enabled:true`로 변경

필수 항목이 비어 있으면 `enabled:true`여도 운명 목록에 추가되지 않습니다.

---

## 4. 각 필드 의미

### `name`
캐릭터 생성과 운명 기록 UI에 표시되는 실제 운명 이름입니다.

### `description`
캐릭터 생성 시 플레이어가 읽는 운명의 기본 설명입니다.

### `introSituation`
이 운명을 선택하고 게임을 시작할 때 참고하는 시작 상황입니다.

### `userNarrativeReference`
Gemini가 해당 운명의 분위기, 규칙, 장기 진행 방향을 이해하기 위한 사용자 작성 참고문입니다.

공란이면 Gemini에 전달되지 않습니다.
성인 테마 슬롯의 이 값은 신체적 나이 18세 이상 캐릭터에서만 참조됩니다.

### `chapterTitles`
운명 전용 5개 장의 제목입니다.

순서:

1. 제1장 — 시작
2. 제2장 — 과거/사건의 확대
3. 제3장 — 갈림길
4. 제4장 — 선택의 결과
5. 제5장 — 최종장

현재 사용자 슬롯에서는 제목을 사용자가 작성하고, 각 장의 세부 진행 문맥은 `userNarrativeReference`와 이전 선택 기록을 기준으로 Gemini가 이어갑니다.

### `endingNames`
최종 운명 결말 2개의 표시명입니다.

### `completionRewardName`
운명 완수 후 기록되는 영구 운명 보상의 표시명입니다.

### `completionRewardDescription`
영구 기록의 설명입니다.

현재 운명 보상은 전투 스탯을 직접 강제로 올리지 않고 우선 세계 플래그/운명 기록으로 남기도록 설계되어 있습니다.
추후 운명 전용 패시브 시스템을 추가하면 이 ID를 연결할 수 있습니다.

### `startingRupees`
이 운명을 선택했을 때의 시작 루피입니다.

### `startingItems`
시작 아이템입니다.

예:

```ts
startingItems: [
  { name: '작은 회복약', quantity: 2 },
  { name: '약초', quantity: 3 },
]
```

가능하면 현재 아이템 데이터베이스에 실제 존재하는 표시명을 사용하세요.

---

## 5. 성인 테마 운명 안전장치
성인 테마 사용자 운명은 다음 조건을 모두 만족해야 캐릭터 생성 목록에 나타납니다.

- `enabled:true`
- 필수 문자열이 모두 작성됨
- `chapterTitles` 5개가 모두 작성됨
- `endingNames` 2개가 모두 작성됨
- 캐릭터의 신체적 나이가 18세 이상

공란인 사용자 운명 참조는 Gemini 프롬프트에 절대 포함되지 않습니다.

설인 사용자 운명 2개 역시 동일한 18+ 게이트를 사용합니다. 설인 종족 자체의 구조는 이번 단계에서 변경하지 않습니다.

---

## 6. 운명 진행 방식
게임 시작 후:

`모험 → 운명`

에서 현재 운명을 확인할 수 있습니다.

운명은 5개의 운명장으로 구성됩니다.

- 현재 장
- 완료한 장
- 잠긴 다음 장
- 지나온 핵심 선택
- 최종 결말
- 영구 운명 기록

이 표시됩니다.

Gemini에는 현재 운명과 현재 운명장만 내부 참고로 전달됩니다.
현재 운명장과 직접 관계없는 일반 행동으로는 운명이 진행되지 않습니다.

현재 장의 사건이 실제로 의미 있게 해결되었을 때 Gemini가 `fateAction`을 제안하고, 게임 엔진이 현재 운명의 유효 chapter/choice/ending ID인지 다시 검증한 뒤에만 진행 상태가 저장됩니다.

플레이어가 하지 않은 중대한 선택을 Gemini가 대신 확정하지 않도록 되어 있습니다.

---

## 7. 기본 운명 자체를 수정하고 싶을 때
`src/data/world/fateData.ts`의 `RACE_EXCLUSIVE_FATES` 부분을 수정합니다.

수정 권장 필드:

- `name`
- `description`
- `introSituation`
- `startingRupees`
- `startingItems`
- `chapterTitles`

가급적 바꾸지 말 것:

- `id`
- `allowedRaces`
- `allowedBeastkinTypes`
- 기존 세이브에서 사용 중인 플래그 ID

`id`를 바꾸면 기존 세이브와 운명 진행 기록이 끊길 수 있습니다.

---

## 8. 현재 운명 파일

- `src/data/world/fateData.ts`
  - 기본 전용 운명 40개
  - 기존 운명 9개 구 세이브 호환
  - 지역별 시작 위치
  - 운명장/결말/보상 구조

- `src/data/world/fateUserDefinitions.ts`
  - 사용자 작성 운명 슬롯
  - 성인 테마 슬롯 18개
  - 설인 성인 테마 예약 슬롯 2개 (18+ 게이트)

- `src/data/world/fateSystem.ts`
  - 운명 상태 초기화
  - 구 세이브 마이그레이션
  - 장 진행
  - 선택 기록
  - 결말 처리
  - 영구 기록/플래그 처리
  - Gemini용 현재 운명 요약

- `src/components/FateModal.tsx`
  - 게임 내 운명 기록 UI

