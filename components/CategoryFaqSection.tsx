"use client";

import { useEffect, useState } from "react";
import { fetchPublicCategoryFaqItems, type FaqItemPublic } from "@/lib/api";

/**
 * Preguntas frecuentes de una categoría (configuradas en /admin/preguntas-frecuentes,
 * pestaña "Por categoría"). No renderiza nada si la categoría no tiene preguntas cargadas.
 * Las respuestas están siempre visibles (sin acordeón) para que los crawlers lean todo el contenido.
 */
export default function CategoryFaqSection({
  categoryId,
}: {
  categoryId: string | null | undefined;
}) {
  const [items, setItems] = useState<FaqItemPublic[]>([]);

  useEffect(() => {
    let cancelled = false;
    const request = categoryId
      ? fetchPublicCategoryFaqItems(categoryId)
      : Promise.resolve<FaqItemPublic[]>([]);
    request.then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (items.length === 0) return null;

  return (
    <div className="w-full py-8 md:py-12">
      <h2 className="text-lg md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">
        Preguntas frecuentes
      </h2>
      <ul
        className="border-t border-b border-gray-200 divide-y divide-gray-200"
        role="list"
      >
        {items.map((item) => (
          <li key={item.id} className="py-4 md:py-5">
            <h3 className="font-semibold text-[#101828] text-sm md:text-base">
              {item.question}
            </h3>
            <p className="mt-2 text-[#4A5565] text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {item.answer}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
