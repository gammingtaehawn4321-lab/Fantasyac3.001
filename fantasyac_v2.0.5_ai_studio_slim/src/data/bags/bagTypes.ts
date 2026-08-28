// ==========================================
// 가방 (Bags) 및 소지 무게 / 과적 시스템 타입 정의
// ==========================================

export type BagType =
  | 'POUCH'       // 소형 주머니 (가벼움, 소형 운반)
  | 'TRAVEL'      // 여행자 배낭 (균형형)
  | 'GATHERER'    // 채집가 배낭 (채집/재료 보너스)
  | 'MERCHANT'    // 상인 가방 (루피/전리품/거래 보너스)
  | 'MILITARY'    // 군용 배낭 (고용량, 전투 소비품 보너스)
  | 'ALCHEMY'     // 연금술 가방 (포션/시약 보너스)
  | 'MAGIC';      // 마법 가방 (초고용량, 아공간/특수효과)

export const BAG_TYPE_KOREAN: Record<BagType, string> = {
  POUCH: '소형 주머니',
  TRAVEL: '여행자 배낭',
  GATHERER: '채집가 배낭',
  MERCHANT: '상인 가방',
  MILITARY: '군용 배낭',
  ALCHEMY: '연금술 가방',
  MAGIC: '마법 가방',
};

export type BagRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export const BAG_RARITY_KOREAN: Record<BagRarity, string> = {
  COMMON: '일반',
  UNCOMMON: '고급',
  RARE: '희귀',
  EPIC: '영웅',
  LEGENDARY: '전설',
};

export interface BagDefinition {
  id: string;
  name: string;
  bagType: BagType;
  rarity: BagRarity;
  weight: number;             // 가방 자체 무게 (kg)
  bonusCarryWeight: number;   // 추가 운반 용량 한도 (kg)
  specialEffectIds: string[]; // 특수 효과 ID 목록
  description: string;
  flavorText?: string;
  illustrationUrl?: string;
  buyPrice: number;
  sellPrice: number;
  effectDescription?: string; // 한국어 특수효과 설명
}

export type EncumbranceLevel = 'NORMAL' | 'ENCUMBERED_1' | 'ENCUMBERED_2' | 'OVERLOADED';

export interface EncumbranceState {
  level: EncumbranceLevel;
  ratio: number;                  // currentWeight / maxCarryWeight (e.g. 0.75, 1.12, 1.60)
  label: string;                  // '정상', '과적 I', '과적 II', '심각한 과적'
  speedPenaltyPercent: number;    // 행동 속도 감소율 (%) (0, 5, 15, 30)
  evasionPenaltyPercent: number;  // 회피율 감소율 (%) (0, 0, 10, 20)
  escapePenaltyPercent: number;   // 도주 성공률 패널티 (%) (0, 10, 25, 50)
  canLootNormalItems: boolean;    // 일반 전리품/아이템 추가 획득 가능 여부
  badgeClass: string;             // Tailwind 배지 색상 클래스
  description: string;            // 상세 상태 설명
}
