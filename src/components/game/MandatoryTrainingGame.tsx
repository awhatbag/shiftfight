import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { playBad, playGood, playPop } from "@/lib/sfx";
import type { MiniGameProps } from "@/game/minigames";

type ContinueSlide = {
  kind: "continue";
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  icon: string;
};

type QuestionSlide = {
  kind: "question";
  eyebrow: string;
  title: string;
  body: string;
  correct: string;
  wrong: string;
  icon: string;
  correctFirst: boolean;
};

type TrainingSlide = ContinueSlide | QuestionSlide;

const CONTINUE_SLIDES: ContinueSlide[] = [
  {
    kind: "continue",
    eyebrow: "Welcome module",
    title: "Mandatory training",
    body: "Because apparently you have to do this.",
    action: "Next",
    icon: "📋",
  },
  {
    kind: "continue",
    eyebrow: "Infection control",
    title: "Hand hygiene is important",
    body: "This remains true since the last slideshow.",
    action: "Continue",
    icon: "🫧",
  },
  {
    kind: "continue",
    eyebrow: "Important information",
    title: "Please read carefully",
    body: "This slide contains important information.",
    action: "I have read it",
    icon: "👓",
  },
  {
    kind: "continue",
    eyebrow: "Policy update",
    title: "Nothing has changed",
    body: "Please familiarise yourself with the change.",
    action: "Next",
    icon: "🔄",
  },
  {
    kind: "continue",
    eyebrow: "Acknowledgement",
    title: "Confirm understanding",
    body: "By clicking below, you confirm you read all of that.",
    action: "I understand",
    icon: "✅",
  },
  {
    kind: "continue",
    eyebrow: "Data protection",
    title: "Keep data secure",
    body: "Do not leave it next to the communal biscuits.",
    action: "Continue",
    icon: "🔐",
  },
  {
    kind: "continue",
    eyebrow: "Moving & handling",
    title: "Bend responsibly",
    body: "Your back has submitted a formal request.",
    action: "Next",
    icon: "📦",
  },
  {
    kind: "continue",
    eyebrow: "Professional conduct",
    title: "Remain professional",
    body: "Even when the printer makes that noise again.",
    action: "Noted",
    icon: "🤝",
  },
  {
    kind: "continue",
    eyebrow: "Annual refresher",
    title: "You saw this last year",
    body: "We changed the title colour, so it is new now.",
    action: "Continue",
    icon: "🎓",
  },
  {
    kind: "continue",
    eyebrow: "Essential learning",
    title: "Please stay engaged",
    body: "Your engagement has been recorded as 'extremely rapid'.",
    action: "Next",
    icon: "📈",
  },
  {
    kind: "continue",
    eyebrow: "Governance",
    title: "A framework exists",
    body: "It has arrows, circles and a very confident font.",
    action: "Acknowledge",
    icon: "⭕",
  },
  {
    kind: "continue",
    eyebrow: "Final declaration",
    title: "Nearly officially trained",
    body: "No learning outcomes were harmed in this process.",
    action: "Finish module",
    icon: "🏁",
  },
];

const QUESTION_SLIDES: Omit<QuestionSlide, "correctFirst">[] = [
  {
    kind: "question",
    eyebrow: "Workplace safety",
    title: "You see a hazard. What do you do?",
    body: "Choose the approved response.",
    correct: "Report it",
    wrong: "Blame Barry",
    icon: "⚠️",
  },
  {
    kind: "question",
    eyebrow: "Fire safety",
    title: "You discover a fire. What now?",
    body: "Select your immediate action.",
    correct: "Raise the alarm",
    wrong: "Hide in the staff room",
    icon: "🔥",
  },
  {
    kind: "question",
    eyebrow: "Workplace wellbeing",
    title: "How are you feeling today?",
    body: "Please choose the most corporate answer.",
    correct: "Fine",
    wrong: "I am currently on fire",
    icon: "🌱",
  },
  {
    kind: "question",
    eyebrow: "IT security",
    title: "A stranger asks for your password.",
    body: "What is the safest response?",
    correct: "Do not share it",
    wrong: "Put it on a sticky note",
    icon: "🛡️",
  },
  {
    kind: "question",
    eyebrow: "Manual handling",
    title: "The box is too heavy.",
    body: "What should happen next?",
    correct: "Ask for help",
    wrong: "Challenge it to a duel",
    icon: "🏋️",
  },
  {
    kind: "question",
    eyebrow: "Confidentiality",
    title: "You find private paperwork.",
    body: "Choose the sensible option.",
    correct: "Store it securely",
    wrong: "Read it over the tannoy",
    icon: "📁",
  },
  {
    kind: "question",
    eyebrow: "Computer skills",
    title: "The computer has frozen.",
    body: "What should you do?",
    correct: "Call IT",
    wrong: "Put a blanket on it",
    icon: "🖥️",
  },
  {
    kind: "question",
    eyebrow: "Workplace wellbeing",
    title: "Are you still with us?",
    body: "Select one answer.",
    correct: "Yes",
    wrong: "I have joined the computer",
    icon: "🧠",
  },
];

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildTraining(level: number): TrainingSlide[] {
  const count = Math.min(14, 7 + Math.floor(level * 0.8));
  const questionCount = Math.min(5, 2 + Math.floor(level / 3));
  const questions: QuestionSlide[] = shuffled(QUESTION_SLIDES)
    .slice(0, questionCount)
    .map((slide) => ({ ...slide, correctFirst: Math.random() > 0.5 }));
  const information = shuffled(CONTINUE_SLIDES).slice(0, count - questionCount);
  const opening = CONTINUE_SLIDES[0];
  if (!opening) return questions;
  const rest = shuffled([
    ...information.filter((slide) => slide !== opening),
    ...questions,
  ]);
  return [opening, ...rest].slice(0, count);
}

