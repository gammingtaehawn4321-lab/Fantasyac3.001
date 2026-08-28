import type { CombatElement } from '../../combat/combatTypes';
import type { CombatClassType } from '../classes';
import type {
  ArmorType,
  EquipmentDefinition,
  EquipmentGrade,
  EquipmentQuality,
  EquipmentSetDefinition,
  EquipmentSlot,
  WeaponStyle,
  WeaponType,
} from './equipmentTypes';

const SET_PIECE_SLOTS: EquipmentSlot[] = ['HEAD', 'CHEST', 'LEGS', 'GLOVES', 'BOOTS'];
const SET_PIECE_KOREAN: Partial<Record<EquipmentSlot, string>> = {
  HEAD: '머리장식',
  CHEST: '상의',
  LEGS: '하의',
  GLOVES: '장갑',
  BOOTS: '신발',
};

interface SetTheme {
  id: string;
  name: string;
  prefix: string;
  combatClass: CombatClassType;
  armorType: ArmorType;
  tier: number;
  grade: EquipmentGrade;
  quality: EquipmentQuality;
  element: CombatElement;
  sourceMonsterId: string;
  lore: string;
}

const SET_THEMES: SetTheme[] = [
  { id: 'iron_bastion', name: '철벽수호대의 맹세', prefix: '철벽수호', combatClass: 'WARRIOR', armorType: 'HEAVY', tier: 3, grade: 'ELITE', quality: 'GOOD', element: 'NEUTRAL', sourceMonsterId: 'ELITE_IRON_BASTION_01', lore: '성문이 무너진 뒤에도 전열을 떠나지 않았던 수호대의 장비.' },
  { id: 'ember_legion', name: '잿불군단의 전열', prefix: '잿불군단', combatClass: 'WARRIOR', armorType: 'HEAVY', tier: 6, grade: 'ELITE', quality: 'GOOD', element: 'FIRE', sourceMonsterId: 'ELITE_EMBER_LEGION_01', lore: '뜨거운 재와 불씨 속에서 전진하도록 단련된 중갑.' },
  { id: 'abyss_juggernaut', name: '심연거병의 외피', prefix: '심연거병', combatClass: 'WARRIOR', armorType: 'HEAVY', tier: 9, grade: 'ELITE', quality: 'EXCELLENT', element: 'DARK', sourceMonsterId: 'ELITE_ABYSS_JUGGERNAUT_01', lore: '심연의 압력을 버티며 뒤틀린 거병의 외피를 가공한 장비.' },
  { id: 'worldbreaker', name: '천붕파쇄자의 유산', prefix: '천붕파쇄', combatClass: 'WARRIOR', armorType: 'HEAVY', tier: 12, grade: 'LEGENDARY', quality: 'MASTERWORK', element: 'LIGHTNING', sourceMonsterId: 'LEGEND_WORLDBREAKER_01', lore: '대지를 울리는 일격을 견디고 되돌려주었다는 전설의 중갑.' },

  { id: 'gale_tracker', name: '질풍추적자의 발자국', prefix: '질풍추적', combatClass: 'ARCHER', armorType: 'LIGHT', tier: 3, grade: 'ELITE', quality: 'GOOD', element: 'LIGHTNING', sourceMonsterId: 'ELITE_GALE_TRACKER_01', lore: '바람의 방향이 바뀌기 전에 사냥감을 먼저 찾아내는 추적자의 경갑.' },
  { id: 'moon_hunter', name: '월하사냥꾼의 침묵', prefix: '월하사냥', combatClass: 'ARCHER', armorType: 'LIGHT', tier: 6, grade: 'ELITE', quality: 'GOOD', element: 'ICE', sourceMonsterId: 'ELITE_MOON_HUNTER_01', lore: '달빛 아래에서도 흔적을 남기지 않는 사냥꾼의 장비.' },
  { id: 'thunder_eagle', name: '뇌익독수리의 비상', prefix: '뇌익독수리', combatClass: 'ARCHER', armorType: 'LIGHT', tier: 9, grade: 'ELITE', quality: 'EXCELLENT', element: 'LIGHTNING', sourceMonsterId: 'ELITE_THUNDER_EAGLE_01', lore: '천둥과 함께 급강하하는 거대 독수리의 깃과 가죽으로 제작했다.' },
  { id: 'starfall_marksman', name: '별비명사수의 관측', prefix: '별비명사수', combatClass: 'ARCHER', armorType: 'LIGHT', tier: 12, grade: 'LEGENDARY', quality: 'MASTERWORK', element: 'ARCANE', sourceMonsterId: 'LEGEND_STARFALL_MARKSMAN_01', lore: '별이 떨어지는 궤적조차 사선으로 환산했다는 명사수의 유산.' },

  { id: 'night_fox', name: '밤여우의 잔영', prefix: '밤여우', combatClass: 'ROGUE', armorType: 'LIGHT', tier: 3, grade: 'ELITE', quality: 'GOOD', element: 'DARK', sourceMonsterId: 'ELITE_NIGHT_FOX_01', lore: '빛이 닿는 순간조차 그림자 속에 남도록 짜인 암습용 경갑.' },
  { id: 'venom_reaper', name: '독낫사냥꾼의 흔적', prefix: '독낫사냥', combatClass: 'ROGUE', armorType: 'LIGHT', tier: 6, grade: 'ELITE', quality: 'GOOD', element: 'POISON', sourceMonsterId: 'ELITE_VENOM_REAPER_01', lore: '독성 생물의 분비물을 견디도록 처리된 짙은 녹색 경갑.' },
  { id: 'blood_mirage', name: '혈무신기루의 장막', prefix: '혈무신기루', combatClass: 'ROGUE', armorType: 'LIGHT', tier: 9, grade: 'ELITE', quality: 'EXCELLENT', element: 'DARK', sourceMonsterId: 'ELITE_BLOOD_MIRAGE_01', lore: '붉은 안개 속에서 실루엣을 여러 겹으로 흩뜨리는 암살 장비.' },
  { id: 'void_assassin', name: '공허암살자의 무흔', prefix: '공허암살', combatClass: 'ROGUE', armorType: 'LIGHT', tier: 12, grade: 'LEGENDARY', quality: 'MASTERWORK', element: 'PSYCHIC', sourceMonsterId: 'LEGEND_VOID_ASSASSIN_01', lore: '살의조차 남기지 않는다는 이름 없는 암살자의 마지막 장비.' },

  { id: 'dawn_priest', name: '새벽사제의 기도', prefix: '새벽사제', combatClass: 'CLERIC', armorType: 'CLOTH', tier: 3, grade: 'ELITE', quality: 'GOOD', element: 'HOLY', sourceMonsterId: 'ELITE_DAWN_PRIEST_01', lore: '첫 햇빛과 함께 축복을 시작했던 순례 사제들의 예복.' },
  { id: 'saint_warden', name: '성역수호자의 서약', prefix: '성역수호', combatClass: 'CLERIC', armorType: 'CLOTH', tier: 6, grade: 'ELITE', quality: 'GOOD', element: 'HOLY', sourceMonsterId: 'ELITE_SAINT_WARDEN_01', lore: '치유보다 먼저 아군을 지키겠다는 서약이 수놓인 성직자의 전투복.' },
  { id: 'seraphic_choir', name: '천익성가대의 화음', prefix: '천익성가', combatClass: 'CLERIC', armorType: 'CLOTH', tier: 9, grade: 'ELITE', quality: 'EXCELLENT', element: 'HOLY', sourceMonsterId: 'ELITE_SERAPHIC_CHOIR_01', lore: '여러 겹의 성가가 마력 장벽처럼 겹쳐지는 고위 성직복.' },
  { id: 'last_sanctuary', name: '최후성역의 빛', prefix: '최후성역', combatClass: 'CLERIC', armorType: 'CLOTH', tier: 12, grade: 'LEGENDARY', quality: 'MASTERWORK', element: 'HOLY', sourceMonsterId: 'LEGEND_LAST_SANCTUARY_01', lore: '모든 성소가 무너진 뒤에도 단 한 사람을 지켜냈다는 기적의 예복.' },

  { id: 'silk_moon', name: '월견비단의 춤', prefix: '월견비단', combatClass: 'DANCER', armorType: 'CLOTH', tier: 3, grade: 'ELITE', quality: 'GOOD', element: 'ICE', sourceMonsterId: 'ELITE_SILK_MOON_01', lore: '달빛을 받아 은은하게 빛나는 가벼운 무희의 전투복.' },
  { id: 'petal_tempest', name: '화람폭풍의 선율', prefix: '화람폭풍', combatClass: 'DANCER', armorType: 'CLOTH', tier: 6, grade: 'ELITE', quality: 'GOOD', element: 'LIGHTNING', sourceMonsterId: 'ELITE_PETAL_TEMPEST_01', lore: '꽃잎과 돌풍처럼 끊임없이 방향을 바꾸는 춤을 위해 만들어졌다.' },
  { id: 'mirage_lotus', name: '신기루연화의 환무', prefix: '신기루연화', combatClass: 'DANCER', armorType: 'CLOTH', tier: 9, grade: 'ELITE', quality: 'EXCELLENT', element: 'PSYCHIC', sourceMonsterId: 'ELITE_MIRAGE_LOTUS_01', lore: '시선을 빼앗는 잔상과 정신 파동을 함께 흩뿌리는 환무용 예복.' },
  { id: 'celestial_dance', name: '천상무도의 궤적', prefix: '천상무도', combatClass: 'DANCER', armorType: 'CLOTH', tier: 12, grade: 'LEGENDARY', quality: 'MASTERWORK', element: 'ARCANE', sourceMonsterId: 'LEGEND_CELESTIAL_DANCE_01', lore: '한 번의 회전으로 별자리의 궤적을 그려낸다는 전설의 무희복.' },

  { id: 'rune_scholar', name: '룬학자의 해석', prefix: '룬학자', combatClass: 'MAGE', armorType: 'CLOTH', tier: 3, grade: 'ELITE', quality: 'GOOD', element: 'ARCANE', sourceMonsterId: 'ELITE_RUNE_SCHOLAR_01', lore: '기초 룬을 전투식으로 재배열하기 위해 안감 전체에 술식이 적혀 있다.' },
  { id: 'frost_astrologer', name: '빙점점성가의 관측', prefix: '빙점점성', combatClass: 'MAGE', armorType: 'CLOTH', tier: 6, grade: 'ELITE', quality: 'GOOD', element: 'ICE', sourceMonsterId: 'ELITE_FROST_ASTROLOGER_01', lore: '차가운 밤하늘의 별자리를 계산식으로 바꾸는 점성 마도사의 예복.' },
  { id: 'comet_archmage', name: '혜성대마도의 낙광', prefix: '혜성대마도', combatClass: 'MAGE', armorType: 'CLOTH', tier: 9, grade: 'ELITE', quality: 'EXCELLENT', element: 'FIRE', sourceMonsterId: 'ELITE_COMET_ARCHMAGE_01', lore: '혜성의 열과 낙하 궤도를 주문식에 담아낸 고위 마도복.' },
  { id: 'origin_weaver', name: '근원직조자의 공식', prefix: '근원직조', combatClass: 'MAGE', armorType: 'CLOTH', tier: 12, grade: 'LEGENDARY', quality: 'MASTERWORK', element: 'ARCANE', sourceMonsterId: 'LEGEND_ORIGIN_WEAVER_01', lore: '마력의 근원식을 실로 뽑아 엮었다고 전해지는 전설의 마도복.' },
];

