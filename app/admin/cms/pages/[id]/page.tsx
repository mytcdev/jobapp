export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import PageEditor from "../PageEditor";
import DeletePageButton from "./DeletePageButton";

export default async function EditCmsPagePage({ params }: { params: { id: string } }) {
  const { data: page, error } = await getSupabase()
    .from("cms_pages")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !page) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/cms/pages" className="text-sm text-gray-400 hover:text-gray-600 mb-1 inline-block">
            ← Pages
          </Link>
          <h1 className="text-2xl font-bold">Edit Page</h1>
        </div>
        <DeletePageButton pageId={page.id} />
      </div>

      <PageEditor initial={{
        id:        page.id,
        slug:      page.slug,
        title:     page.title,
        content:   page.content,
        published: page.published,
      }} />
    </div>
  );
}
