import {
  CRITICAL_CHANCE_CAP,
  CRITICAL_DAMAGE_CAP,
  ELEMENT_RESISTANCE_MAX,
  ELEMENT_RESISTANCE_MIN,
  HIT_CHANCE_MIN,
  HIT_CHANCE_MAX,
  BASE_HIT_CHANCE,
  ACCURACY_HIT_SCALING,
  EVASION_HIT_SCALING,
} from '../data/combatConfig';
import { BattleActor, CombatElement } from './combatTypes';
import { damageTakenMultiplierFromEquipment, effectiveEvasionRuntimeBonus, getCounter } from './equipmentRuntime';
import { getDragonFormDamageTakenMultiplier } from './dragonSovereignForm';

export interface DamageCalculationOptions {
  damageType?: 'PHYSICAL' | 'MAGIC';
  multiplier?: number;
  flatPenetration?: number;
  defenseIgnoreRatio?: number;
  bonusCritChance?: number;
  bonusCritDamage?: number;
  forceCrit?: boolean;
  bonusStagger?: number;
  element?: CombatElement;
  alwaysHit?: boolean;
  damageBonusPercent?: number;
  hitChanceBonus?: number;
  evasionIgnore?: number;
  elementalPenetrationBonus?: number;
}

export interface DamageCalculationResult {
  isHit: boolean;
  isCrit: boolean;
  rawDamage: number;
  mitigatedDamage: number;
  shieldAbsorbed: number;
  finalDamage: number;
  isDefending: boolean;
  staggerDamage: number;
  isStaggerTriggered: boolean;
  vampiricHeal?: number;
  element: CombatElement;
  elementMultiplier: number;
  effectiveElementResistance: number;
  critMultiplier: number;
  effectiveDefense: number;
  wasNegatedByInvulnerability?: boolean;
  wasEvaded?: boolean;
  hitChance: number;
  effectiveAccuracy: number;
  effectiveEvasion: number;
}

function getStatusValue(actor: BattleActor, type: string): number {
  return (actor.statusEffects || [])
    .filter((effect) => effect.type === type)
    .reduce((sum, effect) => sum + (effect.value ?? 0), 0);
}

function hasTrait(actor: BattleActor, traitId: string): boolean {
  return (actor.traits || []).includes(traitId);
}

function isCrisisAdrenalineActive(actor: BattleActor): boolean {
  return hasTrait(actor, 'TALENT_CRISIS_ADRENALINE') && actor.hp > 0 && actor.hp / Math.max(1, actor.maxHp) <= 0.35;
}

function getEffectiveAccuracy(actor: BattleActor): number {
  let value = actor.stats.accuracy ?? 95;
  value += getStatusValue(actor, 'ACCURACY_UP');
  value -= getStatusValue(actor, 'ACCURACY_DOWN');
  for (const blind of actor.statusEffects.filter((effect) => effect.type === 'BLIND')) {
    value -= blind.value ?? 30;
  }
  return Math.max(0, value);
}

function getEffectiveEvasion(actor: BattleActor): number {
  return Math.max(0, (actor.stats.evasion ?? 5) + getStatusValue(actor, 'EVASION_UP') + effectiveEvasionRuntimeBonus(actor));
}

/**
 * 명중/회피 전용 확률식.
 * - 명중은 회피가 0인 상대에게도 독립적으로 의미가 있다.
 * - 회피는 '원래 명중할 공격을 피한 경우'만 EVADE로 판정할 수 있도록 별도 기준 확률을 함께 반환한다.
 * - 최종 명중 확률은 5~99% 사이로 제한한다.
 */
export function calculateHitChance(attacker: BattleActor, defender: BattleActor, bonus = 0, evasionIgnore = 0): { hitChance: number; accuracyOnlyChance: number; accuracy: number; evasion: number } {
  const accuracy = getEffectiveAccuracy(attacker);
  const evasion = Math.max(0, getEffectiveEvasion(defender) - evasionIgnore);
  const accuracyOnlyChance = Math.min(
    HIT_CHANCE_MAX,
    Math.max(HIT_CHANCE_MIN, BASE_HIT_CHANCE + (accuracy - 100) * ACCURACY_HIT_SCALING + bonus)
  );
  const hitChance = Math.min(
    HIT_CHANCE_MAX,
    Math.max(HIT_CHANCE_MIN, accuracyOnlyChance - evasion * EVASION_HIT_SCALING)
  );
  return { hitChance, accuracyOnlyChance, accuracy, evasion };
}