const rarityForGrade = (grade: EquipmentGrade, tier: number): EquipmentDefinition['rarity'] => {
  if (grade === 'LEGENDARY') return 'LEGENDARY';
  if (grade === 'ELITE') return tier >= 8 ? 'EPIC' : 'RARE';
  return tier >= 5 ? 'UNCOMMON' : 'COMMON';
};

const classPrimaryStat = (combatClass: CombatClassType): keyof NonNullable<EquipmentDefinition['statModifiers']> => {
  switch (combatClass) {
    case 'WARRIOR': return 'strength';
    case 'ARCHER': return 'agility';
    case 'ROGUE': return 'agility';
    case 'CLERIC': return 'spirit';
    case 'DANCER': return 'luck';
    case 'MAGE': return 'intelligence';
    default: return 'vitality';
  }
};

function setPieceStats(theme: SetTheme, slot: EquipmentSlot): EquipmentDefinition['baseStats'] {
  const t = theme.tier;
  const slotScale: Partial<Record<EquipmentSlot, number>> = {
    HEAD: 0.85, CHEST: 1.25, LEGS: 1.05, GLOVES: 0.8, BOOTS: 0.8,
  };
  const s = slotScale[slot] ?? 1;
  switch (theme.combatClass) {
    case 'WARRIOR':
      return {
        physicalDefense: Math.round((5 + t * 1.7) * s),
        magicDefense: Math.round((2 + t * 0.7) * s),
        maxHp: Math.round((20 + t * 13) * s),
        tenacity: Math.max(2, Math.round((2 + t * 0.7) * s)),
      };
    case 'ARCHER':
      return {
        physicalDefense: Math.round((3 + t * 1.0) * s),
        evasion: Math.max(1, Math.round((1.5 + t * 0.45) * s)),
        accuracy: Math.max(2, Math.round((3 + t * 0.8) * s)),
        actionSpeed: Math.max(1, Math.round((1 + t * 0.25) * s)),
      };
    case 'ROGUE':
      return {
        physicalDefense: Math.round((2.5 + t * 0.9) * s),
        evasion: Math.max(1, Math.round((2 + t * 0.5) * s)),
        criticalChance: Math.max(1, Math.round((1 + t * 0.35) * s)),
        actionSpeed: Math.max(1, Math.round((1.5 + t * 0.3) * s)),
      };
    case 'CLERIC':
      return {
        physicalDefense: Math.round((2 + t * 0.6) * s),
        magicDefense: Math.round((5 + t * 1.45) * s),
        statusResistance: Math.max(2, Math.round((2 + t * 0.55) * s)),
        maxCost: slot === 'CHEST' || slot === 'HEAD' ? Math.max(1, Math.floor(t / 4)) : 0,
      };
    case 'DANCER':
      return {
        physicalDefense: Math.round((2 + t * 0.65) * s),
        magicDefense: Math.round((3 + t * 0.8) * s),
        evasion: Math.max(1, Math.round((2 + t * 0.45) * s)),
        actionSpeed: Math.max(1, Math.round((2 + t * 0.35) * s)),
      };
    case 'MAGE':
      return {
        physicalDefense: Math.round((1.5 + t * 0.5) * s),
        magicDefense: Math.round((4 + t * 1.25) * s),
        magicAttack: slot === 'CHEST' || slot === 'GLOVES' ? Math.round((2 + t * 0.8) * s) : 0,
        maxCost: slot === 'CHEST' || slot === 'HEAD' ? Math.max(1, Math.floor(t / 4)) : 0,
      };
    default:
      return { physicalDefense: Math.round((3 + t) * s) };
  }
}

