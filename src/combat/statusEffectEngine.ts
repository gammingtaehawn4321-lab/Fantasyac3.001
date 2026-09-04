import { BattleActor, StatusEffect } from './combatTypes';

export interface StatusTickResult {
  actorId: string;
  actorName: string;
  hpDelta: number;
  mpDelta: number;
  staggerDelta: number;
  logs: string[];
  expiredEffectNames: string[];
}

export function isActorUnableToAct(actor: BattleActor): boolean {
  return (
    actor.isStaggered ||
    actor.statusEffects.some((effect) => effect.type === 'STUN' || effect.type === 'CHARM')
  );
}

/**
 * 대상 자신의 행동 시작 시 발동하는 효과.
 * 독/출혈/화상/재생은 여기서 발동하고 지속시간은 건드리지 않는다.
 */
export function processTurnStartStatusEffects(actor: BattleActor): StatusTickResult {
  let hpDelta = 0;
  let mpDelta = 0;
  let staggerDelta = 0;
  const logs: string[] = [];

  for (const effect of actor.statusEffects) {
    switch (effect.type) {
      case 'BLEED': {
        const damage = Math.max(2, Math.round(effect.value ?? actor.maxHp * 0.05));
        hpDelta -= damage;
        logs.push(`[출혈] ${actor.name}이(가) ${damage}의 지속 피해를 입었습니다.`);
        break;
      }
      case 'POISON': {
        if (actor.statusEffects.some((status) => status.type === 'POISON_IMMUNE')) break;
        const damage = Math.max(2, Math.round(effect.value ?? 6));
        hpDelta -= damage;
        logs.push(`[중독] ${actor.name}이(가) ${damage}의 지속 피해를 입었습니다.`);
        break;
      }
      case 'BURN': {
        const damage = Math.max(2, Math.round(effect.value ?? actor.maxHp * 0.04));
        hpDelta -= damage;
        logs.push(`[화상] ${actor.name}이(가) ${damage}의 화염 지속 피해를 입었습니다.`);
        break;
      }
      case 'REGENERATION': {
        const heal = Math.max(3, Math.round(effect.value ?? actor.maxHp * 0.08));
        hpDelta += heal;
        logs.push(`[재생] ${actor.name}이(가) ${heal}의 체력을 회복했습니다.`);
        break;
      }
      default:
        break;
    }
  }

  actor.hp = Math.min(actor.maxHp, Math.max(0, actor.hp + hpDelta));
  actor.mp = Math.min(actor.maxMp, Math.max(0, actor.mp + mpDelta));
  actor.stagger = Math.max(0, actor.stagger + staggerDelta);

  return {
    actorId: actor.id,
    actorName: actor.name,
    hpDelta,
    mpDelta,
    staggerDelta,
    logs,
    expiredEffectNames: [],
  };
}

/**
 * 대상 자신의 행동 종료 시 모든 버프/디버프 지속시간을 1 감소시킨다.
 * 행동 도중 새로 생긴 효과는 skipNextDurationTick으로 첫 감소를 한 번 건너뛴다.
 */
export function processTurnEndStatusEffects(actor: BattleActor): StatusTickResult {
  const logs: string[] = [];
  const expiredEffectNames: string[] = [];
  const remainingEffects: StatusEffect[] = [];
  let staggerDelta = 0;

  for (const effect of actor.statusEffects) {
    if (effect.type === 'SHIELD' && (effect.value ?? 0) <= 0) {
      expiredEffectNames.push(effect.name);
      continue;
    }

    if (effect.skipNextDurationTick) {
      remainingEffects.push({ ...effect, skipNextDurationTick: false });
      continue;
    }

    const nextDuration = effect.duration - 1;
    if (nextDuration > 0) {
      remainingEffects.push({ ...effect, duration: nextDuration });
    } else {
      expiredEffectNames.push(effect.name);
    }
  }

  // 흐트러짐은 해당 Actor의 행동 기회를 1회 잃게 한 뒤 회복한다.
  if (actor.isStaggered) {
    actor.isStaggered = false;
    actor.stagger = 0;
    logs.push(`${actor.name}이(가) 흐트러짐 상태에서 회복했습니다.`);
  } else if (actor.stagger > 0) {
    const recovery = Math.min(3, actor.stagger);
    actor.stagger -= recovery;
    staggerDelta -= recovery;
  }

  actor.statusEffects = remainingEffects;

  return {
    actorId: actor.id,
    actorName: actor.name,
    hpDelta: 0,
    mpDelta: 0,
    staggerDelta,
    logs,
    expiredEffectNames,
  };
}

/**
 * 구 호출부 호환용. 신규 CTB에서는 start/end를 분리해 사용한다.
 */
export function processStatusEffectsTick(actor: BattleActor): StatusTickResult {
  const start = processTurnStartStatusEffects(actor);
  const end = processTurnEndStatusEffects(actor);
  return {
    actorId: actor.id,
    actorName: actor.name,
    hpDelta: start.hpDelta,
    mpDelta: start.mpDelta,
    staggerDelta: start.staggerDelta + end.staggerDelta,
    logs: [...start.logs, ...end.logs],
    expiredEffectNames: end.expiredEffectNames,
  };
}
