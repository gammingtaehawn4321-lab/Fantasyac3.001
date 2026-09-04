import { useEffect, useState } from 'react';
import { UserPlus, FolderOpen, Sparkles, Cpu, Download, KeyRound, Trash2 } from 'lucide-react';
import { getNarratorStatus } from '../services/narratorClient';
import type { NarratorStatus } from '../ai/narratorTypes';
import { fetchFantasyacUpdateStatus, getCurrentPlatformUpdatePackage, getUpdateInstallGuidance, type FantasyacUpdateStatus } from '../platform/updateService';
import { applyFantasyacGameUpdate, fetchFantasyacGameUpdateStatus, reloadFantasyacGameContent, rollbackFantasyacGameContent, type FantasyacGameUpdateStatus } from '../platform/gameContentUpdate';
import { detectFantasyacPlatform, getPlatformDisplayName } from '../platform/platformRuntime';
import { prepareAutomaticUpdateBackup } from '../platform/updateBackup';
import { getFantasyacNativeBridge } from '../platform/nativeBridge';
import { MobileLocalAISetup } from './MobileLocalAISetup';

interface MainTitleScreenProps {
  onOpenLoadModal: () => void;
  onStartNewGame: () => void;
}

export function MainTitleScreen({
  onOpenLoadModal,
  onStartNewGame,
}: MainTitleScreenProps) {
  const [narratorStatus, setNarratorStatus] = useState<NarratorStatus | null>(null);
  const [updateStatus, setUpdateStatus] = useState<FantasyacUpdateStatus | null>(null);
  const [gameUpdateStatus, setGameUpdateStatus] = useState<FantasyacGameUpdateStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [gameUpdating, setGameUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiKeyMessage, setGeminiKeyMessage] = useState('');
  const platform = detectFantasyacPlatform();

  useEffect(() => {
    let mounted = true;
    getNarratorStatus().then((status) => { if (mounted) setNarratorStatus(status); }).catch(() => {});
    fetchFantasyacUpdateStatus().then((status) => { if (mounted) setUpdateStatus(status); }).catch(() => {});
    fetchFantasyacGameUpdateStatus().then((status) => { if (mounted) setGameUpdateStatus(status); }).catch(() => {});
    const native = getFantasyacNativeBridge();
    Promise.resolve(native?.confirmGameContentHealthy?.()).catch(() => {});
    const onGamePatchImported = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail || {};
      setGameUpdating(false);
      if (detail.ok) {
        setUpdateMessage(`게임 패치 ${detail.gameVersion || ''} 가져오기 완료. 재시작합니다.`);
        setTimeout(() => { void reloadFantasyacGameContent(); }, 700);
      } else {
        setUpdateMessage(`게임 패치 가져오기 실패: ${detail.error || '알 수 없는 오류'}`);
      }
    };
    window.addEventListener('fantasyac-game-patch-imported', onGamePatchImported);
    if (native?.getGeminiKeyStatus) {
      Promise.resolve(native.getGeminiKeyStatus())
        .then((status) => { if (mounted) setGeminiConfigured(Boolean(status?.configured)); })
        .catch(() => {});
    }
    return () => {
      mounted = false;
      window.removeEventListener('fantasyac-game-patch-imported', onGamePatchImported);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Dark fantasy ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-600/10 via-red-900/5 to-transparent blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-red-950/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/40 via-stone-950/90 to-stone-950" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-lg mx-auto w-full">
        {/* Title & Branding */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-stone-400 text-xs tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Dark Fantasy Text RPG</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-stone-100 via-stone-200 to-stone-400 drop-shadow-lg">
            판타지악
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
            자유로운 선택과 끝없는 서사가 펼쳐지는 인터랙티브 TRPG. 미지의 대륙에서 당신만의 전설을 기록하세요.
          </p>
          {narratorStatus && (
            <div className={`mx-auto w-fit flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${narratorStatus.localAvailable ? 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300' : 'border-amber-800/50 bg-amber-950/20 text-amber-300'}`}>
              <Cpu className="w-3 h-3" />
              <span>{narratorStatus.localAvailable ? '로컬 Narrator 연결됨' : narratorStatus.configuredProvider === 'GEMINI' ? 'Gemini Narrator' : '로컬 미연결 · Gemini fallback'}</span>
            </div>
          )}
          {getFantasyacNativeBridge()?.getGeminiKeyStatus && (
            <div className="mx-auto mt-2 w-full max-w-sm rounded-lg border border-violet-800/50 bg-violet-950/20 px-3 py-2 text-[11px] text-violet-100">
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                <KeyRound className="w-3 h-3" />
                <span>모바일 Gemini Interpreter · {geminiConfigured ? '키 설정됨' : '키 필요'}</span>
              </div>
              {!geminiConfigured ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="password"
                    autoComplete="off"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="Gemini API Key"
                    className="min-w-0 flex-1 rounded-md border border-violet-800/50 bg-stone-950 px-2 py-1 text-[11px] text-stone-200 outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-violet-700/50 px-2 py-1 hover:bg-violet-900/30"
                    onClick={async () => {
                      const native = getFantasyacNativeBridge();
                      if (!native?.setGeminiApiKey || !geminiKeyInput.trim()) return;
                      setGeminiKeyMessage('저장 중...');
                      const result = await native.setGeminiApiKey(geminiKeyInput.trim());
                      if (result.ok) {
                        setGeminiConfigured(true);
                        setGeminiKeyInput('');
                        setGeminiKeyMessage('기기 보안 저장소에 저장됨');
                      } else setGeminiKeyMessage(result.error || '저장 실패');
                    }}
                  >저장</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mx-auto mt-2 flex items-center gap-1 rounded-md border border-violet-800/40 px-2 py-1 text-violet-200 hover:bg-violet-900/30"
                  onClick={async () => {
                    const native = getFantasyacNativeBridge();
                    await native?.clearGeminiApiKey?.();
                    setGeminiConfigured(false);
                    setGeminiKeyMessage('저장된 키를 삭제했습니다.');
                  }}
                ><Trash2 className="w-3 h-3" />키 삭제</button>
              )}
              {geminiKeyMessage && <div className="mt-1 text-[10px] text-violet-300/80">{geminiKeyMessage}</div>}
              <div className="mt-1 text-[10px] text-violet-300/60">키는 웹 저장소에 보관하지 않습니다.</div>
            </div>
          )}
          {getFantasyacNativeBridge()?.listLocalModels && <MobileLocalAISetup geminiConfigured={geminiConfigured} />}
          {gameUpdateStatus?.runtime?.available && (
            <div className="mx-auto mt-2 max-w-sm rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-3 py-2 text-[11px] text-emerald-100">
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                <Download className="w-3 h-3" />
                <span>게임 데이터 {gameUpdateStatus.currentGameVersion || '확인 중'}</span>
              </div>
              {gameUpdateStatus.launcherUpdateRequired ? (
                <div className="mt-1 text-amber-300">이 게임 패치는 새 런처가 필요합니다. 아래 앱 업데이트를 먼저 적용하세요.</div>
              ) : gameUpdateStatus.updateAvailable && gameUpdateStatus.manifest ? (
                <>
                  <div className="mt-1 text-emerald-300/90">새 게임 패치 {gameUpdateStatus.latestGameVersion} · APK 재설치 없이 적용</div>
                  {gameUpdateStatus.manifest.notes && <div className="mt-1 text-emerald-300/70">{gameUpdateStatus.manifest.notes}</div>}
                  <button
                    type="button"
                    className="mt-2 rounded-md border border-emerald-700/50 px-2 py-1 text-emerald-200 hover:bg-emerald-900/30 disabled:opacity-50"
                    disabled={gameUpdating}
                    onClick={async () => {
                      if (gameUpdating || !gameUpdateStatus.manifest) return;
                      setGameUpdating(true);
                      setUpdateMessage('세이브 백업 후 게임 패치를 검증·적용하는 중...');
                      try {
                        const result = await applyFantasyacGameUpdate(gameUpdateStatus.manifest);
                        if (!result.ok) {
                          setUpdateMessage(`게임 패치 실패: ${result.error || '알 수 없는 오류'}`);
                          return;
                        }
                        setUpdateMessage(`게임 패치 ${result.gameVersion || gameUpdateStatus.latestGameVersion} 적용 완료. 재시작합니다.`);
                        setTimeout(() => { void reloadFantasyacGameContent(); }, 700);
                      } catch (error: any) {
                        setUpdateMessage(`게임 패치 실패: ${String(error?.message || error)}`);
                      } finally {
                        setGameUpdating(false);
                      }
                    }}
                  >
                    {gameUpdating ? '게임 패치 적용 중...' : '게임만 업데이트'}
                  </button>
                </>
              ) : gameUpdateStatus.error ? (
                <div className="mt-1 text-amber-300/80">게임 패치 확인 실패: {gameUpdateStatus.error}</div>
              ) : (
                <div className="mt-1 text-emerald-300/60">게임/AI 지시문은 런처와 분리되어 있습니다.</div>
              )}
              {getFantasyacNativeBridge()?.importGameContentUpdate && (
                <button
                  type="button"
                  className="mt-2 ml-1 rounded-md border border-emerald-800/40 px-2 py-1 text-emerald-200/90 hover:bg-emerald-900/20 disabled:opacity-50"
                  disabled={gameUpdating}
                  onClick={async () => {
                    if (gameUpdating) return;
                    const native = getFantasyacNativeBridge();
                    if (!native?.importGameContentUpdate) return;
                    setGameUpdating(true);
                    setUpdateMessage('세이브를 백업하는 중...');
                    try {
                      const backup = await prepareAutomaticUpdateBackup();
                      if (!backup.ok) {
                        setGameUpdating(false);
                        setUpdateMessage(`게임 패치 전 세이브 백업 실패: ${backup.error || '알 수 없는 오류'}`);
                        return;
                      }
                      setUpdateMessage('백업 완료. 게임 패치 ZIP을 선택하세요.');
                      const result = await native.importGameContentUpdate();
                      if (!result.ok) {
                        setGameUpdating(false);
                        setUpdateMessage(`게임 패치 가져오기 실패: ${result.error || '알 수 없는 오류'}`);
                      } else if (!result.pending) {
                        setGameUpdating(false);
                        setUpdateMessage(`게임 패치 ${result.gameVersion || ''} 가져오기 완료. 재시작합니다.`);
                        setTimeout(() => { void reloadFantasyacGameContent(); }, 700);
                      }
                    } catch (error: any) {
                      setGameUpdating(false);
                      setUpdateMessage(`게임 패치 가져오기 실패: ${String(error?.message || error)}`);
                    }
                  }}
                >
                  게임 패치 ZIP 가져오기
                </button>
              )}
              {gameUpdateStatus.runtime?.hasPrevious && getFantasyacNativeBridge()?.rollbackGameContent && (
                <button
                  type="button"
                  className="mt-2 ml-1 rounded-md border border-amber-800/40 px-2 py-1 text-amber-200/90 hover:bg-amber-900/20 disabled:opacity-50"
                  disabled={gameUpdating}
                  onClick={async () => {
                    if (gameUpdating) return;
                    setGameUpdating(true);
                    setUpdateMessage('세이브 백업 후 이전 게임 패치로 되돌리는 중...');
                    try {
                      const backup = await prepareAutomaticUpdateBackup();
                      if (!backup.ok) {
                        setUpdateMessage(`롤백 전 세이브 백업 실패: ${backup.error || '알 수 없는 오류'}`);
                        return;
                      }
                      const result = await rollbackFantasyacGameContent();
                      if (!result.ok) {
                        setUpdateMessage(`게임 롤백 실패: ${result.error || '알 수 없는 오류'}`);
                        return;
                      }
                      setUpdateMessage(`게임 ${result.gameVersion || ''}(으)로 복구 완료. 재시작합니다.`);
                      setTimeout(() => { void reloadFantasyacGameContent(); }, 500);
                    } catch (error: any) {
                      setUpdateMessage(`게임 롤백 실패: ${String(error?.message || error)}`);
                    } finally {
                      setGameUpdating(false);
                    }
                  }}
                >
                  이전 게임 패치로 되돌리기
                </button>
              )}
              {updateMessage && <div className="mt-1 text-[10px] text-emerald-300/80">{updateMessage}</div>}
            </div>
          )}
          {updateStatus?.enabled && updateStatus.updateAvailable && (() => {
            const pkg = getCurrentPlatformUpdatePackage(updateStatus, platform);
            return (
              <div className="mx-auto mt-2 max-w-sm rounded-lg border border-sky-800/50 bg-sky-950/20 px-3 py-2 text-[11px] text-sky-200">
                <div className="flex items-center justify-center gap-1.5 font-semibold">
                  <Download className="w-3 h-3" />
                  <span>새 버전 {updateStatus.latestVersion} · {getPlatformDisplayName(platform)}</span>
                </div>
                <div className="mt-1 text-sky-300/80">{getUpdateInstallGuidance(platform)}</div>
                {pkg?.url && (
                  <button
                    type="button"
                    className="mt-2 rounded-md border border-sky-700/50 px-2 py-1 text-sky-200 hover:bg-sky-900/30"
                    disabled={updating}
                    onClick={async () => {
                      if (updating) return;
                      setUpdating(true);
                      setUpdateMessage('업데이트 전 세이브 백업 중...');
                      try {
                        const backup = await prepareAutomaticUpdateBackup();
                        if (!backup.ok) {
                          setUpdateMessage(`백업 실패: ${backup.error || '알 수 없는 오류'}`);
                          return;
                        }
                        setUpdateMessage(backup.mode === 'NATIVE' ? '자동 백업 완료. 업데이트를 엽니다.' : '백업 파일 다운로드 완료. 업데이트를 엽니다.');
                        const native = getFantasyacNativeBridge();
                        if (native?.openExternalUrl) await native.openExternalUrl(pkg.url);
                        else window.open(pkg.url, '_blank', 'noopener,noreferrer');
                      } finally {
                        setUpdating(false);
                      }
                    }}
                  >
                    {updating ? '백업 중...' : '백업 후 업데이트'}
                  </button>
                )}
                {updateMessage && <div className="mt-1 text-[10px] text-sky-300/80">{updateMessage}</div>}
              </div>
            );
          })()}
        </div>

        {/* Main Action Buttons - EXACTLY 2 BUTTONS: [새 게임] [불러오기] */}
        <div className="w-full space-y-3">
          {/* New Game Button */}
          <button
            id="main-new-game-btn"
            onClick={onStartNewGame}
            className="w-full min-h-[52px] flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition-all shadow-lg shadow-amber-500/10 cursor-pointer active:scale-[0.99]"
          >
            <UserPlus className="w-5 h-5 fill-current" />
            <span>새 게임</span>
          </button>

          {/* Load Game Button */}
          <button
            id="main-load-game-btn"
            onClick={onOpenLoadModal}
            className="w-full min-h-[52px] flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-base bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-stone-100 border border-stone-700 hover:border-amber-500/50 transition-all cursor-pointer active:scale-[0.99]"
          >
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span>불러오기</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-10 text-center text-xs">
          <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-300">자유로운 텍스트 행동</div>
            <div className="text-[11px] text-stone-500">모든 명령 직접 입력</div>
          </div>
          <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-300">캐릭터 말투 & 성격</div>
            <div className="text-[11px] text-stone-500">고유한 어조 서사 반영</div>
          </div>
          <div className="p-3 bg-stone-900/50 border border-stone-800/80 rounded-xl space-y-1">
            <div className="font-bold text-stone-300">다크 판타지 세계관</div>
            <div className="text-[11px] text-stone-500">종족별 고유 상호작용</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-4 text-center text-[11px] text-stone-600 border-t border-stone-900">
        『판타지악』 · AI Interactive Dark Fantasy Text RPG
      </div>
    </div>
  );
}

