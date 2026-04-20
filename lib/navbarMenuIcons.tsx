import { createElement } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AirVent,
  Bed,
  BedDouble,
  Box,
  ChefHat,
  Coffee,
  CreditCard,
  Droplets,
  Flame,
  Heart,
  Layers,
  LayoutGrid,
  Microwave,
  Package,
  Refrigerator,
  Ruler,
  Sandwich,
  Sofa,
  Sparkles,
  Square,
  Tag,
  Truck,
  Tv,
  UtensilsCrossed,
  WashingMachine,
} from "lucide-react";

const NAVBAR_ICON_MAP: Record<string, LucideIcon> = {
  Package,
  CreditCard,
  BedDouble,
  Refrigerator,
  WashingMachine,
  AirVent,
  ChefHat,
  Tv,
  Microwave,
  Coffee,
  Droplets,
  Sandwich,
  Flame,
  Bed,
  Sofa,
  Tag,
  Box,
  Square,
  Layers,
  LayoutGrid,
  UtensilsCrossed,
  Ruler,
  Truck,
  Heart,
  Sparkles,
};

export type NavbarMenuIconKey = keyof typeof NAVBAR_ICON_MAP;

/** Etiquetas en español para el admin (mismas claves que en el mega menú estático). */
const NAVBAR_ICON_LABELS_ES: Record<NavbarMenuIconKey, string> = {
  CreditCard: "Colchón",
  BedDouble: "Sommier — cama doble",
  Refrigerator: "Heladera",
  WashingMachine: "Lavarropas",
  AirVent: "Aire acondicionado",
  ChefHat: "Cocina",
  Tv: "Smart TV",
  Microwave: "Microondas",
  Coffee: "Café / pava eléctrica",
  Droplets: "Vapor / vaporera",
  Sandwich: "Sándwich / sandwichera",
  Flame: "Anafe / llama",
  Bed: "Cama",
  Sofa: "Sofá",
  Tag: "Etiqueta",
  Box: "Caja",
  Square: "Cuadrado",
  Layers: "Capas",
  LayoutGrid: "Rejilla — ver todo el catálogo",
  UtensilsCrossed: "Cubiertos / cocina",
  Ruler: "Regla / medidas",
  Truck: "Camión / envío",
  Heart: "Corazón",
  Sparkles: "Destacado",
  Package: "Paquete (predeterminado)",
};

const COLCHONES_MENU_ICON_KEYS: NavbarMenuIconKey[] = ["CreditCard"];

export const NAVBAR_MENU_ICON_OPTIONS: { value: NavbarMenuIconKey; label: string }[] = (() => {
  const allKeys = Object.keys(NAVBAR_ICON_MAP) as NavbarMenuIconKey[];
  const rest = allKeys
    .filter((k) => !COLCHONES_MENU_ICON_KEYS.includes(k))
    .map((value) => ({ value, label: NAVBAR_ICON_LABELS_ES[value] }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
  const colchonesFirst = COLCHONES_MENU_ICON_KEYS.map((value) => ({
    value,
    label: NAVBAR_ICON_LABELS_ES[value],
  }));
  return [...colchonesFirst, ...rest];
})();

export function getNavbarMenuIcon(key: string | null | undefined): LucideIcon {
  if (!key) return Package;
  return NAVBAR_ICON_MAP[key] ?? Package;
}

export function NavbarMenuIconPreview({
  iconKey,
  className,
}: {
  iconKey: string | null | undefined;
  className?: string;
}) {
  const Icon = getNavbarMenuIcon(iconKey);
  return createElement(Icon, {
    className: className ?? "h-5 w-5 text-[#00C1A7]",
    strokeWidth: 1.5,
  });
}
