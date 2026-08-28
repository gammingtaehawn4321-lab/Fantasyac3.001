import type { BodyPayloadChannel, PartnerCategory } from '../../types';
import { getRegionalMonsterDefinition, type MonsterRaceSubtype } from './monsterData';

export type MonsterPayloadAmountValue = number | 'basic';
export type MonsterBodySizeClass = 'SMALL' | 'MEDIUM' | 'LARGE';
export type MonsterPayloadAmountSet = Record<BodyPayloadChannel, MonsterPayloadAmountValue>;

const numericSet = (a: number, b: number, c: number): Record<BodyPayloadChannel, number> => ({ A: a, B: b, C: c });

/**
 * 인간형은 신체 크기 기본값을 통해 5~10 범위를 사용한다.
 * 필요하면 개별 몬스터에서 숫자를 직접 적어 이 값을 덮어쓸 수 있다.
 */
export const HUMANOID_PAYLOAD_AMOUNT_BY_SIZE: Record<MonsterBodySizeClass, Record<BodyPayloadChannel, number>> = {
  SMALL: numericSet(5, 5, 5),
  MEDIUM: numericSet(7, 7, 7),
  LARGE: numericSet(10, 10, 10),
};

export const HUMANOID_BASIC_SIZE_BY_SUBTYPE: Partial<Record<MonsterRaceSubtype, MonsterBodySizeClass>> = {
  HUMAN: 'MEDIUM',
  ELF: 'MEDIUM',
  BEASTKIN_CAT: 'MEDIUM',
  BEASTKIN_DOG: 'LARGE',
  BEASTKIN_BIRD: 'MEDIUM',
  BEASTKIN_FOX: 'MEDIUM',
  BEASTKIN_WOLF: 'LARGE',
  MERFOLK: 'MEDIUM',
  YETI: 'SMALL',
};

/**
 * 이형은 세부분류에 따라 A/B/C 기본 배출량이 달라진다.
 * 이 숫자는 사용자가 직접 조정해도 된다.
 */
export const ABERRANT_PAYLOAD_AMOUNT_BY_SUBTYPE: Partial<Record<MonsterRaceSubtype, Record<BodyPayloadChannel, number>>> = {
  BEAST: numericSet(8, 5, 4),
  INSECTOID: numericSet(6, 8, 5),
  PARASITIC: numericSet(4, 7, 9),
  PLANTLIKE: numericSet(5, 8, 6),
  SLIME: numericSet(10, 10, 8),
  AQUATIC: numericSet(8, 6, 5),
  AERIAL: numericSet(6, 5, 4),
  CONSTRUCT: numericSet(0, 0, 0),
  ELEMENTAL: numericSet(0, 0, 0),
  UNDEAD: numericSet(4, 3, 2),
  TENTACLE: numericSet(10, 8, 7),
};

/**
 * [USER_EDIT]
 * 현재 등록된 모든 몬스터의 개별 A/B/C 배출량.
 *
 * - 숫자: 그 개별 몬스터의 고유값을 사용
 * - 'basic': 개별값을 무시하고 상위 기본값 사용
 *   - HUMANOID -> 세부종의 기본 체구 -> 5/7/10
 *   - ABERRANT -> 세부분류별 기본값
 *
 * 따라서 특별한 몬스터만 숫자로 바꾸고, 나머지는 'basic'으로 두면 된다.
 */
