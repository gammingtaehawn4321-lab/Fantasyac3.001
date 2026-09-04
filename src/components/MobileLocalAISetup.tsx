import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cpu, Download, FileUp, Trash2, CheckCircle2, Gauge } from 'lucide-react';
import { MOBILE_AI_PRESETS, MOBILE_MODEL_CATALOG, formatModelSize, type MobileAIPresetId } from '../ai/mobileModelCatalog';
import { getFantasyacNativeBridge, type NativeModelDownloadStatus, type NativeModelFileInfo } from '../platform/nativeBridge';
import { getStoredMobilePreset, isMobileSetupCompleted, markMobileSetupCompleted, setStoredMobilePreset } from '../platform/mobileSetupState';

interface Props { geminiConfigured: boolean | null; }

export function MobileLocalAISetup({ geminiConfigured }: Props) {
  const native = getFantasyacNativeBridge();
  const [models, setModels] = useState<NativeModelFileInfo[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>();
  const [preset, setPreset] = useState<MobileAIPresetId>((getStoredMobilePreset() as MobileAIPresetId) || 'BALANCED');
  const [message, setMessage] = useState('');
  const [job, setJob] = useState<NativeModelDownloadStatus | null>(null);
  const [setupDone, setSetupDone] = useState(isMobileSetupCompleted());

  const refresh = useCallback(async () => {
    if (!native?.listLocalModels) return;
    try {
      const result = await native.listLocalModels();
      setModels(result.models || []);
      setActiveModelId(result.activeModelId || result.models?.find((m) => m.active)?.id);
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)); }
  }, [native]);

  useEffect(() => {
    refresh();
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setMessage(detail?.ok ? 'GGUF 모델을 가져왔습니다.' : detail?.error || '모델 목록을 갱신했습니다.');
      refresh();
    };
    window.addEventListener('fantasyac-models-changed', handler);
    return () => window.removeEventListener('fantasyac-models-changed', handler);
  }, [refresh]);

  useEffect(() => {
    if (!job || !native?.getModelDownloadStatus || !['QUEUED', 'DOWNLOADING'].includes(job.state)) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await native.getModelDownloadStatus!(job.jobId);
        setJob(next);
        if (next.state === 'COMPLETED') { setMessage('모델 다운로드 완료.'); await refresh(); }
        if (next.state === 'FAILED') setMessage(`다운로드 실패: ${next.error || '알 수 없는 오류'}`);
      } catch {}
    }, 1000);
    return () => window.clearInterval(timer);
  }, [job, native, refresh]);

  const progress = useMemo(() => job && job.totalBytes ? Math.min(100, Math.round(job.bytesDownloaded / job.totalBytes * 100)) : 0, [job]);
  if (!native?.listLocalModels) return null;

  return (
    <div className={`mx-auto mt-2 w-full max-w-sm rounded-lg border px-3 py-3 text-[11px] ${setupDone ? 'border-emerald-900/50 bg-emerald-950/15' : 'border-amber-700/60 bg-amber-950/25'}`}>
      <div className="flex items-center justify-center gap-1.5 font-semibold text-stone-100">
        <Cpu className="h-3.5 w-3.5" />
        <span>{setupDone ? '로컬 Narrator 모델' : '최초 실행 설정 · 로컬 Narrator'}</span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1">
        {(Object.keys(MOBILE_AI_PRESETS) as MobileAIPresetId[]).map((id) => (
          <button key={id} type="button" onClick={() => { setPreset(id); setStoredMobilePreset(id); }}
            className={`rounded-md border px-1.5 py-1 ${preset === id ? 'border-amber-500 bg-amber-900/30 text-amber-200' : 'border-stone-700 bg-stone-900 text-stone-400'}`}>
            {MOBILE_AI_PRESETS[id].label}
          </button>
        ))}
      </div>
      <div className="mt-1 text-[10px] text-stone-500"><Gauge className="mr-1 inline h-3 w-3" />{MOBILE_AI_PRESETS[preset].description}</div>
      {activeModelId && <button type="button" className="mt-1 rounded border border-amber-800/60 px-2 py-1 text-[10px] text-amber-300" onClick={async()=>{ const r=await native.activateLocalModel?.(activeModelId,preset); if(r?.ok) setMessage(`성능 프리셋을 ${MOBILE_AI_PRESETS[preset].label}(으)로 적용했습니다.`); else setMessage(r?.error||'프리셋 적용 실패'); }}>현재 모델에 프리셋 적용</button>}

      <div className="mt-2 space-y-1.5">
        {MOBILE_MODEL_CATALOG.map((entry) => {
          const installed = models.find((m) => m.id === entry.id || m.fileName.toLowerCase() === entry.fileName.toLowerCase());
          const active = installed && (activeModelId === installed.id || installed.active);
          return <div key={entry.id} className="rounded-md border border-stone-800 bg-stone-950/70 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0"><div className="font-semibold text-stone-200">{entry.displayName}</div><div className="text-[10px] text-stone-500">{formatModelSize(entry.approximateSizeBytes)} · {entry.recommendedFor}</div></div>
              {active ? <span className="shrink-0 text-emerald-400">사용 중</span> : installed ? <button className="shrink-0 rounded border border-emerald-800 px-2 py-1 text-emerald-300" onClick={async()=>{ const r=await native.activateLocalModel?.(installed.id,preset); if(r?.ok){setMessage('사용 모델을 변경했습니다.');await refresh();} else setMessage(r?.error||'활성화 실패'); }}>사용</button> : <button className="shrink-0 rounded border border-sky-800 px-2 py-1 text-sky-300" onClick={async()=>{ const r=await native.startModelDownload?.(entry.id,entry.downloadUrl,entry.fileName); if(r?.ok&&r.jobId){setJob({jobId:r.jobId,state:'QUEUED',bytesDownloaded:0,modelId:entry.id});setMessage('모델 다운로드를 시작했습니다.');}else setMessage(r?.error||'다운로드 시작 실패'); }}><Download className="mr-1 inline h-3 w-3"/>받기</button>}
            </div>
            {installed && !active && <button className="mt-1 text-[10px] text-red-400" onClick={async()=>{ if(confirm('이 GGUF 모델 파일을 삭제할까요?')){ await native.deleteLocalModel?.(installed.id); await refresh(); } }}><Trash2 className="mr-1 inline h-3 w-3"/>삭제</button>}
          </div>;
        })}
      </div>

      <button type="button" className="mt-2 w-full rounded-md border border-stone-700 bg-stone-900 px-2 py-1.5 text-stone-300" onClick={async()=>{ const r=await native.importLocalModel?.(); if(!r?.ok) setMessage(r?.error||'파일 선택기를 열지 못했습니다.'); else setMessage(r.modelId ? 'GGUF 모델을 가져왔습니다.' : 'GGUF 파일 선택기를 열었습니다.'); await refresh(); }}><FileUp className="mr-1 inline h-3 w-3"/>내 GGUF 파일 가져오기</button>

      {job && ['QUEUED','DOWNLOADING'].includes(job.state) && <div className="mt-2"><div className="h-1.5 overflow-hidden rounded-full bg-stone-800"><div className="h-full bg-sky-500" style={{width:`${progress}%`}}/></div><div className="mt-1 text-[10px] text-sky-300">다운로드 {job.totalBytes ? `${progress}%` : '진행 중...'}</div></div>}
      {message && <div className="mt-2 text-[10px] text-stone-400">{message}</div>}

      {!setupDone && <button type="button" disabled={!geminiConfigured || !activeModelId} onClick={()=>{markMobileSetupCompleted(true);setSetupDone(true);setMessage('초기 설정 완료.');}} className="mt-2 w-full rounded-md border border-amber-600 bg-amber-600/20 px-2 py-1.5 font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="mr-1 inline h-3 w-3"/>Gemini + 로컬 AI 설정 완료</button>}
      {!setupDone && <div className="mt-1 text-[10px] text-amber-300/70">완료하려면 Gemini API 키와 사용할 로컬 모델이 모두 필요합니다.</div>}
    </div>
  );
}
