import { describe, expect, it, vi } from "vitest";
import { GameErrorBoundary } from "./GameErrorBoundary";
import { stopAllMusic } from "@/lib/music";
import { stopAllSounds } from "@/lib/sfx";
vi.mock("@/lib/music", () => ({ stopAllMusic: vi.fn() }));
vi.mock("@/lib/sfx", () => ({ stopAllSounds: vi.fn() }));
vi.mock("@/lib/lovable-error-reporting", () => ({ reportLovableError: vi.fn() }));

describe("local screen recovery", () => {
  for (const screen of ["ward", "shop"] as const) {
    it(`unmounts failed ${screen} and preserves the supplied return destination`, () => {
      let phase = screen as string;
      const boundary = new GameErrorBoundary({ children: "healthy", screen, onReturn: () => { phase = "intro"; } });
      expect(boundary.render()).toBe("healthy");
      boundary.state = GameErrorBoundary.getDerivedStateFromError();
      boundary.componentDidCatch(Error("render failed"), { componentStack: "" });
      expect(boundary.render()).not.toBe("healthy");
      expect(stopAllSounds).toHaveBeenCalled();
      expect(stopAllMusic).toHaveBeenCalled();
      boundary.props.onReturn();
      expect(phase).toBe("intro");
    });
  }
});
