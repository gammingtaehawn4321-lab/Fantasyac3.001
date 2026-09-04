import React from 'react';
import IllustrationImage from './IllustrationImage';
import {
  X,
  Package,
  Sparkles,
  Weight,
  Layers,
  Shield,
  Sword,
  Backpack,
  Key,
  BookOpen,
  Wrench,
  Flame,
  Heart,
  Zap,
  Brain,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Scroll,
} from 'lucide-react';
import { InventoryItem, PlayerState, ItemCategory } from '../types';
import {
  getItemSingleWeight,
  calculateItemTotalWeight,
  getBagDefinition,
  BAG_TYPE_KOREAN,
  BAG_RARITY_KOREAN,
} from '../data/bags';
import { getItemDefinition, inferItemMetadata, inferUsageHint } from '../data/items/itemDatabase';
import {
  EQUIPMENT_DATABASE,
  EQUIPMENT_SLOT_KOREAN,
  WEAPON_TYPE_KOREAN,
  ARMOR_TYPE_KOREAN,
  EQUIPMENT_GRADE_VISUALS,
  QUALITY_LABEL,
  getEquipmentGrade,
  getEquipmentTier,
  getEquipmentQuality,
  getEquipmentSetDefinition,
  getEquippedSetCount,
} from '../data/equipment';

export interface ItemDetailModalProps {
  item: InventoryItem | null;
  playerState: PlayerState;
  onClose: () => void;
  onUseItem?: (itemName: string) => void;
  onEquipBag?: (bagId: string) => void;
  onUnequipBag?: () => void;
  onDiscardItem?: (itemNameOrId: string, quantity: number) => void;
}

const CATEGORY_KOREAN: Record<ItemCategory, string> = {
  CONSUMABLE: '소모품',
  MATERIAL: '재료',
  EQUIPMENT: '장비',
  KEY: '열쇠',
  QUEST: '퀘스트 아이템',
  MAP: '지도',
  TOOL: '도구',
  BOOK: '서적 / 문서',
  DOCUMENT: '문서',
  GIFT: '선물',
  VALUABLE: '귀중품',
  MISC: '기타 물품',
};

const STAT_KOREAN: Record<string, string> = {
  physicalAttack: '물리 공격력',
  physicalDefense: '물리 방어력',
  magicAttack: '마법 공격력',
  magicDefense: '마법 방어력',
  accuracy: '명중률',
  evasion: '회피율',
  criticalChance: '치명타율',
  criticalDamage: '치명타 피해',
  physicalPenetration: '물리 관통력',
  magicPenetration: '마법 관통력',
  elementalPenetration: '속성 관통력',
  actionSpeed: '행동 속도',
  maxCost: '최대 COST',
  costRegen: 'COST 회복',
  statusHitRate: '상태이상 적중',
  statusResistance: '상태이상 저항',
  maxHp: '최대 HP',
  maxMp: '최대 MP',
  maxSanity: '최대 정신력',
  tenacity: '강인함',
  staggerResistance: '흐트러짐 저항',
  strength: '근력',
  vitality: '체력',
  agility: '민첩',
  intelligence: '지능',
  spirit: '정신',
  luck: '행운',
};

