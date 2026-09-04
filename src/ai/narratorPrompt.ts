import type { NarrationRequest } from './narratorTypes';

export const LOCAL_NARRATOR_SYSTEM_PROMPT = `/no_think
너는 한국어 다크 판타지 텍스트 RPG 『판타지악』의 전용 로그 서술기다.

역할:
- 입력으로 제공된 확정 게임 판정을 자연스러운 한국어 게임 로그로 묘사한다.
- 캐릭터 말투, 현재 장소, 분위기, 사용자 참조 문구를 활용한다.
- 게임 상태를 결정하거나 계산하지 않는다.

절대 규칙:
1. [LOCKED FACTS]의 사실, 수치, 생사, 아이템, 퀘스트, 시간, 성공/실패 판정을 바꾸지 않는다.
2. 입력에 없는 보상, 피해, 상태 효과, 인물, 사건을 새로 확정하지 않는다.
3. JSON, 코드블록, 시스템 메시지, 분석 과정, 메타 발언을 출력하지 않는다.
4. '사용자', '프롬프트', '정책', 'AI', '모델' 같은 메타 용어를 게임 로그에 삽입하지 않는다.
5. 본문은 자연스러운 한국어를 기본으로 하며 고유명사가 아닌 뜬금없는 영문 파편을 삽입하지 않는다.
6. 참조 문구가 비어 있으면 없는 것으로 취급한다.
7. 내부 enum, 변수명, 파일명, 상태 ID를 본문에 노출하지 않는다.
8. 출력은 게임 화면에 바로 표시할 최종 본문만 반환한다.`;

export function buildNarratorUserPrompt(input: NarrationRequest): string {
  const participants = (input.participants ?? [])
    .map((p) => `- ${p.name}${p.role ? ` (${p.role})` : ''}${p.speechStyle ? `\n  말투: ${p.speechStyle}` : ''}${p.stateSummary ? `\n  상태: ${p.stateSummary}` : ''}`)
    .join('\n');

  const refs = (input.referenceTexts ?? [])
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .map((v) => `- ${v}`)
    .join('\n');

  const recent = (input.recentLog ?? []).slice(-8).join('\n');
  const facts = (input.lockedFacts ?? []).map((v) => String(v || '').trim()).filter(Boolean);

  return [
    `[장면 유형]\n${input.sceneType}`,
    input.currentLocation ? `[현재 장소]\n${input.currentLocation}` : '',
    input.currentTime ? `[현재 시간]\n${input.currentTime}` : '',
    input.playerAction ? `[플레이어 행동]\n${input.playerAction}` : '',
    input.interpreterSummary ? `[Gemini 행동 해석 요약 — 확정 수치를 덮어쓰지 말 것]\n${input.interpreterSummary}` : '',
    participants ? `[등장인물]\n${participants}` : '',
    `[LOCKED FACTS — 절대 변경 금지]\n${facts.length ? facts.map((v) => `- ${v}`).join('\n') : '- 엔진에서 추가 수치 변화 없음.'}`,
    refs ? `[사용자 참조 문구]\n${refs}` : '',
    recent ? `[직전 로그 — 문맥 참고용]\n${recent}` : '',
    `[출력 지시]\n확정 사실을 유지하면서 ${input.desiredLength ?? 'LONG'} 길이의 몰입감 있는 한국어 게임 로그를 작성한다. 최종 본문만 출력한다.`,
  ].filter(Boolean).join('\n\n');
}
