import {
  PlayerState,
  GameCondition,
  GameEvent,
  GameEventType,
  GameEventPayload,
  QuestProgress,
  QuestObjective,
  QuestDefinition,
  QuestRewards,
  MajorCharacter,
  EncounterState,
  ScheduledEncounter,
  LockDefinition,
  ItemDefinition,
} from './types';
import { getItemDefinition } from './data/items';
import { getLockDefinition } from './data/locks/lockDatabase';
import { getMajorCharacter, INITIAL_MAJOR_CHARACTERS } from './data/characters/majorCharacters';
import { getEncounterDefinition, ENCOUNTER_DATABASE } from './data/encounters/encounterDatabase';
import { getQuestDefinition, QUEST_DATABASE } from './data/quests/questDatabase';
import { PROFESSIONS_DATABASE } from './data/professions/professionData';

// ============================================================
// 1. 이벤트 리스너 및 훅 시스템 (Event Bus)
// ============================================================
export type GameEventListener = (
  event: GameEvent,
  state: PlayerState,
  nextState: PlayerState
) => void;

const eventListeners: Map<GameEventType | '*', Set<GameEventListener>> = new Map();

/**
 * 게임 이벤트 구독 등록
 */
export function subscribeGameEvent(
  eventType: GameEventType | '*',
  listener: GameEventListener
): () => void {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }
  eventListeners.get(eventType)!.add(listener);

  return () => {
    eventListeners.get(eventType)?.delete(listener);
  };
}

// ============================================================
// 2. 공통 GameCondition 평가 엔진 (AND, OR, NOT 지원)
// ============================================================
export function evaluateGameCondition(state: PlayerState, condition?: GameCondition): boolean {
  if (!condition) return true;

  // 1. 논리 조합: NOT
  if (condition.NOT) {
    if (evaluateGameCondition(state, condition.NOT)) return false;
  }

  // 2. 논리 조합: OR
  if (condition.OR && condition.OR.length > 0) {
    const orPassed = condition.OR.some((c) => evaluateGameCondition(state, c));
    if (!orPassed) return false;
  }

  // 3. 논리 조합: AND
  if (condition.AND && condition.AND.length > 0) {
    const andPassed = condition.AND.every((c) => evaluateGameCondition(state, c));
    if (!andPassed) return false;
  }

  // 4. 레벨 검사
  if (condition.minLevel !== undefined && state.level < condition.minLevel) return false;
  if (condition.maxLevel !== undefined && state.level > condition.maxLevel) return false;

  // 5. 스탯 검사
  if (condition.stats) {
    for (const [statKey, minVal] of Object.entries(condition.stats)) {
      const val = state.stats[statKey as keyof typeof state.stats] ?? 5;
      if (val < (minVal || 0)) return false;
    }
  }

  // 6. 아이템 보유 검사
  if (condition.itemsPossessed) {
    for (const req of condition.itemsPossessed) {
      let count = 0;
      if (req.itemId) {
        const found = state.inventory.find((i) => {
          const def = getItemDefinition(i.id || i.name);
          return (i.id && i.id === req.itemId) || (def && def.id === req.itemId);
        });
        count = found ? found.quantity : 0;
      } else if (req.itemName) {
        const found = state.inventory.find((i) => i.name.includes(req.itemName!));
        count = found ? found.quantity : 0;
      }
      if (count < req.count) return false;
    }
  }

  // 7. 잠금 해제 여부
  if (condition.locksUnlocked) {
    for (const lockId of condition.locksUnlocked) {
      if (!state.unlockedLocks?.includes(lockId)) return false;
    }
  }

  // 8. 퀘스트 상태 검사
  if (condition.questsCompleted) {
    for (const qId of condition.questsCompleted) {
      if (state.quests?.[qId]?.status !== 'COMPLETED') return false;
    }
  }
  if (condition.questsActive) {
    for (const qId of condition.questsActive) {
      if (state.quests?.[qId]?.status !== 'ACTIVE') return false;
    }
  }
  if (condition.questStageMin) {
    const q = state.quests?.[condition.questStageMin.questId];
    if (!q || q.currentStageId < condition.questStageMin.stageId) return false;
  }

  // 9. 인카운터 해결 검사
  if (condition.encountersResolved) {
    for (const encId of condition.encountersResolved) {
      if (state.encounters?.[encId]?.status !== 'RESOLVED') return false;
    }
  }

  // 10. 주요 인물 상태 검사
  if (condition.majorCharacterStatus) {
    for (const req of condition.majorCharacterStatus) {
      const char = state.majorCharacters?.[req.characterId] || INITIAL_MAJOR_CHARACTERS[req.characterId];
      if (!char) return false;
      if (req.isAlive !== undefined && char.isAlive !== req.isAlive) return false;
      if (req.minRelationship !== undefined && char.relationship < req.minRelationship) return false;
      if (req.minTrust !== undefined && char.trust < req.minTrust) return false;
      if (req.isRecruited !== undefined && char.isRecruited !== req.isRecruited) return false;
      if (req.requiredFlags) {
        for (const flag of req.requiredFlags) {
          if (!char.memoryFlags?.[flag]) return false;
        }
      }
    }
  }

  // 11. 동료 요구 조건 검사
  if (condition.companionRequired) {
    const { companionId, minBondLevel, minTrust, inActiveParty } = condition.companionRequired;
    const comps = state.companions || [];
    const matched = companionId ? comps.find((c) => c.id === companionId) : comps[0];
    if (!matched) return false;
    const bondLevel = matched.bond?.bondLevel ?? matched.bondLevel ?? 1;
    const trust = matched.bond?.trust ?? matched.trust ?? 0;
    if (minBondLevel !== undefined && bondLevel < minBondLevel) return false;
    if (minTrust !== undefined && trust < minTrust) return false;
    if (inActiveParty && !matched.isActivePartyMember) return false;
  }

  // 12. 시간대 및 일차
  if (condition.timeOfDay && condition.timeOfDay.length > 0) {
    if (!state.timeOfDay || !condition.timeOfDay.includes(state.timeOfDay)) return false;
  }
  if (condition.minDayCount !== undefined && (state.dayCount || 1) < condition.minDayCount) return false;

  // 13. 직업 및 승급
  if (condition.combatClass && condition.combatClass.length > 0) {
    if (!state.combatClass || !condition.combatClass.includes(state.combatClass)) return false;
  }
  if (condition.classEvolutionTier !== undefined && (state.classEvolutionTier || 1) < condition.classEvolutionTier) {
    return false;
  }

  // 14. 캠프 시설
  if (condition.facilityBuilt) {
    for (const fac of condition.facilityBuilt) {
      const built = state.campProgress?.facilities?.find((f) => f.facilityId === fac.facilityId);
      if (!built || !built.isBuilt) return false;
      if (fac.minLevel !== undefined && built.level < fac.minLevel) return false;
    }
  }

  // 15. 생활 직업 레벨
  if (condition.professionLevel) {
    for (const profReq of condition.professionLevel) {
      const prof = state.professions?.find((p) => p.professionId === profReq.professionId);
      if (!prof || prof.level < profReq.minLevel) return false;
    }
  }

  return true;
}

