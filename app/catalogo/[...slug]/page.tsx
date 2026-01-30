"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchProducts, fetchCategories, Product, Category } from "@/lib/api";
import { useLocality } from "@/contexts/LocalityContext";
import { ChevronDown, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import { calculateProductPrice } from "@/utils/priceUtils";

// ============================================
// PRODUCTOS DE EJEMPLO - FÁCIL DE BORRAR
// ============================================
// TODO: Eliminar esta sección cuando se conecte con la API real
const EXAMPLE_PRODUCTS: Record<string, Product[]> = {
  "Colchones": [
    {
      id: "example-colchon-1",
      name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
      description: "Colchón de resortes de alta calidad",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 750000,
      max_price: 750000,
      price_range: "$750.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-2",
      name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
      description: "Colchón de resortes premium",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 400000,
      max_price: 400000,
      price_range: "$400.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-3",
      name: "Colchón Vitto Queen (160×200cm) espuma alta densidad",
      description: "Colchón de espuma de alta densidad",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 650000,
      max_price: 650000,
      price_range: "$650.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-4",
      name: "Colchón Lumma King (200×200cm) de resortes",
      description: "Colchón king size de resortes",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 900000,
      max_price: 900000,
      price_range: "$900.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-5",
      name: "Colchón Vitto 1 plaza (80×190cm) espuma alta densidad",
      description: "Colchón individual de espuma",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 350000,
      max_price: 350000,
      price_range: "$350.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-6",
      name: "Colchón Lumma Extra-Queen (180×200cm) de resortes",
      description: "Colchón extra-queen de resortes",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 850000,
      max_price: 850000,
      price_range: "$850.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-7",
      name: "Colchón Vitto Plaza y media (100×190cm) espuma alta densidad",
      description: "Colchón plaza y media de espuma de alta densidad",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 420000,
      max_price: 420000,
      price_range: "$420.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-8",
      name: "Colchón Lumma Queen (160×200cm) resortes pocket",
      description: "Colchón queen con resortes pocket",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 780000,
      max_price: 780000,
      price_range: "$780.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-9",
      name: "Colchón Vitto 2 plazas (140×190cm) resortes bicónicos",
      description: "Colchón de resortes bicónicos premium",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 680000,
      max_price: 680000,
      price_range: "$680.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-10",
      name: "Colchón Lumma King (200×200cm) espuma alta densidad",
      description: "Colchón king size de espuma de alta densidad",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 950000,
      max_price: 950000,
      price_range: "$950.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-11",
      name: "Colchón Vitto 1 plaza (80×190cm) resortes pocket",
      description: "Colchón individual con resortes pocket",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 380000,
      max_price: 380000,
      price_range: "$380.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-12",
      name: "Colchón Lumma Extra-Queen (180×200cm) espuma alta densidad",
      description: "Colchón extra-queen de espuma de alta densidad",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 820000,
      max_price: 820000,
      price_range: "$820.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-13",
      name: "Colchón Vitto Queen (160×200cm) resortes bicónicos",
      description: "Colchón queen con resortes bicónicos",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 720000,
      max_price: 720000,
      price_range: "$720.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-14",
      name: "Colchón Lumma Plaza y media (100×190cm) resortes pocket",
      description: "Colchón plaza y media con resortes pocket",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 450000,
      max_price: 450000,
      price_range: "$450.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-15",
      name: "Colchón Vitto 2 plazas (140×190cm) espuma alta densidad",
      description: "Colchón dos plazas de espuma de alta densidad",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 580000,
      max_price: 580000,
      price_range: "$580.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-16",
      name: "Colchón Lumma King (200×200cm) resortes bicónicos",
      description: "Colchón king size con resortes bicónicos",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 980000,
      max_price: 980000,
      price_range: "$980.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-17",
      name: "Colchón Vitto 1 plaza (80×190cm) resortes bicónicos",
      description: "Colchón individual con resortes bicónicos",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 360000,
      max_price: 360000,
      price_range: "$360.000",
      is_active: true,
      category_name: "Colchones",
    },
    {
      id: "example-colchon-18",
      name: "Colchón Lumma Extra-Queen (180×200cm) resortes bicónicos",
      description: "Colchón extra-queen con resortes bicónicos",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 880000,
      max_price: 880000,
      price_range: "$880.000",
      is_active: true,
      category_name: "Colchones",
    },
  ],
  "Sommiers": [
    {
      id: "example-sommier-1",
      name: "Sommier Vitto 2 plazas (140×190cm) completo",
      description: "Sommier completo con colchón y base",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 1200000,
      max_price: 1200000,
      price_range: "$1.200.000",
      is_active: true,
      category_name: "Sommiers",
    },
    {
      id: "example-sommier-2",
      name: "Sommier Lumma Queen (160×200cm) con respaldo",
      description: "Sommier queen con respaldo integrado",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 1500000,
      max_price: 1500000,
      price_range: "$1.500.000",
      is_active: true,
      category_name: "Sommiers",
    },
    {
      id: "example-sommier-3",
      name: "Base Sommier King (200×200cm)",
      description: "Base para sommier king size",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 450000,
      max_price: 450000,
      price_range: "$450.000",
      is_active: true,
      category_name: "Sommiers",
    },
    {
      id: "example-sommier-4",
      name: "Respaldo Sommier 2 plazas",
      description: "Respaldo para sommier de 2 plazas",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 300000,
      max_price: 300000,
      price_range: "$300.000",
      is_active: true,
      category_name: "Sommiers",
    },
    {
      id: "example-sommier-5",
      name: "Sommier Vitto 1 plaza (80×190cm) completo",
      description: "Sommier individual completo",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 800000,
      max_price: 800000,
      price_range: "$800.000",
      is_active: true,
      category_name: "Sommiers",
    },
    {
      id: "example-sommier-6",
      name: "Sommier Lumma Extra-Queen (180×200cm) completo",
      description: "Sommier extra-queen completo",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 1800000,
      max_price: 1800000,
      price_range: "$1.800.000",
      is_active: true,
      category_name: "Sommiers",
    },
  ],
  "Accesorios": [
    {
      id: "example-accesorio-1",
      name: "Sábanas de algodón 2 plazas",
      description: "Juego de sábanas de algodón premium",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 45000,
      max_price: 45000,
      price_range: "$45.000",
      is_active: true,
      category_name: "Accesorios",
    },
    {
      id: "example-accesorio-2",
      name: "Cubre colchón impermeable Queen",
      description: "Cubre colchón impermeable y transpirable",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 35000,
      max_price: 35000,
      price_range: "$35.000",
      is_active: true,
      category_name: "Accesorios",
    },
    {
      id: "example-accesorio-3",
      name: "Almohada viscoelástica premium",
      description: "Almohada de viscoelástica de alta calidad",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 25000,
      max_price: 25000,
      price_range: "$25.000",
      is_active: true,
      category_name: "Accesorios",
    },
    {
      id: "example-accesorio-4",
      name: "Acolchado 2 plazas algodón",
      description: "Acolchado de algodón para 2 plazas",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 85000,
      max_price: 85000,
      price_range: "$85.000",
      is_active: true,
      category_name: "Accesorios",
    },
    {
      id: "example-accesorio-5",
      name: "Sábanas de microfibra King",
      description: "Juego de sábanas de microfibra",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 55000,
      max_price: 55000,
      price_range: "$55.000",
      is_active: true,
      category_name: "Accesorios",
    },
    {
      id: "example-accesorio-6",
      name: "Almohada de plumas premium",
      description: "Almohada de plumas de ganso",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 40000,
      max_price: 40000,
      price_range: "$40.000",
      is_active: true,
      category_name: "Accesorios",
    },
  ],
  "Electrodomésticos": [
    {
      id: "example-electro-1",
      name: "Heladera No Frost 350L",
      description: "Heladera No Frost de 350 litros",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 850000,
      max_price: 850000,
      price_range: "$850.000",
      is_active: true,
      category_name: "Electrodomésticos",
    },
    {
      id: "example-electro-2",
      name: "Lavarropas automático 8kg",
      description: "Lavarropas automático de 8kg",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 650000,
      max_price: 650000,
      price_range: "$650.000",
      is_active: true,
      category_name: "Electrodomésticos",
    },
    {
      id: "example-electro-3",
      name: "Aire acondicionado Split 3000 frigorías",
      description: "Aire acondicionado split inverter",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 450000,
      max_price: 450000,
      price_range: "$450.000",
      is_active: true,
      category_name: "Electrodomésticos",
    },
    {
      id: "example-electro-4",
      name: "Cocina 4 hornallas con horno",
      description: "Cocina a gas de 4 hornallas",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 320000,
      max_price: 320000,
      price_range: "$320.000",
      is_active: true,
      category_name: "Electrodomésticos",
    },
    {
      id: "example-electro-5",
      name: "Smart TV 55 pulgadas 4K",
      description: "Smart TV 55 pulgadas 4K UHD",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 750000,
      max_price: 750000,
      price_range: "$750.000",
      is_active: true,
      category_name: "Electrodomésticos",
    },
    {
      id: "example-electro-6",
      name: "Pava eléctrica inoxidable",
      description: "Pava eléctrica de acero inoxidable",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 25000,
      max_price: 25000,
      price_range: "$25.000",
      is_active: true,
      category_name: "Electrodomésticos",
    },
  ],
  "Muebles de cocina": [
    {
      id: "example-mueble-1",
      name: "Bajo mesada 120 cm blanco",
      description: "Bajo mesada de 120cm en color blanco",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 280000,
      max_price: 280000,
      price_range: "$280.000",
      is_active: true,
      category_name: "Muebles de cocina",
    },
    {
      id: "example-mueble-2",
      name: "Bajo mesada 140 cm blanco",
      description: "Bajo mesada de 140cm en color blanco",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 320000,
      max_price: 320000,
      price_range: "$320.000",
      is_active: true,
      category_name: "Muebles de cocina",
    },
    {
      id: "example-mueble-3",
      name: "Bajo mesada 120 cm gris",
      description: "Bajo mesada de 120cm en color gris",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 290000,
      max_price: 290000,
      price_range: "$290.000",
      is_active: true,
      category_name: "Muebles de cocina",
    },
    {
      id: "example-mueble-4",
      name: "Bajo mesada 140 cm gris",
      description: "Bajo mesada de 140cm en color gris",
      main_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
      min_price: 330000,
      max_price: 330000,
      price_range: "$330.000",
      is_active: true,
      category_name: "Muebles de cocina",
    },
    {
      id: "example-mueble-5",
      name: "Bajo mesada 120 cm madera",
      description: "Bajo mesada de 120cm en madera",
      main_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
      min_price: 350000,
      max_price: 350000,
      price_range: "$350.000",
      is_active: true,
      category_name: "Muebles de cocina",
    },
    {
      id: "example-mueble-6",
      name: "Bajo mesada 140 cm madera",
      description: "Bajo mesada de 140cm en madera",
      main_image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
      min_price: 390000,
      max_price: 390000,
      price_range: "$390.000",
      is_active: true,
      category_name: "Muebles de cocina",
    },
  ],
};
// ============================================
// FIN DE PRODUCTOS DE EJEMPLO
// ============================================

// Mapeo de slugs a nombres de categorías (fallback si no se cargan desde la API)
const categorySlugMap: Record<string, string> = {
  "colchones": "Colchones",
  "sommiers": "Sommiers",
  "accesorios": "Accesorios",
  "electrodomesticos": "Electrodomésticos",
  "muebles-cocina": "Muebles de cocina",
};

// Mapeo de subcategorías (esto también se puede mejorar con una API)
const subcategoryMap: Record<string, { category: string; name: string }> = {
  "una-plaza": { category: "Colchones", name: "Una plaza" },
  "plaza-y-media": { category: "Colchones", name: "Plaza y media" },
  "dos-plazas": { category: "Colchones", name: "Dos plazas" },
  "queen": { category: "Colchones", name: "Queen" },
  "extra-queen": { category: "Colchones", name: "Extra-queen" },
  "king": { category: "Colchones", name: "King" },
  "espuma-alta-densidad": { category: "Colchones", name: "Espuma alta densidad" },
  "resortes": { category: "Colchones", name: "Resortes" },
  "sommier-completo": { category: "Sommiers", name: "Sommier (colchón + base)" },
  "bases": { category: "Sommiers", name: "Bases" },
  "sommier-respaldo": { category: "Sommiers", name: "Sommier + respaldo" },
  "respaldos": { category: "Sommiers", name: "Respaldos" },
  "sabanas": { category: "Accesorios", name: "Sábanas" },
  "cubre-colchon": { category: "Accesorios", name: "Cubre colchón" },
  "almohadas": { category: "Accesorios", name: "Almohadas" },
  "acolchados": { category: "Accesorios", name: "Acolchados" },
  "grandes": { category: "Electrodomésticos", name: "Grandes electros" },
  "pequenos": { category: "Electrodomésticos", name: "Pequeños electros" },
  "heladeras": { category: "Electrodomésticos", name: "Heladeras" },
  "lavarropas": { category: "Electrodomésticos", name: "Lavarropas" },
  "aires-acondicionados": { category: "Electrodomésticos", name: "Aires acondicionados" },
  "cocinas": { category: "Electrodomésticos", name: "Cocinas" },
  "smart-tv": { category: "Electrodomésticos", name: "Smart TV" },
  "pava-electrica": { category: "Electrodomésticos", name: "Pava electrica" },
  "vaporera": { category: "Electrodomésticos", name: "Vaporera" },
  "sandwuchera": { category: "Electrodomésticos", name: "Sandwuchera" },
  "anafe": { category: "Electrodomésticos", name: "Anafe" },
  "bajo-mesada-120": { category: "Muebles de cocina", name: "Bajo mesada 120 cm" },
  "bajo-mesada-140": { category: "Muebles de cocina", name: "Bajo mesada 140 cm" },
};

// Estructura de filtros por categoría
interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  title: string;
  type: "radio" | "checkbox";
  options: FilterOption[];
}

