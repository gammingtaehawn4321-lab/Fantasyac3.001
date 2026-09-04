import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, HandCoins, Minus, Plus, RefreshCw, ShoppingBag, Sparkles, X } from 'lucide-react';
import type { PlayerState } from '../types';
import {
  attemptMerchantHaggle,
  createShopTransactionId,
  executeShopTransaction,
  getShopSellOffers,
  prepareShop,
  type ShopPriceContext,
  type ShopSellOffer,
  type ShopSnapshot,
  type ShopSnapshotEntry,
} from '../data/world/shops';

interface Props {
  isOpen: boolean;
  merchantId?: string;
  playerState: PlayerState;
  priceContext?: ShopPriceContext;
  onUpdatePlayer: (state: PlayerState) => void;
  onClose: () => void;
  onToast?: (message: string, kind?: 'success' | 'error') => void;
}

type Tab = 'BUY' | 'SELL';

type Selection =
  | { tab: 'BUY'; entry: ShopSnapshotEntry }
  | { tab: 'SELL'; entry: ShopSellOffer };

function restockLabel(snapshot: ShopSnapshot, state: PlayerState): string {
  const now = (Math.max(1, state.dayCount) - 1) * 1440 + state.currentHour * 60 + state.currentMinute;
  const diff = Math.max(0, snapshot.nextRestockAbsoluteMinute - now);
  if (diff <= 60) return `${Math.max(1, diff)}분 후`;
  if (diff < 1440) return `${Math.ceil(diff / 60)}시간 후`;
  return `${Math.ceil(diff / 1440)}일 후`;
}