const SET_BONUS_DESIGNS: Record<string, Array<{ pieces: 2 | 3 | 4; description: string; trait: string }>> = {
  iron_bastion: [
    { pieces: 2, description: '방어 사용 시 『철벽』을 준비한다.', trait: 'SET_IRON_BASTION_2' },
    { pieces: 3, description: '철벽 상태에서 처음 받는 피해가 20% 감소하고 철벽을 소모한다.', trait: 'SET_IRON_BASTION_3' },
    { pieces: 4, description: '철벽 소모 후 다음 공격 피해 +22%, Action Delay -20%.', trait: 'SET_IRON_BASTION_4' },
  ],
  ember_legion: [
    { pieces: 2, description: '공격 행동마다 『잔불』을 1축적한다(최대 3).', trait: 'SET_EMBER_LEGION_2' },
    { pieces: 3, description: '잔불 3중첩 시 다음 공격이 『잔불 폭발』로 강화되어 피해 +25%.', trait: 'SET_EMBER_LEGION_3' },
    { pieces: 4, description: '잔불 폭발이 적중하면 대상의 화염 저항을 일시적으로 깎는 전투 표식을 남긴다.', trait: 'SET_EMBER_LEGION_4' },
  ],
  abyss_juggernaut: [
    { pieces: 2, description: '한 번에 최대 HP 15% 이상의 피해를 받으면 최대 HP 12%의 『심연갑』을 생성한다.', trait: 'SET_ABYSS_JUGGERNAUT_2' },
    { pieces: 3, description: '심연갑이 존재하는 동안 받는 피해가 추가로 12% 감소한다.', trait: 'SET_ABYSS_JUGGERNAUT_3' },
    { pieces: 4, description: '심연갑이 파괴되면 COST를 회복하고 공격자에게 암흑 반동을 되돌린다.', trait: 'SET_ABYSS_JUGGERNAUT_4' },
  ],
  worldbreaker: [
    { pieces: 2, description: 'Action Delay 1.20 이상의 강공격 사용 시 『파쇄』 +1(최대 3).', trait: 'SET_WORLDBREAKER_2' },
    { pieces: 3, description: '파쇄 1당 공격 스킬 Action Delay가 6% 감소한다.', trait: 'SET_WORLDBREAKER_3' },
    { pieces: 4, description: '파쇄 3에서 다음 공격이 방어 30% 무시 + 대상 행동 게이지 -300 후 파쇄 초기화.', trait: 'SET_WORLDBREAKER_4' },
  ],

  gale_tracker: [
    { pieces: 2, description: '공격 적중 시 자신의 행동 게이지 +100.', trait: 'SET_GALE_TRACKER_2' },
    { pieces: 3, description: '같은 대상을 연속 공격할수록 명중과 치명타 확률이 상승한다.', trait: 'SET_GALE_TRACKER_3' },
    { pieces: 4, description: '동일 대상 3연속 명중 시 『추격사격』이 발동해 직전 피해의 35% 추가 피해.', trait: 'SET_GALE_TRACKER_4' },
  ],
  moon_hunter: [
    { pieces: 2, description: '아직 자신이 공격하지 않은 적에게 주는 첫 피해 +18%.', trait: 'SET_MOON_HUNTER_2' },
    { pieces: 3, description: '첫 공격이 적중한 적에게 『월하 표식』을 남긴다.', trait: 'SET_MOON_HUNTER_3' },
    { pieces: 4, description: '표식 대상을 공격할 때 25% 확률로 해당 스킬 COST를 환급한다.', trait: 'SET_MOON_HUNTER_4' },
  ],
  thunder_eagle: [
    { pieces: 2, description: '치명타 적중 시 다른 적 1명에게 번개 연쇄 피해가 발생한다.', trait: 'SET_THUNDER_EAGLE_2' },
    { pieces: 3, description: '연쇄 번개가 적중하면 자신의 행동 게이지 +120.', trait: 'SET_THUNDER_EAGLE_3' },
    { pieces: 4, description: '한 행동으로 적 3기 이상을 공격하면 행동 게이지 +300.', trait: 'SET_THUNDER_EAGLE_4' },
  ],
  starfall_marksman: [
    { pieces: 2, description: 'Timeline에서 자신보다 늦게 행동할 적은 칸 차이마다 피해 +3%(최대 +21%).', trait: 'SET_STARFALL_2' },
    { pieces: 3, description: '후순위 대상을 노릴수록 명중 보정도 함께 증가한다.', trait: 'SET_STARFALL_3' },
    { pieces: 4, description: 'Timeline상 가장 늦은 적 공격 시 방어 35% 무시 + 치명타 확률 +25%.', trait: 'SET_STARFALL_4' },
  ],

  night_fox: [
    { pieces: 2, description: '회피 성공 시 행동 게이지 +250.', trait: 'SET_NIGHT_FOX_2' },
    { pieces: 3, description: '회피 후 다음 공격 치명타 확률 +25%, Action Delay -25%.', trait: 'SET_NIGHT_FOX_3' },
    { pieces: 4, description: '회피 후 공격이 치명타면 COST 3을 회복한다.', trait: 'SET_NIGHT_FOX_4' },
  ],
  venom_reaper: [
    { pieces: 2, description: '치명타 시 대상에게 『맹독 낙인』 1중첩(최대 5).', trait: 'SET_VENOM_REAPER_2' },
    { pieces: 3, description: '맹독 낙인 대상 공격 시 중첩 수에 비례한 독 추가 피해.', trait: 'SET_VENOM_REAPER_3' },
    { pieces: 4, description: '맹독 낙인 5중첩에서 공격 시 낙인을 폭발시켜 큰 즉시 피해 후 초기화.', trait: 'SET_VENOM_REAPER_4' },
  ],
  blood_mirage: [
    { pieces: 2, description: '자신의 행동 사이에 피해를 받지 않았다면 『신기루』 +1(최대 5).', trait: 'SET_BLOOD_MIRAGE_2' },
    { pieces: 3, description: '신기루 1당 회피 +5, 치명타 확률 +4%.', trait: 'SET_BLOOD_MIRAGE_3' },
    { pieces: 4, description: '피격 시 신기루를 전부 소모해 피해를 줄이고 공격자의 행동 게이지를 중첩당 -100.', trait: 'SET_BLOOD_MIRAGE_4' },
  ],
  void_assassin: [
    { pieces: 2, description: '치명타 또는 처치 시 『무흔』을 축적한다(최대 3).', trait: 'SET_VOID_ASSASSIN_2' },
    { pieces: 3, description: '치명타 발생 시 COST 2 회복.', trait: 'SET_VOID_ASSASSIN_3' },
    { pieces: 4, description: '무흔 3에서 다음 단일 공격 피해 +20%, Action Delay -50% 후 초기화.', trait: 'SET_VOID_ASSASSIN_4' },
  ],

  dawn_priest: [
    { pieces: 2, description: '아군을 회복할 때 자신의 COST +1.', trait: 'SET_DAWN_PRIEST_2' },
    { pieces: 3, description: '초과 회복량의 75%를 보호막으로 전환한다.', trait: 'SET_DAWN_PRIEST_3' },
    { pieces: 4, description: '자신이 만든 초과 회복 보호막이 파괴되면 COST 2 회복.', trait: 'SET_DAWN_PRIEST_4' },
  ],
  saint_warden: [
    { pieces: 2, description: '보호막/방어 지원 스킬 사용 시 대상에게 『성역』 표식을 남긴다.', trait: 'SET_SAINT_WARDEN_2' },
    { pieces: 3, description: '성역 대상이 피해를 받으면 시전자의 행동 게이지 +100.', trait: 'SET_SAINT_WARDEN_3' },
    { pieces: 4, description: 'HP 35% 이하 아군에게 쓰는 신성 회복 스킬 Action Delay -35%.', trait: 'SET_SAINT_WARDEN_4' },
  ],
  seraphic_choir: [
    { pieces: 2, description: '서로 다른 아군에게 지원 스킬을 사용할 때 『화음』을 쌓는다.', trait: 'SET_SERAPHIC_CHOIR_2' },
    { pieces: 3, description: '화음이 높을수록 지원 행동 후 COST를 소량 되돌려 받는다.', trait: 'SET_SERAPHIC_CHOIR_3' },
    { pieces: 4, description: '화음 4에서 다음 지원 스킬의 잔향이 다른 아군에게 약화 복제된다.', trait: 'SET_SERAPHIC_CHOIR_4' },
  ],
  last_sanctuary: [
    { pieces: 2, description: '아군이 큰 피해를 받을 때 『기도』를 축적한다.', trait: 'SET_LAST_SANCTUARY_2' },
    { pieces: 3, description: '기도 중첩에 따라 회복/보호 행동의 효율이 상승한다.', trait: 'SET_LAST_SANCTUARY_3' },
    { pieces: 4, description: '전투당 1회, 아군의 치명적 피해를 HP 1로 막고 최대 HP 20% 보호막을 부여한다.', trait: 'SET_LAST_SANCTUARY_4' },
  ],

  silk_moon: [
    { pieces: 2, description: '지원 스킬 사용 시 『박자』 +1(최대 4).', trait: 'SET_SILK_MOON_2' },
    { pieces: 3, description: '공격↔지원 교차 사용 시 박자를 추가로 1 얻는다.', trait: 'SET_SILK_MOON_3' },
    { pieces: 4, description: '박자 4에서 다음 스킬 COST 50% 감소 후 박자 초기화.', trait: 'SET_SILK_MOON_4' },
  ],
  petal_tempest: [
    { pieces: 2, description: '같은 행동 유형을 반복하면 『반복』을 축적한다(최대 3).', trait: 'SET_PETAL_TEMPEST_2' },
    { pieces: 3, description: '다른 행동 유형으로 전환하면 반복을 소모해 『전환』을 얻는다.', trait: 'SET_PETAL_TEMPEST_3' },
    { pieces: 4, description: '전환 상태의 다음 행동은 공격이면 피해 +25%, Action Delay -30%.', trait: 'SET_PETAL_TEMPEST_4' },
  ],
  mirage_lotus: [
    { pieces: 2, description: '자신의 지원을 받은 아군에게 『연화』 표식을 남긴다.', trait: 'SET_MIRAGE_LOTUS_2' },
    { pieces: 3, description: '연화 표식 아군이 행동할 때 『갈채』 +1(최대 4).', trait: 'SET_MIRAGE_LOTUS_3' },
    { pieces: 4, description: '갈채 4에서 가장 뒤처진 아군의 행동 게이지 +250 후 갈채 초기화.', trait: 'SET_MIRAGE_LOTUS_4' },
  ],
  celestial_dance: [
    { pieces: 2, description: '서로 다른 스킬을 연속 사용하면 해당 스킬을 『무도』 기록에 남긴다.', trait: 'SET_CELESTIAL_DANCE_2' },
    { pieces: 3, description: '서로 다른 스킬 3개 연결 시 COST 2 회복.', trait: 'SET_CELESTIAL_DANCE_3' },
    { pieces: 4, description: '서로 다른 스킬 4개 연결 시 다음 스킬 COST 0, 피해 +25%, Action Delay -50%.', trait: 'SET_CELESTIAL_DANCE_4' },
  ],

  rune_scholar: [
    { pieces: 2, description: '같은 속성 주문을 연속 사용하면 『해석』을 축적한다(최대 3).', trait: 'SET_RUNE_SCHOLAR_2' },
    { pieces: 3, description: '해석 1당 해당 주문의 속성 관통 +8.', trait: 'SET_RUNE_SCHOLAR_3' },
    { pieces: 4, description: '해석 3에서 같은 속성을 다시 사용하면 COST 4 환급 후 해석 초기화.', trait: 'SET_RUNE_SCHOLAR_4' },
  ],
  frost_astrologer: [
    { pieces: 2, description: '냉기 공격 적중 시 대상에게 『빙점』 1중첩(최대 4).', trait: 'SET_FROST_ASTROLOGER_2' },
    { pieces: 3, description: '빙점 2 이상 대상은 냉기 피격마다 행동 게이지가 추가로 감소한다.', trait: 'SET_FROST_ASTROLOGER_3' },
    { pieces: 4, description: '빙점 4에서 냉기 적중 시 대상 행동 게이지 -280 후 빙점 초기화.', trait: 'SET_FROST_ASTROLOGER_4' },
  ],
  comet_archmage: [
    { pieces: 2, description: '화염 주문 사용 시 『고도』 +1(최대 3). 고도마다 화염 피해 +8%, Action Delay +5%.', trait: 'SET_COMET_ARCHMAGE_2' },
    { pieces: 3, description: '고도가 높을수록 화염 주문의 상태이상 적중이 강화된다.', trait: 'SET_COMET_ARCHMAGE_3' },
    { pieces: 4, description: '고도 3에서 다음 화염 주문이 『혜성』이 되어 피해 +50% 후 고도 초기화.', trait: 'SET_COMET_ARCHMAGE_4' },
  ],
  origin_weaver: [
    { pieces: 2, description: '사용한 비중립 속성을 최근 3개까지 『식』으로 기록한다.', trait: 'SET_ORIGIN_WEAVER_2' },
    { pieces: 3, description: '서로 다른 3속성을 완성하면 순서에 따라 『공식』 하나가 완성된다.', trait: 'SET_ORIGIN_WEAVER_3' },
    { pieces: 4, description: '완성 공식은 다음 공격 마법을 관통/광역화/지연감소/증폭 중 하나로 변형한다.', trait: 'SET_ORIGIN_WEAVER_4' },
  ],
};

