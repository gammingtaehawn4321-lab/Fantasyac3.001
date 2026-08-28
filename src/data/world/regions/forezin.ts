import type { RegionDefinition } from '../regionTypes';

/** USER EDITABLE REGION LORE — 포레진 */
export const FOREZIN_REGION: RegionDefinition = {
  id: 'FOREZIN',
  name: '포레진',
  classification: 'LAND_REGION',
  summary: '숲과 강, 여러 중형 부락으로 이루어진 아름다운 자연 지역. 최근 그란디아의 침략을 받고 있다.',
  lore: '수도 없이 여러 중형 규모의 부락이 독립적으로 이어지는 숲과 강의 지역이다. 개 수인과 엘프가 주로 거주한다. 최근 이웃 그란디아가 목재·광물·수자원을 노리고 침략하여 대규모 벌목과 채굴을 벌이고, 강을 오염시키며 주민을 납치하고 있다.',
  geography: '거대한 숲, 굽이치는 강, 계곡과 자원 지대, 부락 사이의 좁은 길.',
  climate: '강수량이 풍부하고 식생이 울창한 온난 습윤 기후.',
  majorPeoples: ['개 수인', '엘프'],
  capitals: [],
  settlements: ['중형 부락 연합', '강변 부락', '숲속 부락', '국경 피난 부락'],
  factions: ['포레진 부락 연합', '엘프 자연수호자', '개 수인 순찰대', '그란디아 자원개발대'],
  conflicts: ['그란디아 침략', '무차별 벌목', '광산 난개발', '하천 오염', '주민 납치'],
  raceRelations: [
    { race: 'BEASTKIN', beastkinType: 'DOG', attitude: 'FAVORED', notes: '주요 주민.' },
    { race: 'ELF', attitude: 'FAVORED', notes: '주요 주민이자 숲의 수호 세력.' },
    { race: 'HUMAN', attitude: 'HOSTILE', notes: '그란디아 침략 때문에 강한 경계와 적대가 존재.' },
    { race: 'MERFOLK', attitude: 'NEUTRAL', notes: '강 하류에서 드물게 교류.' },
    { race: 'YETI', attitude: 'NEUTRAL', notes: '외부 종족으로 특별한 역사적 적대는 없음.' },
  ],
  worldStateKeys: [
    { id: 'forest_loss', name: '산림 파괴도', description: '벌목으로 파괴된 숲의 비율.', defaultValue: 45, min: 0, max: 100 },
    { id: 'river_pollution', name: '하천 오염도', description: '채굴과 폐기물로 오염된 강의 정도.', defaultValue: 38, min: 0, max: 100 },
    { id: 'grandia_occupation', name: '그란디아 점령도', description: '포레진 내부 그란디아 세력의 영향력.', defaultValue: 42, min: 0, max: 100 },
    { id: 'villager_displacement', name: '주민 피해도', description: '납치·강제이주 등 주민 피해 규모.', defaultValue: 40, min: 0, max: 100 },
  ],
  defaultTerrains: ['FOREST', 'RIVER', 'HILL'],
  supportedLayers: ['SURFACE'],
  editableNotes: '수도 없음. 개별 부락 이름과 위치는 이후 추가 가능.',
};