function formatTime(ms: number) {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const hundredths = Math.floor((safe % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function MandatoryTrainingGame({ level, paused, onDone }: MiniGameProps) {
  const slides = useMemo(() => buildTraining(level), [level]);
  const totalMs = 12500 + slides.length * 1150;
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [changing, setChanging] = useState(false);
  const elapsedRef = useRef(0);
  const mistakesRef = useRef(0);
  const doneRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current && !doneRef.current) {
        elapsedRef.current += now - last;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= totalMs) finish(false);
      }
      last = now;
    }, 40);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(success: boolean) {
    if (doneRef.current) return;
    doneRef.current = true;
    const progress = index / slides.length;
    if (!success) {
      playBad();
      window.setTimeout(() => onDone(Math.max(10, Math.round(progress * 55)), false), 650);
      return;
    }

    const remaining = Math.max(0, 1 - elapsedRef.current / totalMs);
    const score = Math.max(
      20,
      Math.round(70 + remaining * 190 + level * 5 - mistakesRef.current * 18),
    );
    setComplete(true);
    playGood();
    window.setTimeout(
      () => onDone(score, mistakesRef.current === 0 && remaining > 0.35),
      1100,
    );
  }

  function advance() {
    if (pausedRef.current || changing || doneRef.current) return;
    playPop();
    if (index + 1 >= slides.length) {
      finish(true);
      return;
    }
    setChanging(true);
    window.setTimeout(() => {
      setIndex((current) => current + 1);
      setWrongChoice(null);
      setChanging(false);
    }, 90);
  }

  function answer(label: string, correct: boolean) {
    if (pausedRef.current || changing || doneRef.current) return;
    if (correct) {
      advance();
      return;
    }
    playBad();
    mistakesRef.current += 1;
    setMistakes(mistakesRef.current);
    elapsedRef.current = Math.min(totalMs, elapsedRef.current + 900);
    setElapsed(elapsedRef.current);
    setWrongChoice(label);
    window.setTimeout(() => setWrongChoice(null), 320);
  }

  const slide = slides[index];
  const progress = complete ? 100 : Math.round((index / slides.length) * 100);
  const remaining = Math.max(0, totalMs - elapsed);
  const compact = level >= 6;
  const hasDistractions = level >= 4;

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 overflow-hidden bg-background/98 p-3 pb-[104px]">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-bold uppercase tracking-widest text-primary">
            Mini-game · Level {level + 1}
          </p>
          <h2 className="font-display truncate text-2xl font-black leading-none">
            MANDATORY TRAINING
          </h2>
        </div>
        <p className="font-display shrink-0 text-lg font-black tabular-nums">
          {formatTime(elapsed)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-calm transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-display w-10 text-right text-xs font-black tabular-nums">
          {progress}%
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-2xl bg-[var(--training-desk)] px-2 py-2 shadow-inner">
        <div className="mx-auto flex w-full max-w-[560px] items-center justify-center gap-1.5">
          <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center">
            <div className="relative flex aspect-[4/3] w-full flex-col rounded-[18px] border-[7px] border-[var(--training-plastic-edge)] bg-[var(--training-plastic)] p-2 shadow-[inset_0_0_0_3px_var(--training-plastic-highlight),0_7px_0_var(--training-plastic-shadow)]">
              <div className="absolute left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-calm shadow-[0_0_6px_var(--calm)]" />
              <div className="training-crt relative min-h-0 flex-1 overflow-hidden rounded-[14px] border-4 border-[var(--training-bezel)] bg-[var(--training-screen)] shadow-[inset_0_0_22px_var(--training-screen-shadow)]">
                {hasDistractions && (
                  <div className="pointer-events-none absolute right-2 top-2 z-20 flex gap-1 opacity-70">
                    <span className="h-2 w-2 rounded-full bg-alarm" />
                    <span className="h-2 w-2 rounded-full bg-gold" />
                    <span className="h-2 w-2 rounded-full bg-calm" />
                  </div>
                )}

                {complete ? (
                  <div className="training-slide training-slide-complete absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-4xl">🏆</span>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      Module status
                    </p>
                    <h3 className="font-display text-2xl font-black uppercase leading-none">
                      Training complete!
                    </h3>
                    <p className="mt-2 text-xs font-bold">
                      Congratulations. You are now officially trained.
                    </p>
                    <p className="font-display mt-3 rounded-lg bg-calm px-3 py-1.5 text-lg font-black tabular-nums text-calm-foreground">
                      {formatTime(elapsedRef.current)}
                    </p>
                    <p className="mt-2 text-[9px] font-bold text-muted-foreground">
                      Knowledge retained: absolutely none.
                    </p>
                  </div>
                ) : slide ? (
                  <div
                    key={index}
                    className={cn(
                      "training-slide absolute inset-0 flex flex-col p-3 transition duration-100",
                      changing && "translate-x-3 opacity-0",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary">
                          {slide.eyebrow}
                        </p>
                        <h3
                          className={cn(
                            "font-display mt-0.5 font-black leading-[0.95] text-foreground",
                            compact ? "text-base" : "text-lg",
                          )}
                        >
                          {slide.title}
                        </h3>
                      </div>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-xl">
                        {slide.icon}
                      </span>
                    </div>

                    <div className="my-2 h-1 w-12 rounded-full bg-primary" />
                    <p className={cn("font-semibold leading-tight text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
                      {slide.body}
                    </p>

                    {hasDistractions && index % 3 === 2 && (
                      <div className="pointer-events-none mt-2 flex h-8 items-end gap-1 rounded-lg bg-secondary/70 px-2 py-1">
                        {[45, 72, 38, 88, 61, 94].map((height, bar) => (
                          <span
                            key={bar}
                            className="flex-1 rounded-t-sm bg-primary/60"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      {slide.kind === "continue" ? (
                        <button
                          onClick={advance}
                          className={cn(
                            "chunky chunky-press w-full rounded-lg bg-primary font-display font-black uppercase text-primary-foreground",
                            compact ? "py-2 text-sm" : "py-3 text-base",
                          )}
                        >
                          {slide.action} ▶
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            slide.correctFirst
                              ? [
                                  { label: slide.correct, correct: true },
                                  { label: slide.wrong, correct: false },
                                ]
                              : [
                                  { label: slide.wrong, correct: false },
                                  { label: slide.correct, correct: true },
                                ]
                          ).map((choice) => (
                            <button
                              key={choice.label}
                              onClick={() => answer(choice.label, choice.correct)}
                              className={cn(
                                "chunky chunky-press min-h-12 rounded-lg px-1.5 font-display font-black uppercase leading-tight",
                                compact ? "py-2 text-[10px]" : "py-3 text-xs",
                                choice.correct
                                  ? "bg-calm text-calm-foreground"
                                  : "bg-alarm text-alarm-foreground",
                                wrongChoice === choice.label && "animate-shake",
                              )}
                            >
                              {choice.correct ? "🟢" : "🔴"} {choice.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex h-5 items-center justify-between px-1 pt-1 text-[7px] font-black text-[var(--training-label)]">
                <span>WARDMASTER 486</span>
                <span>{mistakes ? `${mistakes} MISCLICK${mistakes === 1 ? "" : "S"}` : "READY"}</span>
              </div>
            </div>

            <div className="h-3 w-20 bg-[var(--training-plastic-edge)]" />
            <div className="h-2 w-32 rounded-t-md bg-[var(--training-plastic)] shadow-md" />
          </div>

          <div className="flex h-[68%] w-12 shrink-0 flex-col rounded-md border-4 border-[var(--training-plastic-edge)] bg-[var(--training-plastic)] px-1 py-2 shadow-[3px_5px_0_var(--training-plastic-shadow)]">
            <div className="mx-auto h-1.5 w-7 rounded-sm bg-[var(--training-slot)]" />
            <div className="mx-auto mt-2 h-1 w-6 rounded-sm bg-[var(--training-slot)]" />
            <div className="mt-auto space-y-1">
              <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-calm" />
              <span className="mx-auto block h-3 w-3 rounded-full border-2 border-[var(--training-plastic-shadow)]" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-2 flex w-[90%] max-w-[500px] items-end gap-2">
          <div className="training-keyboard grid h-12 flex-1 grid-cols-12 gap-[2px] rounded-lg border-4 border-[var(--training-plastic-edge)] bg-[var(--training-plastic)] p-1.5 shadow-[0_4px_0_var(--training-plastic-shadow)]">
            {Array.from({ length: 36 }, (_, key) => (
              <span key={key} className="rounded-[1px] bg-[var(--training-key)] shadow-[0_1px_0_var(--training-key-shadow)]" />
            ))}
          </div>
          <div className="h-10 w-7 rounded-[50%_50%_42%_42%] border-4 border-[var(--training-plastic-edge)] bg-[var(--training-plastic)] shadow-[2px_3px_0_var(--training-plastic-shadow)]">
            <span className="mx-auto mt-1 block h-3 w-px bg-[var(--training-plastic-shadow)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
        <span>Training progress: {index}/{slides.length}</span>
        <span className={cn(remaining < 5000 && "font-black text-alarm")}>
          Time left: {formatTime(remaining)}
        </span>
      </div>
    </div>
  );
}