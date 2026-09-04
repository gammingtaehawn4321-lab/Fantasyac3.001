import { useState, useEffect, useRef } from 'react';
import { GameMessage, PlayerState, PlayerStats } from './types';
import { extractCleanStory, normalizeNarrativeText, sanitizeGameStateForAI } from './utils/narrativeSanitizer';
import {
  INITIAL_PLAYER_STATE,
  applyStateChanges,
  applyStoryLogProgress,
  DEFAULT_ACTION_TIME_MINUTES,
  allocateStatPoint,
  sanitizePlayerState,
  advanceGameTime,
  createNewPlayerState,
  shouldStartBattle,
  equipItemToSlot,
  unequipItemFromSlot,
  enhanceEquipment,
  socketEquipmentRuneword,
  equipBagToPlayer,
  unequipBagFromPlayer,
  craftRecipe,
  setupCamp,
  upgradeCampFacility,
  performCampSleep,
  readBookInCamp,
  transferItemToCampStorage,
  transferItemFromCampStorage,
  setCompanionTactic,
  toggleCompanionActiveParty,
  respondPetRequest,
  careForPet,
  feedPet,
  setEquippedPet,
  upgradePetMetabolismPerk,
  recordPetBattleCommandOutcome,
  useInventoryItem,
  discardInventoryItem,
  removeItem,
  attemptUnlockLock,
  interactWithCharacter,
  enterLocation,
  movePlayerByEncounter,
  acknowledgeQuestAlerts,
  acceptQuest,
  declineQuest,
} from './gameEngine';
import { dispatchGameEvent } from './gameEvents';
import { buildRacePrologueText } from './data/raceNarrativeReferences';
import { getFateDefinition } from './data/world/fateData';
import { applyFateAction } from './data/world/fateSystem';
import { applyFateContentHooks, activateQueuedFateEncounter } from './data/world/fateIntegration';
import { StatusHeader } from './components/StatusHeader';
import { StoryLog } from './components/StoryLog';
import { ActionInput } from './components/ActionInput';
import { CharacterFloatingMenu } from './components/CharacterFloatingMenu';
import { InternalStatusModal } from './components/InternalStatusModal';
import { StatsModal } from './components/StatsModal';
import { InventoryModal } from './components/InventoryModal';
import { StatusModal } from './components/StatusModal';
import { TalentTreeModal } from './components/TalentTreeModal';
import { ClassModal } from './components/ClassModal';
import { CombatScreen } from './components/CombatScreen';
import { CharacterCreationModal } from './components/CharacterCreationModal';
import { NewGameModal } from './components/NewGameModal';
import { GameOverModal } from './components/GameOverModal';
import { DefeatEncounterModal } from './components/DefeatEncounterModal';
import { MainTitleScreen } from './components/MainTitleScreen';
import { SaveSlotModal } from './components/SaveSlotModal';
import { EquipmentTab } from './components/EquipmentTab';
import { ProfessionsTab } from './components/ProfessionsTab';
import { LifeSkillsModal } from './components/LifeSkillsModal';
import { CraftingTab } from './components/CraftingTab';
import { CampTab } from './components/CampTab';
import { CompanionsTab } from './components/CompanionsTab';
import { MajorCharactersModal } from './components/MajorCharactersModal';
import { QuestModal } from './components/QuestModal';
import { FateModal } from './components/FateModal';
import { SkillTreeModal } from './components/SkillTreeModal';
import { WorldMapModal } from './components/WorldMapModal';
import { SettlementModal } from './components/SettlementModal';
import { DungeonExplorerModal } from './components/DungeonExplorerModal';
import { BattleState } from './combat/combatTypes';
import type { RoutePreference } from './types';
import { initBattleState } from './combat/battleEngine';
import { createEnemyActor } from './combat/enemyFactory';
import { X, Shield, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { EquipmentSlot, EquipmentEnhancementMilestone, RunewordType } from './data/equipment';
import { CampFacilityType } from './data/camp/campTypes';
import { CompanionTactic } from './types';
import { WORLD_HEX_TILES, revealAround, type WorldRouteResult } from './data/world/worldMapSystem';
import { buildAirship, upgradeAirship, refuelAirship } from './data/world/lifeTravelSystem';
import { getWaystationAt, getWaystationDestination, rollWaystationSpecialEncounter, type WaystationRoute } from './data/world/waystationSystem';
import { gatherLifeResources } from './data/world/gatheringSystem';
import { getInnStayQuote, markSettlementVisited, recordInnStay, type InnRateDefinition } from './data/world/settlements';
import { recruitMajorCharacter } from './data/characters/majorCharacterExpansion';
import { mineWorldOreVein } from './data/world/miningSystem';
import { getDungeonLayout, WORLD_DUNGEON_DATABASE } from './data/dungeons/dungeonSystem';
import { REGIONAL_MONSTERS } from './data/world/monsterData';
import { getHostileSiteMonsterSlot } from './data/world/hostileSiteMonsterSlots';
import { grantPetExperience } from './data/pets/petGrowth';
import { getPetTameReferencePool, getPetUserReferencePool } from './data/pets/petEventReferences';
import { getPetSpeciesDefinition } from './data/pets/petDatabase';
import { markDragonkinHunterEvent } from './data/dragonkin/dragonkinEncounterSystem';
import { getDefeatAftermathEffect, getResurrectionConsumable, hasResurrectionPotion, rollDefeatAftermath } from './data/world/defeatEncounterSystem';
import { createDefeatAdultEventRuntime, resolveDefeatAdultEventOutcome, selectDefeatAdultEvent } from './data/world/defeatAdultEventSystem';
import { RESURRECTION_POTION_NAME } from './data/world/monsterLootItems';
import {
  WORLD_TRAVEL_ENCOUNTER_ID,
  anchorCurrentTravelEncounterToWorldHex,
  attachTravelSession,
  cancelTravelSession,
  completeCurrentTravelEncounter,
  createTravelSession,
  getCurrentTravelEncounter,
} from './data/world/travelSessionSystem';
import { addSkillMastery, grantNextAdvancedPassiveRecipe, grantPassiveAwakeningStones, grantUniqueActive } from './data/progression/progressionSystem';
import { requestNarration } from './services/narratorClient';
import { UNIQUE_ACTIVE_SKILLS } from './data/progression/progressionData';
import {
  checkAndMigrateLegacyLocalStorage,
  triggerDebouncedAutosave,
  GameSaveData,
} from './services/saveService';
import { requestInterpreterAction } from './services/interpreterClient';

function generatePrologueMessage(state: PlayerState): GameMessage {
  let prologueText = buildRacePrologueText({
    race: state.race,
    beastkinType: state.beastkinType,
    characterName: state.characterName,
    profile: state.profile,
  });

  const fateDef = getFateDefinition(state.fate?.fateId || '');
  if (fateDef) {
    const firstChapter = fateDef.chapters[0];
    prologueText += `

『${fateDef.name}』. ${fateDef.introSituation}${firstChapter ? `
운명의 첫 장, 「${firstChapter.title}」이 시작된다.` : ''}`;
  }

  return {
    id: `msg-start-${Date.now()}`,
    role: 'gm',
    content: prologueText,
    timestamp: Date.now(),
  };
}

import { BlacksmithWorkshopModal } from './components/BlacksmithWorkshopModal';
import { AlchemyCraftingModal } from './components/AlchemyCraftingModal';


function getNarratorLocationLabel(state: PlayerState): string {
  const hexId = state.worldMap?.currentHexId;
  const tile = hexId ? WORLD_HEX_TILES[hexId] : undefined;
  if (!tile) return state.worldMap?.currentRegionId || '알 수 없는 지역';
  return tile.locationName || tile.featureName || tile.sectorName || tile.regionId || tile.id;
}

function getNarratorTimeLabel(state: PlayerState): string {
  const hour = String(typeof state.currentHour === 'number' ? state.currentHour : 8).padStart(2, '0');
  const minute = String(typeof state.currentMinute === 'number' ? state.currentMinute : 0).padStart(2, '0');
  return `Day ${state.dayCount || 1} · ${hour}:${minute}`;
}

function stringifySpeechStyle(state: PlayerState): string | undefined {
  const style = state.profile?.speechStyle;
  if (!style) return undefined;
  return [style.description, style.tone, style.politeness, ...(style.quirks || [])].filter(Boolean).join(' / ') || undefined;
}

export default function App() {

  // Screen state: 'title' | 'game'
  const [currentScreen, setCurrentScreen] = useState<'title' | 'game'>('title');

  // Player state & messages
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [messages, setMessages] = useState<GameMessage[]>([generatePrologueMessage(INITIAL_PLAYER_STATE)]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPetInteractionLoading, setIsPetInteractionLoading] = useState(false);
  const petInteractionLockRef = useRef(false);

  // Save Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalMode, setSaveModalMode] = useState<'load_only' | 'manage'>('load_only');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const triggerAutosave = (stateToSave: PlayerState, msgsToSave: GameMessage[]) => {
    if (stateToSave.isCharacterCreated) {
      triggerDebouncedAutosave({ playerState: stateToSave, messages: msgsToSave });
    }
  };

  // Check and migrate legacy localStorage on initial load
  useEffect(() => {
    checkAndMigrateLegacyLocalStorage().then((migrated) => {
      if (migrated) {
        showToast('기존 저장 데이터를 IndexedDB로 성공적으로 이전했습니다.', 'success');
      }
    });
  }, []);

  // Modals state
  const [isCharacterCreationOpen, setIsCharacterCreationOpen] = useState(false);
  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isInternalStatusOpen, setIsInternalStatusOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isTalentsOpen, setIsTalentsOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // 신규 4대 시스템 모달
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [isProfessionsOpen, setIsProfessionsOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isBlacksmithOpen, setIsBlacksmithOpen] = useState(false);
  const [isAlchemyOpen, setIsAlchemyOpen] = useState(false);

  const [isCampOpen, setIsCampOpen] = useState(false);
  const [campReturnTarget, setCampReturnTarget] = useState<'blacksmith' | 'alchemy' | 'professions' | 'companions' | null>(null);
  const [isCompanionsOpen, setIsCompanionsOpen] = useState(false);
  const [isMajorCharactersOpen, setIsMajorCharactersOpen] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  const [isFateOpen, setIsFateOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [activeSettlementId, setActiveSettlementId] = useState<string | undefined>(undefined);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [isDungeonOpen, setIsDungeonOpen] = useState(false);
  const [activeDungeonId, setActiveDungeonId] = useState<string | undefined>(undefined);

  const hasBlockingOverlay = isStatusOpen || isInternalStatusOpen || isStatsOpen || isTalentsOpen || isClassOpen ||
    isInventoryOpen || isEquipmentOpen || isProfessionsOpen || isCraftingOpen || isBlacksmithOpen || isAlchemyOpen ||
    isCampOpen || isCompanionsOpen || isMajorCharactersOpen || isQuestOpen || isFateOpen || isSkillTreeOpen ||
    isWorldMapOpen || isSettlementOpen || isDungeonOpen || isSaveModalOpen || isCharacterCreationOpen || isNewGameOpen || isGameOverModalOpen;

  const isGameOver = playerState.hp <= 0 || playerState.sanity <= 0;
  const gameOverReason: 'hp' | 'sanity' = playerState.hp <= 0 ? 'hp' : 'sanity';

  // Automatically trigger game over modal on demise
  useEffect(() => {
    if (isGameOver) {
      setIsGameOverModalOpen(true);
    }
  }, [isGameOver]);

  useEffect(() => {
    if (isQuestOpen && playerState.questAlertQuestIds?.length) {
      setPlayerState((prev) => acknowledgeQuestAlerts(prev));
    }
  }, [isQuestOpen]);

  const handleSendAction = async (actionText: string) => {
    if (!actionText.trim() || isLoading || isGameOver) return;

    let updatedMessages = [...messages];
    const lastMsg = updatedMessages[updatedMessages.length - 1];

    if (lastMsg && lastMsg.status === 'error' && lastMsg.actionText === actionText.trim()) {
      updatedMessages = updatedMessages.filter((m) => m.id !== lastMsg.id);
    } else {
      const userMessage: GameMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: actionText.trim(),
        timestamp: Date.now(),
      };
      updatedMessages.push(userMessage);
    }

    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages
        .slice(0, -1)
        .filter((m) => m.status !== 'error')
        .slice(-12)
        .map((m) => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: m.content,
        }));

      const sanitizedStateForAI = sanitizeGameStateForAI(playerState);

      const data = await requestInterpreterAction({
        action: actionText.trim(),
        history: historyPayload,
        playerState: sanitizedStateForAI,
      });

      // Handle world action (TALK_CHARACTER, MEET_CHARACTER, ENTER_LOCATION)
      const wasTravelEncounterActionActive = playerState.activeEncounterId === WORLD_TRAVEL_ENCOUNTER_ID && Boolean(playerState.worldMap.travelSession?.active);
      let currentStateForChanges: PlayerState = {
        ...playerState,
        adultNarrativeQueue: [],
        companionNeedQueue: [],
      };
      let worldActionResultSummary: string[] = [];

      if (data.worldAction && data.worldAction.type) {
        if (data.worldAction.type === 'TALK_CHARACTER') {
          const charId = data.worldAction.characterId || data.worldAction.characterName || 'npc';
          const charName = data.worldAction.characterName;
          const talkRes = interactWithCharacter(currentStateForChanges, charId, 'TALKED', charName);
          currentStateForChanges = talkRes.nextState;
          if (talkRes.message) {
            worldActionResultSummary.push(talkRes.message);
          }
        } else if (data.worldAction.type === 'MEET_CHARACTER') {
          const charId = data.worldAction.characterId || data.worldAction.characterName || 'npc';
          const charName = data.worldAction.characterName;
          const meetRes = interactWithCharacter(currentStateForChanges, charId, 'MET', charName);
          currentStateForChanges = meetRes.nextState;
          if (meetRes.message) {
            worldActionResultSummary.push(meetRes.message);
          }
        } else if (data.worldAction.type === 'ENTER_LOCATION' && data.worldAction.location) {
          const locRes = enterLocation(currentStateForChanges, data.worldAction.location);
          currentStateForChanges = locRes.nextState;
          if (locRes.message) worldActionResultSummary.push(locRes.message);
        } else if (data.worldAction.type === 'MOVE_HEX') {
          const moveRes = movePlayerByEncounter(
            currentStateForChanges,
            data.worldAction.hexId,
            data.worldAction.location,
            data.worldAction.movementType,
            data.worldAction.direction,
          );
          if (moveRes.success) currentStateForChanges = moveRes.nextState;
          if (moveRes.message) worldActionResultSummary.push(moveRes.message);
        }
      }

      // Handle active encounter resolution/failure if explicitly concluded by GM.
      let encounterResultSummary: string[] = [];
      let resolvedTravelEncounter = false;
      let resolvedDefeatAdultEventId: string | null = null;
      const travelEncounterActionActive = currentStateForChanges.activeEncounterId === WORLD_TRAVEL_ENCOUNTER_ID && Boolean(currentStateForChanges.worldMap.travelSession?.active);
      if (data.encounterAction && currentStateForChanges.activeEncounterId) {
        const activeEncounterId = currentStateForChanges.activeEncounterId;
        const requestedId = data.encounterAction.encounterId || activeEncounterId;
        if (requestedId === activeEncounterId) {
          const isTravelEncounter = travelEncounterActionActive;
          // 여행 사건이 전투로 이어질 때는 전투가 끝나기 전까지 해당 여행 인카운터를 유지한다.
          const travelBattlePending = isTravelEncounter && Boolean(data.changes?.battleTrigger);
          if (!travelBattlePending) {
            const defeatAdultEventActive = Boolean(currentStateForChanges.defeatAdultEvent?.active && currentStateForChanges.defeatAdultEvent.eventId === activeEncounterId);
            const eventType = data.encounterAction.type === 'FAIL' ? 'ENCOUNTER_FAILED' : 'ENCOUNTER_RESOLVED';
            const encounterRes = dispatchGameEvent(currentStateForChanges, eventType, {
              encounterId: activeEncounterId,
              encounterOutcome: data.encounterAction.outcome || data.encounterAction.type,
            });
            currentStateForChanges = encounterRes.nextState;
            encounterResultSummary.push(...encounterRes.messages);
            resolvedTravelEncounter = isTravelEncounter;
            if (defeatAdultEventActive) {
              // 장면에서 반환한 body/payload/시간 변화까지 먼저 적용한 뒤 패배 결과를 최종 확정한다.
              // GAME_OVER 결과가 GM의 hpDelta 등에 의해 뒤집히는 것을 방지하기 위해 여기서는 ID만 기억한다.
              resolvedDefeatAdultEventId = activeEncounterId;
            } else if (!isTravelEncounter) {
              const queuedFateEncounter = activateQueuedFateEncounter(currentStateForChanges);
              currentStateForChanges = queuedFateEncounter.nextState;
              encounterResultSummary.push(...queuedFateEncounter.messages);
            }
          }
        }
      }

      // Handle fate progression only when the GM explicitly reports a meaningful current-fate resolution.
      let fateResultSummary: string[] = [];
      if (data.fateAction && data.fateAction.type && currentStateForChanges.fate) {
        const beforeFateState = currentStateForChanges;
        const fateRes = applyFateAction(currentStateForChanges, data.fateAction);
        if (fateRes.success) {
          const integrated = applyFateContentHooks(beforeFateState, fateRes.nextState);
          currentStateForChanges = integrated.nextState;
          fateResultSummary.push(...fateRes.messages, ...integrated.messages);
        }
      }

      // Handle lock action if provided by GM
      let lockResultSummary: string[] = [];

      if (data.lockAction && data.lockAction.lockId && data.lockAction.method) {
        const lockRes = attemptUnlockLock(
          currentStateForChanges,
          data.lockAction.lockId,
          data.lockAction.method
        );
        currentStateForChanges = lockRes.nextState;
        if (lockRes.message) {
          lockResultSummary.push(lockRes.message);
        }

        // Prevent double item removal if GM returned the key item in removeItems
        if (data.changes?.removeItems && Array.isArray(data.changes.removeItems)) {
          const usedKeyId = data.lockAction.keyItemId;
          if (usedKeyId) {
            data.changes.removeItems = data.changes.removeItems.filter((item: any) => {
              const name = typeof item === 'string' ? item : item?.name || item?.id;
              return name !== usedKeyId;
            });
          }
        }
      }

      const timeDeltaMinutes = wasTravelEncounterActionActive
        ? 0 // 여행 중 사건의 시간은 TravelSession이 현재 인카운터의 몫만 별도로 진행한다.
        : typeof data.changes?.timeDeltaMinutes === 'number'
          ? Math.min(1440, Math.max(1, Math.floor(data.changes.timeDeltaMinutes)))
          : DEFAULT_ACTION_TIME_MINUTES;

      const safeChangesWithTime = {
        ...(data.changes || {}),
        timeDeltaMinutes,
      };

      const { nextState, levelUpMessage, changeSummary } = applyStateChanges(
        currentStateForChanges,
        safeChangesWithTime
      );

      let finalState = applyStoryLogProgress(nextState);
      let pendingGameOverModalState: boolean | null = null;
      if (resolvedDefeatAdultEventId) {
        finalState = resolveDefeatAdultEventOutcome(finalState, resolvedDefeatAdultEventId);
        encounterResultSummary.push(`패배 후 이벤트 결과가 적용되었습니다: ${resolvedDefeatAdultEventId}`);
        // Narrator 로그까지 성공한 뒤 UI/상태를 한 번에 커밋한다.
        pendingGameOverModalState = finalState.hp <= 0 || finalState.sanity <= 0;
      }
      let travelContinuationMessages: GameMessage[] = [];
      if (resolvedTravelEncounter) {
        const continuation = advanceTravelAndActivateNext(finalState);
        finalState = continuation.nextState;
        travelContinuationMessages = continuation.messages;
      }

      const allChangeLogs = [...worldActionResultSummary, ...encounterResultSummary, ...fateResultSummary, ...lockResultSummary, ...(changeSummary || [])];

      const willStartBattle = shouldStartBattle(data.actionResult, data.changes?.battleTrigger);
      const pendingBattleForMessage = (willStartBattle && data.changes?.battleTrigger)
        ? data.changes.battleTrigger
        : undefined;

      const interpreterSummary = extractCleanStory(data.story);
      const lockedFacts = [
        `플레이어가 다음 행동을 시도했다: ${actionText.trim()}`,
        interpreterSummary ? `Gemini 행동 해석 요약: ${interpreterSummary}` : '',
        ...allChangeLogs.map((line) => `게임 엔진 확정: ${line}`),
        pendingBattleForMessage ? '게임 엔진 확정: 이 행동 이후 전투가 시작될 예정이다.' : '',
        data.statCheck?.success === true ? '게임 엔진 확정: 스탯 판정에 성공했다.' : '',
        data.statCheck?.success === false ? '게임 엔진 확정: 스탯 판정에 실패했다.' : '',
      ].filter(Boolean);

      const narration = await requestNarration({
        requestId: `rpg-${Date.now()}`,
        locale: 'ko-KR',
        sceneType: 'RPG_ACTION',
        playerAction: actionText.trim(),
        interpreterSummary,
        currentLocation: getNarratorLocationLabel(finalState),
        currentTime: getNarratorTimeLabel(finalState),
        participants: [
          {
            id: 'player',
            name: finalState.characterName || finalState.profile?.inGameName || '모험가',
            role: '주인공',
            speechStyle: stringifySpeechStyle(finalState),
          },
        ],
        lockedFacts,
        recentLog: updatedMessages
          .filter((m) => m.role !== 'user' && m.status !== 'error')
          .slice(-6)
          .map((m) => m.content),
        desiredLength: 'LONG',
      });

      const cleanStory = normalizeNarrativeText(narration.text);

      // Interpreter -> Engine -> Narrator가 모두 성공한 뒤에만 실제 상태를 커밋한다.
      setPlayerState(finalState);
      if (pendingGameOverModalState !== null) setIsGameOverModalOpen(pendingGameOverModalState);

      const gmMessage: GameMessage = {
        id: `gm-${Date.now()}`,
        role: 'gm',
        content: cleanStory,
        timestamp: Date.now(),
        appliedChanges: data.changes,
        systemChangeLogs: allChangeLogs.length > 0 ? allChangeLogs : undefined,
        pendingBattle: pendingBattleForMessage,
        statCheckResult: data.statCheck,
      };

      const newMsgList = [...updatedMessages, gmMessage, ...travelContinuationMessages];

      if (levelUpMessage) {
        newMsgList.push({
          id: `lvl-${Date.now()}`,
          role: 'system',
          content: levelUpMessage,
          timestamp: Date.now() + 1,
        });
      }

      setMessages(newMsgList);

      // Trigger AUTOSAVE after GM response and state application is finalized
      triggerAutosave(finalState, newMsgList);
    } catch (error: any) {
      console.error('Failed to take action:', error);
      const errorMessage: GameMessage = {
        id: `err-${Date.now()}`,
        role: 'gm',
        status: 'error',
        content: error.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: Date.now(),
        actionText: actionText.trim(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPendingBattle = (bt: any) => {
    const enemyList = (bt.enemies && bt.enemies.length > 0)
      ? bt.enemies.map((e: any) => createEnemyActor({
          name: e.name || bt.enemyName || '몬스터',
          level: e.level || bt.enemyLevel || playerState.level,
          tier: e.tier || bt.enemyTier || 'NORMAL',
          hp: e.hp,
          mp: e.mp,
        }))
      : [
          createEnemyActor({
            templateId: bt.enemyTemplate || 'wild_wolf',
            name: bt.enemyName || '숲의 약탈자',
            level: bt.enemyLevel || playerState.level,
            tier: bt.enemyTier || 'NORMAL',
          }),
        ];

    const initialBattle = initBattleState(
      playerState,
      enemyList,
      bt.battlefield ? { name: bt.battlefield.name, description: bt.battlefield.description } : undefined,
      bt.canEscape !== false
    );

    setPlayerState((prev) => ({
      ...prev,
      activeBattle: initialBattle,
    }));
  };

  const handleUpdateBattle = (nextBattle: BattleState) => {
    setPlayerState((prev) => ({
      ...prev,
      hp: nextBattle.player.hp,
      mana: nextBattle.player.mp,
      companions: prev.companions.map((companion) => {
        const battleCompanion = nextBattle.companions.find((actor) => actor.id === companion.id);
        if (!battleCompanion) return companion;
        return {
          ...companion,
          hp: battleCompanion.hp,
          mp: battleCompanion.mp,
          sanity: battleCompanion.sanity ?? companion.sanity,
          isKnockedOut: battleCompanion.hp <= 0,
          manualCombatControl: battleCompanion.manualControl ?? companion.manualCombatControl ?? false,
        };
      }),
      activeBattle: nextBattle,
    }));
  };

  const handleConsumeCombatItem = (
    nextBattle: BattleState,
    itemNameOrId: string,
    quantity: number = 1
  ) => {
    setPlayerState((prev) => {
      const removed = removeItem(prev.inventory, itemNameOrId, quantity);
      let next: PlayerState = {
        ...prev,
        hp: nextBattle.player.hp,
        mana: nextBattle.player.mp,
        inventory: removed.inventory,
        companions: prev.companions.map((companion) => {
          const battleCompanion = nextBattle.companions.find((actor) => actor.id === companion.id);
          if (!battleCompanion) return companion;
          return {
            ...companion,
            hp: battleCompanion.hp,
            mp: battleCompanion.mp,
            sanity: battleCompanion.sanity ?? companion.sanity,
            isKnockedOut: battleCompanion.hp <= 0,
          };
        }),
        activeBattle: nextBattle,
      };
      if (removed.removedQuantity > 0) {
        const consumedItem = prev.inventory.find((item) => item.id === itemNameOrId || item.name === itemNameOrId);
        next = dispatchGameEvent(next, 'ITEM_USED', {
          itemId: consumedItem?.id,
          itemName: consumedItem?.name || itemNameOrId,
          quantity: removed.removedQuantity,
        }).nextState;
      }
      return next;
    });
  };

  const handleCompanionCombatSettings = (
    companionId: string,
    settings: { manualControl?: boolean; tactic?: CompanionTactic },
    nextBattle?: BattleState
  ) => {
    setPlayerState((prev) => ({
      ...prev,
      companions: prev.companions.map((companion) =>
        companion.id === companionId
          ? {
              ...companion,
              manualCombatControl: settings.manualControl ?? companion.manualCombatControl ?? false,
              combatTactic: settings.tactic ?? companion.combatTactic,
            }
          : companion
      ),
      activeBattle: nextBattle ?? prev.activeBattle,
    }));
  };

  const processDefeatedEnemyProgression = (baseState: PlayerState, battle: BattleState | null | undefined) => {
    let processedState = baseState;
    const progressionRewardLines: string[] = [];
    if (!battle?.enemies) return { processedState, progressionRewardLines };

    for (const enemy of battle.enemies.filter((target) => target.hp <= 0)) {
      const enemyEv = dispatchGameEvent(processedState, 'ENEMY_DEFEATED', {
        enemyId: enemy.archetype || enemy.id,
        enemyName: enemy.name,
      });
      processedState = enemyEv.nextState;

      if (enemy.tier === 'ELITE' || enemy.tier === 'BOSS') {
        const stones = enemy.tier === 'BOSS' ? 3 : 1;
        processedState = grantPassiveAwakeningStones(processedState, stones);
        progressionRewardLines.push(`패시브 해방석 +${stones}`);
        const firstFlag = `FIRST_DEFEAT_${String(enemy.archetype || enemy.name).toUpperCase()}`;
        if (!processedState.storyFlags.includes(firstFlag)) {
          processedState = { ...processedState, storyFlags: [...processedState.storyFlags, firstFlag] };
          const recipe = grantNextAdvancedPassiveRecipe(processedState);
          processedState = recipe.nextState;
          if (recipe.recipeId) progressionRewardLines.push('심화 패시브 조합식 1종 해방');
        }
      }

      if (enemy.traits?.includes('REGIONAL_BOSS')) {
        const unique = UNIQUE_ACTIVE_SKILLS.find((u) => u.classId === processedState.combatClass && !processedState.skillProgression.acquiredUniqueActiveIds.includes(u.skillId));
        if (unique) {
          const granted = grantUniqueActive(processedState, unique.skillId);
          processedState = granted.nextState;
          if (granted.success) progressionRewardLines.push(`지역 보스 유일 액티브: ${unique.skillId}`);
        }
      }
    }
    return { processedState, progressionRewardLines };
  };

  const formatCombatRewardLines = (rewards?: { exp: number; rupees: number; items?: any[]; breakdown?: any[] }) => {
    if (!rewards) return [] as string[];
    const lines: string[] = [];
    if (rewards.exp > 0) lines.push(`획득 경험치: +${rewards.exp} EXP`);
    if (rewards.rupees > 0) lines.push(`획득 루피: +${rewards.rupees} 루피`);
    const itemGroups = new Map<string, number>();
    for (const item of rewards.items || []) itemGroups.set(item.name, (itemGroups.get(item.name) || 0) + Number(item.quantity || 0));
    for (const [name, quantity] of itemGroups) if (quantity > 0) lines.push(`획득 아이템: ${name} x${quantity}`);
    return lines;
  };

  const activateCurrentTravelEncounter = (baseState: PlayerState): { nextState: PlayerState; message?: GameMessage; movedToHexId?: string; fuelSpent?: number } => {
    const anchored = anchorCurrentTravelEncounterToWorldHex(baseState);
    const anchoredState = anchored.nextState;
    const unit = getCurrentTravelEncounter(anchoredState);
    const session = anchoredState.worldMap.travelSession;
    if (!unit || !session?.active) return { nextState: anchoredState, movedToHexId: anchored.movedToHexId, fuelSpent: anchored.fuelSpent };

    let next = unit.dragonkinHunter ? markDragonkinHunterEvent(anchoredState) : anchoredState;
    const progressLabel = `${unit.index + 1}/${session.encounters.length}`;
    const tile = WORLD_HEX_TILES[unit.tileId];

    if (unit.kind === 'MONSTER' && unit.monsterId) {
      const def = REGIONAL_MONSTERS.find((m) => m.id === unit.monsterId);
      const hostileDef = !def ? getHostileSiteMonsterSlot(unit.monsterId) : undefined;
      const hostileSubtype = hostileDef?.hostileSiteKind === 'INSECT_COLONY' ? 'INSECTOID' : hostileDef?.hostileSiteKind === 'TENTACLE_RAID_SITE' ? 'TENTACLE' : undefined;
      const enemy = createEnemyActor({
        templateId: def?.id || hostileDef?.id || unit.monsterId,
        name: def?.name || hostileDef?.name || unit.monsterName || '여행 중의 적',
        level: Math.max(def?.minLevel || hostileDef?.minLevel || 1, Math.min(def?.maxLevel || hostileDef?.maxLevel || next.level, next.level)),
        tier: tile?.layerBossId === def?.id ? 'BOSS' : (def?.tier || hostileDef?.tier || 'NORMAL'),
        skills: def?.skills || hostileDef?.skills,
        personality: def?.personality || hostileDef?.personality,
        race: def?.raceType === 'HUMANOID'
          ? (def.raceSubtype.startsWith('BEASTKIN_') ? 'BEASTKIN' : def.raceSubtype === 'ELF' ? 'ELF' : 'HUMAN')
          : 'MONSTER',
        traits: (() => {
          const baseTraits = def ? [def.raceType, def.raceSubtype, ...(def.tier === 'ELITE' ? ['ELITE'] : [])] : hostileDef ? ['ABERRANT', hostileSubtype || 'ABERRANT', 'HOSTILE_SITE', ...(hostileDef.tier === 'ELITE' ? ['ELITE'] : []), ...hostileDef.tags] : [];
          if (tile?.layer === 'UNDERGROUND') baseTraits.push('UNDERGROUND');
          if (tile?.layer === 'DEEP_UNDERGROUND') baseTraits.push('DEEP_UNDERGROUND');
          if (tile?.layerBossId === def?.id) {
            baseTraits.push('REGIONAL_BOSS', 'UNDERGROUND_LAYER_BOSS');
            if (tile.layerBossClearFlag) baseTraits.push(`CLEAR_FLAG:${tile.layerBossClearFlag}`);
          }
          return baseTraits;
        })(),
      });
      next = {
        ...next,
        activeEncounterId: null,
        activeBattle: initBattleState(next, [enemy], {
          name: `${tile?.sectorName || tile?.regionId || '여행 경로'} · ${tile?.terrain || 'UNKNOWN'}`,
          description: `목적지까지 이동하는 중 발생한 여행 인카운터 ${progressLabel}.`,
        }),
      };
      return {
        nextState: next,
        message: {
          id: `travel-encounter-${Date.now()}`,
          role: 'system',
          content: `🧭 [여행 인카운터 ${progressLabel}]
${unit.title}
${unit.summary}
• 전투를 해결하면 여행이 계속됩니다.`,
          timestamp: Date.now(),
        },
        movedToHexId: anchored.movedToHexId,
        fuelSpent: anchored.fuelSpent,
      };
    }

    const started = dispatchGameEvent(next, 'ENCOUNTER_STARTED', { encounterId: WORLD_TRAVEL_ENCOUNTER_ID });
    next = started.nextState;
    return {
      nextState: next,
      message: {
        id: `travel-encounter-${Date.now()}`,
        role: 'system',
        content: `🧭 [여행 인카운터 ${progressLabel}]
${unit.title}
${unit.summary}
• 행동을 입력해 이 사건을 해결하세요.`,
        timestamp: Date.now(),
      },
      movedToHexId: anchored.movedToHexId,
      fuelSpent: anchored.fuelSpent,
    };
  };

  const advanceTravelAndActivateNext = (baseState: PlayerState): { nextState: PlayerState; messages: GameMessage[] } => {
    const advanced = completeCurrentTravelEncounter(baseState);
    let next = advanced.nextState;
    const travelMessages: GameMessage[] = [];

    if (advanced.arrived) {
      const destination = WORLD_HEX_TILES[next.worldMap.currentHexId];
      travelMessages.push({
        id: `travel-arrival-${Date.now() + 1}`,
        role: 'system',
        content: `📍 [목적지 도착]
${destination?.locationName || destination?.featureName || destination?.sectorName || next.worldMap.currentHexId}에 도착했습니다.`,
        timestamp: Date.now() + 1,
      });
      return { nextState: next, messages: travelMessages };
    }

    const activated = activateCurrentTravelEncounter(next);
    next = activated.nextState;
    if (activated.movedToHexId) {
      const movedTile = WORLD_HEX_TILES[activated.movedToHexId];
      travelMessages.push({
        id: `travel-step-${Date.now()}`,
        role: 'system',
        content: `🗺️ [여행 진행]
${movedTile?.locationName || movedTile?.sectorName || '다음 Hex'}에 실제로 진입했습니다.${(activated.fuelSpent || 0) > 0 ? `
• 비행정 연료 ${activated.fuelSpent} 소비` : ''}`,
        timestamp: Date.now(),
      });
    }
    if (activated.message) travelMessages.push(activated.message);
    return { nextState: next, messages: travelMessages };
  };

  const handleBattleEnd = (
    outcome: 'VICTORY' | 'DEFEAT' | 'ESCAPED',
    rewards?: { exp: number; rupees: number; items?: any[]; breakdown?: any[] }
  ) => {
    const finishedBattle = playerState.activeBattle;
    const travelUnitAtBattleStart = getCurrentTravelEncounter(playerState);
    const travelWasActive = Boolean(playerState.worldMap.travelSession?.active && travelUnitAtBattleStart);
    const rewardPayload = rewards || { exp: 0, rupees: 0, items: [] };
    const rewardApplied = applyStateChanges(playerState, {
      expGain: rewardPayload.exp || 0,
      rupeeDelta: rewardPayload.rupees || 0,
      addItems: rewardPayload.items || [],
    });
    const progression = processDefeatedEnemyProgression(rewardApplied.nextState, finishedBattle);
    let processedState = progression.processedState;
    const recentMonsterContextIds = (finishedBattle?.enemies || [])
      .map((enemy: any) => String(enemy.archetype || enemy.id || ''))
      .filter(Boolean);
    processedState = {
      ...processedState,
      recentMonsterContextIds,
      recentMonsterContextExpiresAtDialogue: Number(processedState.dialogueCount || 0) + 4,
    };

    // 층 보스는 승리했을 때만 다음 층 해금 플래그를 지급한다.
    if (outcome === 'VICTORY' && finishedBattle) {
      const clearFlags = (finishedBattle.enemies || [])
        .flatMap((enemy: any) => enemy.traits || [])
        .filter((trait: string) => String(trait).startsWith('CLEAR_FLAG:'))
        .map((trait: string) => String(trait).slice('CLEAR_FLAG:'.length));
      if (clearFlags.length) {
        processedState = {
          ...processedState,
          worldMap: {
            ...processedState.worldMap,
            accessFlags: Array.from(new Set([...(processedState.worldMap.accessFlags || []), ...clearFlags])),
            mapRevision: (processedState.worldMap.mapRevision || 0) + 1,
          },
        };
      }
    }

    // 던전 내부 전투 결과를 고정 타일 탐사 상태로 환원한다.
    const pendingDungeon = processedState.dungeonExploration;
    let shouldReopenDungeon = false;
    let reopenDungeonId: string | undefined;
    if (pendingDungeon?.pendingCombatTileId) {
      reopenDungeonId = pendingDungeon.dungeonId;
      if (outcome === 'VICTORY') {
        const layout = getDungeonLayout(pendingDungeon.dungeonId);
        const combatTile = layout?.tiles.find((tile) => tile.id === pendingDungeon.pendingCombatTileId);
        const updatedDungeonRecord = {
          ...pendingDungeon,
          clearedTileIds: Array.from(new Set([...(pendingDungeon.clearedTileIds || []), pendingDungeon.pendingCombatTileId])),
          bossDefeated: pendingDungeon.bossDefeated || combatTile?.kind === 'BOSS',
          pendingCombatTileId: undefined,
          pendingCombatMonsterId: undefined,
        };
        processedState = {
          ...processedState,
          dungeonExploration: updatedDungeonRecord,
          dungeonRecords: {
            ...(processedState.dungeonRecords || {}),
            [pendingDungeon.dungeonId]: updatedDungeonRecord,
          },
        };
        shouldReopenDungeon = true;
      } else {
        const updatedDungeonRecord = {
          ...pendingDungeon,
          pendingCombatTileId: undefined,
          pendingCombatMonsterId: undefined,
        };
        processedState = {
          ...processedState,
          dungeonExploration: updatedDungeonRecord,
          dungeonRecords: {
            ...(processedState.dungeonRecords || {}),
            [pendingDungeon.dungeonId]: updatedDungeonRecord,
          },
        };
      }
    }
    let petGrowthMessages: string[] = [];
    if (outcome === 'VICTORY' && rewardPayload.exp > 0) {
      const petGrowth = grantPetExperience(processedState, Math.max(1, Math.floor(rewardPayload.exp * 0.75)));
      processedState = petGrowth.nextState;
      petGrowthMessages = petGrowth.messages;
    }
    const rewardLines = formatCombatRewardLines(rewardPayload);

    if (outcome === 'VICTORY') {
      const wonEv = dispatchGameEvent(processedState, 'BATTLE_WON', {});
      processedState = wonEv.nextState;
      let clearedState: PlayerState = { ...processedState, activeBattle: null, defeatAftermath: null };
      let travelBattleMessages: GameMessage[] = [];
      if (travelWasActive) {
        if (clearedState.activeEncounterId === WORLD_TRAVEL_ENCOUNTER_ID) {
          clearedState = dispatchGameEvent(clearedState, 'ENCOUNTER_RESOLVED', {
            encounterId: WORLD_TRAVEL_ENCOUNTER_ID,
            encounterOutcome: 'BATTLE_VICTORY',
          }).nextState;
        }
        const continued = advanceTravelAndActivateNext(clearedState);
        clearedState = continued.nextState;
        travelBattleMessages = continued.messages;
      }
      setPlayerState(clearedState);
      if (shouldReopenDungeon && reopenDungeonId) {
        setActiveDungeonId(reopenDungeonId);
        setIsDungeonOpen(true);
      }

      const victoryMsg: GameMessage = {
        id: `vic-${Date.now()}`,
        role: 'gm',
        content: `⚔️ [전투 승리]\n치열한 혈투 끝에 모든 적을 쓰러뜨렸습니다!${rewardLines.length ? `\n• ${rewardLines.join('\n• ')}` : ''}${progression.progressionRewardLines.length ? `\n• ${progression.progressionRewardLines.join('\n• ')}` : ''}${petGrowthMessages.length ? `\n• ${petGrowthMessages.join('\n• ')}` : ''}`,
        timestamp: Date.now(),
      };
      const nextMsgs = [...messages, victoryMsg, ...travelBattleMessages];
      if (rewardApplied.levelUpMessage) nextMsgs.push({ id: `lvl-${Date.now()}`, role: 'system', content: rewardApplied.levelUpMessage, timestamp: Date.now() + 1 });
      setMessages(nextMsgs);
      triggerAutosave(clearedState, nextMsgs);
      return;
    }

    if (outcome === 'ESCAPED') {
      let clearedState: PlayerState = { ...processedState, activeBattle: null, defeatAftermath: null };
      let travelBattleMessages: GameMessage[] = [];
      if (travelWasActive) {
        if (clearedState.activeEncounterId === WORLD_TRAVEL_ENCOUNTER_ID) {
          clearedState = dispatchGameEvent(clearedState, 'ENCOUNTER_RESOLVED', {
            encounterId: WORLD_TRAVEL_ENCOUNTER_ID,
            encounterOutcome: 'BATTLE_ESCAPED',
          }).nextState;
        }
        clearedState = cancelTravelSession(clearedState);
        travelBattleMessages = [{
          id: `travel-interrupted-${Date.now()}`,
          role: 'system',
          content: `🗺️ [여행 중단]\n도주로 인해 기존 목적지 경로가 해제되었습니다. 현재 월드 Hex에서 다시 경로를 선택할 수 있습니다.`,
          timestamp: Date.now(),
        }];
      }
      setPlayerState(clearedState);
      const escapeMsg: GameMessage = {
        id: `esc-${Date.now()}`,
        role: 'gm',
        content: `💨 [도주 성공]\n적의 공격 범위를 벗어나 후퇴했습니다.${rewardLines.length ? `\n\n[처치 결산]\n• ${rewardLines.join('\n• ')}` : ''}`,
        timestamp: Date.now(),
      };
      const nextMsgs = [...messages, escapeMsg, ...travelBattleMessages];
      if (rewardApplied.levelUpMessage) nextMsgs.push({ id: `lvl-${Date.now()}`, role: 'system', content: rewardApplied.levelUpMessage, timestamp: Date.now() + 1 });
      setMessages(nextMsgs);
      triggerAutosave(clearedState, nextMsgs);
      return;
    }

    if (outcome === 'DEFEAT') {
      const lostEv = dispatchGameEvent(processedState, 'BATTLE_LOST', {});
      processedState = lostEv.nextState;

      // 사용자 작성 패배 후 성인 이벤트가 활성/완성되어 있으면 기존 즉시 사망/사후 처리보다 먼저 라우팅한다.
      // 슬롯이 비어 있거나 disabled면 기존 패배 시스템으로 그대로 폴백한다.
      const defeatAdultEvent = finishedBattle ? selectDefeatAdultEvent(processedState, finishedBattle) : undefined;
      if (defeatAdultEvent && finishedBattle) {
        let routed: PlayerState = {
          ...processedState,
          hp: Math.max(1, processedState.hp),
          activeBattle: null,
          defeatAftermath: null,
          defeatAdultEvent: createDefeatAdultEventRuntime(processedState, finishedBattle, defeatAdultEvent.id),
        };
        if (travelWasActive) routed = cancelTravelSession(routed);
        const started = dispatchGameEvent(routed, 'ENCOUNTER_STARTED', { encounterId: defeatAdultEvent.id });
        routed = { ...started.nextState, defeatAdultEvent: routed.defeatAdultEvent };
        setPlayerState(routed);
        setIsGameOverModalOpen(false);
        const defeatMsg: GameMessage = {
          id: `defeat-adult-${Date.now()}`,
          role: 'system',
          content: `☠️ [전투 패배]
패배 후 전용 이벤트가 발생했습니다. 행동을 입력해 현재 사건을 진행하세요.${travelWasActive ? '\n진행 중이던 여행은 현재 위치에서 중단되었습니다.' : ''}`,
          timestamp: Date.now(),
        };
        const nextMsgs = [...messages, defeatMsg];
        setMessages(nextMsgs);
        triggerAutosave(routed, nextMsgs);
        return;
      }

      const aftermath = finishedBattle
        ? rollDefeatAftermath(processedState, finishedBattle)
        : { id: `defeat_${Date.now()}`, kind: 'DEATH' as const, title: '패배의 끝 · 사망', description: '전투에서 입은 상처를 버티지 못했다.', sourceEnemyIds: [], sourceEnemyNames: [], canSkipBattle: true, blockedByEliteOrBoss: false, canUseResurrectionPotion: hasResurrectionPotion(processedState), resolved: false };

      if (aftermath.kind !== 'DEATH') {
        const effect = getDefeatAftermathEffect(aftermath.kind)!;
        let recovered: PlayerState = {
          ...processedState,
          hp: Math.max(1, Math.round(processedState.maxHp * effect.hpRatio)),
          sanity: Math.max(1, Math.min(processedState.maxSanity, processedState.sanity + effect.sanityDelta)),
          rupees: Math.max(0, Math.round(processedState.rupees * (1 - effect.rupeeLossRatio))),
          activeBattle: null,
          defeatAdultEvent: null,
          defeatAftermath: aftermath,
          storyFlags: Array.from(new Set([...(processedState.storyFlags || []), `DEFEAT_AFTERMATH_${aftermath.kind}`])),
        };
        recovered = advanceGameTime(recovered, effect.timeMinutes);
        if (travelWasActive) recovered = cancelTravelSession(recovered);

        if (effect.loseRandomNonKeyItem) {
          const losable = recovered.inventory.find((item) => item.quantity > 0 && item.category !== 'KEY' && item.category !== 'QUEST' && !item.name.includes('열쇠') && !item.name.includes('허가증'));
          if (losable) recovered = { ...recovered, inventory: removeItem(recovered.inventory, losable.equipmentId || losable.id || losable.name, 1).inventory };
        }

        setPlayerState(recovered);
        setIsGameOverModalOpen(false);
        const defeatMsg: GameMessage = {
          id: `defeat-${Date.now()}`,
          role: 'gm',
          content: `☠️ [전투 패배]\n전투 결과는 패배로 확정되었습니다.${rewardLines.length ? `\n\n[처치 결산]\n• ${rewardLines.join('\n• ')}` : ''}\n\n[${aftermath.title}]\n${aftermath.description}${travelWasActive ? '\n\n🗺️ 진행 중이던 여행은 현재 위치에서 중단되었습니다.' : ''}`,
          timestamp: Date.now(),
        };
        const nextMsgs = [...messages, defeatMsg];
        if (rewardApplied.levelUpMessage) nextMsgs.push({ id: `lvl-${Date.now()}`, role: 'system', content: rewardApplied.levelUpMessage, timestamp: Date.now() + 1 });
        setMessages(nextMsgs);
        triggerAutosave(recovered, nextMsgs);
        return;
      }

      let deadState: PlayerState = { ...processedState, hp: 0, activeBattle: null, defeatAdultEvent: null, defeatAftermath: aftermath };
      if (travelWasActive) deadState = cancelTravelSession(deadState);
      setPlayerState(deadState);
      setIsGameOverModalOpen(true);
      const deathMsg: GameMessage = {
        id: `death-${Date.now()}`,
        role: 'gm',
        content: `☠️ [전투 패배 · 사망]\n${aftermath.description}${rewardLines.length ? `\n\n[처치 결산]\n• ${rewardLines.join('\n• ')}` : ''}${aftermath.canUseResurrectionPotion ? `\n\n보유한 [${RESURRECTION_POTION_NAME}]으로 이 전투를 포기하고 생환할 수 있습니다.` : ''}`,
        timestamp: Date.now(),
      };
      const nextMsgs = [...messages, deathMsg];
      setMessages(nextMsgs);
      triggerAutosave(deadState, nextMsgs);
    }
  };

  const handleContinueDefeatEncounter = () => {
    const clearedState = { ...playerState, defeatAftermath: null };
    setPlayerState(clearedState);
    triggerAutosave(clearedState, messages);
  };

  const handleUseResurrectionPotion = () => {
    const aftermath = playerState.defeatAftermath;
    if (!aftermath || aftermath.kind !== 'DEATH' || aftermath.blockedByEliteOrBoss || !aftermath.canUseResurrectionPotion || !hasResurrectionPotion(playerState)) return;
    const resurrectionItem = getResurrectionConsumable(playerState);
    if (!resurrectionItem) return;
    const removed = removeItem(playerState.inventory, resurrectionItem.itemId || resurrectionItem.name, 1);
    if (removed.removedQuantity <= 0) return;
    let revived: PlayerState = {
      ...playerState,
      hp: Math.max(1, Math.round(playerState.maxHp * resurrectionItem.hpRatio)),
      sanity: Math.max(Math.round(playerState.maxSanity * 0.25), playerState.sanity),
      inventory: removed.inventory,
      activeBattle: null,
      defeatAftermath: null,
      storyFlags: Array.from(new Set([...(playerState.storyFlags || []), 'USED_RESURRECTION_POTION_AFTER_DEFEAT'])),
    };
    revived = advanceGameTime(revived, 60);
    revived = dispatchGameEvent(revived, 'ITEM_USED', {
      itemId: resurrectionItem.itemId,
      itemName: resurrectionItem.name,
      quantity: removed.removedQuantity,
    }).nextState;
    setPlayerState(revived);
    setIsGameOverModalOpen(false);
    const msg: GameMessage = {
      id: `revive-outside-${Date.now()}`,
      role: 'gm',
      content: `🧪 [${resurrectionItem.name}]\n전투의 패배 자체는 되돌리지 않았습니다. 물약의 힘으로 마지막 순간 전장에서 이탈해 목숨을 건졌습니다.\n• HP ${revived.hp}/${revived.maxHp}\n• ${resurrectionItem.name} x1 소모`,
      timestamp: Date.now(),
    };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    triggerAutosave(revived, nextMsgs);
  };

  const handleSkillUsed = (skillId: string) => {
    setPlayerState((prev) => addSkillMastery(prev, skillId, 1));
  };

  const handleEnterSettlement = (settlementId: string) => {
    const next = sanitizePlayerState(markSettlementVisited(playerState, settlementId));
    setPlayerState(next);
    setActiveSettlementId(settlementId);
    setIsWorldMapOpen(false);
    setIsSettlementOpen(true);
    triggerAutosave(next, messages);
  };

  const handleStayAtInn = (rate: InnRateDefinition) => {
    if (!activeSettlementId) { showToast('현재 정착지 정보를 찾을 수 없습니다.', 'error'); return; }
    const quote = getInnStayQuote(playerState, activeSettlementId, rate);
    if (playerState.rupees < quote.price) { showToast('루피가 부족합니다.', 'error'); return; }
    let next = advanceGameTime({ ...playerState, rupees: playerState.rupees - quote.price }, rate.minutes);
    const ratio = Math.max(0, Math.min(1, rate.recoveryRatio));
    next = {
      ...next,
      hp: Math.min(next.maxHp, Math.max(next.hp, Math.round(next.hp + (next.maxHp - next.hp) * ratio))),
      sanity: Math.min(next.maxSanity, Math.max(next.sanity, Math.round(next.sanity + (next.maxSanity - next.sanity) * ratio))),
      mana: Math.min(next.maxMana, Math.max(next.mana, Math.round(next.mana + (next.maxMana - next.mana) * ratio))),
    };
    next = recordInnStay(next, activeSettlementId);
    next = sanitizePlayerState(next);
    setPlayerState(next);
    showToast(`${rate.name}에서 휴식했습니다.${quote.discountRate > 0 ? ` 단골 할인 ${Math.round(quote.discountRate * 100)}% 적용.` : ''}`, 'success');
    triggerAutosave(next, messages);
  };

  const handleWorldRoutePreference = (preference: RoutePreference) => {
    setPlayerState((prev) => ({ ...prev, worldMap: { ...prev.worldMap, routePreference: preference } }));
  };

  const handleWorldTravel = (route: WorldRouteResult) => {
    if (!route.found || route.tileIds.length < 2) return;
    if (playerState.worldMap.travelSession?.active) {
      showToast('이미 목적지로 이동 중입니다. 현재 여행을 먼저 마쳐 주세요.', 'error');
      return;
    }
    if (playerState.activeBattle || playerState.activeEncounterId) {
      showToast('현재 진행 중인 전투 또는 인카운터를 먼저 해결해야 이동할 수 있습니다.', 'error');
      return;
    }

    const session = createTravelSession(playerState, route);
    if (!session) {
      showToast('여행 경로를 시작할 수 없습니다.', 'error');
      return;
    }

    let next = attachTravelSession(playerState, session);
    const activated = activateCurrentTravelEncounter(next);
    next = activated.nextState;

    const destination = WORLD_HEX_TILES[session.destinationHexId];
    const travelStartMessage: GameMessage = {
      id: `travel-start-${Date.now()}`,
      role: 'system',
      content: `🗺️ [여행 시작]
목적지: ${destination?.locationName || destination?.featureName || destination?.sectorName || session.destinationHexId}
• 거리 ${session.totalHexSteps} Hex
• 여행 인카운터 ${session.encounters.length}회 (각 Hex에 진입한 상태로 ${session.encountersPerHex}회씩 진행)
• 예상 이동 시간 ${session.totalMinutes}분 · 평균 위험 ${session.averageDanger}${session.travelMode === 'FLIGHT' ? `\n• 이동 방식: 직접 비행` : session.travelMode === 'AIRSHIP' ? `\n• 이동 방식: 비행정` : ''}`,
      timestamp: Date.now(),
    };
    const firstStepMessage: GameMessage | undefined = activated.movedToHexId ? {
      id: `travel-step-${Date.now() + 1}`,
      role: 'system',
      content: `🗺️ [여행 진행]\n${WORLD_HEX_TILES[activated.movedToHexId]?.locationName || WORLD_HEX_TILES[activated.movedToHexId]?.sectorName || '다음 Hex'}에 실제로 진입했습니다. 이 Hex에서 첫 여행 인카운터가 진행됩니다.${(activated.fuelSpent || 0) > 0 ? `\n• 비행정 연료 ${activated.fuelSpent} 소비` : ''}`,
      timestamp: Date.now() + 1,
    } : undefined;
    const nextMsgs = [...messages, travelStartMessage, ...(firstStepMessage ? [firstStepMessage] : []), ...(activated.message ? [activated.message] : [])];
    setPlayerState(next);
    setMessages(nextMsgs);
    setIsWorldMapOpen(false);
    triggerAutosave(next, nextMsgs);
  };

  const handleGatherLifeResources = (tileId: string) => {
    if (playerState.worldMap.travelSession?.active) { showToast('여행 중에는 현재 Hex의 생활 행동을 할 수 없습니다.', 'error'); return; }
    const tile = WORLD_HEX_TILES[tileId];
    if (!tile || playerState.worldMap.currentHexId !== tileId) { showToast('현재 Hex에서만 채집할 수 있습니다.', 'error'); return; }
    const result = gatherLifeResources(playerState, tile);
    if (!result.success) { showToast(result.message, 'error'); return; }
    let next = advanceGameTime(result.nextState, result.minutes);
    for (const item of result.items) next = dispatchGameEvent(next, 'RESOURCE_GATHERED', { gatheredMaterialId:item.id, gatheredMaterialName:item.name, itemId:item.id, itemName:item.name, quantity:item.quantity }).nextState;
    setPlayerState(next);
    const msg:GameMessage={id:`gather-${Date.now()}`,role:'system',content:`🌿 [생활 채집] ${result.message}
• ${result.minutes}분 경과`,timestamp:Date.now()};
    const nextMsgs=[...messages,msg];setMessages(nextMsgs);triggerAutosave(next,nextMsgs);
  };

  const handleWaystationTravel = (wr: WaystationRoute) => {
    if (playerState.worldMap.travelSession?.active || playerState.activeBattle || playerState.activeEncounterId) { showToast('현재 여행·전투·인카운터를 먼저 해결해야 역참을 이용할 수 있습니다.', 'error'); return; }
    const cur = WORLD_HEX_TILES[playerState.worldMap.currentHexId]; const currentWs = cur?.layer === 'SURFACE' ? getWaystationAt(cur.q, cur.r) : undefined;
    if (!currentWs || (wr.from !== currentWs.id && wr.to !== currentWs.id)) { showToast('해당 역참 노선의 출발지에 있어야 합니다.', 'error'); return; }
    if (playerState.rupees < wr.fare) { showToast('역참 통행료가 부족합니다.', 'error'); return; }
    const dest = getWaystationDestination(wr,currentWs.id); if(!dest) return;
    const destId=`SURFACE:${dest.q}:${dest.r}`; const tile=WORLD_HEX_TILES[destId]; if(!tile)return;
    let next=advanceGameTime({...playerState,rupees:playerState.rupees-wr.fare,worldMap:{...playerState.worldMap,currentHexId:destId,currentRegionId:dest.regionId,currentLayer:'SURFACE',exploredHexIds:Array.from(new Set([...(playerState.worldMap.exploredHexIds||[]),destId])),discoveredHexIds:Array.from(new Set([...(playerState.worldMap.discoveredHexIds||[]),destId])),discoveredWaystationIds:Array.from(new Set([...(playerState.worldMap.discoveredWaystationIds||[]),dest.id])),lastSelectedHexId:destId,mapRevision:(playerState.worldMap.mapRevision||0)+1}},wr.minutes);
    next=revealAround(next,destId,1);
    next=dispatchGameEvent(next,'LOCATION_ENTERED',{locationId:`WAYSTATION_${dest.id.toUpperCase()}`,locationName:dest.name,location:destId}).nextState;
    next=dispatchGameEvent(next,'WAYSTATION_USED',{waystationId:currentWs.id,waystationDestinationId:dest.id}).nextState;
    const special=rollWaystationSpecialEncounter(next,wr,Date.now()%100000);
    if (special) next = dispatchGameEvent(next,'ENCOUNTER_STARTED',{encounterId:special.id}).nextState;
    setPlayerState(next);
    const msg:GameMessage={id:`waystation-${Date.now()}`,role:'system',content:`🛞 [역참 이동] ${currentWs.name} → ${dest.name}
• 통행료 ${wr.fare} 루피 · ${wr.minutes}분
${special?`• 특수 인카운터: ${special.name} — ${special.text}`:'• 특별한 사건 없이 보호 노선을 통과했습니다.'}`,timestamp:Date.now()};
    const nextMsgs=[...messages,msg];setMessages(nextMsgs);setIsWorldMapOpen(false);triggerAutosave(next,nextMsgs);
  };

  const handleBuildAirship = () => { const res=buildAirship(playerState); if(!res.ok){showToast(res.message,'error');return;} let next=dispatchGameEvent(res.state,'AIRSHIP_BUILT',{airshipLevel:res.state.airship.level}).nextState;setPlayerState(next);showToast(res.message,'success');triggerAutosave(next,messages); };
  const handleUpgradeAirship = (id:string) => { const res=upgradeAirship(playerState,id);if(!res.ok){showToast(res.message,'error');return;}let next=dispatchGameEvent(res.state,'AIRSHIP_UPGRADED',{airshipLevel:res.state.airship.level}).nextState;setPlayerState(next);showToast(res.message,'success');triggerAutosave(next,messages); };
  const handleRefuelAirship = (id:'aether_fuel_cell'|'storm_fuel_cell') => {const res=refuelAirship(playerState,id,1);if(!res.ok){showToast(res.message,'error');return;}let next=dispatchGameEvent(res.state,'ITEM_USED',{itemId:id,itemName:res.itemName,quantity:res.consumedCount}).nextState;setPlayerState(next);showToast(res.message,'success');triggerAutosave(next,messages);};

  const handleEnterDungeon = (dungeonId: string) => {
    if (playerState.worldMap.travelSession?.active) { showToast('여행 중에는 던전에 입장할 수 없습니다.', 'error'); return; }
    const dungeon = WORLD_DUNGEON_DATABASE[dungeonId];
    const currentTile = WORLD_HEX_TILES[playerState.worldMap.currentHexId];
    if (!dungeon || !currentTile || currentTile.dungeonId !== dungeonId) {
      showToast('던전 입구가 있는 Hex까지 이동해야 입장할 수 있습니다.', 'error');
      return;
    }
    setActiveDungeonId(dungeonId);
    setIsWorldMapOpen(false);
    setIsDungeonOpen(true);
  };

  const handleMineOreVein = (tileId: string) => {
    if (playerState.worldMap.travelSession?.active) { showToast('여행 중에는 광맥을 채굴할 수 없습니다.', 'error'); return; }
    if (playerState.worldMap.currentHexId !== tileId) {
      showToast('광맥이 있는 Hex까지 이동해야 채굴할 수 있습니다.', 'error');
      return;
    }
    const result = mineWorldOreVein(playerState, tileId);
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }
    // 광맥 채굴도 일반 채집과 동일하게 퀘스트/Fate 이벤트를 발생시킨다.
    // 실제로 획득된 각 아이템 수량만 반영한 뒤 시간을 진행한다.
    let gatheredState = result.nextState;
    for (const item of result.items) {
      gatheredState = dispatchGameEvent(gatheredState, 'RESOURCE_GATHERED', {
        gatheredMaterialId: item.id,
        gatheredMaterialName: item.name,
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
      }).nextState;
    }
    const next = advanceGameTime(gatheredState, result.minutes);
    setPlayerState(next);
    const msg: GameMessage = {
      id: `mine-${Date.now()}`,
      role: 'system',
      content: `⛏️ [광맥 채굴]
${result.message}
• 소요 시간 ${result.minutes}분`,
      timestamp: Date.now(),
    };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    triggerAutosave(next, nextMsgs);
  };

  const handleDungeonLog = (text: string) => {
    const msg: GameMessage = { id: `dungeon-${Date.now()}`, role: 'system', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, msg]);
  };

  const handleAllocateStat = (statKey: keyof PlayerStats) => {
    const res = allocateStatPoint(playerState, statKey);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleUseItem = (itemName: string) => {
    const res = useInventoryItem(playerState, itemName);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleDiscardItem = (itemNameOrId: string, quantity: number = 1) => {
    const res = discardInventoryItem(playerState, itemNameOrId, quantity);
    setPlayerState(res.nextState);
    let nextMsgs = messages;
    if (res.message) {
      const msg: GameMessage = {
        id: `item-discard-${Date.now()}`,
        role: 'gm',
        content: res.message,
        timestamp: Date.now(),
      };
      nextMsgs = [...messages, msg];
      setMessages(nextMsgs);
    }
    triggerAutosave(res.nextState, nextMsgs);
  };

  const handleEquipItem = (slot: EquipmentSlot, equipmentId: string) => {
    const res = equipItemToSlot(playerState, slot, equipmentId);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    const res = unequipItemFromSlot(playerState, slot);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleEnhanceEquipment = (equipmentId: string) => {
    const res = enhanceEquipment(playerState, equipmentId);
    setPlayerState(res.nextState);
    let nextMsgs = messages;
    if (res.message) {
      const msg: GameMessage = { id: `equipment-enhance-${Date.now()}`, role: 'gm', content: res.message, timestamp: Date.now() };
      nextMsgs = [...messages, msg];
      setMessages(nextMsgs);
    }
    triggerAutosave(res.nextState, nextMsgs);
  };

  const handleSocketEquipmentRuneword = (equipmentId: string, milestone: EquipmentEnhancementMilestone, runeword: RunewordType) => {
    const res = socketEquipmentRuneword(playerState, equipmentId, milestone, runeword);
    setPlayerState(res.nextState);
    let nextMsgs = messages;
    if (res.message) {
      const msg: GameMessage = { id: `equipment-rune-${Date.now()}`, role: 'gm', content: res.message, timestamp: Date.now() };
      nextMsgs = [...messages, msg];
      setMessages(nextMsgs);
    }
    triggerAutosave(res.nextState, nextMsgs);
  };

  const handleEquipBag = (bagId: string) => {
    const res = equipBagToPlayer(playerState, bagId);
    setPlayerState(res.nextState);
    let nextMsgs = messages;
    if (res.message) {
      const msg: GameMessage = {
        id: `bag-equip-${Date.now()}`,
        role: 'gm',
        content: res.message,
        timestamp: Date.now(),
      };
      nextMsgs = [...messages, msg];
      setMessages(nextMsgs);
    }
    triggerAutosave(res.nextState, nextMsgs);
  };

  const handleUnequipBag = () => {
    const res = unequipBagFromPlayer(playerState);
    setPlayerState(res.nextState);
    let nextMsgs = messages;
    if (res.message) {
      const msg: GameMessage = {
        id: `bag-unequip-${Date.now()}`,
        role: 'gm',
        content: res.message,
        timestamp: Date.now(),
      };
      nextMsgs = [...messages, msg];
      setMessages(nextMsgs);
    }
    triggerAutosave(res.nextState, nextMsgs);
  };

  const handleCraftRecipe = (recipeId: string) => {
    const res = craftRecipe(playerState, recipeId);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleSetupCamp = () => {
    const res = setupCamp(playerState);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleUpgradeFacility = (facilityId: CampFacilityType) => {
    const res = upgradeCampFacility(playerState, facilityId);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleCampSleep = () => {
    const res = performCampSleep(playerState);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleReadBook = (bookName: string) => {
    const res = readBookInCamp(playerState, bookName);
    setPlayerState(res.nextState);
    triggerAutosave(res.nextState, messages);
  };

  const handleTransferToCampStorage = (itemNameOrId: string, quantity: number) => {
    const res = transferItemToCampStorage(playerState, itemNameOrId, quantity);
    if (res.success) {
      setPlayerState(res.nextState);
      triggerAutosave(res.nextState, messages);
    }
    return res;
  };

  const handleTransferFromCampStorage = (itemNameOrId: string, quantity: number) => {
    const res = transferItemFromCampStorage(playerState, itemNameOrId, quantity);
    if (res.success) {
      setPlayerState(res.nextState);
      triggerAutosave(res.nextState, messages);
    }
    return res;
  };

  const handleSetCompanionTactic = (companionId: string, tactic: CompanionTactic) => {
    const next = setCompanionTactic(playerState, companionId, tactic);
    setPlayerState(next);
    triggerAutosave(next, messages);
  };

  const handleToggleActiveParty = (companionId: string) => {
    const next = toggleCompanionActiveParty(playerState, companionId);
    setPlayerState(next);
    triggerAutosave(next, messages);
  };

  const appendPetNarrativeAndCommit = async (petId: string, interaction: any, result: { nextState: PlayerState; message: string }) => {
    // React state 갱신 전의 초단기 더블클릭까지 막기 위한 동기 잠금.
    if (petInteractionLockRef.current || isLoading) return;
    petInteractionLockRef.current = true;
    setIsPetInteractionLoading(true);
    setIsLoading(true);
    const pet = playerState.companions.find((c) => c.id === petId && c.kind === 'PET' && c.petState);
    if (!pet) { petInteractionLockRef.current = false; setIsPetInteractionLoading(false); setIsLoading(false); return; }
    try {
      const speciesId = pet.petState!.speciesId;
      const def = getPetSpeciesDefinition(speciesId);
      const isTame = interaction?.type === 'TAME';
      const phase = interaction?.phase || 'REQUEST';
      const need = interaction?.need === 'BATHROOM' ? 'BATHROOM' : 'DESIRE';
      const pool = isTame ? getPetTameReferencePool(speciesId) : getPetUserReferencePool(speciesId, need, phase);
      const reference = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
      const narration = await requestNarration({
        requestId: `pet-${pet.id}-${Date.now()}`,
        locale: 'ko-KR',
        sceneType: isTame ? 'PET_TAME' : `PET_NEED_${phase}`,
        playerAction: isTame ? '길들이기' : phase === 'ACCEPTED' ? '욕구 해소 요청 수락' : phase === 'REFUSED' ? '욕구 해소 요청 거절' : phase === 'REFUSAL_LIMIT' ? '반복 거절 한계 후속 요청' : '욕구 해소 요청',
        participants: [{
          id: pet.id, name: pet.name, role: `${def?.displayName || pet.name} · ${def?.category === 'INSECT' ? '곤충형' : '동물형'} 펫`,
          stateSummary: `친밀도 ${pet.petState!.relationship?.familiarity ?? 0}, 충성도 ${pet.petState!.relationship?.loyalty ?? 0}, 야생성 ${pet.petState!.wildness ?? 0}`,
        }],
        lockedFacts: [result.message],
        referenceTexts: reference ? [reference] : [],
        desiredLength: 'MEDIUM',
      });
      if (!narration?.text?.trim()) throw new Error('펫 상호작용 로그 생성 실패');
      const logMessage: GameMessage = { id: `pet-log-${Date.now()}`, role: 'gm', content: normalizeNarrativeText(narration.text), timestamp: Date.now() };
      const committedState = interaction?.requestId ? { ...result.nextState, companionNeedQueue: (result.nextState.companionNeedQueue || []).filter((cue) => cue.requestId !== interaction.requestId) } : result.nextState;
      const nextMessages = [...messages, logMessage];
      setPlayerState(committedState);
      setMessages(nextMessages);
      triggerAutosave(committedState, nextMessages);
    } catch (error:any) {
      const err: GameMessage = { id:`pet-log-error-${Date.now()}`, role:'system', content:`펫 상호작용 로그를 생성하지 못해 행동이 적용되지 않았습니다. ${error?.message || ''}`, timestamp:Date.now(), status:'error' };
      setMessages((prev) => [...prev, err]);
    } finally {
      petInteractionLockRef.current = false;
      setIsPetInteractionLoading(false);
      setIsLoading(false);
    }
  };

  const handleRespondPetRequest = async (petId: string, response: 'ACCEPT' | 'REFUSE') => {
    if (playerState.equippedPetId !== petId) return;
    const before = playerState.companions.find((c) => c.id === petId && c.kind === 'PET' && c.petState)?.petState?.requestState;
    const result = respondPetRequest(playerState, petId, response);
    await appendPetNarrativeAndCommit(petId, { type:'NEED_RESPONSE', need:before?.activeNeed, requestId:before?.requestId, phase: response === 'ACCEPT' ? 'ACCEPTED' : (result.nextState.companionNeedQueue || []).find((q) => q.requestId === before?.requestId)?.phase || 'REFUSED' }, result);
  };

  const handlePetCare = async (petId: string, action: import('./types').PetCareAction) => {
    if (playerState.equippedPetId !== petId) return;
    const result = careForPet(playerState, petId, action);
    if (action === 'TAME') await appendPetNarrativeAndCommit(petId, { type:'TAME' }, result);
    else { setPlayerState(result.nextState); triggerAutosave(result.nextState, messages); }
  };

  const handleFeedPet = (petId: string, itemId: string) => {
    if (playerState.equippedPetId !== petId) return;
    const result = feedPet(playerState, petId, itemId);
    setPlayerState(result.nextState);
    triggerAutosave(result.nextState, messages);
  };

  const handleUpgradePetMetabolism = (petId: string) => {
    if (playerState.equippedPetId !== petId) return;
    const result = upgradePetMetabolismPerk(playerState, petId);
    setPlayerState(result.nextState);
    const log: GameMessage = { id:`pet-metabolism-${Date.now()}`, role:'system', content:result.message, timestamp:Date.now() };
    const nextMessages = [...messages, log];
    setMessages(nextMessages);
    triggerAutosave(result.nextState, nextMessages);
  };

  const handlePetBattleCommandOutcome = (petId: string, outcome: 'OBEY' | 'INDEPENDENT' | 'FAIL') => {
    setPlayerState((prev) => recordPetBattleCommandOutcome(prev, petId, outcome));
  };

  const handleSetEquippedPet = (petId: string | null) => {
    const result = setEquippedPet(playerState, petId);
    setPlayerState(result.nextState);
    triggerAutosave(result.nextState, messages);
  };

  const handleMajorCharacterTalk = (characterId: string) => {
    const c = playerState.majorCharacters?.[characterId];
    if (!c) return;
    const result = interactWithCharacter(playerState, characterId, 'TALKED', c.name);
    const next = sanitizePlayerState(result.nextState);
    setPlayerState(next);
    const updated = next.majorCharacters?.[characterId];
    const intentNote = updated?.memoryFlags?.betrayalTriggered && !c.memoryFlags?.betrayalTriggered
      ? `\n⚠️ ${updated.name}의 숨겨진 악의가 드러났습니다.`
      : '';
    const msg: GameMessage = { id: `major-talk-${Date.now()}`, role: 'system', content: `${result.message}${intentNote}`, timestamp: Date.now() };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    triggerAutosave(next, nextMsgs);
  };

  const handleMajorCharacterRecruit = (characterId: string) => {
    const result = recruitMajorCharacter(playerState, characterId);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    const c = result.state.majorCharacters?.[characterId];
    let next = dispatchGameEvent(result.state, 'CHARACTER_RECRUITED', { characterId, characterName: c?.name }).nextState;
    next = sanitizePlayerState(next);
    setPlayerState(next);
    showToast(result.message, 'success');
    const msg: GameMessage = { id: `major-recruit-${Date.now()}`, role: 'system', content: `🤝 ${result.message}`, timestamp: Date.now() };
    const nextMsgs = [...messages, msg]; setMessages(nextMsgs); triggerAutosave(next, nextMsgs);
  };

  const handleMajorCharacterGift = (characterId: string, itemNameOrId: string) => {
    const res = useInventoryItem(playerState, itemNameOrId, characterId);
    if (!res.success) { showToast(res.message, 'error'); return; }
    const next = sanitizePlayerState(res.nextState);
    setPlayerState(next);
    showToast(res.message, 'success');
    const msg: GameMessage = { id: `major-gift-${Date.now()}`, role: 'system', content: `🎁 ${res.message}`, timestamp: Date.now() };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    triggerAutosave(next, nextMsgs);
  };

  const handleAcceptQuest = (questId: string) => {
    const res = acceptQuest(playerState, questId);
    if (res.success) {
      setPlayerState(res.nextState);
      let nextMsgs = messages;
      if (res.systemMessages && res.systemMessages.length > 0) {
        const sysMsgs: GameMessage[] = res.systemMessages.map((content) => ({
          id: crypto.randomUUID(),
          role: 'system' as const,
          content,
          timestamp: Date.now(),
        }));
        nextMsgs = [...messages, ...sysMsgs];
        setMessages(nextMsgs);
      }
      triggerAutosave(res.nextState, nextMsgs);
    }
  };

  const handleDeclineQuest = (questId: string) => {
    const res = declineQuest(playerState, questId);
    if (res.success) {
      setPlayerState(res.nextState);
      triggerAutosave(res.nextState, messages);
    }
  };

  const handleStartNewCharacter = () => {
    setIsNewGameOpen(false);
    setIsGameOverModalOpen(false);
    setIsCharacterCreationOpen(true);
  };

  const handleCharacterCreationComplete = (createdState: PlayerState) => {
    const sanitized = sanitizePlayerState(createdState);
    setPlayerState(sanitized);
    const prologue = generatePrologueMessage(sanitized);
    const initialMsgs = [prologue];
    setMessages(initialMsgs);
    setIsCharacterCreationOpen(false);
    setCurrentScreen('game');

    // Create initial AUTOSAVE when first valid character is created
    triggerAutosave(sanitized, initialMsgs);
  };

  const handleRestartWithCurrentCharacter = () => {
    const freshState = createNewPlayerState(
      playerState.profile,
      playerState.baseStats,
      0,
      true
    );
    const sanitized = sanitizePlayerState(freshState);
    setPlayerState(sanitized);
    const prologue = generatePrologueMessage(sanitized);
    const initialMsgs = [prologue];
    setMessages(initialMsgs);
    setIsNewGameOpen(false);
    setIsGameOverModalOpen(false);
    setCurrentScreen('game');
    triggerAutosave(sanitized, initialMsgs);
  };

  const handleOpenLoadModalFromTitle = () => {
    setSaveModalMode('load_only');
    setIsSaveModalOpen(true);
  };

  const handleOpenSaveModalInGame = () => {
    setSaveModalMode('manage');
    setIsSaveModalOpen(true);
  };

  const handleLoadSave = (gameData: GameSaveData) => {
    const sanitized = sanitizePlayerState(gameData.playerState);
    setPlayerState(sanitized);
    setMessages(gameData.messages || []);
    setIsSaveModalOpen(false);
    setIsCharacterCreationOpen(false);
    setIsNewGameOpen(false);
    setIsGameOverModalOpen(false);
    setCurrentScreen('game');
  };

  const handleGoToTitle = () => {
    setCurrentScreen('title');
  };

  return (
    <div className="fixed inset-0 flex flex-col w-full h-full bg-stone-950 text-stone-100 overflow-hidden select-text">
      {/* Toast Floating Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-amber-500/50 text-stone-100 text-xs font-semibold shadow-2xl shadow-black/80 animate-ui-pop-in">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {currentScreen === 'title' ? (
        <MainTitleScreen
          onOpenLoadModal={handleOpenLoadModalFromTitle}
          onStartNewGame={() => setIsCharacterCreationOpen(true)}
        />
      ) : playerState.activeBattle ? (
        /* 전용 턴제 전투 화면 */
        <CombatScreen
          playerState={playerState}
          battleState={playerState.activeBattle}
          onUpdateBattle={handleUpdateBattle}
          onConsumeCombatItem={handleConsumeCombatItem}
          onUpdateCompanionSettings={handleCompanionCombatSettings}
          onBattleEnd={handleBattleEnd}
          onSkillUsed={handleSkillUsed}
          onPetCommandOutcome={handlePetBattleCommandOutcome}
        />
      ) : (
        <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
          {/* Top Status Header with Level, Gauges, Currency, Save/Load */}
          <StatusHeader
            playerState={playerState}
            isLoading={isLoading}
            onReset={() => setIsNewGameOpen(true)}
            onOpenStatus={() => setIsStatusOpen(true)}
            onGoToTitle={handleGoToTitle}
            onOpenSaveModal={handleOpenSaveModalInGame}
          />

          {/* Main Story Log */}
          <StoryLog
            messages={messages}
            isLoading={isLoading}
            isGameOver={isGameOver}
            gameOverReason={gameOverReason}
            onRetry={handleSendAction}
            onStartBattle={handleStartPendingBattle}
            onOpenGameOverModal={() => setIsGameOverModalOpen(true)}
            onStartNewCharacter={handleStartNewCharacter}
            onRestartWithCurrentCharacter={handleRestartWithCurrentCharacter}
          />

          {/* Bottom Free-form Action Input with Character Floating Menu */}
          <ActionInput
            onSendAction={handleSendAction}
            isLoading={isLoading || isPetInteractionLoading}
            isGameOver={isGameOver}
            characterMenu={
              <CharacterFloatingMenu
                playerState={playerState}
                onOpenStatus={() => setIsStatusOpen(true)}
                onOpenStats={() => setIsStatsOpen(true)}
                onOpenInternalStatus={() => setIsInternalStatusOpen(true)}
                onOpenTalents={() => setIsTalentsOpen(true)}
                onOpenClass={() => setIsClassOpen(true)}
                onOpenSkillTree={() => setIsSkillTreeOpen(true)}
                onOpenWorldMap={() => setIsWorldMapOpen(true)}
                onOpenProfessions={() => setIsProfessionsOpen(true)}
                onOpenInventory={() => setIsInventoryOpen(true)}
                onOpenEquipment={() => setIsEquipmentOpen(true)}
                onOpenCrafting={() => setIsCraftingOpen(true)}
                onOpenQuests={() => { setPlayerState((prev) => acknowledgeQuestAlerts(prev)); setIsQuestOpen(true); }}
                onOpenFate={() => setIsFateOpen(true)}
                onOpenCamp={() => setIsCampOpen(true)}
                onOpenCompanions={() => setIsCompanionsOpen(true)}
                onOpenMajorCharacters={() => setIsMajorCharactersOpen(true)}
                hideAdventureFab={hasBlockingOverlay}
              />
            }
          />
        </div>
      )}

      {/* Save / Load Slot Modal */}
      <SaveSlotModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        mode={saveModalMode}
        currentGameData={
          playerState.isCharacterCreated ? { playerState, messages } : null
        }
        onLoadSave={handleLoadSave}
        onShowToast={showToast}
      />

      {/* New Game Options Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
        onStartNewCharacter={handleStartNewCharacter}
        onRestartWithCurrentCharacter={handleRestartWithCurrentCharacter}
        playerState={playerState}
      />

      {/* Post-defeat encounter: normal battles can continue through a world consequence instead of immediate game over. */}
      {playerState.defeatAftermath && playerState.defeatAftermath.kind !== 'DEATH' && (
        <DefeatEncounterModal
          isOpen={true}
          playerState={playerState}
          aftermath={playerState.defeatAftermath}
          onContinue={handleContinueDefeatEncounter}
        />
      )}

      {/* Game Over Demise Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen && isGameOver}
        playerState={playerState}
        onStartNewCharacter={handleStartNewCharacter}
        onRestartWithCurrentCharacter={handleRestartWithCurrentCharacter}
        canUseResurrectionPotion={Boolean(playerState.defeatAftermath?.kind === 'DEATH' && playerState.defeatAftermath.canUseResurrectionPotion && !playerState.defeatAftermath.blockedByEliteOrBoss)}
        resurrectionBlockedReason={playerState.defeatAftermath?.blockedByEliteOrBoss ? '엘리트·보스 전투는 부활의 물약으로 건너뛸 수 없습니다.' : undefined}
        onUseResurrectionPotion={handleUseResurrectionPotion}
      />

      {/* Character Creation Modal */}
      <CharacterCreationModal
        isOpen={isCharacterCreationOpen}
        onComplete={handleCharacterCreationComplete}
        onCancel={() => {
          setIsCharacterCreationOpen(false);
        }}
        isInitialGame={!playerState.isCharacterCreated}
      />

      {/* Status Modal */}
      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        playerState={playerState}
        onOpenStats={() => {
          setIsStatusOpen(false);
          setIsStatsOpen(true);
        }}
      />

      {/* Internal Status Modal */}
      <InternalStatusModal
        isOpen={isInternalStatusOpen}
        onClose={() => setIsInternalStatusOpen(false)}
        playerState={playerState}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        playerState={playerState}
        onAllocateStat={handleAllocateStat}
      />

      {/* Talent Tree Modal */}
      {isTalentsOpen && (
        <TalentTreeModal
          playerState={playerState}
          onUpdatePlayer={(updated) => setPlayerState(sanitizePlayerState(updated))}
          onClose={() => setIsTalentsOpen(false)}
        />
      )}

      {/* Class & Evolution Modal */}
      {isClassOpen && (
        <ClassModal
          playerState={playerState}
          onUpdatePlayer={(updated) => setPlayerState(updated)}
          onClose={() => setIsClassOpen(false)}
        />
      )}

      {isSkillTreeOpen && (
        <SkillTreeModal
          playerState={playerState}
          onUpdatePlayer={(updated) => setPlayerState(sanitizePlayerState(updated))}
          onClose={() => setIsSkillTreeOpen(false)}
        />
      )}

      <WorldMapModal
        isOpen={isWorldMapOpen}
        playerState={playerState}
        onClose={() => setIsWorldMapOpen(false)}
        onTravel={handleWorldTravel}
        onChangePreference={handleWorldRoutePreference}
        onEnterDungeon={handleEnterDungeon}
        onMine={handleMineOreVein}
        onGather={handleGatherLifeResources}
        onWaystationTravel={handleWaystationTravel}
        onBuildAirship={handleBuildAirship}
        onUpgradeAirship={handleUpgradeAirship}
        onRefuelAirship={handleRefuelAirship}
        onEnterSettlement={handleEnterSettlement}
      />

      <SettlementModal
        isOpen={isSettlementOpen}
        settlementId={activeSettlementId}
        playerState={playerState}
        onClose={() => { setIsSettlementOpen(false); setActiveSettlementId(undefined); }}
        onUpdatePlayer={(updated) => {
          const safe = sanitizePlayerState(updated);
          setPlayerState(safe);
          triggerAutosave(safe, messages);
        }}
        onStayAtInn={handleStayAtInn}
        onAcceptQuest={handleAcceptQuest}
        onToast={(message, kind) => showToast(message, kind || 'info')}
      />

      <DungeonExplorerModal
        isOpen={isDungeonOpen}
        dungeonId={activeDungeonId}
        playerState={playerState}
        onClose={() => setIsDungeonOpen(false)}
        onUpdatePlayer={(updated) => {
          const safe = sanitizePlayerState(updated);
          setPlayerState(safe);
          if (safe.activeBattle) setIsDungeonOpen(false);
        }}
        onLog={handleDungeonLog}
      />

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        playerState={playerState}
        onUseItem={handleUseItem}
        onEquipBag={handleEquipBag}
        onUnequipBag={handleUnequipBag}
        onDiscardItem={handleDiscardItem}
      />

      {/* 13슬롯 장비 관리 모달 */}
      {isEquipmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
          <div className="relative w-full max-w-5xl bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-stone-800 bg-stone-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-100 tracking-wide">
                    캐릭터 장비
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    {playerState.characterName || '모험가'} · 13슬롯 전투 장비 및 가방
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEquipmentOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 active:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <EquipmentTab
                playerState={playerState}
                onEquipItem={handleEquipItem}
                onUnequipItem={handleUnequipItem}
                onEquipBag={handleEquipBag}
                onUnequipBag={handleUnequipBag}
                onEnhanceEquipment={handleEnhanceEquipment}
                onSocketRuneword={handleSocketEquipmentRuneword}
              />
            </div>
          </div>
        </div>
      )}

      {/* 생활 전문 직업/기술 모달 */}
      {isProfessionsOpen && (
        <LifeSkillsModal
          playerState={playerState}
          onClose={() => {
            setIsProfessionsOpen(false);
            if (campReturnTarget === 'professions') {
              setCampReturnTarget(null);
              setIsCampOpen(true);
            }
          }}
          onUpdateState={(updater) => setPlayerState(updater)}
          onAddLogMessage={(msg) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-lifeskill-${Date.now()}`,
                role: 'gm',
                content: msg,
                timestamp: Date.now(),
              },
            ]);
          }}
        />
      )}

      {/* 독립 제작 모달 */}
      {isCraftingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
          <div className="relative w-full max-w-5xl bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-3">
                제작 센터
                <button
                  onClick={() => setIsBlacksmithOpen(true)}
                  className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-semibold hover:bg-amber-900/80 transition"
                >
                  ⚒️ 대장 작업장
                </button>
                <button
                  onClick={() => setIsAlchemyOpen(true)}
                  className="px-2.5 py-1 rounded bg-purple-950/60 border border-purple-800/80 text-purple-300 text-xs font-semibold hover:bg-purple-900/80 transition"
                >
                  🧪 연금 조제실
                </button>
              </h2>
              <button onClick={()=>setIsCraftingOpen(false)} className="p-1 text-stone-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto"><CraftingTab playerState={playerState} onCraftRecipe={handleCraftRecipe}/></div>
          </div>
        </div>
      )}

      {/* 대장 작업장 & 금속 제련소 모달 */}
      {isBlacksmithOpen && (
        <BlacksmithWorkshopModal
          playerState={playerState}
          onClose={() => {
            setIsBlacksmithOpen(false);
            if (campReturnTarget === 'blacksmith') {
              setCampReturnTarget(null);
              setIsCampOpen(true);
            }
          }}
          onUpdateState={(updater) => setPlayerState(updater)}
          onAddLogMessage={(msg) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-smith-${Date.now()}`,
                role: 'gm',
                content: msg,
                timestamp: Date.now(),
              },
            ]);
          }}
        />
      )}

      {/* 연금술 아틀리에 & 시약 제조 모달 */}
      {isAlchemyOpen && (
        <AlchemyCraftingModal
          playerState={playerState}
          onClose={() => {
            setIsAlchemyOpen(false);
            if (campReturnTarget === 'alchemy') {
              setCampReturnTarget(null);
              setIsCampOpen(true);
            }
          }}
          onUpdateState={(updater) => setPlayerState(updater)}
          onAddLogMessage={(msg) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-alchemy-${Date.now()}`,
                role: 'gm',
                content: msg,
                timestamp: Date.now(),
              },
            ]);
          }}
        />
      )}

      {/* 야영지 모달 */}
      {isCampOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950/80">
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                모닥불 야영지 & 시설 증축
              </h2>
              <button
                onClick={() => setIsCampOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CampTab
                playerState={playerState}
                onSetupCamp={handleSetupCamp}
                onUpgradeFacility={handleUpgradeFacility}
                onCampSleep={handleCampSleep}
                onReadBook={handleReadBook}
                onTransferToStorage={handleTransferToCampStorage}
                onTransferFromStorage={handleTransferFromCampStorage}
                onUpdateState={(updater) => setPlayerState(updater)}
                onAddLogMessage={(msg) => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `msg-camp-${Date.now()}`,
                      role: 'gm',
                      content: msg,
                      timestamp: Date.now(),
                    },
                  ]);
                }}
                onOpenBlacksmith={() => {
                  setCampReturnTarget('blacksmith');
                  setIsCampOpen(false);
                  setIsBlacksmithOpen(true);
                }}
                onOpenAlchemy={() => {
                  setCampReturnTarget('alchemy');
                  setIsCampOpen(false);
                  setIsAlchemyOpen(true);
                }}
                onOpenProfessions={() => {
                  setCampReturnTarget('professions');
                  setIsCampOpen(false);
                  setIsProfessionsOpen(true);
                }}
                onOpenCompanions={() => {
                  setCampReturnTarget('companions');
                  setIsCampOpen(false);
                  setIsCompanionsOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 동료 관리 모달 */}
      {isCompanionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950/80">
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                파티 동행자 관리 & 전투 전술
              </h2>
              <button
                onClick={() => {
                  setIsCompanionsOpen(false);
                  if (campReturnTarget === 'companions') {
                    setCampReturnTarget(null);
                    setIsCampOpen(true);
                  }
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CompanionsTab
                playerState={playerState}
                onSetCompanionTactic={handleSetCompanionTactic}
                onToggleActiveParty={handleToggleActiveParty}
                onRespondPetRequest={handleRespondPetRequest}
                onPetCare={handlePetCare}
                onFeedPet={handleFeedPet}
                onUpgradePetMetabolism={handleUpgradePetMetabolism}
                petInteractionLoading={isPetInteractionLoading}
                onSetEquippedPet={handleSetEquippedPet}
              />
            </div>
          </div>
        </div>
      )}


      <MajorCharactersModal
        isOpen={isMajorCharactersOpen}
        playerState={playerState}
        onClose={() => setIsMajorCharactersOpen(false)}
        onTalk={handleMajorCharacterTalk}
        onRecruit={handleMajorCharacterRecruit}
        onGift={handleMajorCharacterGift}
      />

      {/* 퀘스트 일지 모달 */}
      {isQuestOpen && (
        <QuestModal
          playerState={playerState}
          onClose={() => setIsQuestOpen(false)}
          onAcceptQuest={handleAcceptQuest}
          onDeclineQuest={handleDeclineQuest}
        />
      )}


      <FateModal
        isOpen={isFateOpen}
        playerState={playerState}
        onClose={() => setIsFateOpen(false)}
      />
    </div>
  );
}
