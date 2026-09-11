import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MINI_GAMES } from "@/game/minigames";
import { emitDevCommand, subscribeDevInfo, type DevInfo } from "@/game/dev";
import { MAX_BEDS, MAX_LEVEL, STAFF, UPGRADE_INFO, type Upgrades } from "@/game/config";
import { DON_MOOD_META, moodFor, securityBand } from "@/game/don";
import { JobSecurityBar } from "@/components/game/JobSecurityBar";
import { GEAR_CATEGORIES, GEAR_ITEMS, type Effects } from "@/game/gear";
import { BED_UPGRADES } from "@/game/bedUpgrades";
import { SHIFT_TITLES, shiftTitle } from "@/game/shifts";
import { WARDS, wardLadder } from "@/game/wards";
import { useEffect } from "react";

export type DevApi = {
  level: number;
  points: number;
  xp: number;
  bedCount: number;
  bedOverride: number | null;
  upgrades: Upgrades;
  staff: string[];
  gear: string[];
  bedUpgrades: string[];
  highestLevel: number;
  wardId: string;
  mods: Effects;
  setLevel: (n: number) => void;
  setHighestLevel: (n: number) => void;
  addPoints: (n: number) => void;
  addXp: (n: number) => void;
  setUpgrades: (u: Upgrades) => void;
  setStaff: (s: string[]) => void;
  setGear: (g: string[]) => void;
  setBedUpgrades: (b: string[]) => void;
  setBedOverride: (n: number | null) => void;
  jobSecurity: number;
  setJobSecurity: (n: number) => void;
  openLadder: () => void;
  resetSave: () => void;
  debugOverlay: boolean;
  setDebugOverlay: (v: boolean) => void;
};

type Category = {
  key: string;
  name: string;
  icon: string;
  /** placeholder categories render an explanatory stub */
  render: (api: DevApi, ui: DevUi) => ReactNode;
};

type DevUi = {
  launchMini: (key: string) => void;
  info: DevInfo;
};

/* ---------------- small building blocks ---------------- */

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "chunky-press rounded-xl border-2 border-border px-3 py-2 font-display text-sm font-black uppercase",
        active ? "bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      {children}
    </button>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border-2 border-dashed border-border bg-card/60 p-3 text-sm text-muted-foreground">
      {text}
    </p>
  );
}

/* ---------------- category registry ----------------
   Add a new object here to extend Dev Mode; nothing else needs changing. */

