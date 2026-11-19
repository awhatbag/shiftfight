import { useEffect, useRef, useState, type ReactNode } from "react";
import arenaArt from "@/assets/boss/neil_arena.jpg.asset.json";
import doorArt from "@/assets/boss/neil_door_strip.png.asset.json";
import neilArt from "@/assets/boss/neil_10_1_atlas.png.asset.json";
import neilHpArt from "@/assets/boss/neil_hp_bar.png.asset.json";
import cartArt from "@/assets/boss/nurse_cart.png.asset.json";
import nurseHpArt from "@/assets/boss/nurse_hp_bar.png.asset.json";
import { BOSS_BATTLE_CONFIG as CFG, NEIL_ARENA_LAYOUT as L } from "@/config/bossBattleConfig";
import { hpForPhase, phaseFor, type BossDef, type BossPhase } from "@/game/bosses";
import type { PlayerCharacter } from "@/game/character";
import { Nurse, type NurseDirection } from "@/components/game/Nurse";

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
  neil: { src: neilHpArt.url, w: 1527, h: 244, fx0: 300, fx1: 1481, fy0: 100, fy1: 185 },
  nurse: { src: nurseHpArt.url, w: 1479, h: 258, fx0: 255, fx1: 1432, fy0: 95, fy1: 182 },
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
  doorOpen: boolean;
  doorFrame: number;
  doorAt: number;
  laughUntil: number;
  /** throwables carried (filled at the trolley; used by later stages) */
  ammo: number;
  restockPending: boolean;
  restockUntil: number;
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
    doorOpen: true,
    doorFrame: 0,
    doorAt: 0,
    laughUntil: 0,
    ammo: CFG.nurseAmmoCapacity,
    restockPending: false,
    restockUntil: 0,
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
          s.nurseDir = s.restockPending || s.restockUntil > t ? "west" : "south";
          if (s.restockPending) {
            s.restockPending = false;
            s.restockUntil = t + CFG.restockMs;
          }
        }
        if (s.restockUntil && t >= s.restockUntil) {
          s.restockUntil = 0;
          s.ammo = CFG.nurseAmmoCapacity;
        }
        /* Neil glides between random spots, pausing between glides */
        if (t >= s.bossPauseUntil) {
          const bdx = s.bossTarget - s.bossX;
          if (Math.abs(bdx) < 0.004) {
            s.bossMoving = 0;
            s.bossPauseUntil = t + CFG.bossPauseMinMs + Math.random() * (CFG.bossPauseMaxMs - CFG.bossPauseMinMs);
            let next = s.bossX;
            while (Math.abs(next - s.bossX) < 0.15) next = L.bossMinX + Math.random() * (L.bossMaxX - L.bossMinX);
            s.bossTarget = next;
          } else {
            s.bossX += Math.sign(bdx) * Math.min(Math.abs(bdx), CFG.bossSpeed * dt);
            s.bossMoving = bdx > 0 ? 1 : -1;
          }
        } else s.bossMoving = 0;
      } else if (s.stage === "won" || s.stage === "lost") {
        s.nurseMoving = false;
        s.bossMoving = 0;
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
    s.restockPending = false;
    s.restockUntil = 0;
    drag.current = { id: e.pointerId, startX: e.clientX, startNurse: s.nurseTarget };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !arenaPx.w) return;
    const s = sim.current;
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
  const frameOf = (len: number, ms: number) => Math.floor(s.t / ms) % len;
  const bobOffset = Math.sin((s.t / CFG.bossIdleBobMs) * Math.PI * 2) * CFG.bossIdleBob;
  if (s.t < s.laughUntil) {
    laughing = true;
    anim = "laugh";
    bob = Math.abs(Math.sin((s.t / 140) * Math.PI)) * 0.03;
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
  const moveScale = s.bossMoving !== 0 && !laughing ? CFG.bossPhaseMoveScale[phase] : 1;
  const laughScale = laughing ? CFG.bossPhaseLaughScale[phase] : 1;
  const neilH = L.bossCellHeight * H * NEIL_CELL_SCALE * CFG.bossPhaseScale[phase] * moveScale * laughScale;
  const neilW = (neilH * atlas.cellW) / atlas.cellH;

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
  const refilling = s.restockUntil > s.t;
  const cartBounce = refilling ? Math.abs(Math.sin(s.t / 90)) * cartH * 0.04 : 0;
  const goRestock = () => {
    if (s.stage !== "active") return;
    s.nurseTarget = L.cart.restockX;
    s.restockPending = true;
    s.restockUntil = 0;
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* arena */}
      <div className="relative min-h-0 flex-1" style={{ containerType: "size" }}>
        <div
          ref={arenaRef}
          className="absolute left-1/2 top-1/2 touch-none select-none overflow-hidden"
          style={{
            width: `min(100cqw, calc(100cqh * ${L.aspect}))`,
            aspectRatio: `${L.aspect}`,
            transform: "translate(-50%, -50%)",
            backgroundImage: `url(${arenaArt.url})`,
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* HUD on the arena ceiling — appears once the fight begins (after the intro/dialogue) */}
          {(s.stage === "active" || ended) && (
            <div className="pointer-events-none absolute inset-x-0 top-[1.5%] z-30 flex items-start justify-between gap-[3%] px-[4%]">
              <HpBar kind="nurse" hp={nurseHp} max={CFG.nurseMaxHp} align="left" />
              <HpBar kind="neil" hp={bossHp} max={CFG.bossMaxHp} align="right" />
            </div>
          )}
          <button
            onClick={onExit}
            onPointerDown={(e) => e.stopPropagation()}
            className="chunky-press font-display absolute bottom-[1.5%] right-[3%] z-40 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-black uppercase text-secondary-foreground"
            aria-label={`Exit ${boss.title}`}
          >
            Exit
          </button>
          {/* restock trolley — tap to walk over and refill throwables */}
          <button
            type="button"
            onClick={goRestock}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Restock at the nurses trolley"
            className="absolute"
            style={{ left: L.cart.left * W, top: L.cart.bottom * H - cartH - cartBounce, width: cartW, height: cartH, zIndex: 12 }}
          >
            <img src={cartArt.url} alt="" draggable={false} className="h-full w-full" style={{ imageRendering: "pixelated" }} />
          </button>
          {/* Neil */}
          <div
            className="absolute"
            style={{
              left: s.bossX * W - neilW / 2,
              top: L.bossLaneY * H - neilH - bob * neilH,
              width: neilW,
              height: neilH,
              zIndex: 10,
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
            <Nurse character={character} moving={s.nurseMoving} direction={s.nurseDir} />
          </div>

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
          <span className="font-display ml-2 text-[10px] font-black uppercase">Nurse</span>
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

function DevBtn({ children, onClick, active }: { children: ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`chunky-press font-display rounded-lg border-2 border-border px-2 py-1 text-[11px] font-black uppercase ${
        active ? "bg-primary text-primary-foreground" : "bg-background"
      }`}
    >
      {children}
    </button>
  );
}
