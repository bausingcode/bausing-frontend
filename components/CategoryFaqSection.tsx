"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { fetchPublicCategoryFaqItems, type FaqItemPublic } from "@/lib/api";

/**
 * Preguntas frecuentes de una categoría (configuradas en /admin/preguntas-frecuentes,
 * pestaña "Por categoría"). No renderiza nada si la categoría no tiene preguntas cargadas.
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
          <li key={item.id}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 md:py-5 text-left font-semibold text-[#101828] text-sm md:text-base [&::-webkit-details-marker]:hidden">
                <span className="flex-1 pr-2">{item.question}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-[#00C1A7] transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="pb-4 md:pb-5 -mt-1">
                <p className="text-[#4A5565] text-sm md:text-base leading-relaxed whitespace-pre-wrap pt-1">
                  {item.answer}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
