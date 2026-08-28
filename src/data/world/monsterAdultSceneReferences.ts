import type { PartnerCategory } from '../../types';
import { REGIONAL_MONSTERS, type MonsterRaceSubtype, getRegionalMonsterDefinition } from './monsterData';

/**
 * Gemini 성인 장면용 몬스터 참조 슬롯.
 *
 * 모든 내용은 사용자가 직접 작성하는 내부 참고자료입니다.
 * 기본값은 전부 빈 문자열이며, 빈 슬롯은 무시됩니다.
 *
 * 적용 우선순위:
 * 1) 몬스터 개별 슬롯
 * 2) 해당 몬스터의 세부분류 슬롯
 * 3) HUMANOID / ABERRANT 상위 분류 슬롯
 * 4) 셋 다 비어 있으면 몬스터 전용 참고자료 없음
 *
 * 안전 규칙: 이 파일의 참조는 신체적 나이 18세 이상인 플레이어에게만
 * server.ts에서 전달됩니다. 18세 미만이면 이 파이프라인 전체가 차단됩니다.
 */

export const MONSTER_ADULT_SCENE_REFERENCE_BY_CATEGORY: Record<PartnerCategory, string> = {
  HUMANOID: '', // [USER_TODO] 인간형 공통 연출
  ABERRANT: '', // [USER_TODO] 이형 공통 연출
};

export const MONSTER_ADULT_SCENE_REFERENCE_BY_SUBTYPE: Record<MonsterRaceSubtype, string> = {
  HUMAN: '', // [USER_TODO] HUMAN 공통 연출
  ELF: '', // [USER_TODO] ELF 공통 연출
  BEASTKIN_CAT: '', // [USER_TODO] BEASTKIN_CAT 공통 연출
  BEASTKIN_DOG: '', // [USER_TODO] BEASTKIN_DOG 공통 연출
  BEASTKIN_BIRD: '', // [USER_TODO] BEASTKIN_BIRD 공통 연출
  BEASTKIN_FOX: '', // [USER_TODO] BEASTKIN_FOX 공통 연출
  BEASTKIN_WOLF: '', // [USER_TODO] BEASTKIN_WOLF 공통 연출
  MERFOLK: '', // [USER_TODO] MERFOLK 공통 연출
  YETI: '', // [USER_TODO] YETI 공통 연출
  BEAST: '', // [USER_TODO] BEAST 공통 연출
  INSECTOID: '', // [USER_TODO] INSECTOID 공통 연출
  PARASITIC: '', // [USER_TODO] PARASITIC 공통 연출
  PLANTLIKE: '', // [USER_TODO] PLANTLIKE 공통 연출
  SLIME: '', // [USER_TODO] SLIME 공통 연출
  AQUATIC: '', // [USER_TODO] AQUATIC 공통 연출
  AERIAL: '', // [USER_TODO] AERIAL 공통 연출
  CONSTRUCT: '', // [USER_TODO] CONSTRUCT 공통 연출
  ELEMENTAL: '', // [USER_TODO] ELEMENTAL 공통 연출
  UNDEAD: '', // [USER_TODO] UNDEAD 공통 연출
  TENTACLE: '', // [USER_TODO] TENTACLE 공통 연출
};

