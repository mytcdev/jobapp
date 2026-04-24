export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: page } = await getSupabase()
    .from("cms_pages")
    .select("title")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();
  if (!page) return {};
  return { title: page.title };
}

export default async function PublicCmsPage({ params }: { params: { slug: string } }) {
  const { data: page, error } = await getSupabase()
    .from("cms_pages")
    .select("title, content, updated_at")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (error || !page) notFound();

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
      <p className="text-xs text-gray-400 mb-8">
        Last updated {new Date(page.updated_at).toLocaleDateString()}
      </p>
      <article
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
