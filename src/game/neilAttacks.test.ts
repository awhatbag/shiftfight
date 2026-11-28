import { describe, expect, it } from "vitest";
import { BOSS_BATTLE_CONFIG as C, NEIL_ARENA_LAYOUT as L } from "../config/bossBattleConfig";
import { phaseFor } from "./bosses";
import { attackDamage, canStartNeilAttack, chooseNeilAttack, createNeilAttack, laneCenters, NEIL_ATTACK_NAMES, stepNeilAttacks, takeNurseDamage, threatHitsNurse, threatPosition, type NeilAttackKind } from "./neilAttacks";

describe("Stage 3 approved combat rules",()=>{
  it.each([["pen",1],["clockIn",5],["clockOut",5],["roster",5],["rejected",5],["bed",10]] as const)("%s damage is %i HP",(kind,damage)=>expect(attackDamage(kind)).toBe(damage));
  it("invulnerability lasts exactly 1200ms and HP never becomes negative",()=>{
    const hit=takeNurseDamage({hp:6,invulnerableUntil:0},5,100);
    expect(hit).toEqual({hp:1,invulnerableUntil:1300});
    expect(takeNurseDamage(hit,10,1299)).toBe(hit);
    expect(takeNurseDamage(hit,10,1300).hp).toBe(0);
  });
  it("phase thresholds stay 60 and 25 with 100 Neil HP",()=>{
    expect(C.bossMaxHp).toBe(100);expect(phaseFor(61)).toBe(1);expect(phaseFor(60)).toBe(2);
    expect(phaseFor(26)).toBe(2);expect(phaseFor(25)).toBe(3);expect(C.damage.nurseProjectile).toBe(1);
  });
  it("initial phase intervals are 3000/2500/2000ms",()=>expect([1,2,3].map(p=>C.attackPhases[p as 1|2|3].intervalMs)).toEqual([3000,2500,2000]));
  it("random selection cannot choose Staffing Ratios before phase 3",()=>{
    for(let i=0;i<100;i++) {expect(chooseNeilAttack(1,()=>i/100)).not.toBe("bed");expect(chooseNeilAttack(2,()=>i/100)).not.toBe("bed");}
    expect(chooseNeilAttack(3,()=>0.99)).toBe("bed");
    expect(chooseNeilAttack(1,()=>0)).not.toBe(chooseNeilAttack(1,()=>0.9));
  });
  it("normal has one pattern and overlaps cannot trap targeted warnings",()=>{
    const pen=createNeilAttack(0,"pen",1,0,0.5,0.5);
    expect(canStartNeilAttack([pen],"roster",1,()=>0)).toBe(false);
    expect(canStartNeilAttack([pen],"roster",2,()=>0)).toBe(true);
    expect(canStartNeilAttack([pen],"clockOut",3,()=>0)).toBe(false);
    expect(canStartNeilAttack([createNeilAttack(1,"rejected",3,0,0.5,0.5)],"pen",3,()=>0)).toBe(false);
  });
  it("clock marker follows briefly then freezes at the marked location",()=>{
    const a=createNeilAttack(0,"clockOut",1,0,0.5,0.5);
    const tracking=stepNeilAttacks([a],0,a.trackUntil-1,0.7,{hp:100,invulnerableUntil:0});
    const tracked=tracking.attacks[0];if(!tracked)throw Error("missing attack");
    expect(tracked.targetX).toBe(0.7);
    const frozen=stepNeilAttacks([tracked],a.trackUntil-1,a.trackUntil+100,0.2,{hp:100,invulnerableUntil:0});
    expect(frozen.attacks[0]?.targetX).toBe(0.7);
  });
  it.each(Object.keys(NEIL_ATTACK_NAMES) as NeilAttackKind[])("%s warns, collides once, and has a horizontally reachable dodge",kind=>{
    const a=createNeilAttack(0,kind,3,0,0.5,0.5);
    expect(a.warningEnd-a.startsAt).toBeGreaterThanOrEqual(600);expect(a.warningEnd-a.startsAt).toBeLessThanOrEqual(1500);
    const threat=a.threats[0];if(!threat)throw Error("missing threat");
    const target=kind==="clockOut"||kind==="rejected";
    const impact=target?a.impactAt:threat.launchAt+(L.nurseLaneY+C.nurseHitbox.offsetY-threat.y)/threat.vy*1000;
    const position=threatPosition(a,threat,impact);
    expect(threatHitsNurse(a,threat,impact-16,impact,position.x)).toBe(true);
    const hit=stepNeilAttacks([a],impact-16,impact,position.x,{hp:100,invulnerableUntil:0});
    expect(hit.health.hp).toBe(100-attackDamage(kind));
    const again=stepNeilAttacks(hit.attacks,impact,impact+16,position.x,hit.health);
    expect(again.health.hp).toBe(hit.health.hp);
    const safe=target?L.nurseMinX:a.safeX;
    expect(Math.abs(safe-0.5)/C.nurseSpeed*1000).toBeLessThan(impact-a.trackUntil);
    for(const t of a.threats) {
      for(let now=t.launchAt;now<a.endAt;now+=16) expect(threatHitsNurse(a,t,now-16,now,safe)).toBe(false);
    }
  });
  it("lane walls leave sufficient physical clearance and expire",()=>{
    expect(laneCenters(0.5,C.bossAttacks.roster.width).every(x=>Math.abs(x-0.5)>C.attackSafeGapWidth/2)).toBe(true);
    const a=createNeilAttack(1,"bed",3,0,0.5,0.5);
    expect(a.threats.length).toBeGreaterThan(1);
    expect(stepNeilAttacks([a],a.endAt-1,a.endAt,0.5,{hp:100,invulnerableUntil:0}).attacks).toEqual([]);
  });
  it("every lane pattern keeps its corridor clear across the whole ward lane and all phases",()=>{
    for(const kind of ["pen","clockIn","roster","bed"] as const) for(const phase of [1,2,3] as const)
      for(const nurseX of [L.nurseMinX,0.29,0.5,0.7,L.nurseMaxX]) for(const bossX of [0.2,0.5,0.8]) {
        const a=createNeilAttack(0,kind,phase,0,nurseX,bossX,undefined,()=>0);
        expect(Math.abs(a.safeX-nurseX)/C.nurseSpeed*1000).toBeLessThan(C.bossAttacks[kind].warningMs);
        for(const t of a.threats) for(let now=t.launchAt;now<a.endAt;now+=32)
          expect(threatHitsNurse(a,t,now-32,now,a.safeX),`${kind} phase ${phase} nurse ${nurseX} boss ${bossX}`).toBe(false);
      }
  });
  it("overlapping lane attacks preserve a single shared safe corridor",()=>{
    const first=createNeilAttack(1,"roster",3,0,0.5,0.5,undefined,()=>0);
    const second=createNeilAttack(2,"bed",3,2700,0.8,0.2,first.safeX);
    expect(second.safeX).toBe(first.safeX);
    expect(canStartNeilAttack([first,second],"pen",3,()=>0)).toBe(false);
  });
});