import type { PetNeedsState, PetSpeciesId, PetState } from '../../types';
import { getPetSpeciesDefinition, isPetSpeciesId } from './petDatabase';

function clamp100(value: unknown): number {
  const n = Number(value) || 0;
  return Math.max(0, Math.min(100, n));
}

function normalizeThresholds(raw: unknown, current: number): number[] {
  const valid = [30, 50, 70, 100];
  return Array.from(new Set((Array.isArray(raw) ? raw : []).map(Number).filter((n) => valid.includes(n) && n <= current)));
}

export function createInitialPetNeeds(): PetNeedsState {
  return {
    desire: 0,
    bathroomUrge: 0,
    desireTriggeredThresholds: [],
    bathroomTriggeredThresholds: [],
  };
}

export function createInitialPetState(speciesId: PetSpeciesId): PetState {
  const def = getPetSpeciesDefinition(speciesId);
  return {
    speciesId,
    category: def.category,
    wildness: def.baseWildness,
    relationship: {
      familiarity: def.baseFamiliarity,
      loyalty: def.baseLoyalty,
    },
    growth: { grade: 'COMMON', level: 1, exp: 0, metabolismBoost: 0 },
    needs: createInitialPetNeeds(),
    requestState: { refusalCount: 0 },
    activity: {
      lastCareDay: -1,
      dailyCareCounts: {},
      totalCareCounts: {},
      commandSuccesses: 0,
      commandFailures: 0,
      independentActions: 0,
    },
    personalFlags: {},
  };
}

export function normalizePetState(raw: Partial<PetState> | null | undefined): PetState | undefined {
  const rawSpeciesId = raw?.speciesId as unknown;
  if (!isPetSpeciesId(rawSpeciesId)) return undefined;
  const speciesId: PetSpeciesId = rawSpeciesId;
  const base = createInitialPetState(speciesId);
  const desire = clamp100(raw?.needs?.desire ?? base.needs.desire);
  const bathroomUrge = clamp100(raw?.needs?.bathroomUrge ?? base.needs.bathroomUrge);
  return {
    ...base,
    ...raw,
    speciesId,
    category: getPetSpeciesDefinition(speciesId).category,
    wildness: clamp100(raw?.wildness ?? base.wildness),
    relationship: {
      familiarity: clamp100(raw?.relationship?.familiarity ?? base.relationship.familiarity),
      loyalty: clamp100(raw?.relationship?.loyalty ?? base.relationship.loyalty),
    },
    growth: {
      grade: (['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'] as const).includes(raw?.growth?.grade as any) ? raw!.growth!.grade! : base.growth.grade,
      level: Math.max(1, Math.min(50, Math.floor(Number(raw?.growth?.level ?? base.growth.level)))),
      exp: Math.max(0, Math.floor(Number(raw?.growth?.exp ?? base.growth.exp))),
      metabolismBoost: Math.max(0, Math.min(5, Math.floor(Number(raw?.growth?.metabolismBoost ?? base.growth.metabolismBoost)))),
    },
    needs: {
      desire,
      bathroomUrge,
      desireTriggeredThresholds: normalizeThresholds(raw?.needs?.desireTriggeredThresholds, desire),
      bathroomTriggeredThresholds: normalizeThresholds(raw?.needs?.bathroomTriggeredThresholds, bathroomUrge),
    },
    requestState: {
      ...base.requestState,
      ...(raw?.requestState || {}),
      refusalCount: Math.max(0, Math.floor(Number(raw?.requestState?.refusalCount) || 0)),
    },
    activity: {
      ...base.activity,
      ...(raw?.activity || {}),
      lastCareDay: Math.floor(Number(raw?.activity?.lastCareDay ?? base.activity.lastCareDay)),
      dailyCareCounts: raw?.activity?.dailyCareCounts && typeof raw.activity.dailyCareCounts === 'object' ? raw.activity.dailyCareCounts : {},
      totalCareCounts: raw?.activity?.totalCareCounts && typeof raw.activity.totalCareCounts === 'object' ? raw.activity.totalCareCounts : {},
      commandSuccesses: Math.max(0, Math.floor(Number(raw?.activity?.commandSuccesses) || 0)),
      commandFailures: Math.max(0, Math.floor(Number(raw?.activity?.commandFailures) || 0)),
      independentActions: Math.max(0, Math.floor(Number(raw?.activity?.independentActions) || 0)),
    },
    personalFlags: raw?.personalFlags && typeof raw.personalFlags === 'object' ? raw.personalFlags : {},
  };
}
