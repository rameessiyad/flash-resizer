import Link from "next/link";
import { GROUPS, PRESETS } from "../../lib/presets";

const EMAIL = "flashresizerin@gmail.com";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-base font-extrabold text-slate-900">
            FlashResizer
          </p>
          <p className="mt-2">
            Free photo and signature resizer for Kerala PSC, PAN Card, Passport
            and Kerala MVD. Processed entirely in your browser.
          </p>
        </div>

        <nav aria-label="Resizers">
          <p className="font-semibold text-slate-900">Resizers</p>
          <ul className="mt-2 space-y-1">
            {GROUPS.flatMap((g) => g.ids).map((id) => (
              <li key={id}>
                <Link
                  href={`/${PRESETS[id].slug}`}
                  className="hover:text-indigo-700 hover:underline"
                >
                  {PRESETS[id].name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-semibold text-slate-900">Customer support</p>
          <p className="mt-2">
            Facing a problem, or need a size that isn&apos;t listed? Write to
            us.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=FlashResizer%20support`}
            className="mt-2 inline-block font-medium text-indigo-700 underline"
          >
            {EMAIL}
          </a>
          <p className="mt-2 text-xs text-slate-500">
            Please mention which tool you used and attach a screenshot of any
            error. Do not send your personal photos or ID documents.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {year} FlashResizer. Independent utility, not affiliated with Kerala
        PSC, PAN authorities, Passport Seva or Kerala MVD.
      </div>
    </footer>
  );
}
