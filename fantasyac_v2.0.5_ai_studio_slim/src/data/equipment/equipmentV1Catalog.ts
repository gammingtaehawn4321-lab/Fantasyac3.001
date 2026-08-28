import type { CombatClassType } from '../classes';
import type { CombatElement } from '../../combat/combatTypes';
import type { EquipmentDefinition, EquipmentGrade, EquipmentQuality, EquipmentSlot, WeaponType, WeaponStyle } from './equipmentTypes';

const accessorySlots: EquipmentSlot[] = ['RING_1','RING_2','NECKLACE','BRACELET','EARRING','CLOAK'];
const allSkills = [
  'basic_attack','defend_stance','first_aid','throw_sand','human_resolve','elf_mana_bolt','beast_feral_claws',
  'warrior_heavy_strike','warrior_shield_bash','warrior_iron_wall','warrior_whirlwind',
  'archer_precision_shot','archer_poison_arrow','archer_evasive_shot','archer_arrow_rain',
  'rogue_ambush','rogue_shadow_strike','rogue_smoke_bomb','rogue_vital_point',
  'cleric_divine_heal','cleric_holy_smite','cleric_sacred_shield','cleric_divine_retribution',
  'mage_firebolt','mage_magic_missile','mage_arcane_burst','mage_frost_nova','mage_chain_lightning',
  'dancer_chakram_slash','dancer_alluring_step','dancer_spinning_dance',
  'succubus_seduction','succubus_soul_drain','succubus_mind_blast',
  'bladedancer_flurry','bladedancer_execution','bladedancer_crescent_step',
  'dancer_fan_waltz','dancer_passion_dance','dancer_captivating_veil',
] as const;

const skillKorean: Record<string,string> = {
  basic_attack:'기본 공격', defend_stance:'방어 태세', first_aid:'응급 처치', throw_sand:'모래 뿌리기', human_resolve:'불굴의 투지', elf_mana_bolt:'마력 탄환', beast_feral_claws:'야성의 발톱',
  warrior_heavy_strike:'강타', warrior_shield_bash:'방패 가격', warrior_iron_wall:'철벽의 요새', warrior_whirlwind:'회전 베기',
  archer_precision_shot:'정밀 사격', archer_poison_arrow:'맹독 화살', archer_evasive_shot:'후퇴 도약 사격', archer_arrow_rain:'화살비',
  rogue_ambush:'기습 일격', rogue_shadow_strike:'그림자 일격', rogue_smoke_bomb:'연막탄', rogue_vital_point:'급소 파괴',
  cleric_divine_heal:'신성 치유', cleric_holy_smite:'성스러운 강타', cleric_sacred_shield:'신성 방벽', cleric_divine_retribution:'신벌',
  mage_firebolt:'화염탄', mage_magic_missile:'마력 유도탄', mage_arcane_burst:'비전 폭발', mage_frost_nova:'서리 폭발', mage_chain_lightning:'연쇄 번개',
  dancer_chakram_slash:'차크람 베기', dancer_alluring_step:'매혹의 스텝', dancer_spinning_dance:'회전무',
  succubus_seduction:'유혹', succubus_soul_drain:'영혼 흡수', succubus_mind_blast:'정신 파동',
  bladedancer_flurry:'난무', bladedancer_execution:'처형무', bladedancer_crescent_step:'초승달 비보', dancer_fan_waltz:'부채의 왈츠', dancer_passion_dance:'정열의 칸타빌레', dancer_captivating_veil:'환혹의 장막',
};

const mutationTrait: Partial<Record<typeof allSkills[number], string>> = {
  mage_firebolt:'MUT_FIREBOLT_REFLUX', archer_precision_shot:'MUT_PRECISION_SILENT', archer_arrow_rain:'MUT_ARROW_RAIN_FOCUS',
  warrior_whirlwind:'MUT_WHIRLWIND_VORTEX', first_aid:'MUT_FIRST_AID_FIELD', cleric_divine_heal:'MUT_DIVINE_HEAL_STIGMATA',
};

