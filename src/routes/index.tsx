import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WardScreen, type ShiftStats } from "@/components/game/WardScreen";
import { SummaryScreen } from "@/components/game/SummaryScreen";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { BED_UNLOCK_COST, MAX_LEVEL, nurseRank, type Upgrades } from "@/game/config";
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

type SaveData = {
  points: number;
  xp: number;
  level: number;
  upgrades: Upgrades;
  bedCount: number;
  staff: string[];
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

type Phase = "intro" | "shift" | "summary" | "shop";

function Game() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({
    speed: 0,
    response: 0,
    equipment: 0,
  });
  const [bedCount, setBedCount] = useState(4);
  const [staff, setStaff] = useState<string[]>([]);
  const [last, setLast] = useState<ShiftStats | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [level, setLevel] = useState(1);
  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [saveNote, setSaveNote] = useState("");
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(!!readSave());
  }, []);

  function saveProgress() {
    const data: SaveData = { points, xp, level, upgrades, bedCount, staff };
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
    setBedCount(d.bedCount ?? 4);
    setStaff(d.staff ?? []);
    setSaveNote("Saved progress loaded ✓");
    window.setTimeout(() => setSaveNote(""), 2500);
  }

  const rank = nurseRank(xp);

  const staffBonus = staff.includes("student") ? 0.15 : 0;

  function endShift(s: ShiftStats) {
    setLast(s);
    setPoints((p) => p + s.points);
    setXp((x) => x + s.xp);
    if (!s.collapsed) setLevel((l) => Math.min(MAX_LEVEL, l + 1));
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
            soundOn={soundOn}
            hapticsOn={hapticsOn}
            onToggleSound={toggleSound}
            onToggleHaptics={toggleHaptics}
            onEnd={endShift}
          />
        )}
        {phase === "summary" && last && (
          <SummaryScreen
            stats={last}
            totalPoints={points}
            totalXp={xp}
            onNext={() => setPhase("shop")}
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
            onBuy={(k, cost) => {
              setPoints((p) => p - cost);
              setUpgrades((u) => ({ ...u, [k]: u[k] + 1 }));
            }}
            onUnlockBeds={() => {
              setPoints((p) => p - BED_UNLOCK_COST);
              setBedCount(6);
            }}
            onHire={(k, cost) => {
              setPoints((p) => p - cost);
              setStaff((s) => [...s, k]);
            }}
            onPlay={play}
            onSave={saveProgress}
            saveNote={saveNote}
            onBack={() => setPhase("summary")}
          />
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
      <p className="text-[10px] leading-tight text-muted-foreground">
        Silly fiction. Fictional patients, fictional meds. Not medical or nursing advice.
      </p>
    </div>
  );
}
