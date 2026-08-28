import React, { useState } from 'react';
import { AdaptiveCharacterImage } from './AdaptiveCharacterImage';
import {
  X,
  Shield,
  Heart,
  Brain,
  Zap,
  Coins,
  Sparkles,
  Award,
  Tag,
  Flame,
  Gauge,
  LockKeyhole,
  Stamp,
  UserRound,
  Dna,
  MessageSquare,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Feather,
  Clock,
  FlaskConical,
  Link2,
} from 'lucide-react';
import { PlayerState, getKoreanLabel } from '../types';
import { getRequiredExp, formatGameTime } from '../gameEngine';
import { getRaceDefinition, PASSIVE_DEFINITIONS } from '../data/raceData';
import { COMBAT_CLASSES } from '../data/classes';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onOpenStats: () => void;
}

export function StatusModal({ isOpen, onClose, playerState, onOpenStats }: StatusModalProps) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  const nextExp = getRequiredExp(playerState.level);
  const raceDef = getRaceDefinition(playerState.race || 'HUMAN', playerState.beastkinType);

  // Resource percentages for progress bars
  const hpPercent = Math.min(100, Math.max(0, Math.round((playerState.hp / Math.max(1, playerState.maxHp)) * 100)));
  const mpPercent = Math.min(100, Math.max(0, Math.round((playerState.mana / Math.max(1, playerState.maxMana)) * 100)));
  const sanityPercent = Math.min(100, Math.max(0, Math.round((playerState.sanity / Math.max(1, playerState.maxSanity)) * 100)));
  const expPercent = Math.min(100, Math.max(0, Math.round((playerState.experience / Math.max(1, nextExp)) * 100)));

  // Class Name Resolver
  const combatClassDef = playerState.combatClass ? COMBAT_CLASSES[playerState.combatClass] : null;
  const displayClassName =
    playerState.classEvolutionName ||
    (combatClassDef ? combatClassDef.name : getKoreanLabel(playerState.combatClass || '', '미정'));

  // Build type label
  const buildLabel =
    playerState.profile?.build === 'SMALL'
      ? '소형 체격'
      : playerState.profile?.build === 'LARGE'
      ? '대형 체격'
      : '표준 체격';

  const hasValidPortrait = Boolean(playerState.profile?.portraitUrl && !imageError);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-xs animate-ui-pop-in">
      <div className="w-full max-w-3xl lg:max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-100 tracking-wide">캐릭터 정보</h2>
              <p className="text-[11px] text-stone-400">
                {playerState.characterName || '모험가'} · Lv.{playerState.level} {displayClassName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              id="status-modal-game-time"
              className="flex items-center gap-1 px-2 py-0.5 bg-stone-900 border border-stone-800 rounded-md text-amber-300 font-mono text-[10px] font-medium select-none"
              title="현재 게임 시간"
            >
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{formatGameTime(playerState)}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              title="닫기"
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 active:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs custom-scrollbar">
          {/* Top Overview: Portrait & Core Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* Left: Character Portrait Panel */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center">
              <AdaptiveCharacterImage
                src={hasValidPortrait ? playerState.profile?.portraitUrl : undefined}
                alt={playerState.characterName || '캐릭터 초상화'}
                onError={() => setImageError(true)}
                maxHeight="max-h-[380px]"
                containerClassName="shadow-lg max-w-[260px] md:max-w-none"
                fallbackIcon={
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 shadow-inner">
                      <UserRound className="w-8 h-8 text-stone-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-stone-300">
                        {playerState.characterName || '모험가'}
                      </p>
                      <p className="text-[11px] text-stone-500">등록된 캐릭터 이미지 없음</p>
                    </div>
                  </div>
                }
              >
                {hasValidPortrait && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] z-10">
                      <span className="px-2 py-0.5 rounded-md bg-stone-900/90 border border-stone-700/80 text-stone-200 font-medium backdrop-blur-xs">
                        {raceDef.subName || raceDef.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold backdrop-blur-xs">
                        Lv.{playerState.level}
                      </span>
                    </div>
                  </>
                )}
              </AdaptiveCharacterImage>
            </div>

            {/* Right: Character Info & Core Resources */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-4">
              {/* Identity Details */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-stone-950/80 border border-stone-800/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-stone-100 tracking-wide">
                      {playerState.characterName || '모험가'}
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {raceDef.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
                      Lv.{playerState.level}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-stone-900 border border-stone-700/80 text-stone-200 text-[11px]">
                      {raceDef.subName || raceDef.name}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium text-[11px]">
                      {displayClassName}
                    </span>
                  </div>
                </div>

                {/* Physical Specifications Matrix */}
                {playerState.profile && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800/80 text-[11px]">
                    <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                      <span className="text-stone-500 block text-[10px]">성별 / 외형 연령</span>
                      <span className="text-stone-200 font-medium">
                        {playerState.profile.gender || '미정'} ({playerState.profile.physicalAge ?? '?'}세)
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                      <span className="text-stone-500 block text-[10px]">신장 / 체격</span>
                      <span className="text-stone-200 font-medium">
                        {playerState.profile.height ?? 170}cm ({buildLabel})
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                      <span className="text-stone-500 block text-[10px]">헤어 스타일</span>
                      <span className="text-stone-200 font-medium truncate block">
                        {playerState.profile.hairColor || '기본'} · {playerState.profile.hairStyle || '단정한'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800/60">
                      <span className="text-stone-500 block text-[10px]">눈동자</span>
                      <span className="text-stone-200 font-medium">
                        {playerState.profile.eyeColor || '갈색'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {playerState.race === 'DRAGONKIN' && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/20 border border-amber-400/30 space-y-2">
                  <div className="flex items-center justify-between"><b className="text-amber-200">용족 전용 상태</b><span className="text-[10px] text-amber-300">수호신의 혈통</span></div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-stone-950/60"><span className="text-stone-500 block">전용 전직</span><b className="text-stone-100">{playerState.classEvolutionName || '용왕'}</b></div>
                    <div className="p-2 rounded-lg bg-stone-950/60"><span className="text-stone-500 block">사냥 위협도</span><b className="text-rose-300">{Math.round(playerState.dragonkinState?.hunterThreat ?? 10)} / 100</b></div>
                    <div className="p-2 rounded-lg bg-stone-950/60"><span className="text-stone-500 block">전용 조우 누적</span><b className="text-stone-100">{playerState.dragonkinState?.hunterEncounterCount ?? 0}회</b></div>
                    <div className="p-2 rounded-lg bg-stone-950/60"><span className="text-stone-500 block">사회적 인식</span><b className="text-amber-200">고귀한 영물 · 수호신</b></div>
                    <div className="p-2 rounded-lg bg-stone-950/60 col-span-2"><span className="text-stone-500 block">고유 비행</span><b className="text-sky-200">천룡비행 · 하늘/천공 직접 비행</b></div>
                  </div>
                </div>
              )}

              {/* RPG Resource Gauges */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-stone-950/80 border border-stone-800/90 space-y-3">
                <div className="flex items-center justify-between text-stone-300 font-semibold text-xs border-b border-stone-800/60 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    주요 자원 및 성장도
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">STATUS METRICS</span>
                </div>

                <div className="space-y-2.5">
                  {/* HP Gauge */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <Heart className="w-3.5 h-3.5 fill-rose-500/30" /> 체력 (HP)
                      </span>
                      <span className="font-mono text-stone-200">
                        <span className="font-bold text-rose-300">{playerState.hp}</span> / {playerState.maxHp}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800/90">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300 rounded-full"
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* MP Gauge */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                        <Zap className="w-3.5 h-3.5 fill-sky-500/30" /> 마나 (MP)
                      </span>
                      <span className="font-mono text-stone-200">
                        <span className="font-bold text-sky-300">{playerState.mana}</span> / {playerState.maxMana}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800/90">
                      <div
                        className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300 rounded-full"
                        style={{ width: `${mpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Sanity Gauge */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                        <Brain className="w-3.5 h-3.5" /> 정신력 (Sanity)
                      </span>
                      <span className="font-mono text-stone-200">
                        <span className="font-bold text-purple-300">{playerState.sanity}</span> / {playerState.maxSanity}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800/90">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 rounded-full"
                        style={{ width: `${sanityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* EXP Gauge */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <Award className="w-3.5 h-3.5" /> 경험치 (EXP)
                      </span>
                      <span className="font-mono text-stone-300">
                        {playerState.experience} / {nextExp} ({expPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800/90">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 rounded-full"
                        style={{ width: `${expPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency & Stat Points Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">소지금</span>
                      <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                        {playerState.rupees.toLocaleString()} 루피
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">스탯 포인트</span>
                      <span className="font-mono font-bold text-stone-200 text-xs sm:text-sm">
                        {playerState.statPoints} P
                      </span>
                    </div>
                  </div>
                  {playerState.statPoints > 0 && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenStats();
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer"
                    >
                      분배
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Section: Speech & Dialogue Style */}
            {playerState.profile?.speechStyle && (
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-800/60 pb-1.5">
                  <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    화법 및 성향
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {playerState.profile.speechStyle.tone || '자연스러움'} · {playerState.profile.speechStyle.politeness || '상황 적응'}
                  </span>
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  {playerState.profile.speechStyle.description}
                </p>
                {playerState.profile.speechStyle.quirks && playerState.profile.speechStyle.quirks.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {playerState.profile.speechStyle.quirks.map((q, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400">
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section: Appearance & Beast Features */}
            {playerState.profile && (
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-800/60 pb-1.5">
                  <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    신체 특징 및 외모
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {playerState.profile.features && (
                    <div>
                      <span className="text-stone-500">특징: </span>
                      <span className="text-stone-300">{playerState.profile.features}</span>
                    </div>
                  )}
                  {playerState.profile.skinDescription && (
                    <div>
                      <span className="text-stone-500">피부: </span>
                      <span className="text-stone-300">{playerState.profile.skinDescription}</span>
                    </div>
                  )}
                  {playerState.profile.beastFeatures && (
                    <div className="pt-1 text-amber-300/90">
                      <span className="text-stone-500 block text-[10px]">수인 고유 특성</span>
                      {playerState.race === 'BEASTKIN' && playerState.beastkinType === 'BIRD' ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Feather className="w-3 h-3 text-amber-400" />
                          <span>
                            날개 {playerState.profile.beastFeatures.hasWings ? '보유' : '없음'} · 깃털 {playerState.profile.beastFeatures.furDescription || '보통'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] space-y-0.5">
                          <div>
                            귀: [{playerState.profile.beastFeatures.earColor || ''} {playerState.profile.beastFeatures.earDescription || ''}]
                          </div>
                          <div>
                            꼬리: [{playerState.profile.beastFeatures.tailColor || ''} {playerState.profile.beastFeatures.tailDescription || ''}]
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section: Special Status & Corruption */}
            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-800/60 pb-1.5">
                <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  특수 상태
                </span>
                <span className="text-[9px] text-stone-500 font-mono">
                  LOG {playerState.dialogueCount ?? 0}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">타락도 (Corruption)</span>
                  <span className="font-mono font-bold text-rose-300">
                    {playerState.corruptionStatus?.effectiveCorruption ?? playerState.corruptionStatus?.corruption ?? 0} / 10
                    {(playerState.corruptionStatus?.effectiveCorruption ?? playerState.corruptionStatus?.corruption ?? 0) !== (playerState.corruptionStatus?.corruption ?? 0) && (
                      <span className="ml-1 text-[9px] text-stone-500 font-normal">기초 {playerState.corruptionStatus?.corruption ?? 0}</span>
                    )}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-rose-600 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (((playerState.corruptionStatus?.effectiveCorruption ?? playerState.corruptionStatus?.corruption ?? 0)) / 10) * 100)}%` }}
                  />
                </div>

                {playerState.adultStatus && (
                  <div className="space-y-2 pt-1 border-t border-stone-800/50">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">성욕</span>
                      <span className="font-mono text-pink-300">
                        {playerState.adultStatus.effectiveDesire ?? playerState.adultStatus.desire} / 100
                        {(playerState.adultStatus.effectiveDesire ?? playerState.adultStatus.desire) !== playerState.adultStatus.desire && (
                          <span className="ml-1 text-[9px] text-stone-500">기초 {playerState.adultStatus.desire}</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                      <div
                        className="h-full bg-pink-500 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, playerState.adultStatus.effectiveDesire ?? playerState.adultStatus.desire)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-stone-900/80 rounded-lg border border-stone-800 text-[10px]">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-pink-400" /> 음란도
                        </span>
                        <div className="font-mono text-pink-200 font-bold mt-0.5">
                          {playerState.adultStatus.lewdness} / 10
                        </div>
                      </div>

                      <div className="p-2 bg-stone-900/80 rounded-lg border border-stone-800 text-[10px]">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-violet-400" /> 감도
                        </span>
                        <div className="font-mono text-violet-200 font-bold mt-0.5">
                          {playerState.adultStatus.sensitivity} / 100
                        </div>
                      </div>

                      <div className="p-2 bg-stone-900/80 rounded-lg border border-stone-800 text-[10px]">
                        <span className="text-stone-500 flex items-center gap-1">
                          <FlaskConical className="w-3 h-3 text-fuchsia-400" /> 미약
                        </span>
                        <div className="font-mono text-fuchsia-200 font-bold mt-0.5">
                          {playerState.adultStatus.aphrodisiacLevel ?? 0} / 100
                        </div>
                      </div>

                      <div className="p-2 bg-stone-900/80 rounded-lg border border-stone-800 text-[10px]">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-amber-400" /> 중독
                        </span>
                        <div className="font-mono text-amber-200 font-bold mt-0.5">
                          {playerState.adultStatus.addiction ?? 0} / 100
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-stone-900/80 rounded-lg border border-stone-800 text-[10px]">
                    <div className="flex items-center gap-1 text-stone-400 font-medium">
                      <Stamp className="w-3 h-3 text-amber-400" /> 문신 ({playerState.tattoos?.length || 0})
                    </div>
                    {playerState.tattoos && playerState.tattoos.length > 0 ? (
                      <div className="space-y-0.5 mt-1">
                        {playerState.tattoos.slice(0, 2).map((tattoo) => (
                          <div key={tattoo.id} className="text-[9px] text-stone-300 truncate">
                            · {tattoo.name} ({tattoo.bodyPart})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] text-stone-500 mt-1">새겨진 문신 없음</div>
                    )}
                  </div>

                  <div className="p-2 bg-stone-900/80 rounded-lg border border-stone-800 text-[10px]">
                    <div className="flex items-center gap-1 text-stone-400 font-medium">
                      <LockKeyhole className="w-3 h-3 text-amber-400" /> 구속구 ({playerState.restraints?.length || 0})
                    </div>
                    {playerState.restraints && playerState.restraints.length > 0 ? (
                      <div className="space-y-0.5 mt-1">
                        {playerState.restraints.slice(0, 2).map((restraint) => (
                          <div key={restraint.id} className="text-[9px] text-stone-300 truncate">
                            · {restraint.name} ({restraint.bodyPart})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] text-stone-500 mt-1">장착된 구속구 없음</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Base Attributes (Stats Summary) */}
            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-800/60 pb-1.5">
                <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  기본 능력치 (스탯)
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenStats();
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5 font-medium cursor-pointer"
                >
                  스탯 상세
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800/80 flex flex-col items-center">
                  <span className="text-[10px] text-stone-500">근력</span>
                  <span className="font-mono font-bold text-stone-100 text-xs">{playerState.stats.strength}</span>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800/80 flex flex-col items-center">
                  <span className="text-[10px] text-stone-500">체력</span>
                  <span className="font-mono font-bold text-stone-100 text-xs">{playerState.stats.vitality}</span>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800/80 flex flex-col items-center">
                  <span className="text-[10px] text-stone-500">민첩</span>
                  <span className="font-mono font-bold text-stone-100 text-xs">{playerState.stats.agility}</span>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800/80 flex flex-col items-center">
                  <span className="text-[10px] text-stone-500">지능</span>
                  <span className="font-mono font-bold text-stone-100 text-xs">{playerState.stats.intelligence}</span>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800/80 flex flex-col items-center">
                  <span className="text-[10px] text-stone-500">정신</span>
                  <span className="font-mono font-bold text-stone-100 text-xs">{playerState.stats.spirit}</span>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800/80 flex flex-col items-center">
                  <span className="text-[10px] text-stone-500">행운</span>
                  <span className="font-mono font-bold text-stone-100 text-xs">{playerState.stats.luck}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Passives Section */}
          <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-800/60 pb-1.5">
              <span className="font-semibold text-stone-200 text-xs flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-amber-400" />
                보유 고유 패시브
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                {playerState.passives?.length || 0}개 활성
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {playerState.passives && playerState.passives.length > 0 ? (
                playerState.passives.map((pId) => {
                  const pDef = PASSIVE_DEFINITIONS[pId];
                  return (
                    <div
                      key={pId}
                      className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800/90 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px]">
                          {pDef ? pDef.name : getKoreanLabel(pId)}
                        </span>
                      </div>
                      {pDef && (
                        <p className="text-[10px] text-stone-400 leading-relaxed">
                          {pDef.effect}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-stone-500 italic col-span-2">보유한 패시브가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Story Flags Badge list */}
          {playerState.storyFlags && playerState.storyFlags.length > 0 && (
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <span className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" /> 활성화된 종족 및 스토리 플래그
              </span>
              <div className="flex flex-wrap gap-1.5">
                {playerState.storyFlags.map((flag) => (
                  <span
                    key={flag}
                    className="text-[9px] px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-300"
                  >
                    #{getKoreanLabel(flag)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-950/90 flex flex-wrap sm:flex-nowrap gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenStats();
            }}
            className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-stone-700/60"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            스탯 상세 보기
            {playerState.statPoints > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500 text-stone-950 text-[10px] font-extrabold">
                +{playerState.statPoints}P
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-stone-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}


