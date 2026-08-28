import type { WorldHexTile } from '../../data/world/worldMapSystem';

const roadAngles=[0,-60,-120,180,120,60];
const edgePoint=(angle:number,len=21)=>({x:Math.cos(angle*Math.PI/180)*len,y:Math.sin(angle*Math.PI/180)*len});

function TerrainGlyph({tile}:{tile:WorldHexTile}){
  const v=tile.visualVariant||0;
  switch(tile.terrain){
    case 'PLAINS': return <g opacity=".8" stroke="#d8e6a8" strokeWidth="1" fill="none"><path d="M-12 9l2-7m0 7 4-5M2 11l1-8m0 8 5-6M11 6l1-5"/><path d={`M${-16+v} 14 Q0 ${9-v} 16 13`} opacity=".35"/></g>;
    case 'HILL': return <g fill="none" stroke="#d1b989" strokeWidth="1.4" opacity=".85"><path d="M-18 10 Q-8 -7 1 9"/><path d="M-3 11 Q8 -8 18 10"/><path d="M-13 14 Q0 8 14 14" opacity=".45"/></g>;
    case 'FOREST': return <g stroke="#b8d7ae" strokeWidth=".8"><path d="M-10 8v7M0 4v10M10 8v7"/><path d="M-16 7l6-12 6 12zM-7 3L0-11 7 3zM4 7l6-12 6 12z" fill="#173c28"/></g>;
    case 'RIVER': return <g fill="none" strokeLinecap="round"><path d={`M-18 ${-6+v} Q-4 ${-12+v} 2 0 T18 ${7-v}`} stroke="#77d7ed" strokeWidth="6" opacity=".8"/><path d={`M-18 ${-6+v} Q-4 ${-12+v} 2 0 T18 ${7-v}`} stroke="#d9f7ff" strokeWidth="1" opacity=".6"/></g>;
    case 'URBAN': return <g stroke="#e8dccf" strokeWidth=".8" fill="#413b38"><rect x="-15" y="-7" width="8" height="18"/><rect x="-5" y="-13" width="10" height="24"/><rect x="7" y="-4" width="8" height="15"/><path d="M-5-13 0-18 5-13M-15-7l4-4 4 4M7-4l4-5 4 5" fill="#554b46"/><path d="M-12-1h2m8-4h3m-3 7h3m9 1h2"/></g>;
    case 'COAST': return <g fill="none" strokeLinecap="round"><path d="M-19-3 Q-8-11 2-2 T19-2" stroke="#e6d09c" strokeWidth="6"/><path d="M-18 6 Q-8 1 1 6 T18 6" stroke="#8cd8ee" strokeWidth="2"/></g>;
    case 'SEA': return <g fill="none" stroke="#8bd9ed" strokeWidth="1.5" opacity=".8"><path d="M-16-6q5-4 10 0t10 0t10 0M-13 3q5-4 10 0t10 0t10 0M-9 11q5-4 10 0t10 0"/></g>;
    case 'DEEP_SEA': return <g fill="none" stroke="#6ba9d9" opacity=".75"><circle cx="-9" cy="4" r="2"/><circle cx="5" cy="-7" r="3"/><circle cx="12" cy="7" r="1.5"/><path d="M-17 13 Q0 3 17 13"/></g>;
    case 'SNOW': return <g stroke="#f7fbff" fill="none" opacity=".9"><path d="M0-12v24M-10-6l20 12M-10 6l20-12"/><path d="M-17 13 Q-7 8 1 13 T18 12" opacity=".5"/></g>;
    case 'MOUNTAIN': return <g stroke="#d8e1e8" strokeWidth="1" fill="#4a555e"><path d="M-18 12-7-10 1 12zM-4 12 8-15 19 12z"/><path d="M-11-2l4-8 3 7M3-3l5-12 5 10" fill="#eef5f7"/></g>;
    case 'FLOATING_LAND': return <g stroke="#d7dfb0" strokeWidth="1"><path d="M-17-2 Q0-10 17-2 Q8 6 0 7 Q-8 6-17-2z" fill="#647043"/><path d="M-11 3 0 18 11 3-1 12z" fill="#4d4438"/><circle cx="-5" cy="-5" r="2" fill="#95b866"/><circle cx="7" cy="-4" r="2" fill="#95b866"/></g>;
    case 'CLOUD': return <g fill="#cdd8df" stroke="#f0f6f8" strokeWidth=".8" opacity=".78"><circle cx="-8" cy="3" r="7"/><circle cx="0" cy="-3" r="9"/><circle cx="9" cy="3" r="7"/><rect x="-12" y="2" width="24" height="7" rx="3"/></g>;
    case 'STORM': return <g><path d="M-15 2Q-5-9 5-3T17 0" fill="none" stroke="#b7bdd8" strokeWidth="4"/><path d="M2-3-5 6h6l-3 11 11-14H3l4-6z" fill="#f2dd74"/></g>;
    case 'SHRINE': return <g stroke="#f3d2e8" strokeWidth="1.4" fill="none"><path d="M-15-5h30M-11-9H11M-10-9v20M10-9v20M-15-5l-3-4m33 4 3-4"/><path d="M-7 11h14"/></g>;
    case 'CAVE': return <g stroke="#b7aa98" strokeWidth="1" fill="none" opacity=".9"><path d="M-18 12Q-13-9-3-13Q6-16 18 12"/><path d="M-13 11Q-9-3-2-6Q6-8 13 11"/><path d="M-7-10l3 5 3-6M7-8l-2 5 4-2" opacity=".65"/></g>;
    case 'TUNNEL': return <g stroke="#d0b78f" strokeWidth="1.2" fill="none"><path d="M-17 10Q0-17 17 10"/><path d="M-11 10Q0-9 11 10"/><path d="M-15 4h30M-10-4h20" opacity=".45"/></g>;
    case 'UNDERGROUND_RIVER': return <g fill="none" strokeLinecap="round"><path d={`M-19 ${-5+v} Q-7 ${-12+v} 1 -2 T19 ${6-v}`} stroke="#5bc5df" strokeWidth="7" opacity=".75"/><path d={`M-19 ${-5+v} Q-7 ${-12+v} 1 -2 T19 ${6-v}`} stroke="#d6f6ff" strokeWidth="1" opacity=".55"/><path d="M-15 12Q0 6 15 12" stroke="#817668" strokeWidth="1"/></g>;
    case 'CHASM': return <g stroke="#c79987" strokeWidth="1.6" fill="none"><path d="M-10-17-5-9-11-2-3 5-8 17"/><path d="M8-17 3-8 10-1 2 7 7 17"/><path d="M-3-15 1-10-2-4 3 1-1 8 2 15" stroke="#2b1f25" strokeWidth="4" opacity=".8"/></g>;
    case 'FUNGAL_CAVE': return <g stroke="#d9f6c9" fill="#709664" opacity=".9"><path d="M-15 12Q-15 3-8 1Q-11-5-5-8Q2-10 1-2Q8-7 13-2Q18 4 12 12z"/><circle cx="-7" cy="1" r="2" fill="#c7e8a9"/><circle cx="7" cy="3" r="2.5" fill="#c7e8a9"/><path d="M-9 12V3M7 12V5" stroke="#e8ffd7"/></g>;
    case 'MAGMA_RIFT': return <g fill="none" strokeLinecap="round"><path d="M-11-18-5-8-10 0-2 7-7 18M7-18 3-7 9 0 2 8 7 18" stroke="#ff713f" strokeWidth="5"/><path d="M-11-18-5-8-10 0-2 7-7 18M7-18 3-7 9 0 2 8 7 18" stroke="#ffd27a" strokeWidth="1.4"/></g>;
    case 'CRYSTAL_CAVE': return <g stroke="#d8f1ff" strokeWidth=".9" fill="#6f9fbd" opacity=".9"><path d="M-14 12-10-5-4 11zM-4 13 1-13 6 12zM6 12 11-7 15 11z"/><path d="M-10-5-8 8M1-13 2 9M11-7 12 8" stroke="#eefbff"/></g>;
    default:return null;
  }
}

