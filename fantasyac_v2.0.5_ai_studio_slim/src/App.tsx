import { useState, useEffect } from 'react';
import { GameMessage, PlayerState, PlayerStats } from './types';
import { extractCleanStory, normalizeNarrativeText } from './utils/narrativeSanitizer';
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
  useInventoryItem,
  discardInventoryItem,
  removeItem,
  attemptUnlockLock,
  interactWithCharacter,
  enterLocation,
  acceptQuest,
  declineQuest,
} from './gameEngine';
import { dispatchGameEvent } from './gameEvents';
import { getRaceDefinition } from './data/raceData';
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
import { CraftingTab } from './components/CraftingTab';
import { CampTab } from './components/CampTab';
import { CompanionsTab } from './components/CompanionsTab';
import { MajorCharactersModal } from './components/MajorCharactersModal';
import { QuestModal } from './components/QuestModal';
import { SkillTreeModal } from './components/SkillTreeModal';
import { WorldMapModal } from './components/WorldMapModal';
import { DungeonExplorerModal } from './components/DungeonExplorerModal';
import { BattleState } from './combat/combatTypes';
import type { RoutePreference } from './types';
import { initBattleState } from './combat/battleEngine';
import { createEnemyActor } from './combat/enemyFactory';
import { X, Shield, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { EquipmentSlot, EquipmentEnhancementMilestone, RunewordType } from './data/equipment';
import { CampFacilityType } from './data/camp/campTypes';
import { CompanionTactic } from './types';
import { WORLD_HEX_TILES, revealAround, rollTravelStep, type WorldRouteResult } from './data/world/worldMapSystem';
import { buildAirship, upgradeAirship, refuelAirship, consumeAirshipFuel, airshipFuelCostForDistance } from './data/world/lifeTravelSystem';
import { getWaystationAt, getWaystationDestination, rollWaystationSpecialEncounter, type WaystationRoute } from './data/world/waystationSystem';
import { gatherLifeResources } from './data/world/gatheringSystem';
import { recruitMajorCharacter } from './data/characters/majorCharacterExpansion';
import { mineWorldOreVein } from './data/world/miningSystem';
import { getDungeonLayout, WORLD_DUNGEON_DATABASE } from './data/dungeons/dungeonSystem';
import { REGIONAL_MONSTERS } from './data/world/monsterData';
import { rollDragonkinHunterTravelEvent, markDragonkinHunterEvent } from './data/dragonkin/dragonkinEncounterSystem';
import { getDefeatAftermathEffect, hasResurrectionPotion, rollDefeatAftermath } from './data/world/defeatEncounterSystem';
import { RESURRECTION_POTION_NAME } from './data/world/monsterLootItems';
import { addSkillMastery, grantNextAdvancedPassiveRecipe, grantPassiveAwakeningStones, grantUniqueActive } from './data/progression/progressionSystem';
import { UNIQUE_ACTIVE_SKILLS } from './data/progression/progressionData';
import {
  checkAndMigrateLegacyLocalStorage,
  triggerDebouncedAutosave,
  GameSaveData,
} from './services/saveService';

function generatePrologueMessage(state: PlayerState): GameMessage {
  const raceDef = getRaceDefinition(state.race || 'HUMAN', state.beastkinType);
  const charName = state.characterName || '모험가';
  const raceTitle = raceDef.subName || raceDef.name;
  const p = state.profile;
  const genderStr = p?.gender ? ` (${p.gender})` : '';

  let prologueText = '';

  if (state.race === 'ELF') {
    prologueText = `고대의 마력이 은은하게 일렁이는 신비로운 숲속, 나뭇잎 사이로 속삭이는 바람 소리와 함께 당신은 눈을 뜹니다.

당신은 [${raceTitle}] ${charName}${genderStr}.
${p?.hairColor ? `${p.hairColor} ${p.hairStyle}` : '단정한 머리칼'} 사이로 숲의 미풍이 스쳐 지나가며, 맑은 ${p?.eyeColor || '신비로운'} 눈동자에 은은한 햇살이 내려앉습니다. 손에는 낡은 가죽 주머니와 숲의 흙먼지가 묻어 있으며, 깊은 숲의 영험한 마력 감각이 온몸에 전해집니다.

당신은 지금 무엇을 하시겠습니까?`;
  } else if (state.race === 'BEASTKIN') {
    const beastDetail =
      state.beastkinType === 'BIRD'
        ? p?.beastFeatures?.hasWings
          ? `${p.beastFeatures.wingColor || ''} 날개와 깃털`
          : '예리한 눈빛'
        : `${p?.beastFeatures?.earColor || ''} ${p?.beastFeatures?.earDescription || '귀'}와 꼬리`;

    prologueText = `거친 바람과 야생의 흙냄새가 코끝을 스치는 숲의 가장자리, 곤히 잠들었던 감각이 번쩍 깨어납니다.

당신은 [${raceTitle}] ${charName}${genderStr}.
${beastDetail}을 지닌 긍지 높은 수인 모험가로서 판타지악 대륙에 첫 발을 내디뎠습니다. ${p?.features ? `(${p.features}) ` : ''}손에는 낡은 가죽 주머니와 모험의 흔적이 남아 있습니다.

당신은 지금 무엇을 하시겠습니까?`;
  } else {
    prologueText = `눈을 뜨자, 낯선 숲의 입구였습니다.

당신은 [${raceTitle}] ${charName}${genderStr}.
${p?.hairColor ? `${p.hairColor} ${p.hairStyle}` : '단정한 모습'}과 ${p?.build === 'SMALL' ? '날렵하고 작은' : p?.build === 'LARGE' ? '건장한' : '균형 잡힌'} 체격을 갖추고, 무한한 가능성과 호기심을 품은 채 판타지악 대륙에 첫 발을 내디뎠습니다.

당신은 지금 무엇을 하시겠습니까?`;
  }

  return {
    id: `msg-start-${Date.now()}`,
    role: 'gm',
    content: prologueText,
    timestamp: Date.now(),
  };
}

export default function App() {
  // Screen state: 'title' | 'game'
  const [currentScreen, setCurrentScreen] = useState<'title' | 'game'>('title');

  // Player state & messages
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [messages, setMessages] = useState<GameMessage[]>([generatePrologueMessage(INITIAL_PLAYER_STATE)]);

  const [isLoading, setIsLoading] = useState(false);

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
  const [isCampOpen, setIsCampOpen] = useState(false);
  const [isCompanionsOpen, setIsCompanionsOpen] = useState(false);
  const [isMajorCharactersOpen, setIsMajorCharactersOpen] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isDungeonOpen, setIsDungeonOpen] = useState(false);
  const [activeDungeonId, setActiveDungeonId] = useState<string | undefined>(undefined);

  const isGameOver = playerState.hp <= 0 || playerState.sanity <= 0;
  const gameOverReason: 'hp' | 'sanity' = playerState.hp <= 0 ? 'hp' : 'sanity';

  // Automatically trigger game over modal on demise
  useEffect(() => {
    if (isGameOver) {
      setIsGameOverModalOpen(true);
    }
  }, [isGameOver]);

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
        .map((m) => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: m.content,
        }));

      const res = await fetch('/api/rpg/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionText.trim(),
          history: historyPayload,
          playerState,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '게임 마스터와 연결하지 못했습니다.');
      }

      // Handle world action (TALK_CHARACTER, MEET_CHARACTER, ENTER_LOCATION)
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
          if (locRes.message) {
            worldActionResultSummary.push(locRes.message);
          }
        }
      }

      // Handle active encounter resolution/failure if explicitly concluded by GM.
      let encounterResultSummary: string[] = [];
      if (data.encounterAction && currentStateForChanges.activeEncounterId) {
        const activeEncounterId = currentStateForChanges.activeEncounterId;
        const requestedId = data.encounterAction.encounterId || activeEncounterId;
        if (requestedId === activeEncounterId) {
          const eventType = data.encounterAction.type === 'FAIL' ? 'ENCOUNTER_FAILED' : 'ENCOUNTER_RESOLVED';
          const encounterRes = dispatchGameEvent(currentStateForChanges, eventType, {
            encounterId: activeEncounterId,
            encounterOutcome: data.encounterAction.outcome || data.encounterAction.type,
          });
          currentStateForChanges = encounterRes.nextState;
          encounterResultSummary.push(...encounterRes.messages);
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

      const timeDeltaMinutes =
        typeof data.changes?.timeDeltaMinutes === 'number'
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

      const finalState = applyStoryLogProgress(nextState);

      const allChangeLogs = [...worldActionResultSummary, ...encounterResultSummary, ...lockResultSummary, ...(changeSummary || [])];

      const willStartBattle = shouldStartBattle(data.actionResult, data.changes?.battleTrigger);
      const pendingBattleForMessage = (willStartBattle && data.changes?.battleTrigger)
        ? data.changes.battleTrigger
        : undefined;

      setPlayerState(finalState);

      const cleanStory = extractCleanStory(data.story);

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

      const newMsgList = [...updatedMessages, gmMessage];

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
      return {
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

  const handleBattleEnd = (
    outcome: 'VICTORY' | 'DEFEAT' | 'ESCAPED',
    rewards?: { exp: number; rupees: number; items?: any[]; breakdown?: any[] }
  ) => {
    const finishedBattle = playerState.activeBattle;
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
    const rewardLines = formatCombatRewardLines(rewardPayload);

    if (outcome === 'VICTORY') {
      const wonEv = dispatchGameEvent(processedState, 'BATTLE_WON', {});
      processedState = wonEv.nextState;
      const clearedState: PlayerState = { ...processedState, activeBattle: null, defeatAftermath: null };
      setPlayerState(clearedState);
      if (shouldReopenDungeon && reopenDungeonId) {
        setActiveDungeonId(reopenDungeonId);
        setIsDungeonOpen(true);
      }

      const victoryMsg: GameMessage = {
        id: `vic-${Date.now()}`,
        role: 'gm',
        content: `⚔️ [전투 승리]\n치열한 혈투 끝에 모든 적을 쓰러뜨렸습니다!${rewardLines.length ? `\n• ${rewardLines.join('\n• ')}` : ''}${progression.progressionRewardLines.length ? `\n• ${progression.progressionRewardLines.join('\n• ')}` : ''}`,
        timestamp: Date.now(),
      };
      const nextMsgs = [...messages, victoryMsg];
      if (rewardApplied.levelUpMessage) nextMsgs.push({ id: `lvl-${Date.now()}`, role: 'system', content: rewardApplied.levelUpMessage, timestamp: Date.now() + 1 });
      setMessages(nextMsgs);
      triggerAutosave(clearedState, nextMsgs);
      return;
    }

    if (outcome === 'ESCAPED') {
      const clearedState: PlayerState = { ...processedState, activeBattle: null, defeatAftermath: null };
      setPlayerState(clearedState);
      const escapeMsg: GameMessage = {
        id: `esc-${Date.now()}`,
        role: 'gm',
        content: `💨 [도주 성공]\n적의 공격 범위를 벗어나 후퇴했습니다.${rewardLines.length ? `\n\n[처치 결산]\n• ${rewardLines.join('\n• ')}` : ''}`,
        timestamp: Date.now(),
      };
      const nextMsgs = [...messages, escapeMsg];
      if (rewardApplied.levelUpMessage) nextMsgs.push({ id: `lvl-${Date.now()}`, role: 'system', content: rewardApplied.levelUpMessage, timestamp: Date.now() + 1 });
      setMessages(nextMsgs);
      triggerAutosave(clearedState, nextMsgs);
      return;
    }

    if (outcome === 'DEFEAT') {
      const lostEv = dispatchGameEvent(processedState, 'BATTLE_LOST', {});
      processedState = lostEv.nextState;
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
          defeatAftermath: aftermath,
          storyFlags: Array.from(new Set([...(processedState.storyFlags || []), `DEFEAT_AFTERMATH_${aftermath.kind}`])),
        };
        recovered = advanceGameTime(recovered, effect.timeMinutes);

        if (effect.loseRandomNonKeyItem) {
          const losable = recovered.inventory.find((item) => item.quantity > 0 && item.category !== 'KEY' && item.category !== 'QUEST' && !item.name.includes('열쇠') && !item.name.includes('허가증'));
          if (losable) recovered = { ...recovered, inventory: removeItem(recovered.inventory, losable.equipmentId || losable.id || losable.name, 1).inventory };
        }

        setPlayerState(recovered);
        setIsGameOverModalOpen(false);
        const defeatMsg: GameMessage = {
          id: `defeat-${Date.now()}`,
          role: 'gm',
          content: `☠️ [전투 패배]\n전투 결과는 패배로 확정되었습니다.${rewardLines.length ? `\n\n[처치 결산]\n• ${rewardLines.join('\n• ')}` : ''}\n\n[${aftermath.title}]\n${aftermath.description}`,
          timestamp: Date.now(),
        };
        const nextMsgs = [...messages, defeatMsg];
        if (rewardApplied.levelUpMessage) nextMsgs.push({ id: `lvl-${Date.now()}`, role: 'system', content: rewardApplied.levelUpMessage, timestamp: Date.now() + 1 });
        setMessages(nextMsgs);
        triggerAutosave(recovered, nextMsgs);
        return;
      }

      const deadState: PlayerState = { ...processedState, hp: 0, activeBattle: null, defeatAftermath: aftermath };
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
    const removed = removeItem(playerState.inventory, RESURRECTION_POTION_NAME, 1);
    let revived: PlayerState = {
      ...playerState,
      hp: Math.max(1, Math.round(playerState.maxHp * 0.35)),
      sanity: Math.max(Math.round(playerState.maxSanity * 0.25), playerState.sanity),
      inventory: removed.inventory,
      activeBattle: null,
      defeatAftermath: null,
      storyFlags: Array.from(new Set([...(playerState.storyFlags || []), 'USED_RESURRECTION_POTION_AFTER_DEFEAT'])),
    };
    revived = advanceGameTime(revived, 60);
    setPlayerState(revived);
    setIsGameOverModalOpen(false);
    const msg: GameMessage = {
      id: `revive-outside-${Date.now()}`,
      role: 'gm',
      content: `🧪 [부활의 물약]\n전투의 패배 자체는 되돌리지 않았습니다. 물약의 힘으로 마지막 순간 전장에서 이탈해 목숨을 건졌습니다.\n• HP ${revived.hp}/${revived.maxHp}\n• ${RESURRECTION_POTION_NAME} x1 소모`,
      timestamp: Date.now(),
    };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    triggerAutosave(revived, nextMsgs);
  };

  const handleSkillUsed = (skillId: string) => {
    setPlayerState((prev) => addSkillMastery(prev, skillId, 1));
  };

  const handleWorldRoutePreference = (preference: RoutePreference) => {
    setPlayerState((prev) => ({ ...prev, worldMap: { ...prev.worldMap, routePreference: preference } }));
  };

  const handleWorldTravel = (route: WorldRouteResult) => {
    if (!route.found || route.tileIds.length < 2) return;
    // 계획 경로 전체가 아니라 실제로 이동한 구간만 정산한다.
    // 중도 몬스터 조우 시 이동거리·비행정 연료가 과다 차감되는 문제를 방지한다.
    let next = playerState;
    const travelLogs: string[] = [];
    let monsterEncounter: { name: string; id: string } | null = null;
    let traveledSteps = 0;
    let traveledSkyTiles = 0;
    let traveledCelestialTiles = 0;

    for (let index = 1; index < route.tileIds.length; index += 1) {
      const tile = WORLD_HEX_TILES[route.tileIds[index]];
      if (!tile) continue;
      traveledSteps += 1;
      if (tile.layer === 'SKY') traveledSkyTiles += 1;
      if (tile.layer === 'CELESTIAL') traveledCelestialTiles += 1;
      const step = rollTravelStep(next, tile, index + next.dayCount * 97);
      next = advanceGameTime(next, step.minutes);
      next = {
        ...next,
        worldMap: {
          ...next.worldMap,
          currentHexId: tile.id,
          currentRegionId: tile.regionId,
          currentLayer: tile.layer,
          exploredHexIds: Array.from(new Set([...(next.worldMap.exploredHexIds || []), tile.id])),
          discoveredHexIds: Array.from(new Set([...(next.worldMap.discoveredHexIds || []), tile.id])),
          lastSelectedHexId: tile.id,
          mapRevision: (next.worldMap.mapRevision || 0) + 1,
        },
      };
      next = revealAround(next, tile.id, 1);
      next = dispatchGameEvent(next, 'LOCATION_ENTERED', { locationId: tile.locationTag || tile.id, locationName: tile.locationName || tile.sectorName, location: tile.id }).nextState;
      const dragonkinEvent = rollDragonkinHunterTravelEvent(next, tile.regionId, index + next.dayCount * 193 + tile.q * 17 + tile.r * 31);
      if (dragonkinEvent) {
        next = markDragonkinHunterEvent(next);
        if (dragonkinEvent.kind === 'ENCOUNTER') {
          next = dispatchGameEvent(next, 'ENCOUNTER_STARTED', { encounterId: dragonkinEvent.id }).nextState;
          travelLogs.push('• 용족을 노린 전문 사냥 세력의 움직임이 감지되어 이동이 중단되었습니다.');
          break;
        }
        const hunter = REGIONAL_MONSTERS.find((m) => m.id === dragonkinEvent.id);
        if (hunter) {
          monsterEncounter = { id: hunter.id, name: hunter.name };
          travelLogs.push(`• ${hunter.name}의 용족 포획대와 조우하여 이동이 중단되었습니다.`);
          break;
        }
      }
      if (step.encounterType === 'EVENT' && step.eventText) travelLogs.push(`• ${step.eventText}`);
      if (step.encounterType === 'MONSTER' && step.monsterId && step.monsterName) {
        monsterEncounter = { id: step.monsterId, name: step.monsterName };
        travelLogs.push(`• ${step.monsterName}와 조우하여 이동이 중단되었습니다.`);
        break;
      }
    }

    if (monsterEncounter) {
      const def = REGIONAL_MONSTERS.find((m) => m.id === monsterEncounter!.id);
      const enemy = createEnemyActor({
        templateId: def?.id,
        name: def?.name || monsterEncounter.name,
        level: Math.max(def?.minLevel || 1, Math.min(def?.maxLevel || next.level, next.level)),
        tier: WORLD_HEX_TILES[next.worldMap.currentHexId]?.layerBossId === def?.id ? 'BOSS' : (def?.tier || 'NORMAL'),
        skills: def?.skills,
        personality: def?.personality,
        race: def?.raceType === 'HUMANOID'
          ? (def.raceSubtype.startsWith('BEASTKIN_') ? 'BEASTKIN' : def.raceSubtype === 'ELF' ? 'ELF' : 'HUMAN')
          : 'MONSTER',
        traits: (() => {
          const encounterTile = WORLD_HEX_TILES[next.worldMap.currentHexId];
          const baseTraits = def ? [def.raceType, def.raceSubtype, ...(def.tier === 'ELITE' ? ['ELITE'] : [])] : [];
          if (encounterTile?.layer === 'UNDERGROUND') baseTraits.push('UNDERGROUND');
          if (encounterTile?.layer === 'DEEP_UNDERGROUND') baseTraits.push('DEEP_UNDERGROUND');
          if (encounterTile?.layerBossId === def?.id) {
            baseTraits.push('REGIONAL_BOSS', 'UNDERGROUND_LAYER_BOSS');
            if (encounterTile.layerBossClearFlag) baseTraits.push(`CLEAR_FLAG:${encounterTile.layerBossClearFlag}`);
          }
          return baseTraits;
        })(),
      });
      const tile = WORLD_HEX_TILES[next.worldMap.currentHexId];
      next = {
        ...next,
        activeBattle: initBattleState(next, [enemy], {
          name: `${tile?.regionId || '필드'} · ${tile?.terrain || 'UNKNOWN'}`,
          description: '여행 경로에서 발생한 지역 인카운터.',
        }),
      };
    }

    if (route.travelMode === 'FLIGHT') {
      travelLogs.unshift('• 천룡비행으로 하늘과 천공을 직접 비행했습니다.');
    }
    if (route.travelMode === 'AIRSHIP') {
      const actualFuelCost =
        airshipFuelCostForDistance(playerState, traveledSkyTiles, 'SKY') +
        airshipFuelCostForDistance(playerState, traveledCelestialTiles, 'CELESTIAL');
      if (actualFuelCost > 0) next = consumeAirshipFuel(next, actualFuelCost);
      travelLogs.unshift(`• 비행정 연료 ${actualFuelCost} 소비.`);
      next = dispatchGameEvent(next, 'AIRSHIP_TRAVELED', { fuelSpent: actualFuelCost }).nextState;
    }
    setPlayerState(next);
    const msg: GameMessage = {
      id: `travel-${Date.now()}`,
      role: 'system',
      content: `🗺️ [이동]\n${traveledSteps}개 육각형을 따라 이동했습니다.\n${travelLogs.length ? travelLogs.join('\n') : '• 특별한 사건 없이 이동했습니다.'}`,
      timestamp: Date.now(),
    };
    const nextMsgs = [...messages, msg];
    setMessages(nextMsgs);
    setIsWorldMapOpen(false);
    triggerAutosave(next, nextMsgs);
  };

  const handleGatherLifeResources = (tileId: string) => {
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
  const handleRefuelAirship = (id:'aether_fuel_cell'|'storm_fuel_cell') => {const res=refuelAirship(playerState,id,1);if(!res.ok){showToast(res.message,'error');return;}setPlayerState(res.state);showToast(res.message,'success');triggerAutosave(res.state,messages);};

  const handleEnterDungeon = (dungeonId: string) => {
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
    if (playerState.worldMap.currentHexId !== tileId) {
      showToast('광맥이 있는 Hex까지 이동해야 채굴할 수 있습니다.', 'error');
      return;
    }
    const result = mineWorldOreVein(playerState, tileId);
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }
    const next = advanceGameTime(result.nextState, result.minutes);
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
            isLoading={isLoading}
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
                onOpenQuests={() => setIsQuestOpen(true)}
                onOpenCamp={() => setIsCampOpen(true)}
                onOpenCompanions={() => setIsCompanionsOpen(true)}
                onOpenMajorCharacters={() => setIsMajorCharactersOpen(true)}
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

      {/* 생활 전문 직업 모달 */}
      {isProfessionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
          <div className="relative w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950/80">
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                6대 생활 전문 직업 및 제작
              </h2>
              <button
                onClick={() => setIsProfessionsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProfessionsTab playerState={playerState} />
            </div>
          </div>
        </div>
      )}

      {/* 독립 제작 모달 */}
      {isCraftingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
          <div className="relative w-full max-w-5xl bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800"><h2 className="text-sm font-bold text-stone-100">제작</h2><button onClick={()=>setIsCraftingOpen(false)} className="p-1 text-stone-400 hover:text-white"><X className="w-5 h-5"/></button></div>
            <div className="flex-1 overflow-y-auto"><CraftingTab playerState={playerState} onCraftRecipe={handleCraftRecipe}/></div>
          </div>
        </div>
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
                onClick={() => setIsCompanionsOpen(false)}
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
    </div>
  );
}