export const MONSTER_PAYLOAD_AMOUNT_BY_MONSTER: Record<string, MonsterPayloadAmountSet> = {
  grandia_grass_wolf: { A: 'basic', B: 'basic', C: 'basic' }, // 초원 들개 · ABERRANT/BEAST
  grandia_road_bandit: { A: 'basic', B: 'basic', C: 'basic' }, // 왕도 노상강도 · HUMANOID/HUMAN
  grandia_black_hound: { A: 'basic', B: 'basic', C: 'basic' }, // 암시장 추적견 · ABERRANT/BEAST
  grandia_horn_hare: { A: 'basic', B: 'basic', C: 'basic' }, // 뿔달린 초원토끼 · ABERRANT/BEAST
  grandia_ironhide_bison: { A: 'basic', B: 'basic', C: 'basic' }, // 철가죽 들소 · ABERRANT/BEAST
  grandia_sewer_slime: { A: 'basic', B: 'basic', C: 'basic' }, // 하수도 오니슬라임 · ABERRANT/SLIME
  grandia_drain_bat: { A: 'basic', B: 'basic', C: 'basic' }, // 배수로 흡혈박쥐 · ABERRANT/BEAST
  grandia_hound_handler: { A: 'basic', B: 'basic', C: 'basic' }, // 왕도 사냥개 조련사 · HUMANOID/HUMAN
  grandia_smuggler_watch: { A: 'basic', B: 'basic', C: 'basic' }, // 밀수꾼 감시병 · HUMANOID/HUMAN
  grandia_stoneborer: { A: 'basic', B: 'basic', C: 'basic' }, // 폐광 돌껍질충 · ABERRANT/INSECTOID
  grandia_canyon_mantis: { A: 'basic', B: 'basic', C: 'basic' }, // 협곡 바위사마귀 · ABERRANT/INSECTOID
  grandia_sinkhole_worm: { A: 'basic', B: 'basic', C: 'basic' }, // 싱크홀 굴착충 · ABERRANT/INSECTOID
  grandia_bandit_archer: { A: 'basic', B: 'basic', C: 'basic' }, // 초원 도적 궁수 · HUMANOID/HUMAN
  grandia_slave_hunter: { A: 'basic', B: 'basic', C: 'basic' }, // 암시장 포획꾼 · HUMANOID/HUMAN
  grandia_royal_enforcer: { A: 'basic', B: 'basic', C: 'basic' }, // 왕도 중장 집행관 · HUMANOID/HUMAN
  forezin_briar_boar: { A: 'basic', B: 'basic', C: 'basic' }, // 가시멧돼지 · ABERRANT/BEAST
  forezin_sporeling: { A: 'basic', B: 'basic', C: 'basic' }, // 강변 포자체 · ABERRANT/PLANTLIKE
  forezin_iron_logger: { A: 'basic', B: 'basic', C: 'basic' }, // 그란디아 무장 벌목대 · HUMANOID/HUMAN
  forezin_moss_deer: { A: 'basic', B: 'basic', C: 'basic' }, // 이끼뿔 사슴 · ABERRANT/BEAST
  forezin_river_croc: { A: 'basic', B: 'basic', C: 'basic' }, // 강비늘 악어 · ABERRANT/AQUATIC
  forezin_venom_mantis: { A: 'basic', B: 'basic', C: 'basic' }, // 독가시 사마귀 · ABERRANT/INSECTOID
  forezin_leech_swarm: { A: 'basic', B: 'basic', C: 'basic' }, // 강변 흡혈거머리군체 · ABERRANT/PARASITIC
  forezin_polluted_slime: { A: 'basic', B: 'basic', C: 'basic' }, // 오염수 점액괴 · ABERRANT/SLIME
  forezin_root_stalker: { A: 'basic', B: 'basic', C: 'basic' }, // 뿌리추적자 · ABERRANT/PLANTLIKE
  forezin_bark_guardian: { A: 'basic', B: 'basic', C: 'basic' }, // 고목 수호체 · ABERRANT/PLANTLIKE
  forezin_grandia_scout: { A: 'basic', B: 'basic', C: 'basic' }, // 침략대 정찰병 · HUMANOID/HUMAN
  forezin_grandia_archer: { A: 'basic', B: 'basic', C: 'basic' }, // 침략대 궁병 · HUMANOID/HUMAN
  forezin_ore_beetle: { A: 'basic', B: 'basic', C: 'basic' }, // 광맥 갑충 · ABERRANT/INSECTOID
  forezin_muddy_spirit: { A: 'basic', B: 'basic', C: 'basic' }, // 탁류 정령 · ABERRANT/ELEMENTAL
  forezin_ancient_root: { A: 'basic', B: 'basic', C: 'basic' }, // 심림 거목괴수 · ABERRANT/PLANTLIKE
  seire_reef_maw: { A: 'basic', B: 'basic', C: 'basic' }, // 산호턱 포식어 · ABERRANT/AQUATIC
  seire_polluted_jelly: { A: 'basic', B: 'basic', C: 'basic' }, // 오염 해파리 · ABERRANT/AQUATIC
  seire_deep_hunter: { A: 'basic', B: 'basic', C: 'basic' }, // 심해 사냥꾼 · ABERRANT/AQUATIC
  seire_glass_shark: { A: 'basic', B: 'basic', C: 'basic' }, // 유리비늘 상어 · ABERRANT/AQUATIC
  seire_oil_slime: { A: 'basic', B: 'basic', C: 'basic' }, // 폐유 점액괴 · ABERRANT/SLIME
  seire_coral_ambusher: { A: 'basic', B: 'basic', C: 'basic' }, // 가시산호 매복체 · ABERRANT/PLANTLIKE
  seire_wreck_raider: { A: 'basic', B: 'basic', C: 'basic' }, // 침몰선 약탈자 · HUMANOID/HUMAN
  seire_capture_sailor: { A: 'basic', B: 'basic', C: 'basic' }, // 스카이 포획선 선원 · HUMANOID/HUMAN
  seire_net_hunter: { A: 'basic', B: 'basic', C: 'basic' }, // 해저 그물사냥꾼 · HUMANOID/HUMAN
  seire_lantern_maw: { A: 'basic', B: 'basic', C: 'basic' }, // 심해 등불아귀 · ABERRANT/AQUATIC
  seire_blade_fin: { A: 'basic', B: 'basic', C: 'basic' }, // 칼날지느러미 포식어 · ABERRANT/AQUATIC
  seire_venom_seahorse: { A: 'basic', B: 'basic', C: 'basic' }, // 독해마 군체 · ABERRANT/AQUATIC
  seire_shell_colossus: { A: 'basic', B: 'basic', C: 'basic' }, // 암초 갑각거인 · ABERRANT/AQUATIC
  seire_polluted_tentacle: { A: 'basic', B: 'basic', C: 'basic' }, // 오염 촉수체 · ABERRANT/PARASITIC
  seire_storm_gull: { A: 'basic', B: 'basic', C: 'basic' }, // 폭풍갈매기 · ABERRANT/AERIAL
  santimac_dune_cat: { A: 'basic', B: 'basic', C: 'basic' }, // 모래발톱 야수 · ABERRANT/BEAST
  santimac_secret_patrol: { A: 'basic', B: 'basic', C: 'basic' }, // 재상 비밀 순찰대 · HUMANOID/HUMAN
  santimac_enforcer: { A: 'basic', B: 'basic', C: 'basic' }, // 권리박탈 집행관 · HUMANOID/HUMAN
  santimac_sand_scorpion: { A: 'basic', B: 'basic', C: 'basic' }, // 모래침 전갈 · ABERRANT/INSECTOID
  santimac_glass_snake: { A: 'basic', B: 'basic', C: 'basic' }, // 유리사막 독사 · ABERRANT/BEAST
  santimac_rock_lizard: { A: 'basic', B: 'basic', C: 'basic' }, // 암석등 도마뱀 · ABERRANT/BEAST
  santimac_dust_slime: { A: 'basic', B: 'basic', C: 'basic' }, // 유리모래 슬라임 · ABERRANT/SLIME
  santimac_chancellor_spy: { A: 'basic', B: 'basic', C: 'basic' }, // 재상 첩자 · HUMANOID/HUMAN
  santimac_mercenary_blade: { A: 'basic', B: 'basic', C: 'basic' }, // 인간 용병검사 · HUMANOID/HUMAN
  santimac_kidnap_tracker: { A: 'basic', B: 'basic', C: 'basic' }, // 납치조 추적병 · HUMANOID/HUMAN
  santimac_canyon_vulture: { A: 'basic', B: 'basic', C: 'basic' }, // 협곡 대머리독수리 · ABERRANT/AERIAL
  santimac_mine_golem: { A: 'basic', B: 'basic', C: 'basic' }, // 폐광 철분골렘 · ABERRANT/CONSTRUCT
  santimac_desert_spore: { A: 'basic', B: 'basic', C: 'basic' }, // 사막 포자체 · ABERRANT/PLANTLIKE
  santimac_barrier_echo: { A: 'basic', B: 'basic', C: 'basic' }, // 결계 잔향 · ABERRANT/ELEMENTAL
  santimac_secret_captain: { A: 'basic', B: 'basic', C: 'basic' }, // 비밀경비대장 · HUMANOID/HUMAN
  prosti_snowfang: { A: 'basic', B: 'basic', C: 'basic' }, // 설원 송곳니 · ABERRANT/BEAST
  prosti_ice_golem: { A: 'basic', B: 'basic', C: 'basic' }, // 빙설 골렘 · ABERRANT/CONSTRUCT
  prosti_poacher: { A: 'basic', B: 'basic', C: 'basic' }, // 설산 밀렵대 · HUMANOID/HUMAN
  prosti_frost_hare: { A: 'basic', B: 'basic', C: 'basic' }, // 서리귀 토끼 · ABERRANT/BEAST
  prosti_glacier_stag: { A: 'basic', B: 'basic', C: 'basic' }, // 빙하뿔 사슴 · ABERRANT/BEAST
  prosti_blizzard_wisp: { A: 'basic', B: 'basic', C: 'basic' }, // 눈보라 정령 · ABERRANT/ELEMENTAL
  prosti_ice_beetle: { A: 'basic', B: 'basic', C: 'basic' }, // 빙정 갑충 · ABERRANT/INSECTOID
  prosti_wall_spider: { A: 'basic', B: 'basic', C: 'basic' }, // 빙벽 거미 · ABERRANT/INSECTOID
  prosti_avalanche_colossus: { A: 'basic', B: 'basic', C: 'basic' }, // 눈사태 거상 · ABERRANT/CONSTRUCT
  prosti_poacher_scout: { A: 'basic', B: 'basic', C: 'basic' }, // 밀렵대 정찰병 · HUMANOID/HUMAN
  prosti_poacher_hound: { A: 'basic', B: 'basic', C: 'basic' }, // 밀렵 사냥개 · ABERRANT/BEAST
  prosti_frost_slime: { A: 'basic', B: 'basic', C: 'basic' }, // 빙하 점액괴 · ABERRANT/SLIME
  prosti_alpine_eagle: { A: 'basic', B: 'basic', C: 'basic' }, // 고산 설독수리 · ABERRANT/AERIAL
  prosti_parasite_spore: { A: 'basic', B: 'basic', C: 'basic' }, // 설산 기생포자 · ABERRANT/PARASITIC
  prosti_crystal_sentinel: { A: 'basic', B: 'basic', C: 'basic' }, // 빙정 파수자 · ABERRANT/CONSTRUCT
  scroze_cloud_ray: { A: 'basic', B: 'basic', C: 'basic' }, // 구름가오리 · ABERRANT/AERIAL
  scroze_storm_harpy: { A: 'basic', B: 'basic', C: 'basic' }, // 폭풍익 약탈자 · ABERRANT/AERIAL
  scroze_sky_raider: { A: 'basic', B: 'basic', C: 'basic' }, // 천공 약탈대 · HUMANOID/BEASTKIN_BIRD
  scroze_cloud_jelly: { A: 'basic', B: 'basic', C: 'basic' }, // 구름해파리 · ABERRANT/AERIAL
  scroze_thunder_raptor: { A: 'basic', B: 'basic', C: 'basic' }, // 뇌광익 포식조 · ABERRANT/AERIAL
  scroze_sky_vine: { A: 'basic', B: 'basic', C: 'basic' }, // 공중 기생덩굴 · ABERRANT/PLANTLIKE
  scroze_floating_golem: { A: 'basic', B: 'basic', C: 'basic' }, // 부유석 골렘 · ABERRANT/CONSTRUCT
  scroze_cloud_slime: { A: 'basic', B: 'basic', C: 'basic' }, // 구름 점액괴 · ABERRANT/SLIME
  scroze_airship_raider: { A: 'basic', B: 'basic', C: 'basic' }, // 약탈 비행선 선원 · HUMANOID/HUMAN
  scroze_birdkin_outlaw: { A: 'basic', B: 'basic', C: 'basic' }, // 새 수인 공중무법자 · HUMANOID/BEASTKIN_BIRD
  scroze_fox_renegade: { A: 'basic', B: 'basic', C: 'basic' }, // 에도와 이탈 여우수인 · HUMANOID/BEASTKIN_FOX
  scroze_storm_elemental: { A: 'basic', B: 'basic', C: 'basic' }, // 폭풍 정령 · ABERRANT/ELEMENTAL
  scroze_wind_wasp: { A: 'basic', B: 'basic', C: 'basic' }, // 기류 사냥벌 · ABERRANT/INSECTOID
  scroze_nebula_ray: { A: 'basic', B: 'basic', C: 'basic' }, // 성운가오리 · ABERRANT/AERIAL
  scroze_celestial_automaton: { A: 'basic', B: 'basic', C: 'basic' }, // 천공 감시 자동인형 · ABERRANT/CONSTRUCT
  grandia_sewer_tentacle: { A: 'basic', B: 'basic', C: 'basic' }, // 왕도 암거 촉수체 · ABERRANT/TENTACLE
  forezin_root_tentacle: { A: 'basic', B: 'basic', C: 'basic' }, // 심근 촉수덩굴 · ABERRANT/TENTACLE
  seire_bluehole_tentacle: { A: 'basic', B: 'basic', C: 'basic' }, // 청색 심공 촉수체 · ABERRANT/TENTACLE
  santimac_chasm_tentacle: { A: 'basic', B: 'basic', C: 'basic' }, // 사암 심층 촉수체 · ABERRANT/TENTACLE
  prosti_ice_tentacle: { A: 'basic', B: 'basic', C: 'basic' }, // 빙맥 촉수체 · ABERRANT/TENTACLE
  grandia_ironjaw_borer: { A: 'basic', B: 'basic', C: 'basic' }, // 철턱 굴벌레 · ABERRANT/INSECTOID
  grandia_rust_carabid: { A: 'basic', B: 'basic', C: 'basic' }, // 녹슨 갑충 · ABERRANT/INSECTOID
  grandia_lantern_roach: { A: 'basic', B: 'basic', C: 'basic' }, // 등불 바퀴군체 · ABERRANT/INSECTOID
  forezin_root_mantis: { A: 'basic', B: 'basic', C: 'basic' }, // 뿌리잠복 사마귀 · ABERRANT/INSECTOID
  forezin_mycelium_cricket: { A: 'basic', B: 'basic', C: 'basic' }, // 균사 베짱이 · ABERRANT/INSECTOID
  forezin_iron_ant_guard: { A: 'basic', B: 'basic', C: 'basic' }, // 강철개미 병정 · ABERRANT/INSECTOID
  seire_cave_diver_beetle: { A: 'basic', B: 'basic', C: 'basic' }, // 수맥 잠수딱정벌레 · ABERRANT/INSECTOID
  seire_bronze_earwig: { A: 'basic', B: 'basic', C: 'basic' }, // 청동 집게벌레 · ABERRANT/INSECTOID
  seire_abyss_waterbug: { A: 'basic', B: 'basic', C: 'basic' }, // 심공 수서벌레 · ABERRANT/INSECTOID
  santimac_obsidian_roach: { A: 'basic', B: 'basic', C: 'basic' }, // 흑유리 바퀴 · ABERRANT/INSECTOID
  santimac_ore_termite: { A: 'basic', B: 'basic', C: 'basic' }, // 광맥 흰개미군체 · ABERRANT/INSECTOID
  santimac_chasm_centipede: { A: 'basic', B: 'basic', C: 'basic' }, // 협곡 왕지네 · ABERRANT/INSECTOID
  prosti_crystal_beetle: { A: 'basic', B: 'basic', C: 'basic' }, // 빙정 딱정벌레 · ABERRANT/INSECTOID
  prosti_cave_moth: { A: 'basic', B: 'basic', C: 'basic' }, // 설동굴 나방 · ABERRANT/INSECTOID
  prosti_frost_spider_queen: { A: 'basic', B: 'basic', C: 'basic' }, // 서리굴 거미여왕 · ABERRANT/INSECTOID
  dragon_hunter_tracker: { A: 'basic', B: 'basic', C: 'basic' }, // 용흔 추적사 · HUMANOID/HUMAN
  dragon_hunter_netter: { A: 'basic', B: 'basic', C: 'basic' }, // 봉인망 포획꾼 · HUMANOID/HUMAN
  dragon_hunter_sealmage: { A: 'basic', B: 'basic', C: 'basic' }, // 용맥 봉인술사 · HUMANOID/HUMAN
  dragon_hunter_chain_knight: { A: 'basic', B: 'basic', C: 'basic' }, // 쇄룡 기사 · HUMANOID/HUMAN
  dragon_hunter_horn_reaper: { A: 'basic', B: 'basic', C: 'basic' }, // 용각 채취자 · HUMANOID/HUMAN
  dragon_hunter_resonance_hound: { A: 'basic', B: 'basic', C: 'basic' }, // 용혈 공명견 · ABERRANT/CONSTRUCT
  dragon_hunter_capture_golem: { A: 'basic', B: 'basic', C: 'basic' }, // 용족 포획 골렘 · ABERRANT/CONSTRUCT
  dragon_hunter_chain_ballista: { A: 'basic', B: 'basic', C: 'basic' }, // 쇄룡 발리스타 · ABERRANT/CONSTRUCT
  dragon_hunter_scale_drone: { A: 'basic', B: 'basic', C: 'basic' }, // 비늘 공명 드론 · ABERRANT/CONSTRUCT
  dragon_hunter_suppression_pylon: { A: 'basic', B: 'basic', C: 'basic' }, // 용맥 억제기 · ABERRANT/CONSTRUCT
};

