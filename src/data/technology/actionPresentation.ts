import { MaterialQuality, QUALITY_TIERS } from './craftingQuality';

export interface ActionLogFormatted {
  actionText: string;
  presentationText: string;
  systemResultText: string;
  combinedFullLog: string;
}

export interface BuildActionLogParams {
  techName: string; // e.g., '채광', '벌목', '제련', '도축', '연금술'
  actionActionSentence: string;
  sensoryPresentationSentence: string;
  itemsObtained: Array<{ name: string; quantity: number; quality?: MaterialQuality }>;
  expGained: number;
  minutesSpent: number;
}

/**
 * 표준 3문장 시스템 행동 로그 생성기
 * [행동 연출 1문장] + [고유 감각/시각 연출 1문장] + [시스템 결과]
 */
export function generateLifeSkillActionLog(params: BuildActionLogParams): ActionLogFormatted {
  const mainQuality = params.itemsObtained.find((i) => i.quality)?.quality || 'NORMAL';
  const qualityName = QUALITY_TIERS[mainQuality]?.name || '보통';

  const itemsString = params.itemsObtained.length > 0
    ? params.itemsObtained.map((x) => `${x.name} ×${x.quantity}`).join(', ')
    : '결과물 없음';

  const systemResultText = `[${itemsString}] [품질: ${qualityName}] [${params.techName} 숙련 +${params.expGained} EXP] [게임 시간 +${params.minutesSpent}분]`;

  const combinedFullLog = `${params.actionActionSentence} ${params.sensoryPresentationSentence}\n${systemResultText}`;

  return {
    actionText: params.actionActionSentence,
    presentationText: params.sensoryPresentationSentence,
    systemResultText,
    combinedFullLog,
  };
}

/**
 * 35종 포션 전용 3문장 마시기 연출 생성기
 */
export function generatePotionDrinkLog(params: {
  potionName: string;
  actionLogText: string;
  drinkingPresentation: string;
  effectLogText: string;
  quality?: MaterialQuality;
}): string {
  const qName = QUALITY_TIERS[params.quality || 'NORMAL']?.name || '보통';
  return `${params.actionLogText} ${params.drinkingPresentation}\n[${params.potionName}] (품질: ${qName}) ${params.effectLogText}`;
}
