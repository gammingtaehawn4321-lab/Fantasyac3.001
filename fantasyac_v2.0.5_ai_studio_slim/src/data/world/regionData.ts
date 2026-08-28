import type { WorldRegionId } from '../../types';
import type { RegionDefinition } from './regionTypes';
import { GRANDIA_REGION } from './regions/grandia';
import { SEIRE_REGION } from './regions/seire';
import { FOREZIN_REGION } from './regions/forezin';
import { SANTIMAC_REGION } from './regions/santimac';
import { PROSTI_REGION } from './regions/prosti';
import { SCROZE_REGION } from './regions/scroze';

export const REGION_DEFINITIONS: Record<WorldRegionId, RegionDefinition> = {
  GRANDIA: GRANDIA_REGION,
  SEIRE: SEIRE_REGION,
  FOREZIN: FOREZIN_REGION,
  SANTIMAC: SANTIMAC_REGION,
  PROSTI: PROSTI_REGION,
  SCROZE: SCROZE_REGION,
};

export const REGION_ORDER: WorldRegionId[] = ['GRANDIA', 'SEIRE', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'];
