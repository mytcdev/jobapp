export const dynamic = "force-dynamic";

import { getMenu } from "@/lib/menus";
import MenuEditor from "./MenuEditor";

export default async function CmsMenusPage() {
  const [headerItems, footerItems] = await Promise.all([
    getMenu("header"),
    getMenu("footer"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Navigation Menus</h1>
      <MenuEditor headerItems={headerItems} footerItems={footerItems} />
    </div>
  );
}
