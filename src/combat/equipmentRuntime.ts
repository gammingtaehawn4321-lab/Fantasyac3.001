import type { SkillDefinition } from '../data/skills';
import type { BattleActor, BattleState, CombatElement, EquipmentRuntimeState } from './combatTypes';

export interface RuntimeSkillModifiers {
  costMultiplier: number;
  costFlat: number;
  cooldownFlat: number;
  damageMultiplier: number;
  damageBonusPercent: number;
  bonusCritChance: number;
  bonusCritDamage: number;
  hitChanceBonus: number;
  defenseIgnoreRatio: number;
  actionDelayMultiplier: number;
  alwaysHit: boolean;
  elementalPenetrationBonus: number;
  splashRatio: number;
  targetGaugePush: number;
  consumeKeys: string[];
}

export function createEquipmentRuntimeState(): EquipmentRuntimeState {
  return {
    counters: {}, flags: {}, links: {}, strings: {}, recentSkillIds: [], recentElements: [], attackedTargetIds: [],
    tookDamageSinceLastTurn: false,
  };
}

export const hasTrait = (actor: BattleActor, trait: string) => actor.traits.includes(trait);
export const hasTraitPrefix = (actor: BattleActor, prefix: string) => actor.traits.some((t) => t.startsWith(prefix));
export function ensureEquipmentRuntime(actor: BattleActor): EquipmentRuntimeState {
  if (!actor.equipmentRuntime) actor.equipmentRuntime = createEquipmentRuntimeState();
  return actor.equipmentRuntime;
}
export const getCounter = (actor: BattleActor, key: string) => ensureEquipmentRuntime(actor).counters[key] ?? 0;
export function setCounter(actor: BattleActor, key: string, value: number) {
  ensureEquipmentRuntime(actor).counters[key] = Math.max(0, value);
}
export function addCounter(actor: BattleActor, key: string, amount = 1, cap = Number.POSITIVE_INFINITY) {
  const next = Math.min(cap, getCounter(actor, key) + amount);
  setCounter(actor, key, next);
  return next;
}
export function addGauge(actor: BattleActor, amount: number) { actor.actionGauge += amount; }

export function getActionKind(skill: SkillDefinition): 'ATTACK' | 'DEFENSE' | 'SUPPORT' {
  if (skill.damageMultiplier != null) return 'ATTACK';
  if (skill.id === 'defend_stance' || /shield|iron_wall|smoke_bomb|veil/i.test(skill.id)) return 'DEFENSE';
  return 'SUPPORT';
}

function timelineIndex(state: BattleState | undefined, actorId: string): number {
  if (!state) return -1;
  return state.timeline.findIndex((entry) => entry.actorId === actorId);
}

function isFarthestEnemy(state: BattleState | undefined, actor: BattleActor, target?: BattleActor): boolean {
  if (!state || !target) return false;
  const enemyIds = actor.isPlayer || actor.isCompanion ? state.enemies.map((x) => x.id) : [state.player, ...state.companions].map((x) => x.id);
  let farthestId: string | undefined;
  let farthest = -1;
  for (const id of enemyIds) {
    const idx = timelineIndex(state, id);
    if (idx > farthest) { farthest = idx; farthestId = id; }
  }
  return farthestId === target.id;
}