function makeSetBonuses(theme: SetTheme): EquipmentSetDefinition['bonuses'] {
  return (SET_BONUS_DESIGNS[theme.id] || []).map((bonus) => ({
    requiredPieces: bonus.pieces,
    description: bonus.description,
    effects: [{ id: `${theme.id}_${bonus.pieces}`, effects: [{ type: 'TRAIT', valueText: bonus.trait }] }],
  }));
}

function createSetPiece(theme: SetTheme, slot: EquipmentSlot): EquipmentDefinition {
  const id = `set_${theme.id}_${slot.toLowerCase()}`;
  const primary = classPrimaryStat(theme.combatClass);
  const primaryValue = Math.max(1, Math.floor(theme.tier / 3));
  return {
    id,
    name: `${theme.prefix} ${SET_PIECE_KOREAN[slot]}`,
    slot,
    equipmentType: slot === 'CLOAK' ? 'ACCESSORY' : 'ARMOR',
    armorType: theme.armorType,
    rarity: rarityForGrade(theme.grade, theme.tier),
    grade: theme.grade,
    tier: theme.tier,
    quality: theme.quality,
    requiredLevel: theme.tier * 5,
    recommendedClasses: [theme.combatClass],
    baseStats: setPieceStats(theme, slot),
    statModifiers: { [primary]: primaryValue },
    elementResistances: theme.element === 'NEUTRAL' ? undefined : { [theme.element]: 2 + theme.tier },
    setId: theme.id,
    sourceMonsterId: theme.sourceMonsterId,
    acquisition: { methods: ['LOOT'], lootTableIds: [`loot_${theme.sourceMonsterId.toLowerCase()}`] },
    tags: ['SET', theme.combatClass, theme.armorType, `TIER_${theme.tier}`],
    description: `${theme.lore} ${SET_PIECE_KOREAN[slot]} 부위로, 같은 계통 장비와 함께 착용할수록 잠재력이 열린다.`,
    flavorText: `${theme.name}의 문양이 안쪽에 작게 새겨져 있다.`,
    equipDescription: `${theme.name} 세트 장비. ${SET_PIECE_KOREAN[slot]} 부위.`,
    effectDescription: `${theme.name} 세트의 2/3/4피스 보너스에 기여합니다.`,
    sellPrice: Math.round(55 * theme.tier * (theme.grade === 'LEGENDARY' ? 2.8 : 1.6)),
  };
}