function gradeForTier(t:number): EquipmentGrade { return t >= 10 ? 'LEGENDARY' : t >= 5 ? 'ELITE' : 'NORMAL'; }
function rarityForGrade(g:EquipmentGrade): EquipmentDefinition['rarity'] { return g==='LEGENDARY'?'LEGENDARY':g==='ELITE'?'EPIC':'UNCOMMON'; }
function qualityForTier(t:number): EquipmentQuality { return t>=11?'MASTERWORK':t>=8?'EXCELLENT':t>=5?'GOOD':'NORMAL'; }

function skillClass(skill:string): CombatClassType[] | undefined {
  if (skill.startsWith('warrior_')) return ['WARRIOR']; if (skill.startsWith('archer_')) return ['ARCHER']; if (skill.startsWith('rogue_')) return ['ROGUE'];
  if (skill.startsWith('cleric_')) return ['CLERIC']; if (skill.startsWith('mage_')) return ['MAGE']; if (skill.startsWith('dancer_') || skill.startsWith('bladedancer_')) return ['DANCER'];
  return undefined;
}
function isDamageSkill(skill:string){ return !['defend_stance','first_aid','human_resolve','warrior_iron_wall','rogue_smoke_bomb','cleric_divine_heal','cleric_sacred_shield','dancer_alluring_step','bladedancer_crescent_step','dancer_passion_dance','dancer_captivating_veil'].includes(skill); }

function createSkillEnhancers(): EquipmentDefinition[] {
  return allSkills.map((skill,index)=>{
    const tier = 4 + (index % 9); const grade=gradeForTier(tier); const slot=accessorySlots[index%accessorySlots.length];
    const mut=mutationTrait[skill]; const damage=isDamageSkill(skill);
    const specialEffectIds = mut ? [mut] : [];
    const names = ['각인','잔향','초점','비결','편린','증폭'];
    return {
      id:`v1_skill_${skill}`, name:`${skillKorean[skill]}의 ${names[index%names.length]}`, slot, equipmentType:'ACCESSORY', rarity:rarityForGrade(grade), grade, tier, quality:qualityForTier(tier), requiredLevel:tier*5,
      recommendedClasses:skillClass(skill), baseStats:{ accuracy: damage ? 2+Math.floor(tier/3):undefined, maxCost: !damage?1:undefined, actionSpeed:index%4===0?1+Math.floor(tier/5):undefined },
      skillModifiers:[{skillId:skill, damageMultiplierBonus:damage?Number((0.08+tier*0.008).toFixed(2)):undefined, cooldownReduction:index%3===0?1:undefined, costReduction:index%4===0?2:undefined, description:`${skillKorean[skill]} 전용 조율`}],
      specialEffectIds,
      tags:['V1','SKILL_ENHANCER',skill],
      description:`특정 기술 『${skillKorean[skill]}』의 구조를 조율하는 전용 장신구.`,
      effectDescription: mut ? `『${skillKorean[skill]}』의 작동 방식 자체를 변이시킨다. 기본 수치 강화와 함께 특수 변이가 적용된다.` : `『${skillKorean[skill]}』의 위력·COST·쿨타임 중 일부를 직접 강화한다.`,
      sellPrice:Math.round(tier*95*(grade==='LEGENDARY'?2.2:1.4)),
    };
  });
}

