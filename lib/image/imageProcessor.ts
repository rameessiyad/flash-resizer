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

const MAX_SIDE = 2400;

/**
 * Load the original image.
 * Only extremely large images are downscaled, to avoid browser memory issues.
 */
export async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    let bmp = await createImageBitmap(file);

    const maxSide = Math.max(bmp.width, bmp.height);

    if (maxSide > MAX_SIDE) {
      const scale = MAX_SIDE / maxSide;

      const resized = await createImageBitmap(bmp, {
        resizeWidth: Math.round(bmp.width * scale),
        resizeHeight: Math.round(bmp.height * scale),
        resizeQuality: "high",
      });

      bmp.close();
      bmp = resized;
    }

    return bmp;
  } catch {
    throw new UserError(
      "This image could not be read. It may be corrupted. Try another file.",
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Lanczos resampling (sharp, accurate downscaling for tiny outputs)  */
/* ------------------------------------------------------------------ */

const A = 3; // Lanczos lobes

const lanczos = (x: number) => {
  if (x === 0) return 1;
  if (x <= -A || x >= A) return 0;
  const p = Math.PI * x;
  return (A * Math.sin(p) * Math.sin(p / A)) / (p * p);
};

type Taps = { start: number; w: Float32Array }[];

function buildTaps(srcSize: number, dstSize: number): Taps {
  const scale = srcSize / dstSize;
  const fs = Math.max(1, scale); // widen filter when shrinking
  const support = A * fs;
  const taps: Taps = [];
  for (let i = 0; i < dstSize; i++) {
    const center = (i + 0.5) * scale;
    const start = Math.max(0, Math.floor(center - support));
    const end = Math.min(srcSize - 1, Math.ceil(center + support));
    const w = new Float32Array(end - start + 1);
    let sum = 0;
    for (let j = start; j <= end; j++) {
      const v = lanczos((j + 0.5 - center) / fs);
      w[j - start] = v;
      sum += v;
    }
    for (let j = 0; j < w.length; j++) w[j] /= sum;
    taps.push({ start, w });
  }
  return taps;
}

function lanczosResize(src: ImageData, dw: number, dh: number): ImageData {
  const { width: sw, height: sh, data } = src;
  const xt = buildTaps(sw, dw);
  const yt = buildTaps(sh, dh);

  // horizontal pass: sw x sh -> dw x sh
  const mid = new Float32Array(dw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < dw; x++) {
      const { start, w } = xt[x];
      let r = 0,
        g = 0,
        b = 0;
      for (let i = 0; i < w.length; i++) {
        const p = (y * sw + start + i) * 4;
        r += data[p] * w[i];
        g += data[p + 1] * w[i];
        b += data[p + 2] * w[i];
      }
      const o = (y * dw + x) * 4;
      mid[o] = r;
      mid[o + 1] = g;
      mid[o + 2] = b;
    }
  }

  // vertical pass: dw x sh -> dw x dh
  const out = new ImageData(dw, dh);
  for (let y = 0; y < dh; y++) {
    const { start, w } = yt[y];
    for (let x = 0; x < dw; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let i = 0; i < w.length; i++) {
        const p = ((start + i) * dw + x) * 4;
        r += mid[p] * w[i];
        g += mid[p + 1] * w[i];
        b += mid[p + 2] * w[i];
      }
      const o = (y * dw + x) * 4;
      out.data[o] = r; // Uint8ClampedArray clamps + rounds
      out.data[o + 1] = g;
      out.data[o + 2] = b;
      out.data[o + 3] = 255;
    }
  }
  return out;
}

