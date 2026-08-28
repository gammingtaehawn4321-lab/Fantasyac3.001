import type {
  BodyCompartmentId,
  BodyLoadStage,
  BodyPayloadKind,
} from '../types';

type StageDirectives =
  Record<
    Exclude<BodyLoadStage, 'EMPTY'>,
    string
  >;

/**
 * 이 파일의 모든 문자열은
 * 사용자에게 그대로 출력되는 고정 문장이 아닙니다.
 *
 * 엔진이:
 * 1. 구획
 * 2. payload 종류
 * 3. 현재 양
 * 4. 현재 Load Stage
 *
 * 를 자동 판정한 뒤,
 * 해당 문자열만 Gemini에게 "연출 참고자료"로 전달합니다.
 *
 * Gemini는:
 * - 원문을 그대로 복사하지 않고
 * - 현재 인물/장소/행동/직전 로그에 맞게
 * - 자유롭게 변형·조합·확장·축약하여 사용합니다.
 *
 * 빈 문자열('')은 해당 단계에 별도 연출 지침이 없는 것으로 처리합니다.
 */

export const BODY_LOAD_NARRATIVE_DIRECTIVES:
  Record<
    BodyCompartmentId,
    Record<BodyPayloadKind, StageDirectives>
  > = {

  // ============================================================
  // COMPARTMENT 1
  // ============================================================

  COMPARTMENT_1: {

    STANDARD_FLUID: {
      TRACE: `플레이어의 보지에 정액이 주입된 후, 미량이 남아 있는 상태. 약간 찝찝헤 한다.`,
      LOW: `플레이어의 보지에 정액이 주입된 후, 소량이 남아 있는 상태, 살짝 당황해 하고, 몸 안에서 정액이 찰랑거린다.`,
      MEDIUM: `플레이어의 보지에 정액이 주입된 후, 거의 배출되지 않아 자궁이 정액으로 반쯤 차 있는 상태. 정액이 지속적으로 보지를 통해 흘러나오며, 은은한 냄새를 풍긴다.`,
      HIGH: `플레이어의 보지에 정액이 과도하게 주입되어 배가 부풀어 오른 상태, 이미 자궁은 정액으로 가득 차 걸을 때마다 소리가 나고, 심한 냄새를 풍긴다. 다리 사이로는 정액이 계속 흘러나온다.`,
      SATURATED: `플레이어의 보지에 정액이 한계치를 넘어 주입되어 보테배가 된 상태. 자궁과 질내는 정액으로 심하게 부풀어 올라 걸을 때마다 통증을 유발하고, 정액이 자궁을 자극하여 살짝만 건드려도 정액과 조수를 뿜으며 절정한다.`,
    },

    INSECTOID_SECRETION: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    URINE: {
      TRACE: `플레이어의 보지 안에 미량의 오줌이 강제로 주입되어 있는 상태. 정액과는 다른 느낌에 당황한다.`,
      LOW: `플레이어의 보지 안에 소량의 오줌이 강제로 주입되어 있는 상태. 걸을 때 마다 찰랑거리는 소리가 나고, 은은한 오줌 냄새가 풍긴다.`,
      MEDIUM: `플레이어의 보지가 반정도 오줌으로 차 있는 상태. 자신이 변기로서 쓰였다는 사실을 본격적으로 인지하며, 심한 자괴감을 느낀다. 오줌이 지속적으로 보지에서 흘러 나온다.`,
      HIGH: `플레이어의 보지가 오줌으로 가득 차 있는 상태. 걸을 때마다 오줌이 자궁벽에 부딪혀 쾌락을 느끼며, 자신이 변기라고 인정한다. 발밑에는 보지에서 새어나온 오줌이 흥건하다.`,
      SATURATED: `플레이어의 보지에 오줌이 한계치를 넘어 주입되어 보테배가 된 상태, 살짝만 움직여도 오줌이 흘러넘쳐 다리 사이로 줄줄 흐르며, 극심한 수치심에 잠긴다.`,
    },

    EGG: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    PARASITE: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    OTHER: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },
  },


  // ============================================================
  // COMPARTMENT 2
  // ============================================================

  COMPARTMENT_2: {

    STANDARD_FLUID: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    INSECTOID_SECRETION: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    URINE: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    EGG: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    PARASITE: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    OTHER: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },
  },


  // ============================================================
  // COMPARTMENT 3
  // ============================================================

  COMPARTMENT_3: {

    STANDARD_FLUID: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    INSECTOID_SECRETION: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    URINE: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    EGG: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    PARASITE: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },

    OTHER: {
      TRACE: ``,
      LOW: ``,
      MEDIUM: ``,
      HIGH: ``,
      SATURATED: ``,
    },
  },
};