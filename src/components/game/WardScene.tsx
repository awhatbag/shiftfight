import type { RefObject } from "react";
import wardBackgroundAsset from "@/assets/shift-fight-ward-spring-background.png.asset.json";
import curtainAsset from "@/assets/curtain-partition.png.asset.json";
import nursesStationAsset from "@/assets/nurses-station.png.asset.json";
import { STAFF, URGENCY_META, urgencyOf } from "@/game/config";
import type { PlayerCharacter } from "@/game/character";
import { BED_SLOTS, GATES, STATION_CHAIRS, STATION_FRAME, stationChair, type Point } from "@/game/wardNav";
import { cn } from "@/lib/utils";
import { Bed, type BedState } from "./Bed";
import { Nurse, type NurseAction, type NurseDirection } from "./Nurse";
import { CatastropheHazardLayer } from "./CatastropheHazardLayer";
import type { ActiveEvent, RollingHazard, StaffRuntime } from "./wardTypes";

export function WardScene({ wardRef, level, levelName, beds, events, flash, selected, nurseHereBed, onTapBed, onGoStation, staff, staffRuntime, staffPositions, staffHome, staffFlash, redAlert, onTapStaff, character, nurse, walking, nurseAction, nurseDirection, hazards, hazardSprites, now }: {
  wardRef: RefObject<HTMLDivElement | null>; level: number; levelName: string; beds: BedState[]; events: ActiveEvent[];
  flash: Record<number, "good" | "bad" | null>; selected: number | null; nurseHereBed: number | null;
  onTapBed: (bed: number) => void; onGoStation: () => void; staff: string[]; staffRuntime: Record<string, StaffRuntime>;
  staffPositions: Record<string, Point>; staffHome: (key: string) => Point; staffFlash: string | null; redAlert: boolean;
  onTapStaff: (key: string) => void; character: PlayerCharacter; nurse: Point; walking: boolean;
  nurseAction: NurseAction; nurseDirection: NurseDirection; hazards: RollingHazard[]; hazardSprites: string[]; now: number;
}) {
  const selectedEvent = events.find((event) => event.bed === selected);
  return <div ref={wardRef} className="ward-viewport relative flex-1 select-none overflow-hidden bg-ward-deep"><div className="ward-world">
    <img src={wardBackgroundAsset.url} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover" draggable={false}/>
    <div className="absolute z-10" style={{ left: `${STATION_FRAME.x * 100}%`, top: `${STATION_FRAME.y * 100}%`, width: `${STATION_FRAME.width * 100}%`, height: `${STATION_FRAME.height * 100}%` }}>
      <button onClick={onGoStation} className="pointer-events-auto absolute inset-0 text-left" aria-label="Return to nurses station"><img src={nursesStationAsset.url} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain"/><div className="absolute bottom-[17%] left-1/2 w-[22%] -translate-x-1/2 text-center text-primary-foreground"><p className="font-display truncate text-[9px] font-black uppercase leading-none">Lv {level}</p><p className="font-display truncate text-[6px] font-black uppercase leading-none">{levelName}</p></div></button>
      <div className="pointer-events-none absolute inset-0" aria-label="Five station chairs">{Array.from({ length: 5 }, (_, index) => {
        const staffKey = index > 0 ? staff[index - 1] : undefined;
        const info = staffKey ? STAFF.find((member) => member.key === staffKey) : undefined;
        const runtime = staffKey ? staffRuntime[staffKey] : undefined;
        const playerSeated = index === 0 && !walking && nurseHereBed === null;
        const seated = playerSeated || (!!staffKey && !runtime?.eventId && !runtime?.path.length);
        const activated = !!staffKey && seated && redAlert;
        const chair = stationChair(index);
        return <button key={index} onClick={() => staffKey ? onTapStaff(staffKey) : onGoStation()} aria-label={staffKey ? `Send ${info?.name ?? "staff"}` : index === 0 ? "Nurse chair" : "Empty chair"} className={cn("pointer-events-auto absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center text-xl", activated && "animate-throb rounded-full ring-4 ring-alarm/30")} style={{ left: `${chair.x * 100}%`, top: `${chair.y * 100}%` }}><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full">{playerSeated ? <span className="block h-[52px] w-[41px] overflow-hidden"><Nurse character={character} action="sit" direction="north"/></span> : seated && info ? info.icon : ""}</span></button>;
      })}</div>
    </div>
    <div className="pointer-events-none absolute" style={{ left: `${STATION_FRAME.x * 100}%`, top: `${STATION_FRAME.y * 100}%`, width: `${STATION_FRAME.width * 100}%`, height: `${STATION_FRAME.height * 100}%`, zIndex: Math.round((STATION_FRAME.y + STATION_FRAME.height) * 100), clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 13% 24%, 13% 62%, 87% 62%, 87% 24%, 13% 24%)" }}><img src={nursesStationAsset.url} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full object-contain"/></div>
    {GATES.map((gate) => <div key={gate.y} className="pointer-events-none absolute overflow-visible" style={{ top: `${gate.box.top * 100}%`, left: `${gate.box.left * 100}%`, width: `${gate.box.width * 100}%`, height: `${gate.box.height * 100}%`, zIndex: Math.round((gate.y + 0.0325) * 100) }}><img src={curtainAsset.url} alt="" aria-hidden="true" draggable={false} className="h-full w-full object-fill" style={{ transform: gate.side === "right" ? "scaleX(-1)" : undefined }}/></div>)}
    {staff.map((key) => {
      const info = STAFF.find((member) => member.key === key); const runtime = staffRuntime[key]; const position = staffPositions[key] ?? staffHome(key); const onJob = !!runtime && (runtime.eventId !== null || runtime.path.length > 0); const activated = !onJob && redAlert;
      return onJob ? <button key={key} onClick={() => onTapStaff(key)} aria-label={`Send ${info?.name ?? "staff"}`} className="absolute z-20 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}><span className={cn("grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-card text-xl shadow-md", onJob && "animate-throb border-primary", activated && "animate-throb border-alarm ring-4 ring-alarm/40", staffFlash === key && "animate-pop")}>{info?.icon ?? "🧑‍⚕️"}</span></button> : null;
    })}
    {beds.map((bed) => { const slot = BED_SLOTS[bed.id]; if (!slot) return null; const event = events.find((candidate) => candidate.bed === bed.id); const urgency = event ? urgencyOf(event.def) : null; return <div key={bed.id} className="absolute h-[14%] w-[26%]" style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, transform: "translate(-50%,-50%)", zIndex: Math.round(slot.y * 100) }}>{urgency && urgency !== "routine" && level <= 3 && <span className={cn("font-display absolute -bottom-1 right-1 z-20 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", URGENCY_META[urgency].chip, urgency === "critical" && "animate-throb")}>{URGENCY_META[urgency].label}</span>}<Bed bed={bed} event={event?.def} progress={event ? 1 - (now - event.born) / event.ttl : 0} flash={flash[bed.id] ?? null} active={selected === bed.id} nurseHere={nurseHereBed === bed.id} revealed={nurseHereBed === bed.id} onTap={() => onTapBed(bed.id)}/></div>; })}
    <CatastropheHazardLayer hazards={hazards} sprites={hazardSprites} now={now}/>
    <div className="pointer-events-none absolute inset-0 z-[4]">{beds.map((bed) => { const slot = BED_SLOTS[bed.id]; if (!slot) return null; return <div key={`sh-bed-${bed.id}`} className="absolute rounded-[50%] bg-black/45 blur-[5px]" style={{ left: `${slot.x * 100}%`, top: `${(slot.y + 0.042) * 100}%`, width: "25%", height: "6%", transform: "translate(-50%,-50%)" }}/>; })}{GATES.map((gate) => <div key={`sh-curtain-${gate.y}`} className="absolute rounded-[50%] bg-black/45 blur-[5px]" style={{ left: `${(gate.box.left + gate.box.width / 2) * 100}%`, top: `${(gate.box.top + gate.box.height - 0.02) * 100}%`, width: `${gate.box.width * 88}%`, height: "4.5%", transform: "translate(-50%,-50%)" }}/>)}</div>
    <div className={cn("pointer-events-none absolute h-[84px] w-[62px] transition-all ease-linear", !walking && nurseHereBed === null && "invisible")} style={{ left: `${nurse.x * 100}%`, top: `${nurse.y * 100}%`, transform: "translate(-50%,-80%)", transitionDuration: "80ms", zIndex: Math.round(nurse.y * 100) + 1 }}><Nurse character={character} moving={walking} action={nurseAction} direction={nurseDirection} expression={selectedEvent && nurseHereBed !== null ? "concerned" : "neutral"}/></div>
  </div></div>;
}