const mechThemes = [
  ['empty_cup','빈 잔','EQ_LOW_COST_POWER','COST 5 이하일 때 공격 피해 +20%.'],
  ['overflow_chalice','넘치는 성배','EQ_OVERFLOW_CHALICE','COST가 최대일 때 공격 피해 +28%. 공격 후 남은 COST를 모두 비운다.'],
  ['rotating_mana_ring','회전하는 마력환','EQ_EXACT10_COOLDOWN','기본 COST가 정확히 10인 스킬은 쿨타임 -1.'],
  ['blood_engine','폭주의 심장','EQ_BLOOD_ENGINE','모든 Action Delay -20%, 행동 시작마다 HP 2%를 소모하고 COST +2.'],
  ['heavy_crown','무거운 왕관','EQ_HEAVY_CROWN','받는 피해 -20%. 대신 행동 속도가 크게 감소한다.'],
  ['missed_cartridge','빗나간 탄피','EQ_MISS_FOCUS','공격 MISS 시 다음 공격 명중 +30, 치명타 +15%.'],
  ['broken_shield','깨진 방패 조각','EQ_GUARD_UNUSED_POWER','방어 후 다음 자신의 행동까지 공격받지 않으면 다음 공격 피해 +25%.'],
  ['split_prism','분광 수정','EQ_SPLIT_PRISM','단일 마법 피해 -30%, 대신 다른 적 최대 2명에게 40% 분산 피해.'],
  ['autocrat_seal','독선자의 인장','EQ_AUTOCRAT_SEAL','아군 전체 지원 스킬을 단일 대상으로 바꾸는 대신 핵심 버프 효과가 2배.'],
  ['mercy_cup','자애의 잔','EQ_SELF_HEAL_SHARE','자신 전용 응급 처치를 아군에게도 사용할 수 있다.'],
  ['frozen_second_hand','얼어붙은 초침','EQ_FROZEN_SECOND_HAND','냉기 공격 적중 시 대상 행동 게이지 -220.'],
  ['second_place_ring','두 번째 자리의 반지','EQ_SECOND_PLACE_PREDATOR','Timeline에서 바로 앞 행동자가 적이면 공격 피해 +18%.'],
  ['last_star','마지막 별의 브로치','EQ_LAST_STAR','Timeline의 가장 뒤에 있을 때 COST +5, 다음 Action Delay -40%.'],
  ['overtaker_anklet','추월자의 발찌','EQ_OVERTAKE_CRIT','행동 후 적을 Timeline에서 추월하면 다음 공격 치명타 피해가 증가한다.'],
  ['evader_feather','회피자의 깃','EQ_EVADE_HASTE','회피 성공 시 행동 게이지 +250.'],
] as const;

function createMechanicAccessories(): EquipmentDefinition[] {
  const result:EquipmentDefinition[]=[];
  mechThemes.forEach((theme,i)=>{
    for(let variant=0;variant<2;variant++){
      const tier=variant===0?7:11; const grade=gradeForTier(tier); const slot=accessorySlots[(i*2+variant)%accessorySlots.length];
      const id=`v1_mech_${theme[0]}_${variant}`;
      result.push({id,name:variant===0?theme[1]:`${theme[1]} · 개량형`,slot,equipmentType:'ACCESSORY',rarity:rarityForGrade(grade),grade,tier,quality:qualityForTier(tier),requiredLevel:tier*5,
        baseStats:{actionSpeed:theme[0]==='heavy_crown'?-Math.round(4+tier/2):undefined,maxCost:theme[0]==='heavy_crown'?5:undefined,accuracy:theme[0]==='missed_cartridge'?6:undefined,evasion:theme[0]==='evader_feather'?5:undefined},
        specialEffectIds:[theme[2]], tags:['V1','MECHANIC',theme[0]], description:`전투 규칙을 직접 비트는 특수 장비.`, effectDescription:theme[3], sellPrice:tier*160});
    }
  });
  return result;
}