export const MONSTER_ADULT_SCENE_REFERENCE_BY_MONSTER: Record<string, string> = {
  grandia_grass_wolf: '', // [USER_TODO] 초원 들개 · ABERRANT/BEAST
  grandia_road_bandit: '', // [USER_TODO] 왕도 노상강도 · HUMANOID/HUMAN
  grandia_black_hound: '', // [USER_TODO] 암시장 추적견 · ABERRANT/BEAST
  grandia_horn_hare: '', // [USER_TODO] 뿔달린 초원토끼 · ABERRANT/BEAST
  grandia_ironhide_bison: '', // [USER_TODO] 철가죽 들소 · ABERRANT/BEAST
  grandia_sewer_slime: '', // [USER_TODO] 하수도 오니슬라임 · ABERRANT/SLIME
  grandia_drain_bat: '', // [USER_TODO] 배수로 흡혈박쥐 · ABERRANT/BEAST
  grandia_hound_handler: '', // [USER_TODO] 왕도 사냥개 조련사 · HUMANOID/HUMAN
  grandia_smuggler_watch: '', // [USER_TODO] 밀수꾼 감시병 · HUMANOID/HUMAN
  grandia_stoneborer: '', // [USER_TODO] 폐광 돌껍질충 · ABERRANT/INSECTOID
  grandia_canyon_mantis: '', // [USER_TODO] 협곡 바위사마귀 · ABERRANT/INSECTOID
  grandia_sinkhole_worm: '', // [USER_TODO] 싱크홀 굴착충 · ABERRANT/INSECTOID
  grandia_bandit_archer: '', // [USER_TODO] 초원 도적 궁수 · HUMANOID/HUMAN
  grandia_slave_hunter: '', // [USER_TODO] 암시장 포획꾼 · HUMANOID/HUMAN
  grandia_royal_enforcer: '', // [USER_TODO] 왕도 중장 집행관 · HUMANOID/HUMAN
  forezin_briar_boar: '', // [USER_TODO] 가시멧돼지 · ABERRANT/BEAST
  forezin_sporeling: '', // [USER_TODO] 강변 포자체 · ABERRANT/PLANTLIKE
  forezin_iron_logger: '', // [USER_TODO] 그란디아 무장 벌목대 · HUMANOID/HUMAN
  forezin_moss_deer: '', // [USER_TODO] 이끼뿔 사슴 · ABERRANT/BEAST
  forezin_river_croc: '', // [USER_TODO] 강비늘 악어 · ABERRANT/AQUATIC
  forezin_venom_mantis: '', // [USER_TODO] 독가시 사마귀 · ABERRANT/INSECTOID
  forezin_leech_swarm: '', // [USER_TODO] 강변 흡혈거머리군체 · ABERRANT/PARASITIC
  forezin_polluted_slime: '', // [USER_TODO] 오염수 점액괴 · ABERRANT/SLIME
  forezin_root_stalker: '', // [USER_TODO] 뿌리추적자 · ABERRANT/PLANTLIKE
  forezin_bark_guardian: '', // [USER_TODO] 고목 수호체 · ABERRANT/PLANTLIKE
  forezin_grandia_scout: '', // [USER_TODO] 침략대 정찰병 · HUMANOID/HUMAN
  forezin_grandia_archer: '', // [USER_TODO] 침략대 궁병 · HUMANOID/HUMAN
  forezin_ore_beetle: '', // [USER_TODO] 광맥 갑충 · ABERRANT/INSECTOID
  forezin_muddy_spirit: '', // [USER_TODO] 탁류 정령 · ABERRANT/ELEMENTAL
  forezin_ancient_root: '', // [USER_TODO] 심림 거목괴수 · ABERRANT/PLANTLIKE
  seire_reef_maw: '', // [USER_TODO] 산호턱 포식어 · ABERRANT/AQUATIC
  seire_polluted_jelly: '', // [USER_TODO] 오염 해파리 · ABERRANT/AQUATIC
  seire_deep_hunter: '', // [USER_TODO] 심해 사냥꾼 · ABERRANT/AQUATIC
  seire_glass_shark: '', // [USER_TODO] 유리비늘 상어 · ABERRANT/AQUATIC
  seire_oil_slime: '', // [USER_TODO] 폐유 점액괴 · ABERRANT/SLIME
  seire_coral_ambusher: '', // [USER_TODO] 가시산호 매복체 · ABERRANT/PLANTLIKE
  seire_wreck_raider: '', // [USER_TODO] 침몰선 약탈자 · HUMANOID/HUMAN
  seire_capture_sailor: '', // [USER_TODO] 스카이 포획선 선원 · HUMANOID/HUMAN
  seire_net_hunter: '', // [USER_TODO] 해저 그물사냥꾼 · HUMANOID/HUMAN
  seire_lantern_maw: '', // [USER_TODO] 심해 등불아귀 · ABERRANT/AQUATIC
  seire_blade_fin: '', // [USER_TODO] 칼날지느러미 포식어 · ABERRANT/AQUATIC
  seire_venom_seahorse: '', // [USER_TODO] 독해마 군체 · ABERRANT/AQUATIC
  seire_shell_colossus: '', // [USER_TODO] 암초 갑각거인 · ABERRANT/AQUATIC
  seire_polluted_tentacle: '', // [USER_TODO] 오염 촉수체 · ABERRANT/PARASITIC
  seire_storm_gull: '', // [USER_TODO] 폭풍갈매기 · ABERRANT/AERIAL
  santimac_dune_cat: '', // [USER_TODO] 모래발톱 야수 · ABERRANT/BEAST
  santimac_secret_patrol: '', // [USER_TODO] 재상 비밀 순찰대 · HUMANOID/HUMAN
  santimac_enforcer: '', // [USER_TODO] 권리박탈 집행관 · HUMANOID/HUMAN
  santimac_sand_scorpion: '', // [USER_TODO] 모래침 전갈 · ABERRANT/INSECTOID
  santimac_glass_snake: '', // [USER_TODO] 유리사막 독사 · ABERRANT/BEAST
  santimac_rock_lizard: '', // [USER_TODO] 암석등 도마뱀 · ABERRANT/BEAST
  santimac_dust_slime: '', // [USER_TODO] 유리모래 슬라임 · ABERRANT/SLIME
  santimac_chancellor_spy: '', // [USER_TODO] 재상 첩자 · HUMANOID/HUMAN
  santimac_mercenary_blade: '', // [USER_TODO] 인간 용병검사 · HUMANOID/HUMAN
  santimac_kidnap_tracker: '', // [USER_TODO] 납치조 추적병 · HUMANOID/HUMAN
  santimac_canyon_vulture: '', // [USER_TODO] 협곡 대머리독수리 · ABERRANT/AERIAL
  santimac_mine_golem: '', // [USER_TODO] 폐광 철분골렘 · ABERRANT/CONSTRUCT
  santimac_desert_spore: '', // [USER_TODO] 사막 포자체 · ABERRANT/PLANTLIKE
  santimac_barrier_echo: '', // [USER_TODO] 결계 잔향 · ABERRANT/ELEMENTAL
  santimac_secret_captain: '', // [USER_TODO] 비밀경비대장 · HUMANOID/HUMAN
  prosti_snowfang: '', // [USER_TODO] 설원 송곳니 · ABERRANT/BEAST
  prosti_ice_golem: '', // [USER_TODO] 빙설 골렘 · ABERRANT/CONSTRUCT
  prosti_poacher: '', // [USER_TODO] 설산 밀렵대 · HUMANOID/HUMAN
  prosti_frost_hare: '', // [USER_TODO] 서리귀 토끼 · ABERRANT/BEAST
  prosti_glacier_stag: '', // [USER_TODO] 빙하뿔 사슴 · ABERRANT/BEAST
  prosti_blizzard_wisp: '', // [USER_TODO] 눈보라 정령 · ABERRANT/ELEMENTAL
  prosti_ice_beetle: '', // [USER_TODO] 빙정 갑충 · ABERRANT/INSECTOID
  prosti_wall_spider: '', // [USER_TODO] 빙벽 거미 · ABERRANT/INSECTOID
  prosti_avalanche_colossus: '', // [USER_TODO] 눈사태 거상 · ABERRANT/CONSTRUCT
  prosti_poacher_scout: '', // [USER_TODO] 밀렵대 정찰병 · HUMANOID/HUMAN
  prosti_poacher_hound: '', // [USER_TODO] 밀렵 사냥개 · ABERRANT/BEAST
  prosti_frost_slime: '', // [USER_TODO] 빙하 점액괴 · ABERRANT/SLIME
  prosti_alpine_eagle: '', // [USER_TODO] 고산 설독수리 · ABERRANT/AERIAL
  prosti_parasite_spore: '', // [USER_TODO] 설산 기생포자 · ABERRANT/PARASITIC
  prosti_crystal_sentinel: '', // [USER_TODO] 빙정 파수자 · ABERRANT/CONSTRUCT
  grandia_sewer_tentacle: '', // [USER_TODO] 왕도 암거 촉수체 · ABERRANT/TENTACLE
  forezin_root_tentacle: '', // [USER_TODO] 심근 촉수덩굴 · ABERRANT/TENTACLE
  seire_bluehole_tentacle: '', // [USER_TODO] 청색 심공 촉수체 · ABERRANT/TENTACLE
  santimac_chasm_tentacle: '', // [USER_TODO] 사암 심층 촉수체 · ABERRANT/TENTACLE
  prosti_ice_tentacle: '', // [USER_TODO] 빙맥 촉수체 · ABERRANT/TENTACLE
  scroze_cloud_ray: '', // [USER_TODO] 구름가오리 · ABERRANT/AERIAL
  scroze_storm_harpy: '', // [USER_TODO] 폭풍익 약탈자 · ABERRANT/AERIAL
  scroze_sky_raider: '', // [USER_TODO] 천공 약탈대 · HUMANOID/BEASTKIN_BIRD
  scroze_cloud_jelly: '', // [USER_TODO] 구름해파리 · ABERRANT/AERIAL
  scroze_thunder_raptor: '', // [USER_TODO] 뇌광익 포식조 · ABERRANT/AERIAL
  scroze_sky_vine: '', // [USER_TODO] 공중 기생덩굴 · ABERRANT/PLANTLIKE
  scroze_floating_golem: '', // [USER_TODO] 부유석 골렘 · ABERRANT/CONSTRUCT
  scroze_cloud_slime: '', // [USER_TODO] 구름 점액괴 · ABERRANT/SLIME
  scroze_airship_raider: '', // [USER_TODO] 약탈 비행선 선원 · HUMANOID/HUMAN
  scroze_birdkin_outlaw: '', // [USER_TODO] 새 수인 공중무법자 · HUMANOID/BEASTKIN_BIRD
  scroze_fox_renegade: '', // [USER_TODO] 에도와 이탈 여우수인 · HUMANOID/BEASTKIN_FOX
  scroze_storm_elemental: '', // [USER_TODO] 폭풍 정령 · ABERRANT/ELEMENTAL
  scroze_wind_wasp: '', // [USER_TODO] 기류 사냥벌 · ABERRANT/INSECTOID
  scroze_nebula_ray: '', // [USER_TODO] 성운가오리 · ABERRANT/AERIAL
  scroze_celestial_automaton: '', // [USER_TODO] 천공 감시 자동인형 · ABERRANT/CONSTRUCT
};

