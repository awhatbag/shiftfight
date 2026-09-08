import { createFileRoute } from "@tanstack/react-router";
import { VomitGame } from "@/components/game/VomitGame";

export const Route = createFileRoute("/vomittest")({
  component: () => (
    <div className="relative mx-auto h-[100dvh] w-full max-w-md">
      <VomitGame level={2} paused={false} onDone={() => {}} />
    </div>
  ),
});
