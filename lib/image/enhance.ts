// Classic (non-AI) enhancement: auto-levels contrast stretch + unsharp mask.
// Pure JS on ImageData so it works on every browser, including iOS Safari (no ctx.filter needed).
const idx = (x: number, y: number, w: number) => (y * w + x) * 3;

function boxBlur(
  src: Float32Array,
  w: number,
  h: number,
  r: number,
): Float32Array {
  const tmp = new Float32Array(src.length),
    out = new Float32Array(src.length),
    n = 2 * r + 1;
  const cl = (v: number, m: number) => (v < 0 ? 0 : v > m ? m : v);
  for (let c = 0; c < 3; c++) {
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[idx(cl(k, w - 1), y, w) + c];
      for (let x = 0; x < w; x++) {
        tmp[idx(x, y, w) + c] = s / n;
        s +=
          src[idx(cl(x + r + 1, w - 1), y, w) + c] -
          src[idx(cl(x - r, w - 1), y, w) + c];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[idx(x, cl(k, h - 1), w) + c];
      for (let y = 0; y < h; y++) {
        out[idx(x, y, w) + c] = s / n;
        s +=
          tmp[idx(x, cl(y + r + 1, h - 1), w) + c] -
          tmp[idx(x, cl(y - r, h - 1), w) + c];
      }
    }
  }
  return out;
}

export function enhance(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h),
    d = img.data;
  // 1. Auto-levels: clip 0.5% of darkest/brightest pixels, stretch the rest.
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4)
    hist[(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0]++;
  const clip = w * h * 0.005;
  let lo = 0,
    hi = 255,
    acc = 0;
  while (lo < 254 && (acc += hist[lo]) < clip) lo++;
  acc = 0;
  while (hi > lo + 1 && (acc += hist[hi]) < clip) hi--;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++)
    lut[v] = ((v - lo) / Math.max(hi - lo, 1)) * 255;
  // 2. Unsharp mask on the stretched pixels.
  const rgb = new Float32Array(w * h * 3);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    rgb[j] = lut[d[i]];
    rgb[j + 1] = lut[d[i + 1]];
    rgb[j + 2] = lut[d[i + 2]];
  }
  const r = Math.max(1, Math.round(Math.min(w, h) / 200));
  const blur = boxBlur(boxBlur(rgb, w, h, r), w, h, r);
  const THRESHOLD = 2;
  // Smaller outputs (e.g. Kerala PSC 150x200) lose more detail per pixel, so sharpen them harder.
  const AMOUNT = 1.2 + Math.max(0, (300 - Math.min(w, h)) / 300) * 0.8; // threshold avoids amplifying flat-area noise
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    for (let c = 0; c < 3; c++) {
      const diff = rgb[j + c] - blur[j + c];
      d[i + c] =
        Math.abs(diff) > THRESHOLD ? rgb[j + c] + AMOUNT * diff : rgb[j + c];
    }
  }
  ctx.putImageData(img, 0, 0);
}
