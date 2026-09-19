import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { LANDING_CONTENT } from "@/lib/landing-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/glasgow",
    ...Object.values(LANDING_CONTENT).map((content) => content.path),
  ];
  return paths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path.includes("pigmentation-removal") ? 0.9 : 0.7,
  }));
}
