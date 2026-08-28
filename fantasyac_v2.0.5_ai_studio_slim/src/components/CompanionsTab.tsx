import React, { useState } from 'react';
import { CompanionData, CompanionTactic, PlayerState, getKoreanLabel } from '../types';
import { Users, Heart, Swords, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { CAMP_FACILITIES_DATABASE } from '../data/camp/campData';

interface CompanionsTabProps {
  playerState: PlayerState;
  onSetCompanionTactic: (companionId: string, tactic: CompanionTactic) => void;
  onToggleActiveParty: (companionId: string) => void;
}

const TACTIC_LABELS: Record<CompanionTactic, { name: string; desc: string; icon: string }> = {
  BALANCED: { name: '균형 전술', desc: '상황에 맞춰 공격과 방어를 유연하게 전환합니다.', icon: '⚖️' },
  AGGRESSIVE: { name: '공격 집중', desc: '고위력 스킬과 공격으로 적을 빠르게 섬멸합니다.', icon: '⚔️' },
  DEFENSIVE: { name: '방어 & 경호', desc: '방어 태세를 우선시하며 주인공을 경호합니다.', icon: '🛡️' },
  SUPPORT_PRIORITY: { name: '지원 우선', desc: '버프와 아군 강화 스킬을 우선 사용합니다.', icon: '✨' },
  HEAL_PRIORITY: { name: '치유 우선', desc: '체력이 낮은 파티원을 최우선으로 치료합니다.', icon: '💚' },
  STATUS_PRIORITY: { name: '상태이상 부여', desc: '적에게 출혈, 기절, 실명 등 디버프를 겁니다.', icon: '🧪' },
  RESOURCE_SAVING: { name: '자원 절약', desc: '전투 자원을 아끼며 기본 공격과 저비용 행동을 우선합니다.', icon: '💠' },
};

const getNeedStageLabel = (value: number): string => {
  if (value >= 100) return '한계';
  if (value >= 70) return '매우 높음';
  if (value >= 50) return '높음';
  if (value >= 30) return '신경 쓰임';
  return '안정';
};

export const CompanionsTab: React.FC<CompanionsTabProps> = ({
  playerState,
  onSetCompanionTactic,
  onToggleActiveParty,
}) => {
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(
    playerState.companions[0]?.id || ''
  );

  const selectedCompanion: CompanionData | undefined = playerState.companions.find(
    (c) => c.id === selectedCompanionId
  );

  const activePartyCount = playerState.companions.filter((c) => c.isActivePartyMember).length;
  const activePartyFull = activePartyCount >= 4;

  if (playerState.companions.length === 0) {
    return (
      <div id="companions-tab-empty" className="p-8 text-center bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-xl space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500">
          <Users className="w-6 h-6 text-zinc-400" />
        </div>
        <h3 className="text-base font-bold text-zinc-200">현재 동행 중인 동료가 없습니다</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          판타지악 대륙을 모험하며 만나는 인물들과 대화하고 상호작용하여 유대(신뢰도)를 쌓으면, 아군으로 영입하여 전투에 참전시키거나 야영지에 배치할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div id="companions-tab-root" className="p-4 text-zinc-200 flex flex-col md:flex-row gap-4">
      {/* 1. 좌측: 동료 카드 목록 */}
      <div className="w-full md:w-72 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-xl space-y-3">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" /> 동행자 목록
          </span>
          <span className="text-xs text-zinc-500 font-normal">{playerState.companions.length}명</span>
        </div>

        {playerState.companions.map((comp) => {
          const isSelected = selectedCompanionId === comp.id;

          return (
            <div
              key={comp.id}
              id={`companion-card-${comp.id}`}
              onClick={() => setSelectedCompanionId(comp.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-950/40'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-200">
                    {comp.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-100">{comp.name}</div>
                    <div className="text-[11px] text-zinc-400">
                      레벨 {comp.level} {getKoreanLabel(comp.combatClass || 'NONE', '모험가')}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    comp.isActivePartyMember
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {comp.isActivePartyMember ? '전투 참전 중' : '대기'}
                </span>
              </div>

              {/* 유대 및 HP 요약 바 */}
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>체력 {comp.hp}/{comp.maxHp}</span>
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <Heart className="w-3 h-3 fill-rose-500/40 text-rose-500" /> 신뢰도 {comp.bond.trust}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${Math.min(100, (comp.hp / comp.maxHp) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. 우측: 선택된 동료 상세 패널 */}
      {selectedCompanion ? (
        <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
          {/* 상단 프로필 헤더 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-zinc-100">{selectedCompanion.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                  레벨 {selectedCompanion.level} • {getKoreanLabel(selectedCompanion.race, selectedCompanion.race)} • {selectedCompanion.gender}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-bold">
                  {getKoreanLabel(selectedCompanion.combatClass || 'NONE', '무직')}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{selectedCompanion.appearance}</p>
            </div>

            {/* 참전 토글 버튼 */}
            <button
              id={`toggle-party-${selectedCompanion.id}`}
              onClick={() => onToggleActiveParty(selectedCompanion.id)}
              disabled={!selectedCompanion.isActivePartyMember && activePartyFull}
              title={!selectedCompanion.isActivePartyMember && activePartyFull ? '전투 파티에는 동료를 최대 4명까지 편성할 수 있습니다.' : undefined}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow ${
                selectedCompanion.isActivePartyMember
                  ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50'
                  : activePartyFull
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950'
              }`}
            >
              {selectedCompanion.isActivePartyMember ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> 파티 참전 해제
                </>
              ) : activePartyFull ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> 전투 파티 최대 4명
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> 전투 파티원으로 편성
                </>
              )}
            </button>
          </div>

          {/* 유대 및 신뢰도 정보 */}
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
              <div>
                <span className="font-bold text-zinc-200">유대 등급 {selectedCompanion.bond.bondLevel}</span>
                <span className="text-zinc-400 ml-2">(신뢰도: {selectedCompanion.bond.trust} / 100)</span>
              </div>
            </div>
            {selectedCompanion.assignedFacilityId && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300">
                🛠️ 배치된 야영 시설: {CAMP_FACILITIES_DATABASE[selectedCompanion.assignedFacilityId]?.name || '야영 시설'}
              </span>
            )}
          </div>

          {/* 동료 생리/욕구 상태 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">성욕</span>
                <span className="text-zinc-400">{Math.round(selectedCompanion.needs?.desire || 0)} / 100 · {getNeedStageLabel(selectedCompanion.needs?.desire || 0)}</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, Math.max(0, selectedCompanion.needs?.desire || 0))}%` }} />
              </div>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">배설 욕구(소변)</span>
                <span className="text-zinc-400">{Math.round(selectedCompanion.needs?.urinationUrge || 0)} / 100 · {getNeedStageLabel(selectedCompanion.needs?.urinationUrge || 0)}</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, Math.max(0, selectedCompanion.needs?.urinationUrge || 0))}%` }} />
              </div>
            </div>
          </div>

          {/* 전투 전술 설정 */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" /> 전투 행동 전술 설정
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(Object.keys(TACTIC_LABELS) as CompanionTactic[]).map((tacticKey) => {
                const tacticDef = TACTIC_LABELS[tacticKey];
                const isActive = selectedCompanion.combatTactic === tacticKey;

                return (
                  <div
                    key={tacticKey}
                    id={`tactic-btn-${tacticKey}`}
                    onClick={() => onSetCompanionTactic(selectedCompanion.id, tacticKey)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-950/40 text-zinc-100 shadow'
                        : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <span>{tacticDef.icon}</span> {tacticDef.name}
                      </span>
                      {isActive && <span className="text-[10px] text-amber-400 font-bold">활성</span>}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{tacticDef.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 최근 대화 및 관심사 */}
          {selectedCompanion.recentConversationTopics && selectedCompanion.recentConversationTopics.length > 0 && (
            <div className="mt-2 p-3 bg-zinc-950/40 rounded-lg border border-zinc-800 text-xs">
              <span className="font-semibold text-zinc-400 flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> 최근 동료와의 관심 화제:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedCompanion.recentConversationTopics.map((topic, i) => (
                  <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px]">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          동료를 선택해 주세요.
        </div>
      )}
    </div>
  );
};