// ============================================================
// 3. 중앙 GameEvent 디스패처
// 순서: 게임 엔진 상태 변경 → dispatchGameEvent 발생
// ============================================================
export function dispatchGameEvent(
  state: PlayerState,
  type: GameEventType,
  payload: GameEventPayload
): { nextState: PlayerState; messages: string[] } {
  const event: GameEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type,
    payload: payload || {},
    timestamp: Date.now(),
  };

  let nextState = { ...state };
  const messages: string[] = [];

  // 1. 퀘스트 반응 처리
  const questResult = handleQuestEvent(nextState, event);
  nextState = questResult.nextState;
  messages.push(...questResult.messages);

  // 2. 인카운터 반응 처리
  const encounterResult = handleEncounterEvent(nextState, event);
  nextState = encounterResult.nextState;
  messages.push(...encounterResult.messages);

  // 3. 주요 인물 기억 및 상호작용 기록
  const characterResult = handleMajorCharacterEvent(nextState, event);
  nextState = characterResult.nextState;
  messages.push(...characterResult.messages);

  // 4. 이벤트 버스 리스너 실행
  try {
    const directListeners = eventListeners.get(type);
    if (directListeners) {
      directListeners.forEach((fn) => fn(event, state, nextState));
    }
    const wildcardListeners = eventListeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((fn) => fn(event, state, nextState));
    }
  } catch (e) {
    console.error('GameEvent listener execution error:', e);
  }

  return { nextState, messages };
}

// ============================================================
// 4. 상태 기반 퀘스트 목표 평가 헬퍼
// ============================================================
/**
 * 상태 기반 목표(POSSESS_ITEM, PROFESSION_LEVEL, COMPANION_BOND, CAMP_FACILITY)의
 * 현재 수치를 PlayerState에서 직접 계산합니다.
 */
