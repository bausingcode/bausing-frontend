import type { LucideIcon } from "lucide-react";
import type { Category } from "@/lib/api";
import { getNavbarMenuIcon } from "@/lib/navbarMenuIcons";

export interface BuiltSubcategoryItem {
  name: string;
  href: string;
  icon?: LucideIcon;
}

export interface BuiltCategoryItem {
  name: string;
  icon?: LucideIcon;
  iconSize?: { width: string; height: string };
  description?: string;
  href?: string;
  subcategories?: BuiltSubcategoryItem[];
}

/** Misma forma que `CategoryData` en Navbar (para uso en mega menú). */
export interface BuiltCategoryData {
  name: string;
  columns: {
    left: BuiltCategoryItem[];
    middle?: BuiltCategoryItem[];
  };
  imageUrl?: string;
  imageAlt?: string;
}

export function slugifyNavbarCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function buildNavbarCategoryDataFromApi(
  categoryName: string,
  apiCategories: Category[]
): BuiltCategoryData | null {
  const root = apiCategories.find((c) => !c.parent_id && c.name === categoryName);
  if (!root) return null;

  const mainSlug = slugifyNavbarCategoryName(root.name);
  const defaultIconSize = { width: "40px", height: "40px" } as const;
  const rawImg = root.navbar_image_url?.trim();

  const children = apiCategories
    .filter((c) => c.parent_id === root.id)
    .sort((a, b) => {
      const oa = a.order ?? 0;
      const ob = b.order ?? 0;
      if (oa !== ob) return oa - ob;
      return a.name.localeCompare(b.name);
    });

  if (children.length === 0) {
    return {
      name: root.name,
      columns: {
        left: [
          {
            name: "Ver todos",
            icon: getNavbarMenuIcon("LayoutGrid"),
            iconSize: { ...defaultIconSize },
            href: `/catalogo/${mainSlug}`,
          },
        ],
      },
      ...(rawImg ? { imageUrl: rawImg } : {}),
      imageAlt: root.name,
    };
  }

  const mapChild = (sub: Category): BuiltCategoryItem => {
    const opts = (sub.options ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const subIcon = getNavbarMenuIcon(sub.navbar_icon_key);

    if (opts.length > 0) {
      return {
        name: sub.name,
        icon: subIcon,
        iconSize: { ...defaultIconSize },
        description: sub.description?.trim() || undefined,
        subcategories: opts.map((opt) => ({
          name: opt.value,
          href: `/catalogo/${mainSlug}?filter=${encodeURIComponent(opt.id)}`,
          icon: getNavbarMenuIcon(opt.navbar_icon_key),
        })),
      };
    }

    return {
      name: sub.name,
      icon: subIcon,
      iconSize: { ...defaultIconSize },
      description: sub.description?.trim() || undefined,
      href: `/catalogo/${mainSlug}`,
    };
  };

  const items = children.map(mapChild);
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const middle = items.slice(mid);

  return {
    name: root.name,
    columns: {
      left,
      ...(middle.length > 0 ? { middle } : {}),
    },
    ...(rawImg ? { imageUrl: rawImg } : {}),
    imageAlt: root.name,
  };
}
