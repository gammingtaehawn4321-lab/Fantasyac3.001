# 판타지악 USER EDIT INDEX

AI Studio 임포트 경량화본에서 사용자가 직접 수정할 위치만 모은 안내서입니다.
내부 ID/키는 바꾸지 말고, 빈 문자열/표시명/숫자/이미지 경로만 수정하세요.
빈 USER_TODO/참조 문자열은 Gemini 프롬프트에 포함되지 않습니다.

## 1. 실제 내용물 5종 표시명·단위·Gemini 설명
`src/data/bodyPayloadUserDefinitions.ts`
- `STANDARD_FLUID`
- `INSECTOID_SECRETION`
- `URINE`
- `EGG`
- `PARASITE`
- 각 종류의 `displayName / amountLabel / unit / geminiReference`

## 2. 컴포넌트 1·2 내용물 삽화 50칸
`src/data/bodyPayloadPresentation.ts`
- 컴포넌트 1: 실제 내용물 5종 × TRACE/LOW/MEDIUM/HIGH/SATURATED = 25
- 컴포넌트 2: 동일 = 25
- 각 슬롯의 `imageSrc`, 필요시 `imageAlt`만 작성
- `slotId`는 수정하지 않음

## 3. 내용물 양 단계별 Gemini 묘사
`src/data/bodyLoadNarrativeDirectives.ts`
- 컴포넌트별/내용물별 TRACE~SATURATED 문자열 작성

## 4. 성인/내부상태 사건 연출
`src/data/adultNarrativeDirectives.ts`
- payload / 방광 / 기존 범용 사건 슬롯

### 4-A. 알·산란·부화 전용 빈 참고칸
`src/data/eggNarrativeReferences.ts`
- 알 추가 / 활성 / 반응 시작·정지 / 성장 / 부화 준비 / 부화
- `INSECTOID_EGG / TENTACLE_EGG` 종류별 참고칸
- `VAGINAL / ANAL` 기원 경로별 참고칸

### 4-B. 독립 기생체 전용 빈 참고칸
`src/data/parasiteNarrativeReferences.ts`
- HATCHLING / JUVENILE / MATURE 관련 참고칸
- INSERTED / INTERNAL 성장형 참고칸
- VAGINAL / ANAL 기원 참고칸
- INSECTOID / TENTACLE 기원 계통 참고칸
- 완전히 자란 기생체가 존재하는 동안의 상시 성인 시스템 참고칸
- 모든 문자열은 공란이면 Gemini에 전달되지 않음

### 4-C. 임신 전용 빈 참고칸
`src/data/pregnancyNarrativeReferences.ts`
- conception / EARLY / MID / LATE / READY
- 단계 전환 / 출산 준비 / 출산 시작 / 출산 완료
- 임신 상태가 지속되는 동안의 단계별 참고칸
- 알/성숙 기생체/고부하와 동시에 존재할 때의 복합 참고칸
- 임신은 산란/부화와 완전히 별개

## 5. 신체/내용물 판정 자연어 규칙
`src/data/bodySystemUserRules.ts`
- compartments
- reflexTriggerRule
- payloadChangeRule
- externalUrineTriggerRule
- pregnancyTriggerRule
- eggSystemRule
- parasiteSystemRule

## 6. 몬스터 내용물 배출량
`src/data/world/monsterPayloadEmission.ts`
- `HUMANOID_PAYLOAD_AMOUNT_BY_SIZE`: 인간형 SMALL/MEDIUM/LARGE의 실제 내용물 5종 기본값
- `ABERRANT_PAYLOAD_AMOUNT_BY_SUBTYPE`: 이형 세부분류의 실제 내용물 5종 기본값
- `MONSTER_PAYLOAD_AMOUNT_BY_MONSTER`: 개별 몬스터의 실제 내용물 5종
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

## 9. 종족별 서사 연출 통합 원본
`src/data/raceNarrativeReferences.ts`
- `RACE_NARRATIVE_PROFILES`: 인간 / 엘프 / 여우·고양이·개·늑대·새 수인 / 설인 / 인어족 / 용족의 상시 서사 연출 원본
- 일반 서사, NPC 반응, 감각·환경 묘사, 프롤로그 분위기, 종족별 사건 성향, 전투 종족 말풍선을 한 파일에서 관리
- 용족 사냥꾼 인카운터 참조도 `DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES`로 이 파일에 통합
- 기존 사용자 작성 3칸은 `DRAGONKIN_USER_TODO_REFERENCES.captureAftermath / captivityLife / blackMarket`에 유지

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


