import { QuestDefinition } from '../../types';
import { GUIDE_QUESTS } from './guideQuestExpansion';
import { CHARACTER_QUESTS_V205 } from './characterQuestExpansionV205';
import { FATE_QUESTS } from './fateQuestDatabase';
import { SETTLEMENT_BOARD_QUESTS } from '../world/settlements/settlementBoardQuests';

const BASE_QUEST_DATABASE: Record<string, QuestDefinition> = {
  quest_class_basic: {
    id: 'quest_class_basic',
    title: '첫 번째 길 — 기본 전직 시험',
    category: 'CLASS',
    description: 'Lv.5에 도달한 모험가에게 주어지는 첫 전직 시험. 완료 후 6개의 기본 전직 중 하나를 선택할 수 있습니다.',
    summary: '전직 UI에서 기본 전직 시험을 완료하고 자신의 첫 직업을 선택하세요.',
    stages: [{ stageId: 1, title: '전직 시험', description: '기본 전직의 자격을 증명하세요.', objectives: [] }],
    rewards: { exp: 50 },
  },
  quest_class_advanced: {
    id: 'quest_class_advanced',
    title: '뻗어 나가는 가지 — 심화 전직 시험',
    category: 'CLASS',
    description: 'Lv.20에 도달한 전직자에게 주어지는 심화 시험. 완료 후 현재 기본 직업의 심화 계열을 선택할 수 있습니다.',
    summary: '전직 UI에서 심화 전직 시험을 완료하고 상위 계열을 선택하세요.',
    stages: [{ stageId: 1, title: '심화 전직 시험', description: '현재 직업의 한계를 넘어설 자격을 증명하세요.', objectives: [] }],
    rewards: { exp: 150 },
  },

  quest_main_awakening: {
    id: 'quest_main_awakening',
    title: '어둠 속의 태동',
    category: 'MAIN',
    description: '낯선 숲에서 눈을 뜬 당신. 야생의 위협에서 살아남기 위해 자원을 수습하고 인근 거점으로 향해야 합니다.',
    summary: '약초를 채집하고 위협을 물리친 뒤 성채 주점의 기사 엘레나를 찾아가세요.',
    autoStart: true,
    stages: [
      {
        stageId: 1,
        title: '생존을 위한 채비',
        description: '야생에서 유용한 약초를 채집하고 회복약을 확보하세요.',
        objectives: [
          {
            id: 'obj_gather_herbs',
            description: '야생 약초 획득하기',
            type: 'GAIN_ITEM',
            targetId: 'wild_herb',
            targetName: '약초',
            requiredCount: 2,
            currentCount: 0,
            isCompleted: false,
          },
          {
            id: 'obj_possess_potion',
            description: '회복약 보유하기',
            type: 'POSSESS_ITEM',
            targetId: 'potion_small_health',
            targetName: '작은 회복약',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 2,
      },
      {
        stageId: 2,
        title: '숲의 포식자 격퇴',
        description: '숲길을 위협하는 야생 늑대를 물리치세요.',
        objectives: [
          {
            id: 'obj_defeat_wolf',
            description: '야생 늑대 처치하기',
            type: 'DEFEAT_ENEMY',
            targetId: 'wild_wolf',
            targetName: '야생 늑대',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 3,
      },
      {
        stageId: 3,
        title: '문명의 거점으로',
        description: '발터 성채 주점에서 정보를 모으고 은빛 검사 엘레나와 대화하세요.',
        objectives: [
          {
            id: 'obj_talk_elena',
            description: '은빛 검사 엘레나와 대화하기',
            type: 'TALK_NPC',
            targetId: 'elena_swordmaster',
            targetName: '엘레나',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 250,
      rupees: 150,
      talentPoints: 1,
      items: [{ name: '작은 회복약', quantity: 2, quality: 'NORMAL' }],
      characterRelationship: {
        characterId: 'elena_swordmaster',
        delta: 15,
      },
      followUpQuestIds: ['quest_elena_lost_crest'],
    },
  },

  quest_elena_lost_crest: {
    id: 'quest_elena_lost_crest',
    title: '은빛 기사의 잃어버린 문장',
    category: 'CHARACTER',
    giverNpcId: 'elena_swordmaster',
    giverName: '은빛 검사 엘레나',
    description: '엘레나는 고대 지하 묘지에 남겨진 선대 기사단의 문장과 비문을 되찾고자 합니다. 그녀의 신뢰를 얻을 기회입니다.',
    summary: '고대 지하 묘지의 철문을 열고 비문의 탁본을 구해 엘레나에게 전달하세요.',
    startConditions: {
      majorCharacterStatus: [
        {
          characterId: 'elena_swordmaster',
          minTrust: 15,
        },
      ],
    },
    stages: [
      {
        stageId: 1,
        title: '지하 묘지 봉인 해제',
        description: '오래된 지하 묘지의 잠긴 철문을 열쇠나 기술로 해제하세요.',
        objectives: [
          {
            id: 'obj_unlock_crypt',
            description: '지하 묘지의 철문 잠금 해제',
            type: 'UNLOCK_LOCK',
            targetId: 'crypt_iron_gate',
            targetName: '오래된 지하 묘지의 철문',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 2,
      },
      {
        stageId: 2,
        title: '고대 비문의 회수',
        description: '묘지 내부 제단에서 고대 비문의 탁본을 입수하세요.',
        objectives: [
          {
            id: 'obj_get_rubbing',
            description: '고대 비문의 탁본 획득',
            type: 'GAIN_ITEM',
            targetId: 'ancient_ruins_rubbing',
            targetName: '고대 비문의 탁본',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 3,
      },
      {
        stageId: 3,
        title: '엘레나에게 보고',
        description: '획득한 비문의 탁본을 엘레나에게 전달하고 결과를 공유하세요.',
        objectives: [
          {
            id: 'obj_return_to_elena',
            description: '엘레나와 대화하여 퀘스트 완료',
            type: 'TALK_NPC',
            targetId: 'elena_swordmaster',
            targetName: '엘레나',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 300,
      rupees: 200,
      statPoints: 1,
      characterRelationship: {
        characterId: 'elena_swordmaster',
        delta: 25,
      },
      companionTrust: {
        companionId: 'companion_elena',
        delta: 30,
      },
      items: [{ name: '상급 붉은 회복약', quantity: 2, quality: 'FINE' }],
    },
  },

  quest_sylvia_lunar_veil: {
    id: 'quest_sylvia_lunar_veil',
    title: '달빛 장막의 차크람 춤',
    category: 'CHARACTER',
    giverNpcId: 'sylvia_shadow_dancer',
    giverName: '그림자 무희 실비아',
    description: '오아시스의 무희 실비아는 수인의 춤과 무용을 인정해줄 진정한 벗을 찾고 있습니다. 그녀에게 선물을 주거나 춤을 감상하세요.',
    summary: '실비아에게 장미 향수를 선물하거나 깊은 교감을 나누세요.',
    stages: [
      {
        stageId: 1,
        title: '무희와의 교감',
        description: '매혹의 장미 향수를 사용하거나 실비아와 대화하여 유대를 쌓으세요.',
        objectives: [
          {
            id: 'obj_sylvia_interact',
            description: '실비아와 대화하기',
            type: 'TALK_NPC',
            targetId: 'sylvia_shadow_dancer',
            targetName: '실비아',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 2,
      },
      {
        stageId: 2,
        title: '신뢰의 춤',
        description: '전투나 야영지에서 실비아와의 신뢰도를 높이세요.',
        objectives: [
          {
            id: 'obj_sylvia_trust',
            description: '실비아의 신뢰도 40 이상 달성',
            type: 'COMPANION_BOND',
            targetId: 'sylvia_shadow_dancer',
            requiredCount: 40,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 280,
      rupees: 180,
      characterRelationship: {
        characterId: 'sylvia_shadow_dancer',
        delta: 30,
      },
      items: [{ name: '매혹의 장미 향수', quantity: 1, quality: 'FINE' }],
    },
  },

  quest_vargas_pure_iron: {
    id: 'quest_vargas_pure_iron',
    title: '대장장이의 순수한 철광석',
    category: 'PROFESSION',
    giverNpcId: 'vargas_ironmonger',
    giverName: '강철망치 바르가스',
    description: '바르가스는 제련로의 불꽃을 지피기 위해 순도 높은 철광석과 야영지 모닥불 설비를 점검하고자 합니다.',
    summary: '철광석을 확보하고 대장장이 수련을 진행하세요.',
    stages: [
      {
        stageId: 1,
        title: '철광석 수집',
        description: '제련에 필요한 순수 철광석을 3개 확보하세요.',
        objectives: [
          {
            id: 'obj_possess_iron',
            description: '철광석 보유하기',
            type: 'POSSESS_ITEM',
            targetId: 'iron_ore',
            targetName: '철광석',
            requiredCount: 3,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 2,
      },
      {
        stageId: 2,
        title: '대장장이의 수련',
        description: '대장장이 생활 직업 레벨 2를 달성하세요.',
        objectives: [
          {
            id: 'obj_smith_level',
            description: '대장장이 Lv.2 달성',
            type: 'PROFESSION_LEVEL',
            targetId: 'BLACKSMITH',
            targetName: '대장장이',
            requiredCount: 2,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 220,
      rupees: 150,
      professionExp: {
        professionId: 'BLACKSMITH',
        exp: 150,
      },
      characterRelationship: {
        characterId: 'vargas_ironmonger',
        delta: 20,
      },
    },
  },


  quest_miria_medicinal_herbs: {
    id: 'quest_miria_medicinal_herbs',
    title: '치유사의 약초 꾸러미',
    category: 'CHARACTER',
    giverNpcId: 'miria_beastkin_healer',
    giverName: '상냥한 약초 치유사 미리아',
    description: '미리아는 숲에서 다친 이들을 돌보기 위해 기본 약재가 더 필요합니다. 치유잎을 모아 그녀의 치료 준비를 도와주세요.',
    summary: '치유잎을 확보하고 미리아에게 돌아가 약초 꾸러미를 완성하세요.',
    stages: [
      {
        stageId: 1,
        title: '치유잎 수집',
        description: '숲과 들판에서 치료에 쓸 치유잎을 충분히 확보하세요.',
        objectives: [
          {
            id: 'obj_miria_medicinal_leaf',
            description: '치유잎 3개 보유하기',
            type: 'POSSESS_ITEM',
            targetId: 'medicinal_leaf',
            targetName: '치유잎',
            requiredCount: 3,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 2,
      },
      {
        stageId: 2,
        title: '치유사에게 전달',
        description: '미리아에게 돌아가 확보한 약재와 치료 준비를 확인하세요.',
        objectives: [
          {
            id: 'obj_return_to_miria',
            description: '미리아와 대화하기',
            type: 'TALK_NPC',
            targetId: 'miria_beastkin_healer',
            targetName: '미리아',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 220,
      rupees: 120,
      professionExp: { professionId: 'ALCHEMIST', exp: 120 },
      characterRelationship: { characterId: 'miria_beastkin_healer', delta: 20 },
      companionTrust: { companionId: 'companion_miria', delta: 15 },
      items: [{ name: '작은 회복약', quantity: 2, quality: 'NORMAL' }],
    },
  },

  quest_bandit_canyon_negotiation: {
    id: 'quest_bandit_canyon_negotiation',
    title: '협곡의 도적단과 비밀 보물함',
    category: 'SUB',
    giverNpcId: 'drake_bandit_leader',
    giverName: '도적 두목 드레이크',
    description: '메아리 협곡의 도적단은 은신처에 단단히 잠긴 보물함을 숨겨두었습니다. 도적들과 담판을 짓거나 상자를 털어내세요.',
    summary: '도적단의 보물 상자를 열고 협곡의 주도권을 잡으세요.',
    stages: [
      {
        stageId: 1,
        title: '은신처 잠입과 보물함 해제',
        description: '도적단의 견고한 보물 상자 잠금을 열쇠나 도적으로 해제하세요.',
        objectives: [
          {
            id: 'obj_unlock_bandit_box',
            description: '도적단의 견고한 보물 상자 개방',
            type: 'UNLOCK_LOCK',
            targetId: 'bandit_strongbox',
            targetName: '도적단의 견고한 보물 상자',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 300,
      rupees: 350,
      statPoints: 1,
      items: [
        { name: '도적의 만능 락픽 세트', quantity: 1, quality: 'FINE' },
        { name: '정교한 은빛 로켓 목걸이', quantity: 1, quality: 'FINE' },
      ],
    },
  },

  quest_arcane_investigation: {
    id: 'quest_arcane_investigation',
    title: '마법탑의 사라진 비전',
    category: 'HIDDEN',
    giverNpcId: 'kaelen_archmage',
    giverName: '은둔의 비전술사 카엘렌',
    description: '버려진 마법탑에 걸린 결계를 풀고 고대 비전의 지혜를 해독하세요.',
    summary: '마법탑의 결계를 해제하고 비망록을 읽으세요.',
    isHidden: true,
    stages: [
      {
        stageId: 1,
        title: '마법탑 결계 돌파',
        description: '마법탑의 결계 마법진을 수정구나 마법으로 해제하세요.',
        objectives: [
          {
            id: 'obj_unlock_barrier',
            description: '마법탑의 결계 마법진 해제',
            type: 'UNLOCK_LOCK',
            targetId: 'arcane_tower_barrier',
            targetName: '마법탑의 결계 마법진',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
        nextStageId: 2,
      },
      {
        stageId: 2,
        title: '비전 서적 독서',
        description: '탑 서재에서 비망록을 정독하여 지식을 넓히세요.',
        objectives: [
          {
            id: 'obj_read_notebook',
            description: '떠돌이 연금술사의 비망록 읽기',
            type: 'READ_BOOK',
            targetId: 'alchemist_notebook',
            targetName: '떠돌이 연금술사의 비망록',
            requiredCount: 1,
            currentCount: 0,
            isCompleted: false,
          },
        ],
      },
    ],
    rewards: {
      exp: 350,
      rupees: 250,
      talentPoints: 1,
      characterRelationship: {
        characterId: 'kaelen_archmage',
        delta: 30,
      },
      items: [{ name: '맑은 정신의 마나 물약', quantity: 2, quality: 'SUPERIOR' }],
    },
  },
};

export const QUEST_DATABASE: Record<string, QuestDefinition> = { ...BASE_QUEST_DATABASE, ...GUIDE_QUESTS, ...CHARACTER_QUESTS_V205, ...FATE_QUESTS, ...SETTLEMENT_BOARD_QUESTS };

export function getQuestDefinition(questId?: string): QuestDefinition | undefined {
  if (!questId) return undefined;
  return QUEST_DATABASE[questId.trim()];
}
