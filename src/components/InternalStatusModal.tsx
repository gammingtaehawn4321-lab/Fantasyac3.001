import React, { useMemo, useState } from 'react';
import {
  X,
  Boxes,
  Droplets,
  CircleDot,
  Bug,
  FlaskConical,
  Baby,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PlayerState, BodyCompartmentId, BodyLoadStage, BodyPayloadChannel, BodyPayloadKind, BodyPayloadEntry } from '../types';
import {
  BODY_COMPARTMENT_CAPACITY,
  BODY_STATUS_VISUALS,
  BLADDER_STATUS_VISUAL,
} from '../data/bodySystemConfig';
import {
  BODY_PAYLOAD_DISPLAY_META,
  getBodyIllustrationSlot,
  getBodyPayloadChannelMeta,
  getBodyPayloadSourceDisplayName,
} from '../data/bodyPayloadPresentation';
import { resolveBodyPayloadChannel } from '../data/bodyPayloadUserDefinitions';
import { getBodyLoadStage } from '../gameEngine';

interface InternalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
}

const COMPARTMENTS: BodyCompartmentId[] = [
  'COMPARTMENT_1',
  'COMPARTMENT_2',
  'COMPARTMENT_3',
];

const STAGE_LABELS: Record<BodyLoadStage, string> = {
  EMPTY: '없음',
  TRACE: '미량',
  LOW: '적음',
  MEDIUM: '보통',
  HIGH: '많음',
  SATURATED: '포화',
};

const PAYLOAD_CHANNEL_ICONS: Record<BodyPayloadChannel, React.ComponentType<{ className?: string }>> = {
  A: Droplets,
  B: CircleDot,
  C: Bug,
};

const PAYLOAD_KIND_ICONS: Partial<Record<BodyPayloadKind, React.ComponentType<{ className?: string }>>> = {
  STANDARD_FLUID: Droplets,
  INSECTOID_SECRETION: FlaskConical,
  URINE: Droplets,
  EGG: CircleDot,
  PARASITE: Bug,
};

const formatPayloadAmount = (amount: number, unit?: string) => {
  const rounded = Math.max(0, Math.round(Number(amount) || 0));
  return unit ? `${rounded}${unit}` : `${rounded}`;
};

const formatPayloadTimestamp = (entry: BodyPayloadEntry) => {
  const stamp = entry.lastAddedAt ?? entry.firstAddedAt;
  if (!stamp) return '';
  const hh = String(stamp.hour).padStart(2, '0');
  const mm = String(stamp.minute).padStart(2, '0');
  return `D${stamp.day} ${hh}:${mm}`;
};

const sourceGroupKey = (entry: BodyPayloadEntry) => {
  if (entry.sourceType === 'CHARACTER') {
    return `CHARACTER:${entry.sourceId || entry.sourceName || 'unknown'}`;
  }
  return `SPECIES:${entry.sourceSpeciesId || entry.sourceSpeciesName || entry.sourceName || 'unknown'}`;
};

const groupSourcesForDisplay = (sources: BodyPayloadEntry[]): BodyPayloadEntry[] => {
  const grouped = new Map<string, BodyPayloadEntry>();
  for (const source of sources) {
    const key = sourceGroupKey(source);
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, { ...source });
      continue;
    }
    const currentStamp = current.lastAddedAt ?? current.firstAddedAt;
    const nextStamp = source.lastAddedAt ?? source.firstAddedAt;
    const currentOrder = currentStamp ? currentStamp.day * 1440 + currentStamp.hour * 60 + currentStamp.minute : -1;
    const nextOrder = nextStamp ? nextStamp.day * 1440 + nextStamp.hour * 60 + nextStamp.minute : -1;
    grouped.set(key, {
      ...current,
      amount: Math.max(0, Number(current.amount) || 0) + Math.max(0, Number(source.amount) || 0),
      lastAddedAt: nextOrder >= currentOrder ? source.lastAddedAt ?? source.firstAddedAt : current.lastAddedAt,
    });
  }
  return Array.from(grouped.values());
};

const pregnancyLabel = (stage?: string) => {
  switch (stage) {
    case 'EARLY': return '초기';
    case 'MID': return '중기';
    case 'LATE': return '후기';
    case 'READY': return '완료 단계';
    default: return '미확인';
  }
};

const parasiteModeLabel = (mode?: string) => mode === 'INSERTED' ? '기생 삽입형' : '내부 기생형';
const parasiteStageLabel = (stage?: string) => {
  switch (stage) {
    case 'DORMANT': return '휴면';
    case 'DEVELOPING': return '성장 중';
    case 'MATURE': return '성숙';
    case 'RESOLVING': return '변화 중';
    default: return '미확인';
  }
};

