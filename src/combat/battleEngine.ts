import { rollPetCommandOutcome } from '../data/pets/petProgression';
import {
  BattleActor,
  BattlefieldState,
  BattleLogEntry,
  BattleState,
  BattleActionResult,
  BattleSkillModifier,
  BattleEquipmentSummary,
  CombatElement,
  PlannedCombatAction,
} from './combatTypes';
import { onDragonActorTurnEnd } from './dragonSovereignForm';
import { PlayerState, CompanionData } from '../types';
import {
  ACTION_THRESHOLD,
  BATTLE_START_COST,
  calculateCombatStats,
  DEFAULT_LEVEL_GROWTH,
  getArmorProficiency,
  ARMOR_PROFICIENCY_CONFIG,
  DUAL_WIELD_OFFHAND_RATIO,
  CombatDerivedStats,
} from '../data/combatConfig';
import {
  executeSkillAction,
  getSkillActionDelay,
  getSkillUsability,
  BattleActionContext,
} from './battleActions';
import { decideEnemyAction } from './enemyAI';
import { getSkillDefinition, SkillDefinition } from '../data/skills';
import { getTalentNode } from '../data/talents';
import { getCombatClass, getClassEvolutionById } from '../data/classes';
import { PASSIVE_DEFINITIONS_V1 } from '../data/progression/progressionData';
import {
  EQUIPMENT_DATABASE, EquipmentSlot, EquippedItems, resolveEquipmentSetEffects, resolveEquipmentSynergies,
  getEnhancedEquipmentBaseStats, normalizeEquipmentEnhancementState, resolveRunewordLoadout,
  EQUIPMENT_ENHANCEMENT_MILESTONES, RUNE_LEVEL_BY_MILESTONE,
} from '../data/equipment';
import { getItemDefinition } from '../data/items';
import { POTION_DATABASE } from '../data/potions/potionDatabase';
import { getMonsterExperienceReward, getMonsterRupeeReward, rollMonsterLoot } from '../data/world/monsterLootSystem';
import { createEquipmentRuntimeState, hasTrait, onEquipmentTurnEnd, onEquipmentTurnStart, setCounter } from './equipmentRuntime';
import { isAdultPhysicalAge } from '../config/agePolicy';
import {
  advanceToNextActor,
  applyActionDelay,
  buildTimelinePreview,
  getAllBattleActors,
  getEffectiveActionSpeed,
  initializeCtbActors,
} from './turnManager';
import {
  isActorUnableToAct,
  processTurnEndStatusEffects,
  processTurnStartStatusEffects,
} from './statusEffectEngine';

