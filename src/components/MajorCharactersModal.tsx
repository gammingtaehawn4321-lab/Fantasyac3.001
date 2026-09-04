import React, { useMemo, useState } from 'react';
import { Gift, Heart, MapPin, ShieldAlert, UserRoundPlus, Users, X } from 'lucide-react';
import { getKoreanLabel, type PlayerState } from '../types';
import { getItemDefinition } from '../data/items/itemDatabase';

interface Props {
  isOpen: boolean;
  playerState: PlayerState;
  onClose: () => void;
  onTalk: (characterId: string) => void;
  onRecruit: (characterId: string) => void;
  onGift?: (characterId: string, itemNameOrId: string) => void;
}

export function MajorCharactersModal({ isOpen, playerState, onClose, onTalk, onRecruit, onGift }: Props) {
  const chars = useMemo(
    () => Object.values(playerState.majorCharacters || {})
      .filter((c) => c.isAlive && Boolean(c.hasMet || (c.interactionHistory?.length || 0) > 0))
      .sort((a, b) => b.trust - a.trust || a.name.localeCompare(b.name)),
    [playerState.majorCharacters]
  );
  const giftItems = useMemo(
    () => (playerState.inventory || []).filter((item) => {
      const def = getItemDefinition(item.id || item.name);
      return (item.category || def?.category) === 'GIFT' && item.quantity > 0;
    }),
    [playerState.inventory]
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(chars[0]?.id);
  const [selectedGift, setSelectedGift] = useState<string>('');

  if (!isOpen) return null;
  const c = chars.find((x) => x.id === selectedId) || chars[0];
  const sameHex = Boolean(c?.currentHexId && c.currentHexId === playerState.worldMap?.currentHexId);

  return (
    <div className="fixed inset-0 z-[75] bg-black/85 flex items-center justify-center p-3">
      <div className="w-full max-w-6xl max-h-[92dvh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
        <header className="p-4 border-b border-zinc-800 flex items-center">
          <Users className="w-4 mr-2 text-cyan-300" />
          <b>주요 인물 · 관계 · 영입</b>
          <span className="ml-2 text-xs text-zinc-500">조우한 인물 {chars.length}명</span>
          <button className="ml-auto p-2 bg-zinc-900 rounded" onClick={onClose}><X className="w-4" /></button>
        </header>

        {chars.length === 0 ? (
          <div className="p-8 text-sm text-zinc-400">아직 직접 조우한 주요 인물이 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-[330px_1fr] min-h-0 flex-1">
            <div className="overflow-y-auto border-r border-zinc-800 p-2 space-y-1">
              {chars.map((x) => (
                <button
                  key={x.id}
                  onClick={() => { setSelectedId(x.id); setSelectedGift(''); }}
                  className={`w-full text-left p-3 rounded-xl border ${x.id === c?.id ? 'border-cyan-700 bg-cyan-950/20' : 'border-zinc-900 bg-zinc-950'}`}
                >
                  <div className="flex justify-between gap-2">
                    <b>{x.name}</b>
                    <span className="text-[10px] text-zinc-500">{x.isRecruited ? '영입됨' : `신뢰 ${x.trust}`}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">{x.title} · {x.location}</div>
                </button>
              ))}
            </div>

            {c && (
              <div className="overflow-y-auto p-5 space-y-4">
                <div>
                  <h2 className="text-xl font-black">{c.name} <span className="text-sm text-amber-300">『{c.title}』</span></h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    {getKoreanLabel(c.race, c.race)}{c.beastkinType ? ` / ${getKoreanLabel(c.beastkinType, c.beastkinType)}` : ''} · {c.faction || '무소속'} · {c.location}
                  </p>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{c.personality}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-zinc-900 rounded"><Heart className="w-3 inline mr-1 text-rose-400" />호감도 {c.relationship}</div>
                  <div className="p-3 bg-zinc-900 rounded">신뢰도 {c.trust} / {c.recruitmentTrust ?? 55}</div>
                </div>
                {!sameHex && (
                  <div className="p-3 rounded border border-amber-900 bg-amber-950/20 text-amber-200 text-xs">
                    <MapPin className="w-4 inline mr-1" />현재 같은 Hex에 있지 않아 교류·선물·영입을 할 수 없습니다.
                  </div>
                )}
                {c.memoryFlags?.maliciousIntentExposed && (
                  <div className="p-3 rounded border border-rose-900 bg-rose-950/20 text-rose-200 text-xs">
                    <ShieldAlert className="w-4 inline mr-1" />이 인물의 악의 또는 기만 의도가 드러났습니다.
                  </div>
                )}
                <div className="text-xs text-zinc-500">고유 퀘스트: {(c.customQuestIds || []).length ? `${c.customQuestIds!.length}개` : '비어 있음'}</div>

                <div className="flex gap-2">
                  <button disabled={!sameHex} onClick={() => onTalk(c.id)} className="flex-1 p-3 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-35 font-bold">대화 / 교류</button>
                  <button
                    disabled={!sameHex || c.isRecruited || !c.isRecruitable || c.trust < (c.recruitmentTrust ?? 55)}
                    onClick={() => onRecruit(c.id)}
                    className="flex-1 p-3 rounded bg-cyan-700 disabled:opacity-35 font-bold"
                  >
                    <UserRoundPlus className="w-4 inline mr-1" />{c.isRecruited ? '영입 완료' : '동료 영입'}
                  </button>
                </div>

                {onGift && (
                  <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-2">
                    <div className="text-xs font-bold"><Gift className="w-4 inline mr-1" />선물</div>
                    <div className="flex gap-2">
                      <select
                        value={selectedGift}
                        onChange={(e) => setSelectedGift(e.target.value)}
                        disabled={!sameHex || giftItems.length === 0}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-2 text-xs disabled:opacity-40"
                      >
                        <option value="">선물 선택</option>
                        {giftItems.map((item) => <option key={item.id || item.name} value={item.id || item.name}>{item.name} x{item.quantity}</option>)}
                      </select>
                      <button
                        disabled={!sameHex || !selectedGift}
                        onClick={() => { if (selectedGift) { onGift(c.id, selectedGift); setSelectedGift(''); } }}
                        className="px-4 py-2 rounded bg-rose-800 disabled:opacity-35 text-xs font-bold"
                      >선물하기</button>
                    </div>
                    {giftItems.length === 0 && <div className="text-[11px] text-zinc-600">현재 가방에 선물용 아이템이 없습니다.</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
