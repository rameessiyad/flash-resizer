import type { Preset } from "../presets";
import { coverRect, Crop } from "./crop";
import { compress } from "./compression";
import { drawOverlay, stripHeight, Overlay } from "./textOverlay";
import { enhance } from "./enhance";
import { UserError } from "./validation";
export type ProcessResult = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  sizeKB: number;
  status: "ok" | "low";
  message: string;
};
const MAX_SIDE = 2400; // downscale huge phone photos to bound memory
export async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    let bmp = await createImageBitmap(file); // honours EXIF orientation
    const m = Math.max(bmp.width, bmp.height);
    if (m > MAX_SIDE) {
      const s = MAX_SIDE / m;
      const small = await createImageBitmap(bmp, {
        resizeWidth: Math.round(bmp.width * s),
        resizeHeight: Math.round(bmp.height * s),
        resizeQuality: "high",
      });
      bmp.close();
      bmp = small;
    }
    return bmp;
  } catch {
    throw new UserError(
      "This image could not be read. It may be corrupted. Try another file.",
    );
  }
}
// Halve the image step by step before the final draw. One big jump (e.g. 1080px -> 150px)
// skips pixels and loses detail; stepping down keeps text and edges far cleaner.
function drawScaled(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
) {
  let cur = src,
    cx = sx,
    cy = sy,
    cw = sw,
    ch = sh;
  while (cw / 2 >= dw && ch / 2 >= dh) {
    const nw = Math.max(dw, Math.ceil(cw / 2)),
      nh = Math.max(dh, Math.ceil(ch / 2));
    const t = document.createElement("canvas");
    t.width = nw;
    t.height = nh;
    const tc = t.getContext("2d");
    if (!tc) break;
    tc.imageSmoothingQuality = "high";
    tc.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
    cur = t;
    cx = 0;
    cy = 0;
    cw = nw;
    ch = nh;
  }
  ctx.drawImage(cur, cx, cy, cw, ch, 0, 0, dw, dh);
}
export function renderCanvas(
  bmp: ImageBitmap,
  p: Preset,
  crop: Crop,
  ov?: Overlay,
  target?: HTMLCanvasElement,
  enh = false,
) {
  const c = target ?? document.createElement("canvas");
  c.width = p.width;
  c.height = p.height;
  const ctx = c.getContext("2d");
  if (!ctx)
    throw new UserError("Your browser does not support image processing.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  const ph = p.height - (p.textOverlay ? stripHeight(p.height) : 0);
  const r = coverRect(bmp.width, bmp.height, p.width, ph, crop);
  drawScaled(ctx, bmp, r.sx, r.sy, r.sw, r.sh, p.width, ph);
  if (enh) enhance(ctx, p.width, ph);
  if (p.textOverlay && ov) drawOverlay(ctx, p.width, p.height, ov);
  return c;
}
export async function processImage(a: {
  bitmap: ImageBitmap;
  preset: Preset;
  crop: Crop;
  overlay?: Overlay;
  enhance?: boolean;
}): Promise<ProcessResult> {
  const { preset: p } = a;
  const c = renderCanvas(a.bitmap, p, a.crop, a.overlay, undefined, a.enhance);
  const { blob } = await compress(c, p.maxKB, p.targetKB);
  const sizeKB = blob.size / 1024; // real byte size
  const low = sizeKB < p.minKB;
  return {
    blob,
    url: URL.createObjectURL(blob),
    width: p.width,
    height: p.height,
    sizeKB,
    status: low ? "low" : "ok",
    message: low
      ? `Could not reach the minimum ${p.minKB} KB without compromising image quality. Check whether the portal accepts this size.`
      : `Within ${p.name} requirements`,
  };
}
