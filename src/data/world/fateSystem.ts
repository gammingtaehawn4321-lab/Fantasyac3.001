import type { FateState, PlayerState, WorldRegionId } from '../../types';
import { getFateDefinition, resolveFateStartLocationTag, type FateDefinition } from './fateData';
import { findHexByLocationTag } from './worldMapSystem';
import { isAdultPhysicalAge } from '../../config/agePolicy';

export type FateActionType = 'ADVANCE_CHAPTER' | 'COMPLETE_FATE' | 'ABANDON_FATE';

export interface FateActionRequest {
  type: FateActionType;
  chapterId?: string;
  choiceId?: string;
  endingId?: string;
  outcome?: string;
}

export interface FateActionResult {
  nextState: PlayerState;
  success: boolean;
  messages: string[];
}

export function createInitialFateState(
  fate: FateDefinition,
  startingRegionId: WorldRegionId,
  startingHexId: string,
  dayCount = 1,
  dialogueCount = 0,
): FateState {
  return {
    fateId: fate.id,
    startingRegionId,
    startingHexId,
    resolved: false,
    status: 'IN_PROGRESS',
    currentChapterId: fate.chapters[0]?.id,
    completedChapterIds: [],
    choiceHistory: [],
    fateFlags: [...fate.worldFlags],
    permanentRewardIds: [],
    startedAtDay: Math.max(1, Number(dayCount) || 1),
    startedAtDialogue: Math.max(0, Number(dialogueCount) || 0),
  };
}

export function createInitialFateStateAtRegion(
  fate: FateDefinition,
  regionId: WorldRegionId,
  dayCount = 1,
  dialogueCount = 0,
): FateState {
  const tag = resolveFateStartLocationTag(fate, regionId);
  const hex = findHexByLocationTag(tag);
  return createInitialFateState(fate, regionId, hex?.id || '', dayCount, dialogueCount);
}

export function normalizeFateState(
  raw: Partial<FateState> | undefined,
  fallbackRegion: WorldRegionId,
  fallbackHexId: string,
  dayCount = 1,
  dialogueCount = 0,
): FateState {
  const fallbackDefinition = getFateDefinition(raw?.fateId || '') || getFateDefinition('fate_human_01');
  const fateId = fallbackDefinition?.id || raw?.fateId || 'fate_human_01';
  const fate = getFateDefinition(fateId);
  const savedFateFlags = Array.isArray(raw?.fateFlags) ? raw!.fateFlags!.filter(Boolean) : [...(fate?.worldFlags || [])];
  const completedSet = new Set(Array.isArray(raw?.completedChapterIds) ? raw!.completedChapterIds!.filter(Boolean) : []);
  // 구 버전에서 completionFlags만 기록되고 completedChapterIds 갱신이 누락된 운명도 복구한다.
  for (const chapter of fate?.chapters || []) {
    const flags = chapter.completionFlags || [];
    if (flags.length > 0 && flags.every((flag) => savedFateFlags.includes(flag))) completedSet.add(chapter.id);
  }
  const completed = Array.from(completedSet);
  const hasNewStatus = ['SELECTED','IN_PROGRESS','BRANCHED','COMPLETED','ABANDONED'].includes(String(raw?.status));
  let status = (hasNewStatus ? raw!.status! : 'IN_PROGRESS') as FateState['status'];
  const allChaptersDone = Boolean(fate?.chapters?.length) && fate!.chapters.every((chapter) => completedSet.has(chapter.id));
  if (status !== 'ABANDONED' && allChaptersDone) status = 'COMPLETED';
  const savedCurrent = raw?.currentChapterId;
  const nextCurrent = savedCurrent && !completedSet.has(savedCurrent)
    ? savedCurrent
    : fate?.chapters.find((chapter) => !completedSet.has(chapter.id))?.id;
  const completionRewardId = status === 'COMPLETED' ? fate?.completionReward?.id : undefined;

  return {
    fateId,
    startingRegionId: raw?.startingRegionId || fallbackRegion,
    startingHexId: raw?.startingHexId || fallbackHexId,
    resolved: status === 'COMPLETED',
    status: status as FateState['status'],
    currentChapterId: status === 'COMPLETED' ? undefined : nextCurrent,
    completedChapterIds: completed,
    choiceHistory: Array.isArray(raw?.choiceHistory) ? raw!.choiceHistory! : [],
    fateFlags: savedFateFlags,
    endingId: raw?.endingId || (status === 'COMPLETED' ? fate?.endings?.[0]?.id : undefined),
    permanentRewardIds: Array.from(new Set([...(Array.isArray(raw?.permanentRewardIds) ? raw!.permanentRewardIds! : []), ...(completionRewardId ? [completionRewardId] : [])])),
    startedAtDay: Math.max(1, Number(raw?.startedAtDay ?? dayCount) || 1),
    startedAtDialogue: Math.max(0, Number(raw?.startedAtDialogue ?? dialogueCount) || 0),
    completedAtDay: raw?.completedAtDay,
  };
}

function addFlags(state: PlayerState, flags: string[]): PlayerState {
  if (!flags.length) return state;
  const storyFlags = Array.from(new Set([...(state.storyFlags || []), ...flags]));
  const fateFlags = Array.from(new Set([...(state.fate?.fateFlags || []), ...flags]));
  return { ...state, storyFlags, fate: { ...state.fate, fateFlags } };
}

