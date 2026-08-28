import type { WorldMapLayer, WorldRegionId } from '../../types';

export type UndergroundEntranceType = 'MINE' | 'CANYON' | 'SINKHOLE' | 'DUNGEON_RESERVED';

export interface UndergroundEntranceDefinition {
  hookId: string;
  regionId: Exclude<WorldRegionId, 'SCROZE'>;
  sourceLayer: Extract<WorldMapLayer, 'SURFACE' | 'UNDERWATER'>;
  q: number;
  r: number;
  type: UndergroundEntranceType;
  surfaceName: string;
  undergroundName: string;
  sectorId: string;
  /** true면 1층의 다른 동굴망과 연결되지 않고 이 입구로만 도달 가능한 고립 공동을 만든다. */
  isolatedPocket?: boolean;
}

export interface UndergroundLayerBossDefinition {
  regionId: Exclude<WorldRegionId, 'SCROZE'>;
  layer: Extract<WorldMapLayer, 'UNDERGROUND' | 'DEEP_UNDERGROUND'>;
  monsterId: string;
  name: string;
  clearFlag: string;
  nextLayer: Extract<WorldMapLayer, 'DEEP_UNDERGROUND' | 'HELL'>;
}

export const UNDERGROUND_ENTRANCES: UndergroundEntranceDefinition[] = [
  {hookId:'UG_GRANDIA_MINE_01',regionId:'GRANDIA',sourceLayer:'SURFACE',q:-15,r:-2,type:'MINE',surfaceName:'왕도 서부 광산',undergroundName:'왕도 서부 폐광 입구',sectorId:'grandia_underground_mines'},
  {hookId:'UG_GRANDIA_CANYON_01',regionId:'GRANDIA',sourceLayer:'SURFACE',q:-10,r:4,type:'CANYON',surfaceName:'그란디아 붉은 협곡',undergroundName:'붉은 협곡 하부 균열',sectorId:'grandia_underground_caverns'},
  {hookId:'UG_GRANDIA_SINK_01',regionId:'GRANDIA',sourceLayer:'SURFACE',q:-14,r:4,type:'SINKHOLE',surfaceName:'초원 싱크홀',undergroundName:'초원 싱크홀 고립 공동',sectorId:'grandia_underground_caverns',isolatedPocket:true},
  {hookId:'UG_GRANDIA_DUNGEON_01',regionId:'GRANDIA',sourceLayer:'SURFACE',q:-8,r:-2,type:'DUNGEON_RESERVED',surfaceName:'미개방 던전 부지',undergroundName:'봉인 석문 전실',sectorId:'grandia_underground_depths'},

  {hookId:'UG_FOREZIN_MINE_01',regionId:'FOREZIN',sourceLayer:'SURFACE',q:-4,r:-10,type:'MINE',surfaceName:'포레진 광맥 갱도',undergroundName:'수림 광맥 갱도',sectorId:'forezin_underground_roots'},
  {hookId:'UG_FOREZIN_CANYON_01',regionId:'FOREZIN',sourceLayer:'SURFACE',q:-1,r:-7,type:'CANYON',surfaceName:'수림 협곡',undergroundName:'수림 협곡 지하수로',sectorId:'forezin_underground_river'},
  {hookId:'UG_FOREZIN_SINK_01',regionId:'FOREZIN',sourceLayer:'SURFACE',q:-7,r:-7,type:'SINKHOLE',surfaceName:'뿌리 싱크홀',undergroundName:'거목 뿌리 고립 공동',sectorId:'forezin_underground_roots',isolatedPocket:true},
  {hookId:'UG_FOREZIN_DUNGEON_01',regionId:'FOREZIN',sourceLayer:'SURFACE',q:-2,r:-4,type:'DUNGEON_RESERVED',surfaceName:'숲속 봉인 유적',undergroundName:'봉인 유적 지하 전실',sectorId:'forezin_underground_depths'},

  {hookId:'UG_SEIRE_MINE_01',regionId:'SEIRE',sourceLayer:'UNDERWATER',q:-5,r:11,type:'MINE',surfaceName:'해저 광맥',undergroundName:'침수 광맥 동굴',sectorId:'seire_underground_flooded'},
  {hookId:'UG_SEIRE_SINK_01',regionId:'SEIRE',sourceLayer:'UNDERWATER',q:-7,r:10,type:'SINKHOLE',surfaceName:'청색 심공',undergroundName:'청색 심공 고립 하부',sectorId:'seire_underground_trench',isolatedPocket:true},
  {hookId:'UG_SEIRE_DUNGEON_01',regionId:'SEIRE',sourceLayer:'UNDERWATER',q:1,r:11,type:'DUNGEON_RESERVED',surfaceName:'침수 유적 입구',undergroundName:'침수 유적 전실',sectorId:'seire_underground_ruins'},

  {hookId:'UG_SANTIMAC_MINE_01',regionId:'SANTIMAC',sourceLayer:'SURFACE',q:13,r:-1,type:'MINE',surfaceName:'산티맥 동부 광산',undergroundName:'동부 폐광 갱도',sectorId:'santimac_underground_mines'},
  {hookId:'UG_SANTIMAC_CANYON_01',regionId:'SANTIMAC',sourceLayer:'SURFACE',q:14,r:4,type:'CANYON',surfaceName:'산티맥 대협곡',undergroundName:'대협곡 지하 균열',sectorId:'santimac_underground_chasm'},
  {hookId:'UG_SANTIMAC_SINK_01',regionId:'SANTIMAC',sourceLayer:'SURFACE',q:6,r:3,type:'SINKHOLE',surfaceName:'남부 함몰지',undergroundName:'남부 함몰 고립 공동',sectorId:'santimac_underground_chasm',isolatedPocket:true},
  {hookId:'UG_SANTIMAC_DUNGEON_01',regionId:'SANTIMAC',sourceLayer:'SURFACE',q:12,r:6,type:'DUNGEON_RESERVED',surfaceName:'폐쇄된 석문',undergroundName:'폐쇄 석문 지하 전실',sectorId:'santimac_underground_ruins'},

  {hookId:'UG_PROSTI_MINE_01',regionId:'PROSTI',sourceLayer:'SURFACE',q:11,r:-9,type:'MINE',surfaceName:'빙벽 광산',undergroundName:'빙벽 광산 내부',sectorId:'prosti_underground_crystal'},
  {hookId:'UG_PROSTI_CANYON_01',regionId:'PROSTI',sourceLayer:'SURFACE',q:5,r:-10,type:'CANYON',surfaceName:'빙설 대협곡',undergroundName:'빙설 대협곡 하부',sectorId:'prosti_underground_icecave'},
  {hookId:'UG_PROSTI_SINK_01',regionId:'PROSTI',sourceLayer:'SURFACE',q:9,r:-12,type:'SINKHOLE',surfaceName:'빙하 싱크홀',undergroundName:'빙하 싱크홀 고립 공동',sectorId:'prosti_underground_depths',isolatedPocket:true},
  {hookId:'UG_PROSTI_DUNGEON_01',regionId:'PROSTI',sourceLayer:'SURFACE',q:4,r:-8,type:'DUNGEON_RESERVED',surfaceName:'얼어붙은 던전 입구',undergroundName:'얼어붙은 봉인 전실',sectorId:'prosti_underground_depths'},
];

