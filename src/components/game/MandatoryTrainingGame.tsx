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

  const choices = slide && slide.kind === "question"
    ? slide.correctFirst
      ? [{ label: slide.correct, correct: true }, { label: slide.wrong, correct: false }]
      : [{ label: slide.wrong, correct: false }, { label: slide.correct, correct: true }]
    : [];

  return (
    <div className="absolute inset-0 z-30 flex animate-slide-up flex-col gap-2 overflow-hidden bg-background/98 p-2 pb-[104px]">
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
            Mini-game · Level {level + 1}
          </p>
          <h2 className="font-display truncate text-3xl font-black leading-none">MANDATORY TRAINING</h2>
        </div>
        <p className="font-display shrink-0 text-xl font-black tabular-nums">{formatTime(elapsed)}</p>
      </div>

      <div className="flex items-center gap-2 px-1">
        <div className="h-4 flex-1 overflow-hidden rounded-sm border-2 border-foreground/70 bg-muted">
          <div className="h-full bg-calm transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-display w-12 text-right text-sm font-black tabular-nums">{progress}%</span>
      </div>

      {/* 32-bit pixel CRT terminal — fills the play area */}
      <div className="pixel-terminal relative flex min-h-0 flex-1 flex-col p-3 pb-1">
        <div className="pixel-screen training-crt relative min-h-0 flex-1 overflow-hidden">
          {hasDistractions && (
            <div className="pointer-events-none absolute right-2 top-2 z-20 flex gap-1">
              <span className="h-3 w-3 bg-alarm" />
              <span className="h-3 w-3 bg-gold" />
              <span className="h-3 w-3 bg-calm" />
            </div>
          )}

          {complete ? (
            <div className="training-slide training-slide-complete absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-6xl">🏆</span>
              <p className="mt-2 text-sm font-black uppercase tracking-widest text-primary">Module status</p>
              <h3 className="pixel-count text-4xl leading-none">Training complete!</h3>
              <p className="mt-3 text-base font-bold">Congratulations. You are now officially trained.</p>
              <p className="font-display mt-3 border-[3px] border-foreground/70 bg-calm px-4 py-2 text-2xl font-black tabular-nums text-calm-foreground">
                {formatTime(elapsedRef.current)}
              </p>
              <p className="mt-2 text-xs font-bold text-muted-foreground">Knowledge retained: absolutely none.</p>
            </div>
          ) : slide ? (
            <div
              key={index}
              className={cn(
                "training-slide absolute inset-0 flex flex-col p-4 transition duration-100",
                changing && "translate-x-3 opacity-0",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-block border-2 border-primary px-1.5 text-xs font-black uppercase tracking-widest text-primary">
                    {slide.eyebrow}
                  </p>
                  <h3 className={cn("font-display mt-2 font-black leading-[0.95] text-foreground", compact ? "text-2xl" : "text-3xl")}>
                    {slide.title}
                  </h3>
                </div>
                <span className="grid h-14 w-14 shrink-0 place-items-center border-[3px] border-foreground/70 bg-secondary text-3xl shadow-[3px_3px_0_0_var(--foreground)]">
                  {slide.icon}
                </span>
              </div>

              <div className="my-3 h-1.5 w-16 bg-primary" />
              <p className={cn("font-semibold leading-snug text-muted-foreground", compact ? "text-base" : "text-lg")}>
                {slide.body}
              </p>

              {hasDistractions && index % 3 === 2 && (
                <div className="pointer-events-none mt-3 flex h-14 items-end gap-1 border-2 border-foreground/40 bg-secondary/70 px-2 py-1">
                  {[45, 72, 38, 88, 61, 94].map((height, bar) => (
                    <span key={bar} className="flex-1 bg-primary/70" style={{ height: `${height}%` }} />
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3">
                {slide.kind === "continue" ? (
                  <button
                    onClick={advance}
                    className="pixel-btn w-full bg-primary py-4 font-display text-2xl font-black uppercase text-primary-foreground"
                  >
                    {slide.action} ▶
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {choices.map((choice) => (
                      <button
                        key={choice.label}
                        onClick={() => answer(choice.label, choice.correct)}
                        className={cn(
                          "pixel-btn min-h-20 px-2 py-3 font-display text-base font-black uppercase leading-tight",
                          choice.correct ? "bg-calm text-calm-foreground" : "bg-alarm text-alarm-foreground",
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

        <div className="flex h-8 items-center justify-between px-1 text-xs font-black text-[var(--training-label)]">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-calm shadow-[0_0_6px_var(--calm)]" />
            WARDMASTER 486
          </span>
          <span className="hidden gap-[3px] sm:flex">
            {Array.from({ length: 8 }, (_, i) => <span key={i} className="h-3 w-1 bg-[var(--training-slot)]" />)}
          </span>
          <span>{mistakes ? `${mistakes} MISCLICK${mistakes === 1 ? "" : "S"}` : "READY"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-sm font-bold text-muted-foreground">
        <span>Progress: {complete ? slides.length : index}/{slides.length}</span>
        <span className={cn(remaining < 5000 && "font-black text-alarm")}>Time left: {formatTime(remaining)}</span>
      </div>
    </div>
  );
}
