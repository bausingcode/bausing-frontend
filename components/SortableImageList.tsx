"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableImageListProps<T extends { id: string }> {
  items: T[];
  /** Recibe la lista completa en el nuevo orden. */
  onReorder: (next: T[]) => void;
  layout: "grid" | "list";
  disabled?: boolean;
  /** Clases del contenedor (grilla / lista). */
  className?: string;
  children: ReactNode;
}

export function SortableImageList<T extends { id: string }>({
  items,
  onReorder,
  layout,
  disabled = false,
  className,
  children,
}: SortableImageListProps<T>) {
  // distance: evita que un click normal (botones de la card) arranque un drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableImageCardProps {
  id: string;
  /** Posición actual (0-based), se muestra como número. */
  index: number;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}

/** Card arrastrable: agrega el asa de arrastre y el número de orden arriba a la izquierda. */
export function SortableImageCard({
  id,
  index,
  className = "",
  disabled = false,
  children,
}: SortableImageCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${className} ${isDragging ? "z-20 shadow-lg ring-2 ring-blue-400" : ""}`}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
        <span className="min-w-6 h-6 px-1.5 rounded-full bg-gray-900/75 text-white text-xs font-semibold flex items-center justify-center">
          {index + 1}
        </span>
        {!disabled && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="p-1 rounded-full bg-white/90 text-gray-700 shadow hover:bg-white cursor-grab active:cursor-grabbing touch-none"
            title="Arrastrar para reordenar"
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
