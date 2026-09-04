import React, { useState } from 'react';
import { PlayerState } from '../types';
import { AdaptiveCharacterImage } from './AdaptiveCharacterImage';
import IllustrationImage from './IllustrationImage';
import {
  EquipmentSlot,
  EQUIPMENT_DATABASE,
  EquipmentDefinition,
  EQUIPMENT_SLOT_KOREAN,
  EQUIPMENT_GRADE_VISUALS,
  getEquipmentGrade,
  getEquipmentTier,
  getEquipmentQuality,
  QUALITY_LABEL,
  getEquipmentSetDefinition,
  getEquippedSetCount,
  resolveEquipmentSynergies,
  EquipmentEnhancementMilestone,
  RunewordType,
  EQUIPMENT_ENHANCEMENT_MILESTONES,
  RUNE_LEVEL_BY_MILESTONE,
  RUNEWORD_DEFINITIONS,
  normalizeEquipmentEnhancementState,
  getEquipmentEnhancementCost,
  getEquipmentEnhancementMultiplier,
  resolveRunewordLoadout,
} from '../data/equipment';
import { createBattleActorFromCharacter } from '../combat/battleEngine';
import {
  getBagDefinition,
  calculateInventoryWeight,
  calculatePartyCarryWeight,
  BAG_TYPE_KOREAN,
  BAG_RARITY_KOREAN,
} from '../data/bags';
import {
  Shield,
  Swords,
  Sparkles,
  AlertCircle,
  ArrowUpCircle,
  UserRound,
  Lock,
  Package,
  Crown,
  Shirt,
  Footprints,
  Hand,
  Wind,
  Gem,
  CircleDot,
  Radio,
  X,
} from 'lucide-react';

interface EquipmentTabProps {
  playerState: PlayerState;
  onEquipItem: (slot: EquipmentSlot, equipmentId: string) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onEquipBag?: (bagId: string) => void;
  onUnequipBag?: () => void;
  onEnhanceEquipment?: (equipmentId: string) => void;
  onSocketRuneword?: (equipmentId: string, milestone: EquipmentEnhancementMilestone, runeword: RunewordType) => void;
}

// 13개 전투 장비 슬롯 정보 및 통일된 벡터 아이콘 맵핑
interface SlotConfig {
  slot: EquipmentSlot;
  name: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'WEAPON' | 'ARMOR' | 'ACCESSORY';
}

const COMBAT_SLOT_CONFIGS: Record<EquipmentSlot, SlotConfig> = {
  HEAD: { slot: 'HEAD', name: '머리', subLabel: '투구', icon: Crown, group: 'ARMOR' },
  NECKLACE: { slot: 'NECKLACE', name: '목걸이', icon: CircleDot, group: 'ACCESSORY' },
  CHEST: { slot: 'CHEST', name: '상의', subLabel: '갑옷', icon: Shirt, group: 'ARMOR' },
  GLOVES: { slot: 'GLOVES', name: '장갑', icon: Hand, group: 'ARMOR' },
  LEGS: { slot: 'LEGS', name: '하의', icon: Shirt, group: 'ARMOR' },
  BOOTS: { slot: 'BOOTS', name: '신발', icon: Footprints, group: 'ARMOR' },
  CLOAK: { slot: 'CLOAK', name: '망토', icon: Wind, group: 'ARMOR' },
  EARRING: { slot: 'EARRING', name: '귀걸이', icon: Gem, group: 'ACCESSORY' },
  BRACELET: { slot: 'BRACELET', name: '팔찌', icon: Radio, group: 'ACCESSORY' },
  RING_1: { slot: 'RING_1', name: '반지 1', icon: Sparkles, group: 'ACCESSORY' },
  RING_2: { slot: 'RING_2', name: '반지 2', icon: Sparkles, group: 'ACCESSORY' },
  MAIN_HAND: { slot: 'MAIN_HAND', name: '주무기', icon: Swords, group: 'WEAPON' },
  OFF_HAND: { slot: 'OFF_HAND', name: '보조무기', icon: Shield, group: 'WEAPON' },
};

