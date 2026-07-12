import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep authenticated / functional areas out of the index.
      disallow: ["/dashboard", "/admin", "/interview", "/vault", "/checkup", "/api", "/gate", "/redeem"],
    },
    sitemap: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
