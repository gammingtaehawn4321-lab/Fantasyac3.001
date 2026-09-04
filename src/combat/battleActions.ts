import {
  BattleActor,
  BattleLogEntry,
  BattleState,
  CombatElement,
  StatusEffect,
  StatusEffectType,
} from './combatTypes';
import { getSkillDefinition, SkillDefinition } from '../data/skills';
import { calculateDamage, DamageCalculationOptions, DamageCalculationResult } from './damageCalculator';
import { SpeechStyleData } from '../types';
import {
  consumeRuntimeKeys,
  ensureEquipmentRuntime,
  getRuntimeSkillModifiers,
  hasTrait,
  onEquipmentDamageOutcome,
  onEquipmentSkillResolved,
} from './equipmentRuntime';
import { addDragonResource, getDragonBranchSkillMultiplier, getDragonResourceLabel, getDragonSovereignBranch, isDragonEmperorFormActive } from './dragonSovereignForm';

export interface BattleActionContext {
  /** 시전자와 같은 편. 시전자 본인을 포함한다. */
  allies?: BattleActor[];
  /** 시전자 반대편. */
  enemies?: BattleActor[];
  battleState?: BattleState;
}

export interface ActionExecutionResult {
  sourceActor: BattleActor;
  targetActors: BattleActor[];
  logEntries: BattleLogEntry[];
  speechLine?: string;
  wasExecuted: boolean;
  skillId: string;
  actionDelay: number;
  costSpent: number;
  cooldownSet: number;
}

export interface SkillUsability {
  usable: boolean;
  reason?: 'NOT_FOUND' | 'PASSIVE' | 'NOT_ENOUGH_COST' | 'COOLDOWN' | 'EQUIPMENT_REQUIRED';
  cost: number;
  cooldownRemaining: number;
  /** 암흑 룬워드 '공허 계약' 등으로 COST 부족분을 HP로 치를 때의 대가. */
  hpCost?: number;
}

export function getSkillCost(actor: BattleActor, skill: SkillDefinition): number {
  let cost = skill.cost ?? skill.mpCost ?? 0;
  for (const modifier of actor.skillModifiers || []) {
    if (modifier.skillId === skill.id) cost -= modifier.costReduction ?? 0;
  }
  const runtime = getRuntimeSkillModifiers(actor, skill);
  cost = cost * runtime.costMultiplier + runtime.costFlat;
  return Math.max(0, Math.round(cost));
}

export function getSkillCooldown(actor: BattleActor, skill: SkillDefinition): number {
  let cooldown = skill.cooldown ?? 0;
  for (const modifier of actor.skillModifiers || []) {
    if (modifier.skillId === skill.id) cooldown -= modifier.cooldownReduction ?? 0;
  }
  cooldown += getRuntimeSkillModifiers(actor, skill).cooldownFlat;
  return Math.max(0, Math.round(cooldown));
}

export function getSkillActionDelay(skill: SkillDefinition | undefined, actor?: BattleActor, target?: BattleActor, state?: BattleState): number {
  const base = Math.max(0.1, skill?.actionDelay ?? 1);
  if (!skill || !actor) return base;
  return Math.max(0.1, base * getRuntimeSkillModifiers(actor, skill, target, state).actionDelayMultiplier);
}

export function getSkillDamageMultiplier(actor: BattleActor, skill: SkillDefinition, target?: BattleActor, state?: BattleState): number {
  let multiplier = skill.damageMultiplier ?? 1;
  for (const modifier of actor.skillModifiers || []) {
    if (modifier.skillId === skill.id) multiplier += modifier.damageMultiplierBonus ?? 0;
  }
  multiplier *= getRuntimeSkillModifiers(actor, skill, target, state).damageMultiplier;
  multiplier *= getDragonBranchSkillMultiplier(actor, skill.id);
  return Math.max(0, multiplier);
}

export function getSkillUsability(actor: BattleActor, skillId: string): SkillUsability {
  const skill = getSkillDefinition(skillId);
  if (!skill) return { usable: false, reason: 'NOT_FOUND', cost: 0, cooldownRemaining: 0 };
  if (skill.type !== 'ACTIVE') {
    return { usable: false, reason: 'PASSIVE', cost: 0, cooldownRemaining: 0 };
  }
  if (skill.requiresMagicWeapon && !hasTrait(actor, 'EQUIP_MAGIC_WEAPON')) {
    return { usable: false, reason: 'EQUIPMENT_REQUIRED', cost: 0, cooldownRemaining: 0 };
  }
  if (skill.requiresDualWield && !hasTrait(actor, 'EQUIP_DUAL_WIELD')) {
    return { usable: false, reason: 'EQUIPMENT_REQUIRED', cost: 0, cooldownRemaining: 0 };
  }
  if (skill.requiredWeaponTags?.length && !skill.requiredWeaponTags.every((tag) => hasTrait(actor, `WEAPON_TAG:${tag}`))) {
    return { usable: false, reason: 'EQUIPMENT_REQUIRED', cost: 0, cooldownRemaining: 0 };
  }
  const cost = getSkillCost(actor, skill);
  const cooldownRemaining = Math.max(0, actor.skillCooldowns?.[skill.id] ?? 0);
  if ((actor.cost ?? 0) < cost) {
    if (hasTrait(actor, 'RUNE_DARKNESS_40')) {
      const deficit = Math.max(0, cost - (actor.cost ?? 0));
      const hpCost = Math.max(1, Math.ceil(actor.maxHp * 0.015 * deficit));
      if (actor.hp > hpCost) return { usable: true, cost, cooldownRemaining, hpCost };
    }
    return { usable: false, reason: 'NOT_ENOUGH_COST', cost, cooldownRemaining };
  }
  if (cooldownRemaining > 0) {
    return { usable: false, reason: 'COOLDOWN', cost, cooldownRemaining };
  }
  return { usable: true, cost, cooldownRemaining: 0 };
}

/** 캐릭터의 speechStyle에 따른 짧은 전투 대사 생성 */
export function generateCombatSpeech(
  speechStyle?: SpeechStyleData,
  situation: 'ATTACK' | 'SKILL' | 'DEFEND' | 'HIT' | 'VICTORY' | 'CRISIS' = 'ATTACK'
): string {
  if (speechStyle?.exampleLines && speechStyle.exampleLines.length > 0 && Math.random() < 0.3) {
    return speechStyle.exampleLines[Math.floor(Math.random() * speechStyle.exampleLines.length)];
  }

  const tone = speechStyle?.tone || '담담함';
  const desc = speechStyle?.description || '';

  if (desc.includes('오만') || tone.includes('거만') || tone.includes('냉혹')) {
    switch (situation) {
      case 'ATTACK': return '이 정도로 끝낼 줄 알았나?';
      case 'SKILL': return '네놈의 한계는 여기까지다.';
      case 'DEFEND': return '흥, 뻔한 공격이군.';
      case 'CRISIS': return '칫... 성가시게 구는군.';
      case 'VICTORY': return '결과는 처음부터 정해져 있었어.';
      default: return '사라져라.';
    }
  }

  if (desc.includes('활발') || desc.includes('장난') || tone.includes('쾌활')) {
    switch (situation) {
      case 'ATTACK': return '여기야, 여기! 놓치지 마!';
      case 'SKILL': return '제대로 한 방 먹여주겠어!';
      case 'DEFEND': return '헤헤, 그렇게 쉽게 맞진 않지!';
      case 'CRISIS': return '으앗... 방심했다!';
      case 'VICTORY': return '해냈다! 내 승리야!';
      default: return '가자!';
    }
  }

  if (desc.includes('소심') || desc.includes('차분') || tone.includes('조용')) {
    switch (situation) {
      case 'ATTACK': return '빈틈이 보였어...';
      case 'SKILL': return '호흡을 가다듬고... 집중하자.';
      case 'DEFEND': return '막아내야 해... 버텨라!';
      case 'CRISIS': return '큭... 아직 쓰러질 순 없어.';
      case 'VICTORY': return '후우... 끝난 건가.';
      default: return '조심하자.';
    }
  }

  switch (situation) {
    case 'ATTACK': return '이번엔 내가 먼저 간다.';
    case 'SKILL': return '승부를 내자.';
    case 'DEFEND': return '움직임을 읽었어. 물러서지 않는다.';
    case 'CRISIS': return '여기서 밀리면 끝장이야.';
    case 'VICTORY': return '위험했지만 어떻게든 제압했군.';
    default: return '간다.';
  }
}

