"use client";
import { useEffect, useRef, useState } from "react";
import { GROUPS, PRESETS, PresetId, ratio } from "../lib/presets";
import {
  loadBitmap,
  processImage,
  renderCanvas,
  ProcessResult,
} from "../lib/image/imageProcessor";
import { DEFAULT_CROP, Crop } from "../lib/image/crop";
import { UserError, validateFile } from "../lib/image/validation";

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (iso: string) => iso.split("-").reverse().join("-");
const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export default function Home() {
  const [id, setId] = useState<PresetId>("kerala_psc_photo");
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState("");
  const [res, setRes] = useState<ProcessResult | null>(null);
  const [err, setErr] = useState("");
  const cv = useRef<HTMLCanvasElement>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const preset = PRESETS[id];
  const ov = preset.textOverlay
    ? { name: name.trim() || "YOUR NAME", date: fmt(date) }
    : undefined;

  useEffect(() => {
    if (bmp && cv.current)
      try {
        renderCanvas(bmp, preset, crop, ov, cv.current);
      } catch {}
  });
  useEffect(
    () => () => {
      if (res) URL.revokeObjectURL(res.url);
    },
    [res],
  );
  useEffect(() => {
    if (res)
      resRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [res]);

  const clearResult = () => setRes(null);
  const reset = () => {
    bmp?.close();
    setBmp(null);
    setRes(null);
    setErr("");
    setCrop(DEFAULT_CROP);
  };
  const pick = (f?: File) => {
    if (!f) return;
    const e = validateFile(f);
    if (e) return setErr(e);
    setErr("");
    setBusy("Preparing your image...");
    loadBitmap(f)
      .then((b) => {
        setBmp(b);
        setCrop(DEFAULT_CROP);
        clearResult();
      })
      .catch((x) =>
        setErr(
          x instanceof UserError
            ? x.message
            : "Something went wrong. Please try another image.",
        ),
      )
      .finally(() => setBusy(""));
  };
  const run = async () => {
    if (!bmp) return;
    if (preset.textOverlay && !name.trim())
      return setErr("Enter the candidate name.");
    if (preset.textOverlay && !date)
      return setErr("Choose the date of the photograph.");
    setErr("");
    setBusy("Resizing and compressing...");
    await new Promise((r) => setTimeout(r, 30));
    try {
      setRes(await processImage({ bitmap: bmp, preset, crop, overlay: ov }));
    } catch (x) {
      setErr(
        x instanceof UserError
          ? x.message
          : "Something went wrong. Please try another image.",
      );
    }
    setBusy("");
  };
  const slider = (
    label: string,
    k: keyof Crop,
    min: number,
    max: number,
    step: number,
  ) => (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={crop[k]}
        className="w-full accent-indigo-600"
        onChange={(e) => {
          setCrop({ ...crop, [k]: +e.target.value });
          clearResult();
        }}
      />
    </label>
  );

  let n = 0;
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="blob -left-24 -top-24 h-96 w-96 bg-teal-300" />
        <div
          className="blob -right-24 top-40 h-96 w-96 bg-indigo-300"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="blob bottom-0 left-1/3 h-80 w-80 bg-fuchsia-300"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="rise text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> 100% in
            your browser. Nothing is uploaded.
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="grad-text">FlashResizer</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Resize photos &amp; signatures for Kerala PSC, PAN Card, Passport
            and Kerala MVD applications.
          </p>
        </header>

        <section className="mt-10 space-y-5" aria-label="Choose requirement">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                {g.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {g.ids.map((k) => {
                  const p = PRESETS[k];
                  const sel = k === id;
                  return (
                    <button
                      key={k}
                      aria-pressed={sel}
                      onClick={() => {
                        setId(k);
                        clearResult();
                      }}
                      style={{ animationDelay: `${120 + n++ * 60}ms` }}
                      className={`rise rounded-2xl p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${FOCUS} ${sel ? "card-sel shadow-md" : "glass"}`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {p.width} × {p.height} px · {ratio(p)} · {p.minKB}–
                        {p.maxKB} KB · {p.kind}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section
          className="glass rise mt-10 rounded-3xl p-4 shadow-xl shadow-indigo-100 sm:p-6"
          style={{ animationDelay: "400ms" }}
          aria-live="polite"
        >
          {err && (
            <p
              role="alert"
              className="pop mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {err}
            </p>
          )}
          {!bmp ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pick(e.dataTransfer.files[0]);
              }}
              className="drop flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-indigo-300 bg-white/60 p-10 text-center transition hover:border-fuchsia-400 hover:bg-white focus-within:ring-2 focus-within:ring-indigo-500"
            >
              <span className="btn-grad mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white">
                ↑
              </span>
              <span className="font-semibold">
                {busy || "Drop your image here, or click to choose"}
              </span>
              <span className="mt-1 text-sm text-slate-600">
                JPG, PNG or WebP. Your image stays on your device.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          ) : (
            <div className="pop grid gap-6 sm:grid-cols-2">
              <div>
                <canvas
                  ref={cv}
                  className="mx-auto w-full max-w-xs rounded-lg bg-white shadow-lg ring-1 ring-slate-200"
                  style={{ aspectRatio: `${preset.width}/${preset.height}` }}
                  aria-label="Crop preview"
                />
                {preset.textOverlay && (
                  <p className="mt-2 text-center text-xs text-slate-600">
                    The white strip at the bottom is added to your final image.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                {slider("Zoom", "zoom", 1, 3, 0.01)}
                {slider("Left / right", "x", 0, 1, 0.01)}
                {slider("Up / down", "y", 0, 1, 0.01)}
                <button
                  className="text-sm text-indigo-700 underline"
                  onClick={() => {
                    setCrop(DEFAULT_CROP);
                    clearResult();
                  }}
                >
                  Reset crop
                </button>
                {preset.textOverlay && (
                  <>
                    <label className="block text-sm font-medium text-slate-700">
                      Candidate name
                      <input
                        value={name}
                        maxLength={40}
                        onChange={(e) => {
                          setName(e.target.value.toUpperCase());
                          clearResult();
                        }}
                        className={`mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 uppercase ${FOCUS}`}
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Date of photograph ({fmt(date)})
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          clearResult();
                        }}
                        className={`mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 ${FOCUS}`}
                      />
                    </label>
                  </>
                )}
                <button
                  onClick={run}
                  disabled={!!busy}
                  className={`btn-grad flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white disabled:opacity-70 ${FOCUS}`}
                >
                  {busy && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {busy || "Resize and compress"}
                </button>
                <button
                  onClick={reset}
                  className="w-full text-sm text-slate-600 underline"
                >
                  Resize another image
                </button>
              </div>
            </div>
          )}

          {res && (
            <div
              ref={resRef}
              className="pop mt-6 rounded-2xl border border-white bg-white/80 p-5 text-center shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                {res.status === "ok" ? (
                  <svg
                    className="check h-7 w-7 rounded-full bg-emerald-500 p-1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  <span aria-hidden>⚠</span>
                )}
                <p
                  className={`font-semibold ${res.status === "ok" ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {res.status === "ok" ? "Ready for upload" : "Check size"}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={res.url}
                alt="Final result"
                width={res.width}
                height={res.height}
                className="mx-auto my-4 max-w-full rounded-lg shadow-md ring-1 ring-slate-200"
              />
              <p className="text-sm font-medium">
                {res.width} × {res.height} px · {res.sizeKB.toFixed(1)} KB ·
                JPEG
              </p>
              <p className="mb-4 text-sm text-slate-600">{res.message}</p>
              <a
                href={res.url}
                download={`flashresizer-${preset.slug}.jpg`}
                className={`btn-grad inline-block rounded-xl px-8 py-3 font-semibold text-white ${FOCUS}`}
              >
                Download JPG
              </a>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-500">
          FlashResizer is an independent utility, not affiliated with Kerala
          PSC, PAN authorities, Passport Seva or Kerala MVD. Requirements may
          change. Always verify the current requirements on the relevant
          official portal before submitting.
        </p>
      </main>
    </>
  );
}
