import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  const routes = ["", "/states", "/find-an-attorney", "/terms", "/privacy", "/signup", "/login"];
  return routes.map((r) => ({
    url: `${base}${r}`,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.6,
  }));
}
