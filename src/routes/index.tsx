import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WardScreen, type ShiftStats } from "@/components/game/WardScreen";
import { SummaryScreen } from "@/components/game/SummaryScreen";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { FiredScreen } from "@/components/game/FiredScreen";
import { LadderScreen } from "@/components/game/LadderScreen";
import { CreditsScreen } from "@/components/game/CreditsScreen";
import { CharacterScreen } from "@/components/game/CharacterScreen";
import {
  clearCharacter,
  normalizeCharacter,
  readCharacter,
  writeCharacter,
  DEFAULT_CHARACTER,
  type PlayerCharacter,
} from "@/game/character";
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
import {
  isMusicOn,
  playMusic,
  setMusicEnabled,
  stopMusic,
  subscribeMusic,
  toggleMusic,
} from "@/lib/music";

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
const ACTIVE_SLOT_KEY = "shift-fight-active-slot";
const AUTO_SAVE_KEY = "shift-fight-auto-save";

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
  /** character identity + cosmetics (separate from gameplay equipment) */
  character?: PlayerCharacter;
};

const SLOTS_KEY = "shift-fight-saves";
const SLOT_COUNT = 3;

export type SaveSlot = { name: string; savedAt: number; data: SaveData } | null;

function readSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

/** three named save files, with a one-time migration of the old single save */
function readSlots(): SaveSlot[] {
  const empty: SaveSlot[] = Array.from({ length: SLOT_COUNT }, () => null);
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(SLOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SaveSlot[];
      return empty.map((_, i) => parsed[i] ?? null);
    }
  } catch {
    return empty;
  }
  const legacy = readSave();
  if (legacy) {
    const migrated = [...empty];
    migrated[0] = { name: "My shift", savedAt: Date.now(), data: legacy };
    try {
      window.localStorage.setItem(SLOTS_KEY, JSON.stringify(migrated));
    } catch {
      /* storage unavailable */
    }
    return migrated;
  }
  return empty;
}

function writeSlots(slots: SaveSlot[]) {
  try {
    window.localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
    return true;
  } catch {
    return false;
  }
}

function readActiveSlot(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SLOT_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isInteger(n) && n >= 0 && n < SLOT_COUNT ? n : null;
  } catch {
    return null;
  }
}

function writeActiveSlot(index: number | null) {
  try {
    if (index === null) {
      window.localStorage.removeItem(ACTIVE_SLOT_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_SLOT_KEY, String(index));
    }
  } catch {
    /* storage unavailable */
  }
}

