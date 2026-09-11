import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WardScreen, type ShiftStats } from "@/components/game/WardScreen";
import { SummaryScreen } from "@/components/game/SummaryScreen";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { FiredScreen } from "@/components/game/FiredScreen";
import { LadderScreen } from "@/components/game/LadderScreen";
import {
  bedsForLevel,
  MAX_LEVEL,
  MAX_STAFF,
  nurseRank,
  STAFF,
  type Upgrades,
} from "@/game/config";
import { combineEffects, gearEffects } from "@/game/gear";
import { bedUpgradeEffects } from "@/game/bedUpgrades";
import { updateWardProgress, wardForLevel, type WardProgress } from "@/game/wards";
import {
  JOB_SECURITY_REHIRE,
  JOB_SECURITY_START,
  reviewShift,
  type ShiftReview,
} from "@/game/don";
import { DevMode, DevPinPrompt, type DevApi } from "@/components/dev/DevMode";
import { DEV_PIN, subscribeDevInfo } from "@/game/dev";
import {
  setHapticsEnabled,
  setSoundEnabled,
} from "@/lib/sfx";

const TITLE = "Shift Fight! — Hospital Ward Arcade";
const DESC =
  "A fast, tappy hospital ward arcade game. Triage chaotic bays, nail the med trolley dash, upgrade your ward. Pure arcade fun, not clinical advice.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

const SAVE_KEY = "shift-fight-save";
const TUT_KEY = "shift-fight-tutorial-done";

type SaveData = {
  points: number;
  xp: number;
  level: number;
  upgrades: Upgrades;
  bedCount: number;
  staff: string[];
  /** added with the DON system — older saves simply start at 100% */
  jobSecurity?: number;
  /** added with equipment / bed upgrades / ward architecture */
  gear?: string[];
  bedUpgrades?: string[];
  highestLevel?: number;
  wardProgress?: WardProgress;
};

function readSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

type Phase = "intro" | "shift" | "summary" | "shop" | "dev" | "fired" | "ladder";