const pairComponents:Array<[string,string,EquipmentSlot,string,Partial<EquipmentDefinition['baseStats']>]> = [
  ['sun_ring','태양의 반지','RING_1','HOLY', {criticalChance:5}], ['eclipse_necklace','월식의 목걸이','NECKLACE','DARK',{magicAttack:12}],
  ['broken_compass','부서진 나침반 귀걸이','EARRING','NEUTRAL',{actionSpeed:5}], ['last_route','마지막 항로 팔찌','BRACELET','NEUTRAL',{maxCost:3}],
  ['frost_moon','서리달의 반지','RING_2','ICE',{elementalPenetration:8}], ['frozen_gear','빙결 톱니 목걸이','NECKLACE','ICE',{magicAttack:10}],
  ['silent_arrowhead','무음의 화살촉 귀걸이','EARRING','NEUTRAL',{accuracy:10}], ['missed_record','빗나감 기록 팔찌','BRACELET','NEUTRAL',{criticalChance:6}],
  ['resonance_ring','공명의 고리','RING_1','ARCANE',{maxCost:3}], ['resonance_earring','쌍환의 귀걸이','EARRING','ARCANE',{costRegen:1}],
  ['blood_core','붉은 심장핵 목걸이','NECKLACE','DARK',{physicalAttack:10,magicAttack:10}], ['black_crown','검은 왕관편 망토','CLOAK','DARK',{physicalDefense:9,magicDefense:9}],
  ['prism_lens','분광 렌즈 귀걸이','EARRING','ARCANE',{elementalPenetration:9}], ['infinite_catalyst','무한식 촉매 팔찌','BRACELET','ARCANE',{magicAttack:13}],
  ['left_bell','왼발의 은방울','BRACELET','NEUTRAL',{actionSpeed:6}], ['right_bell','오른발의 금방울','EARRING','NEUTRAL',{evasion:6}],
  ['white_scar','백야의 성흔 반지','RING_1','HOLY',{magicAttack:11}], ['black_scar','흑일의 성흔 반지','RING_2','DARK',{magicAttack:11}],
  ['hunter_clock','사냥꾼의 초침 목걸이','NECKLACE','NEUTRAL',{accuracy:9}], ['predator_eye','포식자의 눈 귀걸이','EARRING','NEUTRAL',{criticalChance:7}],
];
function createPairComponents():EquipmentDefinition[]{return pairComponents.map((x,i)=>{const tier=9+(i%4);const grade:EquipmentGrade='LEGENDARY';const element=x[3] as CombatElement;return {id:`v1_pair_${x[0]}`,name:x[1],slot:x[2],equipmentType:'ACCESSORY',rarity:'LEGENDARY',grade,tier,quality:'MASTERWORK',requiredLevel:tier*5,baseStats:x[4]||{},elementDamageBonuses:element==='NEUTRAL'?undefined:{[element]:6+tier},tags:['V1','SYNERGY_COMPONENT'],description:'혼자서도 강하지만 특정 짝 장비와 함께할 때 숨겨진 공명이 열린다.',effectDescription:'숨은 장비 상호작용의 구성품.',sellPrice:tier*220};});}

const classWeapon:Array<{cls:CombatClassType;type:WeaponType;style:WeaponStyle;prefix:string;mode:'PHYSICAL'|'MAGIC'|'HYBRID';element:CombatElement}>=[
  {cls:'WARRIOR',type:'GREATSWORD',style:'TWO_HANDED',prefix:'파성',mode:'PHYSICAL',element:'NEUTRAL'}, {cls:'ARCHER',type:'BOW',style:'TWO_HANDED',prefix:'천궁',mode:'PHYSICAL',element:'LIGHTNING'},
  {cls:'ROGUE',type:'DAGGER',style:'DUAL_WIELD',prefix:'무흔',mode:'PHYSICAL',element:'DARK'}, {cls:'CLERIC',type:'CANE',style:'MAGIC',prefix:'성좌',mode:'MAGIC',element:'HOLY'},
  {cls:'DANCER',type:'FAN',style:'MAGIC',prefix:'천무',mode:'HYBRID',element:'ARCANE'}, {cls:'MAGE',type:'STAFF',style:'MAGIC',prefix:'근원',mode:'MAGIC',element:'ARCANE'},
];
function createLegendaryWeapons():EquipmentDefinition[]{
  const out:EquipmentDefinition[]=[];
  const variantTrait=['EQ_OPENING_DOMINANCE','EQ_CRIT_MOMENTUM','EQ_HEAVY_TIMING','EQ_EXACT10_COOLDOWN','EQ_LOW_COST_POWER'] as const;
  const variantEffect=[
    'HP 85% 이상인 적을 공격할 때 피해 +18%, 명중 보정 +10.',
    '한 행동에서 처음 발생한 치명타가 행동 게이지 +120을 당긴다.',
    'Action Delay 1.20 이상의 공격은 피해 +16%와 대상 행동 게이지 -80을 얻는다.',
    '기본 COST가 정확히 10인 스킬의 쿨타임이 1 감소한다.',
    'COST 5 이하에서 공격 피해 +20%. 자원이 마를수록 종장이 강해진다.',
  ];
  classWeapon.forEach((f)=>{
    for(let v=0;v<5;v++){
      const tier=8+v; const id=`v1_legend_weapon_${f.cls.toLowerCase()}_${v}`; const fast=f.cls==='ROGUE'||f.cls==='DANCER';
      out.push({id,name:`${f.prefix}${['초식','잔광','극점','왕식','종장'][v]} ${f.type==='GREATSWORD'?'대검':f.type==='BOW'?'장궁':f.type==='DAGGER'?'쌍도':f.type==='CANE'?'성장':f.type==='FAN'?'철선':'마도장'}`,slot:'MAIN_HAND',equipmentType:'WEAPON',rarity:'LEGENDARY',grade:'LEGENDARY',tier,quality:v>=3?'MASTERWORK':'EXCELLENT',requiredLevel:tier*5,weaponType:f.type,weaponStyle:f.style,isTwoHanded:f.style==='TWO_HANDED',recommendedClasses:[f.cls],baseStats:{physicalAttack:f.mode!=='MAGIC'?Math.round(22+tier*4.5):undefined,magicAttack:f.mode!=='PHYSICAL'?Math.round(24+tier*4.8):undefined,accuracy:f.mode==='PHYSICAL'?6+tier:undefined,criticalChance:fast?5+Math.floor(tier/2):undefined,actionSpeed:fast?4: f.style==='TWO_HANDED'?-3:undefined,physicalPenetration:f.mode!=='MAGIC'?5+tier:undefined,magicPenetration:f.mode!=='PHYSICAL'?5+tier:undefined,maxCost:f.mode!=='PHYSICAL'?2+Math.floor(tier/4):undefined},elementDamageBonuses:f.element==='NEUTRAL'?undefined:{[f.element]:8+tier},specialEffectIds:[variantTrait[v]],tags:['V1','LEGENDARY_WEAPON',f.cls],description:'한 가지 전투 원칙을 끝까지 밀어붙인 레전더리 무기.',effectDescription:variantEffect[v],sellPrice:tier*260});
    }
  });
  return out;
}

