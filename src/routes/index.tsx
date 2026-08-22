import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WardScreen, type ShiftStats } from "@/components/game/WardScreen";
import { SummaryScreen } from "@/components/game/SummaryScreen";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { BED_UNLOCK_COST, type Upgrades } from "@/game/config";

const TITLE = "Shift Happens — Hospital Ward Arcade";
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

type Phase = "intro" | "shift" | "summary" | "shop";

function Game() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [cash, setCash] = useState(0);
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

  const staffBonus = staff.includes("student") ? 0.15 : 0;

  function endShift(s: ShiftStats) {
    setLast(s);
    setCash((c) => c + s.cash);
    setXp((x) => x + s.xp);
    setPhase("summary");
  }

  function play() {
    setRunKey((k) => k + 1);
    setPhase("shift");
  }

  return (
    <main className="flex min-h-dvh justify-center bg-ward-deep">
      <div className="relative flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl">
        {phase === "intro" && (
          <IntroScreen xp={xp} cash={cash} onPlay={play} />
        )}
        {phase === "shift" && (
          <WardScreen
            key={runKey}
            upgrades={upgrades}
            bedCount={bedCount}
            staffBonus={staffBonus}
            hasHca={staff.includes("hca")}
            onEnd={endShift}
          />
        )}
        {phase === "summary" && last && (
          <SummaryScreen stats={last} onNext={() => setPhase("shop")} />
        )}
        {phase === "shop" && (
          <UpgradeScreen
            cash={cash}
            upgrades={upgrades}
            bedCount={bedCount}
            staff={staff}
            onBuy={(k, cost) => {
              setCash((c) => c - cost);
              setUpgrades((u) => ({ ...u, [k]: u[k] + 1 }));
            }}
            onUnlockBeds={() => {
              setCash((c) => c - BED_UNLOCK_COST);
              setBedCount(6);
            }}
            onHire={(k, cost) => {
              setCash((c) => c - cost);
              setStaff((s) => [...s, k]);
            }}
            onPlay={play}
          />
        )}
      </div>
    </main>
  );
}

function IntroScreen({
  xp,
  cash,
  onPlay,
}: {
  xp: number;
  cash: number;
  onPlay: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[image:var(--gradient-sky)] p-6 text-center">
      <div className="animate-bob text-6xl">🏥</div>
      <div>
        <h1 className="font-display text-5xl font-black leading-none tracking-tight">
          SHIFT
          <br />
          <span className="text-primary">HAPPENS</span>
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

      {(xp > 0 || cash > 0) && (
        <p className="font-display text-xs font-black uppercase text-muted-foreground">
          💷 {cash} · ✨ {xp} XP
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