function Game() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({
    speed: 0,
    response: 0,
    equipment: 0,
  });
  const [staff, setStaff] = useState<string[]>([]);
  const [gear, setGear] = useState<string[]>([]);
  const [bedUpgrades, setBedUpgrades] = useState<string[]>([]);
  const [last, setLast] = useState<ShiftStats | null>(null);
  const [review, setReview] = useState<ShiftReview | null>(null);
  const [jobSecurity, setJobSecurity] = useState(JOB_SECURITY_START);
  const [runKey, setRunKey] = useState(0);
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(1);
  const [wardProgress, setWardProgress] = useState<WardProgress>({});
  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [saveNote, setSaveNote] = useState("");
  const [hasSave, setHasSave] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(true);
  /* dev mode (developer/testing tool) */
  const [pinOpen, setPinOpen] = useState(false);
  const [bedOverride, setBedOverride] = useState<number | null>(null);
  const [debugOverlay, setDebugOverlay] = useState(false);
  const [devEvents, setDevEvents] = useState(0);
  /* global menu — available on every non-shift screen (in-shift the pause veil is the menu) */
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setHasSave(!!readSave());
    try {
      setTutorialDone(!!window.localStorage.getItem(TUT_KEY));
    } catch {
      setTutorialDone(true);
    }
  }, []);

  useEffect(() => subscribeDevInfo((i) => setDevEvents(i.activeEvents)), []);

  function completeTutorial() {
    try {
      window.localStorage.setItem(TUT_KEY, "1");
    } catch {
      /* storage unavailable — tutorial simply replays next time */
    }
    setTutorialDone(true);
  }

  function saveProgress() {
    const data: SaveData = {
      points,
      xp,
      level,
      upgrades,
      bedCount,
      staff,
      jobSecurity,
      gear,
      bedUpgrades,
      highestLevel,
      wardProgress,
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setHasSave(true);
      setSaveNote("Progress saved on this device ✓");
    } catch {
      setSaveNote("Could not save on this device");
    }
    window.setTimeout(() => setSaveNote(""), 2500);
  }

  function loadProgress() {
    const d = readSave();
    if (!d) return;
    setPoints(d.points ?? 0);
    setXp(d.xp ?? 0);
    setLevel(d.level ?? 1);
    setUpgrades(d.upgrades ?? { speed: 0, response: 0, equipment: 0 });
    setStaff(d.staff ?? []);
    setGear(d.gear ?? []);
    setBedUpgrades(d.bedUpgrades ?? []);
    setHighestLevel(d.highestLevel ?? d.level ?? 1);
    setWardProgress(d.wardProgress ?? {});
    setJobSecurity(d.jobSecurity ?? JOB_SECURITY_START);
    setSaveNote("Saved progress loaded ✓");
    window.setTimeout(() => setSaveNote(""), 2500);
  }

  const rank = nurseRank(xp);
  /** beds are unlocked by level progression, never bought */
  const bedCount = bedOverride ?? bedsForLevel(level);
  const ward = wardForLevel(level);

  /** every equipment / bed upgrade / staff effect, combined into one object */
  const mods = combineEffects([
    gearEffects(gear),
    ...bedUpgradeEffects(bedUpgrades),
    ...staff.map((k) => STAFF.find((s) => s.key === k)?.effects ?? {}),
  ]);
  const staffBonus = mods.payBonus;

  function endShift(s: ShiftStats) {
    setLast(s);
    setPoints((p) => p + s.points);
    setXp((x) => x + Math.round(s.xp * mods.xpMult));
    if (!s.collapsed) {
      setLevel((l) => {
        const next = Math.min(MAX_LEVEL, l + 1);
        setHighestLevel((h) => Math.max(h, next));
        setWardProgress((w) => updateWardProgress(w, next));
        return next;
      });
    }
    /** the DON reviews the shift using the stats the game already tracks */
    const r = reviewShift(
      {
        helped: s.helped,
        handled: s.handled,
        mistakes: s.mistakes,
        miniGames: s.miniGames,
        miniFailed: s.miniFailed,
        miniAbandoned: s.miniAbandoned,
        overdue: s.overdue,
        collapsed: s.collapsed,
        objectivesDone: s.objectives.filter((o) => o.done).length,
        donVisited: s.donVisited,
        donAnnoyed: s.donAnnoyed,
      },
      jobSecurity,
    );
    setReview(r);
    setJobSecurity(r.after);
    setPhase("summary");
  }

  function toggleSound() {
    setSoundOn((on) => {
      setSoundEnabled(!on);
      return !on;
    });
  }

  function toggleHaptics() {
    setHapticsOn((on) => {
      setHapticsEnabled(!on);
      return !on;
    });
  }

  const devApi: DevApi = {
    level,
    points,
    xp,
    bedCount,
    bedOverride,
    upgrades,
    staff,
    gear,
    bedUpgrades,
    highestLevel,
    wardId: ward.id,
    mods,
    setLevel: (n) => {
      setLevel(n);
      setHighestLevel((h) => Math.max(h, n));
      setWardProgress((w) => updateWardProgress(w, n));
    },
    setHighestLevel: (n) => setHighestLevel(Math.max(1, n)),
    addPoints: (n) => setPoints((p) => Math.max(0, p + n)),
    addXp: (n) => setXp((x) => Math.max(0, x + n)),
    setUpgrades,
    setStaff,
    setGear,
    setBedUpgrades,
    setBedOverride,
    jobSecurity,
    setJobSecurity: (n) => setJobSecurity(Math.max(0, Math.min(100, n))),
    openLadder: () => setPhase("ladder"),
    resetSave: () => {
      try {
        window.localStorage.removeItem(SAVE_KEY);
        window.localStorage.removeItem(TUT_KEY);
      } catch {
        /* storage unavailable */
      }
      setHasSave(false);
      setPoints(0);
      setXp(0);
      setLevel(1);
      setHighestLevel(1);
      setWardProgress({});
      setUpgrades({ speed: 0, response: 0, equipment: 0 });
      setStaff([]);
      setGear([]);
      setBedUpgrades([]);
      setBedOverride(null);
      setTutorialDone(false);
      setJobSecurity(JOB_SECURITY_START);
    },
    debugOverlay,
    setDebugOverlay,
  };

  function play() {
    setRunKey((k) => k + 1);
    setPhase("shift");
  }

  return (
    <main className="flex min-h-dvh justify-center bg-ward-deep">
      <div className="relative flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl">
        {phase === "intro" && (
          <IntroScreen
            xp={xp}
            points={points}
            level={level}
            soundOn={soundOn}
            hapticsOn={hapticsOn}
            onToggleSound={toggleSound}
            onToggleHaptics={toggleHaptics}
            onSave={saveProgress}
            onLoad={loadProgress}
            hasSave={hasSave}
            saveNote={saveNote}
            onPlay={play}
            onDev={() => setPinOpen(true)}
            onLadder={() => setPhase("ladder")}
          />
        )}
        {phase === "dev" && <DevMode api={devApi} onClose={() => setPhase("intro")} />}
        {pinOpen && (
          <DevPinPrompt
            pin={DEV_PIN}
            onCancel={() => setPinOpen(false)}
            onUnlock={() => {
              setPinOpen(false);
              setPhase("dev");
            }}
          />
        )}
        {debugOverlay && (
          <div className="pointer-events-none absolute left-2 top-2 z-[80] rounded-lg bg-background/85 px-2 py-1 font-mono text-[10px] leading-tight">
            <p>lv {level} · ⭐{points} · ✨{xp}</p>
            <p>
              beds {bedCount}
              {bedOverride !== null ? "*" : ""} · events {devEvents}
            </p>
          </div>
        )}
        {phase === "ladder" && (
          <LadderScreen
            highestLevel={highestLevel}
            currentLevel={level}
            onPick={(l) => {
              setLevel(l);
              play();
            }}
            onBack={() => setPhase("intro")}
          />
        )}
        {phase === "shift" && (
          <WardScreen
            key={runKey}
            level={level}
            upgrades={upgrades}
            bedCount={bedCount}
            staffBonus={staffBonus}
            staff={staff}
            mods={mods}
            soundOn={soundOn}
            hapticsOn={hapticsOn}
            onToggleSound={toggleSound}
            onToggleHaptics={toggleHaptics}
            onEnd={endShift}
            onSave={saveProgress}
            onQuit={() => setPhase("intro")}
            jobSecurity={jobSecurity}
            tutorial={!tutorialDone}
            onTutorialDone={completeTutorial}
          />
        )}
        {phase === "summary" && last && (
          <SummaryScreen
            stats={last}
            totalPoints={points}
            totalXp={xp}
            review={review}
            onNext={() => setPhase(review?.fired ? "fired" : "shop")}
          />
        )}
        {phase === "fired" && (
          <FiredScreen
            reason={review?.reason ?? "The DON has requested that you return your ID badge."}
            onContinue={() => {
              setJobSecurity(JOB_SECURITY_REHIRE);
              setReview((r) => (r ? { ...r, fired: false, after: JOB_SECURITY_REHIRE } : r));
              setPhase("shop");
            }}
          />
        )}
        {phase === "shop" && (
          <UpgradeScreen
            points={points}
            level={level}
            rank={rank}
            upgrades={upgrades}
            bedCount={bedCount}
            staff={staff}
            gear={gear}
            bedUpgrades={bedUpgrades}
            onBuy={(k, cost) => {
              setPoints((p) => p - cost);
              setUpgrades((u) => ({ ...u, [k]: u[k] + 1 }));
            }}
            onHire={(k, cost) => {
              setStaff((s) => {
                if (s.includes(k) || s.length >= MAX_STAFF) return s;
                setPoints((p) => p - cost);
                return [...s, k];
              });
            }}
            onBuyGear={(k, cost) => {
              setGear((g) => {
                if (g.includes(k)) return g;
                setPoints((p) => p - cost);
                return [...g, k];
              });
            }}
            onBuyBedUpgrade={(k, cost) => {
              setBedUpgrades((b) => {
                if (b.includes(k)) return b;
                setPoints((p) => p - cost);
                return [...b, k];
              });
            }}
            onPlay={play}
            onSave={saveProgress}
            saveNote={saveNote}
            onBack={() => setPhase("summary")}
          />
        )}

        {/* global menu — on every screen; in-shift the ⏸️ pause button opens the same menu */}
        {phase !== "dev" && phase !== "shift" && (
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="chunky chunky-press absolute right-2 top-2 z-[70] rounded-xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground"
          >
            ☰ Menu
          </button>
        )}
        {menuOpen && (
          <div className="absolute inset-0 z-[75] flex flex-col items-center justify-center gap-3 bg-background/95 p-6">
            <p className="font-display text-3xl font-black uppercase">☰ Menu</p>
            <div className="grid w-full grid-cols-2 gap-2">
              <button
                onClick={toggleSound}
                className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
              >
                🔊 Sound {soundOn ? "ON" : "OFF"}
              </button>
              <button
                onClick={toggleHaptics}
                className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
              >
                📳 Haptics {hapticsOn ? "ON" : "OFF"}
              </button>
            </div>
            <button
              onClick={() => {
                saveProgress();
              }}
              className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
            >
              💾 Save
            </button>
            {hasSave && (
              <button
                onClick={() => {
                  loadProgress();
                  setMenuOpen(false);
                  setPhase("intro");
                }}
                className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
              >
                ↩ Continue save
              </button>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                setPhase("ladder");
              }}
              className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
            >
              🪜 Shift Ladder
            </button>
            {phase !== "intro" && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setPhase("intro");
                }}
                className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
              >
                🚪 Quit to title
              </button>
            )}
            <button
              onClick={() => setMenuOpen(false)}
              className="chunky chunky-press w-full rounded-2xl bg-primary py-4 font-display text-lg font-black uppercase text-primary-foreground"
            >
              Close ✕
            </button>
            {saveNote && (
              <p className="font-display text-xs font-black uppercase text-calm-foreground">
                {saveNote}
              </p>
            )}
          </div>
        )}
        {menuOpen && phase === "shift" && (
          /* in-shift the pause veil is the menu — just close and let them use ⏸️ */
          <>{setMenuOpen(false)}</>
        )}
      </div>
    </main>
  );
}