export function getRuntimeSkillModifiers(
  actor: BattleActor,
  skill: SkillDefinition,
  target?: BattleActor,
  state?: BattleState,
): RuntimeSkillModifiers {
  const mod: RuntimeSkillModifiers = {
    costMultiplier: 1, costFlat: 0, cooldownFlat: 0, damageMultiplier: 1, damageBonusPercent: 0,
    bonusCritChance: 0, bonusCritDamage: 0, hitChanceBonus: 0, defenseIgnoreRatio: 0,
    actionDelayMultiplier: 1, alwaysHit: false, elementalPenetrationBonus: 0, splashRatio: 0,
    targetGaugePush: 0, consumeKeys: [],
  };
  const kind = getActionKind(skill);
  const rt = ensureEquipmentRuntime(actor);

  // 전직 특수 재능 -----------------------------------------------------------
  // 파멸의 마도학: 모든 마법 공격 피해 +25%, 마법 방어 20% 관통.
  if (hasTrait(actor, 'TALENT_DESTRUCTION_MASTERY') && kind === 'ATTACK' && (skill.scalingStat === 'magic' || skill.scalingStat === 'spirit')) {
    mod.damageBonusPercent += 25;
    mod.defenseIgnoreRatio = 1 - (1 - mod.defenseIgnoreRatio) * 0.8;
  }

  // 룬워드 임계 능력 ---------------------------------------------------------
  if (hasTrait(actor, 'RUNE_VENOM_24') && kind === 'ATTACK' && target?.statusEffects.some((s) => s.type === 'POISON')) mod.actionDelayMultiplier *= 0.90;
  if (hasTrait(actor, 'RUNE_FLAME_40') && skill.element === 'FIRE' && getCounter(actor, 'rune_flame_first') > 0) { mod.costFlat -= 4; mod.consumeKeys.push('rune_flame_first'); }
  if (hasTrait(actor, 'RUNE_RADIANCE_12') && kind === 'SUPPORT') { mod.costMultiplier *= 0.85; mod.actionDelayMultiplier *= 0.85; }
  if (hasTrait(actor, 'RUNE_DARKNESS_12') && kind === 'ATTACK' && target) {
    const missing = 1 - target.hp / Math.max(1, target.maxHp); mod.damageBonusPercent += Math.round(Math.min(25, missing * 35));
  }
  if (hasTrait(actor, 'RUNE_DRAGON_12') && kind === 'ATTACK' && (skill.actionDelay ?? 1) >= 1.2) mod.damageBonusPercent += 22;
  if (hasTrait(actor, 'RUNE_FROST_12') && skill.element === 'ICE' && kind === 'ATTACK') mod.targetGaugePush -= 90;
  if (hasTrait(actor, 'RUNE_FROST_24') && skill.element === 'ICE' && target?.statusEffects.some((s) => s.type === 'SLOW')) mod.bonusCritChance += 18;
  if (hasTrait(actor, 'RUNE_TEMPEST_40') && getCounter(actor, 'tempest_eye_ready') > 0) { mod.actionDelayMultiplier *= 0.55; mod.consumeKeys.push('tempest_eye_ready'); }
  if (hasTrait(actor, 'RUNE_ASTRAL_40') && getCounter(actor, 'astral_formula_ready') > 0 && (skill.scalingStat === 'magic' || skill.scalingStat === 'spirit')) {
    mod.costMultiplier *= 0.25; mod.actionDelayMultiplier *= 0.60; mod.elementalPenetrationBonus += 20; mod.consumeKeys.push('astral_formula_ready');
  }

  // 무희 성인 상태 연동 장비. adultEquipmentContext가 존재하는 성인 플레이어에서만 작동한다.
  const adult = actor.adultEquipmentContext;
  if (adult && hasTrait(actor, 'DANCER_ADULT_CORRUPTION_FLOW') && adult.effectiveCorruption >= 7 && skill.requiredClass === 'DANCER') {
    mod.damageBonusPercent += Math.floor((adult.effectiveCorruption - 6) * 4); mod.actionDelayMultiplier *= 0.92;
  }
  if (adult && hasTrait(actor, 'DANCER_ADULT_FLUID_RESONANCE') && skill.id === 'dancer_spinning_dance') {
    if (adult.fluidTotal >= 150) { mod.damageBonusPercent += 25; mod.actionDelayMultiplier *= 0.85; }
    if (adult.fluidTotal >= 220) { mod.costFlat -= 4; mod.targetGaugePush -= 120; }
  }
  if (adult && hasTrait(actor, 'DANCER_ADULT_PREGNANCY_TEMPO') && adult.pregnancyActive && skill.requiredClass === 'DANCER') mod.actionDelayMultiplier *= 0.90;
  if (adult && hasTrait(actor, 'DANCER_ADULT_DESIRE_RHYTHM') && adult.effectiveDesire >= 80 && skill.requiredClass === 'DANCER') mod.costFlat -= 1;

  // 일반 장비 메커니즘 --------------------------------------------------------
  if (hasTrait(actor, 'bleed_synergy') && kind === 'ATTACK' && target?.statusEffects.some((s) => s.type === 'BLEED')) mod.damageBonusPercent += 15;
  if (hasTrait(actor, 'EQ_LOW_COST_POWER') && actor.cost <= 5 && kind === 'ATTACK') mod.damageBonusPercent += 20;
  if (hasTrait(actor, 'EQ_OPENING_DOMINANCE') && kind === 'ATTACK' && target && target.hp / Math.max(1, target.maxHp) >= 0.85) { mod.damageBonusPercent += 18; mod.hitChanceBonus += 10; }
  if (hasTrait(actor, 'EQ_HEAVY_TIMING') && kind === 'ATTACK' && (skill.actionDelay ?? 1) >= 1.2) { mod.damageBonusPercent += 16; mod.targetGaugePush -= 80; }
  if (hasTrait(actor, 'EQ_OVERFLOW_CHALICE') && actor.cost >= actor.maxCost && kind === 'ATTACK') mod.damageBonusPercent += 28;
  if (hasTrait(actor, 'EQ_EXACT10_COOLDOWN') && (skill.cost ?? skill.mpCost ?? 0) === 10) mod.cooldownFlat -= 1;
  if (hasTrait(actor, 'EQ_BLOOD_ENGINE')) mod.actionDelayMultiplier *= 0.8;
  if (hasTrait(actor, 'EQ_LAST_STAR') && state && timelineIndex(state, actor.id) === state.timeline.length - 1) mod.actionDelayMultiplier *= 0.6;
  if (hasTrait(actor, 'EQ_SECOND_PLACE_PREDATOR') && state) {
    const idx = timelineIndex(state, actor.id);
    if (idx > 0) {
      const previousId = state.timeline[idx - 1]?.actorId;
      const previous = [state.player, ...state.companions, ...state.enemies].find((a) => a.id === previousId);
      if (previous && (previous.isPlayer || previous.isCompanion) !== (actor.isPlayer || actor.isCompanion)) mod.damageBonusPercent += 18;
    }
  }
  if (hasTrait(actor, 'EQ_MISS_FOCUS') && getCounter(actor, 'miss_focus') > 0 && kind === 'ATTACK') {
    mod.hitChanceBonus += 30; mod.bonusCritChance += 15; mod.consumeKeys.push('miss_focus');
  }
  if (hasTrait(actor, 'EQ_GUARD_UNUSED_POWER') && getCounter(actor, 'unused_guard_power') > 0 && kind === 'ATTACK') {
    mod.damageBonusPercent += 25; mod.consumeKeys.push('unused_guard_power');
  }
  if (hasTrait(actor, 'EQ_OVERTAKE_CRIT') && getCounter(actor, 'overtake_crit') > 0 && kind === 'ATTACK') { mod.bonusCritDamage += 0.25; mod.consumeKeys.push('overtake_crit'); }
  if (hasTrait(actor, 'EQ_SPLIT_PRISM') && kind === 'ATTACK' && (skill.scalingStat === 'magic' || skill.scalingStat === 'spirit') && skill.targetType === 'ENEMY') {
    mod.damageMultiplier *= 0.7; mod.splashRatio = Math.max(mod.splashRatio, 0.4);
  }
  if (hasTrait(actor, 'EQ_FROZEN_SECOND_HAND') && skill.element === 'ICE' && kind === 'ATTACK') mod.targetGaugePush -= hasTrait(actor, 'SYNERGY_ABSOLUTE_ZERO') ? 330 : 220;
  if (hasTrait(actor, 'SYNERGY_SILENT_CORRECTION') && getCounter(actor, 'miss_focus') > 0 && kind === 'ATTACK') { mod.hitChanceBonus += 15; mod.bonusCritChance += 5; }
  if (hasTrait(actor, 'SYNERGY_PRISMATIC_FORMULA') && mod.splashRatio > 0) { mod.splashRatio += 0.15; mod.elementalPenetrationBonus += 10; }
  if (hasTrait(actor, 'SYNERGY_ZERO_SUM') && (actor.cost <= 0 || actor.cost >= actor.maxCost) && kind === 'ATTACK') { mod.damageBonusPercent += 12; mod.hitChanceBonus += 10; }
  if (hasTrait(actor, 'SYNERGY_GUARDED_FURY') && getCounter(actor, 'unused_guard_power') > 0 && kind === 'ATTACK') mod.damageBonusPercent += 15;
  if (hasTrait(actor, 'SYNERGY_HUNTER_CLOCK') && getCounter(actor, 'same_target_streak') >= 3 && kind === 'ATTACK') mod.actionDelayMultiplier *= 0.85;

  // 특정 스킬 변이 ----------------------------------------------------------
  if (hasTrait(actor, 'MUT_FIREBOLT_REFLUX') && skill.id === 'mage_firebolt') {
    mod.damageMultiplier *= 0.75; mod.actionDelayMultiplier *= 0.72; mod.splashRatio = Math.max(mod.splashRatio, 0.45);
  }
  if (hasTrait(actor, 'MUT_PRECISION_SILENT') && skill.id === 'archer_precision_shot') {
    mod.costFlat -= 4; mod.actionDelayMultiplier *= 0.75; mod.bonusCritDamage += 0.2;
  }
  if (hasTrait(actor, 'MUT_ARROW_RAIN_FOCUS') && skill.id === 'archer_arrow_rain') {
    mod.damageMultiplier *= 1.45; mod.actionDelayMultiplier *= 1.1;
  }
  if (hasTrait(actor, 'MUT_WHIRLWIND_VORTEX') && skill.id === 'warrior_whirlwind') {
    mod.damageMultiplier *= 0.82; mod.targetGaugePush -= 140;
  }
  if (hasTrait(actor, 'MUT_FIRST_AID_FIELD') && skill.id === 'first_aid') mod.costFlat += 2;
  if (hasTrait(actor, 'MUT_DIVINE_HEAL_STIGMATA') && skill.id === 'cleric_divine_heal') mod.costFlat -= 2;

  // 세트: 전사 --------------------------------------------------------------
  if (hasTrait(actor, 'SET_IRON_BASTION_4') && getCounter(actor, 'iron_counter_ready') > 0 && kind === 'ATTACK') {
    mod.damageBonusPercent += 22; mod.actionDelayMultiplier *= 0.8; mod.consumeKeys.push('iron_counter_ready');
  }
  if (hasTrait(actor, 'SET_EMBER_LEGION_3') && getCounter(actor, 'ember_burst_ready') > 0 && kind === 'ATTACK') {
    mod.damageBonusPercent += 25; mod.consumeKeys.push('ember_burst_ready');
  }
  if (hasTrait(actor, 'SET_WORLDBREAKER_3') && kind === 'ATTACK') mod.actionDelayMultiplier *= Math.max(0.7, 1 - getCounter(actor, 'shatter') * 0.06);
  if (hasTrait(actor, 'SET_WORLDBREAKER_4') && getCounter(actor, 'shatter') >= 3 && kind === 'ATTACK') {
    mod.defenseIgnoreRatio = Math.max(mod.defenseIgnoreRatio, 0.3); mod.targetGaugePush -= 300; mod.consumeKeys.push('shatter');
  }

  // 세트: 궁수 --------------------------------------------------------------
  if (hasTrait(actor, 'SET_GALE_TRACKER_3') && target && rt.lastTargetId === target.id) {
    const streak = getCounter(actor, 'same_target_streak'); mod.hitChanceBonus += Math.min(18, streak * 6); mod.bonusCritChance += Math.min(12, streak * 4);
  }
  if (hasTrait(actor, 'SET_MOON_HUNTER_2') && target && !rt.attackedTargetIds.includes(target.id)) mod.damageBonusPercent += 18;
  if (hasTrait(actor, 'SET_STARFALL_2') && state && target) {
    const actorIdx = Math.max(0, timelineIndex(state, actor.id)); const targetIdx = timelineIndex(state, target.id);
    if (targetIdx > actorIdx) { mod.damageBonusPercent += Math.min(21, (targetIdx - actorIdx) * 3); if (hasTrait(actor,'SET_STARFALL_3')) mod.hitChanceBonus += Math.min(18,(targetIdx-actorIdx)*3); }
  }
  if (hasTrait(actor, 'SET_STARFALL_4') && isFarthestEnemy(state, actor, target)) {
    mod.defenseIgnoreRatio = Math.max(mod.defenseIgnoreRatio, 0.35); mod.bonusCritChance += 25;
  }

  // 세트: 도적 --------------------------------------------------------------
  if (hasTrait(actor, 'SET_NIGHT_FOX_3') && getCounter(actor, 'after_evade') > 0 && kind === 'ATTACK') {
    mod.bonusCritChance += 25; mod.actionDelayMultiplier *= 0.75; mod.consumeKeys.push('after_evade');
  }
  if (hasTrait(actor, 'SET_BLOOD_MIRAGE_3')) mod.bonusCritChance += Math.min(20, getCounter(actor, 'mirage') * 4);
  if (hasTrait(actor, 'SET_VOID_ASSASSIN_4') && getCounter(actor, 'trace') >= 3 && kind === 'ATTACK' && skill.targetType === 'ENEMY') {
    mod.actionDelayMultiplier *= 0.5; mod.damageBonusPercent += 20; mod.consumeKeys.push('trace');
  }

  // 세트: 성직자 ------------------------------------------------------------
  if (hasTrait(actor, 'SET_SAINT_WARDEN_4') && skill.id === 'cleric_divine_heal' && target && target.hp / Math.max(1, target.maxHp) <= 0.35) mod.actionDelayMultiplier *= 0.65;

  // 세트: 무희 --------------------------------------------------------------
  if (hasTrait(actor, 'SET_SILK_MOON_4') && getCounter(actor, 'beat') >= 4) { mod.costMultiplier *= 0.5; mod.consumeKeys.push('beat'); }
  if (hasTrait(actor, 'SET_PETAL_TEMPEST_4') && getCounter(actor, 'switch_bonus') > 0) {
    mod.actionDelayMultiplier *= 0.7; if (kind === 'ATTACK') mod.damageBonusPercent += 25; mod.consumeKeys.push('switch_bonus');
  }
  if (hasTrait(actor, 'SET_CELESTIAL_DANCE_4') && getCounter(actor, 'perfect_dance') > 0) {
    mod.costMultiplier = 0; mod.actionDelayMultiplier *= 0.5; mod.damageBonusPercent += 25; mod.consumeKeys.push('perfect_dance');
  }

  // 세트: 마법사 ------------------------------------------------------------
  if (hasTrait(actor, 'SET_RUNE_SCHOLAR_3') && skill.element && skill.element !== 'NEUTRAL') mod.elementalPenetrationBonus += Math.min(24, getCounter(actor, 'rune_analysis') * 8);
  if (hasTrait(actor, 'SET_COMET_ARCHMAGE_2') && skill.element === 'FIRE') {
    const altitude = getCounter(actor, 'comet_altitude'); mod.damageBonusPercent += altitude * 8; mod.actionDelayMultiplier *= 1 + altitude * 0.05;
  }
  if (hasTrait(actor, 'SET_COMET_ARCHMAGE_4') && skill.element === 'FIRE' && getCounter(actor, 'comet_altitude') >= 3) {
    mod.damageBonusPercent += 50; mod.consumeKeys.push('comet_altitude');
  }
  if (hasTrait(actor, 'SET_ORIGIN_WEAVER_4') && getCounter(actor, 'formula_ready') > 0 && kind === 'ATTACK') {
    const formula = getCounter(actor, 'formula_ready');
    if (formula === 1) mod.elementalPenetrationBonus += 35;
    if (formula === 2) mod.splashRatio = Math.max(mod.splashRatio, 0.45);
    if (formula === 3) mod.actionDelayMultiplier *= 0.65;
    if (formula === 4) mod.damageBonusPercent += 35;
    mod.consumeKeys.push('formula_ready');
  }

  return mod;
}

