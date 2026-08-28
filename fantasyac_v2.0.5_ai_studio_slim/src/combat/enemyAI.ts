import { BattleActor } from './combatTypes';
import { getSkillDefinition, SkillDefinition } from '../data/skills';
import { getSkillUsability } from './battleActions';

export interface EnemyDecision {
  skillId: string;
  targetId: string;
}

function getUsableSkills(enemy: BattleActor): SkillDefinition[] {
  return (enemy.skills || [])
    .map((id) => getSkillDefinition(id))
    .filter((skill): skill is SkillDefinition => !!skill && getSkillUsability(enemy, skill.id).usable);
}

/**
 * 적의 CTB 행동 기회에 사용할 스킬과 1차 타겟을 결정한다.
 * COST와 자신의 행동 기준 쿨다운을 모두 실제 사용 가능 조건에 포함한다.
 */
export function decideEnemyAction(
  enemy: BattleActor,
  player: BattleActor,
  _turnNumber: number
): EnemyDecision {
  if (enemy.statusEffects.some((s) => s.type === 'STUN') || enemy.isStaggered) {
    return { skillId: 'STUNNED', targetId: enemy.id };
  }

  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  const usable = getUsableSkills(enemy);

  if (hpRatio < 0.35) {
    const defensive = usable.find((skill) =>
      ['EFFECT_DEFEND', 'EFFECT_IRON_WALL', 'EFFECT_SACRED_SHIELD'].includes(skill.effectId)
    );
    if (defensive) return { skillId: defensive.id, targetId: enemy.id };

    const selfHeal = usable.find((skill) =>
      skill.targetType === 'SELF' && ['EFFECT_FIRST_AID', 'EFFECT_DIVINE_HEAL'].includes(skill.effectId)
    );
    if (selfHeal) return { skillId: selfHeal.id, targetId: enemy.id };
  }

  const specials = usable.filter(
    (skill) => skill.id !== 'basic_attack' && skill.id !== 'defend_stance' && skill.type === 'ACTIVE'
  );

  if (specials.length > 0 && Math.random() < 0.65) {
    const preferred = enemy.aiProfile?.preferredSkills
      ?.map((id) => specials.find((skill) => skill.id === id))
      .find(Boolean);
    const chosen = preferred || specials[Math.floor(Math.random() * specials.length)]!;
    return {
      skillId: chosen.id,
      targetId: chosen.targetType === 'SELF' ? enemy.id : player.id,
    };
  }

  return { skillId: 'basic_attack', targetId: player.id };
}
