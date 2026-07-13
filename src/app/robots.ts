import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // TEST PHASE: block all crawlers so the staging site is never indexed.
  // Before public launch, restore selective rules (allow "/", disallow app
  // routes) — see docs/LAUNCH_CHECKLIST.md.
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