export function consumeRuntimeKeys(actor: BattleActor, keys: string[]) {
  for (const key of keys) setCounter(actor, key, 0);
}

export function effectiveEvasionRuntimeBonus(actor: BattleActor): number {
  let bonus = 0;
  if (hasTrait(actor, 'mirage_evasion')) bonus += 10;
  if (hasTrait(actor, 'SET_BLOOD_MIRAGE_2')) bonus += Math.min(25, getCounter(actor, 'mirage') * 5);
  return bonus;
}

export function damageTakenMultiplierFromEquipment(actor: BattleActor): number {
  let mult = 1;
  if (hasTrait(actor, 'EQ_HEAVY_CROWN')) mult *= 0.8;
  if (hasTrait(actor, 'SET_IRON_BASTION_3') && getCounter(actor, 'iron_wall') > 0) mult *= 0.8;
  if (hasTrait(actor, 'SET_BLOOD_MIRAGE_4') && getCounter(actor, 'mirage') > 0) mult *= Math.max(0.65, 1 - getCounter(actor, 'mirage') * 0.08);
  if (hasTrait(actor, 'SET_ABYSS_JUGGERNAUT_3') && actor.statusEffects.some((s) => s.name === '심연갑' && (s.value ?? 0) > 0)) mult *= 0.88;
  return mult;
}