export function applyFateAction(state: PlayerState, request: FateActionRequest): FateActionResult {
  const fate = getFateDefinition(state.fate?.fateId || '');
  if (!fate) return { nextState: state, success: false, messages: ['현재 운명 데이터를 찾지 못했습니다.'] };
  if (state.fate.status === 'COMPLETED' || state.fate.status === 'ABANDONED') {
    return { nextState: state, success: false, messages: [] };
  }

  if (request.type === 'ABANDON_FATE') {
    const nextState = { ...state, fate: { ...state.fate, status: 'ABANDONED' as const, resolved: false } };
    return { nextState, success: true, messages: [`『${fate.name}』의 운명선을 더 이상 좇지 않습니다.`] };
  }

  const currentChapter = fate.chapters.find((chapter) => chapter.id === state.fate.currentChapterId) || fate.chapters.find((chapter) => !state.fate.completedChapterIds.includes(chapter.id));
  if (!currentChapter) return { nextState: state, success: false, messages: [] };
  if (request.chapterId && request.chapterId !== currentChapter.id) return { nextState: state, success: false, messages: [] };

  // 선택지가 정의된 운명장은 플레이어의 실제 선택 없이는 넘길 수 없다.
  // Gemini가 잘못된/임의의 choiceId를 보내도 진행 상태가 바뀌지 않도록 엔진에서 재검증한다.
  const chapterChoice = currentChapter.choices?.length
    ? currentChapter.choices.find((entry) => entry.id === request.choiceId)
    : undefined;
  if (currentChapter.choices?.length && !chapterChoice) {
    return { nextState: state, success: false, messages: [] };
  }

  const currentIndex = fate.chapters.findIndex((chapter) => chapter.id === currentChapter.id);
  const isLast = currentIndex >= fate.chapters.length - 1;
  // 중간 장에서 COMPLETE_FATE를 보내 운명을 조기 종료하는 것을 막는다.
  if (request.type === 'COMPLETE_FATE' && !isLast) {
    return { nextState: state, success: false, messages: [] };
  }

  // 결말이 여러 개인 최종장은 반드시 유효한 결말 ID를 명시해야 한다.
  const requestedEnding = isLast && request.endingId
    ? fate.endings.find((ending) => ending.id === request.endingId)
    : undefined;
  if (isLast && fate.endings.length > 1 && !requestedEnding) {
    return { nextState: state, success: false, messages: [] };
  }

  let nextState: PlayerState = {
    ...state,
    fate: {
      ...state.fate,
      completedChapterIds: Array.from(new Set([...state.fate.completedChapterIds, currentChapter.id])),
    },
  };
  nextState = addFlags(nextState, currentChapter.completionFlags || []);
  const messages: string[] = [`운명 『${fate.name}』 · 「${currentChapter.title}」 완료`];

  if (chapterChoice) {
    nextState = {
      ...nextState,
      fate: {
        ...nextState.fate,
        status: 'BRANCHED',
        choiceHistory: [
          ...nextState.fate.choiceHistory,
          {
            chapterId: currentChapter.id,
            choiceId: chapterChoice.id,
            choiceLabel: chapterChoice.label,
            chosenAtDay: nextState.dayCount,
            chosenAtDialogue: nextState.dialogueCount,
          },
        ],
      },
    };
    nextState = addFlags(nextState, chapterChoice.storyFlags || []);
    messages.push(`선택 기록: ${chapterChoice.label}`);
  }

  if (isLast) {
    const ending = requestedEnding || fate.endings[0];
    const reward = fate.completionReward;
    nextState = {
      ...nextState,
      fate: {
        ...nextState.fate,
        status: 'COMPLETED',
        resolved: true,
        currentChapterId: undefined,
        endingId: ending?.id,
        permanentRewardIds: Array.from(new Set([...nextState.fate.permanentRewardIds, reward.id])),
        completedAtDay: nextState.dayCount,
      },
    };
    nextState = addFlags(nextState, [...(ending?.storyFlags || []), ...(reward.storyFlags || [])]);
    if (ending) messages.push(`운명의 결말: 『${ending.name}』`);
    messages.push(`영구 기록 획득: 『${reward.name}』`);
    return { nextState, success: true, messages };
  }

  const nextChapter = fate.chapters[currentIndex + 1];
  nextState = {
    ...nextState,
    fate: {
      ...nextState.fate,
      status: nextState.fate.status === 'BRANCHED' ? 'BRANCHED' : 'IN_PROGRESS',
      currentChapterId: nextChapter?.id,
    },
  };
  if (nextChapter) messages.push(`다음 운명장: 「${nextChapter.title}」`);
  return { nextState, success: true, messages };
}

export function buildFateRuntimeSummary(state: Pick<PlayerState,'fate'|'profile'>): string {
  const fate = getFateDefinition(state.fate?.fateId || '');
  if (!fate) return '';
  const current = fate.chapters.find((chapter) => chapter.id === state.fate.currentChapterId);
  const ending = fate.endings.find((entry) => entry.id === state.fate.endingId);
  const lines = [
    `운명: ${fate.name}`,
    `상태: ${state.fate.status}`,
    current ? `현재 운명장: ${current.title} - ${current.summary}` : '',
    current?.choices?.length ? `현재 장의 유효 선택 ID: ${current.choices.map((choice) => `${choice.id}(${choice.label})`).join(', ')}` : '',
    current && fate.chapters[fate.chapters.length - 1]?.id === current.id ? `최종장 유효 결말 ID: ${fate.endings.map((entry) => `${entry.id}(${entry.name})`).join(', ')}` : '',
    ending ? `결말: ${ending.name}` : '',
  ].filter(Boolean);
  if (fate.userNarrativeReference && fate.userNarrativeReference.trim()) {
    const adultEligible = isAdultPhysicalAge(state.profile?.physicalAge);
    if (!fate.requiresAdult || adultEligible) lines.push(`사용자 운명 참고: ${fate.userNarrativeReference.trim()}`);
  }
  return lines.join('\n');
}
