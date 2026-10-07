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
 *
 * We only downscale extremely large images to avoid browser memory issues.
 * Normal images are kept at their original resolution until the final render.
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

/**
 * High-quality multi-step downscaling.
 *
 * Instead of directly doing:
 *
 *   2000px -> 150px
 *
 * we gradually reduce the image:
 *
 *   2000 -> 1000 -> 500 -> 250 -> 150
 *
 * This preserves small details and thin signature strokes much better.
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
  let currentSource: CanvasImageSource = src;

  let currentX = sx;
  let currentY = sy;
  let currentWidth = sw;
  let currentHeight = sh;

  while (currentWidth > dw * 2 || currentHeight > dh * 2) {
    const nextWidth = Math.max(dw, Math.round(currentWidth / 2));

    const nextHeight = Math.max(dh, Math.round(currentHeight / 2));

    const temp = document.createElement("canvas");

    temp.width = nextWidth;
    temp.height = nextHeight;

    const tempCtx = temp.getContext("2d");

    if (!tempCtx) {
      break;
    }

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    tempCtx.drawImage(
      currentSource,
      currentX,
      currentY,
      currentWidth,
      currentHeight,
      0,
      0,
      nextWidth,
      nextHeight,
    );

    currentSource = temp;

    currentX = 0;
    currentY = 0;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    currentSource,
    currentX,
    currentY,
    currentWidth,
    currentHeight,
    0,
    0,
    dw,
    dh,
  );
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

  /*
   * Prevent browser from accidentally using low-quality interpolation.
   */
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  /*
   * White background is important for signatures and photos.
   */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, p.width, p.height);

  /*
   * PSC photo has a bottom text strip.
   *
   * The actual photograph therefore occupies only the area above it.
   */
  const photoHeight = p.height - (p.textOverlay ? stripHeight(p.height) : 0);

  /*
   * Calculate the crop area.
   */
  const rect = coverRect(bmp.width, bmp.height, p.width, photoHeight, crop);

  /*
   * High-quality resize.
   */
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

  /*
   * Optional enhancement.
   *
   * Keep this OFF unless the user explicitly enables it,
   * because sharpening can create artifacts on already-sharp photos
   * and signatures.
   */
  if (enh) {
    enhance(ctx, p.width, photoHeight);
  }

  /*
   * PSC candidate name + date.
   */
  if (p.textOverlay && ov) {
    drawOverlay(ctx, p.width, p.height, ov);
  }

  return canvas;
}

/**
 * Process the uploaded image.
 *
 * IMPORTANT:
 * - Photo -> JPEG compression
 * - Signature -> PNG whenever possible
 *
 * PNG avoids JPEG artifacts around signature strokes.
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

  /*
   * Render the image at the exact required dimensions.
   */
  const canvas = renderCanvas(
    bitmap,
    p,
    crop,
    overlay,
    undefined,
    shouldEnhance,
  );

  let blob: Blob;

  /*
   * SIGNATURE
   *
   * JPEG creates visible blocks/blur around thin signature strokes.
   * PNG preserves those edges much better.
   */
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
    /*
     * PHOTO
     *
     * Use the existing high-quality JPEG compressor.
     */
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

  /*
   * PNG signatures can sometimes be larger than the portal's limit.
   *
   * We intentionally DON'T destroy quality by blindly converting
   * them to extremely low-quality JPEG.
   */
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