export function onEquipmentTurnStart(actor: BattleActor, state: BattleState): string[] {
  const logs: string[] = [];
  const actorRt = ensureEquipmentRuntime(actor);
  const tookDamage = !!actorRt.tookDamageSinceLastTurn;
  if (getCounter(actor, 'guard_waiting') > 0) {
    if (!tookDamage && hasTrait(actor, 'EQ_GUARD_UNUSED_POWER')) { setCounter(actor, 'unused_guard_power', 1); logs.push('공격받지 않은 방어가 다음 공격을 강화한다.'); }
    setCounter(actor, 'guard_waiting', 0);
  }
  ensureEquipmentRuntime(actor).tookDamageSinceLastTurn = false;
  if (hasTrait(actor, 'EQ_BLOOD_ENGINE') && actor.hp > 1) {
    const loss = Math.max(1, Math.floor(actor.maxHp * 0.02)); actor.hp = Math.max(1, actor.hp - loss); actor.cost = Math.min(actor.maxCost, actor.cost + 2);
    logs.push(`폭주의 심장이 박동해 HP ${loss}을 소모하고 COST 2를 회복했다.`);
  }
  if (hasTrait(actor, 'EQ_LAST_STAR') && state.timeline.findIndex((e) => e.actorId === actor.id) === state.timeline.length - 1) {
    actor.cost = Math.min(actor.maxCost, actor.cost + 5); logs.push('마지막 별이 가장 늦은 행동을 감지해 COST 5를 보충했다.');
  }
  if (hasTrait(actor, 'SYNERGY_PARADOX_ROUTE') && state.timeline.findIndex((e) => e.actorId === actor.id) === state.timeline.length - 1) { actor.cost = Math.min(actor.maxCost, actor.cost + 3); addGauge(actor, 120); logs.push('역설 항로가 최후순위를 감지해 COST와 행동 게이지를 당겼다.'); }
  if (hasTrait(actor, 'SYNERGY_BLOOD_THRONE') && hasTrait(actor, 'EQ_BLOOD_ENGINE')) addGauge(actor, 100);
  if (hasTrait(actor, 'SET_BLOOD_MIRAGE_2') && !tookDamage) {
    addCounter(actor, 'mirage', 1, 5);
  }
  if (hasTrait(actor, 'RUNE_FLAME_40')) setCounter(actor, 'rune_flame_first', 1);
  if (hasTrait(actor, 'RUNE_DRAGON_40') && actor.hp / Math.max(1, actor.maxHp) <= 0.35 && !(actor.consumedBattleEffects || []).includes('rune_dragon_awaken')) {
    actor.statusEffects.push({ id:`dragon_awaken_atk_${Date.now()}`, type:'ATK_UP', name:'용혈각성', duration:3, value:30, sourceActorId:actor.id, skipNextDurationTick:true });
    actor.statusEffects.push({ id:`dragon_awaken_def_${Date.now()}`, type:'DEF_UP', name:'용혈각성', duration:3, value:25, sourceActorId:actor.id, skipNextDurationTick:true });
    actor.statusEffects.push({ id:`dragon_awaken_spd_${Date.now()}`, type:'SPEED_UP', name:'용혈각성', duration:3, value:25, sourceActorId:actor.id, skipNextDurationTick:true });
    actor.cost = Math.min(actor.maxCost, actor.cost + 5);
    actor.consumedBattleEffects = [...(actor.consumedBattleEffects || []), 'rune_dragon_awaken'];
    logs.push('용혈각성이 발동해 공격·방어·속도가 크게 상승했다.');
  }

  // 신기루연화: 자신이 버프한 아군이 행동하면 무희에게 갈채.
  const sourceId = ensureEquipmentRuntime(actor).links['mirage_lotus_source'];
  if (sourceId) {
    const source = [state.player, ...state.companions, ...state.enemies].find((a) => a.id === sourceId);
    if (source && hasTrait(source, 'SET_MIRAGE_LOTUS_3')) {
      const applause = addCounter(source, 'applause', 1, 4);
      if (applause >= 4 && hasTrait(source, 'SET_MIRAGE_LOTUS_4')) {
        const party = source.isPlayer || source.isCompanion ? [state.player, ...state.companions] : state.enemies;
        const slowest = party.filter((a) => a.hp > 0).sort((a,b) => a.actionGauge - b.actionGauge)[0];
        if (slowest) addGauge(slowest, 250);
        setCounter(source, 'applause', 0);
      }
    }
  }
  return logs;
}

export function onEquipmentTurnEnd(actor: BattleActor): string[] {
  const logs: string[] = [];
  const rt = ensureEquipmentRuntime(actor);
  if (hasTrait(actor, 'EQ_GUARD_UNUSED_POWER') && rt.flags['defended_this_action']) setCounter(actor, 'guard_waiting', 1);
  rt.flags['defended_this_action'] = false;
  if (getCounter(actor, 'fire_res_down_turns') > 0) {
    const turns = getCounter(actor, 'fire_res_down_turns') - 1; setCounter(actor, 'fire_res_down_turns', turns); if (turns <= 0) setCounter(actor, 'fire_res_down', 0);
  }
  return logs;
}

export interface DamageOutcomeLike { isHit: boolean; isCrit: boolean; finalDamage: number; shieldAbsorbed: number; wasEvaded?: boolean; }

