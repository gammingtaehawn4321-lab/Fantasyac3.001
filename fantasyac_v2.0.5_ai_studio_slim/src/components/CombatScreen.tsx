import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronLeft,
  Clock3,
  Crown,
  Footprints,
  Gamepad2,
  Gauge,
  Heart,
  Info,
  Package,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import {
  BattleActor,
  BattleActionResult,
  BattleState,
  CombatElement,
  CombatMotionType,
  PlannedCombatAction,
  StatusEffect,
  TimelineEntry,
} from '../combat/combatTypes';
import { CompanionTactic, InventoryItem, PlayerState } from '../types';
import {
  attemptEscape,
  cloneBattleState,
  getCurrentBattleActor,
  isManualControlActor,
  planAutomaticAction,
  processActorSkillTurn,
  processAutomaticTurn,
  processCombatItemTurn,
} from '../combat/battleEngine';
import { getSkillActionDelay, getSkillUsability } from '../combat/battleActions';
import { getDragonResource, getDragonResourceLabel, isDragonEmperorFormActive } from '../combat/dragonSovereignForm';
import { previewTimelineAfterAction } from '../combat/turnManager';
import { getSkillDefinition, SkillDefinition } from '../data/skills';
import { getItemDefinition } from '../data/items';
import {
  EffectVisualPreset,
  formatActionDelay,
  formatSkillPower,
  getElementColors,
  getSkillEffectPreset,
  getSkillMenuCategories,
  getSkillMotionType,
} from '../combat/combatPresentation';
import { getActionSpeechEvent, resolveCombatSpeech } from '../combat/combatSpeech';
import { CombatSpeechEvent } from '../data/combatSpeechReferences';

interface CombatScreenProps {
  playerState: PlayerState;
  battleState: BattleState;
  onUpdateBattle: (nextBattle: BattleState) => void;
  onConsumeCombatItem: (nextBattle: BattleState, itemNameOrId: string, quantity?: number) => void;
  onUpdateCompanionSettings: (
    companionId: string,
    settings: { manualControl?: boolean; tactic?: CompanionTactic },
    nextBattle?: BattleState
  ) => void;
  onSkillUsed?: (skillId: string) => void;
  onBattleEnd: (
    outcome: 'VICTORY' | 'DEFEAT' | 'ESCAPED',
    rewards?: { exp: number; rupees: number; items?: any[] }
  ) => void;
}

type CommandCategory = 'ATTACK' | 'DEFENSE' | 'ITEM' | null;
type PresentationStage = 'WINDUP' | 'IMPACT';

interface ActivePresentation {
  sourceId: string;
  targetIds: string[];
  motionType: CombatMotionType;
  stage: PresentationStage;
  label: string;
  element: CombatElement;
  preset?: EffectVisualPreset;
  hit: boolean;
  itemThrown?: boolean;
}

interface ActiveSpeechBubble {
  text: string;
  referenceKeys: string[];
  event: CombatSpeechEvent;
  nonce: number;
}

interface CombatItemEntry {
  inventoryItem: InventoryItem;
  name: string;
  description: string;
  effectText: string;
  itemKey: string;
}

const TACTIC_OPTIONS: Array<{ value: CompanionTactic; label: string; description: string }> = [
  { value: 'AGGRESSIVE', label: '공격적', description: '가능하면 강한 공격 스킬을 우선 사용' },
  { value: 'DEFENSIVE', label: '방어적', description: '위험할 때 방어·생존 행동을 우선 사용' },
  { value: 'SUPPORT_PRIORITY', label: '지원', description: '회복과 지원 효과를 우선 사용' },
  { value: 'RESOURCE_SAVING', label: '자원 절약', description: '기본 공격과 낮은 전투 자원 행동을 우선 사용' },
];

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function getAllActors(state: BattleState): BattleActor[] {
  return [state.player, ...state.companions, ...state.enemies];
}

function getActor(state: BattleState, actorId?: string): BattleActor | undefined {
  if (!actorId) return undefined;
  return getAllActors(state).find((actor) => actor.id === actorId);
}

function isPartyActor(actor: BattleActor): boolean {
  return actor.isPlayer || !!actor.isCompanion;
}

function getTargetIdsForSkill(state: BattleState, source: BattleActor, skill: SkillDefinition, clickedId: string): string[] {
  const allies = isPartyActor(source)
    ? [state.player, ...state.companions].filter((actor) => actor.hp > 0)
    : state.enemies.filter((actor) => actor.hp > 0);
  const enemies = isPartyActor(source)
    ? state.enemies.filter((actor) => actor.hp > 0)
    : [state.player, ...state.companions].filter((actor) => actor.hp > 0);

  switch (skill.targetType) {
    case 'SELF': return [source.id];
    case 'ALLY': return allies.some((actor) => actor.id === clickedId) ? [clickedId] : [];
    case 'COMPANION': return allies.some((actor) => actor.id === clickedId && actor.isCompanion) ? [clickedId] : [];
    case 'ALL_ALLIES': return allies.map((actor) => actor.id);
    case 'ALL_ENEMIES': return enemies.map((actor) => actor.id);
    case 'ENEMY':
    default:
      return enemies.some((actor) => actor.id === clickedId) ? [clickedId] : [];
  }
}

function isValidSkillTarget(state: BattleState, source: BattleActor, skill: SkillDefinition, actor: BattleActor): boolean {
  if (actor.hp <= 0) return false;
  const sameSide = isPartyActor(source) === isPartyActor(actor);
  switch (skill.targetType) {
    case 'SELF': return actor.id === source.id;
    case 'ALLY': return sameSide;
    case 'COMPANION': return sameSide && !!actor.isCompanion;
    case 'ALL_ALLIES': return sameSide;
    case 'ENEMY': return !sameSide;
    case 'ALL_ENEMIES': return !sameSide;
    default: return false;
  }
}

function getStatusColor(effect: StatusEffect): string {
  switch (effect.type) {
    case 'BLEED': return 'border-rose-500/60 bg-rose-950/80 text-rose-200';
    case 'POISON': return 'border-emerald-500/60 bg-emerald-950/80 text-emerald-200';
    case 'BURN': return 'border-orange-500/60 bg-orange-950/80 text-orange-200';
    case 'STUN': return 'border-amber-500/60 bg-amber-950/80 text-amber-200';
    case 'SHIELD':
    case 'DEFEND': return 'border-sky-500/60 bg-sky-950/80 text-sky-200';
    case 'SLOW': return 'border-cyan-500/60 bg-cyan-950/80 text-cyan-200';
    default: return 'border-stone-600 bg-stone-900/90 text-stone-300';
  }
}

function getElementLabel(element?: CombatElement): string {
  switch (element) {
    case 'FIRE': return '화염';
    case 'ICE': return '냉기';
    case 'LIGHTNING': return '전격';
    case 'HOLY': return '신성';
    case 'DARK': return '암흑';
    case 'ARCANE': return '비전';
    case 'PSYCHIC': return '사념';
    case 'POISON': return '독';
    default: return '무속성';
  }
}

function getItemEntries(playerState: PlayerState): CombatItemEntry[] {
  return playerState.inventory.flatMap((item) => {
    const def = getItemDefinition(item.id || item.name);
    if (!def || def.category !== 'CONSUMABLE' || !def.usable || item.quantity <= 0) return [];
    const effect = def.useEffect;
    const parts: string[] = [];
    if (effect?.hpDelta) parts.push(`HP ${effect.hpDelta > 0 ? '+' : ''}${effect.hpDelta}`);
    if (effect?.mpDelta) parts.push(`MP ${effect.mpDelta > 0 ? '+' : ''}${effect.mpDelta}`);
    if (effect?.sanityDelta) parts.push(`정신력 ${effect.sanityDelta > 0 ? '+' : ''}${effect.sanityDelta}`);
    if (effect?.buffName) parts.push(effect.buffName);
    return [{
      inventoryItem: item,
      name: def.name,
      description: def.description,
      effectText: parts.join(' · ') || '특수 효과',
      itemKey: item.id || item.name,
    }];
  });
}

