import type { RegionDefinition } from '../regionTypes';

/** USER EDITABLE REGION LORE — 세이레 */
export const SEIRE_REGION: RegionDefinition = {
  id: 'SEIRE',
  name: '세이레',
  classification: 'OCEAN_REGION',
  summary: '수상 인간 도시와 해저 인어족 사회가 충돌하는 바다·심해 지역.',
  lore: '인간은 수상에, 인어족은 해저에 살아가는 해양 지형이다. 수상도시 스카이에서 배출되는 쓰레기와 폐기물로 해저가 오염되었고, 일부 인간 세력은 인어족을 포획·매매·학대해 왔다. 이 때문에 인어족 사회의 대인간 적대감이 극단적으로 높아졌으며 아쿠아리아 내부에서는 수상도시 스카이를 침몰시키려는 계획이 진행 중이다.',
  geography: '수면, 연안, 해저 평원, 해구와 심해가 수직으로 연결된 다층 해양 지형.',
  climate: '해양성 기후. 수상은 폭풍의 영향을 받고 해저는 수온과 수압 차가 크다.',
  majorPeoples: ['인간', '인어족'],
  capitals: [
    { name: '수상도시 스카이', people: '인간', notes: '수면 위의 인간 수도.' },
    { name: '아쿠아리아', people: '인어족', notes: '해저의 인어족 수도.' },
  ],
  settlements: ['수상도시 스카이', '아쿠아리아', '해저 외곽 취락', '부유 선착장'],
  factions: ['스카이 수상정부', '아쿠아리아 의회', '인어족 강경파', '해상 상단'],
  conflicts: ['해저 오염', '인어족 포획과 인신매매', '스카이 침몰 계획', '수상-해저 전쟁 긴장'],
  raceRelations: [
    { race: 'HUMAN', attitude: 'FAVORED', notes: '수상권의 중심 종족.' },
    { race: 'MERFOLK', attitude: 'HOSTILE', notes: '수상 인간 사회와 적대. 해저에서는 반대로 중심 종족.' },
    { race: 'BEASTKIN', attitude: 'WARY', notes: '수상에서는 이방인, 해저에서는 개별적으로 평가.' },
    { race: 'ELF', attitude: 'NEUTRAL', notes: '드문 외부 방문자.' },
    { race: 'YETI', attitude: 'WARY', notes: '해양 환경에 낯선 외부 종족.' },
  ],
  worldStateKeys: [
    { id: 'pollution', name: '해저 오염도', description: '스카이 폐기물로 인한 해저 오염.', defaultValue: 72, min: 0, max: 100 },
    { id: 'merfolk_anger', name: '인어족 분노', description: '인간 사회를 향한 집단적 적대감.', defaultValue: 82, min: 0, max: 100 },
    { id: 'war_tension', name: '전쟁 긴장도', description: '스카이와 아쿠아리아 사이의 전쟁 위험.', defaultValue: 68, min: 0, max: 100 },
  ],
  defaultTerrains: ['COAST', 'SEA', 'DEEP_SEA'],
  supportedLayers: ['SURFACE', 'UNDERWATER', 'DEEP_SEA'],
  editableNotes: '인어족은 수인계에서 갈라졌지만 게임 데이터상 MERFOLK 독립 종족으로 취급.',
};