## 17. 운명 사용자 작성 슬롯
`src/data/world/fateUserDefinitions.ts`
- 인간 / 엘프 / 여우·고양이·개·늑대·새 수인 / 인어족 / 용족: 성인 테마 빈 슬롯 각 2개
- 설인: 성인 테마 사용자 운명 슬롯 2개 (18+ 게이트, 현재 종족 구조는 미변경)
- name / description / introSituation / userNarrativeReference
- chapterTitles 5칸 / endingNames 2칸
- completionRewardName / completionRewardDescription
- 완성 후 `enabled=true`
- 공란/disabled 슬롯은 UI와 Gemini에서 제외
- 성인 테마 슬롯은 신체적 나이 18+에서만 노출
- 상세 안내: `FATE_USER_EDIT_GUIDE.md`


## 18. 페로몬 전용 인카운터 6칸
`src/data/encounters/pheromoneEncounterDefinitions.ts`
- `PHEROMONE_INSECTOID_ENCOUNTER_01` ~ `03`
- `PHEROMONE_TENTACLE_ENCOUNTER_01` ~ `03`
- title / summary / location / sceneReference 등을 사용자가 작성
- 완성 후 `enabled=true`
- 비활성 또는 sceneReference 공란이면 절대 자동 선택하지 않음

## 19. 페로몬/잔향 성인 참고 문구
`src/data/pheromoneNarrativeReferences.ts`
- 곤충/촉수 ACTIVE
- RESIDUAL_START / RESIDUAL_LOW / RESIDUAL_END
- DUAL_ACTIVE / DUAL_RESIDUAL
- 전부 공란이면 Gemini에 전달되지 않음

## 20. 월드맵 적대 거점 10종
`src/data/world/hostileSiteDefinitions.ts`
- `INSECT_COLONY_01` ~ `05`
- `TENTACLE_RAID_SITE_01` ~ `05`
- 평원/숲에만 배치 가능
- name / description / encounterIds / monsterIds / entryReference / explorationReference / clearReference
- 완성 후 `enabled=true`
- 비활성/이름 공란은 월드맵에 배치하지 않음

## 21. 적대 거점 전용 몬스터 6종
`src/data/world/hostileSiteMonsterSlots.ts`
- `INSECT_COLONY_MONSTER_01` ~ `03`
- `TENTACLE_RAID_MONSTER_01` ~ `03`
- 이름 / 설명 / 레벨 / 등급 / skills / passiveIds / personality / tags / loot / narrativeReference
- 실제 능력·스킬·패시브·연출은 사용자가 직접 작성
- `enabled=false` 또는 이름 공란이면 전투 풀에 등록되지 않음

## 22. 패배 후 성인 이벤트 25칸
`src/data/encounters/defeatAdultEventDefinitions.ts`
- `DEFEAT_ADULT_GENERIC_01` ~ `05`
- `DEFEAT_ADULT_INSECTOID_01` ~ `05`
- `DEFEAT_ADULT_TENTACLE_01` ~ `05`
- `DEFEAT_ADULT_INSECT_COLONY_01` ~ `05`
- `DEFEAT_ADULT_TENTACLE_RAID_01` ~ `05`
- title / summary / location / sceneReference / outcome 작성
- 필요시 monsterIds / relocationHexId / chainEncounterId / survivalHpRatio 설정
- outcome: SURVIVE / CAPTURED / RELOCATED / CHAIN_ENCOUNTER / GAME_OVER
- 완성 후 `enabled=true`
- 빈/비활성 슬롯은 절대 자동 선택하지 않으며 기존 패배 처리로 폴백

## 이번 경량화에서 제거된 것
- 누적 PATCH_GUIDE 문서
- 검증 결과 txt/json/log
- 과거 카탈로그 md
- CC0 장비 원본 보존용 `public/assets/equipment/cc0/source/` 496파일

게임이 실제 사용하는 CC0 변환본 `public/assets/equipment/cc0/mapped/` 404파일과 지하 장비 삽화 20파일은 유지됩니다.

