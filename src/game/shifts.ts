/**
 * Story-based shift titles.
 *
 * Each shift/level can carry a small story title + one-line lead-in that hints
 * at the gameplay of that shift. Add or edit entries below — anything without
 * an entry falls back to a generated title, so new levels never break.
 */

export type ShiftTitle = {
  /** funny story title for this shift */
  title: string;
  /** one-line lead-in shown under the title in the briefing */
  lead: string;
};

export const SHIFT_TITLES: Record<number, ShiftTitle> = {
  1: {
    title: "The Very First Bleep",
    lead: "Badge on backwards, pen already stolen. Four beds, gentle chaos.",
  },
  2: {
    title: "Someone Has Hidden The Remote",
    lead: "A quiet bay, mostly bells. Mostly.",
  },
  3: {
    title: "Jelly Wars: Red vs Orange",
    lead: "The kitchen sent orange. The ward wanted red. You are the diplomat.",
  },
  4: {
    title: "The Pump That Would Not Stop",
    lead: "One beep starts it. By midnight it's a choir.",
  },
  5: {
    title: "Bay 3 Has Opinions",
    lead: "Bells everywhere and a curtain gap nobody can forgive.",
  },
  6: {
    title: "Two Nurses Short And Counting",
    lead: "Staffing rang. Staffing hung up. Good luck.",
  },
  7: {
    title: "Full House, No Trolleys",
    lead: "Every bed taken, every alarm confident.",
  },
  8: {
    title: "Winter Pressures Say Hello",
    lead: "Corridor cold, ward hot, everyone poorly at once.",
  },
  9: {
    title: "The Night Everything Beeped",
    lead: "The machines have formed a band. You are not in it.",
  },
  10: {
    title: "Ward Legend Or Bust",
    lead: "Last shift on this ward. Make the handover legendary.",
  },
};

export function shiftTitle(level: number): ShiftTitle {
  return (
    SHIFT_TITLES[level] ?? {
      title: `Another One Of Those Shifts`,
      lead: "Nobody warned you. Nobody ever does.",
    }
  );
}