function getEffectiveAttack(actor: BattleActor, damageType: 'PHYSICAL' | 'MAGIC'): number {
  const base = damageType === 'PHYSICAL' ? actor.stats.physicalAttack : actor.stats.magicAttack;
  let percent = isCrisisAdrenalineActive(actor) ? 25 : 0;
  percent += getStatusValue(actor, 'ATK_UP');
  if (damageType === 'MAGIC') percent += getStatusValue(actor, 'MAGIC_ATK_UP');
  percent -= getStatusValue(actor, 'WEAKEN');
  return Math.max(1, base * (1 + percent / 100));
}

function getEffectiveDefense(actor: BattleActor, damageType: 'PHYSICAL' | 'MAGIC'): number {
  const base = damageType === 'PHYSICAL' ? actor.stats.physicalDefense : actor.stats.magicDefense;
  let percent = getStatusValue(actor, 'DEF_UP') + (isCrisisAdrenalineActive(actor) ? 25 : 0);
  if (damageType === 'PHYSICAL') percent += getStatusValue(actor, 'PHYSICAL_DEF_UP');
  if (damageType === 'MAGIC') percent += getStatusValue(actor, 'MAGIC_DEF_UP');
  return Math.max(0, base * (1 + percent / 100));
}

function consumeInvulnerability(defender: BattleActor): boolean {
  const effect = defender.statusEffects.find(
    (status) => status.type === 'INVULNERABLE' && (status.value ?? 1) > 0
  );
  if (!effect) return false;

  // 불사신의 의지는 '1회 무효'가 아니라 자신의 다음 행동 종료까지 모든 피해를 무효화한다.
  // 지속시간은 statusEffectEngine이 관리하므로 피격 횟수로 소모하지 않는다.
  if (effect.name === '불사신의 의지') return true;

  effect.value = Math.max(0, (effect.value ?? 1) - 1);
  if ((effect.value ?? 0) <= 0) {
    defender.statusEffects = defender.statusEffects.filter((status) => status.id !== effect.id);
  }
  return true;
}

/**
 * 정밀 비율형 피해 공식.
 * 공격력 × 스킬 계수 × 방어계수 × 치명타 × 속성 × 기타 보정 순으로 처리한다.
 */
