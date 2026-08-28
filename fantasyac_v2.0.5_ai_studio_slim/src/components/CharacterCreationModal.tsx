import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clover, Dumbbell, Heart, Shield, Wind, Brain, Zap, CheckCircle2, Map, Sparkles } from 'lucide-react';
import type { BeastkinType, BuildType, BreastSizeType, HipSizeType, CharacterProfile, PlayerState, PlayerStats, Race, SpeechStyleData, WorldRegionId } from '../types';
import { BEASTKIN_SUB_TYPES, getRaceDefinition } from '../data/raceData';
import { SPEECH_STYLE_PRESETS } from '../data/speechPresets';
import { INITIAL_PLAYER_STATS, calculateEffectiveStats, calculateMaxHp, calculateMaxMana, calculateMaxSanity, createNewPlayerState } from '../gameEngine';
import { getAvailableFates, getStartRegionsForRace } from '../data/world/fateData';
import { REGION_DEFINITIONS } from '../data/world/regionData';
import { createInitialWorldMapState, findHexByLocationTag } from '../data/world/worldMapSystem';

interface CharacterCreationModalProps { isOpen:boolean; onComplete:(state:PlayerState)=>void; onCancel?:()=>void; isInitialGame?:boolean; }
type WizardStep=1|2|3|4|5|6|7;
const STEPS=[
  ['기본 정보','이름·나이·말투'],['종족','종족과 세부 종족'],['외형','신체와 외형'],['스탯','초기 보너스 5P'],['시작 지역','종족별 시작지'],['운명','시작 상황과 물품'],['확정','모험 시작'],
] as const;
const statCfg:Array<{key:keyof PlayerStats;label:string;Icon:any}>=[
  {key:'strength',label:'근력',Icon:Dumbbell},{key:'vitality',label:'체력',Icon:Heart},{key:'agility',label:'민첩',Icon:Wind},{key:'intelligence',label:'지능',Icon:Zap},{key:'spirit',label:'정신',Icon:Brain},{key:'luck',label:'행운',Icon:Clover},
];

