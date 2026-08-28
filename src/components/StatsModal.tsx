import { X, Plus, Sparkles, Heart, Brain, Zap, Dumbbell, Wind, Clover, Swords, Shield, Crosshair } from 'lucide-react';
import { PlayerState, PlayerStats } from '../types';
import { getRaceDefinition } from '../data/raceData';
import { calculateCombatStats, DEFAULT_LEVEL_GROWTH } from '../data/combatConfig';
import { getTalentNode } from '../data/talents';
import { getCombatClass } from '../data/classes';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onAllocateStat: (statKey: keyof PlayerStats) => void;
}

interface StatMeta {
  key: keyof PlayerStats;
  label: string;
  desc: string;
  effect: string;
  icon: any;
  color: string;
}

const STAT_CONFIGS: StatMeta[] = [
  {
    key: 'strength',
    label: '근력',
    desc: '물리 공격력 및 소지 한계',
    effect: '전투 시 물리 공격력 증가',
    icon: Dumbbell,
    color: 'text-orange-400',
  },
  {
    key: 'vitality',
    label: '체력',
    desc: '최대 체력 (HP)',
    effect: '+10 최대 체력',
    icon: Heart,
    color: 'text-rose-400',
  },
  {
    key: 'agility',
    label: '민첩',
    desc: '회피율, 행동 속도 및 은신',
    effect: '선공 및 회피 성공률 증가',
    icon: Wind,
    color: 'text-emerald-400',
  },
  {
    key: 'intelligence',
    label: '지능',
    desc: '최대 마나 (MP) 및 마법 지식',
    effect: '+5 최대 마나',
    icon: Zap,
    color: 'text-sky-400',
  },
  {
    key: 'spirit',
    label: '정신',
    desc: '최대 정신력 및 공포 저항',
    effect: '+10 최대 정신력',
    icon: Brain,
    color: 'text-purple-400',
  },
  {
    key: 'luck',
    label: '행운',
    desc: '치명타, 희귀 아이템 및 돌발 행운',
    effect: '돌발 행운 이벤트 및 보상 증가',
    icon: Clover,
    color: 'text-amber-400',
  },
];

export function StatsModal({ isOpen, onClose, playerState, onAllocateStat }: StatsModalProps) {
  if (!isOpen) return null;

  const raceDef = getRaceDefinition(playerState.race || 'HUMAN', playerState.beastkinType);

  // Compute derived combat statistics
  const talentBonuses: Record<string, number> = {};
  if (playerState.learnedTalents) {
    Object.entries(playerState.learnedTalents).forEach(([talentId, rank]) => {
      const node = getTalentNode(talentId);
      if (node && rank > 0 && node.statModifiers) {
        Object.entries(node.statModifiers).forEach(([statKey, val]) => {
          talentBonuses[statKey] = (talentBonuses[statKey] || 0) + val * rank;
        });
      }
    });
  }
  const classDef = getCombatClass(playerState.combatClass);
  if (classDef?.statGrowthModifiers) {
    Object.entries(classDef.statGrowthModifiers).forEach(([k, v]) => {
      talentBonuses[k] = (talentBonuses[k] || 0) + (v || 0);
    });
  }

  const combatStats = calculateCombatStats(
    playerState.stats,
    playerState.level,
    DEFAULT_LEVEL_GROWTH,
    talentBonuses as any
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-stone-100">스탯 분배 및 전투 능력치</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 active:bg-stone-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-3">
          {/* Stat Points Status Banner */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-950/80 border border-stone-800">
            <div>
              <span className="text-xs text-stone-300 block">남은 스탯 포인트</span>
              <span className="text-[10px] text-stone-500">종족: {raceDef.subName || raceDef.name}</span>
            </div>
            <span className={`text-sm font-bold px-2 py-0.5 rounded ${
              playerState.statPoints > 0
                ? 'bg-amber-500 text-stone-950 font-mono'
                : 'text-stone-400 font-mono'
            }`}>
              {playerState.statPoints} P
            </span>
          </div>

          {/* Stats List */}
          <div className="space-y-2">
            {STAT_CONFIGS.map((stat) => {
              const Icon = stat.icon;
              const currentValue = playerState.stats[stat.key];
              const baseValue = playerState.baseStats ? playerState.baseStats[stat.key] : currentValue;
              const raceMod = raceDef.statModifiers[stat.key] || 0;
              const canUpgrade = playerState.statPoints > 0;

              return (
                <div
                  key={stat.key}
                  className="flex items-center justify-between p-2.5 bg-stone-950/50 hover:bg-stone-950/80 border border-stone-800/80 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-stone-900 border border-stone-800 shrink-0 mt-0.5">
                      <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-200">{stat.label}</span>
                        {raceMod !== 0 && (
                          <span className={`text-[10px] font-mono ${raceMod > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ({raceMod > 0 ? `+${raceMod}` : raceMod} 종족)
                          </span>
                        )}
                        <span className="text-[10px] text-amber-400/90 font-mono">({stat.effect})</span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">{stat.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold font-mono text-stone-100 min-w-[20px] text-right">
                      {currentValue}
                    </span>

                    <button
                      id={`upgrade-stat-${stat.key}`}
                      onClick={() => onAllocateStat(stat.key)}
                      disabled={!canUpgrade}
                      className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      title={`${stat.label} 1 올리기 (기본 ${baseValue} -> ${baseValue + 1})`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 파생 전투 능력치 요약 카드 */}
          <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300 border-b border-stone-800/80 pb-1.5">
              <span className="flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 text-rose-400" /> 전투 능력치 상세
              </span>
              <span className="text-[10px] text-stone-500">Lv.{playerState.level} 기준</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex justify-between bg-stone-900/60 p-1.5 rounded border border-stone-800/60">
                <span className="text-stone-400 text-[11px]">물리 공격력</span>
                <span className="text-stone-200 font-bold">{combatStats.physicalAttack}</span>
              </div>
              <div className="flex justify-between bg-stone-900/60 p-1.5 rounded border border-stone-800/60">
                <span className="text-stone-400 text-[11px]">마법 공격력</span>
                <span className="text-sky-300 font-bold">{combatStats.magicAttack}</span>
              </div>
              <div className="flex justify-between bg-stone-900/60 p-1.5 rounded border border-stone-800/60">
                <span className="text-stone-400 text-[11px]">물리 방어력</span>
                <span className="text-stone-200 font-bold">{combatStats.physicalDefense}</span>
              </div>
              <div className="flex justify-between bg-stone-900/60 p-1.5 rounded border border-stone-800/60">
                <span className="text-stone-400 text-[11px]">마법 방어력</span>
                <span className="text-purple-300 font-bold">{combatStats.magicDefense}</span>
              </div>
              <div className="flex justify-between bg-stone-900/60 p-1.5 rounded border border-stone-800/60">
                <span className="text-stone-400 text-[11px]">명중 / 회피</span>
                <span className="text-emerald-300 font-bold">{combatStats.accuracy}% / {combatStats.evasion}%</span>
              </div>
              <div className="flex justify-between bg-stone-900/60 p-1.5 rounded border border-stone-800/60">
                <span className="text-stone-400 text-[11px]">치명타 / 배율</span>
                <span className="text-amber-300 font-bold">{combatStats.criticalChance}% ({combatStats.criticalDamage}x)</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 text-center pt-1 leading-relaxed">
            스탯을 올리면 능력치 및 최대 수치가 즉시 적용됩니다.<br />
            (스탯 감소는 불가합니다)
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-900/90">
          <button
            onClick={onClose}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