export const GENERATED_EQUIPMENT_SETS: Record<string, EquipmentSetDefinition> = Object.fromEntries(
  SET_THEMES.map((theme) => {
    const pieceItemIds = SET_PIECE_SLOTS.map((slot) => `set_${theme.id}_${slot.toLowerCase()}`);
    return [theme.id, {
      id: theme.id,
      name: theme.name,
      sourceMonsterId: theme.sourceMonsterId,
      pieceItemIds,
      bonuses: makeSetBonuses(theme),
      description: theme.lore,
    } satisfies EquipmentSetDefinition];
  })
);

interface WeaponFamily {
  type: WeaponType;
  style: WeaponStyle;
  classes: CombatClassType[];
  mode: 'PHYSICAL' | 'MAGIC' | 'HYBRID';
  names: [string, string, string];
  elements?: [CombatElement, CombatElement, CombatElement];
}

const WEAPON_FAMILIES: WeaponFamily[] = [
  { type: 'SWORD', style: 'ONE_HANDED', classes: ['WARRIOR', 'ROGUE'], mode: 'PHYSICAL', names: ['청동잎 장검', '청람 기사의 검', '황혼절단검'] },
  { type: 'GREATSWORD', style: 'TWO_HANDED', classes: ['WARRIOR'], mode: 'PHYSICAL', names: ['장벽 파쇄 대검', '용골 참마검', '별무덤 대검'] },
  { type: 'SPEAR', style: 'TWO_HANDED', classes: ['WARRIOR'], mode: 'PHYSICAL', names: ['회색나루 장창', '뇌광 용기창', '천공관통창'], elements: ['NEUTRAL', 'LIGHTNING', 'LIGHTNING'] },
  { type: 'BOW', style: 'TWO_HANDED', classes: ['ARCHER'], mode: 'PHYSICAL', names: ['백목 사냥활', '월수림 장궁', '성추락 활'] },
  { type: 'CROSSBOW', style: 'TWO_HANDED', classes: ['ARCHER'], mode: 'PHYSICAL', names: ['철편 자동석궁', '성벽 관통쇠뇌', '묵시의 연발노'] },
  { type: 'DAGGER', style: 'DUAL_WIELD', classes: ['ROGUE'], mode: 'PHYSICAL', names: ['쥐이빨 단도', '흑련 쌍단도', '무흔 절명도'] },
  { type: 'STAFF', style: 'MAGIC', classes: ['MAGE'], mode: 'MAGIC', names: ['청석 룬지팡이', '서리별 장지팡이', '원환의 대마도장'], elements: ['ARCANE', 'ICE', 'ARCANE'] },
  { type: 'CANE', style: 'MAGIC', classes: ['CLERIC'], mode: 'MAGIC', names: ['순례자의 백은 케인', '성가의 수정 케인', '여명심판의 성장'], elements: ['HOLY', 'HOLY', 'HOLY'] },
  { type: 'KNUCKLE', style: 'DUAL_WIELD', classes: ['WARRIOR', 'ROGUE'], mode: 'PHYSICAL', names: ['가죽 감은 철권', '진동파쇄 너클', '용맥격투갑'] },
  { type: 'MAGIC_ORB', style: 'MAGIC', classes: ['MAGE'], mode: 'MAGIC', names: ['유리 마력구', '뇌운 쌍성구', '심성천구'], elements: ['ARCANE', 'LIGHTNING', 'PSYCHIC'] },
  { type: 'CATALYST', style: 'MAGIC', classes: ['MAGE', 'CLERIC'], mode: 'MAGIC', names: ['붉은 초석 촉매', '빙정 연산촉매', '근원점 촉매'], elements: ['FIRE', 'ICE', 'ARCANE'] },
  { type: 'CHAKRAM', style: 'DUAL_WIELD', classes: ['DANCER'], mode: 'HYBRID', names: ['유랑무희 차크람', '풍화륜', '성환무륜'], elements: ['NEUTRAL', 'LIGHTNING', 'ARCANE'] },
  { type: 'THOUGHT', style: 'MAGIC', classes: ['DANCER', 'MAGE'], mode: 'MAGIC', names: ['잔향 사념석', '몽경 사념결정', '무저심상핵'], elements: ['PSYCHIC', 'PSYCHIC', 'DARK'] },
  { type: 'EXECUTION_BLADE', style: 'TWO_HANDED', classes: ['ROGUE', 'WARRIOR'], mode: 'PHYSICAL', names: ['형집행 철도', '붉은 판결도', '종언처형도'] },
  { type: 'FAN', style: 'MAGIC', classes: ['DANCER'], mode: 'HYBRID', names: ['비단 접부채', '설화 철선', '천궁성선'], elements: ['NEUTRAL', 'ICE', 'ARCANE'] },
];