function makeLog(
  actor: BattleActor | undefined,
  turn: number,
  text: string,
  badge?: BattleLogEntry['badge']
): BattleLogEntry {
  return {
    id: `battle_log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    turn,
    actorName: actor?.name || '시스템',
    isPlayer: !!actor?.isPlayer,
    text,
    badge,
    timestamp: Date.now(),
  };
}

/**
 * 캐릭터 데이터(플레이어 또는 동료)로부터 장비/특성/직업/방어구 적성을 고려한 BattleActor 생성.
 */
export function createBattleActorFromCharacter(
  character: PlayerState | CompanionData,
  isPlayer: boolean
): BattleActor {
  const pState = isPlayer ? (character as PlayerState) : null;
  const cState = !isPlayer ? (character as CompanionData) : null;

  const charName = isPlayer
    ? pState?.profile?.inGameName || pState?.characterName || '모험가'
    : cState?.name || '동료';

  const combatClass = character.combatClass || 'NONE';
  const classDef = getCombatClass(combatClass);
  const evolutionDef = getClassEvolutionById((character as PlayerState | CompanionData).classEvolutionId || (character as PlayerState | CompanionData).classEvolutionName);
  const recommendedArmor = classDef?.recommendedArmor;

  const equipment: EquippedItems = (character.equipment || {}) as EquippedItems;
  const enhancementTable = character.equipmentEnhancements || {};
  const learnedTalents = character.learnedTalents || {};
  const mainHandDefinition = equipment.MAIN_HAND ? EQUIPMENT_DATABASE[equipment.MAIN_HAND] : undefined;
  const dualWieldTalentActive = Number(learnedTalents.dancer_chakram_flow || 0) > 0 && mainHandDefinition?.weaponStyle === 'DUAL_WIELD';
  const adultEligible = !!(isPlayer && pState && isAdultPhysicalAge(pState.profile?.physicalAge));
  const fluidKinds = new Set(['STANDARD_FLUID', 'INSECTOID_SECRETION', 'URINE']);
  const fluidByCompartment: Record<string, number> = { COMPARTMENT_1: 0, COMPARTMENT_2: 0, COMPARTMENT_3: 0 };
  if (adultEligible && pState) {
    for (const payload of pState.bodyPayloads || []) {
      if (!fluidKinds.has(payload.payloadKind)) continue;
      fluidByCompartment[payload.compartmentId] = (fluidByCompartment[payload.compartmentId] || 0) + Math.max(0, Number(payload.amount || 0));
    }
  }
  const adultEquipmentContext = adultEligible && pState ? {
    eligible: true as const,
    effectiveCorruption: Math.max(0, Math.min(10, Number(pState.corruptionStatus?.effectiveCorruption ?? pState.corruptionStatus?.corruption ?? 0))),
    effectiveDesire: Math.max(0, Math.min(100, Number(pState.adultStatus?.effectiveDesire ?? pState.adultStatus?.desire ?? 0))),
    lewdness: Math.max(0, Math.min(10, Number(pState.adultStatus?.lewdness ?? 0))),
    sensitivity: Math.max(0, Math.min(100, Number(pState.adultStatus?.sensitivity ?? 0))),
    fluidTotal: Object.values(fluidByCompartment).reduce((sum, value) => sum + value, 0),
    fluidByCompartment,
    pregnancyActive: !!pState.pregnancy?.active,
    pregnancyStage: pState.pregnancy?.stage,
  } : undefined;
  const equipmentBonuses: Partial<CombatDerivedStats> = {};
  const bonusBaseStats: Record<string, number> = {};
  const grantedSkillIds: string[] = [];
  const traits: string[] = [];
  // 종족/캐릭터 패시브 ID도 전투 런타임 특성에 노출한다.
  // 실제 수치 보너스는 기존 종족 스탯 계산/개별 효과 엔진이 담당하고 여기서는 중복 가산하지 않는다.
  traits.push(...((Array.isArray((character as any).passives) ? (character as any).passives : []).filter(Boolean)));
  const skillModifiers: BattleSkillModifier[] = [];
  const elementResistances: Partial<Record<CombatElement, number>> = {};
  const elementDamageBonuses: Partial<Record<CombatElement, number>> = {};
  const equipmentSummary: BattleEquipmentSummary[] = [];

  let totalSpeedPenalty = 0;
  let totalEvasionPenalty = 0;
  let totalTenacityPenalty = 0;
  let armorSlotCount = 0;

  const armorSlots: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'BOOTS', 'GLOVES'];

  Object.entries(equipment).forEach(([slot, equipId]) => {
    const id = equipId as string | undefined;
    if (!id || !EQUIPMENT_DATABASE[id]) return;
    const item = EQUIPMENT_DATABASE[id];
    const enhancement = normalizeEquipmentEnhancementState(enhancementTable[id]);
    equipmentSummary.push({
      slot,
      equipmentId: id,
      name: item.name,
      description: item.description,
      enhancementLevel: enhancement.level,
      runewords: EQUIPMENT_ENHANCEMENT_MILESTONES.flatMap((milestone) => {
        const runeword = enhancement.runeChoices[milestone];
        return runeword ? [{ milestone, runeword, runeLevel: RUNE_LEVEL_BY_MILESTONE[milestone] }] : [];
      }),
    });

    if (item.statModifiers) {
      Object.entries(item.statModifiers).forEach(([stat, val]) => {
        if (typeof val === 'number') bonusBaseStats[stat] = (bonusBaseStats[stat] || 0) + val;
      });
    }

    if (item.baseStats) {
      const enhancedBaseStats = getEnhancedEquipmentBaseStats(item.baseStats, enhancement.level);
      Object.entries(enhancedBaseStats).forEach(([statKey, val]) => {
        const key = statKey as keyof CombatDerivedStats;
        if (typeof val !== 'number') return;
        let appliedVal = val;
        if (slot === 'OFF_HAND' && (key === 'physicalAttack' || key === 'magicAttack')) {
          // 차크람 곡예가 활성화된 쌍수 세팅은 보조무기 공격력을 60%가 아닌 100% 반영한다.
          appliedVal = Math.round(appliedVal * (dualWieldTalentActive ? 1 : DUAL_WIELD_OFFHAND_RATIO));
        }
        const previous = (equipmentBonuses[key] as number) || 0;
        (equipmentBonuses as Record<string, number>)[key] = previous + appliedVal;
      });
    }

    if (item.elementResistances) {
      for (const [element, value] of Object.entries(item.elementResistances)) {
        if (typeof value !== 'number') continue;
        const key = element as CombatElement;
        elementResistances[key] = (elementResistances[key] || 0) + value;
      }
    }

    if (item.elementDamageBonuses) {
      for (const [element, value] of Object.entries(item.elementDamageBonuses)) {
        if (typeof value !== 'number') continue;
        const key = element as CombatElement;
        elementDamageBonuses[key] = (elementDamageBonuses[key] || 0) + value;
      }
    }

    if (item.magicWeapon) {
      grantedSkillIds.push(...(item.magicWeapon.availableSpellIds || []));
      grantedSkillIds.push(...(item.magicWeapon.exclusiveSpellIds || []));
      if (item.magicWeapon.grantedSkillId) grantedSkillIds.push(item.magicWeapon.grantedSkillId);
      if (item.magicWeapon.grantedSpellId) grantedSkillIds.push(item.magicWeapon.grantedSpellId);
    }

    if (item.specialEffectIds) {
      for (const trait of item.specialEffectIds) {
        if (trait.startsWith('DANCER_ADULT_') && !adultEligible) continue;
        traits.push(trait);
      }
    }

    for (const modifier of item.skillModifiers || []) {
      skillModifiers.push({
        skillId: modifier.skillId,
        damageMultiplierBonus: modifier.damageMultiplierBonus,
        cooldownReduction: modifier.cooldownReduction,
        costReduction: modifier.costReduction ?? modifier.mpCostReduction,
      });
    }

    if (armorSlots.includes(slot as EquipmentSlot) && item.armorType) {
      armorSlotCount += 1;
      const proficiency = getArmorProficiency(item.armorType, recommendedArmor);
      const penalty = ARMOR_PROFICIENCY_CONFIG[proficiency];
      totalSpeedPenalty += penalty.speedPenaltyPercent;
      totalEvasionPenalty += penalty.evasionPenaltyPercent;
      totalTenacityPenalty += penalty.tenacityPenaltyPercent;
    }
  });

  // 세트 장비 2/3/4피스 보너스를 실제 전투 능력치에 합산한다.
  const setEffects = resolveEquipmentSetEffects(equipment);
  Object.entries(setEffects.combatStatBonuses).forEach(([statKey, value]) => {
    if (typeof value !== 'number') return;
    const previous = Number((equipmentBonuses as Record<string, number>)[statKey] || 0);
    (equipmentBonuses as Record<string, number>)[statKey] = previous + value;
  });
  Object.entries(setEffects.elementResistances).forEach(([element, value]) => {
    if (typeof value !== 'number') return;
    const key = element as CombatElement;
    elementResistances[key] = (elementResistances[key] || 0) + value;
  });
  Object.entries(setEffects.elementDamageBonuses).forEach(([element, value]) => {
    if (typeof value !== 'number') return;
    const key = element as CombatElement;
    elementDamageBonuses[key] = (elementDamageBonuses[key] || 0) + value;
  });
  traits.push(...setEffects.traits);

  // 세트가 아닌 특정 장비 조합도 숨은 상호작용을 발동한다.
  const activeSynergies = resolveEquipmentSynergies(equipment);
  traits.push(...activeSynergies.map((synergy) => synergy.traitId));
  if (activeSynergies.some((s) => s.traitId === 'SYNERGY_TWILIGHT')) {
    const high = Math.max(elementDamageBonuses.HOLY || 0, elementDamageBonuses.DARK || 0);
    elementDamageBonuses.HOLY = high; elementDamageBonuses.DARK = high;
  }
  if (activeSynergies.some((s) => s.traitId === 'SYNERGY_ECLIPSE_SCAR')) {
    elementDamageBonuses.HOLY = (elementDamageBonuses.HOLY || 0) + 10;
    elementDamageBonuses.DARK = (elementDamageBonuses.DARK || 0) + 10;
  }

  // 전신 룬워드 키워드 레벨 및 임계 능력을 실제 전투 수치/특성에 반영한다.
  const runewords = resolveRunewordLoadout(Object.values(equipment), enhancementTable);
  for (const [statKey, value] of Object.entries(runewords.combatStatBonuses)) {
    if (typeof value !== 'number') continue;
    (equipmentBonuses as Record<string, number>)[statKey] = Number((Number((equipmentBonuses as Record<string, number>)[statKey] || 0) + value).toFixed(3));
  }
  for (const [element, value] of Object.entries(runewords.elementDamageBonuses)) {
    if (typeof value !== 'number') continue;
    const key = element as CombatElement;
    elementDamageBonuses[key] = (elementDamageBonuses[key] || 0) + value;
  }
  for (const [element, value] of Object.entries(runewords.elementResistances)) {
    if (typeof value !== 'number') continue;
    const key = element as CombatElement;
    elementResistances[key] = (elementResistances[key] || 0) + value;
  }
  traits.push(...runewords.traits);

  // 심화 전직의 표기용 보너스/전용 패시브/전용 액티브를 실제 전투 런타임에 연결한다.
  if (evolutionDef) {
    for (const [statKey, value] of Object.entries(evolutionDef.statBonuses || {})) {
      if (typeof value !== 'number') continue;
      (equipmentBonuses as Record<string, number>)[statKey] = Number((Number((equipmentBonuses as Record<string, number>)[statKey] || 0) + value).toFixed(3));
    }
    for (const [statKey, value] of Object.entries(evolutionDef.passive?.statBonuses || {})) {
      if (typeof value !== 'number') continue;
      (equipmentBonuses as Record<string, number>)[statKey] = Number((Number((equipmentBonuses as Record<string, number>)[statKey] || 0) + value).toFixed(3));
    }
    grantedSkillIds.push(...(evolutionDef.grantedSkillIds || []));
    traits.push(...(evolutionDef.passive?.traitIds || []));
  }

  // 무희 성인 상태 연동 장비. agePolicy의 성인 기준을 충족할 때만 위에서 trait 자체가 들어온다.
  const addEquipmentBonus = (key: keyof CombatDerivedStats, value: number) => {
    (equipmentBonuses as Record<string, number>)[key] = Number((Number((equipmentBonuses as Record<string, number>)[key] || 0) + value).toFixed(3));
  };
  if (adultEquipmentContext && combatClass === 'DANCER') {
    if (traits.includes('DANCER_ADULT_CORRUPTION_FLOW')) {
      addEquipmentBonus('actionSpeed', Math.floor(adultEquipmentContext.effectiveCorruption * 1.2));
      addEquipmentBonus('physicalAttack', Math.floor(adultEquipmentContext.effectiveCorruption * 2.5));
      addEquipmentBonus('magicAttack', Math.floor(adultEquipmentContext.effectiveCorruption * 2.5));
    }
    if (traits.includes('DANCER_ADULT_FLUID_RESONANCE')) {
      if (adultEquipmentContext.fluidTotal >= 90) addEquipmentBonus('maxCost', 2);
      if (adultEquipmentContext.fluidTotal >= 150) addEquipmentBonus('actionSpeed', 6);
      if (adultEquipmentContext.fluidTotal >= 220) addEquipmentBonus('criticalChance', 8);
    }
    if (traits.includes('DANCER_ADULT_PREGNANCY_TEMPO') && adultEquipmentContext.pregnancyActive) {
      addEquipmentBonus('maxHp', 120);
      addEquipmentBonus('physicalDefense', 14);
      addEquipmentBonus('magicDefense', 14);
      addEquipmentBonus('actionSpeed', 10);
    }
    if (traits.includes('DANCER_ADULT_DESIRE_RHYTHM')) {
      if (adultEquipmentContext.effectiveDesire >= 50) addEquipmentBonus('costRegen', 1);
      if (adultEquipmentContext.effectiveDesire >= 80) { addEquipmentBonus('costRegen', 1); addEquipmentBonus('criticalChance', 5); }
    }
    if (traits.includes('DANCER_ADULT_LEWDNESS_PERFORMANCE')) {
      addEquipmentBonus('statusHitRate', Math.floor(adultEquipmentContext.lewdness * 1.5));
      addEquipmentBonus('evasion', Math.floor(adultEquipmentContext.lewdness * 0.8));
    }
  }

  const talentBonuses: Record<string, number> = {};
  Object.entries(learnedTalents).forEach(([talentId, rank]) => {
    const node = getTalentNode(talentId);
    if (!node || rank <= 0) return;
    if (node.effectId) traits.push(node.effectId);
    if (node.statModifiers) {
      Object.entries(node.statModifiers).forEach(([statKey, val]) => {
        talentBonuses[statKey] = (talentBonuses[statKey] || 0) + val * rank;
      });
    }
  });
  // 스킬 정의의 장비 요구 조건을 실제 전투 사용 판정에서 확인할 수 있도록 노출한다.
  if (mainHandDefinition?.magicWeapon || mainHandDefinition?.weaponStyle === 'MAGIC') traits.push('EQUIP_MAGIC_WEAPON');
  if (mainHandDefinition?.weaponStyle === 'DUAL_WIELD') traits.push('EQUIP_DUAL_WIELD');
  for (const tag of mainHandDefinition?.tags || []) traits.push(`WEAPON_TAG:${tag}`);
  if (mainHandDefinition?.weaponType) traits.push(`WEAPON_TAG:${mainHandDefinition.weaponType}`);
  if (dualWieldTalentActive) traits.push('TALENT_CHAKRAM_FLOW_DUAL_ACTIVE');

  // v1.0 패시브 성장 보너스를 실제 전투 파생 능력치에 합산한다.
  if (isPlayer && pState?.skillProgression?.passiveProgress) {
    Object.values(pState.skillProgression.passiveProgress).forEach((entry) => {
      if (!entry?.unlocked || entry.level <= 0) return;
      const def = PASSIVE_DEFINITIONS_V1[entry.passiveId];
      if (!def) return;
      Object.entries(def.effectPerLevel || {}).forEach(([statKey, value]) => {
        if (typeof value !== 'number') return;
        talentBonuses[statKey] = (talentBonuses[statKey] || 0) + value * entry.level;
      });
      if (def.grade === 'UNIQUE') traits.push(`UNIQUE_PASSIVE:${def.id}`);
    });
  }

  if (classDef?.statGrowthModifiers) {
    Object.entries(classDef.statGrowthModifiers).forEach(([key, value]) => {
      talentBonuses[key] = (talentBonuses[key] || 0) + (value || 0);
    });
  }

  const baseStats = character.stats || {
    strength: 5,
    vitality: 5,
    agility: 5,
    intelligence: 5,
    spirit: 5,
    luck: 5,
  };
  const effectiveBaseStats = {
    strength: (baseStats.strength ?? 5) + (bonusBaseStats.strength || 0),
    vitality: (baseStats.vitality ?? 5) + (bonusBaseStats.vitality || 0),
    agility: (baseStats.agility ?? 5) + (bonusBaseStats.agility || 0),
    intelligence: (baseStats.intelligence ?? 5) + (bonusBaseStats.intelligence || 0),
    spirit: (baseStats.spirit ?? 5) + (bonusBaseStats.spirit || 0),
    luck: (baseStats.luck ?? 5) + (bonusBaseStats.luck || 0),
  };

  const derivedStats = calculateCombatStats(
    effectiveBaseStats,
    character.level || 1,
    DEFAULT_LEVEL_GROWTH,
    talentBonuses as Partial<CombatDerivedStats>,
    equipmentBonuses
  );

  if (armorSlotCount > 0) {
    const avgSpeedPenalty = totalSpeedPenalty / armorSlotCount;
    const avgEvasionPenalty = totalEvasionPenalty / armorSlotCount;
    const avgTenacityPenalty = totalTenacityPenalty / armorSlotCount;

    if (avgSpeedPenalty > 0) {
      derivedStats.actionSpeed = Math.max(
        1,
        Math.round(derivedStats.actionSpeed * (1 - avgSpeedPenalty / 100))
      );
    }
    if (avgEvasionPenalty > 0) {
      derivedStats.evasion = Math.max(
        0,
        Math.round(derivedStats.evasion * (1 - avgEvasionPenalty / 100))
      );
    }
    if (avgTenacityPenalty > 0 && derivedStats.tenacity != null) {
      derivedStats.tenacity = Math.max(
        0,
        Math.round(derivedStats.tenacity * (1 - avgTenacityPenalty / 100))
      );
    }
  }

  const learnedAndGrantedSkills = Array.from(
    new Set([
      'basic_attack',
      'defend_stance',
      'first_aid',
      ...(character.learnedSkills || []),
      ...(classDef?.initialSkillIds || []),
      ...grantedSkillIds,
    ])
  );
  const explicitEquippedSkills = (character as PlayerState | CompanionData).equippedCombatSkillIds;
  const equippedSkillIds = explicitEquippedSkills && explicitEquippedSkills.length > 0
    ? Array.from(new Set(['basic_attack', 'defend_stance', ...explicitEquippedSkills])).filter((id) => learnedAndGrantedSkills.includes(id))
    : learnedAndGrantedSkills;
  const skills = equippedSkillIds;

  const actorId = isPlayer ? 'player' : cState?.id || `companion_${Date.now()}`;

  // HP/MP/정신력 장비 보너스는 파생 전투 스탯과 별개로 실제 자원 최대치에 반영한다.
  const baseMaxHp = Math.max(1, character.maxHp ?? 100);
  const baseHp = Math.max(0, character.hp ?? baseMaxHp);
  const maxHpBonus = Math.round(Number(equipmentBonuses.maxHp || 0));
  const maxHp = Math.max(1, baseMaxHp + maxHpBonus);
  const hpRatio = Math.min(1, baseHp / baseMaxHp);
  const hp = Math.min(maxHp, Math.max(0, Math.round(maxHp * hpRatio)));

  const baseMp = isPlayer ? pState?.mana ?? 50 : cState?.mp ?? 50;
  const baseMaxMp = Math.max(1, isPlayer ? pState?.maxMana ?? 50 : cState?.maxMp ?? 50);
  const maxMpBonus = Math.round(Number(equipmentBonuses.maxMp || 0));
  const maxMp = Math.max(1, baseMaxMp + maxMpBonus);
  const mpRatio = Math.min(1, Math.max(0, baseMp) / baseMaxMp);
  const mp = Math.min(maxMp, Math.max(0, Math.round(maxMp * mpRatio)));

  const baseMaxSanity = Math.max(1, character.maxSanity ?? 100);
  const baseSanity = Math.max(0, character.sanity ?? baseMaxSanity);
  const maxSanityBonus = Math.round(Number(equipmentBonuses.maxSanity || 0));
  const maxSanity = Math.max(1, baseMaxSanity + maxSanityBonus);
  const sanityRatio = Math.min(1, baseSanity / baseMaxSanity);
  const sanity = Math.min(maxSanity, Math.max(0, Math.round(maxSanity * sanityRatio)));

  const maxCost = Math.max(1, derivedStats.maxCost ?? 30);
  const costRegen = Math.max(0, derivedStats.costRegen ?? 5);

  return {
    id: actorId,
    name: charName,
    level: character.level || 1,
    hp,
    maxHp,
    mp,
    maxMp,
    cost: Math.min(BATTLE_START_COST, maxCost),
    maxCost,
    costRegen,
    actionGauge: 0,
    stableTieBreaker: 0,
    skillCooldowns: {},
    manualControl: isPlayer ? true : (cState?.manualCombatControl ?? false),
    sanity,
    maxSanity,
    stagger: 0,
    maxStagger: Math.max(40, Math.floor(maxHp * 0.45) + (derivedStats.tenacity || 0) * 2),
    isStaggered: false,
    stats: derivedStats,
    baseStats: effectiveBaseStats,
    skills,
    equippedSkillIds,
    traits: Array.from(new Set(traits)),
    equipmentSummary,
    skillModifiers,
    elementResistances,
    elementDamageBonuses,
    runewordLevels: runewords.keywordLevels,
    adultEquipmentContext,
    statusEffects: [],
    consumedBattleEffects: [],
    equipmentRuntime: createEquipmentRuntimeState(),
    portraitUrl: isPlayer ? pState?.profile?.portraitUrl : cState?.portraitUrl,
    speechProfile: {
      gender: isPlayer ? pState?.profile?.gender : cState?.gender,
      race: character.race,
      beastkinType: character.beastkinType,
      combatClass,
      physicalAge: isPlayer ? pState?.profile?.physicalAge : undefined,
    },
    isPlayer,
    isCompanion: !isPlayer,
  };
}

function refreshTimeline(state: BattleState, currentActionDelay?: number): void {
  state.timeline = buildTimelinePreview(state, 12, currentActionDelay);
  state.turnOrder = state.timeline.map((entry) => entry.actorId);
}

function getActorById(state: BattleState, actorId: string | undefined): BattleActor | undefined {
  if (!actorId) return undefined;
  return getAllBattleActors(state).find((actor) => actor.id === actorId);
}

function isPartyActor(actor: BattleActor): boolean {
  return actor.isPlayer || !!actor.isCompanion;
}

function getActionContext(state: BattleState, source: BattleActor): BattleActionContext {
  if (isPartyActor(source)) {
    return {
      allies: [state.player, ...state.companions].filter((actor) => actor.hp > 0),
      enemies: state.enemies.filter((actor) => actor.hp > 0),
      battleState: state,
    };
  }
  return {
    allies: state.enemies.filter((actor) => actor.hp > 0),
    enemies: [state.player, ...state.companions].filter((actor) => actor.hp > 0),
    battleState: state,
  };
}

function resolveTargets(
  state: BattleState,
  source: BattleActor,
  skill: SkillDefinition,
  preferredTargetId?: string
): BattleActor[] {
  const context = getActionContext(state, source);
  const allies = context.allies || [source];
  const enemies = context.enemies || [];

  // 장신구/레전더리 효과가 스킬의 대상 규칙 자체를 바꿀 수 있다.
  if (hasTrait(source, 'EQ_SELF_HEAL_SHARE') && skill.id === 'first_aid') {
    const preferred = allies.find((actor) => actor.id === preferredTargetId && actor.hp > 0);
    return [preferred || source];
  }
  if (hasTrait(source, 'EQ_AUTOCRAT_SEAL') && skill.targetType === 'ALL_ALLIES') {
    const preferred = allies.find((actor) => actor.id === preferredTargetId && actor.hp > 0);
    return [preferred || allies[0] || source];
  }
  if (hasTrait(source, 'MUT_ARROW_RAIN_FOCUS') && skill.id === 'archer_arrow_rain') {
    const preferred = enemies.find((actor) => actor.id === preferredTargetId && actor.hp > 0);
    return [preferred || enemies[0]].filter(Boolean) as BattleActor[];
  }

  switch (skill.targetType) {
    case 'SELF':
      return [source];
    case 'ALLY': {
      const preferred = allies.find((actor) => actor.id === preferredTargetId && actor.hp > 0);
      return [preferred || allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || source];
    }
    case 'COMPANION': {
      const companions = allies.filter((actor) => !!actor.isCompanion && actor.hp > 0);
      const preferred = companions.find((actor) => actor.id === preferredTargetId);
      return [preferred || companions[0]].filter(Boolean) as BattleActor[];
    }
    case 'ALL_ALLIES':
      return allies;
    case 'ALL_ENEMIES':
      return enemies;
    case 'ENEMY':
    default: {
      const preferred = enemies.find((actor) => actor.id === preferredTargetId && actor.hp > 0);
      return preferred ? [preferred] : enemies[0] ? [enemies[0]] : [];
    }
  }
}

function decrementCooldowns(actor: BattleActor): void {
  const next: Record<string, number> = {};
  for (const [skillId, remaining] of Object.entries(actor.skillCooldowns || {})) {
    const value = Math.max(0, remaining - 1);
    if (value > 0) next[skillId] = value;
  }
  actor.skillCooldowns = next;
}

function appendStatusTickLogs(
  actor: BattleActor,
  turn: number,
  tickLogs: string[],
  logs: BattleLogEntry[]
): void {
  for (const text of tickLogs) {
    logs.push(makeLog(actor, turn, text, { text: '상태 효과', type: text.includes('회복') ? 'heal' : 'damage' }));
  }
}

function checkAndTriggerRevival(actor: BattleActor, turn: number, logs: BattleLogEntry[]): void {
  if (actor.hp > 0) return;
  if (!hasTrait(actor, 'revive_once')) return;
  if (actor.consumedBattleEffects?.includes('revive_once')) return;

  const reviveAmount = Math.max(1, Math.round(actor.maxHp * 0.4));
  actor.hp = reviveAmount;
  actor.consumedBattleEffects = [...(actor.consumedBattleEffects || []), 'revive_once'];
  logs.push(makeLog(
    actor,
    turn,
    `${actor.name}이(가) 쓰러지는 순간 장비의 부활 효과가 발동해 다시 일어섰다.`,
    { text: `부활 · HP +${reviveAmount}`, type: 'heal' }
  ));
}

function triggerResurrectionLightForSide(side: BattleActor[], turn: number, logs: BattleLogEntry[]): void {
  const fallen = side.filter((actor) => actor.hp <= 0);
  if (!fallen.length) return;

  const saviors = side.filter((actor) => hasTrait(actor, 'TALENT_RESURRECTION_LIGHT') && !(actor.consumedBattleEffects || []).includes('talent_resurrection_light'));
  for (const savior of saviors) {
    const remainingFallen = side.filter((actor) => actor.hp <= 0);
    if (!remainingFallen.length) break;
    // 시전자 자신이 쓰러졌다면 자기 부활을 우선하며, 살아 있다면 아군 전투불능자를 구한다.
    const target = savior.hp <= 0 ? savior : remainingFallen[0];
    const reviveAmount = Math.max(1, Math.round(target.maxHp * 0.4));
    target.hp = reviveAmount;
    target.statusEffects = [];
    target.isStaggered = false;
    target.stagger = 0;
    savior.consumedBattleEffects = [...(savior.consumedBattleEffects || []), 'talent_resurrection_light'];
    logs.push(makeLog(
      savior,
      turn,
      `${savior.name}의 부활의 성광이 ${target.name}을(를) 되살리고 모든 상태이상을 정화했다.`,
      { text: `부활 · HP ${reviveAmount} · 상태 정화`, type: 'heal' }
    ));
  }
}

function checkAllRevivals(state: BattleState, logs: BattleLogEntry[]): void {
  const party = [state.player, ...state.companions];
  triggerResurrectionLightForSide(party, state.turn, logs);
  triggerResurrectionLightForSide(state.enemies, state.turn, logs);
  // 성광으로 구하지 못한 대상에 한해 개인 장비의 revive_once를 처리한다.
  for (const actor of getAllBattleActors(state)) checkAndTriggerRevival(actor, state.turn, logs);
}

function setTerminalPhaseIfNeeded(state: BattleState, logs: BattleLogEntry[]): 'VICTORY' | 'DEFEAT' | undefined {
  checkAllRevivals(state, logs);

  if (state.enemies.every((enemy) => enemy.hp <= 0)) {
    if (state.phase !== 'VICTORY') {
      state.phase = 'VICTORY';
      logs.push(makeLog(undefined, state.turn, '전장의 모든 적을 격파했습니다.', { text: '전투 승리', type: 'heal' }));
    }
    return 'VICTORY';
  }

  if (state.player.hp <= 0) {
    if (state.phase !== 'DEFEAT') {
      state.phase = 'DEFEAT';
      logs.push(makeLog(state.player, state.turn, `${state.player.name}이(가) 전투 불능 상태가 되었습니다.`, { text: '전투 패배', type: 'damage' }));
    }
    return 'DEFEAT';
  }
  return undefined;
}

function beginActorTurn(state: BattleState, actor: BattleActor, logs: BattleLogEntry[]): boolean {
  state.currentActorId = actor.id;
  state.currentTurnStarted = true;
  state.phase = actor.isPlayer ? 'PLAYER_TURN' : actor.isCompanion ? 'COMPANION_TURN' : 'ENEMY_TURN';

  actor.cost = Math.min(actor.maxCost, actor.cost + actor.costRegen);
  decrementCooldowns(actor);

  const startTick = processTurnStartStatusEffects(actor);
  appendStatusTickLogs(actor, state.turn, startTick.logs, logs);
  for (const text of onEquipmentTurnStart(actor, state)) logs.push(makeLog(actor, state.turn, text, { text: '장비 효과', type: 'buff' }));
  checkAndTriggerRevival(actor, state.turn, logs);

  if (actor.hp <= 0) return false;

  if (isActorUnableToAct(actor)) {
    const reason = actor.isStaggered
      ? '흐트러짐 상태로 행동 기회를 잃었다.'
      : actor.statusEffects.some((effect) => effect.type === 'CHARM')
      ? '매혹되어 행동 기회를 잃었다.'
      : '기절하여 행동 기회를 잃었다.';
    logs.push(makeLog(actor, state.turn, `${actor.name}(이)가 ${reason}`, { text: '행동 불가', type: 'info' }));
    return false;
  }

  return true;
}

function finishActorTurn(
  state: BattleState,
  actor: BattleActor,
  actionDelay: number,
  logs: BattleLogEntry[]
): void {
  for (const text of onEquipmentTurnEnd(actor)) logs.push(makeLog(actor, state.turn, text, { text: '장비 효과', type: 'buff' }));
  const endTick = processTurnEndStatusEffects(actor);
  appendStatusTickLogs(actor, state.turn, endTick.logs, logs);
  for (const text of onDragonActorTurnEnd(actor)) logs.push(makeLog(actor, state.turn, text, { text: '용제 현현 종료', type: 'info' }));
  applyActionDelay(actor, actionDelay);

  state.actionCount += 1;
  state.turn = state.actionCount + 1;
  state.currentActorId = undefined;
  state.currentTurnStarted = false;
  refreshTimeline(state);
  if (hasTrait(actor, 'EQ_OVERTAKE_CRIT') && actor.equipmentRuntime?.lastTargetId) {
    const selfIdx = state.timeline.findIndex((entry) => entry.actorId === actor.id);
    const targetIdx = state.timeline.findIndex((entry) => entry.actorId === actor.equipmentRuntime?.lastTargetId);
    if (selfIdx >= 0 && targetIdx >= 0 && selfIdx < targetIdx) setCounter(actor, 'overtake_crit', 1);
  }
}

function chooseCompanionSkill(
  companion: BattleActor,
  companionData: CompanionData | undefined,
  state: BattleState
): { skillId: string; targetId?: string } {
  const tactic = companionData?.combatTactic || 'BALANCED';
  const context = getActionContext(state, companion);
  const enemies = context.enemies || [];
  const allies = context.allies || [companion];

  const usable = companion.skills
    .map((id) => getSkillDefinition(id))
    .filter((skill): skill is SkillDefinition => !!skill && getSkillUsability(companion, skill.id).usable);

  const selfHpRatio = companion.hp / Math.max(1, companion.maxHp);
  const lowestAlly = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const lowestEnemy = enemies.slice().sort((a, b) => a.hp - b.hp)[0];

  if ((tactic === 'HEAL_PRIORITY' || tactic === 'SUPPORT_PRIORITY') && selfHpRatio < 0.7) {
    const heal = usable.find((skill) => skill.effectId === 'EFFECT_DIVINE_HEAL' || skill.effectId === 'EFFECT_FIRST_AID');
    if (heal) return { skillId: heal.id, targetId: lowestAlly?.id || companion.id };
  }

  if (tactic === 'DEFENSIVE' && selfHpRatio < 0.5) {
    const defense = usable.find((skill) =>
      ['EFFECT_DEFEND', 'EFFECT_IRON_WALL', 'EFFECT_SACRED_SHIELD'].includes(skill.effectId)
    );
    if (defense) return { skillId: defense.id, targetId: companion.id };
  }

  const attackSkills = usable.filter((skill) =>
    skill.targetType === 'ENEMY' || skill.targetType === 'ALL_ENEMIES'
  );

  if (tactic === 'RESOURCE_SAVING') {
    const basic = usable.find((skill) => skill.id === 'basic_attack');
    if (basic) return { skillId: basic.id, targetId: lowestEnemy?.id };
    const cheapest = attackSkills
      .slice()
      .sort((a, b) => getSkillUsability(companion, a.id).cost - getSkillUsability(companion, b.id).cost)[0];
    if (cheapest) return { skillId: cheapest.id, targetId: lowestEnemy?.id };
  }

  if (tactic === 'AGGRESSIVE' && attackSkills.length > 0) {
    const strongest = attackSkills
      .slice()
      .sort((a, b) => (b.damageMultiplier || 0) - (a.damageMultiplier || 0))[0];
    return { skillId: strongest.id, targetId: lowestEnemy?.id };
  }

  const special = attackSkills.find((skill) => skill.id !== 'basic_attack');
  if (special) return { skillId: special.id, targetId: lowestEnemy?.id };
  return { skillId: 'basic_attack', targetId: lowestEnemy?.id };
}

/**
 * 동료 AI 1행동. 턴 시작/종료는 CTB 엔진이 담당한다.
 */
export function executeCompanionAITurn(
  companion: BattleActor,
  companionData: CompanionData | undefined,
  _allCompanions: BattleActor[],
  _player: BattleActor,
  _enemies: BattleActor[],
  turnNumber: number,
  state?: BattleState
): BattleLogEntry[] {
  if (!state || companion.hp <= 0) return [];
  const decision = chooseCompanionSkill(companion, companionData, state);
  const skill = getSkillDefinition(decision.skillId) || getSkillDefinition('basic_attack')!;
  const targets = resolveTargets(state, companion, skill, decision.targetId);
  const result = executeSkillAction(
    companion,
    targets,
    skill.id,
    turnNumber,
    undefined,
    getActionContext(state, companion)
  );
  return result.logEntries;
}

function runAiAction(
  state: BattleState,
  actor: BattleActor,
  playerState: PlayerState,
  logs: BattleLogEntry[]
): number {
  if (actor.isCompanion) {
    const companionData = playerState.companions?.find((companion) => companion.id === actor.id);
    const decision = chooseCompanionSkill(actor, companionData, state);
    let skill = getSkillDefinition(decision.skillId) || getSkillDefinition('basic_attack')!;
    let targets = resolveTargets(state, actor, skill, decision.targetId);
    let result = executeSkillAction(actor, targets, skill.id, state.turn, undefined, getActionContext(state, actor));

    if (!result.wasExecuted && skill.id !== 'basic_attack') {
      skill = getSkillDefinition('basic_attack')!;
      targets = resolveTargets(state, actor, skill);
      result = executeSkillAction(actor, targets, skill.id, state.turn, undefined, getActionContext(state, actor));
    }
    logs.push(...result.logEntries);
    return result.wasExecuted ? result.actionDelay : 1;
  }

  const livingParty = [state.player, ...state.companions].filter((member) => member.hp > 0);
  const target = livingParty[Math.floor(Math.random() * Math.max(1, livingParty.length))] || state.player;
  const decision = decideEnemyAction(actor, target, state.turn);
  let skill = getSkillDefinition(decision.skillId) || getSkillDefinition('basic_attack')!;
  let targets = resolveTargets(state, actor, skill, decision.targetId || target.id);
  let result = executeSkillAction(actor, targets, skill.id, state.turn, undefined, getActionContext(state, actor));

  if (!result.wasExecuted && skill.id !== 'basic_attack') {
    skill = getSkillDefinition('basic_attack')!;
    targets = resolveTargets(state, actor, skill, target.id);
    result = executeSkillAction(actor, targets, skill.id, state.turn, undefined, getActionContext(state, actor));
  }
  logs.push(...result.logEntries);
  return result.wasExecuted ? result.actionDelay : 1;
}

/** 현재 Actor가 플레이어 입력을 기다리는 대상인지 판정한다. */
export function isManualControlActor(actor: BattleActor | undefined): boolean {
  if (!actor) return false;
  return actor.isPlayer || (!!actor.isCompanion && actor.manualControl === true);
}

function cloneActor(actor: BattleActor): BattleActor {
  return {
    ...actor,
    stats: { ...actor.stats },
    baseStats: actor.baseStats ? { ...actor.baseStats } : undefined,
    skills: [...(actor.skills || [])],
    equippedSkillIds: actor.equippedSkillIds ? [...actor.equippedSkillIds] : undefined,
    traits: [...(actor.traits || [])],
    skillModifiers: actor.skillModifiers?.map((modifier) => ({ ...modifier })),
    statusEffects: (actor.statusEffects || []).map((effect) => ({ ...effect })),
    consumedBattleEffects: actor.consumedBattleEffects ? [...actor.consumedBattleEffects] : [],
    equipmentRuntime: actor.equipmentRuntime ? {
      counters: { ...actor.equipmentRuntime.counters },
      flags: { ...actor.equipmentRuntime.flags },
      links: { ...actor.equipmentRuntime.links },
      strings: { ...actor.equipmentRuntime.strings },
      recentSkillIds: [...actor.equipmentRuntime.recentSkillIds],
      recentElements: [...actor.equipmentRuntime.recentElements],
      attackedTargetIds: [...actor.equipmentRuntime.attackedTargetIds],
      lastSkillId: actor.equipmentRuntime.lastSkillId,
      lastTargetId: actor.equipmentRuntime.lastTargetId,
      lastActionKind: actor.equipmentRuntime.lastActionKind,
      tookDamageSinceLastTurn: actor.equipmentRuntime.tookDamageSinceLastTurn,
    } : createEquipmentRuntimeState(),
    skillCooldowns: { ...(actor.skillCooldowns || {}) },
    elementResistances: { ...(actor.elementResistances || {}) },
    elementDamageBonuses: { ...(actor.elementDamageBonuses || {}) },
    equipmentSummary: actor.equipmentSummary?.map((item) => ({ ...item })),
    speechProfile: actor.speechProfile ? { ...actor.speechProfile } : undefined,
    nextIntent: actor.nextIntent ? { ...actor.nextIntent } : undefined,
    aiProfile: actor.aiProfile
      ? { ...actor.aiProfile, preferredSkills: [...(actor.aiProfile.preferredSkills || [])] }
      : undefined,
  };
}

/** React 상태 갱신에서 참조 동일성 문제를 피하기 위한 전투 상태 복제. */
export function cloneBattleState(state: BattleState): BattleState {
  return {
    ...state,
    battlefield: {
      ...state.battlefield,
      effectModifiers: { ...(state.battlefield.effectModifiers || {}) },
    },
    player: cloneActor(state.player),
    companions: state.companions.map(cloneActor),
    enemies: state.enemies.map(cloneActor),
    battleLog: [...state.battleLog],
    victoryCondition: { ...state.victoryCondition },
    turnOrder: [...(state.turnOrder || [])],
    timeline: (state.timeline || []).map((entry) => ({ ...entry })),
  };
}

/** 플레이어와 장착 동료 최대 4기, 적 최대 5체로 CTB 전투를 초기화한다. */
export function initBattleState(
  playerState: PlayerState,
  enemies: BattleActor[],
  battlefieldInput?: Partial<BattlefieldState>,
  canEscape: boolean = true
): BattleState {
  const playerActor = createBattleActorFromCharacter(playerState, true);
  const activeCompanions = (playerState.companions || [])
    .filter((companion) => companion.isActivePartyMember)
    .slice(0, 4);
  const companionActors = activeCompanions.map((companion) => createBattleActorFromCharacter(companion, false));
  const battleEnemies = enemies.slice(0, 5).map((enemy) => cloneActor(enemy));

  const battlefield: BattlefieldState = {
    id: `bf_${Date.now()}`,
    name: battlefieldInput?.name || '거친 전장',
    description: battlefieldInput?.description || '적과 마주쳐 일촉즉발의 긴장감이 감돈다.',
    environmentType: battlefieldInput?.environmentType || 'FOREST',
    effectModifiers: battlefieldInput?.effectModifiers || {},
  };

  const state: BattleState = {
    id: `battle_${Date.now()}`,
    turn: 1,
    actionCount: 0,
    phase: 'ROUND_START',
    battlefield,
    player: playerActor,
    companions: companionActors,
    enemies: battleEnemies,
    battleLog: [
      {
        id: `log_init_${Date.now()}`,
        turn: 1,
        actorName: '시스템',
        isPlayer: false,
        text: `전투 개시: ${battleEnemies.map((enemy) => `${enemy.name}(Lv.${enemy.level})`).join(', ')}`,
        badge: { text: '전투 개시 · CTB', type: 'info' },
        timestamp: Date.now(),
      },
    ],
    victoryCondition: { type: 'DEFEAT_ALL' },
    canEscape,
    currentActorId: undefined,
    currentTurnStarted: false,
    turnOrder: [],
    timeline: [],
  };

  initializeCtbActors(state);
  const openingLogs: BattleLogEntry[] = [];
  prepareNextActor(state, openingLogs);
  state.battleLog.push(...openingLogs);
  refreshTimeline(state);
  return state;
}

/** 구 호출부 호환용: 행동 시작 상태효과만 처리한다. */
export function processActorStatusEffects(actor: BattleActor, turnNumber: number): BattleLogEntry[] {
  const tick = processTurnStartStatusEffects(actor);
  return tick.logs.map((text) => makeLog(
    actor,
    turnNumber,
    text,
    { text: '상태 효과', type: text.includes('회복') ? 'heal' : 'damage' }
  ));
}

/**
 * 다음 행동자를 준비하되 AI 행동 자체는 실행하지 않는다.
 * 행동불능/턴 시작 DoT 등은 순차 처리하고 실제로 행동 가능한 Actor에서 멈춘다.
 */
function prepareNextActor(state: BattleState, logs: BattleLogEntry[]): BattleActor | undefined {
  let safety = 0;
  while (safety < 100) {
    safety += 1;
    if (setTerminalPhaseIfNeeded(state, logs)) {
      refreshTimeline(state);
      return undefined;
    }

    const existing = getActorById(state, state.currentActorId);
    if (existing && existing.hp > 0 && state.currentTurnStarted) {
      refreshTimeline(state);
      return existing;
    }

    state.currentActorId = undefined;
    state.currentTurnStarted = false;

    const actor = advanceToNextActor(state);
    if (!actor) {
      refreshTimeline(state);
      return undefined;
    }

    const canAct = beginActorTurn(state, actor, logs);
    refreshTimeline(state);

    if (setTerminalPhaseIfNeeded(state, logs)) return undefined;
    if (!canAct) {
      finishActorTurn(state, actor, 1, logs);
      continue;
    }
    return actor;
  }

  logs.push(makeLog(undefined, state.turn, 'CTB 행동자 준비 안전 한도에 도달했습니다.', { text: '전투 엔진 보호', type: 'info' }));
  return undefined;
}

/** 현재 전투 상태가 가리키는 Actor. */
export function getCurrentBattleActor(state: BattleState): BattleActor | undefined {
  return getActorById(state, state.currentActorId);
}

/**
 * 현재 AI Actor가 어떤 행동을 할지 읽기 전용으로 계획한다.
 * UI는 이 결과로 카드 모션/대상 이펙트를 먼저 재생한 뒤 실제 확정 함수를 호출한다.
 */
export function planAutomaticAction(
  battleState: BattleState,
  playerState: PlayerState
): PlannedCombatAction | undefined {
  const actor = getCurrentBattleActor(battleState);
  if (!actor || actor.hp <= 0 || !battleState.currentTurnStarted || isManualControlActor(actor)) return undefined;

  let skillId = 'basic_attack';
  let preferredTargetId: string | undefined;

  let petCommandOutcome: PlannedCombatAction['petCommandOutcome'];
  if (actor.isCompanion) {
    const companionData = playerState.companions?.find((companion) => companion.id === actor.id);
    let decisionData = companionData;
    if (companionData?.kind === 'PET' && companionData.petState) {
      petCommandOutcome = rollPetCommandOutcome(companionData);
      if (petCommandOutcome === 'INDEPENDENT') decisionData = { ...companionData, combatTactic: 'AGGRESSIVE' };
      if (petCommandOutcome === 'FAIL') { skillId = 'defend_stance'; preferredTargetId = actor.id; }
    }
    if (petCommandOutcome !== 'FAIL') {
      const decision = chooseCompanionSkill(actor, decisionData, battleState);
      skillId = decision.skillId;
      preferredTargetId = decision.targetId;
    }
  } else {
    const livingParty = [battleState.player, ...battleState.companions].filter((member) => member.hp > 0);
    const taunting = livingParty.find((member) => member.statusEffects.some((effect) => effect.type === 'TAUNT'));
    const fallbackTarget = taunting || livingParty.slice().sort((a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp))[0] || battleState.player;
    const decision = decideEnemyAction(actor, fallbackTarget, battleState.turn);
    skillId = decision.skillId;
    preferredTargetId = decision.targetId || fallbackTarget.id;
  }

  let skill = getSkillDefinition(skillId) || getSkillDefinition('basic_attack')!;
  if (!getSkillUsability(actor, skill.id).usable) {
    skill = getSkillDefinition('basic_attack')!;
    skillId = skill.id;
  }

  const targets = resolveTargets(battleState, actor, skill, preferredTargetId);
  return {
    actorId: actor.id,
    skillId,
    targetIds: targets.map((target) => target.id),
    primaryTargetId: targets[0]?.id,
    actionDelay: getSkillActionDelay(skill, actor, targets[0], battleState),
    petCommandOutcome,
  };
}

function buildActionResult(
  state: BattleState,
  logs: BattleLogEntry[],
  consumedItem?: BattleActionResult['consumedItem']
): BattleActionResult {
  const terminal = setTerminalPhaseIfNeeded(state, logs);
  refreshTimeline(state);
  state.battleLog.push(...logs);

  if (terminal === 'VICTORY') {
    return {
      battleState: state,
      logEntries: logs,
      isBattleEnded: true,
      outcome: 'VICTORY',
      rewards: generateBattleRewards(state.enemies, false, state.player),
      consumedItem,
    };
  }
  if (terminal === 'DEFEAT') {
    return { battleState: state, logEntries: logs, isBattleEnded: true, outcome: 'DEFEAT', rewards: generateBattleRewards(state.enemies, true, state.player), consumedItem };
  }
  if (state.phase === 'ESCAPED') {
    return { battleState: state, logEntries: logs, isBattleEnded: true, outcome: 'ESCAPED', rewards: generateBattleRewards(state.enemies, true, state.player), consumedItem };
  }
  return { battleState: state, logEntries: logs, isBattleEnded: false, consumedItem };
}

/** 플레이어/수동 동료 공용 스킬 행동 1회. AI를 연쇄 실행하지 않는다. */
export function processActorSkillTurn(
  battleState: BattleState,
  actorId: string,
  skillId: string,
  targetActorId: string | undefined,
  playerState: PlayerState
): BattleActionResult {
  const state = cloneBattleState(battleState);
  const logs: BattleLogEntry[] = [];
  initializeCtbActors(state);
  if (!Number.isFinite(state.actionCount)) state.actionCount = Math.max(0, (state.turn || 1) - 1);

  const actor = prepareNextActor(state, logs);
  if (!actor || actor.id !== actorId) {
    logs.push(makeLog(actor, state.turn, '현재 행동 차례가 아닌 캐릭터는 행동할 수 없습니다.', { text: '행동 불가', type: 'info' }));
    return buildActionResult(state, logs);
  }

  const skill = getSkillDefinition(skillId) || getSkillDefinition('basic_attack')!;
  const targets = resolveTargets(state, actor, skill, targetActorId);
  const action = executeSkillAction(
    actor,
    targets,
    skill.id,
    state.turn,
    actor.isPlayer ? playerState.profile?.speechStyle : undefined,
    getActionContext(state, actor)
  );
  logs.push(...action.logEntries);

  // COST 부족/쿨타임/패시브 등 사용 불가일 경우 행동권을 보존한다.
  if (!action.wasExecuted) {
    refreshTimeline(state);
    state.battleLog.push(...logs);
    return { battleState: state, logEntries: logs, isBattleEnded: false };
  }

  checkAllRevivals(state, logs);
  finishActorTurn(state, actor, action.actionDelay, logs);
  if (!setTerminalPhaseIfNeeded(state, logs)) prepareNextActor(state, logs);
  return buildActionResult(state, logs);
}

/** 기존 호출부 호환: 플레이어 스킬 행동 1회만 확정한다. */
export function processPlayerTurn(
  battleState: BattleState,
  skillId: string,
  targetEnemyId: string,
  playerState: PlayerState
): BattleActionResult {
  return processActorSkillTurn(battleState, battleState.player.id, skillId, targetEnemyId, playerState);
}

/** AI Actor 한 명의 행동만 확정한다. */
export function processAutomaticTurn(
  battleState: BattleState,
  playerState: PlayerState,
  plannedAction?: PlannedCombatAction
): BattleActionResult {
  const plan = plannedAction || planAutomaticAction(battleState, playerState);
  if (!plan) {
    const state = cloneBattleState(battleState);
    const logs: BattleLogEntry[] = [];
    prepareNextActor(state, logs);
    return buildActionResult(state, logs);
  }
  const result = processActorSkillTurn(
    battleState,
    plan.actorId,
    plan.skillId,
    plan.primaryTargetId,
    playerState
  );
  if (plan.petCommandOutcome) {
    const actor = getActorById(result.battleState, plan.actorId);
    const label = plan.petCommandOutcome === 'OBEY' ? '명령 수행' : plan.petCommandOutcome === 'INDEPENDENT' ? '독자 행동' : '명령 실패';
    const log = makeLog(actor, result.battleState.turn, `🐾 ${label}`, { text: label, type: plan.petCommandOutcome === 'OBEY' ? 'buff' : 'info' });
    result.logEntries = [log, ...result.logEntries];
    result.battleState.battleLog.push(log);
  }
  return result;
}

/**
 * 소비 아이템을 전투 행동으로 사용한다. 자가 사용과 투척 모두 같은 효과를 적용하되
 * UI 프레젠테이션은 sourceId===targetId 여부로 ITEM_SELF/ITEM_THROW를 구분한다.
 */
export function processCombatItemTurn(
  battleState: BattleState,
  actorId: string,
  itemNameOrId: string,
  targetActorId: string,
  playerState: PlayerState
): BattleActionResult {
  const state = cloneBattleState(battleState);
  const logs: BattleLogEntry[] = [];
  initializeCtbActors(state);
  const actor = prepareNextActor(state, logs);

  if (!actor || actor.id !== actorId || !isPartyActor(actor)) {
    logs.push(makeLog(actor, state.turn, '현재는 해당 캐릭터가 아이템을 사용할 차례가 아닙니다.', { text: '사용 불가', type: 'info' }));
    return buildActionResult(state, logs);
  }

  const inventoryItem = playerState.inventory.find(
    (item) => item.id === itemNameOrId || item.name === itemNameOrId
  );
  const lookupKey = inventoryItem?.id || inventoryItem?.name || itemNameOrId;
  const itemDef = getItemDefinition(lookupKey);
  const potionDef = POTION_DATABASE[lookupKey] || Object.values(POTION_DATABASE).find((potion) => potion.name === (inventoryItem?.name || itemNameOrId));
  if (!inventoryItem || inventoryItem.quantity <= 0 || !itemDef || !itemDef.usable || itemDef.category !== 'CONSUMABLE' || potionDef?.usableContext === 'NON_COMBAT_ONLY') {
    logs.push(makeLog(actor, state.turn, `[${inventoryItem?.name || itemNameOrId}]은(는) 전투 중 사용할 수 없습니다.`, { text: '사용 불가', type: 'info' }));
    return buildActionResult(state, logs);
  }

  const target = getActorById(state, targetActorId);
  const potionEffect = potionDef?.gameplayEffect;
  const canResurrect = !!potionEffect?.resurrectRatio;
  if (!target || (target.hp <= 0 && !canResurrect)) {
    logs.push(makeLog(actor, state.turn, '아이템을 적용할 유효한 대상을 선택해야 합니다.', { text: '대상 필요', type: 'info' }));
    return buildActionResult(state, logs);
  }
  if (canResurrect && target.hp > 0) {
    logs.push(makeLog(actor, state.turn, `[${itemDef.name}]은(는) 전투불능 대상에게만 사용할 수 있습니다.`, { text: '대상 오류', type: 'info' }));
    return buildActionResult(state, logs);
  }

  const effect = potionEffect || itemDef.useEffect || {};
  const duration = Math.max(1, Number(potionEffect?.durationTurns ?? potionDef?.durationTurns ?? 1));
  const beforeHp = target.hp;
  const beforeMp = target.mp;
  const beforeSanity = target.sanity;
  const changes: string[] = [];

  if (potionEffect?.resurrectRatio && target.hp <= 0) {
    target.hp = Math.max(1, Math.round(target.maxHp * potionEffect.resurrectRatio));
    target.isStaggered = false;
    target.stagger = 0;
    changes.push(`부활 · HP ${target.hp}`);
  } else {
    const hpDelta = Number((potionEffect as any)?.hpDelta ?? (itemDef.useEffect?.hpDelta || 0));
    const hpPercent = Number((potionEffect as any)?.hpPercent || 0);
    const mpDelta = Number((potionEffect as any)?.mpDelta ?? (itemDef.useEffect?.mpDelta || 0));
    const sanityDelta = Number((potionEffect as any)?.sanityDelta ?? (itemDef.useEffect?.sanityDelta || 0));
    if (hpDelta || hpPercent) target.hp = Math.max(0, Math.min(target.maxHp, target.hp + hpDelta + Math.round(target.maxHp * hpPercent / 100)));
    if (mpDelta) target.mp = Math.max(0, Math.min(target.maxMp, target.mp + mpDelta));
    if (sanityDelta && typeof target.sanity === 'number') {
      target.sanity = Math.max(0, Math.min(target.maxSanity ?? 100, target.sanity + sanityDelta));
    }
  }

  const addItemStatus = (type: import('./combatTypes').StatusEffectType, name: string, turns: number, value?: number) => {
    target.statusEffects = target.statusEffects.filter((status) => status.type !== type);
    target.statusEffects.push({
      id: `item_${type.toLowerCase()}_${Date.now()}_${target.id}`,
      type,
      name,
      duration: Math.max(1, turns),
      value,
      sourceActorId: actor.id,
      skipNextDurationTick: actor.id === target.id,
    });
  };

  if (potionEffect) {
    if (potionEffect.cleanseDebuffs) {
      const harmful = new Set(['BLEED','POISON','BURN','STUN','CHARM','FEAR','ACCURACY_DOWN','BLIND','SLOW','WEAKEN','VULNERABLE']);
      const removed = target.statusEffects.filter((status) => harmful.has(status.type)).length;
      target.statusEffects = target.statusEffects.filter((status) => !harmful.has(status.type));
      changes.push(`해로운 상태 ${removed}개 정화`);
    }
    if (potionEffect.detoxPoison) {
      target.statusEffects = target.statusEffects.filter((status) => status.type !== 'POISON');
      if (duration > 1) addItemStatus('POISON_IMMUNE', '해독 비약 · 중독 면역', duration, 1);
      changes.push(duration > 1 ? `중독 해제 · ${duration}턴 면역` : '중독 해제');
    }
    const bonus = potionEffect.statBonus || {};
    if (bonus.defense) addItemStatus('DEF_UP', '철벽 비약', duration, bonus.defense);
    if (bonus.attack) { addItemStatus('ATK_UP', '광전 비약', duration, bonus.attack); addItemStatus('MAGIC_ATK_UP', '광전 비약', duration, bonus.attack); }
    if (bonus.speed) addItemStatus('SPEED_UP', '신속 비약', duration, bonus.speed);
    if (bonus.accuracy) addItemStatus('ACCURACY_UP', '명중 비약', duration, bonus.accuracy);
    if (bonus.evasion) addItemStatus('EVASION_UP', '회피 비약', duration, bonus.evasion);
    if (bonus.critRate) addItemStatus('CRIT_UP', '치명 비약', duration, bonus.critRate);
    if (bonus.critDamage) addItemStatus('CRIT_DAMAGE_UP', '치명 비약 · 치명 피해', duration, bonus.critDamage);
    if (bonus.fireResist) addItemStatus('FIRE_RES_UP', '내화 비약', duration, bonus.fireResist);
    if (bonus.frostResist) addItemStatus('ICE_RES_UP', '내한 비약', duration, bonus.frostResist);
    if (bonus.lightningResist) addItemStatus('LIGHTNING_RES_UP', '절연 비약', duration, bonus.lightningResist);
    if (bonus.barrier) {
      target.statusEffects.push({ id:`item_shield_${Date.now()}_${target.id}`, type:'SHIELD', name:'마력장 비약', duration, value:bonus.barrier, sourceActorId:actor.id, skipNextDurationTick:actor.id===target.id });
    }
    if (bonus.regenHpPerTurn) addItemStatus('REGENERATION', '재생 비약', duration, bonus.regenHpPerTurn);
    if (bonus.undyingWill) addItemStatus('UNDYING', '불굴 비약', duration, Math.max(1, bonus.undyingWill));
  }

  if (target.hp !== beforeHp && !canResurrect) changes.push(`HP ${target.hp - beforeHp >= 0 ? '+' : ''}${target.hp - beforeHp}`);
  if (target.mp !== beforeMp) changes.push(`MP ${target.mp - beforeMp >= 0 ? '+' : ''}${target.mp - beforeMp}`);
  if (typeof beforeSanity === 'number' && target.sanity !== beforeSanity) {
    const delta = (target.sanity ?? 0) - beforeSanity;
    changes.push(`정신력 ${delta >= 0 ? '+' : ''}${delta}`);
  }
  if (itemDef.useEffect?.buffName) changes.push(itemDef.useEffect.buffName);
  if (potionEffect?.statBonus) {
    const label = potionDef?.effectLogText || potionDef?.description;
    if (label) changes.push(label.replace(/^\[.*?\]\s*/, ''));
  }

  const selfUse = actor.id === target.id;
  logs.push(makeLog(
    actor,
    state.turn,
    potionDef?.actionLogText || (selfUse
      ? `${actor.name}(이)가 [${itemDef.name}]을(를) 사용했다.${itemDef.useEffect?.message ? ` ${itemDef.useEffect.message}` : ''}`
      : `${actor.name}(이)가 [${itemDef.name}]을(를) ${target.name}에게 던져 효과를 적용했다.`),
    { text: changes.join(' · ') || '아이템 사용', type: (target.hp > beforeHp || (target.sanity ?? 0) > (beforeSanity ?? 0)) ? 'heal' : 'info' }
  ));

  checkAllRevivals(state, logs);
  finishActorTurn(state, actor, 0.9, logs);
  if (!setTerminalPhaseIfNeeded(state, logs)) prepareNextActor(state, logs);

  return buildActionResult(
    state,
    logs,
    itemDef.consumedOnUse === false ? undefined : { itemNameOrId: inventoryItem.name, quantity: 1 }
  );
}

/** 도주도 현재 수동 조작 중인 아군 Actor의 CTB 행동 1회를 소비한다. */
export function attemptEscape(
  battleState: BattleState,
  playerState: PlayerState,
  actorId: string = battleState.player.id
): BattleActionResult {
  const state = cloneBattleState(battleState);
  const logs: BattleLogEntry[] = [];
  initializeCtbActors(state);
  const actor = prepareNextActor(state, logs);

  if (!actor || actor.id !== actorId || !isPartyActor(actor)) {
    logs.push(makeLog(actor, state.turn, '현재 행동 차례가 아니어서 도주할 수 없습니다.', { text: '도주 불가', type: 'miss' }));
    return buildActionResult(state, logs);
  }

  if (!state.canEscape) {
    logs.push(makeLog(actor, state.turn, '이 전투에서는 도주할 수 없습니다.', { text: '도주 불가', type: 'miss' }));
    return buildActionResult(state, logs);
  }

  const livingParty = [state.player, ...state.companions].filter((member) => member.hp > 0);
  const livingEnemies = state.enemies.filter((enemy) => enemy.hp > 0);
  const partyAvgSpeed = livingParty.reduce((sum, member) => sum + getEffectiveActionSpeed(member, state), 0) / Math.max(1, livingParty.length);
  const enemyAvgSpeed = livingEnemies.reduce((sum, enemy) => sum + getEffectiveActionSpeed(enemy, state), 0) / Math.max(1, livingEnemies.length);
  const battlefieldBonus = state.battlefield.effectModifiers?.escapeChanceModifier ?? 0;
  const escapeChance = Math.min(90, Math.max(10, 50 + (partyAvgSpeed - enemyAvgSpeed) * 2 + battlefieldBonus));

  if (Math.random() * 100 <= escapeChance) {
    state.phase = 'ESCAPED';
    logs.push(makeLog(actor, state.turn, `${actor.name}(이)가 아군을 이끌고 전장에서 이탈하는 데 성공했습니다.`, { text: `도주 성공 · ${Math.round(escapeChance)}%`, type: 'info' }));
    return buildActionResult(state, logs);
  }

  logs.push(makeLog(actor, state.turn, `${actor.name}(이)가 도주를 시도했지만 길이 막혔습니다.`, { text: `도주 실패 · ${Math.round(escapeChance)}%`, type: 'damage' }));
  finishActorTurn(state, actor, 1, logs);
  if (!setTerminalPhaseIfNeeded(state, logs)) prepareNextActor(state, logs);
  return buildActionResult(state, logs);
}

export function generateBattleRewards(enemies: BattleActor[], defeatedOnly = false, rewardActor?: BattleActor) {
  let totalExp = 0;
  let totalRupees = 0;
  const items: Array<{ name: string; quantity: number; id?: string; equipmentId?: string; description?: string; category?: 'MATERIAL' | 'EQUIPMENT' | 'CONSUMABLE' }> = [];
  const breakdown: Array<{ enemyId: string; enemyName: string; exp: number; rupees: number; items: Array<{ name: string; quantity: number }> }> = [];

  const targets = defeatedOnly ? enemies.filter((enemy) => enemy.hp <= 0) : enemies;
  for (const enemy of targets) {
    const monsterId = String(enemy.archetype || enemy.id);
    const deepMultiplier = enemy.traits?.includes('DEEP_UNDERGROUND') ? 1.8 : enemy.traits?.includes('UNDERGROUND') ? 1.15 : 1;
    const dungeonTierTrait = (enemy.traits || []).find((trait) => trait.startsWith('DUNGEON_REWARD_TIER:'));
    const dungeonTier = dungeonTierTrait ? Math.max(0, Number(dungeonTierTrait.split(':')[1]) || 0) : 0;
    const rewardMultiplier = deepMultiplier * (1 + dungeonTier * 0.18);
    const exp = Math.round(getMonsterExperienceReward(monsterId, enemy.level, enemy.tier || 'NORMAL') * rewardMultiplier);
    const rupees = Math.round(getMonsterRupeeReward(monsterId, enemy.level, enemy.tier || 'NORMAL') * rewardMultiplier);
    const loot = rollMonsterLoot(monsterId, enemy.tier || 'NORMAL');
    if (deepMultiplier > 1.5 || dungeonTier >= 3) loot.push(...rollMonsterLoot(monsterId, enemy.tier || 'NORMAL'));
    totalExp += exp;
    totalRupees += rupees;
    items.push(...loot);
    breakdown.push({ enemyId: monsterId, enemyName: enemy.name, exp, rupees, items: loot.map((item) => ({ name: item.name, quantity: item.quantity })) });
  }

  // 영혼 강탈: 전투에서 획득하는 루피 총량 +20%.
  if (rewardActor && hasTrait(rewardActor, 'TALENT_SOUL_HARVEST')) {
    totalRupees = Math.round(totalRupees * 1.2);
    for (const row of breakdown) row.rupees = Math.round(row.rupees * 1.2);
  }

  const merged = new Map<string, typeof items[number]>();
  for (const item of items) {
    const key = item.equipmentId ? `eq:${item.equipmentId}` : `item:${item.id || item.name}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { ...item });
  }

  return { exp: totalExp, rupees: totalRupees, items: [...merged.values()], breakdown };
}

/** 개발/테스트용: Actor가 현재 임계치에 도달했는지 확인. */
export function isActorReady(actor: BattleActor): boolean {
  return actor.actionGauge >= ACTION_THRESHOLD;
}
