import type { CompanionData, PetCareAction, PlayerState } from '../../types';
import { getPetSpeciesDefinition } from './petDatabase';
import { normalizePetState } from './petState';
import { getItemDefinition } from '../items/itemDatabase';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type CareBase = { familiarity:number; loyalty:number; wildness:number; bondExp:number; desireRelief?:number; bathroomRelief?:number };
const FEED_BASE: CareBase = { familiarity:4, loyalty:1, wildness:-1, bondExp:2 };
const CARE_BASE: Record<PetCareAction, CareBase> = {
  PLAY: { familiarity:5, loyalty:2, wildness:-2, bondExp:3 },
  GROOM: { familiarity:3, loyalty:2, wildness:-3, bondExp:2 },
  TAME: { familiarity:2, loyalty:5, wildness:-4, bondExp:4, desireRelief:12, bathroomRelief:10 },
};

export const PET_CARE_LABELS: Record<PetCareAction, string> = { PLAY:'놀아주기', GROOM:'손질하기', TAME:'길들이기' };

function careEfficiency(repeatCount: number): number {
  if (repeatCount <= 0) return 1;
  if (repeatCount === 1) return 0.65;
  if (repeatCount === 2) return 0.35;
  return 0.1;
}

function nextBond(bondLevel: number, bondExp: number, add: number): { bondLevel: number; bondExp: number } {
  const nextExp = Math.max(0, bondExp + add);
  let level = Math.max(1, Math.min(10, Math.floor(bondLevel || 1)));
  while (level < 10 && nextExp >= level * 100) level += 1;
  return { bondLevel: level, bondExp: nextExp };
}

export interface PetCareResult {
  nextState: PlayerState;
  message: string;
  changes?: { familiarity: number; loyalty: number; wildness: number; bondExp: number; desireRelief: number; bathroomRelief: number; efficiency: number };
}

/**
 * 펫 돌봄/길들이기. 같은 날 같은 행동을 반복하면 효율이 감소한다.
 * 길들이기는 친밀/충성/야생성/유대와 함께 욕구를 선제적으로 완화한다.
 * 먹이는 이 함수로 우회할 수 없고 feedPetItem()에서 실제 인벤토리 1개 소비 후 처리한다.
 */