function readAutoSave(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(AUTO_SAVE_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeAutoSave(on: boolean) {
  try {
    window.localStorage.setItem(AUTO_SAVE_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}


type Phase =
  | "intro"
  | "character"
  | "shift"
  | "summary"
  | "shop"
  | "dev"
  | "fired"
  | "ladder";

function TopBar({
  phase,
  onBack,
  onMenu,
  onContinue,
}: {
  phase: Phase;
  onBack: () => void;
  onMenu: () => void;
  onContinue?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b-2 border-border bg-background px-2 py-2">
      {phase === "intro" ? (
        <span className="px-3 py-2 font-display text-sm font-black uppercase text-muted-foreground">
          Shift Fight!
        </span>
      ) : (
        <button
          onClick={onBack}
          className="chunky chunky-press rounded-xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          ← Back
        </button>
      )}
      <div className="flex items-center gap-3">
        {phase === "shop" && onContinue && (
          <button
            onClick={onContinue}
            className="chunky chunky-press rounded-xl bg-primary px-6 py-4 font-display text-lg font-black uppercase text-primary-foreground shadow-[0_6px_0_rgb(0,0,0,0.2)] ring-2 ring-primary-foreground/40"
          >
            NEXT SHIFT ▶
          </button>
        )}
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="chunky chunky-press rounded-xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          ☰ Menu
        </button>
      </div>
    </div>
  );
}


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
  const [musicOn, setMusicOnState] = useState(isMusicOn);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [saveNote, setSaveNote] = useState("");
  const [hasSave, setHasSave] = useState(false);
  const [slots, setSlots] = useState<SaveSlot[]>(() =>
    Array.from({ length: SLOT_COUNT }, () => null),
  );
  const [slotPicker, setSlotPicker] = useState<null | "save" | "load">(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [autoSaveOn, setAutoSaveOn] = useState(true);
  const [tutorialDone, setTutorialDone] = useState(true);
  /* dev mode (developer/testing tool) */
  const [pinOpen, setPinOpen] = useState(false);
  const [bedOverride, setBedOverride] = useState<number | null>(null);
  const [debugOverlay, setDebugOverlay] = useState(false);
  const [devEvents, setDevEvents] = useState(0);
  /* global menu — available on every non-shift screen (in-shift the pause veil is the menu) */
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [character, setCharacter] = useState<PlayerCharacter>(() => ({
    ...DEFAULT_CHARACTER,
    cosmetics: { ...DEFAULT_CHARACTER.cosmetics },
  }));

  useEffect(() => {
    const s = readSlots();
    setSlots(s);
    setHasSave(s.some(Boolean));
    setActiveSlot(readActiveSlot());
    const c = readCharacter();
    if (c) setCharacter(c);
    try {
      setTutorialDone(!!window.localStorage.getItem(TUT_KEY));
      setAutoSaveOn(readAutoSave());
    } catch {
      setTutorialDone(true);
      setAutoSaveOn(true);
    }
  }, []);

  useEffect(() => subscribeDevInfo((i) => setDevEvents(i.activeEvents)), []);

  useEffect(() => {
    const unsub = subscribeMusic(setMusicOnState);
    return () => {
      unsub();
    };
  }, []);

  function completeTutorial() {
    try {
      window.localStorage.setItem(TUT_KEY, "1");
    } catch {
      /* storage unavailable — tutorial simply replays next time */
    }
    setTutorialDone(true);
  }

  function currentSaveData(): SaveData {
    return {
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
      character,
    };
  }

  /** opens the save-file picker so the player chooses (and names) a slot */
  function saveProgress() {
    setSlotPicker("save");
  }

  function setActiveSlotPersisted(index: number | null) {
    setActiveSlot(index);
    writeActiveSlot(index);
  }

  function saveToSlot(index: number, name: string) {
    const next = [...slots];
    next[index] = { name: name.trim() || `Save ${index + 1}`, savedAt: Date.now(), data: currentSaveData() };
    const ok = writeSlots(next);
    setSlots(next);
    setHasSave(next.some(Boolean));
    setActiveSlotPersisted(index);
    setSlotPicker(null);
    setSaveNote(ok ? `Saved to “${next[index]!.name}” ✓` : "Could not save on this device");
    window.setTimeout(() => setSaveNote(""), 2500);
  }

  /** writes the supplied data to the active slot (or slot 0 if none chosen yet) */
  function autoSaveData(data: SaveData) {
    if (!autoSaveOn) return;
    const index = activeSlot ?? 0;
    const next = [...slots];
    const existing = next[index];
    next[index] = {
      name: existing?.name ?? "Auto save",
      savedAt: Date.now(),
      data,
    };
    const ok = writeSlots(next);
    setSlots(next);
    setHasSave(true);
    setActiveSlotPersisted(index);
    setSaveNote(ok ? "Auto-saved ✓" : "Could not auto-save");
    window.setTimeout(() => setSaveNote(""), 2500);
  }

  function applySave(d: SaveData) {
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
    if (d.character) {
      const c = normalizeCharacter(d.character);
      setCharacter(c);
      writeCharacter(c);
    }
  }

  /** opens the save-file picker so the player chooses which game to resume */
  function loadProgress() {
    setSlotPicker("load");
  }

  function loadFromSlot(index: number) {
    const slot = slots[index];
    if (!slot) return;
    applySave(slot.data);
    setActiveSlotPersisted(index);
    setSlotPicker(null);
    setMenuOpen(false);
    /* resuming always drops the player on the level ladder */
    setPhase("ladder");
    setSaveNote(`“${slot.name}” loaded ✓`);
    window.setTimeout(() => setSaveNote(""), 2500);
  }

  function toggleAutoSave() {
    setAutoSaveOn((on) => {
      const next = !on;
      writeAutoSave(next);
      return next;
    });
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
    const nextPoints = points + s.points;
    const nextXp = xp + Math.round(s.xp * mods.xpMult);
    setPoints(nextPoints);
    setXp(nextXp);
    let nextLevel = level;
    let nextHighest = highestLevel;
    let nextWardProgress = wardProgress;
    if (!s.collapsed) {
      nextLevel = Math.min(MAX_LEVEL, level + 1);
      nextHighest = Math.max(highestLevel, nextLevel);
      nextWardProgress = updateWardProgress(wardProgress, nextLevel);
      setLevel(nextLevel);
      setHighestLevel(nextHighest);
      setWardProgress(nextWardProgress);
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
    autoSaveData({
      points: nextPoints,
      xp: nextXp,
      level: nextLevel,
      upgrades,
      bedCount,
      staff,
      jobSecurity: r.after,
      gear,
      bedUpgrades,
      highestLevel: nextHighest,
      wardProgress: nextWardProgress,
      character,
    });
    setPhase("summary");
  }

  /** game sound effects only */
  function toggleSound() {
    setSoundOn((on) => {
      setSoundEnabled(!on);
      return !on;
    });
  }

  /** master switch — turns every sound (effects + music) on or off together */
  function toggleAllAudio() {
    const next = !(soundOn && musicOn);
    setSoundOn(next);
    setSoundEnabled(next);
    setMusicEnabled(next);
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
        window.localStorage.removeItem(SLOTS_KEY);
        window.localStorage.removeItem(TUT_KEY);
        window.localStorage.removeItem(ACTIVE_SLOT_KEY);
        window.localStorage.removeItem(AUTO_SAVE_KEY);
        clearCharacter();
      } catch {
        /* storage unavailable */
      }
      setSlots(Array.from({ length: SLOT_COUNT }, () => null));
      setHasSave(false);
      setActiveSlot(null);
      setAutoSaveOn(true);
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
      setCharacter({ ...DEFAULT_CHARACTER, cosmetics: { ...DEFAULT_CHARACTER.cosmetics } });
    },
    debugOverlay,
    setDebugOverlay,
  };

  function handleBack() {
    if (slotPicker) {
      setSlotPicker(null);
      return;
    }
    if (creditsOpen) {
      setCreditsOpen(false);
      setMenuOpen(true);
      return;
    }
    switch (phase) {
      case "ladder":
        setPhase("intro");
        break;
      case "summary":
        setPhase("intro");
        break;
      case "shop":
        setPhase("summary");
        break;
      case "fired":
        setPhase("intro");
        break;
      case "character":
        setPhase("intro");
        break;
    }
  }

  function play() {

    setRunKey((k) => k + 1);
    setPhase("shift");
  }


  return (
    <main className="flex min-h-dvh justify-center bg-ward-deep">
      <div className="relative flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl">
        {phase !== "dev" && phase !== "shift" && (
          <TopBar phase={phase} onBack={handleBack} onMenu={() => setMenuOpen(true)} onContinue={play} />
        )}
        <div className="relative flex-1 overflow-hidden">

        {phase === "intro" && (
          <IntroScreen
            soundOn={soundOn}
            hapticsOn={hapticsOn}
            onToggleSound={toggleSound}
            onToggleAllAudio={toggleAllAudio}
            onToggleHaptics={toggleHaptics}
            onLoad={loadProgress}
            hasSave={hasSave}
            saveNote={saveNote}
            onPlay={() => setPhase("character")}
            onLadder={() => setPhase("ladder")}
          />
        )}
        {phase === "character" && (
          <CharacterScreen
            character={character}
            onChange={setCharacter}
            onConfirm={(c) => {
              const next = normalizeCharacter(c);
              setCharacter(next);
              writeCharacter(next);
              play();
            }}
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
            autoSaveOn={autoSaveOn}
            onToggleAutoSave={toggleAutoSave}
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
            onSave={saveProgress}
            saveNote={saveNote}
            onBack={() => setPhase("summary")}
          />
        )}

        </div>

        {menuOpen && (
          <div className="absolute inset-0 z-[75] flex flex-col items-center justify-center gap-3 bg-background/95 p-6">
            <p className="font-display text-3xl font-black uppercase">☰ Menu</p>
            <div className="w-full space-y-2 rounded-2xl border-2 border-border bg-card/80 p-2">
              <p className="font-display text-xs font-black uppercase tracking-widest text-muted-foreground">
                Audio
              </p>
              <button
                onClick={toggleAllAudio}
                className="chunky chunky-press w-full rounded-2xl bg-primary py-3 font-display text-base font-black uppercase text-primary-foreground"
              >
                🔊 All sound {soundOn && musicOn ? "ON" : "OFF"}
              </button>
              <div className="grid w-full grid-cols-2 gap-2">
                <button
                  onClick={toggleSound}
                  className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
                >
                  🎮 Game sounds {soundOn ? "ON" : "OFF"}
                </button>
                <button
                  onClick={toggleMusic}
                  className="chunky chunky-press rounded-2xl bg-secondary py-3 font-display text-sm font-black uppercase text-secondary-foreground"
                >
                  🎵 Music {musicOn ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <button
              onClick={toggleHaptics}
              className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
            >
              📳 Haptics {hapticsOn ? "ON" : "OFF"}
            </button>
            <button
              onClick={toggleAutoSave}
              className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
            >
              💾 Auto-save {autoSaveOn ? "ON" : "OFF"}
            </button>
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
            <button
              onClick={() => {
                setMenuOpen(false);
                setCreditsOpen(true);
              }}
              className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
            >
              🎬 Credits &amp; Contact
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setPinOpen(true);
              }}
              className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
            >
              🛠️ Dev Mode
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
        {saveNote && (
          <div className="pointer-events-none absolute left-1/2 top-14 z-[70] -translate-x-1/2 rounded-full bg-calm px-3 py-1 font-display text-[11px] font-black uppercase text-calm-foreground shadow-md">
            {saveNote}
          </div>
        )}


        {creditsOpen && (
          <CreditsScreen
            onBack={() => {
              setCreditsOpen(false);
              setMenuOpen(true);
            }}
          />
        )}

        {slotPicker && (
          <SaveSlotPicker
            mode={slotPicker}
            slots={slots}
            onSave={saveToSlot}
            onLoad={loadFromSlot}
            onClose={() => setSlotPicker(null)}
          />
        )}
      </div>
    </main>
  );
}

function IntroScreen({
  soundOn,
  hapticsOn,
  onToggleSound,
  onToggleAllAudio,
  onToggleHaptics,
  onLoad,
  hasSave,
  saveNote,
  onPlay,
  onLadder,
}: {
  soundOn: boolean;
  hapticsOn: boolean;
  onToggleSound: () => void;
  onToggleAllAudio: () => void;
  onToggleHaptics: () => void;
  onLoad: () => void;
  hasSave: boolean;
  saveNote: string;
  onPlay: () => void;
  onLadder: () => void;
}) {
  const [musicOn, setMusicOnState] = useState(isMusicOn);

  useEffect(() => {
    playMusic("title");
    const unsub = subscribeMusic(setMusicOnState);
    return () => {
      unsub();
      stopMusic("title");
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 bg-[image:var(--gradient-sky)] p-6 text-center">
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
          ["👵", "Don't get fired by the DON"],
        ].map(([i, t]) => (
          <p key={t} className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-lg">{i}</span>
            {t}
          </p>
        ))}
      </div>

      <div className="grid w-full grid-cols-2 gap-2">
        <button
          onClick={onToggleAllAudio}
          className="chunky chunky-press rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          🔊 Sound {soundOn && musicOn ? "ON" : "OFF"}
        </button>
        <button
          onClick={onToggleHaptics}
          className="chunky chunky-press rounded-2xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          📳 Haptics {hapticsOn ? "ON" : "OFF"}
        </button>
      </div>

      <button
        onClick={onLoad}
        disabled={!hasSave}
        className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground disabled:opacity-50"
      >
        ↩ Continue save
      </button>
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
      <p className="text-[10px] leading-tight text-muted-foreground">
        A silly, fast-paced work of fiction. Fictional patients, fictional meds. Definitely not medical or nursing advice... maybe 👀
      </p>
    </div>
  );
}

/** three named save files — used both for saving and for resuming a game */
function SaveSlotPicker({
  mode,
  slots,
  onSave,
  onLoad,
  onClose,
}: {
  mode: "save" | "load";
  slots: SaveSlot[];
  onSave: (index: number, name: string) => void;
  onLoad: (index: number) => void;
  onClose: () => void;
}) {
  const [naming, setNaming] = useState<number | null>(null);
  const [name, setName] = useState("");

  return (
    <div className="absolute inset-0 z-[90] flex flex-col justify-center gap-3 bg-background/95 p-5">
      <p className="font-display text-center text-2xl font-black uppercase">
        {mode === "save" ? "💾 Save game" : "↩ Choose a save"}
      </p>
      <p className="text-center text-[11px] text-muted-foreground">
        {mode === "save"
          ? "Pick a slot and give this game a name."
          : "Pick the game you want to carry on with."}
      </p>

      {slots.map((slot, i) => {
        const empty = !slot;
        if (mode === "save" && naming === i) {
          return (
            <div key={i} className="rounded-2xl border-2 border-primary bg-card p-3">
              <input
                autoFocus
                value={name}
                maxLength={18}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Save ${i + 1}`}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-display text-base font-black uppercase"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNaming(null)}
                  className="chunky-press rounded-xl bg-secondary py-2 font-display text-sm font-black uppercase text-secondary-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(i, name)}
                  className="chunky-press rounded-xl bg-primary py-2 font-display text-sm font-black uppercase text-primary-foreground"
                >
                  Save here
                </button>
              </div>
            </div>
          );
        }
        return (
          <button
            key={i}
            disabled={mode === "load" && empty}
            onClick={() => {
              if (mode === "save") {
                setName(slot?.name ?? "");
                setNaming(i);
              } else {
                onLoad(i);
              }
            }}
            className="chunky-press flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3 text-left disabled:opacity-50"
          >
            <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-base font-black text-secondary-foreground">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display block truncate text-sm font-black uppercase">
                {slot ? slot.name : "Empty slot"}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {slot
                  ? `Shift Lv ${slot.data.level ?? 1} · ⭐ ${slot.data.points ?? 0} · ${new Date(
                      slot.savedAt,
                    ).toLocaleDateString()}`
                  : mode === "save"
                    ? "Tap to start a new save file"
                    : "Nothing saved here yet"}
              </span>
            </span>
          </button>
        );
      })}

      <button
        onClick={onClose}
        className="chunky chunky-press w-full rounded-2xl bg-secondary py-3 font-display text-base font-black uppercase text-secondary-foreground"
      >
        Cancel ✕
      </button>
    </div>
  );
}
