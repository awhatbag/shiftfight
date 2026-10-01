/**
 * Patient bed artwork registry. Each entry is a supplied sprite (never generated)
 * already normalised to the shared canvas: 1011px bed width, wheel baseline
 * aligned with the empty beds, transparent background.
 *
 * `gender` matches the patient roster naming so beds can pair a fitting sprite:
 * female titles (Ms/Mrs/Lady/Dame/Duchess), male titles (Mr/Sir/Baron), or
 * "nb" sprites which suit any patient. Right-side bays mirror the artwork.
 */
import patientFPlain01 from "@/assets/patient_f_plain_01.png.asset.json";
import patientNbPlain01 from "@/assets/patient_nb_plain_01.png.asset.json";
import patientNbPlain02 from "@/assets/patient_nb_plain_02.png.asset.json";
import patientNbPlain03 from "@/assets/patient_nb_plain_03.png.asset.json";
import patientFPoshHat01 from "@/assets/patient_f_posh-hat_01.png.asset.json";
import patientFSleeping01 from "@/assets/patient_f_sleeping_01.png.asset.json";
import patientFWorried01 from "@/assets/patient_f_worried_01.png.asset.json";
import patientMChildPillowfort from "@/assets/patient_m_child_pillowfort.png.asset.json";
import patientMMonocleElderly from "@/assets/patient_m_monocle_elderly.png.asset.json";
import patientMSleeping01 from "@/assets/patient_m_sleeping_01.png.asset.json";
import patientMVomiting01 from "@/assets/patient_m_vomiting_01.png.asset.json";

export type PatientBedSprite = {
  id: string;
  gender: "f" | "m" | "nb";
  asset: { url: string };
  /** canvas 1264×1100 (extra headroom for IV poles etc.) vs the standard 1264×848 */
  tall?: boolean;
};

export const PATIENT_BED_SPRITES: PatientBedSprite[] = [
  { id: "f_plain_01", gender: "f", asset: patientFPlain01 },
  { id: "f_posh-hat_01", gender: "f", asset: patientFPoshHat01, tall: true },
  { id: "f_sleeping_01", gender: "f", asset: patientFSleeping01, tall: true },
  { id: "f_worried_01", gender: "f", asset: patientFWorried01, tall: true },
  { id: "m_child_pillowfort", gender: "m", asset: patientMChildPillowfort, tall: true },
  { id: "m_monocle_elderly", gender: "m", asset: patientMMonocleElderly, tall: true },
  { id: "m_sleeping_01", gender: "m", asset: patientMSleeping01, tall: true },
  { id: "m_vomiting_01", gender: "m", asset: patientMVomiting01, tall: true },
  { id: "nb_plain_01", gender: "nb", asset: patientNbPlain01, tall: true },
  { id: "nb_plain_02", gender: "nb", asset: patientNbPlain02, tall: true },
  { id: "nb_plain_03", gender: "nb", asset: patientNbPlain03, tall: true },
];

/** roster name → preferred sprite gender (undefined = any) */
export function nameGender(name: string): "f" | "m" | undefined {
  if (/^(Ms|Mrs|Miss|Lady|Dame|Duchess) /.test(name)) return "f";
  if (/^(Mr|Sir|Baron|Lord) /.test(name)) return "m";
  return undefined;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
};

/**
 * Pick one distinct sprite per roster name where possible, falling back to
 * any unused sprite and finally reusing. Order of names matches bed order.
 */
export function pickPatientSprites(names: string[]): string[] {
  const pool = shuffle(PATIENT_BED_SPRITES.map((s) => s.id));
  const chosen: string[] = [];
  const used = new Set<string>();
  const take = (gender: "f" | "m" | undefined) => {
    const matches = pool.filter(
      (id) =>
        !used.has(id) &&
        (!gender ||
          PATIENT_BED_SPRITES.find((s) => s.id === id)!.gender !==
            (gender === "f" ? "m" : "f")),
    );
    const id =
      matches[0] ?? pool.find((p) => !used.has(p)) ?? pool[0] ?? "f_plain_01";
    used.add(id);
    chosen.push(id);
  };
  for (const name of names) take(nameGender(name));
  return chosen;
}
