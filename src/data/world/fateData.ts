import type { Race, BeastkinType, WorldRegionId } from '../../types';
import { getEnabledUserFateDefinitions } from './fateUserDefinitions';

export type FateContentKind = 'STANDARD' | 'USER_ADULT' | 'USER_CUSTOM' | 'LEGACY';
export type FateDifficulty = 'NORMAL' | 'HARD' | 'SPECIAL';
export interface FateChapterChoice { id: string; label: string; description: string; storyFlags?: string[]; }
export interface FateChapterDefinition { id: string; title: string; summary: string; unlockHint: string; choices?: FateChapterChoice[]; completionFlags?: string[]; }
export interface FateEndingDefinition { id: string; name: string; description: string; storyFlags: string[]; }
export interface FateCompletionReward { id: string; name: string; description: string; storyFlags: string[]; }
export interface FateDefinition {
  id: string; name: string; description: string; allowedRaces: Race[]; allowedBeastkinTypes?: BeastkinType[]; allowedRegions: WorldRegionId[];
  startLocationTag?: string; startLocationTagsByRegion?: Partial<Record<WorldRegionId, string>>; startingRupees: number;
  startingItems: Array<{ name: string; quantity: number; description?: string }>; startingTraits: string[]; worldFlags: string[]; introSituation: string;
  contentKind: FateContentKind; difficulty: FateDifficulty; raceExclusiveLabel?: string; requiresAdult?: boolean; hiddenInCreation?: boolean; userNarrativeReference?: string;
  chapters: FateChapterDefinition[]; endings: FateEndingDefinition[]; completionReward: FateCompletionReward;
}

export const START_REGIONS_BY_RACE: Record<Race, WorldRegionId[]> = { HUMAN:['GRANDIA','SEIRE','SANTIMAC'], ELF:['FOREZIN','SANTIMAC'], BEASTKIN:['GRANDIA','FOREZIN','SANTIMAC','PROSTI','SCROZE'], YETI:['PROSTI'], MERFOLK:['SEIRE'], DRAGONKIN:['GRANDIA','SEIRE','FOREZIN','SANTIMAC','PROSTI','SCROZE'] };

export function getStartRegionsForRace(race: Race, beastkinType?: BeastkinType): WorldRegionId[] { if(race!=='BEASTKIN') return START_REGIONS_BY_RACE[race]; switch(beastkinType){ case 'WOLF':return ['PROSTI','SANTIMAC']; case 'BIRD':return ['SCROZE','FOREZIN']; case 'FOX':return ['SCROZE','SANTIMAC','FOREZIN']; case 'DOG':return ['FOREZIN','GRANDIA']; case 'CAT':return ['SANTIMAC','GRANDIA']; default:return START_REGIONS_BY_RACE.BEASTKIN; } }

export const DEFAULT_START_LOCATION_BY_REGION: Record<WorldRegionId,string> = { GRANDIA:'THE_PELLESS_LOWER', SEIRE:'SKY_PORT', FOREZIN:'FOREZIN_RIVER_VILLAGE', SANTIMAC:'REMUSIAN_OUTER', PROSTI:'PROSTI_VILLAGE', SCROZE:'SKY_VILLAGE' };

function makeChapters(fateId:string, titles:string[]): FateChapterDefinition[] { return titles.map((title,index)=>({ id:`${fateId}_chapter_${index+1}`, title, summary:index===0?'선택한 운명이 현재 삶에 모습을 드러내기 시작한다.':index===titles.length-1?'지나온 선택들이 하나의 결말을 향해 모인다.':'이전 장에서 남은 흔적과 선택이 새로운 사건으로 이어진다.', unlockHint:index===0?'게임 시작과 동시에 진행':'현재 운명 사건을 직접 마주하고 의미 있는 선택을 하면 진행', choices:index===2?[{id:`${fateId}_choice_keep`,label:'지금까지의 방식을 지킨다',description:'기존 가치와 약속을 우선한다.',storyFlags:[`${fateId.toUpperCase()}_CHOICE_KEEP`]},{id:`${fateId}_choice_change`,label:'새로운 길을 택한다',description:'기존 방식에서 벗어나 다른 해결책을 택한다.',storyFlags:[`${fateId.toUpperCase()}_CHOICE_CHANGE`]}]:undefined, completionFlags:[`${fateId.toUpperCase()}_CHAPTER_${index+1}_DONE`] })); }

