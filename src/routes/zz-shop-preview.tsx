import { createFileRoute } from "@tanstack/react-router";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { DEFAULT_CHARACTER } from "@/game/character";
export const Route = createFileRoute("/zz-shop-preview")({ component: () => (
  <div style={{ height: "100vh" }}><UpgradeScreen character={DEFAULT_CHARACTER} points={420} level={3}
    rank={{ level: 2, title: "Staff Nurse", perk: "+5% speed", next: { xp: 100, title: "Senior" }, progress: 0.4 }}
    upgrades={{} as never} bedCount={4} staff={[]} gear={[]} equippedGear={[]} bedUpgrades={[]} freshUnlocks={[]}
    onBuy={() => {}} onHire={() => {}} onBuyGear={() => {}} onToggleGear={() => {}} onBuyBedUpgrade={() => {}}
    onSave={() => {}} saveNote="" onBack={() => {}} onCustomise={() => {}} /></div>) });
