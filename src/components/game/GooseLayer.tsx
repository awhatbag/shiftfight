import walk from '@/assets/goose-walking_goose.png.asset.json';
import fly from '@/assets/goose-flying_goose.png.asset.json';
import honk from '@/assets/goose-honking_goose.png.asset.json';
import attack from '@/assets/goose-attack_goose.png.asset.json';
import cloud from '@/assets/goose-melee_cloud.png.asset.json';
import { BED_SLOTS } from '@/game/wardNav';
import { GOOSE_MELEE_MS, type GooseWorld } from '@/game/gooseRuntime';
import { Button } from '@/components/ui/button';
// Option 2: attack/flying geese are boosted so their visual presence matches the standing walker.
const GOOSE_SCALE: Record<string, number> = { walk: 1, honk: 1, block: 1, attackWalk: 1.28, melee: 1.28, fly: 1.25, exit: 1.25 };
export function GooseLayer({world, blockedGoose = null, shooDisabled = false, onShoo}:{world:GooseWorld|null; blockedGoose?:number|null; shooDisabled?:boolean; onShoo?:(()=>void)|undefined}){
 if(!world)return null;
 const blocker=!world.exiting?world.geese.find(g=>g.id===blockedGoose&&g.mode==='block'):undefined;
 const shooing=blocker?.shooBy==='nurse';
 return <>{world.geese.map(g=>{
  if(g.mode==='waiting'||g.mode==='gone')return null;
  const flying=g.mode==='fly'||g.mode==='exit';
   const src=flying?fly.url:g.mode==='honk'||g.mode==='block'?honk.url:g.mode==='attackWalk'||g.mode==='melee'?attack.url:walk.url;
   const scale=GOOSE_SCALE[g.mode]??1;
   const animationTime=world.exiting&&g.mode!=='exit'&&g.mode!=='exitRun'?(world.exitStarted??world.time):world.time;
   const frame=Math.floor((animationTime-g.since)/210)%6;
   return <div key={g.id} data-goose={g.id} data-mode={g.mode} data-frame={frame} className="pointer-events-none absolute" style={{left:`${g.pos.x*100}%`,top:`${g.pos.y*100}%`,width:'16%',aspectRatio:'600 / 660',transform:'translate(-50%,-94%)',zIndex:g.pos.y<.12?8:flying?80:g.desk?34:Math.round(g.pos.y*100)+2}}>
    <div className="h-full w-full overflow-hidden [image-rendering:pixelated]" style={{backgroundImage:`url(${src})`,backgroundSize:'600% 100%',backgroundPosition:`${frame/5*100}% 0%`,transformOrigin:'50% 100%',transform:`scale(${scale}) scaleX(${g.faceLeft?(src===walk.url?1:-1):(src===walk.url?-1:1)})`}}/>
     {blocker?.id===g.id&&onShoo&&<Button variant="ghost" aria-label="Shoo blocking goose" disabled={shooDisabled||shooing} onClick={onShoo} className="pointer-events-auto absolute inset-0 h-full w-full rounded-none p-0 hover:bg-transparent focus-visible:ring-4 focus-visible:ring-alarm"/>}
   {!world.exiting&&g.mode==='honk'&&g.id%2===0&&world.time-g.since<650&&<span className="pixel-count absolute bottom-full left-1/2 -translate-x-1/2 text-sm">HONK!</span>}
  </div>;
  })}{!world.exiting&&world.geese.filter(g=>g.mode==='melee'&&g.bed!==null).map(g=>{
   const slot=g.bed===null?undefined:BED_SLOTS[g.bed];if(!slot)return null;
   const t=Math.max(0,Math.min(1,(world.time-g.since)/GOOSE_MELEE_MS));
   const frame=Math.min(7,Math.floor(t*8));
   // Comic "poof": balloon in with a slight overshoot, hold full size, shrink away at the end.
   const scale=t<.15?.2+(t/.15)*.85:t<.22?1.05-((t-.15)/.07)*.05:t>.85?Math.max(.2,1-((t-.85)/.15)*.8):1;
   return <div key={`cloud-${g.id}`} data-melee-bed={g.bed} className="pointer-events-none absolute overflow-hidden [image-rendering:pixelated]" style={{left:`${slot.x*100}%`,top:`${slot.y*100}%`,width:'25%',aspectRatio:'560 / 360',transform:`translate(-50%,-50%) scale(${scale})`,zIndex:Math.round(slot.y*100)+5,backgroundImage:`url(${cloud.url})`,backgroundSize:'800% 100%',backgroundPosition:`${frame/7*100}% 0%`}}/>;
   })}{blocker&&onShoo&&<div className="pointer-events-none absolute z-[90] -translate-x-1/2 -translate-y-full" style={{left:`${Math.max(.4,Math.min(.6,blocker.pos.x))*100}%`,top:`${Math.max(.16,blocker.pos.y-.13)*100}%`}}>
    <div className={shooing?'':'motion-safe:animate-bounce'}>
      <Button aria-label="Tap to shoo goose" disabled={shooDisabled||shooing} onClick={onShoo} className="chunky pointer-events-auto h-24 min-w-80 border-4 border-border bg-alarm px-6 font-display text-3xl font-black text-alarm-foreground hover:bg-alarm/90 active:scale-95 disabled:opacity-100"><span aria-hidden="true" className="text-4xl">👋</span>{shooing?'SHOOING…':'TAP TO SHOO!'}</Button>
      <span aria-hidden="true" className="mx-auto -mt-1 block h-6 w-6 rotate-45 border-b-4 border-r-4 border-border bg-alarm"/>
    </div>
   </div>}</>;
}
