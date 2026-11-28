/**
 * SHIFT FIGHT! — BOSS BATTLE CONFIGURATION
 * =========================================
 * Every tunable boss-battle number lives here. Edit values directly (e.g. on
 * GitHub) — nothing else in the codebase duplicates them.
 *
 * Units:
 *  - HP values are whole hit points.
 *  - Speeds are "arena widths per second" (1 = crosses the whole arena in 1s).
 *  - Times are milliseconds.
 *  - Positions are fractions of the arena (0 = left/top, 1 = right/bottom),
 *    measured at a character's feet (bottom-centre).
 */

export const BOSS_BATTLE_CONFIG = {
  /* ---------------- health ---------------- */
  nurseMaxHp: 100,
  bossMaxHp: 100,

  /**
   * Boss phases by remaining health (percent of max).
   * Phase 1: above phase2At (100–61%) · Phase 2: phase3At < hp ≤ phase2At (60–26%)
   * Phase 3: hp ≤ phase3At (25–0%).
   */
  phases: {
    phase2At: 60,
    phase3At: 25,
  },

  /* ---------------- movement ---------------- */
  /** how fast the nurse follows your finger along her lane */
  nurseSpeed: 0.9,
  /** how fast the nurse walks in through the door at the start */
  nurseEntrySpeed: 0.25,
  /** Neil's chair-glide speed */
  bossSpeed: 0.22,
  /** Neil's speed multiplier at 0% HP (scales smoothly up as his health declines) */
  bossMaxSpeedMultiplier: 2.2,
  /** Neil pauses this long (random between min and max) between glides */
  bossPauseMinMs: 500,
  bossPauseMaxMs: 1600,
  /** Minimum fraction of Neil's pause duration at 0% HP (shorter pauses as health declines) */
  bossMinPauseScale: 0.2,
  /** Maximum mid-glide erratic direction-change rate (per second) at 0% HP */
  bossErraticReversalPerSec: 1.5,
  /** Minimum milliseconds between Neil's erratic mid-glide direction changes */
  bossErraticCooldownMs: 350,

  /* ---------------- damage ---------------- */
  damage: {
    /** HP removed from Neil per nurse projectile hit */
    nurseProjectile: 1,
    gooseAbility: 10,
    pen: 1,
    roster: 5,
    clockInOut: 5,
    rejected: 5,
    bed: 10,
  },
  /** after taking damage the nurse can't be hurt again for this long */
  invulnerabilityMs: 1200,

  /* ---------------- nurse ammunition & combat ---------------- */
  /** Maximum number of projectiles the nurse can carry */
  nurseAmmoCapacity: 20,
  /** Milliseconds between automatic nurse throws while ammo remains */
  nurseFireIntervalMs: 800,
  /** Show subtle low-ammo warning when remaining ammo is at or below this number */
  lowAmmoThreshold: 5,
  /** Milliseconds the nurse must stay inside the trolley zone to refill to full */
  restockMs: 1000,
  /** Projectile travel speed in arena widths per second */
  nurseProjectileSpeed: 0.9,
  /** Visual projectile size as a fraction of arena height */
  nurseProjectileSize: 0.065,
  /** Projectile collision box (fractions of arena width and height) */
  nurseProjectileHitbox: { width: 0.06, height: 0.04 },
  /** Forgiving collision hitbox around Neil's visible sprite (fractions of arena width/height, offsetY from bossLaneY) */
  bossHitbox: { width: 0.18, height: 0.13, offsetY: -0.065 },
  /** Trolley restocking zone (fractions of arena width/height); used only after the player taps the trolley */
  restockZone: { minX: 0.02, maxX: 0.34, minY: 0.72, maxY: 0.98 },
  /** Brief throw facing duration when stationary */
  nurseThrowPoseMs: 350,
  /** Independent cooldown after pressing each nurse special button (milliseconds). */
  specialCooldownMs: 5000,

  /* ---------------- Neil's offensive attacks — Stage 3 ---------------- */
  /** Nurse collision body: centered above her feet, in arena fractions. */
  nurseHitbox: { width: 0.065, height: 0.085, offsetY: -0.045 },
  /** Pause NEW attack selection after a phase changes; existing warnings remain valid. */
  phaseTransitionMs: 500,
  /** Random weighted selection; beds are exclusive to Phase 3. Overlap shares one safe corridor. */
  attackPhases: {
    1: { intervalMs: 3000, speedMultiplier: 1, penCount: 3, overlapChance: 0, maxPatterns: 1,
      weights: { pen: 30, clockIn: 20, clockOut: 20, roster: 15, rejected: 15, bed: 0 } },
    2: { intervalMs: 2500, speedMultiplier: 1.18, penCount: 5, overlapChance: 0.25, maxPatterns: 2,
      weights: { pen: 30, clockIn: 20, clockOut: 20, roster: 15, rejected: 15, bed: 0 } },
    3: { intervalMs: 2000, speedMultiplier: 1.35, penCount: 7, overlapChance: 0.45, maxPatterns: 2,
      weights: { pen: 25, clockIn: 15, clockOut: 15, roster: 15, rejected: 10, bed: 20 } },
  },
  /** Safe gap exceeds the nurse body; all concurrent lane patterns use the SAME gap. */
  attackSafeGapWidth: 0.25,
  /** A new safe corridor shifts left/right by this distance, still reachable within the warning. */
  attackGapShift: 0.18,
  /** Spawn attacks this far below Neil's feet. */
  attackSpawnOffsetY: 0.06,
  /** Bounds and pool limits prevent lingering attack sprites from accumulating. */
  attackMaxPatterns: 2,
  attackExitMargin: 0.15,
  bossAttacks: {
    /** Speeds in arena widths/second; hitboxes and sizes in arena fractions. */
    pen: { warningMs: 600, speed: 0.8, staggerMs: 130, spinDegPerSec: 720,
      width: 0.055, height: 0.035, visualWidth: 0.085 },
    clockIn: { warningMs: 1000, speed: 0.85, waves: 2, waveGapMs: 500,
      width: 0.105, height: 0.085, visualWidth: 0.15 },
    /** The marker follows for trackMs, then freezes; warningMs is the full telegraph duration. */
    clockOut: { warningMs: 1200, trackMs: 400, fallMs: 450, impactMs: 220,
      width: 0.19, height: 0.11, visualWidth: 0.23 },
    roster: { warningMs: 1200, speed: 0.65, columns: 7,
      width: 0.12, height: 0.07, visualWidth: 0.15 },
    rejected: { warningMs: 1500, trackMs: 400, fallMs: 400, impactMs: 350,
      width: 0.25, height: 0.12, visualWidth: 0.32 },
    bed: { warningMs: 1500, speed: 0.7, waves: 3, waveGapMs: 650, smokeMs: 600,
      width: 0.095, height: 0.105, visualWidth: 0.125 },
  },

  /* ---------------- presentation ---------------- */
  /** Counter atlas enlargement by phase (normal, flustered, dishevelled), anchored at the chair wheels. */
  bossPhaseScale: { 1: 1, 2: 0.82, 3: 0.8 },
  /** Extra shrink for Neil's left/right glide frames by phase (their cells are drawn larger than his resting pose). */
  bossPhaseMoveScale: { 1: 0.93, 2: 1, 3: 1 },
  /** Extra shrink for Neil's laughing frames by phase (their cells are drawn larger than his resting pose). */
  bossPhaseLaughScale: { 1: 0.9, 2: 1, 3: 1 },
  /** Extra shrink for Neil's raise-arms and throw-pens frames by phase (normal Neil's pose cells are drawn larger than his resting pose). */
  bossPhasePoseScale: { 1: 0.91, 2: 1, 3: 1 },
  /** Neil's chair-glide frame time */
  bossFrameMs: 140,
  /** Neil's turn-around frame time */
  bossTurnFrameMs: 160,
  /** gentle idle bob (fraction of Neil's height) and its cycle length */
  bossIdleBob: 0.012,
  bossIdleBobMs: 1400,
  /** how long Neil laughs after landing a hit */
  bossLaughMs: 1200,
  /** how long Dev Mode throw-pens pose plays */
  bossPoseMs: 1200,
  /** time per frame when Neil raises or lowers his arms */
  bossRaiseStepMs: 60,
  /** how long Neil holds his arms raised while shaking and glowing red */
  bossRaiseHoldMs: 2000,
  /** door animation frame time */
  doorFrameMs: 70,
} as const;

