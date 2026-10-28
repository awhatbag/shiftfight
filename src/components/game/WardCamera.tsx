import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/** Presentation-only camera: every ward object retains its original world coordinates. */
export function WardCamera({ children, nurseY, viewportRef, panelRef, frozen }: {
  children: ReactNode;
  nurseY: number;
  viewportRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  frozen: boolean;
}) {
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const target = useRef(0);
  const offset = useRef(0);
  const position = useRef(nurseY);
  position.current = nurseY;

  useEffect(() => {
    const viewport = viewportRef.current;
    const camera = cameraRef.current;
    const panel = panelRef.current;
    const world = camera?.querySelector<HTMLElement>(".ward-world");
    if (!viewport || !camera || !world) return;
    const measure = () => {
      const bounds = viewport.getBoundingClientRect();
      const panelTop = panel?.getBoundingClientRect().top ?? bounds.bottom;
      const available = Math.max(100, Math.min(bounds.height, panelTop - bounds.top) - 16);
      const worldHeight = world.offsetHeight;
      const feet = (bounds.height - worldHeight) / 2 + position.current * worldHeight;
      // Keep the nurse's body near the centre of the unobscured ward, panning south only.
      target.current = Math.max(0, feet - (available * 0.55 + 34));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(world);
    if (panel) observer.observe(panel);
    return () => observer.disconnect();
  }, [viewportRef, panelRef, nurseY]);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera || frozen) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const delta = Math.min(50, now - previous);
      previous = now;
      offset.current = reducedMotion.matches ? target.current : offset.current + (target.current - offset.current) * (1 - Math.exp(-delta / 180));
      if (Math.abs(target.current - offset.current) < 0.1) offset.current = target.current;
      camera.style.transform = `translate3d(0, ${-offset.current}px, 0)`;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [frozen]);

  return <div ref={cameraRef} className="ward-camera absolute inset-0">{children}</div>;
}