export function evaluateStateBasedObjective(
  state: PlayerState,
  obj: QuestObjective
): number | null {
  switch (obj.type) {
    case 'POSSESS_ITEM': {
      let count = 0;
      for (const item of state.inventory || []) {
        const itemDef = getItemDefinition(item.id || item.name);
        const matchesId = obj.targetId && (item.id === obj.targetId || itemDef?.id === obj.targetId);
        const matchesName = obj.targetName && item.name.includes(obj.targetName);
        if (matchesId || matchesName) {
          count += item.quantity || 1;
        }
      }
      return count;
    }

    case 'PROFESSION_LEVEL': {
      const prof = state.professions?.find(
        (p) => !obj.targetId || p.professionId === obj.targetId
      );
      return prof ? prof.level : 0;
    }

    case 'CAMP_FACILITY': {
      const fac = state.campProgress?.facilities?.find(
        (f) => f.facilityId === obj.targetId
      );
      return fac && fac.isBuilt ? fac.level : 0;
    }

    case 'COMPANION_BOND': {
      const char = state.majorCharacters?.[obj.targetId || ''];
      if (char) {
        return char.trust ?? char.relationship ?? 0;
      }
      const companion = state.companions?.find((c) => c.id === obj.targetId);
      if (companion) {
        return companion.bondLevel || 0;
      }
      return 0;
    }

    default:
      return null;
  }
}