/**
 * Arena layout for Neil's office (fractions of the supplied 941×1672 artwork).
 * Kept beside the gameplay numbers so the playable lanes are easy to adjust.
 */
export const NEIL_ARENA_LAYOUT = {
  aspect: 941 / 1672,
  /** nurse walks along this lower lane */
  nurseLaneY: 0.84,
  nurseMinX: 0.14,
  nurseMaxX: 0.86,
  /** nurse height as a fraction of arena height */
  nurseHeight: 0.17,
  /** Neil glides along this lane just below his desk */
  bossLaneY: 0.385,
  bossMinX: 0.2,
  bossMaxX: 0.8,
  bossStartX: 0.5,
  /** height of one normal-Neil sprite cell as a fraction of arena height */
  bossCellHeight: 0.125,
  /** bottom door (measured from the "with door" reference artwork) */
  door: { centerX: 0.5, widthFrac: 0.267, bottom: 1.0 },
  /** restock trolley in the bottom-left corner (art is 1222×1259); nurse stops at restockX to refill */
  cart: { left: 0.02, widthFrac: 0.288, bottom: 0.985, restockX: 0.29 },
  /** Off-arena right HUD width, limited for portrait screens. */
  supplies: { widthFrac: 0.18, maxWidthPx: 72 },
} as const;