const WEAPON_TIERS = [2, 6, 10] as const;

function weaponBaseStats(family: WeaponFamily, tier: number): EquipmentDefinition['baseStats'] {
  const twoHanded = family.style === 'TWO_HANDED';
  const fast = ['DAGGER', 'KNUCKLE', 'CHAKRAM', 'FAN'].includes(family.type);
  const precision = ['BOW', 'CROSSBOW', 'SPEAR'].includes(family.type);
  const physical = family.mode !== 'MAGIC' ? Math.round((9 + tier * 4.2) * (twoHanded ? 1.18 : 1)) : undefined;
  const magic = family.mode !== 'PHYSICAL' ? Math.round((10 + tier * 4.4) * (family.mode === 'HYBRID' ? 0.72 : 1)) : undefined;
  return {
    physicalAttack: physical,
    magicAttack: magic,
    accuracy: precision ? 4 + tier : undefined,
    criticalChance: fast ? 2 + Math.floor(tier / 2) : undefined,
    criticalDamage: family.type === 'BOW' || family.type === 'EXECUTION_BLADE' ? Number((0.05 + tier * 0.015).toFixed(2)) : undefined,
    actionSpeed: fast ? 2 + Math.floor(tier / 3) : twoHanded ? -Math.max(1, Math.floor(tier / 4)) : undefined,
    physicalPenetration: family.mode !== 'MAGIC' && (twoHanded || precision) ? 3 + tier : undefined,
    magicPenetration: family.mode !== 'PHYSICAL' ? 2 + tier : undefined,
    elementalPenetration: family.mode !== 'PHYSICAL' ? 1 + Math.floor(tier / 2) : undefined,
    maxCost: family.mode !== 'PHYSICAL' ? Math.floor(tier / 4) : undefined,
  };
}

function createStandaloneWeapons(): EquipmentDefinition[] {
  const result: EquipmentDefinition[] = [];
  for (const family of WEAPON_FAMILIES) {
    WEAPON_TIERS.forEach((tier, index) => {
      const grade: EquipmentGrade = index === 0 ? 'NORMAL' : 'ELITE';
      const quality: EquipmentQuality = index === 0 ? 'NORMAL' : index === 1 ? 'GOOD' : 'EXCELLENT';
      const element = family.elements?.[index] ?? 'NEUTRAL';
      const id = `weapon_${family.type.toLowerCase()}_${tier}_${index + 1}`;
      const isMagic = family.mode !== 'PHYSICAL';
      result.push({
        id,
        name: family.names[index],
        slot: 'MAIN_HAND',
        equipmentType: 'WEAPON',
        rarity: rarityForGrade(grade, tier),
        grade,
        tier,
        quality,
        requiredLevel: tier * 5,
        weaponType: family.type,
        weaponStyle: family.style,
        isTwoHanded: family.style === 'TWO_HANDED',
        recommendedClasses: family.classes,
        baseStats: weaponBaseStats(family, tier),
        statModifiers: family.mode === 'MAGIC' ? { intelligence: Math.max(1, Math.floor(tier / 3)) } : fastFamilyStat(family.type, tier),
        elementDamageBonuses: element === 'NEUTRAL' ? undefined : { [element]: 3 + tier },
        magicWeapon: isMagic ? {
          spellCapacity: 1 + Math.floor(tier / 3),
          availableSpellIds: [],
          magicTags: element === 'NEUTRAL' ? ['ARCANE'] : [element],
          spellPowerMultiplier: Number((1 + tier * 0.025).toFixed(2)),
        } : undefined,
        acquisition: { methods: grade === 'NORMAL' ? ['CRAFT', 'LOOT'] : ['LOOT', 'CRAFT'] },
        tags: ['STANDALONE', family.type, `TIER_${tier}`],
        description: `${family.names[index]}은(는) T${tier} 전투 장비로, ${family.classes.join('/')} 계열의 전투 흐름에 맞춰 설계되었다.`,
        flavorText: `사용 흔적마다 서로 다른 전투의 궤적이 얕게 남아 있다.`,
        combatDescription: `${family.type} 특유의 움직임을 살려 빈틈을 파고든다.`,
        sellPrice: Math.round(38 * tier * (grade === 'ELITE' ? 1.7 : 1)),
      });
    });
  }
  return result;
}

function fastFamilyStat(type: WeaponType, tier: number): EquipmentDefinition['statModifiers'] {
  if (['DAGGER', 'BOW', 'CROSSBOW', 'CHAKRAM', 'FAN'].includes(type)) return { agility: Math.max(1, Math.floor(tier / 3)) };
  if (type === 'THOUGHT') return { luck: Math.max(1, Math.floor(tier / 3)) };
  return { strength: Math.max(1, Math.floor(tier / 3)) };
}

interface OffhandFamily {
  type: WeaponType;
  classes: CombatClassType[];
  names: [string, string, string];
}

const OFFHAND_FAMILIES: OffhandFamily[] = [
  { type: 'SHIELD', classes: ['WARRIOR'], names: ['둥근 철방패', '수문장의 각방패', '불락성 방벽'] },
  { type: 'AMULET', classes: ['CLERIC', 'WARRIOR'], names: ['은실 수호부', '성역의 아뮬렛', '왕권수호 인장'] },
  { type: 'CATALYST', classes: ['MAGE', 'CLERIC'], names: ['청수정 보조촉매', '쌍극 연산촉매', '무한식 보조핵'] },
  { type: 'DAGGER', classes: ['ROGUE'], names: ['역수 보조단도', '독니 보조검', '그림자쌍의 반검'] },
];

