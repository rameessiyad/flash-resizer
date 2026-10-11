import type { PresetId } from "./presets";

export type Landing = {
  slug: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  ids: PresetId[];
};

export const LANDINGS: Landing[] = [
  {
    slug: "psc-image-resizer",
    h1: "PSC Image Resizer",
    title: "PSC Image Resizer – Kerala PSC Photo & Signature Resize Online",
    description:
      "Free PSC image resizer for Kerala PSC Thulasi. Resize photo to 150×200 px and signature to 150×100 px with the exact KB. No upload.",
    intro:
      "Resize your Kerala PSC photo and signature to the exact size and KB required by the Thulasi portal.",
    ids: ["kerala_psc_photo", "kerala_psc_sign"],
  },
  {
    slug: "pan-card-image-resizer",
    h1: "PAN Card Image Resizer",
    title: "PAN Card Image Resizer – Photo & Signature Resize Online",
    description:
      "Free PAN card image resizer. Resize photo to 213×213 px and signature to 400×200 px within the KB limit. No upload, no signup.",
    intro:
      "Resize your PAN card photo and signature to the exact pixel size and file size.",
    ids: ["pan_card_photo", "pan_card_sign"],
  },
  {
    slug: "passport-image-resizer",
    h1: "Passport Image Resizer",
    title: "Passport Image Resizer – Passport Seva Photo Resize Online",
    description:
      "Free passport image resizer. Resize your photo to 500×500 px and 20–100 KB for Passport Seva. Works in your browser.",
    intro: "Resize your passport photo to the size and KB the portal accepts.",
    ids: ["indian_passport"],
  },
  {
    slug: "mvd-image-resizer",
    h1: "MVD Image Resizer",
    title: "MVD Image Resizer – Kerala Licence Photo & Signature Resize",
    description:
      "Free MVD image resizer for Kerala. Resize photo to 420×525 px and signature to 256×64 px, 10–20 KB. No upload.",
    intro:
      "Resize your Kerala MVD photo and signature to the exact requirements.",
    ids: ["mvd_license_photo", "mvd_license_sign"],
  },
];