// ============================================================
// 5. 퀘스트 이벤트 핸들러 및 보상 지급
// ============================================================
function handleQuestEvent(
  state: PlayerState,
  event: GameEvent
): { nextState: PlayerState; messages: string[] } {
  let nextState = { ...state };
  const messages: string[] = [];
  const quests = { ...(nextState.quests || {}) };
  let hasChanges = false;

  // 1. 활성 퀘스트 진행도 갱신
  for (const [questId, progress] of Object.entries(quests)) {
    if (progress.status !== 'ACTIVE') continue;
    const def = getQuestDefinition(questId);
    if (!def) continue;

    let stageLoop = true;
    let stageIterations = 0;

    while (stageLoop && stageIterations < 10) {
      stageLoop = false;
      stageIterations++;

      const currentStage = def.stages.find((s) => s.stageId === progress.currentStageId);
      if (!currentStage) break;

      let stageProgressChanged = false;
      const updatedObjectives = { ...(progress.objectives || {}) };

      for (const obj of currentStage.objectives) {
        const objState = { ...(updatedObjectives[obj.id] || { currentCount: 0, isCompleted: false }) };
        if (objState.isCompleted) {
          updatedObjectives[obj.id] = objState;
          continue;
        }

        let delta = 0;
        let directCount: number | null = evaluateStateBasedObjective(nextState, obj);

        switch (obj.type) {
          case 'GAIN_ITEM':
            if (event.type === 'ITEM_GAINED') {
              const matchesId = obj.targetId && (event.payload.itemId === obj.targetId || event.payload.itemName === obj.targetId);
              const matchesName = obj.targetName && event.payload.itemName?.includes(obj.targetName);
              if (matchesId || matchesName) {
                delta = event.payload.quantity || 1;
              }
            }
            break;

          case 'POSSESS_ITEM':
            // evaluateStateBasedObjective 에서 directCount가 이미 인벤토리 기반으로 계산됨
            break;

          case 'USE_ITEM':
            if (event.type === 'ITEM_USED') {
              if (
                (obj.targetId && event.payload.itemId === obj.targetId) ||
                (obj.targetName && event.payload.itemName?.includes(obj.targetName))
              ) {
                delta = event.payload.quantity || 1;
              }
            }
            break;

          case 'READ_BOOK':
            if (event.type === 'ITEM_READ') {
              if (
                (obj.targetId && event.payload.itemId === obj.targetId) ||
                (obj.targetName && event.payload.itemName?.includes(obj.targetName))
              ) {
                delta = 1;
              }
            }
            break;

          case 'CRAFT_ITEM':
          case 'CRAFT_QUALITY_ITEM':
            if (event.type === 'ITEM_CRAFTED') {
              if (
                !obj.targetId ||
                obj.targetId === event.payload.itemId ||
                (obj.targetName && event.payload.itemName?.includes(obj.targetName))
              ) {
                delta = event.payload.quantity || 1;
              }
            }
            break;

          case 'DEFEAT_ENEMY':
            if (event.type === 'ENEMY_DEFEATED') {
              if (
                !obj.targetId ||
                obj.targetId === event.payload.enemyId ||
                (obj.targetName && event.payload.enemyName?.includes(obj.targetName))
              ) {
                delta = 1;
              }
            }
            break;

          case 'WIN_BATTLE':
            if (event.type === 'BATTLE_WON') {
              delta = 1;
            }
            break;

          case 'TALK_NPC':
            if (event.type === 'CHARACTER_TALKED' || event.type === 'CHARACTER_MET') {
              const matchesId =
                obj.targetId &&
                (event.payload.characterId === obj.targetId || event.payload.characterName === obj.targetId);
              const matchesName =
                obj.targetName &&
                (event.payload.characterName?.includes(obj.targetName) || event.payload.characterId === obj.targetName);
              if (!obj.targetId && !obj.targetName) {
                delta = 1;
              } else if (matchesId || matchesName) {
                delta = 1;
              }
            }
            break;

          case 'UNLOCK_LOCK':
            if (event.type === 'LOCK_UNLOCKED') {
              if (obj.targetId && event.payload.lockId === obj.targetId) {
                delta = 1;
              }
            }
            break;

          case 'VISIT_LOCATION':
            if (event.type === 'LOCATION_ENTERED') {
              const matchesId =
                obj.targetId &&
                (event.payload.location === obj.targetId ||
                  event.payload.locationId === obj.targetId ||
                  event.payload.locationName === obj.targetId);
              const matchesName =
                obj.targetName &&
                (event.payload.location?.includes(obj.targetName) ||
                  event.payload.locationName?.includes(obj.targetName));
              if (!obj.targetId && !obj.targetName) {
                delta = 1;
              } else if (matchesId || matchesName) {
                delta = 1;
              }
            }
            break;

          case 'PROFESSION_LEVEL':
            if (event.type === 'PROFESSION_LEVEL_UP') {
              if (!obj.targetId || event.payload.professionId === obj.targetId) {
                directCount = event.payload.newLevel || 1;
              }
            }
            break;

          case 'CAMP_FACILITY':
            if (event.type === 'CAMP_FACILITY_BUILT' || event.type === 'CAMP_FACILITY_UPGRADED') {
              const fac = nextState.campProgress?.facilities?.find((f) => f.facilityId === obj.targetId);
              directCount = fac && fac.isBuilt ? fac.level : 0;
            }
            break;

          case 'RECRUIT_COMPANION':
            if (event.type === 'CHARACTER_RECRUITED') {
              if (!obj.targetId || event.payload.companionId === obj.targetId || event.payload.characterId === obj.targetId) {
                delta = 1;
              }
            }
            break;

          case 'COMPANION_BOND':
            if (event.type === 'COMPANION_BOND_CHANGED') {
              const char = nextState.majorCharacters?.[obj.targetId || ''];
              directCount = char ? char.trust : event.payload.trustDelta || 0;
            }
            break;

          case 'ENCOUNTER_RESULT':
            if (event.type === 'ENCOUNTER_RESOLVED') {
              const matchesId = !obj.targetId || event.payload.encounterId === obj.targetId;
              const matchesOutcome =
                !obj.targetName ||
                event.payload.encounterOutcome === obj.targetName ||
                event.payload.outcome === obj.targetName;
              if (matchesId && matchesOutcome) {
                delta = 1;
              }
            }
            break;

          case 'STAT_CHECK':
            if (event.type === 'STAT_CHECK_RESOLVED' || (event.type as string) === 'STAT_CHECK_PASSED' || (event.type as string) === 'STAT_CHECK') {
              const matchesStat =
                !obj.targetId || event.payload.stat === obj.targetId || event.payload.statType === obj.targetId;
              const matchesOutcome =
                !obj.targetName ||
                event.payload.statCheckOutcome === obj.targetName ||
                event.payload.checkOutcome === obj.targetName;
              if (matchesStat && matchesOutcome) {
                delta = 1;
              }
            }
            break;

          case 'EQUIP_ITEM':
            if (event.type === 'ITEM_EQUIPPED') {
              const matchesId =
                obj.targetId &&
                (event.payload.itemId === obj.targetId || event.payload.equipmentId === obj.targetId);
              const matchesName = obj.targetName && event.payload.itemName?.includes(obj.targetName);
              if (!obj.targetId && !obj.targetName) {
                delta = 1;
              } else if (matchesId || matchesName) {
                delta = 1;
              }
            }
            break;

          case 'CAMP_SLEEP':
            if (
              (event.type as string) === 'CAMP_RESTED' ||
              (event.type as string) === 'RESTED' ||
              (event.type as string) === 'CAMP_SLEEP' ||
              event.payload.isRest ||
              event.payload.customData?.rested
            ) {
              delta = 1;
            }
            break;

          case 'WAYSTATION_TRAVEL':
            if (event.type === 'WAYSTATION_USED') {
              if (!obj.targetId || event.payload.waystationDestinationId === obj.targetId || event.payload.waystationId === obj.targetId) delta = 1;
            }
            break;

          case 'BUILD_AIRSHIP':
            if (event.type === 'AIRSHIP_BUILT') delta = 1;
            break;

          case 'UPGRADE_AIRSHIP':
            if (event.type === 'AIRSHIP_UPGRADED') directCount = event.payload.airshipLevel || nextState.airship?.level || 0;
            break;

          case 'AIRSHIP_TRAVEL':
            if (event.type === 'AIRSHIP_TRAVELED') delta = 1;
            break;

          case 'GATHER_RESOURCE':
            if (event.type === 'RESOURCE_GATHERED') {
              const matches = !obj.targetId || event.payload.gatheredMaterialId === obj.targetId || event.payload.gatheredMaterialName === obj.targetName;
              if (matches) delta = event.payload.quantity || 1;
            }
            break;
        }

        const prevCount = objState.currentCount || 0;
        let newCount = prevCount;

        if (directCount !== null) {
          newCount = directCount;
        } else if (delta > 0) {
          newCount = prevCount + delta;
        }

        if (newCount !== prevCount) {
          objState.currentCount = newCount;
          stageProgressChanged = true;
        }

        if (objState.currentCount >= obj.requiredCount && !objState.isCompleted) {
          objState.isCompleted = true;
          stageProgressChanged = true;
          messages.push(`📜 [퀘스트 목표 달성] ${def.title} - ${obj.description}`);
        }

        updatedObjectives[obj.id] = objState;
      }

      if (stageProgressChanged) {
        hasChanges = true;
        progress.objectives = updatedObjectives;

        // 현재 단계의 모든 필수 목표가 완료되었는지 검사
        const allRequiredCompleted = currentStage.objectives
          .filter((o) => !o.optional)
          .every((o) => updatedObjectives[o.id]?.isCompleted);

        if (allRequiredCompleted) {
          if (currentStage.nextStageId) {
            progress.currentStageId = currentStage.nextStageId;
            const nextStageDef = def.stages.find((s) => s.stageId === currentStage.nextStageId);
            messages.push(`✨ [퀘스트 단계 완료] ${def.title} -> 다음 단계: ${nextStageDef?.title || '진행'}`);
            // 새 단계의 상태 기반 목표도 즉시 재검사하기 위해 반복
            stageLoop = true;
          } else {
            // 퀘스트 최종 완료!
            progress.status = 'COMPLETED';
            progress.completedAt = Date.now();
            messages.push(`🏆 [퀘스트 완료] ${def.title}! 보상을 획득했습니다.`);

            // 보상 지급 실행
            const rewardedState = grantQuestRewards(nextState, def.rewards);
            nextState = rewardedState.state;
            messages.push(...rewardedState.messages);
          }
        }
      }
    }
  }

  // 2. 인물 대화/조우 시 퀘스트 제안 (customQuestIds 및 giverNpcId)
  if (event.type === 'CHARACTER_TALKED' || event.type === 'CHARACTER_MET') {
    const charId = event.payload.characterId;
    const charName = event.payload.characterName;
    const majorChar = charId
      ? (nextState.majorCharacters?.[charId] || INITIAL_MAJOR_CHARACTERS[charId])
      : undefined;

    const candidateQuestIds = new Set<string>();

    // 인물의 customQuestIds 추가
    if (majorChar?.customQuestIds) {
      majorChar.customQuestIds.forEach((qId) => candidateQuestIds.add(qId));
    }

    // QUEST_DATABASE에서 giverNpcId / giverName 매칭 퀘스트 추가
    Object.values(QUEST_DATABASE).forEach((def) => {
      const matchesGiverId =
        charId &&
        (def.giverNpcId === charId || (majorChar && def.giverNpcId === majorChar.id));
      const matchesGiverName =
        (charName && def.giverName && def.giverName.includes(charName)) ||
        (majorChar?.name && def.giverName && def.giverName.includes(majorChar.name));

      if (matchesGiverId || matchesGiverName) {
        candidateQuestIds.add(def.id);
      }
    });

    candidateQuestIds.forEach((qId) => {
      const def = QUEST_DATABASE[qId];
      if (!def) return;

      const existingQuest = quests[qId];
      // 이미 진행/완료/실패/제안된 퀘스트는 중복 제안 방지
      if (
        existingQuest &&
        (existingQuest.status === 'COMPLETED' ||
          existingQuest.status === 'FAILED' ||
          existingQuest.status === 'ACTIVE' ||
          existingQuest.status === 'OFFERED')
      ) {
        return;
      }

      // 거절한 퀘스트 목록에 있으면 즉시 재제안 방지
      if (nextState.declinedQuestIds?.includes(qId)) {
        return;
      }

      // 숨겨진 퀘스트인 경우 시작 조건 검사
      if (def.isHidden && !evaluateGameCondition(nextState, def.startConditions)) {
        return;
      }

      // 시작 조건 만족 여부 확인
      if (evaluateGameCondition(nextState, def.startConditions)) {
        if (def.autoStart) {
          const initialStageId = def.stages[0]?.stageId || 1;
          const newProgress: QuestProgress = {
            questId: def.id,
            status: 'ACTIVE',
            currentStageId: initialStageId,
            objectives: {},
            startedAt: Date.now(),
          };
          quests[def.id] = newProgress;
          hasChanges = true;
          messages.push(`🌟 [새로운 퀘스트 시작] ${def.title}: ${def.summary || def.description}`);
        } else {
          quests[def.id] = {
            questId: def.id,
            status: 'OFFERED',
            currentStageId: def.stages[0]?.stageId || 1,
            objectives: {},
          };
          hasChanges = true;
          const giverDisplay = def.giverName || majorChar?.name || charName || '주요 인물';
          messages.push(`📜 [퀘스트 의뢰] ${giverDisplay}이(가) [${def.title}] 의뢰를 제안했습니다. (퀘스트 일지에서 수락 가능)`);
        }
      }
    });
  }

  // 3. 자동 시작(autoStart) 퀘스트 확인 (조건 만족 시 자동 ACTIVE)
  Object.values(QUEST_DATABASE).forEach((def) => {
    if (def.autoStart && (!quests[def.id] || quests[def.id].status === 'AVAILABLE')) {
      if (!nextState.declinedQuestIds?.includes(def.id) && evaluateGameCondition(nextState, def.startConditions)) {
        const initialStageId = def.stages[0]?.stageId || 1;
        const newProgress: QuestProgress = {
          questId: def.id,
          status: 'ACTIVE',
          currentStageId: initialStageId,
          objectives: {},
          startedAt: Date.now(),
        };

        // 첫 Stage의 상태 기반 목표 즉시 한 번 재평가
        const firstStage = def.stages.find((s) => s.stageId === initialStageId);
        if (firstStage) {
          for (const obj of firstStage.objectives) {
            const stateCount = evaluateStateBasedObjective(nextState, obj);
            if (stateCount !== null) {
              const isComp = stateCount >= obj.requiredCount;
              newProgress.objectives[obj.id] = {
                currentCount: stateCount,
                isCompleted: isComp,
              };
              if (isComp) {
                messages.push(`📜 [퀘스트 목표 달성] ${def.title} - ${obj.description}`);
              }
            }
          }

          // 시작 시 모든 필수 목표가 완료된 경우 단계 전진 또는 완료 처리
          const allRequiredCompleted = firstStage.objectives
            .filter((o) => !o.optional)
            .every((o) => newProgress.objectives[o.id]?.isCompleted);

          if (allRequiredCompleted) {
            if (firstStage.nextStageId) {
              newProgress.currentStageId = firstStage.nextStageId;
              const nextStageDef = def.stages.find((s) => s.stageId === firstStage.nextStageId);
              messages.push(`✨ [퀘스트 단계 완료] ${def.title} -> 다음 단계: ${nextStageDef?.title || '진행'}`);
            } else {
              newProgress.status = 'COMPLETED';
              newProgress.completedAt = Date.now();
              messages.push(`🏆 [퀘스트 완료] ${def.title}! 보상을 획득했습니다.`);
              const rewardedState = grantQuestRewards(nextState, def.rewards);
              nextState = rewardedState.state;
              messages.push(...rewardedState.messages);
            }
          }
        }

        quests[def.id] = newProgress;
        hasChanges = true;
        messages.push(`🌟 [새로운 퀘스트 시작] ${def.title}: ${def.summary}`);
      }
    }
  });

  if (hasChanges) {
    nextState.quests = quests;
  }

  return { nextState, messages };
}

