import { useEffect, useState } from "react";
import { getMusicVolume, setMusicVolume, subscribeMusicVolume } from "@/lib/music";

/** Music volume slider shared by the main menu and in-shift settings. */
export function MusicVolumeSlider() {
  const [vol, setVol] = useState(1);
  useEffect(() => {
    setVol(getMusicVolume());
    const unsub = subscribeMusicVolume(setVol);
    return () => {
      unsub();
    };
  }, []);
  return (
    <label className="flex w-full items-center gap-3 rounded-2xl bg-secondary px-3 py-2 font-display text-sm font-black uppercase text-secondary-foreground">
      <span className="shrink-0">🎵 Volume</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(vol * 100)}
        onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
        aria-label="Music volume"
        className="h-3 min-w-0 flex-1 cursor-pointer accent-primary"
      />
      <span className="w-10 shrink-0 text-right">{Math.round(vol * 100)}%</span>
    </label>
  );
}
