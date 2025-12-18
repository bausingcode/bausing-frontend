"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchProducts, Product } from "@/lib/api";
import { ChevronDown, Minus, Plus } from "lucide-react";

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

// Mapeo de slugs a nombres de categorías (esto se puede mejorar con una API)
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
  const slug = params?.slug as string[];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  
  // Filtros dinámicos - usando un objeto para almacenar todos los filtros seleccionados
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  
  // Estado para controlar qué filtros están abiertos/cerrados (todos cerrados por defecto)
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});
  
  // Función para toggle de cada filtro
  const toggleFilter = (filterTitle: string) => {
    setOpenFilters(prev => ({
      ...prev,
      [filterTitle]: !prev[filterTitle]
    }));
  };
  
  // Determinar la categoría y subcategoría desde el slug
  const getCategoryInfo = () => {
    if (!slug || slug.length === 0) {
      return { categoryName: null, subcategoryName: null, subcategory2Name: null };
    }
    
    const mainCategorySlug = slug[0];
    const categoryName = categorySlugMap[mainCategorySlug] || mainCategorySlug;
    
    if (slug.length === 1) {
      return { categoryName, subcategoryName: null, subcategory2Name: null };
    }
    
    if (slug.length === 2) {
      const subcategorySlug = slug[1];
      const subcategoryInfo = subcategoryMap[subcategorySlug];
      return {
        categoryName,
        subcategoryName: subcategoryInfo?.name || subcategorySlug,
        subcategory2Name: null,
      };
    }
    
    if (slug.length === 3) {
      const subcategorySlug = slug[1];
      const subcategory2Slug = slug[2];
      const subcategoryInfo = subcategoryMap[subcategorySlug];
      const subcategory2Info = subcategoryMap[subcategory2Slug];
      return {
        categoryName,
        subcategoryName: subcategoryInfo?.name || subcategorySlug,
        subcategory2Name: subcategory2Info?.name || subcategory2Slug,
      };
    }
    
    return { categoryName, subcategoryName: null, subcategory2Name: null };
  };
  
  const { categoryName, subcategoryName, subcategory2Name } = getCategoryInfo();
  
  // Obtener filtros para la categoría actual
  const currentFilters = categoryName ? categoryFilters[categoryName] || [] : [];
  
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
    setPage(1);
  };
  
  // Verificar si hay filtros activos
  const hasActiveFilters = Object.values(selectedFilters).some(values => values.length > 0);
  
  // Construir breadcrumbs
  const breadcrumbs = [
    { name: "Inicio", href: "/" },
    ...(categoryName ? [{ name: categoryName, href: `/catalogo/${slug[0]}` }] : []),
    ...(subcategoryName ? [{ name: subcategoryName, href: `/catalogo/${slug[0]}/${slug[1]}` }] : []),
    ...(subcategory2Name ? [{ name: subcategory2Name }] : []),
  ];
  
  // Obtener productos
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        // TODO: Reemplazar con llamada real a la API
        // Por ahora usamos productos de ejemplo
        if (categoryName && EXAMPLE_PRODUCTS[categoryName]) {
          // Simular delay de carga
          await new Promise(resolve => setTimeout(resolve, 500));
          setProducts(EXAMPLE_PRODUCTS[categoryName]);
          setTotalPages(1);
        } else {
          // Si no hay categoría o no hay productos de ejemplo, intentar cargar de la API
          const result = await fetchProducts({
            is_active: true,
            sort: sortBy,
            page,
            per_page: 20,
            include_images: true,
          });
          
          setProducts(result.products);
          setTotalPages(result.total_pages);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [page, sortBy, categoryName, subcategoryName, subcategory2Name]);
  
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
    const price = product.min_price ? formatPrice(product.min_price) : "$0";
    const originalPrice = product.max_price && product.min_price !== product.max_price 
      ? formatPrice(product.max_price) 
      : "";
    
    // Calcular descuento si hay promociones
    let discount: string | undefined;
    if (product.promos && product.promos.length > 0) {
      const promo = product.promos[0];
      if (promo.discount_percentage) {
        discount = "OFERTA";
      }
    }
    
    return {
      id: product.id,
      image,
      alt: product.name,
      name: product.name,
      currentPrice: price,
      originalPrice,
      discount,
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
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
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
        </nav>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {subcategory2Name || subcategoryName || categoryName || "Catálogo"}
          </h1>
          {categoryName && (
            <p className="text-gray-600">
              {products.length} {products.length === 1 ? "producto encontrado" : "productos encontrados"}
            </p>
          )}
        </div>
        
        {/* Barra superior con filtros y ordenar (sticky junto al navbar) */}
        <div className="sticky top-[150px] z-30 bg-white -mx-4 px-4 pb-3 pt-4 mb-6">
          <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 w-full max-w-[290px]">
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
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 text-sm text-black hover:text-gray-900 transition-colors"
            >
              <span>
                Ordenar por: {sortOptions.find(opt => opt.value === sortBy)?.label}
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
        
        {/* Main Content Grid: Sidebar + Products */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar de Filtros - 3 columnas, oculto cuando está cerrado */}
          {filtersExpanded && (
            <aside className="col-span-12 lg:col-span-3 transition-all duration-300 ease-in-out">
              <div className="bg-white rounded-[10px] border border-gray-200 p-6 sticky top-[210px] max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                {/* Contenido de filtros - alineado con el grid de productos (después del mb-6 del dropdown) */}
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
              </div>
            </aside>
          )}
          
          {/* Productos - 3 columnas si hay filtros, 4 columnas si no */}
          <div className={`col-span-12 ${filtersExpanded ? 'lg:col-span-9' : 'lg:col-span-12'} transition-all duration-300`}>
            {/* Products Grid */}
            {loading ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-300 ease-in-out ${filtersExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
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
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-300 ease-in-out ${filtersExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
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

