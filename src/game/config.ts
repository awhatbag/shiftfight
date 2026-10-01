import type { Effects } from "./gear";

export type ActionKind =
  | "ASSESS"
  | "INTERVENE"
  | "ESCALATE"
  | "FETCH"
  | "ADJUST"
  | "ASSIST"
  | "REASSURE"
  | "RESPOND";

export type EventDef = {
  key: string;
  label: string;
  icon: string;
  /** 1 = chill, 3 = spicy */
  severity: 1 | 2 | 3;
  correct: ActionKind;
  ttl: number; // ms before it goes bad
  callBell?: boolean;
  /** optional words heard over the bell before the nurse assesses */
  callLine?: string;
  /** one-line situation read-out shown when the bed is selected */
  brief: string;
  /** the 3 buttons offered for this event + "what this does here" copy */
  options: Partial<Record<ActionKind, string>>;
  win: string;
  fail: string;
};

export const ACTION_META: Record<
  ActionKind,
  { icon: string; tag: string; color: string }
> = {
  ASSESS: { icon: "👀", tag: "Look, ask, reassure", color: "bg-primary text-primary-foreground" },
  INTERVENE: { icon: "💪", tag: "Hands-on fix, right now", color: "bg-calm text-calm-foreground" },
  ESCALATE: { icon: "📟", tag: "Bleep the team, fast", color: "bg-alarm text-alarm-foreground" },
  FETCH: { icon: "🏃", tag: "Go get the thing", color: "bg-gold text-gold-foreground" },
  ADJUST: { icon: "🔧", tag: "Nudge it into place", color: "bg-secondary text-secondary-foreground" },
  ASSIST: { icon: "🤝", tag: "Lend a hand", color: "bg-accent text-accent-foreground" },
  REASSURE: { icon: "💬", tag: "Kind words, calm voice", color: "bg-primary text-primary-foreground" },
  RESPOND: { icon: "🛎️", tag: "Answer the bell", color: "bg-gold text-gold-foreground" },
};


