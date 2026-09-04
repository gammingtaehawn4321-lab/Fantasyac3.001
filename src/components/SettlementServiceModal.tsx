import { useMemo, useState } from 'react';
import { Landmark, ScrollText, ShieldCheck, X } from 'lucide-react';
import type { PlayerState } from '../types';
import type { SettlementDefinition, SettlementFacilityDefinition } from '../data/world/settlements';
import {
  claimGuildSupplies,
  getSettlementBoardQuestIds,
  getSettlementGuildRank,
  joinSettlementGuild,
  normalizeSettlementRuntimeState,
  transferBankFunds,
} from '../data/world/settlements';
import { getQuestDefinition } from '../data/quests/questDatabase';

interface Props {
  isOpen: boolean;
  settlement: SettlementDefinition;
  facility?: SettlementFacilityDefinition;
  playerState: PlayerState;
  onUpdatePlayer: (state: PlayerState) => void;
  onAcceptQuest: (questId: string) => void;
  onClose: () => void;
  onToast?: (message: string, kind?: 'success' | 'error') => void;
}

const rankName = ['미가입','새싹','정식','숙련'] as const;

export function SettlementServiceModal({ isOpen, settlement, facility, playerState, onUpdatePlayer, onAcceptQuest, onClose, onToast }: Props) {
  const [amount, setAmount] = useState(100);
  const boardQuests = useMemo(() => getSettlementBoardQuestIds(settlement.id).map(getQuestDefinition).filter(Boolean), [settlement.id]);
  if (!isOpen || !facility) return null;

  const runtime = normalizeSettlementRuntimeState(playerState.settlementState);
  const guild = getSettlementGuildRank(playerState, settlement.id);

  const bank = (direction:'DEPOSIT'|'WITHDRAW') => {
    const result = transferBankFunds(playerState, amount, direction);
    if (result.ok) onUpdatePlayer(result.state);
    onToast?.(result.message, result.ok ? 'success' : 'error');
  };

  const join = () => {
    const result = joinSettlementGuild(playerState, settlement.id);
    if (result.ok) onUpdatePlayer(result.state);
    onToast?.(result.message, result.ok ? 'success' : 'error');
  };

  const claim = () => {
    const result = claimGuildSupplies(playerState, settlement.id);
    if (result.ok) onUpdatePlayer(result.state);
    onToast?.(result.message, result.ok ? 'success' : 'error');
  };

  const icon = facility.type === 'BANK' ? <Landmark className="w-5 text-sky-300"/> : facility.type === 'GUILD' ? <ShieldCheck className="w-5 text-emerald-300"/> : <ScrollText className="w-5 text-amber-300"/>;

  return <div className="fixed inset-0 z-[98] bg-black/90 flex items-center justify-center p-2 sm:p-4">
    <div className="w-full max-w-2xl max-h-[92dvh] bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
      <header className="p-4 border-b border-stone-800 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">{icon}</div><div className="min-w-0 flex-1"><b className="block truncate">{facility.name}</b><span className="text-xs text-stone-500">{settlement.name}</span></div><button onClick={onClose} className="p-2 rounded-lg bg-stone-900"><X className="w-4"/></button></header>
      <div className="flex-1 overflow-y-auto p-4">
        {facility.type === 'BANK' && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-stone-800 bg-stone-900/50 p-3"><span className="text-xs text-stone-500">소지금</span><b className="block text-lg text-amber-300">{playerState.rupees.toLocaleString()} R</b></div><div className="rounded-xl border border-stone-800 bg-stone-900/50 p-3"><span className="text-xs text-stone-500">은행 예치금</span><b className="block text-lg text-sky-300">{runtime.bankBalance.toLocaleString()} R</b></div></div>
          <div className="rounded-xl border border-stone-800 p-3 space-y-3"><label className="text-xs text-stone-500">이체 금액</label><input inputMode="numeric" value={amount} onChange={(e)=>setAmount(Math.max(0,Math.floor(Number(e.target.value)||0)))} className="w-full bg-black border border-stone-700 rounded-lg p-3"/><div className="grid grid-cols-4 gap-1">{[100,500,1000,5000].map((value)=><button key={value} onClick={()=>setAmount(value)} className="p-2 rounded bg-stone-900 text-xs">{value.toLocaleString()}</button>)}</div><div className="grid grid-cols-2 gap-2"><button onClick={()=>bank('DEPOSIT')} className="p-3 rounded-xl bg-sky-800 font-bold">예치</button><button onClick={()=>bank('WITHDRAW')} className="p-3 rounded-xl bg-emerald-800 font-bold">인출</button></div></div>
          <p className="text-xs text-stone-600">예치금은 은행 시설이 있는 모든 정착지에서 공유됩니다. 이자는 없으며 안전 보관용 계좌입니다.</p>
        </div>}

        {facility.type === 'GUILD' && <div className="space-y-4">
          <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4"><div className="flex items-center justify-between"><div><span className="text-xs text-stone-500">지부 등급</span><b className="block text-lg text-emerald-300">{rankName[guild.rank] || `Rank ${guild.rank}`}</b></div><div className="text-right"><span className="text-xs text-stone-500">완료한 지역 계약</span><b className="block">{guild.completedContracts}/2</b></div></div></div>
          {!guild.joined ? <button disabled={playerState.rupees<120} onClick={join} className="w-full p-3 rounded-xl bg-emerald-700 font-bold disabled:opacity-35">길드 가입 · 120 R</button> : <button disabled={!guild.canClaimSupply} onClick={claim} className="w-full p-3 rounded-xl bg-emerald-700 font-bold disabled:opacity-35">{guild.canClaimSupply?'오늘의 길드 보급품 받기':'오늘 보급품 수령 완료'}</button>}
          <div className="rounded-xl border border-stone-800 p-3 text-xs text-stone-500 space-y-1"><div>새싹: 작은 회복약 ×1</div><div>정식: 작은 회복약 ×2</div><div>숙련: 작은 회복약 ×2 + 마나 드라우트 ×1</div><div className="pt-1 text-stone-600">이 정착지 게시판 계약을 완료할수록 지부 등급이 상승합니다. 지부 등급은 해당 정착지의 정식 상권에서 소폭 가격 우대로도 이어집니다.</div></div>
        </div>}

        {facility.type === 'NOTICE_BOARD' && <div className="space-y-2">
          {boardQuests.map((quest) => {
            if (!quest) return null;
            const progress = playerState.quests?.[quest.id];
            const status = progress?.status;
            const canAccept = !status || status === 'AVAILABLE' || status === 'OFFERED';
            return <div key={quest.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3"><div className="flex gap-3"><div className="min-w-0 flex-1"><b className="block">{quest.title}</b><p className="text-xs text-stone-500 mt-1">{quest.summary}</p><div className="text-[10px] text-stone-600 mt-2">보상: {quest.rewards.rupees || 0} R · EXP {quest.rewards.exp || 0}</div></div><div className="shrink-0 text-right"><span className={`text-[10px] ${status==='COMPLETED'?'text-emerald-400':status==='ACTIVE'?'text-sky-400':'text-stone-500'}`}>{status==='COMPLETED'?'완료':status==='ACTIVE'?'진행 중':'수락 가능'}</span></div></div>{canAccept && <button onClick={()=>onAcceptQuest(quest.id)} className="w-full mt-3 p-2 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs">의뢰 수락</button>}</div>;
          })}
        </div>}
      </div>
    </div>
  </div>;
}
