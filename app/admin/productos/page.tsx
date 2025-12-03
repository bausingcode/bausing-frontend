import { cookies } from "next/headers";
import { fetchCategories, Category } from "@/lib/api";
import ProductosClient from "./ProductosClient";

export default async function Productos() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  let categories: Category[] = [];
  
  try {
    // Fetch categories with options from the backend using SSR
    categories = await fetchCategories(true, cookieHeader);
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Si falla, usar array vacío y el componente cliente manejará el error
  }

  return <ProductosClient initialCategories={categories} />;
}