function createOffhands(): EquipmentDefinition[] {
  const tiers = [3, 7, 11];
  const result: EquipmentDefinition[] = [];
  for (const family of OFFHAND_FAMILIES) {
    tiers.forEach((tier, index) => {
      const grade: EquipmentGrade = index === 0 ? 'NORMAL' : index === 2 ? 'LEGENDARY' : 'ELITE';
      const id = `offhand_${family.type.toLowerCase()}_${tier}_${index + 1}`;
      const isShield = family.type === 'SHIELD';
      const isDagger = family.type === 'DAGGER';
      result.push({
        id,
        name: family.names[index],
        slot: 'OFF_HAND',
        equipmentType: 'OFFHAND',
        rarity: rarityForGrade(grade, tier),
        grade,
        tier,
        quality: index === 0 ? 'NORMAL' : index === 1 ? 'GOOD' : 'MASTERWORK',
        requiredLevel: tier * 5,
        weaponType: family.type,
        weaponStyle: isDagger ? 'DUAL_WIELD' : family.type === 'CATALYST' || family.type === 'AMULET' ? 'MAGIC' : 'ONE_HANDED',
        recommendedClasses: family.classes,
        baseStats: isShield ? {
          physicalDefense: 6 + tier * 2,
          magicDefense: 3 + tier,
          tenacity: 3 + tier,
        } : isDagger ? {
          physicalAttack: 5 + tier * 2,
          criticalChance: 2 + Math.floor(tier / 2),
          actionSpeed: 1 + Math.floor(tier / 4),
        } : family.type === 'CATALYST' ? {
          magicAttack: 5 + tier * 2,
          magicPenetration: 3 + tier,
          elementalPenetration: 2 + Math.floor(tier / 2),
          maxCost: 1 + Math.floor(tier / 4),
        } : {
          magicDefense: 5 + tier * 2,
          statusResistance: 3 + tier,
          maxCost: 1 + Math.floor(tier / 4),
        },
        acquisition: { methods: grade === 'LEGENDARY' ? ['LOOT', 'QUEST'] : ['CRAFT', 'LOOT'] },
        tags: ['STANDALONE', 'OFFHAND', `TIER_${tier}`],
        description: `${family.names[index]}은(는) 주무기의 빈틈을 보완하는 T${tier} 보조장비다.`,
        sellPrice: Math.round(32 * tier * (grade === 'LEGENDARY' ? 2.4 : grade === 'ELITE' ? 1.6 : 1)),
      });
    });
  }
  return result;
}

const ACCESSORY_SLOTS: EquipmentSlot[] = ['RING_1', 'RING_2', 'NECKLACE', 'BRACELET', 'EARRING', 'CLOAK'];
const ACCESSORY_SUFFIX: Partial<Record<EquipmentSlot, string>> = {
  RING_1: '각인 반지', RING_2: '서약 반지', NECKLACE: '목걸이', BRACELET: '팔찌', EARRING: '귀걸이', CLOAK: '망토',
};
const ACCESSORY_THEMES = [
  { id: 'lifeline', prefix: '생명맥', tier: 2, grade: 'NORMAL' as EquipmentGrade, quality: 'NORMAL' as EquipmentQuality, element: 'NEUTRAL' as CombatElement },
  { id: 'gale', prefix: '질풍', tier: 4, grade: 'NORMAL' as EquipmentGrade, quality: 'GOOD' as EquipmentQuality, element: 'LIGHTNING' as CombatElement },
  { id: 'sage_moon', prefix: '현월', tier: 6, grade: 'ELITE' as EquipmentGrade, quality: 'GOOD' as EquipmentQuality, element: 'ICE' as CombatElement },
  { id: 'executioner', prefix: '처형자', tier: 8, grade: 'ELITE' as EquipmentGrade, quality: 'EXCELLENT' as EquipmentQuality, element: 'DARK' as CombatElement },
  { id: 'nebula', prefix: '성운', tier: 11, grade: 'LEGENDARY' as EquipmentGrade, quality: 'MASTERWORK' as EquipmentQuality, element: 'ARCANE' as CombatElement },
];

const ACCESSORY_MECHANIC_TRAITS: Record<string, string[]> = {
  lifeline: ['EQ_GUARD_UNUSED_POWER','EQ_SELF_HEAL_SHARE','EQ_HEAVY_CROWN','EQ_GUARD_UNUSED_POWER','EQ_SELF_HEAL_SHARE','EQ_LAST_STAR'],
  gale: ['EQ_EVADE_HASTE','EQ_OVERTAKE_CRIT','EQ_SECOND_PLACE_PREDATOR','EQ_EVADE_HASTE','EQ_MISS_FOCUS','EQ_LAST_STAR'],
  sage_moon: ['EQ_FROZEN_SECOND_HAND','EQ_EXACT10_COOLDOWN','EQ_SPLIT_PRISM','EQ_FROZEN_SECOND_HAND','EQ_SELF_HEAL_SHARE','EQ_LAST_STAR'],
  executioner: ['EQ_LOW_COST_POWER','EQ_MISS_FOCUS','EQ_SECOND_PLACE_PREDATOR','EQ_OVERTAKE_CRIT','EQ_MISS_FOCUS','EQ_GUARD_UNUSED_POWER'],
  nebula: ['EQ_SPLIT_PRISM','EQ_OVERFLOW_CHALICE','EQ_EXACT10_COOLDOWN','EQ_LAST_STAR','EQ_SPLIT_PRISM','EQ_BLOOD_ENGINE'],
};

function createAccessories(): EquipmentDefinition[] {
  const result: EquipmentDefinition[] = [];
  for (const theme of ACCESSORY_THEMES) {
    ACCESSORY_SLOTS.forEach((slot, slotIndex) => {
      const t = theme.tier;
      const baseStats: EquipmentDefinition['baseStats'] = {};
      const statModifiers: EquipmentDefinition['statModifiers'] = {};
      if (theme.id === 'lifeline') {
        baseStats.maxHp = 25 + t * 12 + slotIndex * 3;
        baseStats.statusResistance = 2 + t;
        statModifiers.vitality = 1 + Math.floor(t / 4);
      } else if (theme.id === 'gale') {
        baseStats.actionSpeed = 2 + Math.floor(t / 2);
        baseStats.evasion = 2 + Math.floor(t / 2);
        baseStats.criticalChance = slotIndex % 2 === 0 ? 2 : 1;
        statModifiers.agility = 1 + Math.floor(t / 4);
      } else if (theme.id === 'sage_moon') {
        baseStats.magicDefense = 4 + t;
        baseStats.maxCost = 1 + Math.floor(t / 3);
        baseStats.magicAttack = slot === 'RING_1' || slot === 'RING_2' ? 3 + t : undefined;
        statModifiers.spirit = slotIndex % 2 === 0 ? 2 : undefined;
        statModifiers.intelligence = slotIndex % 2 === 1 ? 2 : undefined;
      } else if (theme.id === 'executioner') {
        baseStats.criticalChance = 3 + Math.floor(t / 2);
        baseStats.criticalDamage = Number((0.05 + t * 0.012).toFixed(2));
        baseStats.physicalPenetration = 3 + t;
        statModifiers.luck = 2 + Math.floor(t / 4);
      } else {
        baseStats.magicAttack = 5 + t;
        baseStats.elementalPenetration = 3 + Math.floor(t / 2);
        baseStats.maxCost = 2 + Math.floor(t / 3);
        baseStats.costRegen = slot === 'NECKLACE' ? 1 : undefined;
        statModifiers.intelligence = 2 + Math.floor(t / 4);
      }
      result.push({
        id: `accessory_${theme.id}_${slot.toLowerCase()}`,
        name: `${theme.prefix} ${ACCESSORY_SUFFIX[slot]}`,
        slot,
        equipmentType: 'ACCESSORY',
        rarity: rarityForGrade(theme.grade, t),
        grade: theme.grade,
        tier: t,
        quality: theme.quality,
        requiredLevel: t * 5,
        baseStats,
        statModifiers,
        elementResistances: theme.element === 'NEUTRAL' ? undefined : { [theme.element]: 3 + t },
        elementDamageBonuses: theme.id === 'nebula' ? { ARCANE: 4 + t } : undefined,
        specialEffectIds: [ACCESSORY_MECHANIC_TRAITS[theme.id]?.[slotIndex]].filter((x): x is string => !!x),
        effectDescription: `이 장신구는 단순 능력치 외에도 ${ACCESSORY_MECHANIC_TRAITS[theme.id]?.[slotIndex] || '조건부'} 전투 메커니즘을 활성화한다.`,
        acquisition: { methods: theme.grade === 'LEGENDARY' ? ['LOOT', 'QUEST'] : ['CRAFT', 'LOOT'] },
        tags: ['STANDALONE', 'ACCESSORY', theme.id, `TIER_${t}`],
        description: `${theme.prefix} 계열의 마력 가공법으로 제작된 T${t} ${ACCESSORY_SUFFIX[slot]}.`,
        flavorText: `작은 장식 안쪽에 제작자의 표식과 짧은 축원이 새겨져 있다.`,
        sellPrice: Math.round(30 * t * (theme.grade === 'LEGENDARY' ? 2.5 : theme.grade === 'ELITE' ? 1.6 : 1)),
      });
    });
  }
  return result;
}

