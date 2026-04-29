export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import CategoriesManager from "./CategoriesManager";

export default async function CategoriesPage() {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <CategoriesManager initial={categories ?? []} />
    </div>
  );
}
