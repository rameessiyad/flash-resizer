import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://flashresizer.in/",
      lastModified: new Date(),
    },
  ];
}
