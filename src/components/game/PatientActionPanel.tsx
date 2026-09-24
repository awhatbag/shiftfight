import { ACTION_META, type ActionKind } from "@/game/config";
import { isCatastropheEvent } from "@/game/catastrophes";
import { cn } from "@/lib/utils";
import type { BedState } from "./Bed";
import type { ActiveEvent } from "./wardTypes";

export function PatientActionPanel({ event, beds, nurseHereBed, onAction }: { event: ActiveEvent | undefined; beds: BedState[]; nurseHereBed: number | null; onAction: (action: ActionKind) => void }) {
  return <div className={cn("absolute inset-x-0 bottom-0 z-30", event ? "max-h-[58%] overflow-y-auto rounded-t-3xl border-t-2 border-border bg-card px-3 pb-4 pt-3 shadow-[0_-10px_24px_-16px_oklch(0_0_0/0.5)]" : "pointer-events-none px-2 pb-1")}>
    {event ? <div className="animate-slide-up space-y-1.5">{(() => {
      const here = nurseHereBed === event.bed;
      return <><div className="flex items-start gap-2"><span className="text-3xl leading-none">{here ? event.def.icon : "🚶‍♀️"}</span><div className="min-w-0"><p className="font-display truncate text-base font-black uppercase">{beds[event.bed]?.name}{here ? ` — ${event.def.label}` : " — on my way"}</p><p className={cn("font-bold leading-snug", here ? "text-2xl text-foreground" : "text-base text-muted-foreground")}>{here ? (isCatastropheEvent(event.def) ? <>{event.def.callLine && <span className="block">“{event.def.callLine}”</span>}<span className="mt-1 block">{event.def.brief}</span></> : event.def.brief) : "Walking over… you'll see what they want on arrival."}</p></div></div>
      {here ? <div className="grid grid-cols-3 gap-1.5">{(Object.keys(event.def.options) as ActionKind[]).map((action) => <button key={action} onClick={() => onAction(action)} className={cn("chunky chunky-press flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5", ACTION_META[action].color)}><span className="text-2xl leading-none">{ACTION_META[action].icon}</span><span className="font-display text-xs font-black">{action}</span><span className="text-xs font-semibold leading-tight opacity-95">{event.def.options[action]}</span></button>)}</div> : <div className="grid grid-cols-3 gap-1.5">{[0,1,2].map((i) => <div key={i} className="flex flex-col items-center gap-0.5 rounded-2xl bg-muted px-1 py-1.5 opacity-70"><span className="text-xl leading-none">❓</span><span className="font-display text-[11px] font-black text-muted-foreground">???</span></div>)}</div>}</>;
    })()}</div> : null}
  </div>;
}