function IntroScreen({
  xp,
  points,
  level,
  soundOn,
  hapticsOn,
  onToggleSound,
  onToggleHaptics,
  onSave,
  onLoad,
  hasSave,
  saveNote,
  onPlay,
  onDev,
  onLadder,
}: {
  xp: number;
  points: number;
  level: number;
  soundOn: boolean;
  hapticsOn: boolean;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSave: boolean;
  saveNote: string;
  onPlay: () => void;
  onDev: () => void;
  onLadder: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[image:var(--gradient-sky)] p-6 text-center">
      <div className="animate-bob text-6xl">🏥</div>
      <div>
        <h1 className="font-display text-5xl font-black leading-none tracking-tight">
          SHIFT
          <br />
          <span className="text-primary">FIGHT!</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          One thumb. Four beds. Total chaos.
        </p>
      </div>

      <div className="w-full space-y-2 rounded-2xl border-2 border-border bg-card/80 p-3 text-left">
        {[
          ["👆", "Tap the bed that needs you most"],
          ["⚡", "ASSESS · INTERVENE · ESCALATE"],
          ["🎯", "Nail mini-games, bank the combo"],
        ].map(([i, t]) => (
          <p key={t} className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-lg">{i}</span>
            {t}
          </p>
        ))}
      </div>

      <p className="font-display text-xs font-black uppercase text-muted-foreground">
        Shift Lv {level} · ⭐ {points} · ✨ {xp} XP · {nurseRank(xp).title}
      </p>

      <div className="grid w-full grid-cols-2 gap-2">
        <button
          onClick={onToggleSound}
          className="chunky chunky-press rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          🔊 Sound {soundOn ? "ON" : "OFF"}
        </button>
        <button
          onClick={onToggleHaptics}
          className="chunky chunky-press rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          📳 Haptics {hapticsOn ? "ON" : "OFF"}
        </button>
      </div>

      <div className="grid w-full grid-cols-2 gap-2">
        <button
          onClick={onSave}
          className="chunky chunky-press rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          💾 Save progress
        </button>
        <button
          onClick={onLoad}
          disabled={!hasSave}
          className="chunky chunky-press rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground disabled:opacity-50"
        >
          ↩ Continue save
        </button>
      </div>
      {saveNote && (
        <p className="font-display text-xs font-black uppercase text-calm-foreground">
          {saveNote}
        </p>
      )}

      <button
        onClick={onPlay}
        className="chunky chunky-press w-full rounded-2xl bg-primary py-5 font-display text-2xl font-black uppercase tracking-wide text-primary-foreground"
      >
        Clock in ▶
      </button>
      <button
        onClick={onLadder}
        className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
      >
        🪜 Shift Ladder
      </button>
      <button
        onClick={onDev}
        className="chunky chunky-press w-full rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
      >
        🛠️ Dev Mode
      </button>
      <p className="text-[10px] leading-tight text-muted-foreground">
        Silly fiction. Fictional patients, fictional meds. Not medical or nursing advice.
      </p>
    </div>
  );
}
