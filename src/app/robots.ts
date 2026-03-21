import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agentreceipt.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/dashboard/" },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
