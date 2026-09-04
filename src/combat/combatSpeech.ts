import { BattleActor } from './combatTypes';
import {
  CLASS_GENDER_SPEECH_REFERENCES,
  CombatSpeechEvent,
  DANCER_ADULT_VARIANT_REFERENCES,
  ENEMY_SPEECH_REFERENCES,
  FEMALE_HIGH_DESIRE_REFERENCES,
  GENERIC_SPEECH_REFERENCES,
  HIGH_DESIRE_SPEECH_THRESHOLD,
  RACE_SPEECH_REFERENCES,
  SET_SPEECH_REFERENCES,
  SpeechCombatClass,
  SpeechGender,
  SpeechRace,
} from '../data/combatSpeechReferences';
import { resolveRaceNarrativeKey } from '../data/raceNarrativeReferences';

export interface ResolvedCombatSpeech {
  text: string;
  referenceKeys: string[];
  event: CombatSpeechEvent;
  activeSetId?: string;
}

export type CombatHpBand = 'HIGH' | 'MID' | 'LOW' | 'CRITICAL';

export function getCombatHpBand(actor: BattleActor): CombatHpBand {
  const ratio = actor.hp / Math.max(1, actor.maxHp);
  if (ratio >= 0.70) return 'HIGH';
  if (ratio >= 0.35) return 'MID';
  if (ratio >= 0.15) return 'LOW';
  return 'CRITICAL';
}

export function getActionSpeechEvent(actor: BattleActor): CombatSpeechEvent {
  return `ACTION_HP_${getCombatHpBand(actor)}` as CombatSpeechEvent;
}

function nonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeGender(value?: string): SpeechGender {
  const normalized = String(value || '').trim().toLowerCase();
  if (['여성', '여자', 'female', 'f', 'woman'].includes(normalized)) return 'FEMALE';
  if (['남성', '남자', 'male', 'm', 'man'].includes(normalized)) return 'MALE';
  return 'UNKNOWN';
}

function normalizeRace(value?: string, beastkinType?: string): SpeechRace {
  if (value === 'MONSTER') return 'MONSTER';
  if (value === 'HUMAN' || value === 'ELF' || value === 'BEASTKIN' || value === 'YETI' || value === 'MERFOLK' || value === 'DRAGONKIN') {
    return resolveRaceNarrativeKey(value, beastkinType);
  }
  return 'UNKNOWN';
}

function normalizeClass(value?: string): SpeechCombatClass {
  const allowed: SpeechCombatClass[] = ['NONE', 'WARRIOR', 'ARCHER', 'ROGUE', 'CLERIC', 'DANCER', 'MAGE'];
  return allowed.includes(value as SpeechCombatClass) ? value as SpeechCombatClass : 'NONE';
}

function strongestActiveSet(actor: BattleActor) {
  const active = SET_SPEECH_REFERENCES.flatMap((set) => {
    const matching = actor.traits.filter((trait) => trait.startsWith(set.traitPrefix));
    if (!matching.length) return [];
    const pieces = Math.max(...matching.map((trait) => Number(trait.match(/_(\d+)$/)?.[1] || 0)));
    return [{ set, pieces }];
  });
  active.sort((a, b) => b.pieces - a.pieces || a.set.id.localeCompare(b.set.id));
  return active[0];
}

/**
 * 말풍선은 항상 참조 테이블에서만 해결한다.
 * 우선순위: 무희 성인 변형(작성 시) → 여성 고성욕 변형(작성 시) → 활성 세트 → 성별+전직 → 기본.
 * 종족 참조는 최종 문장 뒤에 짧게 덧붙는다.
 */
export function resolveCombatSpeech(actor: BattleActor, event: CombatSpeechEvent): ResolvedCombatSpeech | undefined {
  const profile = actor.speechProfile;
  const gender = normalizeGender(profile?.gender);
  const race = normalizeRace(profile?.race || (actor.isPlayer || actor.isCompanion ? 'UNKNOWN' : 'MONSTER'), profile?.beastkinType);
  const combatClass = normalizeClass(profile?.combatClass);
  const referenceKeys: string[] = [];

  if (!actor.isPlayer && !actor.isCompanion) {
    const tier = actor.tier === 'BOSS' ? 'BOSS' : actor.tier === 'ELITE' ? 'ELITE' : 'NORMAL';
    const enemyLine = ENEMY_SPEECH_REFERENCES[tier][event];
    const line = nonEmpty(enemyLine) ? enemyLine : GENERIC_SPEECH_REFERENCES[event];
    return {
      text: line,
      referenceKeys: [nonEmpty(enemyLine) ? `COMBAT.ENEMY.${tier}.${event}` : `COMBAT.GENERIC.${event}`],
      event,
    };
  }

  const desire = actor.adultEquipmentContext?.effectiveDesire ?? 0;
  const adultVariantEligible = !!actor.adultEquipmentContext && desire >= HIGH_DESIRE_SPEECH_THRESHOLD;

  if (adultVariantEligible && combatClass === 'DANCER' && nonEmpty(DANCER_ADULT_VARIANT_REFERENCES[event])) {
    return { text: DANCER_ADULT_VARIANT_REFERENCES[event], referenceKeys: [`COMBAT.USER.DANCER_ADULT.${event}`], event };
  }
  if (adultVariantEligible && gender === 'FEMALE' && nonEmpty(FEMALE_HIGH_DESIRE_REFERENCES[event])) {
    return { text: FEMALE_HIGH_DESIRE_REFERENCES[event], referenceKeys: [`COMBAT.USER.FEMALE_HIGH_DESIRE.${event}`], event };
  }

  const activeSet = strongestActiveSet(actor);
  let primary: string | undefined;
  if (activeSet) {
    const setLine = activeSet.set.references[event];
    if (nonEmpty(setLine)) {
      primary = setLine;
      referenceKeys.push(`COMBAT.SET.${activeSet.set.id}.${event}`);
    }
  }

  if (!primary) {
    const classLine = CLASS_GENDER_SPEECH_REFERENCES[combatClass]?.[gender]?.[event];
    if (nonEmpty(classLine)) {
      primary = classLine;
      referenceKeys.push(`COMBAT.CLASS.${combatClass}.${gender}.${event}`);
    }
  }

  if (!primary) {
    primary = GENERIC_SPEECH_REFERENCES[event];
    referenceKeys.push(`COMBAT.GENERIC.${event}`);
  }

  const raceLine = RACE_SPEECH_REFERENCES[race]?.[event];
  if (nonEmpty(raceLine) && raceLine !== primary) {
    primary = `${primary} ${raceLine}`;
    referenceKeys.push(`COMBAT.RACE.${race}.${event}`);
  }

  return {
    text: primary,
    referenceKeys,
    event,
    activeSetId: activeSet?.set.id,
  };
}
