import { useEffect, useMemo, useState } from 'react';
import IllustrationImage from './IllustrationImage';
import {
  X,
  Backpack,
  PackageOpen,
  Weight,
  AlertTriangle,
  ChevronRight,
  Coins,
  Package,
  ImageIcon,
  Info,
} from 'lucide-react';
import { InventoryItem, PlayerState } from '../types';
import {
  calculateInventoryWeight,
  calculatePartyCarryWeight,
  calculateEncumbranceState,
  getItemSingleWeight,
  calculateItemTotalWeight,
  getBagDefinition,
  BAG_TYPE_KOREAN,
  BAG_RARITY_KOREAN,
} from '../data/bags';
import { getItemDefinition, inferItemMetadata, inferUsageHint } from '../data/items/itemDatabase';
import { EQUIPMENT_DATABASE } from '../data/equipment/equipmentDatabase';
import { ItemDetailModal } from './ItemDetailModal';

export type ItemFilterCategory =
  | 'ALL'
  | 'CONSUMABLE'
  | 'MATERIAL'
  | 'EQUIPMENT'
  | 'BAG'
  | 'KEY'
  | 'QUEST'
  | 'MAP'
  | 'TOOL'
  | 'BOOK'
  | 'MISC';

interface FilterOption {
  id: ItemFilterCategory;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'ALL', label: '전체' },
  { id: 'CONSUMABLE', label: '소모품' },
  { id: 'MATERIAL', label: '재료' },
  { id: 'EQUIPMENT', label: '장비' },
  { id: 'BAG', label: '가방' },
  { id: 'KEY', label: '열쇠' },
  { id: 'QUEST', label: '퀘스트' },
  { id: 'MAP', label: '지도' },
  { id: 'TOOL', label: '도구' },
  { id: 'BOOK', label: '책' },
  { id: 'MISC', label: '기타' },
];

const QUALITY_KOREAN: Record<string, string> = {
  POOR: '조악',
  NORMAL: '보통',
  FINE: '양질',
  SUPERIOR: '우수',
  MASTERWORK: '명품',
};

function getItemFilterCategory(item: InventoryItem): ItemFilterCategory {
  if (item.bagId || getBagDefinition(item.bagId || item.id || item.name)) return 'BAG';
  if (item.equipmentId || (item.id && EQUIPMENT_DATABASE[item.id]) || (item.equipmentId && EQUIPMENT_DATABASE[item.equipmentId])) {
    return 'EQUIPMENT';
  }

  const itemDef = getItemDefinition(item.id || item.name);
  const rawCat = item.category || itemDef?.category;
  if (rawCat === 'CONSUMABLE') return 'CONSUMABLE';
  if (rawCat === 'MATERIAL') return 'MATERIAL';
  if (rawCat === 'EQUIPMENT') return 'EQUIPMENT';
  if (rawCat === 'KEY') return 'KEY';
  if (rawCat === 'QUEST') return 'QUEST';
  if (rawCat === 'MAP') return 'MAP';
  if (rawCat === 'TOOL') return 'TOOL';
  if (rawCat === 'BOOK' || rawCat === 'DOCUMENT') return 'BOOK';
  if (rawCat === 'MISC' || rawCat === 'GIFT' || rawCat === 'VALUABLE') return 'MISC';

  const name = item.name.toLowerCase();
  if (name.includes('배낭') || name.includes('주머니') || name.includes('가방') || name.includes('전대') || name.includes('자루')) return 'BAG';
  if (name.includes('약') || name.includes('포션') || name.includes('음식') || name.includes('고기') || name.includes('빵') || name.includes('스크롤')) return 'CONSUMABLE';
  if (name.includes('주괴') || name.includes('광석') || name.includes('원석') || name.includes('가죽') || name.includes('목재') || name.includes('약초') || name.includes('뼈') || name.includes('결정')) return 'MATERIAL';
  if (name.includes('검') || name.includes('도끼') || name.includes('창') || name.includes('방패') || name.includes('갑옷') || name.includes('투구') || name.includes('신발') || name.includes('장갑') || name.includes('망토') || name.includes('반지') || name.includes('목걸이') || name.includes('지팡이') || name.includes('활')) return 'EQUIPMENT';
  if (name.includes('열쇠') || name.includes('인장')) return 'KEY';
  if (name.includes('퀘스트') || name.includes('단서') || name.includes('의뢰서') || name.includes('징표') || name.includes('증표')) return 'QUEST';
  if (name.includes('지도') || name.includes('해도') || name.includes('항로도')) return 'MAP';
  if (name.includes('밧줄') || name.includes('삽') || name.includes('횃불') || name.includes('곡괭이') || name.includes('낚싯대')) return 'TOOL';
  if (name.includes('책') || name.includes('서적') || name.includes('일지') || name.includes('고서') || name.includes('마도서') || name.includes('비전서')) return 'BOOK';
  return 'MISC';
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onUseItem: (itemName: string) => void;
  onEquipBag?: (bagId: string) => void;
  onUnequipBag?: () => void;
  onDiscardItem?: (itemNameOrId: string, quantity: number) => void;
}

