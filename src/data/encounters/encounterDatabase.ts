import { EncounterDefinition } from '../../types';
import { DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES } from '../raceNarrativeReferences';
import { FATE_ENCOUNTERS } from './fateEncounterDatabase';
import { PHEROMONE_ENCOUNTER_DEFINITIONS } from './pheromoneEncounterDefinitions';
import { DEFEAT_ADULT_EVENT_DEFINITIONS } from './defeatAdultEventDefinitions';

export const ENCOUNTER_DATABASE: Record<string, EncounterDefinition> = {
  ...FATE_ENCOUNTERS,
  ...PHEROMONE_ENCOUNTER_DEFINITIONS,
  ...DEFEAT_ADULT_EVENT_DEFINITIONS,

  // 월드맵 TravelSession의 비전투 사건 공통 컨테이너.
  // 실제 제목/요약/연출은 playerState.worldMap.travelSession의 현재 encounter에서 읽는다.
  world_travel_encounter: {
    id: 'world_travel_encounter',
    title: '여행 중 인카운터',
    summary: '목적지로 이동하는 도중 발생한 여행 사건입니다.',
    location: '여행 경로',
    isPersistent: false,
    startsCombat: false,
    sceneReference: '현재 TravelSession에 기록된 여행 사건 하나만 진행한다. 플레이어의 대응이 끝나기 전 다음 사건이나 목적지 도착을 미리 처리하지 않는다.',
  },
  forest_ambush_investigation: {
    id: 'forest_ambush_investigation',
    title: '어스름 숲의 의문의 발자국',
    summary: '안개 낀 숲길에서 부서진 마차 잔해와 늑대 무리의 불길한 발자국이 발견되었습니다.',
    location: '어스름 숲 초입',
    isPersistent: true,
    totalSteps: 2,
    conditions: {
      location: '어스름 숲',
    },
    chainOnResolve: [
      {
        nextEncounterId: 'bandit_hideout_scouting',
        delayDays: 1,
        delayTimeOfDay: 'NIGHT',
      },
    ],
    chainOnFail: [
      {
        nextEncounterId: 'forest_wolf_pack_hunt',
        delayDays: 0,
        delayTimeOfDay: 'NIGHT',
      },
    ],
    startsCombat: false,
  },

  forest_wolf_pack_hunt: {
    id: 'forest_wolf_pack_hunt',
    title: '굶주린 늑대 무리의 야간 습격',
    summary: '숲의 어둠 속에서 붉은 안광을 번뜩이는 야생 늑대 무리가 포위망을 좁혀옵니다.',
    location: '어스름 숲 심층',
    isPersistent: false,
    startsCombat: true,
    combatEnemyTemplate: 'wild_wolf',
  },

  bandit_hideout_scouting: {
    id: 'bandit_hideout_scouting',
    title: '협곡 도적단의 감시 초소',
    summary: '절벽 틈새에 숨겨진 도적단의 전초기지. 잠입하거나 정면 돌파할 수 있는 기로에 섭니다.',
    location: '메아리 협곡 외곽',
    isPersistent: true,
    totalSteps: 3,
    associatedNpcId: 'drake_bandit_leader',
    associatedQuestId: 'quest_bandit_canyon_negotiation',
    startsCombat: false,
  },

  ancient_crypt_exploration: {
    id: 'ancient_crypt_exploration',
    title: '지하 묘지의 봉인된 성소',
    summary: '수백 년간 닫혀 있던 석문 너머에서 고대 유령들의 속삭임과 마력의 파동이 흘러나옵니다.',
    location: '고대 지하 묘지',
    isPersistent: true,
    totalSteps: 2,
    conditions: {
      locksUnlocked: ['crypt_iron_gate'],
    },
    chainOnResolve: [
      {
        nextEncounterId: 'crypt_guardian_awakening',
        delayDays: 0,
      },
    ],
    startsCombat: false,
  },

  crypt_guardian_awakening: {
    id: 'crypt_guardian_awakening',
    title: '성소 묘지기 망령의 각성',
    summary: '침입자를 응징하기 위해 고대 전사의 영혼이 검을 뽑아 들었습니다.',
    location: '고대 지하 묘지 중앙 제단',
    isPersistent: false,
    startsCombat: true,
    combatEnemyTemplate: 'skeleton_warrior',
  },

  lunar_dancer_encounter: {
    id: 'lunar_dancer_encounter',
    title: '달빛 오아시스의 매혹적인 춤사위',
    summary: '사막의 맑은 샘가에서 은빛 차크람을 든 수인 무희 실비아가 화려한 무도를 펼치고 있습니다.',
    location: '달빛 오아시스',
    isPersistent: true,
    totalSteps: 2,
    associatedNpcId: 'sylvia_shadow_dancer',
    associatedQuestId: 'quest_sylvia_lunar_veil',
    startsCombat: false,
  },

  arcane_library_trial: {
    id: 'arcane_library_trial',
    title: '마법탑 서재의 비전 수수께끼',
    summary: '공중에 떠오른 마법 서적들이 침입자의 지혜와 마력 감응력을 시험합니다.',
    location: '은둔자의 마법탑 상층',
    isPersistent: true,
    totalSteps: 2,
    associatedNpcId: 'kaelen_archmage',
    associatedQuestId: 'quest_arcane_investigation',
    conditions: {
      locksUnlocked: ['arcane_tower_barrier'],
    },
    startsCombat: false,
  },

  // ==========================================================
  // 2.0 역참 보호 노선 전용 인카운터
  // 일반 야외 인카운터는 역참 이동 중 발생하지 않으며 아래 사건만 별도 판정됩니다.
  // ==========================================================
  waystation_wagon_raid: {
    id:'waystation_wagon_raid', title:'보호 노선의 마차 약탈', summary:'역참 사이 보호 노선을 노린 약탈대가 호송 마차를 가로막았습니다.', location:'역참 보호 노선', isPersistent:false, startsCombat:false,
    sceneReference:'역참 보호 노선에서 약탈대가 마차를 정지시키고 화물과 통행료를 요구한다. 플레이어는 싸움, 협상, 우회, 호송대 지원 등으로 대응할 수 있다. 결과를 확정하기 전 플레이어 선택을 존중한다.',
  },
  waystation_slave_trader: {
    id:'waystation_slave_trader', title:'수상한 노예상의 접근', summary:'보호 노선에 섞여 든 수상한 상인이 승객을 살피며 은밀한 거래를 제안합니다.', location:'역참 보호 노선', isPersistent:false, startsCombat:false,
    sceneReference:'수상한 인신매매상이 플레이어와 승객들에게 접근한다. 강압적이거나 불법적인 거래 분위기를 비그래픽하게 묘사하고, 플레이어에게 거절·신고·추적·거래 중단 등의 선택지를 제공한다.',
  },
  waystation_false_checkpoint: {
    id:'waystation_false_checkpoint', title:'가짜 검문소', summary:'정식 역참 표식이 없는 자들이 길을 막고 추가 통행료를 요구합니다.', location:'역참 보호 노선', isPersistent:false, startsCombat:false,
    sceneReference:'가짜 검문 인원들이 공문을 흉내 내며 통행료를 요구한다. 증표 확인, 설득, 역참 경비 호출, 강행 통과 등 선택을 제공한다.',
  },
  waystation_broken_axle: {
    id:'waystation_broken_axle', title:'수송 마차 축 파손', summary:'호송 마차의 축이 부러져 행렬 전체가 멈춰 섰습니다.', location:'역참 보호 노선', isPersistent:false, startsCombat:false,
    sceneReference:'마차 수리와 생활직업/재료 활용이 중심인 생활형 사건. 목공·대장장이 기술이나 부품을 활용할 수 있도록 한다.',
  },
  waystation_roaming_merchant: {
    id:'waystation_roaming_merchant', title:'보호 노선의 이동 상인', summary:'역참 노선만 따라 이동하는 희귀 행상인이 잠시 같은 마차에 합류했습니다.', location:'역참 보호 노선', isPersistent:false, startsCombat:false,
    sceneReference:'희귀 생활재료와 여행용품에 관한 정보를 가진 이동 상인과의 비전투 교류 장면. 실제 구매 여부는 현재 상점/아이템 상태를 우선한다.',
  },

  // ==========================================================
  // 용족 플레이어 전용 사냥꾼 인카운터 7종
  // ==========================================================
  dragonkin_hunter_false_pilgrims: { id:'dragonkin_hunter_false_pilgrims', title:'거짓 순례자의 경배', summary:'용족에게 축복을 청한다며 접근한 순례자들의 시선이 지나치게 계산적입니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_false_pilgrims },
  dragonkin_hunter_silver_net: { id:'dragonkin_hunter_silver_net', title:'은빛 포획망', summary:'영력을 억제하는 은빛 포획망이 길목 위에서 한꺼번에 펼쳐집니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_silver_net },
  dragonkin_hunter_scale_broker: { id:'dragonkin_hunter_scale_broker', title:'비늘 감정상의 제안', summary:'희귀 재료를 감정한다는 상인이 유난히 용족의 뿔과 비늘에 집착합니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_scale_broker },
  dragonkin_hunter_resonance_pylon: { id:'dragonkin_hunter_resonance_pylon', title:'용혈 공명탑', summary:'낯선 장치가 낮은 진동음을 내며 용족의 영력에 반응하기 시작합니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_resonance_pylon },
  dragonkin_hunter_cage_convoy: { id:'dragonkin_hunter_cage_convoy', title:'강화 우리 수송대', summary:'두꺼운 쇠살과 봉인문으로 덮인 대형 우리를 실은 수송대가 지나갑니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_cage_convoy },
  dragonkin_hunter_shrine_trap: { id:'dragonkin_hunter_shrine_trap', title:'수호신을 위한 가짜 제단', summary:'용족의 축복을 청하는 제단 곳곳에서 억제 부적과 봉인 장치가 발견됩니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_shrine_trap },
  dragonkin_hunter_sky_chain: { id:'dragonkin_hunter_sky_chain', title:'하늘의 쇠사슬', summary:'사냥 비행선의 갑판에서 용족용 쇠사슬 투사기가 천천히 이쪽을 겨눕니다.', location:'용족 전용 여행 인카운터', isPersistent:false, startsCombat:false, sceneReference:DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES.dragonkin_hunter_sky_chain },

  // ==========================================================
  // [USER_TODO] 사용자 작성용 빈 인카운터 슬롯 5개
  // - enabled를 true로 바꾼 뒤 title / summary / location / sceneReference / rewards 등을 채우세요.
  // - 비어 있는 동안에는 getEncounterDefinition()에서 반환되지 않아 자동 진행에 끼어들지 않습니다.
  // ==========================================================
  user_encounter_slot_01: {
    id: 'user_encounter_slot_01', title: '', summary: '', location: '',
    enabled: false, userEditableSlot: true, sceneReference: '', rewards: {},
    isPersistent: false, startsCombat: false,
  },
  user_encounter_slot_02: {
    id: 'user_encounter_slot_02', title: '', summary: '', location: '',
    enabled: false, userEditableSlot: true, sceneReference: '', rewards: {},
    isPersistent: false, startsCombat: false,
  },
  user_encounter_slot_03: {
    id: 'user_encounter_slot_03', title: '', summary: '', location: '',
    enabled: false, userEditableSlot: true, sceneReference: '', rewards: {},
    isPersistent: false, startsCombat: false,
  },
  user_encounter_slot_04: {
    id: 'user_encounter_slot_04', title: '', summary: '', location: '',
    enabled: false, userEditableSlot: true, sceneReference: '', rewards: {},
    isPersistent: false, startsCombat: false,
  },
  user_encounter_slot_05: {
    id: 'user_encounter_slot_05', title: '', summary: '', location: '',
    enabled: false, userEditableSlot: true, sceneReference: '', rewards: {},
    isPersistent: false, startsCombat: false,
  },

};

export function getEncounterDefinition(encounterId?: string): EncounterDefinition | undefined {
  if (!encounterId) return undefined;
  const encounter = ENCOUNTER_DATABASE[encounterId.trim()];
  if (!encounter || encounter.enabled === false) return undefined;
  return encounter;
}