function StructureGlyph({tile}:{tile:WorldHexTile}){
  if(tile.structureType==='CITY') return <g transform="translate(0 7)" stroke="#fff2c9" strokeWidth=".8" fill="#2b2928" opacity=".92"><rect x="-14" y="-8" width="7" height="11"/><rect x="-5" y="-13" width="10" height="16"/><rect x="7" y="-7" width="7" height="10"/><path d="M-14-8l3-4 4 4M-5-13 0-18 5-13M7-7l4-4 3 4" fill="#574b42"/></g>;
  if(tile.structureType==='VILLAGE') return <g transform="translate(0 8)" stroke="#f3dfb4" strokeWidth=".9" fill="#514334"><path d="M-13 1v-7l6-5 6 5v7zM2 1v-6l5-4 5 4v6z"/><path d="M-14-6-7-13 0-6M1-5 7-11 13-5" fill="#6c5540"/></g>;
  if(tile.structureType==='SHRINE') return <g stroke="#ffe7f4" strokeWidth="1.3"><path d="M-13 3h26M-10-2h20M-8-2v14M8-2v14" fill="none"/></g>;
  if(tile.structureType==='WAYSTATION') return <g transform="translate(0 5)" stroke="#f7e2a7" strokeWidth="1" fill="#4b3d2f"><path d="M-14 8V-3L-5-10 3-3V8z"/><path d="M-5-10 0-14 7-7" fill="#6b5238"/><rect x="5" y="-2" width="8" height="10"/><path d="M9-2v-8M5-8h8M-10 1h4M8 2h2" fill="none"/></g>;
  return null;
}