/**
 * 퀘스트 보상 정밀 지급 헬퍼
 */
export function grantQuestRewards(
  state: PlayerState,
  rewards: QuestRewards
): { state: PlayerState; messages: string[] } {
  let nextState = { ...state };
  const messages: string[] = [];

  // EXP & 루피
  if (rewards.exp) {
    nextState.experience = (nextState.experience || 0) + rewards.exp;
    messages.push(`• 경험치 +${rewards.exp}`);
  }
  if (rewards.rupees) {
    nextState.rupees = (nextState.rupees || 0) + rewards.rupees;
    messages.push(`• 루피 +${rewards.rupees}`);
  }

  // 포인트
  if (rewards.talentPoints) {
    nextState.talentPoints = (nextState.talentPoints || 0) + rewards.talentPoints;
    messages.push(`• 특성 포인트 +${rewards.talentPoints}`);
  }
  if (rewards.statPoints) {
    nextState.statPoints = (nextState.statPoints || 0) + rewards.statPoints;
    messages.push(`• 스탯 포인트 +${rewards.statPoints}`);
  }

  // 아이템 지급
  if (rewards.items && rewards.items.length > 0) {
    const inv = [...nextState.inventory];
    for (const rewardItem of rewards.items) {
      const def = getItemDefinition(rewardItem.itemId || rewardItem.name);
      const existing = inv.find((i) => (def && i.id === def.id) || i.name === rewardItem.name);
      if (existing) {
        existing.quantity += rewardItem.quantity;
      } else {
        inv.push({
          id: def ? def.id : rewardItem.itemId,
          name: rewardItem.name,
          quantity: rewardItem.quantity,
          category: def ? def.category : 'MISC',
          description: def ? def.description : '퀘스트 보상으로 획득한 물품',
          quality: rewardItem.quality || 'NORMAL',
        });
      }
      messages.push(`• ${rewardItem.name} x${rewardItem.quantity} 획득`);
    }
    nextState.inventory = inv;
  }

  // 주요 인물 관계도 상승
  if (rewards.characterRelationship) {
    const { characterId, delta } = rewards.characterRelationship;
    const majorChars = { ...(nextState.majorCharacters || INITIAL_MAJOR_CHARACTERS) };
    if (majorChars[characterId]) {
      majorChars[characterId] = {
        ...majorChars[characterId],
        relationship: Math.min(100, Math.max(-100, majorChars[characterId].relationship + delta)),
        trust: Math.min(100, majorChars[characterId].trust + Math.round(delta * 0.8)),
      };
      nextState.majorCharacters = majorChars;
      messages.push(`• ${majorChars[characterId].name}의 호감도/신뢰도 상승 (+${delta})`);
    }
  }

  // 후속 퀘스트 활성화
  if (rewards.followUpQuestIds) {
    const quests = { ...(nextState.quests || {}) };
    for (const fId of rewards.followUpQuestIds) {
      const fDef = getQuestDefinition(fId);
      if (fDef && (!quests[fId] || quests[fId].status === 'LOCKED')) {
        quests[fId] = {
          questId: fId,
          status: 'OFFERED',
          currentStageId: fDef.stages[0]?.stageId || 1,
          objectives: {},
        };
        messages.push(`📜 새로운 연계 퀘스트 [${fDef.title}] 의뢰가 도착했습니다.`);
      }
    }
    nextState.quests = quests;
  }

  return { state: nextState, messages };
}

