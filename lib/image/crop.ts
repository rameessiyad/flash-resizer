// x,y are 0..1 positions of the crop window inside the free space (0.5 = centered). zoom >= 1.
export type Crop = { zoom: number; x: number; y: number };
export const DEFAULT_CROP: Crop = { zoom: 1, x: 0.5, y: 0.5 };
export function coverRect(
  sw: number,
  sh: number,
  tw: number,
  th: number,
  c: Crop,
) {
  const scale = Math.max(tw / sw, th / sh) * Math.max(1, c.zoom); // uniform scale: never stretches
  const w = tw / scale,
    h = th / scale;
  return { sx: (sw - w) * c.x, sy: (sh - h) * c.y, sw: w, sh: h };
}