export function calculateDamage(
  attacker: BattleActor,
  defender: BattleActor,
  options: DamageCalculationOptions = {}
): DamageCalculationResult {
  const damageType = options.damageType ?? 'PHYSICAL';
  const multiplier = options.multiplier ?? 1;
  const element = options.element ?? 'NEUTRAL';

  // 0. 1회 완전 회피/무효화 계열
  if (consumeInvulnerability(defender)) {
    return {
      isHit: false,
      isCrit: false,
      rawDamage: 0,
      mitigatedDamage: 0,
      shieldAbsorbed: 0,
      finalDamage: 0,
      isDefending: false,
      staggerDamage: 0,
      isStaggerTriggered: false,
      element,
      elementMultiplier: 1,
      effectiveElementResistance: 0,
      critMultiplier: 1,
      effectiveDefense: 0,
      wasNegatedByInvulnerability: true,
      wasEvaded: false, hitChance: 0, effectiveAccuracy: 0, effectiveEvasion: 0,
    };
  }

  // 1. 명중 판정
  const hasPerfectEvasion = defender.statusEffects.some(
    (status) => status.type === 'EVASION_UP' && (status.value ?? 0) >= 100
  );
  if (hasPerfectEvasion && !options.alwaysHit) {
    return {
      isHit: false, isCrit: false, rawDamage: 0, mitigatedDamage: 0, shieldAbsorbed: 0,
      finalDamage: 0, isDefending: false, staggerDamage: 0, isStaggerTriggered: false,
      element, elementMultiplier: 1, effectiveElementResistance: 0, critMultiplier: 1, effectiveDefense: 0,
      wasEvaded: true, hitChance: 0, effectiveAccuracy: 0, effectiveEvasion: getEffectiveEvasion(defender),
    };
  }

  const hit = calculateHitChance(attacker, defender, options.hitChanceBonus ?? 0, options.evasionIgnore ?? 0);
  const accuracy = hit.accuracy;
  const evasion = hit.evasion;
  const hitChance = options.alwaysHit ? 100 : hit.hitChance;
  const hitRoll = Math.random() * 100;
  const isHit = options.alwaysHit || hitRoll <= hitChance;

  if (!isHit) {
    // 같은 주사위가 '회피가 없었다면 명중했을 구간'에 들어왔을 때만 EVADE.
    // 그보다도 높은 주사위는 공격자의 명중 부족으로 발생한 MISS다.
    const wasEvaded = evasion > 0 && hitRoll <= hit.accuracyOnlyChance;
    return {
      isHit: false,
      isCrit: false,
      rawDamage: 0,
      mitigatedDamage: 0,
      shieldAbsorbed: 0,
      finalDamage: 0,
      isDefending: false,
      staggerDamage: 0,
      isStaggerTriggered: false,
      element,
      elementMultiplier: 1,
      effectiveElementResistance: 0,
      critMultiplier: 1,
      effectiveDefense: 0,
      wasEvaded,
      hitChance,
      effectiveAccuracy: accuracy,
      effectiveEvasion: evasion,
    };
  }

  // 2. 치명타 판정. 일반 확률은 상한 적용, 명시적인 확정 치명타는 상한을 우회한다.
  const guaranteedByStatus = attacker.statusEffects.some(
    (status) => status.type === 'CRIT_UP' && (status.value ?? 0) >= 100
  );
  const totalCritChance = Math.min(
    CRITICAL_CHANCE_CAP,
    Math.max(
      0,
      (attacker.stats.criticalChance ?? 5) +
        getStatusValue(attacker, 'CRIT_UP') +
        (isCrisisAdrenalineActive(attacker) ? 15 : 0) +
        (options.bonusCritChance ?? 0)
    )
  );
  const isCrit = !!options.forceCrit || guaranteedByStatus || Math.random() * 100 <= totalCritChance;
  const critMultiplier = isCrit
    ? Math.min(
        CRITICAL_DAMAGE_CAP,
        Math.max(1, (attacker.stats.criticalDamage ?? 1.5) + getStatusValue(attacker, 'CRIT_DAMAGE_UP') / 100 + (options.bonusCritDamage ?? 0))
      )
    : 1;

  // 3. 공격력 / 방어력 / 관통
  const atkPower = getEffectiveAttack(attacker, damageType);
  let defPower = getEffectiveDefense(defender, damageType);
  const ignoreRatio = Math.min(0.95, Math.max(0, options.defenseIgnoreRatio ?? 0));
  defPower *= 1 - ignoreRatio;

  const actorPenetration =
    damageType === 'PHYSICAL'
      ? attacker.stats.physicalPenetration ?? 0
      : attacker.stats.magicPenetration ?? 0;
  defPower = Math.max(0, defPower - actorPenetration - (options.flatPenetration ?? 0));

  const defenseFactor = 100 / (100 + defPower);
  const variance = 0.92 + Math.random() * 0.16;

  // 4. 속성 저항. 상성표 자체는 데이터에 하드코딩하지 않고 대상의 저항/약점 값으로 표현한다.
  let effectiveElementResistance = 0;
  let elementMultiplier = 1;
  if (element !== 'NEUTRAL') {
    let baseResistance = defender.elementResistances?.[element] ?? 0;
    if (element === 'FIRE') baseResistance += getStatusValue(defender, 'FIRE_RES_UP');
    if (element === 'ICE') baseResistance += getStatusValue(defender, 'ICE_RES_UP');
    if (element === 'LIGHTNING') baseResistance += getStatusValue(defender, 'LIGHTNING_RES_UP');
    if (element === 'FIRE') baseResistance -= getCounter(defender, 'fire_res_down');
    const elementPenetration = (attacker.stats.elementalPenetration ?? 0) + (options.elementalPenetrationBonus ?? 0);
    effectiveElementResistance = Math.min(
      ELEMENT_RESISTANCE_MAX,
      Math.max(ELEMENT_RESISTANCE_MIN, baseResistance - elementPenetration)
    );
    elementMultiplier = 1 - effectiveElementResistance / 100;
  }

  const elementDamageBonus = attacker.elementDamageBonuses?.[element] ?? 0;
  const genericDamageBonus = options.damageBonusPercent ?? 0;

  const vulnerablePercent = Math.max(
    defender.isStaggered ? 30 : 0,
    ...defender.statusEffects
      .filter((status) => status.type === 'VULNERABLE')
      .map((status) => Math.max(0, status.value ?? 30)),
  );
  const vulnerabilityMultiplier = 1 + vulnerablePercent / 100;

  const calculatedDamage =
    atkPower *
    multiplier *
    defenseFactor *
    critMultiplier *
    variance *
    elementMultiplier *
    (1 + elementDamageBonus / 100) *
    (1 + genericDamageBonus / 100) *
    vulnerabilityMultiplier;
  const rawDamage = Math.max(1, Math.round(calculatedDamage));

  // 5. 방어 태세
  const isDefending = defender.statusEffects.some((status) => status.type === 'DEFEND');
  let mitigatedDamage = isDefending ? Math.max(1, Math.round(rawDamage * 0.5)) : rawDamage;
  mitigatedDamage = Math.max(0, Math.round(mitigatedDamage * damageTakenMultiplierFromEquipment(defender) * getDragonFormDamageTakenMultiplier(defender)));

  // 6. 보호막
  let shieldAbsorbed = 0;
  const shieldEffect = defender.statusEffects.find((status) => status.type === 'SHIELD');
  if (shieldEffect && (shieldEffect.value ?? 0) > 0) {
    const shieldValue = shieldEffect.value!;
    if (shieldValue >= mitigatedDamage) {
      shieldAbsorbed = mitigatedDamage;
      shieldEffect.value = shieldValue - mitigatedDamage;
      mitigatedDamage = 0;
    } else {
      shieldAbsorbed = shieldValue;
      mitigatedDamage -= shieldValue;
      shieldEffect.value = 0;
    }
  }

  // 7. 흐트러짐
  const equipmentStaggerMultiplier = attacker.traits?.includes('heavy_stagger_boost') ? 1.25 : 1;
  const baseStaggerDamage =
    (atkPower * 0.4 + (options.bonusStagger ?? 0)) * (isCrit ? 1.5 : 1) * equipmentStaggerMultiplier;
  const defenderTenacity = Math.max(0, defender.stats.tenacity ?? 10);
  const staggerMitigation = 50 / (50 + defenderTenacity);
  const finalStaggerDamage = Math.max(
    1,
    Math.round(baseStaggerDamage * staggerMitigation * (isDefending ? 0.4 : 1))
  );

  const currentStagger = defender.stagger ?? 0;
  const maxStagger = defender.maxStagger || Math.max(30, Math.round(defender.maxHp * 0.6));
  const newStagger = Math.min(maxStagger, currentStagger + finalStaggerDamage);
  const isStaggerTriggered = !defender.isStaggered && newStagger >= maxStagger;

  // 8. 장비 흡혈
  let vampiricHeal: number | undefined;
  const hasVampirism = attacker.traits.some((trait) => trait.includes('vampirism'));
  if (hasVampirism && mitigatedDamage > 0) {
    vampiricHeal = Math.max(1, Math.round(mitigatedDamage * 0.15));
  }

  return {
    isHit: true,
    isCrit,
    rawDamage,
    mitigatedDamage,
    shieldAbsorbed,
    finalDamage: mitigatedDamage,
    isDefending,
    staggerDamage: finalStaggerDamage,
    isStaggerTriggered,
    vampiricHeal,
    element,
    elementMultiplier,
    effectiveElementResistance,
    critMultiplier,
    effectiveDefense: defPower,
    wasEvaded: false,
    hitChance,
    effectiveAccuracy: accuracy,
    effectiveEvasion: evasion,
  };
}
