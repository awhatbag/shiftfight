import type { EventDef } from "./config";
import type { AvocadoTally, CatastropheOutcome } from "./avocado";

/** The Great Pillow Shortage: 40 pillow complaints. FETCH is always the real
 * fix — search the ward for a pillow, or hand over the one being carried. */
const complaints: [string, string, string][] = [
  ["PILLOW: MISSING", "Where's my pillow?!", "The patient's pillow has vanished from the bed."],
  ["PILLOW DEFICIT", "I've only got THREE pillows!", "A seasoned patient insists four is the legal minimum."],
  ["NECK ANGLE ALERT", "My neck is at a funny angle!", "Without a pillow the patient's neck is badly unsupported."],
  ["PILLOW THEFT", "Someone's stolen my pillow!", "The pillow was there at lunch. It is not there now."],
  ["FLUFF STANDARDS", "I specifically requested a FLUFFY pillow!", "The patient has rejected the current flat situation."],
  ["BUDGET CUTS", "Administration took my pillow!", "A memo has replaced the pillow. It is not comfortable."],
  ["SLEEP STRIKE", "I'm not sleeping without another pillow!", "The patient is refusing rest until pillow numbers improve."],
  ["HEAD ON MATTRESS", "My head is touching the actual bed!", "The patient is lying completely flat and unhappy about it."],
  ["PILLOW AUDIT", "I counted. I am one pillow short.", "The patient has been keeping a pillow ledger."],
  ["FOLDED BLANKET", "This is a blanket pretending to be a pillow!", "Someone improvised. The patient has noticed."],
  ["PILLOW GHOST", "My pillow just disappeared into thin air!", "The patient swears the pillow was there seconds ago."],
  ["PILLOW ENVY", "Bed four has TWO pillows. Why?", "Inter-bay pillow inequality has been detected."],
  ["BACK SUPPORT", "My back needs propping up!", "The patient needs a pillow behind them to sit up."],
  ["PILLOW REVIEW", "One star. No pillow.", "The patient is drafting a very harsh online review."],
  ["COAT AS PILLOW", "I'm using my coat as a pillow!", "The coat has buttons. The buttons are winning."],
  ["PILLOW HOSTAGE", "Who has my pillow? I want it back!", "The patient believes their pillow is being held for ransom."],
  ["CHIN TO CHEST", "I can see my own feet. Too well.", "Too few pillows have left the patient sliding down the bed."],
  ["PILLOW PROTEST", "No pillow, no peace!", "The patient has started a one-person protest."],
  ["SPARE PILLOW", "I need a spare for my knees!", "The patient needs an extra pillow under their legs."],
  ["CRUNCHY PILLOW", "My pillow is made of paperwork!", "Administration replaced the stuffing with invoices."],
  ["PILLOW MEMORY", "I had a pillow this morning. I remember it fondly.", "The patient is grieving their lost pillow."],
  ["ARM REST", "My drip arm needs a pillow to rest on!", "The cannulated arm needs a supporting pillow."],
  ["DOUBLE STACK", "One pillow is NOT a pillow stack!", "The patient insists their head requires elevation."],
  ["PILLOW RUMOUR", "I heard pillows have been cancelled!", "News of the budget cuts has reached the patient."],
  ["PILLOW SWAP", "My neighbour took my pillow while I napped!", "A suspicious extra pillow has appeared next door."],
  ["HARD ROLL", "I'm lying on a rolled-up towel!", "The towel is losing its pillow impression."],
  ["PILLOW LONELY", "My other pillow is lonely without a friend!", "The patient's single pillow apparently needs company."],
  ["SIDE SLEEPER", "I can't lie on my side without a pillow!", "The patient needs a pillow to support side-lying."],
  ["PILLOW PROMISE", "You PROMISED me a pillow yesterday!", "Nobody remembers this promise, but the patient does."],
  ["DREAM DENIED", "How can I dream without a pillow?!", "The patient's dream schedule has been disrupted."],
  ["PILLOW FORT", "My pillow fort has collapsed!", "A load-bearing pillow has gone missing."],
  ["COST SAVINGS", "Was my pillow sold for budget savings?", "The patient suspects a pillow auction."],
  ["PILLOW SHORTFALL", "My visitor sat on my last pillow and took it home!", "The pillow has been discharged without a doctor's note."],
  ["FLAT AS A PANCAKE", "My pillow has gone flat as a pancake!", "The remaining pillow has lost all structural integrity."],
  ["PILLOW SIGN", "There's a sign saying 'BYO pillow'!", "Administration has updated the ward signage."],
  ["CRICK IN NECK", "I've got a crick and no pillow to blame!", "The patient needs neck support urgently."],
  ["PILLOW WAITLIST", "I've been on the pillow waitlist for an hour!", "The patient is number 47 on the pillow list."],
  ["PILLOWCASE ONLY", "I've got a pillowcase but no PILLOW!", "Someone took the pillow and left the case."],
  ["VIP PILLOW", "I demand the premium pillow experience!", "The patient will accept any pillow at this point."],
  ["PILLOW SOS", "Pillow! Pillow! Anyone! Pillow!", "The patient has escalated to shouting the word 'pillow'."],
];

export const PILLOW_SEARCH_TEXT = "Search the ward for a pillow";
export const PILLOW_GIVE_TEXT = "Give them the pillow you're carrying";

export const PILLOW_EVENTS: EventDef[] = complaints.map(([label, callLine, brief], i) => ({
  key: `pillow-${i + 1}`,
  label,
  icon: "🛏️",
  severity: 1,
  ttl: 22_000,
  correct: "FETCH",
  callBell: true,
  callLine,
  brief,
  options: {
    FETCH: PILLOW_SEARCH_TEXT,
    REASSURE: "Offer a folded towel instead",
    ADJUST: "Fluff their hair and call it a pillow",
  },
  win: "Pillow delivered. Administration is furious.",
  fail: "Another pillow complaint has been filed.",
}));

export const isPillowEvent = (e: EventDef) => e.key.startsWith("pillow-");

/** proportion of pillow requests actually fulfilled */
export function gradePillows(t: AvocadoTally): CatastropheOutcome {
  if (!t.generated) return "negative";
  const ratio = t.best / t.generated;
  if (ratio >= 0.55) return "positive";
  if (ratio >= 0.25) return "neutral";
  return "negative";
}

export function pillowConclusion(outcome: CatastropheOutcome) {
  if (outcome === "positive") return { title: "Pillows restored", line: "Excellent work! Patient satisfaction is up, and Administration hasn't spent a cent!" };
  if (outcome === "neutral") return { title: "Partially pillowed", line: "Some patients got pillows. Others got a folded towel. Apparently that's acceptable now." };
  return { title: "Pillow complaints everywhere", line: "TWELVE PILLOW COMPLAINTS! Administration wants to know why you couldn't just improvise!" };
}
