import type { WorldRegionId, WorldMapLayer } from '../../types';
import { REGIONAL_MONSTERS } from './monsterData';

export interface SectorEncounterProfile {
  id: string;
  name: string;
  regionId: WorldRegionId;
  layer: WorldMapLayer;
  description: string;
  eventChanceModifier: number;
  monsterShare: number;
  monsterIds: string[];
  events: string[];
}

const S = (profile: SectorEncounterProfile) => profile;

export const SECTOR_ENCOUNTER_PROFILES: Record<string, SectorEncounterProfile> = Object.fromEntries([
  S({id:'grandia_peless',name:'더 펠리스 도시권',regionId:'GRANDIA',layer:'SURFACE',description:'왕도 중심·상업·빈민 지구가 이어지는 대도시권.',eventChanceModifier:.04,monsterShare:.18,monsterIds:['grandia_black_hound','grandia_road_bandit'],events:['왕도 순찰대가 통행증을 검사한다.','골목의 정보상이 하수도 암시장에 관한 소문을 흘린다.','시장 광장에서 실종자 수배문이 새로 붙었다.']}),
  S({id:'grandia_central_plains',name:'그란디아 중앙초원',regionId:'GRANDIA',layer:'SURFACE',description:'왕도와 각 지방을 잇는 넓은 초원.',eventChanceModifier:0,monsterShare:.58,monsterIds:['grandia_grass_wolf','grandia_road_bandit'],events:['목동들이 최근 길가의 야수 흔적을 경고한다.','왕도행 상단이 휴식을 취하고 있다.','초원 곳곳에서 오래된 마차 바퀴자국이 교차한다.']}),
  S({id:'grandia_west_hills',name:'그란디아 서부구릉',regionId:'GRANDIA',layer:'SURFACE',description:'광산과 협곡이 산재한 완만한 구릉.',eventChanceModifier:.03,monsterShare:.67,monsterIds:['grandia_grass_wolf','grandia_road_bandit'],events:['폐광 주변에서 새로운 굴착 흔적을 발견했다.','협곡 아래로 정체불명의 연기가 피어오른다.','채굴 인부들이 지반 침하를 피해 돌아가고 있다.']}),
  S({id:'grandia_forezin_front',name:'포레진 침공 전선',regionId:'GRANDIA',layer:'SURFACE',description:'그란디아의 자원 수송대가 포레진 방향으로 집결하는 국경권.',eventChanceModifier:.08,monsterShare:.62,monsterIds:['grandia_road_bandit','grandia_black_hound'],events:['목재와 광석을 실은 호송대가 국경에서 돌아온다.','무장 인부들이 포레진 진입로를 넓히고 있다.','도로 옆 임시 수용소 주변의 경계가 삼엄하다.']}),
  S({id:'grandia_south_road',name:'남부 대로',regionId:'GRANDIA',layer:'SURFACE',description:'세이레 방면으로 이어지는 교역로.',eventChanceModifier:-.01,monsterShare:.45,monsterIds:['grandia_grass_wolf','grandia_road_bandit'],events:['해산물을 실은 상단이 왕도로 향한다.','길가 역참에서 세이레의 오염 해류 이야기가 들린다.','도로 관리대가 무너진 교량을 수리 중이다.']}),

  S({id:'forezin_river_villages',name:'포레진 강변 부락권',regionId:'FOREZIN',layer:'SURFACE',description:'강을 따라 여러 중형 부락이 이어진 생활권.',eventChanceModifier:-.01,monsterShare:.38,monsterIds:['forezin_briar_boar','forezin_sporeling'],events:['부락 주민들이 강물의 색이 달라졌다고 말한다.','개 수인 정찰대가 숲길을 순찰한다.','강변에서 피난민을 위한 공동 취사장이 운영되고 있다.']}),
  S({id:'forezin_deep_forest',name:'포레진 심림',regionId:'FOREZIN',layer:'SURFACE',description:'큰 나무와 지류가 빽빽하게 얽힌 깊은 숲.',eventChanceModifier:.04,monsterShare:.72,monsterIds:['forezin_briar_boar','forezin_sporeling'],events:['숲속의 오래된 표식이 다른 방향을 가리키고 있다.','강 건너에서 커다란 나무가 쓰러지는 소리가 울린다.','엘프 사냥꾼이 침입자 흔적을 추적하고 있다.']}),
  S({id:'forezin_invasion_front',name:'포레진 서부 침략지',regionId:'FOREZIN',layer:'SURFACE',description:'그란디아 벌목·채굴대가 밀고 들어온 훼손 지역.',eventChanceModifier:.10,monsterShare:.66,monsterIds:['forezin_iron_logger','forezin_briar_boar'],events:['갓 베어진 거목과 운반용 레일이 숲을 가로지른다.','그란디아 자원개발대가 주민들의 접근을 막고 있다.','오염된 지류에서 죽은 물고기가 떠오른다.']}),
  S({id:'forezin_mineral_ridge',name:'포레진 광맥 능선',regionId:'FOREZIN',layer:'SURFACE',description:'숲 사이로 광맥과 협곡이 노출된 능선.',eventChanceModifier:.06,monsterShare:.63,monsterIds:['forezin_sporeling','forezin_iron_logger'],events:['절벽에서 희귀 광맥이 반짝인다.','광산 입구의 목재 지지대가 최근 설치된 흔적을 보인다.','싱크홀 가장자리에서 차가운 바람이 올라온다.']}),

  S({id:'seire_sky_city',name:'수상도시 스카이',regionId:'SEIRE',layer:'SURFACE',description:'수면 위 거대한 구조물들이 연결된 인간의 수도.',eventChanceModifier:.04,monsterShare:.12,monsterIds:[],events:['부유 선착장 사이로 폐기물 운반선이 지나간다.','수상 경비대가 해저 접근 허가를 확인한다.','시장에서는 해저에서 건져 올린 물품이 거래되고 있다.']}),
  S({id:'seire_surface_waters',name:'세이레 외해',regionId:'SEIRE',layer:'SURFACE',description:'스카이 바깥의 넓은 바다.',eventChanceModifier:.03,monsterShare:.28,monsterIds:[],events:['멀리서 거대한 해양 생물의 등이 수면을 가른다.','조류가 갑자기 방향을 바꿔 항로가 흔들린다.','부서진 포획선 잔해가 파도에 떠다닌다.']}),
  S({id:'seire_polluted_coast',name:'오염 해역',regionId:'SEIRE',layer:'SURFACE',description:'수상도시 폐기물이 밀려드는 탁한 해역.',eventChanceModifier:.07,monsterShare:.25,monsterIds:[],events:['기름막과 쓰레기 더미가 수면을 덮고 있다.','정화 작업을 포기한 작은 부표가 떠 있다.','오염된 물결 사이로 해저의 불빛이 희미하게 보인다.']}),
  S({id:'seire_aquaria',name:'아쿠아리아 도시권',regionId:'SEIRE',layer:'UNDERWATER',description:'인어족의 해저 수도와 주변 생활권.',eventChanceModifier:.02,monsterShare:.20,monsterIds:['seire_reef_maw'],events:['아쿠아리아 경계대가 수상 방향을 감시한다.','해저 광장에서 오염 대응 물자가 배분된다.','인어족 정찰대가 포획선 이동 정보를 교환한다.']}),
  S({id:'seire_polluted_shelf',name:'오염 대륙붕',regionId:'SEIRE',layer:'UNDERWATER',description:'폐기물이 가라앉아 생태가 뒤틀린 해저.',eventChanceModifier:.09,monsterShare:.74,monsterIds:['seire_polluted_jelly','seire_reef_maw'],events:['폐그물이 바위와 산호를 뒤덮고 있다.','위에서 떨어진 금속 폐기물이 해저에 박혔다.','오염 구름 때문에 시야가 급격히 나빠진다.']}),
  S({id:'seire_deep_trench',name:'세이레 심해구',regionId:'SEIRE',layer:'DEEP_SEA',description:'빛이 거의 닿지 않는 심해 협곡과 해구.',eventChanceModifier:.11,monsterShare:.82,monsterIds:['seire_deep_hunter','seire_polluted_jelly'],events:['해구 아래에서 거대한 진동이 올라온다.','깊은 싱크홀 같은 청색 구멍이 바닥에 열려 있다.','오래된 구조물의 잔해가 퇴적물에 반쯤 파묻혀 있다.']}),

  S({id:'santimac_remusian',name:'레무시안 도시권',regionId:'SANTIMAC',layer:'SURFACE',description:'산티맥 남부의 수인 도시.',eventChanceModifier:.07,monsterShare:.30,monsterIds:['santimac_secret_patrol','santimac_enforcer'],events:['공식 공고와 주민들의 증언이 서로 모순된다.','재상 측 순찰대가 골목을 봉쇄한다.','도시 외곽에서 쫓겨난 주민들이 모여 있다.']}),
  S({id:'santimac_southlands',name:'산티맥 남부 평야',regionId:'SANTIMAC',layer:'SURFACE',description:'레무시안 주변의 평야·구릉권.',eventChanceModifier:.02,monsterShare:.57,monsterIds:['santimac_dune_cat','santimac_secret_patrol'],events:['도시로 향하던 행렬이 검문 때문에 멈춰 있다.','오래된 수인 법령 표지판이 훼손되어 있다.','구릉 위에서 레무시안의 성벽이 멀리 보인다.']}),
  S({id:'santimac_border_ridges',name:'산티맥 동부 능선',regionId:'SANTIMAC',layer:'SURFACE',description:'협곡과 광산이 이어지는 거친 능선.',eventChanceModifier:.06,monsterShare:.68,monsterIds:['santimac_dune_cat','santimac_secret_patrol'],events:['협곡 아래로 오래된 운송로가 이어진다.','폐광 안쪽에서 금속 두드리는 소리가 난다.','무너진 감시초소에서 낡은 지도를 발견한다.']}),
  S({id:'santimac_desert_alto',name:'데저트 알토 외곽권',regionId:'SANTIMAC',layer:'SURFACE',description:'외부인의 출입이 금지된 엘프 도시와 그 경계.',eventChanceModifier:.05,monsterShare:.18,monsterIds:['santimac_dune_cat'],events:['도시 방향의 길이 보이지 않는 결계에 막힌다.','엘프 경계병의 흔적만 남고 모습은 보이지 않는다.','외부인을 돌려보내는 오래된 경고석이 서 있다.']}),

  S({id:'prosti_lower_snowfield',name:'프로스티 하부 설원',regionId:'PROSTI',layer:'SURFACE',description:'대설산 기슭의 눈밭과 완만한 빙설지.',eventChanceModifier:.02,monsterShare:.62,monsterIds:['prosti_snowfang','prosti_poacher'],events:['멀리서 사냥꾼의 횃불이 움직인다.','눈 아래 오래된 짐승 발자국이 이어진다.','거센 바람이 산 위쪽의 길을 드러낸다.']}),
  S({id:'prosti_settlement',name:'설인·늑대 수인 공생 취락',regionId:'PROSTI',layer:'SURFACE',description:'프로스티 주민들이 함께 생활하는 설산 취락권.',eventChanceModifier:-.02,monsterShare:.24,monsterIds:['prosti_snowfang'],events:['취락의 큰 화로 주변에서 여행자들이 몸을 녹인다.','산 위 밀렵대의 움직임에 대한 경고가 돌고 있다.','설인들이 무너진 산길을 다시 다지고 있다.']}),
  S({id:'prosti_mid_mountain',name:'프로스티 중턱',regionId:'PROSTI',layer:'SURFACE',description:'빙벽과 협곡이 이어지는 고산 지대.',eventChanceModifier:.06,monsterShare:.73,monsterIds:['prosti_snowfang','prosti_ice_golem','prosti_poacher'],events:['빙벽 사이의 광산 입구가 눈에 반쯤 묻혀 있다.','협곡에서 눈사태 소리가 메아리친다.','얼어붙은 균열 아래로 깊은 공간이 보인다.']}),
  S({id:'prosti_summit',name:'대설산 정상권',regionId:'PROSTI',layer:'SURFACE',description:'구름을 뚫고 하늘층과 맞닿는 최고 지대.',eventChanceModifier:.10,monsterShare:.76,monsterIds:['prosti_ice_golem','prosti_poacher'],events:['구름층이 갈라지며 하늘로 이어지는 길이 열린다.','숨 쉬기 힘든 고도에서 거대한 얼음 기둥이 울린다.','정상 너머로 부유 대지가 잠깐 모습을 드러낸다.']}),

  S({id:'scroze_open_sky',name:'스크로제 개방 하늘',regionId:'SCROZE',layer:'SKY',description:'구름과 공중 해류가 이어지는 일반 하늘 항로.',eventChanceModifier:.03,monsterShare:.62,monsterIds:['scroze_cloud_ray','scroze_storm_harpy'],events:['구름 사이로 안전한 공중 항로가 잠시 열린다.','낡은 비행선 잔해가 천천히 추락하고 있다.','먼 부유섬에서 연기가 피어오른다.']}),
  S({id:'scroze_floating_isles',name:'부유 대지군',regionId:'SCROZE',layer:'SKY',description:'부유 부락·자원지·거점이 흩어진 대지군.',eventChanceModifier:.05,monsterShare:.54,monsterIds:['scroze_cloud_ray','scroze_storm_harpy'],events:['부유섬 아래에서 광물 결정이 떨어져 나온다.','작은 새 수인 부락의 풍향기가 빠르게 돈다.','낯선 깃발이 꽂힌 공중 전초기지를 발견한다.']}),
  S({id:'scroze_sky_village',name:'새 수인 부유 부락권',regionId:'SCROZE',layer:'SKY',description:'새 수인들의 소규모 부유 부락.',eventChanceModifier:-.02,monsterShare:.26,monsterIds:['scroze_cloud_ray'],events:['부락 주민들이 오늘의 안전한 기류를 알려준다.','비행 장비 수리공이 임시 정비소를 열었다.','부유 농경지에서 가벼운 수확 작업이 진행 중이다.']}),
  S({id:'scroze_stormbelt',name:'스크로제 폭풍대',regionId:'SCROZE',layer:'SKY',description:'태풍과 상승기류가 빈번한 위험 공역.',eventChanceModifier:.14,monsterShare:.72,monsterIds:['scroze_storm_harpy','scroze_cloud_ray'],events:['거대한 상승기류가 천공 방향으로 솟는다.','태풍의 눈이 이동 경로를 집어삼킨다.','번개가 연속으로 부유 암석을 때린다.']}),
  S({id:'scroze_celestial_open',name:'천공 외곽',regionId:'SCROZE',layer:'CELESTIAL',description:'하늘보다 높은 희박한 천공 공역.',eventChanceModifier:.07,monsterShare:.68,monsterIds:['scroze_sky_raider'],events:['희박한 구름 사이로 오래된 항로 표식이 나타난다.','천공 약탈대의 흔적이 부유 암석에 남아 있다.','멀리서 이동 도시의 불빛 같은 것이 보였다가 사라진다.']}),
  S({id:'scroze_edowa',name:'에도와 신사권',regionId:'SCROZE',layer:'CELESTIAL',description:'여우 수인의 고향 신사와 주변 천공 대지.',eventChanceModifier:-.01,monsterShare:.20,monsterIds:[],events:['신사로 이어지는 부유 석등이 천천히 빛난다.','바람에 여우 모양 종이가 흩날린다.','에도와의 경계에서 조용한 종소리가 들린다.']}),
  S({id:'scroze_abella',name:'천공도시 아벨라',regionId:'SCROZE',layer:'CELESTIAL',description:'날마다 위치를 바꾸는 새 수인 이동 도시권.',eventChanceModifier:.01,monsterShare:.18,monsterIds:['scroze_sky_raider'],events:['아벨라의 부유 부락들이 새로운 위치로 재배열된다.','항법사들이 다음 이동 고도를 계산하고 있다.','비행선 선장들이 천공 항로 정보를 교환한다.']}),


  // UNDERGROUND · 지역별 1차 지하망. 각 섹터는 독립 인카운터 풀을 가진다.
  S({id:'grandia_underground_mines',name:'그란디아 폐광망',regionId:'GRANDIA',layer:'UNDERGROUND',description:'왕도 서부 광산에서 뻗어 나온 오래된 갱도와 작업 공동.',eventChanceModifier:.08,monsterShare:.74,monsterIds:[],events:['버려진 광차가 경사면 아래로 혼자 굴러간다.','목재 지지대 너머에서 돌이 갈리는 소리가 들린다.','낡은 채굴 표식 뒤로 새로 파인 통로가 드러난다.']}),
  S({id:'grandia_underground_caverns',name:'그란디아 하부 공동',regionId:'GRANDIA',layer:'UNDERGROUND',description:'협곡과 싱크홀 아래에서 서로 이어지는 자연 동굴군.',eventChanceModifier:.10,monsterShare:.78,monsterIds:[],events:['천장에서 흙과 자갈이 떨어지며 작은 균열이 열린다.','지하수가 흐르는 방향에서 축축한 바람이 올라온다.','암벽에 오래된 발톱 자국과 장비 파편이 남아 있다.']}),
  S({id:'grandia_underground_depths',name:'왕도 지하 심층',regionId:'GRANDIA',layer:'UNDERGROUND',description:'봉인 석문과 미개방 구조물이 남은 깊은 지하권.',eventChanceModifier:.13,monsterShare:.82,monsterIds:[],events:['봉인된 석문 뒤에서 낮은 진동이 반복된다.','인공적으로 다듬어진 벽면이 자연 동굴 사이에 나타난다.','더 깊은 층으로 내려가는 균열이 막혀 있다.']}),

  S({id:'forezin_underground_roots',name:'포레진 거목 뿌리망',regionId:'FOREZIN',layer:'UNDERGROUND',description:'거대한 나무뿌리와 광맥이 뒤엉킨 생물성 지하 통로.',eventChanceModifier:.08,monsterShare:.72,monsterIds:[],events:['두꺼운 뿌리가 천천히 움직이며 길의 형태가 달라진다.','광석 사이로 희미한 생물 발광이 번진다.','지상에서 베어진 나무의 뿌리가 아직 수액을 흘리고 있다.']}),
  S({id:'forezin_underground_river',name:'포레진 지하수맥',regionId:'FOREZIN',layer:'UNDERGROUND',description:'강과 싱크홀의 물이 모여 흐르는 거대한 지하 하천.',eventChanceModifier:.11,monsterShare:.76,monsterIds:[],events:['지하수가 갑자기 불어나 통로 가장자리까지 차오른다.','오염된 물과 맑은 지하수가 경계선을 이루며 섞인다.','물속에서 거대한 그림자가 반대편 공동으로 사라진다.']}),
  S({id:'forezin_underground_depths',name:'포레진 봉인 심층',regionId:'FOREZIN',layer:'UNDERGROUND',description:'고대 뿌리와 봉인 유적이 만나는 깊은 공동.',eventChanceModifier:.13,monsterShare:.80,monsterIds:[],events:['뿌리가 감싼 석문에 읽을 수 없는 문양이 남아 있다.','공동 전체가 아주 느린 맥박처럼 흔들린다.','더 깊은 땅속으로 이어지는 틈이 봉인되어 있다.']}),

  S({id:'seire_underground_flooded',name:'세이레 침수 동굴',regionId:'SEIRE',layer:'UNDERGROUND',description:'해저 광맥 아래로 바닷물이 스며든 반침수 동굴망.',eventChanceModifier:.10,monsterShare:.78,monsterIds:[],events:['바닷물이 동굴 벽 틈에서 강하게 분출한다.','가라앉은 채굴 장비가 물살에 흔들린다.','천장 결정에 아쿠아리아의 빛이 희미하게 반사된다.']}),
  S({id:'seire_underground_trench',name:'청색 심공 하부',regionId:'SEIRE',layer:'UNDERGROUND',description:'해저 싱크홀보다 더 아래에 형성된 수직 지하 공동.',eventChanceModifier:.15,monsterShare:.86,monsterIds:[],events:['바닥이 보이지 않는 균열에서 차가운 물이 솟는다.','심공 아래에서 생물의 울음 같은 진동이 퍼진다.','암벽을 따라 내려가는 오래된 고정 장치가 발견된다.']}),
  S({id:'seire_underground_ruins',name:'침수 유적 지하권',regionId:'SEIRE',layer:'UNDERGROUND',description:'바닷물과 퇴적물에 절반쯤 잠긴 고대 구조물 내부.',eventChanceModifier:.12,monsterShare:.72,monsterIds:[],events:['침수된 복도 끝에서 오래된 문이 닫혀 있다.','벽면의 부조 일부가 해류에 마모되어 있다.','배수되지 않은 방 아래로 또 다른 계단이 이어진다.']}),

  S({id:'santimac_underground_mines',name:'산티맥 폐광망',regionId:'SANTIMAC',layer:'UNDERGROUND',description:'철광과 사암을 따라 길게 뻗은 폐광 터널.',eventChanceModifier:.08,monsterShare:.74,monsterIds:[],events:['철광석을 실은 낡은 광차가 벽에 처박혀 있다.','누군가 최근에 사용한 횃불 흔적이 남아 있다.','막힌 갱도 뒤에서 금속성 진동이 울린다.']}),
  S({id:'santimac_underground_chasm',name:'산티맥 지하 대균열',regionId:'SANTIMAC',layer:'UNDERGROUND',description:'대협곡과 함몰지 아래에서 이어지는 건조한 심층 균열.',eventChanceModifier:.14,monsterShare:.83,monsterIds:[],events:['바닥 없는 균열 너머로 뜨거운 공기가 올라온다.','사암 벽이 무너지며 우회 통로가 드러난다.','멀리서 돌을 긁는 무언가의 소리가 길게 이어진다.']}),
  S({id:'santimac_underground_ruins',name:'산티맥 석문 지하권',regionId:'SANTIMAC',layer:'UNDERGROUND',description:'폐쇄된 석문 아래의 인공 구조물과 자연 동굴이 섞인 구역.',eventChanceModifier:.12,monsterShare:.77,monsterIds:[],events:['바닥의 고대 홈이 일정한 방향으로 이어진다.','무너진 벽 너머에서 오래된 방 하나가 드러난다.','심층으로 내려가는 문은 아직 열리지 않는다.']}),

  S({id:'prosti_underground_icecave',name:'프로스티 빙하 동굴',regionId:'PROSTI',layer:'UNDERGROUND',description:'대설산 내부에 형성된 거대한 얼음 공동과 균열.',eventChanceModifier:.11,monsterShare:.80,monsterIds:[],events:['얼음벽 내부에서 오래된 기포가 연속으로 터진다.','멀리서 빙하가 갈라지는 굉음이 들린다.','투명한 벽 너머로 다른 통로의 그림자가 보인다.']}),
  S({id:'prosti_underground_crystal',name:'프로스티 빙정 광맥',regionId:'PROSTI',layer:'UNDERGROUND',description:'얼음과 광물 결정이 함께 자라난 푸른 지하 광맥.',eventChanceModifier:.10,monsterShare:.75,monsterIds:[],events:['빙정이 공명하며 짧은 빛을 내뿜는다.','결정 사이에 오래된 채굴 도구가 얼어붙어 있다.','미세한 균열을 따라 마력이 흐르는 것이 보인다.']}),
  S({id:'prosti_underground_depths',name:'대설산 지하 심층',regionId:'PROSTI',layer:'UNDERGROUND',description:'빙하 싱크홀과 봉인 던전 아래의 고위험 심층권.',eventChanceModifier:.16,monsterShare:.87,monsterIds:[],events:['아래쪽에서 올라온 냉기가 횃불의 열기마저 빼앗는다.','거대한 얼음 기둥 뒤로 봉인된 하강로가 보인다.','더 깊은 층으로 향하는 균열은 단단히 얼어붙어 있다.']}),


  // DEEP_UNDERGROUND · 심층. 1층 보스 클리어 후 지역별로 개방된다.
  S({id:'grandia_deep_labyrinth',name:'그란디아 심층 대미궁',regionId:'GRANDIA',layer:'DEEP_UNDERGROUND',description:'수백 갈래의 폐갱과 자연동굴이 뒤엉킨 왕도 아래 심층 미로.',eventChanceModifier:.18,monsterShare:.88,monsterIds:[],events:['낡은 철제 표식이 서로 다른 방향을 가리킨다.','벽 너머에서 거대한 곤충 군체가 이동하는 진동이 전해진다.','무너진 갱도 뒤로 더 오래된 통로가 드러난다.']}),
  S({id:'grandia_deep_oresea',name:'그란디아 심층 광맥해',regionId:'GRANDIA',layer:'DEEP_UNDERGROUND',description:'철광과 결정이 바다처럼 펼쳐진 거대 광맥 공동.',eventChanceModifier:.16,monsterShare:.82,monsterIds:[],events:['광벽 전체가 낮은 금속음으로 공명한다.','채굴 흔적이 전혀 없는 순수 광맥이 노출되어 있다.','광물층 사이로 알 수 없는 발광충이 지나간다.']}),
  S({id:'grandia_deep_abyss',name:'그란디아 심층 낙공',regionId:'GRANDIA',layer:'DEEP_UNDERGROUND',description:'왕도보다 훨씬 아래까지 이어지는 검은 수직 공동.',eventChanceModifier:.22,monsterShare:.91,monsterIds:[],events:['바닥 없는 균열에서 뜨거운 바람이 올라온다.','멀리서 거대한 날갯소리가 반향한다.','지옥층으로 향하는 봉인석이 아직 닫혀 있다.']}),

  S({id:'forezin_deep_rootmaze',name:'포레진 심층 뿌리미궁',regionId:'FOREZIN',layer:'DEEP_UNDERGROUND',description:'고대 거목의 뿌리가 동굴 전체를 미로처럼 휘감은 심층권.',eventChanceModifier:.18,monsterShare:.86,monsterIds:[],events:['뿌리 벽이 천천히 수축하며 통로 폭이 달라진다.','푸른 균사가 어둠 속에서 길처럼 이어진다.','지상에서는 볼 수 없는 거대한 뿌리맥이 맥박친다.']}),
  S({id:'forezin_deep_sporesea',name:'포레진 균사해',regionId:'FOREZIN',layer:'DEEP_UNDERGROUND',description:'발광 균사와 거대 버섯이 숲처럼 자란 심층 공동.',eventChanceModifier:.17,monsterShare:.84,monsterIds:[],events:['균사 포자가 별빛처럼 공동을 채운다.','거대한 버섯 아래에 버려진 장비가 쌓여 있다.','어딘가에서 규칙적인 곤충 울음이 들린다.']}),
  S({id:'forezin_deep_oreheart',name:'포레진 뿌리심장 광맥',regionId:'FOREZIN',layer:'DEEP_UNDERGROUND',description:'거목 뿌리와 희귀 광맥이 한 덩어리처럼 융합된 심층 자원지.',eventChanceModifier:.20,monsterShare:.88,monsterIds:[],events:['수액과 광물이 섞여 보석처럼 굳어 있다.','거대한 개미 통로가 광맥 사이로 이어진다.','지옥층 봉인문이 뿌리 아래에 잠들어 있다.']}),

  S({id:'seire_deep_bluegrotto',name:'세이레 심층 청동굴',regionId:'SEIRE',layer:'DEEP_UNDERGROUND',description:'해저보다 더 아래에서 푸른 압력광이 흐르는 거대 침수 미궁.',eventChanceModifier:.20,monsterShare:.89,monsterIds:[],events:['수압 때문에 동굴 전체가 낮게 울린다.','바닷물과 지하수가 층을 이루며 흐른다.','수서곤충의 껍질이 벽에 붙어 있다.']}),
  S({id:'seire_deep_ruins',name:'세이레 침몰 심궁',regionId:'SEIRE',layer:'DEEP_UNDERGROUND',description:'수몰된 고대 구조물이 자연동굴과 합쳐진 심층 유적.',eventChanceModifier:.19,monsterShare:.85,monsterIds:[],events:['청동 문이 수압에도 녹슬지 않은 채 남아 있다.','유적의 배수장치 일부가 아직 움직인다.','물속 제단 아래로 숨겨진 통로가 이어진다.']}),
  S({id:'seire_deep_abyss',name:'세이레 무광 심연',regionId:'SEIRE',layer:'DEEP_UNDERGROUND',description:'빛이 완전히 사라지는 세이레 최심부의 거대 균열.',eventChanceModifier:.24,monsterShare:.93,monsterIds:[],events:['수면조차 없는 검은 물기둥이 아래로 이어진다.','압력파가 주기적으로 벽면을 흔든다.','지옥층으로 향하는 수직 봉인이 닫혀 있다.']}),

  S({id:'santimac_deep_glassmaze',name:'산티맥 흑유리 미궁',regionId:'SANTIMAC',layer:'DEEP_UNDERGROUND',description:'열과 압력으로 유리화된 사암 통로가 끝없이 반사되는 심층 미로.',eventChanceModifier:.19,monsterShare:.87,monsterIds:[],events:['검은 유리벽에 다른 통로의 그림자가 겹쳐 보인다.','바닥 아래로 곤충 군체가 이동하는 것이 보인다.','유리벽 일부가 뜨거운 숨결처럼 김을 뿜는다.']}),
  S({id:'santimac_deep_orevault',name:'산티맥 심층 광실',regionId:'SANTIMAC',layer:'DEEP_UNDERGROUND',description:'희귀 광석과 보석이 건조한 동굴벽을 가득 채운 광물 저장고 같은 공동.',eventChanceModifier:.17,monsterShare:.82,monsterIds:[],events:['보석층 사이에 오래된 채굴 표식이 남아 있다.','흰개미 군체가 광석을 쌓아 둥지를 만들었다.','벽 안쪽에서 미세한 열기가 새어 나온다.']}),
  S({id:'santimac_deep_abyss',name:'산티맥 열풍 대균열',regionId:'SANTIMAC',layer:'DEEP_UNDERGROUND',description:'지옥층에 가까워지며 열풍과 붉은 균열이 나타나는 최심부.',eventChanceModifier:.24,monsterShare:.92,monsterIds:[],events:['붉게 달아오른 균열에서 열기가 솟는다.','거대한 다족 생물의 흔적이 절벽을 가로지른다.','아래층으로 향하는 문은 아직 봉인되어 있다.']}),

  S({id:'prosti_deep_crystalmaze',name:'프로스티 심층 빙정미궁',regionId:'PROSTI',layer:'DEEP_UNDERGROUND',description:'거대한 얼음 결정과 굴절된 통로가 미로를 이루는 설산 심층.',eventChanceModifier:.20,monsterShare:.88,monsterIds:[],events:['결정벽이 서로의 빛을 반사해 방향 감각을 흐린다.','얼음 속에 오래된 곤충 표본이 박혀 있다.','멀리서 거대한 실줄기가 반짝인다.']}),
  S({id:'prosti_deep_frosthollow',name:'프로스티 냉광 공동',regionId:'PROSTI',layer:'DEEP_UNDERGROUND',description:'차가운 발광 균사와 얼음층이 공존하는 넓은 심층 공동.',eventChanceModifier:.18,monsterShare:.84,monsterIds:[],events:['푸른 나방 무리가 천장을 덮고 있다.','발광 균사가 얼음 속에서 느리게 번진다.','냉기가 흐르는 광맥이 맥박처럼 빛난다.']}),
  S({id:'prosti_deep_abyss',name:'대설산 최심빙공',regionId:'PROSTI',layer:'DEEP_UNDERGROUND',description:'대설산의 뿌리 아래, 지옥층 봉인과 맞닿은 극저온 심연.',eventChanceModifier:.25,monsterShare:.93,monsterIds:[],events:['숨결이 즉시 얼어붙을 정도의 냉기가 밀려온다.','빙벽 너머에서 거대한 거미 둥지가 움직인다.','지옥층 봉인문은 서리와 쇠사슬에 덮여 있다.']}),

] .map((x)=>[x.id,x]));


// 현재 지역 몬스터를 각 섹터에 명시적으로 분산한다. 실제 지형 필터는 worldMapSystem에서 한 번 더 적용된다.
for (const profile of Object.values(SECTOR_ENCOUNTER_PROFILES)) {
  profile.monsterIds = REGIONAL_MONSTERS
    .filter((monster) => monster.regionId === profile.regionId && monster.layers.includes(profile.layer) && monster.sectorIds.includes(profile.id))
    .map((monster) => monster.id);
}

export function getSectorEncounterProfile(id?: string): SectorEncounterProfile | undefined {
  return id ? SECTOR_ENCOUNTER_PROFILES[id] : undefined;
}
