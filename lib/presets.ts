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
  seoTitle: string; // don't add "| FlashResizer", the layout template does it
  seoDescription: string;
  h1: string;
};
// Single source of truth. Add a portal by adding an entry here (and to GROUPS).
export const PRESETS = {
  kerala_psc_photo: {
    name: "Kerala PSC (Thulasi) Photo",
    slug: "kerala-psc-photo",
    kind: "photo",
    width: 150,
    height: 200,
    minKB: 20,
    maxKB: 50,
    targetKB: 30,
    textOverlay: true,
    seoTitle: "PSC Photo Resizer – Kerala PSC Thulasi Photo 150x200, 20-50KB",
    seoDescription:
      "Resize your photo for Kerala PSC Thulasi to 150x200 px and 20-50 KB. Free PSC image resizer, works in your browser, no upload.",
    h1: "Kerala PSC Photo Resizer",
  },
  kerala_psc_sign: {
    name: "Kerala PSC Signature",
    slug: "kerala-psc-signature",
    kind: "signature",
    width: 150,
    height: 100,
    minKB: 10,
    maxKB: 50,
    textOverlay: false,
    seoTitle: "PSC Signature Resizer – Kerala PSC Signature 150x100, 10-50KB",
    seoDescription:
      "Resize your signature for Kerala PSC to 150x100 px and 10-50 KB. Free PSC image resizer, no upload, no signup.",
    h1: "Kerala PSC Signature Resizer",
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
    seoTitle: "Passport Photo Resizer – Passport Seva Photo 500x500, 20-100KB",
    seoDescription:
      "Resize your photo for Passport Seva to 500x500 px and 20-100 KB. Free passport image resizer, processed in your browser.",
    h1: "Passport Photo Resizer",
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
    seoTitle: "PAN Card Photo Resizer – 213x213 px, 5-30KB",
    seoDescription:
      "Resize your photo for a PAN card application to 213x213 px and under 30 KB. Free PAN card image resizer, no upload.",
    h1: "PAN Card Photo Resizer",
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
    seoTitle: "PAN Card Signature Resizer – 400x200 px, 5-50KB",
    seoDescription:
      "Resize your signature for a PAN card application to 400x200 px and 5-50 KB. Free PAN card image resizer, no signup.",
    h1: "PAN Card Signature Resizer",
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
    seoTitle:
      "MVD Photo Resizer – Kerala Driving Licence Photo 420x525, 10-20KB",
    seoDescription:
      "Resize your photo for Kerala MVD licence services to 420x525 px and 10-20 KB. Free MVD image resizer, works in your browser.",
    h1: "Kerala MVD Photo Resizer",
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
    seoTitle:
      "MVD Signature Resizer – Kerala Licence Signature 256x64, 10-20KB",
    seoDescription:
      "Resize your signature for Kerala MVD to 256x64 px and 10-20 KB. Free MVD image resizer, no upload.",
    h1: "Kerala MVD Signature Resizer",
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
