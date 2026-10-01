export const stripHeight = (h: number) => Math.round(h * 0.17);
export type Overlay = { name: string; date: string }; // date already formatted DD-MM-YYYY
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  o: Overlay,
) {
  const sh = stripHeight(h),
    top = h - sh;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, top, w, sh);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fit = (t: string, start: number) => {
    let f = start;
    for (; f > 6; f--) {
      ctx.font = `bold ${f}px Arial, Helvetica, sans-serif`;
      if (ctx.measureText(t).width <= w * 0.94) break;
    }
    return f;
  };
  const size = Math.floor(sh * 0.36);
  const name = o.name.toUpperCase();
  fit(name, size);
  ctx.fillText(name, w / 2, top + sh * 0.3);
  fit(o.date, size);
  ctx.fillText(o.date, w / 2, top + sh * 0.72);
}
