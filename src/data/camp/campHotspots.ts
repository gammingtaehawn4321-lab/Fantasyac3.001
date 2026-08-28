import { CampFacilityType } from './campTypes';

export type HotspotFacilityStatus = 'AVAILABLE' | 'UPGRADE_AVAILABLE' | 'NOT_BUILT' | 'LOCKED' | 'DISABLED';

export interface CampHotspotDefinition {
  id: string;
  displayName: string;
  description: string;
  facilityId?: CampFacilityType;
  requiredLevel?: number;
  x: number; // % relative to image width (0 ~ 100)
  y: number; // % relative to image height (0 ~ 100)
  widthPercent?: number;
  heightPercent?: number;
  icon: string;
  buttonLabel: string;
  subLabel: string;
  actionType:
    | 'CRAFT_SMITHING'
    | 'CRAFT_LEATHER'
    | 'CRAFT_ALCHEMY'
    | 'CRAFT_COOK'
    | 'CRAFT_JEWEL'
    | 'STORAGE'
    | 'REST'
    | 'COMPANION'
    | 'CARPENTRY'
    | 'READING';
  badgeLabel?: string;
  interactionEffect?: 'fire' | 'sparkle' | 'box' | 'glow';
}

export const CAMP_HOTSPOTS: CampHotspotDefinition[] = [
  {
    id: 'hotspot_smithing',
    displayName: '대장 작업장',
    description: '용광로 제련 · 무기 단조 · 장비 강화',
    facilityId: 'anvil',
    requiredLevel: 0,
    x: 68,
    y: 18,
    icon: '⚒️',
    buttonLabel: '대장 작업장',
    subLabel: '광석 제련 · 단조 · 강화',
    actionType: 'CRAFT_SMITHING',
    badgeLabel: '제련 & 단조',
    interactionEffect: 'fire',
  },
  {
    id: 'hotspot_leather',
    displayName: '가죽 작업대',
    description: '생가죽 무두질 · 재단 · 가죽 장비',
    facilityId: 'leather_bench',
    requiredLevel: 0,
    x: 12,
    y: 58,
    icon: '🧵',
    buttonLabel: '가죽 작업대',
    subLabel: '가죽 가공 · 장비 제작',
    actionType: 'CRAFT_LEATHER',
    badgeLabel: '가죽 세공',
    interactionEffect: 'glow',
  },
  {
    id: 'hotspot_alchemy',
    displayName: '연금 작업대',
    description: '전투 비약 · 비전투 물약 · 재료 정제',
    facilityId: 'alchemy_bench',
    requiredLevel: 0,
    x: 36,
    y: 56,
    icon: '⚗️',
    buttonLabel: '연금 작업대',
    subLabel: '비약 · 물약 · 시약 정제',
    actionType: 'CRAFT_ALCHEMY',
    badgeLabel: '연금 조제',
    interactionEffect: 'sparkle',
  },
  {
    id: 'hotspot_cooking',
    displayName: '조리 공간 & 화덕',
    description: '야영 스튜 · 야전식 · 음식 조리',
    facilityId: 'cook_stove',
    requiredLevel: 0,
    x: 42,
    y: 28,
    icon: '🍲',
    buttonLabel: '조리 공간',
    subLabel: '요리 · 야영 식사',
    actionType: 'CRAFT_COOK',
    badgeLabel: '화덕 요리',
    interactionEffect: 'fire',
  },
  {
    id: 'hotspot_jewel',
    displayName: '보석세공 작업대',
    description: '원석 절삭 · 장신구 제련 · 정밀 세공',
    facilityId: 'workbench',
    requiredLevel: 0,
    x: 52,
    y: 78,
    icon: '💎',
    buttonLabel: '보석 작업대',
    subLabel: '보석 절삭 · 장신구 제작',
    actionType: 'CRAFT_JEWEL',
    badgeLabel: '보석 세공',
    interactionEffect: 'sparkle',
  },
  {
    id: 'hotspot_storage',
    displayName: '야영지 보관함',
    description: '대형 궤짝 · 장비 및 원자재 적재',
    facilityId: 'storage',
    requiredLevel: 0,
    x: 74,
    y: 55,
    icon: '📦',
    buttonLabel: '야영지 보관함',
    subLabel: '아이템 및 자원 보관',
    actionType: 'STORAGE',
    badgeLabel: '자원 적재',
    interactionEffect: 'box',
  },
  {
    id: 'hotspot_rest',
    displayName: '플레이어 휴식 공간',
    description: '천막 · 모닥불 깊은 수면 및 완치',
    facilityId: 'tent',
    requiredLevel: 0,
    x: 10,
    y: 22,
    icon: '⛺',
    buttonLabel: '휴식 공간',
    subLabel: '휴식 · 수면 · 완치',
    actionType: 'REST',
    badgeLabel: '휴식 & 수면',
    interactionEffect: 'glow',
  },
  {
    id: 'hotspot_companion',
    displayName: '동반자 쉼터',
    description: '동료 유대 강화 · 과업 부여',
    requiredLevel: 0,
    x: 10,
    y: 82,
    icon: '👥',
    buttonLabel: '동반자 쉼터',
    subLabel: '동료 대화 · 과업 배치',
    actionType: 'COMPANION',
    badgeLabel: '동반자',
    interactionEffect: 'glow',
  },
];
