import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Building2, Clock3, Coins, DoorOpen, Gavel, Landmark, MapPinned, Moon, ScrollText, ShoppingBag, Store, Sun, X } from 'lucide-react';
import type { PlayerState } from '../types';
import {
  formatOpeningHours,
  getInnStayQuote,
  getRegionalMarketIndices,
  getRegionalMarketTrend,
  getSettlementDefinition,
  getSettlementFamiliarity,
  getSettlementPriceContext,
  isBlackMarketUnlocked,
  isOpeningHoursOpen,
  unlockBlackMarket,
  type InnRateDefinition,
  type SettlementFacilityDefinition,
} from '../data/world/settlements';
import { REGION_DEFINITIONS } from '../data/world/regionData';
import { getShopTypeProfile } from '../data/world/shops';
import { ShopModal } from './ShopModal';
import { AuctionHouseModal } from './AuctionHouseModal';
import { SettlementServiceModal } from './SettlementServiceModal';

interface Props {
  isOpen: boolean;
  settlementId?: string;
  playerState: PlayerState;
  onClose: () => void;
  onUpdatePlayer: (state: PlayerState) => void;
  onStayAtInn: (rate: InnRateDefinition) => void;
  onAcceptQuest: (questId: string) => void;
  onToast?: (message: string, kind?: 'success' | 'error') => void;
}

const tierLabel = { HAMLET:'촌락', VILLAGE:'마을', CITY:'도시', METROPOLIS:'대도시' } as const;
const blackMarketShopTypes = new Set(['BLACK_MARKET','FENCE']);
const alwaysHiddenShopTypes = new Set(['SECRET']);
const marketLabels: Record<string,string> = { GENERAL:'생활', FOOD:'식량', MATERIAL:'재료', EQUIPMENT:'장비', MAGIC:'마법', LUXURY:'사치품' };

function facilityIcon(type: SettlementFacilityDefinition['type'], shopType?:string) {
  if (shopType === 'AUCTION') return <Gavel className="w-4"/>;
  if (type === 'SHOP') return <Store className="w-4"/>;
  if (type === 'INN') return <BedDouble className="w-4"/>;
  if (type === 'NOTICE_BOARD') return <ScrollText className="w-4"/>;
  if (type === 'MARKET') return <ShoppingBag className="w-4"/>;
  if (type === 'BANK') return <Landmark className="w-4"/>;
  return <Building2 className="w-4"/>;
}