// ============================================================
// 5. 지속형 인카운터 및 연쇄 예약 핸들러
// ============================================================
function handleEncounterEvent(
  state: PlayerState,
  event: GameEvent
): { nextState: PlayerState; messages: string[] } {
  let nextState = { ...state };
  const messages: string[] = [];

  if (event.type === 'ENCOUNTER_STARTED') {
    const encId = event.payload.encounterId;
    const def = getEncounterDefinition(encId);
    if (encId && def) {
      const encounters = { ...(nextState.encounters || {}) };
      encounters[encId] = {
        ...(encounters[encId] || {}),
        status: 'ACTIVE',
        currentStep: encounters[encId]?.currentStep || 1,
      };
      nextState = { ...nextState, encounters, activeEncounterId: encId };
    }
  }

  if (event.type === 'ENCOUNTER_RESOLVED') {
    const encId = event.payload.encounterId;
    if (encId) {
      const def = getEncounterDefinition(encId);
      const encounters = { ...(nextState.encounters || {}) };
      encounters[encId] = {
        status: 'RESOLVED',
        outcome: event.payload.encounterOutcome || 'RESOLVED',
        resolvedAt: Date.now(),
      };
      nextState = { ...nextState, encounters, activeEncounterId: nextState.activeEncounterId === encId ? null : nextState.activeEncounterId };

      // 인카운터 자체 보상: 사용자 작성 슬롯도 rewards를 채우면 자동 지급된다.
      if (def?.rewards && Object.keys(def.rewards).length > 0) {
        const rewarded = grantQuestRewards(nextState, def.rewards);
        nextState = rewarded.state;
        if (rewarded.messages.length > 0) {
          messages.push(`🎁 [인카운터 보상] ${def.title || def.id}`);
          messages.push(...rewarded.messages);
        }
      }

      // 후속 연쇄 인카운터 예약
      if (def?.chainOnResolve) {
        const scheduled = [...(nextState.scheduledEncounters || [])];
        const currentDay = nextState.dayCount || 1;

        for (const chain of def.chainOnResolve) {
          scheduled.push({
            encounterId: chain.nextEncounterId,
            scheduledDay: currentDay + (chain.delayDays || 0),
            scheduledTimeOfDay: chain.delayTimeOfDay,
            conditions: chain.conditions,
            sourceEncounterId: encId,
          });
        }
        nextState.scheduledEncounters = scheduled;
      }
    }
  }


  if (event.type === 'ENCOUNTER_FAILED') {
    const encId = event.payload.encounterId;
    if (encId) {
      const def = getEncounterDefinition(encId);
      const encounters = { ...(nextState.encounters || {}) };
      encounters[encId] = {
        ...(encounters[encId] || {}),
        status: 'FAILED',
        outcome: event.payload.encounterOutcome || 'FAILED',
        resolvedAt: Date.now(),
      };
      nextState = { ...nextState, encounters, activeEncounterId: nextState.activeEncounterId === encId ? null : nextState.activeEncounterId };

      if (def?.chainOnFail) {
        const scheduled = [...(nextState.scheduledEncounters || [])];
        const currentDay = nextState.dayCount || 1;
        for (const chain of def.chainOnFail) {
          scheduled.push({
            encounterId: chain.nextEncounterId,
            scheduledDay: currentDay + (chain.delayDays || 0),
            scheduledTimeOfDay: chain.delayTimeOfDay,
            sourceEncounterId: encId,
          });
        }
        nextState.scheduledEncounters = scheduled;
      }
    }
  }

  return { nextState, messages };
}

