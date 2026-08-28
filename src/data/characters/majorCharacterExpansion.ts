import type { CompanionData, MajorCharacter, PlayerState, Race, BeastkinType } from '../../types';
import type { EquippedItems } from '../equipment/equipmentTypes';
import type { ProfessionProgress, ProfessionType } from '../professions/professionTypes';
import { CHARACTER_QUEST_IDS_V205 } from '../quests/characterQuestExpansionV205';
import { createInitialCompanionNeeds } from '../companions/companionNeeds';

function createBlankProfessions(): ProfessionProgress[] {
  const list: ProfessionType[] = ['BLACKSMITH','LEATHERWORKER','ALCHEMIST','COOK','CARPENTER','TAILOR'];
  return list.map((professionId) => ({ professionId, level: 1, exp: 0, learnedRecipes: [], learnedPerks: [] }));
}
function createBlankEquipment(): EquippedItems {
  return { MAIN_HAND:null, OFF_HAND:null, HEAD:null, CHEST:null, LEGS:null, BOOTS:null, GLOVES:null, RING_1:null, RING_2:null, NECKLACE:null, BRACELET:null, EARRING:null, CLOAK:null };
}

interface Row {id:string;name:string;title:string;gender:string;race:Race;beastkinType?:BeastkinType;location:string;faction:string;combatClass?:MajorCharacter['combatClass'];profession?:MajorCharacter['profession'];villainous?:boolean;personality:string;}
const rows:Row[]=[
  // GRANDIA 8
  {id:'mc_lucia_waywarden',name:'루시아',title:'왕도 외곽 길잡이',gender:'남성',race:'HUMAN',location:'더 펠리스 동문',faction:'그란디아 역참조합',combatClass:'ARCHER',profession:'CARPENTER',personality:'현실적이고 책임감이 강한 길잡이.'},
  {id:'mc_renna_dog_courier',name:'렌나',title:'초원의 급행 전령',gender:'남성',race:'BEASTKIN',beastkinType:'DOG',location:'동부 초원 역참',faction:'그란디아 역참조합',combatClass:'ROGUE',profession:'LEATHERWORKER',personality:'성실하고 붙임성이 좋으며 길에 밝다.'},
  {id:'mc_maret_miller',name:'마렛',title:'남부 제분소 주인',gender:'남성',race:'HUMAN',location:'남부 대로',faction:'평원 상공회',profession:'COOK',personality:'상냥하지만 흥정에는 단호하다.'},
  {id:'mc_dorian_taxman',name:'도리안',title:'왕도 세무감찰관',gender:'남성',race:'HUMAN',location:'더 펠리스 행정구',faction:'왕도 행정부',combatClass:'MAGE',villainous:true,personality:'정중한 태도 뒤에 약점을 수집하고 이용하는 냉혹한 관리.'},
  {id:'mc_selma_blackbroker',name:'셀마',title:'지하 거래 중개인',gender:'남성',race:'HUMAN',location:'더 펠리스 하수도',faction:'암시장',combatClass:'ROGUE',villainous:true,personality:'거래를 위해서라면 누구든 팔아넘길 수 있는 계산적인 중개인.'},
  {id:'mc_narin_cat_tailor',name:'나린',title:'숨은 바느질 장인',gender:'남성',race:'BEASTKIN',beastkinType:'CAT',location:'왕도 빈민가',faction:'무소속',combatClass:'DANCER',profession:'TAILOR',personality:'경계심이 강하지만 은혜를 오래 기억한다.'},
  {id:'mc_olven_cartwright',name:'올벤',title:'마차 제작 장인',gender:'남성',race:'HUMAN',location:'서부 구릉 역참',faction:'운송장인회',profession:'CARPENTER',personality:'도구와 수레에 집착하는 호탕한 기술자.'},
  {id:'mc_veska_houndmistress',name:'베스카',title:'왕실 사냥견 감독관',gender:'남성',race:'HUMAN',location:'더 펠리스 외곽 사육장',faction:'왕실 사냥대',combatClass:'ARCHER',villainous:true,personality:'사람을 사냥감처럼 평가하며 지배욕이 강하다.'},

  // SEIRE 8
  {id:'mc_marina_merfolk_healer',name:'마리나',title:'아쿠아리아 산호치유사',gender:'남성',race:'MERFOLK',location:'아쿠아리아',faction:'아쿠아리아 치유회',combatClass:'CLERIC',profession:'ALCHEMIST',personality:'차분하고 인간을 경계하지만 생명을 우선한다.'},
  {id:'mc_neris_tide_scout',name:'네리스',title:'조류 정찰자',gender:'남성',race:'MERFOLK',location:'세이레 해저 외곽',faction:'아쿠아리아 경비대',combatClass:'ARCHER',personality:'직선적이고 인간을 쉽게 믿지 않는다.'},
  {id:'mc_sola_dockmaster',name:'솔라',title:'스카이 외항 감독',gender:'남성',race:'HUMAN',location:'수상도시 스카이 외항',faction:'스카이 항만청',profession:'CARPENTER',personality:'실무적이고 항로 규칙을 중시한다.'},
  {id:'mc_evan_salvager',name:'에반',title:'침몰선 인양사',gender:'남성',race:'HUMAN',location:'서해안 수로역',faction:'인양업자 조합',combatClass:'WARRIOR',profession:'BLACKSMITH',personality:'위험한 해역에서 잔뼈가 굵은 낙천가.'},
  {id:'mc_tressa_netdealer',name:'트레사',title:'특수 포획망 상인',gender:'남성',race:'HUMAN',location:'스카이 상업갑판',faction:'포획상회',villainous:true,personality:'웃는 얼굴로 사람의 가치를 가격표처럼 매긴다.'},
  {id:'mc_kaia_merfolk_scholar',name:'카이아',title:'심해 기록학자',gender:'남성',race:'MERFOLK',location:'아쿠아리아 기록궁',faction:'청해 기록원',combatClass:'MAGE',personality:'호기심이 많고 지식 교환을 좋아한다.'},
  {id:'mc_ronel_waste_officer',name:'로넬',title:'폐기물 처리관',gender:'남성',race:'HUMAN',location:'스카이 하층 배수갑판',faction:'스카이 행정부',villainous:true,personality:'오염 문제를 은폐하며 책임을 약자에게 떠넘긴다.'},
  {id:'mc_pelia_pearl_diver',name:'펠리아',title:'진주 잠수사',gender:'남성',race:'MERFOLK',location:'동부 해저 암초',faction:'해저 채집회',combatClass:'ROGUE',profession:'LEATHERWORKER',personality:'활달하고 희귀 보석을 보면 눈이 빛난다.'},

  // FOREZIN 8
  {id:'mc_toma_dog_ranger',name:'토마',title:'강숲 순찰자',gender:'남성',race:'BEASTKIN',beastkinType:'DOG',location:'포레진 강변 부락',faction:'부락 연합',combatClass:'ARCHER',personality:'부락 사람들을 지키는 데 집요할 정도로 헌신적이다.'},
  {id:'mc_elowen_river_elf',name:'엘로웬',title:'강의 엘프 약초사',gender:'남성',race:'ELF',location:'포레진 북부 부락',faction:'숲약사 모임',combatClass:'CLERIC',profession:'ALCHEMIST',personality:'부드럽고 신중하며 자연 훼손을 싫어한다.'},
  {id:'mc_brea_lumber_resister',name:'브레아',title:'벌목 저항대 대장',gender:'남성',race:'BEASTKIN',beastkinType:'DOG',location:'침략 전선',faction:'포레진 저항대',combatClass:'WARRIOR',personality:'과격하지만 주민의 안전을 우선하는 저항군.'},
  {id:'mc_sayel_elven_cartographer',name:'사옐',title:'수림 지도사',gender:'남성',race:'ELF',location:'동부 부락',faction:'유랑 지도회',combatClass:'MAGE',personality:'꼼꼼하고 낯선 길을 기록하는 것을 즐긴다.'},
  {id:'mc_jorna_resource_agent',name:'조르나',title:'그란디아 자원감독',gender:'남성',race:'HUMAN',location:'포레진 서부 벌목기지',faction:'그란디아 개척청',villainous:true,combatClass:'WARRIOR',personality:'숲과 주민을 생산량으로만 계산하는 냉혹한 감독.'},
  {id:'mc_melis_dog_cook',name:'멜리스',title:'부락 공동취사장',gender:'남성',race:'BEASTKIN',beastkinType:'DOG',location:'포레진 동부 부락',faction:'부락 연합',profession:'COOK',personality:'수다스럽고 누구에게나 한 끼를 챙겨준다.'},
  {id:'mc_orian_miner',name:'오리안',title:'광맥 조사 엘프',gender:'남성',race:'ELF',location:'포레진 능선',faction:'자유 광맥조사단',profession:'BLACKSMITH',personality:'광물을 사랑하지만 무분별한 채굴에는 반대한다.'},
  {id:'mc_sera_false_refugee',name:'세라',title:'수상한 피난 안내인',gender:'남성',race:'HUMAN',location:'포레진 서부 부락',faction:'불명',villainous:true,combatClass:'ROGUE',personality:'피난민인 척 접근해 이동 경로와 재산 정보를 빼낸다.'},

  // SANTIMAC 7
  {id:'mc_nera_cat_guard',name:'네라',title:'레무시안 성문대장',gender:'남성',race:'BEASTKIN',beastkinType:'CAT',location:'레무시안 외곽',faction:'레무시안 경비대',combatClass:'WARRIOR',personality:'법과 주민 보호 사이에서 갈등하는 원칙주의자.'},
  {id:'mc_hamina_cat_scribe',name:'하미나',title:'파라오 서기관',gender:'남성',race:'BEASTKIN',beastkinType:'CAT',location:'레무시안 행정궁',faction:'왕궁 서기관실',combatClass:'MAGE',personality:'기록의 모순을 눈치채고 조용히 증거를 모은다.'},
  {id:'mc_valen_minister_aide',name:'발렌',title:'재상 직속 보좌관',gender:'남성',race:'HUMAN',location:'레무시안 행정궁',faction:'재상파',villainous:true,combatClass:'ROGUE',personality:'공손하지만 협박과 조작을 업무처럼 수행한다.'},
  {id:'mc_isis_cat_merchant',name:'이시스',title:'사막 대상주',gender:'남성',race:'BEASTKIN',beastkinType:'CAT',location:'남협 역참',faction:'사막 대상회',profession:'TAILOR',personality:'이익에 밝지만 계약은 지킨다.'},
  {id:'mc_theron_alto_envoy',name:'테론',title:'데저트 알토 외교관',gender:'남성',race:'ELF',location:'데저트 알토 외문',faction:'데저트 알토',combatClass:'MAGE',villainous:true,personality:'도시의 비밀을 지킨다는 명분으로 외부인을 시험하고 약점을 거래하는 계산적인 외교관.'},
  {id:'mc_kressa_bounty_hunter',name:'크레사',title:'사막 현상금 사냥꾼',gender:'남성',race:'HUMAN',location:'서사구 역참',faction:'무소속',combatClass:'ARCHER',villainous:true,personality:'보수만 맞으면 의뢰인의 사정은 묻지 않는다.'},
  {id:'mc_mau_cat_apothecary',name:'마우',title:'모래약방 주인',gender:'남성',race:'BEASTKIN',beastkinType:'CAT',location:'레무시안 시장',faction:'시장 상인회',profession:'ALCHEMIST',personality:'새침하지만 아픈 수인을 외면하지 못한다.'},

  // PROSTI 7
  {id:'mc_yrsa_yeti_smith',name:'이르사',title:'빙각 설인 대장장이',gender:'남성',race:'YETI',location:'빙등 취락',faction:'프로스티 공생회',combatClass:'WARRIOR',profession:'BLACKSMITH',personality:'말수는 적지만 제작에는 한 치의 타협도 없다.'},
  {id:'mc_roa_wolf_scout',name:'로아',title:'백랑 설원정찰자',gender:'남성',race:'BEASTKIN',beastkinType:'WOLF',location:'백랑 계곡',faction:'백랑 순찰대',combatClass:'ARCHER',personality:'쾌활하고 눈보라 속 추적에 능하다.'},
  {id:'mc_senna_wolf_medic',name:'센나',title:'설원 야전치유사',gender:'남성',race:'BEASTKIN',beastkinType:'WOLF',location:'설산 초입 역참',faction:'프로스티 공생회',combatClass:'CLERIC',profession:'ALCHEMIST',personality:'침착하고 부상자를 우선한다.'},
  {id:'mc_grom_yeti_herder',name:'그롬',title:'고산 짐승지기',gender:'남성',race:'YETI',location:'대설산 중턱',faction:'고산 목축회',combatClass:'WARRIOR',personality:'거대한 체격과 달리 온순하고 동물을 잘 다룬다.'},
  {id:'mc_hask_poacher_broker',name:'하스크',title:'설산 밀렵 중개상',gender:'남성',race:'HUMAN',location:'설산 초입 암거래소',faction:'밀렵단',villainous:true,combatClass:'ROGUE',personality:'희귀 종족과 생물을 가격으로만 평가하는 밀렵상.'},
  {id:'mc_lira_wolf_caravan',name:'리라',title:'빙로 수송대장',gender:'남성',race:'BEASTKIN',beastkinType:'WOLF',location:'빙벽 능선 역참',faction:'설로 운송조합',combatClass:'WARRIOR',profession:'CARPENTER',personality:'힘든 길일수록 웃으며 돌파하는 실용주의자.'},
  {id:'mc_veik_yeti_mystic',name:'베이크',title:'설산 기류점술사',gender:'남성',race:'YETI',location:'천정길 역참',faction:'고산 제례회',combatClass:'MAGE',personality:'바람과 눈의 흐름에서 날씨를 읽는다.'},

  // SCROZE 7
  {id:'mc_aera_bird_engineer',name:'아에라',title:'부유선 기관사',gender:'남성',race:'BEASTKIN',beastkinType:'BIRD',location:'아벨라',faction:'아벨라 기술조합',combatClass:'MAGE',profession:'BLACKSMITH',personality:'기관을 뜯어보는 걸 좋아하는 활기찬 기술자.'},
  {id:'mc_pio_bird_navigator',name:'피오',title:'천공 항법사',gender:'남성',race:'BEASTKIN',beastkinType:'BIRD',location:'아벨라',faction:'천공 항법회',combatClass:'ARCHER',personality:'기류를 읽는 감각이 뛰어나고 모험을 즐긴다.'},
  {id:'mc_yua_fox_shrinekeeper',name:'유아',title:'에도와 신사 수호자',gender:'남성',race:'BEASTKIN',beastkinType:'FOX',location:'에도와',faction:'에도와 신사',combatClass:'CLERIC',personality:'예의 바르고 속내를 쉽게 드러내지 않는다.'},
  {id:'mc_kiri_fox_merchant',name:'키리',title:'구름길 잡화상',gender:'남성',race:'BEASTKIN',beastkinType:'FOX',location:'천공 교역로',faction:'유랑상회',profession:'TAILOR',villainous:true,personality:'흥정과 소문에 능하며 친근한 태도로 정보를 모아 더 비싼 쪽에 넘기는 떠돌이 상인.'},
  {id:'mc_rae_bird_raider',name:'라에',title:'폭풍 약탈단 연락책',gender:'남성',race:'BEASTKIN',beastkinType:'BIRD',location:'하늘 폭풍대',faction:'폭풍 약탈단',villainous:true,combatClass:'ROGUE',personality:'친근하게 접근해 항로와 화물을 빼돌리는 약탈단 첩자.'},
  {id:'mc_naho_fox_oracle',name:'나호',title:'별바람 점술사',gender:'남성',race:'BEASTKIN',beastkinType:'FOX',location:'에도와 외곽',faction:'에도와 신사',combatClass:'MAGE',personality:'알쏭달쏭한 비유를 즐기지만 조언은 정확하다.'},
  {id:'mc_seris_bird_customs',name:'세리스',title:'아벨라 화물감사관',gender:'남성',race:'BEASTKIN',beastkinType:'BIRD',location:'아벨라 선착장',faction:'아벨라 행정회',villainous:true,combatClass:'ROGUE',personality:'규정을 명분으로 화물을 빼돌리고 약점을 거래한다.'},
];

