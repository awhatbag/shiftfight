import {
  cosmeticColor,
  DEFAULT_CHARACTER,
  type PlayerCharacter,
} from "@/game/character";

export type NurseDirection = "north" | "south" | "east" | "west";
export type NurseAction = "idle" | "walk" | "run" | "sit" | "interact" | "check";
export type NurseExpression = "neutral" | "happy" | "concerned" | "angry" | "tired" | "surprised";

type NurseProps = {
  character?: PlayerCharacter;
  moving?: boolean;
  action?: NurseAction;
  direction?: NurseDirection;
  expression?: NurseExpression;
  className?: string;
};

export function Nurse({
  character = DEFAULT_CHARACTER,
  moving = false,
  action = moving ? "walk" : "idle",
  direction = "south",
  expression = "neutral",
  className = "",
}: NurseProps) {
  const skin = cosmeticColor("skin", character.cosmetics.skin);
  const hair = cosmeticColor("hair", character.cosmetics.hair);
  const scrub = cosmeticColor("scrubs", character.cosmetics.scrubs);
  const shoes = cosmeticColor("shoes", character.cosmetics.shoes);
  const back = direction === "north";
  const side = direction === "east" || direction === "west";
  const flip = direction === "west";
  const sitting = action === "sit";
  const active = action === "walk" || action === "run";
  const usingHands = action === "interact" || action === "check";
  const hairstyle = character.cosmetics.hairstyle ?? "signature";

  const eyes = expression === "tired" ? "M18 18h4M28 18h4" : expression === "surprised" ? "M20 17v2M30 17v2" : "M19 18h2M29 18h2";
  const mouth = expression === "happy" ? "M21 23q4 4 8 0" : expression === "angry" || expression === "concerned" ? "M22 25q3-3 6 0" : expression === "surprised" ? "M24 23h2v3h-2z" : "M22 24q3 2 6 0";

  return (
    <div className={`pixel-nurse pixel-nurse--${action} ${className}`}>
      <svg
        viewBox="0 0 64 80"
        className="h-full w-full overflow-visible drop-shadow-md"
        role="img"
        aria-label={`${character.presentation} nurse ${action}`}
        style={{ transform: flip ? "scaleX(-1)" : undefined }}
      >
        <g className={active ? "pixel-nurse__stride" : ""}>
          <ellipse cx="32" cy={sitting ? 69 : 75} rx="20" ry="3" fill="var(--character-shadow)" opacity=".28" />
          {!sitting && <>
            <path d="M20 55h10l-2 16H18z" fill={scrub} stroke="var(--character-outline)" strokeWidth="2" />
            <path d="M34 55h10l2 16H36z" fill={scrub} stroke="var(--character-outline)" strokeWidth="2" />
            <path d="M16 69h13v7H14q-3-3 2-7zM35 69h13q5 4 1 7H35z" fill={shoes} stroke="var(--character-outline)" strokeWidth="2" />
          </>}
          {sitting && <path d="M18 55h13v12H15v-6zM33 55h13l3 6v6H33z" fill={scrub} stroke="var(--character-outline)" strokeWidth="2" />}
          <path d={side ? "M19 34q7-5 21 0l6 26H18z" : "M15 34q17-8 34 0l-4 28H19z"} fill={scrub} stroke="var(--character-outline)" strokeWidth="2" />
          {!back && <path d="M26 35h12v13H26z" fill="var(--character-badge)" stroke="var(--character-outline)" strokeWidth="1.5" />}
          <g className={usingHands ? "pixel-nurse__hands" : ""}>
            <path d="M17 37q-7 7-5 20l7 1 5-18z" fill={scrub} stroke="var(--character-outline)" strokeWidth="2" />
            <path d={usingHands ? "M47 37q9 4 13-2l3 5q-7 10-17 7z" : "M47 37q7 8 4 20l-7 1-4-18z"} fill={scrub} stroke="var(--character-outline)" strokeWidth="2" />
            <circle cx="14" cy="58" r="4" fill={skin} stroke="var(--character-outline)" strokeWidth="2" />
            <circle cx={usingHands ? 61 : 49} cy={usingHands ? 38 : 58} r="4" fill={skin} stroke="var(--character-outline)" strokeWidth="2" />
          </g>
          <circle cx={side ? 31 : 32} cy="23" r="15" fill={skin} stroke="var(--character-outline)" strokeWidth="2" />
          <path d={back ? "M17 24q0-20 15-20t15 20v8q-14-9-30 0z" : side ? "M17 22Q18 5 33 5q12 1 13 17-12-9-29 0z" : "M17 22Q18 4 32 4t15 18q-15-10-30 0z"} fill={hair} stroke="var(--character-outline)" strokeWidth="2" />
          {hairstyle === "signature" && character.presentation === "female" && <circle cx="22" cy="7" r="8" fill={hair} stroke="var(--character-outline)" strokeWidth="2" />}
          {character.presentation === "nonbinary" && <path d="M43 8l9-5-3 11z" fill={hair} stroke="var(--character-outline)" strokeWidth="2" />}
          {character.presentation === "male" && <path d="M18 10l5-7 4 5 5-7 4 7 6-4 3 10z" fill={hair} />}
          {!back && <>
            <path d={eyes} stroke="var(--character-ink)" strokeWidth="2" strokeLinecap="round" />
            <path d={mouth} stroke="var(--character-mouth)" strokeWidth="1.7" fill={expression === "surprised" ? "var(--character-mouth)" : "none"} strokeLinecap="round" />
          </>}
          {character.cosmetics.ppe === "visor" && !back && <path d="M17 16h30l-3 16H20z" fill="var(--character-visor)" stroke="var(--character-outline)" strokeWidth="1.5" opacity=".72" />}
          {usingHands && <rect x="55" y="28" width="7" height="12" rx="1" fill="var(--character-device)" stroke="var(--character-outline)" strokeWidth="1.5" />}
        </g>
      </svg>
    </div>
  );
}