export const EVENTS: EventDef[] = [
  /* ---------- critical ---------- */
  {
    key: "sats",
    label: "SATS DIPPING",
    icon: "🫁",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Oxygen numbers sliding. This is bigger than you.",
    options: {
      ASSESS: "Stare at the monitor hopefully",
      INTERVENE: "Fiddle with the mask alone",
      ESCALATE: "Fast bleep the medical team",
    },
    win: "Team at the bedside. Sats climbing!",
    fail: "Machine goes beep-boop-sad.",
  },
  {
    key: "bleed",
    label: "POST-OP OOZE",
    icon: "🩸",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Dressing is soaking through. Surgeon problem.",
    options: {
      ASSESS: "Peek and hope it stops",
      ADJUST: "Add yet another dressing",
      ESCALATE: "Page the surgical reg NOW",
    },
    win: "Surgeon paged. Legend.",
    fail: "The linen budget weeps.",
  },
  {
    key: "wobble",
    label: "BIG WOBBLE",
    icon: "😵‍💫",
    severity: 3,
    correct: "ASSIST",
    ttl: 11000,
    brief: "Standing up, going grey, about to hit the deck.",
    options: {
      ASSIST: "Catch them, ease them down safely",
      REASSURE: "Say 'ooh careful' from afar",
      FETCH: "Go find a chair. Slowly.",
    },
    win: "Safely down. No thud.",
    fail: "Incident form incoming.",
  },
  {
    key: "monitor",
    label: "MONITOR MELTDOWN",
    icon: "📉",
    severity: 3,
    correct: "ESCALATE",
    ttl: 11500,
    brief: "Numbers doing something dramatic. Get help.",
    options: {
      ADJUST: "Reposition the finger probe",
      ASSESS: "Squint at the numbers",
      ESCALATE: "Pull the team in now",
    },
    win: "Whole team arrives. Sorted.",
    fail: "Everything beeps at once.",
  },

  /* ---------- urgent ---------- */
  {
    key: "pump",
    label: "IV PUMP SCREAMING",
    icon: "🔔",
    severity: 2,
    correct: "ADJUST",
    ttl: 14000,
    brief: "Kinked line. Fixable in ten seconds.",
    options: {
      ASSESS: "Watch it scream at you",
      ADJUST: "Unkink the line, restart pump",
      ESCALATE: "Bleep a doctor about a beep",
    },
    win: "Line unkinked. Blessed silence!",
    fail: "Beeping achieves sentience.",
  },
  {
    key: "nausea",
    label: "QUEASY",
    icon: "🤢",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Green around the gills. Bowl and anti-sick.",
    options: {
      REASSURE: "Ask how green they feel",
      INTERVENE: "Bowl, water, anti-sick",
      ESCALATE: "Crash call for a burp",
    },
    win: "Anti-sick given. Crisis dodged.",
    fail: "Mop. So much mop.",
  },
  {
    key: "pain",
    label: "OUCH SCALE 8",
    icon: "😖",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14000,
    brief: "Pain is climbing. They need comfort, not chat.",
    options: {
      ASSESS: "Ask about it. Again.",
      INTERVENE: "Reposition + pain relief",
      ESCALATE: "Wake up the whole hospital",
    },
    win: "Comfort restored.",
    fail: "Patient invents new swear.",
  },
  {
    key: "confused",
    label: "WANDERING",
    icon: "🌀",
    severity: 2,
    correct: "REASSURE",
    ttl: 14000,
    brief: "Muddled and heading for the door. Talk first.",
    options: {
      REASSURE: "Orient, reassure, walk them back",
      INTERVENE: "Grab them. Rude.",
      ESCALATE: "Bleep before you've even looked",
    },
    win: "Gently redirected. Nice.",
    fail: "They found the fire exit.",
  },
  {
    key: "slipping",
    label: "SLIDING DOWN THE BED",
    icon: "🛏️",
    severity: 2,
    correct: "ADJUST",
    ttl: 15000,
    brief: "Slowly becoming horizontal jelly.",
    options: {
      ADJUST: "Sit them back up properly",
      FETCH: "Get another pillow first",
      ESCALATE: "Bleep about gravity",
    },
    win: "Upright and dignified.",
    fail: "Fully melted into the mattress.",
  },
  {
    key: "drip",
    label: "DRIP RUN DRY",
    icon: "💧",
    severity: 2,
    correct: "FETCH",
    ttl: 15000,
    brief: "Bag's empty and the pump knows it.",
    options: {
      FETCH: "Grab a fresh bag from the store",
      ASSESS: "Watch the last drop fall",
      REASSURE: "Tell it everything's fine",
    },
    win: "New bag up. Pump content.",
    fail: "Alarm choir, full volume.",
  },

  /* ---------- routine / silly ---------- */
  {
    key: "blanket",
    label: "CALL BELL: BLANKET",
    icon: "🛎️",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "Bell ringing. It's a blanket. Probably.",
    options: {
      RESPOND: "Answer the bell, fetch a warm one",
      INTERVENE: "Deploy medical equipment. For a blanket.",
      ESCALATE: "Bleep the consultant. For a blanket.",
    },
    win: "Toasty. Five stars.",
    fail: "Bell rings into the void.",
  },
  {
    key: "tea",
    label: "CALL BELL: TV REMOTE",
    icon: "📺",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "Bell again. The remote has vanished.",
    options: {
      FETCH: "Dig it out from under the pillow",
      ADJUST: "Rearrange the pillows instead",
      ESCALATE: "Escalate a television emergency",
    },
    win: "Remote located under pillow.",
    fail: "Wrong channel forever.",
  },
  {
    key: "phone",
    label: "CALL BELL: PHONE TOO FAR",
    icon: "📱",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "Phone is 30cm away. Devastating.",
    options: {
      FETCH: "Slide the phone within reach",
      REASSURE: "Explain the concept of arms",
      ESCALATE: "Bleep the reg about a phone",
    },
    win: "Reunited. Emotional scenes.",
    fail: "Phone rang. Nobody won.",
  },
  {
    key: "spoon",
    label: "CALL BELL: SPOON HELP",
    icon: "🥄",
    severity: 1,
    correct: "ASSIST",
    ttl: 17000,
    callBell: true,
    brief: "The jelly is winning. They need a hand.",
    options: {
      ASSIST: "Steady the spoon, save the jelly",
      FETCH: "Fetch a bigger spoon",
      ESCALATE: "Declare a dessert incident",
    },
    win: "Jelly defeated. Teamwork.",
    fail: "Jelly on the ceiling.",
  },
  {
    key: "feet",
    label: "CALL BELL: FOOT MASSAGE",
    icon: "🦶",
    severity: 1,
    correct: "REASSURE",
    ttl: 17000,
    callBell: true,
    brief: "Requesting a full spa treatment. Politely decline.",
    options: {
      REASSURE: "Kindly explain this is not a spa",
      INTERVENE: "Actually do it. Forty minutes gone.",
      FETCH: "Fetch cucumber slices",
    },
    win: "Declined charmingly. Still friends.",
    fail: "You are now the ward masseuse.",
  },
  {
    key: "pillow",
    label: "CALL BELL: PILLOW GEOMETRY",
    icon: "🪶",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "Pillow is at 34 degrees. They wanted 35.",
    options: {
      ADJUST: "Fluff and angle to specification",
      FETCH: "Fetch four more pillows",
      ESCALATE: "Escalate to pillow management",
    },
    win: "Perfect angle. Chef's kiss.",
    fail: "Pillow now legally a rock.",
  },
  {
    key: "curtain",
    label: "CALL BELL: CURTAIN DRAMA",
    icon: "🪟",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "Curtain 4cm open. Unacceptable.",
    options: {
      ADJUST: "Slide the curtain the last 4cm",
      REASSURE: "Say it looks closed to you",
      FETCH: "Fetch a second curtain",
    },
    win: "Privacy restored. Five stars.",
    fail: "The whole bay saw everything.",
  },
  {
    key: "water",
    label: "CALL BELL: WATER JUG",
    icon: "🥤",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "Jug empty. Ice specifically requested.",
    options: {
      FETCH: "Refill with ice, obviously",
      ADJUST: "Move the empty jug closer",
      ESCALATE: "Bleep someone about ice",
    },
    win: "Ice acquired. Legend status.",
    fail: "Jug remains tragically dry.",
  },
  {
    key: "chat",
    label: "CALL BELL: JUST A CHAT",
    icon: "💬",
    severity: 1,
    correct: "REASSURE",
    ttl: 17000,
    callBell: true,
    brief: "No problem at all. They're just a bit bored.",
    options: {
      REASSURE: "Two minutes of proper chat",
      FETCH: "Fetch a magazine from 2011",
      ESCALATE: "Bleep the team about boredom",
    },
    win: "Cheered right up. Worth it.",
    fail: "Bell pressed eleven more times.",
  },
  {
    key: "socks",
    label: "CALL BELL: SOCK CRISIS",
    icon: "🧦",
    severity: 1,
    correct: "ASSIST",
    ttl: 17000,
    callBell: true,
    brief: "One sock has escaped under the bed.",
    options: {
      ASSIST: "Retrieve and reapply the sock",
      REASSURE: "Talk them through sock loss",
      ESCALATE: "Escalate the sock",
    },
    win: "Sock reunited with foot.",
    fail: "Sock is now folklore.",
  },
  {
    key: "wifi",
    label: "CALL BELL: WIFI CRISIS",
    icon: "📶",
    severity: 1,
    correct: "REASSURE",
    ttl: 17000,
    callBell: true,
    brief: "One bar of signal. Bay 3 has three. Injustice.",
    options: {
      REASSURE: "Explain hospital wifi is a myth",
      FETCH: "Fetch a longer, imaginary cable",
      ESCALATE: "Bleep IT about vibes",
    },
    win: "Two bars! Practically broadband.",
    fail: "The video buffers forever.",
  },
  {
    key: "jelly",
    label: "CALL BELL: WRONG JELLY",
    icon: "🍮",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "They got orange. They are, and always were, a red jelly person.",
    options: {
      FETCH: "Hunt the kitchen for red jelly",
      REASSURE: "Argue orange is basically red",
      ADJUST: "Stir it until it changes colour",
    },
    win: "Red jelly delivered. Hero.",
    fail: "Orange jelly consumed under protest.",
  },
  {
    key: "snorer",
    label: "CALL BELL: NEIGHBOUR SNORING",
    icon: "😴",
    severity: 1,
    correct: "REASSURE",
    ttl: 17000,
    callBell: true,
    brief: "Bay neighbour snoring in a key they dislike.",
    options: {
      REASSURE: "Sympathise, offer earplugs",
      ADJUST: "Gently reposition the snorer",
      ESCALATE: "Bleep a doctor about snoring",
    },
    win: "Earplugs in. Peace, briefly.",
    fail: "The snoring gets a standing ovation.",
  },
  {
    key: "grapes",
    label: "CALL BELL: GRAPE SITUATION",
    icon: "🍇",
    severity: 1,
    correct: "ASSIST",
    ttl: 17000,
    callBell: true,
    brief: "Grapes are on the table. Table is two inches too far.",
    options: {
      ASSIST: "Slide the table, hand over grapes",
      FETCH: "Fetch entirely different grapes",
      REASSURE: "Describe the grapes to them",
    },
    win: "Grape access achieved.",
    fail: "The grapes remain tantalisingly distant.",
  },

  /* ---------- silly, harmless, judgement-required ---------- */
  {
    key: "telly",
    label: "CALL BELL: TV CHANNEL",
    icon: "📺",
    severity: 1,
    correct: "ASSIST",
    ttl: 17000,
    callBell: true,
    brief: "Wants channel 4. Remote is literally on the pillow.",
    options: {
      ASSIST: "Show them the remote, let them do it",
      FETCH: "Sprint to find a different remote",
      ESCALATE: "Bleep a doctor about the telly",
    },
    win: "They found the buttons themselves. Independence!",
    fail: "Still watching the shopping channel.",
  },
  {
    key: "pillowangle",
    label: "PILLOW AT 43 DEGREES",
    icon: "🛏️",
    severity: 1,
    correct: "ADJUST",
    ttl: 18000,
    brief: "Not 42. Not 44. Forty-three degrees exactly.",
    options: {
      ADJUST: "One confident pillow fluff, job done",
      FETCH: "Go and find a protractor",
      REASSURE: "Explain pillows are not that precise",
    },
    win: "Declared 'perfect'. Do not touch it again.",
    fail: "The pillow saga continues.",
  },
  {
    key: "curtaingap",
    label: "CURTAIN GAP CRISIS",
    icon: "🪟",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "A two-centimetre gap in the curtain. Unbearable.",
    options: {
      ADJUST: "Close the gap. Takes one second.",
      ESCALATE: "Report a curtain emergency",
      ASSESS: "Study the gap thoughtfully",
    },
    win: "Privacy restored. Ward peace holds.",
    fail: "The gap has become a talking point.",
  },
  {
    key: "sockquest",
    label: "SOCK UNDER THE BED",
    icon: "🧦",
    severity: 1,
    correct: "REASSURE",
    ttl: 18000,
    brief: "Wants you to crawl under the bed for one sock. It's the wrong sock.",
    options: {
      REASSURE: "Kindly say it can wait for the morning",
      FETCH: "Get on the floor. Commit to the sock.",
      ESCALATE: "Bleep someone about a sock",
    },
    win: "Sock deferred. Everyone survives.",
    fail: "You are now under a bed.",
  },
  {
    key: "teaorder",
    label: "VERY SPECIFIC TEA",
    icon: "🍵",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "Half a sugar, splash of milk, 'not too hot, not too cold'.",
    options: {
      RESPOND: "Take the order, pass it to the tea round",
      FETCH: "Abandon the ward for one perfect brew",
      ESCALATE: "Escalate the tea to the medical team",
    },
    win: "Tea round notified. Ward still standing.",
    fail: "Tea is cold. Somehow your fault.",
  },
  {
    key: "phonecharger",
    label: "PHONE ON 4%",
    icon: "🔌",
    severity: 1,
    correct: "ASSIST",
    ttl: 17000,
    brief: "Charger is plugged in. At the wall. Behind them.",
    options: {
      ASSIST: "Point out the plug, they can reach it",
      FETCH: "Hunt the ward for a spare charger",
      ASSESS: "Contemplate the battery percentage",
    },
    win: "Charging. Crisis averted with one finger point.",
    fail: "Phone dies. Drama ensues.",
  },
  {
    key: "windowdebate",
    label: "WINDOW WAR",
    icon: "🌬️",
    severity: 1,
    correct: "REASSURE",
    ttl: 18000,
    brief: "Bed 1 wants it open. This one wants it shut. Forever.",
    options: {
      REASSURE: "Broker a truce, blanket instead",
      ADJUST: "Open it fully. Pick a side. Chaos.",
      ESCALATE: "Bleep the team about the window",
    },
    win: "Peace treaty signed. Blanket deployed.",
    fail: "The bay has formed factions.",
  },
  {
    key: "biscuitreview",
    label: "BISCUIT COMPLAINT",
    icon: "🍪",
    severity: 1,
    correct: "REASSURE",
    ttl: 18000,
    callBell: true,
    brief: "Rang the bell to tell you the biscuit was 'fine, I suppose'.",
    options: {
      REASSURE: "Nod warmly, move on, ward needs you",
      FETCH: "Source a superior biscuit",
      ASSESS: "Conduct a full biscuit review",
    },
    win: "Feedback received. Bell reset. Next!",
    fail: "You are now the biscuit ombudsman.",
  },
  {
    key: "slippers",
    label: "SLIPPERS, WRONG FEET",
    icon: "🥿",
    severity: 1,
    correct: "ASSIST",
    ttl: 17000,
    brief: "Slippers are on. Just... swapped. They noticed.",
    options: {
      ASSIST: "Steady them while they swap the slippers",
      FETCH: "Fetch a brand new pair of slippers",
      ESCALATE: "Bleep podiatry immediately",
    },
    win: "Correct feet. Correct slippers. Beautiful.",
    fail: "Shuffling continues, incorrectly.",
  },
  {
    key: "crossword",
    label: "CROSSWORD, SEVEN DOWN",
    icon: "📰",
    severity: 1,
    correct: "REASSURE",
    ttl: 18000,
    callBell: true,
    brief: "Bell rung for help with a crossword clue. It's 'OTTER'.",
    options: {
      REASSURE: "Give one clue, promise to check back",
      ASSIST: "Sit down and finish the whole crossword",
      ESCALATE: "Escalate seven down to the consultant",
    },
    win: "One clue given. Dignity intact.",
    fail: "You lost eleven minutes to seven down.",
  },

  /* ---------- critical batch 2: clinical satire ---------- */
  {
    key: "clot",
    label: "CLOT ON THE RUN",
    icon: "🫀",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Deep vein thrombosis making a break for it. It's an absolute blood rush.",
    options: {
      ESCALATE: "Fast-page the medical reg and prep heparin",
      INTERVENE: "Massage the calf vigorously",
      ASSESS: "Ask the clot if it intends to settle down",
    },
    win: "Anticoagulated! The clot has been grounded.",
    fail: "The clot took a scenic tour of the pulmonary circuit.",
  },
  {
    key: "asthma",
    label: "ASTHMA-GEDDON",
    icon: "🫁",
    severity: 3,
    correct: "ESCALATE",
    ttl: 11500,
    brief: "Wheezing at decibels previously known only to jazz clarinets. Silent chest imminent.",
    options: {
      ESCALATE: "Emergency nebuliser and 2222 medical bleep",
      REASSURE: "Advise the patient to try breathing slower",
      ADJUST: "Open the bedside window for fresh air",
    },
    win: "Airway open. The clarinet is back in its case.",
    fail: "No air entry. The DON has questions.",
  },
  {
    key: "shock",
    label: "SHOCK AND AWE",
    icon: "📉",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Blood pressure dropping faster than morale on a Sunday night shift.",
    options: {
      ESCALATE: "Sepsis Six protocol: cultures, fluids, call the team",
      FETCH: "Bring an extra cup of warm tea",
      INTERVENE: "Tip the bed head down and hope gravity sorts it",
    },
    win: "Fluids running wide open. Pressure recovering.",
    fail: "Pressure hit rock bottom and set up camp.",
  },
  {
    key: "arrest",
    label: "CARDIAC ARREST-ED DEVELOPMENT",
    icon: "⚡",
    severity: 3,
    correct: "ESCALATE",
    ttl: 11000,
    brief: "Monitor went from rhythm to modern art. Ventricular tachycardia.",
    options: {
      ESCALATE: "Hit the red crash buzzer and summon the crash team",
      ASSESS: "Turn the monitor off and on again to verify",
      ADJUST: "Straighten the lead cables",
    },
    win: "Crash team arrives in fourteen seconds flat. Rhythm restored.",
    fail: "You waited for the monitor to finish its solo.",
  },
  {
    key: "hypogly",
    label: "HYPO-GLY-SEE-YA",
    icon: "🍬",
    severity: 3,
    correct: "INTERVENE",
    ttl: 12000,
    brief: "Blood sugar reading is 1.2. The patient is running on pure willpower and confusion.",
    options: {
      INTERVENE: "Push fast-acting glucose juice, stat",
      FETCH: "Check the canteen for a fun-size chocolate bar",
      REASSURE: "Tell them to think sweet thoughts",
    },
    win: "Glucose climbing. Brain cells rebooting.",
    fail: "Profound hypo. The DON's clipboard trembles.",
  },
  {
    key: "anaphylaxis",
    label: "ANAPHY-LAUGHS-IS",
    icon: "🥜",
    severity: 3,
    correct: "ESCALATE",
    ttl: 11000,
    brief: "Lips inflating like party balloons after dinner. Stridor detected.",
    options: {
      ESCALATE: "IM adrenaline in the outer thigh and call for backup",
      ASSIST: "Hand them an ice lolly to cool down",
      FETCH: "Look for the allergen menu in the kitchen",
    },
    win: "Adrenaline deployed! Swelling retreating.",
    fail: "Airway compromised. Incident report incoming.",
  },
  {
    key: "rigors",
    label: "RIGOR MORT-ISH",
    icon: "🥶",
    severity: 3,
    correct: "ESCALATE",
    ttl: 12000,
    brief: "Bed violently shaking from full-body rigors. Temperature spiking.",
    options: {
      ESCALATE: "Blood cultures, antipyretics, urgent review",
      ADJUST: "Pile three weighted blankets on top",
      REASSURE: "Compliment their breakdancing impression",
    },
    win: "Fever intercepted before the bacteria ran wild.",
    fail: "The temp chart now resembles a mountain range.",
  },
  {
    key: "codebrown",
    label: "CODE BROWN EXPLOSION",
    icon: "☣️",
    severity: 3,
    correct: "ESCALATE",
    ttl: 11500,
    brief: "A gastrointestinal event of tectonic proportions. The barrier seal has ruptured.",
    options: {
      ESCALATE: "Full biohazard isolation and infection control protocol",
      RESPOND: "Try to mop it up with one blue paper towel",
      FETCH: "Bring air freshener and open a window",
    },
    win: "Isolation zone established. Ward dignity salvaged.",
    fail: "Contamination radius: the entire corridor.",
  },

  /* ---------- urgent batch: cartoon emergencies, demoted to severity 2 ---------- */
  {
    key: "bedmotor",
    label: "BED MOTOR RUNAWAY",
    icon: "🚀",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14000,
    brief: "The electric profiling motor is stuck on 'Launch'. Patient is folding into an origami swan.",
    options: {
      INTERVENE: "Pull the emergency power cord from the wall",
      ADJUST: "Press the 'Gentle Massage' button to counteract it",
      REASSURE: "Tell the patient the view near the ceiling is lovely",
    },
    win: "Power pulled! Patient unfolded with only mild dizziness.",
    fail: "Bed reached 85 degrees vertical. Patient launched into the curtain rail.",
  },
  {
    key: "caster",
    label: "RUNAWAY CASTER DRIFT",
    icon: "🛞",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Brakes failed on freshly waxed linoleum! The bed is ghosting down the corridor at 4 mph.",
    options: {
      INTERVENE: "Sprint, throw body weight across the footboard, stomp the brake",
      ASSIST: "Jog alongside offering the patient travel snacks",
      ESCALATE: "Bleep air traffic control to clear the corridor",
    },
    win: "Brakes engaged inches before the linen trolley pileup!",
    fail: "The bed made it all the way to the staff canteen.",
  },
  {
    key: "cuff",
    label: "BP CUFF HYDRAULICS",
    icon: "🦾",
    severity: 2,
    correct: "ADJUST",
    ttl: 14500,
    brief: "The automatic pump went rogue. It is trying to squeeze diamonds out of the patient's arm.",
    options: {
      ADJUST: "Rip the velcro seal open and dump the pneumatic valve",
      ASSESS: "Wait to see if the machine sets a new high score",
      ESCALATE: "Fast-bleep biomedical engineering while the arm turns purple",
    },
    win: "Cuff popped! Arm circulation liberated.",
    fail: "The machine recorded a systolic of 9,000.",
  },
  {
    key: "flatline",
    label: "THE FLATLINE DISCO",
    icon: "🕺",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14000,
    brief: "Monitor leads tangled into the mattress springs. The rhythm is playing funky salsa.",
    options: {
      INTERVENE: "Untangle the leads and stick the patches back on skin",
      RESPOND: "Dim the lights and break into an interpretive dance",
      ASSESS: "Check if the rhythm is radio-friendly",
    },
    win: "Normal rhythm restored. The disco is cancelled.",
    fail: "The entire ward started clapping on the two and four.",
  },
  {
    key: "polevault",
    label: "POLE VAULT SALINE",
    icon: "🏒",
    severity: 2,
    correct: "ADJUST",
    ttl: 14500,
    brief: "IV pole caught in the curtain rail and is bending into a slingshot.",
    options: {
      ADJUST: "Free the pole from the curtain rail before it snaps",
      ESCALATE: "Bleep portering about airborne fluids",
      INTERVENE: "Push the pole flat and limbo underneath it",
    },
    win: "Pole freed. Fluids remain earthbound.",
    fail: "The saline bag achieved a brief orbit.",
  },
  {
    key: "squeakywheel",
    label: "SQUEAKY WHEEL SIREN",
    icon: "🔔",
    severity: 2,
    correct: "ADJUST",
    ttl: 15000,
    brief: "Linen trolley caster squealing at a frequency that summons ward sisters from three bays away.",
    options: {
      ADJUST: "One drop of oil on the offending caster",
      RESPOND: "Apologise to the bay and promise earplugs",
      ESCALATE: "Bleep maintenance for a full trolley autopsy",
    },
    win: "Silence restored. Half the bay back to sleep.",
    fail: "The squeak has recruited a chorus.",
  },
  {
    key: "jellytsunami",
    label: "THE JELLY TSUNAMI",
    icon: "🍧",
    severity: 2,
    correct: "ASSIST",
    ttl: 14000,
    brief: "Dietary trolley dropped forty portions of red dessert on the threshold.",
    options: {
      ASSIST: "Station a mop bucket and direct dessert traffic",
      FETCH: "Fetch every towel in the sluice room",
      INTERVENE: "Attempt to eat the evidence",
    },
    win: "Corridor saved. One casualty: your shoes.",
    fail: "The bay floor is now ninety percent jelly.",
  },
  {
    key: "sahara",
    label: "THERMOSTAT SAHARA",
    icon: "🌋",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Radiator knob snapped off in the 'Furnace' position. This bay has its own micro-climate.",
    options: {
      INTERVENE: "Turn the sub-floor water valve with the emergency spanner",
      FETCH: "Hand out miniature beach umbrellas and cold cordial",
      REASSURE: "Explain sweat is the body's natural sprinkler",
    },
    win: "Steam suppressed! The ward is habitable again.",
    fail: "Patients began applying factor 50 to their pillows.",
  },

  /* ---------- urgent batch 2: bedside tangles ---------- */
  {
    key: "vein",
    label: "VEIN PURSUIT",
    icon: "💉",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14000,
    brief: "Cannula tissued! The forearm is inflating like a party balloon.",
    options: {
      INTERVENE: "Stop the infusion, withdraw the cannula, apply pressure",
      ADJUST: "Flush ten millilitres of saline to clear the line",
      REASSURE: "Tell them everyone's arms swell on Tuesdays",
    },
    win: "Infusion halted. Arm safely deflated.",
    fail: "A subcutaneous saline puddle has been created.",
  },
  {
    key: "catheter",
    label: "CATHETER CLOG-DANCING",
    icon: "🚰",
    severity: 2,
    correct: "ADJUST",
    ttl: 15000,
    brief: "Urine bag is bone dry, but the patient's bladder is ready for Niagara Falls.",
    options: {
      ADJUST: "Check for tube kinks and flush the catheter",
      FETCH: "Hand them another two-litre jug of water",
      ESCALATE: "Bleep urology to re-plumb the whole patient",
    },
    win: "Kink resolved. The golden river flows once more.",
    fail: "Bladder retention critical. Urgent scan needed.",
  },
  {
    key: "cast",
    label: "CAST AWAY",
    icon: "🩼",
    severity: 2,
    correct: "INTERVENE",
    ttl: 15000,
    brief: "Patient smuggled a metal coat hanger down their leg plaster to scratch an itch.",
    options: {
      INTERVENE: "Confiscate the hanger and inspect the skin underneath",
      ASSIST: "Help them reach the itch with a regulation ruler",
      FETCH: "Fetch antihistamines and check for pressure sores",
    },
    win: "Hanger retrieved intact. Skin spared.",
    fail: "The plaster cast is now a cutlery drawer.",
  },
  {
    key: "drain",
    label: "DRAIN SPOTTING",
    icon: "🫙",
    severity: 2,
    correct: "ADJUST",
    ttl: 14500,
    brief: "Surgical wound drain vacuum lost. The canister is wheezing like an accordion.",
    options: {
      ADJUST: "Re-prime the vacuum and check the bottle seal",
      INTERVENE: "Pull the drain tube slightly to test tension",
      RESPOND: "Empty it onto a dressing pad",
    },
    win: "Vacuum seal re-established with a satisfying pop.",
    fail: "Fluid pooling under the wound flap.",
  },
  {
    key: "dizzy",
    label: "DIZZY RASCAL",
    icon: "💫",
    severity: 2,
    correct: "ASSIST",
    ttl: 14000,
    brief: "First walk after theatre turned into an impromptu drunken waltz.",
    options: {
      ASSIST: "Guide them straight back into bed and elevate the feet",
      REASSURE: "Encourage them to push through and try jogging",
      FETCH: "Fetch a walking frame while they sway in mid-air",
    },
    win: "Safely back on the mattress before gravity intervened.",
    fail: "Patient met floor. Datix form inevitable.",
  },
  {
    key: "phlebitis",
    label: "PHLEBITIS PHRENZY",
    icon: "🔥",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Cannula site is hot, hard, and redder than a sports car.",
    options: {
      INTERVENE: "Remove the cannula, elevate the limb, warm compress",
      ADJUST: "Dial up the flow rate to flush the heat away",
      FETCH: "Cover it with a cold flannel and leave it in",
    },
    win: "Vein report filed. Phlebitis contained.",
    fail: "Angry red lines now track up to the shoulder.",
  },
  {
    key: "gauze",
    label: "GAUZE AND EFFECT",
    icon: "🩹",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Surgical wound oozing mystery fluids. The dressing is flapping like a sail.",
    options: {
      INTERVENE: "Aseptic dressing change and a wound swab",
      ADJUST: "Slap a strip of tape over the soggy bit",
      FETCH: "Grab fresh towels from the linen bay",
    },
    win: "Sterile dressing applied. Infection denied.",
    fail: "The dressing fell off into the evening soup.",
  },
  {
    key: "escape",
    label: "THE GREAT ESCAPE",
    icon: "🧓",
    severity: 2,
    correct: "ASSIST",
    ttl: 15000,
    brief: "Muddled resident found in the lift wearing two hats and no trousers.",
    options: {
      ASSIST: "Gentle diversion, hot chocolate, guide them back to the bay",
      ESCALATE: "Trigger the building security lockdown",
      INTERVENE: "Physically tackle the runaway hats",
    },
    win: "Navigated back to bed safely with a cuppa in hand.",
    fail: "Patient made it to the staff car park.",
  },
  {
    key: "medvacay",
    label: "MEDICATION VACATION",
    icon: "💊",
    severity: 2,
    correct: "REASSURE",
    ttl: 15000,
    brief: "Patient cheeked their morning cardiac meds and flicked them into the bin.",
    options: {
      REASSURE: "Discuss their concerns calmly and re-administer safely",
      INTERVENE: "Inspect their mouth with a tongue depressor",
      FETCH: "Check the pharmacy bin for replacements",
    },
    win: "Pills taken voluntarily with a splash of cordial.",
    fail: "Blood pressure spiked by mid-afternoon.",
  },
  {
    key: "hypotension",
    label: "HYPO-TENSION AT THE DISCO",
    icon: "💃",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Patient feeling faint whenever they sit up. The room is doing pirouettes.",
    options: {
      INTERVENE: "Lie them flat, rehydrate, repeat lying and standing readings",
      ASSIST: "Help them stand quickly to shock the body awake",
      FETCH: "Fetch a double espresso from the breakroom",
    },
    win: "Fluid balance corrected. Head cleared.",
    fail: "Syncopal episode averted by sheer luck only.",
  },
  {
    key: "neb",
    label: "NEB MISCHIEF",
    icon: "💨",
    severity: 2,
    correct: "ADJUST",
    ttl: 14000,
    brief: "Nebuliser chamber disconnected. The room looks like a Victorian sauna.",
    options: {
      ADJUST: "Reconnect the oxygen tubing and the mask seal",
      REASSURE: "Enjoy the ambient pine scent together",
      FETCH: "Fetch a towel to wipe down the fogged walls",
    },
    win: "Medication delivering to lungs instead of the ceiling tiles.",
    fail: "Not a single microgram reached the patient.",
  },
  {
    key: "bonepick",
    label: "BONE TO PICK",
    icon: "🦴",
    severity: 2,
    correct: "ESCALATE",
    ttl: 14500,
    brief: "Traction pin slipped two centimetres. Leg angle looking anatomically incorrect.",
    options: {
      ESCALATE: "Immobility review, page the orthopaedic on-call",
      ADJUST: "Yank the pulley weight back by hand",
      ASSIST: "Prop the leg up on two pillows",
    },
    win: "Ortho team fixed the traction weights properly.",
    fail: "Pain scale hit eleven. The ortho registrar is furious.",
  },
  {
    key: "pumpopera",
    label: "PUMP OPERA",
    icon: "🎶",
    severity: 2,
    correct: "ADJUST",
    ttl: 14000,
    brief: "IV drip machine alarm pitch shifted into high soprano. It is hitting high C every eight seconds.",
    options: {
      ADJUST: "Unkink the line and mute the operatic diva",
      REASSURE: "Compliment the machine's vocal range",
      FETCH: "Bring a program booklet for the evening performance",
    },
    win: "Line cleared. The opera house has closed.",
    fail: "Beds one through four gave it a standing ovation.",
  },
  {
    key: "compression",
    label: "COMPRESSION SOCK CHOKEHOLD",
    icon: "🧦",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "Class 2 elastic stocking rolled down into an impenetrable rubber tourniquet around the ankle.",
    options: {
      INTERVENE: "Ease the elastic donut up with smooth, scissor-free technique",
      ADJUST: "Yank it from the toe like starting a lawnmower",
      FETCH: "Fetch butter from catering to grease the calf",
    },
    win: "Stocking unrolled cleanly. Ankle breathing freely.",
    fail: "The stocking has permanently welded to the tibia.",
  },
  {
    key: "gownbreeze",
    label: "GOWN BREEZE WARNING",
    icon: "💨",
    severity: 2,
    correct: "ADJUST",
    ttl: 14500,
    brief: "Back ties parted company. Patient standing directly in the crossdraft of the AC vent.",
    options: {
      ADJUST: "Rapidly tie a double knot and restore modesty",
      REASSURE: "Tell them aerodynamic cooling is the future of fashion",
      FETCH: "Bring a second gown to wear as a backward poncho",
    },
    win: "Dignity saved. The cold front has passed.",
    fail: "A thirty-knot gust turned the gown into a spinnaker.",
  },
  {
    key: "dipstick",
    label: "THE DIPSTICK MIRAGE",
    icon: "🧪",
    severity: 2,
    correct: "RESPOND",
    ttl: 15000,
    brief: "Urine dipstick test pad turned bright neon tartan. Nobody knows what plaid indicates.",
    options: {
      RESPOND: "Throw it out, wipe the bottle, repeat with a fresh batch",
      ESCALATE: "Call a laboratory to decipher the clan colours",
      ASSESS: "Check the patient's ancestry for kilts",
    },
    win: "Fresh stick tests normal. Just bad reagent.",
    fail: "The chart now officially records 'high tartan levels'.",
  },
  {
    key: "wobblytray",
    label: "WOBBLY TRAY DISPOSITIONS",
    icon: "🍲",
    severity: 2,
    correct: "ADJUST",
    ttl: 15000,
    brief: "Bedside table has one wheel shorter than the rest. Soup bowl oscillating dangerously.",
    options: {
      ADJUST: "Level the table caster and secure the soup",
      ASSIST: "Hold the soup bowl steady while they eat",
      FETCH: "Bring folded cardboard to stuff under the wheel",
    },
    win: "Tray stabilised. Soup spill probability: zero.",
    fail: "Minestrone tidal wave across pristine white sheets.",
  },
  {
    key: "recliner",
    label: "RECLINER CATAPULT",
    icon: "🛋️",
    severity: 2,
    correct: "ASSIST",
    ttl: 14000,
    brief: "Patient pulled the armrest lever. Footrest sprung up and reclined them into the next dimension.",
    options: {
      ASSIST: "Push the footrest down and help them back upright",
      REASSURE: "Tell them astronauts train in this exact posture",
      INTERVENE: "Sit on their feet to weigh the chair down",
    },
    win: "Patient right-side up. Lever locked in 'Park'.",
    fail: "Patient achieved full horizontal behind the radiator.",
  },
  {
    key: "custardbell",
    label: "CALL BELL IN THE CUSTARD",
    icon: "🍮",
    severity: 2,
    correct: "INTERVENE",
    ttl: 14500,
    brief: "The call bell pendant slid off the pillow directly into warm school-pudding custard.",
    options: {
      INTERVENE: "Fish it out with tongs, sanitise, and test the circuit",
      FETCH: "Bring dessert spoons for the salvage crew",
      RESPOND: "Wipe it on the bed sheet and hope for the best",
    },
    win: "Pendant rescued and wiped. The beeper beeps again.",
    fail: "Every ring of the bell now plays a muffled glug.",
  },
  {
    key: "traction",
    label: "TRACTION TIE-DOWN",
    icon: "🧗",
    severity: 2,
    correct: "ADJUST",
    ttl: 14500,
    brief: "Patient is using the overhead orthopaedic monkey pole to dry four pairs of washed knickers.",
    options: {
      ADJUST: "Politely relocate the laundry to the drying rack",
      ASSIST: "Help hang up a matching cardigan",
      ESCALATE: "Call the Head of Hygiene for an airing violation",
    },
    win: "Monkey bar cleared. Dignity and laundry both dry.",
    fail: "Ward round conducted beneath a canopy of delicates.",
  },
  {
    key: "stethoscope",
    label: "STETHOSCOPE FREEZE",
    icon: "🧊",
    severity: 2,
    correct: "REASSURE",
    ttl: 14500,
    brief: "Doctor left their bell in the vaccine fridge. Placed on the patient's back; patient hit ceiling.",
    options: {
      REASSURE: "Warm the diaphragm between your palms and soothe the shock",
      INTERVENE: "Rub their back with friction-generating scrub sponges",
      ESCALATE: "Bleep the doctor to apologise for clinical frostbite",
    },
    win: "Brass warmed. Patient returned from low orbit.",
    fail: "Patient now refuses all silver tools within three metres.",
  },
  {
    key: "dripstand",
    label: "DRIP STAND LIMBO",
    icon: "🎪",
    severity: 2,
    correct: "ADJUST",
    ttl: 14500,
    brief: "Patient tried to push their wheeled drip stand through the curtain gap while it was horizontal.",
    options: {
      ADJUST: "Straighten the IV pole and guide the wheels through",
      INTERVENE: "Cut the curtain rail down with wire snips",
      ASSIST: "Encourage them to limbo under the crossbar",
    },
    win: "Pole righted. The drip bag didn't even ripple.",
    fail: "Curtain rail yanked down like a comedy sketch.",
  },

  /* ---------- routine batch 3: the ultimate call-bell roster ---------- */
  {
    key: "teaconstruct",
    label: "CALL BELL: TEA-CONSTRUCTED",
    icon: "☕",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "The milk went in before the teabag. This is institutional negligence.",
    options: {
      RESPOND: "Remake the cuppa with proper protocol",
      REASSURE: "Explain that dairy physics is non-denominational",
      ESCALATE: "Bleep the catering manager at home",
    },
    win: "Proper brew restored. Order in the universe.",
    fail: "The tea debate reached the regional news.",
  },
  {
    key: "socksflipped",
    label: "SLIPPERY WHEN WET",
    icon: "🧤",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "My non-slip socks have the rubber grip dots facing heaven.",
    options: {
      ADJUST: "Flip the socks so the grips meet the floor",
      INTERVENE: "Tape their feet to the linoleum",
      ASSIST: "Help them slide across the ward like a curling puck",
    },
    win: "Grips down. Traction restored.",
    fail: "The ward is now an ice rink with socks.",
  },
  {
    key: "teeth",
    label: "TOOTH OR DARE",
    icon: "🦷",
    severity: 1,
    correct: "FETCH",
    ttl: 18000,
    callBell: true,
    brief: "My false teeth have vanished from my mouth!",
    options: {
      FETCH: "Retrieve the teeth chilling in the flower vase",
      ESCALATE: "Order an urgent X-ray for ingested molars",
      INTERVENE: "Pry the jaw open to search for stragglers",
    },
    win: "Dentures recovered. Smile restored.",
    fail: "The flower vase now has a dental problem.",
  },
  {
    key: "remotepossession",
    label: "CALL BELL: REMOTE POSSESSION",
    icon: "📺",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "The telly is trapped on daytime property auctions. Save my soul.",
    options: {
      ADJUST: "Tune it back to wildlife documentaries",
      RESPOND: "Sit down and debate the resale value of semis",
      INTERVENE: "Unplug the main hospital breaker",
    },
    win: "Property auctions exorcised. Documentaries restored.",
    fail: "They now own four imaginary flats in Marbella.",
  },
  {
    key: "funnybone",
    label: "FUNNY BONE FACT-CHECK",
    icon: "🤛",
    severity: 1,
    correct: "REASSURE",
    ttl: 18000,
    callBell: true,
    brief: "I bumped my elbow and it is NOT as funny as the name implies.",
    options: {
      REASSURE: "Offer an ice pack and a polite chuckle",
      ESCALATE: "Call trauma theatre for an ulnar overhaul",
      ASSIST: "Show them the anatomy diagram of why it tingles",
    },
    win: "Ice pack applied. Humour levels acceptable.",
    fail: "The joke has been escalated to management.",
  },
  {
    key: "drywater",
    label: "CALL BELL: DRY WATER",
    icon: "🫗",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "My water jug is at room temperature. I requested arctic chill.",
    options: {
      FETCH: "Bring fresh ice chips from the kitchen",
      ADJUST: "Blow on the surface of the jug like hot soup",
      REASSURE: "Explain the virtues of tepid hydration",
    },
    win: "Arctic chill delivered as requested.",
    fail: "The jug remains lukewarm and litigation-ready.",
  },
  {
    key: "spectacles",
    label: "CALL BELL: SPECTACLE SPECTACLE",
    icon: "👓",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "Someone has stolen my reading glasses right off the bedside locker!",
    options: {
      ADJUST: "Gently push the glasses down from their forehead",
      FETCH: "Search under all four bed casters with a torch",
      ESCALATE: "Report the serial spectacle thief to security",
    },
    win: "Glasses located. They were on their face.",
    fail: "Security has opened a case file.",
  },
  {
    key: "curtainconspiracy",
    label: "CURTAIN CONSPIRACY",
    icon: "🤫",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "The two-millimetre gap in my bed curtain is compromising my personal brand.",
    options: {
      ADJUST: "Slide the curtain completely shut with a peg",
      REASSURE: "Tell them nobody is looking at their socks",
      INTERVENE: "Build a cardboard barricade along the rail",
    },
    win: "Gap eliminated. Personal brand intact.",
    fail: "The gap has become a bay-wide talking point.",
  },
  {
    key: "biscuitdunk",
    label: "CALL BELL: BISCUIT DUNK SUBMERSION",
    icon: "🍪",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "My Rich Tea spent 4.8 seconds submerged. Emergency salvage required.",
    options: {
      RESPOND: "Retrieve the soggy biscuit with a clean teaspoon",
      ESCALATE: "Call catering for an emergency scone review",
      FETCH: "Bring two dry Digestives to absorb the loss",
    },
    win: "Biscuit salvaged. Compromised but delicious.",
    fail: "The biscuit has become porridge.",
  },
  {
    key: "roundspoon",
    label: "CALL BELL: ROUND SPOON PURIST",
    icon: "🥄",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "They gave me an oval spoon. My soup palate is strictly spherical.",
    options: {
      FETCH: "Swap it for the roundest spoon in the galley",
      REASSURE: "Explain the hydrodynamic efficiency of an ellipse",
      INTERVENE: "Bend the spoon into a circle with pliers",
    },
    win: "Spherical soup delivery achieved.",
    fail: "Soup now served in a mug. An outrage.",
  },
  {
    key: "latviandarts",
    label: "CALL BELL: LATVIAN DARTS CRISIS",
    icon: "🎯",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "Antiques Roadshow finished. The telly is now stuck on Lithuanian darts.",
    options: {
      ADJUST: "Switch the telly back to a nature marathon",
      RESPOND: "Place a friendly pound on the dart thrower",
      INTERVENE: "Pull the hospital aerial out of the wall socket",
    },
    win: "Darts banished. Documentaries resume.",
    fail: "The whole bay is now invested in Lithuanian darts.",
  },
  {
    key: "pillowarch",
    label: "CALL BELL: PILLOW ARCHITECTURE",
    icon: "📐",
    severity: 1,
    correct: "ADJUST",
    ttl: 18000,
    callBell: true,
    brief: "My bottom pillow is at 30 degrees, but my top pillow has shifted to 47.",
    options: {
      ADJUST: "Fluff both pillows into a crisp ninety-degree stack",
      REASSURE: "Compliment their acute sense of geometry",
      FETCH: "Bring a spirit level from maintenance",
    },
    win: "Pillow angles within tolerance. Architecture approved.",
    fail: "The pillow situation remains structurally unsound.",
  },
  {
    key: "mysterybeep",
    label: "CALL BELL: MYSTERY BEEP PROVENANCE",
    icon: "📟",
    severity: 1,
    correct: "ADJUST",
    ttl: 17000,
    callBell: true,
    brief: "Something is going 'blip' every 90 seconds. I suspect aliens.",
    options: {
      ADJUST: "Silence the low-battery chirp on the TV remote",
      ESCALATE: "Report an unidentified frequency to the ward sister",
      REASSURE: "Tell them it's the heartbeat of the building",
    },
    win: "Beep silenced. Alien theory quietly shelved.",
    fail: "The beep continues. Nobody knows why.",
  },
  {
    key: "coldtoast",
    label: "CALL BELL: COLD TOAST BALLISTICS",
    icon: "🍞",
    severity: 1,
    correct: "FETCH",
    ttl: 17000,
    callBell: true,
    brief: "This toast is bending at a 90-degree angle without snapping. It has become rubber.",
    options: {
      FETCH: "Fetch a fresh slice straight from the grill",
      REASSURE: "Suggest rolling it up like a savoury pancake",
      INTERVENE: "Snap it over the bed rail like firewood",
    },
    win: "Hot toast delivered. Physics respected.",
    fail: "The toast has achieved full rubberisation.",
  },
  {
    key: "sconeprotocol",
    label: "CALL BELL: SCONE PROTOCOL DISPUTE",
    icon: "🧁",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "The patient opposite put jam before clotted cream. This bay is divided.",
    options: {
      RESPOND: "Declare the ward a butter-first neutral zone",
      ESCALATE: "Bleep the hospital chaplain to broker a treaty",
      INTERVENE: "Eat the evidence before tensions boil over",
    },
    win: "Diplomatic incident downgraded to crumbs.",
    fail: "The bay has split into two armed camps.",
  },
  {
    key: "ghostslipper",
    label: "CALL BELL: THE GHOST SLIPPER",
    icon: "🥿",
    severity: 1,
    correct: "FETCH",
    ttl: 18000,
    callBell: true,
    brief: "One slipper is by my heel. The other has embarked on a spiritual journey.",
    options: {
      FETCH: "Find it hiding under the radiator behind the chair",
      ASSIST: "Help them hop on one foot to the bathroom",
      REASSURE: "Tell them one warm foot is better than none",
    },
    win: "Slipper recovered from its spiritual journey.",
    fail: "The slipper remains at large.",
  },
  {
    key: "crossword14",
    label: "CALL BELL: CROSSWORD EMERGENCY",
    icon: "📰",
    severity: 1,
    correct: "RESPOND",
    ttl: 18000,
    callBell: true,
    brief: "Seven letters: 'Annoying brassica in hospital stew'. Starts with C.",
    options: {
      RESPOND: "Whisper 'CABBAGE' and smile conspiratorially",
      FETCH: "Bring a dictionary to check surgical words",
      ESCALATE: "Ask the consultant for clinical input",
    },
    win: "Seven letters. Cabbage. Dignity preserved.",
    fail: "The crossword has claimed another nurse.",
  },
  {
    key: "lumpycustard",
    label: "LUMPY CUSTARD GRIEVANCE",
    icon: "🥣",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "This custard has more lumps than a badly-made bed. I demand answers.",
    options: {
      RESPOND: "Apologise and fetch a smooth replacement",
      REASSURE: "Explain lumps are texture, not trauma",
      ESCALATE: "Bleep the head of catering at home",
    },
    win: "Smooth custard deployed. Peace restored.",
    fail: "A formal custard complaint has been filed.",
  },
  {
    key: "peas",
    label: "TOO MANY PEAS",
    icon: "🫛",
    severity: 1,
    correct: "RESPOND",
    ttl: 17000,
    callBell: true,
    brief: "There are 47 peas on my plate. I counted. I counted them all.",
    options: {
      RESPOND: "Swap the plate for a pea-reasonable portion",
      REASSURE: "Praise their arithmetic and leave the peas",
      ESCALATE: "Bleep dietetics about the pea surplus",
    },
    win: "Peas within legal limits. Counting closed.",
    fail: "The pea mountain remains. Untouched. Cold.",
  },
  {
    key: "bedsprings",
    label: "NOISY BEDSPRING SYMPHONY",
    icon: "🎻",
    severity: 1,
    correct: "ADJUST",
    ttl: 18000,
    callBell: true,
    brief: "My bed creaks in G minor every time I breathe out. Nobody can sleep.",
    options: {
      ADJUST: "Tighten the frame bolt and silence the soloist",
      REASSURE: "Describe it as free classical entertainment",
      ESCALATE: "Bleep maintenance for a midnight inspection",
    },
    win: "One bolt. One turn. One silent bed.",
    fail: "The creaking now has a second movement.",
  },
  {
    key: "thermostatwar",
    label: "THERMOSTAT WAR",
    icon: "🌡️",
    severity: 1,
    correct: "REASSURE",
    ttl: 18000,
    brief: "Bay wants 18 degrees. This patient wants a balmy 26. Forever.",
    options: {
      REASSURE: "Broker a truce with a strategic blanket",
      ADJUST: "Set the thermostat to a diplomatic 21 degrees",
      ESCALATE: "Bleep the ward sister to referee",
    },
    win: "Truce signed at exactly 21 degrees.",
    fail: "The bay has split into thermal factions.",
  },
];