export function ItemDetailModal({
  item,
  playerState,
  onClose,
  onUseItem,
  onEquipBag,
  onUnequipBag,
  onDiscardItem,
}: ItemDetailModalProps) {
  if (!item) return null;

  // 1. 기존 데이터베이스 조회
  const singleWeight = getItemSingleWeight(item);
  const totalWeight = calculateItemTotalWeight(item);

  const bagDef = item.bagId
    ? getBagDefinition(item.bagId)
    : getBagDefinition(item.id || item.name);
  const isBag = !!bagDef;
  const isEquippedBag = isBag && bagDef && playerState.equippedBagId === bagDef.id;

  const equipDef =
    (item.equipmentId && EQUIPMENT_DATABASE[item.equipmentId]) ||
    (item.id && EQUIPMENT_DATABASE[item.id]) ||
    EQUIPMENT_DATABASE[item.name];
  const isEquipment = !!equipDef;

  const itemDef = item.id ? getItemDefinition(item.id) : getItemDefinition(item.name);
  const inferredMeta = inferItemMetadata(item.id || item.name, item.description);

  // 2. 카테고리 판별
  let categoryLabel = '기타 물품';
  if (isBag) {
    categoryLabel = '가방';
  } else if (isEquipment) {
    categoryLabel = '장비';
  } else if (item.category && CATEGORY_KOREAN[item.category]) {
    categoryLabel = CATEGORY_KOREAN[item.category];
  } else if (itemDef?.category && CATEGORY_KOREAN[itemDef.category]) {
    categoryLabel = CATEGORY_KOREAN[itemDef.category];
  } else {
    categoryLabel = CATEGORY_KOREAN[inferredMeta.category];
  }

  // 3. 중요 아이템 (폐기 불가) 판별
  const isQuestOrKey =
    itemDef?.category === 'QUEST' ||
    itemDef?.category === 'KEY' ||
    inferredMeta.category === 'QUEST' ||
    inferredMeta.category === 'KEY' ||
    item.category === 'QUEST' ||
    item.category === 'KEY' ||
    item.name.includes('열쇠') ||
    item.name.includes('인장') ||
    item.name.includes('비전서') ||
    item.name.includes('퀘스트') ||
    item.name.includes('징표') ||
    item.name.includes('문장');

  // 4. 소모품 판별
  const isConsumable =
    !isBag &&
    !isEquipment &&
    (itemDef?.usable ||
      inferredMeta.usable ||
      inferredMeta.category === 'MAP' ||
      item.category === 'MAP' ||
      item.category === 'CONSUMABLE' ||
      itemDef?.category === 'CONSUMABLE' ||
      item.name.includes('약') ||
      item.name.includes('포션') ||
      item.name.includes('음식') ||
      item.name.includes('스크롤'));

  // 5. 설명 텍스트 (설명 우선순위: item 인스턴스 > ItemDefinition > 장비/가방 Definition)
  const displayDescription =
    item.description ||
    itemDef?.description ||
    equipDef?.description ||
    bagDef?.description ||
    equipDef?.equipDescription ||
    inferredMeta.description;

  // 6. 플레이버 텍스트 (우선순위: item 인스턴스 > ItemDefinition > 장비/가방 Definition)
  const displayFlavorText =
    item.flavorText ||
    itemDef?.flavorText ||
    equipDef?.flavorText ||
    bagDef?.flavorText ||
    null;

  const displayUsageHint = itemDef?.usageHint || (bagDef
    ? `사용처: 가방 슬롯에 장착하여 소지 무게 한도를 +${bagDef.bonusCarryWeight.toFixed(1)}kg 확장합니다.`
    : inferUsageHint(item.name, itemDef?.category || inferredMeta.category, itemDef?.uses));

  // 7. 삽화 이미지 URL
  const illustrationUrl =
    item.illustrationUrl ||
    itemDef?.illustrationUrl ||
    equipDef?.illustrationUrl ||
    bagDef?.illustrationUrl ||
    null;

  // 카테고리별 중립 아이콘
  const renderCategoryIcon = () => {
    if (isBag) return <Backpack className="w-16 h-16 text-amber-400/80" />;
    if (isEquipment) {
      if (equipDef?.equipmentType === 'WEAPON') {
        return <Sword className="w-16 h-16 text-amber-400/80" />;
      }
      return <Shield className="w-16 h-16 text-blue-400/80" />;
    }
    if (categoryLabel.includes('열쇠') || itemDef?.category === 'KEY') {
      return <Key className="w-16 h-16 text-yellow-400/80" />;
    }
    if (categoryLabel.includes('소모품') || isConsumable) {
      return <Flame className="w-16 h-16 text-emerald-400/80" />;
    }
    if (categoryLabel.includes('서적') || categoryLabel.includes('문서') || itemDef?.category === 'BOOK') {
      return <BookOpen className="w-16 h-16 text-indigo-400/80" />;
    }
    if (categoryLabel.includes('도구') || itemDef?.category === 'TOOL') {
      return <Wrench className="w-16 h-16 text-stone-400/80" />;
    }
    if (categoryLabel.includes('재료') || itemDef?.category === 'MATERIAL') {
      return <Layers className="w-16 h-16 text-amber-500/80" />;
    }
    return <Package className="w-16 h-16 text-stone-400/80" />;
  };

  return (
    <div
      id="item-detail-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="item-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-stone-200"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">
              {categoryLabel}
            </span>
            <span className="text-xs text-stone-400 font-mono">소지 수량: ×{item.quantity}</span>
          </div>
          <button
            id="item-detail-close-btn"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. 상단 삽화 영역 */}
          <div className="w-full h-44 rounded-lg bg-stone-950 border border-stone-800/80 flex flex-col items-center justify-center overflow-hidden relative group">
            {illustrationUrl ? (
              <IllustrationImage
                src={illustrationUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-stone-500">
                {renderCategoryIcon()}
                <span className="text-[11px] text-stone-500 font-medium">
                  등록된 아이템 삽화 없음
                </span>
              </div>
            )}

            {/* 중요 물품 배지 */}
            {isQuestOrKey && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span>중요 물품</span>
              </div>
            )}

            {/* 가방 장착 여부 배지 */}
            {isEquippedBag && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>현재 장착 중인 가방</span>
              </div>
            )}
          </div>

          {/* 2. 기본 정보: 이름 및 무게 */}
          <div className="space-y-1.5 pb-3 border-b border-stone-800/80">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-bold text-stone-100">{item.name}</h2>
              <span className="text-amber-400 font-mono font-bold text-sm">×{item.quantity}</span>
            </div>

            {/* 무게 및 규격 정보 */}
            <div className="flex items-center gap-4 text-stone-400 text-[11px]">
              <div className="flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-stone-500" />
                <span>개당: <strong className="text-stone-300">{singleWeight.toFixed(1)}kg</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>총 무게: <strong className="text-stone-300">{totalWeight.toFixed(1)}kg</strong></span>
              </div>
              {itemDef?.size && (
                <span className="text-stone-500 font-mono">크기: {itemDef.size}</span>
              )}
            </div>
          </div>

          {/* 3. 아이템 설명 (Description) */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-stone-400">설명</h3>
            <p className="text-stone-300 leading-relaxed bg-stone-950/40 p-2.5 rounded-lg border border-stone-800/60">
              {displayDescription}
            </p>
          </div>

          {/* 4. 실제 사용처 */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-sky-300">사용처</h3>
            <p className="text-sky-100/90 leading-relaxed bg-sky-950/20 p-2.5 rounded-lg border border-sky-900/40">
              {displayUsageHint.replace(/^사용처:\s*/, '')}
            </p>
          </div>

          {/* 4. 플레이버 텍스트 (Flavor Text - 있을 때만 표시) */}
          {displayFlavorText && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400/90">
                <Scroll className="w-3 h-3 text-amber-500" />
                <span>배경 기록</span>
              </div>
              <p className="text-stone-400 italic leading-relaxed bg-amber-950/10 p-2.5 rounded-lg border border-amber-900/30">
                &ldquo;{displayFlavorText}&rdquo;
              </p>
            </div>
          )}

          {/* 5. 아이템 종류별 특화 상세 정보 */}

          {/* (A) 가방 세부 정보 */}
          {isBag && bagDef && (
            <div className="space-y-2 p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg">
              <div className="flex items-center justify-between text-amber-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Backpack className="w-4 h-4 text-amber-400" />
                  가방 사양
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/60">
                  {BAG_TYPE_KOREAN[bagDef.bagType]} · {BAG_RARITY_KOREAN[bagDef.rarity]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
                <div>자체 무게: <strong className="text-amber-200">{bagDef.weight.toFixed(1)}kg</strong></div>
                <div>운반 용량 증가: <strong className="text-emerald-400">+{bagDef.bonusCarryWeight.toFixed(1)}kg</strong></div>
              </div>

              {bagDef.effectDescription && (
                <div className="text-[11px] text-amber-300/90 pt-1 border-t border-amber-800/30">
                  ✨ {bagDef.effectDescription}
                </div>
              )}
            </div>
          )}

          {/* (B) 장비 세부 정보 */}
          {isEquipment && equipDef && (
            <div className="space-y-2 p-3 bg-stone-950/60 border border-stone-800 rounded-lg">
              <div className="flex items-center justify-between text-stone-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  {equipDef.equipmentType === 'WEAPON' ? (
                    <Sword className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Shield className="w-4 h-4 text-blue-400" />
                  )}
                  장비 정보
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  슬롯: {EQUIPMENT_SLOT_KOREAN[equipDef.slot] || equipDef.slot}
                </span>
              </div>

              {/* 무기/방어구 타입 */}
              <div className="flex items-center gap-2 text-[11px] text-stone-400">
                {equipDef.weaponType && (
                  <span>무기 종류: <strong className="text-stone-300">{WEAPON_TYPE_KOREAN[equipDef.weaponType] || equipDef.weaponType}</strong></span>
                )}
                {equipDef.armorType && (
                  <span>방어구 종류: <strong className="text-stone-300">{ARMOR_TYPE_KOREAN[equipDef.armorType] || equipDef.armorType}</strong></span>
                )}
                {equipDef.requiredLevel && (
                  <span className="font-mono">요구 레벨: Lv.{equipDef.requiredLevel}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/30 text-cyan-300">T{getEquipmentTier(equipDef)}</span>
                <span className="px-1.5 py-0.5 rounded border border-stone-700 bg-stone-900 text-stone-300">{EQUIPMENT_GRADE_VISUALS[getEquipmentGrade(equipDef)].label}</span>
                <span className="px-1.5 py-0.5 rounded border border-amber-900/60 bg-amber-950/20 text-amber-300">{QUALITY_LABEL[getEquipmentQuality(equipDef)]}</span>
              </div>

              {equipDef.setId && getEquipmentSetDefinition(equipDef.setId) && (() => {
                const setDef = getEquipmentSetDefinition(equipDef.setId)!;
                const equippedCount = getEquippedSetCount(playerState.equipment, equipDef.setId);
                return (
                  <div className="pt-2 border-t border-emerald-900/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300">{setDef.name}</span>
                      <span className="text-[10px] text-emerald-400">{equippedCount}/{Math.max(setDef.pieceItemIds.length, ...setDef.bonuses.map((bonus) => bonus.requiredPieces))} 장착</span>
                    </div>
                    {setDef.bonuses.map((bonus) => {
                      const active = equippedCount >= bonus.requiredPieces;
                      return (
                        <div key={`${setDef.id}_${bonus.requiredPieces}`} className={`text-[10px] ${active ? 'text-emerald-300' : 'text-stone-500'}`}>
                          [{bonus.requiredPieces}세트] {bonus.description} {active ? '✓' : ''}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* 기본 스탯 */}
              {equipDef.baseStats && Object.keys(equipDef.baseStats).length > 0 && (
                <div className="pt-2 border-t border-stone-800 space-y-1">
                  <span className="text-[10px] text-stone-500 font-semibold">기본 능력치</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(equipDef.baseStats).map(([statKey, val]) => (
                      <div key={statKey} className="flex justify-between bg-stone-900/60 px-2 py-0.5 rounded border border-stone-800/40">
                        <span className="text-stone-400">{STAT_KOREAN[statKey] || statKey}</span>
                        <span className="font-bold text-amber-300">+{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 스탯 보정치 */}
              {equipDef.statModifiers && Object.keys(equipDef.statModifiers).length > 0 && (
                <div className="pt-2 border-t border-stone-800 space-y-1">
                  <span className="text-[10px] text-stone-500 font-semibold">스탯 보정</span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(equipDef.statModifiers).map(([statKey, val]) => (
                      <div key={statKey} className="flex justify-between bg-stone-900/60 px-2 py-0.5 rounded border border-stone-800/40">
                        <span className="text-stone-400">{STAT_KOREAN[statKey] || statKey}</span>
                        <span className="font-bold text-emerald-400">+{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 전투 연출 설명 */}
              {equipDef.combatDescription && (
                <p className="text-[11px] text-stone-400 italic pt-1 border-t border-stone-800/50">
                  &ldquo;{equipDef.combatDescription}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* (C) 소모품 효과 정보 */}
          {itemDef?.useEffect && (
            <div className="space-y-1.5 p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                사용 효과
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {itemDef.useEffect.hpDelta !== undefined && itemDef.useEffect.hpDelta !== 0 && (
                  <div className="flex items-center gap-1 text-red-300">
                    <Heart className="w-3 h-3" />
                    <span>HP {itemDef.useEffect.hpDelta > 0 ? `+${itemDef.useEffect.hpDelta}` : itemDef.useEffect.hpDelta}</span>
                  </div>
                )}
                {itemDef.useEffect.mpDelta !== undefined && itemDef.useEffect.mpDelta !== 0 && (
                  <div className="flex items-center gap-1 text-blue-300">
                    <Zap className="w-3 h-3" />
                    <span>MP {itemDef.useEffect.mpDelta > 0 ? `+${itemDef.useEffect.mpDelta}` : itemDef.useEffect.mpDelta}</span>
                  </div>
                )}
                {itemDef.useEffect.sanityDelta !== undefined && itemDef.useEffect.sanityDelta !== 0 && (
                  <div className="flex items-center gap-1 text-purple-300">
                    <Brain className="w-3 h-3" />
                    <span>정신력 {itemDef.useEffect.sanityDelta > 0 ? `+${itemDef.useEffect.sanityDelta}` : itemDef.useEffect.sanityDelta}</span>
                  </div>
                )}
                {itemDef.useEffect.buffName && (
                  <div className="col-span-2 text-amber-300">
                    부여 효과: <strong>{itemDef.useEffect.buffName}</strong>
                  </div>
                )}
              </div>
              {itemDef.useEffect.message && (
                <p className="text-[11px] text-stone-300 pt-1 border-t border-emerald-800/30">
                  {itemDef.useEffect.message}
                </p>
              )}
            </div>
          )}

          {/* (D) 열쇠 정보 (스포일러 방지) */}
          {(itemDef?.category === 'KEY' || item.name.includes('열쇠') || item.name.includes('인장')) && (
            <div className="space-y-1.5 p-3 bg-yellow-950/20 border border-yellow-800/40 rounded-lg text-[11px]">
              <div className="flex items-center gap-1.5 text-yellow-300 font-semibold">
                <Key className="w-4 h-4 text-yellow-400" />
                열쇠 및 잠금 해제구
              </div>
              <p className="text-stone-300">
                {itemDef?.isReusableKey ? '지속적으로 사용할 수 있는 영구 열쇠입니다.' : '사용 시 소모되거나 고정될 수 있는 열쇠입니다.'}
              </p>
            </div>
          )}

          {/* (E) 서적 및 지식 정보 */}
          {itemDef?.bookKnowledge && (
            <div className="space-y-1.5 p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-lg text-[11px]">
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                서적 및 지식 기록
              </div>
              {itemDef.bookKnowledge.exp && (
                <p className="text-stone-300">열람 시 경험치 획득: <strong className="text-indigo-300">+{itemDef.bookKnowledge.exp} EXP</strong></p>
              )}
              {itemDef.bookKnowledge.loreText && (
                <p className="text-stone-300 italic pt-1 border-t border-indigo-800/30">
                  &ldquo;{itemDef.bookKnowledge.loreText}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* 6. 하단 액션 버튼 영역 */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between gap-2">
          {/* 좌측: 버리기 버튼 (중요 물품이 아닐 때만 노출) */}
          <div>
            {onDiscardItem && !isQuestOrKey ? (
              <button
                id="item-detail-discard-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`[${item.name}]을(를) 1개 버리시겠습니까?`)) {
                    onDiscardItem(item.id || item.name, 1);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>버리기</span>
              </button>
            ) : isQuestOrKey ? (
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-stone-600" />
                폐기 불가 물품
              </span>
            ) : null}
          </div>

          {/* 우측: 장착/해제/사용/닫기 액션 */}
          <div className="flex items-center gap-2">
            {/* 가방 장착 / 해제 */}
            {isBag && bagDef && (
              isEquippedBag ? (
                onUnequipBag && (
                  <button
                    id="item-detail-unequip-bag-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnequipBag();
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg transition-colors cursor-pointer"
                  >
                    가방 해제
                  </button>
                )
              ) : (
                onEquipBag && (
                  <button
                    id="item-detail-equip-bag-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEquipBag(bagDef.id);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Backpack className="w-3.5 h-3.5" />
                    <span>가방 장착</span>
                  </button>
                )
              )
            )}

            {/* 소모품 사용 */}
            {isConsumable && onUseItem && (
              <button
                id="item-detail-use-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseItem(item.name);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>사용</span>
              </button>
            )}

            {/* 닫기 버튼 */}
            <button
              id="item-detail-cancel-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
