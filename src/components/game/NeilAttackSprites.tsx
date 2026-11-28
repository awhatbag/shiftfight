import pen from "@/assets/boss/pen_attack.png.asset.json";
import timesheet from "@/assets/boss/timesheet_attack.png.asset.json";
import roster from "@/assets/boss/roster_attack.png.asset.json";
import clock from "@/assets/boss/clock_attack.png.asset.json";
import markers from "@/assets/boss/clock_markers.png.asset.json";
import stamp from "@/assets/boss/stamp_attack.png.asset.json";
import rejected from "@/assets/boss/rejected_print.png.asset.json";
import bed from "@/assets/boss/bed_attack.png.asset.json";
import smoke from "@/assets/boss/bed_smoke.png.asset.json";
import { BOSS_BATTLE_CONFIG as C, NEIL_ARENA_LAYOUT as L } from "@/config/bossBattleConfig";
import { isTargetAttack, NEIL_ATTACK_NAMES, threatPosition, type NeilAttack } from "@/game/neilAttacks";

function Cell({src,frames,frame,w,h,x,y,z=20,opacity=1,spin=0}: {
  src:string;frames:number;frame:number;w:number;h:number;x:number;y:number;z?:number;opacity?:number;spin?:number;
}) {
  return <div aria-hidden className="pointer-events-none absolute [image-rendering:pixelated]"
    style={{width:w,height:h,left:x-w/2,top:y-h/2,zIndex:z,opacity,
      backgroundImage:`url(${src})`,backgroundSize:`${frames*100}% 100%`,backgroundPosition:`${frames>1?frame/(frames-1)*100:0}% 0`,
      backgroundRepeat:"no-repeat",transform:spin?`rotate(${spin}deg)`:undefined}} />;
}
export function NeilAttackSprites({attacks,now,width:W,height:H}: {attacks:NeilAttack[];now:number;width:number;height:number}) {
  return <>{attacks.map(a=>{
    if(now<a.startsAt)return null;
    const cfg=C.bossAttacks[a.kind];
    const targeted=isTargetAttack(a.kind);
    const warning=now<a.warningEnd;
    const y=(L.nurseLaneY+C.nurseHitbox.offsetY)*H;
    return <div key={a.id} data-neil-attack={a.kind} data-warning={warning?"true":"false"}
      data-safe-x={a.safeX} data-target-x={a.targetX}>
      {warning && <span className="pointer-events-none absolute inset-x-0 z-30 text-center font-display text-xs font-black uppercase text-destructive-foreground bg-destructive/80"
        style={{top:"48%"}} role="status">{NEIL_ATTACK_NAMES[a.kind]} !</span>}
      {targeted && <Cell src={markers.url} frames={5}
        frame={Math.max(1,Math.min(4,Math.floor((now-a.startsAt)/(a.warningEnd-a.startsAt)*5)))}
        w={cfg.width*W*1.5} h={cfg.height*H} x={a.targetX*W} y={L.nurseLaneY*H}
        z={14} opacity={0.5} />}
      {!targeted && a.threats.map((t,i)=>{
        const p=threatPosition(a,t,now);
        const waiting=now<t.launchAt;
        const arrivalX=t.x+t.vx*((L.nurseLaneY+C.nurseHitbox.offsetY-t.y)/t.vy);
        const w=cfg.visualWidth*W;
        const source=a.kind==="pen"?pen.url:a.kind==="clockIn"?timesheet.url:a.kind==="bed"?bed.url:roster.url;
        const frames=a.kind==="bed"?2:1;
        const ratio=a.kind==="pen"?380/381:a.kind==="clockIn"?1425/1066:a.kind==="bed"?520/350:1019/1500;
        return <div key={i}>
          {waiting && <div className="pointer-events-none absolute z-[14] border-2 border-dashed border-destructive bg-destructive/20"
            data-attack-lane style={{left:(arrivalX-t.width/2)*W,top:(L.nurseLaneY-C.nurseHitbox.height)*H,width:t.width*W,height:C.nurseHitbox.height*H}}
            aria-hidden />}
          {a.kind==="bed" && now>=t.launchAt-C.bossAttacks.bed.smokeMs && now<t.launchAt &&
            <Cell src={smoke.url} frames={6} frame={Math.min(5,Math.floor((now-(t.launchAt-C.bossAttacks.bed.smokeMs))/C.bossAttacks.bed.smokeMs*6))}
              w={w*1.8} h={w*1.8} x={t.x*W} y={t.y*H} />}
          {!waiting && !t.consumed && <Cell src={source} frames={frames} frame={a.kind==="bed"?Math.floor((now-t.launchAt)/C.bossFrameMs)%2:0}
            w={w} h={w*ratio} x={p.x*W} y={p.y*H} spin={a.kind==="pen"?(now-t.launchAt)/1000*C.bossAttacks.pen.spinDegPerSec:0} />}
        </div>;
      })}
      {targeted && now>=a.warningEnd && <>
        <Cell src={a.kind==="clockOut"?clock.url:stamp.url} frames={a.kind==="clockOut"?5:1}
          frame={a.kind==="clockOut"?Math.min(4,Math.floor((now-a.warningEnd)/(a.impactAt-a.warningEnd)*5)):0}
          w={cfg.visualWidth*W} h={cfg.visualWidth*W*(a.kind==="clockOut"?535/390:584/913)}
          x={a.targetX*W} y={(L.bossLaneY+C.attackSpawnOffsetY+(L.nurseLaneY+C.nurseHitbox.offsetY-L.bossLaneY-C.attackSpawnOffsetY)*Math.min(1,(now-a.warningEnd)/(a.impactAt-a.warningEnd)))*H} />
        {a.kind==="rejected" && now>=a.impactAt && <Cell src={rejected.url} frames={1} frame={0}
          w={cfg.visualWidth*W} h={cfg.visualWidth*W*364/1107} x={a.targetX*W} y={y} z={14} />}
      </>}
    </div>;
  })}</>;
}