function standardFate(args: Omit<FateDefinition,'contentKind'|'difficulty'|'chapters'|'endings'|'completionReward'> & { chapterTitles:string[] }): FateDefinition { const {chapterTitles,...base}=args; return {...base,contentKind:'STANDARD',difficulty:'NORMAL',chapters:makeChapters(base.id,chapterTitles),endings:[{id:`${base.id}_ending_hold`,name:'이어온 길',description:'처음 품었던 가치와 약속을 끝까지 지켜낸 결말.',storyFlags:[`${base.id.toUpperCase()}_ENDING_HOLD`]},{id:`${base.id}_ending_change`,name:'새로 고른 길',description:'과거의 굴레를 넘어 자신만의 방식으로 운명을 다시 쓴 결말.',storyFlags:[`${base.id.toUpperCase()}_ENDING_CHANGE`]}],completionReward:{id:`${base.id}_reward`,name:`${base.name}의 흔적`,description:'운명을 끝까지 마주한 사실이 이후 세계와 인물의 반응에 남는다.',storyFlags:[`${base.id.toUpperCase()}_COMPLETED`]}}; }

const RACE_EXCLUSIVE_FATES: FateDefinition[] = [
  standardFate({
    id:'fate_human_01', name:'개척자의 첫 깃발', description:'정착하지 않은 땅에 자신의 발자국을 남기려는 인간의 운명. 낯선 지역에서도 사람과 자원을 엮어 살아남는다.', allowedRaces:['HUMAN'], allowedRegions:['GRANDIA', 'SEIRE', 'SANTIMAC'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_HUMAN_01'], worldFlags:['FATE_HUMAN_01_START'],
    introSituation:'『개척자의 첫 깃발』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인간 전용', chapterTitles:['첫 삽을 뜨는 사람', '낯선 이웃', '내 땅이라 부를 곳', '세워지는 이름', '깃발이 펄럭이는 날']
  }),
  standardFate({
    id:'fate_human_02', name:'빚을 진 생존자', description:'갚아야 할 빚과 지켜야 할 약속을 함께 짊어진 채 길을 나선 인간의 운명.', allowedRaces:['HUMAN'], allowedRegions:['GRANDIA', 'SEIRE', 'SANTIMAC'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_HUMAN_02'], worldFlags:['FATE_HUMAN_02_START'],
    introSituation:'『빚을 진 생존자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인간 전용', chapterTitles:['남겨진 장부', '독촉의 그림자', '값을 매길 수 없는 것', '빚과 약속 사이', '마지막 계산']
  }),
  standardFate({
    id:'fate_human_03', name:'길드를 등진 손', description:'한때 조직의 일원이었으나 스스로의 판단으로 길드를 떠난 인간의 운명.', allowedRaces:['HUMAN'], allowedRegions:['GRANDIA', 'SEIRE', 'SANTIMAC'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_HUMAN_03'], worldFlags:['FATE_HUMAN_03_START'],
    introSituation:'『길드를 등진 손』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인간 전용', chapterTitles:['잘린 문장', '옛 동료의 소식', '남겨진 기술', '다시 내미는 손', '어디에도 속하지 않는 자']
  }),
  standardFate({
    id:'fate_human_04', name:'이름 없는 기록자', description:'유명해지기보다 세상의 진실을 기록하기로 한 인간의 운명.', allowedRaces:['HUMAN'], allowedRegions:['GRANDIA', 'SEIRE', 'SANTIMAC'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_HUMAN_04'], worldFlags:['FATE_HUMAN_04_START'],
    introSituation:'『이름 없는 기록자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인간 전용', chapterTitles:['빈 기록장', '첫 번째 증언', '지워진 문장', '기록할 것과 숨길 것', '남겨지는 기록']
  }),
  standardFate({
    id:'fate_elf_01', name:'숲의 맹세를 떠난 자', description:'오래된 숲의 규율을 뒤로하고 외부 세계로 발을 내디딘 엘프의 운명.', allowedRaces:['ELF'], allowedRegions:['FOREZIN', 'SANTIMAC'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_ELF_01'], worldFlags:['FATE_ELF_01_START'],
    introSituation:'『숲의 맹세를 떠난 자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'엘프 전용', chapterTitles:['숲 밖의 첫걸음', '익숙하지 않은 도시', '되돌아오는 부름', '오래된 맹세의 값', '새로운 뿌리']
  }),
  standardFate({
    id:'fate_elf_02', name:'마력의 메아리', description:'자신만 들을 수 있는 오래된 마력의 잔향을 좇는 엘프의 운명.', allowedRaces:['ELF'], allowedRegions:['FOREZIN', 'SANTIMAC'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_ELF_02'], worldFlags:['FATE_ELF_02_START'],
    introSituation:'『마력의 메아리』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'엘프 전용', chapterTitles:['희미한 울림', '흔적을 품은 나무', '끊긴 마력맥', '메아리의 근원', '침묵 뒤의 대답']
  }),
  standardFate({
    id:'fate_elf_03', name:'잃어버린 수목원의 후예', description:'사라진 고대 수목원의 흔적과 혈통의 기억을 찾는 엘프의 운명.', allowedRaces:['ELF'], allowedRegions:['FOREZIN', 'SANTIMAC'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_ELF_03'], worldFlags:['FATE_ELF_03_START'],
    introSituation:'『잃어버린 수목원의 후예』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'엘프 전용', chapterTitles:['남은 씨앗', '지도에 없는 정원', '기억하는 나무', '되살릴 것인가', '새 숲의 이름']
  }),
  standardFate({
    id:'fate_elf_04', name:'인간 세상을 보는 눈', description:'외부 종족의 삶을 직접 이해하고 기록하기 위해 숲을 떠난 엘프의 운명.', allowedRaces:['ELF'], allowedRegions:['FOREZIN', 'SANTIMAC'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_ELF_04'], worldFlags:['FATE_ELF_04_START'],
    introSituation:'『인간 세상을 보는 눈』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'엘프 전용', chapterTitles:['낯선 생활', '짧은 생의 속도', '오해와 이해', '어느 편의 시선', '두 세계 사이']
  }),
  standardFate({
    id:'fate_fox_01', name:'천 개의 표정', description:'웃음과 거짓말을 생존술로 익혔지만 진짜 자신의 얼굴을 찾으려는 여우 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['FOX'], allowedRegions:['SCROZE', 'SANTIMAC', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'EDOWA_APPROACH','SANTIMAC':'REMUSIAN_OUTER','FOREZIN':'FOREZIN_RIVER_VILLAGE'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_FOX_01'], worldFlags:['FATE_FOX_01_START'],
    introSituation:'『천 개의 표정』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'여우 수인 전용', chapterTitles:['가벼운 거짓말', '들킨 꼬리', '믿어도 되는 사람', '벗겨지는 가면', '마지막 표정']
  }),
  standardFate({
    id:'fate_fox_02', name:'부적 장수의 후계', description:'부적과 작은 주술을 팔던 떠돌이의 기술을 이어받은 여우 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['FOX'], allowedRegions:['SCROZE', 'SANTIMAC', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'EDOWA_APPROACH','SANTIMAC':'REMUSIAN_OUTER','FOREZIN':'FOREZIN_RIVER_VILLAGE'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_FOX_02'], worldFlags:['FATE_FOX_02_START'],
    introSituation:'『부적 장수의 후계』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'여우 수인 전용', chapterTitles:['남겨진 부적함', '첫 손님', '가짜와 진짜', '후계자의 선택', '새로운 인장']
  }),
  standardFate({
    id:'fate_fox_03', name:'길 잃은 여우불', description:'자신에게만 보이는 신비한 불빛을 따라 오래된 길을 찾아가는 여우 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['FOX'], allowedRegions:['SCROZE', 'SANTIMAC', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'EDOWA_APPROACH','SANTIMAC':'REMUSIAN_OUTER','FOREZIN':'FOREZIN_RIVER_VILLAGE'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_FOX_03'], worldFlags:['FATE_FOX_03_START'],
    introSituation:'『길 잃은 여우불』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'여우 수인 전용', chapterTitles:['밤의 작은 불', '따라오는 그림자', '길이 갈라진 곳', '불빛의 주인', '꺼지지 않는 불']
  }),
  standardFate({
    id:'fate_fox_04', name:'웃음 뒤의 계약', description:'어릴 적 맺어진 정체불명의 약속을 되찾아야 하는 여우 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['FOX'], allowedRegions:['SCROZE', 'SANTIMAC', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'EDOWA_APPROACH','SANTIMAC':'REMUSIAN_OUTER','FOREZIN':'FOREZIN_RIVER_VILLAGE'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_FOX_04'], worldFlags:['FATE_FOX_04_START'],
    introSituation:'『웃음 뒤의 계약』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'여우 수인 전용', chapterTitles:['잊은 약속', '계약의 흔적', '웃음의 대가', '약속을 깨는 법', '내 이름으로 한 계약']
  }),
  standardFate({
    id:'fate_cat_01', name:'지붕 위의 발자국', description:'도시의 지붕과 골목을 누구보다 잘 아는 고양이 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['CAT'], allowedRegions:['SANTIMAC', 'GRANDIA'],
    startLocationTagsByRegion:{'SANTIMAC':'REMUSIAN_OUTER','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_CAT_01'], worldFlags:['FATE_CAT_01_START'],
    introSituation:'『지붕 위의 발자국』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'고양이 수인 전용', chapterTitles:['높은 곳의 길', '밤의 목격자', '닫힌 창문', '지붕 아래의 비밀', '내가 고른 골목']
  }),
  standardFate({
    id:'fate_cat_02', name:'아홉 번째 골목', description:'지도에는 없는 골목의 소문을 좇는 고양이 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['CAT'], allowedRegions:['SANTIMAC', 'GRANDIA'],
    startLocationTagsByRegion:{'SANTIMAC':'REMUSIAN_OUTER','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_CAT_02'], worldFlags:['FATE_CAT_02_START'],
    introSituation:'『아홉 번째 골목』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'고양이 수인 전용', chapterTitles:['사라지는 골목', '여덟 개의 흔적', '문 없는 집', '아홉 번째 입구', '돌아오는 길']
  }),
  standardFate({
    id:'fate_cat_03', name:'밤눈의 길잡이', description:'어둠 속에서 길을 잃은 이들을 이끌며 자신의 목적지도 찾는 고양이 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['CAT'], allowedRegions:['SANTIMAC', 'GRANDIA'],
    startLocationTagsByRegion:{'SANTIMAC':'REMUSIAN_OUTER','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_CAT_03'], worldFlags:['FATE_CAT_03_START'],
    introSituation:'『밤눈의 길잡이』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'고양이 수인 전용', chapterTitles:['밤의 의뢰', '희미한 등불', '뒤따르는 발소리', '누구를 이끌 것인가', '새벽의 길잡이']
  }),
  standardFate({
    id:'fate_cat_04', name:'주인 없는 자유', description:'누군가의 소유나 보호 아래 머무르기를 거부하고 스스로 살아가려는 고양이 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['CAT'], allowedRegions:['SANTIMAC', 'GRANDIA'],
    startLocationTagsByRegion:{'SANTIMAC':'REMUSIAN_OUTER','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_CAT_04'], worldFlags:['FATE_CAT_04_START'],
    introSituation:'『주인 없는 자유』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'고양이 수인 전용', chapterTitles:['벗어난 목줄', '혼자의 식사', '값싼 친절', '자유의 무게', '내가 정한 집']
  }),
  standardFate({
    id:'fate_dog_01', name:'길을 잃지 않는 코', description:'한 번 맡은 흔적은 끝까지 놓치지 않는 추적자로 성장하는 개 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['DOG'], allowedRegions:['FOREZIN', 'GRANDIA'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_DOG_01'], worldFlags:['FATE_DOG_01_START'],
    introSituation:'『길을 잃지 않는 코』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'개 수인 전용', chapterTitles:['첫 냄새', '끊긴 흔적', '거짓 냄새', '찾고 싶지 않은 것', '끝까지 따라간 길']
  }),
  standardFate({
    id:'fate_dog_02', name:'약속을 지키는 자', description:'오래전에 받은 한마디의 부탁을 아직도 지키고 있는 개 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['DOG'], allowedRegions:['FOREZIN', 'GRANDIA'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_DOG_02'], worldFlags:['FATE_DOG_02_START'],
    introSituation:'『약속을 지키는 자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'개 수인 전용', chapterTitles:['남겨진 부탁', '기다림의 시간', '약속을 흔드는 소식', '지킬 것과 놓을 것', '마침내 한 대답']
  }),
  standardFate({
    id:'fate_dog_03', name:'떠돌이 경비견', description:'마을과 상단을 지켜주며 떠돌아다니던 개 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['DOG'], allowedRegions:['FOREZIN', 'GRANDIA'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_DOG_03'], worldFlags:['FATE_DOG_03_START'],
    introSituation:'『떠돌이 경비견』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'개 수인 전용', chapterTitles:['첫 호위', '낯선 손님', '지켜야 할 선', '무너진 울타리', '내가 지키는 곳']
  }),
  standardFate({
    id:'fate_dog_04', name:'주인을 두지 않는 충성', description:'충성심은 강하지만 그 대상을 스스로 선택하려는 개 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['DOG'], allowedRegions:['FOREZIN', 'GRANDIA'],
    startLocationTagsByRegion:{'FOREZIN':'FOREZIN_RIVER_VILLAGE','GRANDIA':'THE_PELLESS_LOWER'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_DOG_04'], worldFlags:['FATE_DOG_04_START'],
    introSituation:'『주인을 두지 않는 충성』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'개 수인 전용', chapterTitles:['명령 없는 아침', '충성을 요구하는 자', '동료라 부를 사람', '거절해야 할 명령', '스스로 고른 약속']
  }),
  standardFate({
    id:'fate_wolf_01', name:'무리에서 떨어진 송곳니', description:'익숙한 무리에서 떨어져 혼자 살아가는 법을 배우는 늑대 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['WOLF'], allowedRegions:['PROSTI', 'SANTIMAC'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_WOLF_01'], worldFlags:['FATE_WOLF_01_START'],
    introSituation:'『무리에서 떨어진 송곳니』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'늑대 수인 전용', chapterTitles:['혼자의 발자국', '낯선 냄새의 무리', '돌아오라는 울음', '무리의 의미', '내가 선 자리']
  }),
  standardFate({
    id:'fate_wolf_02', name:'눈 위의 추적자', description:'눈과 먼지 위에 남은 흔적을 좇아 사라진 존재를 찾는 늑대 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['WOLF'], allowedRegions:['PROSTI', 'SANTIMAC'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_WOLF_02'], worldFlags:['FATE_WOLF_02_START'],
    introSituation:'『눈 위의 추적자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'늑대 수인 전용', chapterTitles:['첫 발자국', '바람이 지운 흔적', '붉은 냄새', '사냥과 구조 사이', '찾아낸 것']
  }),
  standardFate({
    id:'fate_wolf_03', name:'사냥의 계승자', description:'오래된 사냥 방식과 규율을 이어받았지만 그대로 따를지 고민하는 늑대 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['WOLF'], allowedRegions:['PROSTI', 'SANTIMAC'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_WOLF_03'], worldFlags:['FATE_WOLF_03_START'],
    introSituation:'『사냥의 계승자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'늑대 수인 전용', chapterTitles:['물려받은 칼날', '첫 사냥', '금지된 먹잇감', '계승과 변화', '새로운 사냥법']
  }),
  standardFate({
    id:'fate_wolf_04', name:'새 무리를 찾는 자', description:'혈연이 아닌 스스로 선택한 동료들과 새로운 무리를 만들려는 늑대 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['WOLF'], allowedRegions:['PROSTI', 'SANTIMAC'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE','SANTIMAC':'REMUSIAN_OUTER'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_WOLF_04'], worldFlags:['FATE_WOLF_04_START'],
    introSituation:'『새 무리를 찾는 자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'늑대 수인 전용', chapterTitles:['혼자인 밤', '같이 걷는 발소리', '무리의 규칙', '누구를 받아들일 것인가', '새로운 울음']
  }),
  standardFate({
    id:'fate_bird_01', name:'바람의 측량자', description:'바람과 고도를 읽어 아무도 정리하지 않은 항로를 기록하는 새 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['BIRD'], allowedRegions:['SCROZE', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'SKY_VILLAGE','FOREZIN':'FOREZIN_NORTH_VILLAGE'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_BIRD_01'], worldFlags:['FATE_BIRD_01_START'],
    introSituation:'『바람의 측량자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'새 수인 전용', chapterTitles:['첫 풍향', '빈 항로', '폭풍의 경계', '지도에 그을 선', '새 항로의 이름']
  }),
  standardFate({
    id:'fate_bird_02', name:'추락한 항로', description:'한때 안전하던 하늘길이 끊긴 이유를 찾는 새 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['BIRD'], allowedRegions:['SCROZE', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'SKY_VILLAGE','FOREZIN':'FOREZIN_NORTH_VILLAGE'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_BIRD_02'], worldFlags:['FATE_BIRD_02_START'],
    introSituation:'『추락한 항로』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'새 수인 전용', chapterTitles:['끊긴 표식', '추락한 짐', '바람 속의 잔해', '누가 길을 닫았나', '다시 열린 하늘']
  }),
  standardFate({
    id:'fate_bird_03', name:'구름 우편배달부', description:'사람과 지역을 잇는 편지를 운반하며 수많은 비밀을 마주하는 새 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['BIRD'], allowedRegions:['SCROZE', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'SKY_VILLAGE','FOREZIN':'FOREZIN_NORTH_VILLAGE'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_BIRD_03'], worldFlags:['FATE_BIRD_03_START'],
    introSituation:'『구름 우편배달부』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'새 수인 전용', chapterTitles:['첫 편지', '받지 않는 수신인', '열어서는 안 되는 봉투', '전해야 할 진실', '마지막 배달']
  }),
  standardFate({
    id:'fate_bird_04', name:'하늘 아래의 지도', description:'하늘에서만 보이는 지형과 비밀을 하나의 거대한 지도로 남기려는 새 수인의 운명.', allowedRaces:['BEASTKIN'], allowedBeastkinTypes:['BIRD'], allowedRegions:['SCROZE', 'FOREZIN'],
    startLocationTagsByRegion:{'SCROZE':'SKY_VILLAGE','FOREZIN':'FOREZIN_NORTH_VILLAGE'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_BIRD_04'], worldFlags:['FATE_BIRD_04_START'],
    introSituation:'『하늘 아래의 지도』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'새 수인 전용', chapterTitles:['빈 지도', '구름 아래의 표식', '보이지 않는 경계', '지도에서 지울 곳', '완성되지 않는 지도']
  }),
  standardFate({
    id:'fate_yeti_01', name:'눈동굴의 아이', description:'설산의 작은 동굴과 마을을 놀이터처럼 오가며 세상을 배워가는 어린 설인의 운명.', allowedRaces:['YETI'], allowedRegions:['PROSTI'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_YETI_01'], worldFlags:['FATE_YETI_01_START'],
    introSituation:'『눈동굴의 아이』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'설인 전용', chapterTitles:['눈밭의 아침', '동굴 밖의 흔적', '처음 보는 손님', '산 아래의 이야기', '조금 더 넓은 세상']
  }),
  standardFate({
    id:'fate_yeti_02', name:'굽은 뿔의 순례', description:'마을 어른들에게 배운 설산의 오래된 길을 직접 걸어보려는 어린 설인의 운명.', allowedRaces:['YETI'], allowedRegions:['PROSTI'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_YETI_02'], worldFlags:['FATE_YETI_02_START'],
    introSituation:'『굽은 뿔의 순례』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'설인 전용', chapterTitles:['첫 표식', '눈보라 속 돌무더기', '잃어버린 길표지', '정상 아래의 약속', '돌아온 발자국']
  }),
  standardFate({
    id:'fate_yeti_03', name:'빙설의 친구', description:'설산의 동물과 자연을 친구처럼 여기며 위험에 처한 생명을 돕는 어린 설인의 운명.', allowedRaces:['YETI'], allowedRegions:['PROSTI'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_YETI_03'], worldFlags:['FATE_YETI_03_START'],
    introSituation:'『빙설의 친구』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'설인 전용', chapterTitles:['다친 작은 짐승', '먹이를 나누는 날', '포식자의 그림자', '눈 속의 구조', '함께 남긴 흔적']
  }),
  standardFate({
    id:'fate_yeti_04', name:'산 아래가 궁금한 아이', description:'프로스티 밖의 세계가 궁금해 여러 이야기와 물건을 모으는 어린 설인의 운명.', allowedRaces:['YETI'], allowedRegions:['PROSTI'],
    startLocationTagsByRegion:{'PROSTI':'PROSTI_VILLAGE'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_YETI_04'], worldFlags:['FATE_YETI_04_START'],
    introSituation:'『산 아래가 궁금한 아이』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'설인 전용', chapterTitles:['낯선 물건', '여행자의 이야기', '산 아래의 편지', '처음 세운 계획', '언젠가 갈 길']
  }),
  standardFate({
    id:'fate_merfolk_01', name:'해류의 기록자', description:'해류와 수압의 변화를 기록하며 바다가 변하는 이유를 찾는 인어족의 운명.', allowedRaces:['MERFOLK'], allowedRegions:['SEIRE'],
    startLocationTagsByRegion:{'SEIRE':'AQUARIA'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_MERFOLK_01'], worldFlags:['FATE_MERFOLK_01_START'],
    introSituation:'『해류의 기록자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인어족 전용', chapterTitles:['오늘의 해류', '뒤틀린 흐름', '침묵한 산호', '오염의 길', '새로운 물길']
  }),
  standardFate({
    id:'fate_merfolk_02', name:'산호궁의 이탈자', description:'익숙한 해저 사회의 규율을 떠나 스스로의 삶을 선택한 인어족의 운명.', allowedRaces:['MERFOLK'], allowedRegions:['SEIRE'],
    startLocationTagsByRegion:{'SEIRE':'AQUARIA'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_MERFOLK_02'], worldFlags:['FATE_MERFOLK_02_START'],
    introSituation:'『산호궁의 이탈자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인어족 전용', chapterTitles:['궁을 등진 날', '낯선 해구', '돌아오라는 전갈', '바다의 규율', '내가 고른 수역']
  }),
  standardFate({
    id:'fate_merfolk_03', name:'침몰선의 수집가', description:'바닷속에 가라앉은 육지 문명의 물건과 사연을 모으는 인어족의 운명.', allowedRaces:['MERFOLK'], allowedRegions:['SEIRE'],
    startLocationTagsByRegion:{'SEIRE':'AQUARIA'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_MERFOLK_03'], worldFlags:['FATE_MERFOLK_03_START'],
    introSituation:'『침몰선의 수집가』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인어족 전용', chapterTitles:['첫 난파선', '녹슨 상자', '주인을 찾는 물건', '건져 올릴 진실', '바다의 박물관']
  }),
  standardFate({
    id:'fate_merfolk_04', name:'수면 위를 꿈꾸는 자', description:'수면 위 세계를 직접 보고 이해하고 싶어 하는 인어족의 운명.', allowedRaces:['MERFOLK'], allowedRegions:['SEIRE'],
    startLocationTagsByRegion:{'SEIRE':'AQUARIA'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_MERFOLK_04'], worldFlags:['FATE_MERFOLK_04_START'],
    introSituation:'『수면 위를 꿈꾸는 자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'인어족 전용', chapterTitles:['빛이 비치는 곳', '수면 가까이', '육지인의 흔적', '두 세계의 경계', '물 밖에서 본 바다']
  }),
  standardFate({
    id:'fate_dragonkin_01', name:'이름 없는 수호룡', description:'숭배받는 이름보다 실제로 지켜야 할 대상을 찾아 떠나는 용족의 운명.', allowedRaces:['DRAGONKIN'], allowedRegions:['GRANDIA', 'SEIRE', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER','PROSTI':'PROSTI_SUMMIT','SCROZE':'EDOWA_APPROACH'}, startingRupees:90, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_DRAGONKIN_01'], worldFlags:['FATE_DRAGONKIN_01_START'],
    introSituation:'『이름 없는 수호룡』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'용족 전용', chapterTitles:['비어 있는 제단', '도움을 청하는 목소리', '수호의 대가', '누구를 지킬 것인가', '이름보다 남는 것']
  }),
  standardFate({
    id:'fate_dragonkin_02', name:'제단을 떠난 영물', description:'오랫동안 한 장소의 상징으로 살아왔지만 스스로 세상을 보기 위해 떠난 용족의 운명.', allowedRaces:['DRAGONKIN'], allowedRegions:['GRANDIA', 'SEIRE', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER','PROSTI':'PROSTI_SUMMIT','SCROZE':'EDOWA_APPROACH'}, startingRupees:100, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_DRAGONKIN_02'], worldFlags:['FATE_DRAGONKIN_02_START'],
    introSituation:'『제단을 떠난 영물』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'용족 전용', chapterTitles:['제단 밖의 첫날', '경외의 시선', '신이 아닌 존재', '돌아오라는 제의', '스스로 걷는 영물']
  }),
  standardFate({
    id:'fate_dragonkin_03', name:'사냥꾼의 표적', description:'뿔과 비늘을 노리는 전문 사냥꾼의 흔적을 발견하고 역으로 그들을 추적하는 용족의 운명.', allowedRaces:['DRAGONKIN'], allowedRegions:['GRANDIA', 'SEIRE', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER','PROSTI':'PROSTI_SUMMIT','SCROZE':'EDOWA_APPROACH'}, startingRupees:110, startingItems:[{name:'작은 회복약',quantity:1}], startingTraits:['FATE_DRAGONKIN_03'], worldFlags:['FATE_DRAGONKIN_03_START'],
    introSituation:'『사냥꾼의 표적』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'용족 전용', chapterTitles:['남겨진 덫', '팔려가는 흔적', '사냥꾼의 이름', '쫓는 자와 쫓기는 자', '끊어낸 사슬']
  }),
  standardFate({
    id:'fate_dragonkin_04', name:'하늘길의 계승자', description:'용족만이 기억하는 오래된 하늘길과 천공의 흔적을 되찾는 용족의 운명.', allowedRaces:['DRAGONKIN'], allowedRegions:['GRANDIA', 'SEIRE', 'FOREZIN', 'SANTIMAC', 'PROSTI', 'SCROZE'],
    startLocationTagsByRegion:{'GRANDIA':'THE_PELLESS_LOWER','SEIRE':'SKY_PORT','FOREZIN':'FOREZIN_RIVER_VILLAGE','SANTIMAC':'REMUSIAN_OUTER','PROSTI':'PROSTI_SUMMIT','SCROZE':'EDOWA_APPROACH'}, startingRupees:120, startingItems:[{name:'약초',quantity:2}], startingTraits:['FATE_DRAGONKIN_04'], worldFlags:['FATE_DRAGONKIN_04_START'],
    introSituation:'『하늘길의 계승자』의 사연과 목적을 품은 채, 선택한 시작 지역에서 새로운 하루를 맞는다.', raceExclusiveLabel:'용족 전용', chapterTitles:['잊힌 바람길', '구름 위 표식', '닫힌 천공', '하늘의 유산', '다시 이어진 길']
  }),
];

const LEGACY_FATES: FateDefinition[] = [
  {id:'fate_grandia_wanderer',name:'왕도 밖의 방랑자',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['HUMAN', 'BEASTKIN', 'ELF'],allowedRegions:['GRANDIA'],startLocationTag:'THE_PELLESS_LOWER',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_grandia_wanderer',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_grandia_wanderer_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_GRANDIA_WANDERER_COMPLETED']}],completionReward:{id:'fate_grandia_wanderer_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_GRANDIA_WANDERER_REWARD']}},
  {id:'fate_grandia_underclass',name:'왕도의 그림자',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['HUMAN', 'BEASTKIN', 'ELF', 'MERFOLK'],allowedRegions:['GRANDIA'],startLocationTag:'THE_PELLESS_LOWER',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_grandia_underclass',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_grandia_underclass_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_GRANDIA_UNDERCLASS_COMPLETED']}],completionReward:{id:'fate_grandia_underclass_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_GRANDIA_UNDERCLASS_REWARD']}},
  {id:'fate_seire_surface',name:'수평선의 여행자',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['HUMAN', 'ELF', 'BEASTKIN'],allowedRegions:['SEIRE'],startLocationTag:'SKY_PORT',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_seire_surface',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_seire_surface_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_SEIRE_SURFACE_COMPLETED']}],completionReward:{id:'fate_seire_surface_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_SEIRE_SURFACE_REWARD']}},
  {id:'fate_aquaria_child',name:'아쿠아리아의 물결',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['MERFOLK'],allowedRegions:['SEIRE'],startLocationTag:'AQUARIA',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_aquaria_child',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_aquaria_child_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_AQUARIA_CHILD_COMPLETED']}],completionReward:{id:'fate_aquaria_child_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_AQUARIA_CHILD_REWARD']}},
  {id:'fate_forezin_villager',name:'부락의 수호자',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['ELF', 'BEASTKIN'],allowedRegions:['FOREZIN'],startLocationTag:'FOREZIN_RIVER_VILLAGE',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_forezin_villager',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_forezin_villager_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_FOREZIN_VILLAGER_COMPLETED']}],completionReward:{id:'fate_forezin_villager_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_FOREZIN_VILLAGER_REWARD']}},
  {id:'fate_santimac_resident',name:'무너지는 평화의 주민',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['BEASTKIN', 'HUMAN', 'ELF'],allowedRegions:['SANTIMAC'],startLocationTag:'REMUSIAN_OUTER',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_santimac_resident',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_santimac_resident_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_SANTIMAC_RESIDENT_COMPLETED']}],completionReward:{id:'fate_santimac_resident_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_SANTIMAC_RESIDENT_REWARD']}},
  {id:'fate_prosti_native',name:'설산의 딸',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['YETI', 'BEASTKIN'],allowedBeastkinTypes:['WOLF'],allowedRegions:['PROSTI'],startLocationTag:'PROSTI_VILLAGE',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_prosti_native',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_prosti_native_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_PROSTI_NATIVE_COMPLETED']}],completionReward:{id:'fate_prosti_native_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_PROSTI_NATIVE_REWARD']}},
  {id:'fate_scroze_bird',name:'구름길의 정찰자',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['BEASTKIN'],allowedBeastkinTypes:['BIRD'],allowedRegions:['SCROZE'],startLocationTag:'SKY_VILLAGE',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_scroze_bird',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_scroze_bird_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_SCROZE_BIRD_COMPLETED']}],completionReward:{id:'fate_scroze_bird_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_SCROZE_BIRD_REWARD']}},
  {id:'fate_scroze_fox',name:'에도와의 여우',description:'구 버전 세이브 호환을 위해 보존된 시작 운명.',allowedRaces:['BEASTKIN'],allowedBeastkinTypes:['FOX'],allowedRegions:['SCROZE'],startLocationTag:'EDOWA_APPROACH',startingRupees:100,startingItems:[],startingTraits:['LEGACY_FATE'],worldFlags:[],introSituation:'이전 버전에서 이어진 운명의 기록이다.',contentKind:'LEGACY',difficulty:'NORMAL',hiddenInCreation:true,chapters:makeChapters('fate_scroze_fox',['과거의 시작','남겨진 흔적','갈림길','되돌아온 기억','이어지는 운명']),endings:[{id:'fate_scroze_fox_ending',name:'이어진 기록',description:'구 운명의 기록을 새 시스템에서 이어간다.',storyFlags:['FATE_SCROZE_FOX_COMPLETED']}],completionReward:{id:'fate_scroze_fox_reward',name:'이어진 운명',description:'구 세이브 운명 완료 기록.',storyFlags:['FATE_SCROZE_FOX_REWARD']}},
];

