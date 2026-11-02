import pillow1 from "@/assets/pillow1.png.asset.json";
import pillow2 from "@/assets/pillow2.png.asset.json";
import pillow3 from "@/assets/pillow3.png.asset.json";
import pillow4 from "@/assets/pillow4.png.asset.json";
import pillow5 from "@/assets/pillow5.png.asset.json";
import pillow6 from "@/assets/pillow6.png.asset.json";
import pillow7 from "@/assets/pillow7.png.asset.json";
import pillow8 from "@/assets/pillow8.png.asset.json";
import pillow9 from "@/assets/pillow9.png.asset.json";

/** pillows cut individually from the supplied pillow artwork */
export const PILLOW_SPRITES = [pillow1, pillow2, pillow3, pillow4, pillow5, pillow6, pillow7, pillow8, pillow9].map((a) => a.url);

export type FloorPillow = { id: number; x: number; y: number; born: number; art: number };

/** pillows wait 5s, then flash and fade (still collectable) until they vanish */
export const PILLOW_WAIT_MS = 5_000;
export const PILLOW_LIFE_MS = 6_500;

export function PillowLayer({ pillows, now, onTap, disabled }: { pillows: FloorPillow[]; now: number; onTap: (id: number) => void; disabled: boolean }) {
  return <>{pillows.map((p) => {
    const age = now - p.born;
    if (age > PILLOW_LIFE_MS) return null;
    const fading = age > PILLOW_WAIT_MS;
    const fade = fading ? 1 - (age - PILLOW_WAIT_MS) / (PILLOW_LIFE_MS - PILLOW_WAIT_MS) : 1;
    const flicker = fading && Math.floor(age / 90) % 2 === 0;
    return <button key={p.id} type="button" disabled={disabled} onClick={() => onTap(p.id)} aria-label="Collect pillow" className="pointer-events-auto absolute grid h-[7%] w-[13%] -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: 87 }}>
      <span aria-hidden="true" className="pillow-star pointer-events-none absolute left-1/2 top-0 text-3xl text-gold">★</span>
      <img src={PILLOW_SPRITES[p.art % PILLOW_SPRITES.length]} alt="" draggable={false} className="pillow-drop pointer-events-none h-full w-full object-contain [image-rendering:pixelated] drop-shadow-[0_2px_1px_rgba(0,0,0,0.5)]" style={{ opacity: flicker ? 0.15 : Math.max(0.2, fade) }}/>
    </button>;
  })}</>;
}