function performPetCareInternal(state: PlayerState, petId: string, actionKey: PetCareAction | 'FEED_INTERNAL', baseOverride?: CareBase): PetCareResult {
  if (state.equippedPetId !== petId) return { nextState: state, message: '현재 장착 중인 펫에게만 돌봄 행동을 할 수 있습니다.' };
  let result: PetCareResult['changes'];
  let found = false;
  let clearedRequestId: string | undefined;
  const day = Math.max(0, Math.floor(Number(state.dayCount || 0)));
  const companions = (state.companions || []).map((c) => {
    if (c.id !== petId || c.kind !== 'PET' || !c.petState) return c;
    found = true;
    const ps = normalizePetState(c.petState)!;
    const def = getPetSpeciesDefinition(ps.speciesId);
    const sameDay = ps.activity.lastCareDay === day;
    const daily = sameDay ? { ...ps.activity.dailyCareCounts } : {};
    const repeats = Math.max(0, Number(daily[actionKey as PetCareAction] || 0));
    const efficiency = careEfficiency(repeats);
    const base = baseOverride || CARE_BASE[actionKey as PetCareAction];
    const familiarityDelta = Math.round(base.familiarity * def.careMultipliers.familiarity * efficiency * 100) / 100;
    const loyaltyDelta = Math.round(base.loyalty * def.careMultipliers.loyalty * efficiency * 100) / 100;
    const wildnessDelta = Math.round(base.wildness * def.careMultipliers.wildness * efficiency * 100) / 100;
    const bondExpDelta = Math.max(1, Math.round(base.bondExp * efficiency));
    const desireRelief = Math.max(0, Math.round(Number(base.desireRelief || 0) * efficiency * 100) / 100);
    const bathroomRelief = Math.max(0, Math.round(Number(base.bathroomRelief || 0) * efficiency * 100) / 100);
    const nextDesire = clamp(ps.needs.desire - desireRelief, 0, 100);
    const nextBathroom = clamp(ps.needs.bathroomUrge - bathroomRelief, 0, 100);
    const nb = nextBond(c.bond?.bondLevel || 1, c.bond?.bondExp || 0, bondExpDelta);
    if (actionKey !== 'FEED_INTERNAL') daily[actionKey] = repeats + 1;
    const totals = actionKey === 'FEED_INTERNAL' ? ps.activity.totalCareCounts : { ...ps.activity.totalCareCounts, [actionKey]: Number(ps.activity.totalCareCounts[actionKey] || 0) + 1 };

    // 길들이기로 현재 요청 임계치 아래까지 완화되면 요청을 자연스럽게 해제한다.
    const activeNeed = ps.requestState.activeNeed;
    const activeThreshold = Number(ps.requestState.threshold || 0);
    const activeValue = activeNeed === 'DESIRE' ? nextDesire : activeNeed === 'BATHROOM' ? nextBathroom : 0;
    const clearsActiveRequest = Boolean(activeNeed && activeThreshold > 0 && activeValue < activeThreshold);
    if (clearsActiveRequest) clearedRequestId = ps.requestState.requestId;
    const requestState = clearsActiveRequest ? { refusalCount: 0 } : ps.requestState;

    result = { familiarity: familiarityDelta, loyalty: loyaltyDelta, wildness: wildnessDelta, bondExp: bondExpDelta, desireRelief, bathroomRelief, efficiency };
    return {
      ...c,
      bond: { ...c.bond, bondLevel: nb.bondLevel, bondExp: nb.bondExp },
      bondLevel: nb.bondLevel,
      bondExp: nb.bondExp,
      petState: {
        ...ps,
        wildness: clamp(ps.wildness + wildnessDelta, 0, 100),
        relationship: {
          familiarity: clamp(ps.relationship.familiarity + familiarityDelta, 0, 100),
          loyalty: clamp(ps.relationship.loyalty + loyaltyDelta, 0, 100),
        },
        needs: {
          ...ps.needs,
          desire: nextDesire,
          bathroomUrge: nextBathroom,
          desireTriggeredThresholds: ps.needs.desireTriggeredThresholds.filter((t) => t <= nextDesire),
          bathroomTriggeredThresholds: ps.needs.bathroomTriggeredThresholds.filter((t) => t <= nextBathroom),
        },
        requestState,
        activity: { ...ps.activity, lastCareDay: day, dailyCareCounts: daily, totalCareCounts: totals },
      },
    };
  });
  if (!found || !result) return { nextState: state, message: '대상 펫을 찾을 수 없습니다.' };
  const companionNeedQueue = clearedRequestId
    ? (state.companionNeedQueue || []).filter((cue) => cue.requestId !== clearedRequestId)
    : state.companionNeedQueue;
  return {
    nextState: { ...state, companions, companionNeedQueue },
    message: `🐾 ${actionKey === 'FEED_INTERNAL' ? '먹이 주기' : PET_CARE_LABELS[actionKey]} 완료 · 친밀도 ${result.familiarity >= 0 ? '+' : ''}${result.familiarity}, 충성도 ${result.loyalty >= 0 ? '+' : ''}${result.loyalty}, 야생성 ${result.wildness >= 0 ? '+' : ''}${result.wildness}, 유대 EXP +${result.bondExp}${result.desireRelief > 0 ? `, 성욕 -${result.desireRelief}` : ''}${result.bathroomRelief > 0 ? `, 배설 욕구 -${result.bathroomRelief}` : ''}${result.efficiency < 1 ? ' (반복 효율 감소)' : ''}`,
    changes: result,
  };
}

export function performPetCare(state: PlayerState, petId: string, action: PetCareAction): PetCareResult {
  return performPetCareInternal(state, petId, action);
}

export interface PetFoodOption { itemId: string; name: string; quantity: number; preference: 'FAVORITE' | 'LIKED' | 'NORMAL'; }