export const UNDERGROUND_LAYER_BOSSES: UndergroundLayerBossDefinition[] = [
  {regionId:'GRANDIA',layer:'UNDERGROUND',monsterId:'grandia_sewer_tentacle',name:'왕도 지하층 수문장',clearFlag:'UG_BOSS_GRANDIA_CLEARED',nextLayer:'DEEP_UNDERGROUND'},
  {regionId:'FOREZIN',layer:'UNDERGROUND',monsterId:'forezin_ancient_root',name:'포레진 지하층 수문장',clearFlag:'UG_BOSS_FOREZIN_CLEARED',nextLayer:'DEEP_UNDERGROUND'},
  {regionId:'SEIRE',layer:'UNDERGROUND',monsterId:'seire_polluted_tentacle',name:'세이레 지하층 수문장',clearFlag:'UG_BOSS_SEIRE_CLEARED',nextLayer:'DEEP_UNDERGROUND'},
  {regionId:'SANTIMAC',layer:'UNDERGROUND',monsterId:'santimac_chasm_tentacle',name:'산티맥 지하층 수문장',clearFlag:'UG_BOSS_SANTIMAC_CLEARED',nextLayer:'DEEP_UNDERGROUND'},
  {regionId:'PROSTI',layer:'UNDERGROUND',monsterId:'prosti_crystal_sentinel',name:'프로스티 지하층 수문장',clearFlag:'UG_BOSS_PROSTI_CLEARED',nextLayer:'DEEP_UNDERGROUND'},
  {regionId:'GRANDIA',layer:'DEEP_UNDERGROUND',monsterId:'grandia_lantern_roach',name:'그란디아 심층 주인',clearFlag:'DEEP_BOSS_GRANDIA_CLEARED',nextLayer:'HELL'},
  {regionId:'FOREZIN',layer:'DEEP_UNDERGROUND',monsterId:'forezin_iron_ant_guard',name:'포레진 심층 주인',clearFlag:'DEEP_BOSS_FOREZIN_CLEARED',nextLayer:'HELL'},
  {regionId:'SEIRE',layer:'DEEP_UNDERGROUND',monsterId:'seire_abyss_waterbug',name:'세이레 심층 주인',clearFlag:'DEEP_BOSS_SEIRE_CLEARED',nextLayer:'HELL'},
  {regionId:'SANTIMAC',layer:'DEEP_UNDERGROUND',monsterId:'santimac_chasm_centipede',name:'산티맥 심층 주인',clearFlag:'DEEP_BOSS_SANTIMAC_CLEARED',nextLayer:'HELL'},
  {regionId:'PROSTI',layer:'DEEP_UNDERGROUND',monsterId:'prosti_frost_spider_queen',name:'프로스티 심층 주인',clearFlag:'DEEP_BOSS_PROSTI_CLEARED',nextLayer:'HELL'},
];

export const UNDERGROUND_DEVELOPMENT = {
  status: 'THREE_LAYER_FOUNDATION' as const,
  enabled: true,
  label: '지하',
  message: '지하는 거대한 동굴 미로인 1층 지하와 고위험 2층 심층으로 구성됩니다. 지역별 1층 보스를 쓰러뜨려야 심층으로 내려갈 수 있습니다.',
  entranceCount: UNDERGROUND_ENTRANCES.length,
  layers: [
    { id:'UNDERGROUND', label:'지하', implemented:true, dangerMultiplier:1, rewardMultiplier:1 },
    { id:'DEEP_UNDERGROUND', label:'심층', implemented:true, dangerMultiplier:1.65, rewardMultiplier:1.8 },
    { id:'HELL', label:'지옥', implemented:false, dangerMultiplier:2.5, rewardMultiplier:3 },
  ] as const,
  hellMessage: '지옥층은 아직 미구현입니다. 심층 보스를 처치하면 향후 진입에 사용할 봉인 해제 플래그만 기록됩니다.',
};
