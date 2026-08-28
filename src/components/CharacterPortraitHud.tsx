import { Heart, Zap, Brain } from 'lucide-react';
import { PlayerState } from '../types';
import { getRaceDefinition } from '../data/raceData';

interface CharacterPortraitHudProps {
  playerState: PlayerState;
  isLoading?: boolean;
  onClick: () => void;
}

function MiniBar({ value, max, barClass }: { value: number; max: number; barClass: string }) {
  const percent = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
  return (
    <div className="h-1 rounded-full bg-stone-950/90 overflow-hidden border border-stone-800/70">
      <div className={`h-full rounded-full transition-[width] duration-300 ${barClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function CharacterPortraitHud({ playerState, isLoading, onClick }: CharacterPortraitHudProps) {
  const raceDef = getRaceDefinition(playerState.race || 'HUMAN', playerState.beastkinType);
  const profile = playerState.profile;
  const inGameName = profile?.inGameName || playerState.characterName || '모험가';
  const portraitUrl = profile?.portraitUrl;

  const getRaceAvatarBg = () => {
    if (playerState.race === 'ELF') return 'from-emerald-950 to-teal-900 text-emerald-300';
    if (playerState.race === 'BEASTKIN') return 'from-amber-950 to-stone-900 text-amber-300';
    return 'from-stone-900 to-stone-800 text-amber-200';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      id="character-portrait-hud"
      title="캐릭터 상세 상태창 열기"
      className="group w-full max-w-[350px] flex items-center gap-2 rounded-xl border border-stone-800/90 bg-stone-950/70 hover:bg-stone-900/85 hover:border-amber-500/45 px-1.5 py-1.5 text-left shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-amber-500/30 bg-stone-950 shrink-0 flex items-center justify-center">
        {portraitUrl ? (
          <img src={portraitUrl} alt={inGameName} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${getRaceAvatarBg()} flex items-center justify-center text-lg sm:text-xl`}>
            {raceDef.iconSymbol}
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-mono font-bold text-amber-300 text-center py-px">
          Lv.{playerState.level}
        </div>
        {isLoading && <div className="absolute inset-0 border-2 border-amber-400 border-t-transparent rounded-lg animate-spin" />}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-stone-100 truncate group-hover:text-amber-300 transition-colors">{inGameName}</span>
          <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25 shrink-0">
            {raceDef.subName || raceDef.name}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="min-w-0" title={`HP ${playerState.hp}/${playerState.maxHp}`}>
            <div className="flex items-center gap-0.5 text-[8px] text-rose-400 mb-0.5"><Heart className="w-2.5 h-2.5" />HP</div>
            <MiniBar value={playerState.hp} max={playerState.maxHp} barClass="bg-rose-500" />
          </div>
          <div className="min-w-0" title={`MP ${playerState.mana}/${playerState.maxMana}`}>
            <div className="flex items-center gap-0.5 text-[8px] text-sky-400 mb-0.5"><Zap className="w-2.5 h-2.5" />MP</div>
            <MiniBar value={playerState.mana} max={playerState.maxMana} barClass="bg-sky-500" />
          </div>
          <div className="min-w-0" title={`정신력 ${playerState.sanity}/${playerState.maxSanity}`}>
            <div className="flex items-center gap-0.5 text-[8px] text-violet-400 mb-0.5"><Brain className="w-2.5 h-2.5" />SP</div>
            <MiniBar value={playerState.sanity} max={playerState.maxSanity} barClass="bg-violet-500" />
          </div>
        </div>
      </div>
    </button>
  );
}
