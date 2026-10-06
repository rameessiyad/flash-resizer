import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRESETS, PresetId, Preset, GROUPS, ratio } from "../../lib/presets";
import ResizerApp from "../components/ResizerApp";

export const dynamicParams = false;

const entries = Object.entries(PRESETS) as [PresetId, Preset][];
const find = (slug: string) => entries.find(([, p]) => p.slug === slug);

export function generateStaticParams() {
  return entries.map(([, p]) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hit = find(slug);
  if (!hit) return {};
  const p = hit[1];
  return {
    title: `${p.name} Resizer: ${p.width}×${p.height} px, ${p.minKB}–${p.maxKB} KB`,
    description: `Resize your ${p.kind} to ${p.width}×${p.height} px and ${p.minKB}–${p.maxKB} KB for ${p.name}. Free, no upload, processed in your browser.`,
    alternates: { canonical: `/${p.slug}` },
    openGraph: {
      title: `${p.name} Resizer | FlashResizer`,
      description: `Exact ${p.width}×${p.height} px, ${p.minKB}–${p.maxKB} KB. No upload, no signup.`,
      url: `/${p.slug}`,
    },
  };
}

export default async function PresetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hit = find(slug);
  if (!hit) notFound();
  const [id, p] = hit;

  const faqs = [
    {
      q: `What is the required size for ${p.name}?`,
      a: `${p.width} × ${p.height} pixels (${ratio(p)}), JPEG, between ${p.minKB} KB and ${p.maxKB} KB.`,
    },
    {
      q: `How do I resize my ${p.kind} for ${p.name}?`,
      a: `Choose or drop your image above, adjust the zoom and position, then click "Resize and compress". Download the JPG and upload it to the portal.`,
    },
    {
      q: "Is my image uploaded to a server?",
      a: "No. Everything happens inside your browser. Your image never leaves your device.",
    },
    {
      q: "Why was my image rejected on the portal?",
      a: `The most common reasons are wrong dimensions or a file size outside ${p.minKB}–${p.maxKB} KB. FlashResizer outputs the exact pixel size and compresses the file to fit the range.`,
    },
    ...(p.textOverlay
      ? [
          {
            q: "Does the tool add my name and date?",
            a: "Yes. Enter the candidate name and the date of the photograph, and a white strip with both is added at the bottom of the final image.",
          },
        ]
      : []),
  ];

  return (
    <>
      <ResizerApp
        initialId={id}
        title={`${p.name} Resizer`}
        intro={`Resize your ${p.kind} to exactly ${p.width}×${p.height} px and ${p.minKB}–${p.maxKB} KB. Nothing is uploaded.`}
      />

      <section className="mx-auto max-w-4xl px-4 pb-16 text-slate-700">
        <h2 className="text-xl font-bold text-slate-900">
          {p.name} requirements
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Dimensions: {p.width} × {p.height} px ({ratio(p)})
          </li>
          <li>
            File size: {p.minKB}–{p.maxKB} KB
          </li>
          <li>Format: JPEG</li>
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Requirements can change. Always confirm the current specification on
          the official portal before submitting.
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Frequently asked questions
        </h2>
        <div className="mt-3 space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-slate-900">{f.q}</h3>
              <p className="mt-1">{f.a}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Other resizers
        </h2>
        <nav aria-label="Other resizers" className="mt-3 space-y-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="text-sm font-semibold text-slate-700">{g.title}</p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {g.ids
                  .filter((x) => x !== id)
                  .map((x) => (
                    <li key={x}>
                      <Link
                        href={`/${PRESETS[x].slug}`}
                        className="text-indigo-700 underline"
                      >
                        {PRESETS[x].name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <p>
            <Link href="/" className="text-indigo-700 underline">
              All FlashResizer tools
            </Link>
          </p>
        </nav>
      </section>
    </>
  );
}