export function InternalStatusModal({ isOpen, onClose, playerState }: InternalStatusModalProps) {
  const [showEmpty, setShowEmpty] = useState(false);

  const compartmentData = useMemo(() => {
    return COMPARTMENTS.map((compartmentId) => {
      const entries = (playerState.bodyPayloads ?? []).filter((entry) => entry.compartmentId === compartmentId);
      const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
      const capacity = BODY_COMPARTMENT_CAPACITY[compartmentId];
      const stage = getBodyLoadStage(total, compartmentId);
      const ratio = Math.min(100, Math.max(0, Math.round((total / Math.max(1, capacity)) * 100)));
      return { compartmentId, entries, total, capacity, stage, ratio };
    });
  }, [playerState.bodyPayloads]);

  if (!isOpen) return null;

  const pregnancy = playerState.pregnancy;
  const parasites = playerState.parasiteStates ?? [];
  const bladder = playerState.bladderStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[92dvh] overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-stone-800 bg-stone-950/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-100">내부 상태</h2>
              <p className="text-[10px] sm:text-[11px] text-stone-500">현재 구획별 부하와 지속 상태를 요약합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar">
          {(pregnancy?.active || parasites.length > 0) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pregnancy?.active && (
                <div className="rounded-xl bg-stone-900/55 border border-stone-800 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
                    <Baby className="w-4 h-4 text-amber-300" /> 임신 상태
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-stone-950/70 p-2 border border-stone-800/70">
                      <span className="block text-stone-500 text-[10px]">단계</span>
                      <span className="text-stone-200 font-medium">{pregnancyLabel(pregnancy.stage)}</span>
                    </div>
                    <div className="rounded-lg bg-stone-950/70 p-2 border border-stone-800/70">
                      <span className="block text-stone-500 text-[10px]">진행률</span>
                      <span className="text-stone-200 font-mono font-semibold">
                        {Math.min(100, Math.round((pregnancy.elapsedMinutes / Math.max(1, pregnancy.gestationMinutes)) * 100))}%
                      </span>
                    </div>
                  </div>
                  {pregnancy.childSpeciesId && (
                    <div className="text-[11px] text-stone-400">예상 종족 <span className="text-amber-300 font-medium">{pregnancy.childSpeciesId}</span></div>
                  )}
                </div>
              )}

              {parasites.length > 0 && (
                <div className="rounded-xl bg-stone-900/55 border border-stone-800 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
                    <Bug className="w-4 h-4 text-rose-300" /> 기생 상태
                    <span className="ml-auto text-[10px] text-stone-500 font-mono">{parasites.length}건</span>
                  </div>
                  <div className="space-y-1.5">
                    {parasites.slice(0, 6).map((parasite) => (
                      <div key={parasite.id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-950/70 border border-stone-800/70 px-2.5 py-2 text-[10px]">
                        <div className="min-w-0">
                          <div className="text-stone-300 font-medium truncate">{parasiteModeLabel(parasite.mode)} · {parasite.speciesId}</div>
                          <div className="text-stone-500">{parasiteStageLabel(parasite.stage)} · 수량 {parasite.count}</div>
                        </div>
                        <span className="text-stone-500 shrink-0">{parasite.compartmentId ? BODY_STATUS_VISUALS[parasite.compartmentId]?.label || '미지정 부위' : '내부'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-xs font-semibold text-stone-200">구획별 상태</h3>
                <p className="text-[10px] text-stone-500 mt-0.5">컴포넌트 1·2는 5단계 × 사용자 정의 내용물 3종의 전용 삽화 슬롯을 사용합니다.</p>
              </div>
              <button
                onClick={() => setShowEmpty((v) => !v)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900"
              >
                {showEmpty ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showEmpty ? '0값 숨기기' : '0값 표시'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {compartmentData.map(({ compartmentId, entries, total, capacity, stage, ratio }) => {
                const visual = BODY_STATUS_VISUALS[compartmentId];
                const illustrationSlot = getBodyIllustrationSlot(compartmentId, stage, entries);
                const imageSrc = illustrationSlot?.imageSrc || visual.imageSrc;
                const imageAlt = illustrationSlot?.imageAlt || visual.imageAlt || visual.label || '상태 이미지';

                const groupedEntries = (compartmentId === 'COMPARTMENT_1' || compartmentId === 'COMPARTMENT_2')
                  ? (['A', 'B', 'C'] as BodyPayloadChannel[]).map((channel) => {
                      const sources = entries.filter(
                        (entry) => resolveBodyPayloadChannel(entry.payloadKind, entry.payloadChannel) === channel,
                      );
                      const amount = sources.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
                      const meta = getBodyPayloadChannelMeta(channel);
                      return {
                        key: `channel-${channel}`,
                        amount,
                        amountLabel: meta.amountLabel,
                        unit: meta.unit,
                        Icon: PAYLOAD_CHANNEL_ICONS[channel],
                        sources: groupSourcesForDisplay(sources),
                      };
                    })
                  : (Object.keys(BODY_PAYLOAD_DISPLAY_META) as BodyPayloadKind[]).map((kind) => {
                      const sources = entries.filter((entry) => entry.payloadKind === kind);
                      const amount = sources.reduce((sum, entry) => sum + Math.max(0, Number(entry.amount) || 0), 0);
                      const meta = BODY_PAYLOAD_DISPLAY_META[kind];
                      return {
                        key: `kind-${kind}`,
                        amount,
                        amountLabel: meta.amountLabel,
                        unit: meta.unit,
                        Icon: PAYLOAD_KIND_ICONS[kind] || CircleDot,
                        sources: groupSourcesForDisplay(sources),
                      };
                    });
                const visibleEntries = showEmpty
                  ? groupedEntries
                  : groupedEntries.filter((entry) => entry.amount > 0);

                return (
                  <article key={compartmentId} className="overflow-hidden rounded-xl border border-stone-800 bg-stone-900/55 shadow-sm">
                    <div className="aspect-[4/3] bg-stone-950 border-b border-stone-800 flex items-center justify-center overflow-hidden">
                      {imageSrc ? (
                        <img src={imageSrc} alt={imageAlt} className="w-full h-full object-contain object-center p-2" />
                      ) : (
                        <div className="text-center px-4">
                          <Boxes className="w-7 h-7 mx-auto text-stone-800 mb-2" />
                          <span className="text-[10px] text-stone-700">
                            {illustrationSlot ? '삽화 준비 중' : '상태 이미지 영역'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-stone-200">{visual.label || '미지정 부위'}</div>
                          <div className="text-[10px] text-stone-500 mt-0.5">{STAGE_LABELS[stage]}</div>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">총 내용물 {Math.round(total)} / {capacity}</span>
                      </div>

                      <div className="h-1.5 rounded-full bg-stone-950 border border-stone-800 overflow-hidden">
                        <div className="h-full bg-amber-500/80 transition-all duration-300" style={{ width: `${ratio}%` }} />
                      </div>

                      <div className="space-y-2 min-h-[22px]">
                        {visibleEntries.length === 0 ? (
                          <div className="text-[10px] text-stone-600">현재 표시할 내용 없음</div>
                        ) : visibleEntries.map(({ key, amount, amountLabel, unit, Icon, sources }) => {
                          return (
                            <div key={key} className="rounded-lg border border-stone-800/70 bg-stone-950/45 px-2 py-1.5">
                              <div className="flex items-center justify-between gap-2 text-[10px] text-stone-400">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <Icon className="w-3 h-3 text-stone-500" />
                                  <span>{amountLabel}</span>
                                </span>
                                <span className="font-mono text-stone-300">{formatPayloadAmount(amount, unit)}</span>
                              </div>

                              {sources.length > 0 && (
                                <div className="mt-1.5 pt-1.5 border-t border-stone-800/60 space-y-1">
                                  {sources.map((source) => {
                                    const stampedAt = formatPayloadTimestamp(source);
                                    return (
                                      <div key={source.id} className="flex items-start justify-between gap-2 text-[9px] text-stone-500">
                                        <div className="min-w-0">
                                          <div className="truncate text-stone-400">
                                            출처 · {getBodyPayloadSourceDisplayName(source)}
                                          </div>
                                          <div className="truncate text-stone-600">
                                            {stampedAt ? `마지막 유입 ${stampedAt}` : '유입 시각 미기록'}
                                          </div>
                                        </div>
                                        <span className="font-mono text-stone-500 shrink-0">{formatPayloadAmount(source.amount, unit)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-stone-800 bg-stone-900/55 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
              <div className="min-h-[120px] md:min-h-[150px] bg-stone-950 border-b md:border-b-0 md:border-r border-stone-800 flex items-center justify-center overflow-hidden">
                {BLADDER_STATUS_VISUAL.imageSrc ? (
                  <img src={BLADDER_STATUS_VISUAL.imageSrc} alt={BLADDER_STATUS_VISUAL.imageAlt || BLADDER_STATUS_VISUAL.label} className="w-full h-full object-contain object-center p-2" />
                ) : (
                  <div className="text-center"><Droplets className="w-7 h-7 mx-auto text-stone-800 mb-2" /><span className="text-[10px] text-stone-700">방광 상태 이미지 영역</span></div>
                )}
              </div>
              <div className="p-3.5 flex flex-col justify-center gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold text-stone-200">{BLADDER_STATUS_VISUAL.label || '소변 욕구'}</h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">외부 URINE payload와 별도로 관리됩니다.</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-amber-300">{Math.round(bladder?.urge ?? 0)}%</span>
                </div>
                <div className="h-2 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                  <div className="h-full bg-amber-500/80 transition-all duration-300" style={{ width: `${Math.min(100, Math.max(0, bladder?.urge ?? 0))}%` }} />
                </div>
                <div className="text-[10px] text-stone-400 flex justify-between">
                  <span>현재량</span>
                  <span className="font-mono">{Math.round(bladder?.amount ?? 0)} / {Math.round(bladder?.capacity ?? 100)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