// 희귀도 스타일
const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  COMMON: {
    border: 'border-stone-700/70 hover:border-stone-500',
    bg: 'bg-stone-900/80',
    text: 'text-stone-200',
    badge: 'bg-stone-800 text-stone-300 border-stone-700',
  },
  UNCOMMON: {
    border: 'border-emerald-700/60 hover:border-emerald-500',
    bg: 'bg-emerald-950/25',
    text: 'text-emerald-300',
    badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  },
  RARE: {
    border: 'border-sky-600/60 hover:border-sky-400',
    bg: 'bg-sky-950/25',
    text: 'text-sky-300',
    badge: 'bg-sky-900/60 text-sky-300 border-sky-600',
  },
  EPIC: {
    border: 'border-purple-600/60 hover:border-purple-400',
    bg: 'bg-purple-950/25',
    text: 'text-purple-300',
    badge: 'bg-purple-900/60 text-purple-300 border-purple-600',
  },
  LEGENDARY: {
    border: 'border-amber-500/70 hover:border-amber-400',
    bg: 'bg-amber-950/30',
    text: 'text-amber-300',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-500',
  },
};

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  playerState,
  onEquipItem,
  onUnequipItem,
  onEquipBag,
  onUnequipBag,
  onEnhanceEquipment,
  onSocketRuneword,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | 'BAG' | null>('MAIN_HAND');
  const [selectedItemDetail, setSelectedItemDetail] = useState<EquipmentDefinition | null>(null);
  const [portraitError, setPortraitError] = useState(false);

  // 종합 전투 파생 수치
  const derivedStats = createBattleActorFromCharacter(playerState, true).stats;
  const activeSynergies = resolveEquipmentSynergies(playerState.equipment);
  const equippedIds = Object.values(playerState.equipment).filter(Boolean) as string[];
  const runewordLoadout = resolveRunewordLoadout(equippedIds, playerState.equipmentEnhancements);

  // 양손 무기 착용 여부 판별 (보조무기 슬롯 잠금 여부)
  const mainHandEquippedId = playerState.equipment.MAIN_HAND;
  const mainHandDef = mainHandEquippedId ? EQUIPMENT_DATABASE[mainHandEquippedId] : null;
  const isTwoHandedEquipped = Boolean(
    mainHandDef && (mainHandDef.isTwoHanded || mainHandDef.weaponStyle === 'TWO_HANDED')
  );

  // 장착 가방 정보 및 무게
  const equippedBagDef = playerState.equippedBagId ? getBagDefinition(playerState.equippedBagId) : null;
  const currentWeight = calculateInventoryWeight(playerState.inventory, playerState.equippedBagId);
  const maxCarryWeight = calculatePartyCarryWeight(playerState);

  // 인벤토리 내 현재 선택 슬롯에 장착 가능한 아이템 목록 추출
  const availableInventoryEquipment = playerState.inventory.filter((inv) => {
    if (!inv.equipmentId) return false;
    const def = EQUIPMENT_DATABASE[inv.equipmentId];
    if (!def || !selectedSlot || selectedSlot === 'BAG') return false;

    if (selectedSlot === 'MAIN_HAND') return def.slot === 'MAIN_HAND' || def.weaponStyle === 'TWO_HANDED';
    if (selectedSlot === 'OFF_HAND') return def.slot === 'OFF_HAND';
    if (selectedSlot === 'RING_1' || selectedSlot === 'RING_2') return def.slot === 'RING_1' || def.slot === 'RING_2';
    return def.slot === selectedSlot;
  });

  // 인벤토리 내 보유 중인 교체 가능 가방 목록 추출
  const availableInventoryBags = playerState.inventory.filter((inv) => {
    const bagDef = getBagDefinition(inv.bagId || inv.id || inv.name);
    return Boolean(bagDef);
  });

  // 슬롯 카드 렌더링 헬퍼
  const renderSlotCard = (slot: EquipmentSlot, isCompact = false) => {
    const config = COMBAT_SLOT_CONFIGS[slot];
    const equippedId = playerState.equipment[slot];
    const def = equippedId ? EQUIPMENT_DATABASE[equippedId] : null;
    const isSelected = selectedSlot === slot;
    const SlotIcon = config.icon;

    // 보조무기이고 주무기가 양손무기인 경우 잠금 처리
    const isOffHandLocked = slot === 'OFF_HAND' && isTwoHandedEquipped;

    const rarity = def?.rarity || 'COMMON';
    const style = RARITY_STYLES[rarity] || RARITY_STYLES.COMMON;

    // 이미지 필드 확인 (illustrationUrl, imageUrl, iconUrl, artId 등)
    const itemImage = (def as any)?.illustrationUrl || (def as any)?.imageUrl || (def as any)?.iconUrl;

    if (isOffHandLocked) {
      return (
        <div
          key={slot}
          id={`equip-slot-${slot}`}
          className="relative p-2.5 rounded-xl border border-stone-800 bg-stone-950/60 opacity-60 cursor-not-allowed select-none transition-all flex flex-col justify-between min-h-[72px]"
          title="양손 무기 착용 중으로 보조장비 슬롯이 비활성화되었습니다."
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-400">{config.name}</span>
            <Lock className="w-3.5 h-3.5 text-amber-500/80" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-7 h-7 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500">
              <SlotIcon className="w-3.5 h-3.5 text-stone-500" />
            </div>
            <div className="text-[11px] text-stone-400 font-medium truncate">양손 무기 사용 중</div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={slot}
        id={`equip-slot-${slot}`}
        onClick={() => {
          setSelectedSlot(slot);
          if (def) setSelectedItemDetail(def);
        }}
        className={`group relative p-2.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.97] flex flex-col justify-between min-h-[72px] ${
          isSelected
            ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/40'
            : def
            ? `${style.border} ${style.bg}`
            : 'border-stone-800/80 bg-stone-950/50 hover:border-stone-700 hover:bg-stone-900/40'
        }`}
      >
        {/* 상단 라벨 & 해제 버튼 */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-semibold text-stone-400 tracking-tight">
            {config.name}
          </span>
          {def && (
            <button
              id={`unequip-btn-${slot}`}
              onClick={(e) => {
                e.stopPropagation();
                onUnequipItem(slot);
                if (selectedItemDetail?.id === def.id) setSelectedItemDetail(null);
              }}
              className="text-[10px] text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 px-1.5 py-0.5 rounded border border-stone-800/80 transition-colors cursor-pointer"
              title="장착 해제"
            >
              해제
            </button>
          )}
        </div>

        {/* 중앙 내용: 아이콘/이미지 + 아이템 이름 */}
        <div className="flex items-center gap-2 mt-1.5">
          <div
            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border overflow-hidden ${
              def
                ? 'bg-stone-900/90 border-stone-700/80'
                : 'bg-stone-950/80 border-stone-800/90 text-stone-500'
            }`}
          >
            {itemImage ? (
              <IllustrationImage
                src={itemImage}
                alt={def?.name || ''}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <SlotIcon
                className={`w-4 h-4 ${
                  def ? (style.text.includes('amber') ? 'text-amber-400' : 'text-stone-300') : 'text-stone-500'
                }`}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {def ? (
              <div className="space-y-0.5">
                <div className={`text-xs font-bold truncate ${style.text}`}>{def.name}</div>
                <div className="text-[10px] text-stone-400 truncate">
                  T{getEquipmentTier(def)} · +{normalizeEquipmentEnhancementState(playerState.equipmentEnhancements?.[def.id]).level} · {EQUIPMENT_GRADE_VISUALS[getEquipmentGrade(def)].label} · {QUALITY_LABEL[getEquipmentQuality(def)]}
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-500 font-normal">비어 있음</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 가방 슬롯 렌더링
  const renderBagSlot = () => {
    const isSelected = selectedSlot === 'BAG';
    const bagDef = equippedBagDef;
    const bagStyle = bagDef ? RARITY_STYLES[bagDef.rarity] || RARITY_STYLES.COMMON : null;

    return (
      <div
        id="equip-slot-BAG"
        onClick={() => {
          setSelectedSlot('BAG');
          setSelectedItemDetail(null);
        }}
        className={`group relative p-2.5 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.97] flex flex-col justify-between min-h-[72px] ${
          isSelected
            ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/40'
            : bagDef
            ? `${bagStyle?.border} ${bagStyle?.bg}`
            : 'border-stone-800/80 bg-stone-950/50 hover:border-stone-700 hover:bg-stone-900/40'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-amber-400/90 tracking-tight">
              가방 (별도 슬롯)
            </span>
          </div>
          {bagDef && onUnequipBag && (
            <button
              id="unequip-bag-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUnequipBag();
              }}
              className="text-[10px] text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 px-1.5 py-0.5 rounded border border-stone-800/80 transition-colors cursor-pointer"
              title="가방 해제"
            >
              해제
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <div
            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border overflow-hidden ${
              bagDef ? 'bg-stone-900/90 border-stone-700/80' : 'bg-stone-950/80 border-stone-800/90 text-stone-500'
            }`}
          >
            <Package className={`w-4 h-4 ${bagDef ? 'text-amber-400' : 'text-stone-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            {bagDef ? (
              <div className="space-y-0.5">
                <div className={`text-xs font-bold truncate ${bagStyle?.text}`}>{bagDef.name}</div>
                <div className="text-[10px] text-stone-400 truncate">
                  {BAG_TYPE_KOREAN[bagDef.bagType]} · +{bagDef.bonusCarryWeight}kg
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-500 font-normal">기본 주머니만 소지</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSetInfo = (def: EquipmentDefinition) => {
    if (!def.setId) return null;
    const setDef = getEquipmentSetDefinition(def.setId);
    if (!setDef) return null;
    const equippedCount = getEquippedSetCount(playerState.equipment, def.setId);
    return (
      <div className="mt-2 p-2.5 rounded-lg border border-emerald-800/50 bg-emerald-950/20 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-emerald-300">{setDef.name}</span>
          <span className="text-[10px] text-emerald-400">{equippedCount}/{Math.max(setDef.pieceItemIds.length, ...setDef.bonuses.map((bonus) => bonus.requiredPieces))} 장착</span>
        </div>
        {setDef.bonuses.map((bonus) => {
          const active = equippedCount >= bonus.requiredPieces;
          return (
            <div key={`${setDef.id}_${bonus.requiredPieces}`} className={`text-[10px] leading-relaxed ${active ? 'text-emerald-300' : 'text-stone-500'}`}>
              [{bonus.requiredPieces}세트] {bonus.description} {active ? '✓' : ''}
            </div>
          );
        })}
      </div>
    );
  };

  const hasValidPortrait = Boolean(playerState.profile?.portraitUrl && !portraitError);

  return (
    <div id="equipment-tab-root" className="flex flex-col lg:flex-row gap-5 p-3 sm:p-5 text-stone-200">
      {/* 1. 좌측 페이퍼돌 장비 영역 */}
      <div className="flex-1 bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between">
        {/* 상단 타이틀 바 */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-stone-100 tracking-wide">
              13슬롯 전투 장비
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">
            슬롯을 클릭하여 인벤토리의 장비를 장착하거나 교체합니다.
          </span>
        </div>

        {/* PC / 데스크탑: RPG 페이퍼돌 레이아웃 (캐릭터 중심 3분할) */}
        <div className="hidden md:grid md:grid-cols-12 gap-3.5 items-center">
          {/* 좌측 슬롯 컬럼 (방어구/신체 장비 계열: 머리, 목걸이, 상의, 장갑, 하의, 신발) */}
          <div className="col-span-4 space-y-2.5">
            {renderSlotCard('HEAD')}
            {renderSlotCard('NECKLACE')}
            {renderSlotCard('CHEST')}
            {renderSlotCard('GLOVES')}
            {renderSlotCard('LEGS')}
            {renderSlotCard('BOOTS')}
          </div>

          {/* 중앙: 캐릭터 초상화 (Portrait) */}
          <div className="col-span-4 flex flex-col items-center justify-center px-1">
            <AdaptiveCharacterImage
              src={hasValidPortrait ? playerState.profile?.portraitUrl : undefined}
              alt={playerState.characterName || '캐릭터'}
              onError={() => setPortraitError(true)}
              maxHeight="max-h-[360px]"
              containerClassName="shadow-xl"
              fallbackIcon={
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 text-stone-500">
                  <div className="w-14 h-14 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
                    <UserRound className="w-7 h-7 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-300">
                      {playerState.characterName || '모험가'}
                    </p>
                    <p className="text-[10px] text-stone-500">Lv.{playerState.level}</p>
                  </div>
                </div>
              }
            >
              {hasValidPortrait && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] z-10">
                    <span className="px-2 py-0.5 rounded-md bg-stone-900/90 border border-stone-700/80 text-stone-200 font-medium backdrop-blur-xs">
                      {playerState.characterClass || '모험가'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold backdrop-blur-xs">
                      Lv.{playerState.level}
                    </span>
                  </div>
                </>
              )}
            </AdaptiveCharacterImage>
          </div>

          {/* 우측 슬롯 컬럼 (망토 및 장신구 계열: 망토, 귀걸이, 팔찌, 반지1, 반지2) */}
          <div className="col-span-4 space-y-2.5">
            {renderSlotCard('CLOAK')}
            {renderSlotCard('EARRING')}
            {renderSlotCard('BRACELET')}
            {renderSlotCard('RING_1')}
            {renderSlotCard('RING_2')}
          </div>
        </div>

        {/* PC 하단: 주무기 & 보조무기 (중앙 강조) + 별도 가방 슬롯 */}
        <div className="hidden md:grid md:grid-cols-12 gap-3.5 mt-3.5 pt-3.5 border-t border-stone-800/80">
          <div className="col-span-4">{renderSlotCard('MAIN_HAND')}</div>
          <div className="col-span-4">{renderSlotCard('OFF_HAND')}</div>
          <div className="col-span-4">{renderBagSlot()}</div>
        </div>

        {/* 모바일 화면 (반응형 그리드): 캐릭터 이미지 상단 + 슬롯 그리드 */}
        <div className="md:hidden space-y-4">
          {/* 캐릭터 초상화 (모바일) */}
          <AdaptiveCharacterImage
            src={hasValidPortrait ? playerState.profile?.portraitUrl : undefined}
            alt={playerState.characterName || '캐릭터'}
            onError={() => setPortraitError(true)}
            maxHeight="max-h-[280px]"
            fallbackIcon={
              <div className="flex items-center gap-3 p-3 text-stone-400">
                <UserRound className="w-6 h-6 text-stone-500" />
                <div>
                  <div className="font-bold text-stone-200">{playerState.characterName || '모험가'}</div>
                  <div className="text-[10px] text-stone-400">Lv.{playerState.level} {playerState.characterClass}</div>
                </div>
              </div>
            }
          >
            {hasValidPortrait && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] z-10">
                  <span className="font-bold text-stone-200">{playerState.characterName || '모험가'}</span>
                  <span className="text-amber-400 font-semibold">Lv.{playerState.level}</span>
                </div>
              </>
            )}
          </AdaptiveCharacterImage>

          {/* 무기 2종 */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-stone-400">무기 & 보조</span>
            <div className="grid grid-cols-2 gap-2">
              {renderSlotCard('MAIN_HAND', true)}
              {renderSlotCard('OFF_HAND', true)}
            </div>
          </div>

          {/* 방어구 6종 */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-stone-400">방어구</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {renderSlotCard('HEAD', true)}
              {renderSlotCard('CHEST', true)}
              {renderSlotCard('GLOVES', true)}
              {renderSlotCard('LEGS', true)}
              {renderSlotCard('BOOTS', true)}
              {renderSlotCard('CLOAK', true)}
            </div>
          </div>

          {/* 장신구 5종 */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-stone-400">장신구</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {renderSlotCard('NECKLACE', true)}
              {renderSlotCard('EARRING', true)}
              {renderSlotCard('BRACELET', true)}
              {renderSlotCard('RING_1', true)}
              {renderSlotCard('RING_2', true)}
            </div>
          </div>

          {/* 가방 */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-stone-400">가방 (별도 슬롯)</span>
            {renderBagSlot()}
          </div>
        </div>

        {/* 하단: 종합 전투 능력치 및 적재 무게 요약 */}
        <div className="mt-4 pt-3.5 border-t border-stone-800/80 bg-stone-950/60 rounded-xl p-3 border border-stone-800/60 flex flex-wrap items-center justify-between gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="text-stone-400">
              물리 공격: <strong className="text-amber-300 font-bold">{derivedStats.physicalAttack}</strong>
            </span>
            <span className="text-stone-400">
              마법 공격: <strong className="text-indigo-300 font-bold">{derivedStats.magicAttack}</strong>
            </span>
            <span className="text-stone-400">
              물리 방어: <strong className="text-sky-300 font-bold">{derivedStats.physicalDefense}</strong>
            </span>
            <span className="text-stone-400">
              마법 방어: <strong className="text-purple-300 font-bold">{derivedStats.magicDefense}</strong>
            </span>
            <span className="text-stone-400">
              치명타: <strong className="text-rose-300 font-bold">{derivedStats.criticalChance}%</strong>
            </span>
            <span className="text-stone-400">
              행동 속도: <strong className="text-emerald-300 font-bold">{derivedStats.actionSpeed}</strong>
            </span>
          </div>

          {/* 소지 무게 */}
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <span>적재 무게:</span>
            <span
              className={`font-bold ${
                currentWeight > maxCarryWeight ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {currentWeight.toFixed(1)} / {maxCarryWeight.toFixed(1)} kg
            </span>
          </div>
        </div>
      </div>

      {/* 2. 우측 사이드 패널: 선택된 슬롯 교체 가능 장비 목록 & 상세 정보 */}
      <div className="w-full lg:w-84 bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
          <h4 className="font-bold text-xs sm:text-sm text-stone-200 flex items-center gap-1.5">
            <span>
              {selectedSlot === 'BAG'
                ? '[가방] 교체 가능 목록'
                : selectedSlot
                ? `[${COMBAT_SLOT_CONFIGS[selectedSlot]?.name || selectedSlot}] 교체 가능 장비`
                : '장비 슬롯 선택'}
            </span>
          </h4>
          <span className="text-[11px] text-stone-500 font-normal">
            {selectedSlot === 'BAG'
              ? `${availableInventoryBags.length}개 보유`
              : `${availableInventoryEquipment.length}개 보유`}
          </span>
        </div>

        {/* 장착 가능 아이템 목록 */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[320px] pr-1 custom-scrollbar">
          {selectedSlot === 'BAG' ? (
            availableInventoryBags.length === 0 ? (
              <div className="text-xs text-stone-500 text-center py-10 bg-stone-950/40 rounded-xl border border-dashed border-stone-800">
                인벤토리에 보유 중인 가방이 없습니다.
              </div>
            ) : (
              availableInventoryBags.map((invItem) => {
                const bagDef = getBagDefinition(invItem.bagId || invItem.id || invItem.name);
                if (!bagDef) return null;
                const isEquipped = playerState.equippedBagId === bagDef.id;
                const style = RARITY_STYLES[bagDef.rarity] || RARITY_STYLES.COMMON;

                return (
                  <div
                    key={invItem.name + (invItem.bagId || '')}
                    id={`bag-inv-item-${bagDef.id}`}
                    className={`p-3 rounded-xl border transition-all ${
                      isEquipped ? 'border-amber-500/80 bg-amber-950/30' : `${style.border} ${style.bg}`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className={`font-bold text-xs truncate ${style.text}`}>{bagDef.name}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {BAG_TYPE_KOREAN[bagDef.bagType]} · 추가 용량 +{bagDef.bonusCarryWeight}kg
                        </div>
                      </div>
                      {onEquipBag && !isEquipped && (
                        <button
                          id={`equip-bag-btn-${bagDef.id}`}
                          onClick={() => onEquipBag(bagDef.id)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow cursor-pointer shrink-0"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" /> 장착
                        </button>
                      )}
                      {isEquipped && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold shrink-0">
                          장착 중
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : availableInventoryEquipment.length === 0 ? (
            <div className="text-xs text-stone-500 text-center py-10 bg-stone-950/40 rounded-xl border border-dashed border-stone-800">
              가방에 장착 가능한{' '}
              {selectedSlot ? COMBAT_SLOT_CONFIGS[selectedSlot]?.name || selectedSlot : '장비'}가 없습니다.
            </div>
          ) : (
            availableInventoryEquipment.map((invItem) => {
              const def = EQUIPMENT_DATABASE[invItem.equipmentId!];
              if (!def) return null;
              const isSelectedDetail = selectedItemDetail?.id === def.id;
              const style = RARITY_STYLES[def.rarity] || RARITY_STYLES.COMMON;
              const gradeStyle = EQUIPMENT_GRADE_VISUALS[getEquipmentGrade(def)];

              return (
                <div
                  key={invItem.name + invItem.equipmentId}
                  id={`equip-inv-item-${def.id}`}
                  onClick={() => setSelectedItemDetail(def)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelectedDetail
                      ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/40'
                      : `${gradeStyle.borderClass} ${style.bg}`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className={`font-bold text-xs truncate ${style.text}`}>{def.name}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        T{getEquipmentTier(def)} · +{normalizeEquipmentEnhancementState(playerState.equipmentEnhancements?.[def.id]).level} · {EQUIPMENT_GRADE_VISUALS[getEquipmentGrade(def)].label} · {QUALITY_LABEL[getEquipmentQuality(def)]}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                        {def.equipDescription || def.effectDescription || '기본 성능'}
                      </div>
                    </div>
                    <button
                      id={`equip-btn-${def.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedSlot) {
                          onEquipItem(selectedSlot, def.id);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow cursor-pointer shrink-0"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" /> 장착
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 p-3 rounded-xl border border-indigo-800/50 bg-indigo-950/20 space-y-2">
          <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1"><Gem className="w-3 h-3" /> 룬워드 공명</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(Object.keys(RUNEWORD_DEFINITIONS) as RunewordType[]).map((word) => {
              const level = runewordLoadout.keywordLevels[word] || 0;
              return <div key={word} className={`rounded-lg border px-2 py-1.5 text-[10px] ${level > 0 ? 'border-indigo-700/60 bg-indigo-900/30 text-indigo-100' : 'border-stone-800 bg-stone-950/40 text-stone-600'}`}>
                <div className="font-bold">{RUNEWORD_DEFINITIONS[word].name} Lv.{level}</div>
                <div className="text-[9px] opacity-70">다음: {[5,12,24,40].find((n)=>n>level) ?? 'MAX'}</div>
              </div>;
            })}
          </div>
          {runewordLoadout.activeThresholds.length > 0 && <div className="space-y-1 pt-1 border-t border-indigo-900/50">
            {runewordLoadout.activeThresholds.map((t) => <div key={`${t.runeword}_${t.level}`} className="text-[9px] text-indigo-200/80"><b>{t.runewordName} {t.level}</b> · {t.name} — {t.description}</div>)}
          </div>}
        </div>

        {activeSynergies.length > 0 && (
          <div className="mt-4 p-3 rounded-xl border border-fuchsia-800/50 bg-fuchsia-950/20 space-y-1.5">
            <div className="text-[11px] font-bold text-fuchsia-300 flex items-center gap-1"><Sparkles className="w-3 h-3" /> 활성 장비 공명</div>
            {activeSynergies.map((synergy) => (
              <div key={synergy.id} className="text-[10px] text-fuchsia-200/90 leading-relaxed">
                <b>{synergy.name}</b> — {synergy.description}
              </div>
            ))}
          </div>
        )}

        {/* 선택된 장비의 세부 정보 영역 */}
        {selectedItemDetail && (
          <div className="mt-4 pt-3.5 border-t border-stone-800 text-xs space-y-2 bg-stone-950/70 p-3 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between font-bold">
              <span className="text-stone-100 text-xs sm:text-sm">{selectedItemDetail.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  RARITY_STYLES[selectedItemDetail.rarity]?.badge || 'bg-stone-800 text-stone-300'
                }`}
              >
                {selectedItemDetail.rarity}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 text-[10px]">
              <span className="px-1.5 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/30 text-cyan-300">T{getEquipmentTier(selectedItemDetail)}</span>
              <span className="px-1.5 py-0.5 rounded border border-stone-700 bg-stone-900 text-stone-300">{EQUIPMENT_GRADE_VISUALS[getEquipmentGrade(selectedItemDetail)].label}</span>
              <span className="px-1.5 py-0.5 rounded border border-amber-900/60 bg-amber-950/20 text-amber-300">{QUALITY_LABEL[getEquipmentQuality(selectedItemDetail)]}</span>
            </div>

            {(() => {
              const enhancement = normalizeEquipmentEnhancementState(playerState.equipmentEnhancements?.[selectedItemDetail.id]);
              const multiplier = getEquipmentEnhancementMultiplier(enhancement.level);
              const nextCost = enhancement.level < 20 ? getEquipmentEnhancementCost(selectedItemDetail, enhancement.level) : 0;
              return <div className="rounded-xl border border-amber-800/50 bg-amber-950/15 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-amber-300">강화 +{enhancement.level} / +20</div>
                    <div className="text-[9px] text-amber-100/60">기초 능력치 배율 ×{multiplier.toFixed(2)}</div>
                  </div>
                  {enhancement.level < 20 && <button onClick={() => onEnhanceEquipment?.(selectedItemDetail.id)} disabled={!onEnhanceEquipment || playerState.rupees < nextCost} className="px-2 py-1.5 rounded-lg bg-amber-600 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-[10px]">강화 · {nextCost} 루피</button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {EQUIPMENT_ENHANCEMENT_MILESTONES.map((milestone) => {
                    const word = enhancement.runeChoices[milestone];
                    const unlocked = enhancement.level >= milestone;
                    return <div key={milestone} className={`p-2 rounded-lg border ${unlocked ? 'border-indigo-800/60 bg-indigo-950/25' : 'border-stone-800 bg-stone-950/50 opacity-55'}`}>
                      <div className="flex justify-between text-[9px] mb-1"><b>+{milestone} 룬 슬롯</b><span>룬 Lv.{RUNE_LEVEL_BY_MILESTONE[milestone]}</span></div>
                      {!unlocked ? <div className="text-[9px] text-stone-500">+{milestone} 강화 시 해금</div> : word ? <div className="text-[10px] text-indigo-200 font-bold">{RUNEWORD_DEFINITIONS[word].name} · +{RUNE_LEVEL_BY_MILESTONE[milestone]}레벨</div> : <select defaultValue="" onChange={(e) => { const value=e.target.value as RunewordType; if(value) onSocketRuneword?.(selectedItemDetail.id, milestone, value); e.currentTarget.value=''; }} className="w-full bg-stone-950 border border-indigo-800/60 rounded px-1.5 py-1 text-[10px] text-indigo-100">
                        <option value="" disabled>룬워드 선택</option>
                        {(Object.keys(RUNEWORD_DEFINITIONS) as RunewordType[]).map((r)=><option key={r} value={r}>{RUNEWORD_DEFINITIONS[r].name}</option>)}
                      </select>}
                    </div>;
                  })}
                </div>
                <div className="text-[9px] text-stone-500">각인은 되돌릴 수 없는 선택입니다. +5/+10/+15/+20 슬롯은 각각 룬 레벨 1/2/3/4를 제공합니다.</div>
              </div>;
            })()}

            <p className="text-stone-400 text-[11px] leading-relaxed">
              {selectedItemDetail.equipDescription || selectedItemDetail.description}
            </p>
            {selectedItemDetail.effectDescription && (
              <div className="p-2 rounded-lg border border-violet-800/50 bg-violet-950/25 text-[10px] text-violet-200 leading-relaxed">
                <span className="font-bold text-violet-300">특수 효과</span> · {selectedItemDetail.effectDescription}
              </div>
            )}
            {selectedItemDetail.skillModifiers && selectedItemDetail.skillModifiers.length > 0 && (
              <div className="p-2 rounded-lg border border-cyan-800/50 bg-cyan-950/20 space-y-1">
                <div className="text-[10px] font-bold text-cyan-300">스킬 강화</div>
                {selectedItemDetail.skillModifiers.map((mod) => <div key={`${selectedItemDetail.id}_${mod.skillId}`} className="text-[10px] text-cyan-100/80">{mod.description}</div>)}
              </div>
            )}

            {renderSetInfo(selectedItemDetail)}

            {/* 기본 스탯 보너스 */}
            {selectedItemDetail.baseStats && (
              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 text-sky-400 font-medium">
                {Object.entries(selectedItemDetail.baseStats).map(([stat, val]) => (
                  <div key={stat}>
                    {stat}: +{val}
                  </div>
                ))}
              </div>
            )}

            {/* 스탯 수정자 */}
            {selectedItemDetail.statModifiers && (
              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 text-emerald-400 font-medium">
                {Object.entries(selectedItemDetail.statModifiers).map(([stat, val]) => (
                  <div key={stat}>
                    +{val} {stat}
                  </div>
                ))}
              </div>
            )}

            {/* 마법 무기 보너스 */}
            {selectedItemDetail.magicWeapon && (
              <div className="mt-2 p-2 bg-indigo-950/40 border border-indigo-800/50 rounded-lg text-[11px] text-indigo-300">
                <div className="font-semibold flex items-center gap-1 text-indigo-400">
                  <Sparkles className="w-3 h-3" /> 마법 무기 부여
                </div>
                <div>슬롯 용량: {selectedItemDetail.magicWeapon.spellCapacity}</div>
                <div>주문력 배율: x{selectedItemDetail.magicWeapon.spellPowerMultiplier}</div>
              </div>
            )}

            {/* 양손 무기 알림 */}
            {selectedItemDetail.weaponStyle === 'TWO_HANDED' && (
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] mt-1 bg-amber-950/30 border border-amber-800/40 rounded p-1.5">
                <AlertCircle className="w-3 h-3 shrink-0" /> 양손 무기 (보조무기 슬롯 동시 점유)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
