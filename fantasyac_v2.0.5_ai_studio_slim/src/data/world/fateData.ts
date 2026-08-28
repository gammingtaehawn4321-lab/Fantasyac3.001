import type { Race, BeastkinType, WorldRegionId } from '../../types';

export interface FateDefinition {
  id: string;
  name: string;
  description: string;
  allowedRaces: Race[];
  allowedBeastkinTypes?: BeastkinType[];
  allowedRegions: WorldRegionId[];
  startLocationTag: string;
  startingRupees: number;
  startingItems: Array<{ name: string; quantity: number; description?: string }>;
  startingTraits: string[];
  worldFlags: string[];
  introSituation: string;
}

export const START_REGIONS_BY_RACE: Record<Race, WorldRegionId[]> = {
  HUMAN: ['GRANDIA', 'SEIRE', 'SANTIMAC'],
  ELF: ['FOREZIN', 'SANTIMAC'],
  BEASTKIN: ['GRANDIA', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'],
  YETI: ['PROSTI'],
  MERFOLK: ['SEIRE'],
  DRAGONKIN: ['GRANDIA', 'SEIRE', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'],
};

export function getStartRegionsForRace(race: Race, beastkinType?: BeastkinType): WorldRegionId[] {
  if (race !== 'BEASTKIN') return START_REGIONS_BY_RACE[race];
  switch (beastkinType) {
    case 'WOLF': return ['PROSTI', 'SANTIMAC'];
    case 'BIRD': return ['SCROZE', 'FOREZIN'];
    case 'FOX': return ['SCROZE', 'SANTIMAC', 'FOREZIN'];
    case 'DOG': return ['FOREZIN', 'GRANDIA'];
    case 'CAT': return ['SANTIMAC', 'GRANDIA'];
    default: return START_REGIONS_BY_RACE.BEASTKIN;
  }
}

export const FATE_DEFINITIONS: FateDefinition[] = [
  {
    id: 'fate_grandia_wanderer', name: '왕도 밖의 방랑자',
    description: '그란디아의 대도시를 등지고 초원 길에서 새로운 삶을 시작한다.',
    allowedRaces: ['HUMAN', 'BEASTKIN', 'ELF'], allowedRegions: ['GRANDIA'], startLocationTag: 'GRANDIA_OUTSKIRTS',
    startingRupees: 120, startingItems: [{ name: '여행용 건빵', quantity: 3 }, { name: '초원 지도 조각', quantity: 1 }],
    startingTraits: ['FATE_WANDERER'], worldFlags: ['START_GRANDIA_OUTSKIRTS'],
    introSituation: '더 펠리스의 성벽이 멀어지는 초원길에서 첫 발을 내딛는다.',
  },
  {
    id: 'fate_grandia_underclass', name: '왕도의 그림자',
    description: '더 펠리스의 가장 낮은 곳에서 도시의 빛과 어둠을 모두 아는 채 시작한다.',
    allowedRaces: ['HUMAN', 'BEASTKIN', 'ELF', 'MERFOLK'], allowedRegions: ['GRANDIA'], startLocationTag: 'THE_PELLESS_LOWER',
    startingRupees: 60, startingItems: [{ name: '낡은 하수도 열쇠', quantity: 1 }, { name: '작은 회복약', quantity: 2 }],
    startingTraits: ['FATE_STREETWISE'], worldFlags: ['KNOWS_PELLESS_UNDERCITY'],
    introSituation: '더 펠리스 하층 구역의 좁은 골목에서 소문과 위험을 익숙하게 읽는다.',
  },
  {
    id: 'fate_seire_surface', name: '수평선의 여행자',
    description: '수상도시 스카이의 선착장과 바닷길을 오가며 세이레를 여행한다.',
    allowedRaces: ['HUMAN', 'ELF', 'BEASTKIN'], allowedRegions: ['SEIRE'], startLocationTag: 'SKY_PORT',
    startingRupees: 130, startingItems: [{ name: '방수 가방', quantity: 1 }, { name: '선원용 나침반', quantity: 1 }],
    startingTraits: ['FATE_SEAFARER'], worldFlags: ['START_SEIRE_SURFACE'],
    introSituation: '수상도시 스카이의 선착장 위에서 오염된 바다와 먼 수평선을 바라본다.',
  },
  {
    id: 'fate_aquaria_child', name: '아쿠아리아의 물결',
    description: '해저 수도 아쿠아리아의 주민으로서 오염과 인간에 대한 분노가 뒤섞인 바다에서 시작한다.',
    allowedRaces: ['MERFOLK'], allowedRegions: ['SEIRE'], startLocationTag: 'AQUARIA',
    startingRupees: 90, startingItems: [{ name: '아쿠아리아 산호 패', quantity: 1 }, { name: '해저 약초', quantity: 3 }],
    startingTraits: ['FATE_AQUARIAN'], worldFlags: ['START_AQUARIA', 'UNDERWATER_NATIVE'],
    introSituation: '아쿠아리아 외곽의 푸른 조류 사이에서 수상도시의 폐기물이 가라앉는 모습을 목격한다.',
  },
  {
    id: 'fate_forezin_villager', name: '부락의 수호자',
    description: '포레진의 부락 주민으로 그란디아 침략과 자원 약탈을 눈앞에서 겪으며 시작한다.',
    allowedRaces: ['ELF', 'BEASTKIN'], allowedRegions: ['FOREZIN'], startLocationTag: 'FOREZIN_VILLAGE',
    startingRupees: 80, startingItems: [{ name: '숲길 지도', quantity: 1 }, { name: '약초', quantity: 5 }],
    startingTraits: ['FATE_FOREST_NATIVE'], worldFlags: ['START_FOREZIN_VILLAGE'],
    introSituation: '강변 부락에서 멀리 들려오는 도끼질과 광산 폭음을 들으며 하루를 시작한다.',
  },
  {
    id: 'fate_santimac_resident', name: '무너지는 평화의 주민',
    description: '레무시안의 변화와 불안을 가까이서 지켜본 주민으로 시작한다.',
    allowedRaces: ['BEASTKIN', 'HUMAN', 'ELF'], allowedRegions: ['SANTIMAC'], startLocationTag: 'REMUSIAN_OUTER',
    startingRupees: 100, startingItems: [{ name: '레무시안 통행표', quantity: 1 }, { name: '작은 회복약', quantity: 2 }],
    startingTraits: ['FATE_SANTIMAC_RESIDENT'], worldFlags: ['START_REMUSIAN'],
    introSituation: '레무시안의 화려한 거리 뒤에서 주민들이 사라진다는 소문을 들으며 시작한다.',
  },
  {
    id: 'fate_prosti_native', name: '설산의 딸',
    description: '프로스티의 설원과 고산 지형을 삶의 터전으로 삼아온 주민으로 시작한다.',
    allowedRaces: ['YETI', 'BEASTKIN'], allowedBeastkinTypes: ['WOLF'], allowedRegions: ['PROSTI'], startLocationTag: 'PROSTI_VILLAGE',
    startingRupees: 70, startingItems: [{ name: '설산 털망토', quantity: 1 }, { name: '고산 건조육', quantity: 3 }],
    startingTraits: ['FATE_SNOW_NATIVE'], worldFlags: ['START_PROSTI', 'COLD_ACCLIMATED'],
    introSituation: '대설산의 그림자 아래, 하늘로 이어지는 봉우리를 올려다보며 눈길을 나선다.',
  },
  {
    id: 'fate_scroze_bird', name: '구름길의 정찰자',
    description: '하늘의 작은 부유 부락에서 태어나 구름과 바람을 길로 삼아온 새 수인의 운명.',
    allowedRaces: ['BEASTKIN'], allowedBeastkinTypes: ['BIRD'], allowedRegions: ['SCROZE'], startLocationTag: 'SKY_VILLAGE',
    startingRupees: 80, startingItems: [{ name: '낡은 하늘 나침반', quantity: 1 }],
    startingTraits: ['FATE_SKY_NATIVE'], worldFlags: ['START_SCROZE_SKY', 'SKY_NATIVE_ACCESS'],
    introSituation: '구름 사이 작은 부유 부락에서 바람의 방향을 읽으며 새로운 항로를 바라본다.',
  },
  {
    id: 'fate_scroze_fox', name: '에도와의 여우',
    description: '천공의 신사 에도와와 연결된 여우 수인의 운명.',
    allowedRaces: ['BEASTKIN'], allowedBeastkinTypes: ['FOX'], allowedRegions: ['SCROZE'], startLocationTag: 'EDOWA_APPROACH',
    startingRupees: 100, startingItems: [{ name: '에도와의 작은 부적', quantity: 1 }],
    startingTraits: ['FATE_EDOWA'], worldFlags: ['START_SCROZE_CELESTIAL', 'CELESTIAL_NATIVE_ACCESS'],
    introSituation: '구름보다 높은 곳, 에도와로 이어지는 신사길에서 풍경 소리를 들으며 눈을 뜬다.',
  },
];

export function getAvailableFates(race: Race, regionId: WorldRegionId, beastkinType?: BeastkinType): FateDefinition[] {
  return FATE_DEFINITIONS.filter((fate) => {
    // 용족은 운명이 고정되지 않아 어느 지역의 시작 상황도 선택할 수 있다.
    if (race === 'DRAGONKIN') return fate.allowedRegions.includes(regionId);
    if (!fate.allowedRaces.includes(race) || !fate.allowedRegions.includes(regionId)) return false;
    if (fate.allowedBeastkinTypes && (!beastkinType || !fate.allowedBeastkinTypes.includes(beastkinType))) return false;
    return true;
  });
}
