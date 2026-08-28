import type { CombatElement } from '../../combat/combatTypes';
import type { CombatDerivedStats } from '../combatConfig';
import { EQUIPMENT_DATABASE } from './equipmentDatabase';
import { GENERATED_EQUIPMENT_SETS } from './equipmentExpansionCatalog';
import {
  EquipmentDefinition,
  EquipmentGrade,
  EquipmentQuality,
  EquipmentSetDefinition,
  EquippedItems,
} from './equipmentTypes';

export const EQUIPMENT_GRADE_VISUALS: Record<EquipmentGrade, {label:string;borderClass:string}> = {
  NORMAL:{label:'일반',borderClass:'border-zinc-500'}, ELITE:{label:'엘리트',borderClass:'border-cyan-500'}, LEGENDARY:{label:'레전더리',borderClass:'border-amber-400'}
};
export const TIER_MULTIPLIER: Record<number,number> = {1:1,2:1.08,3:1.16,4:1.25,5:1.35,6:1.46,7:1.58,8:1.71,9:1.85,10:2,11:2.16,12:2.33};
export const GRADE_MULTIPLIER: Record<EquipmentGrade,number> = {NORMAL:1,ELITE:1.15,LEGENDARY:1.35};
export const QUALITY_MULTIPLIER: Record<EquipmentQuality,number> = {POOR:.85,NORMAL:1,GOOD:1.08,EXCELLENT:1.16,MASTERWORK:1.25,PERFECT:1.35};
export const QUALITY_LABEL: Record<EquipmentQuality,string> = {POOR:'조악',NORMAL:'보통',GOOD:'양질',EXCELLENT:'우수',MASTERWORK:'걸작',PERFECT:'완벽'};
export const getEquipmentGrade=(e:EquipmentDefinition):EquipmentGrade=>e.grade ?? (e.rarity==='LEGENDARY'?'LEGENDARY':(['RARE','EPIC'] as string[]).includes(e.rarity)?'ELITE':'NORMAL');
export const getEquipmentTier=(e:EquipmentDefinition)=>Math.min(12,Math.max(1,e.tier ?? Math.ceil((e.requiredLevel ?? 1)/5)));
export const getEquipmentQuality=(e:EquipmentDefinition):EquipmentQuality=>e.quality ?? 'NORMAL';
export function calculateEquipmentScaledStat(base:number,tier:number,grade:EquipmentGrade,quality:EquipmentQuality){return base*(TIER_MULTIPLIER[tier]??1)*GRADE_MULTIPLIER[grade]*QUALITY_MULTIPLIER[quality];}

const LEGACY_EQUIPMENT_SETS: Record<string,EquipmentSetDefinition> = {
  venom_stalker:{id:'venom_stalker',name:'독추적자의 흔적',sourceMonsterId:'FUTURE_MONSTER_VENOM_01',pieceItemIds:[],description:'독과 추적에 특화된 미래 몬스터 기반 세트.',bonuses:[{requiredPieces:2,description:'상태이상 적을 추적하는 감각이 강화된다.',effects:[{id:'venom_2',effects:[{type:'STAT_MODIFIER',statKey:'statusHitRate',value:8}]}]},{requiredPieces:4,description:'독성 사냥 본능을 재현하는 전투 효과가 해금된다.',effects:[{id:'venom_4',trigger:'ON_HIT',effects:[{type:'FUTURE_STATUS_EFFECT',valueText:'VENOM'}]}]}]},
  iron_colossus:{id:'iron_colossus',name:'철갑거수의 잔향',sourceMonsterId:'FUTURE_MONSTER_COLOSSUS_01',pieceItemIds:[],description:'방어와 경직 저항에 특화된 중갑 세트.',bonuses:[{requiredPieces:2,description:'육중한 외피의 방호력을 얻는다.',effects:[{id:'colossus_2',effects:[{type:'STAT_MODIFIER',statKey:'physicalDefense',value:12}]}]},{requiredPieces:3,description:'거수의 버팀을 모방한다.',effects:[{id:'colossus_3',effects:[{type:'STAT_MODIFIER',statKey:'tenacity',value:10}]}]}]},
  storm_hide:{id:'storm_hide',name:'폭풍가죽의 질주',sourceMonsterId:'FUTURE_MONSTER_STORM_01',pieceItemIds:[],description:'속도와 회피를 살린 경갑 세트.',bonuses:[{requiredPieces:2,description:'폭풍 같은 기동성을 얻는다.',effects:[{id:'storm_2',effects:[{type:'STAT_MODIFIER',statKey:'actionSpeed',value:7}]}]},{requiredPieces:4,description:'회피 후 반격하는 미래 트리거 자리.',effects:[{id:'storm_4',trigger:'ON_EVADE',effects:[{type:'FUTURE_COMBAT_EFFECT',valueText:'STORM_COUNTER'}]}]}]},
  astral_weave:{id:'astral_weave',name:'성운직조의 장막',sourceMonsterId:'FUTURE_MONSTER_ASTRAL_01',pieceItemIds:[],description:'천옷 기반 마력/자원 세트.',bonuses:[{requiredPieces:2,description:'마력 저장량을 높인다.',effects:[{id:'astral_2',effects:[{type:'STAT_MODIFIER',statKey:'maxMp',value:25}]}]},{requiredPieces:4,description:'주문 자원 순환을 강화하는 미래 효과.',effects:[{id:'astral_4',effects:[{type:'FUTURE_RESOURCE_EFFECT',valueText:'ARCANE_FLOW'}]}]}]}
};

