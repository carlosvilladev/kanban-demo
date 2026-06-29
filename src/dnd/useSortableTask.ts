/**
 * Thin wrapper around useSortable for a task card.
 *
 * Keeps TaskCard presentational — TaskCard itself has no dnd-kit dependency.
 * SortableTaskCard uses this hook and spreads its return value onto the DOM node.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SortableTaskHandles {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  setNodeRef: ReturnType<typeof useSortable>['setNodeRef'];
  style: React.CSSProperties;
  isDragging: boolean;
}

// Need to import React for the CSSProperties type
import type React from 'react';

export function useSortableTask(id: string): SortableTaskHandles {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // source slot fades → insertion placeholder visible
  };

  return { attributes, listeners, setNodeRef, style, isDragging };
}
