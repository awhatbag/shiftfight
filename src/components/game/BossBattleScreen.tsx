import { useEffect, useRef, useState, type ReactNode } from "react";
import arenaArt from "@/assets/boss/neil_arena.jpg.asset.json";
import doorArt from "@/assets/boss/neil_door_strip.png.asset.json";
import neilArt from "@/assets/boss/neil_10_1_atlas.png.asset.json";
import neilHpArt from "@/assets/boss/neil_hp_bar.png.asset.json";
import cartArt from "@/assets/boss/nurse_cart.png.asset.json";
import nurseHpArt from "@/assets/boss/nurse_hp_bar.png.asset.json";
import { BOSS_BATTLE_CONFIG as CFG, NEIL_ARENA_LAYOUT as L } from "@/config/bossBattleConfig";
import {
  bossMovementProfile,
  bossRaiseTotalMs,
  canBossGlide,
  getBossRaiseFrame,
  hpForPhase,
  phaseFor,
  type BossDef,
  type BossPhase,
} from "@/game/bosses";
import type { PlayerCharacter } from "@/game/character";
import { Nurse, type NurseDirection } from "@/components/game/Nurse";
import { Button } from "@/components/ui/button";
import supplyEmptyArt from "@/assets/boss/supply_grid_empty.png.asset.json";
import supplyFullArt from "@/assets/boss/supply_grid_full.png.asset.json";
import projectileArt from "@/assets/boss/nurse_projectiles.png.asset.json";
import specialButtonArt from "@/assets/boss/nurse_special_button.png.asset.json";
import avocadoArt from "@/assets/avocado1.png.asset.json";
import gooseArt from "@/assets/boss/goose_special_icon.png.asset.json";
import pillowArt from "@/assets/pillow1.png.asset.json";
import { buzz } from "@/lib/sfx";
import { activateSpecial, cooldownRemaining } from "@/game/specialCooldowns";
import {
  createAimedProjectile,
  emptyNurseSupplies,
  hitsBossHitbox,
  isLowAmmo,
  isProjectileInBounds,
  refillNurseSupplies,
  shouldRestockAtTrolley,
  stepProjectile,
  stepRestockState,
  takeNurseProjectile,
  type NurseProjectile,
  type RestockState,
} from "@/game/nurseProjectiles";

const SUPPLY_ROWS = [[136,234],[246,343],[355,453],[464,561],[572,669],[680,778],[787,882],[892,987],[993,1088],[1097,1191]] as const;
const SUPPLY_COLS = [[40,140],[147,248]] as const;
const SPECIAL_BUTTONS = [
  { id: "avocado", label: "Avocado special attack", kind: "img", src: avocadoArt.url, sizeClass: "h-[62%] w-[62%]" },
  { id: "goose", label: "Goose special attack", kind: "img", src: gooseArt.url, sizeClass: "h-[76%] w-[76%]" },
  { id: "pillow", label: "Pillow special attack", kind: "img", src: pillowArt.url, sizeClass: "h-[64%] w-[64%]" },
] as const;
type SpecialId = (typeof SPECIAL_BUTTONS)[number]["id"];
const RESTOCK_PIXELS = [[6,0],[10,0],[14,0],[18,3],[21,6],[21,10],[21,14],[18,18],[14,21],[10,21],[6,21],[3,18],[0,14],[0,10],[0,6],[3,3]] as const;

/* ---------- supplied-artwork atlases (cut from the user's sheets) ---------- */

type Atlas = { src: string; cols: number; rows: number; cellW: number; cellH: number };
/**
 * Neil 10.1 atlas: 6 cols × 18 rows, uniform cells, bottom-anchored on his chair wheels.
 * Every animation row is proportionally normalised to the same 142px chair height.
 * Rows = phase block (0 normal, 1 flustered, 2 dishevelled) × 6 + animation row below.
 * Pens are cut out of the throw frames (pen artwork is supplied separately later).
 */
const NEIL: Atlas = { src: neilArt.url, cols: 6, rows: 18, cellW: 337, cellH: 315 };
const NEIL_ROW = { turn: 0, laugh: 1, left: 2, right: 3, raise: 4, throw: 5 } as const;
/** cell height relative to Neil's body (≈200px), so the layout's bossCellHeight still sizes his body */
const NEIL_CELL_SCALE = 315 / 200;

