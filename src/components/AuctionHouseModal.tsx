import { useEffect, useState } from 'react';
import { Gavel, X } from 'lucide-react';
import type { PlayerState } from '../types';
import type { ShopPriceContext, ShopSnapshot } from '../data/world/shops';
import { prepareShop } from '../data/world/shops';
import { executeAuctionBid, normalizeSettlementRuntimeState } from '../data/world/settlements';

interface Props {
  isOpen: boolean;
  merchantId?: string;
  playerState: PlayerState;
  priceContext?: ShopPriceContext;
  onUpdatePlayer: (state: PlayerState) => void;
  onClose: () => void;
  onToast?: (message: string, kind?: 'success' | 'error') => void;
}

const BIDS = [
  { ratio:0.8, label:'절약 입찰', chance:45 },
  { ratio:0.9, label:'경쟁 입찰', chance:73 },
  { ratio:1, label:'즉시 낙찰가', chance:100 },
] as const;

export function AuctionHouseModal({ isOpen, merchantId, playerState, priceContext, onUpdatePlayer, onClose, onToast }: Props) {
  const [snapshot, setSnapshot] = useState<ShopSnapshot | null>(null);
  const [selectedStockId, setSelectedStockId] = useState<string>();

  const refresh = (state: PlayerState, pushState = true) => {
    if (!merchantId) return;
    const prepared = prepareShop(state, merchantId, priceContext);
    setSnapshot(prepared.snapshot);
    if (pushState && prepared.state !== state) onUpdatePlayer(prepared.state);
  };

  useEffect(() => {
    if (!isOpen || !merchantId) return;
    setSelectedStockId(undefined);
    refresh(playerState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, merchantId, playerState.dayCount, playerState.currentHour]);

  if (!isOpen || !merchantId) return null;
  const runtime = normalizeSettlementRuntimeState(playerState.settlementState);

  const bid = (stockId:string, itemId:string, ratio:number) => {
    const outcome = executeAuctionBid(playerState, { merchantId, stockId, itemId, bidRatio:ratio, context:priceContext });
    onUpdatePlayer(outcome.state);
    onToast?.(outcome.message, outcome.ok ? (outcome.won ? 'success' : undefined) : 'error');
    if (outcome.won) setSelectedStockId(undefined);
    refresh(outcome.state, false);
  };

  return <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-2 sm:p-4">
    <div className="w-full max-w-3xl max-h-[94dvh] bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
      <header className="p-4 border-b border-stone-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center"><Gavel className="w-5 text-violet-300"/></div>
        <div className="min-w-0 flex-1"><b className="block truncate">{snapshot?.merchantName || '경매장'}</b><span className="text-xs text-stone-500">하루에 각 경매품당 한 번만 입찰할 수 있습니다.</span></div>
        <b className="text-amber-300 text-sm">{playerState.rupees.toLocaleString()} R</b>
        <button onClick={onClose} className="p-2 rounded-lg bg-stone-900"><X className="w-4"/></button>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {(snapshot?.entries || []).length === 0 && <div className="py-16 text-center text-stone-600">오늘 출품된 경매품이 없습니다.</div>}
        {(snapshot?.entries || []).map((entry) => {
          const key = `${Math.max(1, playerState.dayCount)}:${merchantId}:${entry.stockId}`;
          const attempted = runtime.recentAuctionBidKeys.includes(key);
          const selected = selectedStockId === entry.stockId;
          return <div key={entry.stockId} className={`rounded-xl border p-3 ${selected?'border-violet-500 bg-violet-500/10':'border-stone-800 bg-stone-900/50'}`}>
            <button className="w-full text-left" onClick={()=>setSelectedStockId(selected?undefined:entry.stockId)}>
              <div className="flex gap-3"><div className="min-w-0 flex-1"><b className="block truncate">{entry.name}</b><span className="text-xs text-stone-500">{entry.rarity} · 출품 {entry.quantity}개</span></div><div className="text-right"><b className="text-violet-300">기준 {entry.unitBuyPrice.toLocaleString()} R</b><div className={`text-[10px] ${attempted?'text-rose-400':'text-stone-600'}`}>{attempted?'오늘 입찰 완료':'입찰 가능'}</div></div></div>
            </button>
            {selected && <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-800">
              {BIDS.map((option) => {
                const price = Math.max(1, Math.round(entry.unitBuyPrice * option.ratio));
                return <button key={option.ratio} disabled={attempted || playerState.rupees < price} onClick={()=>bid(entry.stockId,entry.itemId,option.ratio)} className="p-2 rounded-lg border border-stone-700 disabled:opacity-35 text-xs hover:border-violet-500">
                  <b className="block">{option.label}</b><span className="text-violet-300 block mt-1">{price.toLocaleString()} R</span><span className="text-[10px] text-stone-500">낙찰 {option.chance}%</span>
                </button>;
              })}
            </div>}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
