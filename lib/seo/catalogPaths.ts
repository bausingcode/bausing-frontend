import type { Category } from "@/lib/api";

export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Public catalog paths: /catalogo/parent and /catalogo/parent/child */
export function collectCatalogPaths(categories: Category[]): string[] {
  const urls: string[] = [];
  const roots = categories.filter((c) => !c.parent_id);

  for (const root of roots) {
    const parentSeg = categorySlug(root.name);
    urls.push(`/catalogo/${parentSeg}`);
    const children = categories.filter((c) => c.parent_id === root.id);
    for (const child of children) {
      urls.push(`/catalogo/${parentSeg}/${categorySlug(child.name)}`);
    }
  }
  return urls;
}
