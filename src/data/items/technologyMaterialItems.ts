import type { ItemDefinition } from '../../types';

/**
 * 기술 제련 시스템이 직접 생성하는 주괴/부산물의 정식 아이템 메타데이터.
 * 제련 런타임 ID와 ITEM_DATABASE를 일치시켜 저장/불러오기·UI·퀘스트 참조에서
 * 유령 스택이 생기지 않도록 한다.
 */
export const TECHNOLOGY_MATERIAL_ITEM_DATABASE: Record<string, ItemDefinition> = {
  copper_ingot: { id:'copper_ingot', name:'동 주괴', category:'MATERIAL', description:'동광석을 정련해 주조한 동 주괴. 청동 합금과 기초 금속 부품 제작에 사용됩니다.', usable:false, weight:1.1, bulk:1, size:'SMALL', rarity:'COMMON' },
  iron_ingot: { id:'iron_ingot', name:'철 주괴', category:'MATERIAL', description:'철광석의 불순물을 제거해 굳힌 철 주괴. 강철 제련과 각종 단조의 기반 재료입니다.', usable:false, weight:1.5, bulk:1, size:'SMALL', rarity:'COMMON' },
  bronze_ingot: { id:'bronze_ingot', name:'청동 주괴', category:'MATERIAL', description:'동과 주석을 일정 비율로 합금한 청동 주괴. 기어와 정밀 부품 제작에 적합합니다.', usable:false, weight:1.3, bulk:1, size:'SMALL', rarity:'UNCOMMON' },
  steel_ingot: { id:'steel_ingot', name:'강철 주괴', category:'MATERIAL', description:'철 주괴를 고열 침탄 처리해 만든 강철 주괴. 고급 무기·방어구와 선체 부품에 사용됩니다.', usable:false, weight:1.5, bulk:1, size:'SMALL', rarity:'UNCOMMON' },
  mithril_ingot: { id:'mithril_ingot', name:'미스릴 주괴', category:'MATERIAL', description:'미스릴 사금과 순은을 정밀 제련해 만든 경량 마력 금속 주괴입니다.', usable:false, weight:0.8, bulk:1, size:'SMALL', rarity:'RARE' },
  sky_iron_ingot: { id:'sky_iron_ingot', name:'천철 주괴', category:'MATERIAL', description:'천철광과 에테르 결정을 함께 제련한 고급 주괴. 비행정과 천공 장비의 핵심 금속입니다.', usable:false, weight:1.0, bulk:1, size:'SMALL', rarity:'EPIC' },

  slag_dust: { id:'slag_dust', name:'광질 슬래그 가루', category:'MATERIAL', description:'금속 제련 과정에서 분리된 광물성 슬래그 가루. 재정련·연금 보조재로 활용할 수 있습니다.', usable:false, weight:0.2, bulk:1, size:'TINY', rarity:'COMMON' },
  coal_ash: { id:'coal_ash', name:'고열 재 파편', category:'MATERIAL', description:'강철 제련 후 남은 고온 탄재 파편. 내열 혼합재와 연금 촉매로 재활용할 수 있습니다.', usable:false, weight:0.2, bulk:1, size:'TINY', rarity:'COMMON' },
  silver_dust: { id:'silver_dust', name:'은 분말', category:'MATERIAL', description:'은 정제 과정에서 모인 미세한 은 분말. 장신구 세공과 연금 재료로 사용됩니다.', usable:false, weight:0.1, bulk:1, size:'TINY', rarity:'UNCOMMON' },
  mithril_dust: { id:'mithril_dust', name:'빛나는 미스릴 미분', category:'MATERIAL', description:'미스릴 제련 중 떨어져 나온 고농도 미분. 고급 강화와 마력 합금의 보조 재료입니다.', usable:false, weight:0.1, bulk:1, size:'TINY', rarity:'RARE' },
  sky_shard: { id:'sky_shard', name:'천경 파편', category:'MATERIAL', description:'천철 제련 중 응결된 에테르성 금속 파편. 천공 장비와 항법 장치의 희귀 재료입니다.', usable:false, weight:0.1, bulk:1, size:'TINY', rarity:'RARE' },
};