type CategoryFilters = Record<string, FilterGroup[]>;

const categoryFilters: CategoryFilters = {
  "Colchones": [
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tecnología",
      type: "checkbox",
      options: [
        { value: "espuma-alta-densidad", label: "Espuma alta densidad" },
        { value: "resortes-biconicos", label: "Resortes bicónicos" },
        { value: "resortes-pocket", label: "Resortes pocket" },
      ],
    },
    {
      title: "Nivel de firmeza",
      type: "checkbox",
      options: [
        { value: "soft", label: "Soft" },
        { value: "moderado", label: "Moderado" },
        { value: "firme", label: "Firme" },
        { value: "muy-firme", label: "Muy firme" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80*190" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "180x200", label: "180*200" },
        { value: "200x200", label: "200*200" },
      ],
    },
    {
      title: "Altura",
      type: "checkbox",
      options: [
        { value: "18cm", label: "18cm" },
        { value: "24cm", label: "24cm" },
        { value: "26cm", label: "26cm" },
        { value: "28cm", label: "28cm" },
        { value: "30cm", label: "30cm" },
        { value: "32cm", label: "32cm" },
        { value: "35cm", label: "35cm" },
      ],
    },
    {
      title: "Peso máximo por plaza",
      type: "checkbox",
      options: [
        { value: "85kg", label: "85kg" },
        { value: "90kg", label: "90kg" },
        { value: "100kg", label: "100kg" },
        { value: "110kg", label: "110kg" },
        { value: "120kg", label: "120kg" },
        { value: "150kg", label: "150kg" },
      ],
    },
  ],
  "Sommiers": [
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tecnología",
      type: "checkbox",
      options: [
        { value: "espuma-alta-densidad", label: "Espuma alta densidad" },
        { value: "resortes-biconicos", label: "Resortes bicónicos" },
        { value: "resortes-pocket", label: "Resortes pocket" },
      ],
    },
    {
      title: "Nivel de firmeza",
      type: "checkbox",
      options: [
        { value: "soft", label: "Soft" },
        { value: "moderado", label: "Moderado" },
        { value: "firme", label: "Firme" },
        { value: "muy-firme", label: "Muy firme" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80*190" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "180x200", label: "180*200" },
        { value: "200x200", label: "200*200" },
      ],
    },
    {
      title: "Altura",
      type: "checkbox",
      options: [
        { value: "18cm", label: "18cm" },
        { value: "24cm", label: "24cm" },
        { value: "26cm", label: "26cm" },
        { value: "28cm", label: "28cm" },
        { value: "30cm", label: "30cm" },
        { value: "32cm", label: "32cm" },
        { value: "35cm", label: "35cm" },
      ],
    },
    {
      title: "Peso máximo por plaza",
      type: "checkbox",
      options: [
        { value: "85kg", label: "85kg" },
        { value: "90kg", label: "90kg" },
        { value: "100kg", label: "100kg" },
        { value: "110kg", label: "110kg" },
        { value: "120kg", label: "120kg" },
        { value: "150kg", label: "150kg" },
      ],
    },
  ],
  "Respaldos": [
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tela",
      type: "checkbox",
      options: [
        { value: "ecocuero", label: "Ecocuero" },
        { value: "alpha-anti-desgarro", label: "Alpha anti desgarro" },
        { value: "pana", label: "Pana" },
        { value: "lino", label: "Lino" },
      ],
    },
    {
      title: "Modelo",
      type: "checkbox",
      options: [
        { value: "capitone", label: "Capitoné" },
        { value: "falso-capitone", label: "Falso capitoné" },
        { value: "listones-verticales", label: "Listones verticales" },
        { value: "liso", label: "Liso" },
      ],
    },
    {
      title: "Medida",
      type: "checkbox",
      options: [
        { value: "80x190", label: "80*190" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "180x200", label: "180*200" },
        { value: "200x200", label: "200*200" },
      ],
    },
    {
      title: "Color",
      type: "checkbox",
      options: [
        { value: "negro", label: "Negro" },
        { value: "beige", label: "Beige" },
        { value: "gris", label: "Gris" },
      ],
    },
  ],
  "Accesorios": [
    {
      title: "Subcategorías",
      type: "checkbox",
      options: [
        { value: "sabanas", label: "Sábanas" },
        { value: "cubre-colchon", label: "Cubre colchón" },
        { value: "almohadas", label: "Almohadas" },
        { value: "acolchados", label: "Acolchados" },
      ],
    },
    {
      title: "Plazas",
      type: "checkbox",
      options: [
        { value: "una-plaza", label: "Una plaza" },
        { value: "plaza-y-media", label: "Plaza y media" },
        { value: "dos-plazas", label: "Dos plazas" },
        { value: "queen", label: "Queen" },
        { value: "extra-queen", label: "Extra-queen" },
        { value: "king", label: "King" },
      ],
    },
    {
      title: "Tecnología",
      type: "checkbox",
      options: [
        { value: "espuma-viscoelastica", label: "Espuma viscoelástica" },
        { value: "vellon-siliconado", label: "Vellón siliconado" },
      ],
    },
    {
      title: "Modelo",
      type: "checkbox",
      options: [
        { value: "almohada-viscoelastica-maxiking", label: "Almohada Viscoelástica MaxiKing" },
        { value: "almohada-viscoelastica-bardo", label: "Almohada Viscoelástica Bardó" },
        { value: "almohada-viscoelastica-natural-soft-standard", label: "Almohada Viscoelástica Natural Soft - Standard" },
        { value: "almohada-viscoelastica-natural-soft-cervical", label: "Almohada Viscoelástica Natural Soft - Cervical" },
        { value: "almohada-viscoelastica-paris-king", label: "Almohada Viscoelástica Paris - King" },
        { value: "almohada-supreme", label: "Almohada Supreme" },
        { value: "almohada-premium-grandes", label: "Almohada Premium - Grandes" },
        { value: "almohada-premium-standard", label: "Almohada Premium - Standard" },
        { value: "almohada-estrella", label: "Almohada Estrella" },
        { value: "sabanas-praga", label: "Sábanas Praga" },
      ],
    },
    {
      title: "Medidas",
      type: "checkbox",
      options: [
        { value: "45x70", label: "45 X 70" },
        { value: "40x60", label: "40 X 60" },
        { value: "50x70", label: "50 X 70" },
        { value: "50x90", label: "50 X 90" },
        { value: "100x190", label: "100*190" },
        { value: "140x190", label: "140*190" },
        { value: "160x200", label: "160*200" },
        { value: "200x200", label: "200*200" },
      ],
    },
    {
      title: "Color",
      type: "checkbox",
      options: [
        { value: "claro", label: "Claro" },
        { value: "oscuro", label: "Oscuro" },
      ],
    },
    {
      title: "Hilos",
      type: "checkbox",
      options: [
        { value: "500", label: "500" },
      ],
    },
  ],
  "Electrodomésticos": [
    {
      title: "Tipo",
      type: "checkbox",
      options: [
        { value: "grandes-electros", label: "Grandes electros" },
        { value: "pequenos-electros", label: "Pequeños electros" },
      ],
    },
  ],
  "Muebles de cocina": [
    {
      title: "Ancho",
      type: "checkbox",
      options: [
        { value: "120cm", label: "120cm" },
        { value: "140cm", label: "140cm" },
      ],
    },
    {
      title: "Color",
      type: "checkbox",
      options: [
        { value: "blanco", label: "Blanco" },
        { value: "gris", label: "Gris" },
      ],
    },
  ],
};

