import { createFileRoute } from "@tanstack/react-router";
import { UpgradeScreen } from "@/components/game/UpgradeScreen";
import { DEFAULT_CHARACTER } from "@/game/character";
export const Route = createFileRoute("/tmp-shop")({ component: () => (
  <div className="h-screen"><UpgradeScreen character={DEFAULT_CHARACTER as any} points={9000} level={3}
    rank={{ level: 2, title: "Staff Nurse", perk: "", next: { xp: 1, title: "Charge" }, progress: 0.4 }}
    upgrades={{ speed: 1, response: 0, equipment: 2 } as any} bedCount={4} staff={["barry"]} gear={["clogs"]} equippedGear={["clogs"]}
    bedUpgrades={[]} freshUnlocks={[]} onBuy={()=>{}} onHire={()=>{}} onBuyGear={()=>{}} onToggleGear={()=>{}} onBuyBedUpgrade={()=>{}}
    onSave={()=>{}} saveNote="" onBack={()=>{}} /></div>) });
