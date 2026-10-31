import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { stopAllSounds } from "@/lib/sfx";
import { stopAllMusic } from "@/lib/music";

/** Unmount failed gameplay without completing a shift or changing progression. */
export class GameErrorBoundary extends Component<
  { children: ReactNode; screen: "ward" | "shop"; onReturn: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    stopAllSounds();
    stopAllMusic();
    reportLovableError(error, { boundary: this.props.screen, componentStack: info.componentStack });
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h2 className="pixel-count text-2xl">{this.props.screen === "ward" ? "Ward interrupted!" : "Cupboard jammed!"}</h2>
        <p className="text-sm font-bold">{this.props.screen === "ward"
          ? "This shift couldn't continue. Your previously saved progress is unchanged."
          : "The shop couldn't be displayed. Your current points and equipment are still kept."}</p>
        <Button onClick={this.props.onReturn} className="chunky chunky-press h-auto w-full py-4 font-display text-lg font-black uppercase">Return to title →</Button>
      </div>
    );
  }
}