/**
 * High-quality downscale into ctx at (0,0) with size dw x dh.
 * 1) cheap pre-shrink until source is at most 4x the target
 * 2) one final Lanczos pass for crisp detail
 */
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
  let cur: CanvasImageSource = src;
  let cx = sx,
    cy = sy,
    cw = sw,
    ch = sh;

  // 1) cheap pre-shrink
  while (cw > dw * 4 || ch > dh * 4) {
    const nw = Math.max(dw * 2, Math.round(cw / 2));
    const nh = Math.max(dh * 2, Math.round(ch / 2));
    const t = document.createElement("canvas");
    t.width = nw;
    t.height = nh;
    const tc = t.getContext("2d")!;
    tc.imageSmoothingEnabled = true;
    tc.imageSmoothingQuality = "high";
    tc.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
    cur = t;
    cx = 0;
    cy = 0;
    cw = nw;
    ch = nh;
  }

  // 2) read pixels on a white background (handles transparent PNGs)
  const w = Math.max(1, Math.round(cw));
  const h = Math.max(1, Math.round(ch));
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d", { willReadFrequently: true })!;
  tctx.fillStyle = "#fff";
  tctx.fillRect(0, 0, w, h);
  tctx.drawImage(cur, cx, cy, cw, ch, 0, 0, w, h);

  // 3) one final high-quality resample into the real canvas
  ctx.putImageData(lanczosResize(tctx.getImageData(0, 0, w, h), dw, dh), 0, 0);
}

/**
 * Render the final image at the exact portal dimensions.
 */
export function renderCanvas(
  bmp: ImageBitmap,
  p: Preset,
  crop: Crop,
  ov?: Overlay,
  target?: HTMLCanvasElement,
  enh = false,
) {
  const canvas = target ?? document.createElement("canvas");

  canvas.width = p.width;
  canvas.height = p.height;

  const ctx = canvas.getContext("2d", {
    alpha: false,
  });

  if (!ctx) {
    throw new UserError("Your browser does not support image processing.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // White background is important for signatures and photos.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, p.width, p.height);

  // PSC photo has a bottom text strip; the photo occupies only the area above.
  const photoHeight = p.height - (p.textOverlay ? stripHeight(p.height) : 0);

  const rect = coverRect(bmp.width, bmp.height, p.width, photoHeight, crop);

  drawScaled(
    ctx,
    bmp,
    rect.sx,
    rect.sy,
    rect.sw,
    rect.sh,
    p.width,
    photoHeight,
  );

  // Optional enhancement (off unless the user enables it).
  if (enh) {
    enhance(ctx, p.width, photoHeight);
  }

  // PSC candidate name + date.
  if (p.textOverlay && ov) {
    drawOverlay(ctx, p.width, p.height, ov);
  }

  return canvas;
}

/**
 * Process the uploaded image.
 * - Photo -> JPEG compression
 * - Signature -> PNG whenever possible
 */
export async function processImage(a: {
  bitmap: ImageBitmap;
  preset: Preset;
  crop: Crop;
  overlay?: Overlay;
  enhance?: boolean;
}): Promise<ProcessResult> {
  const {
    bitmap,
    preset: p,
    crop,
    overlay,
    enhance: shouldEnhance = false,
  } = a;

  const canvas = renderCanvas(
    bitmap,
    p,
    crop,
    overlay,
    undefined,
    shouldEnhance,
  );

  let blob: Blob;

  if (p.kind === "signature") {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(
            new UserError("Your browser could not encode this signature."),
          );
        }
      }, "image/png");
    });
  } else {
    const compressed = await compress(canvas, p.maxKB, p.targetKB);
    blob = compressed.blob;
  }

  const sizeKB = blob.size / 1024;

  const low = sizeKB < p.minKB;
  const overLimit = sizeKB > p.maxKB;

  let status: "ok" | "low" = "ok";
  let message = `Within ${p.name} requirements`;

  if (low) {
    status = "low";
    message =
      `Could not reach the minimum ${p.minKB} KB without compromising image quality. ` +
      `Check whether the portal accepts this size.`;
  }

  if (overLimit) {
    status = "low";
    message =
      `The best-quality output is ${sizeKB.toFixed(1)} KB, ` +
      `which is above the ${p.maxKB} KB limit. ` +
      `Reducing it further may affect signature quality.`;
  }

  return {
    blob,
    url: URL.createObjectURL(blob),
    width: p.width,
    height: p.height,
    sizeKB,
    status,
    message,
  };
}
