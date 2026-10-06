import type { Metadata } from "next";
import Link from "next/link";
import ResizerApp from "./components/ResizerApp";
import { GROUPS, PRESETS } from "../lib/presets";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <>
      <ResizerApp />
      <nav
        aria-label="All resizers"
        className="mx-auto max-w-4xl px-4 pb-16 text-slate-700"
      >
        <h2 className="text-xl font-bold text-slate-900">All resizers</h2>
        <div className="mt-3 space-y-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="text-sm font-semibold text-slate-700">{g.title}</p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {g.ids.map((x) => (
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
        </div>
      </nav>
    </>
  );
}
