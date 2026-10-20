import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/** Keep a summary rendering failure local: rewards have already been saved. */
export class SummaryErrorBoundary extends Component<
  { children: ReactNode; onContinue: () => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportLovableError(error, {
      boundary: "shift_summary",
      componentStack: info.componentStack,
    });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        <h2 className="pixel-count text-3xl">Shift complete!</h2>
        <p className="text-sm font-bold">The results couldn't be displayed. Your earned rewards are still kept.</p>
        <Button onClick={this.props.onContinue} className="chunky chunky-press h-auto w-full py-4 font-display text-lg font-black uppercase">
          Continue →
        </Button>
      </div>
    );
  }
}