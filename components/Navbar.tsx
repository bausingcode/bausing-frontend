"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Truck, 
  CreditCard, 
  Search, 
  User, 
  Heart, 
  ShoppingCart,
  Tag,
  Package,
  ArrowRight,
  Bed,
  Sofa,
  LucideIcon,
  Microwave,
  Refrigerator,
  WashingMachine,
  AirVent,
  ChefHat,
  Tv,
  Coffee,
  UtensilsCrossed,
  Flame,
  Ruler,
  Layers,
  Combine,
  Droplets,
  Sandwich,
  LogOut,
  RectangleHorizontal,
  BedDouble,
  Square,
  Box
} from "lucide-react";
import Cart from "./Cart";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";

// Iconos personalizados
const PillowIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <rect width="24" height="24" stroke="none" fill="#000000" opacity="0" />
    <g transform="matrix(0.16 0 0 0.16 12 12)">
      <path
        style={{
          stroke: "none",
          strokeWidth: 1,
          strokeDasharray: "none",
          strokeLinecap: "butt",
          strokeDashoffset: 0,
          strokeLinejoin: "miter",
          strokeMiterlimit: 4,
          fill: "currentColor",
          fillRule: "nonzero",
          opacity: 1
        }}
        transform=" translate(-64, -63.95)"
        d="M 54 17 C 41.7 17 32.7 18.1 25.5 20.5 C 23.7 21.1 21.900781 21.000781 20.300781 20.300781 C 12.300781 16.500781 6.6003906 16.300391 3.4003906 19.400391 C 0.30039062 22.600391 0.59921875 28.1 4.1992188 36 C 4.8992188 37.5 5.0007813 39.399609 4.3007812 41.099609 C 3.7007812 42.699609 4.5996094 44.400391 6.0996094 44.900391 C 7.6996094 45.500391 9.4003906 44.599609 9.9003906 43.099609 C 11.100391 39.899609 10.899609 36.400391 9.5996094 33.400391 C 6.6996094 27.100391 7.0992187 24.199609 7.6992188 23.599609 C 8.2992187 22.999609 11.200781 22.599219 17.800781 25.699219 C 20.800781 27.099219 24.200391 27.299219 27.400391 26.199219 C 33.900391 23.999219 42.4 23 54 23 L 74 23 C 85.6 23 94.099609 23.999219 100.59961 26.199219 C 103.79961 27.299219 107.29922 27.099219 110.19922 25.699219 C 116.69922 22.599219 119.70078 22.999609 120.30078 23.599609 C 120.90078 24.199609 121.30039 27.000391 118.40039 33.400391 C 117.00039 36.400391 116.89961 39.799609 118.09961 43.099609 C 120.09961 48.599609 121 55.5 121 64 C 121 72.5 119.99961 79.400391 118.09961 84.900391 C 116.89961 88.100391 117.10039 91.599609 118.40039 94.599609 C 121.30039 100.89961 120.90078 103.80039 120.30078 104.40039 C 119.70078 105.00039 116.79922 105.40078 110.19922 102.30078 C 107.19922 100.90078 103.79961 100.70078 100.59961 101.80078 C 96.999609 103.00078 92.800781 103.90039 87.800781 104.40039 L 84.800781 104.69922 C 83.100781 104.79922 81.9 106.30039 82 107.90039 C 82.1 109.50039 83.599219 110.79922 85.199219 110.69922 C 86.299219 110.59922 87.400391 110.50039 88.400391 110.40039 C 93.800391 109.80039 98.4 108.9 102.5 107.5 C 104.3 106.9 106.09922 106.99922 107.69922 107.69922 C 111.99922 109.69922 115.69961 110.69922 118.59961 110.69922 C 121.09961 110.69922 123.1 110 124.5 108.5 C 127.6 105.4 127.40078 99.8 123.80078 92 C 123.10078 90.5 122.99922 88.600391 123.69922 86.900391 C 125.89922 80.700391 127 73.2 127 64 C 127 54.8 125.89922 47.299609 123.69922 41.099609 C 123.09922 39.299609 123.10078 37.5 123.80078 36 C 127.40078 28.2 127.6 22.6 124.5 19.5 C 121.3 16.3 115.59961 16.600391 107.59961 20.400391 C 105.99961 21.100391 104.20039 21.199609 102.40039 20.599609 C 95.300391 18.099609 86.3 17 74 17 L 54 17 z M 23.498047 41.251953 C 22.529297 41.301758 21.599609 41.824219 21.099609 42.699219 C 18.399609 47.199219 17 54.3 17 64 C 17 65.7 18.3 67 20 67 C 21.7 67 23 65.7 23 64 C 23 53.4 24.799219 48.200781 26.199219 45.800781 C 27.099219 44.400781 26.599219 42.499219 25.199219 41.699219 C 24.674219 41.361719 24.079297 41.22207 23.498047 41.251953 z M 4 61 C 2.3 61 1 62.3 1 64 C 1 73.2 2.1007813 80.700391 4.3007812 86.900391 C 4.9007812 88.700391 4.8992187 90.5 4.1992188 92 C 0.59921875 99.8 0.4 105.4 3.5 108.5 C 6.7 111.7 12.400391 111.39961 20.400391 107.59961 C 22.000391 106.89961 23.799609 106.80039 25.599609 107.40039 C 32.799609 109.80039 41.799609 110.90039 54.099609 110.90039 L 65.400391 110.90039 C 67.100391 110.90039 68.400391 109.60039 68.400391 107.90039 C 68.400391 106.20039 67.100391 104.90039 65.400391 104.90039 L 54 104.90039 C 42.4 104.90039 33.900391 103.89922 27.400391 101.69922 C 24.200391 100.59922 20.700781 100.79922 17.800781 102.19922 C 11.300781 105.29922 8.2992188 104.90078 7.6992188 104.30078 C 7.0992188 103.70078 6.6996094 100.9 9.5996094 94.5 C 10.999609 91.6 11.100391 88.100391 9.9003906 84.900391 C 8.0003906 79.400391 7 72.5 7 64 C 7 62.3 5.7 61 4 61 z"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

