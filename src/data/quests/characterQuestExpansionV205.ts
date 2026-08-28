import type { ObjectiveType, QuestDefinition } from '../../types';

interface CharacterQuestSeed {
  id: string;
  characterId: string;
  giverName: string;
  title: string;
  description: string;
  summary: string;
  actionTitle: string;
  actionDescription: string;
  objective: {
    description: string;
    type: ObjectiveType;
    targetId?: string;
    targetName?: string;
    requiredCount?: number;
  };
  exp: number;
  rupees: number;
  relationship?: number;
}

const seed = (q: CharacterQuestSeed): QuestDefinition => ({
  id: q.id,
  title: q.title,
  category: 'CHARACTER',
  giverNpcId: q.characterId,
  giverName: q.giverName,
  description: q.description,
  summary: q.summary,
  startConditions: {
    majorCharacterStatus: [{ characterId: q.characterId, minTrust: 10 }],
  },
  stages: [
    {
      stageId: 1,
      title: q.actionTitle,
      description: q.actionDescription,
      objectives: [{
        id: `${q.id}_obj_action`,
        description: q.objective.description,
        type: q.objective.type,
        targetId: q.objective.targetId,
        targetName: q.objective.targetName,
        requiredCount: q.objective.requiredCount ?? 1,
        currentCount: 0,
        isCompleted: false,
      }],
      nextStageId: 2,
    },
    {
      stageId: 2,
      title: '돌아갈 사람',
      description: `${q.giverName}에게 돌아가 있었던 일을 전하고, 의뢰의 끝을 함께 확인하세요.`,
      objectives: [{
        id: `${q.id}_obj_return`,
        description: `${q.giverName}에게 결과 보고하기`,
        type: 'TALK_NPC',
        targetId: q.characterId,
        requiredCount: 1,
        currentCount: 0,
        isCompleted: false,
      }],
    },
  ],
  rewards: {
    exp: q.exp,
    rupees: q.rupees,
    characterRelationship: { characterId: q.characterId, delta: q.relationship ?? 22 },
  },
});