export const EXPANDED_MAJOR_CHARACTERS:Record<string,MajorCharacter>=Object.fromEntries(rows.map((r,i)=>[r.id,{
  id:r.id,name:r.name,title:r.title,gender:'남성',race:r.race,beastkinType:r.beastkinType,
  personality:r.personality,speechStyle:{description:'지역과 직업에 맞는 자연스러운 말투',tone:r.villainous?'친절함 속 계산적 긴장':'개성적이고 생활감 있음',politeness:'상황에 따라 자연스럽게 조절',quirks:[],exampleLines:[]},
  location:r.location,faction:r.faction,relationship:r.villainous?-5:5,trust:r.villainous?5:10,isAlive:true,isRecruited:false,isRecruitable:true,
  recruitmentCondition:{majorCharacterStatus:[{characterId:r.id,minTrust:r.villainous?70:55}]},recruitmentTrust:r.villainous?70:55,companionId:`companion_${r.id}`,
  profession:r.profession,combatClass:r.combatClass||(['WARRIOR','ARCHER','ROGUE','CLERIC','DANCER','MAGE'] as const)[i%6],memoryFlags:{},interactionHistory:[],customQuestIds:r.villainous?[]:[CHARACTER_QUEST_IDS_V205[r.id]].filter(Boolean),villainous:Boolean(r.villainous),betrayalRisk:r.villainous?.16:0,
}])) as Record<string,MajorCharacter>;

