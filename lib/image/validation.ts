export class UserError extends Error {}
const OK = ["image/jpeg", "image/png", "image/webp"];
const EXT = /\.(jpe?g|png|webp)$/i;
export const MAX_INPUT_MB = 25;
export function validateFile(f: File): string | null {
  if (!OK.includes(f.type) || !EXT.test(f.name))
    return "Unsupported file. Please choose a JPG, PNG or WebP image.";
  if (f.size > MAX_INPUT_MB * 1024 * 1024)
    return `This image is larger than ${MAX_INPUT_MB} MB. Please choose a smaller one.`;
  if (f.size === 0) return "This file is empty.";
  return null;
}