/* ------------------------------------------------------------------ */
/* RESPONSE OUTCOMES                                                   */
/* ------------------------------------------------------------------ */

/** full / half / zero / negative payout weights, shuffled per spawned event */
export function rollOutcomes(def: EventDef): Partial<Record<ActionKind, number>> {
  const keys = Object.keys(def.options) as ActionKind[];
  const others = keys.filter((k) => k !== def.correct);
  const pool = [0.5, 0, -0.6, 0.5, 0, -0.6].slice(0, others.length);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const out: Partial<Record<ActionKind, number>> = { [def.correct]: 1 };
  others.forEach((k, i) => {
    out[k] = pool[i] ?? 0;
  });
  return out;
}


export const PATIENT_NAMES = [
  "Mr Pemberly",
  "Ms Okoro",
  "Mrs Vance",
  "Mr Dhillon",
  "Ms Trent",
  "Mr Baird",
  "Mrs Ashcombe",
  "Mr Nwosu",
  "Ms Halloran",
  "Mr Kowalski",
  "Mrs Fenwick",
  "Ms Bhatt",
  "Mr Sandoval",
  "Mrs Quigley",
  "Mr Adeyemi",
  "Ms Lindqvist",
  "Mr Tulloch",
  "Mrs Panayiotou",
  "Ms Cardew",
  "Mr Rafferty",
  "Mrs Iwuchukwu",
  "Mr Featherstone",
  "Lady Periwinkle",
  "Baron Von Custard",
  "Mr Reginald Fifth",
  "Dame Bubbles Trotter",
  "Mrs Marmalade Poot",
  "Sir Nigel Wobble",
  "Ms Twinkle Bunce",
  "Mr Barnaby Snugworth",
  "Duchess Doreen",
];

