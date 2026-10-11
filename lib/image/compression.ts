import { encode } from "jpeg-js";
import { UserError } from "./validation";

function encodeFull(c: HTMLCanvasElement, quality: number): Uint8Array {
  const ctx = c.getContext("2d");
  if (!ctx) throw new UserError("Your browser could not encode this image.");
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const out = encode(
    { data: img.data, width: c.width, height: c.height },
    quality,
  );
  return new Uint8Array(out.data);
}

// Adds invisible JPEG comment segments until the file reaches minBytes.
function padJpeg(data: Uint8Array, minBytes: number): Uint8Array {
  if (data.length >= minBytes) return data;

  // insert after SOI (and after the JFIF APP0 segment if present)
  let at = 2;
  if (data[2] === 0xff && data[3] === 0xe0) at = 4 + ((data[4] << 8) | data[5]);

  const segs: Uint8Array[] = [];
  let need = minBytes - data.length;
  while (need > 0) {
    const payload = Math.min(65533, Math.max(1, need - 4));
    const seg = new Uint8Array(4 + payload); // zero-filled
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = (payload + 2) >> 8;
    seg[3] = (payload + 2) & 255;
    segs.push(seg);
    need -= seg.length;
  }

  const extra = segs.reduce((n, s) => n + s.length, 0);
  const out = new Uint8Array(data.length + extra);
  out.set(data.subarray(0, at), 0);
  let pos = at;
  for (const s of segs) {
    out.set(s, pos);
    pos += s.length;
  }
  out.set(data.subarray(at), pos);
  return out;
}

const toBlob = (d: Uint8Array) =>
  new Blob([d as BlobPart], { type: "image/jpeg" });

/** Best quality that fits under maxKB, then padded up to minKB if needed. */
export async function compress(c: HTMLCanvasElement, maxKB: number, minKB = 0) {
  const goal = maxKB * 0.97 * 1024;
  const minBytes = Math.ceil(minKB * 1.03 * 1024); // small margin above min

  const top = encodeFull(c, 100);
  if (top.length <= goal)
    return { blob: toBlob(padJpeg(top, minBytes)), quality: 1 };

  let lo = 30,
    hi = 100,
    best: Uint8Array | null = null,
    bestQ = lo;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const b = encodeFull(c, mid);
    if (b.length <= goal) {
      best = b;
      bestQ = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (!best) {
    const floor = encodeFull(c, 30);
    if (floor.length > maxKB * 1024)
      throw new UserError(
        `FlashResizer couldn't safely bring this image below ${maxKB} KB without severe quality loss. Try a different image.`,
      );
    return { blob: toBlob(padJpeg(floor, minBytes)), quality: 0.3 };
  }
  return { blob: toBlob(padJpeg(best, minBytes)), quality: bestQ / 100 };
}
