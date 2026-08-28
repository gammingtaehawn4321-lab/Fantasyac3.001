import type { WorldRegionId, WorldMapLayer, HexTerrain } from '../../types';

export interface TravelEventDefinition {
  id: string;
  name: string;
  regionId: WorldRegionId;
  layers: WorldMapLayer[];
  terrains?: HexTerrain[];
  weight: number;
  description: string;
  resultText: string;
  requiredFlags?: string[];
}

export const TRAVEL_EVENTS: TravelEventDefinition[] = [
  { id:'grandia_patrol', name:'왕도 검문', regionId:'GRANDIA', layers:['SURFACE'], terrains:['PLAINS','URBAN'], weight:16, description:'왕도 순찰대가 여행자의 신분과 짐을 확인한다.', resultText:'그란디아 순찰대의 검문을 마주쳤다.' },
  { id:'grandia_sewer_mark', name:'하수도 표식', regionId:'GRANDIA', layers:['SURFACE'], terrains:['URBAN'], weight:6, description:'암시장으로 이어지는 것으로 보이는 비밀 표식을 발견한다.', resultText:'벽 아래에서 지하 하수도로 이어지는 암호 표식을 발견했다.' },
  { id:'seire_pollution', name:'오염 해류', regionId:'SEIRE', layers:['UNDERWATER','DEEP_SEA'], weight:18, description:'수상도시에서 내려온 폐기물이 해류를 타고 흐른다.', resultText:'탁한 오염 해류가 시야를 가렸다.' },
  { id:'seire_torn_net', name:'찢어진 포획망', regionId:'SEIRE', layers:['UNDERWATER'], weight:9, description:'누군가 빠져나간 듯 찢어진 대형 포획망이 떠 있다.', resultText:'해저에서 거대한 포획망의 잔해를 발견했다.' },
  { id:'forezin_logging', name:'벌목 소리', regionId:'FOREZIN', layers:['SURFACE'], terrains:['FOREST'], weight:18, description:'멀리서 대규모 벌목 소리가 들린다.', resultText:'그란디아 자원개발대가 숲을 베어내는 흔적을 발견했다.' },
  { id:'forezin_refugees', name:'부락 피난민', regionId:'FOREZIN', layers:['SURFACE'], weight:9, description:'고향을 떠난 주민들이 강변을 따라 이동한다.', resultText:'침략을 피해 이동하는 부락 주민들과 마주쳤다.' },
  { id:'santimac_false_notice', name:'모순된 공고문', regionId:'SANTIMAC', layers:['SURFACE'], terrains:['URBAN'], weight:12, description:'도시의 공식 공고와 주민들의 이야기가 서로 맞지 않는다.', resultText:'레무시안의 공식 발표와 현실 사이의 모순을 확인했다.' },
  { id:'prosti_whiteout', name:'화이트아웃', regionId:'PROSTI', layers:['SURFACE'], terrains:['SNOW','MOUNTAIN'], weight:16, description:'눈보라가 갑자기 시야를 완전히 가린다.', resultText:'강한 눈보라 때문에 이동 속도가 잠시 느려졌다.' },
  { id:'scroze_updraft', name:'상승기류', regionId:'SCROZE', layers:['SKY'], weight:8, description:'천공으로 이어질 수 있는 거대한 상승기류가 형성된다.', resultText:'상승기류가 구름층을 뚫고 천공을 향해 솟구쳤다.' },
  { id:'scroze_typhoon', name:'천공 태풍', regionId:'SCROZE', layers:['SKY'], terrains:['STORM','CLOUD'], weight:5, description:'위험하지만 천공으로 밀어 올릴 수 있는 태풍이 접근한다.', resultText:'거대한 태풍의 눈이 천공 방향으로 길을 열었다.' },
];