function FeatureGlyph({tile}:{tile:WorldHexTile}){
  switch(tile.featureType){
    case 'MINE': return <g transform="translate(0 5)" stroke="#f7d78a" strokeWidth="1.5" fill="#191817"><path d="M-11 8V1Q0-11 11 1v7z"/><path d="M-6 8V2Q0-5 6 2v6"/><path d="M-15-10 12 12M-9-13 15 10" opacity=".65"/></g>;
    case 'CANYON': return <g stroke="#f3b47b" strokeWidth="2" fill="none"><path d="M-6-18-2-8-8 0 1 7-3 18M7-17 4-7 10 2 3 9 8 17"/></g>;
    case 'SINKHOLE': return <g fill="#111" stroke="#aaa" opacity=".9"><ellipse cx="0" cy="2" rx="13" ry="8"/><ellipse cx="0" cy="2" rx="8" ry="4" fill="#050505"/></g>;
    case 'DUNGEON': return <g transform="translate(0 4)" stroke="#f4ddff" strokeWidth="1.2" fill="#281e32"><path d="M-14 11V-2l5-6 4 4 5-9 5 9 4-4 5 6v13z"/><path d="M-5 11V2Q0-5 5 2v9" fill="#0d0a10"/><circle cx="0" cy="-5" r="2" fill="#c9a3e8"/></g>;
    case 'ORE_VEIN': return <g stroke="#e9fbff" fill="#6fb8c4" opacity=".95"><path d="M-15 11-9-5-3 10zM-5 12 1-14 7 11zM6 11 11-7 16 10z"/><circle cx="-10" cy="-8" r="2" fill="#ffe08a"/><circle cx="11" cy="-10" r="1.7" fill="#b9f4ff"/></g>;
    case 'LAYER_BOSS': return <g stroke="#ffd1d1" fill="#6e2020" strokeWidth="1.2"><path d="M0-16 6-7 16-5 9 3 11 14 0 9-11 14-9 3-16-5-6-7z"/><path d="M-5 1 0 6 6-2M-7-4l3-3m11 3-3-3" fill="none"/></g>;
    case 'HELL_GATE': return <g stroke="#ff7b5f" strokeWidth="1.4" fill="#1c0c0a"><path d="M-12 13V0Q0-17 12 0v13z"/><path d="M-6 13V2Q0-7 6 2v11"/><path d="M-8-7l-5-8M8-7l5-8"/><circle cx="0" cy="2" r="2" fill="#ff5f3a"/></g>;
    case 'DUNGEON_RESERVED': return <g transform="translate(0 4)" stroke="#d9c7f6" strokeWidth="1.3" fill="#211b29"><path d="M-10 11V0Q0-12 10 0v11z"/><path d="M-4 11V2Q0-4 4 2v9"/><circle cx="0" cy="4" r="1.5" fill="#bca7df"/></g>;
    case 'RESOURCE': return <g fill="#95ecff" stroke="#e2fbff" strokeWidth=".8"><path d="M0-15 8-3 4 13-5 12-9-2z"/><path d="M0-15-1 10M8-3-5 12"/></g>;
    case 'ENEMY_OUTPOST': return <g stroke="#ffd0d0" fill="#5c2323"><path d="M-12 11V-5h24v16z"/><path d="M-15-5-8-12-2-5 5-13 13-5"/><path d="M0-3v14"/></g>;
    case 'RUIN': return <g stroke="#d8d0bf" fill="#514d45"><path d="M-13 12V-8h5v20m4 0V-3h6v15m5 0V-10h5v22"/></g>;
    default:return null;
  }
}

export function HexTerrainArt({tile,x,y,showDetails=true,isAbella=false}:{tile:WorldHexTile;x:number;y:number;showDetails?:boolean;isAbella?:boolean}){
  return <g transform={`translate(${x} ${y})`} pointerEvents="none">
    {tile.waterConnections?.map((dir)=>{const p=edgePoint(roadAngles[dir]);return <line key={`w${dir}`} x1="0" y1="0" x2={p.x} y2={p.y} stroke="#71d4eb" strokeWidth="8" strokeLinecap="round" opacity=".75"/>;})}
    {showDetails&&<TerrainGlyph tile={tile}/>} 
    {tile.roadConnections?.map((dir)=>{const p=edgePoint(roadAngles[dir]);return <g key={`r${dir}`}><line x1="0" y1="0" x2={p.x} y2={p.y} stroke="#392f26" strokeWidth="5" strokeLinecap="round"/><line x1="0" y1="0" x2={p.x} y2={p.y} stroke="#c4a775" strokeWidth="2.2" strokeLinecap="round"/></g>;})}
    {showDetails&&<StructureGlyph tile={tile}/>} 
    {showDetails&&<FeatureGlyph tile={tile}/>} 
    {isAbella&&<g transform="translate(0 2)" stroke="#fff1a8" strokeWidth="1" fill="#403b50"><path d="M-16 6-9-4-1 1 7-8 16 3 8 12-6 12z"/><rect x="-8" y="-8" width="5" height="8"/><rect x="3" y="-12" width="6" height="11"/><path d="M-10 12 0 18 10 12" fill="#665d78"/></g>}
  </g>;
}
