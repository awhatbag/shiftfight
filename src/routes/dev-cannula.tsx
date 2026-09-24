import { createFileRoute } from "@tanstack/react-router";
import CannulaGame from "@/components/game/CannulaGame";
import { cn } from "@/lib/utils";

function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-2">
      <div className={cn("relative h-[720px] w-[400px] overflow-hidden rounded-2xl border-2 border-border")}>
        <CannulaGame level={2} paused={false} onDone={() => {}} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dev-cannula")({
  component: Page,
  head: () => ({ meta: [{ title: "Cannula harness" }] }),
});
