export type Preset = {
  name: string;
  slug: string;
  kind: "photo" | "signature";
  width: number;
  height: number;
  minKB: number;
  maxKB: number;
  targetKB?: number;
  textOverlay: boolean;
};
// Single source of truth. Add a portal by adding an entry here (and to GROUPS).
export const PRESETS = {
  kerala_psc_photo: {
    name: "Kerala PSC (Thulasi) Photo",
    slug: "kerala-psc-photo",
    kind: "photo",
    width: 150,
    height: 200,
    minKB: 10,
    maxKB: 30,
    targetKB: 25,
    textOverlay: true,
  },
  kerala_psc_sign: {
    name: "Kerala PSC Signature",
    slug: "kerala-psc-signature",
    kind: "signature",
    width: 150,
    height: 100,
    minKB: 5,
    maxKB: 30,
    textOverlay: false,
  },
  indian_passport: {
    name: "Passport Seva (General)",
    slug: "passport-photo",
    kind: "photo",
    width: 500,
    height: 500,
    minKB: 20,
    maxKB: 100,
    textOverlay: false,
  },
  pan_card_photo: {
    name: "PAN Card Photo",
    slug: "pan-photo",
    kind: "photo",
    width: 213,
    height: 213,
    minKB: 5,
    maxKB: 30,
    textOverlay: false,
  },
  pan_card_sign: {
    name: "PAN Card Signature",
    slug: "pan-signature",
    kind: "signature",
    width: 400,
    height: 200,
    minKB: 5,
    maxKB: 50,
    textOverlay: false,
  },
  mvd_license_photo: {
    name: "Kerala MVD Photo",
    slug: "mvd-photo",
    kind: "photo",
    width: 420,
    height: 525,
    minKB: 10,
    maxKB: 20,
    textOverlay: false,
  },
  mvd_license_sign: {
    name: "Kerala MVD Signature",
    slug: "mvd-signature",
    kind: "signature",
    width: 256,
    height: 64,
    minKB: 10,
    maxKB: 20,
    textOverlay: false,
  },
} as const satisfies Record<string, Preset>;
export type PresetId = keyof typeof PRESETS;
export const GROUPS: { title: string; ids: PresetId[] }[] = [
  { title: "Kerala PSC", ids: ["kerala_psc_photo", "kerala_psc_sign"] },
  {
    title: "Government documents",
    ids: ["indian_passport", "pan_card_photo", "pan_card_sign"],
  },
  { title: "Kerala MVD", ids: ["mvd_license_photo", "mvd_license_sign"] },
];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const ratio = (p: Preset) => {
  const g = gcd(p.width, p.height);
  return `${p.width / g}:${p.height / g}`;
};