export const EQUIPMENT_SETS: Record<string, EquipmentSetDefinition> = {
  ...LEGACY_EQUIPMENT_SETS,
  ...GENERATED_EQUIPMENT_SETS,
};

export interface EquipmentSetProgress {
  setId: string;
  set: EquipmentSetDefinition;
  equippedPieces: number;
  equippedItemIds: string[];
}

export interface ResolvedEquipmentSetEffects {
  combatStatBonuses: Partial<CombatDerivedStats>;
  elementResistances: Partial<Record<CombatElement, number>>;
  elementDamageBonuses: Partial<Record<CombatElement, number>>;
  traits: string[];
  activeBonuses: Array<{
    setId: string;
    setName: string;
    requiredPieces: number;
    description: string;
  }>;
}

export function getEquipmentSetDefinition(setId?: string | null): EquipmentSetDefinition | undefined {
  if (!setId) return undefined;
  return EQUIPMENT_SETS[setId];
}

export function getEquippedSetProgress(equipped: Partial<EquippedItems> | undefined | null): EquipmentSetProgress[] {
  const counts = new Map<string, { itemIds: string[] }>();
  for (const itemId of Object.values(equipped || {})) {
    if (!itemId) continue;
    const item = EQUIPMENT_DATABASE[itemId];
    if (!item?.setId || !EQUIPMENT_SETS[item.setId]) continue;
    const current = counts.get(item.setId) || { itemIds: [] };
    current.itemIds.push(item.id);
    counts.set(item.setId, current);
  }
  return Array.from(counts.entries())
    .map(([setId, data]) => ({
      setId,
      set: EQUIPMENT_SETS[setId],
      equippedPieces: data.itemIds.length,
      equippedItemIds: data.itemIds,
    }))
    .sort((a, b) => b.equippedPieces - a.equippedPieces || a.set.name.localeCompare(b.set.name));
}

export function getEquippedSetCount(equipped: Partial<EquippedItems> | undefined | null, setId?: string | null): number {
  if (!setId) return 0;
  return getEquippedSetProgress(equipped).find((entry) => entry.setId === setId)?.equippedPieces ?? 0;
}

export function resolveEquipmentSetEffects(equipped: Partial<EquippedItems> | undefined | null): ResolvedEquipmentSetEffects {
  const resolved: ResolvedEquipmentSetEffects = {
    combatStatBonuses: {},
    elementResistances: {},
    elementDamageBonuses: {},
    traits: [],
    activeBonuses: [],
  };

  for (const progress of getEquippedSetProgress(equipped)) {
    for (const bonus of progress.set.bonuses) {
      if (progress.equippedPieces < bonus.requiredPieces) continue;
      resolved.activeBonuses.push({
        setId: progress.setId,
        setName: progress.set.name,
        requiredPieces: bonus.requiredPieces,
        description: bonus.description,
      });

      for (const effect of bonus.effects) {
        for (const payload of effect.effects) {
          const value = typeof payload.value === 'number' ? payload.value : 0;
          if (payload.type === 'STAT_MODIFIER' && payload.statKey) {
            const key = payload.statKey as keyof CombatDerivedStats;
            const previous = Number(resolved.combatStatBonuses[key] ?? 0);
            (resolved.combatStatBonuses as Record<string, number>)[key] = previous + value;
          } else if (payload.type === 'ELEMENT_RESISTANCE' && payload.statKey) {
            const element = payload.statKey as CombatElement;
            resolved.elementResistances[element] = (resolved.elementResistances[element] || 0) + value;
          } else if (payload.type === 'ELEMENT_DAMAGE_BONUS' && payload.statKey) {
            const element = payload.statKey as CombatElement;
            resolved.elementDamageBonuses[element] = (resolved.elementDamageBonuses[element] || 0) + value;
          } else if (payload.type === 'TRAIT' && payload.valueText) {
            resolved.traits.push(payload.valueText);
          }
        }
      }
    }
  }

  resolved.traits = Array.from(new Set(resolved.traits));
  return resolved;
}
