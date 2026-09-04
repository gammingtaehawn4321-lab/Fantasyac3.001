import type { PlayerState } from '../../types';
import { dispatchGameEvent } from '../../gameEvents';
import { FATE_ENCOUNTER_BY_TRIGGER_FLAG } from '../encounters/fateEncounterDatabase';

export interface FateContentHookResult { nextState: PlayerState; messages: string[]; }

/**
 * 운명 코어를 수정하지 않고, applyFateAction이 새로 만든 장 완료 플래그에 반응해
 * 대응 인카운터를 실제 활성 상태로 만든다.
 */
export function applyFateContentHooks(before:PlayerState, after:PlayerState):FateContentHookResult {
  let nextState=after;
  const messages:string[]=[];
  const beforeFlags=new Set([...(before.storyFlags||[]), ...(before.fate?.fateFlags||[])]);
  const afterFlags=new Set([...(after.storyFlags||[]), ...(after.fate?.fateFlags||[])]);

  for(const [triggerFlag,encounterId] of Object.entries(FATE_ENCOUNTER_BY_TRIGGER_FLAG)){
    if(beforeFlags.has(triggerFlag) || !afterFlags.has(triggerFlag)) continue;
    const prior=nextState.encounters?.[encounterId];
    if(prior && ['ACTIVE','RESOLVED','FAILED','CANCELLED'].includes(prior.status)) continue;

    if(nextState.activeEncounterId || nextState.activeBattle){
      const scheduled=[...(nextState.scheduledEncounters||[])];
      if(!scheduled.some(entry=>entry.encounterId===encounterId)){
        scheduled.push({encounterId,scheduledDay:nextState.dayCount||1,sourceEncounterId:'FATE_CHAPTER'});
        nextState={...nextState,scheduledEncounters:scheduled};
        messages.push('운명과 관련된 후속 사건이 대기 중입니다.');
      }
      continue;
    }

    const started=dispatchGameEvent(nextState,'ENCOUNTER_STARTED',{encounterId});
    nextState=started.nextState;
    messages.push(...started.messages);
    messages.push('운명의 다음 장으로 이어지는 사건이 시작되었습니다.');
    break;
  }
  return {nextState,messages};
}

/** 현재 다른 사건이 끝난 뒤 대기 중인 운명 인카운터를 하나 이어서 시작한다. */
export function activateQueuedFateEncounter(state:PlayerState):FateContentHookResult {
  if(state.activeEncounterId || state.activeBattle) return {nextState:state,messages:[]};
  const scheduled=[...(state.scheduledEncounters||[])];
  const index=scheduled.findIndex(entry=>entry.sourceEncounterId==='FATE_CHAPTER' && entry.scheduledDay<=(state.dayCount||1));
  if(index<0) return {nextState:state,messages:[]};
  const [entry]=scheduled.splice(index,1);
  let nextState={...state,scheduledEncounters:scheduled};
  const started=dispatchGameEvent(nextState,'ENCOUNTER_STARTED',{encounterId:entry.encounterId});
  nextState=started.nextState;
  return {nextState,messages:[...started.messages,'대기 중이던 운명 사건이 이어집니다.']};
}
