import { LockDefinition } from '../../types';

export const LOCK_DATABASE: Record<string, LockDefinition> = {
  crypt_iron_gate: {
    lockId: 'crypt_iron_gate',
    name: '오래된 지하 묘지의 철문',
    description: '육중한 녹슨 철문. 열쇠구멍이 깊게 파여 있으며, 완력이나 도적으로도 돌파할 수 있어 보입니다.',
    location: '고대 지하 묘지 입구',
    keyItemId: 'rusty_iron_key',
    consumeKeyOnUnlock: true,
    supportedMethods: ['KEY', 'LOCKPICK', 'FORCE', 'MAGIC'],
    difficultyByMethod: {
      LOCKPICK: 12,
      FORCE: 16,
      MAGIC: 14,
    },
    rewards: {
      exp: 100,
      rupees: 50,
      items: [{ itemId: 'ancient_ruins_rubbing', name: '고대 비문의 탁본', quantity: 1 }],
      storyFlags: ['crypt_gate_unlocked'],
    },
  },
  bandit_strongbox: {
    lockId: 'bandit_strongbox',
    name: '도적단의 견고한 보물 상자',
    description: '황동 띠가 둘러진 참나무 궤짝. 두목의 열쇠나 정교한 락픽 솜씨가 필요합니다.',
    location: '도적단 협곡 은신처',
    keyItemId: 'bandit_chest_key',
    consumeKeyOnUnlock: true,
    supportedMethods: ['KEY', 'LOCKPICK', 'FORCE'],
    difficultyByMethod: {
      LOCKPICK: 14,
      FORCE: 18,
    },
    rewards: {
      exp: 150,
      rupees: 250,
      items: [
        { itemId: 'potion_greater_health', name: '상급 붉은 회복약', quantity: 2 },
        { itemId: 'silver_locket', name: '정교한 은빛 로켓 목걸이', quantity: 1 },
      ],
      storyFlags: ['bandit_loot_acquired'],
    },
  },
  arcane_tower_barrier: {
    lockId: 'arcane_tower_barrier',
    name: '마법탑의 결계 마법진',
    description: '희미한 비전 마력의 장막이 계단을 가로막고 있습니다. 공명 수정구를 끼우거나 고도의 마력으로 해체해야 합니다.',
    location: '버려진 은둔자의 마법탑',
    keyItemId: 'arcane_tower_crystal_key',
    consumeKeyOnUnlock: false,
    supportedMethods: ['KEY', 'MAGIC', 'QUEST'],
    difficultyByMethod: {
      MAGIC: 16,
    },
    requiredQuestId: 'quest_arcane_investigation',
    rewards: {
      exp: 200,
      rupees: 100,
      items: [{ itemId: 'alchemist_notebook', name: '떠돌이 연금술사의 비망록', quantity: 1 }],
      storyFlags: ['arcane_barrier_dispelled'],
    },
  },
  sanctuary_deep_vault: {
    lockId: 'sanctuary_deep_vault',
    name: '성역 심층부의 봉인된 석문',
    description: '고대 문양이 새겨진 거대한 석문. 성역의 인장을 맞추거나 대마법사의 승인을 받아야만 열립니다.',
    location: '달빛 성역 중앙 심층부',
    keyItemId: 'ancient_sanctuary_seal',
    consumeKeyOnUnlock: false,
    supportedMethods: ['KEY', 'MAGIC', 'NPC_PERMISSION'],
    difficultyByMethod: {
      MAGIC: 20,
    },
    requiredNpcId: 'kaelen_archmage',
    requiredNpcTrust: 60,
    rewards: {
      exp: 350,
      rupees: 400,
      items: [{ itemId: 'miracle_elixir', name: '기적의 엘릭서', quantity: 1 }],
      storyFlags: ['sanctuary_vault_opened'],
    },
  },
  dungeon_cell_lock: {
    lockId: 'dungeon_cell_lock',
    name: '지하 감옥 쇠창살 자물쇠',
    description: '투박한 쇠사슬과 낡은 자물쇠로 잠겨 있는 수인 수용 감옥의 문입니다.',
    location: '영주성 지하 감옥',
    keyItemId: 'rusty_iron_key',
    consumeKeyOnUnlock: true,
    supportedMethods: ['KEY', 'LOCKPICK', 'FORCE'],
    difficultyByMethod: {
      LOCKPICK: 10,
      FORCE: 14,
    },
    rewards: {
      exp: 80,
      rupees: 20,
      storyFlags: ['freed_dungeon_prisoner'],
    },
  },
};

export function getLockDefinition(lockId?: string): LockDefinition | undefined {
  if (!lockId) return undefined;
  return LOCK_DATABASE[lockId.trim()];
}