export const FATE_DEFINITIONS: FateDefinition[] = [...RACE_EXCLUSIVE_FATES, ...getEnabledUserFateDefinitions(), ...LEGACY_FATES];

export function getFateDefinition(id:string): FateDefinition | undefined { return FATE_DEFINITIONS.find(f=>f.id===id); }

export function resolveFateStartLocationTag(fate:FateDefinition, regionId:WorldRegionId):string {
  if (fate.startLocationTagsByRegion?.[regionId]) return fate.startLocationTagsByRegion[regionId]!;
  if (fate.startLocationTag) return fate.startLocationTag;
  if (fate.allowedRaces.includes('MERFOLK') && regionId === 'SEIRE') return 'AQUARIA';
  if (fate.allowedRaces.includes('YETI') && regionId === 'PROSTI') return 'PROSTI_VILLAGE';
  if (fate.allowedRaces.includes('BEASTKIN') && fate.allowedBeastkinTypes?.includes('FOX') && regionId === 'SCROZE') return 'EDOWA_APPROACH';
  return DEFAULT_START_LOCATION_BY_REGION[regionId];
}

export function getAvailableFates(race:Race, regionId:WorldRegionId, beastkinType?:BeastkinType, physicalAge=18):FateDefinition[]{ return FATE_DEFINITIONS.filter(f=>{ if(f.hiddenInCreation) return false; if(!f.allowedRegions.includes(regionId)) return false; if(!f.allowedRaces.includes(race)) return false; if(f.allowedBeastkinTypes && (!beastkinType || !f.allowedBeastkinTypes.includes(beastkinType))) return false; if(f.requiresAdult && physicalAge<18) return false; return true; }); }

export function countStandardFatesByRaceVariant():Record<string,number>{ const out:Record<string,number>={}; for(const f of RACE_EXCLUSIVE_FATES){ const k=f.allowedRaces[0]==='BEASTKIN'?`BEASTKIN_${f.allowedBeastkinTypes?.[0]||'UNKNOWN'}`:f.allowedRaces[0]; out[k]=(out[k]||0)+1; } return out; }
