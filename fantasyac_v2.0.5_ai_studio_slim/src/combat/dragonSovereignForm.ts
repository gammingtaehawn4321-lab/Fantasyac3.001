import type { BattleActor } from './combatTypes';
import { ensureEquipmentRuntime } from './equipmentRuntime';

export type DragonSovereignBranch = 'INFERNO' | 'WATER' | 'THUNDER' | 'FROST';

const FORM_STATUS_PREFIX = 'dragon_emperor_form_';

export function getDragonSovereignBranch(actor: BattleActor): DragonSovereignBranch | undefined {
  if (actor.traits.includes('EVOLUTION_DRAGON_INFERNO')) return 'INFERNO';
  if (actor.traits.includes('EVOLUTION_DRAGON_WATER')) return 'WATER';
  if (actor.traits.includes('EVOLUTION_DRAGON_THUNDER')) return 'THUNDER';
  if (actor.traits.includes('EVOLUTION_DRAGON_FROST')) return 'FROST';
  return undefined;
}

export function getDragonResource(actor: BattleActor): number {
  return Math.max(0, Math.min(100, ensureEquipmentRuntime(actor).counters.dragon_sovereign_resource || 0));
}

export function isDragonEmperorFormActive(actor: BattleActor): boolean {
  return !!ensureEquipmentRuntime(actor).flags.dragon_emperor_form_active;
}

function addFormStatus(actor: BattleActor, type: any, name: string, value: number): void {
  actor.statusEffects = actor.statusEffects.filter((e) => e.id !== `${FORM_STATUS_PREFIX}${type}`);
  actor.statusEffects.push({
    id: `${FORM_STATUS_PREFIX}${type}`,
    type,
    name,
    duration: 99,
    value,
    sourceActorId: actor.id,
    skipNextDurationTick: true,
  });
}

function removeFormStatuses(actor: BattleActor): void {
  actor.statusEffects = actor.statusEffects.filter((e) => !e.id.startsWith(FORM_STATUS_PREFIX));
}

export function activateDragonEmperorForm(actor: BattleActor, activatedDuringOwnAction = false): string | undefined {
  const branch = getDragonSovereignBranch(actor);
  if (!branch || isDragonEmperorFormActive(actor)) return undefined;
  const rt = ensureEquipmentRuntime(actor);
  rt.flags.dragon_emperor_form_active = true;
  rt.flags.dragon_emperor_form_just_activated = activatedDuringOwnAction;
  rt.counters.dragon_sovereign_resource = 0;
  rt.counters.dragon_emperor_form_actions = 4;
  rt.counters.dragon_emperor_form_count = (rt.counters.dragon_emperor_form_count || 0) + 1;

  addFormStatus(actor, 'ATK_UP', '용제 현현', 45);
  addFormStatus(actor, 'MAGIC_ATK_UP', '용제 현현', 45);
  addFormStatus(actor, 'DEF_UP', '용제 현현', 40);
  addFormStatus(actor, 'ACCURACY_UP', '용제 현현', 25);
  addFormStatus(actor, 'EVASION_UP', '용제 현현', 20);
  addFormStatus(actor, 'CRIT_UP', '용제 현현', 20);
  addFormStatus(actor, 'SPEED_UP', '용제 현현', 35);

  return `${actor.name}의 용맥이 임계점을 넘어 『용제』로 현현했다!`;
}

export function addDragonResource(actor: BattleActor, amount: number, activatedDuringOwnAction = false): { gained: number; value: number; transformed: boolean; message?: string } {
  const branch = getDragonSovereignBranch(actor);
  if (!branch || isDragonEmperorFormActive(actor)) return { gained: 0, value: getDragonResource(actor), transformed: false };
  const rt = ensureEquipmentRuntime(actor);
  const before = getDragonResource(actor);
  const value = Math.max(0, Math.min(100, before + Math.max(0, amount)));
  rt.counters.dragon_sovereign_resource = value;
  const transformed = value >= 100;
  const message = transformed ? activateDragonEmperorForm(actor, activatedDuringOwnAction) : undefined;
  return { gained: value - before, value: transformed ? 0 : value, transformed, message };
}

export function getDragonResourceLabel(actor: BattleActor): string | undefined {
  const branch = getDragonSovereignBranch(actor);
  if (!branch) return undefined;
  return branch === 'INFERNO' ? '불꽃' : branch === 'WATER' ? '천수' : branch === 'THUNDER' ? '뇌명' : '서리';
}

export function getDragonFormDamageMultiplier(actor: BattleActor): number {
  return isDragonEmperorFormActive(actor) ? 1.28 : 1;
}

export function getDragonFormDamageTakenMultiplier(actor: BattleActor): number {
  return isDragonEmperorFormActive(actor) ? 0.65 : 1;
}

export function isDragonBranchSkill(actor: BattleActor, skillId: string): boolean {
  const branch = getDragonSovereignBranch(actor);
  if (!branch) return false;
  if (branch === 'INFERNO') return skillId.startsWith('inferno_wyrm_');
  if (branch === 'WATER') return skillId.startsWith('water_serpent_');
  if (branch === 'THUNDER') return skillId.startsWith('thunder_dragon_');
  return skillId.startsWith('frost_dragon_');
}

export function getDragonBranchSkillMultiplier(actor: BattleActor, skillId: string): number {
  return isDragonEmperorFormActive(actor) && isDragonBranchSkill(actor, skillId) ? 1.35 : 1;
}

export function onDragonActorTurnEnd(actor: BattleActor): string[] {
  const rt = ensureEquipmentRuntime(actor);
  if (!rt.flags.dragon_emperor_form_active) return [];
  if (rt.flags.dragon_emperor_form_just_activated) {
    rt.flags.dragon_emperor_form_just_activated = false;
    return [];
  }
  rt.counters.dragon_emperor_form_actions = Math.max(0, (rt.counters.dragon_emperor_form_actions || 0) - 1);
  if (rt.counters.dragon_emperor_form_actions > 0) return [];

  rt.flags.dragon_emperor_form_active = false;
  removeFormStatuses(actor);
  actor.statusEffects = actor.statusEffects.filter((e) => !['dragon_vein_exhaustion_slow','dragon_vein_exhaustion_vulnerable'].includes(e.id));
  actor.statusEffects.push({ id:'dragon_vein_exhaustion_slow', type:'SLOW', name:'용맥 탈진', duration:3, value:45, sourceActorId:actor.id });
  actor.statusEffects.push({ id:'dragon_vein_exhaustion_vulnerable', type:'VULNERABLE', name:'용맥 탈진', duration:3, value:35, sourceActorId:actor.id });
  // 종료 직후 다음 행동 순번을 크게 늦춘다.
  actor.actionGauge -= 500;
  return [`${actor.name}의 『용제』 현현이 끝나 용맥이 고갈됐다. 3번의 행동 동안 속도가 크게 낮아지고 받는 피해가 증가한다.`];
}