export function CharacterCreationModal({isOpen,onComplete,onCancel}:CharacterCreationModalProps){
  const [step,setStep]=useState<WizardStep>(1);
  const [name,setName]=useState('모험가'); const [physicalAge,setPhysicalAge]=useState(18);
  const [speechId,setSpeechId]=useState('calm');
  const [race,setRace]=useState<Race>('HUMAN'); const [beastkin,setBeastkin]=useState<BeastkinType>('CAT');
  const [height,setHeight]=useState(165); const [build,setBuild]=useState<BuildType>('AVERAGE');
  const [breastSize,setBreastSize]=useState<BreastSizeType>('SLENDER'); const [hipSize,setHipSize]=useState<HipSizeType>('AVERAGE');
  const [hairColor,setHairColor]=useState('검은색'); const [hairStyle,setHairStyle]=useState('단정한 단발'); const [eyeColor,setEyeColor]=useState('갈색');
  const [features,setFeatures]=useState(''); const [appearance,setAppearance]=useState('');
  const [bonus,setBonus]=useState<PlayerStats>({strength:0,vitality:0,agility:0,intelligence:0,spirit:0,luck:0});
  const regions=getStartRegionsForRace(race,beastkin); const [regionId,setRegionId]=useState<WorldRegionId>('GRANDIA');
  useEffect(()=>{if(!regions.includes(regionId))setRegionId(regions[0]);},[race,beastkin]);
  const fates=useMemo(()=>getAvailableFates(race,regionId,beastkin),[race,regionId,beastkin]); const [fateId,setFateId]=useState('');
  useEffect(()=>{if(!fates.some(f=>f.id===fateId))setFateId(fates[0]?.id||'');},[race,regionId,beastkin,fates.length]);
  if(!isOpen)return null;
  const allocated=(Object.values(bonus) as number[]).reduce((a,b)=>a+b,0); const remain=5-allocated;
  const base=Object.fromEntries(Object.keys(INITIAL_PLAYER_STATS).map(k=>[k,(INITIAL_PLAYER_STATS as any)[k]+(bonus as any)[k]])) as PlayerStats;
  const eff=calculateEffectiveStats(base,race,race==='BEASTKIN'?beastkin:undefined); const raceDef=getRaceDefinition(race,race==='BEASTKIN'?beastkin:undefined);
  const fate=fates.find(f=>f.id===fateId);
  const preset=SPEECH_STYLE_PRESETS.find(p=>p.id===speechId)||SPEECH_STYLE_PRESETS[0];
  const speech:SpeechStyleData={presetId:preset.id,description:preset.description,tone:preset.tone,politeness:preset.politeness,quirks:preset.quirks,exampleLines:preset.exampleLines};
  const next=()=>{if(step<7&&name.trim())setStep((step+1) as WizardStep)}; const prev=()=>step>1&&setStep((step-1) as WizardStep);
  const finish=()=>{
    if(!fate)return;
    const beastFeatures = race==='BEASTKIN' ? (beastkin==='BIRD'?{hasWings:true,wingDescription:'등 뒤에 펼쳐진 날개',furDescription:'부드러운 깃털'}:{earDescription:'쫑긋 솟은 귀',tailDescription:'유연한 꼬리',furDescription:'부드러운 털'}) : undefined;
    const specialFeature = race==='YETI' ? '흰 머리와 굽은 뿔을 지닌 암컷 설인' : race==='MERFOLK' ? '비늘과 뿔, 꼬리를 지닌 인어족' : race==='DRAGONKIN' ? (features || '용의 뿔과 비늘, 신성한 기운을 지닌 용족') : features;
    const profile:CharacterProfile={inGameName:name.trim(),name:name.trim(),gender:'여성',physicalAge:Math.max(13,physicalAge),race,beastkinType:race==='BEASTKIN'?beastkin:undefined,height,build,breastSize,hipSize,hairColor,hairStyle,eyeColor,skinDescription:'건강한 살결',features:specialFeature,appearance,speechStyle:speech,beastFeatures};
    let state=createNewPlayerState(profile,base,remain,true);
    const startHex=findHexByLocationTag(fate.startLocationTag)||findHexByLocationTag('GRANDIA_OUTSKIRTS')!;
    const storyFlags=Array.from(new Set([...state.storyFlags,...fate.worldFlags,...fate.startingTraits]));
    const inventory=[...state.inventory]; fate.startingItems.forEach(item=>{const ex=inventory.find(i=>i.name===item.name);if(ex)ex.quantity+=item.quantity;else inventory.push({name:item.name,quantity:item.quantity,description:item.description||'운명에 따라 받은 시작 물품'});});
    state={...state,rupees:fate.startingRupees,inventory,storyFlags,fate:{fateId:fate.id,startingRegionId:regionId,startingHexId:startHex.id,resolved:true},worldMap:createInitialWorldMapState(fate.startLocationTag,storyFlags)};
    onComplete(state);
  };
  const card='rounded-xl border border-stone-800 bg-stone-950/70 p-3';
  return <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2">
    <div className="w-full max-w-2xl max-h-[94dvh] overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-2xl flex flex-col">
      <div className="p-3 border-b border-stone-800 bg-stone-950/80"><div className="flex items-center justify-between"><h2 className="font-bold text-stone-100 flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400"/>판타지악 캐릭터 생성</h2><span className="text-xs text-amber-300">{step}/7</span></div><div className="grid grid-cols-7 gap-1 mt-2">{STEPS.map((s,i)=><button key={s[0]} onClick={()=>i+1<=step&&setStep((i+1) as WizardStep)} className={`h-1.5 rounded ${i+1<=step?'bg-amber-500':'bg-stone-800'}`}/>)}</div><div className="text-xs mt-2"><b className="text-stone-200">{STEPS[step-1][0]}</b><span className="text-stone-500 ml-2">{STEPS[step-1][1]}</span></div></div>
      <div className="flex-1 overflow-y-auto p-4 text-sm space-y-3">
        {step===1&&<><div className={card}><label className="text-stone-300 font-bold">이름</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full bg-stone-900 border border-stone-700 rounded-lg p-2"/></div><div className={card}><div className="flex justify-between"><b>성별</b><span className="text-rose-300 font-bold">여성 고정</span></div><p className="text-stone-500 mt-1">v1.0의 플레이어블 캐릭터는 여성으로 고정됩니다.</p></div><div className={card}><div className="flex justify-between"><b>신체적 나이</b><span>{physicalAge}세</span></div><input type="range" min={13} max={100} value={physicalAge} onChange={e=>setPhysicalAge(+e.target.value)} className="w-full accent-amber-500 mt-2"/></div><div className={card}><b>말투</b><div className="grid grid-cols-3 gap-2 mt-2">{SPEECH_STYLE_PRESETS.map(p=><button key={p.id} onClick={()=>setSpeechId(p.id)} className={`p-2 rounded-lg border ${speechId===p.id?'border-amber-500 bg-amber-500/10':'border-stone-800'}`}>{p.name}</button>)}</div></div></>}
        {step===2&&<><div className="grid grid-cols-3 sm:grid-cols-6 gap-2">{([{id:'HUMAN',name:'인간',icon:'👤'},{id:'ELF',name:'엘프',icon:'🌿'},{id:'BEASTKIN',name:'수인',icon:'🐾'},{id:'YETI',name:'설인',icon:'❄️'},{id:'MERFOLK',name:'인어족',icon:'🫧'},{id:'DRAGONKIN',name:'용족',icon:'🐉'}] as Array<{id:Race;name:string;icon:string}>).map(r=><button key={r.id} onClick={()=>setRace(r.id)} className={`p-3 rounded-xl border ${race===r.id?'border-amber-500 bg-amber-500/10':'border-stone-800'}`}><div className="text-2xl">{r.icon}</div><b>{r.name}</b></button>)}</div>{race==='BEASTKIN'&&<div className={card}><b>수인 종류 · 전 수인 여성</b><div className="grid grid-cols-5 gap-2 mt-2">{BEASTKIN_SUB_TYPES.map(b=><button key={b.type} onClick={()=>setBeastkin(b.type)} className={`p-2 rounded-lg border ${beastkin===b.type?'border-amber-500':'border-stone-800'}`}>{b.icon}<br/>{b.label}</button>)}</div></div>}<div className={card}><b>{raceDef.subName||raceDef.name}</b><p className="text-stone-400 mt-1">{raceDef.description}</p><p className="text-amber-300 mt-2">{raceDef.summary}</p></div></>}
        {step===3&&<>
          <div className="grid grid-cols-2 gap-3">
            <div className={card}><b>키</b><input type="number" value={height} onChange={e=>setHeight(+e.target.value)} className="w-full mt-2 bg-stone-900 p-2 rounded"/></div>
            <div className={card}><b>체격</b><select value={build} onChange={e=>setBuild(e.target.value as BuildType)} className="w-full mt-2 bg-stone-900 p-2 rounded"><option value="SMALL">작고 날렵함</option><option value="AVERAGE">균형 잡힘</option><option value="LARGE">건장함</option></select></div>
          </div>
          {physicalAge>=18&&<div className="grid grid-cols-2 gap-3">
            <div className={card}><b>가슴 유형</b><select value={breastSize} onChange={e=>setBreastSize(e.target.value as BreastSizeType)} className="w-full mt-2 bg-stone-900 p-2 rounded"><option value="SMALL">빈유</option><option value="SLENDER">슬렌더형</option><option value="LARGE">거유</option></select><p className="text-[10px] text-stone-500 mt-1">Gemini 참조 문구는 사용자 파일에서 별도로 작성합니다.</p></div>
            <div className={card}><b>엉덩이 유형</b><select value={hipSize} onChange={e=>setHipSize(e.target.value as HipSizeType)} className="w-full mt-2 bg-stone-900 p-2 rounded"><option value="SLIM">부실함</option><option value="AVERAGE">적당함</option><option value="FULL">풍만함</option></select><p className="text-[10px] text-stone-500 mt-1">Gemini 참조 문구는 사용자 파일에서 별도로 작성합니다.</p></div>
          </div>}
          {physicalAge<18&&<div className={card}><p className="text-xs text-stone-500">성인 신체 유형 선택은 신체적 나이 18세 이상에서만 사용됩니다.</p></div>}
          {[['머리색',hairColor,setHairColor],['머리형',hairStyle,setHairStyle],['눈색',eyeColor,setEyeColor]] .map(([l,v,setter]:any)=><div className={card} key={l}><b>{l}</b><input value={v} onChange={e=>setter(e.target.value)} className="w-full mt-2 bg-stone-900 p-2 rounded"/></div>)}
          <div className={card}><b>추가 특징</b><textarea value={features} onChange={e=>setFeatures(e.target.value)} className="w-full mt-2 bg-stone-900 p-2 rounded"/><b className="block mt-3">전체 외형 설명</b><textarea value={appearance} onChange={e=>setAppearance(e.target.value)} className="w-full mt-2 bg-stone-900 p-2 rounded"/></div>
        </>}
        {step===4&&<><div className="text-right text-amber-300">남은 포인트 {remain}</div><div className="grid grid-cols-2 gap-2">{statCfg.map(({key,label,Icon})=><div key={key} className={card}><div className="flex items-center justify-between"><span className="flex gap-2"><Icon className="w-4 h-4"/>{label}</span><b>{eff[key]}</b></div><div className="flex gap-2 mt-2"><button onClick={()=>bonus[key]>0&&setBonus({...bonus,[key]:bonus[key]-1})} className="px-3 py-1 bg-stone-800 rounded">-</button><span className="flex-1 text-center">+{bonus[key]}</span><button onClick={()=>remain>0&&setBonus({...bonus,[key]:bonus[key]+1})} className="px-3 py-1 bg-stone-800 rounded">+</button></div></div>)}</div><div className={card}>HP {calculateMaxHp(eff.vitality)} · MP {calculateMaxMana(eff.intelligence)} · 정신력 {calculateMaxSanity(eff.spirit)}</div></>}
        {step===5&&<><div className="grid grid-cols-2 gap-2">{regions.map(id=>{const r=REGION_DEFINITIONS[id];return <button key={id} onClick={()=>setRegionId(id)} className={`text-left p-3 rounded-xl border ${regionId===id?'border-amber-500 bg-amber-500/10':'border-stone-800'}`}><b>{r.name}</b><p className="text-xs text-stone-400 mt-1">{r.summary}</p></button>})}</div><div className={card}><Map className="inline w-4 h-4 mr-1"/><b>{REGION_DEFINITIONS[regionId].name}</b><p className="text-stone-400 mt-2">{REGION_DEFINITIONS[regionId].geography}</p></div></>}
        {step===6&&<>{fates.length===0?<div className={card}>선택 가능한 운명이 없습니다.</div>:fates.map(f=><button key={f.id} onClick={()=>setFateId(f.id)} className={`w-full text-left p-4 rounded-xl border ${fateId===f.id?'border-violet-400 bg-violet-500/10':'border-stone-800'}`}><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300"/><b>{f.name}</b></div><p className="text-stone-400 mt-2">{f.description}</p><div className="text-xs mt-2 text-stone-500">시작 루피 {f.startingRupees} · {f.startingItems.map(i=>`${i.name}×${i.quantity}`).join(', ')}</div><p className="text-xs text-amber-200 mt-2">{f.introSituation}</p></button>)}</>}
        {step===7&&<><div className={card}><div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-400"/><b className="text-lg">{name}</b><span className="text-rose-300">여성</span></div><div className="grid grid-cols-2 gap-2 mt-3 text-stone-400"><span>종족</span><b className="text-stone-200">{raceDef.subName||raceDef.name}</b><span>시작 지역</span><b className="text-stone-200">{REGION_DEFINITIONS[regionId].name}</b><span>운명</span><b className="text-stone-200">{fate?.name}</b><span>나이</span><b className="text-stone-200">{physicalAge}세</b></div></div><button onClick={finish} disabled={!fate} className="w-full py-4 rounded-xl bg-amber-500 text-stone-950 font-black disabled:opacity-40">이 운명을 받아들이고 모험 시작</button></>}
      </div>
      <div className="p-3 border-t border-stone-800 flex justify-between"><button onClick={()=>step===1?(onCancel?.()):prev()} className="px-4 py-2 rounded-lg bg-stone-800 flex gap-1"><ChevronLeft className="w-4"/>{step===1?'취소':'이전'}</button>{step<7&&<button onClick={next} disabled={!name.trim()||(step===6&&!fate)} className="px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-bold flex gap-1">다음<ChevronRight className="w-4"/></button>}</div>
    </div>
  </div>
}