export function ShopModal({ isOpen, merchantId, playerState, priceContext, onUpdatePlayer, onClose, onToast }: Props) {
  const [tab, setTab] = useState<Tab>('BUY');
  const [snapshot, setSnapshot] = useState<ShopSnapshot | null>(null);
  const [sellOffers, setSellOffers] = useState<ShopSellOffer[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [quantity, setQuantity] = useState(1);

  const refresh = (baseState: PlayerState, allowParentUpdate = true) => {
    if (!merchantId) return;
    const prepared = prepareShop(baseState, merchantId, priceContext);
    let state = prepared.state;
    const selling = getShopSellOffers(state, merchantId, priceContext);
    state = selling.state;
    setSnapshot(prepared.snapshot);
    setSellOffers(selling.offers);
    if (allowParentUpdate && state !== baseState) onUpdatePlayer(state);
  };

  useEffect(() => {
    if (!isOpen || !merchantId) return;
    setSelection(null);
    setQuantity(1);
    refresh(playerState);
    // Restock only needs to be re-evaluated when the merchant or in-game clock changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, merchantId, playerState.dayCount, playerState.currentHour, playerState.currentMinute]);

  useEffect(() => {
    if (!isOpen || !merchantId) return;
    const selling = getShopSellOffers(playerState, merchantId, priceContext);
    setSellOffers(selling.offers);
    if (selling.state !== playerState) onUpdatePlayer(selling.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState.inventory, playerState.rupees, playerState.commerce?.transactionSequence]);

  const maxQuantity = useMemo(() => {
    if (!selection) return 1;
    if (selection.tab === 'BUY') {
      const affordable = Math.floor(Math.max(0, playerState.rupees) / Math.max(1, selection.entry.unitBuyPrice));
      return Math.max(1, Math.min(selection.entry.quantity, affordable || 1));
    }
    return Math.max(1, selection.entry.quantity);
  }, [selection, playerState.rupees]);

  if (!isOpen || !merchantId) return null;

  const chooseBuy = (entry: ShopSnapshotEntry) => { setSelection({ tab:'BUY', entry }); setQuantity(1); };
  const chooseSell = (entry: ShopSellOffer) => { setSelection({ tab:'SELL', entry }); setQuantity(1); };

  const haggle = (kind: Tab) => {
    if (!snapshot) return;
    const { state, result } = attemptMerchantHaggle(playerState, merchantId, kind);
    if (result.stateChanged) onUpdatePlayer(state);
    onToast?.(result.message, result.success ? 'success' : 'error');
    setSelection(null);
    setQuantity(1);
    refresh(state, false);
  };

  const transact = () => {
    if (!selection || !snapshot) return;
    const kind = selection.tab;
    const itemId = selection.entry.itemId;
    const stockId = kind === 'BUY' ? selection.entry.stockId : undefined;
    const transactionId = createShopTransactionId(playerState, merchantId, kind);
    const { state, result } = executeShopTransaction(playerState, {
      transactionId,
      merchantId,
      kind,
      itemId,
      quantity: Math.max(1, Math.min(quantity, maxQuantity)),
      stockId,
      context: priceContext,
    });
    onUpdatePlayer(state);
    onToast?.(result.message, result.ok ? 'success' : 'error');
    if (result.ok) {
      setSelection(null);
      setQuantity(1);
      refresh(state, false);
    }
  };

  const total = selection
    ? (selection.tab === 'BUY' ? selection.entry.unitBuyPrice : selection.entry.unitSellPrice) * quantity
    : 0;

  return <div className="fixed inset-0 z-[95] bg-black/85 flex items-center justify-center p-2 sm:p-4">
    <div className="w-full max-w-3xl max-h-[94dvh] bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
      <header className="p-3 sm:p-4 border-b border-stone-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-amber-300"/></div>
        <div className="min-w-0"><b className="block truncate">{snapshot?.shopTypeName || '상점'} · {snapshot?.merchantName || merchantId}</b><span className="text-xs text-stone-500">{snapshot?.affinityTier || '낯선 손님'} · 친밀도 {Math.floor(snapshot?.affinity || 0)} · 거래 {snapshot?.totalTransactions || 0}회 · 재입고 {snapshot ? restockLabel(snapshot, playerState) : '-'}</span>{snapshot?.haggleEffectLabel&&<div className="text-[10px] text-fuchsia-300 mt-0.5"><Sparkles className="w-3 inline mr-1"/>{snapshot.haggleEffectLabel}</div>}</div>
        <div className="ml-auto text-right"><b className="text-amber-300">{playerState.rupees.toLocaleString()} R</b><button onClick={onClose} className="ml-3 p-2 rounded-lg bg-stone-900"><X className="w-4 h-4"/></button></div>
      </header>

      <div className="grid grid-cols-2 border-b border-stone-800">
        <button onClick={() => { setTab('BUY'); setSelection(null); }} className={`p-3 text-sm font-bold ${tab==='BUY'?'bg-amber-500/10 text-amber-200 border-b-2 border-amber-500':'text-stone-500'}`}><ArrowDownToLine className="w-4 inline mr-1"/>구매</button>
        <button onClick={() => { setTab('SELL'); setSelection(null); }} className={`p-3 text-sm font-bold ${tab==='SELL'?'bg-emerald-500/10 text-emerald-200 border-b-2 border-emerald-500':'text-stone-500'}`}><ArrowUpFromLine className="w-4 inline mr-1"/>판매</button>
      </div>
      <div className="px-3 py-2 border-b border-stone-800 bg-stone-950/90 flex items-center gap-2">
        <div className="text-[10px] text-stone-600 min-w-0 flex-1">흥정은 상인별 하루 1회. 성공하면 다음 {tab==='BUY'?'구매':'판매'} 1회에만 적용됩니다.</div>
        <button disabled={!snapshot?.haggleAvailable} onClick={()=>haggle(tab)} className="shrink-0 px-3 py-2 rounded-lg border border-fuchsia-800 bg-fuchsia-950/30 text-fuchsia-200 text-xs font-bold disabled:opacity-35"><HandCoins className="w-3.5 inline mr-1"/>{snapshot?.haggleAvailable?'흥정하기':'오늘 흥정 완료'}</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === 'BUY' ? <>
          {(snapshot?.entries || []).length === 0 && <div className="text-center text-stone-600 py-12"><RefreshCw className="w-5 inline mr-2"/>현재 판매 가능한 상품이 없습니다.</div>}
          {(snapshot?.entries || []).map((entry) => <button key={entry.stockId} onClick={() => chooseBuy(entry)} className={`w-full text-left rounded-xl border p-3 ${selection?.tab==='BUY'&&selection.entry.stockId===entry.stockId?'border-amber-500 bg-amber-500/10':'border-stone-800 bg-stone-900/50'}`}>
            <div className="flex gap-3 items-center"><div className="min-w-0 flex-1"><b className="block truncate">{entry.name}</b><span className="text-xs text-stone-500">{entry.rarity} · 재고 {entry.quantity}{entry.limited?' · 한정':''}</span></div><div className="text-right"><b className="text-amber-300">{entry.unitBuyPrice.toLocaleString()} R</b><div className="text-[10px] text-stone-600">1개</div></div></div>
          </button>)}
        </> : <>
          {sellOffers.length === 0 && <div className="text-center text-stone-600 py-12">이 상인이 매입하는 소지품이 없습니다.</div>}
          {sellOffers.map((entry) => <button key={`${entry.kind}:${entry.itemId}`} onClick={() => chooseSell(entry)} className={`w-full text-left rounded-xl border p-3 ${selection?.tab==='SELL'&&selection.entry.itemId===entry.itemId?'border-emerald-500 bg-emerald-500/10':'border-stone-800 bg-stone-900/50'}`}>
            <div className="flex gap-3 items-center"><div className="min-w-0 flex-1"><b className="block truncate">{entry.name}</b><span className="text-xs text-stone-500">보유 {entry.quantity} · {entry.kind==='EQUIPMENT'?'장비':'아이템'}</span></div><div className="text-right"><b className="text-emerald-300">{entry.unitSellPrice.toLocaleString()} R</b><div className="text-[10px] text-stone-600">1개 매입가</div></div></div>
          </button>)}
        </>}
      </div>

      {selection && <div className="border-t border-stone-800 bg-stone-950 p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-3"><div className="min-w-0 flex-1"><b className="block truncate">{selection.entry.name}</b><span className="text-xs text-stone-500">총액 {total.toLocaleString()} R</span></div><div className="flex items-center gap-1"><button onClick={()=>setQuantity((q)=>Math.max(1,q-1))} className="p-2 rounded bg-stone-800"><Minus className="w-4"/></button><input value={quantity} onChange={(e)=>setQuantity(Math.max(1,Math.min(maxQuantity,Math.floor(Number(e.target.value)||1))))} inputMode="numeric" className="w-14 p-2 text-center bg-black border border-stone-700 rounded"/><button onClick={()=>setQuantity((q)=>Math.min(maxQuantity,q+1))} className="p-2 rounded bg-stone-800"><Plus className="w-4"/></button></div></div>
        <button onClick={transact} disabled={selection.tab==='BUY' && total > playerState.rupees} className={`w-full p-3 rounded-xl font-bold disabled:opacity-40 ${selection.tab==='BUY'?'bg-amber-500 text-stone-950':'bg-emerald-700 text-white'}`}>{selection.tab==='BUY'?'구매':'판매'} · {quantity}개 · {total.toLocaleString()} R</button>
      </div>}
    </div>
  </div>;
}
