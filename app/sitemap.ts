import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobapp.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: jobs }, { data: pages }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, updated_at")
      .eq("status", "published")
      .order("id", { ascending: false }),
    supabase
      .from("cms_pages")
      .select("slug, updated_at")
      .eq("published", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  ];

  const jobRoutes: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
    url: `${SITE_URL}/jobs/${job.id}`,
    lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cmsRoutes: MetadataRoute.Sitemap = (pages ?? []).map((page) => ({
    url: `${SITE_URL}/p/${page.slug}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...jobRoutes, ...cmsRoutes];
}
