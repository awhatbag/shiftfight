import { useEffect, useState } from "react";
import previewAtlas from "@/assets/nurse-preview-sheet.png.asset.json";
import spriteAtlas from "@/assets/nurse-sprite-atlas.png.asset.json";
import type { PlayerCharacter } from "@/game/character";

export type NurseDirection = "north" | "south" | "east" | "west";
export type NurseAction = "idle" | "walk" | "run" | "sit" | "interact" | "check";
export type NurseExpression = "neutral" | "happy" | "concerned" | "angry" | "tired" | "surprised";

type NurseProps = {
  character?: PlayerCharacter;
  moving?: boolean;
  action?: NurseAction;
  direction?: NurseDirection;
  expression?: NurseExpression;
  variant?: "ward" | "preview";
  className?: string;
};

// Sprite sheet cut directly from the supplied "nurse choices" artwork.
// Columns: female, male, non-binary.
// Rows: idle, walk down, walk side A, walk side B, run, interact, check, back.
const COLS = 3;
const CELL_W = 104;
const CELL_H = 148;
const ROWS = 8;
const ROW = { idle: 0, walkS: 1, walkE1: 2, walkE2: 3, run: 4, interact: 5, check: 6, back: 7 } as const;
const PREVIEW_W = 170;
const PREVIEW_H = 436;
const PRESENTATIONS = ["female", "male", "nonbinary"] as const;

export function Nurse({
  character = { presentation: "female" } as PlayerCharacter,
  moving = false,
  action = moving ? "walk" : "idle",
  direction = "south",
  variant = "ward",
  className = "",
}: NurseProps) {
  const col = Math.max(0, PRESENTATIONS.indexOf(character.presentation));

  if (variant === "preview") {
    return (
      <div
        className={`nurse-sprite ${className}`}
        style={{ height: "100%", aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}`, margin: "0 auto" }}
        role="img"
        aria-label={`${character.presentation} nurse`}
      >
        <img
          src={previewAtlas.url}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            width: `${COLS * 100}%`,
            left: `-${col * 100}%`,
            top: 0,
            imageRendering: "pixelated",
          }}
        />
      </div>
    );
  }

  // Pick the sheet row(s) for the current state.
  let frames: readonly number[] = [ROW.idle];
  if (action === "sit" || direction === "north") frames = [ROW.back];
  else if (action === "run") frames = [ROW.run];
  else if (action === "interact") frames = [ROW.interact];
  else if (action === "check") frames = [ROW.check];
  else if (direction === "south") frames = [ROW.idle, ROW.walkS];
  else frames = [ROW.walkE1, ROW.walkE2];

  const animate = frames.length > 1 && (action === "walk" || action === "run");
  const idx = useFrameToggle(animate, frames, action === "run" ? 110 : 170);
  const frame = frames[idx % frames.length] as number;
  const flip = direction === "west" && action !== "sit";

  return (
    <div
      className={`nurse-sprite ${action === "run" ? "nurse-run" : ""} ${className}`}
      style={{ height: "100%", aspectRatio: `${CELL_W} / ${CELL_H}`, margin: "0 auto" }}
      role="img"
      aria-label={`${character.presentation} nurse ${action}`}
    >
      <img
        src={spriteAtlas.url}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          width: `${COLS * 100}%`,
          height: `${ROWS * 100}%`,
          left: `-${col * 100}%`,
          top: `-${frame * 100}%`,
          transform: flip ? "scaleX(-1)" : undefined,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

function useFrameToggle(animate: boolean, frames: readonly number[], ms: number) {
  const [i, setI] = useState(0);
  const framesKey = frames.join(",");
  const len = frames.length;
  useEffect(() => {
    if (!animate || len < 2) {
      setI(0);
      return;
    }
    const t = window.setInterval(() => setI((v) => (v + 1) % len), ms);
    return () => window.clearInterval(t);
  }, [animate, framesKey, len, ms]);
  return i % len;
}