function createLog(
  source: BattleActor,
  turnNumber: number,
  text: string,
  badge?: BattleLogEntry['badge'],
  speechText?: string
): BattleLogEntry {
  return {
    id: `log_${Date.now()}_${Math.random()}`,
    turn: turnNumber,
    actorName: source.name,
    isPlayer: source.isPlayer,
    text,
    speechText,
    badge,
    timestamp: Date.now(),
  };
}

function addStatus(
  source: BattleActor,
  target: BattleActor,
  type: StatusEffectType,
  name: string,
  duration: number,
  value?: number
): void {
  if (type === 'POISON' && target.statusEffects.some((effect) => effect.type === 'POISON_IMMUNE')) return;
  // 동일 종류의 단순 버프/디버프는 최신 효과로 갱신하여 무한 중첩을 방지한다.
  const refreshTypes: StatusEffectType[] = [
    'DEFEND', 'ATK_UP', 'MAGIC_ATK_UP', 'DEF_UP', 'PHYSICAL_DEF_UP', 'MAGIC_DEF_UP',
    'ACCURACY_UP', 'ACCURACY_DOWN', 'EVASION_UP', 'CRIT_UP', 'SPEED_UP', 'SLOW',
    'WEAKEN', 'VULNERABLE', 'BLIND', 'STUN', 'CHARM', 'FEAR', 'TAUNT',
  ];
  if (refreshTypes.includes(type)) {
    target.statusEffects = target.statusEffects.filter((effect) => effect.type !== type);
  }

  const effect: StatusEffect = {
    id: `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    name,
    duration: Math.max(1, duration),
    value,
    sourceActorId: source.id,
    // 자기 행동 도중 자신에게 생긴 효과는 바로 그 행동 종료에 깎이지 않는다.
    skipNextDurationTick: source.id === target.id,
  };
  target.statusEffects.push(effect);
}

function rollStatus(source: BattleActor, target: BattleActor, baseChance: number): boolean {
  let hitBonus = source.stats.statusHitRate ?? 0;
  if (hasTrait(source, 'SET_COMET_ARCHMAGE_3')) hitBonus += (source.equipmentRuntime?.counters?.comet_altitude ?? 0) * 5;
  const resistance = target.stats.statusResistance ?? 0;
  const chance = Math.min(95, Math.max(5, baseChance + hitBonus - resistance));
  return Math.random() * 100 <= chance;
}

function applyDamage(
  source: BattleActor,
  target: BattleActor,
  skill: SkillDefinition,
  turnNumber: number,
  speechLine: string | undefined,
  options: DamageCalculationOptions = {}
): { result: DamageCalculationResult; log: BattleLogEntry } {
  const skillLabel = skill.name.trim() ? `[${skill.name}]` : '기술';
  const result = calculateDamage(source, target, {
    damageType: skill.scalingStat === 'magic' || skill.scalingStat === 'spirit' ? 'MAGIC' : 'PHYSICAL',
    multiplier: getSkillDamageMultiplier(source, skill),
    element: skill.element ?? 'NEUTRAL',
    alwaysHit: skill.alwaysHit,
    ...options,
  });

  if (!result.isHit) {
    const barrierText = result.wasNegatedByInvulnerability
      ? `${target.name}의 완전 회피 효과가 공격을 흘려냈다.`
      : result.wasEvaded
      ? `${target.name}이(가) ${source.name}의 ${skillLabel}을(를) 회피했다.`
      : `${source.name}의 ${skillLabel}이(가) 빗나갔다.`;
    return {
      result,
      log: createLog(source, turnNumber, barrierText, { text: result.wasNegatedByInvulnerability ? '완전 회피' : result.wasEvaded ? '회피' : '빗나감', type: 'miss' }, speechLine),
    };
  }

  target.hp = Math.max(0, target.hp - result.finalDamage);
  target.stagger = Math.min(target.maxStagger, target.stagger + result.staggerDamage);
  if (result.isStaggerTriggered) target.isStaggered = true;

  if (result.vampiricHeal && result.vampiricHeal > 0) {
    source.hp = Math.min(source.maxHp, source.hp + result.vampiricHeal);
  }

  const elementText = result.element !== 'NEUTRAL' ? ` · ${result.element}` : '';
  const resistanceText =
    result.element !== 'NEUTRAL' && Math.abs(result.effectiveElementResistance) > 0.01
      ? ` · 속성배율 ${result.elementMultiplier.toFixed(2)}x`
      : '';
  const staggerText = result.isStaggerTriggered ? ' · 흐트러짐!' : '';

  const text = result.isCrit
    ? `치명타! ${source.name}의 ${skillLabel}이(가) ${target.name}의 급소를 꿰뚫었다.`
    : `${source.name}의 ${skillLabel}이(가) ${target.name}에게 적중했다.`;

  return {
    result,
    log: createLog(
      source,
      turnNumber,
      text,
      {
        text: `${result.isCrit ? '치명타 · ' : ''}HP -${result.finalDamage}${elementText}${resistanceText}${staggerText}`,
        type: result.isCrit ? 'crit' : 'damage',
      },
      speechLine
    ),
  };
}

function getParty(context: BattleActionContext | undefined, source: BattleActor, skill?: SkillDefinition, selectedTargets?: BattleActor[]): BattleActor[] {
  if (skill?.targetType === 'ALL_ALLIES' && hasTrait(source, 'EQ_AUTOCRAT_SEAL') && selectedTargets?.length) return selectedTargets.filter((actor) => actor.hp > 0);
  return context?.allies?.filter((actor) => actor.hp > 0) || [source];
}

function getOpponents(context: BattleActionContext | undefined, targets: BattleActor[]): BattleActor[] {
  return context?.enemies?.filter((actor) => actor.hp > 0) || targets;
}

/** 스킬 또는 기본 액션 실행. COST와 쿨다운을 실제로 소비/등록한다. */
export function executeSkillAction(
  source: BattleActor,
  targets: BattleActor[],
  skillId: string,
  turnNumber: number,
  speechStyle?: SpeechStyleData,
  context?: BattleActionContext
): ActionExecutionResult {
  const skill = getSkillDefinition(skillId) || getSkillDefinition('basic_attack')!;
  const usability = getSkillUsability(source, skill.id);
  const skillLabel = skill.name.trim() ? `[${skill.name}]` : '기술';
  const runtimeMods = getRuntimeSkillModifiers(source, skill, targets[0], context?.battleState);
  const overflowWasActive = hasTrait(source, 'EQ_OVERFLOW_CHALICE') && source.cost >= source.maxCost && skill.damageMultiplier != null;
  const actionDelay = getSkillActionDelay(skill, source, targets[0], context?.battleState);

  if (!usability.usable) {
    const reasonText = usability.reason === 'NOT_ENOUGH_COST'
      ? `전투 자원이 부족합니다. (${source.cost}/${usability.cost})`
      : usability.reason === 'COOLDOWN'
      ? `${skillLabel}의 재사용 대기시간이 ${usability.cooldownRemaining}회 남았습니다.`
      : `${skillLabel}을(를) 사용할 수 없습니다.`;
    return {
      sourceActor: source,
      targetActors: targets,
      logEntries: [createLog(source, turnNumber, reasonText, { text: '사용 불가', type: 'info' })],
      wasExecuted: false,
      skillId: skill.id,
      actionDelay,
      costSpent: 0,
      cooldownSet: 0,
    };
  }

  const cost = usability.cost;
  const cooldown = getSkillCooldown(source, skill);
  const hpContractCost = usability.hpCost ?? 0;
  source.cost = Math.max(0, source.cost - cost);
  if (hpContractCost > 0) source.hp = Math.max(1, source.hp - hpContractCost);
  if (cooldown > 0) source.skillCooldowns[skill.id] = cooldown;

  const logs: BattleLogEntry[] = [];
  if (hpContractCost > 0) {
    logs.push(createLog(source, turnNumber, `${source.name}(이)가 부족한 전투 자원을 생명력으로 대신 지불했다.`, { text: `공허 계약 · HP -${hpContractCost}`, type: 'damage' }));
  }
  const speechLine = source.isPlayer
    ? generateCombatSpeech(speechStyle, skill.id === 'basic_attack' ? 'ATTACK' : 'SKILL')
    : undefined;
  const party = getParty(context, source, skill, targets);
  const opponents = getOpponents(context, targets);
  const harmfulStatusTypes = new Set<StatusEffectType>(['BLEED','POISON','BURN','STUN','CHARM','FEAR','ACCURACY_DOWN','BLIND','SLOW','WEAKEN','VULNERABLE','TAUNT']);
  const harmfulStatusIdsBefore = new Set(
    opponents.flatMap((actor) => actor.statusEffects.filter((status) => harmfulStatusTypes.has(status.type)).map((status) => status.id))
  );
  let actionHadCrit = false;
  let actionHadKill = false;

  // 비피해형 / 복합형 전용 효과
  switch (skill.effectId) {
    case 'EFFECT_INFERNO_WYRM_FURNACE_HEART': {
      addStatus(source, source, 'ATK_UP', '용로심', 3, isDragonEmperorFormActive(source) ? 40 : 25);
      addStatus(source, source, 'MAGIC_ATK_UP', '용로심', 3, isDragonEmperorFormActive(source) ? 45 : 30);
      const gain = addDragonResource(source, 28, true);
      logs.push(createLog(source, turnNumber, `${source.name}의 심장 속 용로가 폭발적으로 달아오른다.`, { text: gain.transformed ? '용제 현현' : `불꽃 +${gain.gained}`, type:'buff' }, speechLine));
      if (gain.message) logs.push(createLog(source, turnNumber, gain.message, { text:'용제 현현', type:'buff' }));
      break;
    }
    case 'EFFECT_WATER_SERPENT_VITAL_SPROUT': {
      const target = targets[0] || source;
      const form = isDragonEmperorFormActive(source);
      const heal = Math.max(1, Math.round((source.stats.magicAttack * 1.7 + target.maxHp * 0.12) * (form ? 1.55 : 1)));
      const before = target.hp; target.hp = Math.min(target.maxHp, target.hp + heal); const actual = target.hp - before;
      if (form && heal > actual) target.statusEffects.push({id:`water_overheal_${Date.now()}`,type:'SHIELD',name:'용제의 생명수',duration:2,value:Math.max(1,heal-actual),sourceActorId:source.id});
      const gain = addDragonResource(source, 18 + Math.min(18, Math.round(actual / Math.max(1,target.maxHp) * 100)), true);
      logs.push(createLog(source, turnNumber, `${target.name}에게 생명의 천수가 스며들었다.`, { text:`HP +${actual}${gain.gained?` · 천수 +${gain.gained}`:''}`, type:'heal' }, speechLine));
      if (gain.message) logs.push(createLog(source, turnNumber, gain.message, { text:'용제 현현', type:'buff' }));
      break;
    }
    case 'EFFECT_WATER_SERPENT_HEAVENLY_RAIN': {
      let healed = 0;
      const form = isDragonEmperorFormActive(source);
      for (const ally of party) {
        const heal = Math.max(1,Math.round((source.stats.magicAttack*0.85+ally.maxHp*0.07)*(form?1.55:1)));
        const before=ally.hp; ally.hp=Math.min(ally.maxHp,ally.hp+heal); healed += ally.hp-before;
        addStatus(source,ally,'REGENERATION','천수의 비',3,Math.max(3,Math.round(source.stats.magicAttack*(form?0.34:0.22))));
      }
      const gain=addDragonResource(source,22+Math.min(20,Math.round(healed/Math.max(1,party.reduce((a,b)=>a+b.maxHp,0))*100)), true);
      logs.push(createLog(source,turnNumber,'생명을 머금은 천수가 아군 전체에 내린다.',{text:`아군 회복 ${healed}${gain.gained?` · 천수 +${gain.gained}`:''}`,type:'heal'},speechLine));
      if(gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'}));
      break;
    }
    case 'EFFECT_WATER_SERPENT_VERDANT_SANCTUARY': {
      const form=isDragonEmperorFormActive(source); let total=0;
      for(const ally of party){const shield=Math.max(1,Math.round((source.maxHp*0.1+source.stats.magicDefense*1.4)*(form?1.6:1)));ally.statusEffects.push({id:`verdant_${Date.now()}_${ally.id}`,type:'SHIELD',name:'녹명의 성역',duration:3,value:shield,sourceActorId:source.id});addStatus(source,ally,'MAGIC_DEF_UP','녹명의 성역',3,form?35:22);total+=shield;}
      const gain=addDragonResource(source,18,true); logs.push(createLog(source,turnNumber,'초목과 천수가 얽혀 생명의 성역을 이룬다.',{text:`아군 보호막 ${total}${gain.gained?` · 천수 +${gain.gained}`:''}`,type:'buff'},speechLine)); if(gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'})); break;
    }
    case 'EFFECT_THUNDER_DRAGON_STORM_CROWN': {
      const form=isDragonEmperorFormActive(source); addStatus(source,source,'SPEED_UP','뇌관',3,form?55:35); addStatus(source,source,'CRIT_UP','뇌관',3,form?40:25);
      logs.push(createLog(source,turnNumber,'뇌광이 왕관처럼 휘감기며 감각과 속도를 끌어올린다.',{text:'속도/치명타 상승',type:'buff'},speechLine)); break;
    }
    case 'EFFECT_FROST_DRAGON_RIME_SCALE': {
      const form=isDragonEmperorFormActive(source); const shield=Math.max(1,Math.round((source.maxHp*0.24+source.stats.physicalDefense*2)*(form?1.65:1)));
      source.statusEffects.push({id:`rime_scale_${Date.now()}`,type:'SHIELD',name:'상고대 용린',duration:3,value:shield,sourceActorId:source.id,skipNextDurationTick:true}); addStatus(source,source,'DEF_UP','상고대 용린',3,form?45:28);
      const gain=addDragonResource(source,24+Math.min(12,Math.round(shield/source.maxHp*20)),true); logs.push(createLog(source,turnNumber,'서리가 용린 위에 겹겹이 얼어붙었다.',{text:`보호막 +${shield}${gain.gained?` · 서리 +${gain.gained}`:''}`,type:'buff'},speechLine)); if(gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'})); break;
    }
    case 'EFFECT_FROST_DRAGON_FROZEN_BASTION': {
      const form=isDragonEmperorFormActive(source); let total=0; for(const ally of party){const shield=Math.max(1,Math.round((source.maxHp*0.14+source.stats.magicDefense*1.4)*(form?1.65:1)));ally.statusEffects.push({id:`frozen_bastion_${Date.now()}_${ally.id}`,type:'SHIELD',name:'빙성',duration:3,value:shield,sourceActorId:source.id});total+=shield;}
      const gain=addDragonResource(source,32,true); logs.push(createLog(source,turnNumber,'거대한 한빙 장벽이 아군을 감싸며 솟아오른다.',{text:`아군 보호막 ${total}${gain.gained?` · 서리 +${gain.gained}`:''}`,type:'buff'},speechLine)); if(gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'})); break;
    }
    case 'EFFECT_DEFEND': {
      addStatus(source, source, 'DEFEND', '방어 태세', 1, 50);
      logs.push(createLog(
        source,
        turnNumber,
        `${source.name}(이)가 방어 태세를 취했다. 다음 행동 기회까지 받는 피해가 50% 감소한다.`,
        { text: '방어 태세 · 피해 -50%', type: 'buff' },
        source.isPlayer ? generateCombatSpeech(speechStyle, 'DEFEND') : undefined
      ));
      break;
    }

    case 'EFFECT_FIRST_AID': {
      const heal = Math.round((15 + (source.stats.magicAttack ?? 5) * 0.8) * (hasTrait(source,'MUT_FIRST_AID_FIELD') ? 1.25 : 1));
      const target = targets[0] || source;
      const before = target.hp;
      const missing = Math.max(0, target.maxHp - before);
      target.hp = Math.min(target.maxHp, target.hp + heal);
      const actual = target.hp - before;
      const overheal = Math.max(0, heal - missing);
      if (hasTrait(source, 'RUNE_RADIANCE_24') && overheal > 0) {
        target.statusEffects.push({ id:`radiance_overheal_${Date.now()}`, type:'SHIELD', name:'넘치는 광휘', duration:2, value:Math.max(1, Math.round(overheal * 0.6)), sourceActorId:source.id, skipNextDurationTick:source.id===target.id });
      }
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 ${target.name}에게 응급 처치를 마쳤다.`, { text: `HP +${actual}`, type: 'heal' }, speechLine));
      break;
    }

    case 'EFFECT_DIVINE_HEAL': {
      const prayer = source.equipmentRuntime?.counters?.prayer ?? 0;
      const heal = Math.round((35 + (source.stats.magicAttack ?? 10) * 1.6) * (hasTrait(source,'SET_LAST_SANCTUARY_3') ? 1 + prayer*0.08 : 1));
      const healTargets = skill.targetType === 'ALL_ALLIES' ? (targets.length > 0 ? targets : [source]) : [targets[0] || source];
      let hadStigmataOverheal = false;
      for (const target of healTargets) {
        if (target.hp <= 0) continue;
        const before = target.hp;
        const missing = Math.max(0, target.maxHp - before);
        target.hp = Math.min(target.maxHp, target.hp + heal);
        const actual = target.hp - before;
        const overheal = Math.max(0, heal - missing);
        if (hasTrait(source, 'RUNE_RADIANCE_24') && overheal > 0) {
          target.statusEffects.push({ id:`radiance_overheal_${Date.now()}_${target.id}`, type:'SHIELD', name:'넘치는 광휘', duration:2, value:Math.max(1, Math.round(overheal * 0.6)), sourceActorId:source.id, skipNextDurationTick:source.id===target.id });
        }
        if ((hasTrait(source, 'SET_DAWN_PRIEST_3') || hasTrait(source, 'MUT_DIVINE_HEAL_STIGMATA')) && overheal > 0) {
          target.statusEffects.push({ id:`overheal_shield_${Date.now()}_${target.id}`, type:'SHIELD', name:'넘친 기도', duration:2, value:Math.max(1, Math.round(overheal * (hasTrait(source,'MUT_DIVINE_HEAL_STIGMATA') ? 1.25 : 0.75))), sourceActorId:source.id, skipNextDurationTick:source.id===target.id });
          ensureEquipmentRuntime(target).links['dawn_priest_source'] = source.id;
          hadStigmataOverheal = true;
        }
        if (source.traits.includes('TALENT_HEAL_SHIELD') && actual > 0) {
          target.statusEffects.push({
            id: `shield_${Date.now()}_${target.id}`,
            type: 'SHIELD',
            name: '신성 보호막',
            duration: 2,
            value: Math.max(1, Math.round(actual * 0.5)),
            sourceActorId: source.id,
            skipNextDurationTick: source.id === target.id,
          });
        }
        logs.push(createLog(source, turnNumber, `성스러운 빛이 ${target.name}의 상처를 회복시켰다.`, { text: `HP +${actual}`, type: 'heal' }, speechLine));
      }
      if (hasTrait(source, 'SET_DAWN_PRIEST_2')) source.cost = Math.min(source.maxCost, source.cost + 1);
      if (hadStigmataOverheal && hasTrait(source, 'MUT_DIVINE_HEAL_STIGMATA')) source.cost = Math.min(source.maxCost, source.cost + 2);
      break;
    }

    case 'EFFECT_THROW_SAND': {
      for (const target of targets) {
        addStatus(source, target, 'ACCURACY_DOWN', '시야 방해', 2, 25);
        logs.push(createLog(source, turnNumber, `${target.name}의 시야가 모래에 가려졌다.`, { text: '명중 -25', type: 'buff' }, speechLine));
      }
      break;
    }

    case 'EFFECT_HUMAN_RESOLVE': {
      addStatus(source, source, 'ATK_UP', '불굴의 투지', 3, 20);
      addStatus(source, source, 'MAGIC_ATK_UP', '불굴의 투지', 3, 20);
      addStatus(source, source, 'ACCURACY_UP', '불굴의 집중', 3, 20);
      logs.push(createLog(source, turnNumber, `${source.name}의 집중력이 극한까지 올라간다.`, { text: '공격 +20% · 명중 +20', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_DRAGONKIN_SCALE_GUARD': {
      const shield = Math.max(1, Math.round(source.maxHp * 0.24 + (source.stats.magicDefense ?? 0) * 2));
      source.statusEffects.push({ id:`dragon_scale_guard_${Date.now()}`, type:'SHIELD', name:'용린 수호', duration:3, value:shield, sourceActorId:source.id, skipNextDurationTick:true });
      addStatus(source, source, 'PHYSICAL_DEF_UP', '용린 경화', 3, 22);
      addStatus(source, source, 'MAGIC_DEF_UP', '용린 경화', 3, 22);
      logs.push(createLog(source, turnNumber, `${source.name}의 용린이 영력을 머금고 단단하게 빛난다.`, { text:`보호막 +${shield} · 방어 +22%`, type:'buff' }, speechLine));
      break;
    }
    case 'EFFECT_DRAGON_EMPEROR_ROAR': {
      for (const target of targets) {
        addStatus(source, target, 'WEAKEN', '용왕의 위압', 2, 20);
        addStatus(source, target, 'ACCURACY_DOWN', '용왕의 위압', 2, 18);
      }
      logs.push(createLog(source, turnNumber, `${source.name}의 포효가 전장을 짓누른다.`, { text:'적 전체 공격 -20% · 명중 -18', type:'buff' }, speechLine));
      break;
    }
    case 'EFFECT_DRAGON_EMPEROR_SCALE_DOMAIN': {
      for (const ally of party) {
        const shield = Math.max(1, Math.round(source.maxHp * 0.16 + (source.stats.magicDefense ?? 0) * 1.2));
        ally.statusEffects.push({ id:`dragon_domain_${Date.now()}_${ally.id}`, type:'SHIELD', name:'용린 성역', duration:3, value:shield, sourceActorId:source.id, skipNextDurationTick:source.id===ally.id });
        addStatus(source, ally, 'DEF_UP', '용린 성역', 3, 18);
      }
      logs.push(createLog(source, turnNumber, `${source.name}이(가) 아군 주위에 용린의 성역을 펼쳤다.`, { text:'아군 전체 보호막 · 방어 +18%', type:'buff' }, speechLine));
      break;
    }

    case 'EFFECT_IRON_WALL': {
      const shield = Math.round(source.maxHp * 0.3);
      source.statusEffects.push({
        id: `shield_${Date.now()}`,
        type: 'SHIELD',
        name: '철벽 보호막',
        duration: 3,
        value: shield,
        sourceActorId: source.id,
        skipNextDurationTick: true,
      });
      addStatus(source, source, 'PHYSICAL_DEF_UP', '철벽의 요새', 3, 30);
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 철벽과 같은 방어를 구축했다.`, { text: `보호막 +${shield} · 물방 +30%`, type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_SACRED_SHIELD': {
      const shieldTargets = skill.targetType === 'ALL_ALLIES' ? (targets.length > 0 ? targets : [source]) : [targets[0] || source];
      for (const target of shieldTargets) {
        if (target.hp <= 0) continue;
        const shield = Math.max(1, Math.round(target.maxHp * 0.25 + source.stats.magicAttack * 0.5));
        target.statusEffects.push({
          id: `shield_${Date.now()}_${target.id}`,
          type: 'SHIELD',
          name: '수호의 축복',
          duration: 3,
          value: shield,
          sourceActorId: source.id,
          skipNextDurationTick: source.id === target.id,
        });
        addStatus(source, target, 'DEF_UP', '수호의 축복', 3, 25);
        logs.push(createLog(source, turnNumber, `${target.name}을(를) 신성한 방벽이 감쌌다.`, { text: `보호막 +${shield} · 방어 +25%`, type: 'buff' }, speechLine));
      }
      break;
    }

    case 'EFFECT_PRIEST_PURIFYING_LIGHT': {
      const target = targets[0] || source;
      const shield = Math.max(1, Math.round(source.maxHp * 0.14 + source.stats.magicAttack * 0.9));
      target.statusEffects = target.statusEffects.filter((effect) => !['POISON','BLEED','BURN','SLOW','WEAKEN','ACCURACY_DOWN','FEAR','CHARM'].includes(effect.type));
      target.statusEffects.push({
        id: `priest_purify_${Date.now()}_${target.id}`,
        type: 'SHIELD',
        name: '정화의 빛',
        duration: 3,
        value: shield,
        sourceActorId: source.id,
        skipNextDurationTick: source.id === target.id,
      });
      addStatus(source, target, 'MAGIC_DEF_UP', '정화의 빛', 3, 25);
      logs.push(createLog(source, turnNumber, `${target.name}을(를) 감싼 빛이 해로운 상태를 씻어냈다.`, { text: `해로운 상태 정화 · 보호막 +${shield} · 마법 방어 +25%`, type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_HEALER_GROUP_PRAYER': {
      const heal = Math.max(1, Math.round(18 + source.stats.magicAttack * 0.65));
      for (const ally of party) {
        const before = ally.hp;
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        addStatus(source, ally, 'REGENERATION', '공동 기도', 3, Math.max(2, Math.round(source.stats.magicAttack * 0.18)));
        if (ally.hp > before) {
          // 실제 회복량은 로그 집계를 위해 개별 계산만 하고 별도 영어 키를 노출하지 않는다.
        }
      }
      logs.push(createLog(source, turnNumber, `기도가 아군 전체에 번져 상처를 보듬고 회복력을 끌어올렸다.`, { text: `아군 전체 체력 +${heal} · 재생 3턴`, type: 'heal' }, speechLine));
      break;
    }

    case 'EFFECT_HEALER_LIFE_GUARD': {
      const target = targets[0] || source;
      const shield = Math.max(1, Math.round(target.maxHp * 0.3 + source.stats.magicAttack * 0.65));
      target.statusEffects.push({
        id: `healer_life_guard_${Date.now()}_${target.id}`,
        type: 'SHIELD',
        name: '생명 수호',
        duration: 3,
        value: shield,
        sourceActorId: source.id,
        skipNextDurationTick: source.id === target.id,
      });
      addStatus(source, target, 'DEF_UP', '생명 수호', 3, 20);
      addStatus(source, target, 'MAGIC_DEF_UP', '생명 수호', 3, 20);
      logs.push(createLog(source, turnNumber, `${target.name}의 생명을 지키는 보호가 완성되었다.`, { text: `보호막 +${shield} · 방어/마법 방어 +20%`, type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_SMOKE_BOMB': {
      for (const target of opponents) addStatus(source, target, 'ACCURACY_DOWN', '연막', 2, 30);
      addStatus(source, source, 'EVASION_UP', '연막 속 은신', 2, 50);
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 전장을 짙은 연막으로 뒤덮었다.`, { text: '적 명중 -30 · 회피 +50', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_ALLURING_STEP': {
      addStatus(source, source, 'EVASION_UP', '매혹의 스텝', 2, 40);
      for (const target of opponents) addStatus(source, target, 'ACCURACY_DOWN', '시선 교란', 2, 25);
      logs.push(createLog(source, turnNumber, `${source.name}의 움직임이 적의 시선을 완전히 흔들어 놓았다.`, { text: '회피 +40 · 적 명중 -25', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_CRESCENT_STEP': {
      addStatus(source, source, 'EVASION_UP', '초승달 비보', 1, 100);
      addStatus(source, source, 'CRIT_UP', '초승달의 급소', 1, 100);
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 그림자처럼 사라져 다음 공격 각도를 선점했다.`, { text: '완전 회피 1회 행동 · 다음 공격 확정 치명', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_PASSION_DANCE': {
      for (const ally of party) {
        const power = hasTrait(source, 'EQ_AUTOCRAT_SEAL') ? 60 : 30;
        addStatus(source, ally, 'ATK_UP', '정열의 칸타빌레', 3, power);
        addStatus(source, ally, 'MAGIC_ATK_UP', '정열의 칸타빌레', 3, power);
      }
      logs.push(createLog(source, turnNumber, `${source.name}의 춤이 아군의 전의를 폭발적으로 끌어올렸다.`, { text: '아군 공격/마공 +30%', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_CAPTIVATING_VEIL': {
      for (const ally of party) {
        ally.statusEffects.push({
          id: `veil_${Date.now()}_${ally.id}`,
          type: 'INVULNERABLE',
          name: '환혹의 장막',
          duration: 2,
          value: hasTrait(source, 'EQ_AUTOCRAT_SEAL') ? 2 : 1,
          sourceActorId: source.id,
          skipNextDurationTick: source.id === ally.id,
        });
      }
      logs.push(createLog(source, turnNumber, `환영의 장막이 아군 전체를 감쌌다.`, { text: '아군 전체 · 다음 공격 1회 완전 회피', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_THIEF_LOOT_MARK': {
      const target = targets[0];
      if (target) {
        addStatus(source, target, 'VULNERABLE', '약탈 표식', 3, 25);
        addStatus(source, target, 'ACCURACY_DOWN', '손버릇 교란', 3, 20);
        logs.push(createLog(source, turnNumber, `${target.name}의 빈틈과 습관이 전부 드러났다.`, { text: '받는 피해 +25% · 명중 -20', type: 'buff' }, speechLine));
      }
      break;
    }

    case 'EFFECT_THIEF_ESCAPE_ROUTE': {
      addStatus(source, source, 'EVASION_UP', '도주로 확보', 2, 50);
      addStatus(source, source, 'SPEED_UP', '도주로 확보', 2, 35);
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 전장의 빠져나갈 길을 선점했다.`, { text: '회피 +50 · 속도 +35%', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_MAGIC_KNIGHT_AEGIS': {
      const shield = Math.max(1, Math.round(source.maxHp * 0.18 + source.stats.magicAttack * 0.9));
      source.statusEffects.push({ id:`magic_knight_aegis_${Date.now()}`, type:'SHIELD', name:'마검 방벽', duration:3, value:shield, sourceActorId:source.id, skipNextDurationTick:true });
      addStatus(source, source, 'PHYSICAL_DEF_UP', '마검 방벽', 3, 25);
      addStatus(source, source, 'MAGIC_DEF_UP', '마검 방벽', 3, 35);
      logs.push(createLog(source, turnNumber, `비전 회로가 검을 중심으로 방벽을 형성했다.`, { text: `보호막 +${shield} · 물방 +25% · 마방 +35%`, type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_HOLY_KNIGHT_JUDGMENT': {
      addStatus(source, source, 'TAUNT', '성광의 도발', 2, 1);
      addStatus(source, source, 'DEF_UP', '심판의 자세', 2, hasTrait(source, 'EVOLUTION_HOLY_KNIGHT_OATHBOUND') ? 20 : 15);
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 성광을 내세워 적의 시선을 자신에게 고정했다.`, { text: '도발 · 방어 강화', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_HOLY_KNIGHT_GUARDIAN_FIELD': {
      for (const ally of party) {
        const shield = Math.max(1, Math.round(source.maxHp * 0.12 + source.stats.magicDefense * 0.8));
        ally.statusEffects.push({ id:`holy_guard_${Date.now()}_${ally.id}`, type:'SHIELD', name:'수호 성역', duration:3, value:shield, sourceActorId:source.id, skipNextDurationTick:source.id===ally.id });
        addStatus(source, ally, 'DEF_UP', '수호 성역', 3, 20);
      }
      logs.push(createLog(source, turnNumber, `성역이 아군 전체의 전열을 감쌌다.`, { text: '아군 보호막 · 방어 +20%', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_HOLY_KNIGHT_OATH': {
      addStatus(source, source, 'DEF_UP', '불퇴의 성약', 3, 35);
      addStatus(source, source, 'MAGIC_DEF_UP', '불퇴의 성약', 3, 35);
      addStatus(source, source, 'TAUNT', '성기사의 도발', 3, 1);
      addStatus(source, source, 'REGENERATION', '성약의 재생', 3, Math.max(3, Math.round(source.maxHp * 0.06)));
      logs.push(createLog(source, turnNumber, `${source.name}(이)가 전열을 떠맡는 성약을 세웠다.`, { text: '방어 +35% · 마방 +35% · 도발 · 재생', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_TOILET_SUPPORT_FOCUS': {
      const target = targets.find((actor) => actor.isCompanion && actor.hp > 0);
      if (target) {
        addStatus(source, target, 'ATK_UP', '지원 집중', 3, 45);
        addStatus(source, target, 'MAGIC_ATK_UP', '지원 집중', 3, 45);
        addStatus(source, target, 'SPEED_UP', '지원 집중', 3, 25);
        addStatus(source, target, 'CRIT_UP', '지원 집중', 3, 20);
        logs.push(createLog(source, turnNumber, `${target.name}에게 전투 지원 효과가 집중되었다.`, { text: '동료 공격/마공 +45% · 속도 +25% · 치명 +20', type: 'buff' }, speechLine));
      }
      break;
    }

    case 'EFFECT_TOILET_SUPPORT_OVERDRIVE': {
      const companions = party.filter((actor) => actor.isCompanion && actor.hp > 0);
      for (const ally of companions) {
        addStatus(source, ally, 'ATK_UP', '지원 과부하', 3, 30);
        addStatus(source, ally, 'MAGIC_ATK_UP', '지원 과부하', 3, 30);
        addStatus(source, ally, 'DEF_UP', '지원 과부하', 3, 25);
        addStatus(source, ally, 'SPEED_UP', '지원 과부하', 3, 20);
      }
      logs.push(createLog(source, turnNumber, `${companions.length}명의 동료에게 강화 효과가 전달되었다.`, { text: '동료 전체 공격/마공 +30% · 방어 +25% · 속도 +20%', type: 'buff' }, speechLine));
      break;
    }

    case 'EFFECT_TOILET_TOTAL_SUPPORT': {
      const target = targets.find((actor) => actor.isCompanion && actor.hp > 0);
      if (target) {
        addStatus(source, target, 'ATK_UP', '전력 지원', 2, 70);
        addStatus(source, target, 'MAGIC_ATK_UP', '전력 지원', 2, 70);
        addStatus(source, target, 'DEF_UP', '전력 지원', 2, 35);
        addStatus(source, target, 'SPEED_UP', '전력 지원', 2, 40);
        addStatus(source, target, 'CRIT_UP', '전력 지원', 2, 35);
        target.statusEffects.push({ id:`total_support_${Date.now()}_${target.id}`, type:'SHIELD', name:'전력 지원', duration:2, value:Math.max(1,Math.round(target.maxHp*0.35)), sourceActorId:source.id });
        addStatus(source, source, 'WEAKEN', '전력 소모', 2, 30);
        addStatus(source, source, 'SLOW', '전력 소모', 2, 30);
        logs.push(createLog(source, turnNumber, `${target.name}에게 모든 지원 역량이 집중되었다.`, { text: '동료 초강화 2턴 · 사용자 공격/속도 -30%', type: 'buff' }, speechLine));
      }
      break;
    }

    default:
      break;
  }

  // 피해가 있는 스킬은 전용 효과와 별개로 피해를 처리한다.
  if (skill.damageMultiplier != null) {
    for (const target of targets.filter((actor) => actor.hp > 0)) {
      const damageOptions: DamageCalculationOptions = {
        damageBonusPercent: runtimeMods.damageBonusPercent,
        bonusCritChance: runtimeMods.bonusCritChance,
        bonusCritDamage: runtimeMods.bonusCritDamage,
        hitChanceBonus: runtimeMods.hitChanceBonus,
        defenseIgnoreRatio: runtimeMods.defenseIgnoreRatio,
        alwaysHit: runtimeMods.alwaysHit || skill.alwaysHit,
        elementalPenetrationBonus: runtimeMods.elementalPenetrationBonus,
      };

      if (skill.effectId === 'EFFECT_ROGUE_AMBUSH') damageOptions.bonusCritChance = 35;
      if (skill.effectId === 'EFFECT_PRECISION_SHOT') {
        damageOptions.alwaysHit = true;
        damageOptions.forceCrit = true;
      }
      if (skill.effectId === 'EFFECT_VITAL_POINT') damageOptions.defenseIgnoreRatio = 0.5;
      if (skill.effectId === 'EFFECT_ARCANE_BURST') damageOptions.defenseIgnoreRatio = 0.3;
      if (skill.effectId === 'EFFECT_MAGIC_KNIGHT_ARCANE_CLEAVE') damageOptions.defenseIgnoreRatio = 0.25;
      if (skill.effectId === 'EFFECT_MAGIC_KNIGHT_SPELLBLADE') damageOptions.defenseIgnoreRatio = 0.15;
      if (skill.effectId === 'EFFECT_BLADEDANCER_FLURRY') damageOptions.bonusCritChance = 20;
      if (skill.effectId === 'EFFECT_BLADEDANCER_EXECUTION') {
        const missingHpRatio = 1 - target.hp / Math.max(1, target.maxHp);
        damageOptions.multiplier = getSkillDamageMultiplier(source, skill, target, context?.battleState) * (1 + Math.min(1, missingHpRatio));
      }

      if (damageOptions.multiplier == null) damageOptions.multiplier = getSkillDamageMultiplier(source, skill, target, context?.battleState);
      const { result, log } = applyDamage(source, target, skill, turnNumber, speechLine, damageOptions);
      logs.push(log);
      const equipmentLogs = onEquipmentDamageOutcome(source, target, skill, result, context?.battleState);
      for (const text of equipmentLogs) logs.push(createLog(source, turnNumber, text, { text: '장비 효과', type: 'buff' }));
      if (!result.isHit) continue;
      if (result.isCrit) actionHadCrit = true;
      if (runtimeMods.targetGaugePush) target.actionGauge += runtimeMods.targetGaugePush;

      // 용족 심화 전직 전용 자원. UI에는 한국어 자원명만 노출한다.
      const targetBranch = getDragonSovereignBranch(target);
      if (targetBranch === 'FROST' && result.finalDamage > 0) {
        const gain = addDragonResource(target, 8 + Math.min(22, Math.round(result.finalDamage / Math.max(1,target.maxHp) * 100)));
        if (gain.gained > 0) logs.push(createLog(target,turnNumber,`${target.name}의 용린에 서리가 응축된다.`,{text:`서리 +${gain.gained}`,type:'buff'}));
        if (gain.message) logs.push(createLog(target,turnNumber,gain.message,{text:'용제 현현',type:'buff'}));
      }
      const sourceBranch = getDragonSovereignBranch(source);
      if (sourceBranch === 'THUNDER' && result.isCrit) {
        const gain = addDragonResource(source, 18, true);
        if (gain.gained > 0) logs.push(createLog(source,turnNumber,`치명적인 뇌광이 용맥을 자극한다.`,{text:`뇌명 +${gain.gained}`,type:'crit'}));
        if (gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'}));
      }
      if (sourceBranch === 'THUNDER' && (skill.id.startsWith('thunder_dragon_') || skill.id === 'basic_attack')) {
        const chaseChance = isDragonEmperorFormActive(source) ? 1 : 0.38;
        if (Math.random() < chaseChance && target.hp > 0) {
          const chaseOptions: DamageCalculationOptions = { damageType:'MAGIC', multiplier:isDragonEmperorFormActive(source)?0.72:0.45, element:'LIGHTNING', bonusCritChance:10 };
          const chase = calculateDamage(source,target,chaseOptions); target.hp=Math.max(0,target.hp-chase.finalDamage);
          logs.push(createLog(source,turnNumber,`뒤늦은 낙뢰가 ${target.name}을 다시 꿰뚫었다.`,{text:`추가 공격 -${chase.finalDamage}`,type:chase.isCrit?'crit':'damage'}));
          const gain=addDragonResource(source,14+(chase.isCrit?8:0),true); if(gain.gained>0) logs.push(createLog(source,turnNumber,'추가 뇌격이 뇌명을 축적한다.',{text:`뇌명 +${gain.gained}`,type:'buff'})); if(gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'}));
        }
      }

      // 최후성역 4세트: 아군의 치명적 피해를 전투당 1회 기적으로 막는다.
      if (target.hp <= 0 && context) {
        const targetIsParty = target.isPlayer || !!target.isCompanion;
        const targetSide = targetIsParty ? (source.isPlayer || source.isCompanion ? context.allies : context.enemies) : (source.isPlayer || source.isCompanion ? context.enemies : context.allies);
        const savior = targetSide?.find((ally) => hasTrait(ally, 'SET_LAST_SANCTUARY_4') && !(ally.consumedBattleEffects || []).includes('last_sanctuary_save'));
        if (savior) {
          target.hp = 1;
          target.statusEffects.push({ id:`last_sanctuary_${Date.now()}`, type:'SHIELD', name:'최후성역', duration:2, value:Math.max(1, Math.round(target.maxHp*0.2)), sourceActorId:savior.id });
          savior.consumedBattleEffects = [...(savior.consumedBattleEffects || []), 'last_sanctuary_save'];
          logs.push(createLog(savior, turnNumber, `${savior.name}의 최후성역이 ${target.name}의 치명상을 기적으로 붙들었다.`, { text: 'HP 1 생존 · 성역', type: 'heal' }));
        }
      }

      if (target.hp <= 0) actionHadKill = true;

      // 방어 반격: 방어 태세에서 실제 피해를 받았고 생존했을 때 즉시 80% 물리 반격.
      if (result.finalDamage > 0 && target.hp > 0 && source.hp > 0 && hasTrait(target, 'TALENT_WARRIOR_COUNTER') && target.statusEffects.some((status) => status.type === 'DEFEND')) {
        const counterSkill = getSkillDefinition('basic_attack')!;
        const counter = applyDamage(target, source, counterSkill, turnNumber, undefined, { damageType:'PHYSICAL', multiplier:0.8, alwaysHit:true });
        logs.push(createLog(target, turnNumber, `${target.name}이(가) 방어 태세에서 즉시 반격했다.`, { text: counter.result.isHit ? `반격 -${counter.result.finalDamage}` : '반격 무효', type: counter.result.isCrit ? 'crit' : 'damage' }));
        for (const text of onEquipmentDamageOutcome(target, source, counterSkill, counter.result, context?.battleState)) {
          logs.push(createLog(target, turnNumber, text, { text:'특성 효과', type:'buff' }));
        }
      }

      switch (skill.effectId) {
        case 'EFFECT_BEAST_CLAWS':
        case 'EFFECT_SHADOW_STRIKE':
        case 'EFFECT_SPINNING_DANCE':
          addStatus(source, target, 'BLEED', '출혈', 3, Math.round(source.stats.physicalAttack * 0.3));
          break;
        case 'EFFECT_POISON_ARROW': {
          const venom12 = hasTrait(source, 'RUNE_VENOM_12');
          const poisonPower = skill.scalingStat === 'magic' || skill.scalingStat === 'spirit'
            ? source.stats.magicAttack
            : source.stats.physicalAttack;
          addStatus(source, target, 'POISON', '맹독', venom12 ? 4 : 3, Math.round(poisonPower * (venom12 ? 0.48 : 0.35)));
          break;
        }
        case 'EFFECT_SHIELD_BASH':
          addStatus(source, target, 'STUN', '기절', 1);
          break;
        case 'EFFECT_HEAVY_STRIKE':
          if (rollStatus(source, target, 35)) addStatus(source, target, 'STUN', '강타 충격', 1);
          break;
        case 'EFFECT_EVASIVE_SHOT':
          addStatus(source, source, 'EVASION_UP', '후퇴 도약', 1, 50);
          break;
        case 'EFFECT_DRAGONKIN_SACRED_BREATH':
          if (rollStatus(source, target, 35)) addStatus(source, target, 'FEAR', '영물의 위압', 1, 10);
          break;
        case 'EFFECT_DRAGON_EMPEROR_ANCESTRAL_FLAME':
          addStatus(source, target, 'BURN', '조룡의 성화', 3, Math.max(2, Math.round(source.stats.magicAttack * 0.32)));
          break;
        case 'EFFECT_INFERNO_WYRM_EMBER_FANG':
        case 'EFFECT_INFERNO_WYRM_BLAZING_WINGS':
          addStatus(source, target, 'BURN', isDragonEmperorFormActive(source)?'용제의 업화':'업화', isDragonEmperorFormActive(source)?4:3, Math.max(2,Math.round(source.stats.magicAttack*(isDragonEmperorFormActive(source)?0.48:0.3))));
          break;
        case 'EFFECT_FROST_DRAGON_GLACIAL_FANG':
          addStatus(source,target,'SLOW',isDragonEmperorFormActive(source)?'용제의 극한':'빙결 둔화',isDragonEmperorFormActive(source)?3:2,isDragonEmperorFormActive(source)?45:30);
          break;
        case 'EFFECT_FIREBOLT': {
          const flame12 = hasTrait(source, 'RUNE_FLAME_12');
          addStatus(source, target, 'BURN', '화상', flame12 ? 4 : 3, Math.max(2, Math.round(source.stats.magicAttack * (flame12 ? 0.34 : 0.25))));
          break;
        }
        case 'EFFECT_FROST_NOVA':
          addStatus(source, target, 'SLOW', '냉기 둔화', 2, 30);
          break;
        case 'EFFECT_SUCCUBUS_SEDUCTION':
          addStatus(source, target, 'STUN', '매혹', 1);
          if (typeof target.sanity === 'number') {
            target.sanity = Math.max(0, target.sanity - Math.max(1, Math.round((target.maxSanity ?? 100) * 0.1)));
          }
          break;
        case 'EFFECT_SOUL_DRAIN': {
          const heal = Math.max(1, Math.round(result.finalDamage * 0.5));
          source.hp = Math.min(source.maxHp, source.hp + heal);
          source.mp = Math.min(source.maxMp, source.mp + heal);
          logs.push(createLog(source, turnNumber, `${source.name}(이)가 흡수한 생명력으로 회복했다.`, { text: `HP/MP +${heal}`, type: 'heal' }));
          break;
        }
        case 'EFFECT_MIND_BLAST':
          addStatus(source, target, 'FEAR', '공포', 2, 20);
          addStatus(source, target, 'WEAKEN', '정신 붕괴', 2, 20);
          addStatus(source, target, 'ACCURACY_DOWN', '공포', 2, 20);
          break;
        case 'EFFECT_FAN_WALTZ':
          addStatus(source, target, 'CHARM', '매혹', 1);
          break;
        case 'EFFECT_THIEF_QUICK_FINGERS': {
          const gain = hasTrait(source, 'EVOLUTION_THIEF_LIGHT_FINGERS') ? 6 : 4;
          source.cost = Math.min(source.maxCost, source.cost + gain);
          addStatus(source, target, 'VULNERABLE', '손놀림의 빈틈', 2, 10);
          logs.push(createLog(source, turnNumber, `${source.name}(이)가 공격의 빈틈에서 전투 자원을 빼냈다.`, { text: `전투 자원 +${gain} · 받는 피해 +10%`, type: 'buff' }));
          break;
        }
        case 'EFFECT_MAGIC_KNIGHT_SPELLBLADE':
          addStatus(source, source, 'MAGIC_ATK_UP', '마력검 전개', 2, hasTrait(source, 'EVOLUTION_MAGIC_KNIGHT_RESONANCE') ? 25 : 20);
          addStatus(source, source, 'ATK_UP', '마력검 전개', 2, 15);
          break;
        default:
          break;
      }
    }

    if (runtimeMods.splashRatio > 0 && skill.targetType === 'ENEMY' && targets[0]) {
      const primary = targets[0];
      const splashTargets = opponents.filter((enemy) => enemy.id !== primary.id && enemy.hp > 0).slice(0, 2);
      for (const splashTarget of splashTargets) {
        const splashOptions: DamageCalculationOptions = {
          multiplier: getSkillDamageMultiplier(source, skill, splashTarget, context?.battleState) * runtimeMods.splashRatio,
          element: skill.element ?? 'NEUTRAL',
          hitChanceBonus: runtimeMods.hitChanceBonus,
          elementalPenetrationBonus: runtimeMods.elementalPenetrationBonus,
        };
        const splash = applyDamage(source, splashTarget, skill, turnNumber, speechLine, splashOptions);
        logs.push(createLog(source, turnNumber, `${skill.name.trim() ? skill.name : '기술'}의 분산 효과가 ${splashTarget.name}에게 이어졌다.`, { text: splash.result.isHit ? `분산 피해 -${splash.result.finalDamage}` : '분산 빗나감', type: splash.result.isHit ? 'damage' : 'miss' }));
      }
    }

    if (skill.effectId === 'EFFECT_FAN_WALTZ') {
      for (const ally of party) addStatus(source, ally, 'SPEED_UP', '부채의 왈츠', 2, hasTrait(source, 'EQ_AUTOCRAT_SEAL') ? 40 : 20);
      logs.push(createLog(source, turnNumber, `바람의 흐름이 아군의 움직임을 가속했다.`, { text: '아군 속도 +20%', type: 'buff' }));
    }
  } else if (logs.length === 0) {
    // 데이터가 존재하지만 아직 전용 수치효과가 없는 비피해형 스킬도 자기 자신을 공격하지 않는다.
    logs.push(createLog(source, turnNumber, `${source.name}(이)가 ${skillLabel}을(를) 사용했다.`, { text: '효과 적용', type: 'info' }, speechLine));
  }

  // 절정의 카니발: 이번 행동에서 적에게 새 매혹/상태이상을 실제로 부여했을 때 아군 전체 강화.
  if (hasTrait(source, 'TALENT_CLIMAX_CARNIVAL')) {
    const appliedOffensiveStatus = opponents.some((actor) =>
      actor.statusEffects.some((status) => harmfulStatusTypes.has(status.type) && status.sourceActorId === source.id && !harmfulStatusIdsBefore.has(status.id))
    );
    if (appliedOffensiveStatus) {
      for (const ally of party.filter((actor) => actor.hp > 0)) {
        addStatus(source, ally, 'ATK_UP', '절정의 카니발', 3, 25);
        addStatus(source, ally, 'EVASION_UP', '절정의 카니발', 3, 25);
      }
      logs.push(createLog(source, turnNumber, `${source.name}의 카니발이 상태이상 적중에 호응해 아군 전체를 고양시켰다.`, { text:'아군 공격/회피 +25% · 3턴', type:'buff' }));
    }
  }

  const performTalentExtraStrike = (label: string, multiplier = 1) => {
    if (source.hp <= 0) return;
    const extraTarget = targets.find((actor) => actor.hp > 0) || opponents.find((actor) => actor.hp > 0);
    if (!extraTarget) return;
    const basic = getSkillDefinition('basic_attack')!;
    const extra = applyDamage(source, extraTarget, basic, turnNumber, undefined, { damageType:'PHYSICAL', multiplier });
    logs.push(createLog(source, turnNumber, `${source.name}의 ${label}이(가) ${extraTarget.name}에게 이어졌다.`, { text: extra.result.isHit ? `${label} -${extra.result.finalDamage}` : `${label} 빗나감`, type: extra.result.isCrit ? 'crit' : extra.result.isHit ? 'damage' : 'miss' }));
    for (const text of onEquipmentDamageOutcome(source, extraTarget, basic, extra.result, context?.battleState)) {
      logs.push(createLog(source, turnNumber, text, { text:'특성 효과', type:'buff' }));
    }
  };

  // 연사 극의는 처치/치명타가 있었던 원래 행동에서 50% 확률로 단 한 번 추가 사격한다.
  if (skill.damageMultiplier != null && hasTrait(source, 'TALENT_ARROW_FRENZY') && (actionHadCrit || actionHadKill) && Math.random() < 0.5) {
    performTalentExtraStrike('추가 사격', 1);
  }
  // 차크람 곡예는 실제 쌍수 세팅에서 공격 행동마다 30% 확률로 추가 연격한다.
  if (skill.damageMultiplier != null && hasTrait(source, 'TALENT_CHAKRAM_FLOW_DUAL_ACTIVE') && Math.random() < 0.3) {
    performTalentExtraStrike('추가 연격', 1);
  }

  if (getDragonSovereignBranch(source) === 'INFERNO' && skill.damageMultiplier != null && !isDragonEmperorFormActive(source)) {
    const gain = addDragonResource(source, skill.element === 'FIRE' ? 18 : 10, true);
    if (gain.gained > 0) logs.push(createLog(source,turnNumber,'공격의 열기가 용맥 속 불꽃으로 응축된다.',{text:`불꽃 +${gain.gained}`,type:'buff'}));
    if (gain.message) logs.push(createLog(source,turnNumber,gain.message,{text:'용제 현현',type:'buff'}));
  }

  for (const text of onEquipmentSkillResolved(source, skill, targets, context?.battleState)) {
    logs.push(createLog(source, turnNumber, text, { text: '장비 효과', type: 'buff' }));
  }
  consumeRuntimeKeys(source, runtimeMods.consumeKeys);
  if (overflowWasActive) source.cost = 0;

  return {
    sourceActor: source,
    targetActors: targets,
    logEntries: logs,
    speechLine,
    wasExecuted: true,
    skillId: skill.id,
    actionDelay,
    costSpent: cost,
    cooldownSet: cooldown,
  };
}

export function getSkillElement(skillId: string): CombatElement {
  return getSkillDefinition(skillId)?.element ?? 'NEUTRAL';
}
