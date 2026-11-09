import { useEffect, useState } from "react";
import avocado from "@/assets/avocado1.png.asset.json";
import goose from "@/assets/goose-walking_goose.png.asset.json";
import pillow from "@/assets/pillow1.png.asset.json";
import { addTitleProp, liveTitleProps, nextTitleSpawnDelay, TITLE_PROP_LIFE, type TitleProp, type TitlePropKind } from "@/game/titleAmbience";

/** Title-only decoration: no ward runtime, collision handlers, audio or gameplay state. */
export function TitleAmbience() {
  const [props, setProps] = useState<TitleProp[]>([]);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nextSpawn = Date.now() + nextTitleSpawnDelay();
    let id = 0;
    let previous: TitlePropKind | undefined;
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (document.hidden || reducedMotion.matches) {
        setProps(current => current.length ? [] : current);
        nextSpawn = now + nextTitleSpawnDelay();
        return;
      }
      if (now >= nextSpawn) {
        const kinds = (["avocado", "goose", "pillow"] as TitlePropKind[]).filter(kind => kind !== previous);
        const kind = kinds[Math.floor(Math.random() * kinds.length)] ?? "pillow";
        previous = kind;
        const prop: TitleProp = { id: ++id, kind, born: now, life: TITLE_PROP_LIFE[kind], y: 65 + Math.random() * 24, x: 15 + Math.random() * 70, reverse: Math.random() < 0.5 };
        setProps(current => addTitleProp(current, prop, now));
        nextSpawn = now + nextTitleSpawnDelay();
      } else {
        setProps(current => {
          const live = liveTitleProps(current, now);
          return live.length === current.length ? current : live;
        });
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return <div aria-hidden="true" data-title-ambience className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
    {props.map(prop => <div key={prop.id} data-title-prop={prop.kind} className={`title-prop title-prop-${prop.kind} ${prop.reverse ? "title-prop-reverse" : ""}`} style={{ top: `${prop.y}%`, left: prop.kind === "pillow" ? `${prop.x}%` : undefined }}>
      {prop.kind === "goose" ? <div className={`title-goose-frames ${prop.reverse ? "title-goose-face-right" : ""}`} style={{ backgroundImage: `url(${goose.url})` }} /> : <>
        {prop.kind === "pillow" && <span className="title-pillow-star text-gold">★</span>}
        <img src={prop.kind === "avocado" ? avocado.url : pillow.url} alt="" draggable={false} className={prop.kind === "avocado" ? "title-avocado-roll" : "title-pillow-pop"} />
      </>}
    </div>)}
  </div>;
}