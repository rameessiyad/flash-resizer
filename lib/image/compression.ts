import { UserError } from "./validation";
const MIN_Q = 0.3,
  MAX_Q = 0.95,
  STEPS = 8;
const toBlob = (c: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((res, rej) =>
    c.toBlob(
      (b) =>
        b
          ? res(b)
          : rej(new UserError("Your browser could not encode this image.")),
      "image/jpeg",
      q,
    ),
  );
/** Binary-search the highest JPEG quality whose real Blob size fits the goal. Max 10 encodes. */
export async function compress(
  c: HTMLCanvasElement,
  maxKB: number,
  targetKB?: number,
) {
  const goal = Math.min(maxKB, targetKB ?? maxKB * 0.95) * 1024;
  const top = await toBlob(c, MAX_Q);
  if (top.size <= goal) return { blob: top, quality: MAX_Q };
  let best = await toBlob(c, MIN_Q);
  if (best.size > maxKB * 1024)
    throw new UserError(
      `FlashResizer couldn't safely bring this image below ${maxKB} KB without severe quality loss. Try a different image.`,
    );
  let lo = MIN_Q,
    hi = MAX_Q,
    bestQ = MIN_Q;
  for (let i = 0; i < STEPS; i++) {
    const mid = (lo + hi) / 2,
      b = await toBlob(c, mid);
    if (b.size <= goal) {
      best = b;
      bestQ = mid;
      lo = mid;
    } else hi = mid;
  }
  return { blob: best, quality: bestQ };
}