const DOOR = { src: doorArt.url, frames: 5, cellW: 357, cellH: 206 };
const HP_BARS = {
  neil: { src: neilHpArt.url, w: 1525, h: 267, fx0: 299, fx1: 1480, fy0: 99, fy1: 184 },
  nurse: { src: nurseHpArt.url, w: 1477, h: 244, fx0: 254, fx1: 1431, fy0: 94, fy1: 181 },
};

function SheetCell({ atlas, col, row, style }: { atlas: Atlas; col: number; row: number; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        backgroundImage: `url(${atlas.src})`,
        backgroundSize: `${atlas.cols * 100}% ${atlas.rows * 100}%`,
        backgroundPosition: `${atlas.cols > 1 ? (col / (atlas.cols - 1)) * 100 : 0}% ${atlas.rows > 1 ? (row / (atlas.rows - 1)) * 100 : 0}%`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}

/* ---------- health bar using one bar from the supplied artwork ---------- */

function HpBar({ kind, hp, max, align }: { kind: "neil" | "nurse"; hp: number; max: number; align: "left" | "right" }) {
  const b = HP_BARS[kind];
  const frac = Math.max(0, Math.min(1, hp / max));
  const fx = (b.fx0 / b.w) * 100;
  const fw = ((b.fx1 - b.fx0) / b.w) * 100;
  const fy = (b.fy0 / b.h) * 100;
  const fh = ((b.fy1 - b.fy0) / b.h) * 100;
  const inner = (filter: string) => (
    <img
      src={b.src}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        width: `${(100 / fw) * 100}%`,
        height: `${(100 / fh) * 100}%`,
        left: `${(-fx / fw) * 100}%`,
        top: `${(-fy / fh) * 100}%`,
        maxWidth: "none",
        filter,
        imageRendering: "pixelated",
      }}
    />
  );
  /* green (≈100°) slides toward red as hits land */
  const hue = -(1 - frac) * 100;
  return (
    <div
      className="relative"
      style={{ width: "48%", aspectRatio: `${b.w} / ${b.h}`, transform: align === "right" ? "scaleX(-1)" : undefined }}
      role="meter"
      aria-label={`${kind === "neil" ? "Neil" : "Nurse"} health`}
      aria-valuenow={Math.round(hp)}
      aria-valuemax={max}
    >
      <img src={b.src} alt="" draggable={false} className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} />
      <div className="absolute overflow-hidden" style={{ left: `${fx}%`, top: `${fy}%`, width: `${fw}%`, height: `${fh}%` }}>
        <div className="absolute inset-0 overflow-hidden">{inner(`hue-rotate(${hue}deg) saturate(1.15)`)}</div>
        <div
          className="absolute inset-y-0 right-0 overflow-hidden"
          style={{ width: `${(1 - frac) * 100}%`, transition: "width 600ms ease-out" }}
        >
          <div className="absolute inset-y-0 right-0" style={{ width: `${(100 / Math.max(0.0001, 1 - frac)) * 100}%`, maxWidth: "none" }}>
            {inner("grayscale(1) brightness(0.32)")}
          </div>
        </div>
      </div>
      <span
        className="font-display absolute bottom-[-2px] text-[10px] font-black text-primary-foreground"
        style={{ right: "6%", transform: align === "right" ? "scaleX(-1)" : undefined, textShadow: "0 1px 0 hsl(0 0% 0%)" }}
      >
        {Math.round(hp)}/{max}
      </span>
    </div>
  );
}

/* ---------- battle engine ---------- */

type Stage = "entering" | "turning" | "active" | "won" | "lost";

type Sim = {
  t: number;
  stage: Stage;
  stageAt: number;
  nurseX: number;
  nurseY: number;
  nurseTarget: number;
  nurseDir: NurseDirection;
  nurseMoving: boolean;
  bossX: number;
  bossTarget: number;
  bossPauseUntil: number;
  bossMoving: -1 | 0 | 1;
  bossLastErraticAt: number;
  doorOpen: boolean;
  doorFrame: number;
  doorAt: number;
  laughUntil: number;
  /** Dev Mode pose test: which animation to force, and until when */
  poseAnim: "throw" | "raise" | null;
  poseStart: number;
  poseUntil: number;
  /** throwables carried (filled by tapping the trolley) */
  ammo: number;
  restock: RestockState;
  restockRequested: boolean;
  restockActive: boolean;
  restockProgress: number;
  nextFireAt: number;
  nurseThrowUntil: number;
  projectiles: NurseProjectile[];
  nextProjectileId: number;
  specialUntil: Record<SpecialId, number>;
};