## 23. 펫 종별 사용자 연출 참조
`src/user_content/petReferences.ts`
- 현재 확정 9종이 각각 독립된 참조 슬롯 세트를 사용함.
- 동물형: 늑대 / 개 / 검치호랑이 / 곰 / 멧돼지
- 곤충형: 챠루스 / 챠루스 리퍼 / 나방 / 음요충
- 각 종마다 욕구 요청 6칸, 수락 3칸, 거부 3칸, 반복 거부 한계 후속 요청 3칸이 욕구 종류별로 따로 존재.
- 각 종마다 `acquisitionEncounterReferences` 2칸이 추가됨. 두 칸이 모두 공란이면 해당 종의 특수 영입 인카운터는 발생 가능한 후보로 취급하지 않음.
- 공란 / `TODO_USER*` / `USER_TODO`는 참조에서 제외.
- 내부 ID/등급 enum은 UI에 직접 노출하지 않음.

## 24. 4.0.2 상점/상인 데이터
`src/data/world/shops/shopCatalog.ts`
- `SHOP_TYPE_PROFILES`: 26종 상점의 재입고 주기, 가격 배율, 매입 범위, 고정/랜덤 재고 규칙
- `MERCHANT_DEFINITIONS`: 실제 상인 정의. 4.0.3 정착지 패치에서 마을/도시별 상인을 이 레지스트리에 추가
- 상점 종류별 `fixedStock / randomStock / acceptedItemCategories / acceptedEquipmentTypes`를 조정하면 됨
- 거래 로직 자체는 `shopEngine.ts`에 있으므로 상점 구성만 바꿀 때 엔진 파일은 수정하지 않는 것을 권장

## 25. 4.0.3 정착지/실제 상인 배치
`src/data/world/settlements/settlementCatalog.ts`
- `SETTLEMENT_DEFINITIONS`: 촌락/마을/도시/대도시, 구역, 시설, 영업시간, 경제/특산 태그
- `SETTLEMENT_MERCHANT_DEFINITIONS`: 각 정착지의 실제 상인 이름/상점 타입/성향/가격 보정
- 월드맵 `structureGroupId`와 `worldStructureGroupId`가 같아야 해당 정착지로 연결됨
- 상점 엔진 자체를 바꾸지 않고 도시별 상점 구성/상인 이름/영업시간을 수정하려면 이 파일을 편집

## 26. 4.0.4 도시 서비스 / 지역 경제
`src/data/world/settlements/settlementEngine.ts`
- 은행 예치금, 길드 가입/보급, 암시장 해금, 경매 입찰, 일자별 시장 지수를 관리
- `getRegionalMarketIndices()`의 6개 시장 부문 지수는 코드 상 경제 태그와 날짜를 기준으로 결정됨

`src/data/world/settlements/settlementBoardQuests.ts`
- 각 정착지 게시판 기본 의뢰 2종(물자 조달 / 주변 순찰)을 생성
- 지역별 물자 종류와 기본 보상을 조정하려면 `REGION_SUPPLIES`를 편집

`src/data/world/settlements/settlementCatalog.ts`
- MARKET / GUILD / BANK / NOTICE_BOARD 시설의 배치와 영업시간을 정착지별로 수정 가능
- MARKET 시설은 `${settlementId.toLowerCase()}:market` 상인회로 자동 연결됨

`src/data/world/shops/shopEngine.ts`
- `ShopPriceContext.marketIndices`를 실제 구매/매입 가격에 반영
- 시장 지수 자체는 settlementEngine에서 계산하므로 경제 변동만 수정할 때 상점 재고 엔진은 건드리지 않는 것을 권장

## 27. 4.0.5 상업 심화 / 정착지 단골
`src/data/world/shops/shopEngine.ts`
- `getMerchantAffinityTier()`: 친밀도 단계 기준
- `attemptMerchantHaggle()`: 하루 1회 흥정 성공률/할인폭
- 친밀도 40/80 재입고 보너스 슬롯
- SPECIALTY / COLLECTOR 추가 가격 우대

`src/data/world/settlements/settlementEngine.ts`
- `getSettlementFamiliarity()`: 방문일 3/7/15회 친숙도 단계
- `getSettlementPriceContext()`: 친숙도 + 길드 등급 상권 우대
- `getRegionalMarketTrend()`: 전일 대비 시장지수 변화
- `getInnStayQuote()`: 숙박 단골 할인 및 실제 숙박 가격
