import { TechnologyDefinition, TechId, TechnologyState } from './technologyTypes';

export const TECHNOLOGY_DATABASE: Record<TechId, TechnologyDefinition> = {
  // ==========================================
  // 전문기술 (Specialized Skills - 5종)
  // ==========================================

  // 1. 대장기술 (SMITHING)
  SMITHING: {
    id: 'SMITHING',
    name: '대장기술',
    kind: 'SPECIALIZED',
    category: 'LIFE',
    description: '풀무불과 모루 위에서 금속을 단조하여 전사들의 무기, 판금 갑옷, 대형 방패를 정밀 제련하는 기술입니다.',
    iconSymbol: '🔨',
    associatedFacilityId: 'anvil',
    primaryStatBonus: '근력, 체력',
    branches: [
      { id: 'smith_weapon', name: '무기단조', description: '검, 도끼, 창 등 근접 및 둔기 무기단조 전문화', iconSymbol: '⚔️' },
      { id: 'smith_armor', name: '방어구단조', description: '중갑 판금, 사슬 갑옷, 대형 방패 제련 전문화', iconSymbol: '🛡️' },
      { id: 'smith_precision', name: '정밀단조', description: '명품(Masterwork) 제작, 내구도 및 합금 제련 연마', iconSymbol: '⚙️' },
    ],
    perks: [
      { id: 'smithing_perk_lv10', requiredLevel: 10, name: '담금질 기본', description: '단조 시 기본 완성도 보너스가 +10% 상승합니다.', effectSummary: '기본 단조 완성도 +10%' },
      { id: 'smithing_perk_lv20', requiredLevel: 20, name: '숙련자의 불길', description: '강철 제품 제련 시 금속 주괴 소모가 10% 절감됩니다.', effectSummary: '주괴 소모 절감 10%' },
      { id: 'smithing_perk_lv40', requiredLevel: 40, name: '명품 단조 기법', description: '모든 무기/갑옷 제작 시 명품(Masterwork) 출현 확률이 15% 상승합니다.', effectSummary: '명품 확률 +15%' },
      { id: 'smithing_perk_lv60', requiredLevel: 60, name: '열처리 마스터', description: '제작 장비의 내구도 상한이 25% 향상됩니다.', effectSummary: '제작 장비 내구도 +25%' },
      { id: 'smithing_perk_lv80', requiredLevel: 80, name: '미스릴 & 오리하르콘 합금', description: '최고급 신화 금속 합금을 제련할 수 있게 됩니다.', effectSummary: '신화 합금 제련 해금' },
      { id: 'smithing_perk_lv100', requiredLevel: 100, name: '대장 장인의 가호', description: '단조 성공률 100% 보장 및 명품 수식어 부여 확률이 극대화됩니다.', effectSummary: '단조 대가 권능' },
    ],
    treeNodes: [
      // 계통 1: 무기단조
      { id: 'smith_w1', branchId: 'smith_weapon', branchName: '무기단조', tier: 1, requiredLevel: 5, maxRank: 3, name: '예리한 날갈기', description: '제작 무기의 물리 공격력을 연마합니다.', statOrBonusEffect: '제작 무기 공 +3 (랭크당)' },
      { id: 'smith_w2', branchId: 'smith_weapon', branchName: '무기단조', tier: 2, requiredLevel: 20, requiredNodeId: 'smith_w1', maxRank: 3, name: '중량 균형', description: '무기 무게를 조율하여 공격 속도 보정을 제공합니다.', statOrBonusEffect: '무기 명중 +2 (랭크당)' },
      { id: 'smith_w3', branchId: 'smith_weapon', branchName: '무기단조', tier: 3, requiredLevel: 35, requiredNodeId: 'smith_w2', maxRank: 3, name: '강철 단검 & 장검', description: '고급 근접 무기단조 전문화.', statOrBonusEffect: '무기 치명타율 +1.5% (랭크당)' },
      { id: 'smith_w4', branchId: 'smith_weapon', branchName: '무기단조', tier: 4, requiredLevel: 50, requiredNodeId: 'smith_w3', maxRank: 3, name: '파쇄용 둔기 단조', description: '방어 관통 무기단조 전문화.', statOrBonusEffect: '방어 관통 +4 (랭크당)' },
      { id: 'smith_w5', branchId: 'smith_weapon', branchName: '무기단조', tier: 5, requiredLevel: 70, requiredNodeId: 'smith_w4', maxRank: 3, name: '전설적 대검 연마', description: '양손 대검 및 장창 명품율 연마.', statOrBonusEffect: '무기 명품 확률 +5% (랭크당)' },
      { id: 'smith_w6', branchId: 'smith_weapon', branchName: '무기단조', tier: 6, requiredLevel: 90, requiredNodeId: 'smith_w5', maxRank: 1, name: '주신(主神)의 벼림', description: '최종 무기단조 웅장 수식어 각인.', statOrBonusEffect: '제작 무기 최종 데미지 +10%' },

      // 계통 2: 방어구단조
      { id: 'smith_a1', branchId: 'smith_armor', branchName: '방어구단조', tier: 1, requiredLevel: 5, maxRank: 3, name: '두꺼운 판금', description: '제작 판금 갑옷의 물리 방어력을 올립니다.', statOrBonusEffect: '갑옷 방어 +4 (랭크당)' },
      { id: 'smith_a2', branchId: 'smith_armor', branchName: '방어구단조', tier: 2, requiredLevel: 20, requiredNodeId: 'smith_a1', maxRank: 3, name: '충격 흡수 리벳', description: '판금 구조를 강화하여 피해 감소를 제공합니다.', statOrBonusEffect: '피해 감소 +2 (랭크당)' },
      { id: 'smith_a3', branchId: 'smith_armor', branchName: '방어구단조', tier: 3, requiredLevel: 35, requiredNodeId: 'smith_a2', maxRank: 3, name: '기사 방패 단조', description: '대형 방패 막기 확률 보정.', statOrBonusEffect: '방패 막기 +2% (랭크당)' },
      { id: 'smith_a4', branchId: 'smith_armor', branchName: '방어구단조', tier: 4, requiredLevel: 50, requiredNodeId: 'smith_a3', maxRank: 3, name: '사슬 & 링 메일', description: '유연한 사슬 방어구 제작 전문화.', statOrBonusEffect: '최대 체력 +25 (랭크당)' },
      { id: 'smith_a5', branchId: 'smith_armor', branchName: '방어구단조', tier: 5, requiredLevel: 70, requiredNodeId: 'smith_a4', maxRank: 3, name: '용비늘 중갑 벼림', description: '용비늘 판금 제작 효율 극대화.', statOrBonusEffect: '화염/내성 저항 +10 (랭크당)' },
      { id: 'smith_a6', branchId: 'smith_armor', branchName: '방어구단조', tier: 6, requiredLevel: 90, requiredNodeId: 'smith_a5', maxRank: 1, name: '불멸의 메탈 심장', description: '최종 방어구 마스터 오라.', statOrBonusEffect: '제작 방어구 착용 시 받은 피해 8% 반사' },

      // 계통 3: 정밀단조
      { id: 'smith_p1', branchId: 'smith_precision', branchName: '정밀단조', tier: 1, requiredLevel: 5, maxRank: 3, name: '연마석 절단', description: '단조 수율 및 기본 경험치 보너스.', statOrBonusEffect: '대장 EXP 획득 +5% (랭크당)' },
      { id: 'smith_p2', branchId: 'smith_precision', branchName: '정밀단조', tier: 2, requiredLevel: 20, requiredNodeId: 'smith_p1', maxRank: 3, name: '재료 재활용', description: '단조 시 소모 주괴 재활용 확률.', statOrBonusEffect: '재료 회수율 +4% (랭크당)' },
      { id: 'smith_p3', branchId: 'smith_precision', branchName: '정밀단조', tier: 3, requiredLevel: 35, requiredNodeId: 'smith_p2', maxRank: 3, name: '모루의 미학', description: '명품 완성품 가격 상승.', statOrBonusEffect: '제작품 판매가 +10% (랭크당)' },
      { id: 'smith_p4', branchId: 'smith_precision', branchName: '정밀단조', tier: 4, requiredLevel: 50, requiredNodeId: 'smith_p3', maxRank: 3, name: '합금 정제술', description: '특수 룬 합금 제련 속도 감축.', statOrBonusEffect: '단조 시간 -10% (랭크당)' },
      { id: 'smith_p5', branchId: 'smith_precision', branchName: '정밀단조', tier: 5, requiredLevel: 70, requiredNodeId: 'smith_p4', maxRank: 3, name: '정밀 룬 소켓', description: '제작 무기에 소켓을 추가 생성할 확률.', statOrBonusEffect: '보석 소켓 생성률 +10% (랭크당)' },
      { id: 'smith_p6', branchId: 'smith_precision', branchName: '정밀단조', tier: 6, requiredLevel: 90, requiredNodeId: 'smith_p5', maxRank: 1, name: '신화의 모루 기적', description: '모든 단조 행동 시 5% 확률로 재료 미소모.', statOrBonusEffect: '단조 자원 소모 무효화 5%' },
    ],
    unlockablesSummary: ['수련생의 강철검', '기사의 철제 원형 방패', '강철 판금 흉갑', '용비늘 중갑 판금'],
  },

  // 2. 가죽세공 (LEATHERWORKING)
  LEATHERWORKING: {
    id: 'LEATHERWORKING',
    name: '가죽세공',
    kind: 'SPECIALIZED',
    category: 'LIFE',
    description: '야생 마수의 가죽을 무두질하고 재단하여 도적과 궁수를 위한 경갑, 가죽 장갑, 유연한 구두를 만드는 기술입니다.',
    iconSymbol: '👞',
    associatedFacilityId: 'leather_bench',
    primaryStatBonus: '민첩, 유연성',
    branches: [
      { id: 'leather_armor', name: '경갑제작', description: '가죽 흉갑, 투구, 신발 등 민첩성 장비 제작 전문화', iconSymbol: '🥋' },
      { id: 'leather_utility', name: '실용세공', description: '가방, 보관낭, 가죽 끈, 방수 구두 제작 전문화', iconSymbol: '🎒' },
      { id: 'leather_tanning', name: '무두질', description: '원피 정제, 무두질 수율 및 고급 가죽 가공 전문화', iconSymbol: '🪵' },
    ],
    perks: [
      { id: 'leather_perk_lv10', requiredLevel: 10, name: '재단사의 손길', description: '가죽 재단 시 완성도가 10% 증가합니다.', effectSummary: '가죽 완성도 +10%' },
      { id: 'leather_perk_lv20', requiredLevel: 20, name: '무두질 기본', description: '원피 가공 시 고급 가죽 획득 수량이 +1 증가합니다.', effectSummary: '가죽 가공 수량 +1' },
      { id: 'leather_perk_lv40', requiredLevel: 40, name: '경량 패턴', description: '제작된 가죽 장비 착용 시 민첩이 +3 상승합니다.', effectSummary: '착용 민첩 +3' },
      { id: 'leather_perk_lv60', requiredLevel: 60, name: '마수 가죽 덧대기', description: '가죽 흉갑 및 투구에 추가 마법 방어력을 부여합니다.', effectSummary: '마법 방어 +8' },
      { id: 'leather_perk_lv80', requiredLevel: 80, name: '심연 마수 세공법', description: '심연 마수의 전설 가죽을 세공할 수 있습니다.', effectSummary: '전설 가죽 세공 개방' },
      { id: 'leather_perk_lv100', requiredLevel: 100, name: '바람의 가죽 마스터', description: '모든 가죽 장비 회피율과 이동속도 보너스가 극대화됩니다.', effectSummary: '가죽세공 대가 권능' },
    ],
    treeNodes: [
      // 경갑제작
      { id: 'l_a1', branchId: 'leather_armor', branchName: '경갑제작', tier: 1, requiredLevel: 5, maxRank: 3, name: '유연한 재단', description: '제작 가죽 장비 회피율 보정.', statOrBonusEffect: '회피율 +1% (랭크당)' },
      { id: 'l_a2', branchId: 'leather_armor', branchName: '경갑제작', tier: 2, requiredLevel: 20, requiredNodeId: 'l_a1', maxRank: 3, name: '신속의 장화', description: '가죽 장화 제작 시 이동 속도 증가.', statOrBonusEffect: '이동 속도 +2% (랭크당)' },
      { id: 'l_a3', branchId: 'leather_armor', branchName: '경갑제작', tier: 3, requiredLevel: 35, requiredNodeId: 'l_a2', maxRank: 3, name: '그림자 덧대기', description: '은신 및 암습 데미지 강화 보정.', statOrBonusEffect: '암습 피해 +4% (랭크당)' },
      { id: 'l_a4', branchId: 'leather_armor', branchName: '경갑제작', tier: 4, requiredLevel: 50, requiredNodeId: 'l_a3', maxRank: 3, name: '마수 가치재', description: '마갑 물리 방어력 강화.', statOrBonusEffect: '물리 방어 +3 (랭크당)' },
      { id: 'l_a5', branchId: 'leather_armor', branchName: '경갑제작', tier: 5, requiredLevel: 70, requiredNodeId: 'l_a4', maxRank: 3, name: '드래곤 하이드 세공', description: '드래곤 가죽 장비 제작.', statOrBonusEffect: '모든 속도 +3% (랭크당)' },
      { id: 'l_a6', branchId: 'leather_armor', branchName: '경갑제작', tier: 6, requiredLevel: 90, requiredNodeId: 'l_a5', maxRank: 1, name: '바람의 질주 오라', description: '제작 가죽 착용 시 항상 치명타율 +5%.', statOrBonusEffect: '치명타율 +5%' },

      // 실용세공
      { id: 'l_u1', branchId: 'leather_utility', branchName: '실용세공', tier: 1, requiredLevel: 5, maxRank: 3, name: '가죽 주머니 확장', description: '가방 용량 제작 효율성.', statOrBonusEffect: '인벤토리 무게 슬롯 +2 (랭크당)' },
      { id: 'l_u2', branchId: 'leather_utility', branchName: '실용세공', tier: 2, requiredLevel: 20, requiredNodeId: 'l_u1', maxRank: 3, name: '물통 & 벨트 제작', description: '야영 물품 세공 보너스.', statOrBonusEffect: '야영 스태미나 소비 -5% (랭크당)' },
      { id: 'l_u3', branchId: 'leather_utility', branchName: '실용세공', tier: 3, requiredLevel: 35, requiredNodeId: 'l_u2', maxRank: 3, name: '강화 가죽 보관낭', description: '야영지 보관함 슬롯 확장.', statOrBonusEffect: '야영 용량 +10kg (랭크당)' },
      { id: 'l_u4', branchId: 'leather_utility', branchName: '실용세공', tier: 4, requiredLevel: 50, requiredNodeId: 'l_u3', maxRank: 3, name: '방수 가공 기법', description: '비/눈 날씨 이동 제약 감소.', statOrBonusEffect: '날씨 페널티 무효화 +10% (랭크당)' },
      { id: 'l_u5', branchId: 'leather_utility', branchName: '실용세공', tier: 5, requiredLevel: 70, requiredNodeId: 'l_u4', maxRank: 3, name: '마법 전사 세공 주머니', description: '포션/비약 소지 한도 확장.', statOrBonusEffect: '포션 최대 중첩 +3 (랭크당)' },
      { id: 'l_u6', branchId: 'leather_utility', branchName: '실용세공', tier: 6, requiredLevel: 90, requiredNodeId: 'l_u5', maxRank: 1, name: '차원 가죽 낭 마스터', description: '최대 소지 무게 +50kg.', statOrBonusEffect: '소지 소지량 +50kg' },

      // 무두질
      { id: 'l_t1', branchId: 'leather_tanning', branchName: '무두질', tier: 1, requiredLevel: 5, maxRank: 3, name: '원피 손질 속도', description: '가공 시간 단축.', statOrBonusEffect: '무두질 속도 +10% (랭크당)' },
      { id: 'l_t2', branchId: 'leather_tanning', branchName: '무두질', tier: 2, requiredLevel: 20, requiredNodeId: 'l_t1', maxRank: 3, name: '소금 연마제 배합', description: '가죽 수율 향상.', statOrBonusEffect: '가죽 생산량 +15% (랭크당)' },
      { id: 'l_t3', branchId: 'leather_tanning', branchName: '무두질', tier: 3, requiredLevel: 35, requiredNodeId: 'l_t2', maxRank: 3, name: '희귀 무두유 추출', description: '희귀 원피 무두질 성공률.', statOrBonusEffect: '희귀 무두질 +10% (랭크당)' },
      { id: 'l_t4', branchId: 'leather_tanning', branchName: '무두질', tier: 4, requiredLevel: 50, requiredNodeId: 'l_t3', maxRank: 3, name: '열과 염색의 조합', description: '명품 가죽 품질 보정.', statOrBonusEffect: '명품 가죽 출현율 +8% (랭크당)' },
      { id: 'l_t5', branchId: 'leather_tanning', branchName: '무두질', tier: 5, requiredLevel: 70, requiredNodeId: 'l_t4', maxRank: 3, name: '고대 마수 가공', description: '고대 원피 대량 가공.', statOrBonusEffect: 'EXP 획득 +10% (랭크당)' },
      { id: 'l_t6', branchId: 'leather_tanning', branchName: '무두질', tier: 6, requiredLevel: 90, requiredNodeId: 'l_t5', maxRank: 1, name: '신화 가죽 장인의 염원', description: '무두질 시 10% 확률로 명품 가죽 추가 획득.', statOrBonusEffect: '명품 가죽 추가 +10%' },
    ],
    unlockablesSummary: ['정찰병의 질긴 가죽 조끼', '신속의 가죽 장화', '그림자 닌자 가죽갑'],
  },

  // 3. 연금술 (ALCHEMY)
  ALCHEMY: {
    id: 'ALCHEMY',
    name: '연금술',
    kind: 'SPECIALIZED',
    category: 'LIFE',
    description: '약초, 마나석, 영혼의 정수를 배합하여 전투용 비약과 비전투용 물약을 조제하고 재료를 정제하는 기술입니다.',
    iconSymbol: '⚗️',
    associatedFacilityId: 'alchemy_bench',
    primaryStatBonus: '지능, 행운',
    branches: [
      { id: 'alc_elixir', name: '비약학', description: '전투용 비약(Elixirs 19종) 능력치 증폭 및 효과 연장 전문화', iconSymbol: '⚔️' },
      { id: 'alc_pharmacy', name: '약제학', description: '비전투용 물약(Potions 16종) 체력/마나/정신력 회복 전문화', iconSymbol: '🧪' },
      { id: 'alc_refining', name: '정제학', description: '이슬 정제, 마나석 분쇄, 촉매 및 소재 수율 전문화', iconSymbol: '🌿' },
    ],
    perks: [
      { id: 'alchemy_perk_lv10', requiredLevel: 10, name: '기초 증류법', description: '하급 물약 및 기본 비약 조제법을 자유롭게 다룹니다.', effectSummary: '기초 물약/비약 해금' },
      { id: 'alchemy_perk_lv20', requiredLevel: 20, name: '포션 농축학', description: '물약 조제 시 20% 확률로 1병 추가 조제됩니다.', effectSummary: '추가 조제 확률 20%' },
      { id: 'alchemy_perk_lv40', requiredLevel: 40, name: '비약의 연금사', description: '전투용 비약의 지속시간과 효과 수치가 25% 상승합니다.', effectSummary: '비약 위력 +25%' },
      { id: 'alchemy_perk_lv60', requiredLevel: 60, name: '기적의 촉매', description: '부활의 비약 및 최고급 전설 비약을 조제할 수 있게 됩니다.', effectSummary: '전설 비약 조제 해금' },
      { id: 'alchemy_perk_lv80', requiredLevel: 80, name: '현자의 돌 비전', description: '모든 연금술 재료 소모량이 30% 감축됩니다.', effectSummary: '연금 재료 소모 -30%' },
      { id: 'alchemy_perk_lv100', requiredLevel: 100, name: '불멸 연금의 대가', description: '물약 복용 후 즉시 마나 회복 및 모든 비약 효과가 극대화됩니다.', effectSummary: '연금술 대가 권능' },
    ],
    treeNodes: [
      // 비약학
      { id: 'alc_e1', branchId: 'alc_elixir', branchName: '비약학', tier: 1, requiredLevel: 5, maxRank: 3, name: '비약 위력 강화', description: '전투용 비약 능력치 향상.', statOrBonusEffect: '비약 능력치 +4% (랭크당)' },
      { id: 'alc_e2', branchId: 'alc_elixir', branchName: '비약학', tier: 2, requiredLevel: 20, requiredNodeId: 'alc_e1', maxRank: 3, name: '지속시간 확장', description: '비약 버프 시간 연장.', statOrBonusEffect: '비약 지속시간 +15% (랭크당)' },
      { id: 'alc_e3', branchId: 'alc_elixir', branchName: '비약학', tier: 3, requiredLevel: 35, requiredNodeId: 'alc_e2', maxRank: 3, name: '속성 저항 비약', description: '원소 저항 비약 효능 증폭.', statOrBonusEffect: '속성 저항 +5 (랭크당)' },
      { id: 'alc_e4', branchId: 'alc_elixir', branchName: '비약학', tier: 4, requiredLevel: 50, requiredNodeId: 'alc_e3', maxRank: 3, name: '광폭의 비약 배합', description: '공격력/치명타 비약 강화.', statOrBonusEffect: '비약 치명타율 +2% (랭크당)' },
      { id: 'alc_e5', branchId: 'alc_elixir', branchName: '비약학', tier: 5, requiredLevel: 70, requiredNodeId: 'alc_e4', maxRank: 3, name: '전설 비약 연구', description: '영웅/전설 비약 성공률.', statOrBonusEffect: '전설 비약 성공 +10% (랭크당)' },
      { id: 'alc_e6', branchId: 'alc_elixir', branchName: '비약학', tier: 6, requiredLevel: 90, requiredNodeId: 'alc_e5', maxRank: 1, name: '두 번째 생명의 비약', description: '치명상 시 비약이 자동 발동하여 HP 30% 회복.', statOrBonusEffect: '치명상 수호 자동 발동' },

      // 약제학
      { id: 'alc_ph1', branchId: 'alc_pharmacy', branchName: '약제학', tier: 1, requiredLevel: 5, maxRank: 3, name: '기초 회복 증폭', description: 'HP/MP 회복량 증폭.', statOrBonusEffect: '회복량 +6% (랭크당)' },
      { id: 'alc_ph2', branchId: 'alc_pharmacy', branchName: '약제학', tier: 2, requiredLevel: 20, requiredNodeId: 'alc_ph1', maxRank: 3, name: '해독 & 중화학', description: '상태이상 해제 물약 수수료 절감.', statOrBonusEffect: '상태이상 해제 물약 수율 +10% (랭크당)' },
      { id: 'alc_ph3', branchId: 'alc_pharmacy', branchName: '약제학', tier: 3, requiredLevel: 35, requiredNodeId: 'alc_ph2', maxRank: 3, name: '정신력 감각 회복', description: '정신력(SAN) 회복 물약 효과 강화.', statOrBonusEffect: '정신력 회복 +10 (랭크당)' },
      { id: 'alc_ph4', branchId: 'alc_pharmacy', branchName: '약제학', tier: 4, requiredLevel: 50, requiredNodeId: 'alc_ph3', maxRank: 3, name: '광역 투척 물약', description: '파티 회복 물약 조제법.', statOrBonusEffect: '광역 물약 회복 +8% (랭크당)' },
      { id: 'alc_ph5', branchId: 'alc_pharmacy', branchName: '약제학', tier: 5, requiredLevel: 70, requiredNodeId: 'alc_ph4', maxRank: 3, name: '엘릭서 농축 추출', description: '최고급 복합 엘릭서 조제.', statOrBonusEffect: '추가 대량 생산 +15% (랭크당)' },
      { id: 'alc_ph6', branchId: 'alc_pharmacy', branchName: '약제학', tier: 6, requiredLevel: 90, requiredNodeId: 'alc_ph5', maxRank: 1, name: '생명샘의 물약 권능', description: '물약 사용 시 쿨타임 50% 감소.', statOrBonusEffect: '물약 쿨타임 -50%' },

      // 정제학
      { id: 'alc_r1', branchId: 'alc_refining', branchName: '정제학', tier: 1, requiredLevel: 5, maxRank: 3, name: '약초 증류 기법', description: '맑은 이슬 정제 수율 상승.', statOrBonusEffect: '정제 생산량 +10% (랭크당)' },
      { id: 'alc_r2', branchId: 'alc_refining', branchName: '정제학', tier: 2, requiredLevel: 20, requiredNodeId: 'alc_r1', maxRank: 3, name: '마나석 연마 기술', description: '마나석 파편 정제 경험치 보너스.', statOrBonusEffect: '정제 EXP +10% (랭크당)' },
      { id: 'alc_r3', branchId: 'alc_refining', branchName: '정제학', tier: 3, requiredLevel: 35, requiredNodeId: 'alc_r2', maxRank: 3, name: '촉매 순도 상향', description: '연금 시 촉매 소모량 절감.', statOrBonusEffect: '촉매 소모 -8% (랭크당)' },
      { id: 'alc_r4', branchId: 'alc_refining', branchName: '정제학', tier: 4, requiredLevel: 50, requiredNodeId: 'alc_r3', maxRank: 3, name: '고대 정석 추출', description: '고급 원소 정석 추출 성공률.', statOrBonusEffect: '원소 정석 추출 +12% (랭크당)' },
      { id: 'alc_r5', branchId: 'alc_refining', branchName: '정제학', tier: 5, requiredLevel: 70, requiredNodeId: 'alc_r4', maxRank: 3, name: '용매 순환 가공', description: '정제 부산물 환원 확률.', statOrBonusEffect: '부산물 재료 환원 +10% (랭크당)' },
      { id: 'alc_r6', branchId: 'alc_refining', branchName: '정제학', tier: 6, requiredLevel: 90, requiredNodeId: 'alc_r5', maxRank: 1, name: '현자의 정제 촉매', description: '정제 작업 시 15% 확률로 대성공(3배 생산).', statOrBonusEffect: '정제 3배 대성공 15%' },
    ],
    unlockablesSummary: ['전투용 비약 19종', '비전투용 물약 16종', '재료 정제공정'],
  },

  // 4. 요리 (COOKING)
  COOKING: {
    id: 'COOKING',
    name: '요리',
    kind: 'SPECIALIZED',
    category: 'LIFE',
    description: '야생에서 획득한 고기, 수산물, 식생 및 향신료로 파티의 사기와 활력을 북돋우는 음식을 조리하는 기술입니다.',
    iconSymbol: '🍲',
    associatedFacilityId: 'cook_stove',
    primaryStatBonus: '정신, 행운',
    branches: [
      { id: 'cook_culinary', name: '조리술', description: '만찬, 스테이크, 회복식 요리 능력치 버프 전문화', iconSymbol: '🍳' },
      { id: 'cook_field', name: '야전식', description: '모닥불 야영 스튜, 허브차, 야간 체력/정신력 회복 전문화', iconSymbol: '🏕️' },
      { id: 'cook_preserved', name: '보존식', description: '육포, 훈제어, 전투 식량 및 보존 기간 확장 전문화', iconSymbol: '🥓' },
    ],
    perks: [
      { id: 'cooking_perk_lv10', requiredLevel: 10, name: '모닥불 조리법', description: '기본적인 허브차와 모닥불 야영 스튜를 조리합니다.', effectSummary: '기초 요리 해금' },
      { id: 'cooking_perk_lv20', requiredLevel: 20, name: '손질의 손길', description: '요리 조리 시 식재료 소모량이 15% 감소합니다.', effectSummary: '식재료 절감 15%' },
      { id: 'cooking_perk_lv40', requiredLevel: 40, name: '풍미 만발', description: '음식 버프 효과 지속시간이 50% 연장됩니다.', effectSummary: '음식 버프 시간 +50%' },
      { id: 'cooking_perk_lv60', requiredLevel: 60, name: '만찬의 대가', description: '파티 전원의 전반적 스탯을 대폭 올리는 웅장한 만찬을 만듭니다.', effectSummary: '웅장 만찬 개방' },
      { id: 'cooking_perk_lv80', requiredLevel: 80, name: '미식가의 가호', description: '음식 섭취 시 경험치 획득량 +15% 버프를 추가 부여합니다.', effectSummary: 'EXP +15% 버프 부여' },
      { id: 'cooking_perk_lv100', requiredLevel: 100, name: '전설의 셰프', description: '조리하는 모든 음식에 전설 수식어가 부여되어 스탯이 극대화됩니다.', effectSummary: '요리 대가 권능' },
    ],
    treeNodes: [
      // 조리술
      { id: 'ck_c1', branchId: 'cook_culinary', branchName: '조리술', tier: 1, requiredLevel: 5, maxRank: 3, name: '불조절 기술', description: '요리 버프 수치 강화.', statOrBonusEffect: '음식 버프 스탯 +2 (랭크당)' },
      { id: 'ck_c2', branchId: 'cook_culinary', branchName: '조리술', tier: 2, requiredLevel: 20, requiredNodeId: 'ck_c1', maxRank: 3, name: '향신료 배합', description: '정신력 회복 효과.', statOrBonusEffect: '음식 정신력 회복 +8 (랭크당)' },
      { id: 'ck_c3', branchId: 'cook_culinary', branchName: '조리술', tier: 3, requiredLevel: 35, requiredNodeId: 'ck_c2', maxRank: 3, name: '고기 스테이크 마스터', description: '근력/체력 버프 음식 강화.', statOrBonusEffect: '근력/체력 버프 +3 (랭크당)' },
      { id: 'ck_c4', branchId: 'cook_culinary', branchName: '조리술', tier: 4, requiredLevel: 50, requiredNodeId: 'ck_c3', maxRank: 3, name: '해산물 찜 조리', description: '지능/마나 회복 음식 강화.', statOrBonusEffect: '지능/마나 버프 +3 (랭크당)' },
      { id: 'ck_c5', branchId: 'cook_culinary', branchName: '조리술', tier: 5, requiredLevel: 70, requiredNodeId: 'ck_c4', maxRank: 3, name: '왕실 궁중 요리', description: '만찬 요리 완성도 상승.', statOrBonusEffect: '만찬 효과 +15% (랭크당)' },
      { id: 'ck_c6', branchId: 'cook_culinary', branchName: '조리술', tier: 6, requiredLevel: 90, requiredNodeId: 'ck_c5', maxRank: 1, name: '신성한 셰프의 식탁', description: '만찬 먹은 직후 모든 쿨타임 초기화.', statOrBonusEffect: '만찬 시 쿨타임 리셋' },

      // 야전식
      { id: 'ck_f1', branchId: 'cook_field', branchName: '야전식', tier: 1, requiredLevel: 5, maxRank: 3, name: '야영 스튜 배합', description: '야영지에서 스튜 효과 증가.', statOrBonusEffect: '스튜 체력 회복 +10% (랭크당)' },
      { id: 'ck_f2', branchId: 'cook_field', branchName: '야전식', tier: 2, requiredLevel: 20, requiredNodeId: 'ck_f1', maxRank: 3, name: '따뜻한 허브차', description: '휴식 중 스태미나 회복 속도.', statOrBonusEffect: '야영 스태미나 회복 +15% (랭크당)' },
      { id: 'ck_f3', branchId: 'cook_field', branchName: '야전식', tier: 3, requiredLevel: 35, requiredNodeId: 'ck_f2', maxRank: 3, name: '추위/열기 저항 요리', description: '환경 가혹도 감소.', statOrBonusEffect: '환경 디버프 저항 +10% (랭크당)' },
      { id: 'ck_f4', branchId: 'cook_field', branchName: '야전식', tier: 4, requiredLevel: 50, requiredNodeId: 'ck_f3', maxRank: 3, name: '야간 긴급 전투식량', description: '전투 중 섭취 가능 요리.', statOrBonusEffect: '전투 요리 섭취 가능' },
      { id: 'ck_f5', branchId: 'cook_field', branchName: '야전식', tier: 5, requiredLevel: 70, requiredNodeId: 'ck_f4', maxRank: 3, name: '동료 나눔 조리', description: '동료 호감도 상승 효과.', statOrBonusEffect: '동료 호감도 획득 +20% (랭크당)' },
      { id: 'ck_f6', branchId: 'cook_field', branchName: '야전식', tier: 6, requiredLevel: 90, requiredNodeId: 'ck_f5', maxRank: 1, name: '불멸의 야영 만찬', description: '야영 휴식 시 전원 디버프 완전 치유.', statOrBonusEffect: '휴식 시 디버프 올 클리어' },

      // 보존식
      { id: 'ck_p1', branchId: 'cook_preserved', branchName: '보존식', tier: 1, requiredLevel: 5, maxRank: 3, name: '소금 염장법', description: '음식 부패 방지 및 수량 향상.', statOrBonusEffect: '보존 음식 중첩 +5 (랭크당)' },
      { id: 'ck_p2', branchId: 'cook_preserved', branchName: '보존식', tier: 2, requiredLevel: 20, requiredNodeId: 'ck_p1', maxRank: 3, name: '육포 훈제', description: '육포 제작 수수료 감축.', statOrBonusEffect: '육포 가공 수율 +15% (랭크당)' },
      { id: 'ck_p3', branchId: 'cook_preserved', branchName: '보존식', tier: 3, requiredLevel: 35, requiredNodeId: 'ck_p2', maxRank: 3, name: '건조 과일 & 과즙', description: '휴대용 에너지 보충식.', statOrBonusEffect: '이동 속도 +3% (랭크당)' },
      { id: 'ck_p4', branchId: 'cook_preserved', branchName: '보존식', tier: 4, requiredLevel: 50, requiredNodeId: 'ck_p3', maxRank: 3, name: '밀봉 전투 빵', description: '체력/마나 동시 회복 보존식.', statOrBonusEffect: '동시 회복량 +10% (랭크당)' },
      { id: 'ck_p5', branchId: 'cook_preserved', branchName: '보존식', tier: 5, requiredLevel: 70, requiredNodeId: 'ck_p4', maxRank: 3, name: '영구 보존 염장 고기', description: '무게 절감 보존식.', statOrBonusEffect: '보존식 무게 -20% (랭크당)' },
      { id: 'ck_p6', branchId: 'cook_preserved', branchName: '보존식', tier: 6, requiredLevel: 90, requiredNodeId: 'ck_p5', maxRank: 1, name: '비전의 만능 전투식량', description: '전투식량 사용 시 20분간 스탯 +5.', statOrBonusEffect: '20분 올스탯 +5' },
    ],
    unlockablesSummary: ['맑은 정신의 허브차', '모닥불 야영 스튜', '추후 요리 고급 레시피'],
  },

  // 5. 보석세공 (JEWELCRAFTING)
  JEWELCRAFTING: {
    id: 'JEWELCRAFTING',
    name: '보석세공',
    kind: 'SPECIALIZED',
    category: 'LIFE',
    description: '원석을 깎고 장신구 프레임에 마력 보석을 세공하여 강력한 부적과 장신구를 정밀 제작하는 기술입니다.',
    iconSymbol: '💎',
    associatedFacilityId: 'workbench',
    primaryStatBonus: '지능, 민첩',
    branches: [
      { id: 'jewel_cutting', name: '보석절삭', description: '원석 연마, 커팅, 마나 정석 순도 향상 전문화', iconSymbol: '💎' },
      { id: 'jewel_crafting', name: '장신구세공', description: '반지, 목걸이, 귀걸이 및 부적 제작 전문화', iconSymbol: '💍' },
      { id: 'jewel_appraisal', name: '정밀감정', description: '원석 감정, 마법 옵션 부여 및 소켓 인챈트 전문화', iconSymbol: '🔍' },
    ],
    perks: [
      { id: 'jewel_perk_lv10', requiredLevel: 10, name: '원석 깎기 기본', description: '채광으로 획득한 원석을 마나 정석으로 세공합니다.', effectSummary: '보석 세공 해금' },
      { id: 'jewel_perk_lv20', requiredLevel: 20, name: '정밀 렌즈 연마', description: '세공 중 원석 파손 확률이 15% 감소합니다.', effectSummary: '파손 확률 -15%' },
      { id: 'jewel_perk_lv40', requiredLevel: 40, name: '반지 & 목걸이 각인', description: '희귀 등급 장신구에 마법 옵션을 부여할 수 있게 됩니다.', effectSummary: '희귀 장신구 각인' },
      { id: 'jewel_perk_lv60', requiredLevel: 60, name: '영혼석 세공 마스터', description: '전설급 영혼 보석을 장신구에 세공하여 고유 속성을 부여합니다.', effectSummary: '전설 보석 세공' },
      { id: 'jewel_perk_lv80', requiredLevel: 80, name: '소켓 소용돌이', description: '모든 장신구의 소켓 슬롯 수량이 +1 확장됩니다.', effectSummary: '장신구 소켓 +1' },
      { id: 'jewel_perk_lv100', requiredLevel: 100, name: '광채의 세공 대가', description: '제작 장신구의 모든 마법 옵션 수치가 최대치로 극대화됩니다.', effectSummary: '보석세공 대가 권능' },
    ],
    treeNodes: [
      // 보석절삭
      { id: 'jw_ct1', branchId: 'jewel_cutting', branchName: '보석절삭', tier: 1, requiredLevel: 5, maxRank: 3, name: '원석 단면 절삭', description: '세공 성공률 보정.', statOrBonusEffect: '절삭 성공률 +4% (랭크당)' },
      { id: 'jw_ct2', branchId: 'jewel_cutting', branchName: '보석절삭', tier: 2, requiredLevel: 20, requiredNodeId: 'jw_ct1', maxRank: 3, name: '다이아몬드 연마', description: '보석 등급 상향 확률.', statOrBonusEffect: '고급 보석 출현율 +5% (랭크당)' },
      { id: 'jw_ct3', branchId: 'jewel_cutting', branchName: '보석절삭', tier: 3, requiredLevel: 35, requiredNodeId: 'jw_ct2', maxRank: 3, name: '마나 정석 정제', description: '정석 가공 수율 증가.', statOrBonusEffect: '정석 획득 수량 +1 (랭크당)' },
      { id: 'jw_ct4', branchId: 'jewel_cutting', branchName: '보석절삭', tier: 4, requiredLevel: 50, requiredNodeId: 'jw_ct3', maxRank: 3, name: '속성 정수 절삭', description: '속성 보석 마법 공격력 부여.', statOrBonusEffect: '속성 마공 +4 (랭크당)' },
      { id: 'jw_ct5', branchId: 'jewel_cutting', branchName: '보석절삭', tier: 5, requiredLevel: 70, requiredNodeId: 'jw_ct4', maxRank: 3, name: '신화 원석 세공', description: '최고급 신화 보석 가공.', statOrBonusEffect: '세공 EXP +10% (랭크당)' },
      { id: 'jw_ct6', branchId: 'jewel_cutting', branchName: '보석절삭', tier: 6, requiredLevel: 90, requiredNodeId: 'jw_ct5', maxRank: 1, name: '영원의 빛 광채', description: '절삭 보석 장착 시 마법 크리티컬 데미지 +15%.', statOrBonusEffect: '마법 크리 피해 +15%' },

      // 장신구세공
      { id: 'jw_cr1', branchId: 'jewel_crafting', branchName: '장신구세공', tier: 1, requiredLevel: 5, maxRank: 3, name: '은반지 틀 주조', description: '반지 제작 마법 방어력.', statOrBonusEffect: '반지 마방 +2 (랭크당)' },
      { id: 'jw_cr2', branchId: 'jewel_crafting', branchName: '장신구세공', tier: 2, requiredLevel: 20, requiredNodeId: 'jw_cr1', maxRank: 3, name: '금목걸이 연마', description: '목걸이 마나 보너스.', statOrBonusEffect: '최대 마나 +20 (랭크당)' },
      { id: 'jw_cr3', branchId: 'jewel_crafting', branchName: '장신구세공', tier: 3, requiredLevel: 35, requiredNodeId: 'jw_cr2', maxRank: 3, name: '정령의 귀걸이', description: '귀걸이 회피/치명 보정.', statOrBonusEffect: '치명타율 +1% (랭크당)' },
      { id: 'jw_cr4', branchId: 'jewel_crafting', branchName: '장신구세공', tier: 4, requiredLevel: 50, requiredNodeId: 'jw_cr3', maxRank: 3, name: '수호 부적 세공', description: '부적 상태이상 저항.', statOrBonusEffect: '상태이상 저항 +5 (랭크당)' },
      { id: 'jw_cr5', branchId: 'jewel_crafting', branchName: '장신구세공', tier: 5, requiredLevel: 70, requiredNodeId: 'jw_cr4', maxRank: 3, name: '영웅의 룬 펜던트', description: '모든 스탯 보너스 부여.', statOrBonusEffect: '올스탯 +1 (랭크당)' },
      { id: 'jw_cr6', branchId: 'jewel_crafting', branchName: '장신구세공', tier: 6, requiredLevel: 90, requiredNodeId: 'jw_cr5', maxRank: 1, name: '전설 세공사의 칭호', description: '장신구 3개 이상 장착 시 모든 데미지 +8%.', statOrBonusEffect: '장신구 세트 피해 +8%' },

      // 정밀감정
      { id: 'jw_ap1', branchId: 'jewel_appraisal', branchName: '정밀감정', tier: 1, requiredLevel: 5, maxRank: 3, name: '원석 돋보기 감정', description: '채광 원석 잠재력 파악.', statOrBonusEffect: '감정 성공률 +5% (랭크당)' },
      { id: 'jw_ap2', branchId: 'jewel_appraisal', branchName: '정밀감정', tier: 2, requiredLevel: 20, requiredNodeId: 'jw_ap1', maxRank: 3, name: '미식별 장신구 해독', description: '던전 장신구 옵션 감정.', statOrBonusEffect: '감정비 절감 20% (랭크당)' },
      { id: 'jw_ap3', branchId: 'jewel_appraisal', branchName: '정밀감정', tier: 3, requiredLevel: 35, requiredNodeId: 'jw_ap2', maxRank: 3, name: '마력 결함 보정', description: '세공 중 옵션 실패 방지.', statOrBonusEffect: '옵션 부여 보정 +8% (랭크당)' },
      { id: 'jw_ap4', branchId: 'jewel_appraisal', branchName: '정밀감정', tier: 4, requiredLevel: 50, requiredNodeId: 'jw_ap3', maxRank: 3, name: '소켓 마력 추출', description: '기존 장신구 보석 분리 추출.', statOrBonusEffect: '보석 회수율 +15% (랭크당)' },
      { id: 'jw_ap5', branchId: 'jewel_appraisal', branchName: '정밀감정', tier: 5, requiredLevel: 70, requiredNodeId: 'jw_ap4', maxRank: 3, name: '고대 마법 각인 감정', description: '고대 속성 해금.', statOrBonusEffect: '희귀 옵션 출현 +10% (랭크당)' },
      { id: 'jw_ap6', branchId: 'jewel_appraisal', branchName: '정밀감정', tier: 6, requiredLevel: 90, requiredNodeId: 'jw_ap5', maxRank: 1, name: '혜안의 감정안', description: '모든 아이템 감정 시 100% 최상급 옵션 확정.', statOrBonusEffect: '감정 옵션 극대화 100%' },
    ],
    unlockablesSummary: ['마력 은반지', '정령의 목걸이', '빛나는 수호 귀걸이'],
  },

  // ==========================================
  // 채집기술 (Gathering Skills - 5종)
  // ==========================================

  // 6. 벌목 (LOGGING)
  LOGGING: {
    id: 'LOGGING',
    name: '벌목',
    kind: 'GATHERING',
    category: 'LIFE',
    description: '삼림과 수목을 벌채하여 건축, 가구, 무기 제작, 연금용 나뭇가지 및 고급 목재를 수집하는 기술입니다.',
    iconSymbol: '🪓',
    primaryStatBonus: '근력, 민첩',
    branches: [
      { id: 'log_felling', name: '벌채술', description: '벌목 속도, 스태미나 절감 및 목재 획득 수량 전문화', iconSymbol: '🪓' },
      { id: 'log_appraisal', name: '수목감식', description: '희귀 수목, 세계수 가지, 마나목 탐지 전문화', iconSymbol: '🌲' },
      { id: 'log_precision', name: '정밀채취', description: '나뭇가지, 수액, 열매, 버섯 정밀 상처 무 손상 채취', iconSymbol: '🪵' },
    ],
    perks: [
      { id: 'logging_perk_lv10', requiredLevel: 10, name: '도끼질 입문', description: '벌목 시 기본 목재 획득량이 +15% 상승합니다.', effectSummary: '목재 획득 +15%' },
      { id: 'logging_perk_lv20', requiredLevel: 20, name: '벌목꾼의 근력', description: '벌목 행동 시 소모 스태미나가 20% 절감됩니다.', effectSummary: '스태미나 절감 20%' },
      { id: 'logging_perk_lv40', requiredLevel: 40, name: '희귀 수목 탐지', description: '단단한 참나무 및 마나목을 발견할 확률이 높아집니다.', effectSummary: '마나목 발견 상승' },
      { id: 'logging_perk_lv60', requiredLevel: 60, name: '세계수 나뭇가지 채취', description: '전설의 세계수 나뭇가지를 벌목 채취할 수 있습니다.', effectSummary: '세계수 가지 채취' },
      { id: 'logging_perk_lv80', requiredLevel: 80, name: '벌목 풍요의 가호', description: '벌목 시 30% 확률로 통나무가 2배 획득됩니다.', effectSummary: '2배 획득률 30%' },
      { id: 'logging_perk_lv100', requiredLevel: 100, name: '삼림의 대가', description: '모든 수목 한 번의 타격으로 완전 벌채 및 최상급 목재를 수거합니다.', effectSummary: '벌목 대가 권능' },
    ],
    treeNodes: [
      // 벌채술
      { id: 'lg_f1', branchId: 'log_felling', branchName: '벌채술', tier: 1, requiredLevel: 5, maxRank: 3, name: '도끼 스윙 속도', description: '벌목 소요 시간 단축.', statOrBonusEffect: '벌목 속도 +10% (랭크당)' },
      { id: 'lg_f2', branchId: 'log_felling', branchName: '벌채술', tier: 2, requiredLevel: 20, requiredNodeId: 'lg_f1', maxRank: 3, name: '통나무 대량 채벌', description: '기본 목재 수량 증가.', statOrBonusEffect: '목재 획득량 +15% (랭크당)' },
      { id: 'lg_f3', branchId: 'log_felling', branchName: '벌채술', tier: 3, requiredLevel: 35, requiredNodeId: 'lg_f2', maxRank: 3, name: '체력 조율 도끼질', description: '벌목 체력 소모 절감.', statOrBonusEffect: '체력 소모 -8% (랭크당)' },
      { id: 'lg_f4', branchId: 'log_felling', branchName: '벌채술', tier: 4, requiredLevel: 50, requiredNodeId: 'lg_f3', maxRank: 3, name: '강목 일격 절단', description: '단단한 나무 벌목 성공률.', statOrBonusEffect: '강목 성공률 +12% (랭크당)' },
      { id: 'lg_f5', branchId: 'log_felling', branchName: '벌채술', tier: 5, requiredLevel: 70, requiredNodeId: 'lg_f4', maxRank: 3, name: '거수 벌채 전문가', description: '거대 수목 벌채 시간 절감.', statOrBonusEffect: '벌목 EXP +10% (랭크당)' },
      { id: 'lg_f6', branchId: 'log_felling', branchName: '벌채술', tier: 6, requiredLevel: 90, requiredNodeId: 'lg_f5', maxRank: 1, name: '삼림 파괴 일격', description: '벌목 시 10% 확률로 주변 나무 동시 벌채.', statOrBonusEffect: '광역 벌채 10%' },

      // 수목감식
      { id: 'lg_a1', branchId: 'log_appraisal', branchName: '수목감식', tier: 1, requiredLevel: 5, maxRank: 3, name: '나뭇결 직관', description: '희귀 나무 탐색률.', statOrBonusEffect: '희귀목 탐색 +5% (랭크당)' },
      { id: 'lg_a2', branchId: 'log_appraisal', branchName: '수목감식', tier: 2, requiredLevel: 20, requiredNodeId: 'lg_a1', maxRank: 3, name: '수령 나이 판별', description: '오래된 고목 채물 획득.', statOrBonusEffect: '고목 채집량 +15% (랭크당)' },
      { id: 'lg_a3', branchId: 'log_appraisal', branchName: '수목감식', tier: 3, requiredLevel: 35, requiredNodeId: 'lg_a2', maxRank: 3, name: '마나 반응 나뭇결', description: '마나목 발견 및 마나 회복.', statOrBonusEffect: '마나목 채집 시 MP +10 (랭크당)' },
      { id: 'lg_a4', branchId: 'log_appraisal', branchName: '수목감식', tier: 4, requiredLevel: 50, requiredNodeId: 'lg_a3', maxRank: 3, name: '영혼목 감식', description: '영혼목 채집 성공률.', statOrBonusEffect: '영혼목 채집 +10% (랭크당)' },
      { id: 'lg_a5', branchId: 'log_appraisal', branchName: '수목감식', tier: 5, requiredLevel: 70, requiredNodeId: 'lg_a4', maxRank: 3, name: '세계수 흔적 추적', description: '세계수 나뭇가지 출현율.', statOrBonusEffect: '세계수 발견 +8% (랭크당)' },
      { id: 'lg_a6', branchId: 'log_appraisal', branchName: '수목감식', tier: 6, requiredLevel: 90, requiredNodeId: 'lg_a5', maxRank: 1, name: '정령의 수목 혜안', description: '희귀 수목 채집 시 무조건 명품 목재 확정.', statOrBonusEffect: '희귀목 명품 확정 100%' },

      // 정밀채취
      { id: 'lg_p1', branchId: 'log_precision', branchName: '정밀채취', tier: 1, requiredLevel: 5, maxRank: 3, name: '나뭇가지 온전 수거', description: '연금용 나뭇가지 추가 획득.', statOrBonusEffect: '나뭇가지 +1 (랭크당)' },
      { id: 'lg_p2', branchId: 'log_precision', branchName: '정밀채취', tier: 2, requiredLevel: 20, requiredNodeId: 'lg_p1', maxRank: 3, name: '수액 채취관 삽입', description: '수액 획득량 상승.', statOrBonusEffect: '수액 채취량 +20% (랭크당)' },
      { id: 'lg_p3', branchId: 'log_precision', branchName: '정밀채취', tier: 3, requiredLevel: 35, requiredNodeId: 'lg_p2', maxRank: 3, name: '목피 세밀 박리', description: '수목 껍질 추가 수거.', statOrBonusEffect: '수목 껍질 +1 (랭크당)' },
      { id: 'lg_p4', branchId: 'log_precision', branchName: '정밀채취', tier: 4, requiredLevel: 50, requiredNodeId: 'lg_p3', maxRank: 3, name: '고목 버섯 채취', description: '나무에 자라는 버섯/약초 발견.', statOrBonusEffect: '수목 약초 동시 획득 +10% (랭크당)' },
      { id: 'lg_p5', branchId: 'log_precision', branchName: '정밀채취', tier: 5, requiredLevel: 70, requiredNodeId: 'lg_p4', maxRank: 3, name: '정령 수액 추출', description: '정령 수액 추출 성공률.', statOrBonusEffect: '정령 수액 +15% (랭크당)' },
      { id: 'lg_p6', branchId: 'log_precision', branchName: '정밀채취', tier: 6, requiredLevel: 90, requiredNodeId: 'lg_p5', maxRank: 1, name: '자연과의 완벽 동화', description: '벌목 시 손상 무(100% 무손상 채취).', statOrBonusEffect: '벌목 무손상 100%' },
    ],
    unlockablesSummary: ['나뭇가지', '목재', '단단한 참나무', '세계수 나뭇가지'],
  },

  // 7. 채광 (MINING)
  MINING: {
    id: 'MINING',
    name: '채광',
    kind: 'GATHERING',
    category: 'LIFE',
    description: '암석과 광맥을 곡괭이로 채굴하여 철광석, 순은, 마나석 파편 및 보석 원석을 획득하는 기술입니다.',
    iconSymbol: '⛏️',
    primaryStatBonus: '근력, 체력',
    branches: [
      { id: 'mine_technique', name: '채굴술', description: '채굴 타격 속도, 광석 획득 수량 및 곡괭이 내구도 전문화', iconSymbol: '⛏️' },
      { id: 'mine_prospecting', name: '광맥탐사', description: '마나석 파편, 은/금/미스릴 광맥 및 보물 굴 탐사 전문화', iconSymbol: '🏔️' },
      { id: 'mine_appraisal', name: '광물감정', description: '원석 감정, 정석 분쇄 수율 및 제련 보너스 전문화', iconSymbol: '💎' },
    ],
    perks: [
      { id: 'mining_perk_lv10', requiredLevel: 10, name: '곡괭이 강타', description: '채광 시 기본 광석 획득 수량이 +20% 증가합니다.', effectSummary: '광석 획득 +20%' },
      { id: 'mining_perk_lv20', requiredLevel: 20, name: '암석 파쇄 기술', description: '암석 파쇄 시 체력 소모가 20% 절감됩니다.', effectSummary: '체력 소모 -20%' },
      { id: 'mining_perk_lv40', requiredLevel: 40, name: '보석 원석 발굴', description: '채광 중 다이아몬드, 루비 원석을 발굴할 확률이 증가합니다.', effectSummary: '원석 발굴 상승' },
      { id: 'mining_perk_lv60', requiredLevel: 60, name: '마나석 파편 대량 채굴', description: '빛나는 마나석 파편 채굴량이 2배로 증가합니다.', effectSummary: '마나석 파편 2배' },
      { id: 'mining_perk_lv80', requiredLevel: 80, name: '미스릴 광맥 채굴', description: '전설의 미스릴 및 아다만타이트 광맥을 채굴할 수 있습니다.', effectSummary: '전설 광맥 채굴' },
      { id: 'mining_perk_lv100', requiredLevel: 100, name: '대지의 채광 대가', description: '광맥 일격 파쇄 및 모든 원석/광석 최대 수량 획득.', effectSummary: '채광 대가 권능' },
    ],
    treeNodes: [
      // 채굴술
      { id: 'mn_t1', branchId: 'mine_technique', branchName: '채굴술', tier: 1, requiredLevel: 5, maxRank: 3, name: '곡괭이 타격력', description: '채광 속도 향상.', statOrBonusEffect: '채광 속도 +10% (랭크당)' },
      { id: 'mn_t2', branchId: 'mine_technique', branchName: '채굴술', tier: 2, requiredLevel: 20, requiredNodeId: 'mn_t1', maxRank: 3, name: '광석 파쇄 대량 수거', description: '기본 광석 수량 증가.', statOrBonusEffect: '광석 수량 +15% (랭크당)' },
      { id: 'mn_t3', branchId: 'mine_technique', branchName: '채굴술', tier: 3, requiredLevel: 35, requiredNodeId: 'mn_t2', maxRank: 3, name: '강철 곡괭이 내구', description: '곡괭이 마모율 감소.', statOrBonusEffect: '곡괭이 마모 -10% (랭크당)' },
      { id: 'mn_t4', branchId: 'mine_technique', branchName: '채굴술', tier: 4, requiredLevel: 50, requiredNodeId: 'mn_t3', maxRank: 3, name: '심층 암반 파쇄', description: '심층 광맥 채굴 성공률.', statOrBonusEffect: '심층 채굴 +12% (랭크당)' },
      { id: 'mn_t5', branchId: 'mine_technique', branchName: '채굴술', tier: 5, requiredLevel: 70, requiredNodeId: 'mn_t4', maxRank: 3, name: '대지 강타 일격', description: '채광 EXP 경험치 상승.', statOrBonusEffect: '채광 EXP +10% (랭크당)' },
      { id: 'mn_t6', branchId: 'mine_technique', branchName: '채굴술', tier: 6, requiredLevel: 90, requiredNodeId: 'mn_t5', maxRank: 1, name: '대지의 일격 울림', description: '채광 시 15% 확률로 광맥 즉시 완파.', statOrBonusEffect: '광맥 즉시 완파 15%' },

      // 광맥탐사
      { id: 'mn_p1', branchId: 'mine_prospecting', branchName: '광맥탐사', tier: 1, requiredLevel: 5, maxRank: 3, name: '음향 광맥 감지', description: '희귀 광맥 탐지 능력.', statOrBonusEffect: '희귀 광맥 발견 +5% (랭크당)' },
      { id: 'mn_p2', branchId: 'mine_prospecting', branchName: '광맥탐사', tier: 2, requiredLevel: 20, requiredNodeId: 'mn_p1', maxRank: 3, name: '은 & 금광맥 추적', description: '귀금속 광맥 출현율.', statOrBonusEffect: '귀금속 광맥 +15% (랭크당)' },
      { id: 'mn_p3', branchId: 'mine_prospecting', branchName: '광맥탐사', tier: 3, requiredLevel: 35, requiredNodeId: 'mn_p2', maxRank: 3, name: '마나석 파편 반응', description: '마나석 광맥 공명.', statOrBonusEffect: '마나석 파편 +1 (랭크당)' },
      { id: 'mn_p4', branchId: 'mine_prospecting', branchName: '광맥탐사', tier: 4, requiredLevel: 50, requiredNodeId: 'mn_p3', maxRank: 3, name: '비밀 동굴 지하 암석', description: '지하 탐사 보물 상물.', statOrBonusEffect: '채광 보물 획득 +10% (랭크당)' },
      { id: 'mn_p5', branchId: 'mine_prospecting', branchName: '광맥탐사', tier: 5, requiredLevel: 70, requiredNodeId: 'mn_p4', maxRank: 3, name: '미스릴 공명 감각', description: '미스릴 광맥 위치 감지.', statOrBonusEffect: '미스릴 발견 +8% (랭크당)' },
      { id: 'mn_p6', branchId: 'mine_prospecting', branchName: '광맥탐사', tier: 6, requiredLevel: 90, requiredNodeId: 'mn_p5', maxRank: 1, name: '심연 탐사자의 혜안', description: '채광 시 항상 마나석 파편 1개 확정 획득.', statOrBonusEffect: '마나석 파편 확정 +1' },

      // 광물감정
      { id: 'mn_a1', branchId: 'mine_appraisal', branchName: '광물감정', tier: 1, requiredLevel: 5, maxRank: 3, name: '광석 순도 시편', description: '원석 가치 상승.', statOrBonusEffect: '광석 판매가 +10% (랭크당)' },
      { id: 'mn_a2', branchId: 'mine_appraisal', branchName: '광물감정', tier: 2, requiredLevel: 20, requiredNodeId: 'mn_a1', maxRank: 3, name: '결정 불순물 분리', description: '제련 시 주괴 수율 상향.', statOrBonusEffect: '제련 수율 +10% (랭크당)' },
      { id: 'mn_a3', branchId: 'mine_appraisal', branchName: '광물감정', tier: 3, requiredLevel: 35, requiredNodeId: 'mn_a2', maxRank: 3, name: '보석 원석 감정', description: '원석 감정 정확도.', statOrBonusEffect: '보석 원석 감정 +12% (랭크당)' },
      { id: 'mn_a4', branchId: 'mine_appraisal', branchName: '광물감정', tier: 4, requiredLevel: 50, requiredNodeId: 'mn_a3', maxRank: 3, name: '고대 함유 금속 파악', description: '합금 제련 경험치.', statOrBonusEffect: '제련 EXP +15% (랭크당)' },
      { id: 'mn_a5', branchId: 'mine_appraisal', branchName: '광물감정', tier: 5, requiredLevel: 70, requiredNodeId: 'mn_a4', maxRank: 3, name: '신화 결정질 정제', description: '신화 광물 불순물 제거.', statOrBonusEffect: '신화 제련 +10% (랭크당)' },
      { id: 'mn_a6', branchId: 'mine_appraisal', branchName: '광물감정', tier: 6, requiredLevel: 90, requiredNodeId: 'mn_a5', maxRank: 1, name: '황금 마이더스의 채굴손', description: '광석 제련 시 20% 확률로 2배 주괴 제련.', statOrBonusEffect: '2배 주괴 제련 20%' },
    ],
    unlockablesSummary: ['돌', '철광석', '순은 주괴 원석', '빛나는 마나석 파편'],
  },

  // 8. 채집 (HERBALISM)
  HERBALISM: {
    id: 'HERBALISM',
    name: '채집',
    kind: 'GATHERING',
    category: 'LIFE',
    description: '야생 약초, 약용식물, 야생식물, 풀, 꽃, 버섯, 뿌리, 열매, 특수 식생 및 요리/연금용 식물 수집 기술입니다.',
    iconSymbol: '🌿',
    primaryStatBonus: '민첩, 지능',
    branches: [
      { id: 'herb_botany', name: '식물학', description: '식생 식별, 약초 획득량, 연금 식물 수율 전문화', iconSymbol: '🌿' },
      { id: 'herb_harvesting', name: '채취술', description: '채집 속도, 손상 없는 뿌리/열매/꽃 완전 수거 전문화', iconSymbol: '🌸' },
      { id: 'herb_appraisal', name: '약초감식', description: '버섯, 약용식물, 특수 식생 및 전설 식물 탐지 전문화', iconSymbol: '🍄' },
    ],
    perks: [
      { id: 'herbalism_perk_lv10', requiredLevel: 10, name: '야생 식생 식별', description: '약초, 약용식물, 버섯 등 야생 자원을 손쉽게 발견합니다.', effectSummary: '기초 채집 해금' },
      { id: 'herbalism_perk_lv20', requiredLevel: 20, name: '뿌리 손상 방지', description: '식물 채집 시 뿌리와 열매를 훼손 없이 쌍으로 채집합니다.', effectSummary: '채집 수량 +1' },
      { id: 'herbalism_perk_lv40', requiredLevel: 40, name: '약용식물 풍요', description: '약초 채집 시 25% 확률로 고급 약용식물이 함께 획득됩니다.', effectSummary: '약용식물 확률 +25%' },
      { id: 'herbalism_perk_lv60', requiredLevel: 60, name: '연금 정수 식물', description: '연금술용 희귀 전설 식생 및 특수 연금 재료를 채집합니다.', effectSummary: '특수 연금 식생 채집' },
      { id: 'herbalism_perk_lv80', requiredLevel: 80, name: '자연의 풍요 가호', description: '채집 시 30% 확률로 2배 식물 수확이 가능합니다.', effectSummary: '2배 수확률 30%' },
      { id: 'herbalism_perk_lv100', requiredLevel: 100, name: '대자연의 채집 대가', description: '손끝이 닿는 모든 식생을 무손상 대량 채집하고 즉시 맑은 이슬을 획득합니다.', effectSummary: '채집 대가 권능' },
    ],
    treeNodes: [
      // 식물학
      { id: 'hb_b1', branchId: 'herb_botany', branchName: '식물학', tier: 1, requiredLevel: 5, maxRank: 3, name: '기초 잎 식별', description: '기초 약초 획득 수량 증가.', statOrBonusEffect: '약초 수량 +1 (랭크당)' },
      { id: 'hb_b2', branchId: 'herb_botany', branchName: '식물학', tier: 2, requiredLevel: 20, requiredNodeId: 'hb_b1', maxRank: 3, name: '연금용 풀 & 꽃', description: '연금 재료 채집 확률.', statOrBonusEffect: '연금 풀/꽃 획득 +15% (랭크당)' },
      { id: 'hb_b3', branchId: 'herb_botany', branchName: '식물학', tier: 3, requiredLevel: 35, requiredNodeId: 'hb_b2', maxRank: 3, name: '특수 식생 발굴', description: '특수 식생 탐지 능력.', statOrBonusEffect: '특수 식생 +10% (랭크당)' },
      { id: 'hb_b4', branchId: 'herb_botany', branchName: '식물학', tier: 4, requiredLevel: 50, requiredNodeId: 'hb_b3', maxRank: 3, name: '독버섯 & 약용 버섯', description: '버섯 채집 안전도 및 수율.', statOrBonusEffect: '버섯 채집량 +20% (랭크당)' },
      { id: 'hb_b5', branchId: 'herb_botany', branchName: '식물학', tier: 5, requiredLevel: 70, requiredNodeId: 'hb_b4', maxRank: 3, name: '전설의 영혼 약초', description: '영혼 약초 채집 성공률.', statOrBonusEffect: '채집 EXP +10% (랭크당)' },
      { id: 'hb_b6', branchId: 'herb_botany', branchName: '식물학', tier: 6, requiredLevel: 90, requiredNodeId: 'hb_b5', maxRank: 1, name: '세계수의 잎사귀 각인', description: '채집 시 10% 확률로 맑은 이슬 자동 획득.', statOrBonusEffect: '맑은 이슬 자동 채취 10%' },

      // 채취술
      { id: 'hb_h1', branchId: 'herb_harvesting', branchName: '채취술', tier: 1, requiredLevel: 5, maxRank: 3, name: '채집 손놀림', description: '채집 소요 시간 단축.', statOrBonusEffect: '채집 속도 +10% (랭크당)' },
      { id: 'hb_h2', branchId: 'herb_harvesting', branchName: '채취술', tier: 2, requiredLevel: 20, requiredNodeId: 'hb_h1', maxRank: 3, name: '뿌리 손상 전무', description: '뿌리류 채집 수량.', statOrBonusEffect: '뿌리류 획득 +15% (랭크당)' },
      { id: 'hb_h3', branchId: 'herb_harvesting', branchName: '채취술', tier: 3, requiredLevel: 35, requiredNodeId: 'hb_h2', maxRank: 3, name: '열과 꽃잎 보존', description: '꽃/열매 보존 수확.', statOrBonusEffect: '꽃/열매 +1 (랭크당)' },
      { id: 'hb_h4', branchId: 'herb_harvesting', branchName: '채취술', tier: 4, requiredLevel: 50, requiredNodeId: 'hb_h3', maxRank: 3, name: '절벽 약초 채취', description: '가혹 지역 채집 성공률.', statOrBonusEffect: '험지 채집 +12% (랭크당)' },
      { id: 'hb_h5', branchId: 'herb_harvesting', branchName: '채취술', tier: 5, requiredLevel: 70, requiredNodeId: 'hb_h4', maxRank: 3, name: '대량 나물 채집', description: '요리용 야생 식생 수량.', statOrBonusEffect: '야생 재료 +20% (랭크당)' },
      { id: 'hb_h6', branchId: 'herb_harvesting', branchName: '채취술', tier: 6, requiredLevel: 90, requiredNodeId: 'hb_h5', maxRank: 1, name: '풍요의 손끝', description: '모든 채집 행동 스태미나 소모 0.', statOrBonusEffect: '채집 스태미나 소모 0' },

      // 약초감식
      { id: 'hb_a1', branchId: 'herb_appraisal', branchName: '약초감식', tier: 1, requiredLevel: 5, maxRank: 3, name: '야생 약초 돋보기', description: '희귀 식생 발견률.', statOrBonusEffect: '희귀 약초 발견 +5% (랭크당)' },
      { id: 'hb_a2', branchId: 'herb_appraisal', branchName: '약초감식', tier: 2, requiredLevel: 20, requiredNodeId: 'hb_a1', maxRank: 3, name: '독성 풀 분류', description: '해독제 재료 파악.', statOrBonusEffect: '해독 풀 발견 +15% (랭크당)' },
      { id: 'hb_a3', branchId: 'herb_appraisal', branchName: '약초감식', tier: 3, requiredLevel: 35, requiredNodeId: 'hb_a2', maxRank: 3, name: '마력 식생 감응', description: '마력 풀 채집 시 마나 회복.', statOrBonusEffect: '채집 시 MP +8 (랭크당)' },
      { id: 'hb_a4', branchId: 'herb_appraisal', branchName: '약초감식', tier: 4, requiredLevel: 50, requiredNodeId: 'hb_a3', maxRank: 3, name: '고대 식물 서식지 감식', description: '고대 식물 탐사.', statOrBonusEffect: '고대 식물 발견 +10% (랭크당)' },
      { id: 'hb_a5', branchId: 'herb_appraisal', branchName: '약초감식', tier: 5, requiredLevel: 70, requiredNodeId: 'hb_a4', maxRank: 3, name: '신화의 약초 뿌리 감식', description: '신화 식생 감식 정확도.', statOrBonusEffect: '신화 식생 +8% (랭크당)' },
      { id: 'hb_a6', branchId: 'herb_appraisal', branchName: '약초감식', tier: 6, requiredLevel: 90, requiredNodeId: 'hb_a5', maxRank: 1, name: '약초 신선의 감안', description: '채집 시 15% 확률로 희귀 연금 재료 추가 발굴.', statOrBonusEffect: '희귀 연금 재료 추가 15%' },
    ],
    unlockablesSummary: [
      '약초', '약용식물', '야생식물', '풀', '꽃',
      '버섯', '뿌리', '열매', '특수 식생', '연금술용 식물', '요리용 야생 재료'
    ],
    gatheredResourceTypes: [
      '약초', '약용식물', '야생식물', '풀', '꽃',
      '버섯', '뿌리', '열매', '특수 식생', '연금술용 식물', '요리용 야생 재료'
    ],
  },

  // 9. 낚시 (FISHING)
  FISHING: {
    id: 'FISHING',
    name: '낚시',
    kind: 'GATHERING',
    category: 'LIFE',
    description: '강, 호수, 바다에서 낚싯대로 어류와 수중 자원, 침몰된 마법 보물 상자를 낚아채는 기술입니다.',
    iconSymbol: '🎣',
    primaryStatBonus: '민첩, 행운',
    branches: [
      { id: 'fish_angling', name: '낚시술', description: '입질 속도, 찌 조율, 낚시 성공률 및 대형 어종 건져내기 전문화', iconSymbol: '🎣' },
      { id: 'fish_prospecting', name: '어종탐색', description: '희귀 어종, 심해어, 영혼어 및 수중 보물상자 건져내기 전문화', iconSymbol: '🐟' },
      { id: 'fish_specialty', name: '수역전문', description: '강, 호수, 바다, 용암 수역 전문화 및 낚시 버프 전문화', iconSymbol: '🌊' },
    ],
    perks: [
      { id: 'fishing_perk_lv10', requiredLevel: 10, name: '입질 감각', description: '낚시 성공률과 찌 반응 속도가 20% 상승합니다.', effectSummary: '입질 빈도 +20%' },
      { id: 'fishing_perk_lv20', requiredLevel: 20, name: '릴 손잡이 조율', description: '낚시 실패율이 25% 감소합니다.', effectSummary: '실패율 -25%' },
      { id: 'fishing_perk_lv40', requiredLevel: 40, name: '수중 보물 상자 견인', description: '낚시 중 물속 침몰 보물 상자를 낚을 확률이 부여됩니다.', effectSummary: '침몰 보물 상자 낚시' },
      { id: 'fishing_perk_lv60', requiredLevel: 60, name: '심해 전설어 낚시', description: '전설의 심해어 및 대형 몬스터 어종을 낚아 올립니다.', effectSummary: '심해 전설어 낚시' },
      { id: 'fishing_perk_lv80', requiredLevel: 80, name: '풍어의 찌', description: '낚시 성공 시 30% 확률로 어류 2마리를 동시 낚아챕니다.', effectSummary: '2마리 동시 낚시 30%' },
      { id: 'fishing_perk_lv100', requiredLevel: 100, name: '바다의 강태공', description: '찌를 던지는 즉시 입질 및 최고급 어종과 보물을 100% 견인합니다.', effectSummary: '낚시 대가 권능' },
    ],
    treeNodes: [
      // 낚시술
      { id: 'fs_a1', branchId: 'fish_angling', branchName: '낚시술', tier: 1, requiredLevel: 5, maxRank: 3, name: '찌 던지기 정밀도', description: '입질 대기 시간 단축.', statOrBonusEffect: '입질 속도 +10% (랭크당)' },
      { id: 'fs_a2', branchId: 'fish_angling', branchName: '낚시술', tier: 2, requiredLevel: 20, requiredNodeId: 'fs_a1', maxRank: 3, name: '강화 낚싯줄', description: '줄 터짐 방지 및 성공률.', statOrBonusEffect: '낚시 성공률 +8% (랭크당)' },
      { id: 'fs_a3', branchId: 'fish_angling', branchName: '낚시술', tier: 3, requiredLevel: 35, requiredNodeId: 'fs_a2', maxRank: 3, name: '대형 어종 릴 감기', description: '어류 크기 보너스.', statOrBonusEffect: '대형 어종 +15% (랭크당)' },
      { id: 'fs_a4', branchId: 'fish_angling', branchName: '낚시술', tier: 4, requiredLevel: 50, requiredNodeId: 'fs_a3', maxRank: 3, name: '야간 낚시 등불', description: '야간 낚시 페널티 제거.', statOrBonusEffect: '야간 성공률 +12% (랭크당)' },
      { id: 'fs_a5', branchId: 'fish_angling', branchName: '낚시술', tier: 5, requiredLevel: 70, requiredNodeId: 'fs_a4', maxRank: 3, name: '전설 낚시터 경험', description: '낚시 EXP 상승.', statOrBonusEffect: '낚시 EXP +10% (랭크당)' },
      { id: 'fs_a6', branchId: 'fish_angling', branchName: '낚시술', tier: 6, requiredLevel: 90, requiredNodeId: 'fs_a5', maxRank: 1, name: '신화의 강태공 일격', description: '찌를 던진 즉시 입질 발생(대기 0초).', statOrBonusEffect: '즉시 입질 100%' },

      // 어종탐색
      { id: 'fs_p1', branchId: 'fish_prospecting', branchName: '어종탐색', tier: 1, requiredLevel: 5, maxRank: 3, name: '수면 파문 직관', description: '희귀 어종 탐색.', statOrBonusEffect: '희귀 어종 발견 +5% (랭크당)' },
      { id: 'fs_p2', branchId: 'fish_prospecting', branchName: '어종탐색', tier: 2, requiredLevel: 20, requiredNodeId: 'fs_p1', maxRank: 3, name: '은빛 연어 포인트', description: '고급 고급 어종 낚시.', statOrBonusEffect: '고급 어종 +15% (랭크당)' },
      { id: 'fs_p3', branchId: 'fish_prospecting', branchName: '어종탐색', tier: 3, requiredLevel: 35, requiredNodeId: 'fs_p2', maxRank: 3, name: '침몰선 보물 낚시', description: '보물 상물 낚을 확률.', statOrBonusEffect: '보물 상자 +8% (랭크당)' },
      { id: 'fs_p4', branchId: 'fish_prospecting', branchName: '어종탐색', tier: 4, requiredLevel: 50, requiredNodeId: 'fs_p3', maxRank: 3, name: '마나 물고기 공명', description: '마나 어종 낚시 시 MP 회복.', statOrBonusEffect: '낚시 시 MP +10 (랭크당)' },
      { id: 'fs_p5', branchId: 'fish_prospecting', branchName: '어종탐색', tier: 5, requiredLevel: 70, requiredNodeId: 'fs_p4', maxRank: 3, name: '심해의 용 어종 탐사', description: '용 어종 출현율.', statOrBonusEffect: '용 어종 발견 +10% (랭크당)' },
      { id: 'fs_p6', branchId: 'fish_prospecting', branchName: '어종탐색', tier: 6, requiredLevel: 90, requiredNodeId: 'fs_p5', maxRank: 1, name: '황금 조개 인주', description: '보물상자 낚을 시 100% 골드 2배 확정.', statOrBonusEffect: '보물 상자 골드 2배' },

      // 수역전문
      { id: 'fs_s1', branchId: 'fish_specialty', branchName: '수역전문', tier: 1, requiredLevel: 5, maxRank: 3, name: '강 & 호수 길들이기', description: '민물 낚시 효율.', statOrBonusEffect: '민물 낚시 +10% (랭크당)' },
      { id: 'fs_s2', branchId: 'fish_specialty', branchName: '수역전문', tier: 2, requiredLevel: 20, requiredNodeId: 'fs_s1', maxRank: 3, name: '바다 낚시 전문화', description: '해수 낚시 효율.', statOrBonusEffect: '해수 낚시 +12% (랭크당)' },
      { id: 'fs_s3', branchId: 'fish_specialty', branchName: '수역전문', tier: 3, requiredLevel: 35, requiredNodeId: 'fs_s2', maxRank: 3, name: '얼음 낚시 구멍', description: '설원/빙하 수역 낚시.', statOrBonusEffect: '빙하 수역 +15% (랭크당)' },
      { id: 'fs_s4', branchId: 'fish_specialty', branchName: '수역전문', tier: 4, requiredLevel: 50, requiredNodeId: 'fs_s3', maxRank: 3, name: '용암 & 마계 낚시', description: '특수 험지 수역 낚시.', statOrBonusEffect: '특수 수역 +12% (랭크당)' },
      { id: 'fs_s5', branchId: 'fish_specialty', branchName: '수역전문', tier: 5, requiredLevel: 70, requiredNodeId: 'fs_s4', maxRank: 3, name: '비경 수역 대가', description: '모든 수역 낚시 수율.', statOrBonusEffect: '수역 수율 +10% (랭크당)' },
      { id: 'fs_s6', branchId: 'fish_specialty', branchName: '수역전문', tier: 6, requiredLevel: 90, requiredNodeId: 'fs_s5', maxRank: 1, name: '포세이돈의 가호', description: '모든 수역 낚시 시 행운 +10 버프 지속.', statOrBonusEffect: '낚시 후 행운 +10 버프' },
    ],
    unlockablesSummary: ['신선한 물고기', '은빛 연어', '심해 전설어', '침몰된 보물상자'],
  },

  // 10. 도축 (BUTCHERY)
  BUTCHERY: {
    id: 'BUTCHERY',
    name: '도축',
    kind: 'GATHERING',
    category: 'LIFE',
    description: '사냥한 야생 동물 및 마수에서 살코기, 가죽, 뼈, 맹수 정수, 마법 나사 등을 정교하게 해체 발라내는 기술입니다.',
    iconSymbol: '🔪',
    primaryStatBonus: '근력, 민첩',
    branches: [
      { id: 'butch_carving', name: '해체술', description: '칼날 속도, 발골 정밀도 및 살코기/고기 획득량 전문화', iconSymbol: '🔪' },
      { id: 'butch_preservation', name: '소재보존', description: '손상 없는 원피 발라내기, 뼈/이빨/뿔 완벽 수거 전문화', iconSymbol: '🦴' },
      { id: 'butch_appraisal', name: '생물감식', description: '마수 정수 추출, 맹수 부산물 및 전설 마수 소재 발굴 전문화', iconSymbol: '🐺' },
    ],
    perks: [
      { id: 'butchery_perk_lv10', requiredLevel: 10, name: '발골 입문', description: '도축 시 신선한 고기 및 가죽 획득량이 +25% 증가합니다.', effectSummary: '고기/가죽 획득 +25%' },
      { id: 'butchery_perk_lv20', requiredLevel: 20, name: '날카로운 발골 칼날', description: '도축 행동 소모 시간이 20% 단축됩니다.', effectSummary: '도축 속도 +20%' },
      { id: 'butchery_perk_lv40', requiredLevel: 40, name: '마수 정수 추출', description: '마수 해체 시 연금용 맹수 이빨 및 마수 정수를 획득합니다.', effectSummary: '마수 정수 획득' },
      { id: 'butchery_perk_lv60', requiredLevel: 60, name: '전설 맹수 장기 부속', description: '전설 맹수의 고가치 장기 및 심장을 온전히 해체합니다.', effectSummary: '전설 장기 해체' },
      { id: 'butchery_perk_lv80', requiredLevel: 80, name: '도축 풍요의 손길', description: '도축 시 30% 확률로 획득되는 부산물이 2배 증량됩니다.', effectSummary: '2배 부산물 30%' },
      { id: 'butchery_perk_lv100', requiredLevel: 100, name: '해체 작업의 대가', description: '단 한 번의 칼질로 사냥감 완벽 발골 및 최고 등급 살코기를 수거합니다.', effectSummary: '도축 대가 권능' },
    ],
    treeNodes: [
      // 해체술
      { id: 'bt_c1', branchId: 'butch_carving', branchName: '해체술', tier: 1, requiredLevel: 5, maxRank: 3, name: '도축 칼날 연마', description: '고기 획득 수량 상승.', statOrBonusEffect: '신선한 고기 +1 (랭크당)' },
      { id: 'bt_c2', branchId: 'butch_carving', branchName: '해체술', tier: 2, requiredLevel: 20, requiredNodeId: 'bt_c1', maxRank: 3, name: '관절 마디 발골', description: '도축 속도 및 스태미나.', statOrBonusEffect: '도축 속도 +10% (랭크당)' },
      { id: 'bt_c3', branchId: 'butch_carving', branchName: '해체술', tier: 3, requiredLevel: 35, requiredNodeId: 'bt_c2', maxRank: 3, name: '특상급 안심 발라내기', description: '명품 고기 수확률.', statOrBonusEffect: '명품 고기 +12% (랭크당)' },
      { id: 'bt_c4', branchId: 'butch_carving', branchName: '해체술', tier: 4, requiredLevel: 50, requiredNodeId: 'bt_c3', maxRank: 3, name: '대형 야수 해체', description: '대형 몬스터 해체 보너스.', statOrBonusEffect: '대형 야수 고기 +20% (랭크당)' },
      { id: 'bt_c5', branchId: 'butch_carving', branchName: '해체술', tier: 5, requiredLevel: 70, requiredNodeId: 'bt_c4', maxRank: 3, name: '드래곤 고기 도축', description: '드래곤 등급 도축.', statOrBonusEffect: '도축 EXP +10% (랭크당)' },
      { id: 'bt_c6', branchId: 'butch_carving', branchName: '해체술', tier: 6, requiredLevel: 90, requiredNodeId: 'bt_c5', maxRank: 1, name: '전설의 도축도 일격', description: '도축 시 고기 획득량 3배 대성공 15%.', statOrBonusEffect: '3배 고기 대성공 15%' },

      // 소재보존
      { id: 'bt_p1', branchId: 'butch_preservation', branchName: '소재보존', tier: 1, requiredLevel: 5, maxRank: 3, name: '원피 손상 최소화', description: '무두질용 가죽 무손수 획득.', statOrBonusEffect: '가죽 무손상 +15% (랭크당)' },
      { id: 'bt_p2', branchId: 'butch_preservation', branchName: '소재보존', tier: 2, requiredLevel: 20, requiredNodeId: 'bt_p1', maxRank: 3, name: '맹수 이빨 & 뼈 발굴', description: '제작용 뼈 수거.', statOrBonusEffect: '맹수 뼈 +1 (랭크당)' },
      { id: 'bt_p3', branchId: 'butch_preservation', branchName: '소재보존', tier: 3, requiredLevel: 35, requiredNodeId: 'bt_p2', maxRank: 3, name: '단단한 뿔 박리', description: '뿔/발톱 추가 채취.', statOrBonusEffect: '뿔/발톱 +10% (랭크당)' },
      { id: 'bt_p4', branchId: 'butch_preservation', branchName: '소재보존', tier: 4, requiredLevel: 50, requiredNodeId: 'bt_p3', maxRank: 3, name: '마수 혈액 수거', description: '연금용 마수 혈액 용매.', statOrBonusEffect: '마수 혈액 +15% (랭크당)' },
      { id: 'bt_p5', branchId: 'butch_preservation', branchName: '소재보존', tier: 5, requiredLevel: 70, requiredNodeId: 'bt_p4', maxRank: 3, name: '고대 마수의 갑각 추출', description: '갑각/비늘 무손상 발골.', statOrBonusEffect: '비늘 무손상 +12% (랭크당)' },
      { id: 'bt_p6', branchId: 'butch_preservation', branchName: '소재보존', tier: 6, requiredLevel: 90, requiredNodeId: 'bt_p5', maxRank: 1, name: '마수 소재 박물관', description: '모든 마수 해체 시 원피 수량 2배 확정.', statOrBonusEffect: '원피 수량 2배 확정' },

      // 생물감식
      { id: 'bt_a1', branchId: 'butch_appraisal', branchName: '생물감식', tier: 1, requiredLevel: 5, maxRank: 3, name: '야생 생물 약점 파악', description: '사냥감 도축 경험치.', statOrBonusEffect: '도축 경험치 +8% (랭크당)' },
      { id: 'bt_a2', branchId: 'butch_appraisal', branchName: '생물감식', tier: 2, requiredLevel: 20, requiredNodeId: 'bt_a1', maxRank: 3, name: '마수 정수 감응', description: '마수 정수 추출률.', statOrBonusEffect: '마수 정수 +10% (랭크당)' },
      { id: 'bt_a3', branchId: 'butch_appraisal', branchName: '생물감식', tier: 3, requiredLevel: 35, requiredNodeId: 'bt_a2', maxRank: 3, name: '독샘 세밀 제거', description: '독 물질 안전 분리.', statOrBonusEffect: '독 재료 추출 +15% (랭크당)' },
      { id: 'bt_a4', branchId: 'butch_appraisal', branchName: '생물감식', tier: 4, requiredLevel: 50, requiredNodeId: 'bt_a3', maxRank: 3, name: '마수 심장 보존', description: '전설 연금용 심장 채취.', statOrBonusEffect: '마수 심장 +10% (랭크당)' },
      { id: 'bt_a5', branchId: 'butch_appraisal', branchName: '생물감식', tier: 5, requiredLevel: 70, requiredNodeId: 'bt_a4', maxRank: 3, name: '신화의 마수 융합물 감식', description: '신화 마수 소재 파악.', statOrBonusEffect: '신화 소재 +8% (랭크당)' },
      { id: 'bt_a6', branchId: 'butch_appraisal', branchName: '생물감식', tier: 6, requiredLevel: 90, requiredNodeId: 'bt_a5', maxRank: 1, name: '생물 박학다식 대가', description: '도축 시 20% 확률로 마수 해체 보상 상자 자동 획득.', statOrBonusEffect: '마수 해체 보물상자 20%' },
    ],
    unlockablesSummary: ['신선한 고기', '질긴 늑대 가죽', '맹수 이빨', '마수의 정수'],
  },
};

export const INITIAL_TECHNOLOGY_STATE: Record<TechId, any> = {
  SMITHING: { techId: 'SMITHING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: ['craft_iron_sword', 'craft_iron_shield'], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  LEATHERWORKING: { techId: 'LEATHERWORKING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: ['craft_leather_vest', 'craft_leather_boots'], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  ALCHEMY: { techId: 'ALCHEMY', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: ['craft_healing_potion', 'craft_mana_potion', 'elixir_lesser_hp', 'potion_traveler_hp'], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  COOKING: { techId: 'COOKING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: ['craft_herb_tea', 'craft_hearty_stew'], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  JEWELCRAFTING: { techId: 'JEWELCRAFTING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: [], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  LOGGING: { techId: 'LOGGING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: [], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  MINING: { techId: 'MINING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: [], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  HERBALISM: { techId: 'HERBALISM', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: [], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  FISHING: { techId: 'FISHING', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: [], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
  BUTCHERY: { techId: 'BUTCHERY', level: 1, exp: 0, totalMastery: 10, skillPoints: 0, unlockedPerkIds: [], treeNodeRanks: {}, unlockedRecipes: [], stats: { totalActionCount: 0, successfulCrafts: 0, masterworkCount: 0, itemsProduced: 0 } },
};
