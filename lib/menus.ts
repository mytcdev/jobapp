import { getSupabase } from "./supabase";

export type MenuItem = {
  id:           string;
  label:        string;
  url:          string;
  openNewTab:   boolean;
};

export type MenuLocation = "header" | "footer";

export async function getMenu(location: MenuLocation): Promise<MenuItem[]> {
  const { data } = await getSupabase()
    .from("nav_menus")
    .select("items")
    .eq("location", location)
    .single();
  return (data?.items as MenuItem[]) ?? [];
}
