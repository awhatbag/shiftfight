import type { RollingHazard } from "./wardTypes";

export function CatastropheHazardLayer({ hazards, sprites, now }: { hazards: RollingHazard[]; sprites: string[]; now: number }) {
  return <>{hazards.map((hazard) => {
    const age = now - hazard.born;
    const collided = hazard.hitX !== null && age >= hazard.hitAt;
    const stoppedFor = collided ? age - hazard.hitAt : 0;
    const gone = collided ? stoppedFor > 5_850 : age > hazard.speed + 500;
    if (gone) return null;
    const travel = Math.min(1, age / hazard.speed);
    const x = collided && hazard.hitX !== null ? hazard.hitX : 1.1 - travel * 1.22;
    const y = collided ? hazard.y + 0.045 : hazard.y + (hazard.endY - hazard.y) * travel + Math.sin(age / 115) * 0.007;
    const flicker = collided && stoppedFor > 5_000 && Math.floor(stoppedFor / 90) % 2 === 0;
    const art = sprites[hazard.art % sprites.length] ?? sprites[0];
    return <img key={hazard.id} src={art} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute z-[88] object-contain" style={{ left: `${x * 100}%`, top: `${y * 100}%`, height: `${hazard.size}%`, width: `${hazard.size * 1.15}%`, opacity: flicker ? 0.15 : 1, transform: `translate(-50%,-50%) rotate(${collided ? hazard.spin * 70 : hazard.spin * age * 0.24}deg)` }} />;
  })}</>;
}
