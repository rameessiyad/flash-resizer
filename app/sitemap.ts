import type { MetadataRoute } from "next";
import { PRESETS } from "../lib/presets";

const base = "https://flashresizer.in";
// Update this date only when page content actually changes.
const updated = new Date("2026-10-06");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, lastModified: updated, priority: 1 },
    ...Object.values(PRESETS).map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: updated,
      priority: 0.8,
    })),
  ];
}