const ARMOR_THEMES = [
  { id: 'pilgrim', prefix: '순례자', tier: 2, grade: 'NORMAL' as EquipmentGrade, quality: 'NORMAL' as EquipmentQuality, slot: 'HEAD' as EquipmentSlot },
  { id: 'red_mercenary', prefix: '붉은 용병', tier: 5, grade: 'NORMAL' as EquipmentGrade, quality: 'GOOD' as EquipmentQuality, slot: 'CHEST' as EquipmentSlot },
  { id: 'glass_fortress', prefix: '유리성', tier: 8, grade: 'ELITE' as EquipmentGrade, quality: 'EXCELLENT' as EquipmentQuality, slot: 'GLOVES' as EquipmentSlot },
  { id: 'royal_tomb', prefix: '왕묘 수호자', tier: 11, grade: 'LEGENDARY' as EquipmentGrade, quality: 'MASTERWORK' as EquipmentQuality, slot: 'BOOTS' as EquipmentSlot },
];
const ARMOR_VARIANTS: Array<{ armorType: ArmorType; label: string; classes: CombatClassType[] }> = [
  { armorType: 'HEAVY', label: '중갑', classes: ['WARRIOR'] },
  { armorType: 'LIGHT', label: '경갑', classes: ['ARCHER', 'ROGUE'] },
  { armorType: 'CLOTH', label: '전투복', classes: ['MAGE', 'CLERIC', 'DANCER'] },
];

function createStandaloneArmor(): EquipmentDefinition[] {
  const result: EquipmentDefinition[] = [];
  for (const theme of ARMOR_THEMES) {
    for (const variant of ARMOR_VARIANTS) {
      const t = theme.tier;
      const heavy = variant.armorType === 'HEAVY';
      const light = variant.armorType === 'LIGHT';
      const id = `armor_${theme.id}_${variant.armorType.toLowerCase()}`;
      result.push({
        id,
        name: `${theme.prefix}의 ${variant.label}`,
        slot: theme.slot,
        equipmentType: 'ARMOR',
        armorType: variant.armorType,
        rarity: rarityForGrade(theme.grade, t),
        grade: theme.grade,
        tier: t,
        quality: theme.quality,
        requiredLevel: t * 5,
        recommendedClasses: variant.classes,
        baseStats: heavy ? {
          physicalDefense: 8 + t * 2,
          magicDefense: 3 + t,
          maxHp: 25 + t * 10,
          tenacity: 3 + t,
        } : light ? {
          physicalDefense: 5 + Math.round(t * 1.4),
          magicDefense: 4 + t,
          evasion: 2 + Math.floor(t / 2),
          actionSpeed: 1 + Math.floor(t / 3),
        } : {
          physicalDefense: 3 + t,
          magicDefense: 7 + Math.round(t * 1.6),
          maxCost: 1 + Math.floor(t / 4),
          statusResistance: 3 + t,
        },
        statModifiers: heavy ? { vitality: 1 + Math.floor(t / 4) } : light ? { agility: 1 + Math.floor(t / 4) } : { spirit: 1 + Math.floor(t / 4) },
        acquisition: { methods: theme.grade === 'LEGENDARY' ? ['LOOT', 'QUEST'] : ['CRAFT', 'LOOT'] },
        tags: ['STANDALONE', 'ARMOR', variant.armorType, `TIER_${t}`],
        description: `${theme.prefix} 계통에서 사용하던 T${t} ${variant.label}. 세트에 얽매이지 않고 한 부위만으로 역할을 보완한다.`,
        sellPrice: Math.round(34 * t * (theme.grade === 'LEGENDARY' ? 2.5 : theme.grade === 'ELITE' ? 1.6 : 1)),
      });
    }
  }
  return result;
}

const GENERATED_SET_PIECES = SET_THEMES.flatMap((theme) => SET_PIECE_SLOTS.map((slot) => createSetPiece(theme, slot)));
const GENERATED_STANDALONE = [
  ...createStandaloneWeapons(),
  ...createOffhands(),
  ...createAccessories(),
  ...createStandaloneArmor(),
];

function compactNumericRecord<T extends Record<string, number | undefined> | undefined>(record: T): T {
  if (!record) return record;
  return Object.fromEntries(Object.entries(record).filter(([, value]) => typeof value === 'number' && value !== 0)) as T;
}

function sanitizeEquipmentDefinition(item: EquipmentDefinition): EquipmentDefinition {
  return {
    ...item,
    baseStats: compactNumericRecord(item.baseStats),
    statModifiers: compactNumericRecord(item.statModifiers),
  };
}

export const GENERATED_EQUIPMENT_LIST: EquipmentDefinition[] = [
  ...GENERATED_SET_PIECES,
  ...GENERATED_STANDALONE,
].map(sanitizeEquipmentDefinition);

export const GENERATED_EQUIPMENT_DATABASE: Record<string, EquipmentDefinition> = Object.fromEntries(
  GENERATED_EQUIPMENT_LIST.map((item) => [item.id, item])
);

// Existing database contains 31 hand-authored items. 219 generated items bring the catalog to exactly 250.
export const GENERATED_EQUIPMENT_COUNT = GENERATED_EQUIPMENT_LIST.length;