export function InventoryModal({
  isOpen,
  onClose,
  playerState,
  onUseItem,
  onEquipBag,
  onUnequipBag,
  onDiscardItem,
}: InventoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ItemFilterCategory>('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsWide(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDetailItem(null);
      return;
    }
    if (!selectedItem && playerState.inventory.length > 0) {
      setSelectedItem(playerState.inventory[0]);
    }
  }, [isOpen, playerState.inventory, selectedItem]);

  const currentWeight = calculateInventoryWeight(playerState.inventory, playerState.equippedBagId);
  const maxWeight = calculatePartyCarryWeight(playerState);
  const encumbranceState = calculateEncumbranceState(currentWeight, maxWeight);
  const equippedBagDef = playerState.equippedBagId ? getBagDefinition(playerState.equippedBagId) : null;
  const weightPercent = Math.min(100, Math.max(0, Math.round((currentWeight / Math.max(1, maxWeight)) * 100)));

  let gaugeBarColor = 'bg-emerald-500';
  if (encumbranceState.level === 'ENCUMBERED_1') gaugeBarColor = 'bg-amber-500';
  else if (encumbranceState.level === 'ENCUMBERED_2') gaugeBarColor = 'bg-orange-500';
  else if (encumbranceState.level === 'OVERLOADED') gaugeBarColor = 'bg-rose-500 animate-pulse';

  const filteredItems = useMemo(
    () => playerState.inventory.filter((item) => selectedCategory === 'ALL' || getItemFilterCategory(item) === selectedCategory),
    [playerState.inventory, selectedCategory]
  );

  const preview = useMemo(() => {
    if (!selectedItem) return null;
    const itemDef = getItemDefinition(selectedItem.id || selectedItem.name);
    const inferredMeta = inferItemMetadata(selectedItem.id || selectedItem.name, selectedItem.description);
    const equipId = selectedItem.equipmentId || (selectedItem.id && EQUIPMENT_DATABASE[selectedItem.id] ? selectedItem.id : undefined);
    const equipDef = equipId ? EQUIPMENT_DATABASE[equipId] : undefined;
    const bagDef = getBagDefinition(selectedItem.bagId || selectedItem.id || selectedItem.name);
    const category = getItemFilterCategory(selectedItem);
    const categoryLabel = FILTER_OPTIONS.find((opt) => opt.id === category)?.label || '기타';
    const illustrationUrl = selectedItem.illustrationUrl || itemDef?.illustrationUrl || equipDef?.illustrationUrl || bagDef?.illustrationUrl || '';
    const description = selectedItem.description || itemDef?.description || equipDef?.description || bagDef?.description || inferredMeta.description;
    const flavorText = selectedItem.flavorText || itemDef?.flavorText || equipDef?.flavorText || bagDef?.flavorText || '';
    const usageHint = itemDef?.usageHint || (bagDef ? `사용처: 가방 슬롯에 장착하여 소지 무게 한도를 +${bagDef.bonusCarryWeight}kg 확장합니다.` : inferUsageHint(selectedItem.name, inferredMeta.category, itemDef?.uses));
    return { itemDef, equipDef, bagDef, categoryLabel, illustrationUrl, description, flavorText, usageHint };
  }, [selectedItem]);

  if (!isOpen) return null;

  const openItem = (item: InventoryItem) => {
    setSelectedItem(item);
    if (!isWide) setDetailItem(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-ui-pop-in">
      <div className="w-full max-w-5xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-stone-800 bg-stone-950/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
              <Backpack className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-100">가방 · 인벤토리</h2>
              <p className="text-[10px] sm:text-[11px] text-stone-500">소지품을 선택하면 상세 정보와 삽화를 확인할 수 있습니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="touch-target p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(290px,.75fr)]">
          <div className="min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3.5 md:border-r md:border-stone-800">
            <section className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl space-y-2.5">
              <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-stone-800/80">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-stone-100">{equippedBagDef ? equippedBagDef.name : '기본 주머니'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                      {equippedBagDef ? `${BAG_TYPE_KOREAN[equippedBagDef.bagType]} · ${BAG_RARITY_KOREAN[equippedBagDef.rarity]}` : '가방 미착용'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    {equippedBagDef ? `자체 ${equippedBagDef.weight.toFixed(1)}kg · 추가 용량 +${equippedBagDef.bonusCarryWeight.toFixed(1)}kg` : '현재 기본 운반 한도만 적용됩니다.'}
                  </p>
                </div>
                {equippedBagDef && onUnequipBag && (
                  <button onClick={onUnequipBag} className="px-2.5 py-1 text-[10px] rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800">해제</button>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-stone-300"><Weight className="w-3.5 h-3.5 text-amber-400" />소지 무게</span>
                  <span className="font-mono text-stone-200">{currentWeight.toFixed(1)} / {maxWeight.toFixed(1)} kg</span>
                </div>
                <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${gaugeBarColor}`} style={{ width: `${weightPercent}%` }} />
                </div>
                {encumbranceState.level !== 'NORMAL' && (
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-300"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{encumbranceState.description}</div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-800/70 text-[11px]">
                <span className="text-stone-500">보유 소지금</span>
                <span className="flex items-center gap-1 font-bold text-amber-300 font-mono"><Coins className="w-3.5 h-3.5" />{playerState.rupees.toLocaleString()} 루피</span>
              </div>
            </section>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {FILTER_OPTIONS.map((opt) => {
                const active = selectedCategory === opt.id;
                const count = opt.id === 'ALL' ? playerState.inventory.length : playerState.inventory.filter((i) => getItemFilterCategory(i) === opt.id).length;
                return (
                  <button key={opt.id} onClick={() => setSelectedCategory(opt.id)} className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${active ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'}`}>
                    {opt.label} <span className="ml-0.5 text-[9px] opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>

            {filteredItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
                <PackageOpen className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs">해당 분류의 아이템이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                {filteredItems.map((item, index) => {
                  const selected = selectedItem === item;
                  const singleWeight = getItemSingleWeight(item);
                  const totalWeight = calculateItemTotalWeight(item);
                  const itemDef = getItemDefinition(item.id || item.name);
                  return (
                    <button
                      key={`${item.id || item.name}-${index}`}
                      onClick={() => openItem(item)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-center gap-3 group ${selected ? 'border-amber-500/60 bg-amber-950/20' : 'border-stone-800 bg-stone-900/45 hover:border-stone-700 hover:bg-stone-900/75'}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden shrink-0">
                        {(item.illustrationUrl || itemDef?.illustrationUrl) ? (
                          <IllustrationImage src={item.illustrationUrl || itemDef?.illustrationUrl} alt="" className="w-full h-full object-contain" />
                        ) : <Package className="w-4 h-4 text-stone-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5"><span className="text-xs font-semibold text-stone-200 truncate">{item.name}</span><span className="text-[10px] font-mono text-amber-400">×{item.quantity}</span></div>
                        <div className="text-[10px] text-stone-500 mt-0.5">개당 {singleWeight.toFixed(1)}kg · 총 {totalWeight.toFixed(1)}kg</div>
                        <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{item.description || itemDef?.description || inferItemMetadata(item.id || item.name, item.description).description}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-amber-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="hidden md:flex min-h-0 flex-col bg-stone-900/25">
            {selectedItem && preview ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-5 space-y-4">
                <div className="aspect-[4/3] max-h-[34vh] rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden p-2">
                  {preview.illustrationUrl ? (
                    <IllustrationImage src={preview.illustrationUrl} alt={selectedItem.name} className="w-full h-full object-contain object-center" />
                  ) : (
                    <div className="text-center text-stone-600"><ImageIcon className="w-9 h-9 mx-auto mb-2" /><span className="text-[10px]">아이템 삽화 영역</span></div>
                  )}
                </div>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="text-[10px] text-amber-400 font-semibold">{preview.categoryLabel}</div><h3 className="text-base font-bold text-stone-100 mt-0.5">{selectedItem.name}</h3></div>
                    <span className="text-xs font-mono text-stone-400">×{selectedItem.quantity}</span>
                  </div>
                  {selectedItem.quality && <div className="mt-2 inline-flex px-2 py-1 rounded-md bg-stone-800 border border-stone-700 text-[10px] text-stone-300">품질 · {QUALITY_KOREAN[selectedItem.quality] || selectedItem.quality}</div>}
                </div>
                <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 mb-1.5"><Info className="w-3.5 h-3.5" />고유 설명</div>
                  <p className="text-xs leading-5 text-stone-300 whitespace-pre-wrap">{preview.description}</p>
                  <p className="text-[11px] leading-5 text-sky-200/80 mt-2 border-t border-sky-900/30 pt-2"><span className="font-semibold text-sky-300">사용처</span> · {preview.usageHint.replace(/^사용처:\s*/, '')}</p>
                  {preview.flavorText && <p className="text-[11px] leading-5 text-amber-200/70 italic mt-2 border-t border-stone-800 pt-2">{preview.flavorText}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-stone-950/60 border border-stone-800 p-2"><span className="text-stone-500 block">개당 무게</span><span className="text-stone-200 font-mono">{getItemSingleWeight(selectedItem).toFixed(1)} kg</span></div>
                  <div className="rounded-lg bg-stone-950/60 border border-stone-800 p-2"><span className="text-stone-500 block">총 무게</span><span className="text-stone-200 font-mono">{calculateItemTotalWeight(selectedItem).toFixed(1)} kg</span></div>
                </div>
                <button onClick={() => setDetailItem(selectedItem)} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors">상세 정보 · 사용 / 장착</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-600 p-8 text-center"><Package className="w-10 h-10 mb-3" /><p className="text-xs">왼쪽에서 아이템을 선택하세요.</p></div>
            )}
          </aside>
        </div>
      </div>

      <ItemDetailModal
        item={detailItem}
        playerState={playerState}
        onClose={() => setDetailItem(null)}
        onUseItem={(name) => { onUseItem(name); setDetailItem(null); }}
        onEquipBag={(bagId) => { if (onEquipBag) onEquipBag(bagId); setDetailItem(null); }}
        onUnequipBag={() => { if (onUnequipBag) onUnequipBag(); setDetailItem(null); }}
        onDiscardItem={(itemNameOrId, qty) => { if (onDiscardItem) onDiscardItem(itemNameOrId, qty); setDetailItem(null); }}
      />
    </div>
  );
}