function getHumanoidBasicSize(subtype: MonsterRaceSubtype): MonsterBodySizeClass {
  return HUMANOID_BASIC_SIZE_BY_SUBTYPE[subtype] ?? 'MEDIUM';
}

export function resolveMonsterPayloadAmount(
  monsterId: string,
  channel: BodyPayloadChannel,
): number {
  const monster = getRegionalMonsterDefinition(monsterId);
  if (!monster) return 0;

  const individual = MONSTER_PAYLOAD_AMOUNT_BY_MONSTER[monster.id]?.[channel] ?? 'basic';
  if (individual !== 'basic') return Math.max(0, Number(individual) || 0);

  if (monster.raceType === 'HUMANOID') {
    const size = getHumanoidBasicSize(monster.raceSubtype);
    return HUMANOID_PAYLOAD_AMOUNT_BY_SIZE[size][channel];
  }

  const subtypeSet = ABERRANT_PAYLOAD_AMOUNT_BY_SUBTYPE[monster.raceSubtype];
  return Math.max(0, Number(subtypeSet?.[channel] ?? 0));
}

export const MONSTER_SUBTYPE_KOREAN_LABEL: Record<MonsterRaceSubtype, string> = {
  HUMAN: '인간',
  ELF: '엘프',
  BEASTKIN_CAT: '고양이 수인',
  BEASTKIN_DOG: '개 수인',
  BEASTKIN_BIRD: '새 수인',
  BEASTKIN_FOX: '여우 수인',
  BEASTKIN_WOLF: '늑대 수인',
  MERFOLK: '인어족',
  YETI: '설인',
  BEAST: '야수형',
  INSECTOID: '곤충형',
  PARASITIC: '기생형',
  PLANTLIKE: '식물형',
  SLIME: '슬라임형',
  AQUATIC: '수생형',
  AERIAL: '비행형',
  CONSTRUCT: '구조체',
  ELEMENTAL: '정령형',
  UNDEAD: '언데드',
  TENTACLE: '촉수형',
};

export function getMonsterSubtypeDisplayName(subtype?: string | null): string {
  if (!subtype) return '종족 미상';
  return MONSTER_SUBTYPE_KOREAN_LABEL[subtype as MonsterRaceSubtype] ?? '종족 미상';
}