export function onEquipmentDamageOutcome(
  source: BattleActor,
  target: BattleActor,
  skill: SkillDefinition,
  result: DamageOutcomeLike,
  state?: BattleState,
): string[] {
  const logs: string[] = [];
  const kind = getActionKind(skill);

  // 광명 40: 전투당 1회 치명상 방지.
  if (result.isHit && target.hp <= 0 && hasTrait(target, 'RUNE_RADIANCE_40') && !(target.consumedBattleEffects || []).includes('rune_radiance_miracle')) {
    target.hp = 1;
    target.statusEffects.push({ id:`rune_radiance_${Date.now()}`, type:'SHIELD', name:'여명의 기적', duration:2, value:Math.max(1, Math.round(target.maxHp * 0.18)), sourceActorId:target.id });
    target.consumedBattleEffects = [...(target.consumedBattleEffects || []), 'rune_radiance_miracle'];
    logs.push(`${target.name}의 광명 룬이 치명상을 막아냈다.`);
  }

  // 불사신의 의지: 전투당 1회 HP 1 생존 + 자신의 다음 행동 종료까지 피해 무효.
  if (result.isHit && target.hp <= 0 && hasTrait(target, 'TALENT_UNYIELDING_STAND') && !(target.consumedBattleEffects || []).includes('talent_unyielding_stand')) {
    target.hp = 1;
    target.statusEffects = target.statusEffects.filter((status) => status.type !== 'INVULNERABLE');
    target.statusEffects.push({ id:`unyielding_${Date.now()}_${target.id}`, type:'INVULNERABLE', name:'불사신의 의지', duration:1, value:1, sourceActorId:target.id });
    target.consumedBattleEffects = [...(target.consumedBattleEffects || []), 'talent_unyielding_stand'];
    logs.push(`${target.name}이(가) 불사신의 의지로 치명상을 버티고 잠시 모든 피해를 거부한다.`);
  }

  // 불굴 비약: 지속시간 안에 처음 발생한 치명상 1회를 HP 1로 버틴다.
  if (result.isHit && target.hp <= 0) {
    const undying = target.statusEffects.find((status) => status.type === 'UNDYING' && (status.value ?? 1) > 0);
    if (undying) {
      target.hp = 1;
      target.statusEffects = target.statusEffects.filter((status) => status.id !== undying.id);
      logs.push(`${target.name}이(가) 불굴 비약의 효과로 치명상을 버티고 HP 1로 생존했다.`);
    }
  }

  if (!result.isHit) {
    if (hasTrait(source, 'EQ_MISS_FOCUS')) setCounter(source, 'miss_focus', 1);
    if (result.wasEvaded) {
      if (hasTrait(target, 'mirage_evasion')) {
        target.statusEffects.push({ id:`mirage_evasion_${Date.now()}_${target.id}`, type:'SPEED_UP', name:'신기루 가속', duration:1, value:20, sourceActorId:target.id, skipNextDurationTick:true });
        logs.push(`${target.name}의 신기루가 공격을 흘려내 다음 행동 속도를 높였다.`);
      }
      if (hasTrait(target, 'TALENT_ROGUE_EVASION_CRIT')) {
        target.statusEffects = target.statusEffects.filter((status) => status.type !== 'CRIT_UP');
        target.statusEffects.push({ id:`rogue_evasion_crit_${Date.now()}_${target.id}`, type:'CRIT_UP', name:'회피의 기회', duration:1, value:100, sourceActorId:target.id, skipNextDurationTick:true });
        logs.push(`${target.name}이(가) 완벽히 회피해 다음 공격의 치명타를 확정했다.`);
      }
      if (hasTrait(target, 'EQ_EVADE_HASTE')) addGauge(target, 250);
      if (hasTrait(target, 'SET_NIGHT_FOX_2')) addGauge(target, 250);
      if (hasTrait(target, 'SET_NIGHT_FOX_3')) setCounter(target, 'after_evade', 1);
    }
    return logs;
  }

  if (result.finalDamage > 0) {
    if (hasTrait(source, 'vampirism_15') && source.hp > 0 && source.hp < source.maxHp) {
      const requested = Math.max(1, Math.round(result.finalDamage * 0.15));
      const healed = Math.min(requested, source.maxHp - source.hp);
      if (healed > 0) {
        source.hp += healed;
        logs.push(`${source.name}이(가) 흡혈 효과로 HP ${healed}을 회복했다.`);
      }
    }
    ensureEquipmentRuntime(target).tookDamageSinceLastTurn = true;
    if (hasTrait(target, 'RUNE_DRAGON_24') && result.finalDamage >= target.maxHp * 0.18) {
      target.statusEffects.push({ id:`rune_dragon_scale_${Date.now()}`, type:'SHIELD', name:'역린의 용린', duration:2, value:Math.max(1, Math.round(target.maxHp * 0.10)), sourceActorId:target.id, skipNextDurationTick:true });
      target.cost = Math.min(target.maxCost, target.cost + 3); logs.push('역린이 반응해 용린 보호막과 COST를 얻었다.');
    }
    if (hasTrait(target, 'SET_IRON_BASTION_3') && getCounter(target, 'iron_wall') > 0) {
      setCounter(target, 'iron_wall', 0); if (hasTrait(target, 'SET_IRON_BASTION_4')) setCounter(target, 'iron_counter_ready', 1);
    }
    if (hasTrait(target, 'SET_BLOOD_MIRAGE_4') && getCounter(target, 'mirage') > 0) {
      const stacks = getCounter(target, 'mirage'); source.actionGauge -= stacks * 100; setCounter(target, 'mirage', 0);
    }
    if (hasTrait(target, 'SET_ABYSS_JUGGERNAUT_2') && result.finalDamage >= target.maxHp * 0.15 && !target.statusEffects.some((s)=>s.name==='심연갑' && (s.value??0)>0)) {
      target.statusEffects.push({ id:`abyss_armor_${Date.now()}`, type:'SHIELD', name:'심연갑', duration:3, value:Math.round(target.maxHp*0.12), sourceActorId:target.id, skipNextDurationTick:true });
      logs.push(`${target.name}에게 심연갑이 생성되었다.`);
    }
    if (hasTrait(target, 'SET_ABYSS_JUGGERNAUT_4') && result.shieldAbsorbed > 0 && !target.statusEffects.some((s)=>s.name==='심연갑' && (s.value??0)>0)) { target.cost = Math.min(target.maxCost, target.cost + 4); source.hp = Math.max(0, source.hp - Math.max(1, Math.round(target.maxHp*0.04))); logs.push('심연갑이 파괴되며 암흑 반동이 공격자에게 되돌아갔다.'); }
    if (state && result.finalDamage >= target.maxHp*0.18) {
      const party = target.isPlayer || target.isCompanion ? [state.player, ...state.companions] : state.enemies;
      for (const ally of party) if (hasTrait(ally,'SET_LAST_SANCTUARY_2')) addCounter(ally,'prayer',1,5);
    }
    const sanctuarySource = ensureEquipmentRuntime(target).links['saint_warden_source'];
    if (state && sanctuarySource) { const ward = [state.player,...state.companions,...state.enemies].find((a)=>a.id===sanctuarySource); if (ward && hasTrait(ward,'SET_SAINT_WARDEN_3')) addGauge(ward,100); }
    const dawnSource = ensureEquipmentRuntime(target).links['dawn_priest_source'];
    if (state && dawnSource && result.shieldAbsorbed>0 && !target.statusEffects.some((s)=>s.name==='넘친 기도' && (s.value??0)>0)) { const priest=[state.player,...state.companions,...state.enemies].find((a)=>a.id===dawnSource); if(priest&&hasTrait(priest,'SET_DAWN_PRIEST_4')) priest.cost=Math.min(priest.maxCost,priest.cost+2); }
  }

  if (result.isCrit) {
    if (hasTrait(source, 'TALENT_ARCHER_HEADHUNTER') && target.hp > 0) {
      target.statusEffects.push({ id:`headhunter_bleed_${Date.now()}_${target.id}`, type:'BLEED', name:'약점 사냥꾼', duration:2, value:Math.max(2, Math.round(source.stats.physicalAttack * 0.25)), sourceActorId:source.id });
      addGauge(source, 250);
      logs.push(`${source.name}의 약점 사냥이 출혈을 남기고 행동 게이지를 25% 회복했다.`);
    }
    if (hasTrait(source, 'RUNE_TEMPEST_12') && !ensureEquipmentRuntime(source).flags['rune_tempest_crit_action']) { addGauge(source, 140); ensureEquipmentRuntime(source).flags['rune_tempest_crit_action'] = true; logs.push('폭풍 룬이 치명타의 흐름을 붙잡아 행동을 앞당겼다.'); }
    if (hasTrait(source, 'EQ_CRIT_MOMENTUM') && !ensureEquipmentRuntime(source).flags['crit_momentum_used_action']) { addGauge(source, 120); ensureEquipmentRuntime(source).flags['crit_momentum_used_action'] = true; logs.push('치명타의 탄력이 다음 행동을 앞당겼다.'); }
    if (hasTrait(source, 'SET_VENOM_REAPER_2')) addCounter(target, `venom_${source.id}`, 1, 5);
    if (hasTrait(source, 'SET_VOID_ASSASSIN_2')) addCounter(source, 'trace', 1, 3);
    if (hasTrait(source, 'SET_VOID_ASSASSIN_3')) source.cost = Math.min(source.maxCost, source.cost + 2);
    if (hasTrait(source, 'SET_NIGHT_FOX_4') && getCounter(source, 'after_evade') > 0) source.cost = Math.min(source.maxCost, source.cost + 3);
    if (hasTrait(source, 'SET_THUNDER_EAGLE_2') && state) {
      const pool = (source.isPlayer || source.isCompanion ? state.enemies : [state.player, ...state.companions]).filter((a) => a.hp > 0 && a.id !== target.id);
      const chained = pool[0];
      if (chained) { const shock = Math.max(1, Math.round(result.finalDamage * 0.35)); chained.hp = Math.max(0, chained.hp - shock); logs.push(`연쇄 번개가 ${chained.name}에게 ${shock}의 추가 피해를 입혔다.`); if (hasTrait(source, 'SET_THUNDER_EAGLE_3')) addGauge(source, 120); }
    }
  }

  if (hasTrait(source, 'SET_GALE_TRACKER_2') && kind === 'ATTACK') addGauge(source, 100);
  if (hasTrait(source,'SYNERGY_HUNTER_CLOCK') && kind==='ATTACK') { if (ensureEquipmentRuntime(source).lastTargetId===target.id) addCounter(source,'same_target_streak',1,5); else setCounter(source,'same_target_streak',1); }
  if (hasTrait(source, 'SET_GALE_TRACKER_3') && kind === 'ATTACK') {
    if (ensureEquipmentRuntime(source).lastTargetId === target.id) addCounter(source, 'same_target_streak', 1, 3); else setCounter(source, 'same_target_streak', 1);
    if (hasTrait(source, 'SET_GALE_TRACKER_4') && getCounter(source, 'same_target_streak') >= 3) { target.hp = Math.max(0, target.hp - Math.max(1, Math.round(result.finalDamage * 0.35))); setCounter(source, 'same_target_streak', 0); logs.push('추격사격이 연속 명중 끝에 추가로 꽂혔다.'); }
  }
  if (hasTrait(source, 'SET_MOON_HUNTER_3') && !ensureEquipmentRuntime(source).attackedTargetIds.includes(target.id)) ensureEquipmentRuntime(target).flags[`moon_mark_${source.id}`] = true;
  if (hasTrait(source, 'SET_MOON_HUNTER_4') && ensureEquipmentRuntime(target).flags[`moon_mark_${source.id}`] && Math.random() < 0.25) { source.cost = Math.min(source.maxCost, source.cost + (skill.cost ?? skill.mpCost ?? 0)); logs.push('월하의 표식이 반응해 사용한 COST를 되돌렸다.'); }
  if (!ensureEquipmentRuntime(source).attackedTargetIds.includes(target.id)) ensureEquipmentRuntime(source).attackedTargetIds.push(target.id);
  if (hasTrait(source,'SET_EMBER_LEGION_4') && getCounter(source,'ember_burst_ready') > 0) { setCounter(target,'fire_res_down',15); setCounter(target,'fire_res_down_turns',2); logs.push('잔불 폭발이 대상의 화염 저항을 15 낮췄다.'); }
  if (target.hp <= 0 && hasTrait(source,'SET_VOID_ASSASSIN_2')) addCounter(source,'trace',1,3);

  if (hasTrait(source, 'SET_VENOM_REAPER_3') && getCounter(target, `venom_${source.id}`) > 0) {
    const stacks = getCounter(target, `venom_${source.id}`); target.hp = Math.max(0, target.hp - Math.round(source.stats.physicalAttack * 0.08 * stacks));
    if (hasTrait(source, 'SET_VENOM_REAPER_4') && stacks >= 5) { target.hp = Math.max(0, target.hp - Math.round(source.stats.physicalAttack * 0.6)); setCounter(target, `venom_${source.id}`, 0); logs.push('축적된 맹독이 한꺼번에 파열했다.'); }
  }

  if (hasTrait(source, 'SET_FROST_ASTROLOGER_2') && skill.element === 'ICE') {
    const fp = addCounter(target, `frost_point_${source.id}`, 1, 4);
    if (fp >= 2 && hasTrait(source, 'SET_FROST_ASTROLOGER_3')) target.actionGauge -= 70;
    if (fp >= 4 && hasTrait(source, 'SET_FROST_ASTROLOGER_4')) { target.actionGauge -= 280; setCounter(target, `frost_point_${source.id}`, 0); logs.push('빙점 관측이 완성되어 대상의 행동 순서가 크게 밀려났다.'); }
  }
  if (hasTrait(source, 'RUNE_FLAME_24') && skill.element === 'FIRE' && target.statusEffects.some((s) => s.type === 'BURN') && state) {
    const others = (source.isPlayer || source.isCompanion ? state.enemies : [state.player, ...state.companions]).filter((a) => a.hp > 0 && a.id !== target.id).slice(0, 2);
    for (const other of others) { const splash = Math.max(1, Math.round(result.finalDamage * 0.18)); other.hp = Math.max(0, other.hp - splash); }
    if (others.length) logs.push('화염 전이가 주변 적에게 번졌다.');
  }
  if (hasTrait(source, 'RUNE_TEMPEST_24') && skill.element === 'LIGHTNING' && state) {
    const other = (source.isPlayer || source.isCompanion ? state.enemies : [state.player, ...state.companions]).find((a) => a.hp > 0 && a.id !== target.id);
    if (other) { const chain = Math.max(1, Math.round(result.finalDamage * 0.28)); other.hp = Math.max(0, other.hp - chain); logs.push(`폭풍 룬의 전도가 ${other.name}에게 이어졌다.`); }
  }
  if (target.hp <= 0 && hasTrait(source, 'RUNE_DARKNESS_24')) { source.cost = Math.min(source.maxCost, source.cost + 5); addGauge(source, 180); logs.push('암흑 룬이 쓰러진 적의 종말을 회수했다.'); }
  if (target.hp <= 0 && hasTrait(source, 'TALENT_SOUL_HARVEST')) {
    const killFlag = `talent_soul_harvest_${source.id}`;
    if (!ensureEquipmentRuntime(target).flags[killFlag]) {
      ensureEquipmentRuntime(target).flags[killFlag] = true;
      const mpGain = Math.max(1, Math.round(source.maxMp * 0.3));
      const beforeMp = source.mp;
      source.mp = Math.min(source.maxMp, source.mp + mpGain);
      // CTB 전투에서는 COST가 실제 스킬 자원이므로 영혼 강탈이 전투 중에도 체감되도록 동등 비율을 보충한다.
      const costGain = Math.max(1, Math.round(source.maxCost * 0.3));
      const beforeCost = source.cost;
      source.cost = Math.min(source.maxCost, source.cost + costGain);
      logs.push(`${source.name}이(가) 쓰러진 적의 영혼을 거둬 MP ${source.mp - beforeMp}, COST ${source.cost - beforeCost}을 회복했다.`);
    }
  }
  if (hasTrait(source, 'RUNE_VENOM_40') && target.statusEffects.some((s) => s.type === 'POISON')) {
    const hits = addCounter(source, `rune_venom_hits_${target.id}`, 1, 3);
    if (hits >= 3) {
      const poison = target.statusEffects.find((s) => s.type === 'POISON');
      if (poison) { const burst = Math.max(1, Math.round((poison.value || 1) * 2.5)); target.hp = Math.max(0, target.hp - burst); poison.duration = Math.max(1, poison.duration); logs.push('만독개화가 축적된 독을 폭발시켰다.'); }
      setCounter(source, `rune_venom_hits_${target.id}`, 0);
    }
  }

  if (result.finalDamage > 0 && hasTrait(source, 'TALENT_SPELL_ACCELERATOR') && (skill.scalingStat === 'magic' || skill.scalingStat === 'spirit')) {
    const rt = ensureEquipmentRuntime(source);
    if (!rt.flags['talent_spell_accelerator_used_action'] && Math.random() < 0.35) {
      rt.flags['talent_spell_accelerator_used_action'] = true;
      source.statusEffects = source.statusEffects.filter((status) => status.type !== 'SPEED_UP' || status.name !== '주문 가속');
      source.statusEffects.push({ id:`spell_accelerator_${Date.now()}_${source.id}`, type:'SPEED_UP', name:'주문 가속', duration:1, value:25, sourceActorId:source.id, skipNextDurationTick:true });
      const beforeMp = source.mp;
      source.mp = Math.min(source.maxMp, source.mp + 10);
      logs.push(`${source.name}의 주문 가속이 발동해 다음 행동 속도가 25% 상승하고 MP ${source.mp - beforeMp}을 회복했다.`);
    }
  }

  return logs;
}

