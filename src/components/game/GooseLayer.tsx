import walk from '@/assets/goose-walking_goose.png.asset.json';
import fly from '@/assets/goose-flying_goose.png.asset.json';
import honk from '@/assets/goose-honking_goose.png.asset.json';
import attack from '@/assets/goose-attack_goose.png.asset.json';
import cloud from '@/assets/goose-melee_cloud.png.asset.json';
import { BED_SLOTS } from '@/game/wardNav';
import { GOOSE_MELEE_MS, type GooseWorld } from '@/game/gooseRuntime';
// Option 2: attack/flying geese are boosted so their visual presence matches the standing walker.
const GOOSE_SCALE: Record<string, number> = { walk: 1, honk: 1, block: 1, attackWalk: 1.28, melee: 1.28, fly: 1.25, exit: 1.25 };
export function GooseLayer({world}:{world:GooseWorld|null}){
 if(!world)return null;
 return <>{world.geese.map(g=>{
  if(g.mode==='waiting'||g.mode==='gone')return null;
  const flying=g.mode==='fly'||g.mode==='exit';
  const src=flying?fly.url:g.mode==='honk'||g.mode==='block'?honk.url:g.mode==='attackWalk'||g.mode==='melee'?attack.url:walk.url;
  const animationTime=world.exiting&&g.mode!=='exit'?(world.exitStarted??world.time):world.time;
  const frame=Math.floor((animationTime-g.since)/160)%6;
  return <div key={g.id} data-goose={g.id} data-mode={g.mode} data-frame={frame} className="pointer-events-none absolute" style={{left:`${g.pos.x*100}%`,top:`${g.pos.y*100}%`,width:'16%',aspectRatio:'600 / 660',transform:'translate(-50%,-94%)',zIndex:g.pos.y<.12?8:flying?80:g.desk?34:Math.round(g.pos.y*100)+2}}>
   <div className="h-full w-full overflow-hidden [image-rendering:pixelated]" style={{backgroundImage:`url(${src})`,backgroundSize:'600% 100%',backgroundPosition:`${frame/5*100}% 0%`,transform:`scaleX(${g.faceLeft?(src===walk.url?1:-1):(src===walk.url?-1:1)})`}}/>
   {!world.exiting&&g.mode==='honk'&&g.id%2===0&&world.time-g.since<650&&<span className="pixel-count absolute bottom-full left-1/2 -translate-x-1/2 text-sm">HONK!</span>}
  </div>;
 })}{!world.exiting&&world.geese.filter(g=>g.mode==='melee'&&g.bed!==null).map(g=>{
  const slot=g.bed===null?undefined:BED_SLOTS[g.bed];if(!slot)return null;
  const frame=Math.min(7,Math.floor((world.time-g.since)/GOOSE_MELEE_MS*8));
  return <div key={`cloud-${g.id}`} data-melee-bed={g.bed} className="pointer-events-none absolute overflow-hidden [image-rendering:pixelated]" style={{left:`${slot.x*100}%`,top:`${slot.y*100}%`,width:'25%',aspectRatio:'560 / 360',transform:'translate(-50%,-50%)',zIndex:Math.round(slot.y*100)+5,backgroundImage:`url(${cloud.url})`,backgroundSize:'800% 100%',backgroundPosition:`${frame/7*100}% 0%`}}/>;
 })}</>;
}
