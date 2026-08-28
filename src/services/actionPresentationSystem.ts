import { POTION_DATABASE } from '../data/potions/potionDatabase';

export type CharacterActionType =
  | 'CONSUME_ELIXIR'
  | 'CONSUME_POTION'
  | 'EAT_FOOD'
  | 'EQUIP_WEAPON'
  | 'UNEQUIP_WEAPON'
  | 'EQUIP_ARMOR'
  | 'UNEQUIP_ARMOR'
  | 'CHANGE_EQUIPMENT'
  | 'USE_TOOL'
  | 'CRAFT_ITEM'
  | 'GATHER_RESOURCE'
  | 'COOK_FOOD'
  | 'REST';

export interface ActionPresentationPayload {
  characterName: string;
  actionType: CharacterActionType;
  itemName?: string;
  potionId?: string;
  slotName?: string;
  weaponType?: string;
  systemResultText: string;
  sensoryOverride?: string;
}

export interface ActionPresentationOutput {
  actionLog: string;
  sensoryPresentation: string;
  systemResult: string;
  fullNarrative: string;
}

/**
 * Universal Action Presentation System for Fantasyac v3.0
 * Formats actions into 3 clean, scannable parts:
 * 1. Character Action Sentence
 * 2. Sensory/Visual Presentation Sentence
 * 3. System Result Sentence
 */
export function presentCharacterAction(
  payload: ActionPresentationPayload
): ActionPresentationOutput {
  const charName = payload.characterName || '모험가';
  let actionLog = '';
  let sensoryPresentation = '';
  const systemResult = payload.systemResultText || '';

  switch (payload.actionType) {
    case 'CONSUME_ELIXIR':
    case 'CONSUME_POTION': {
      const potion = payload.potionId ? POTION_DATABASE[payload.potionId] : undefined;
      const potionName = payload.itemName || potion?.name || '신비한 약물';

      if (potion) {
        actionLog = `${charName}이(가) ${potion.categoryLabel} 『${potionName}』의 마개를 열고 깊게 삼킵니다.`;
        sensoryPresentation = payload.sensoryOverride || potion.drinkingPresentation;
      } else {
        const isElixir = payload.actionType === 'CONSUME_ELIXIR';
        actionLog = `${charName}이(가) ${isElixir ? '전투 비약' : '회복 물약'} 『${potionName}』을 마십니다.`;
        sensoryPresentation = payload.sensoryOverride || '몸 안쪽에서 훈훈한 마력 기운이 번져나갑니다.';
      }
      break;
    }

    case 'EAT_FOOD': {
      const foodName = payload.itemName || '야영 요리';
      actionLog = `${charName}이(가) 김이 올라오는 『${foodName}』을 차분하게 섭취합니다.`;
      sensoryPresentation = payload.sensoryOverride || '풍부한 맛과 온기가 혈관을 타고 전신으로 스며들어 마음이 안돈됩니다.';
      break;
    }

    case 'EQUIP_WEAPON': {
      const weaponName = payload.itemName || '무기';
      const wType = payload.weaponType || '검';
      actionLog = `${charName}이(가) 손에 맞추어 『${weaponName}』을(를) 견고하게 조여 쥡니다.`;
      sensoryPresentation = payload.sensoryOverride || `날카로운 ${wType}의 무게감이 손끝에 묵직하게 전달되며 전투 태세를 갖춥니다.`;
      break;
    }

    case 'UNEQUIP_WEAPON': {
      const weaponName = payload.itemName || '무기';
      actionLog = `${charName}이(가) 손에 쥐고 있던 『${weaponName}』을(를) 조심스럽게 거둡니다.`;
      sensoryPresentation = payload.sensoryOverride || '손안의 긴장감이 풀리며 무기를 조용히 집어 넣습니다.';
      break;
    }

    case 'EQUIP_ARMOR': {
      const armorName = payload.itemName || '방어구';
      const slot = payload.slotName || '방어구';
      actionLog = `${charName}이(가) 착용 부위(${slot})에 『${armorName}』을(를) 정갈하게 장착합니다.`;
      sensoryPresentation = payload.sensoryOverride || '단단하고 조밀한 방어구가 신체 윤곽에 딱 맞물리며 신뢰감을 줍니다.';
      break;
    }

    case 'UNEQUIP_ARMOR': {
      const armorName = payload.itemName || '방어구';
      actionLog = `${charName}이(가) 착용 중이던 『${armorName}』의 버클을 풀고 해제합니다.`;
      sensoryPresentation = payload.sensoryOverride || '조여 있던 신체가 가벼워지며 자유로운 숨통이 트입니다.';
      break;
    }

    case 'CHANGE_EQUIPMENT': {
      const armorName = payload.itemName || '새 장비';
      actionLog = `${charName}이(가) 장비를 교체하여 『${armorName}』을(를) 착용합니다.`;
      sensoryPresentation = payload.sensoryOverride || '새로운 장비의 감촉이 신체에 맞아떨어지며 새로운 자세를 취합니다.';
      break;
    }

    case 'USE_TOOL': {
      const toolName = payload.itemName || '채집 도구';
      actionLog = `${charName}이(가) 작업 도구 『${toolName}』을(를) 꺼내어 단단히 쥡니다.`;
      sensoryPresentation = payload.sensoryOverride || '익숙한 도구의 손잡이가 손바닥에 밀착되며 작업 준비를 끝마칩니다.';
      break;
    }

    case 'CRAFT_ITEM': {
      const craftName = payload.itemName || '제작품';
      actionLog = `${charName}이(가) 작업대에서 정성을 다해 『${craftName}』 제작 공정에 집중합니다.`;
      sensoryPresentation = payload.sensoryOverride || '모루와 도구의 경쾌한 소리가 조용한 공간을 가득 채웁니다.';
      break;
    }

    case 'GATHER_RESOURCE': {
      const resName = payload.itemName || '자원';
      actionLog = `${charName}이(가) 주위 환경을 살피며 『${resName}』 자원 채집에 나섭니다.`;
      sensoryPresentation = payload.sensoryOverride || '신선한 야생 자원의 이슬 정수가 신중한 손길 끝에 묻어납니다.';
      break;
    }

    case 'COOK_FOOD': {
      const foodName = payload.itemName || '요리';
      actionLog = `${charName}이(가) 화덕 불길 위에 식재료를 가지런히 손질하여 『${foodName}』 조리를 시작합니다.`;
      sensoryPresentation = payload.sensoryOverride || '모닥불의 은은한 향과 고소한 김이 주변 공기를 따스하게 감쌉니다.';
      break;
    }

    case 'REST': {
      actionLog = `${charName}이(가) 안전한 야영 공간에 자리를 잡고 편안하게 휴식을 취합니다.`;
      sensoryPresentation = payload.sensoryOverride || '고되었던 호흡이 안정되고 혈관의 열기가 차분히 식어 내립니다.';
      break;
    }

    default: {
      actionLog = `${charName}이(가) 행동을 수행합니다.`;
      sensoryPresentation = '';
      break;
    }
  }

  const fullNarrative = [actionLog, sensoryPresentation, systemResult]
    .filter((str) => str.trim().length > 0)
    .join('\n');

  return {
    actionLog,
    sensoryPresentation,
    systemResult,
    fullNarrative,
  };
}