function motionForCard(
  actor: BattleActor,
  side: 'ALLY' | 'ENEMY',
  presentation?: ActivePresentation
): Record<string, any> {
  if (!presentation) return { x: 0, y: 0, scale: 1, rotate: 0 };
  const isSource = presentation.sourceId === actor.id;
  const isTarget = presentation.targetIds.includes(actor.id);
  const directionToCenter = side === 'ALLY' ? -1 : 1;
  const directionAway = -directionToCenter;

  if (presentation.stage === 'WINDUP' && isSource) {
    switch (presentation.motionType) {
      case 'MELEE': return { y: 54 * directionToCenter, scale: 1.055, rotate: side === 'ALLY' ? -1.5 : 1.5 };
      case 'RANGED': return { y: 20 * directionAway, scale: 0.98 };
      case 'MAGIC': return { x: [0, -4, 4, -3, 3, 0], y: -3 * directionToCenter, scale: 1.035 };
      case 'SUPPORT': return { y: [0, -5, 0], scale: [1, 1.035, 1] };
      case 'DEFEND': return { y: 7 * directionAway, scale: 1.03 };
      case 'ITEM_THROW': return { y: 22 * directionToCenter, rotate: side === 'ALLY' ? -2 : 2 };
      case 'ITEM_SELF': return { y: [0, -4, 0], scale: [1, 1.04, 1] };
      case 'ESCAPE': return { y: 26 * directionAway, opacity: 0.72, scale: 0.96 };
      default: return {};
    }
  }

  if (presentation.stage === 'IMPACT' && isTarget && presentation.hit) {
    if (presentation.motionType === 'SUPPORT' || presentation.motionType === 'DEFEND' || presentation.motionType === 'ITEM_SELF') {
      return { y: [0, -4, 0], scale: [1, 1.045, 1] };
    }
    return { x: [0, -5, 5, -2, 0], y: 15 * directionAway, scale: [1, 0.98, 1] };
  }

  return { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };
}

const EffectOverlay: React.FC<{
  presentation: ActivePresentation;
}> = ({ presentation }) => {
  const preset = presentation.preset;
  const colors = preset || { ...getElementColors(presentation.element), variant: 0, rotation: 0, secondaryRotation: 45, particleCount: 4, particleSpread: 42, effectKey: presentation.label };
  const particles = Array.from({ length: colors.particleCount || 4 }, (_, index) => {
    const angle = ((360 / (colors.particleCount || 4)) * index + colors.secondaryRotation) * Math.PI / 180;
    const distance = colors.particleSpread || 42;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: (index * 47 + colors.rotation) % 180,
    };
  });

  return (
    <motion.div
      key={`${presentation.sourceId}_${presentation.label}_${presentation.stage}`}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.25 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible"
      style={{ color: colors.color }}
    >
      {colors.variant === 0 && (
        <>
          <motion.div
            initial={{ scaleX: 0, rotate: colors.rotation }}
            animate={{ scaleX: 1, rotate: colors.rotation }}
            className="absolute h-[3px] w-[120%] rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.color}, transparent)`, boxShadow: `0 0 16px ${colors.color}` }}
          />
          <motion.div
            initial={{ scaleX: 0, rotate: colors.secondaryRotation }}
            animate={{ scaleX: 0.85, rotate: colors.secondaryRotation }}
            className="absolute h-[2px] w-[95%] rounded-full opacity-80"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.color}, transparent)` }}
          />
        </>
      )}
      {colors.variant === 1 && (
        <motion.div
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute h-20 w-20 rounded-full border-2"
          style={{ borderColor: colors.color, boxShadow: `0 0 20px ${colors.softColor}` }}
        />
      )}
      {colors.variant === 2 && (
        <motion.div
          initial={{ scale: 0.3, rotate: colors.rotation }}
          animate={{ scale: 1.2, rotate: colors.rotation + 120 }}
          className="absolute h-16 w-16 rounded-[35%] border-2"
          style={{ borderColor: colors.color, boxShadow: `inset 0 0 18px ${colors.softColor}, 0 0 18px ${colors.softColor}` }}
        />
      )}
      {colors.variant === 3 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '150%', opacity: [0, 1, 0] }}
          transition={{ duration: 0.42 }}
          className="absolute w-[5px] rounded-full"
          style={{ background: colors.color, boxShadow: `0 0 18px ${colors.color}` }}
        />
      )}
      {colors.variant === 4 && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '145%', opacity: [0, 1, 0] }}
          transition={{ duration: 0.4 }}
          className="absolute h-8 rounded-full blur-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${colors.softColor}, ${colors.color}, ${colors.softColor}, transparent)` }}
        />
      )}
      {colors.variant === 5 && (
        <motion.div
          initial={{ scale: 0.25, rotate: colors.rotation, opacity: 0 }}
          animate={{ scale: 1, rotate: colors.rotation + 180, opacity: [0, 1, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute h-20 w-20 border border-dashed rounded-full"
          style={{ borderColor: colors.color }}
        >
          <div className="absolute inset-3 border rounded-full" style={{ borderColor: colors.color }} />
          <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: colors.color }} />
          <div className="absolute top-1/2 left-0 w-full h-px" style={{ background: colors.color }} />
        </motion.div>
      )}
      {colors.variant === 6 && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.15, 0.9], opacity: [0, 1, 0] }}
          className="absolute h-16 w-16 rounded-full"
          style={{ background: `radial-gradient(circle, ${colors.color} 0%, ${colors.softColor} 35%, transparent 72%)`, boxShadow: `0 0 28px ${colors.softColor}` }}
        />
      )}
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 0.25, rotate: particle.rotate }}
          transition={{ duration: 0.42 + (index % 3) * 0.05 }}
          className="absolute block h-1.5 w-1.5 rounded-full"
          style={{ background: colors.color, boxShadow: `0 0 8px ${colors.color}` }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 0.95, y: -28 }}
        exit={{ opacity: 0 }}
        className="absolute whitespace-nowrap rounded-full border border-stone-700/80 bg-stone-950/85 px-2 py-0.5 text-[9px] font-bold tracking-wide text-stone-100 shadow-xl"
      >
        {presentation.label}
      </motion.div>
    </motion.div>
  );
};