export function getPetFoodOptions(state: PlayerState, petId: string): PetFoodOption[] {
  if (state.equippedPetId !== petId) return [];
  const pet = (state.companions || []).find((c) => c.id === petId && c.kind === 'PET' && c.petState);
  if (!pet?.petState) return [];
  const def = getPetSpeciesDefinition(pet.petState.speciesId);
  const allowed = new Set([...def.preferredFoodIds, ...def.likedFoodIds]);
  return (state.inventory || []).filter((x) => x.quantity > 0 && x.id && allowed.has(x.id)).map((x) => ({
    itemId: x.id!, name: x.name, quantity: x.quantity,
    preference: def.preferredFoodIds.includes(x.id!) ? 'FAVORITE' : def.likedFoodIds.includes(x.id!) ? 'LIKED' : 'NORMAL',
  }));
}

export function feedPetItem(state: PlayerState, petId: string, itemId: string): PetCareResult {
  if (state.equippedPetId !== petId) return { nextState: state, message: '현재 장착 중인 펫에게만 먹이를 줄 수 있습니다.' };
  const pet = (state.companions || []).find((c) => c.id === petId && c.kind === 'PET' && c.petState);
  const inv = (state.inventory || []).find((x) => x.id === itemId && x.quantity > 0);
  if (!pet?.petState || !inv) return { nextState: state, message: '먹일 수 있는 아이템이 없습니다.' };
  const def = getPetSpeciesDefinition(pet.petState.speciesId);
  if (!def.preferredFoodIds.includes(itemId) && !def.likedFoodIds.includes(itemId)) return { nextState: state, message: `${pet.name}이(가) 먹이로 받아들이지 않습니다.` };
  const baseState = { ...state, inventory: state.inventory.map((x) => x === inv ? { ...x, quantity: x.quantity - 1 } : x).filter((x) => x.quantity > 0) };
  const care = performPetCareInternal(baseState, petId, 'FEED_INTERNAL', FEED_BASE);
  const favorite = def.preferredFoodIds.includes(itemId);
  let nextState = care.nextState;
  if (favorite) {
    nextState = { ...nextState, companions: nextState.companions.map((c) => c.id === petId && c.petState ? { ...c, petState: { ...c.petState, relationship: { ...c.petState.relationship, familiarity: clamp(c.petState.relationship.familiarity + 2, 0, 100), loyalty: clamp(c.petState.relationship.loyalty + 1, 0, 100) } } } : c) };
  }
  const itemName = getItemDefinition(itemId)?.name || inv.name;
  return { ...care, nextState, message: `🐾 [${pet.name}] ${itemName} 급여${favorite ? ' · 매우 좋아하는 먹이!' : ''} · ${care.message.replace(/^🐾\s*/, '')}` };
}

export interface PetCommandRates {
  obedienceChance: number;
  independentActionChance: number;
  failureChance: number;
}

/** 친밀/충성/야생성을 실제 명령 확률로 환산한다. */
export function getPetCommandRates(pet: CompanionData): PetCommandRates {
  const ps = normalizePetState(pet.petState);
  if (!ps) return { obedienceChance: 0, independentActionChance: 0, failureChance: 100 };
  const obedienceChance = clamp(Math.round(55 + ps.relationship.loyalty * 0.35 + ps.relationship.familiarity * 0.15 - ps.wildness * 0.35), 10, 95);
  const independentActionChance = clamp(Math.round(5 + ps.wildness * 0.45 - ps.relationship.loyalty * 0.25), 0, Math.min(45, 100 - obedienceChance));
  return { obedienceChance, independentActionChance, failureChance: Math.max(0, 100 - obedienceChance - independentActionChance) };
}

export type PetCommandOutcome = 'OBEY' | 'INDEPENDENT' | 'FAIL';

/** 전투/UI 어디서든 동일한 확률식을 사용하도록 명령 판정을 순수 함수로 통합한다. */
export function rollPetCommandOutcome(pet: CompanionData, randomValue = Math.random()): PetCommandOutcome {
  const rates = getPetCommandRates(pet);
  const roll = clamp(Number(randomValue) || 0, 0, 0.999999) * 100;
  return roll < rates.obedienceChance
    ? 'OBEY'
    : roll < rates.obedienceChance + rates.independentActionChance
      ? 'INDEPENDENT'
      : 'FAIL';
}

