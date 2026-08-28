export interface NormalDungeonTrapDefinition {
  id: string;
  name: string;
  description: string;
  hpRatioDamage?: number;
  sanityDamage?: number;
  timeMinutes?: number;
  statusTag?: string;
}

export interface AdultDungeonTrapReferenceSlot {
  id: string;
  name: string;
  sceneReference: string;
  rewardReference: string;
  effectReference: string;
}

export const NORMAL_DUNGEON_TRAPS: NormalDungeonTrapDefinition[] = [
  { id: 'trap_poison_needle', name: '독침 발사대', description: '벽의 작은 구멍에서 독침이 발사된다.', hpRatioDamage: 0.08, statusTag: 'POISON' },
  { id: 'trap_falling_rocks', name: '낙석 함정', description: '천장의 고정석이 무너지며 통로를 덮친다.', hpRatioDamage: 0.12, timeMinutes: 8 },
  { id: 'trap_pressure_blade', name: '압력판 칼날', description: '바닥 압력판을 밟으면 벽의 칼날이 튀어나온다.', hpRatioDamage: 0.10 },
  { id: 'trap_mana_burst', name: '마력 폭발진', description: '봉인 문양이 과충전되어 마력 충격을 방출한다.', hpRatioDamage: 0.07, sanityDamage: 7 },
  { id: 'trap_binding_net', name: '포박 철망', description: '숨겨진 철망이 튀어나와 이동을 방해한다.', timeMinutes: 15, statusTag: 'SLOW' },
  { id: 'trap_floor_collapse', name: '바닥 함몰', description: '바닥이 무너지며 아래 공동으로 떨어진다.', hpRatioDamage: 0.14, timeMinutes: 20 },
];

// 사용자 작성용 성인 함정 5종. 내용은 의도적으로 비어 있다.
// physicalAge < 18이면 이 슬롯 자체를 Gemini/장면 엔진에 전달하지 않는다.
export const ADULT_DUNGEON_TRAP_SLOTS: AdultDungeonTrapReferenceSlot[] = Array.from({ length: 5 }, (_, index) => ({
  id: `adult_trap_slot_${String(index + 1).padStart(2, '0')}`,
  name: '',
  sceneReference: '',
  rewardReference: '',
  effectReference: '',
}));

export function getAdultDungeonTrapReference(id?: string | null): AdultDungeonTrapReferenceSlot | undefined {
  return id ? ADULT_DUNGEON_TRAP_SLOTS.find((slot) => slot.id === id) : undefined;
}