/** names used by the previous shift, so the next one feels like a fresh cohort */
let recentPatientNames: string[] = [];

/** one distinct name per bed, reshuffled every shift and avoiding the last shift's patients */
export function shuffledPatientNames(count: number): string[] {
  const shuffle = (arr: string[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  };
  const fresh = shuffle(PATIENT_NAMES.filter((n) => !recentPatientNames.includes(n)));
  const reusable = shuffle(PATIENT_NAMES.filter((n) => recentPatientNames.includes(n)));
  const pool = [...fresh, ...reusable];
  const picked = Array.from(
    { length: count },
    (_, i) => pool[i % pool.length] ?? `Bay ${i + 1}`,
  );
  recentPatientNames = picked;
  return picked;
}


/** Big bank of obviously-fictional medication names. Not real drugs. */
export const FICTIONAL_MEDS = [
  "Zolvarin",
  "Brenupax",
  "Corvidyne",
  "Mellodex",
  "Pantorine",
  "Quillaxin",
  "Ferrodyne",
  "Nimbucaine",
  "Trazolen",
  "Balmoxin",
  "Crestapine",
  "Dovaxol",
  "Elmoridan",
  "Fibrolane",
  "Glyverin",
  "Halcyprin",
  "Ibrizole",
  "Junaxide",
  "Kelvorin",
  "Lumaphen",
  "Morvexa",
  "Nyxaprol",
  "Orvadine",
  "Prendasol",
  "Quorvanix",
  "Ravindol",
  "Sombrelex",
  "Tavoquine",
  "Ulmarin",
  "Vextrapil",
  "Wynovax",
  "Xandriline",
  "Yarrowex",
  "Zephyrone",
  "Amberlox",
  "Bindalor",
  "Cystamune",
  "Drossilan",
  "Emberide",
  "Frondazil",
  "Grivalox",
  "Hesperene",
  "Indralux",
  "Jorvatine",
  "Kryllomab",
  "Lantifex",
  "Murovent",
  "Nectarel",
  "Obsidane",
  "Ptarmigal",
  "Quibblex",
  "Rosterol",
  "Sablefen",
  "Thornazide",
  "Umbraphen",
  "Verdilix",
];

export type PillShape = "round" | "capsule" | "oblong" | "triangle";

export const PILL_COLORS = [
  { a: "oklch(0.68 0.2 25)", b: "oklch(0.55 0.2 20)" },
  { a: "oklch(0.75 0.16 155)", b: "oklch(0.6 0.16 160)" },
  { a: "oklch(0.85 0.16 85)", b: "oklch(0.72 0.16 70)" },
  { a: "oklch(0.68 0.15 260)", b: "oklch(0.55 0.16 265)" },
  { a: "oklch(0.72 0.14 320)", b: "oklch(0.6 0.15 325)" },
  { a: "oklch(0.7 0.15 195)", b: "oklch(0.57 0.15 200)" },
  { a: "oklch(0.93 0.02 240)", b: "oklch(0.82 0.03 240)" },
  { a: "oklch(0.72 0.17 45)", b: "oklch(0.6 0.18 40)" },
];

export type Upgrades = { speed: number; response: number; equipment: number };

export const UPGRADE_INFO = [
  {
    key: "speed" as const,
    name: "Nurse Speed",
    icon: "👟",
    blurb: "Sprint between beds",
    cost: (l: number) => 1800 + l * 1600,
  },
  {
    key: "response" as const,
    name: "Response Time",
    icon: "⏱️",
    blurb: "Patients wait longer",
    cost: (l: number) => 2100 + l * 1800,
  },
  {
    key: "equipment" as const,
    name: "Equipment",
    icon: "🩺",
    blurb: "Bigger payouts, softer hits",
    cost: (l: number) => 2400 + l * 2000,
  },
];

/** staff tiers: how spicy an event they're allowed to take on */
export type StaffTier = 1 | 2 | 3;

/** the nurses' station has five seats — five hires on shift at once */
export const MAX_STAFF = 5;

export type StaffMember = {
  key: string;
  name: string;
  icon: string;
  tier: StaffTier;
  bonus: string;
  cost: number;
  /** nurse rank level required to hire (defaults to 2) */
  rank?: number;
  /** ward-wide effects while on shift */
  effects?: Partial<Effects>;
};

export const STAFF: StaffMember[] = [
  {
    key: "hca",
    name: "Barry the HCA",
    icon: "🧹",
    tier: 1,
    bonus: "Tier 1 · routine call bells only",
    cost: 3500,
  },
  {
    key: "student",
    name: "Priya, Student Nurse",
    icon: "🎓",
    tier: 2,
    bonus: "Tier 2 · routine + urgent, +15% points",
    cost: 9000,
    effects: { payBonus: 0.15 },
  },
  {
    key: "charge",
    name: "Dot, Charge Nurse",
    icon: "🧑‍⚕️",
    tier: 3,
    bonus: "Tier 3 · anything, even criticals",
    cost: 18000,
    rank: 3,
  },
  /* ---- expanded roster ---- */
  {
    key: "gary",
    name: "Gary, Porter of Legend",
    icon: "🛒",
    tier: 1,
    bonus: "Tier 1 · everything arrives faster (-6% walking)",
    cost: 3200,
    rank: 1,
    effects: { travelMult: 0.94 },
  },
  {
    key: "moira",
    name: "Moira, Ward Clerk",
    icon: "🗂️",
    tier: 1,
    bonus: "Tier 1 · answers bells before you do (-12% silly calls)",
    cost: 4200,
    effects: { sillyMult: 0.88 },
  },
  {
    key: "kev",
    name: "Kev, Domestic Supervisor",
    icon: "🧼",
    tier: 1,
    bonus: "Tier 1 · mops fast, judges faster (-8% stability damage)",
    cost: 4600,
    effects: { damageMult: 0.92 },
  },
  {
    key: "nan",
    name: "Nan, Volunteer",
    icon: "🫖",
    tier: 1,
    bonus: "Tier 1 · tea trolley morale (+8% XP, +8% silly bells)",
    cost: 2600,
    rank: 1,
    effects: { xpMult: 1.08, sillyMult: 1.08 },
  },
  {
    key: "duncan",
    name: "Duncan, Physio",
    icon: "🦵",
    tier: 2,
    bonus: "Tier 2 · nobody slides down the bed (-10% damage)",
    cost: 8200,
    effects: { damageMult: 0.9 },
  },
  {
    key: "yusuf",
    name: "Yusuf, Ward Pharmacist",
    icon: "💊",
    tier: 2,
    bonus: "Tier 2 · bonus rounds pay +15%",
    cost: 9400,
    effects: { miniMult: 1.15 },
  },
  {
    key: "tina",
    name: "Tina, Bank Nurse",
    icon: "🧣",
    tier: 2,
    bonus: "Tier 2 · brilliant, but keeps checking the rota (+10% pay, -4% speed)",
    cost: 8800,
    effects: { payBonus: 0.1, travelMult: 1.04 },
  },
  {
    key: "gwen",
    name: "Gwen, Night Sister",
    icon: "🌙",
    tier: 3,
    bonus: "Tier 3 · patients wait +10% longer under her stare",
    cost: 16500,
    rank: 3,
    effects: { ttlMult: 1.1 },
  },
  {
    key: "raj",
    name: "Raj, Practice Educator",
    icon: "📚",
    tier: 2,
    bonus: "Tier 2 · teaches constantly (+15% XP, -5% pay)",
    cost: 11000,
    rank: 3,
    effects: { xpMult: 1.15, payBonus: -0.05 },
  },
  {
    key: "bev",
    name: "Bev, Discharge Coordinator",
    icon: "📋",
    tier: 2,
    bonus: "Tier 2 · beds turn over neatly (-15% silly calls)",
    cost: 12500,
    rank: 4,
    effects: { sillyMult: 0.85 },
  },
  {
    key: "marcus",
    name: "Marcus, Resus Nurse",
    icon: "⚡",
    tier: 3,
    bonus: "Tier 3 · takes the scary ones and gets paid for it (+12%)",
    cost: 24000,
    rank: 4,
    effects: { payBonus: 0.12 },
  },
];

/** beds unlock naturally with level: 4 at Level 1, 8 by Level 10 */
export const MAX_BEDS = 8;
export function bedsForLevel(levelRaw: number): number {
  const level = Math.max(1, Math.min(MAX_LEVEL, levelRaw));
  return Math.min(MAX_BEDS, 4 + Math.round(((level - 1) / (MAX_LEVEL - 1)) * 4));
}


export const travelMs = (u: Upgrades) => Math.max(140, 520 - u.speed * 85);
export const ttlMult = (u: Upgrades) => 1 + u.response * 0.16;
export const payMult = (u: Upgrades, staffBonus: number) =>
  1 + u.equipment * 0.18 + staffBonus;
export const damageMult = (u: Upgrades) => Math.max(0.4, 1 - u.equipment * 0.15);

export const SHIFT_MS = 100000;
/** Gentle opening: no pressure ramp until this much of the shift has passed. */
export const WARMUP_MS = 22000;

export const RATINGS: { min: number; title: string; line: string }[] = [
  { min: 900, title: "WARD LEGEND", line: "Rumours say you never blinked once." },
  { min: 600, title: "SAFE PAIR OF HANDS", line: "Handover took 4 minutes. Unheard of." },
  { min: 350, title: "MILDLY FERAL", line: "You drank cold tea and liked it." },
  { min: 150, title: "SURVIVED, BARELY", line: "Your ID badge is on backwards." },
  { min: 0, title: "SEEN THINGS", line: "You are now legally a beeping sound." },
];

/* ------------------------------------------------------------------ */
/* URGENCY                                                             */
/* ------------------------------------------------------------------ */

export type Urgency = "routine" | "urgent" | "critical";

export const URGENCY_META: Record<
  Urgency,
  { label: string; ring: string; chip: string; bar: string; mult: number }
> = {
  routine: {
    label: "ROUTINE",
    ring: "ring-calm",
    chip: "bg-calm text-calm-foreground",
    bar: "bg-calm",
    mult: 1.55,
  },
  urgent: {
    label: "URGENT",
    ring: "ring-gold",
    chip: "bg-gold text-gold-foreground",
    bar: "bg-gold",
    mult: 1,
  },
  critical: {
    label: "CRITICAL",
    ring: "ring-alarm",
    chip: "bg-alarm text-alarm-foreground",
    bar: "bg-alarm",
    mult: 0.45,
  },
};

export const urgencyOf = (def: EventDef): Urgency =>
  def.severity === 3 ? "critical" : def.severity === 2 ? "urgent" : "routine";

/* ------------------------------------------------------------------ */
/* LEVELS 1..10                                                        */
/* ------------------------------------------------------------------ */

export const MAX_LEVEL = 10;

export type LevelConfig = {
  level: number;
  name: string;
  /** beds in play this level (capped by unlocked beds) */
  beds: number;
  /** max simultaneous events */
  maxEvents: number;
  /** chance an eligible spawn tick actually spawns */
  spawnChance: number;
  /** multiplies event ttl — high = generous */
  timeMult: number;
  /** deterioration damage multiplier */
  damage: number;
  /** highest event severity allowed */
  maxSeverity: 1 | 2 | 3;
  /** relative chance of picking a severity 1 / 2 / 3 event */
  sevWeights: [number, number, number];
};

export function levelConfig(levelRaw: number): LevelConfig {
  const level = Math.max(1, Math.min(MAX_LEVEL, levelRaw));
  const t = (level - 1) / (MAX_LEVEL - 1); // 0..1
  const names = [
    "Day One Jitters",
    "Gentle Bay",
    "Getting Busy",
    "Proper Shift",
    "Bells Everywhere",
    "Short Staffed",
    "Full House",
    "Winter Pressures",
    "Absolute Chaos",
    "Ward Legend Run",
  ];
  return {
    level,
    name: names[level - 1] ?? "Ward",
    beds: Math.min(6, 2 + Math.floor(t * 4 + 0.5)),
    /** level 1 already juggles a few things — busy, but forgiving */
    maxEvents: Math.min(5, 2 + Math.round(t * 3)),
    spawnChance: 0.4 + t * 0.5,
    /** response windows tighten steadily with level (urgency tiers preserved) */
    timeMult: 1.95 - t * 1.3,
    damage: 0.45 + t * 1.0,
    /** urgent + critical exist from level 1, just rarely */
    maxSeverity: 3,
    sevWeights: [0.7 - t * 0.45, 0.24 + t * 0.11, 0.06 + t * 0.34],
  };
}

/* ------------------------------------------------------------------ */
/* STAFF BEHAVIOUR                                                     */
/* ------------------------------------------------------------------ */

export const STAFF_BEHAVIOUR: Record<
  string,
  {
    responseMs: number;
    cooldownMs: number;
    /** highest event severity this tier is allowed to resolve */
    maxSeverity: 1 | 2 | 3;
    line: string;
  }
> = {
  hca: {
    responseMs: 4200,
    cooldownMs: 12000,
    maxSeverity: 1,
    line: "Barry got the bell!",
  },
  student: {
    responseMs: 6200,
    cooldownMs: 14000,
    maxSeverity: 2,
    line: "Priya handled it (and asked 4 questions)",
  },
  charge: {
    responseMs: 5000,
    cooldownMs: 15000,
    maxSeverity: 3,
    line: "Dot sorted it before you blinked",
  },
  gary: {
    responseMs: 5200,
    cooldownMs: 11000,
    maxSeverity: 1,
    line: "Gary wheeled it away, whistling",
  },
  moira: {
    responseMs: 4000,
    cooldownMs: 13000,
    maxSeverity: 1,
    line: "Moira answered the bell from her chair",
  },
  kev: {
    responseMs: 4800,
    cooldownMs: 12500,
    maxSeverity: 1,
    line: "Kev mopped it before it happened",
  },
  nan: {
    responseMs: 7000,
    cooldownMs: 15000,
    maxSeverity: 1,
    line: "Nan sorted it with tea and gossip",
  },
  duncan: {
    responseMs: 6400,
    cooldownMs: 14500,
    maxSeverity: 2,
    line: "Duncan repositioned them properly",
  },
  yusuf: {
    responseMs: 6800,
    cooldownMs: 15000,
    maxSeverity: 2,
    line: "Yusuf checked the chart twice. Twice.",
  },
  tina: {
    responseMs: 5600,
    cooldownMs: 13500,
    maxSeverity: 2,
    line: "Tina handled it, then asked about parking",
  },
  gwen: {
    responseMs: 5200,
    cooldownMs: 16000,
    maxSeverity: 3,
    line: "Gwen appeared. Problem left.",
  },
  raj: {
    responseMs: 7200,
    cooldownMs: 14000,
    maxSeverity: 2,
    line: "Raj fixed it and turned it into a teaching moment",
  },
  bev: {
    responseMs: 6600,
    cooldownMs: 14000,
    maxSeverity: 2,
    line: "Bev sorted it AND started the discharge letter",
  },
  marcus: {
    responseMs: 4400,
    cooldownMs: 16000,
    maxSeverity: 3,
    line: "Marcus was already there. Of course he was.",
  },
};


/* ------------------------------------------------------------------ */
/* SILLY SUMMARY MODIFIERS                                             */
/* ------------------------------------------------------------------ */

export type Quirk = { label: string; pts: number };

const QUIRKS: Quirk[] = [
  { label: "Found a pen that actually works", pts: 40 },
  { label: "Drank an entire hot tea", pts: 60 },
  { label: "Tea went cold. Again.", pts: -35 },
  { label: "Correctly guessed the lunch order", pts: 25 },
  { label: "Squeaky shoe incident", pts: -20 },
  { label: "Restocked the glove box unprompted", pts: 45 },
  { label: "Called a doctor by the wrong name", pts: -30 },
  { label: "Survived the printer", pts: 50 },
  { label: "Left the linen trolley somewhere odd", pts: -25 },
  { label: "Fixed the telly for bay 3", pts: 35 },
  { label: "Alarm went off in your pocket", pts: -15 },
  { label: "Handover finished on time", pts: 70 },
  { label: "Ate a biscuit from the mystery tin", pts: 20 },
  { label: "Lost your favourite pen", pts: -40 },
  { label: "Complimented on your lanyard", pts: 30 },
  { label: "Won the biscuit tin lottery", pts: 55 },
  { label: "Stole a chair from the doctors' office", pts: 40 },
  { label: "Chair immediately reclaimed", pts: -30 },
  { label: "Found the good scissors", pts: 65 },
  { label: "Lost the good scissors", pts: -55 },
  { label: "Badge photo compliment", pts: 25 },
  { label: "Sat down for eleven whole seconds", pts: 45 },
  { label: "Bleep went off mid-sandwich", pts: -35 },
  { label: "Sandwich survived anyway", pts: 30 },
  { label: "Perfect handover voice", pts: 50 },
  { label: "Said 'you too' to the porter's joke", pts: -10 },
  { label: "Untangled every single cable", pts: 60 },
  { label: "Beeped by an empty room", pts: -20 },
  { label: "Found parking on the first lap", pts: 80 },
  { label: "Parking machine ate your coin", pts: -45 },
  { label: "Correctly predicted the fire alarm test", pts: 35 },
  { label: "Sneezed during a quiet moment", pts: -15 },
  { label: "Hair survived the whole shift", pts: 40 },
  { label: "Hair did not survive the whole shift", pts: -25 },
  { label: "Vending machine gave two of them", pts: 70 },
  { label: "Vending machine kept the crisps", pts: -50 },
  { label: "Wore the comfy shoes", pts: 55 },
  { label: "Wore the squeaky shoes. Bold.", pts: -30 },
  { label: "Refilled the water jug army", pts: 45 },
  { label: "Knocked over a water jug", pts: -35 },
  { label: "Made the ward laugh at 4am", pts: 65 },
  { label: "Laughed at your own joke first", pts: -10 },
  { label: "Kept the store cupboard alphabetical", pts: 50 },
  { label: "Left the store cupboard feral", pts: -40 },
  { label: "Rescued a slipper from under a bed", pts: 30 },
  { label: "Bumped the linen trolley into a wall", pts: -20 },
  { label: "Nailed the blood pressure cuff velcro", pts: 25 },
  { label: "Velcro noise woke the whole bay", pts: -30 },
  { label: "Found the last clean pillowcase", pts: 45 },
  { label: "Pillowcase mountain collapsed", pts: -25 },
  { label: "Charted before the end of shift", pts: 75 },
  { label: "Charted with a dying pen", pts: -20 },
  { label: "Remembered everyone's tea order", pts: 60 },
  { label: "Forgot your own tea order", pts: -15 },
  { label: "Silenced the pump in one tap", pts: 55 },
  { label: "Pressed the wrong button twice", pts: -35 },
  { label: "Held a door for eleven people", pts: 30 },
  { label: "Door held you instead", pts: -10 },
  { label: "Got the good locker", pts: 50 },
  { label: "Locker key vanished", pts: -45 },
  { label: "Hand gel dispenser worked first go", pts: 35 },
  { label: "Hand gel jumpscare", pts: -20 },
  { label: "Perfect apron tie", pts: 25 },
  { label: "Apron tie became a knot for life", pts: -25 },
  { label: "Answered the ward phone in a nice voice", pts: 40 },
  { label: "Ward phone rang 31 times", pts: -30 },
  { label: "Convinced the printer to print", pts: 70 },
  { label: "Printer printed 40 blank pages", pts: -50 },
  { label: "Found a working thermometer", pts: 45 },
  { label: "Thermometer went walkabout", pts: -35 },
  { label: "Correctly guessed the doctor's name", pts: 35 },
  { label: "Called the consultant 'mate'", pts: -40 },
  { label: "Fixed the wobbly table with a folded leaflet", pts: 55 },
  { label: "Sat on the wobbly table", pts: -20 },
  { label: "Perfect corner on a bedsheet", pts: 60 },
  { label: "Bedsheet defeated you", pts: -30 },
  { label: "Cheered up the grumpiest visitor", pts: 80 },
  { label: "Got trapped in a 20-minute chat", pts: -35 },
  { label: "Discovered a secret biscuit stash", pts: 75 },
  { label: "Secret biscuit stash discovered by others", pts: -45 },
  { label: "Lift arrived instantly", pts: 65 },
  { label: "Lift stopped at every floor", pts: -40 },
  { label: "Took the stairs. Twice.", pts: 40 },
  { label: "Regretted the stairs", pts: -15 },
  { label: "Kept your pen for the entire shift", pts: 85 },
  { label: "Pen borrowed and never returned", pts: -40 },
  { label: "Restocked the gloves before anyone noticed", pts: 50 },
  { label: "Opened the last glove box wrong way up", pts: -25 },
  { label: "Smashed the handover bingo card", pts: 70 },
  { label: "Said 'quiet' out loud. Rookie.", pts: -60 },
  { label: "Nobody said the Q word", pts: 90 },
  { label: "Warmed a blanket to perfection", pts: 55 },
  { label: "Blanket warmer had opinions", pts: -20 },
  { label: "Beat the trolley to the corner", pts: 35 },
  { label: "Lost to the trolley", pts: -15 },
  { label: "Sorted the notes trolley alphabetically", pts: 60 },
  { label: "Notes trolley now a mystery", pts: -35 },
  { label: "Learned a new joke from bay 2", pts: 45 },
  { label: "Told it wrong to bay 4", pts: -20 },
  { label: "Emptied the bin before it overflowed", pts: 40 },
  { label: "Bin lid attacked", pts: -25 },
  { label: "Kept the nurses' station tidy", pts: 55 },
  { label: "Station now a paperwork volcano", pts: -40 },
  { label: "Found the missing TV remote (again)", pts: 45 },
  { label: "Remote batteries were in backwards", pts: -15 },
  { label: "Hit the bay curtain slide perfectly", pts: 30 },
  { label: "Curtain came off its rail", pts: -45 },
  { label: "Free cake in the staff room", pts: 95 },
  { label: "Cake gone before your break", pts: -55 },
  { label: "Break actually happened", pts: 100 },
  { label: "Break happened in your imagination", pts: -50 },
  { label: "Nailed the pump alarm dance", pts: 40 },
  { label: "Alarm dance witnessed by visitors", pts: -20 },
  { label: "Left the ward better than you found it", pts: 85 },
];

export function rollQuirks(count = 3): Quirk[] {
  return [...QUIRKS].sort(() => Math.random() - 0.5).slice(0, count);
}

/* ------------------------------------------------------------------ */
/* PAUSE / BREAK LINES                                                 */
/* ------------------------------------------------------------------ */

export const PAUSE_LINES = [
  "Tea break. Nothing is ticking.",
  "Hiding in the store cupboard. Shh.",
  "Pretending to check the notes trolley.",
  "Eating a biscuit at inhuman speed.",
  "Sitting down. Revolutionary.",
  "Looking for a pen that works.",
  "Staring into the fridge of forgotten lunches.",
  "Letting the bleep ring. Just once.",
  "Warming your hands on someone's tea.",
  "Practising your handover voice.",
  "Nobody say the Q word.",
  "Untangling one cable. It's therapy.",
  "Reading the noticeboard from 2014.",
  "Waiting for the kettle. Eternally.",
  "Doing the big sigh. The famous one.",
  "Checking your pockets for the good scissors.",
  "Two minutes of blessed silence.",
  "Taking your shoes off. Briefly.",
  "Rehearsing 'I'm fine, just busy!'",
  "Watching the corridor like a hawk. Resting hawk.",
];

export const randomPauseLine = () =>
  PAUSE_LINES[Math.floor(Math.random() * PAUSE_LINES.length)]!;

/* ------------------------------------------------------------------ */
/* NURSE PROGRESSION (XP)                                              */
/* ------------------------------------------------------------------ */

export type NurseRank = { xp: number; title: string; perk: string };

export const NURSE_RANKS: NurseRank[] = [
  { xp: 0, title: "Bank Shift", perk: "Ward shop: upgrades unlocked" },
  { xp: 380, title: "Staff Nurse", perk: "Unlocks hiring staff" },
  { xp: 900, title: "Senior Nurse", perk: "Unlocks ward expansion" },
  { xp: 1700, title: "Ward Sister", perk: "Upgrades go one tier higher" },
  { xp: 2800, title: "Matron", perk: "Total ward legend" },
];


export function nurseRank(xp: number) {
  let index = 0;
  NURSE_RANKS.forEach((r, i) => {
    if (xp >= r.xp) index = i;
  });
  const current = NURSE_RANKS[index]!;
  const next = NURSE_RANKS[index + 1] ?? null;
  const span = next ? next.xp - current.xp : 1;
  return {
    index,
    level: index + 1,
    title: current.title,
    perk: current.perk,
    next,
    progress: next ? Math.min(1, (xp - current.xp) / span) : 1,
  };
}