// Icono de sábanas
const SheetsIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <rect width="24" height="24" stroke="none" fill="#000000" opacity="0" />
    <g transform="matrix(0.42 0 0 0.42 12 12)">
      <g style={{}}>
        <g transform="matrix(1 0 0 1 -13.63 12.8)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-10.37, -36.8)"
            d="M 13.25 39.86 L 10.5 39.86 C 8.48 39.86 7.04 37.91 7.63 35.98 L 8.32 33.739999999999995"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 6.77 9.86)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-30.77, -33.86)"
            d="M 40.72 27.85 C 41.39 28.6 41.69 29.67 41.36 30.75 L 39.42 37.04 C 38.9 38.72 37.35 39.86 35.6 39.86 L 20.05 39.86"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 0.5 3.84)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-24.5, -27.84)"
            d="M 40.91 21.96 C 41.449999999999996 22.69 41.66 23.66 41.36 24.62 L 39.42 30.91 C 38.9 32.59 37.35 33.73 35.6 33.73 L 10.5 33.73 C 8.48 33.73 7.04 31.779999999999998 7.63 29.849999999999998 L 8.54 26.889999999999997"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 -6.51 0.56)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-17.49, -24.56)"
            d="M 27.48 27.62 L 10.5 27.62 C 8.48 27.62 7.04 25.67 7.63 23.740000000000002 L 8.32 21.5"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 13.5 -2.36)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-37.5, -21.64)"
            d="M 40.76 15.65 C 41.41 16.4 41.69 17.45 41.37 18.51 L 39.43 24.8 C 38.91 26.48 37.36 27.62 35.61 27.62 L 33.5 27.62"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 -5.33 -8.99)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-18.67, -15.01)"
            d="M 13.25 21.5 L 10.5 21.5 C 8.48 21.5 7.04 19.55 7.63 17.62 L 9.57 11.330000000000002 C 10.09 9.650000000000002 11.64 8.510000000000002 13.39 8.510000000000002 L 29.84 8.510000000000002"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 5.75 -9.01)" id="Layer_1">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 3,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 10,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-29.75, -14.99)"
            d="M 37.68 8.5 L 38.5 8.5 C 40.52 8.5 41.96 10.45 41.37 12.379999999999999 L 39.43 18.669999999999998 C 38.91 20.349999999999998 37.36 21.49 35.61 21.49 L 17.99 21.49"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  </svg>
);

// Icono de bajo mesada
const BajoMesadaIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <rect width="24" height="24" stroke="none" fill="#000000" opacity="0" />
    <g transform="matrix(0.83 0 0 0.83 12 12)">
      <g style={{}}>
        <g transform="matrix(1 0 0 1 0 -2.5)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-12, -9.5)"
            d="M 1.5 5 L 22.5 5 C 22.7652 5 23.0196 5.10536 23.2071 5.29289 C 23.3946 5.48043 23.5 5.73478 23.5 6 L 23.5 13.5 C 23.5 13.6326 23.4473 13.7598 23.3536 13.8536 C 23.2598 13.9473 23.1326 14 23 14 L 1 14 C 0.867392 14 0.740215 13.9473 0.646447 13.8536 C 0.552678 13.7598 0.5 13.6326 0.5 13.5 L 0.5 6 C 0.5 5.73478 0.605357 5.48043 0.792893 5.29289 C 0.98043 5.10536 1.23478 5 1.5 5 L 1.5 5 Z"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 0 3)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-12, -15)"
            d="M 1.5 14 L 22.5 14 L 22.5 15.5 C 22.5 15.6326 22.4473 15.7598 22.3536 15.8536 C 22.2598 15.9473 22.1326 16 22 16 L 2 16 C 1.86739 16 1.74021 15.9473 1.64645 15.8536 C 1.55268 15.7598 1.5 15.6326 1.5 15.5 L 1.5 14 Z"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 -8.5 5.5)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-3.5, -17.5)"
            d="M 3.5 16 L 3.5 19"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 8.5 5.5)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-20.5, -17.5)"
            d="M 20.5 16 L 20.5 19"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 2.5 -2.5)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-14.5, -9.5)"
            d="M 14.5 5 L 14.5 14"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 -4.5 -2.5)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-7.5, -9.5)"
            d="M 7.5 5 L 7.5 14"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 7 -1)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-19, -11)"
            d="M 14.5 11 L 23.5 11"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 7 -4)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "round",
              strokeDashoffset: 0,
              strokeLinejoin: "round",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-19, -8)"
            d="M 14.5 8 L 23.5 8"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 -6.88 -4.75)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "butt",
              strokeDashoffset: 0,
              strokeLinejoin: "miter",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-5.13, -7.25)"
            d="M 5.25 7.5 C 5.11193 7.5 5 7.38807 5 7.25 C 5 7.11193 5.11193 7 5.25 7"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 -6.63 -4.75)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "butt",
              strokeDashoffset: 0,
              strokeLinejoin: "miter",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-5.38, -7.25)"
            d="M 5.25 7.5 C 5.38807 7.5 5.5 7.38807 5.5 7.25 C 5.5 7.11193 5.38807 7 5.25 7"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 0.13 -4.75)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "butt",
              strokeDashoffset: 0,
              strokeLinejoin: "miter",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-12.13, -7.25)"
            d="M 12.25 7.5 C 12.1119 7.5 12 7.38807 12 7.25 C 12 7.11193 12.1119 7 12.25 7"
            strokeLinecap="round"
          />
        </g>
        <g transform="matrix(1 0 0 1 0.38 -4.75)">
          <path
            style={{
              stroke: "currentColor",
              strokeWidth: 1,
              strokeDasharray: "none",
              strokeLinecap: "butt",
              strokeDashoffset: 0,
              strokeLinejoin: "miter",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1
            }}
            transform=" translate(-12.38, -7.25)"
            d="M 12.25 7.5 C 12.3881 7.5 12.5 7.38807 12.5 7.25 C 12.5 7.11193 12.3881 7 12.25 7"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  </svg>
);