export default function CatalogoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string[];
  const { locality } = useLocality();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryIdMap, setCategoryIdMap] = useState<Record<string, string>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Estado para rango de precios
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [priceRangeInput, setPriceRangeInput] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [priceRangeError, setPriceRangeError] = useState<string | null>(null);
  
  // Obtener el término de búsqueda de la URL
  const searchQuery = searchParams?.get("search") || "";
  
  // Obtener el filtro inicial de la URL
  const initialFilterId = searchParams?.get("filter") || null;
  
  // Cargar categorías con opciones al inicio
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        // Fetch all categories with options to build complete map
        const allCats = await fetchCategories(true); // include_options = true
        
        setCategories(allCats);
        
        // Crear un mapa de nombre de categoría a ID y slug
        const nameToIdMap: Record<string, string> = {};
        const idToCategoryMap: Record<string, Category> = {};
        const slugToIdMap: Record<string, string> = {};
        
        allCats.forEach(cat => {
          // Normalizar el nombre para comparación (sin acentos, minúsculas)
          const normalizedName = cat.name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          nameToIdMap[normalizedName] = cat.id;
          
          // También mapear el nombre original
          nameToIdMap[cat.name.toLowerCase()] = cat.id;
          
          // Mapear por ID
          idToCategoryMap[cat.id] = cat;
          
          // Crear slug desde el nombre
          const slug = cat.name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          slugToIdMap[slug] = cat.id;
        });
        
        setCategoryIdMap({ ...nameToIdMap, ...slugToIdMap });
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);
  
  // Filtros dinámicos - usando un objeto para almacenar todos los filtros seleccionados
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  
  // Estado para controlar qué filtros están abiertos/cerrados (todos cerrados por defecto)
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});
  
  // Estado para saber si se están aplicando filtros iniciales
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  
  // Función para toggle de cada filtro
  const toggleFilter = (filterTitle: string) => {
    setOpenFilters(prev => ({
      ...prev,
      [filterTitle]: !prev[filterTitle]
    }));
  };
  
  // Determinar la categoría y subcategoría desde el slug
  const getCategoryInfo = () => {
    // Si no hay slug o es un array vacío, retornar valores nulos
    if (!slug || !Array.isArray(slug) || slug.length === 0) {
      return { categoryName: null, categoryId: null, subcategoryId: null, subcategoryName: null, subcategory2Name: null, category: null };
    }
    
    const mainCategorySlug = slug[0];
    
    // Buscar el category_id correspondiente desde el slug
    let categoryId: string | null = null;
    let category: Category | null = null;
    
    if (categoryIdMap && Object.keys(categoryIdMap).length > 0) {
      // Intentar encontrar por slug
      categoryId = categoryIdMap[mainCategorySlug] || null;
      
      // Si no se encuentra por slug, intentar por nombre normalizado
      if (!categoryId) {
        const categoryName = categorySlugMap[mainCategorySlug] || mainCategorySlug;
        const normalizedName = categoryName.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        categoryId = categoryIdMap[normalizedName] || categoryIdMap[categoryName.toLowerCase()] || null;
      }
      
      // Encontrar el objeto Category completo
      if (categoryId) {
        category = categories.find(c => c.id === categoryId) || null;
      }
    }
    
    const categoryName = category?.name || categorySlugMap[mainCategorySlug] || mainCategorySlug;
    let subcategoryId: string | null = null;
    let subcategoryName: string | null = null;
    let subcategory2Name: string | null = null;
    
    // Si hay subcategoría en el slug
    if (slug.length >= 2) {
      const subcategorySlug = slug[1];
      // Buscar subcategoría por slug en las categorías hijas de la categoría principal
      if (category) {
        // Las subcategorías tienen parent_id igual a categoryId
        const subcategory = categories.find(c => {
          const slugFromName = c.name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          return c.parent_id === categoryId && (slugFromName === subcategorySlug || c.id === subcategorySlug);
        });
        
        if (subcategory) {
          subcategoryId = subcategory.id;
          subcategoryName = subcategory.name;
        } else {
          subcategoryName = subcategoryMap[subcategorySlug]?.name || subcategorySlug;
        }
      } else {
        subcategoryName = subcategoryMap[subcategorySlug]?.name || subcategorySlug;
      }
      
      // Si hay segunda subcategoría
      if (slug.length >= 3) {
        const subcategory2Slug = slug[2];
        if (subcategoryId) {
          const subcategory2 = categories.find(c => {
            const slugFromName = c.name.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
            return c.parent_id === subcategoryId && (slugFromName === subcategory2Slug || c.id === subcategory2Slug);
          });
          
          if (subcategory2) {
            subcategory2Name = subcategory2.name;
          } else {
            subcategory2Name = subcategoryMap[subcategory2Slug]?.name || subcategory2Slug;
          }
        } else {
          subcategory2Name = subcategoryMap[subcategory2Slug]?.name || subcategory2Slug;
        }
      }
    }
    
    return { categoryName, categoryId, subcategoryId, subcategoryName, subcategory2Name, category };
  };
  
  // Recalcular categoryInfo cuando cambian las categorías o el slug
  const categoryInfo = getCategoryInfo();
  const { categoryName, categoryId, subcategoryId, subcategoryName, subcategory2Name, category } = categoryInfo;
  
  // Aplicar filtro inicial desde la URL cuando las categorías se cargan
  useEffect(() => {
    if (initialFilterId && categories.length > 0 && Object.keys(categoryIdMap).length > 0 && !isLoadingCategories) {
      setIsApplyingFilter(true);
      
      // Buscar la opción en todas las categorías y subcategorías
      let foundOption = null;
      let foundFilterGroup = null;
      
      // Buscar en la categoría principal
      if (categoryId) {
        const mainCategory = categories.find(c => c.id === categoryId);
        if (mainCategory && mainCategory.options) {
          const option = mainCategory.options.find(opt => opt.id === initialFilterId);
          if (option) {
            foundOption = option;
            foundFilterGroup = mainCategory.name;
          }
        }
      }
      
      // Si no se encontró, buscar en las subcategorías
      if (!foundOption && categoryId) {
        const subcategories = categories.filter(c => c.parent_id === categoryId);
        for (const subcat of subcategories) {
          if (subcat.options) {
            const option = subcat.options.find(opt => opt.id === initialFilterId);
            if (option) {
              foundOption = option;
              foundFilterGroup = subcat.name;
              break;
            }
          }
        }
      }
      
      // Si se encontró la opción, aplicar el filtro
      if (foundOption && foundFilterGroup) {
        setSelectedFilters(prev => {
          // Solo aplicar si no está ya aplicado para evitar loops
          if (prev[foundFilterGroup]?.includes(initialFilterId)) {
            setIsApplyingFilter(false);
            return prev;
          }
          return {
            ...prev,
            [foundFilterGroup]: [initialFilterId]
          };
        });
        // Abrir el filtro automáticamente
        setOpenFilters(prev => ({
          ...prev,
          [foundFilterGroup]: true
        }));
      }
      
      // Marcar como completado después de un pequeño delay para permitir que el estado se actualice
      setTimeout(() => {
        setIsApplyingFilter(false);
      }, 100);
    } else if (!initialFilterId) {
      setIsApplyingFilter(false);
    }
  }, [initialFilterId, categories, categoryIdMap, isLoadingCategories, categoryId, subcategoryId]);
  
  // Construir filtros dinámicamente desde las opciones de categoría
  const buildDynamicFilters = () => {
    const filters: FilterGroup[] = [];
    
    if (!category && !subcategoryId) return filters;
    
    // Si hay subcategoría seleccionada, mostrar solo las opciones de esa subcategoría
    if (subcategoryId) {
      const subcategory = categories.find(c => c.id === subcategoryId);
      if (subcategory && subcategory.options && subcategory.options.length > 0) {
        filters.push({
          title: subcategory.name,
          type: "checkbox" as const,
          options: subcategory.options.map(opt => ({
            value: opt.id,
            label: opt.value
          }))
        });
      }
    } else if (categoryId && category) {
      // Si estamos en una categoría principal, agrupar opciones por subcategoría
      const subcategories = categories.filter(c => c.parent_id === categoryId);
      
      // Si hay subcategorías, agrupar opciones por subcategoría
      if (subcategories.length > 0) {
        subcategories
          .filter(subcat => subcat.options && subcat.options.length > 0)
          .forEach(subcat => {
            filters.push({
              title: subcat.name,
              type: "checkbox" as const,
              options: subcat.options!.map(opt => ({
                value: opt.id,
                label: opt.value
              }))
            });
          });
      } else if (category.options && category.options.length > 0) {
        // Si no hay subcategorías pero la categoría principal tiene opciones, mostrarlas
        filters.push({
          title: category.name,
          type: "checkbox" as const,
          options: category.options.map(opt => ({
            value: opt.id,
            label: opt.value
          }))
        });
      }
    }
    
    // Agregar filtros técnicos para colchones
    if (categoryName === "Colchones" || category?.name === "Colchones") {
      // Firmeza (mattress_firmness)
      filters.push({
        title: "Firmeza",
        type: "checkbox" as const,
        options: [
          { value: "soft", label: "Soft" },
          { value: "medio", label: "Medio" },
          { value: "firme", label: "Firme" }
        ]
      });
      
      // Peso máximo soportado (max_supported_weight_kg)
      filters.push({
        title: "Peso Máximo Soportado",
        type: "checkbox" as const,
        options: [
          { value: "85", label: "Hasta 85 kg" },
          { value: "90", label: "Hasta 90 kg" },
          { value: "100", label: "Hasta 100 kg" },
          { value: "110", label: "Hasta 110 kg" },
          { value: "120", label: "Hasta 120 kg" },
          { value: "150", label: "Hasta 150 kg" },
          { value: "150+", label: "Más de 150 kg" }
        ]
      });
      
      // Con pillow top (has_pillow_top)
      filters.push({
        title: "Pillow Top",
        type: "checkbox" as const,
        options: [
          { value: "true", label: "Con pillow top" },
          { value: "false", label: "Sin pillow top" }
        ]
      });
      
      // Colchón en caja (is_bed_in_box)
      filters.push({
        title: "Tipo de Entrega",
        type: "checkbox" as const,
        options: [
          { value: "true", label: "Colchón en caja" },
          { value: "false", label: "Colchón tradicional" }
        ]
      });
    }
    
    return filters;
  };
  
  // Obtener filtros para la categoría actual (dinámicos o hardcoded como fallback)
  const currentFilters = buildDynamicFilters().length > 0 
    ? buildDynamicFilters() 
    : (categoryName ? categoryFilters[categoryName] || [] : []);
  
  // Función para manejar cambios en filtros
  const handleFilterChange = (filterTitle: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const key = filterTitle;
      const currentValues = prev[key] || [];
      
      if (checked) {
        return { ...prev, [key]: [...currentValues, value] };
      } else {
        return { ...prev, [key]: currentValues.filter(v => v !== value) };
      }
    });
    setPage(1); // Resetear a la primera página cuando cambian los filtros
  };
  
  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSelectedFilters({});
    setPriceRange({ min: null, max: null });
    setPriceRangeInput({ min: "", max: "" });
    setPage(1);
  };
  
  // Verificar si hay filtros activos
  const hasActiveFilters = Object.values(selectedFilters).some(values => values.length > 0) || 
                          priceRange.min !== null || 
                          priceRange.max !== null;
  
  // Función para aplicar el rango de precios
  const handlePriceRangeApply = () => {
    // Limpiar error anterior
    setPriceRangeError(null);
    
    const min = priceRangeInput.min && priceRangeInput.min.trim() !== "" 
      ? parseFloat(priceRangeInput.min) 
      : null;
    const max = priceRangeInput.max && priceRangeInput.max.trim() !== "" 
      ? parseFloat(priceRangeInput.max) 
      : null;
    
    // Validar que min no sea mayor que max
    if (min !== null && max !== null && min > max) {
      setPriceRangeError("El precio mínimo no puede ser mayor que el precio máximo");
      return;
    }
    
    // Validar que los valores sean positivos
    if ((min !== null && (isNaN(min) || min < 0)) || (max !== null && (isNaN(max) || max < 0))) {
      setPriceRangeError("Los precios deben ser valores numéricos positivos");
      return;
    }
    
    // Actualizar el rango de precios (esto disparará la recarga automática por el useEffect)
    setPriceRange({ min, max });
    setPage(1);
  };
  
  // Función para limpiar el rango de precios
  const handlePriceRangeClear = () => {
    setPriceRange({ min: null, max: null });
    setPriceRangeInput({ min: "", max: "" });
    setPriceRangeError(null);
    setPage(1);
  };
  
  // Resetear página cuando cambia la búsqueda, categoría o perPage
  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryId, perPage]);
  
  // Construir breadcrumbs
  const breadcrumbs = [
    { name: "Inicio", href: "/" },
    ...(searchQuery ? [{ name: "Búsqueda", href: `/catalogo?search=${encodeURIComponent(searchQuery)}` }] : []),
    ...(categoryName && !searchQuery && slug && slug.length > 0 ? [{ name: categoryName, href: `/catalogo/${slug[0]}` }] : []),
    ...(subcategoryName && !searchQuery && slug && slug.length > 1 ? [{ name: subcategoryName, href: `/catalogo/${slug[0]}/${slug[1]}` }] : []),
    ...(subcategory2Name && !searchQuery ? [{ name: subcategory2Name }] : []),
  ];
  
  // Obtener productos
  useEffect(() => {
    // No cargar productos si las categorías aún no están cargadas y hay un slug
    // Esto evita cargar productos con categoryId incorrecto
    if (slug && slug.length > 0 && isLoadingCategories) {
      return;
    }
    
    const loadProducts = async () => {
      setLoading(true);
      try {
        // Construir parámetros de búsqueda
        const fetchParams: any = {
          is_active: true,
          sort: sortBy,
          page,
          per_page: perPage,
          include_images: true,
          include_promos: true,
        };
        
        // Agregar localidad si está disponible
        if (locality?.id) {
          fetchParams.locality_id = locality.id;
        }
        
        // Si hay búsqueda, agregar el parámetro de búsqueda
        if (searchQuery) {
          fetchParams.search = searchQuery;
        }
        
        // Si hay subcategoryId, usar esa; sino usar categoryId
        if (subcategoryId) {
          fetchParams.category_id = subcategoryId;
        } else if (categoryId) {
          fetchParams.category_id = categoryId;
        }
        
        // Siempre usar la API real
        let result = await fetchProducts(fetchParams);
        
        // Filtrar por opciones seleccionadas si hay filtros activos
        if (hasActiveFilters && result.products.length > 0) {
          let filteredProducts = result.products;
          
          // Filtrar por rango de precios primero
          if (priceRange.min !== null || priceRange.max !== null) {
            filteredProducts = filteredProducts.filter(product => {
              // Obtener el precio mínimo y máximo del producto
              const productMinPrice = product.min_price ?? null;
              const productMaxPrice = product.max_price ?? productMinPrice;
              
              // Si el producto no tiene precio, excluirlo
              if (productMinPrice === null || productMinPrice === undefined) {
                return false;
              }
              
              // Si solo hay un precio, usarlo como min y max
              const minPrice = productMinPrice;
              const maxPrice = productMaxPrice ?? productMinPrice;
              
              // Verificar si el rango de precios del producto se solapa con el filtro
              // El producto debe tener al menos un precio dentro del rango
              if (priceRange.min !== null && maxPrice < priceRange.min) {
                return false;
              }
              if (priceRange.max !== null && minPrice > priceRange.max) {
                return false;
              }
              
              return true;
            });
          }
          
          // Separar filtros de opciones de categoría de filtros técnicos
          const categoryOptionFilters: Record<string, string[]> = {};
          const technicalFilters: Record<string, string[]> = {};
          
          Object.entries(selectedFilters).forEach(([filterKey, selectedValues]) => {
            const technicalFilterKeys = ["Firmeza", "Peso Máximo Soportado", "Pillow Top", "Tipo de Entrega"];
            if (technicalFilterKeys.includes(filterKey)) {
              technicalFilters[filterKey] = selectedValues;
            } else {
              categoryOptionFilters[filterKey] = selectedValues;
            }
          });
          
          // Filtrar por opciones de categoría (IDs de category_option)
          if (Object.keys(categoryOptionFilters).length > 0) {
            const allSelectedOptionIds = new Set<string>();
            Object.values(categoryOptionFilters).forEach(selectedValues => {
              selectedValues.forEach(optionId => {
                allSelectedOptionIds.add(optionId);
              });
            });
            
            if (allSelectedOptionIds.size > 0) {
              filteredProducts = filteredProducts.filter(product => {
                // Verificar si el producto tiene alguna de las opciones seleccionadas
                // 1. Verificar category_option_id directo del producto
                if (product.category_option_id && allSelectedOptionIds.has(product.category_option_id)) {
                  return true;
                }
                
                // 2. Verificar en las subcategorías asociadas
                if (product.subcategories && product.subcategories.length > 0) {
                  // El producto debe tener al menos UNA subcategoría con UNA de las opciones seleccionadas
                  const hasMatchingOption = product.subcategories.some(subcat => {
                    return subcat.category_option_id && allSelectedOptionIds.has(subcat.category_option_id);
                  });
                  
                  if (hasMatchingOption) {
                    return true;
                  }
                }
                
                // Si no coincide con ninguna opción, excluir el producto
                return false;
              });
            }
          }
          
          // Filtrar por filtros técnicos de colchones
          Object.entries(technicalFilters).forEach(([filterKey, selectedValues]) => {
            if (selectedValues.length === 0) return;
            
            // Firmeza
            if (filterKey === "Firmeza") {
              filteredProducts = filteredProducts.filter(product => {
                if (!product.mattress_firmness) return false;
                // Los valores en la DB son "MEDIO", "SOFT" o "FIRME" (mayúsculas)
                const productFirmness = product.mattress_firmness.toUpperCase().trim();
                return selectedValues.some(value => {
                  // Mapear valores del filtro a valores en la BD (mayúsculas)
                  const valueMap: Record<string, string[]> = {
                    "soft": ["SOFT"],
                    "medio": ["MEDIO"],
                    "firme": ["FIRME"]
                  };
                  const possibleValues = valueMap[value] || [value.toUpperCase()];
                  return possibleValues.includes(productFirmness);
                });
              });
            }
            
            // Peso Máximo Soportado
            if (filterKey === "Peso Máximo Soportado") {
              filteredProducts = filteredProducts.filter(product => {
                const maxWeightKg = product.max_supported_weight_kg;
                if (!maxWeightKg) return false;
                return selectedValues.some(value => {
                  if (value === "150+") {
                    return maxWeightKg >= 150;
                  }
                  const maxWeight = parseInt(value);
                  return maxWeightKg <= maxWeight && 
                         maxWeightKg > (maxWeight - 15);
                });
              });
            }
            
            // Pillow Top
            if (filterKey === "Pillow Top") {
              filteredProducts = filteredProducts.filter(product => {
                const hasPillowTop = product.has_pillow_top === true;
                return selectedValues.some(value => {
                  if (value === "true") return hasPillowTop;
                  if (value === "false") return !hasPillowTop;
                  return false;
                });
              });
            }
            
            // Colchón en caja
            if (filterKey === "Tipo de Entrega") {
              filteredProducts = filteredProducts.filter(product => {
                const isBedInBox = product.is_bed_in_box === true;
                return selectedValues.some(value => {
                  if (value === "true") return isBedInBox;
                  if (value === "false") return !isBedInBox;
                  return false;
                });
              });
            }
          });
          
          // Recalcular total_pages basado en productos filtrados
          const filteredTotal = filteredProducts.length;
          const filteredTotalPages = Math.ceil(filteredTotal / perPage);
          
          // Paginar los productos filtrados
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          filteredProducts = filteredProducts.slice(startIndex, endIndex);
          
          result = {
            products: filteredProducts,
            total: filteredTotal,
            page: page,
            per_page: perPage,
            total_pages: filteredTotalPages,
          };
        }
        
        setProducts(result.products);
        setTotalPages(result.total_pages);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [page, sortBy, categoryId, subcategoryId, subcategoryName, subcategory2Name, searchQuery, perPage, selectedFilters, hasActiveFilters, categories, categoryIdMap, slug, isLoadingCategories, locality?.id, priceRange]);
  
  const sortOptions = [
    { value: "created_at_desc", label: "Más recientes" },
    { value: "created_at", label: "Más antiguos" },
    { value: "name", label: "Nombre A-Z" },
    { value: "price_asc", label: "Precio: menor a mayor" },
    { value: "price_desc", label: "Precio: mayor a menor" },
  ];
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const getProductCardProps = (product: Product) => {
    const image = product.main_image || (product.images && product.images[0]?.image_url) || "/images/placeholder.png";
    
    // Calcular precio usando función centralizada
    const priceInfo = calculateProductPrice(product, 1);
    
    return {
      id: product.id,
      image,
      alt: product.name,
      name: product.name,
      currentPrice: priceInfo.currentPrice,
      originalPrice: priceInfo.originalPrice,
      discount: priceInfo.discount,
    };
  };
  
  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        /* Scrollbar estilizada y delgada para el contenedor de filtros */
        .custom-scrollbar {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #a8b1c2 #f4f5f7;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f5f7;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a8b1c2;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8a94a8;
        }
      `}</style>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 md:mb-6 overflow-x-auto">
          {isLoadingCategories && slug && slug.length > 0 ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <span>/</span>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              {slug.length > 1 && (
                <>
                  <span>/</span>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </>
              )}
            </div>
          ) : (
            <ol className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-600 whitespace-nowrap">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-1 md:gap-2">
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-gray-900 transition-colors">
                      {crumb.name}
                    </a>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </nav>
        
        {/* Header */}
        <div className="mb-4 md:mb-6">
          {isLoadingCategories && slug && slug.length > 0 ? (
            <div className="animate-pulse">
              <div className="h-7 md:h-9 bg-gray-200 rounded w-48 md:w-64 mb-2"></div>
              <div className="h-4 md:h-5 bg-gray-200 rounded w-36 md:w-48"></div>
            </div>
          ) : (
            <>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                {searchQuery ? `Resultados de búsqueda` : (subcategory2Name || subcategoryName || categoryName || "Catálogo")}
              </h1>
              {searchQuery && (
                <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
                  Buscando: <span className="font-semibold text-gray-900">"{searchQuery}"</span>
                </p>
              )}
              {(categoryName || searchQuery) && !loading && (
                <p className="text-sm md:text-base text-gray-600">
                  {products.length} {products.length === 1 ? "producto encontrado" : "productos encontrados"}
                </p>
              )}
            </>
          )}
        </div>
        
        {/* Barra superior con filtros, items por página y ordenar (sticky junto al navbar) */}
        <div className="sticky top-[56px] md:top-[150px] z-30 bg-white -mx-4 px-4 pb-3 pt-3 md:pt-4 mb-4 md:mb-6 border-b border-gray-100 md:border-b-0">
          <div className="container mx-auto flex items-center justify-between">
          {!searchQuery && (
            <>
              {/* Desktop filters toggle */}
              <div className="hidden md:flex items-center gap-2 w-full max-w-[290px]">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="ml-auto text-gray-600 hover:text-gray-900 transition-all duration-300"
                >
                  {filtersExpanded ? (
                    <Minus className="w-4 h-4 transition-transform duration-300" />
                  ) : (
                    <Plus className="w-4 h-4 transition-transform duration-300" />
                  )}
                </button>
              </div>
              {/* Mobile filters button */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="bg-[#00C1A7] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0) + (priceRange.min !== null || priceRange.max !== null ? 1 : 0)}
                  </span>
                )}
              </button>
            </>
          )}
          {searchQuery && <div></div>}
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Items por página - hidden on mobile */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowPerPageMenu(!showPerPageMenu)}
                className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span>
                  Mostrar: {perPage} por página
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showPerPageMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showPerPageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPerPageMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[180px]">
                    {[20, 50, 100].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setPerPage(value);
                          setShowPerPageMenu(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          perPage === value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"
                        }`}
                      >
                        {value} por página
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-black hover:text-gray-900 transition-colors"
              >
                <span className="hidden md:inline">
                  Ordenar por: {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <span className="md:hidden">
                  {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 min-w-[200px]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                          setPage(1);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          sortBy === option.value ? "bg-gray-50 font-medium text-[#00C1A7]" : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </div>
        
        {/* Mobile Filters Modal */}
        {isMobileFiltersOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="p-4">
              {hasActiveFilters && (
                <div className="flex justify-start mb-4">
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-[#00C1A7] hover:text-[#00A892] transition-colors"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              )}
              
              {/* Filtro de Rango de Precios */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Rango de Precios</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={priceRangeInput.min}
                      onChange={(e) => setPriceRangeInput(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 text-gray-900"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Máx"
                      value={priceRangeInput.max}
                      onChange={(e) => setPriceRangeInput(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 text-gray-900"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {priceRangeError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                      {priceRangeError}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePriceRangeApply}
                      className="flex-1 px-3 py-2 text-sm bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors"
                    >
                      Aplicar
                    </button>
                    {(priceRange.min !== null || priceRange.max !== null) && (
                      <button
                        onClick={handlePriceRangeClear}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  {(priceRange.min !== null || priceRange.max !== null) && (
                    <p className="text-xs text-gray-600">
                      ${priceRange.min !== null ? priceRange.min.toLocaleString() : "0"} - ${priceRange.max !== null ? priceRange.max.toLocaleString() : "∞"}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Grupos de filtros */}
              {currentFilters.length === 0 ? (
                <p className="text-sm text-gray-500">No hay filtros disponibles para esta categoría</p>
              ) : (
                <div className="space-y-4">
                  {currentFilters.map((filterGroup, index) => {
                    const filterKey = filterGroup.title;
                    const isOpen = openFilters[filterKey] || false;
                    
                    return (
                      <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleFilter(filterKey)}
                          className="flex items-center justify-between w-full text-left mb-3 group"
                        >
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {filterGroup.title}
                          </h3>
                          {isOpen ? (
                            <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="space-y-3">
                            {filterGroup.options.map((option) => {
                              const isChecked = selectedFilters[filterKey]?.includes(option.value) || false;
                              
                              return (
                                <label key={option.value} className="flex items-center cursor-pointer group">
                                  <input
                                    type={filterGroup.type}
                                    checked={isChecked}
                                    onChange={(e) => handleFilterChange(filterKey, option.value, e.target.checked)}
                                    className="w-5 h-5 text-[#00C1A7] focus:ring-[#00C1A7] focus:ring-2 rounded border-gray-300 cursor-pointer"
                                  />
                                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                    {option.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Bottom action button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-3 bg-[#00C1A7] text-white rounded-lg font-medium hover:bg-[#00A892] transition-colors"
              >
                Ver {products.length} productos
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid: Sidebar + Products */}
        <div className={`grid grid-cols-12 gap-4 md:gap-6 ${searchQuery ? 'lg:grid-cols-12' : ''}`}>
          {/* Sidebar de Filtros - 3 columnas, oculto cuando está cerrado o hay búsqueda, solo desktop */}
          {filtersExpanded && !searchQuery && (
            <aside className="hidden md:block col-span-12 lg:col-span-3 transition-all duration-300 ease-in-out">
              <div className="bg-white rounded-[10px] border border-gray-200 p-6 sticky top-[210px] overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 12rem)', height: 'fit-content' }}>
                {/* Contenido de filtros - alineado con el grid de productos (después del mb-6 del dropdown) */}
                {(isLoadingCategories && slug && slug.length > 0) || isApplyingFilter ? (
                  <div className="space-y-6 animate-pulse">
                    {/* Skeleton para rango de precios */}
                    <div className="border-b border-gray-100 pb-4 mb-4">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-10 bg-gray-200 rounded w-full"></div>
                          <span className="text-gray-500">-</span>
                          <div className="h-10 bg-gray-200 rounded w-full"></div>
                        </div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                    {/* Skeleton para grupos de filtros */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b border-gray-100 pb-4">
                        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {hasActiveFilters && (
                      <div className="flex justify-start mb-4">
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-[#00C1A7] hover:text-[#00A892] transition-colors"
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                    
                    {/* Filtro de Rango de Precios - Siempre visible */}
                    <div className="border-b border-gray-100 pb-4 mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Rango de Precios</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Mín"
                            value={priceRangeInput.min}
                            onChange={(e) => setPriceRangeInput(prev => ({ ...prev, min: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 placeholder:opacity-100 text-gray-900"
                            min="0"
                            step="0.01"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handlePriceRangeApply();
                              }
                            }}
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            placeholder="Máx"
                            value={priceRangeInput.max}
                            onChange={(e) => setPriceRangeInput(prev => ({ ...prev, max: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-600 placeholder:opacity-100 text-gray-900"
                            min="0"
                            step="0.01"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handlePriceRangeApply();
                              }
                            }}
                          />
                        </div>
                        {priceRangeError && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                            {priceRangeError}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePriceRangeApply}
                            className="flex-1 px-3 py-2 text-sm bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors"
                          >
                            Aplicar
                          </button>
                          {(priceRange.min !== null || priceRange.max !== null) && (
                            <button
                              onClick={handlePriceRangeClear}
                              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>
                        {(priceRange.min !== null || priceRange.max !== null) && (
                          <p className="text-xs text-gray-600">
                            ${priceRange.min !== null ? priceRange.min.toLocaleString() : "0"} - ${priceRange.max !== null ? priceRange.max.toLocaleString() : "∞"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {currentFilters.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay filtros disponibles para esta categoría</p>
                    ) : (
                      <div className="space-y-6">
                        {currentFilters.map((filterGroup, index) => {
                          const filterKey = filterGroup.title;
                          const isOpen = openFilters[filterKey] || false;
                          
                          return (
                            <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                              <button
                                onClick={() => toggleFilter(filterKey)}
                                className="flex items-center justify-between w-full text-left mb-3 group"
                              >
                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                  {filterGroup.title}
                                </h3>
                                {isOpen ? (
                                  <Minus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                ) : (
                                  <Plus className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="space-y-2">
                                  {filterGroup.options.map((option) => {
                                    const isChecked = selectedFilters[filterKey]?.includes(option.value) || false;
                                    
                                    return (
                                      <label key={option.value} className="flex items-center cursor-pointer group">
                                        <input
                                          type={filterGroup.type}
                                          checked={isChecked}
                                          onChange={(e) => handleFilterChange(filterKey, option.value, e.target.checked)}
                                          className="w-4 h-4 text-[#00C1A7] focus:ring-[#00C1A7] focus:ring-2 rounded border-gray-300 cursor-pointer"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                          {option.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>
          )}
          
          {/* Productos - 2 columnas en móvil, 3 en tablet, 3-4 en desktop */}
          <div className={`col-span-12 ${filtersExpanded ? 'md:col-span-12 lg:col-span-9' : 'lg:col-span-12'} transition-all duration-300`}>
            {/* Products Grid */}
            {loading ? (
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 transition-all duration-300 ease-in-out ${filtersExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="relative group block animate-pulse">
                    {/* Skeleton Image */}
                    <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
                    {/* Skeleton Content */}
                    <div className="pt-3">
                      <div className="mb-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="mt-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-lg mb-2">No se encontraron productos</p>
                <p className="text-gray-500 text-sm">Intenta con otros filtros o vuelve más tarde</p>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 transition-all duration-300 ease-in-out ${filtersExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} {...getProductCardProps(product)} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

