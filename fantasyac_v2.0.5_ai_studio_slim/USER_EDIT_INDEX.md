# 판타지악 USER EDIT INDEX

AI Studio 임포트 경량화본에서 사용자가 직접 수정할 위치만 모은 안내서입니다.
내부 ID/키는 바꾸지 말고, 빈 문자열/표시명/숫자/이미지 경로만 수정하세요.
빈 USER_TODO/참조 문자열은 Gemini 프롬프트에 포함되지 않습니다.

## 1. 내용물 A/B/C 실제 표시명·단위·Gemini 설명
`src/data/bodyPayloadUserDefinitions.ts`
- `BODY_PAYLOAD_CHANNEL_USER_DEFINITIONS.A/B/C.displayName`
- `.amountLabel`
- `.unit`
- `.geminiReference`

## 2. 컴포넌트 1·2 내용물 삽화 30칸
`src/data/bodyPayloadPresentation.ts`
- 컴포넌트 1: A/B/C × TRACE/LOW/MEDIUM/HIGH/SATURATED = 15
- 컴포넌트 2: 동일 = 15
- 각 슬롯의 `imageSrc`, 필요시 `imageAlt`만 작성
- `slotId`는 수정하지 않음

## 3. 내용물 양 단계별 Gemini 묘사
`src/data/bodyLoadNarrativeDirectives.ts`
- 컴포넌트별/내용물별 TRACE~SATURATED 문자열 작성

## 4. 성인/내부상태 사건 연출
`src/data/adultNarrativeDirectives.ts`
특히 빈칸:
- payloadAdded / payloadReduced / payloadCleared / payloadHigh
- bladderUrgeHigh / bladderFull / bladderVoided / bladderReflexRelease
- pregnancyStarted / pregnancyStageChanged / pregnancyReady
- parasiteInsertedApplied / parasiteInsertedProgress / parasiteInsertedMatured
- parasiteInternalApplied / parasiteInternalMigrated / parasiteInternalProgress / parasiteInternalMatured
- custom

## 5. 신체/내용물 판정 자연어 규칙
`src/data/bodySystemUserRules.ts`
- compartments
- reflexTriggerRule
- payloadChangeRule
- externalUrineTriggerRule
- pregnancyTriggerRule

## 6. 몬스터 내용물 배출량
`src/data/world/monsterPayloadEmission.ts`
- `HUMANOID_PAYLOAD_AMOUNT_BY_SIZE`: 인간형 SMALL/MEDIUM/LARGE 기본값
- `ABERRANT_PAYLOAD_AMOUNT_BY_SUBTYPE`: 이형 세부분류 A/B/C 기본값
- `MONSTER_PAYLOAD_AMOUNT_BY_MONSTER`: 개별 몬스터 A/B/C
  - `'basic'` = 개별값 무시, 상위 분류 자동 상속
  - 숫자 = 해당 몬스터 개별 override

## 7. 몬스터 성인 장면 참조
`src/data/world/monsterAdultSceneReferences.ts`
- 대분류 → 세부분류 → 개별 몬스터 순으로 작성 가능
- 우선순위: 개별 몬스터 > 세부분류 > 대분류
- 공란은 상위 참조로 폴백

## 8. 가슴/엉덩이 체형 Gemini 참조
`src/data/bodyShapeUserReferences.ts`
- `BREAST_SIZE_GEMINI_REFERENCES`: SMALL / SLENDER / LARGE
- `HIP_SIZE_GEMINI_REFERENCES`: SLIM / AVERAGE / FULL
- 표시명 변경은 `BREAST_SIZE_LABELS`, `HIP_SIZE_LABELS`
- 참조문구는 공란이면 Gemini에 전달 안 됨

## 9. 용족 사용자 서사
`src/data/dragonkin/dragonkinNarrativeReferences.ts`
- `DRAGONKIN_USER_TODO_REFERENCES.captureAftermath`
- `.captivityLife`
- `.blackMarket`

## 10. 전투 말풍선 사용자 영역
`src/data/combatSpeechReferences.ts`
- `FEMALE_HIGH_DESIRE_REFERENCES`
- `DANCER_ADULT_VARIANT_REFERENCES`
- 무희 세트 4종 references

## 11. 변기 전직 사용자 작성 영역
`src/data/classes/index.ts`
- `evo_toilet`의 description / weaponSpecialization / 표시 관련 문자열
`src/data/skills/index.ts`
- `toilet_support_focus`
- `toilet_support_overdrive`
- `toilet_total_support`
각 스킬의 name / description만 작성. id/effectId/수치는 가급적 수정하지 않음.

## 12. 성인 던전 함정 5칸
`src/data/dungeons/dungeonTrapReferences.ts`
- `ADULT_DUNGEON_TRAP_SLOTS`
- name / sceneReference / rewardReference / effectReference

## 13. 자유 인카운터 5칸
`src/data/encounters/encounterDatabase.ts`
- `user_encounter_slot_01` ~ `05`
- title / summary / location / sceneReference / rewards
- 완성 후 enabled=true

## 14. 동료 욕구 사용자 참조 — 현재 보류 가능
`src/data/companions/companionNeedReferences.ts`
- 각 단계 `customReference`

## 15. 성인 전역 문체
`src/data/adultNarrativeStyle.ts`
- mood / detailLevel / vocabulary / phraseStyle / focus

## 16. 6지역 세계관
`src/data/world/regions/`
- grandia.ts / seire.ts / forezin.ts / santimac.ts / prosti.ts / scroze.ts
- summary / lore / geography / climate / majorPeoples / settlements / factions / conflicts / raceRelations / editableNotes 등

## 이번 경량화에서 제거된 것
- 누적 PATCH_GUIDE 문서
- 검증 결과 txt/json/log
- 과거 카탈로그 md
- CC0 장비 원본 보존용 `public/assets/equipment/cc0/source/` 496파일

게임이 실제 사용하는 CC0 변환본 `public/assets/equipment/cc0/mapped/` 404파일과 지하 장비 삽화 20파일은 유지됩니다.
