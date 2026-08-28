/**
 * 용족 전용 세계관/인카운터 서사 참조.
 * - 기본 참조는 비그래픽 세계관 설명이며 용족 플레이어에게만 전달한다.
 * - USER_TODO_*는 기본 공란. 사용자가 직접 채운 경우에만 Gemini 참고자료에 포함한다.
 */
export const DRAGONKIN_WORLD_REFERENCE = `
용족은 여러 사회에서 고귀하고 영험한 영물, 지역을 수호하는 수호신에 가까운 존재로 여겨진다.
많은 사람들은 용족을 존경하거나 경외하며, 함부로 모욕하는 일을 금기로 받아들인다.
그러나 바로 그 희소성과 신성성 때문에 전문적인 용족 사냥꾼과 포획 조직이 존재한다.
이들은 살아 있는 용족을 포획해 감금·사육하고, 재생하거나 다시 자라는 뿔과 비늘을 반복적으로 채취해 고가의 재료로 유통하려 한다.
포획된 용족 자체도 암시장에서 최고가의 불법 거래 대상으로 취급되며, 인신매매와 성적 착취의 위험 또한 존재한다.
이 설정은 위협과 착취 구조를 설명하기 위한 세계관 참조이며, 성폭력이나 성적 착취 장면을 구체적으로 묘사하지 않는다.
`;

export const DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES: Record<string,string> = {
  dragonkin_hunter_false_pilgrims: '용족을 숭배하는 순례자처럼 행동하는 포획조가 접근한다. 경외와 친절을 가장하지만 이동 경로와 경계 습관을 파악하려는 목적이 있다.',
  dragonkin_hunter_silver_net: '용족의 힘을 억제하도록 제작된 은빛 포획망과 봉인추를 사용하는 전문 사냥대가 매복한다. 플레이어가 대응을 선택하기 전 포획 결과를 확정하지 않는다.',
  dragonkin_hunter_scale_broker: '희귀 비늘과 뿔을 감정한다는 상인이 접근하지만 뒤에는 불법 포획 조직과 연결된 흔적이 있다. 거래·추적·거절·역정보 등 다양한 대응이 가능하다.',
  dragonkin_hunter_resonance_pylon: '주변 영력을 교란하고 용족의 위치를 드러내는 공명탑이 가동된다. 장치를 파괴하거나 역추적하거나 범위를 벗어나는 식의 대응이 가능하다.',
  dragonkin_hunter_cage_convoy: '용족용 강화 우리와 채취 도구를 실은 수상한 수송대가 지나간다. 이미 존재하는 불법 거래망과 포획 산업의 규모를 보여주는 장면으로 사용한다.',
  dragonkin_hunter_shrine_trap: '용족에게 축복을 청하는 제례처럼 꾸민 장소에 억제 부적과 봉인 장치가 숨겨져 있다. 수호신에 대한 숭배가 역으로 사냥 수단으로 악용되는 역설을 강조한다.',
  dragonkin_hunter_sky_chain: '상공에서 용족 전용 쇠사슬 투사기와 추적 장치를 단 사냥 비행선이 접근한다. 도주·은폐·격추·협상 등 플레이어 행동에 따라 장면이 이어진다.',
};

export const DRAGONKIN_USER_TODO_REFERENCES = {
  captureAftermath: '', // [USER_TODO] 포획 이후의 사용자 전용 서사. 비어 있으면 참조하지 않음.
  captivityLife: '',    // [USER_TODO] 감금/사육 생활의 사용자 전용 서사. 비어 있으면 참조하지 않음.
  blackMarket: '',      // [USER_TODO] 암시장 거래 관련 사용자 전용 서사. 비어 있으면 참조하지 않음.
};

export function collectDragonkinNarrativeReferences(activeEncounterId?: string | null): string[] {
  const out=[DRAGONKIN_WORLD_REFERENCE.trim()];
  const encounterRef=activeEncounterId?DRAGONKIN_HUNTER_ENCOUNTER_REFERENCES[activeEncounterId]:'';
  if(encounterRef?.trim()) out.push(encounterRef.trim());
  for(const value of Object.values(DRAGONKIN_USER_TODO_REFERENCES)) {
    const text=String(value||'').trim();
    if(text && !text.startsWith('[USER_TODO')) out.push(text);
  }
  return out;
}