// Icono de colchón de frente (horizontal)
const MattressIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="10" width="18" height="4" rx="1" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

// Icono de cama de frente
const BedFrontIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="6" width="16" height="12" rx="1" />
    <rect x="4" y="14" width="16" height="4" rx="0.5" />
    <line x1="4" y1="10" x2="20" y2="10" />
  </svg>
);

// Crear referencias para los iconos personalizados como LucideIcon
const MattressIconRef = MattressIcon as unknown as LucideIcon;
const BedFrontIconRef = BedFrontIcon as unknown as LucideIcon;

// Tipos para la estructura de datos
interface SubcategoryItem {
  name: string;
  href: string;
  icon?: LucideIcon;
}

interface CategoryItem {
  name: string;
  icon?: LucideIcon;
  iconSize?: { width: string; height: string };
  description?: string;
  href?: string;
  subcategories?: SubcategoryItem[];
}

interface CategoryData {
  name: string;
  icon?: LucideIcon;
  columns: {
    left: CategoryItem[];
    middle?: CategoryItem[];
  };
  imageUrl?: string;
  imageAlt?: string;
}

// Estructura de datos escalable - Aquí puedes modificar fácilmente las categorías y subcategorías
const categoriesData: Record<string, CategoryData> = {
  "Colchones": {
    name: "Colchones",
    columns: {
      left: [
        {
          name: "Una plaza",
          icon: CreditCard,
          iconSize: { width: '50px', height: '35px' },
          description: "80x190 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/una-plaza/espuma-alta-densidad", icon: RectangleHorizontal },
            { name: "Resortes", href: "/colchones/una-plaza/resortes", icon: RectangleHorizontal }
          ]
        },
        {
          name: "Plaza y media",
          icon: CreditCard,
          iconSize: { width: '50px', height: '35px' },
          description: "90x190 / 100x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/plaza-y-media/espuma-alta-densidad", icon: RectangleHorizontal },
            { name: "Resortes", href: "/colchones/plaza-y-media/resortes", icon: RectangleHorizontal }
          ]
        },
        {
          name: "Dos plazas",
          icon: CreditCard,
          iconSize: { width: '50px', height: '35px' },
          description: "140x190 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/dos-plazas/espuma-alta-densidad", icon: RectangleHorizontal },
            { name: "Resortes", href: "/colchones/dos-plazas/resortes", icon: RectangleHorizontal }
          ]
        }
      ],
      middle: [
        {
          name: "Queen",
          icon: CreditCard,
          iconSize: { width: '50px', height: '35px' },
          description: "160x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/queen/espuma-alta-densidad", icon: RectangleHorizontal },
            { name: "Resortes", href: "/colchones/queen/resortes", icon: RectangleHorizontal }
          ]
        },
        {
          name: "Extra-queen",
          icon: CreditCard,
          iconSize: { width: '50px', height: '35px' },
          description: "180x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/extra-queen/espuma-alta-densidad", icon: RectangleHorizontal },
            { name: "Resortes", href: "/colchones/extra-queen/resortes", icon: RectangleHorizontal }
          ]
        },
        {
          name: "King",
          icon: CreditCard,
          iconSize: { width: '50px', height: '35px' },
          description: "200x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/king/espuma-alta-densidad", icon: RectangleHorizontal },
            { name: "Resortes", href: "/colchones/king/resortes", icon: RectangleHorizontal }
          ]
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Colchón"
  },
  "Sommiers": {
    name: "Sommiers",
    columns: {
      left: [
        {
          name: "Sommier (colchón + base)",
          icon: BedDouble,
          iconSize: { width: '50px', height: '40px' },
          href: "/sommiers/sommier-completo"
        },
        {
          name: "Bases",
          icon: BedDouble,
          iconSize: { width: '50px', height: '40px' },
          href: "/sommiers/bases"
        }
      ],
      middle: [
        {
          name: "Sommier + respaldo",
          icon: BedDouble,
          iconSize: { width: '50px', height: '40px' },
          href: "/sommiers/sommier-respaldo"
        },
        {
          name: "Respaldos",
          icon: BedDouble,
          iconSize: { width: '50px', height: '40px' },
          href: "/sommiers/respaldos"
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Sommier"
  },
  "Accesorios": {
    name: "Accesorios de descanso",
    columns: {
      left: [
        {
          name: "Sábanas",
          icon: SheetsIcon as LucideIcon,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/sabanas"
        },
        {
          name: "Cubre colchón",
          icon: SheetsIcon as LucideIcon,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/cubre-colchon"
        }
      ],
      middle: [
        {
          name: "Almohadas",
          icon: PillowIcon as LucideIcon,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/almohadas"
        },
        {
          name: "Acolchados",
          icon: SheetsIcon as LucideIcon,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/acolchados"
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Accesorios"
  },
  "Electrodomésticos": {
    name: "Electrodomésticos",
    columns: {
      left: [
        {
          name: "Grandes electros",
          icon: Refrigerator,
          iconSize: { width: '40px', height: '40px' },
          subcategories: [
            { name: "Heladeras", href: "/electrodomesticos/grandes/heladeras", icon: Refrigerator },
            { name: "Lavarropas", href: "/electrodomesticos/grandes/lavarropas", icon: WashingMachine },
            { name: "Aires acondicionados", href: "/electrodomesticos/grandes/aires-acondicionados", icon: AirVent },
            { name: "Cocinas", href: "/electrodomesticos/grandes/cocinas", icon: ChefHat },
            { name: "Smart TV", href: "/electrodomesticos/grandes/smart-tv", icon: Tv }
          ]
        },
        {
          name: "Pequeños electros",
          icon: Microwave,
          iconSize: { width: '40px', height: '40px' },
          subcategories: [
            { name: "Pava electrica", href: "/electrodomesticos/pequenos/pava-electrica", icon: Coffee },
            { name: "Vaporera", href: "/electrodomesticos/pequenos/vaporera", icon: Droplets },
            { name: "Sandwuchera", href: "/electrodomesticos/pequenos/sandwuchera", icon: Sandwich },
            { name: "Anafe", href: "/electrodomesticos/pequenos/anafe", icon: Flame }
          ]
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Electrodomésticos"
  },
  "Muebles de cocina": {
    name: "Muebles de cocina",
    columns: {
      left: [
        {
          name: "Bajo mesada 120 cm",
          icon: BajoMesadaIcon as LucideIcon,
          iconSize: { width: '40px', height: '40px' },
          href: "/muebles-cocina/bajo-mesada-120"
        },
        {
          name: "Bajo mesada 140 cm",
          icon: BajoMesadaIcon as LucideIcon,
          iconSize: { width: '40px', height: '40px' },
          href: "/muebles-cocina/bajo-mesada-140"
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Muebles de cocina"
  }
};

// Lista de categorías principales para el menú
const mainCategories = Object.keys(categoriesData);

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closingCategory, setClosingCategory] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isExitingRef = useRef(false);
  const closingTimestampRef = useRef<number>(0);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleFavoritesClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // TODO: Navegar a favoritos cuando esté implementado
    console.log("Favoritos");
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setIsCartOpen(true);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Top Header - Light Green Bar */}
        <div className="bg-[#00C1A7] py-1.5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 text-sm text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-white" />
                <span className="font-semibold">Envíos gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-white" />
                <span className="font-semibold">Grandes descuentos</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-white" />
                <span className="font-semibold">Cuotas sin interés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - White Bar */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-8">
              {/* Logo */}
              <a href="/" className="flex items-center flex-shrink-0 cursor-pointer">
                <img
                  src="/images/logo/logo.svg"
                  alt="BAUSING Logo"
                  className="h-10 w-auto"
                />
              </a>

              {/* Search Bar - Centered */}
              <div className="flex-1 flex justify-center px-8">
                <div className="relative w-full max-w-4xl">
                  <input
                    type="text"
                    placeholder="Buscar colchones, sommiers, almohadas..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" />
                </div>
              </div>

              {/* User and Cart Icons */}
              <div className="flex items-center justify-end gap-6 flex-shrink-0">
                {/* User Menu */}
                <div 
                  ref={userMenuRef}
                  className="relative z-[60]"
                >
                  {isAuthenticated && user ? (
                    <div 
                      className="flex items-center gap-2 cursor-pointer group relative"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      <User className="w-7 h-7 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-700 font-normal">Mi cuenta</span>
                        <span className="text-xs text-[#000000] font-semibold">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => router.push("/login")}
                    >
                      <User className="w-7 h-7 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-700 font-normal">Tu cuenta</span>
                        <span className="text-xs text-[#000000] font-semibold">Ingresa a tu cuenta</span>
                      </div>
                    </div>
                  )}
                  
                  {/* User Dropdown Menu */}
                  {showUserMenu && isAuthenticated && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60]"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Favorites */}
                <Heart 
                  className="w-6 h-6 text-gray-700 cursor-pointer hover:text-gray-900 transition-colors" 
                  onClick={handleFavoritesClick}
                />
                
                {/* Cart */}
                <div 
                  className="cursor-pointer group"
                  onClick={handleCartClick}
                >
                  <ShoppingCart 
                    className="w-6 h-6 text-gray-700 fill-transparent group-hover:text-black group-hover:fill-black transition-[color,fill] duration-300 ease-in-out" 
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav 
          className="bg-white border-b border-gray-200 relative"
          onMouseLeave={(e) => {
            // Verificar si el cursor va hacia un dropdown
            const relatedTarget = e.relatedTarget;
            const isGoingToDropdown = relatedTarget && 
              relatedTarget instanceof HTMLElement && 
              (relatedTarget.closest('.absolute.top-full') !== null || 
               relatedTarget.closest('[class*="animate-slideInFromTop"]') !== null);
            
            // Solo cerrar si el cursor sale completamente (no hacia un dropdown)
            if (!isGoingToDropdown) {
              // Marcar que el mouse está saliendo y registrar el timestamp
              isExitingRef.current = true;
              closingTimestampRef.current = Date.now();
              
              // Agregar un pequeño delay antes de cerrar
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
              }
              closeTimeoutRef.current = setTimeout(() => {
                // Verificar nuevamente si el mouse está sobre el dropdown antes de cerrar
                const dropdownElement = document.querySelector('.absolute.top-full');
                if (dropdownElement) {
                  const rect = dropdownElement.getBoundingClientRect();
                  // Padding más pequeño para área de detección
                  const padding = 10;
                  const expandedRect = {
                    left: rect.left - padding,
                    right: rect.right + padding,
                    top: rect.top - padding,
                    bottom: rect.bottom + padding
                  };
                  
                  // Obtener posición actual del mouse desde el evento
                  const mouseX = (e as any).clientX || 0;
                  const mouseY = (e as any).clientY || 0;
                  
                  if (mouseX >= expandedRect.left && mouseX <= expandedRect.right && 
                      mouseY >= expandedRect.top && mouseY <= expandedRect.bottom) {
                    // Si el mouse está cerca del dropdown, no está saliendo realmente
                    isExitingRef.current = false;
                    closingTimestampRef.current = 0;
                    return; // No cerrar si el mouse está cerca del dropdown
                  }
                }
                
                setHoveredCategory(null);
                setHoveredSubcategory(null);
                setPreviousCategory(null);
                setIsClosing(false);
                setClosingCategory(null);
                // Mantener la bandera por un tiempo corto para prevenir reapertura
                setTimeout(() => {
                  isExitingRef.current = false;
                  closingTimestampRef.current = 0;
                }, 200);
              }, 100); // Delay más corto para cerrar más rápido
            } else {
              // Si va hacia el dropdown, no está saliendo
              isExitingRef.current = false;
              closingTimestampRef.current = 0;
            }
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8 py-3">
              {mainCategories.map((categoryName) => {
                const categoryData = categoriesData[categoryName];
                const CategoryIcon = categoryData?.icon;
                return (
                  <a 
                    key={categoryName}
                    href="#" 
                    className="flex items-center gap-2 text-black hover:text-gray-600 font-medium"
                    onMouseEnter={() => {
                      // Solo bloquear si se cerró muy recientemente (menos de 150ms) Y se está saliendo
                      const timeSinceClosing = Date.now() - closingTimestampRef.current;
                      if (isExitingRef.current && timeSinceClosing < 150) {
                        // Solo bloquear si realmente se está saliendo y fue muy reciente
                        return;
                      }
                      
                      // Cancelar cualquier cierre pendiente cuando cambias de categoría
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                      
                      // Resetear las banderas si el mouse entra a una categoría
                      isExitingRef.current = false;
                      closingTimestampRef.current = 0;
                      
                      const wasOpen = hoveredCategory !== null;
                      const isDifferentCategory = hoveredCategory !== categoryName;
                      
                      // Si cambias a una categoría diferente, resetear el estado de cierre
                      if (isDifferentCategory) {
                        setIsClosing(false);
                        setClosingCategory(null);
                        setHoveredSubcategory(null);
                      }
                      
                      setPreviousCategory(hoveredCategory);
                      setHoveredCategory(categoryName);
                    }}
                  >
                    {CategoryIcon && (
                      <CategoryIcon className="w-5 h-5 text-[#00C1A7]" />
                    )}
                    <span>{categoryName}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Dropdown Menus - Generated from data */}
          {mainCategories.map((categoryName) => {
            const categoryData = categoriesData[categoryName];
            if (!categoryData) return null;
            
            const isActive = hoveredCategory === categoryName || closingCategory === categoryName;
            if (!isActive) return null;

            // Encontrar el item activo que tiene el submenu abierto
            const activeItem = categoryData.columns.left
              .concat(categoryData.columns.middle || [])
              .find(item => item.name === hoveredSubcategory);

            // El grid siempre tiene 3 columnas: izquierda, medio (puede estar vacía), y derecha (imagen)
            const gridCols = 'grid-cols-3';

            // Obtener nombres de items de la columna izquierda para mostrar subcategorías en la columna del medio
            const leftColumnItemNames = categoryData.columns.left
              .filter(item => item.subcategories && item.subcategories.length > 0)
              .map(item => item.name);

            // Obtener nombres de items de la columna del medio para mostrar subcategorías en la columna derecha
            const middleColumnItemNames = categoryData.columns.middle
              ?.filter(item => item.subcategories && item.subcategories.length > 0)
              .map(item => item.name) || [];

            return (
              <div 
                key={categoryName}
                className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === categoryName ? 'animate-slideOutToTop' : ''}`}
                style={{ marginTop: '-1px' }}
                onMouseEnter={() => {
                  // Si el mouse entra al dropdown, no está saliendo
                  isExitingRef.current = false;
                  closingTimestampRef.current = 0;
                  
                  // Cancelar cualquier cierre pendiente
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  if (isClosing) {
                    setIsClosing(false);
                    setClosingCategory(null);
                  }
                }}
                onMouseLeave={(e) => {
                  // Verificar si el cursor va hacia el nav
                  const relatedTarget = e.relatedTarget;
                  const isGoingToNav = relatedTarget && 
                    relatedTarget instanceof HTMLElement && 
                    relatedTarget.closest('nav') !== null;
                  
                  // Si va hacia el nav, no cerrar (el nav manejará el cierre)
                  if (isGoingToNav) {
                    isExitingRef.current = false;
                    closingTimestampRef.current = 0;
                    return;
                  }
                  
                  // Si sale completamente, marcar que está saliendo e iniciar el cierre
                  isExitingRef.current = true;
                  closingTimestampRef.current = Date.now();
                  
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                  }
                  setIsClosing(true);
                  setClosingCategory(categoryName);
                  closeTimeoutRef.current = setTimeout(() => {
                    setHoveredCategory(null);
                    setHoveredSubcategory(null);
                    setPreviousCategory(null);
                    setIsClosing(false);
                    setClosingCategory(null);
                    // Mantener la bandera por un tiempo corto para prevenir reapertura
                    setTimeout(() => {
                      isExitingRef.current = false;
                      closingTimestampRef.current = 0;
                    }, 200);
                  }, 100); // Delay más corto para cerrar más rápido
                }}
              >
                <div className="container mx-auto px-4 py-6">
                  <div className={`grid ${gridCols} gap-8`}>
                    {/* Columna izquierda */}
                    {categoryData.columns.left && categoryData.columns.left.length > 0 && (
                      <div className="space-y-4">
                        {categoryData.columns.left.map((item, idx) => {
                          const Icon = item.icon || Package;
                          const hasSubcategories = item.subcategories && item.subcategories.length > 0;
                          
                          const ItemWrapper = item.href ? 'a' : 'div';
                          const itemProps = item.href ? { href: item.href } : {};

                          return (
                            <ItemWrapper
                              key={idx}
                              {...itemProps}
                              className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                              onMouseEnter={() => {
                                if (hasSubcategories) {
                                  // Cancelar cualquier cierre pendiente y resetear banderas
                                  if (closeTimeoutRef.current) {
                                    clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  // Resetear las banderas de salida cuando el mouse entra a un item
                                  isExitingRef.current = false;
                                  closingTimestampRef.current = 0;
                                  setHoveredSubcategory(item.name);
                                } else {
                                  setHoveredSubcategory(null);
                                }
                              }}
                              onMouseLeave={() => {
                                // No cerrar inmediatamente al salir del item si tiene subcategorías
                                if (hasSubcategories) {
                                  // Solo cerrar si el mouse va fuera del dropdown completo
                                  return;
                                }
                                setHoveredSubcategory(null);
                              }}
                              onClick={(e) => {
                                // Si no tiene subcategorías, permitir navegación normal
                                if (!hasSubcategories && item.href) {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              {item.icon && (
                                <div className="flex-shrink-0" style={{ width: '80px' }}>
                                  {item.icon === PillowIcon || item.icon === BedFrontIcon || item.icon === SheetsIcon || item.icon === BajoMesadaIcon ? (
                                    item.icon === PillowIcon ? (
                                      <PillowIcon 
                                        className="text-[#00C1A7]" 
                                        style={item.iconSize || { width: '40px', height: '40px' }} 
                                      />
                                    ) : item.icon === BedFrontIcon ? (
                                      <BedFrontIcon 
                                        className="text-[#00C1A7]" 
                                        style={item.iconSize || { width: '40px', height: '40px' }} 
                                      />
                                    ) : item.icon === SheetsIcon ? (
                                      <SheetsIcon 
                                        className="text-[#00C1A7]" 
                                        style={item.iconSize || { width: '40px', height: '40px' }} 
                                      />
                                    ) : (
                                      <BajoMesadaIcon 
                                        className="text-[#00C1A7]" 
                                        style={item.iconSize || { width: '40px', height: '40px' }} 
                                      />
                                    )
                                  ) : (
                                    <Icon 
                                      className="text-[#00C1A7]" 
                                      strokeWidth={1.5} 
                                      style={item.iconSize || { width: '40px', height: '40px' }} 
                                    />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </ItemWrapper>
                          );
                        })}
                      </div>
                    )}

                    {/* Columna del medio */}
                    {categoryData.columns.middle && categoryData.columns.middle.length > 0 ? (
                      <div className="space-y-4">
                        {hoveredSubcategory && leftColumnItemNames.includes(hoveredSubcategory) ? (
                          // Mostrar subcategorías cuando se hace hover sobre un item de la columna izquierda
                          activeItem && activeItem.subcategories ? (
                            <div 
                              className="animate-slideInFromTop"
                              onMouseEnter={() => {
                                // Cancelar cualquier cierre pendiente y resetear banderas
                                if (closeTimeoutRef.current) {
                                  clearTimeout(closeTimeoutRef.current);
                                  closeTimeoutRef.current = null;
                                }
                                // Resetear las banderas de salida
                                isExitingRef.current = false;
                                closingTimestampRef.current = 0;
                                if (isClosing) {
                                  setIsClosing(false);
                                  setClosingCategory(null);
                                }
                                setHoveredSubcategory(activeItem.name);
                              }}
                              onMouseLeave={(e) => {
                                // Verificar si el cursor va hacia otro elemento del menú
                                const relatedTarget = e.relatedTarget;
                                const isGoingToMenu = relatedTarget && 
                                  relatedTarget instanceof HTMLElement && 
                                  (relatedTarget.closest('.absolute') !== null || 
                                   relatedTarget.closest('nav') !== null);
                                
                                // Solo cerrar si el mouse sale completamente del menú
                                if (!isGoingToMenu) {
                                  setHoveredSubcategory(null);
                                }
                              }}
                            >
                              <h3 className="font-semibold text-lg text-gray-900 mb-4">{activeItem.name}</h3>
                              <div className="space-y-3">
                                {activeItem.subcategories.map((subcat, subIdx) => {
                                  const SubIcon = subcat.icon;
                                  return (
                                    <a 
                                      key={subIdx}
                                      href={subcat.href} 
                                      className="flex items-center gap-3 text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100 cursor-pointer"
                                      onClick={(e) => {
                                        // Permitir navegación normal
                                        e.stopPropagation();
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevenir que el menú se cierre
                                        e.stopPropagation();
                                      }}
                                    >
                                      {SubIcon && (
                                        <SubIcon className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                                      )}
                                      <span>{subcat.name}</span>
                                    </a>
                                  );
                                })}
                                <button
                                  onClick={() => setHoveredSubcategory(null)}
                                  className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                                >
                                  ← Volver atrás
                                </button>
                              </div>
                            </div>
                          ) : null
                        ) : (
                          // Mostrar items normales de la columna del medio
                          categoryData.columns.middle.map((item, idx) => {
                            const Icon = item.icon || Package;
                            const hasSubcategories = item.subcategories && item.subcategories.length > 0;
                            
                            const ItemWrapper = item.href ? 'a' : 'div';
                            const itemProps = item.href ? { href: item.href } : {};

                            return (
                              <ItemWrapper
                                key={idx}
                                {...itemProps}
                                className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                                onMouseEnter={() => {
                                  // Cancelar cualquier cierre pendiente y resetear banderas
                                  if (closeTimeoutRef.current) {
                                    clearTimeout(closeTimeoutRef.current);
                                    closeTimeoutRef.current = null;
                                  }
                                  // Resetear las banderas de salida cuando el mouse entra a un item
                                  isExitingRef.current = false;
                                  closingTimestampRef.current = 0;
                                  
                                  if (hasSubcategories) {
                                    setHoveredSubcategory(item.name);
                                  } else {
                                    setHoveredSubcategory(null);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (hasSubcategories) {
                                    // Verificar si el cursor va hacia el área de subcategorías
                                    const relatedTarget = e.relatedTarget;
                                    const isGoingToSubcategories = relatedTarget && 
                                      relatedTarget instanceof HTMLElement && 
                                      (relatedTarget.closest('[class*="animate-slideInFromTop"]') !== null ||
                                       relatedTarget.closest('.space-y-3') !== null);
                                    
                                    // Solo cerrar si el mouse sale completamente del menú
                                    if (!isGoingToSubcategories) {
                                      // Agregar un delay antes de cerrar para permitir movimiento hacia subcategorías
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                      }
                                      closeTimeoutRef.current = setTimeout(() => {
                                        // Verificar nuevamente si el mouse está sobre las subcategorías
                                        const subcategoryElement = document.querySelector('[class*="animate-slideInFromTop"]');
                                        if (!subcategoryElement) {
                                          setHoveredSubcategory(null);
                                        }
                                      }, 150);
                                    }
                                  } else {
                                    setHoveredSubcategory(null);
                                  }
                                }}
                              >
                                {item.icon && (
                                  <div className="flex-shrink-0" style={{ width: '80px' }}>
                                    {item.icon === PillowIcon || item.icon === BedFrontIcon || item.icon === SheetsIcon || item.icon === BajoMesadaIcon ? (
                                      item.icon === PillowIcon ? (
                                        <PillowIcon 
                                          className="text-[#00C1A7]" 
                                          style={item.iconSize || { width: '40px', height: '40px' }} 
                                        />
                                      ) : item.icon === BedFrontIcon ? (
                                        <BedFrontIcon 
                                          className="text-[#00C1A7]" 
                                          style={item.iconSize || { width: '40px', height: '40px' }} 
                                        />
                                      ) : item.icon === SheetsIcon ? (
                                        <SheetsIcon 
                                          className="text-[#00C1A7]" 
                                          style={item.iconSize || { width: '40px', height: '40px' }} 
                                        />
                                      ) : (
                                        <BajoMesadaIcon 
                                          className="text-[#00C1A7]" 
                                          style={item.iconSize || { width: '40px', height: '40px' }} 
                                        />
                                      )
                                    ) : (
                                      <Icon 
                                        className="text-[#00C1A7]" 
                                        strokeWidth={1.5} 
                                        style={item.iconSize || { width: '40px', height: '40px' }} 
                                      />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">
                                    {item.name}
                                  </p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                              </ItemWrapper>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      // Mostrar subcategorías cuando no hay columna del medio pero hay items con subcategorías en la izquierda
                      hoveredSubcategory && leftColumnItemNames.includes(hoveredSubcategory) && activeItem && activeItem.subcategories ? (
                        <div className="space-y-4">
                          <div 
                            className="animate-slideInFromTop"
                            onMouseEnter={() => {
                              // Cancelar cualquier cierre pendiente y resetear banderas
                              if (closeTimeoutRef.current) {
                                clearTimeout(closeTimeoutRef.current);
                                closeTimeoutRef.current = null;
                              }
                              // Resetear las banderas de salida
                              isExitingRef.current = false;
                              closingTimestampRef.current = 0;
                              if (isClosing) {
                                setIsClosing(false);
                                setClosingCategory(null);
                              }
                              setHoveredSubcategory(activeItem.name);
                            }}
                            onMouseLeave={(e) => {
                              // Verificar si el cursor va hacia otro elemento del menú
                              const relatedTarget = e.relatedTarget;
                              const isGoingToMenu = relatedTarget && 
                                relatedTarget instanceof HTMLElement && 
                                (relatedTarget.closest('.absolute') !== null || 
                                 relatedTarget.closest('nav') !== null);
                              
                              // Solo cerrar si el mouse sale completamente del menú
                              if (!isGoingToMenu) {
                                setHoveredSubcategory(null);
                              }
                            }}
                          >
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">{activeItem.name}</h3>
                            <div className="space-y-3">
                              {activeItem.subcategories.map((subcat, subIdx) => {
                                const SubIcon = subcat.icon;
                                return (
                                  <a 
                                    key={subIdx}
                                    href={subcat.href} 
                                    className="flex items-center gap-3 text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100 cursor-pointer relative z-10"
                                    onClick={(e) => {
                                      // Cancelar cualquier cierre pendiente
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                        closeTimeoutRef.current = null;
                                      }
                                      // Permitir navegación normal
                                      e.stopPropagation();
                                    }}
                                    onMouseDown={(e) => {
                                      // Cancelar cualquier cierre pendiente
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                        closeTimeoutRef.current = null;
                                      }
                                      // Prevenir que el menú se cierre
                                      e.stopPropagation();
                                    }}
                                    onMouseEnter={() => {
                                      // Cancelar cualquier cierre pendiente cuando el mouse entra
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                        closeTimeoutRef.current = null;
                                      }
                                      if (isClosing) {
                                        setIsClosing(false);
                                        setClosingCategory(null);
                                      }
                                    }}
                                  >
                                    {SubIcon && (
                                      <SubIcon className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                                    )}
                                    <span>{subcat.name}</span>
                                  </a>
                                );
                              })}
                              <button
                                onClick={() => setHoveredSubcategory(null)}
                                className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                              >
                                ← Volver atrás
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Columna vacía para mantener el grid cuando no hay columna del medio ni subcategorías
                        <div></div>
                      )
                    )}

                    {/* Columna derecha - Imagen o subcategorías */}
                    <div 
                      className="flex flex-col relative"
                      style={{ minHeight: '320px' }}
                      onMouseEnter={() => {
                        // Cancelar cualquier cierre pendiente cuando el mouse entra en esta columna
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                        if (isClosing) {
                          setIsClosing(false);
                          setClosingCategory(null);
                        }
                        // Asegurar que la categoría permanezca abierta
                        if (hoveredCategory !== categoryName) {
                          setHoveredCategory(categoryName);
                        }
                      }}
                      onMouseLeave={(e) => {
                        // Solo cerrar si el mouse sale completamente fuera del área del menú
                        const relatedTarget = e.relatedTarget;
                        const isGoingToMenu = relatedTarget && 
                          relatedTarget instanceof HTMLElement && 
                          (relatedTarget.closest('.absolute') !== null || 
                           relatedTarget.closest('nav') !== null ||
                           relatedTarget.closest('[class*="space-y-4"]') !== null ||
                           relatedTarget.closest('[class*="space-y-3"]') !== null);
                        
                        if (!isGoingToMenu) {
                          // Solo cerrar subcategorías si no hay subcategorías activas o si el mouse sale completamente
                          const mouseX = (e as any).clientX || 0;
                          const mouseY = (e as any).clientY || 0;
                          const dropdownElement = document.querySelector('.absolute.top-full');
                          if (dropdownElement) {
                            const rect = dropdownElement.getBoundingClientRect();
                            const padding = 50;
                            const expandedRect = {
                              left: rect.left - padding,
                              right: rect.right + padding,
                              top: rect.top - padding,
                              bottom: rect.bottom + padding
                            };
                            
                            // Si el mouse está todavía cerca del menú, no cerrar
                            if (mouseX >= expandedRect.left && mouseX <= expandedRect.right && 
                                mouseY >= expandedRect.top && mouseY <= expandedRect.bottom) {
                              return;
                            }
                          }
                          
                          // Delay antes de cerrar
                          if (closeTimeoutRef.current) {
                            clearTimeout(closeTimeoutRef.current);
                          }
                          closeTimeoutRef.current = setTimeout(() => {
                            setHoveredSubcategory(null);
                          }, 200);
                        }
                      }}
                    >
                      {hoveredSubcategory && middleColumnItemNames.includes(hoveredSubcategory) ? (
                        // Mostrar subcategorías cuando se hace hover sobre un item de la columna del medio
                        activeItem && activeItem.subcategories ? (
                          <div 
                            className="w-full h-80 animate-slideInFromTop flex flex-col justify-start relative z-20"
                            onMouseEnter={() => {
                              // Cancelar cualquier cierre pendiente y resetear banderas
                              if (closeTimeoutRef.current) {
                                clearTimeout(closeTimeoutRef.current);
                                closeTimeoutRef.current = null;
                              }
                              // Resetear las banderas de salida
                              isExitingRef.current = false;
                              closingTimestampRef.current = 0;
                              if (isClosing) {
                                setIsClosing(false);
                                setClosingCategory(null);
                              }
                              // Asegurar que la categoría permanezca abierta
                              if (hoveredCategory !== categoryName) {
                                setHoveredCategory(categoryName);
                              }
                              // Mantener el hover de la subcategoría activa
                              if (activeItem) {
                                setHoveredSubcategory(activeItem.name);
                              }
                            }}
                            onMouseLeave={(e) => {
                              // Verificar si el cursor va hacia otro elemento del menú
                              const relatedTarget = e.relatedTarget;
                              const isGoingToMenu = relatedTarget && 
                                relatedTarget instanceof HTMLElement && 
                                (relatedTarget.closest('.absolute') !== null || 
                                 relatedTarget.closest('nav') !== null ||
                                 relatedTarget.closest('[class*="space-y-4"]') !== null);
                              
                              // Solo cerrar si el mouse sale completamente del menú
                              if (!isGoingToMenu) {
                                // Delay antes de cerrar las subcategorías para permitir movimiento entre elementos
                                if (closeTimeoutRef.current) {
                                  clearTimeout(closeTimeoutRef.current);
                                }
                                closeTimeoutRef.current = setTimeout(() => {
                                  // Verificar nuevamente si el mouse está sobre algún elemento del menú
                                  const mouseX = (e as any).clientX || 0;
                                  const mouseY = (e as any).clientY || 0;
                                  const dropdownElement = document.querySelector('.absolute.top-full');
                                  if (dropdownElement) {
                                    const rect = dropdownElement.getBoundingClientRect();
                                    const padding = 50;
                                    const expandedRect = {
                                      left: rect.left - padding,
                                      right: rect.right + padding,
                                      top: rect.top - padding,
                                      bottom: rect.bottom + padding
                                    };
                                    
                                    if (mouseX >= expandedRect.left && mouseX <= expandedRect.right && 
                                        mouseY >= expandedRect.top && mouseY <= expandedRect.bottom) {
                                      return; // No cerrar si el mouse está cerca del menú
                                    }
                                  }
                                  setHoveredSubcategory(null);
                                }, 200);
                              }
                            }}
                          >
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">{activeItem.name}</h3>
                            <div className="space-y-3">
                              {activeItem.subcategories.map((subcat, subIdx) => {
                                const SubIcon = subcat.icon;
                                return (
                                  <a 
                                    key={subIdx}
                                    href={subcat.href} 
                                    className="flex items-center gap-3 text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100 cursor-pointer relative z-10"
                                    onClick={(e) => {
                                      // Cancelar cualquier cierre pendiente
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                        closeTimeoutRef.current = null;
                                      }
                                      // Permitir navegación normal
                                      e.stopPropagation();
                                    }}
                                    onMouseDown={(e) => {
                                      // Cancelar cualquier cierre pendiente
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                        closeTimeoutRef.current = null;
                                      }
                                      // Prevenir que el menú se cierre
                                      e.stopPropagation();
                                    }}
                                    onMouseEnter={() => {
                                      // Cancelar cualquier cierre pendiente cuando el mouse entra
                                      if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current);
                                        closeTimeoutRef.current = null;
                                      }
                                      if (isClosing) {
                                        setIsClosing(false);
                                        setClosingCategory(null);
                                      }
                                    }}
                                  >
                                    {SubIcon && (
                                      <SubIcon className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                                    )}
                                    <span>{subcat.name}</span>
                                  </a>
                                );
                              })}
                              <button
                                onClick={() => setHoveredSubcategory(null)}
                                className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                              >
                                ← Volver atrás
                              </button>
                            </div>
                          </div>
                        ) : null
                      ) : categoryData.imageUrl ? (
                        // Mostrar imagen
                        <div className="relative w-full h-80 rounded-lg overflow-hidden">
                          <img
                            src={categoryData.imageUrl}
                            alt={categoryData.imageAlt || categoryData.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Cart Overlay */}
        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        
      </>
    );
}