// ============================================================
// 6. 주요 인물 상호작용 및 기억 플래그 핸들러
// ============================================================
function handleMajorCharacterEvent(
  state: PlayerState,
  event: GameEvent
): { nextState: PlayerState; messages: string[] } {
  let nextState = { ...state };
  const messages: string[] = [];

  if (event.type === 'CHARACTER_TALKED' || event.type === 'CHARACTER_MET') {
    const charId = event.payload.characterId;
    if (charId) {
      const majorChars = { ...(nextState.majorCharacters || INITIAL_MAJOR_CHARACTERS) };
      const baseChar = majorChars[charId] || INITIAL_MAJOR_CHARACTERS[charId];
      if (baseChar) {
        const previousCount = baseChar.interactionHistory?.length || 0;
        const talkGain = event.type === 'CHARACTER_TALKED' ? (previousCount > 0 && previousCount % 4 === 0 ? 2 : 1) : 0;
        const char = {
          ...baseChar,
          relationship: Math.min(100, Math.max(-100, baseChar.relationship + talkGain)),
          trust: Math.min(100, Math.max(0, baseChar.trust + talkGain)),
          memoryFlags: { ...(baseChar.memoryFlags || {}) },
          interactionHistory: [
            ...(baseChar.interactionHistory || []),
            { timestamp: Date.now(), summary: `${event.type === 'CHARACTER_TALKED' ? '대화' : '조우'} (${new Date().toLocaleDateString()})` },
          ].slice(-20),
        };
        if (talkGain > 0) messages.push(`💬 ${char.name}과의 반복 교류로 호감도와 신뢰도가 +${talkGain} 상승했습니다.`);
        if (char.isRecruitable && !char.isRecruited && char.trust >= (char.recruitmentTrust ?? 55)) {
          char.memoryFlags.recruitmentReady = true;
          messages.push(`🤝 ${char.name}을(를) 동료로 영입할 만큼 신뢰가 쌓였습니다.`);
        }
        if (char.villainous && !char.memoryFlags.maliciousIntentExposed && previousCount >= 2 && event.type === 'CHARACTER_TALKED') {
          const chance = Math.max(0, Math.min(0.45, char.betrayalRisk ?? 0.12));
          if (Math.random() < chance) {
            char.memoryFlags.maliciousIntentExposed = true;
            char.memoryFlags.betrayalTriggered = true;
            char.relationship = Math.max(-100, char.relationship - 18);
            nextState.storyFlags = Array.from(new Set([...(nextState.storyFlags || []), `MALICIOUS_CHARACTER_EXPOSED:${char.id}`]));
            messages.push(`⚠️ ${char.name}의 행동에서 의도적인 기만과 악의가 드러났습니다. 이후의 선택에 주의해야 합니다.`);
          }
        }
        majorChars[charId] = char;
        nextState.majorCharacters = majorChars;
      }
    }
  }

  return { nextState, messages };
}