export function onEquipmentSkillResolved(actor: BattleActor, skill: SkillDefinition, targets: BattleActor[], state?: BattleState): string[] {
  const logs: string[] = [];
  const kind = getActionKind(skill);
  const rt = ensureEquipmentRuntime(actor);
  // 한 행동 1회 제한형 장비 플래그는 모든 타격 처리가 끝난 뒤 초기화한다.
  const usedCritMomentum = !!rt.flags['crit_momentum_used_action'];

  if (skill.id === 'defend_stance') {
    rt.flags['defended_this_action'] = true;
    if (hasTrait(actor, 'SET_IRON_BASTION_2')) setCounter(actor, 'iron_wall', 1);
  }
  if (hasTrait(actor,'SET_THUNDER_EAGLE_4') && kind==='ATTACK' && targets.length>=3) addGauge(actor,300);
  if (hasTrait(actor,'SET_SAINT_WARDEN_2') && (kind==='DEFENSE' || skill.id==='cleric_sacred_shield')) for(const t of targets) ensureEquipmentRuntime(t).links['saint_warden_source']=actor.id;
  if (hasTrait(actor,'SET_SERAPHIC_CHOIR_2') && kind==='SUPPORT') { const tid=targets[0]?.id; if(tid && rt.strings['choir_last_target']!==tid){ const h=addCounter(actor,'harmony',1,4); rt.strings['choir_last_target']=tid; if(hasTrait(actor,'SET_SERAPHIC_CHOIR_3')) actor.cost=Math.min(actor.maxCost,actor.cost+Math.min(2,h)); if(h>=4&&hasTrait(actor,'SET_SERAPHIC_CHOIR_4')) setCounter(actor,'choir_echo_ready',1); } }
  if (hasTrait(actor,'SET_SERAPHIC_CHOIR_4') && kind==='SUPPORT' && getCounter(actor,'choir_echo_ready')>0 && state) { const party=actor.isPlayer||actor.isCompanion?[state.player,...state.companions]:state.enemies; for(const ally of party.filter(a=>a.hp>0&&!targets.some(t=>t.id===a.id))) ally.statusEffects.push({id:`choir_${Date.now()}_${ally.id}`,type:'ATK_UP',name:'성가의 잔향',duration:2,value:10,sourceActorId:actor.id}); setCounter(actor,'harmony',0); setCounter(actor,'choir_echo_ready',0); }
  if (hasTrait(actor,'SYNERGY_RESONANCE_DUET') && rt.lastSkillId && rt.lastSkillId!==skill.id) actor.cost=Math.min(actor.maxCost,actor.cost+1);
  if (hasTrait(actor,'SYNERGY_TWIN_STEPS') && rt.lastActionKind && rt.lastActionKind!==kind) addGauge(actor,100);
  if (hasTrait(actor, 'EQ_OVERFLOW_CHALICE') && actor.cost >= actor.maxCost && kind === 'ATTACK') actor.cost = 0;

  if (hasTrait(actor, 'SET_EMBER_LEGION_2') && kind === 'ATTACK') {
    const ember = addCounter(actor, 'ember', 1, 3);
    if (ember >= 3 && hasTrait(actor, 'SET_EMBER_LEGION_3')) { setCounter(actor, 'ember_burst_ready', 1); setCounter(actor, 'ember', 0); }
  }
  if (hasTrait(actor, 'SET_WORLDBREAKER_2') && kind === 'ATTACK' && (skill.actionDelay ?? 1) >= 1.2) addCounter(actor, 'shatter', 1, 3);

  if (hasTrait(actor, 'SET_SILK_MOON_2') && kind === 'SUPPORT') addCounter(actor, 'beat', 1, 4);
  if (hasTrait(actor, 'SET_SILK_MOON_3') && rt.lastActionKind && rt.lastActionKind !== kind && ((rt.lastActionKind === 'ATTACK' && kind === 'SUPPORT') || (rt.lastActionKind === 'SUPPORT' && kind === 'ATTACK'))) addCounter(actor, 'beat', 1, 4);

  if (hasTrait(actor, 'SET_PETAL_TEMPEST_2')) {
    if (rt.lastActionKind === kind) addCounter(actor, 'repeat', 1, 3);
    else if (rt.lastActionKind && getCounter(actor, 'repeat') > 0) { if (hasTrait(actor, 'SET_PETAL_TEMPEST_3')) setCounter(actor, 'switch_bonus', 1); setCounter(actor, 'repeat', 0); }
  }

  if (hasTrait(actor, 'SET_MIRAGE_LOTUS_2') && kind === 'SUPPORT') for (const target of targets) ensureEquipmentRuntime(target).links['mirage_lotus_source'] = actor.id;

  if (hasTrait(actor, 'SET_CELESTIAL_DANCE_2')) {
    const history = [...rt.recentSkillIds.filter((id) => id !== skill.id), skill.id].slice(-4); rt.recentSkillIds = history;
    if (hasTrait(actor, 'SET_CELESTIAL_DANCE_3') && new Set(history).size >= 3) actor.cost = Math.min(actor.maxCost, actor.cost + 2);
    if (hasTrait(actor, 'SET_CELESTIAL_DANCE_4') && history.length >= 4 && new Set(history).size === 4) { setCounter(actor, 'perfect_dance', 1); rt.recentSkillIds = []; }
  }

  if (skill.element && skill.element !== 'NEUTRAL') {
    if (hasTrait(actor, 'SET_RUNE_SCHOLAR_2')) {
      const same = rt.lastElement === skill.element; setCounter(actor, 'rune_analysis', same ? Math.min(3, getCounter(actor, 'rune_analysis') + 1) : 1);
      if (hasTrait(actor, 'SET_RUNE_SCHOLAR_4') && getCounter(actor, 'rune_analysis') >= 3) { actor.cost = Math.min(actor.maxCost, actor.cost + 4); setCounter(actor, 'rune_analysis', 0); }
    }
    if (hasTrait(actor, 'SET_COMET_ARCHMAGE_2') && skill.element === 'FIRE') addCounter(actor, 'comet_altitude', 1, 3);
    if (hasTrait(actor, 'SET_ORIGIN_WEAVER_2')) {
      const seq = [...rt.recentElements, skill.element].slice(-3); rt.recentElements = seq;
      if (hasTrait(actor, 'SET_ORIGIN_WEAVER_3') && seq.length === 3 && new Set(seq).size === 3) {
        const code = seq[0] === 'FIRE' ? 1 : seq[0] === 'ICE' ? 2 : seq[0] === 'LIGHTNING' ? 3 : 4; setCounter(actor, 'formula_ready', code); rt.recentElements = [];
      }
    }
    rt.lastElement = skill.element;
  }
  // 룬워드 행동 후 추적
  if (skill.element === 'ICE' && hasTrait(actor, 'RUNE_FROST_40')) {
    const frost = addCounter(actor, 'rune_frost_casts', 1, 3);
    if (frost >= 3) { for (const target of targets) target.actionGauge -= 260; actor.cost = Math.min(actor.maxCost, actor.cost + 4); setCounter(actor, 'rune_frost_casts', 0); logs.push('절대영도가 완성되어 대상의 Timeline을 크게 밀어냈다.'); }
  }
  if (hasTrait(actor, 'RUNE_TEMPEST_40') && kind === 'ATTACK') {
    const seq = [...rt.recentSkillIds.filter((id) => id !== skill.id), skill.id].slice(-3);
    if (seq.length >= 3 && new Set(seq).size >= 3) { setCounter(actor, 'tempest_eye_ready', 1); rt.recentSkillIds = []; logs.push('세 가지 공격이 폭풍안을 완성했다.'); }
  }
  if (skill.element && skill.element !== 'NEUTRAL' && (hasTrait(actor, 'RUNE_ASTRAL_24') || hasTrait(actor, 'RUNE_ASTRAL_40'))) {
    const astralSeq = [...rt.recentElements.filter((e) => e !== skill.element), skill.element].slice(-3); rt.recentElements = astralSeq;
    if (astralSeq.length === 3 && new Set(astralSeq).size === 3) {
      if (hasTrait(actor, 'RUNE_ASTRAL_24') && actor.skillCooldowns[skill.id] > 0) actor.skillCooldowns[skill.id] = Math.max(0, actor.skillCooldowns[skill.id] - 1);
      if (hasTrait(actor, 'RUNE_ASTRAL_40')) setCounter(actor, 'astral_formula_ready', 1);
      rt.recentElements = []; logs.push('비전 룬의 속성 공식이 완성됐다.');
    }
  }
  rt.flags['rune_tempest_crit_action'] = false;
  rt.flags['talent_spell_accelerator_used_action'] = false;

  rt.lastSkillId = skill.id; rt.lastTargetId = targets[0]?.id; rt.lastActionKind = kind;
  if (usedCritMomentum) rt.flags['crit_momentum_used_action'] = false;
  return logs;
}
