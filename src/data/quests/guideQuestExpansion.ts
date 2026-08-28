import type { QuestDefinition } from '../../types';

const q=(id:string,title:string,summary:string,objectives:any[],rewards:any={exp:60,rupees:40}):QuestDefinition=>({
  id,title,category:'GUIDE',description:summary,summary,stages:[{stageId:1,title:'시스템 익히기',description:summary,objectives:objectives.map((o:any,i:number)=>({id:`${id}_obj_${i+1}`,requiredCount:1,currentCount:0,isCompleted:false,...o}))}],rewards,
});

export const GUIDE_QUESTS:Record<string,QuestDefinition>={
  guide_inventory:q('guide_inventory','가이드 — 가방과 생활 재료','생활 재료를 획득하고 인벤토리에서 용도와 수량을 확인합니다.',[
    {description:'생활 재료 하나 이상 보유하기',type:'POSSESS_ITEM',targetId:'oak_log',targetName:'참나무 원목'},
  ]),
  guide_crafting:q('guide_crafting','가이드 — 제작','생활직업 제작을 한 번 수행합니다.',[{description:'아이템 하나 제작하기',type:'CRAFT_ITEM'}],{exp:80,rupees:60}),
  guide_profession:q('guide_profession','가이드 — 생활직업','생활직업을 성장시켜 전문 제작의 기초를 익힙니다.',[{description:'생활직업 레벨 올리기',type:'PROFESSION_LEVEL'}],{exp:100,rupees:80}),
  guide_equipment:q('guide_equipment','가이드 — 장비','획득한 장비를 실제 슬롯에 장착해 봅니다.',[{description:'장비 하나 장착하기',type:'EQUIP_ITEM'}]),
  guide_camp:q('guide_camp','가이드 — 야영','야영지에서 휴식해 시간과 회복 시스템을 익힙니다.',[{description:'야영지에서 한 번 수면하기',type:'CAMP_SLEEP'}]),
  guide_world_map:q('guide_world_map','가이드 — 육각 월드맵','지도에서 다른 Hex로 이동하여 탐험과 시간 경과를 확인합니다.',[{description:'새로운 위치 한 곳 방문하기',type:'VISIT_LOCATION'}],{exp:80,rupees:50}),
  guide_travel_range:q('guide_travel_range','가이드 — 장거리 이동 한도','여행 도구를 준비해 지상 한 번 이동 가능한 최대 Hex를 늘립니다.',[
    {description:'행군용 지형 나침반 보유',type:'POSSESS_ITEM',targetId:'trail_compass',targetName:'행군용 지형 나침반'},
    {description:'장거리 여행식 꾸러미 보유',type:'POSSESS_ITEM',targetId:'field_ration_pack',targetName:'장거리 여행식 꾸러미'},
  ],{exp:90,rupees:60}),
  guide_waystation:q('guide_waystation','가이드 — 역참 교통망','역참에서 루피를 지불해 안전 노선을 한 번 이용합니다.',[{description:'역참 노선 한 번 이용하기',type:'WAYSTATION_TRAVEL'}],{exp:120,rupees:100}),
  guide_airship:q('guide_airship','가이드 — 나만의 비행정','재료를 모아 비행정을 건조하고 하늘을 직접 비행합니다.',[
    {description:'비행정 건조 완료',type:'BUILD_AIRSHIP'},
  ],{exp:300,rupees:300,followUpQuestIds:['guide_airship_flight']}),
  guide_airship_flight:q('guide_airship_flight','가이드 — 에테르 항해','연료를 채우고 비행정으로 하늘 또는 천공을 한 번 이동합니다.',[{description:'비행정으로 이동하기',type:'AIRSHIP_TRAVEL'}],{exp:250,rupees:180}),
  guide_gathering:q('guide_gathering','가이드 — 채집','월드맵의 현재 Hex에서 생활 자원을 채집합니다.',[{description:'생활 자원 채집하기',type:'GATHER_RESOURCE'}],{exp:70,rupees:40}),
  guide_character:q('guide_character','가이드 — 주요 인물과 호감도','주요 인물과 대화를 반복해 신뢰를 쌓는 법을 익힙니다.',[{description:'주요 인물과 대화하기',type:'TALK_NPC'}],{exp:100,rupees:60,followUpQuestIds:['guide_recruitment']}),
  guide_recruitment:q('guide_recruitment','가이드 — 동료 영입','충분한 신뢰를 쌓은 주요 인물을 동료로 영입합니다.',[{description:'주요 인물 한 명 영입하기',type:'RECRUIT_COMPANION'}],{exp:220,rupees:150}),
};
