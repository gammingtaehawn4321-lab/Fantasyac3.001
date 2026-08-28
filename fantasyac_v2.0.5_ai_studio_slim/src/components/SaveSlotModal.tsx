import { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Edit3, Trash2, AlertTriangle, Check, RotateCcw, Clock, MapPin, Calendar, Shield } from 'lucide-react';
import {
  SlotId,
  SaveSlot,
  MANUAL_SLOT_IDS,
  getAllSaveSlots,
  saveSlotData,
  deleteSaveSlot,
  renameSaveSlot,
  migrateSaveData,
  GameSaveData,
} from '../services/saveService';

interface SaveSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'load_only' | 'manage';
  currentGameData?: GameSaveData | null;
  onLoadSave: (gameData: GameSaveData) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export function SaveSlotModal({
  isOpen,
  onClose,
  mode,
  currentGameData,
  onLoadSave,
  onShowToast,
}: SaveSlotModalProps) {
  const [slots, setSlots] = useState<Record<SlotId, SaveSlot | null>>({
    AUTOSAVE: null,
    SLOT_1: null,
    SLOT_2: null,
    SLOT_3: null,
    SLOT_4: null,
    SLOT_5: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'overwrite' | 'delete';
    slotId: SlotId;
  } | null>(null);

  const [renamingSlotId, setRenamingSlotId] = useState<SlotId | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const loadAllSlots = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSaveSlots();
      setSlots(data);
    } catch (err) {
      console.error('Failed to fetch save slots:', err);
      onShowToast('세이브 슬롯 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllSlots();
      setConfirmTarget(null);
      setRenamingSlotId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveToSlot = async (slotId: SlotId, customName?: string) => {
    if (!currentGameData) {
      onShowToast('저장할 게임 데이터가 없습니다.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const slotNumStr = slotId.replace('SLOT_', '');
      const defaultName = customName || `슬롯 ${slotNumStr}`;
      await saveSlotData(slotId, currentGameData, defaultName);
      onShowToast(`${slotId === 'AUTOSAVE' ? '자동 저장' : `슬롯 ${slotNumStr}`}에 저장했습니다.`, 'success');
      await loadAllSlots();
      setConfirmTarget(null);
    } catch (err) {
      console.error(`Failed saving to ${slotId}:`, err);
      onShowToast('저장하지 못했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSlot = async (slot: SaveSlot) => {
    try {
      setIsLoading(true);
      const migrated = migrateSaveData(slot.gameData);
      onLoadSave(migrated);
      onShowToast(`${slot.slotName} 데이터를 불러왔습니다.`, 'success');
      onClose();
    } catch (err) {
      console.error(`Failed loading slot ${slot.slotId}:`, err);
      onShowToast('세이브 데이터를 불러오지 못했습니다. 손상되었거나 지원하지 않는 데이터입니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: SlotId) => {
    try {
      setIsLoading(true);
      await deleteSaveSlot(slotId);
      const slotNumStr = slotId.replace('SLOT_', '');
      onShowToast(`슬롯 ${slotNumStr} 세이브를 삭제했습니다.`, 'info');
      await loadAllSlots();
      setConfirmTarget(null);
    } catch (err) {
      console.error(`Failed deleting slot ${slotId}:`, err);
      onShowToast('삭제하지 못했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameSlot = async (slotId: SlotId) => {
    if (!renameInput.trim()) return;
    try {
      setIsLoading(true);
      await renameSaveSlot(slotId, renameInput.trim());
      onShowToast('슬롯 이름을 변경했습니다.', 'success');
      setRenamingSlotId(null);
      setRenameInput('');
      await loadAllSlots();
    } catch (err) {
      console.error(`Failed renaming slot ${slotId}:`, err);
      onShowToast('이름을 변경하지 못했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const renderSlotCard = (slotId: SlotId, isAutosave = false) => {
    const slot = slots[slotId];
    const isEditingName = renamingSlotId === slotId;
    const isConfirmingThis = confirmTarget?.slotId === slotId;

    const displayLabel = isAutosave
      ? '자동 저장 (AUTOSAVE)'
      : slot?.slotName || `슬롯 ${slotId.replace('SLOT_', '')}`;

    return (
      <div
        key={slotId}
        className={`relative flex flex-col justify-between rounded-xl p-4 transition-all border ${
          isAutosave
            ? 'bg-stone-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
            : slot
            ? 'bg-stone-900/80 border-stone-800 hover:border-amber-500/30'
            : 'bg-stone-950/60 border-stone-800/60 border-dashed'
        }`}
      >
        {/* Header line */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-800/80 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 min-w-0">
            {isAutosave ? (
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Save className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            )}
            {isEditingName ? (
              <div className="flex items-center gap-1 w-full">
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="bg-stone-950 text-stone-100 border border-amber-500/50 rounded px-2 py-0.5 text-xs w-32 focus:outline-none"
                  autoFocus
                  maxLength={20}
                />
                <button
                  onClick={() => handleRenameSlot(slotId)}
                  className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setRenamingSlotId(null)}
                  className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="truncate">{displayLabel}</span>
            )}
          </div>

          {slot && (
            <span className="text-[11px] text-stone-500 font-mono shrink-0">
              {formatTimestamp(slot.updatedAt)}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="py-3 flex-1">
          {slot ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-stone-200 font-bold">
                <span className="text-sm text-stone-100">{slot.preview.characterName}</span>
                <span className="text-amber-400">Lv.{slot.preview.level}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-400 text-[11px]">
                <span>{slot.preview.race}</span>
                {slot.preview.className && (
                  <span className="text-amber-400/90">{slot.preview.className}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-500" /> Day {slot.preview.dayCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-500" />
                  {String(slot.preview.currentHour).padStart(2, '0')}:
                  {String(slot.preview.currentMinute).padStart(2, '0')}
                </span>
                {slot.preview.locationName && (
                  <span className="flex items-center gap-1 text-stone-400 truncate max-w-[140px]">
                    <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                    {slot.preview.locationName}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-stone-500 text-xs">
              저장 데이터 없음
            </div>
          )}
        </div>

        {/* Confirmation Dialog overlay inside card if active */}
        {isConfirmingThis && (
          <div className="mt-2 p-2.5 bg-red-950/80 border border-red-800 rounded-lg text-xs space-y-2 animate-ui-pop-in">
            <div className="flex items-center gap-1.5 text-red-300 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                {confirmTarget.action === 'overwrite'
                  ? `${displayLabel}의 기존 저장을 덮어쓸까요?`
                  : `${displayLabel} 저장 데이터를 삭제할까요?`}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (confirmTarget.action === 'overwrite') {
                    handleSaveToSlot(slotId);
                  } else {
                    handleDeleteSlot(slotId);
                  }
                }}
                className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isConfirmingThis && (
          <div className="pt-2 border-t border-stone-800/60 flex items-center justify-end gap-1.5 flex-wrap">
            {slot ? (
              <>
                <button
                  onClick={() => handleLoadSlot(slot)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded transition-all cursor-pointer shadow active:scale-[0.98]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>불러오기</span>
                </button>

                {!isAutosave && mode === 'manage' && (
                  <>
                    <button
                      onClick={() => setConfirmTarget({ action: 'overwrite', slotId })}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded transition-all cursor-pointer"
                      title="덮어쓰기"
                    >
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                      <span>덮어쓰기</span>
                    </button>

                    <button
                      onClick={() => {
                        setRenamingSlotId(slotId);
                        setRenameInput(slot.slotName);
                      }}
                      disabled={isLoading}
                      className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 rounded cursor-pointer"
                      title="이름 변경"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setConfirmTarget({ action: 'delete', slotId })}
                      disabled={isLoading}
                      className="p-1.5 bg-stone-800 hover:bg-red-900/50 text-stone-400 hover:text-red-300 rounded cursor-pointer transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </>
            ) : (
              mode === 'manage' && !isAutosave && (
                <button
                  onClick={() => handleSaveToSlot(slotId)}
                  disabled={isLoading || !currentGameData}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-400 border border-stone-700 font-bold text-xs rounded transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>현재 게임 저장</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-ui-pop-in">
      <div className="ui-modal-surface w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-stone-100 shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/80">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-100">
              {mode === 'load_only' ? '저장 데이터 불러오기' : '저장 / 불러오기'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 no-scrollbar">
          {/* Section: Autosave */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> 자동 저장 슬롯
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderSlotCard('AUTOSAVE', true)}
            </div>
          </div>

          {/* Section: Manual Slots */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-stone-400 tracking-wider uppercase flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-stone-400" /> 수동 저장 슬롯
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MANUAL_SLOT_IDS.map((slotId) => renderSlotCard(slotId))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <span>데이터는 현재 브라우저(IndexedDB)에 영구 저장됩니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
