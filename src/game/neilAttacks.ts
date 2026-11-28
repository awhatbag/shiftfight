import { BOSS_BATTLE_CONFIG as C, NEIL_ARENA_LAYOUT as L } from "../config/bossBattleConfig";
import type { BossPhase } from "./bosses";

export const NEIL_ATTACK_NAMES = {
  pen: "Pen Barrage", clockIn: "Clock In", clockOut: "Clock Out",
  roster: "Roster Reshuffle", rejected: "Annual Leave Denied", bed: "Staffing Ratios",
} as const;
export type NeilAttackKind = keyof typeof NEIL_ATTACK_NAMES;
export type Threat = {
  x: number; y: number; vx: number; vy: number; launchAt: number;
  width: number; height: number; consumed: boolean;
};
export type NeilAttack = {
  id: number; kind: NeilAttackKind; phase: BossPhase; createdAt: number;
  startsAt: number; warningEnd: number; trackUntil: number; impactAt: number;
  endAt: number; targetX: number; safeX: number; threats: Threat[];
};
export type NurseDamageState = { hp: number; invulnerableUntil: number };
export function takeNurseDamage(state: NurseDamageState, damage: number, now: number): NurseDamageState {
  if (state.hp <= 0 || now < state.invulnerableUntil || damage <= 0) return state;
  return { hp: Math.max(0, state.hp - damage), invulnerableUntil: now + C.invulnerabilityMs };
}
export function attackDamage(kind: NeilAttackKind): number {
  if (kind === "pen") return C.damage.pen;
  if (kind === "bed") return C.damage.bed;
  if (kind === "roster") return C.damage.roster;
  if (kind === "rejected") return C.damage.rejected;
  return C.damage.clockInOut;
}
export function isTargetAttack(kind: NeilAttackKind) { return kind === "clockOut" || kind === "rejected"; }
export function chooseNeilAttack(phase: BossPhase, random = Math.random, laneOnly = false, raisedOnly = false): NeilAttackKind {
  const weights = C.attackPhases[phase].weights;
  const entries = (Object.keys(weights) as NeilAttackKind[]).filter(k => weights[k] > 0 && (!laneOnly || !isTargetAttack(k)) && (!raisedOnly || k !== "pen"));
  const total = entries.reduce((n,k) => n + weights[k], 0);
  let roll = random() * total;
  for (const kind of entries) { roll -= weights[kind]; if (roll < 0) return kind; }
  return entries[0] ?? "pen";
}
/** Only compatible lane patterns overlap; they reserve the same reachable safe corridor. */
export function canStartNeilAttack(active: NeilAttack[], kind: NeilAttackKind, phase: BossPhase, random = Math.random): boolean {
  const p = C.attackPhases[phase];
  if (!active.length) return true;
  return active.length < Math.min(C.attackMaxPatterns, p.maxPatterns) &&
    !isTargetAttack(kind) && active.every(a => !isTargetAttack(a.kind)) && random() < p.overlapChance;
}
const nurseCenterY = L.nurseLaneY + C.nurseHitbox.offsetY;
const startY = L.bossLaneY + C.attackSpawnOffsetY;
/** Lane centers include both movement extremes. A reserved gap also clears the nurse and threat widths. */
export function laneCenters(safeX: number, width: number, columns = C.bossAttacks.roster.columns): number[] {
  return Array.from({length: columns}, (_,i) => L.nurseMinX + i * (L.nurseMaxX-L.nurseMinX)/(columns-1))
    .filter(x => Math.abs(x-safeX) > C.attackSafeGapWidth/2 + width/2);
}
export function createNeilAttack(id: number, kind: NeilAttackKind, phase: BossPhase, now: number,
  nurseX: number, bossX: number, sharedSafeX?: number, random = Math.random): NeilAttack {
  const cfg = C.bossAttacks[kind];
  // Non-pen patterns begin their warnings when Neil actually reaches the hands-up frame.
  const startsAt = now + (kind === "pen" ? 0 : 5*C.bossRaiseStepMs);
  const warningEnd = startsAt + cfg.warningMs;
  const shift = random() < 0.5 ? -C.attackGapShift : C.attackGapShift;
  const proposed = nurseX + shift;
  const safeX = sharedSafeX ?? Math.max(L.nurseMinX, Math.min(L.nurseMaxX,
    proposed < L.nurseMinX || proposed > L.nurseMaxX ? nurseX-shift : proposed));
  const a: NeilAttack = { id, kind, phase, createdAt: now, startsAt, warningEnd,
    trackUntil: startsAt, impactAt: warningEnd, endAt: warningEnd,
    targetX: nurseX, safeX, threats: [] };
  if (isTargetAttack(kind)) {
    const target = kind === "clockOut" ? C.bossAttacks.clockOut : C.bossAttacks.rejected;
    a.trackUntil = startsAt + target.trackMs;
    a.impactAt = warningEnd + target.fallMs;
    a.endAt = a.impactAt + target.impactMs;
    a.threats = [{x:nurseX,y:startY,vx:0,vy:0,launchAt:warningEnd,width:target.width,height:target.height,consumed:false}];
    return a;
  }
  if (!("speed" in cfg)) return a;
  const speed = cfg.speed * C.attackPhases[phase].speedMultiplier;
  const lanes = laneCenters(safeX, cfg.width);
  const add = (x:number, launchAt:number, diagonal=false) => {
    const originX = diagonal ? bossX : x;
    const dy = (nurseCenterY-startY)/L.aspect;
    const dx = diagonal ? x-originX : 0;
    const len = Math.hypot(dx,dy);
    const vx = dx/len*speed, vy = dy/len*speed*L.aspect;
    a.threats.push({x:originX,y:startY,vx,vy,launchAt,width:cfg.width,height:cfg.height,consumed:false});
    a.endAt = Math.max(a.endAt,launchAt+(1+C.attackExitMargin-startY)/vy*1000);
  };
  if (kind === "pen") {
    for(let i=0;i<C.attackPhases[phase].penCount;i++) {
      const x = lanes[i%lanes.length]; if(x === undefined) continue;
      add(x,warningEnd+i*C.bossAttacks.pen.staggerMs,true);
    }
  } else if (kind === "clockIn") {
    for(let wave=0;wave<C.bossAttacks.clockIn.waves;wave++) lanes.forEach((x,i) => {
      if(i%2===wave%2) add(x,warningEnd+wave*C.bossAttacks.clockIn.waveGapMs);
    });
  } else if (kind === "bed") {
    for(let wave=0;wave<C.bossAttacks.bed.waves;wave++) lanes.forEach(x => add(x,warningEnd+wave*C.bossAttacks.bed.waveGapMs));
  } else lanes.forEach(x=>add(x,warningEnd));
  return a;
}
export function threatPosition(a: NeilAttack, threat: Threat, now: number) {
  if(isTargetAttack(a.kind)) {
    const progress = Math.max(0,Math.min(1,(now-a.warningEnd)/(a.impactAt-a.warningEnd)));
    return {x:a.targetX,y:startY+(nurseCenterY-startY)*progress};
  }
  const elapsed = Math.max(0,now-threat.launchAt)/1000;
  return {x:threat.x+threat.vx*elapsed,y:threat.y+threat.vy*elapsed};
}
/** Swept rectangle prevents fast sprites skipping through the nurse between ticks. */
export function threatHitsNurse(a: NeilAttack, threat: Threat, previous: number, now: number, nurseX: number) {
  if(threat.consumed || now < threat.launchAt) return false;
  const p = threatPosition(a,threat,Math.max(previous,threat.launchAt));
  const q = threatPosition(a,threat,now);
  const hx=(threat.width+C.nurseHitbox.width)/2, hy=(threat.height+C.nurseHitbox.height)/2;
  let lo=0,hi=1;
  for(const [origin,delta,min,max] of [[p.x,q.x-p.x,nurseX-hx,nurseX+hx],[p.y,q.y-p.y,nurseCenterY-hy,nurseCenterY+hy]]) {
    if(origin === undefined || delta === undefined || min === undefined || max === undefined) return false;
    if(Math.abs(delta)<1e-8) { if(origin<min || origin>max) return false; }
    else { const r=(min-origin)/delta,s=(max-origin)/delta;lo=Math.max(lo,Math.min(r,s));hi=Math.min(hi,Math.max(r,s));if(lo>hi)return false; }
  }
  return true;
}
export function stepNeilAttacks(attacks: NeilAttack[], previous: number, now: number, nurseX: number, health: NurseDamageState) {
  let nextHealth=health;
  const next:NeilAttack[]=[];
  for(const old of attacks) {
    if(now>=old.endAt)continue;
    const a={...old,targetX:now<old.trackUntil?nurseX:old.targetX,threats:old.threats.map(t=>({...t}))};
    for(const threat of a.threats) {
      if(threatHitsNurse(a,threat,previous,now,nurseX)) {
        nextHealth=takeNurseDamage(nextHealth,attackDamage(a.kind),now);
        // A collision is consumed even during invulnerability: no delayed damage from an old impact.
        threat.consumed=true;
      }
    }
    next.push(a);
  }
  return { attacks:next,health:nextHealth,hit:nextHealth.hp<health.hp };
}