const armorSlots:EquipmentSlot[]=['HEAD','CHEST','LEGS','GLOVES','BOOTS'];
function createV1Armor():EquipmentDefinition[]{const classes:CombatClassType[]=['WARRIOR','ARCHER','ROGUE','CLERIC','DANCER','MAGE'];const out:EquipmentDefinition[]=[];classes.forEach((cls,ci)=>{armorSlots.forEach((slot,si)=>{const tier=7+((ci+si)%6);const heavy=cls==='WARRIOR';const light=cls==='ARCHER'||cls==='ROGUE';const armorType=heavy?'HEAVY':light?'LIGHT':'CLOTH';const trait=si===0?'EQ_GUARD_UNUSED_POWER':si===1&&light?'EQ_EVADE_HASTE':si===2&&!light?'EQ_LAST_STAR':undefined;out.push({id:`v1_armor_${cls.toLowerCase()}_${slot.toLowerCase()}`,name:`${['경계','전환','잔향','파동','극점','유성'][ci]}의 ${slot==='HEAD'?'두건':slot==='CHEST'?'전투복':slot==='LEGS'?'각반':slot==='GLOVES'?'수갑':'장화'}`,slot,equipmentType:'ARMOR',armorType,rarity:tier>=10?'LEGENDARY':'EPIC',grade:tier>=10?'LEGENDARY':'ELITE',tier,quality:qualityForTier(tier),requiredLevel:tier*5,recommendedClasses:[cls],baseStats:heavy?{physicalDefense:12+tier*2,maxHp:40+tier*10,tenacity:5+tier}:light?{physicalDefense:7+tier,evasion:4+Math.floor(tier/2),actionSpeed:2+Math.floor(tier/4),accuracy:4+tier}:{magicDefense:11+tier*2,maxCost:2+Math.floor(tier/4),statusResistance:5+tier,magicAttack:slot==='GLOVES'?5+tier:undefined},specialEffectIds:trait?[trait]:[],tags:['V1','UTILITY_ARMOR',cls],description:'세트가 아니어도 특정 행동 루프를 보완하도록 설계된 단품 방어구.',effectDescription:trait?'조건부 전투 효과를 추가로 제공한다.':'높은 역할 특화 능력치를 제공한다.',sellPrice:tier*180});});});return out;}

export const V1_EQUIPMENT_LIST:EquipmentDefinition[]=[...createSkillEnhancers(),...createMechanicAccessories(),...createPairComponents(),...createLegendaryWeapons(),...createV1Armor()];
export const V1_EQUIPMENT_DATABASE:Record<string,EquipmentDefinition>=Object.fromEntries(V1_EQUIPMENT_LIST.map(x=>[x.id,x]));
export const V1_EQUIPMENT_COUNT=V1_EQUIPMENT_LIST.length;
