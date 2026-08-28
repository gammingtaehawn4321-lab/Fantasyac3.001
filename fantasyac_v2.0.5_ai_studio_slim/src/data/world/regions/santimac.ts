import type { RegionDefinition } from '../regionTypes';

/** USER EDITABLE REGION LORE — 산티맥 */
export const SANTIMAC_REGION: RegionDefinition = {
  id: 'SANTIMAC',
  name: '산티맥',
  classification: 'LAND_REGION',
  summary: '남부 수인 도시 레무시안과 북부 엘프 도시 데저트 알토가 나누어 통치하는 이중 권역.',
  lore: '남부에는 고양이 수인을 중심으로 한 수인 도시 레무시안이 있고, 북부에는 외부인의 출입을 차단한 엘프 도시 데저트 알토가 있다. 레무시안은 새 파라오 클레라의 인간 친화 정책 이후 겉으로는 평화로워 보이지만, 인간 재상이 정보와 행정을 장악하면서 수인의 권리를 박탈하고 납치·추방·착취가 확산되고 있다. 클레라는 재상의 폭력과 심리적 통제 아래 정치적 판단력을 잃어가고 있다. 데저트 알토의 내부는 엘프 외 종족에게 거의 알려져 있지 않다.',
  geography: '남부의 도시·사막성 평원과 북부의 폐쇄된 엘프 권역이 대비되는 지역.',
  climate: '남부는 건조하고 더우며, 북부는 마법적 환경 영향이 강하다.',
  majorPeoples: ['고양이 수인', '여러 수인', '엘프', '인간'],
  capitals: [
    { name: '레무시안', people: '수인', notes: '남부 수인 도시. 파라오 클레라가 통치.' },
    { name: '데저트 알토', people: '엘프', notes: '북부 엘프 도시. 비엘프 출입 금지.' },
  ],
  settlements: ['레무시안', '데저트 알토', '남부 외곽 수인 거주지'],
  factions: ['클레라 왕실', '인간 재상 세력', '수인 저항 세력', '데저트 알토 엘프'],
  conflicts: ['재상의 권력 장악', '수인 권리 박탈', '납치와 추방', '클레라에 대한 강압적 통제', '데저트 알토의 폐쇄성'],
  raceRelations: [
    { race: 'BEASTKIN', attitude: 'OPPRESSED', notes: '과거 보호받았으나 현재 남부에서 권리 박탈이 진행 중.' },
    { race: 'HUMAN', attitude: 'WARY', notes: '정권 핵심에서는 영향력이 커졌지만 주민과의 갈등이 심하다.' },
    { race: 'ELF', attitude: 'FAVORED', notes: '북부 데저트 알토 내부의 중심 종족.' },
    { race: 'MERFOLK', attitude: 'NEUTRAL', notes: '드문 외부 방문자.' },
    { race: 'YETI', attitude: 'WARY', notes: '북부 경계에서 외부인으로 취급.' },
  ],
  worldStateKeys: [
    { id: 'human_influence', name: '인간 영향력', description: '남부 행정과 치안에 침투한 인간 세력의 영향.', defaultValue: 72, min: 0, max: 100 },
    { id: 'beastkin_rights', name: '수인 권리', description: '법적·사회적 권리의 보장 수준.', defaultValue: 18, min: 0, max: 100 },
    { id: 'clera_control', name: '클레라 통제도', description: '재상이 클레라의 의사결정을 장악한 정도.', defaultValue: 86, min: 0, max: 100 },
    { id: 'desert_alto_secrecy', name: '데저트 알토 비밀도', description: '외부에 알려지지 않은 정보의 정도.', defaultValue: 95, min: 0, max: 100 },
  ],
  defaultTerrains: ['PLAINS', 'HILL', 'URBAN', 'FOREST'],
  supportedLayers: ['SURFACE'],
  editableNotes: '데저트 알토 내부 설정은 의도적으로 UNKNOWN 상태 유지 가능.',
};