export type MonsterAdultReferenceSource = 'MONSTER' | 'SUBTYPE' | 'CATEGORY' | 'NONE';
export interface ResolvedMonsterAdultSceneReference {
  monsterId: string;
  monsterName: string;
  category: PartnerCategory;
  subtype: MonsterRaceSubtype;
  source: MonsterAdultReferenceSource;
  reference: string;
}

const nonBlank = (value?: string | null) => typeof value === 'string' && value.trim().length > 0;

export function resolveMonsterAdultSceneReference(monsterId: string): ResolvedMonsterAdultSceneReference | undefined {
  const monster = getRegionalMonsterDefinition(monsterId);
  if (!monster) return undefined;
  const monsterRef = MONSTER_ADULT_SCENE_REFERENCE_BY_MONSTER[monster.id];
  if (nonBlank(monsterRef)) return { monsterId: monster.id, monsterName: monster.name, category: monster.raceType, subtype: monster.raceSubtype, source: 'MONSTER', reference: monsterRef.trim() };
  const subtypeRef = MONSTER_ADULT_SCENE_REFERENCE_BY_SUBTYPE[monster.raceSubtype];
  if (nonBlank(subtypeRef)) return { monsterId: monster.id, monsterName: monster.name, category: monster.raceType, subtype: monster.raceSubtype, source: 'SUBTYPE', reference: subtypeRef.trim() };
  const categoryRef = MONSTER_ADULT_SCENE_REFERENCE_BY_CATEGORY[monster.raceType];
  if (nonBlank(categoryRef)) return { monsterId: monster.id, monsterName: monster.name, category: monster.raceType, subtype: monster.raceSubtype, source: 'CATEGORY', reference: categoryRef.trim() };
  return { monsterId: monster.id, monsterName: monster.name, category: monster.raceType, subtype: monster.raceSubtype, source: 'NONE', reference: '' };
}

export function detectMonsterIdsInText(text: string): string[] {
  const haystack = String(text || '').toLowerCase();
  if (!haystack.trim()) return [];
  return REGIONAL_MONSTERS.filter((monster) => haystack.includes(monster.id.toLowerCase()) || haystack.includes(monster.name.toLowerCase())).map((monster) => monster.id);
}

export function collectResolvedMonsterAdultReferences(monsterIds: string[]): ResolvedMonsterAdultSceneReference[] {
  const seen = new Set<string>();
  const output: ResolvedMonsterAdultSceneReference[] = [];
  for (const monsterId of monsterIds) {
    if (!monsterId || seen.has(monsterId)) continue;
    seen.add(monsterId);
    const resolved = resolveMonsterAdultSceneReference(monsterId);
    if (resolved && resolved.reference.trim()) output.push(resolved);
  }
  return output;
}
