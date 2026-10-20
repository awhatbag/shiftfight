import { describe, expect, it } from "vitest";
import { SummaryErrorBoundary } from "./SummaryErrorBoundary";

describe("summary error recovery", () => {
  it("leaves healthy summary content untouched", () => {
    const boundary = new SummaryErrorBoundary({ children: "results", onContinue: () => {} });
    expect(boundary.render()).toBe("results");
  });

  it("isolates a presentation error and retains the supplied continuation", () => {
    let destination = "summary";
    const onContinue = () => { destination = "fired"; };
    const boundary = new SummaryErrorBoundary({ children: "results", onContinue });
    boundary.state = SummaryErrorBoundary.getDerivedStateFromError();
    expect(boundary.state.failed).toBe(true);
    expect(boundary.render()).not.toBe("results");
    boundary.props.onContinue();
    expect(destination).toBe("fired");
  });
});