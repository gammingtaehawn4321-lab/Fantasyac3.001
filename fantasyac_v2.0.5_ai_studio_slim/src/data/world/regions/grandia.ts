import type { RegionDefinition } from '../regionTypes';

/**
 * USER EDITABLE REGION LORE — 그란디아
 * 이 객체의 문구를 수정하면 세계관 설명/UI/운명 참조에 그대로 반영됩니다.
 */
export const GRANDIA_REGION: RegionDefinition = {
  id: 'GRANDIA',
  name: '그란디아',
  classification: 'LAND_REGION',
  summary: '인간 중심의 초원·언덕 지대. 대도시 더 펠리스를 중심으로 강한 중앙 권력이 형성되어 있다.',
  lore: '주로 인간과 개·고양이 수인이 살아가는 초원과 언덕의 지역이다. 인간의 수도가 자리한 까닭에 인간 중심의 사회 질서가 강하고, 다른 종족에 대한 제도적 차별과 착취가 심하다. 더 펠리스의 지하 하수도에는 대륙 최대 규모의 불법 노예시장인 암시장이 성행한다.',
  geography: '넓은 초원, 완만한 언덕, 왕도 주변의 도로망과 지하 하수도.',
  climate: '온화한 대륙성 기후.',
  majorPeoples: ['인간', '개 수인', '고양이 수인'],
  capitals: [{ name: '더 펠리스', people: '인간', notes: '그란디아와 인간 세력의 대도시 수도.' }],
  settlements: ['더 펠리스', '왕도 외곽 촌락', '초원 정착지', '지하 하수도 암시장'],
  factions: ['더 펠리스 중앙정부', '왕도 상단', '암시장 조직', '비인간 해방 세력'],
  conflicts: ['비인간 종족에 대한 차별과 인신매매', '포레진 자원 침략', '암시장과 해방 세력의 충돌'],
  raceRelations: [
    { race: 'HUMAN', attitude: 'FAVORED', notes: '법과 상업에서 우대받는 중심 종족.' },
    { race: 'BEASTKIN', attitude: 'OPPRESSED', notes: '차별과 착취의 위험이 높다.' },
    { race: 'ELF', attitude: 'WARY', notes: '외부 종족으로 경계와 차별을 받는다.' },
    { race: 'MERFOLK', attitude: 'OPPRESSED', notes: '희귀 이종족으로 취급되어 인신매매 위험이 매우 높다.' },
    { race: 'YETI', attitude: 'HOSTILE', notes: '거구의 이종족으로 두려움과 적대의 대상이 된다.' },
  ],
  worldStateKeys: [
    { id: 'human_supremacy', name: '인간 우월주의', description: '인간 중심 제도와 차별의 강도.', defaultValue: 85, min: 0, max: 100 },
    { id: 'black_market_power', name: '암시장 영향력', description: '지하 암시장과 인신매매 조직의 세력.', defaultValue: 80, min: 0, max: 100 },
    { id: 'forezin_invasion', name: '포레진 침략도', description: '포레진에 투입된 벌목·채굴·군사 세력의 규모.', defaultValue: 70, min: 0, max: 100 },
  ],
  defaultTerrains: ['PLAINS', 'HILL', 'URBAN', 'RIVER'],
  supportedLayers: ['SURFACE'],
  editableNotes: '그란디아 세부 도시·세력·보스·던전은 이후 자유롭게 추가.',
};
