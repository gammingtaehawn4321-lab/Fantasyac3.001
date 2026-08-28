import type { EquippedItems } from './equipmentTypes';

export interface EquipmentSynergyDefinition {
  id: string;
  name: string;
  itemIds: string[];
  traitId: string;
  description: string;
}

export const EQUIPMENT_SYNERGIES: EquipmentSynergyDefinition[] = [
  { id:'twilight', name:'황혼', itemIds:['v1_pair_sun_ring','v1_pair_eclipse_necklace'], traitId:'SYNERGY_TWILIGHT', description:'HOLY와 DARK 피해 보너스 중 낮은 쪽을 높은 쪽과 동일하게 맞춘다.' },
  { id:'paradox_route', name:'역설 항로', itemIds:['v1_pair_broken_compass','v1_pair_last_route'], traitId:'SYNERGY_PARADOX_ROUTE', description:'Timeline에서 가장 뒤에 있을 때 COST +3, 행동 게이지 +120을 추가로 얻는다.' },
  { id:'absolute_zero', name:'절대영도 시계장치', itemIds:['v1_pair_frost_moon','v1_pair_frozen_gear'], traitId:'SYNERGY_ABSOLUTE_ZERO', description:'냉기 공격의 행동 게이지 감소량이 50% 증가하고 빙점 축적이 빨라진다.' },
  { id:'silent_correction', name:'침묵의 보정', itemIds:['v1_pair_silent_arrowhead','v1_pair_missed_record'], traitId:'SYNERGY_SILENT_CORRECTION', description:'공격이 빗나가면 다음 공격은 명중 보정 +45, 치명타 확률 +20%를 얻는다.' },
  { id:'resonance_duet', name:'쌍환 공명', itemIds:['v1_pair_resonance_ring','v1_pair_resonance_earring'], traitId:'SYNERGY_RESONANCE_DUET', description:'서로 다른 스킬을 연속 사용하면 COST 1을 회복한다.' },
  { id:'blood_throne', name:'혈좌의 맥동', itemIds:['v1_pair_blood_core','v1_pair_black_crown'], traitId:'SYNERGY_BLOOD_THRONE', description:'HP를 소모하는 장비 효과가 발동할 때 행동 게이지 +100을 얻는다.' },
  { id:'prismatic_formula', name:'분광 공식', itemIds:['v1_pair_prism_lens','v1_pair_infinite_catalyst'], traitId:'SYNERGY_PRISMATIC_FORMULA', description:'단일 마법의 분산 피해 비율 +15%p, 속성 관통 +10.' },
  { id:'twin_steps', name:'쌍보무', itemIds:['v1_pair_left_bell','v1_pair_right_bell'], traitId:'SYNERGY_TWIN_STEPS', description:'공격↔지원 교차 사용 시 행동 게이지 +100.' },
  { id:'eclipse_scar', name:'일식성흔', itemIds:['v1_pair_white_scar','v1_pair_black_scar'], traitId:'SYNERGY_ECLIPSE_SCAR', description:'HOLY 또는 DARK 스킬 사용 시 반대 속성 피해 보너스도 10% 획득한다.' },
  { id:'hunter_clock', name:'사냥꾼의 초침', itemIds:['v1_pair_hunter_clock','v1_pair_predator_eye'], traitId:'SYNERGY_HUNTER_CLOCK', description:'같은 적을 연속 공격할 때 3연속부터 Action Delay가 추가로 15% 감소한다.' },
  { id:'zero_sum', name:'영점의 그릇', itemIds:['v1_mech_empty_cup_0','v1_mech_overflow_chalice_0'], traitId:'SYNERGY_ZERO_SUM', description:'COST가 0 또는 최대일 때 피해 +12%와 명중 +10을 추가로 얻는다.' },
  { id:'guarded_fury', name:'막아낸 분노', itemIds:['v1_mech_broken_shield_0','v1_mech_heavy_crown_0'], traitId:'SYNERGY_GUARDED_FURY', description:'방어 후 공격받지 않았다면 다음 공격 강화가 +40%로 상승한다.' },
];

export function resolveEquipmentSynergies(equipped: Partial<EquippedItems> | undefined | null): EquipmentSynergyDefinition[] {
  const ids = new Set(Object.values(equipped || {}).filter((x): x is string => !!x));
  return EQUIPMENT_SYNERGIES.filter((synergy) => synergy.itemIds.every((id) => ids.has(id)));
}
