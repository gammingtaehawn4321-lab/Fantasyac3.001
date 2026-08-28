import type { RegionDefinition } from '../regionTypes';

/** USER EDITABLE REGION LORE — 프로스티 */
export const PROSTI_REGION: RegionDefinition = {
  id: 'PROSTI',
  name: '프로스티',
  classification: 'VERTICAL_REGION',
  summary: '하늘까지 닿는 초거대 설산. 설인과 늑대 수인이 공생하며 살아간다.',
  lore: '판타지악 대륙에서 가장 거대한 설산 지대다. 수컷 설인은 예티를 닮은 4~6m의 거구이며, 암컷 설인은 흰 머리와 굽은 뿔을 지닌 인간형에 가까운 모습이다. 설인 암컷은 인간 세력의 장기간 납치와 매매로 멸종 위기에 처했고, 현재 프로스티에서는 설인 수컷과 늑대 수인 여성 집단이 상호 의존적인 공동체를 이루어 종족을 유지한다. 대설산 중앙 정상부는 지상에서 하늘 레이어로 직접 이어지는 자연 통로다.',
  geography: '하부 설원, 빙벽, 고산 협곡, 중앙 대설산, 정상부의 하늘 진입 지점.',
  climate: '극한 한랭·강설·강풍. 고도에 따라 기압과 기온이 급격히 변한다.',
  majorPeoples: ['설인', '늑대 수인'],
  capitals: [],
  settlements: ['설인 산촌', '늑대 수인 설원 취락', '대설산 중턱 야영지'],
  factions: ['설인 장로회', '늑대 수인 무리', '산악 구조대', '외부 밀렵·인신매매 조직'],
  conflicts: ['설인 암컷 멸종 위기', '외부 납치·매매 세력', '혹독한 환경', '하늘 통로 통제'],
  raceRelations: [
    { race: 'YETI', attitude: 'FAVORED', notes: '프로스티의 핵심 종족.' },
    { race: 'BEASTKIN', beastkinType: 'WOLF', attitude: 'FAVORED', notes: '설인 공동체와 깊은 공생 관계.' },
    { race: 'HUMAN', attitude: 'HOSTILE', notes: '과거 납치와 매매 때문에 강한 불신과 적대가 존재.' },
    { race: 'ELF', attitude: 'NEUTRAL', notes: '드문 외부 방문자.' },
    { race: 'MERFOLK', attitude: 'NEUTRAL', notes: '기후 적응이 어려운 외부 종족.' },
  ],
  worldStateKeys: [
    { id: 'female_yeti_population', name: '설인 암컷 개체수', description: '멸종 위기에 놓인 설인 암컷 집단의 회복 수준.', defaultValue: 8, min: 0, max: 100 },
    { id: 'human_raider_pressure', name: '외부 약탈 압력', description: '납치·밀렵 세력의 활동 정도.', defaultValue: 62, min: 0, max: 100 },
    { id: 'sky_pass_stability', name: '하늘 통로 안정도', description: '대설산 정상부 하늘 진입로의 안정성.', defaultValue: 55, min: 0, max: 100 },
  ],
  defaultTerrains: ['SNOW', 'MOUNTAIN'],
  supportedLayers: ['SURFACE', 'SKY'],
  editableNotes: '플레이어 설인은 여성 고정이므로 암컷 설인 외형 규칙을 사용한다.',
};