export function SettlementModal({ isOpen, settlementId, playerState, onClose, onUpdatePlayer, onStayAtInn, onAcceptQuest, onToast }: Props) {
  const settlement = getSettlementDefinition(settlementId);
  const [districtId, setDistrictId] = useState<string | undefined>();
  const [merchantId, setMerchantId] = useState<string | undefined>();
  const [auctionMerchantId, setAuctionMerchantId] = useState<string | undefined>();
  const [serviceFacilityId, setServiceFacilityId] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen || !settlement) return;
    setDistrictId(settlement.districts[0]?.id);
    setMerchantId(undefined);
    setAuctionMerchantId(undefined);
    setServiceFacilityId(undefined);
  }, [isOpen, settlement?.id]);

  const blackUnlocked = settlement ? isBlackMarketUnlocked(playerState, settlement.id) : false;
  const facilities = useMemo(() => {
    if (!settlement) return [];
    const base = (!settlement.districts.length || !districtId)
      ? settlement.facilities
      : settlement.facilities.filter((facility) => facility.districtId === districtId);
    return base.filter((facility) => {
      if (!facility.shop) return true;
      if (alwaysHiddenShopTypes.has(facility.shop.shopType)) return false;
      if (blackMarketShopTypes.has(facility.shop.shopType)) return blackUnlocked;
      return true;
    });
  }, [settlement, districtId, blackUnlocked]);

  if (!isOpen || !settlement) return null;
  const priceContext = getSettlementPriceContext(settlement, playerState);
  const marketIndices = getRegionalMarketIndices(settlement, playerState);
  const marketTrend = getRegionalMarketTrend(settlement, playerState);
  const familiarity = getSettlementFamiliarity(playerState, settlement.id);
  const regionName = REGION_DEFINITIONS[settlement.regionId]?.name || settlement.regionId;
  const isNight = playerState.currentHour < 6 || playerState.currentHour >= 20;
  const serviceFacility = settlement.facilities.find((facility)=>facility.id===serviceFacilityId);
  const hiddenMarketExists = settlement.facilities.some((facility)=>facility.shop && blackMarketShopTypes.has(facility.shop.shopType));
  const canSeekBlackMarket = hiddenMarketExists && !blackUnlocked && (playerState.currentHour >= 19 || playerState.currentHour < 5);

  const revealBlackMarket = () => {
    const result = unlockBlackMarket(playerState, settlement.id, 100);
    if (result.ok) onUpdatePlayer(result.state);
    onToast?.(result.message, result.ok ? 'success' : 'error');
  };

  return <>
    <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[94dvh] bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
        <header className="p-3 sm:p-4 border-b border-stone-800 bg-stone-950/95">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><MapPinned className="w-5 text-amber-300"/></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><h2 className="font-bold text-lg">{settlement.name}</h2><span className="text-[10px] px-2 py-1 rounded-full border border-stone-700 text-stone-400">{tierLabel[settlement.tier]}</span></div><p className="text-xs text-stone-500 mt-1">{regionName} · {settlement.description}</p></div>
            <button onClick={onClose} className="p-2 rounded-lg bg-stone-900"><X className="w-4"/></button>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-stone-900 p-2"><Clock3 className="w-3 inline mr-1 text-sky-300"/>{playerState.dayCount}일 {String(playerState.currentHour).padStart(2,'0')}:{String(playerState.currentMinute).padStart(2,'0')} {isNight?<Moon className="w-3 inline ml-1"/>:<Sun className="w-3 inline ml-1"/>}</div>
            <div className="rounded-lg bg-stone-900 p-2"><Coins className="w-3 inline mr-1 text-amber-300"/>{playerState.rupees.toLocaleString()} R</div>
            <div className="rounded-lg bg-stone-900 p-2 col-span-2"><span className="text-stone-500">경제:</span> {settlement.economyTags.join(' · ') || '보통'}<span className="ml-2 text-amber-300">· {familiarity.name} ({familiarity.visits}일 방문)</span></div>
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
            {Object.entries(marketIndices).map(([sector,index]) => { const delta = marketTrend[sector as keyof typeof marketTrend] || 0; return <span key={sector} className={`text-[10px] whitespace-nowrap px-2 py-1 rounded-full border ${index>1.035?'border-rose-800 text-rose-300':index<0.965?'border-emerald-800 text-emerald-300':'border-stone-800 text-stone-500'}`}>{marketLabels[sector] || sector} {Math.round(index*100)}% <span className={delta>0?'text-rose-400':delta<0?'text-emerald-400':'text-stone-600'}>{delta>0?'▲':delta<0?'▼':'·'}{Math.abs(Math.round(delta*100)) || ''}</span></span> })}
          </div>
        </header>

        {settlement.districts.length > 0 && <div className="p-2 border-b border-stone-800 flex gap-2 overflow-x-auto">
          {settlement.districts.map((district) => <button key={district.id} onClick={()=>setDistrictId(district.id)} className={`px-3 py-2 rounded-lg border whitespace-nowrap text-xs ${districtId===district.id?'border-amber-500 bg-amber-500/10 text-amber-200':'border-stone-800 text-stone-400'}`}><b>{district.name}</b></button>)}
        </div>}

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {settlement.districts.length > 0 && districtId && <div className="rounded-xl border border-stone-800 bg-stone-900/30 p-3"><b>{settlement.districts.find((d)=>d.id===districtId)?.name}</b><p className="text-xs text-stone-500 mt-1">{settlement.districts.find((d)=>d.id===districtId)?.description}</p></div>}

          {canSeekBlackMarket && <div className="rounded-xl border border-fuchsia-900/60 bg-fuchsia-950/20 p-3 flex items-center gap-3"><div className="min-w-0 flex-1"><b className="text-fuchsia-300">수상한 골목의 소문</b><p className="text-xs text-stone-500 mt-1">밤의 정보상이 정식 지도에는 없는 거래 장소를 알고 있다고 합니다.</p></div><button disabled={playerState.rupees<100} onClick={revealBlackMarket} className="shrink-0 px-3 py-2 rounded-lg bg-fuchsia-800 text-xs font-bold disabled:opacity-35">정보 구매 · 100 R</button></div>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {facilities.map((facility) => {
              const open = isOpeningHoursOpen(facility.openingHours, playerState.currentHour);
              const shopName = facility.shop ? getShopTypeProfile(facility.shop.shopType).name : undefined;
              const isAuction = facility.shop?.shopType === 'AUCTION';
              return <div key={facility.id} className="rounded-xl border border-stone-800 bg-stone-900/45 p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-start"><div className="mt-0.5 text-amber-300">{facilityIcon(facility.type, facility.shop?.shopType)}</div><div className="min-w-0 flex-1"><b className="block truncate">{facility.name}</b><span className={`text-[10px] ${open?'text-emerald-400':'text-rose-400'}`}>{open?'영업 중':'영업 종료'} · {formatOpeningHours(facility.openingHours)}</span>{shopName&&<div className="text-[10px] text-stone-600">{shopName} · 상인 {facility.shop?.merchantName}</div>}</div></div>
                <p className="text-xs text-stone-500 min-h-8">{facility.description}</p>
                {facility.type === 'SHOP' && facility.shop && <button disabled={!open} onClick={()=>isAuction?setAuctionMerchantId(facility.shop!.merchantId):setMerchantId(facility.shop!.merchantId)} className={`mt-auto p-2 rounded-lg font-bold text-xs disabled:opacity-35 ${isAuction?'bg-violet-600 text-white':'bg-amber-500 text-stone-950'}`}>{open?(isAuction?'경매 참여':'거래하기'):'문이 닫혀 있다'}</button>}
                {facility.type === 'MARKET' && <button disabled={!open} onClick={()=>setMerchantId(`${settlement.id.toLowerCase()}:market`)} className="mt-auto p-2 rounded-lg bg-orange-600 text-white font-bold text-xs disabled:opacity-35">{open?'시장 둘러보기':'시장이 닫혀 있다'}</button>}
                {facility.type === 'INN' && <div className="space-y-1">{(settlement.innRates || []).map((rate)=>{ const quote=getInnStayQuote(playerState, settlement.id, rate); return <button key={rate.id} disabled={playerState.rupees<quote.price} onClick={()=>onStayAtInn(rate)} className="w-full p-2 rounded-lg border border-stone-700 text-left text-xs disabled:opacity-35"><b>{rate.name}</b><span className="float-right text-amber-300">{quote.price} R</span><div className="text-[10px] text-stone-600">{rate.description} · {Math.round(rate.recoveryRatio*100)}% 회복{quote.discountRate>0?` · 단골 ${Math.round(quote.discountRate*100)}% 할인`:''}</div></button> })}</div>}
                {(facility.type === 'NOTICE_BOARD' || facility.type === 'GUILD' || facility.type === 'BANK') && <button disabled={!open} onClick={()=>setServiceFacilityId(facility.id)} className="mt-auto p-2 rounded-lg bg-stone-800 border border-stone-700 font-bold text-xs disabled:opacity-35">{facility.type==='NOTICE_BOARD'?'의뢰 확인':facility.type==='GUILD'?'길드 이용':'은행 이용'}</button>}
                {facility.type === 'SERVICE' || facility.type === 'SPECIAL' ? <div className="mt-auto text-[10px] rounded bg-black/30 p-2 text-stone-600">이 시설은 후속 콘텐츠에서 확장됩니다.</div> : null}
              </div>;
            })}
          </div>

          {facilities.length === 0 && <div className="py-16 text-center text-stone-600"><DoorOpen className="w-6 mx-auto mb-2"/>이 구역에서 이용 가능한 시설이 없습니다.</div>}
        </div>
      </div>
    </div>

    <ShopModal isOpen={Boolean(merchantId)} merchantId={merchantId} playerState={playerState} priceContext={priceContext} onUpdatePlayer={onUpdatePlayer} onClose={()=>setMerchantId(undefined)} onToast={onToast}/>
    <AuctionHouseModal isOpen={Boolean(auctionMerchantId)} merchantId={auctionMerchantId} playerState={playerState} priceContext={priceContext} onUpdatePlayer={onUpdatePlayer} onClose={()=>setAuctionMerchantId(undefined)} onToast={onToast}/>
    <SettlementServiceModal isOpen={Boolean(serviceFacility)} settlement={settlement} facility={serviceFacility} playerState={playerState} onUpdatePlayer={onUpdatePlayer} onAcceptQuest={onAcceptQuest} onClose={()=>setServiceFacilityId(undefined)} onToast={onToast}/>
  </>;
}