export function resolvePetCommand(state: PlayerState, petId: string, randomValue = Math.random()): { nextState: PlayerState; outcome?: PetCommandOutcome; message: string } {
  let outcome: PetCommandOutcome | undefined;
  let petName = petId;
  const companions = (state.companions || []).map((c) => {
    if (c.id !== petId || c.kind !== 'PET' || !c.petState) return c;
    petName = c.name;
    const ps = normalizePetState(c.petState)!;
    outcome = rollPetCommandOutcome(c, randomValue);
    const activity = { ...ps.activity, lastCommandDay: Math.max(0, Math.floor(Number(state.dayCount || 0))) };
    if (outcome === 'OBEY') activity.commandSuccesses += 1;
    else if (outcome === 'INDEPENDENT') activity.independentActions += 1;
    else activity.commandFailures += 1;
    return { ...c, petState: { ...ps, activity } };
  });
  if (!outcome) return { nextState: state, message: '명령할 펫을 찾을 수 없습니다.' };
  const label = outcome === 'OBEY' ? '명령 수행' : outcome === 'INDEPENDENT' ? '독자 행동' : '명령 실패';
  return { nextState: { ...state, companions }, outcome, message: `🐾 [${petName}] ${label}` };
}

/** 『신진대사 강화』 퍽. 최대 5레벨. 기본 스탯을 올리는 대신 배설 욕구 증가속도가 빨라진다. */
export function upgradePetMetabolism(state: PlayerState, petId: string): { nextState: PlayerState; message: string } {
  if (state.equippedPetId !== petId) return { nextState: state, message: '현재 장착 중인 펫만 신진대사 강화를 할 수 있습니다.' };
  let message = '대상 펫을 찾을 수 없습니다.';
  let changed = false;
  const companions = (state.companions || []).map((c) => {
    if (c.id !== petId || c.kind !== 'PET' || !c.petState) return c;
    const ps = normalizePetState(c.petState)!;
    if (ps.growth.metabolismBoost >= 5) { message = '신진대사 강화는 이미 최대 레벨입니다.'; return c; }
    const nextLevel = ps.growth.metabolismBoost + 1;
    const def = getPetSpeciesDefinition(ps.speciesId);
    const mult = 1 + nextLevel * 0.03;
    const nextStats = Object.fromEntries(Object.entries(def.baseStats).map(([k,v]) => [k, Math.max(1, Math.round(Number(v) * mult * 100) / 100)])) as unknown as typeof c.stats;
    const hpRatio = c.maxHp > 0 ? c.hp / c.maxHp : 1;
    const nextMaxHp = Math.round((300 + Math.max(1, ps.growth.level) * 40) * mult);
    changed = true;
    message = `🐾 [${c.name}] 『신진대사 강화』 Lv.${nextLevel} · 기본 스탯 강화 / 배설 욕구 증가속도 +${nextLevel * 20}%`;
    return { ...c, baseStats: { ...nextStats }, stats: { ...nextStats }, maxHp: nextMaxHp, hp: Math.max(1, Math.round(nextMaxHp * hpRatio)), petState: { ...ps, growth: { ...ps.growth, metabolismBoost: nextLevel } } };
  });
  return { nextState: changed ? { ...state, companions } : state, message };
}

export function recordPetCommandOutcome(state: PlayerState, petId: string, outcome: PetCommandOutcome): PlayerState {
  const companions=(state.companions||[]).map(c=>{
    if(c.id!==petId||c.kind!=='PET'||!c.petState) return c;
    const ps=normalizePetState(c.petState)!;
    const activity={...ps.activity,lastCommandDay:Math.max(0,Math.floor(Number(state.dayCount||0)))};
    if(outcome==='OBEY') activity.commandSuccesses+=1;
    else if(outcome==='INDEPENDENT') activity.independentActions+=1;
    else activity.commandFailures+=1;
    return {...c,petState:{...ps,activity}};
  });
  return {...state,companions};
}
