import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop } from "@/lib/sfx";
import { FICTIONAL_MEDS } from "@/game/config";

type Props = {
  level: number;
  paused: boolean;
  onDone: (score: number, perfect: boolean) => void;
};

/**
 * MIX THE IV MEDS — two stages:
 *  1. drag the syringe so the needle lines up with the vial port
 *  2. shake the phone (or swipe fast) to mix
 * Motion sensors are used when available, swiping always works.
 */
export function IVMixGame({ level, paused, onDone }: Props) {
  const tolerance = Math.max(0.05, 0.14 - level * 0.008); // fraction of width
  const shakeNeeded = 100;
  const totalMs = 18000 + Math.min(6000, level * 300);

  const [time, setTime] = useState(1);
  const [stage, setStage] = useState<"line" | "insert" | "shake" | "done">("line");
  const [pos, setPos] = useState({ x: 0.2, y: 0.16 });
  const [misses, setMisses] = useState(0);
  const [nudge, setNudge] = useState(false);
  const [mix, setMix] = useState(0);
  const [drugName] = useState(() =>
    FICTIONAL_MEDS[Math.floor(Math.random() * FICTIONAL_MEDS.length)],
  );

  const areaRef = useRef<HTMLDivElement | null>(null);
  const mixRef = useRef(0);
  const timeRef = useRef(1);
  const done = useRef(false);
  const dragging = useRef(false);
  const stageRef = useRef<"line" | "insert" | "shake" | "done">("line");
  stageRef.current = stage;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const missRef = useRef(0);

  /* needle tip target = centre of the vial's rubber stopper */
  const port = { x: 0.5, y: 0.38 };

  useEffect(() => {
    let last = performance.now();
    let elapsed = 0;
    const id = setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current) elapsed += now - last;
      last = now;
      const left = 1 - elapsed / totalMs;
      timeRef.current = left;
      setTime(left);
      if (left <= 0) finish(false);
    }, 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* device motion shaking */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastMag = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      if (stageRef.current !== "shake" || pausedRef.current) return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      const delta = Math.abs(mag - lastMag);
      lastMag = mag;
      if (delta > 4) addMix(delta * 0.8);
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addMix(amount: number) {
    if (done.current || stageRef.current !== "shake") return;
    mixRef.current = Math.min(shakeNeeded, mixRef.current + amount);
    setMix(mixRef.current);
    if (Math.random() < 0.2) playPop();
    if (mixRef.current >= shakeNeeded) {
      setStage("done");
      finish(true);
    }
  }

  function finish(success: boolean) {
    if (done.current) return;
    done.current = true;
    if (success) {
      playGood();
      const base = Math.round(80 + level * 6 + timeRef.current * 160 - missRef.current * 10);
      setTimeout(() => onDone(Math.max(20, base), missRef.current === 0 && timeRef.current > 0.4), 1100);
    } else {
      playBad();
      const progress = stageRef.current === "shake" ? 0.5 + (mixRef.current / shakeNeeded) * 0.4 : 0.2;
      setTimeout(() => onDone(Math.max(10, Math.round(progress * 70)), false), 600);
    }
  }

  /* ---------- stage 1 dragging ---------- */
  /* The syringe graphic hangs below the drag point, so the drag point IS the
     needle tip — the player moves the needle tip onto the port. */
  const NEEDLE_TIP_OFFSET = 0.34; // fraction of arena height below anchor

  function moveTo(clientX: number, clientY: number) {
    const el = areaRef.current;
    if (!el || done.current || stageRef.current !== "line") return;
    const box = el.getBoundingClientRect();
    setPos({
      x: Math.min(0.95, Math.max(0.05, (clientX - box.left) / box.width)),
      y: Math.min(0.9, Math.max(0.05, (clientY - box.top) / box.height - NEEDLE_TIP_OFFSET)),
    });
  }

  function release() {
    dragging.current = false;
    if (stageRef.current !== "line") return;
    const d = Math.hypot(pos.x - port.x, (pos.y + NEEDLE_TIP_OFFSET - port.y) * 0.8);
    if (d <= tolerance) {
      playPop();
      setStage("insert");
      setTimeout(() => setStage("shake"), 900);
    } else {
      missRef.current++;
      setMisses(missRef.current);
      setNudge(true);
      setTimeout(() => setNudge(false), 350);
    }
  }

  /* ---------- stage 2 swipe fallback ---------- */
  const lastSwipe = useRef<{ x: number; y: number } | null>(null);
  function swipe(clientX: number, clientY: number) {
    if (stageRef.current !== "shake") return;
    const prev = lastSwipe.current;
    lastSwipe.current = { x: clientX, y: clientY };
    if (!prev) return;
    const d = Math.hypot(clientX - prev.x, clientY - prev.y);
    if (d > 8) addMix(d * 0.09);
  }

  const mixPct = Math.round((mix / shakeNeeded) * 100);
  const lining = stage === "line";
  const near =
    lining &&
    Math.hypot(pos.x - port.x, (pos.y + NEEDLE_TIP_OFFSET - port.y) * 0.8) <= tolerance * 1.6;

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 bg-background/98 p-3">
      <div className="text-center">
        <p className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
          Mini-game · Level {level + 1}
        </p>
        <h2 className="font-display text-2xl font-black leading-none">MIX THE IV MEDS</h2>
        <p className="text-[11px] text-muted-foreground">
          {stage === "line"
            ? "Drag the syringe — drop the NEEDLE TIP on the vial port."
            : stage === "insert"
              ? "In it goes…"
              : "SHAKE TO MIX! (or swipe fast)"}
        </p>
      </div>

      <div className="h-3.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-75 ease-linear",
            time < 0.3 ? "bg-alarm" : "bg-calm",
          )}
          style={{ width: `${Math.max(0, time) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2">
        <span className="text-2xl">{stage === "shake" || stage === "done" ? "🫨" : "💉"}</span>
        <p className="font-display flex-1 text-sm font-black uppercase">
          {stage === "shake"
            ? `Mixing… ${mixPct}%`
            : stage === "done"
              ? "Mixed!"
              : `Stage 1 · line up${misses ? ` · ${misses} miss${misses > 1 ? "es" : ""}` : ""}`}
        </p>
        <span className="font-display rounded-lg bg-secondary px-2 py-1 text-xs font-black">
          {stage === "line" || stage === "insert" ? "Step 1/2" : "Step 2/2"}
        </span>
      </div>

      <div
        ref={areaRef}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          lastSwipe.current = null;
          moveTo(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) moveTo(e.clientX, e.clientY);
          if (dragging.current) swipe(e.clientX, e.clientY);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative flex-1 touch-none overflow-hidden rounded-3xl border-4 border-border bg-floor"
      >
        {/* ---- big glass vial ---- */}
        <div
          className={cn("absolute left-1/2 -translate-x-1/2", stage === "shake" && "animate-throb")}
          style={{ top: "38%" }}
        >
          {/* crimp cap + rubber stopper (the port) */}
          <div className="relative z-10 mx-auto h-6 w-20 rounded-t-md border border-foreground/30 bg-gradient-to-b from-muted to-foreground/20 shadow-sm">
            {/* rubber stopper visible through the cap opening */}
            <div
              className={cn(
                "absolute left-1/2 top-1 h-3 w-10 -translate-x-1/2 rounded-sm border transition-colors",
                near ? "border-calm bg-calm/60" : "border-foreground/30 bg-foreground/20",
              )}
            />
          </div>
          {/* neck */}
          <div className="mx-auto h-3 w-16 border-x border-foreground/25 bg-gradient-to-b from-card to-muted" />
          {/* body */}
          <div className="relative mx-auto h-44 w-32 overflow-hidden rounded-b-3xl rounded-t-sm border border-foreground/25 bg-gradient-to-br from-card via-muted/40 to-muted shadow-lg">
            {/* glass highlight */}
            <div className="absolute left-2 top-2 h-[85%] w-4 rounded-full bg-white/40" />
            {/* liquid */}
            <div
              className="absolute inset-x-1.5 bottom-1.5 rounded-b-2xl transition-all duration-150"
              style={{
                height: "62%",
                background:
                  stage === "shake" || stage === "done"
                    ? `oklch(${0.8 - (mix / shakeNeeded) * 0.1} ${0.06 + (mix / shakeNeeded) * 0.14} ${
                        200 + (mix / shakeNeeded) * 120
                      })`
                    : "oklch(0.9 0.03 210)",
                opacity: 0.85,
              }}
            />
            {/* label */}
            <div className="absolute left-1/2 top-[12%] w-28 -translate-x-1/2 rounded border border-foreground/20 bg-card/95 px-2 py-1.5 text-center shadow-sm">
              <p className="font-display text-sm font-black uppercase leading-tight tracking-wide">
                {drugName}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground">500mg · Shake well</p>
            </div>
          </div>
        </div>

        {/* ---- target ring on the port ---- */}
        {lining && (
          <>
            <span
              className={cn(
                "pointer-events-none absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed",
                near ? "animate-pulse border-calm" : "border-primary",
              )}
              style={{ left: `${port.x * 100}%`, top: `${port.y * 100}%` }}
            />
            <span
              className={cn(
                "pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                near ? "bg-calm" : "bg-primary",
              )}
              style={{ left: `${port.x * 100}%`, top: `${port.y * 100}%` }}
            />
            {/* dashed guide line from needle tip to port */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <line
                x1={`${pos.x * 100}%`}
                y1={`${(pos.y + NEEDLE_TIP_OFFSET) * 100}%`}
                x2={`${port.x * 100}%`}
                y2={`${port.y * 100}%`}
                stroke={near ? "oklch(var(--calm))" : "oklch(var(--primary))"}
                strokeWidth="3"
                strokeDasharray="10 8"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
            <span
              className={cn(
                "font-display pointer-events-none absolute -translate-x-1/2 rounded-full border-2 px-2 py-0.5 text-[10px] font-black uppercase",
                near
                  ? "border-calm bg-calm/15 text-calm"
                  : "border-primary bg-background/80 text-primary",
              )}
              style={{ left: `${port.x * 100}%`, top: `calc(${port.y * 100}% - 44px)` }}
            >
              {near ? "Release!" : "Insert needle here"}
            </span>
          </>
        )}

        {/* ---- realistic syringe (needle points down, tip = drag anchor) ---- */}
        {(stage === "line" || stage === "insert") && (
          <div
            className={cn(
              "pointer-events-none absolute -translate-x-1/2",
              nudge && "animate-shake",
              stage === "insert" && "transition-all duration-700",
            )}
            style={
              stage === "insert"
                ? { left: "50%", top: "12%" }
                : { left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }
            }
          >
            <div className="flex flex-col items-center drop-shadow-md">
              {/* plunger thumb rest */}
              <div className="h-2.5 w-12 rounded-sm border border-foreground/40 bg-gradient-to-b from-muted to-foreground/25" />
              {/* plunger rod */}
              <div className="h-6 w-2.5 bg-foreground/35" />
              {/* rubber plunger head */}
              <div className="h-2 w-8 rounded-sm bg-foreground/50" />
              {/* barrel */}
              <div className="relative h-20 w-9 overflow-hidden rounded-b-sm border-2 border-foreground/40 bg-white/50">
                {/* med liquid inside */}
                <div className="absolute inset-x-0.5 bottom-0.5 top-[30%] bg-primary/40" />
                {/* measurement marks */}
                {[20, 40, 60, 80].map((t) => (
                  <span
                    key={t}
                    className="absolute right-0.5 h-px w-2 bg-foreground/50"
                    style={{ top: `${t}%` }}
                  />
                ))}
                {/* glass shine */}
                <div className="absolute left-1 top-1 h-[90%] w-1.5 rounded-full bg-white/60" />
              </div>
              {/* hub */}
              <div className="h-3 w-3.5 border-x-2 border-b-2 border-foreground/40 bg-muted" />
              {/* needle */}
              <div className="h-14 w-[3px] rounded-b-full bg-gradient-to-b from-foreground/60 to-foreground/30" />
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="font-display animate-pop rounded-2xl bg-calm px-5 py-3 text-2xl font-black uppercase text-calm-foreground">
              Mixed! ✨
            </p>
          </div>
        )}

        {stage === "shake" && (
          <div className="absolute inset-x-4 bottom-3">
            <p className="font-display mb-1 text-center text-sm font-black uppercase">
              Shake or swipe!
            </p>
            <div className="h-4 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-100"
                style={{ width: `${mixPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