export type BossBattleProps = {
  boss: BossDef;
  character: PlayerCharacter;
  /** developer entry: shows test controls and never touches saved progress */
  dev?: boolean;
  onExit: () => void;
  onVictory?: () => void;
};

export function BossBattleScreen({ boss, character, dev = false, onExit, onVictory }: BossBattleProps) {
  const [nurseHp, setNurseHp] = useState<number>(CFG.nurseMaxHp);
  const [bossHp, setBossHp] = useState<number>(CFG.bossMaxHp);
  const phase = phaseFor(bossHp);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaPx, setArenaPx] = useState({ w: 0, h: 0 });
  const sim = useRef<Sim>({
    t: 0,
    stage: "entering",
    stageAt: 0,
    nurseX: L.door.centerX,
    nurseY: 1.06,
    nurseTarget: L.door.centerX,
    nurseDir: "north",
    nurseMoving: true,
    bossX: L.bossStartX,
    bossTarget: L.bossStartX,
    bossPauseUntil: 0,
    bossMoving: 0,
    bossLastErraticAt: 0,
    doorOpen: true,
    doorFrame: 0,
    doorAt: 0,
    laughUntil: 0,
    poseAnim: null,
    poseStart: 0,
    poseUntil: 0,
    ammo: emptyNurseSupplies().ammo,
    restock: { elapsedMs: 0, completedInZone: false },
    restockRequested: false,
    restockActive: false,
    restockProgress: 0,
    nextFireAt: 0,
    nurseThrowUntil: 0,
    projectiles: [],
    nextProjectileId: 0,
    specialUntil: { avocado: 0, goose: 0, pillow: 0 },
  });
  const [, setTick] = useState(0);
  const drag = useRef<{ id: number; startX: number; startNurse: number } | null>(null);
  const victoryRef = useRef(onVictory);
  victoryRef.current = onVictory;

  /* arena size */
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setArenaPx({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setArenaPx({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* outcome — victory/defeat only, no timer */
  useEffect(() => {
    const s = sim.current;
    if (s.stage === "won" || s.stage === "lost") return;
    if (bossHp <= 0) {
      s.stage = "won";
      if (!dev) victoryRef.current?.();
    } else if (nurseHp <= 0) s.stage = "lost";
  }, [bossHp, nurseHp, dev]);

  /* main loop */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;
      s.t += dt * 1000;
      const t = s.t;
      const dtMs = dt * 1000;

      /* door: step toward its target frame (0 closed … 4 fully open) */
      if (t - s.doorAt >= CFG.doorFrameMs) {
        const want = s.doorOpen ? DOOR.frames - 1 : 0;
        if (s.doorFrame !== want) {
          s.doorFrame += s.doorFrame < want ? 1 : -1;
          s.doorAt = t;
        }
      }

      if (s.stage === "entering") {
        /* wait for the door to swing open, then walk in */
        if (s.doorFrame >= DOOR.frames - 1 || s.nurseY < 1.04) {
          s.nurseY = Math.max(L.nurseLaneY, s.nurseY - CFG.nurseEntrySpeed * dt * L.aspect);
          s.nurseMoving = true;
        }
        if (s.nurseY < 0.95) s.doorOpen = false;
        if (s.nurseY <= L.nurseLaneY) {
          s.nurseY = L.nurseLaneY;
          s.nurseMoving = false;
          s.nurseDir = "south";
          s.stage = phaseFor(bossHpRef.current) === 1 ? "turning" : "active";
          s.stageAt = t;
        }
      } else if (s.stage === "turning") {
        if (t - s.stageAt >= CFG.bossTurnFrameMs * 6) {
          s.stage = "active";
          s.stageAt = t;
          s.bossPauseUntil = t + 400;
        }
      }

      if (s.stage === "active") {
        /* nurse follows the drag target along her lane */
        const dx = s.nurseTarget - s.nurseX;
        const step = CFG.nurseSpeed * dt;
        if (Math.abs(dx) > 0.002) {
          s.nurseX += Math.sign(dx) * Math.min(Math.abs(dx), step);
          s.nurseDir = dx > 0 ? "east" : "west";
          s.nurseMoving = true;
        } else {
          s.nurseMoving = false;
          s.nurseDir = s.restockActive ? "west" : "south";
        }

        /* restock only when the player tapped the trolley and the nurse arrived there */
        const canRestock = shouldRestockAtTrolley(s.restockRequested, s.nurseX, s.nurseY, L.cart.restockX, CFG.restockZone);
        const restockStep = stepRestockState(s.restock, canRestock, s.ammo, CFG.nurseAmmoCapacity, dtMs, CFG.restockMs);
        s.restock = { elapsedMs: restockStep.elapsedMs, completedInZone: restockStep.completedInZone };
        s.restockActive = restockStep.active;
        s.restockProgress = restockStep.progress;
        if (restockStep.completedNow) {
          s.ammo = refillNurseSupplies().ammo;
          s.restockRequested = false;
          s.nextFireAt = Math.min(s.nextFireAt, t);
        }

        /* automatic nurse attacks: fire every nurseFireIntervalMs when ammo remains and not restocking */
        if (!s.restockActive && s.ammo > 0 && t >= s.nextFireAt) {
          const shot = takeNurseProjectile(s);
          if (shot) {
            s.ammo = shot.ammo;
            s.nextFireAt = t + CFG.nurseFireIntervalMs;
            s.nurseThrowUntil = t + CFG.nurseThrowPoseMs;
            s.projectiles.push(
              createAimedProjectile(
                s.nextProjectileId++,
                shot.item,
                s.nurseX,
                s.nurseY - L.nurseHeight * 0.65,
                s.bossX,
                L.bossLaneY + CFG.bossHitbox.offsetY,
                CFG.nurseProjectileSpeed,
                L.aspect,
              ),
            );
          }
        }

        /* Neil glides between random spots; faster and more erratic as his HP declines */
        const moveProfile = bossMovementProfile(bossHpRef.current, CFG.bossMaxHp);
        if (!canBossGlide(s.poseAnim, t, s.poseUntil)) {
          s.bossMoving = 0;
        } else if (t >= s.bossPauseUntil) {
          const bdx = s.bossTarget - s.bossX;
          if (Math.abs(bdx) < 0.004) {
            s.bossMoving = 0;
            s.bossPauseUntil = t + moveProfile.pauseMinMs + Math.random() * (moveProfile.pauseMaxMs - moveProfile.pauseMinMs);
            let next = s.bossX;
            while (Math.abs(next - s.bossX) < 0.15) next = L.bossMinX + Math.random() * (L.bossMaxX - L.bossMinX);
            s.bossTarget = next;
          } else {
            if (
              moveProfile.erraticChancePerSec > 0 &&
              t - s.bossLastErraticAt >= CFG.bossErraticCooldownMs &&
              Math.random() < moveProfile.erraticChancePerSec * dt
            ) {
              s.bossLastErraticAt = t;
              let next = s.bossX;
              while (Math.abs(next - s.bossX) < 0.14) next = L.bossMinX + Math.random() * (L.bossMaxX - L.bossMinX);
              s.bossTarget = next;
            }
            const nextDx = s.bossTarget - s.bossX;
            s.bossX += Math.sign(nextDx) * Math.min(Math.abs(nextDx), moveProfile.speed * dt);
            s.bossMoving = nextDx > 0 ? 1 : nextDx < 0 ? -1 : 0;
          }
        } else s.bossMoving = 0;
      } else if (s.stage === "won" || s.stage === "lost") {
        s.nurseMoving = false;
        s.bossMoving = 0;
        s.restockRequested = false;
        s.restockActive = false;
        s.restockProgress = 0;
      }

      /* advance projectiles, check Neil hitbox collisions, and remove off-arena shots */
      let hits = 0;
      const remaining: NurseProjectile[] = [];
      for (const shot of s.projectiles) {
        const nextShot = stepProjectile(shot, dt);
        if (
          s.stage === "active" &&
          bossHpRef.current > 0 &&
          hitsBossHitbox(nextShot, s.bossX, L.bossLaneY, CFG.nurseProjectileHitbox, CFG.bossHitbox)
        ) {
          hits += 1;
          continue;
        }
        if (isProjectileInBounds(nextShot)) remaining.push(nextShot);
      }
      s.projectiles = remaining;
      if (hits > 0) {
        const nextHp = Math.max(0, bossHpRef.current - hits * CFG.damage.nurseProjectile);
        bossHpRef.current = nextHp;
        setBossHp(nextHp);
      }
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bossHpRef = useRef(bossHp);
  bossHpRef.current = bossHp;

  /* drag-anywhere controls */
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const s = sim.current;
    drag.current = { id: e.pointerId, startX: e.clientX, startNurse: s.nurseTarget };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !arenaPx.w) return;
    const s = sim.current;
    if (Math.abs(e.clientX - d.startX) > 3) s.restockRequested = false;
    s.nurseTarget = Math.max(L.nurseMinX, Math.min(L.nurseMaxX, d.startNurse + (e.clientX - d.startX) / arenaPx.w));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const s = sim.current;
  const H = arenaPx.h || 1;
  const W = arenaPx.w || 1;

  /* ---- Neil frame selection ---- */
  const atlas = NEIL;
  let col = 0;
  let anim: keyof typeof NEIL_ROW = "turn";
  let bob = 0;
  let laughing = false;
  let poseActive = false;
  let bossEnraged = false;
  const frameOf = (len: number, ms: number) => Math.floor(s.t / ms) % len;
  const bobOffset = Math.sin((s.t / CFG.bossIdleBobMs) * Math.PI * 2) * CFG.bossIdleBob;
  if (s.t < s.laughUntil) {
    laughing = true;
    anim = "laugh";
    bob = Math.abs(Math.sin((s.t / 140) * Math.PI)) * 0.03;
  } else if (s.poseAnim && s.t < s.poseUntil) {
    poseActive = true;
    anim = s.poseAnim;
    if (s.poseAnim === "throw") {
      col = frameOf(6, CFG.bossFrameMs);
    } else {
      const raiseFrame = getBossRaiseFrame(s.t - s.poseStart, CFG.bossRaiseStepMs, CFG.bossRaiseHoldMs);
      col = raiseFrame.col;
      bossEnraged = raiseFrame.enraged;
    }
  } else if (s.stage === "entering") {
    col = 0; // back to the nurse, facing the window
    bob = bobOffset;
  } else if (s.stage === "turning") {
    col = Math.min(5, Math.floor((s.t - s.stageAt) / CFG.bossTurnFrameMs));
  } else if (s.bossMoving !== 0) {
    anim = s.bossMoving > 0 ? "right" : "left";
    col = frameOf(4, CFG.bossFrameMs);
  } else if (phase === 1) {
    col = 5; // facing forward, resting
    bob = bobOffset;
  } else {
    anim = "raise";
    col = 0; // flustered/dishevelled resting pose (their sheets have no turn row)
    bob = bobOffset;
  }
  const row = (phase - 1) * 6 + NEIL_ROW[anim];
  const moveScale = s.bossMoving !== 0 && !laughing && !poseActive ? CFG.bossPhaseMoveScale[phase] : 1;
  const laughScale = laughing ? CFG.bossPhaseLaughScale[phase] : 1;
  const poseScale = poseActive ? CFG.bossPhasePoseScale[phase] : 1;
  const neilH = L.bossCellHeight * H * NEIL_CELL_SCALE * CFG.bossPhaseScale[phase] * moveScale * laughScale * poseScale;
  const neilW = (neilH * atlas.cellW) / atlas.cellH;
  const neilShakeX = bossEnraged ? Math.sin(s.t * 0.085) * 3 : 0;
  const neilShakeY = bossEnraged ? Math.cos(s.t * 0.11) * 1.5 : 0;

  /* ---- door geometry ---- */
  const doorW = L.door.widthFrac * W;
  const doorH = (doorW * DOOR.cellH) / DOOR.cellW;
  const doorTopY = L.door.bottom * H - doorH;
  const nurseH = L.nurseHeight * H;
  const nursePxY = s.nurseY * H;
  const nurseBehindDoor = nursePxY > doorTopY + doorH * 0.35;

  const ended = s.stage === "won" || s.stage === "lost";
  const cartW = L.cart.widthFrac * W;
  const cartH = (cartW * 1259) / 1222;
  const refilling = s.restockActive;
  const lowAmmo = isLowAmmo(s.ammo, CFG.lowAmmoThreshold);
  const cartBounce = refilling ? Math.abs(Math.sin(s.t / 90)) * cartH * 0.04 : 0;
  const requestRestock = () => {
    if (s.stage !== "active") return;
    s.nurseTarget = L.cart.restockX;
    if (s.ammo < CFG.nurseAmmoCapacity) {
      s.restockRequested = true;
      s.restock = { elapsedMs: 0, completedInZone: false };
    }
  };
  const instantRefill = () => {
    if (s.stage !== "active") return;
    s.ammo = refillNurseSupplies().ammo;
    s.restockRequested = false;
    s.nextFireAt = Math.min(s.nextFireAt, s.t);
  };
  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      <header className="shrink-0 border-b-2 border-border bg-card px-3 pb-2 pt-2" aria-label="Battle health">
        <div className="font-display mb-1 flex items-center justify-between gap-2 text-[11px] font-black uppercase">
          <span>Nurse</span>
          <span className="text-right">{boss.name} · Phase {phase}</span>
        </div>
        <div className={`flex items-center justify-between gap-2 ${s.stage === "active" || ended ? "" : "invisible"}`}>
          <HpBar kind="nurse" hp={nurseHp} max={CFG.nurseMaxHp} align="left" />
          <HpBar kind="neil" hp={bossHp} max={CFG.bossMaxHp} align="right" />
        </div>
      </header>
      {/* Independent arena and right-hand controls share the available height. */}
      <div className="relative min-h-0 flex-1" style={{ containerType: "size" }}>
        <div
          className="absolute left-1/2 top-1/2 grid items-stretch gap-2"
          style={{
            "--boss-sidebar-width": `min(${L.supplies.widthFrac * 100}cqw, ${L.supplies.maxWidthPx}px)`,
            width: `min(100cqw, calc(100cqh * ${L.aspect} + var(--boss-sidebar-width) + 8px))`,
            gridTemplateColumns: "minmax(0, 1fr) var(--boss-sidebar-width)",
            transform: "translate(-50%, -50%)",
          } as React.CSSProperties}
        >
        <div
          ref={arenaRef}
          aria-label="Neil boss arena"
          className="relative w-full touch-none select-none overflow-hidden"
          style={{
            aspectRatio: `${L.aspect}`,
            backgroundImage: `url(${arenaArt.url})`,
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Button
            onClick={onExit}
            onPointerDown={(e) => e.stopPropagation()}
            className="chunky-press font-display absolute bottom-[1.5%] right-[3%] z-40 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-black uppercase text-secondary-foreground"
            aria-label={`Exit ${boss.title}`}
          >
            Exit
          </Button>
          {/* stores trolley — tap to walk over and restock */}
          <button
            type="button"
            onClick={requestRestock}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Restock at trolley"
            className="absolute cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ left: L.cart.left * W, top: L.cart.bottom * H - cartH - cartBounce, width: cartW, height: cartH, zIndex: 12 }}
          >
            <img src={cartArt.url} alt="" draggable={false} className="h-full w-full" style={{ imageRendering: "pixelated" }} />
          </button>
          {refilling && (
            <div
              role="progressbar"
              aria-label="Restocking supplies"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(s.restockProgress * 100)}
              className="boss-pixel-timer pointer-events-none absolute z-30 flex items-center justify-center p-1"
              style={{
                left: (L.cart.left + L.cart.widthFrac / 2) * W - 18,
                top: L.cart.bottom * H - cartH - 38,
                width: 36,
                height: 36,
              }}
            >
              <svg viewBox="0 0 24 24" className="h-full w-full" shapeRendering="crispEdges" aria-hidden="true">
                {RESTOCK_PIXELS.map(([x, y], index) => (
                  <rect key={index} x={x} y={y} width="3" height="3"
                    className={index < Math.ceil(s.restockProgress * RESTOCK_PIXELS.length) ? "fill-gold" : "fill-muted-foreground"} />
                ))}
              </svg>
            </div>
          )}
          {/* Neil */}
          <div
            className="absolute"
            data-boss-enraged={bossEnraged ? "true" : undefined}
            style={{
              left: s.bossX * W - neilW / 2 + neilShakeX,
              top: L.bossLaneY * H - neilH - bob * neilH + neilShakeY,
              width: neilW,
              height: neilH,
              zIndex: 10,
              filter: bossEnraged
                ? "sepia(0.85) hue-rotate(-44deg) saturate(4.4) brightness(0.92) drop-shadow(0 0 6px hsla(0, 95%, 48%, 0.72))"
                : undefined,
            }}
            role="img"
            aria-label={laughing ? "Neil laughing" : `Neil, phase ${phase}`}
          >
            <SheetCell atlas={atlas} col={col} row={row} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* nurse — the player's own sprite and appearance */}
          <div
            className="absolute flex justify-center"
            style={{
              left: s.nurseX * W - nurseH / 2,
              top: nursePxY - nurseH,
              height: nurseH,
              width: nurseH,
              zIndex: nurseBehindDoor ? 5 : 15,
            }}
          >
            <Nurse
              character={character}
              moving={s.nurseMoving}
              direction={s.nurseMoving ? s.nurseDir : s.nurseThrowUntil > s.t ? "north" : s.nurseDir}
            />
          </div>

          {s.projectiles.map((shot) => {
            const size = CFG.nurseProjectileSize * H;
            return <SheetCell key={shot.id}
              atlas={{ src: projectileArt.url, cols: 5, rows: 1, cellW: 560, cellH: 560 }} col={shot.item} row={0}
              style={{ position: "absolute", pointerEvents: "none", zIndex: 35,
                width: size, height: size,
                left: shot.x * W - size / 2,
                top: shot.y * H - size / 2,
              }} />;
          })}

          {/* bottom door (frame 0 closed, 1–4 opening) */}
          <SheetCell
            atlas={{ src: DOOR.src, cols: DOOR.frames, rows: 1, cellW: DOOR.cellW, cellH: DOOR.cellH }}
            col={s.doorFrame}
            row={0}
            style={{
              position: "absolute",
              left: L.door.centerX * W - doorW / 2,
              top: doorTopY,
              width: doorW,
              height: doorH,
              zIndex: 8,
            }}
          />

          {s.stage === "active" && s.t - s.stageAt < 2500 && (
            <p className="font-display pointer-events-none absolute inset-x-0 text-center text-sm font-black uppercase text-primary-foreground" style={{ top: "60%", textShadow: "0 2px 0 hsl(0 0% 0%)", zIndex: 20 }}>
              Drag anywhere to move
            </p>
          )}

          {ended && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-background/70 p-6 text-center">
              <div className="space-y-3">
                <p className="font-display text-2xl font-black uppercase">
                  {s.stage === "won" ? `${boss.name} defeated!` : "Rostered off…"}
                </p>
                <button
                  onClick={onExit}
                  className="chunky-press font-display rounded-xl bg-primary px-4 py-2 text-sm font-black uppercase text-primary-foreground"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
        <aside aria-label="Nurse supplies and special moves" className="flex min-h-0 flex-col border-l-2 border-border bg-card">
          <div
            role="meter" aria-label="Nurse projectiles" aria-valuemin={0}
            aria-valuemax={CFG.nurseAmmoCapacity} aria-valuenow={s.ammo}
            data-low-ammo={lowAmmo ? "true" : undefined}
            className={`pointer-events-none relative w-full shrink-0 transition-shadow ${
              lowAmmo ? "animate-pulse ring-2 ring-inset ring-destructive" : ""
            }`}
            style={{ aspectRatio: "273 / 1129" }}
          >
            <img src={supplyEmptyArt.url} alt="" className="absolute inset-0 h-full w-full" draggable={false} style={{ imageRendering: "pixelated" }} />
            {Array.from({ length: CFG.nurseAmmoCapacity }, (_, slot) => {
              if (slot < CFG.nurseAmmoCapacity - s.ammo) return null;
              const bounds = SUPPLY_ROWS[Math.floor(slot / 2)];
              const xs = SUPPLY_COLS[slot % 2];
              if (!bounds || !xs) return null;
              const [y0, y1] = bounds;
              const [x0, x1] = xs;
              return <div key={slot} data-supply-slot={slot} className="absolute overflow-hidden" style={{
                left: `${(x0 - 7) / 273 * 100}%`, top: `${(y0 - 99) / 1129 * 100}%`,
                width: `${(x1 - x0) / 273 * 100}%`, height: `${(y1 - y0) / 1129 * 100}%`,
                backgroundImage: `url(${supplyFullArt.url})`, imageRendering: "pixelated",
                backgroundSize: `${273 / (x1 - x0) * 100}% ${1129 / (y1 - y0) * 100}%`,
                backgroundPosition: `${(x0 - 7) / (273 - (x1 - x0)) * 100}% ${(y0 - 99) / (1129 - (y1 - y0)) * 100}%`,
              }} />;
            })}
          </div>
          <div aria-label="Special moves" className="grid min-h-0 min-w-0 flex-1 grid-rows-3 place-items-center gap-1 px-1 py-2">
            {SPECIAL_BUTTONS.map((btn) => {
              const remainingMs = cooldownRemaining(s.specialUntil[btn.id], s.t);
              const cooling = remainingMs > 0;
              const readySegments = Math.floor((1 - remainingMs / CFG.specialCooldownMs) * 8);
              return (
              <Button
                key={btn.id}
                type="button"
                variant="ghost"
                aria-label={btn.label}
                aria-description={cooling ? `Ready in ${Math.ceil(remainingMs / 1000)} seconds` : undefined}
                disabled={cooling}
                className="boss-special-button relative aspect-square h-auto max-h-full w-full min-w-0 rounded-full p-0 hover:bg-transparent"
                onClick={() => {
                  const until = activateSpecial(s.specialUntil[btn.id], s.t);
                  if (until === null) return;
                  s.specialUntil[btn.id] = until;
                  buzz(25);
                }}
              >
                <span className="boss-special-button-face pointer-events-none relative grid h-full w-full place-items-center">
                  <img src={specialButtonArt.url} alt="" draggable={false} className="h-full w-full object-contain" />
                  <img src={btn.src} alt="" draggable={false} className={`absolute ${btn.sizeClass} object-contain [image-rendering:pixelated]`} />
                </span>
                {cooling && (
                  <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1" aria-hidden="true">
                    <span className="boss-cooldown-count">{Math.ceil(remainingMs / 1000)}s</span>
                    <span className="grid h-1.5 w-[68%] grid-cols-8 gap-px bg-foreground p-px">
                      {Array.from({ length: 8 }, (_, index) => (
                        <span key={index} className={index < readySegments ? "bg-gold" : "bg-muted-foreground"} />
                      ))}
                    </span>
                  </span>
                )}
              </Button>
              );
            })}
          </div>
        </aside>
        </div>
      </div>

      {dev && (
        <DevBossPanel>
          <span className="font-display text-[10px] font-black uppercase">Neil</span>
          {([1, 2, 3] as BossPhase[]).map((p) => (
            <DevBtn key={p} active={phase === p} onClick={() => setBossHp(hpForPhase(p))}>
              P{p}
            </DevBtn>
          ))}
          <DevBtn onClick={() => setBossHp((h) => Math.max(0, h - 10))}>-10</DevBtn>
          <DevBtn onClick={() => setBossHp((h) => Math.min(CFG.bossMaxHp, h + 10))}>+10</DevBtn>
          <DevBtn onClick={() => (sim.current.laughUntil = sim.current.t + CFG.bossLaughMs)}>Laugh</DevBtn>
          <DevBtn
            onClick={() => {
              sim.current.poseAnim = "throw";
              sim.current.poseStart = sim.current.t;
              sim.current.poseUntil = sim.current.t + CFG.bossPoseMs;
            }}
          >
            Throw
          </DevBtn>
          <DevBtn
            onClick={() => {
              sim.current.poseAnim = "raise";
              sim.current.poseStart = sim.current.t;
              sim.current.poseUntil = sim.current.t + bossRaiseTotalMs();
            }}
          >
            Raise
          </DevBtn>
          <span className="font-display ml-2 text-[10px] font-black uppercase">Nurse</span>
          <DevBtn onClick={instantRefill} disabled={s.stage !== "active"}>Refill</DevBtn>
          <DevBtn onClick={requestRestock} disabled={s.stage !== "active"}>To trolley</DevBtn>
          <DevBtn onClick={() => setNurseHp((h) => Math.max(0, h - 10))}>-10</DevBtn>
          <DevBtn onClick={() => setNurseHp((h) => Math.min(CFG.nurseMaxHp, h + 10))}>+10</DevBtn>
        </DevBossPanel>
      )}
    </div>
  );
}

function DevBossPanel({ children }: { children: ReactNode }) {
  return (
    <div className="z-20 flex shrink-0 flex-wrap items-center gap-1 border-t-2 border-border bg-card px-2 pb-3 pt-2">
      {children}
    </div>
  );
}

function DevBtn({ children, onClick, active, disabled }: { children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <Button variant="outline" size="sm" disabled={disabled}
      onClick={onClick}
      className={`chunky-press font-display rounded-lg border-2 border-border px-2 py-1 text-[11px] font-black uppercase ${
        active ? "bg-primary text-primary-foreground" : "bg-background"
      }`}
    >
      {children}
    </Button>
  );
}
