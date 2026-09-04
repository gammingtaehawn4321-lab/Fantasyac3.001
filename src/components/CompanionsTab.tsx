import React, { useState } from 'react';
import { CompanionData, CompanionTactic, PetCareAction, PlayerState, getKoreanLabel } from '../types';
import { Users, Heart, Swords, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { CAMP_FACILITIES_DATABASE } from '../data/camp/campData';
import { getPetCommandRates, getPetFoodOptions, PET_CARE_LABELS } from '../data/pets/petProgression';
import { getPetSpeciesDefinition } from '../data/pets/petDatabase';
import { PET_GRADE_LABELS } from '../data/pets/petGrowth';

interface CompanionsTabProps {
  playerState: PlayerState;
  onSetCompanionTactic: (companionId: string, tactic: CompanionTactic) => void;
  onToggleActiveParty: (companionId: string) => void;
  onRespondPetRequest: (petId: string, response: 'ACCEPT' | 'REFUSE') => void;
  onPetCare: (petId: string, action: PetCareAction) => void;
  onFeedPet: (petId: string, itemId: string) => void;
  onUpgradePetMetabolism: (petId: string) => void;
  petInteractionLoading?: boolean;
  onSetEquippedPet: (petId: string | null) => void;
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
  onRespondPetRequest,
  onPetCare,
  onFeedPet,
  onUpgradePetMetabolism,
  petInteractionLoading = false,
  onSetEquippedPet,
}) => {
  const [activeKind, setActiveKind] = useState<'HUMANOID' | 'PET'>('HUMANOID');
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>(
    playerState.companions.find((c) => (c.kind || 'HUMANOID') === 'HUMANOID')?.id || playerState.companions[0]?.id || ''
  );

  const filteredCompanions = playerState.companions.filter((c) => (c.kind || 'HUMANOID') === activeKind);
  const selectedCompanion: CompanionData | undefined =
    filteredCompanions.find((c) => c.id === selectedCompanionId) || filteredCompanions[0];
  const selectedPetIsEquipped = Boolean(selectedCompanion?.kind === 'PET' && selectedCompanion.id === playerState.equippedPetId);

  const selectKind = (kind: 'HUMANOID' | 'PET') => {
    setActiveKind(kind);
    const first = playerState.companions.find((c) => (c.kind || 'HUMANOID') === kind);
    setSelectedCompanionId(first?.id || '');
  };

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
            <Users className="w-4 h-4 text-amber-400" /> 동반자
          </span>
          <span className="text-xs text-zinc-500 font-normal">{filteredCompanions.length}명</span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/70 rounded-lg border border-zinc-800">
          <button onClick={() => selectKind('HUMANOID')} className={`px-2 py-1.5 rounded text-xs font-bold ${activeKind === 'HUMANOID' ? 'bg-amber-700/40 text-amber-200' : 'text-zinc-500 hover:text-zinc-300'}`}>동료</button>
          <button onClick={() => selectKind('PET')} className={`px-2 py-1.5 rounded text-xs font-bold ${activeKind === 'PET' ? 'bg-emerald-800/50 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'}`}>펫</button>
        </div>

        {filteredCompanions.length === 0 && (
          <div className="p-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
            {activeKind === 'PET' ? '영입한 펫이 없습니다.' : '영입한 동료가 없습니다.'}
          </div>
        )}

        {filteredCompanions.map((comp) => {
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
                      레벨 {comp.level} {comp.kind === 'PET' ? '펫' : getKoreanLabel(comp.combatClass || 'NONE', '모험가')}
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
                    <Heart className="w-3 h-3 fill-rose-500/40 text-rose-500" /> {comp.kind === 'PET' ? `친밀도 ${Math.round(comp.petState?.relationship.familiarity || 0)}%` : `신뢰도 ${comp.bond.trust}%`}
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
                  {selectedCompanion.kind === 'PET' && selectedCompanion.petState
                    ? `레벨 ${selectedCompanion.level} • ${getPetSpeciesDefinition(selectedCompanion.petState.speciesId).displayName} • ${selectedCompanion.petState.category === 'INSECT' ? '곤충형' : '동물형'}`
                    : `레벨 ${selectedCompanion.level} • ${getKoreanLabel(selectedCompanion.race, selectedCompanion.race)} • ${selectedCompanion.gender}`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-bold">
                  {selectedCompanion.kind === 'PET' ? '펫' : getKoreanLabel(selectedCompanion.combatClass || 'NONE', '무직')}
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
                {selectedCompanion.kind === 'PET' ? (
                  <span className="text-zinc-400 ml-2">(친밀도 {Math.round(selectedCompanion.petState?.relationship.familiarity || 0)} / 충성도 {Math.round(selectedCompanion.petState?.relationship.loyalty || 0)} / 야생성 {Math.round(selectedCompanion.petState?.wildness || 0)})</span>
                ) : (
                  <span className="text-zinc-400 ml-2">(신뢰도 {selectedCompanion.bond.trust} / 호감도 {selectedCompanion.bond.affection})</span>
                )}
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
                <span className="text-zinc-400">{Math.round(selectedCompanion.kind === 'PET' ? (selectedCompanion.petState?.needs.desire || 0) : (selectedCompanion.needs?.desire || 0))} / 100 · {getNeedStageLabel(selectedCompanion.kind === 'PET' ? (selectedCompanion.petState?.needs.desire || 0) : (selectedCompanion.needs?.desire || 0))}</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, Math.max(0, selectedCompanion.kind === 'PET' ? (selectedCompanion.petState?.needs.desire || 0) : (selectedCompanion.needs?.desire || 0)))}%` }} />
              </div>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">{selectedCompanion.kind === 'PET' ? '배설 욕구' : '배설 욕구(소변)'}</span>
                <span className="text-zinc-400">{Math.round(selectedCompanion.kind === 'PET' ? (selectedCompanion.petState?.needs.bathroomUrge || 0) : (selectedCompanion.needs?.urinationUrge || 0))} / 100 · {getNeedStageLabel(selectedCompanion.kind === 'PET' ? (selectedCompanion.petState?.needs.bathroomUrge || 0) : (selectedCompanion.needs?.urinationUrge || 0))}</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, Math.max(0, selectedCompanion.kind === 'PET' ? (selectedCompanion.petState?.needs.bathroomUrge || 0) : (selectedCompanion.needs?.urinationUrge || 0)))}%` }} />
              </div>
            </div>
          </div>

          {selectedCompanion.kind === 'PET' && selectedCompanion.petState && (
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-zinc-200">펫 장착 칸</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {playerState.equippedPetId === selectedCompanion.id ? `${selectedCompanion.name} 장착 중` : playerState.equippedPetId ? '다른 펫이 장착되어 있습니다.' : '비어 있음'}
                </div>
              </div>
              {playerState.equippedPetId === selectedCompanion.id ? (
                <button disabled={petInteractionLoading} onClick={() => onSetEquippedPet(null)} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200">장착 해제</button>
              ) : (
                <button disabled={petInteractionLoading} onClick={() => onSetEquippedPet(selectedCompanion.id)} className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-xs font-bold text-white">이 펫 장착</button>
              )}
            </div>
          )}

          {selectedCompanion.kind === 'PET' && selectedCompanion.petState && (() => {
            const rates = getPetCommandRates(selectedCompanion);
            return (
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-200">펫 유대 · 길들이기</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{!selectedPetIsEquipped ? '이 펫을 장착해야 돌봄 기능을 사용할 수 있습니다. · ' : ''}유대 EXP {Math.round(selectedCompanion.bond.bondExp)} · 유대 Lv.{selectedCompanion.bond.bondLevel} · 성장 Lv.{selectedCompanion.petState.growth.level}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-zinc-900 rounded p-2"><div className="text-zinc-500">등급</div><div className="font-bold text-amber-200">{PET_GRADE_LABELS[selectedCompanion.petState.growth.grade]} · 성장 Lv.{selectedCompanion.petState.growth.level}</div></div>
                  <div className="bg-zinc-900 rounded p-2 flex items-center justify-between gap-2"><div><div className="text-zinc-500">신진대사 강화</div><div className="font-bold text-sky-200">Lv.{selectedCompanion.petState.growth.metabolismBoost} / 5</div></div><button disabled={petInteractionLoading || !selectedPetIsEquipped || selectedCompanion.petState.growth.metabolismBoost >= 5} onClick={() => onUpgradePetMetabolism(selectedCompanion.id)} className="px-2 py-1 rounded bg-sky-900/70 hover:bg-sky-800 disabled:opacity-40 text-[10px] font-bold text-sky-100">강화</button></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-zinc-900 rounded p-2"><div className="text-zinc-500">명령 수행</div><div className="font-bold text-emerald-300">{rates.obedienceChance}%</div></div>
                  <div className="bg-zinc-900 rounded p-2"><div className="text-zinc-500">독자 행동</div><div className="font-bold text-amber-300">{rates.independentActionChance}%</div></div>
                  <div className="bg-zinc-900 rounded p-2"><div className="text-zinc-500">명령 실패</div><div className="font-bold text-zinc-300">{rates.failureChance}%</div></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PET_CARE_LABELS) as PetCareAction[]).map((action) => (
                    <button
                      key={action}
                      disabled={petInteractionLoading || !selectedPetIsEquipped} onClick={() => onPetCare(selectedCompanion.id, action)}
                      className={action === 'TAME'
                        ? 'px-2 py-2 rounded-lg bg-pink-200 hover:bg-pink-300 border border-pink-300 text-[11px] font-bold text-pink-950 shadow-sm disabled:opacity-50'
                        : 'px-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 disabled:opacity-40'}
                    >
                      {PET_CARE_LABELS[action]}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400">인벤토리 먹이</div>
                  <div className="flex flex-wrap gap-1.5">
                    {getPetFoodOptions(playerState, selectedCompanion.id).map((food) => (
                      <button key={food.itemId} disabled={petInteractionLoading || !selectedPetIsEquipped} onClick={() => onFeedPet(selectedCompanion.id, food.itemId)} className="px-2 py-1.5 rounded-lg bg-lime-950/50 hover:bg-lime-900/60 border border-lime-800/60 text-[10px] font-bold text-lime-200">
                        {food.name} ×{food.quantity}{food.preference === 'FAVORITE' ? ' ★' : ''}
                      </button>
                    ))}
                    {getPetFoodOptions(playerState, selectedCompanion.id).length === 0 && <span className="text-[10px] text-zinc-600">현재 줄 수 있는 선호 먹이가 없습니다.</span>}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500">먹이·놀아주기·손질·길들이기·신진대사 강화는 현재 장착된 펫에게만 사용할 수 있습니다. 먹이는 인벤토리에서 실제 1개 소비됩니다. 같은 날 같은 돌봄을 반복하면 효율이 감소합니다. 길들이기는 성욕·배설 욕구와 야생성을 낮춥니다. 전투 중 펫은 친밀·충성·야생성에 따라 명령 수행/독자 행동/실패가 실제 행동에 반영됩니다.</div>
              </div>
            );
          })()}

          {selectedCompanion.kind === 'PET' && selectedPetIsEquipped && selectedCompanion.petState?.requestState.activeNeed && (
            <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-emerald-200">현재 펫 요청</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedCompanion.petState.requestState.activeNeed === 'DESIRE' ? '성욕' : '배설 욕구'} · 임계 {selectedCompanion.petState.requestState.threshold} · 거절 {selectedCompanion.petState.requestState.refusalCount}회
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled={petInteractionLoading} onClick={() => onRespondPetRequest(selectedCompanion.id, 'ACCEPT')} className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white">수락</button>
                  <button disabled={petInteractionLoading} onClick={() => onRespondPetRequest(selectedCompanion.id, 'REFUSE')} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200">거절</button>
                </div>
              </div>
              <div className="text-[10px] text-zinc-500">연출 문자열은 사용자 작성 슬롯이 비어 있으면 생성 프롬프트에 포함되지 않습니다.</div>
            </div>
          )}

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
