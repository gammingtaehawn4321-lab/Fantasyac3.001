import type { Race, BeastkinType, WorldRegionId, WorldMapLayer, HexTerrain } from '../../types';

export interface RaceRelationRule {
  race: Race;
  beastkinType?: BeastkinType;
  attitude: 'FAVORED' | 'NEUTRAL' | 'WARY' | 'HOSTILE' | 'OPPRESSED';
  notes: string;
}

export interface RegionWorldStateKey {
  id: string;
  name: string;
  description: string;
  defaultValue: number;
  min: number;
  max: number;
}

export interface RegionDefinition {
  id: WorldRegionId;
  name: string;
  classification: 'LAND_REGION' | 'OCEAN_REGION' | 'VERTICAL_REGION' | 'AERIAL_REGION';
  summary: string;
  lore: string;
  geography: string;
  climate: string;
  majorPeoples: string[];
  capitals: Array<{ name: string; people?: string; notes?: string }>;
  settlements: string[];
  factions: string[];
  conflicts: string[];
  raceRelations: RaceRelationRule[];
  worldStateKeys: RegionWorldStateKey[];
  defaultTerrains: HexTerrain[];
  supportedLayers: WorldMapLayer[];
  editableNotes: string;
}
