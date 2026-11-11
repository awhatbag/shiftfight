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
  /** Neil pauses this long (random between min and max) between glides */
  bossPauseMinMs: 500,
  bossPauseMaxMs: 1600,

  /* ---------------- damage (used by later stages) ---------------- */
  damage: {
    nurseProjectile: 1,
    gooseAbility: 10,
    pen: 1,
    roster: 5,
    clockInOut: 5,
    bed: 10,
  },
  /** after taking damage the nurse can't be hurt again for this long */
  invulnerabilityMs: 1200,

  /* ---------------- nurse ammunition (used by later stages) ---------------- */
  nurseAmmoCapacity: 20,
  nurseFireIntervalMs: 800,
  restockMs: 1000,

  /* ---------------- Neil's attacks (used by later stages) ---------------- */
  /** time between attacks and the on-screen warning before each one lands */
  bossAttacks: {
    pen: { intervalMs: 2200, warningMs: 500 },
    roster: { intervalMs: 5000, warningMs: 900 },
    clockInOut: { intervalMs: 7000, warningMs: 1000 },
    bed: { intervalMs: 9000, warningMs: 1200 },
  },

  /* ---------------- presentation ---------------- */
  /** Neil's chair-glide frame time */
  bossFrameMs: 140,
  /** Neil's turn-around frame time */
  bossTurnFrameMs: 160,
  /** gentle idle bob (fraction of Neil's height) and its cycle length */
  bossIdleBob: 0.012,
  bossIdleBobMs: 1400,
  /** how long Neil laughs after landing a hit */
  bossLaughMs: 1200,
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
} as const;