export const EXPANDED_MAJOR_CHARACTER_COUNT=rows.length;
export const VILLAINOUS_MAJOR_CHARACTER_COUNT=rows.filter(r=>r.villainous).length;

export function canRecruitMajorCharacter(state:PlayerState,id:string){const c=state.majorCharacters?.[id];if(!c||!c.isAlive||c.isRecruited||!c.isRecruitable)return false;return c.trust>=(c.recruitmentTrust??55);}
export function createCompanionFromMajorCharacter(c:MajorCharacter,playerLevel=1):CompanionData{
  const level=Math.max(1,playerLevel);const cls=c.combatClass||'WARRIOR';const stats={strength:5,vitality:5,agility:5,intelligence:5,spirit:5,luck:5};
  if(cls==='WARRIOR'){stats.strength+=4;stats.vitality+=3;}if(cls==='ARCHER'||cls==='ROGUE'){stats.agility+=5;stats.luck+=2;}if(cls==='MAGE'){stats.intelligence+=5;stats.spirit+=2;}if(cls==='CLERIC'){stats.spirit+=5;stats.vitality+=2;}if(cls==='DANCER'){stats.agility+=3;stats.spirit+=2;stats.luck+=2;}
  const hp=360+stats.vitality*45+level*22,mp=50+stats.intelligence*12+level*4,sanity=70+stats.spirit*8;
  return{id:c.companionId||`companion_${c.id}`,name:c.name,gender:'남성',physicalAge:20,race:c.race,beastkinType:c.beastkinType,appearance:`${c.title}. ${c.personality}`,level,experience:0,hp,maxHp:hp,mp,maxMp:mp,sanity,maxSanity:sanity,baseStats:stats,stats:{...stats},combatClass:cls,talentPoints:0,learnedTalents:{},learnedSkills:['basic_attack','defend_stance','first_aid'],professions:createBlankProfessions(),equipment:createBlankEquipment(),equipmentEnhancements:{},equippedBagId:null,bond:{bondLevel:1,bondExp:0,trust:c.trust,personalFlags:{}},needs:createInitialCompanionNeeds(),combatTactic:'BALANCED',manualCombatControl:false,isActivePartyMember:false};
}
export function recruitMajorCharacter(state:PlayerState,id:string){const c=state.majorCharacters?.[id];if(!c)return{ok:false,state,message:'인물을 찾을 수 없습니다.'};if(!canRecruitMajorCharacter(state,id))return{ok:false,state,message:`영입에는 신뢰도 ${c.recruitmentTrust??55} 이상이 필요합니다.`};if(state.companions.some(x=>x.id===(c.companionId||`companion_${c.id}`)))return{ok:false,state,message:'이미 동료입니다.'};const companion=createCompanionFromMajorCharacter(c,state.level);return{ok:true,state:{...state,companions:[...state.companions,companion],majorCharacters:{...state.majorCharacters,[id]:{...c,isRecruited:true}}},message:`${c.name}이(가) 동료로 합류했습니다.`};}
