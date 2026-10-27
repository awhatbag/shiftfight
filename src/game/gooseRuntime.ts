import { BED_ARRIVAL, DOOR_POINT, routeTo, type Point } from './wardNav';
export const GOOSE_COUNT=8;
export const GOOSE_DURATION_MS=30_000;
export const GOOSE_MELEE_MS=2200;
export const NURSE_SHOO_MS=1500;
export const STAFF_SHOO_MS=1000;
export const GOOSE_SAFE_MS=5000;
export type GooseMode='waiting'|'walk'|'honk'|'block'|'fly'|'attackWalk'|'melee'|'exit'|'exitRun'|'gone';
export type Goose={id:number; pos:Point; path:Point[]; mode:GooseMode; since:number; until:number; arriveAt:number; faceLeft:boolean; bed:number|null; safeUntil:number; desk:boolean; flightFrom?:Point; flightTo?:Point; shooBy?:string | undefined; attackUntil?:number; exitSpeed?:number;};
export type GooseWorld={geese:Goose[]; time:number; nextAttack:number; attacks:number; target:number; bedHits:Record<number,number>; exiting:boolean; exitIndex:number; nextExit:number; exitStarted?:number; /** Goose currently obstructing the nurse: it waits for SHOO instead of timing out. */ heldGoose?:number|null;};
const FLOOR:Point[]=[...BED_ARRIVAL,{x:.485,y:.32},{x:.485,y:.465},{x:.485,y:.62},{x:.5,y:.76},{x:.52,y:.92}];
const DESK:Point[]=[{x:.35,y:.19},{x:.5,y:.19},{x:.65,y:.19}];
export const gooseDistance=(a:Point,b:Point)=>Math.hypot((a.x-b.x)*.8,a.y-b.y);
export function newGooseWorld(rng= Math.random):GooseWorld{return {time:0,nextAttack:2300,attacks:0,target:7+Math.min(3,Math.floor(rng()*4)),bedHits:{},exiting:false,exitIndex:0,nextExit:0,geese:Array.from({length:GOOSE_COUNT},(_,id)=>({id,pos:{...DOOR_POINT},path:[],mode:'waiting',since:0,until:0,arriveAt:id*700,faceLeft:false,bed:null,safeUntil:0,desk:false}))};}
function choose<T>(a:T[],rng:()=>number):T|undefined{return a[Math.min(a.length-1,Math.floor(rng()*a.length))];}
function travel(g:Goose,dest:Point,mode:GooseMode,now:number){g.path=routeTo(dest,g.pos);g.mode=mode;g.since=now;}
function fly(g:Goose,dest:Point,now:number,exit=false){g.flightFrom={...g.pos};g.flightTo=dest;g.path=[];g.mode=exit?'exit':'fly';g.since=now;g.until=now+Math.max(700,gooseDistance(g.pos,dest)*1900);}
function roam(g:Goose,now:number,rng:()=>number){
 const r=rng();g.bed=null;g.since=now;
 if(r<.18){const dest=choose(g.desk?FLOOR:rng()<.3?DESK:FLOOR,rng);if(dest){g.desk=DESK.includes(dest);fly(g,dest,now);}return;}
 if(r<.48){g.mode='honk';g.until=now+900+g.id*35;return;}
 if(r<.68&&!g.desk&&now>=g.safeUntil){g.mode='block';g.until=now+2200;return;}
 const dest=choose(g.desk?DESK:FLOOR,rng);if(dest){if(g.desk){g.path=[dest];g.mode='walk';}else travel(g,dest,'walk',now);}
}
export function startGooseExit(w:GooseWorld){w.exiting=true;w.exitStarted=w.time;w.exitIndex=0;w.nextExit=w.time;for(const g of w.geese){g.shooBy=undefined;g.bed=null;g.path=[];if(g.mode==='waiting')g.mode='gone';}}
export function gooseNeedsDoor(w:GooseWorld){return w.exiting?w.geese.some(g=>g.mode!=='gone'):w.geese.some(g=>g.mode==='waiting'&&w.time>=g.arriveAt||g.mode!=='waiting'&&g.mode!=='gone'&&g.pos.y<.2);}
/** Move along each existing navigation segment, never cutting corners. */
function walk(g:Goose,dt:number,speed:number){let left=dt*speed;while(left>0&&g.path.length){const p=g.path[0];if(!p)break;const d=gooseDistance(g.pos,p);g.faceLeft=p.x<g.pos.x;if(d<=left){g.pos={...p};g.path.shift();left-=d;}else{const r=left/d;g.pos={x:g.pos.x+(p.x-g.pos.x)*r,y:g.pos.y+(p.y-g.pos.y)*r};left=0;}}}
export function stepGooseWorld(w:GooseWorld,dt:number,occupied:number[],busy:number[],doorOpen:boolean,rng=Math.random):number[]{
 w.time+=Math.max(0,dt);const now=w.time;const completed:number[]=[];
 if(w.exiting){
  if(!w.exitIndex){
   if(!doorOpen)return completed;
   // Everyone sets off together; arrival times are staggered so they reach the door one after another.
   const active=w.geese.filter(g=>g.mode!=='gone').sort((a,b)=>gooseDistance(a.pos,DOOR_POINT)-gooseDistance(b.pos,DOOR_POINT));
   active.forEach((g,rank)=>{const arrive=now+1100+rank*550;
    if(!g.desk&&g.id%2===0){g.path=routeTo(DOOR_POINT,g.pos);g.mode='exitRun';g.since=now;g.until=arrive;let len=0,p=g.pos;for(const q of g.path){len+=gooseDistance(p,q);p=q;}g.exitSpeed=len/Math.max(1,arrive-now);}
    else{fly(g,DOOR_POINT,now,true);g.until=arrive;}});
   w.exitIndex=1;
  }
  for(const g of w.geese){
   if(g.mode==='exitRun'){walk(g,dt,g.exitSpeed??.0006);if(!g.path.length||now>=g.until){g.pos={...DOOR_POINT};g.mode='gone';}}
   else if(g.mode==='exit'){advanceFlight(g,now);if(now>=g.until)g.mode='gone';}
  }
  return completed;
 }
 for(const g of w.geese){
  if(g.mode==='waiting'){if(now<g.arriveAt||!doorOpen)continue;const dest=FLOOR[g.id%FLOOR.length];if(dest)travel(g,dest,'walk',now);}
  if(g.mode==='gone')continue;
  if(g.shooBy){if(now<g.until)continue;g.shooBy=undefined;g.safeUntil=now+GOOSE_SAFE_MS;const dest=choose(FLOOR.filter(p=>gooseDistance(g.pos,p)>.1),rng);if(dest)fly(g,dest,now);}
  if(g.mode==='fly'){advanceFlight(g,now);if(now>=g.until)roam(g,now,rng);continue;}
   if(g.mode==='walk'||g.mode==='attackWalk'){
    walk(g,dt,.00022);
   if(!g.path.length){if(g.mode==='attackWalk'&&g.bed!==null&&occupied.includes(g.bed)&&!busy.includes(g.bed)&&gooseDistance(g.pos,BED_ARRIVAL[g.bed]??DOOR_POINT)<.008){g.mode='melee';g.since=now;g.until=now+GOOSE_MELEE_MS;}else roam(g,now,rng);}
  }else if(g.mode==='melee'&&now>=g.until){
   const bed=g.bed;g.bed=null;g.attackUntil=now+2000;
   if(bed!==null&&occupied.includes(bed)&&!busy.includes(bed)){completed.push(bed);busy=[...busy,bed];w.attacks++;w.bedHits[bed]=(w.bedHits[bed]??0)+1;}
   g.safeUntil=now+1500;roam(g,now,rng);
  }else if((g.mode==='honk'||g.mode==='block')&&now>=g.until&&!(g.mode==='block'&&g.id===w.heldGoose))roam(g,now,rng);
 }
 if(now>=w.nextAttack&&now<GOOSE_DURATION_MS-2000&&w.attacks+w.geese.filter(g=>g.bed!==null).length<w.target){
  const reserved=w.geese.flatMap(g=>g.bed===null?[]:[g.bed]);
  const beds=occupied.filter(b=>!busy.includes(b)&&!reserved.includes(b));
  beds.sort((a,b)=>(w.bedHits[a]??0)-(w.bedHits[b]??0));
  const bed=beds[0];const dest=bed===undefined?undefined:BED_ARRIVAL[bed];
  const candidates=w.geese.filter(g=>!g.desk&&!g.shooBy&&g.id!==w.heldGoose&&now>=(g.attackUntil??0)&&['walk','honk','block'].includes(g.mode));
  if(dest&&bed!==undefined){candidates.sort((a,b)=>gooseDistance(a.pos,dest)-gooseDistance(b.pos,dest));const g=candidates[0];if(g){g.bed=bed;travel(g,dest,'attackWalk',now);w.nextAttack=now+2700;}}
 }
 return completed;
}
function advanceFlight(g:Goose,now:number){const a=g.flightFrom,b=g.flightTo;if(!a||!b)return;const t=Math.max(0,Math.min(1,(now-g.since)/(g.until-g.since)));g.faceLeft=b.x<a.x;g.pos={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*.075};if(t===1)g.pos={...b};}
/** Only a grounded, intentionally blocking goose in the upcoming movement segment can obstruct. */
export function blockingGoose(w:GooseWorld|null,from:Point,to:Point):Goose|undefined{
 if(!w||w.exiting)return;
 return w.geese.find(g=>{if(g.mode!=='block'||g.desk||g.safeUntil>w.time)return false;const dx=to.x-from.x,dy=to.y-from.y;const den=dx*dx+dy*dy;const t=den?Math.max(0,Math.min(1,((g.pos.x-from.x)*dx+(g.pos.y-from.y)*dy)/den)):0;const near={x:from.x+dx*t,y:from.y+dy*t};return gooseDistance(g.pos,near)<.035&&gooseDistance(from,g.pos)<.085;});
}
export function shooGoose(w:GooseWorld,id:number,actor:string){const g=w.geese.find(g=>g.id===id);if(!g||g.mode!=='block'||w.exiting)return false;if(g.shooBy)return g.shooBy===actor;g.shooBy=actor;g.since=w.time;g.until=w.time+(actor==='nurse'?NURSE_SHOO_MS:STAFF_SHOO_MS);return true;}
export const gooseExitComplete=(w:GooseWorld)=>w.exiting&&w.geese.every(g=>g.mode==='gone');
