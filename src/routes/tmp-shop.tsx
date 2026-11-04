import { createFileRoute } from "@tanstack/react-router";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { DEFAULT_CHARACTER } from "@/game/character";

export const Route = createFileRoute("/tmp-shop")({
  component: () => (
    <div className="h-screen">
      <UpgradeScreen
        character={DEFAULT_CHARACTER}
        points={1957}
        level={3}
        rank={{ level: 2, title: "Bank Shift", perk: "", next: { xp: 100, title: "Staff Nurse" }, progress: 0.4 }}
        upgrades={{} as never}
        bedCount={4}
        staff={[]}
        gear={[]}
        equippedGear={[]}
        bedUpgrades={[]}
        freshUnlocks={[]}
        onBuy={() => {}}
        onHire={() => {}}
        onBuyGear={() => {}}
        onToggleGear={() => {}}
        onBuyBedUpgrade={() => {}}
        onSave={() => {}}
        saveNote=""
        onBack={() => {}}
        onCustomise={() => {}}
      />
    </div>
  ),
});
