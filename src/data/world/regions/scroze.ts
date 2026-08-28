import type { RegionDefinition } from '../regionTypes';

/** USER EDITABLE REGION LORE — 스크로제 */
export const SCROZE_REGION: RegionDefinition = {
  id: 'SCROZE',
  name: '스크로제',
  classification: 'AERIAL_REGION',
  summary: '지상·지하를 제외한 판타지악의 하늘과 천공 전체를 가리키는 상공 지역.',
  lore: '스크로제는 하나의 지상 영토가 아니라 판타지악 대륙의 하늘과 그보다 높은 천공을 통칭한다. 하늘에는 새 수인의 소규모 부유 부락과 자원지·적 거점이 흩어져 있으며 전체 하늘 지도 중 약 1/5만 실제 부유 육지다. 천공에는 끊임없이 고도와 위치를 바꾸는 새 수인의 천공도시 아벨라와 여우 수인의 고향 신사 에도와가 있다.',
  geography: '구름층과 빈 하늘, 부유 육지, 상승기류, 태풍, 그 위의 천공 레이어.',
  climate: '고도에 따라 강풍·저기압·폭풍·태풍이 발생하며, 천공에서는 일반 기상 규칙과 다른 현상이 나타난다.',
  majorPeoples: ['새 수인', '여우 수인'],
  capitals: [
    { name: '천공도시 아벨라', people: '새 수인', notes: '고도와 지도 좌표가 시간에 따라 이동하는 이동 도시.' },
    { name: '에도와', people: '여우 수인', notes: '여우 수인의 고향 신사.' },
  ],
  settlements: ['아벨라', '에도와', '새 수인 부유 부락', '비행선 정박지'],
  factions: ['아벨라 부유 부락 연합', '에도와 신사 세력', '비행선 선단', '상공 약탈 세력'],
  conflicts: ['변동하는 항로', '태풍과 상승기류', '부유 자원지 쟁탈', '아벨라 위치 추적'],
  raceRelations: [
    { race: 'BEASTKIN', beastkinType: 'BIRD', attitude: 'FAVORED', notes: '하늘 부락의 주요 주민.' },
    { race: 'BEASTKIN', beastkinType: 'FOX', attitude: 'FAVORED', notes: '에도와의 주요 주민.' },
    { race: 'HUMAN', attitude: 'WARY', notes: '비행 기술과 허가가 필요한 외부 방문자.' },
    { race: 'ELF', attitude: 'NEUTRAL', notes: '마법을 통해 진입 가능한 외부 종족.' },
    { race: 'YETI', attitude: 'NEUTRAL', notes: '프로스티 정상부를 통해 하늘과 접촉.' },
    { race: 'MERFOLK', attitude: 'WARY', notes: '상공 이동수단 없이는 접근이 매우 어렵다.' },
  ],
  worldStateKeys: [
    { id: 'abella_drift', name: '아벨라 변동성', description: '천공도시 아벨라가 하루 동안 이동하는 정도.', defaultValue: 70, min: 0, max: 100 },
    { id: 'storm_activity', name: '상공 폭풍 활동', description: '상승기류와 태풍 발생 빈도.', defaultValue: 50, min: 0, max: 100 },
    { id: 'floating_land_control', name: '부유지 통제도', description: '안전한 부유 육지의 확보 수준.', defaultValue: 35, min: 0, max: 100 },
  ],
  defaultTerrains: ['CLOUD', 'FLOATING_LAND', 'STORM', 'SHRINE'],
  supportedLayers: ['SKY', 'CELESTIAL'],
  editableNotes: '하늘 자유 항법은 하늘 지도+나침반+망원경, 천공 자유 항법은 천공용 3도구를 요구한다.',
};
