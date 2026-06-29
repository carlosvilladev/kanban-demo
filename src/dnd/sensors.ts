/**
 * Board-specific dnd-kit sensor configuration.
 *
 * Two sensors (per ADR-DND-2):
 *   - MouseSensor: activates after 8 px of movement (keeps small clicks from triggering drag)
 *   - TouchSensor: delays 200 ms + 8 px tolerance (so vertical scroll on mobile isn't captured)
 *
 * Split over a single PointerSensor so touch activation can be tuned independently.
 */
import { useSensors, useSensor, MouseSensor, TouchSensor } from '@dnd-kit/core';
import type { SensorDescriptor, SensorOptions } from '@dnd-kit/core';

export const MOUSE_ACTIVATION = { activationConstraint: { distance: 8 } };
export const TOUCH_ACTIVATION = { activationConstraint: { delay: 200, tolerance: 8 } };

export function useBoardSensors(): SensorDescriptor<SensorOptions>[] {
  return useSensors(
    useSensor(MouseSensor, MOUSE_ACTIVATION),
    useSensor(TouchSensor, TOUCH_ACTIVATION),
  );
}
