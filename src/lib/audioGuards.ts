/** Keep invalid browser settings out of audio APIs. */
export function clampAudioVolume(value: number, fallback = 1): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

/** A bounded pool owns cleanup even when playback fails or is interrupted. */
export class AudioPool {
  private entries = new Set<() => void>();
  constructor(readonly limit: number) {}
  get size() { return this.entries.size; }
  add(cleanup: () => void): () => void {
    while (this.entries.size >= this.limit) {
      const oldest = this.entries.values().next().value;
      if (!oldest) break;
      oldest();
    }
    const release = () => {
      if (!this.entries.delete(release)) return;
      try { cleanup(); } catch { /* audio support varies by browser */ }
    };
    this.entries.add(release);
    return release;
  }
  clear() { for (const release of [...this.entries]) release(); }
}