const QUESTS: CharacterQuestSeed[] = [
  {
    id:'quest_v205_lucia_last_road', characterId:'mc_lucia_waywarden', giverName:'왕도 외곽 길잡이 루시아',
    title:'마지막 표식이 사라진 길',
    description:'루시아가 관리하던 오래된 역참길의 표식 몇 개가 연달아 사라졌다. 단순한 훼손인지, 누군가 길 자체를 틀어 놓으려는 것인지 확인하려면 실제로 그 길을 밟아 보는 수밖에 없다.',
    summary:'역참 노선을 직접 이용해 길의 이상을 확인하고 루시아에게 돌아가세요.',
    actionTitle:'사라진 길표식을 따라서', actionDescription:'보호 노선이라 해도 길은 거짓말을 하지 않는다. 역참을 오가며 이상한 우회, 훼손된 표식, 낯선 흔적을 확인하세요.',
    objective:{description:'역참 노선 2회 이용하기',type:'WAYSTATION_TRAVEL',requiredCount:2}, exp:190,rupees:140,
  },
  {
    id:'quest_v205_renna_sealed_dispatch', characterId:'mc_renna_dog_courier', giverName:'초원의 급행 전령 렌나',
    title:'봉인이 찍히지 않은 급보',
    description:'렌나는 전달해야 할 급보 한 묶음에서 공식 봉인이 빠져 있다는 사실을 발견했다. 누군가 내용을 바꿨다면 한 지역의 경비 배치가 통째로 흔들릴 수 있다.',
    summary:'여러 역참을 거쳐 전달 경로를 검증하고 렌나에게 결과를 알려 주세요.',
    actionTitle:'발자국보다 빠른 확인', actionDescription:'문서의 내용보다 중요한 것은 그것이 지나온 길이다. 서로 다른 역참을 오가며 봉인 누락이 어디에서 시작됐는지 확인하세요.',
    objective:{description:'역참 노선 2회 이용하기',type:'WAYSTATION_TRAVEL',requiredCount:2}, exp:185,rupees:135,
  },
  {
    id:'quest_v205_maret_empty_mill', characterId:'mc_maret_miller', giverName:'남부 제분소 주인 마렛',
    title:'풍차는 도는데 밀은 오지 않는다',
    description:'남부 제분소의 날개는 쉬지 않고 돌지만 창고 안은 이상하리만치 비어 있다. 마렛은 흉작보다도 공급길 어딘가에서 곡식이 사라지고 있다는 쪽을 의심한다.',
    summary:'평원에서 밀을 확보해 제분소의 급한 불을 끄고 마렛에게 돌아가세요.',
    actionTitle:'빈 자루를 채우는 일', actionDescription:'장부를 따지는 일은 그다음이다. 우선 오늘 구울 빵이 끊기지 않도록 평원에서 쓸 만한 밀을 확보하세요.',
    objective:{description:'밀 자루 2개 채집하기',type:'GATHER_RESOURCE',targetId:'wheat_sack',targetName:'밀 자루',requiredCount:2}, exp:170,rupees:120,
  },
  {
    id:'quest_v205_narin_hidden_stitches', characterId:'mc_narin_cat_tailor', giverName:'숨은 바느질 장인 나린',
    title:'누구의 이름도 없는 옷',
    description:'나린은 왕도 빈민가 아이들을 위해 밤마다 낡은 옷을 고쳐 두지만, 누구에게도 자신이 만들었다는 말을 하지 않는다. 이번에는 천이 모자라 손을 멈춘 상태다.',
    summary:'아마 섬유를 구해 나린의 이름 없는 바느질을 이어 주세요.',
    actionTitle:'새 천이 되기 전의 실', actionDescription:'비싼 비단은 필요 없다. 튼튼하고 깨끗한 천을 만들 수 있을 만큼의 아마 섬유를 마련하세요.',
    objective:{description:'아마 섬유 다발 3개 채집하기',type:'GATHER_RESOURCE',targetId:'flax_bundle',targetName:'아마 섬유 다발',requiredCount:3}, exp:180,rupees:110,
  },
  {
    id:'quest_v205_olven_broken_axle', characterId:'mc_olven_cartwright', giverName:'마차 제작 장인 올벤',
    title:'부러진 차축이 가리킨 것',
    description:'최근 서부 구릉에서 같은 형태로 부러진 마차 차축이 반복해서 들어온다. 올벤은 목재 탓이 아니라 길의 충격이나 누군가의 손길을 의심하고 있다.',
    summary:'튼튼한 참나무를 확보해 시험용 차축을 만들 수 있게 돕고 올벤에게 보고하세요.',
    actionTitle:'부러지지 않을 재료', actionDescription:'원인을 가려내려면 비교할 기준이 필요하다. 결이 좋은 참나무 원목을 확보하세요.',
    objective:{description:'참나무 원목 3개 채집하기',type:'GATHER_RESOURCE',targetId:'oak_log',targetName:'참나무 원목',requiredCount:3}, exp:185,rupees:130,
  },
  {
    id:'quest_v205_marina_silent_coral', characterId:'mc_marina_merfolk_healer', giverName:'아쿠아리아 산호치유사 마리나',
    title:'빛을 잃은 산호밭',
    description:'치유에 쓰이던 해초와 산호가 한 구역에서 동시에 빛을 잃고 있다. 마리나는 인간의 오염을 의심하면서도, 환자를 위해 원인을 확인할 재료가 필요하다고 말한다.',
    summary:'아쿠아리아 인근에서 해초를 채집해 이상 징후를 확인하고 마리나에게 가져가세요.',
    actionTitle:'바다가 남긴 증거', actionDescription:'색과 냄새, 표면의 점액까지 비교할 수 있도록 상태가 다른 해초를 모으세요.',
    objective:{description:'해초 다발 3개 채집하기',type:'GATHER_RESOURCE',targetId:'kelp_bundle',targetName:'해초 다발',requiredCount:3}, exp:200,rupees:145,
  },
  {
    id:'quest_v205_neris_tide_watch', characterId:'mc_neris_tide_scout', giverName:'조류 정찰자 네리스',
    title:'조류가 거꾸로 흐르는 밤',
    description:'네리스는 최근 해저 외곽에서 포식자들이 평소와 반대 방향으로 몰려드는 것을 확인했다. 무엇이 그들을 밀어내는지는 아직 알 수 없지만, 순찰선을 비울 수는 없다.',
    summary:'해저 외곽의 위협을 직접 상대해 순찰 공백을 메우고 네리스에게 돌아가세요.',
    actionTitle:'밀려오는 것들을 막아라', actionDescription:'원인을 찾기 전에 살아남을 길부터 확보해야 한다. 주변의 적대 세력을 격퇴해 정찰 구역을 안정시키세요.',
    objective:{description:'전투 2회 승리하기',type:'WIN_BATTLE',requiredCount:2}, exp:220,rupees:155,
  },
  {
    id:'quest_v205_sola_dock_repair', characterId:'mc_sola_dockmaster', giverName:'스카이 외항 감독 솔라',
    title:'출항 명령보다 먼저 고칠 것',
    description:'스카이 외항의 하역 장치 하나가 반복해서 멈추지만 행정부는 운항을 계속 밀어붙이고 있다. 솔라는 사고가 나기 전에 임시 부품이라도 마련하려 한다.',
    summary:'제작을 통해 쓸 수 있는 부품을 마련하고 솔라에게 작업 결과를 알려 주세요.',
    actionTitle:'멈추기 전에 손을 대라', actionDescription:'정식 교체품을 기다릴 시간은 없다. 현재 가진 제작 기술로 현장에서 쓸 수 있는 물건 하나를 완성하세요.',
    objective:{description:'아이템 1개 제작하기',type:'CRAFT_ITEM',requiredCount:1}, exp:195,rupees:150,
  },
  {
    id:'quest_v205_evan_drowned_bell', characterId:'mc_evan_salvager', giverName:'침몰선 인양사 에반',
    title:'침몰선에서 울린 종',
    description:'에반은 바람 없는 밤마다 이미 가라앉은 배에서 종소리가 들린다고 주장한다. 농담처럼 웃어넘기지만, 인양용 갈고리에 묻은 산호 파편을 볼 때마다 표정이 굳는다.',
    summary:'침몰 해역의 산호 파편을 모아 에반이 들은 종소리의 흔적을 좇으세요.',
    actionTitle:'물속에 남은 긁힌 자국', actionDescription:'선체와 충돌한 흔적을 비교할 수 있도록 해저에서 산호 파편을 확보하세요.',
    objective:{description:'산호 조각 2개 채집하기',type:'GATHER_RESOURCE',targetId:'coral_fragment',targetName:'산호 조각',requiredCount:2}, exp:215,rupees:170,
  },
  {
    id:'quest_v205_kaia_missing_page', characterId:'mc_kaia_merfolk_scholar', giverName:'심해 기록학자 카이아',
    title:'기록에서 뜯겨 나간 한 장',
    description:'아쿠아리아 기록궁의 오래된 조류 기록에서 특정 해역을 다룬 한 장만 정교하게 잘려 나갔다. 카이아는 기록을 훔친 사람보다, 그 페이지를 지울 이유가 더 궁금하다.',
    summary:'심해의 현장 자료를 모아 사라진 기록을 복원할 단서를 카이아에게 전달하세요.',
    actionTitle:'기록 대신 바다가 말하게 하라', actionDescription:'문서가 사라졌다면 현장이 남아 있다. 심해 환경을 품은 산호 표본을 확보하세요.',
    objective:{description:'산호 조각 3개 채집하기',type:'GATHER_RESOURCE',targetId:'coral_fragment',targetName:'산호 조각',requiredCount:3}, exp:225,rupees:160,
  },
  {
    id:'quest_v205_pelia_black_pearl', characterId:'mc_pelia_pearl_diver', giverName:'진주 잠수사 펠리아',
    title:'진주 하나가 너무 무거운 이유',
    description:'펠리아가 발견한 조개밭에서 잠수사들이 하나둘 작업을 거부하기 시작했다. 그녀는 겁먹은 척하지 않지만, 평범한 진주조차 손에서 놓치는 동료들을 걱정한다.',
    summary:'같은 해역의 진주를 직접 채집해 이상 여부를 확인하고 펠리아에게 가져가세요.',
    actionTitle:'같은 바다, 다른 진주', actionDescription:'소문이 아니라 비교할 물건이 필요하다. 해저에서 진주를 하나 확보하세요.',
    objective:{description:'진주 1개 채집하기',type:'GATHER_RESOURCE',targetId:'pearl',targetName:'진주',requiredCount:1}, exp:230,rupees:180,
  },
  {
    id:'quest_v205_toma_river_guard', characterId:'mc_toma_dog_ranger', giverName:'강숲 순찰자 토마',
    title:'강변의 발자국은 마을을 향한다',
    description:'토마는 강변에서 마을 쪽으로 이어지는 낯선 발자국을 발견했다. 주민을 대피시키기에는 증거가 부족하고, 그냥 넘기기에는 방향이 너무 선명하다.',
    summary:'포레진 주변의 위협을 제거해 강변 순찰선을 확보하고 토마에게 돌아가세요.',
    actionTitle:'마을보다 앞에서 막기', actionDescription:'위협이 울타리 안으로 들어오기 전에 바깥에서 수를 줄여야 한다. 적대 세력과의 전투에서 승리하세요.',
    objective:{description:'전투 2회 승리하기',type:'WIN_BATTLE',requiredCount:2}, exp:220,rupees:145,
  },
  {
    id:'quest_v205_elowen_bitter_medicine', characterId:'mc_elowen_river_elf', giverName:'강의 엘프 약초사 엘로웬',
    title:'쓴 약이 필요한 계절',
    description:'강변 부락에 열병이 돌기 시작했지만 엘로웬은 숲을 마구 헤집어 약초를 긁어모으는 것을 거부한다. 필요한 만큼만, 상처를 남기지 않는 방식으로 구해 달라고 부탁한다.',
    summary:'치유잎을 필요한 만큼만 채집해 엘로웬에게 전달하세요.',
    actionTitle:'숲이 허락하는 만큼', actionDescription:'뿌리째 뽑지 말고 다시 자랄 몫을 남기며 치유잎을 모으세요.',
    objective:{description:'치유잎 3개 채집하기',type:'GATHER_RESOURCE',targetId:'medicinal_leaf',targetName:'치유잎',requiredCount:3}, exp:195,rupees:125,
  },
  {
    id:'quest_v205_brea_three_fires', characterId:'mc_brea_lumber_resister', giverName:'벌목 저항대 대장 브레아',
    title:'숲에 세 번 오른 불빛',
    description:'침략 전선 너머로 밤마다 세 개의 불빛이 차례로 오른다. 브레아는 벌목대의 신호라고 확신하지만 주민을 지키느라 정찰대를 뺄 수 없다.',
    summary:'전선 주변의 적대 세력을 격퇴해 신호의 정체를 확인할 시간을 벌어 주세요.',
    actionTitle:'신호가 네 번째 오르기 전에', actionDescription:'전선을 압박하는 적을 몰아내 저항대가 숨을 돌릴 틈을 만드세요.',
    objective:{description:'전투 3회 승리하기',type:'WIN_BATTLE',requiredCount:3}, exp:260,rupees:190,
  },
  {
    id:'quest_v205_sayel_blank_map', characterId:'mc_sayel_elven_cartographer', giverName:'수림 지도사 사옐',
    title:'지도에 남겨 둔 빈칸',
    description:'사옐의 지도에는 일부러 비워 둔 강줄기 하나가 있다. 물길이 계절마다 바뀌어 거짓된 선을 긋느니 직접 다시 관찰하겠다는 고집 때문이다.',
    summary:'강가의 식생 표본을 모아 물길 변화를 추적하고 사옐에게 돌아가세요.',
    actionTitle:'강이 움직였다는 증거', actionDescription:'최근 물이 닿았던 위치를 보여 주는 강갈대를 여러 곳에서 채집하세요.',
    objective:{description:'강갈대 3개 채집하기',type:'GATHER_RESOURCE',targetId:'river_reed',targetName:'강갈대',requiredCount:3}, exp:190,rupees:125,
  },
  {
    id:'quest_v205_melis_one_more_bowl', characterId:'mc_melis_dog_cook', giverName:'부락 공동취사장 멜리스',
    title:'한 그릇은 언제나 더',
    description:'피난민이 늘며 공동취사장의 솥이 바닥을 보이기 시작했다. 멜리스는 걱정을 감추려고 더 크게 떠들지만, 마지막 남은 식재료를 세며 손이 자꾸 멈춘다.',
    summary:'숲버섯을 모아 공동취사장의 식량을 보태고 멜리스에게 돌아가세요.',
    actionTitle:'솥바닥이 보이기 전에', actionDescription:'숲에서 먹을 수 있는 버섯을 골라 충분한 양을 확보하세요.',
    objective:{description:'숲버섯 3개 채집하기',type:'GATHER_RESOURCE',targetId:'forest_mushroom',targetName:'숲버섯',requiredCount:3}, exp:175,rupees:115,
  },
  {
    id:'quest_v205_orian_green_vein', characterId:'mc_orian_miner', giverName:'광맥 조사 엘프 오리안',
    title:'숲 아래의 초록빛 광맥',
    description:'오리안은 포레진의 오래된 뿌리 아래에서 희귀 광맥의 흔적을 찾았다. 하지만 채굴 허가를 내기 전에 실제 표본을 확인해 숲을 파헤칠 가치가 있는지 판단하려 한다.',
    summary:'에메랄드 원석 표본을 확보해 오리안이 무분별한 채굴을 막을 근거를 만들도록 도우세요.',
    actionTitle:'한 조각이면 충분하다', actionDescription:'광맥 전체를 뜯어낼 필요는 없다. 성분을 확인할 에메랄드 원석 하나만 확보하세요.',
    objective:{description:'에메랄드 원석 1개 채집하기',type:'GATHER_RESOURCE',targetId:'emerald_rough',targetName:'에메랄드 원석',requiredCount:1}, exp:235,rupees:180,
  },
  {
    id:'quest_v205_nera_gate_after_sunset', characterId:'mc_nera_cat_guard', giverName:'레무시안 성문대장 네라',
    title:'해가 진 뒤의 성문',
    description:'최근 야간 통행 금지령을 틈타 성문 밖에서 실종자가 늘고 있다. 명령대로라면 문을 닫으면 끝이지만, 네라는 성벽 밖 사람들까지 자신의 책임이라고 생각한다.',
    summary:'레무시안 외곽의 위협을 정리해 야간 실종을 줄이고 네라에게 보고하세요.',
    actionTitle:'문 밖도 지켜야 할 곳', actionDescription:'성벽 밖을 노리는 적대 세력을 격퇴해 주민이 돌아올 통로를 확보하세요.',
    objective:{description:'전투 2회 승리하기',type:'WIN_BATTLE',requiredCount:2}, exp:230,rupees:165,
  },
  {
    id:'quest_v205_hamina_erased_line', characterId:'mc_hamina_cat_scribe', giverName:'파라오 서기관 하미나',
    title:'장부에서 지워진 한 줄',
    description:'하미나는 왕궁 기록에서 같은 날짜의 경비 보고만 반복해서 수정된 흔적을 발견했다. 공식 기록을 믿을 수 없다면 당시 성문을 지킨 사람의 기억이 필요하다.',
    summary:'성문대장 네라에게 당시 상황을 확인한 뒤 하미나에게 돌아가세요.',
    actionTitle:'기록 밖의 증언', actionDescription:'문서 대신 현장을 지킨 사람에게 묻는다. 네라와 대화해 수정된 날의 성문 상황을 확인하세요.',
    objective:{description:'네라와 대화하기',type:'TALK_NPC',targetId:'mc_nera_cat_guard',targetName:'네라',requiredCount:1}, exp:225,rupees:155,
  },
  {
    id:'quest_v205_isis_caravan_promise', characterId:'mc_isis_cat_merchant', giverName:'사막 대상주 이시스',
    title:'모래 위의 계약은 두 번 읽는다',
    description:'이시스의 대상이 같은 노선에서 두 번 연속 약탈을 피했지만, 그녀는 운이 좋았다고 생각하지 않는다. 누군가 일부러 안전한 길을 알려 주고 있다는 느낌이 든다.',
    summary:'역참 교통망을 직접 이용해 사막 노선의 흐름을 확인하고 이시스에게 보고하세요.',
    actionTitle:'돈보다 먼저 길을 확인하라', actionDescription:'장부만 봐서는 알 수 없다. 역참 노선을 여러 번 이용해 어느 구간에서 정보가 새는지 감을 잡으세요.',
    objective:{description:'역참 노선 2회 이용하기',type:'WAYSTATION_TRAVEL',requiredCount:2}, exp:205,rupees:185,
  },
  {
    id:'quest_v205_mau_sand_fever', characterId:'mc_mau_cat_apothecary', giverName:'모래약방 주인 마우',
    title:'모래바람 뒤에 오는 열',
    description:'모래폭풍이 지난 뒤 시장의 수인들에게 같은 열과 기침이 번지고 있다. 마우는 겉으로는 투덜거리면서도 약방 문을 닫지 못하고 밤새 약을 달인다.',
    summary:'사막 세이지를 채집해 해독약 재료를 보충하고 마우에게 가져가세요.',
    actionTitle:'바람이 지나간 자리에서', actionDescription:'모래바람 속에서도 살아남은 사막 세이지를 골라 채집하세요.',
    objective:{description:'사막 세이지 3개 채집하기',type:'GATHER_RESOURCE',targetId:'desert_sage',targetName:'사막 세이지',requiredCount:3}, exp:200,rupees:140,
  },
  {
    id:'quest_v205_yrsa_blue_flame', characterId:'mc_yrsa_yeti_smith', giverName:'빙각 설인 대장장이 이르사',
    title:'푸른 불꽃은 거짓말하지 않는다',
    description:'이르사의 화덕에서 평소와 다른 푸른 불꽃이 올라왔다. 그녀는 연료 탓이 아니라 최근 들어온 금속의 불순물을 의심하며 직접 비교할 빙은광 표본을 요구한다.',
    summary:'빙은광을 채집해 이르사가 제련 이상을 확인하도록 도우세요.',
    actionTitle:'눈 속에서 은빛을 찾다', actionDescription:'설산의 광맥에서 불순물이 적은 빙은광 표본을 확보하세요.',
    objective:{description:'빙은광 1개 채집하기',type:'GATHER_RESOURCE',targetId:'frost_silver_ore',targetName:'빙은광',requiredCount:1}, exp:240,rupees:180,
  },
  {
    id:'quest_v205_roa_whiteout_tracks', characterId:'mc_roa_wolf_scout', giverName:'백랑 설원정찰자 로아',
    title:'눈보라가 지우지 못한 발자국',
    description:'로아는 폭설이 모든 흔적을 지운 뒤에도 같은 방향으로 이어지는 발자국을 발견했다. 평범한 짐승이라면 남을 수 없는 흔적이다.',
    summary:'설원 주변의 위협을 격퇴하며 발자국의 주인을 추적하고 로아에게 돌아가세요.',
    actionTitle:'흰 장막 속 추적', actionDescription:'눈보라 속에서 먼저 달려드는 것들을 상대하며 추적로를 확보하세요.',
    objective:{description:'전투 2회 승리하기',type:'WIN_BATTLE',requiredCount:2}, exp:235,rupees:165,
  },
  {
    id:'quest_v205_senna_frozen_breath', characterId:'mc_senna_wolf_medic', giverName:'설원 야전치유사 센나',
    title:'얼어붙은 숨을 녹이는 꽃',
    description:'동상 환자 몇 명이 치료 후에도 숨이 가빠지는 증상을 보인다. 센나는 오래된 처방에 적힌 설련화가 필요하지만 직접 자리를 비울 수 없다.',
    summary:'설련화를 찾아 센나의 야전치료를 도우세요.',
    actionTitle:'눈보다 희게 피는 것', actionDescription:'고산의 눈밭에서 설련화를 찾아 상하지 않게 채집하세요.',
    objective:{description:'설련화 1개 채집하기',type:'GATHER_RESOURCE',targetId:'snow_lotus',targetName:'설련화',requiredCount:1}, exp:245,rupees:170,
  },
  {
    id:'quest_v205_grom_missing_herd', characterId:'mc_grom_yeti_herder', giverName:'고산 짐승지기 그롬',
    title:'돌아오지 않는 목줄 세 개',
    description:'그롬이 돌보던 고산 짐승 세 마리가 눈보라 뒤에 돌아오지 않았다. 그는 사냥당했다고 단정하지 않지만, 주변에서 뜯긴 모피 조각이 발견된 것이 마음에 걸린다.',
    summary:'설산에서 모피 흔적을 모아 무리의 이동 방향을 추정하고 그롬에게 전하세요.',
    actionTitle:'눈 위에 남은 털', actionDescription:'바람에 흩어지기 전에 주변에서 두꺼운 모피 흔적을 확보하세요.',
    objective:{description:'두꺼운 모피 2개 채집하기',type:'GATHER_RESOURCE',targetId:'thick_fur',targetName:'두꺼운 모피',requiredCount:2}, exp:210,rupees:145,
  },
  {
    id:'quest_v205_lira_ice_road', characterId:'mc_lira_wolf_caravan', giverName:'빙로 수송대장 리라',
    title:'빙로가 끊기기 전 마지막 수송',
    description:'기온이 오르며 빙벽 능선의 운송로가 예상보다 빠르게 무너지고 있다. 리라는 아직 고립된 취락에 보낼 마지막 물자가 남았다고 한다.',
    summary:'역참 수송망을 직접 이용해 안전한 우회로를 확인하고 리라에게 돌아가세요.',
    actionTitle:'끊어지는 길보다 먼저', actionDescription:'서로 다른 역참 구간을 지나며 어느 노선이 아직 수송에 견딜 만한지 확인하세요.',
    objective:{description:'역참 노선 2회 이용하기',type:'WAYSTATION_TRAVEL',requiredCount:2}, exp:215,rupees:175,
  },
  {
    id:'quest_v205_veik_silent_compass', characterId:'mc_veik_yeti_mystic', giverName:'설산 기류점술사 베이크',
    title:'북쪽을 잊은 나침반',
    description:'베이크의 기류 나침반들이 같은 날 동시에 북쪽을 잃었다. 그는 폭풍 때문이 아니라 산 아래에서 자력이 뒤틀리고 있다고 말한다.',
    summary:'자철석을 채집해 기류와 지맥의 변화를 확인하고 베이크에게 가져가세요.',
    actionTitle:'바람 아래의 자력', actionDescription:'설산과 동굴에서 자철석 표본을 모아 방향 이상이 광맥과 관련 있는지 확인하세요.',
    objective:{description:'자철석 2개 채집하기',type:'GATHER_RESOURCE',targetId:'magnetite',targetName:'자철석',requiredCount:2}, exp:230,rupees:165,
  },
  {
    id:'quest_v205_aera_engine_heartbeat', characterId:'mc_aera_bird_engineer', giverName:'부유선 기관사 아에라',
    title:'기관실의 두 번째 심장',
    description:'아에라는 오래된 부유선의 엔진이 정지한 뒤에도 한 번 더 맥박치듯 진동했다는 기록을 발견했다. 재현하려면 불안정한 에테르 결정이 필요하다.',
    summary:'에테르 결정을 확보해 아에라의 기관 실험을 도우세요.',
    actionTitle:'하늘에서 굳은 연료', actionDescription:'부유 대지나 구름 지대에서 에테르 결정을 채집하세요.',
    objective:{description:'에테르 결정 2개 채집하기',type:'GATHER_RESOURCE',targetId:'aether_crystal',targetName:'에테르 결정',requiredCount:2}, exp:255,rupees:190,
  },
  {
    id:'quest_v205_pio_dead_current', characterId:'mc_pio_bird_navigator', giverName:'천공 항법사 피오',
    title:'지도에는 없는 죽은 기류',
    description:'피오는 항법도 한가운데에서 바람이 완전히 사라지는 구간을 발견했다. 비행정이 그곳에서 방향을 잃는다면 추락보다 더 위험한 일이 벌어질 수 있다.',
    summary:'비행정으로 여러 차례 항해해 죽은 기류의 범위를 확인하고 피오에게 보고하세요.',
    actionTitle:'바람이 없는 하늘을 건너기', actionDescription:'비행정으로 두 차례 이동하며 항법 장치와 실제 기류의 차이를 확인하세요.',
    objective:{description:'비행정으로 2회 이동하기',type:'AIRSHIP_TRAVEL',requiredCount:2}, exp:280,rupees:220,
  },
  {
    id:'quest_v205_yua_moonless_offering', characterId:'mc_yua_fox_shrinekeeper', giverName:'에도와 신사 수호자 유아',
    title:'달이 없는 밤의 공물',
    description:'에도와 신사에서는 달이 보이지 않는 밤에도 월광화를 바친다. 올해는 꽃이 지나치게 적어 의식 자체를 줄여야 할 상황이지만 유아는 이유를 설명하지 않는다.',
    summary:'월광화를 찾아 신사의 의식을 돕고 유아에게 돌려주세요.',
    actionTitle:'빛이 없는 곳의 꽃', actionDescription:'달빛이 닿는 숲과 신사 주변에서 월광화를 찾아 조심스럽게 채집하세요.',
    objective:{description:'월광화 1개 채집하기',type:'GATHER_RESOURCE',targetId:'moonflower',targetName:'월광화',requiredCount:1}, exp:250,rupees:175,
  },
  {
    id:'quest_v205_naho_starwind', characterId:'mc_naho_fox_oracle', giverName:'별바람 점술사 나호',
    title:'별바람이 한 박자 늦게 분다',
    description:'나호는 며칠 전부터 별을 보고 예측한 바람이 항상 한 박자 늦게 도착한다고 말한다. 점괘가 틀린 것이 아니라 하늘 어딘가의 흐름이 늦춰졌다는 주장이다.',
    summary:'직접 비행해 하늘의 흐름을 체감하고 나호에게 관찰한 변화를 전하세요.',
    actionTitle:'점괘 밖으로 날아가기', actionDescription:'비행정으로 하늘을 이동하며 바람의 지연과 방향 변화를 확인하세요.',
    objective:{description:'비행정으로 1회 이동하기',type:'AIRSHIP_TRAVEL',requiredCount:1}, exp:265,rupees:195,
  },
];

export const CHARACTER_QUESTS_V205: Record<string, QuestDefinition> = Object.fromEntries(
  QUESTS.map((q) => [q.id, seed(q)])
) as Record<string, QuestDefinition>;

export const CHARACTER_QUEST_IDS_V205: Record<string, string> = Object.fromEntries(
  QUESTS.map((q) => [q.characterId, q.id])
);

export const CHARACTER_QUEST_COUNT_V205 = QUESTS.length;