const ActorCard: React.FC<{
  actor: BattleActor;
  side: 'ALLY' | 'ENEMY';
  role: 'MAIN' | 'SUPPORT';
  isCurrent: boolean;
  targetable: boolean;
  presentation?: ActivePresentation;
  speechBubble?: ActiveSpeechBubble;
  onClick: () => void;
}> = ({ actor, side, role, isCurrent, targetable, presentation, speechBubble, onClick }) => {
  const isMain = role === 'MAIN';
  const hpPct = Math.max(0, Math.min(100, actor.hp / Math.max(1, actor.maxHp) * 100));
  const costPct = Math.max(0, Math.min(100, actor.cost / Math.max(1, actor.maxCost) * 100));
  const dragonResourceLabel = getDragonResourceLabel(actor);
  const dragonResource = getDragonResource(actor);
  const dragonFormActive = isDragonEmperorFormActive(actor);
  const isTargetImpact = presentation?.stage === 'IMPACT' && presentation.targetIds.includes(actor.id);
  const cardMotion = motionForCard(actor, side, presentation);

  return (
    <motion.button
      layout
      animate={cardMotion}
      transition={{ duration: presentation?.stage === 'WINDUP' ? 0.28 : 0.2, ease: 'easeOut' }}
      whileTap={{ scale: actor.hp > 0 ? 0.98 : 1 }}
      onClick={onClick}
      className={`relative shrink-0 overflow-visible rounded-2xl border text-left shadow-xl transition-colors ${
        isMain ? 'w-[112px] sm:w-[132px]' : 'w-[82px] sm:w-[96px]'
      } ${
        actor.hp <= 0
          ? 'border-stone-800 bg-stone-950/70 opacity-45 grayscale'
          : targetable
          ? 'border-amber-400/90 bg-stone-900 ring-2 ring-amber-400/25'
          : isCurrent
          ? 'border-sky-400/90 bg-stone-900 ring-2 ring-sky-400/20'
          : side === 'ENEMY'
          ? 'border-rose-950/80 bg-stone-900'
          : 'border-sky-950/80 bg-stone-900'
      }`}
    >
      <AnimatePresence>
        {speechBubble && (
          <motion.div
            key={`${actor.id}_${speechBubble.nonce}`}
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            title={speechBubble.referenceKeys.join(' + ')}
            className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-[180px] -translate-x-1/2 rounded-xl border px-2.5 py-1.5 text-center text-[9px] font-bold leading-snug shadow-2xl sm:max-w-[220px] sm:text-[10px] ${
              side === 'ENEMY'
                ? 'border-rose-700/60 bg-stone-950/95 text-rose-50'
                : 'border-sky-700/60 bg-stone-950/95 text-sky-50'
            }`}
            style={{ top: isMain ? '-3.45rem' : '-3.15rem' }}
          >
            {speechBubble.text}
            <span className={`absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[6px] ${side === 'ENEMY' ? 'border-t-rose-700/70' : 'border-t-sky-700/70'}`} />
          </motion.div>
        )}
      </AnimatePresence>

      {isCurrent && actor.hp > 0 && (
        <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-sky-400/60 bg-sky-950 px-2 py-0.5 text-[8px] font-black tracking-widest text-sky-200 shadow-lg">
          NOW
        </div>
      )}

      <div className={`${isMain ? 'h-[105px] sm:h-[126px]' : 'h-[72px] sm:h-[84px]'} relative overflow-hidden rounded-t-2xl bg-stone-950`}>
        {actor.portraitUrl ? (
          <img src={actor.portraitUrl} alt={actor.name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-b ${side === 'ENEMY' ? 'from-rose-950/70 to-stone-950' : 'from-sky-950/60 to-stone-950'}`}>
            {side === 'ENEMY' ? <Skull className={`${isMain ? 'h-11 w-11' : 'h-8 w-8'} text-stone-500`} /> : <Sparkles className={`${isMain ? 'h-11 w-11' : 'h-8 w-8'} text-stone-500`} />}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-2 pb-1 pt-5">
          <div className="truncate text-[10px] font-black text-stone-100 sm:text-xs">{actor.name}</div>
          <div className="flex items-center gap-1 text-[8px] text-stone-400">
            {actor.isPlayer ? '플레이어' : actor.isCompanion ? '동료' : isMain ? '우두머리' : '몬스터'} · 레벨 {actor.level}
          </div>
        </div>
      </div>

      <div className="space-y-1 rounded-b-2xl bg-stone-950/95 p-1.5">
        <div>
          <div className="mb-0.5 flex items-center justify-between text-[8px] font-bold text-stone-400">
            <span>HP</span><span>{Math.max(0, Math.round(actor.hp))}/{Math.round(actor.maxHp)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-800">
            <motion.div className="h-full bg-rose-500" animate={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-0.5 flex items-center justify-between text-[8px] font-bold text-stone-400">
            <span>전투 자원</span><span>{Math.round(actor.cost)}/{Math.round(actor.maxCost)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-stone-800">
            <motion.div className="h-full bg-sky-400" animate={{ width: `${costPct}%` }} />
          </div>
        </div>
        {dragonResourceLabel && (
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[8px] font-bold text-amber-300">
              <span>{dragonFormActive ? '용제 현현' : dragonResourceLabel}</span><span>{dragonFormActive ? '현현 중' : `${Math.round(dragonResource)}/100`}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-stone-800">
              <motion.div className="h-full bg-amber-400" animate={{ width: `${dragonFormActive ? 100 : dragonResource}%` }} />
            </div>
          </div>
        )}
        {actor.statusEffects.length > 0 && (
          <div className="flex gap-0.5 overflow-hidden pt-0.5">
            {actor.statusEffects.slice(0, 2).map((effect) => (
              <span key={effect.id} className={`truncate rounded border px-1 py-[1px] text-[7px] ${getStatusColor(effect)}`}>
                {effect.name} {effect.duration}
              </span>
            ))}
            {actor.statusEffects.length > 2 && <span className="text-[7px] text-stone-500">+{actor.statusEffects.length - 2}</span>}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isTargetImpact && presentation && (
          <EffectOverlay presentation={presentation} />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const TimelineBar: React.FC<{
  state: BattleState;
  entries: TimelineEntry[];
  previewing: boolean;
}> = ({ state, entries, previewing }) => (
  <div className="shrink-0 border-b border-stone-800 bg-stone-950/95 px-2 py-2 sm:px-4">
    <div className="mb-1 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.14em] text-stone-300">
        <Clock3 className="h-3.5 w-3.5 text-sky-400" /> 행동 순서
        {previewing && <span className="rounded border border-amber-700/60 bg-amber-950/50 px-1.5 py-0.5 text-[8px] tracking-normal text-amber-300">선택 후 예상</span>}
      </div>
      <div className="truncate text-[9px] text-stone-500">{state.battlefield.name} · 행동 {state.actionCount + 1}</div>
    </div>
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
      {entries.slice(0, 12).map((entry, index) => {
        const actor = getActor(state, entry.actorId);
        const isNow = index === 0 && state.currentActorId === entry.actorId;
        return (
          <div key={`${entry.actorId}_${entry.occurrenceIndex}_${index}`} className="relative flex shrink-0 items-center">
            {index > 0 && <div className="mr-1 h-px w-2 bg-stone-700" />}
            <div className={`relative flex min-w-[62px] items-center gap-1.5 rounded-lg border px-1.5 py-1 ${
              isNow
                ? 'border-sky-400 bg-sky-950/70 text-sky-100'
                : entry.isPlayer
                ? 'border-sky-900 bg-sky-950/35 text-sky-200'
                : entry.isCompanion
                ? 'border-emerald-900 bg-emerald-950/30 text-emerald-200'
                : 'border-rose-950 bg-rose-950/30 text-rose-200'
            }`}>
              {isNow && <span className="absolute -top-2 left-1 rounded bg-sky-500 px-1 text-[7px] font-black text-stone-950">현재</span>}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-stone-900 text-[9px] font-black">
                {actor?.portraitUrl ? <img src={actor.portraitUrl} alt="" className="h-full w-full object-cover" /> : actor?.name?.slice(0, 1) || '?'}
              </div>
              <div className="min-w-0">
                <div className="max-w-[54px] truncate text-[9px] font-bold">{entry.actorName}</div>
                <div className="text-[7px] opacity-60">{entry.predictedTime <= 0 ? '현재' : `+${entry.predictedTime.toFixed(1)}`}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const CombatScreen: React.FC<CombatScreenProps> = ({
  playerState,
  battleState,
  onUpdateBattle,
  onConsumeCombatItem,
  onUpdateCompanionSettings,
  onSkillUsed,
  onBattleEnd,
}) => {
  const [commandCategory, setCommandCategory] = useState<CommandCategory>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [hoverSkillId, setHoverSkillId] = useState<string | null>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [hoverItemKey, setHoverItemKey] = useState<string | null>(null);
  const [inspectedActorId, setInspectedActorId] = useState<string | null>(null);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [presentation, setPresentation] = useState<ActivePresentation | undefined>();
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, ActiveSpeechBubble>>({});
  const speechTimersRef = useRef<Record<string, number>>({});
  const battleSpeechStartedRef = useRef('');
  const autoActionKeyRef = useRef('');
  const endedRef = useRef('');
  const pendingEndRef = useRef<{ key: string; outcome: 'VICTORY' | 'DEFEAT' | 'ESCAPED'; rewards?: { exp: number; rupees: number; items?: any[] } } | null>(null);

  const currentActor = getCurrentBattleActor(battleState);
  const isManualTurn = isManualControlActor(currentActor) && !['VICTORY', 'DEFEAT', 'ESCAPED'].includes(battleState.phase);
  const itemEntries = useMemo(() => getItemEntries(playerState), [playerState.inventory]);

  const equippedSkills = useMemo(() => {
    if (!currentActor) return [];
    const ids = currentActor.equippedSkillIds?.length ? currentActor.equippedSkillIds : currentActor.skills;
    return ids
      .map((id) => getSkillDefinition(id))
      .filter((skill): skill is SkillDefinition => !!skill && skill.type === 'ACTIVE');
  }, [currentActor]);

  const attackSkills = useMemo(
    () => equippedSkills.filter((skill) => getSkillMenuCategories(skill).includes('ATTACK')),
    [equippedSkills]
  );
  const defenseSkills = useMemo(
    () => equippedSkills.filter((skill) => getSkillMenuCategories(skill).includes('DEFENSE')),
    [equippedSkills]
  );

  const selectedSkill = selectedSkillId ? getSkillDefinition(selectedSkillId) : undefined;
  const hoverSkill = hoverSkillId ? getSkillDefinition(hoverSkillId) : undefined;
  const previewSkill = hoverSkill || selectedSkill;
  const previewDelay = previewSkill
    ? getSkillActionDelay(previewSkill)
    : (hoverItemKey || selectedItemKey) && commandCategory === 'ITEM'
    ? 0.9
    : undefined;

  const timelineEntries = useMemo(() => {
    if (!currentActor || previewDelay == null || !isManualTurn) return battleState.timeline || [];
    return previewTimelineAfterAction(battleState, currentActor.id, previewDelay, 12);
  }, [battleState, currentActor, previewDelay, isManualTurn]);

  const leaderEnemy = useMemo(() => {
    const boss = battleState.enemies.find((enemy) => enemy.tier === 'BOSS');
    const elite = battleState.enemies.find((enemy) => enemy.tier === 'ELITE');
    return boss || elite || battleState.enemies[0];
  }, [battleState.enemies]);
  const enemyMinions = battleState.enemies.filter((enemy) => enemy.id !== leaderEnemy?.id).slice(0, 4);
  const inspectedActor = inspectedActorId ? getActor(battleState, inspectedActorId) : undefined;

  const showSpeechBubble = (
    actor: BattleActor | undefined,
    event: CombatSpeechEvent,
    stateForContext: BattleState = battleState,
    durationMs: number = 1550
  ) => {
    if (!actor) return;
    const contextualActor = getActor(stateForContext, actor.id) || actor;
    const resolved = resolveCombatSpeech(contextualActor, event);
    if (!resolved?.text?.trim()) return;

    const previousTimer = speechTimersRef.current[actor.id];
    if (previousTimer) window.clearTimeout(previousTimer);
    const nonce = Date.now() + Math.random();
    setSpeechBubbles((previous) => ({
      ...previous,
      [actor.id]: { ...resolved, nonce },
    }));
    speechTimersRef.current[actor.id] = window.setTimeout(() => {
      setSpeechBubbles((previous) => {
        if (previous[actor.id]?.nonce !== nonce) return previous;
        const next = { ...previous };
        delete next[actor.id];
        return next;
      });
      delete speechTimersRef.current[actor.id];
    }, durationMs);
  };

  const getCombatOutcomeLogs = (result: BattleActionResult) =>
    result.logEntries.filter((entry) => ['damage', 'crit', 'miss'].includes(entry.badge?.type || ''));

  const emitSkillOutcomeSpeech = (
    beforeState: BattleState,
    result: BattleActionResult,
    source: BattleActor,
    targetIds: string[],
    skill: SkillDefinition
  ) => {
    const resultState = result.battleState;
    const sourceAfter = getActor(resultState, source.id) || source;
    const outcomeLogs = getCombatOutcomeLogs(result);
    const hasDamageSkill = skill.damageMultiplier != null;

    if (!hasDamageSkill) {
      const motionType = getSkillMotionType(skill);
      showSpeechBubble(sourceAfter, motionType === 'DEFEND' ? 'DEFEND' : 'SUPPORT', resultState);
      return;
    }

    const allMissed = outcomeLogs.length > 0 && outcomeLogs.every((entry) => entry.badge?.type === 'miss');
    const anyCrit = outcomeLogs.some((entry) => entry.badge?.type === 'crit');
    const anyEvade = outcomeLogs.some((entry) => entry.badge?.type === 'miss' && /회피/.test(entry.text));

    if (allMissed) {
      showSpeechBubble(sourceAfter, anyEvade ? 'TARGET_EVADED' : 'ATTACK_MISS', resultState);
    } else {
      showSpeechBubble(sourceAfter, anyCrit ? 'ATTACK_CRITICAL' : 'ATTACK_SUCCESS', resultState);
    }

    for (const targetId of targetIds) {
      const before = getActor(beforeState, targetId);
      const after = getActor(resultState, targetId);
      if (!before || !after) continue;

      const targetWasEvaded = outcomeLogs.some((entry) => entry.badge?.type === 'miss' && entry.text.includes(before.name) && /회피/.test(entry.text));
      if (targetWasEvaded) {
        showSpeechBubble(after, 'EVADE_SUCCESS', resultState);
        continue;
      }

      const hpLoss = Math.max(0, before.hp - after.hp);
      const hadDefense = before.statusEffects.some((effect) => effect.type === 'DEFEND' || effect.type === 'SHIELD');
      if (hpLoss > 0) {
        const heavy = hpLoss / Math.max(1, before.maxHp) >= 0.15;
        showSpeechBubble(after, hadDefense ? 'DEFEND_SUCCESS' : heavy ? 'HEAVY_HIT_RECEIVED' : 'HIT_RECEIVED', resultState);
      } else if (hadDefense && outcomeLogs.some((entry) => entry.badge?.type !== 'miss' && entry.text.includes(before.name))) {
        showSpeechBubble(after, 'DEFEND_SUCCESS', resultState);
      }

      if (before.hp > 0 && after.hp <= 0) {
        showSpeechBubble(sourceAfter, 'ENEMY_DEFEATED', resultState, 1800);
        const sameSide = (before.isPlayer || before.isCompanion) ? [resultState.player, ...resultState.companions] : resultState.enemies;
        const witness = sameSide.find((candidate) => candidate.id !== before.id && candidate.hp > 0);
        if (witness) showSpeechBubble(witness, 'ALLY_DEFEATED', resultState, 1800);
      }
    }
  };

  const resetCommand = () => {
    setCommandCategory(null);
    setSelectedSkillId(null);
    setSelectedItemKey(null);
    setHoverSkillId(null);
    setHoverItemKey(null);
  };

  useEffect(() => {
    resetCommand();
  }, [battleState.currentActorId, battleState.actionCount]);

  // 전투 시작 대사는 모든 카드가 자신의 참조 조건으로 한 번씩 표시한다.
  useEffect(() => {
    if (battleSpeechStartedRef.current === battleState.id) return;
    battleSpeechStartedRef.current = battleState.id;
    const actors = getAllActors(battleState).filter((actor) => actor.hp > 0);
    actors.forEach((actor, index) => {
      window.setTimeout(() => showSpeechBubble(actor, 'BATTLE_START', battleState, 1900), index * 90);
    });
  }, [battleState.id]);

  useEffect(() => () => {
    (Object.values(speechTimersRef.current) as number[]).forEach((timer) => window.clearTimeout(timer));
    speechTimersRef.current = {};
  }, []);

  // 종료 판정은 부모가 최신 BattleState를 받은 다음 호출해 stale playerState를 피한다.
  useEffect(() => {
    const pending = pendingEndRef.current;
    if (!pending) return;
    if (`${battleState.id}:${battleState.phase}` !== pending.key) return;
    if (endedRef.current === pending.key) return;
    endedRef.current = pending.key;
    pendingEndRef.current = null;
    const timer = window.setTimeout(() => onBattleEnd(pending.outcome, pending.rewards), 900);
    return () => window.clearTimeout(timer);
  }, [battleState.id, battleState.phase, onBattleEnd]);

  const finishPresentationResult = async (result: BattleActionResult) => {
    setPresentation(undefined);
    setIsProcessing(false);
    resetCommand();

    if (result.isBattleEnded && result.outcome) {
      if (result.outcome === 'VICTORY') {
        [result.battleState.player, ...result.battleState.companions]
          .filter((actor) => actor.hp > 0)
          .forEach((actor) => showSpeechBubble(actor, 'VICTORY', result.battleState, 2200));
      } else if (result.outcome === 'DEFEAT') {
        [result.battleState.player, ...result.battleState.companions]
          .forEach((actor) => showSpeechBubble(actor, 'DEFEAT', result.battleState, 2200));
        result.battleState.enemies.filter((actor) => actor.hp > 0)
          .forEach((actor) => showSpeechBubble(actor, 'VICTORY', result.battleState, 2200));
      } else if (result.outcome === 'ESCAPED') {
        [result.battleState.player, ...result.battleState.companions]
          .filter((actor) => actor.hp > 0)
          .forEach((actor) => showSpeechBubble(actor, 'ESCAPE_SUCCESS', result.battleState, 2200));
      }
      pendingEndRef.current = {
        key: `${result.battleState.id}:${result.outcome}`,
        outcome: result.outcome,
        rewards: result.rewards,
      };
    }

    if (result.consumedItem) {
      onConsumeCombatItem(result.battleState, result.consumedItem.itemNameOrId, result.consumedItem.quantity);
    } else {
      onUpdateBattle(result.battleState);
    }
  };

  const runSkillPresentation = async (
    source: BattleActor,
    skill: SkillDefinition,
    targetIds: string[],
    execute: () => BattleActionResult
  ) => {
    const motionType = getSkillMotionType(skill);
    const base: ActivePresentation = {
      sourceId: source.id,
      targetIds,
      motionType,
      stage: 'WINDUP',
      label: skill.name,
      element: skill.element || 'NEUTRAL',
      preset: getSkillEffectPreset(skill),
      hit: true,
    };
    const beforeState = cloneBattleState(battleState);
    showSpeechBubble(source, getActionSpeechEvent(source), beforeState);
    setIsProcessing(true);
    setPresentation(base);
    await sleep(motionType === 'MELEE' ? 300 : 260);

    const result = execute();
    const outcomeLogs = getCombatOutcomeLogs(result);
    const missed = outcomeLogs.length > 0 && outcomeLogs.every((log) => log.badge?.type === 'miss');
    setPresentation({ ...base, stage: 'IMPACT', hit: !missed });
    emitSkillOutcomeSpeech(beforeState, result, source, targetIds, skill);
    await sleep(360);
    await finishPresentationResult(result);
  };

  const executeSelectedSkillAgainst = async (clickedActor: BattleActor) => {
    if (!currentActor || !selectedSkill || isProcessing || !isManualTurn) return;
    if (!isValidSkillTarget(battleState, currentActor, selectedSkill, clickedActor)) return;

    const targetIds = getTargetIdsForSkill(battleState, currentActor, selectedSkill, clickedActor.id);
    if (targetIds.length === 0) return;

    if (currentActor.isPlayer) onSkillUsed?.(selectedSkill.id);
    await runSkillPresentation(
      currentActor,
      selectedSkill,
      targetIds,
      () => processActorSkillTurn(battleState, currentActor.id, selectedSkill.id, clickedActor.id, playerState)
    );
  };

  const executeSelectedItemAgainst = async (clickedActor: BattleActor) => {
    if (!currentActor || !selectedItemKey || isProcessing || !isManualTurn || clickedActor.hp <= 0) return;
    const entry = itemEntries.find((item) => item.itemKey === selectedItemKey);
    if (!entry) return;

    const selfUse = currentActor.id === clickedActor.id;
    const colors = getElementColors('NEUTRAL');
    const base: ActivePresentation = {
      sourceId: currentActor.id,
      targetIds: [clickedActor.id],
      motionType: selfUse ? 'ITEM_SELF' : 'ITEM_THROW',
      stage: 'WINDUP',
      label: entry.name,
      element: 'NEUTRAL',
      hit: true,
      itemThrown: !selfUse,
      preset: {
        effectKey: `ITEM_${entry.itemKey}`,
        variant: selfUse ? 1 : 4,
        rotation: selfUse ? 0 : -22,
        secondaryRotation: 42,
        particleCount: 5,
        particleSpread: 36,
        ...colors,
      },
    };

    showSpeechBubble(currentActor, getActionSpeechEvent(currentActor), battleState);
    setIsProcessing(true);
    setPresentation(base);
    await sleep(260);
    const result = processCombatItemTurn(battleState, currentActor.id, entry.itemKey, clickedActor.id, playerState);
    setPresentation({ ...base, stage: 'IMPACT' });
    showSpeechBubble(getActor(result.battleState, currentActor.id) || currentActor, 'ITEM_USE', result.battleState);
    await sleep(330);
    await finishPresentationResult(result);
  };

  const executeEscape = async () => {
    if (!currentActor || !isManualTurn || isProcessing) return;
    const base: ActivePresentation = {
      sourceId: currentActor.id,
      targetIds: [],
      motionType: 'ESCAPE',
      stage: 'WINDUP',
      label: '도주',
      element: 'NEUTRAL',
      hit: true,
    };
    showSpeechBubble(currentActor, 'ESCAPE_ATTEMPT', battleState);
    setIsProcessing(true);
    setPresentation(base);
    await sleep(320);
    const result = attemptEscape(battleState, playerState, currentActor.id);
    if (!result.isBattleEnded) {
      showSpeechBubble(getActor(result.battleState, currentActor.id) || currentActor, 'ESCAPE_FAIL', result.battleState);
    }
    await sleep(120);
    await finishPresentationResult(result);
  };

  const handleActorCardClick = (actor: BattleActor) => {
    if (isProcessing) return;
    if (selectedSkill && currentActor && isManualTurn) {
      void executeSelectedSkillAgainst(actor);
      return;
    }
    if (selectedItemKey && currentActor && isManualTurn) {
      void executeSelectedItemAgainst(actor);
      return;
    }
    setInspectedActorId(actor.id);
  };

  const isCardTargetable = (actor: BattleActor): boolean => {
    if (isProcessing || !currentActor || !isManualTurn || actor.hp <= 0) return false;
    if (selectedSkill) return isValidSkillTarget(battleState, currentActor, selectedSkill, actor);
    if (selectedItemKey) return true;
    return false;
  };

  const chooseSkill = (skill: SkillDefinition) => {
    if (!currentActor || isProcessing) return;
    const usability = getSkillUsability(currentActor, skill.id);
    if (!usability.usable) return;
    setSelectedSkillId(skill.id);
    setSelectedItemKey(null);
    setHoverSkillId(null);
  };

  const chooseItem = (entry: CombatItemEntry) => {
    if (isProcessing) return;
    setSelectedItemKey(entry.itemKey);
    setSelectedSkillId(null);
    setHoverItemKey(null);
  };

  const updateCompanionManual = (actor: BattleActor, manualControl: boolean) => {
    if (!actor.isCompanion) return;
    const next = cloneBattleState(battleState);
    const target = next.companions.find((companion) => companion.id === actor.id);
    if (!target) return;
    target.manualControl = manualControl;
    autoActionKeyRef.current = '';
    onUpdateCompanionSettings(actor.id, { manualControl }, next);
  };

  const updateCompanionTactic = (actor: BattleActor, tactic: CompanionTactic) => {
    if (!actor.isCompanion) return;
    onUpdateCompanionSettings(actor.id, { tactic });
  };

  // AI는 한 Actor씩만 실행한다. 다음 BattleState가 렌더된 뒤 다음 AI Actor가 이어서 행동한다.
  useEffect(() => {
    const actor = getCurrentBattleActor(battleState);
    if (!actor || isManualControlActor(actor) || ['VICTORY', 'DEFEAT', 'ESCAPED'].includes(battleState.phase)) return;

    const key = `${battleState.id}:${battleState.actionCount}:${actor.id}:${actor.manualControl ? 'M' : 'A'}`;
    if (autoActionKeyRef.current === key) return;
    autoActionKeyRef.current = key;
    let cancelled = false;

    const run = async () => {
      const plan: PlannedCombatAction | undefined = planAutomaticAction(battleState, playerState);
      if (!plan || cancelled) return;
      const skill = getSkillDefinition(plan.skillId) || getSkillDefinition('basic_attack')!;
      const motionType = getSkillMotionType(skill);
      const base: ActivePresentation = {
        sourceId: actor.id,
        targetIds: plan.targetIds,
        motionType,
        stage: 'WINDUP',
        label: skill.name,
        element: skill.element || 'NEUTRAL',
        preset: getSkillEffectPreset(skill),
        hit: true,
      };

      const beforeState = cloneBattleState(battleState);
      showSpeechBubble(actor, getActionSpeechEvent(actor), beforeState);
      setIsProcessing(true);
      await sleep(240);
      if (cancelled) return;
      setPresentation(base);
      await sleep(motionType === 'MELEE' ? 300 : 260);
      if (cancelled) return;

      const result = processAutomaticTurn(battleState, playerState, plan);
      const outcomeLogs = getCombatOutcomeLogs(result);
      const missed = outcomeLogs.length > 0 && outcomeLogs.every((log) => log.badge?.type === 'miss');
      setPresentation({ ...base, stage: 'IMPACT', hit: !missed });
      emitSkillOutcomeSpeech(beforeState, result, actor, plan.targetIds, skill);
      await sleep(350);
      if (cancelled) return;
      await finishPresentationResult(result);
    };

    void run();
    return () => { cancelled = true; };
  }, [battleState.id, battleState.actionCount, battleState.currentActorId, battleState.phase, currentActor?.manualControl]);

  const renderSkillButton = (skill: SkillDefinition) => {
    if (!currentActor) return null;
    const usability = getSkillUsability(currentActor, skill.id);
    const selected = selectedSkillId === skill.id;
    const elementColors = getElementColors(skill.element || 'NEUTRAL');
    return (
      <button
        key={skill.id}
        onClick={() => chooseSkill(skill)}
        onMouseEnter={() => setHoverSkillId(skill.id)}
        onMouseLeave={() => setHoverSkillId(null)}
        disabled={!usability.usable || isProcessing}
        className={`min-w-[205px] max-w-[240px] shrink-0 rounded-xl border p-2.5 text-left transition ${
          selected
            ? 'border-amber-400 bg-amber-950/35 ring-1 ring-amber-400/25'
            : usability.usable
            ? 'border-stone-700 bg-stone-900 hover:border-stone-500 hover:bg-stone-800/90'
            : 'border-stone-800 bg-stone-950/70 opacity-50'
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="truncate text-xs font-black text-stone-100">{skill.name}</div>
          <span className="rounded px-1.5 py-0.5 text-[8px] font-black" style={{ color: elementColors.color, background: elementColors.softColor }}>
            {getElementLabel(skill.element)}
          </span>
        </div>
        <div className="mb-1.5 grid grid-cols-3 gap-1 text-[8px] font-bold text-stone-400">
          <span>위력 <b className="text-stone-200">{formatSkillPower(skill)}</b></span>
          <span>자원 <b className="text-sky-300">{usability.cost}</b></span>
          <span>재사용 <b className={usability.cooldownRemaining > 0 ? 'text-rose-300' : 'text-stone-200'}>{usability.cooldownRemaining || skill.cooldown || 0}</b></span>
        </div>
        <div className="mb-1 text-[8px] text-amber-300/80">{formatActionDelay(skill.actionDelay)}</div>
        <div className="line-clamp-2 text-[9px] leading-relaxed text-stone-400">{skill.description}</div>
        {!usability.usable && (
          <div className="mt-1 text-[8px] font-bold text-rose-400">
            {usability.reason === 'NOT_ENOUGH_COST' ? '전투 자원 부족' : usability.reason === 'COOLDOWN' ? `쿨타임 ${usability.cooldownRemaining}` : '사용 불가'}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-stone-950 text-stone-100 select-none">
      <TimelineBar state={battleState} entries={timelineEntries} previewing={previewDelay != null && isManualTurn} />

      {/* 전장: 위 절반 적군 / 아래 절반 아군 */}
      <main className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(120,113,108,0.12),transparent_58%)]">
        <div className="absolute inset-x-0 top-1/2 z-10 h-px bg-gradient-to-r from-transparent via-stone-500/80 to-transparent" />
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-700 bg-stone-950 px-2 py-0.5 text-[8px] font-black tracking-[0.2em] text-stone-500">FRONT</div>

        {/* 적 진영 */}
        <section className="absolute inset-x-0 top-0 flex h-1/2 flex-col items-center justify-between px-2 pb-2 pt-11 sm:px-5 sm:pt-12">
          <div className="flex min-h-[82px] w-full items-start justify-center gap-2 sm:gap-3">
            {enemyMinions.map((enemy) => (
              <ActorCard
                key={enemy.id}
                actor={enemy}
                side="ENEMY"
                role="SUPPORT"
                isCurrent={battleState.currentActorId === enemy.id}
                targetable={isCardTargetable(enemy)}
                presentation={presentation}
                speechBubble={speechBubbles[enemy.id]}
                onClick={() => handleActorCardClick(enemy)}
              />
            ))}
          </div>
          {leaderEnemy && (
            <div className="relative z-20 translate-y-1">
              <ActorCard
                actor={leaderEnemy}
                side="ENEMY"
                role="MAIN"
                isCurrent={battleState.currentActorId === leaderEnemy.id}
                targetable={isCardTargetable(leaderEnemy)}
                presentation={presentation}
                speechBubble={speechBubbles[leaderEnemy.id]}
                onClick={() => handleActorCardClick(leaderEnemy)}
              />
              <div className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-rose-700/70 bg-rose-950 p-1 text-rose-300 shadow-lg">
                <Crown className="h-3 w-3" />
              </div>
            </div>
          )}
        </section>

        {/* 아군 진영 */}
        <section className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col items-center justify-between px-2 pb-2 pt-2 sm:px-5 sm:pb-3">
          <div className="relative z-20 -translate-y-1">
            <ActorCard
              actor={battleState.player}
              side="ALLY"
              role="MAIN"
              isCurrent={battleState.currentActorId === battleState.player.id}
              targetable={isCardTargetable(battleState.player)}
              presentation={presentation}
              speechBubble={speechBubbles[battleState.player.id]}
              onClick={() => handleActorCardClick(battleState.player)}
            />
          </div>
          <div className="flex min-h-[82px] w-full items-end justify-center gap-2 sm:gap-3">
            {battleState.companions.slice(0, 4).map((companion) => (
              <ActorCard
                key={companion.id}
                actor={companion}
                side="ALLY"
                role="SUPPORT"
                isCurrent={battleState.currentActorId === companion.id}
                targetable={isCardTargetable(companion)}
                presentation={presentation}
                speechBubble={speechBubbles[companion.id]}
                onClick={() => handleActorCardClick(companion)}
              />
            ))}
          </div>
        </section>

        {/* 전장 보조 버튼 */}
        <div className="absolute left-2 top-2 z-30 flex gap-1">
          <button onClick={() => setShowBattleLog((value) => !value)} className="rounded-lg border border-stone-700 bg-stone-950/90 p-2 text-stone-400 hover:text-stone-100" title="전투 로그">
            <ScrollText className="h-3.5 w-3.5" />
          </button>
          <div className="rounded-lg border border-stone-800 bg-stone-950/80 px-2 py-1 text-[8px] text-stone-500">
            {battleState.battlefield.description}
          </div>
        </div>

        {/* 대상 선택 안내 */}
        <AnimatePresence>
          {(selectedSkill || selectedItemKey) && isManualTurn && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500/70 bg-stone-950/95 px-3 py-1.5 text-[10px] font-black text-amber-200 shadow-2xl"
            >
              강조된 카드를 선택해 대상을 확정
            </motion.div>
          )}
        </AnimatePresence>

        {/* 전투 로그 패널 */}
        <AnimatePresence>
          {showBattleLog && (
            <motion.aside
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              className="absolute bottom-2 left-2 top-11 z-50 w-[min(340px,86vw)] overflow-hidden rounded-xl border border-stone-700 bg-stone-950/97 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 px-3 py-2">
                <div className="text-xs font-black">전투 로그</div>
                <button onClick={() => setShowBattleLog(false)} className="p-1 text-stone-500 hover:text-stone-200"><X className="h-4 w-4" /></button>
              </div>
              <div className="no-scrollbar h-full overflow-y-auto px-3 pb-12 pt-2">
                {battleState.battleLog.slice().reverse().map((log) => (
                  <div key={log.id} className="border-b border-stone-900 py-2">
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-[8px] text-stone-500">
                      <span>{log.actorName}</span><span>#{log.turn}</span>
                    </div>
                    <div className="text-[10px] leading-relaxed text-stone-300">{log.text}</div>
                    {log.badge && <span className="mt-1 inline-block rounded bg-stone-800 px-1.5 py-0.5 text-[8px] text-stone-300">{log.badge.text}</span>}
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 카드 상세 패널 */}
        <AnimatePresence>
          {inspectedActor && (
            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="absolute bottom-2 right-2 top-2 z-[55] w-[min(390px,92vw)] overflow-hidden rounded-2xl border border-stone-700 bg-stone-950/98 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-800 px-3 py-2.5">
                <div>
                  <div className="text-sm font-black text-stone-100">{inspectedActor.name}</div>
                  <div className="text-[9px] text-stone-500">레벨 {inspectedActor.level} · 속도 {Math.round(inspectedActor.stats.actionSpeed)} · 전투 자원 {Math.round(inspectedActor.cost)}/{Math.round(inspectedActor.maxCost)}</div>
                </div>
                <button onClick={() => setInspectedActorId(null)} className="p-1.5 text-stone-500 hover:text-stone-200"><X className="h-4 w-4" /></button>
              </div>

              <div className="no-scrollbar h-full overflow-y-auto px-3 pb-16 pt-3">
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">HP</span><div className="font-black text-rose-300">{Math.round(inspectedActor.hp)} / {Math.round(inspectedActor.maxHp)}</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">행동 속도</span><div className="font-black text-sky-300">{Math.round(inspectedActor.stats.actionSpeed)}</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">물리 공격</span><div className="font-black">{Math.round(inspectedActor.stats.physicalAttack)}</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">마법 공격</span><div className="font-black">{Math.round(inspectedActor.stats.magicAttack)}</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">명중</span><div className="font-black text-emerald-300">{Math.round(inspectedActor.stats.accuracy)}</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">회피</span><div className="font-black text-violet-300">{Math.round(inspectedActor.stats.evasion)}</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">치명타</span><div className="font-black text-amber-300">{Math.round(inspectedActor.stats.criticalChance)}%</div></div>
                  <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2"><span className="text-stone-500">치명타 피해</span><div className="font-black text-amber-300">×{Number(inspectedActor.stats.criticalDamage).toFixed(2)}</div></div>
                </div>

                {inspectedActor.statusEffects.length > 0 && (
                  <section className="mt-3">
                    <h3 className="mb-1.5 text-[10px] font-black tracking-wide text-stone-400">현재 효과</h3>
                    <div className="flex flex-wrap gap-1">
                      {inspectedActor.statusEffects.map((effect) => (
                        <span key={effect.id} className={`rounded border px-2 py-1 text-[8px] ${getStatusColor(effect)}`} title={`${effect.duration}회 행동 지속`}>
                          {effect.name} · {effect.duration}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-3">
                  <h3 className="mb-1.5 text-[10px] font-black tracking-wide text-stone-400">스킬 목록</h3>
                  <div className="space-y-1.5">
                    {inspectedActor.skills.map((skillId) => {
                      const skill = getSkillDefinition(skillId);
                      if (!skill) return null;
                      const usability = getSkillUsability(inspectedActor, skill.id);
                      return (
                        <div key={skill.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-stone-200">{skill.name}</span>
                            <span className="text-[8px] text-sky-300">자원 {usability.cost} · 재사용 {inspectedActor.skillCooldowns[skill.id] || 0}</span>
                          </div>
                          <div className="mt-1 text-[8px] leading-relaxed text-stone-500">{skill.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="mt-3">
                  <h3 className="mb-1.5 text-[10px] font-black tracking-wide text-stone-400">패시브 / 특성 효과</h3>
                  {inspectedActor.traits.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {inspectedActor.traits.map((trait) => <span key={trait} className="rounded border border-stone-800 bg-stone-900 px-2 py-1 text-[8px] text-stone-400">{trait}</span>)}
                    </div>
                  ) : <div className="text-[8px] text-stone-600">표시할 특성 효과 없음</div>}
                </section>

                {inspectedActor.equipmentSummary && inspectedActor.equipmentSummary.length > 0 && (
                  <section className="mt-3">
                    <h3 className="mb-1.5 text-[10px] font-black tracking-wide text-stone-400">장비 효과</h3>
                    <div className="space-y-1">
                      {inspectedActor.equipmentSummary.map((item) => (
                        <div key={`${item.slot}_${item.equipmentId}`} className="rounded-lg border border-stone-800 bg-stone-900/50 px-2 py-1.5">
                          <div className="text-[9px] font-bold text-stone-300">{item.name} {typeof item.enhancementLevel === 'number' && item.enhancementLevel > 0 && <span className="text-amber-400">+{item.enhancementLevel}</span>} <span className="text-[7px] text-stone-600">{item.slot}</span></div>
                          {item.runewords && item.runewords.length > 0 && <div className="mt-0.5 flex flex-wrap gap-1">{item.runewords.map((r) => <span key={`${item.equipmentId}_${r.milestone}`} className="rounded border border-indigo-900/60 bg-indigo-950/30 px-1 py-0.5 text-[7px] text-indigo-300">{r.runeword} Lv.{r.runeLevel}</span>)}</div>}
                          {item.description && <div className="mt-0.5 line-clamp-2 text-[8px] text-stone-500">{item.description}</div>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {inspectedActor.isCompanion && (
                  <section className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-black text-emerald-200">동료 조작</div>
                        <div className="text-[8px] text-stone-500">AI와 수동 조작을 언제든 전환</div>
                      </div>
                      <button
                        onClick={() => updateCompanionManual(inspectedActor, !inspectedActor.manualControl)}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-black ${inspectedActor.manualControl ? 'border-sky-500/70 bg-sky-950 text-sky-200' : 'border-stone-700 bg-stone-900 text-stone-400'}`}
                      >
                        {inspectedActor.manualControl ? <Gamepad2 className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        {inspectedActor.manualControl ? '수동 ON' : 'AI ON'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {TACTIC_OPTIONS.map((option) => {
                        const companionData = playerState.companions.find((companion) => companion.id === inspectedActor.id);
                        const selected = companionData?.combatTactic === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => updateCompanionTactic(inspectedActor, option.value)}
                            className={`rounded-lg border p-1.5 text-left ${selected ? 'border-emerald-500/70 bg-emerald-950/45' : 'border-stone-800 bg-stone-900/60'}`}
                            title={option.description}
                          >
                            <div className={`text-[9px] font-black ${selected ? 'text-emerald-200' : 'text-stone-400'}`}>{option.label}</div>
                            <div className="mt-0.5 line-clamp-2 text-[7px] text-stone-600">{option.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* 하단 명령 도크 */}
      <footer className="shrink-0 border-t border-stone-800 bg-stone-950/98 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${isManualTurn ? 'border-sky-700 bg-sky-950/50 text-sky-300' : 'border-stone-800 bg-stone-900 text-stone-500'}`}>
                {isManualTurn ? <Gamepad2 className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[10px] font-black text-stone-200">
                  {currentActor ? `${currentActor.name}의 행동` : '전투 처리 중'}
                </div>
                <div className="text-[8px] text-stone-500">
                  {currentActor ? `속도 ${Math.round(currentActor.stats.actionSpeed)} · 전투 자원 ${Math.round(currentActor.cost)}/${Math.round(currentActor.maxCost)} (+${Math.round(currentActor.costRegen)}/행동)` : '다음 행동자를 계산하고 있습니다.'}
                </div>
              </div>
            </div>
            {(commandCategory || selectedSkillId || selectedItemKey) && isManualTurn && (
              <button onClick={resetCommand} disabled={isProcessing} className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-900 px-2 py-1 text-[9px] font-bold text-stone-400 hover:text-stone-100">
                <ChevronLeft className="h-3 w-3" /> 뒤로
              </button>
            )}
          </div>

          {!isManualTurn ? (
            <div className="flex h-[70px] items-center justify-center rounded-xl border border-stone-800 bg-stone-900/45 text-center">
              <div>
                <Activity className="mx-auto mb-1 h-4 w-4 animate-pulse text-sky-400" />
                <div className="text-[10px] font-bold text-stone-400">{isProcessing ? '행동 연출 및 판정 중' : 'AI 행동 대기'}</div>
              </div>
            </div>
          ) : commandCategory === null ? (
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button onClick={() => setCommandCategory('ATTACK')} disabled={isProcessing} className="touch-target flex min-h-[64px] flex-col items-center justify-center rounded-xl border border-rose-900/70 bg-rose-950/35 text-rose-200 transition hover:bg-rose-900/45 disabled:opacity-50">
                <Swords className="mb-1 h-5 w-5" /><span className="text-[10px] font-black">공격</span>
              </button>
              <button onClick={() => setCommandCategory('DEFENSE')} disabled={isProcessing} className="touch-target flex min-h-[64px] flex-col items-center justify-center rounded-xl border border-sky-900/70 bg-sky-950/35 text-sky-200 transition hover:bg-sky-900/45 disabled:opacity-50">
                <Shield className="mb-1 h-5 w-5" /><span className="text-[10px] font-black">방어</span>
              </button>
              <button onClick={() => setCommandCategory('ITEM')} disabled={isProcessing} className="touch-target flex min-h-[64px] flex-col items-center justify-center rounded-xl border border-emerald-900/70 bg-emerald-950/30 text-emerald-200 transition hover:bg-emerald-900/40 disabled:opacity-50">
                <Package className="mb-1 h-5 w-5" /><span className="text-[10px] font-black">아이템</span>
              </button>
              <button onClick={() => void executeEscape()} disabled={isProcessing || !battleState.canEscape} className="touch-target flex min-h-[64px] flex-col items-center justify-center rounded-xl border border-stone-700 bg-stone-900 text-stone-300 transition hover:bg-stone-800 disabled:opacity-35">
                <Footprints className="mb-1 h-5 w-5" /><span className="text-[10px] font-black">도주</span>
              </button>
            </div>
          ) : commandCategory === 'ITEM' ? (
            <div className="no-scrollbar flex min-h-[86px] gap-2 overflow-x-auto pb-1">
              {itemEntries.length > 0 ? itemEntries.map((entry) => (
                <button
                  key={`${entry.itemKey}_${entry.name}`}
                  onClick={() => chooseItem(entry)}
                  onMouseEnter={() => setHoverItemKey(entry.itemKey)}
                  onMouseLeave={() => setHoverItemKey(null)}
                  disabled={isProcessing}
                  className={`min-w-[210px] max-w-[240px] shrink-0 rounded-xl border p-2.5 text-left ${selectedItemKey === entry.itemKey ? 'border-emerald-400 bg-emerald-950/35 ring-1 ring-emerald-400/20' : 'border-stone-700 bg-stone-900 hover:bg-stone-800/90'}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2"><span className="text-xs font-black">{entry.name}</span><span className="text-[9px] font-black text-emerald-300">×{entry.inventoryItem.quantity}</span></div>
                  <div className="mb-1 text-[9px] font-bold text-sky-300">{entry.effectText}</div>
                  <div className="mb-1 text-[8px] text-amber-300/80">Action Delay ×0.90</div>
                  <div className="line-clamp-2 text-[8px] leading-relaxed text-stone-500">{entry.description}</div>
                </button>
              )) : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-stone-800 bg-stone-900/40 text-[10px] text-stone-600">전투 중 사용할 수 있는 소비 아이템이 없습니다.</div>
              )}
            </div>
          ) : (
            <div className="no-scrollbar flex min-h-[94px] gap-2 overflow-x-auto pb-1">
              {(commandCategory === 'ATTACK' ? attackSkills : defenseSkills).length > 0
                ? (commandCategory === 'ATTACK' ? attackSkills : defenseSkills).map(renderSkillButton)
                : <div className="flex flex-1 items-center justify-center rounded-xl border border-stone-800 bg-stone-900/40 text-[10px] text-stone-600">이 카테고리에 장착된 스킬이 없습니다.</div>}
            </div>
          )}
        </div>
      </footer>

      {/* 처리 중 표시 */}
      <AnimatePresence>
        {isProcessing && presentation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute left-1/2 top-[74px] z-[80] -translate-x-1/2 rounded-full border border-stone-700 bg-stone-950/90 px-3 py-1 text-[9px] font-black text-stone-300 shadow-xl">
            {presentation.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