export const DEV_CATEGORIES: Category[] = [
  {
    key: "levels",
    name: "Levels",
    icon: "🎚️",
    render: (api) => (
      <Row label="Jump to level">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => (
            <Chip key={l} active={api.level === l} onClick={() => api.setLevel(l)}>
              {l}
            </Chip>
          ))}
        </div>
      </Row>
    ),
  },
  {
    key: "minigames",
    name: "Mini Games",
    icon: "🎮",
    render: (_api, ui) => (
      <Row label={`Registered mini-games (${MINI_GAMES.length})`}>
        <div className="space-y-2">
          {MINI_GAMES.map((g) => (
            <button
              key={g.key}
              onClick={() => ui.launchMini(g.key)}
              className="chunky-press flex w-full items-center gap-2 rounded-2xl border-2 border-border bg-card p-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-sm font-black uppercase">
                  {g.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {g.blurb}
                </span>
              </span>
              <span className="font-display shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-black text-primary-foreground">
                Launch ▶
              </span>
            </button>
          ))}
        </div>
      </Row>
    ),
  },
  {
    key: "patients",
    name: "Patients & Events",
    icon: "🛏️",
    render: (_api, ui) => (
      <div className="space-y-2">
        <Row label="Live testing">
          <button
            disabled={!ui.info.inShift}
            onClick={() => emitDevCommand("spawnEvent")}
            className="chunky-press w-full rounded-2xl bg-primary py-3 font-display text-sm font-black uppercase text-primary-foreground disabled:opacity-50"
          >
            Trigger random patient event
          </button>
          {!ui.info.inShift && (
            <p className="text-[11px] text-muted-foreground">
              Start a shift first — events spawn into the live ward.
            </p>
          )}
        </Row>
        <Placeholder text="Space for future patient/event testing controls." />
      </div>
    ),
  },
  {
    key: "ward",
    name: "Ward",
    icon: "🏥",
    render: (api) => (
      <div className="space-y-2">
        <Row label={`Bed count (now ${api.bedCount})`}>
          <div className="grid grid-cols-6 gap-2">
            {[4, 5, 6, 7, 8].map((b) => (
              <Chip key={b} active={api.bedOverride === b} onClick={() => api.setBedOverride(b)}>
                {b}
              </Chip>
            ))}
            <Chip active={api.bedOverride === null} onClick={() => api.setBedOverride(null)}>
              Auto
            </Chip>
          </div>
        </Row>
        <Placeholder text={`Space for future ward elements (max ${MAX_BEDS} beds today).`} />
      </div>
    ),
  },
  {
    key: "progression",
    name: "Progression",
    icon: "📈",
    render: (api) => (
      <div className="space-y-3">
        <Row label={`Points (${api.points})`}>
          <div className="grid grid-cols-4 gap-2">
            {[100, 1000, 10000].map((n) => (
              <Chip key={n} onClick={() => api.addPoints(n)}>
                +{n}
              </Chip>
            ))}
            <Chip onClick={() => api.addPoints(-api.points)}>Zero</Chip>
          </div>
        </Row>
        <Row label={`XP (${api.xp})`}>
          <div className="grid grid-cols-4 gap-2">
            {[50, 500, 5000].map((n) => (
              <Chip key={n} onClick={() => api.addXp(n)}>
                +{n}
              </Chip>
            ))}
            <Chip onClick={() => api.addXp(-api.xp)}>Zero</Chip>
          </div>
        </Row>
        <Row label="Upgrades">
          <div className="space-y-2">
            {UPGRADE_INFO.map((u) => (
              <div key={u.key} className="flex items-center gap-2">
                <span className="font-display min-w-0 flex-1 truncate text-sm font-black uppercase">
                  {u.icon} {u.name} · {api.upgrades[u.key]}
                </span>
                <Chip
                  onClick={() =>
                    api.setUpgrades({
                      ...api.upgrades,
                      [u.key]: Math.min(5, api.upgrades[u.key] + 1),
                    })
                  }
                >
                  +1
                </Chip>
                <Chip onClick={() => api.setUpgrades({ ...api.upgrades, [u.key]: 0 })}>0</Chip>
              </div>
            ))}
            <Chip onClick={() => api.setUpgrades({ speed: 5, response: 5, equipment: 5 })}>
              Max all
            </Chip>
          </div>
        </Row>
        <Placeholder text="Space for future progression systems." />
      </div>
    ),
  },
  {
    key: "staff",
    name: "Staff",
    icon: "🧑‍⚕️",
    render: (api) => (
      <div className="space-y-2">
        <Row label="Hired staff">
          <div className="space-y-2">
            {STAFF.map((s) => {
              const hired = api.staff.includes(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() =>
                    api.setStaff(
                      hired ? api.staff.filter((k) => k !== s.key) : [...api.staff, s.key],
                    )
                  }
                  className="chunky-press flex w-full items-center gap-2 rounded-2xl border-2 border-border bg-card p-3 text-left"
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-display block truncate text-sm font-black uppercase">
                      {s.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {s.bonus}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-display shrink-0 rounded-lg px-2 py-1 text-xs font-black",
                      hired
                        ? "bg-calm text-calm-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {hired ? "HIRED" : "OFF"}
                  </span>
                </button>
              );
            })}
            <Chip onClick={() => api.setStaff(STAFF.map((s) => s.key))}>Hire all</Chip>
          </div>
        </Row>
        <Placeholder text="Space for future staff mechanics." />
      </div>
    ),
  },
  {
    key: "don",
    name: "Job Security / The DON",
    icon: "🧑‍💼",
    render: (api, ui) => (
      <div className="space-y-3">
        <JobSecurityBar value={api.jobSecurity} />
        <Row label={`Set job security (now ${api.jobSecurity}%)`}>
          <div className="grid grid-cols-6 gap-2">
            {[0, 15, 40, 60, 80, 100].map((v) => (
              <Chip
                key={v}
                active={api.jobSecurity === v}
                onClick={() => api.setJobSecurity(v)}
              >
                {v}
              </Chip>
            ))}
          </div>
        </Row>
        <Row label="Nudge">
          <div className="grid grid-cols-4 gap-2">
            {[-10, -5, +5, +10].map((d) => (
              <Chip key={d} onClick={() => api.setJobSecurity(api.jobSecurity + d)}>
                {d > 0 ? `+${d}` : d}
              </Chip>
            ))}
          </div>
        </Row>
        <Row label="DON mood">
          <p className="rounded-2xl border-2 border-border bg-card p-3 text-sm font-bold">
            {DON_MOOD_META[moodFor(api.jobSecurity)].dot}{" "}
            {securityBand(api.jobSecurity).label} · “
            {DON_MOOD_META[moodFor(api.jobSecurity)].line}”
          </p>
        </Row>
        <Row label="Live testing">
          <button
            disabled={!ui.info.inShift}
            onClick={() => emitDevCommand("donVisit")}
            className="chunky-press w-full rounded-2xl bg-alarm py-3 font-display text-sm font-black uppercase text-alarm-foreground disabled:opacity-50"
          >
            🚨 Send the DON to the ward
          </button>
          {!ui.info.inShift && (
            <p className="text-[11px] text-muted-foreground">
              Start a shift first — the DON visits the live ward.
            </p>
          )}
        </Row>
        <Placeholder text="Space for future DON mechanics (warnings, HR events, rehiring)." />
      </div>
    ),
  },
  {
    key: "shifttitles",
    name: "Shift Titles",
    icon: "📖",
    render: (api) => (
      <div className="space-y-2">
        <Row label={`Story title for level ${api.level}`}>
          <p className="rounded-2xl border-2 border-border bg-card p-3 text-sm font-bold">
            “{shiftTitle(api.level).title}” — {shiftTitle(api.level).lead}
          </p>
        </Row>
        <Row label={`Catalogue (${Object.keys(SHIFT_TITLES).length})`}>
          <div className="space-y-1">
            {Object.entries(SHIFT_TITLES).map(([lvl, t]) => (
              <button
                key={lvl}
                onClick={() => api.setLevel(Number(lvl))}
                className="chunky-press block w-full rounded-xl border-2 border-border bg-card p-2 text-left text-[11px]"
              >
                <span className="font-display font-black uppercase">Lv{lvl} · {t.title}</span>
              </button>
            ))}
          </div>
        </Row>
      </div>
    ),
  },
  {
    key: "gear",
    name: "Equipment & Cosmetics",
    icon: "👟",
    render: (api) => (
      <div className="space-y-3">
        {GEAR_CATEGORIES.map((c) => (
          <Row key={c.key} label={`${c.icon} ${c.name}`}>
            <div className="space-y-1">
              {GEAR_ITEMS.filter((g) => g.category === c.key).map((g) => {
                const owned = api.gear.includes(g.key);
                return (
                  <button
                    key={g.key}
                    onClick={() =>
                      api.setGear(
                        owned ? api.gear.filter((k) => k !== g.key) : [...api.gear, g.key],
                      )
                    }
                    className="chunky-press flex w-full items-center gap-2 rounded-xl border-2 border-border bg-card p-2 text-left"
                  >
                    <span>{g.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px]">
                      {g.name} · {g.blurb}
                    </span>
                    <span
                      className={cn(
                        "font-display shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black",
                        owned ? "bg-calm text-calm-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {owned ? "OWNED" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Row>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <Chip onClick={() => api.setGear(GEAR_ITEMS.map((g) => g.key))}>Own all</Chip>
          <Chip onClick={() => api.setGear([])}>Clear</Chip>
        </div>
      </div>
    ),
  },
  {
    key: "bedupgrades",
    name: "Bed Upgrades",
    icon: "🛠️",
    render: (api) => (
      <div className="space-y-2">
        {BED_UPGRADES.map((b) => {
          const owned = api.bedUpgrades.includes(b.key);
          return (
            <button
              key={b.key}
              onClick={() =>
                api.setBedUpgrades(
                  owned
                    ? api.bedUpgrades.filter((k) => k !== b.key)
                    : [...api.bedUpgrades, b.key],
                )
              }
              className="chunky-press flex w-full items-center gap-2 rounded-xl border-2 border-border bg-card p-2 text-left"
            >
              <span>{b.icon}</span>
              <span className="min-w-0 flex-1 truncate text-[11px]">
                {b.name} · {b.blurb}
              </span>
              <span
                className={cn(
                  "font-display shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black",
                  owned ? "bg-calm text-calm-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {owned ? "ON" : "OFF"}
              </span>
            </button>
          );
        })}
        <div className="grid grid-cols-2 gap-2">
          <Chip onClick={() => api.setBedUpgrades(BED_UPGRADES.map((b) => b.key))}>All</Chip>
          <Chip onClick={() => api.setBedUpgrades([])}>Clear</Chip>
        </div>
      </div>
    ),
  },
  {
    key: "wards",
    name: "Wards & Expansion",
    icon: "🏨",
    render: (api) => (
      <div className="space-y-3">
        <Row label={`Highest level reached (${api.highestLevel})`}>
          <div className="grid grid-cols-5 gap-2">
            {[1, 3, 5, 8, 10].map((n) => (
              <Chip key={n} onClick={() => api.setHighestLevel(n)}>
                {n}
              </Chip>
            ))}
          </div>
        </Row>
        <Row label="Level ladder">
          <Chip onClick={api.openLadder}>Open ladder screen</Chip>
        </Row>
        <Row label={`Wards (${WARDS.length}) · current: ${api.wardId}`}>
          <div className="space-y-1">
            {wardLadder(api.highestLevel).map((w) => (
              <p
                key={w.ward.id}
                className="rounded-xl border-2 border-border bg-card p-2 text-[11px]"
              >
                <span className="font-display font-black uppercase">
                  {w.ward.icon} {w.ward.name}
                </span>{" "}
                · Lv{w.ward.from}–{w.ward.to} ·{" "}
                {w.ward.status === "live"
                  ? w.unlocked
                    ? "PLAYABLE"
                    : "LOCKED"
                  : "PLANNED"}
              </p>
            ))}
          </div>
        </Row>
        <Placeholder text="Ward designs, ward-specific gameplay and staff takeover are future work; the architecture already supports more wards and levels." />
      </div>
    ),
  },
  {
    key: "cosmetics",
    name: "Content / Cosmetics",
    icon: "🎨",
    render: () => (
      <Placeholder text="Reserved for future cosmetics, nurse customisation and ward decorations. Nothing to test yet." />
    ),
  },
  {
    key: "events",
    name: "Events",
    icon: "🎉",
    render: () => (
      <Placeholder text="Reserved for future special, holiday and catastrophic events. Nothing to test yet." />
    ),
  },
  {
    key: "debug",
    name: "Debug",
    icon: "🐞",
    render: (api, ui) => <DebugPanel api={api} ui={ui} />,
  },
];

function DebugPanel({ api, ui }: { api: DevApi; ui: DevUi }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-3">
      <Row label="Debug overlay">
        <Chip active={api.debugOverlay} onClick={() => api.setDebugOverlay(!api.debugOverlay)}>
          {api.debugOverlay ? "Overlay ON" : "Overlay OFF"}
        </Chip>
      </Row>
      <Row label="Current state">
        <div className="rounded-2xl border-2 border-border bg-card p-3 font-mono text-xs">
          <p>level: {api.level}</p>
          <p>points: {api.points}</p>
          <p>xp: {api.xp}</p>
          <p>
            beds: {api.bedCount} {api.bedOverride !== null ? "(forced)" : "(auto)"}
          </p>
          <p>jobSecurity: {api.jobSecurity}% ({moodFor(api.jobSecurity)})</p>
          <p>activeEvents: {ui.info.activeEvents}</p>
          <p>inShift: {String(ui.info.inShift)}</p>
          <p>staff: {api.staff.join(", ") || "none"}</p>
          <p>
            upgrades: s{api.upgrades.speed} r{api.upgrades.response} e{api.upgrades.equipment}
          </p>
        </div>
      </Row>
      <Row label="Danger zone">
        {confirm ? (
          <div className="grid grid-cols-2 gap-2">
            <Chip onClick={() => setConfirm(false)}>Cancel</Chip>
            <button
              onClick={() => {
                api.resetSave();
                setConfirm(false);
              }}
              className="chunky-press rounded-xl bg-alarm px-3 py-2 font-display text-sm font-black uppercase text-alarm-foreground"
            >
              Confirm reset
            </button>
          </div>
        ) : (
          <Chip onClick={() => setConfirm(true)}>Reset save</Chip>
        )}
      </Row>
      <Placeholder text="Space for future debugging controls." />
    </div>
  );
}

/* ---------------- screen ---------------- */

export function DevMode({ api, onClose }: { api: DevApi; onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [mini, setMini] = useState<string | null>(null);
  const [miniLevel, setMiniLevel] = useState(3);
  const [info, setInfo] = useState<DevInfo>({ activeEvents: 0, inShift: false });

  useEffect(() => subscribeDevInfo(setInfo), []);

  const ui: DevUi = { launchMini: (k) => setMini(k), info };
  const active = MINI_GAMES.find((g) => g.key === mini);
  const Game = active?.component;

  if (Game) {
    return (
      <div className="relative h-full w-full">
        <Game level={miniLevel} paused={false} onDone={() => setMini(null)} />
        <div className="absolute inset-x-0 bottom-0 z-[60] flex items-center gap-2 border-t-2 border-border bg-card px-3 pb-4 pt-3">
          <span className="font-display text-xs font-black uppercase">Dev · lvl</span>
          <input
            type="range"
            min={0}
            max={9}
            value={miniLevel}
            onChange={(e) => setMiniLevel(Number(e.target.value))}
            className="flex-1"
          />
          <span className="font-display w-6 text-center text-sm font-black">{miniLevel}</span>
          <button
            onClick={() => setMini(null)}
            className="chunky-press rounded-xl bg-alarm px-3 py-2 font-display text-sm font-black uppercase text-alarm-foreground"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-black uppercase">🛠️ Dev Mode</h2>
        <button
          onClick={onClose}
          className="chunky-press rounded-xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground"
        >
          Close
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Developer/testing tool. Changes here affect your local session only.
      </p>

      <div className="space-y-2">
        {DEV_CATEGORIES.map((c) => {
          const isOpen = open === c.key;
          return (
            <div key={c.key} className="rounded-2xl border-2 border-border bg-card/70">
              <button
                onClick={() => setOpen(isOpen ? null : c.key)}
                className="flex w-full items-center gap-2 p-3 text-left"
              >
                <span className="text-xl">{c.icon}</span>
                <span className="font-display flex-1 truncate text-sm font-black uppercase">
                  {c.name}
                </span>
                <span className="text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && <div className="border-t-2 border-border p-3">{c.render(api, ui)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- PIN gate ---------------- */

export function DevPinPrompt({
  onUnlock,
  onCancel,
  pin,
}: {
  onUnlock: () => void;
  onCancel: () => void;
  pin: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function press(d: string) {
    const next = (value + d).slice(0, pin.length);
    setValue(next);
    setError(false);
    if (next.length === pin.length) {
      if (next === pin) onUnlock();
      else {
        setError(true);
        setValue("");
      }
    }
  }

  return (
    <div className="absolute inset-0 z-[70] grid place-items-center bg-background/95 p-5">
      <div className="w-full max-w-[320px] rounded-3xl border-4 border-border bg-card p-4 text-center">
        <h3 className="font-display text-xl font-black uppercase">Dev Mode PIN</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">Developer access only.</p>
        <p className="font-display my-3 text-2xl font-black tracking-[0.4em]">
          {"•".repeat(value.length).padEnd(pin.length, "·")}
        </p>
        {error && (
          <p className="font-display mb-2 text-xs font-black uppercase text-alarm">
            Wrong PIN
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Chip key={d} onClick={() => press(d)}>
              {d}
            </Chip>
          ))}
          <Chip onClick={() => setValue("")}>C</Chip>
          <Chip onClick={() => press("0")}>0</Chip>
          <Chip onClick={onCancel}>✕</Chip>
        </div>
      </div>
    </div>
  );
}
