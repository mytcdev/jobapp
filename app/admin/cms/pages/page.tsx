export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default async function CmsPagesListPage() {
  const { data: pages } = await getSupabase()
    .from("cms_pages")
    .select("id, slug, title, published, updated_at")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pages</h1>
        <Link href="/admin/cms/pages/new"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          + New Page
        </Link>
      </div>

      {!pages?.length && <p className="text-gray-500">No pages yet.</p>}

      <div className="flex flex-col gap-2">
        {pages?.map((page) => (
          <div key={page.id} className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{page.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                /{page.slug} &middot; updated {new Date(page.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${page.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {page.published ? "Published" : "Draft"}
              </span>
              {page.published && (
                <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800">View ↗</a>
              )}
              <Link href={`/admin/cms/pages/${page.id}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
