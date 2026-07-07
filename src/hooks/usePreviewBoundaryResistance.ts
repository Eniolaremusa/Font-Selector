"use client";

import { useCallback } from "react";
import { animate, useMotionValue } from "motion/react";
import {
  PREVIEW_BOUNDARY_NUDGE_PX,
  PREVIEW_BOUNDARY_SCALE,
  PREVIEW_BOUNDARY_SPRING,
} from "@/lib/motionConstants";

export function usePreviewBoundaryResistance(prefersReducedMotion: boolean) {
  const frameX = useMotionValue(0);
  const frameScale = useMotionValue(1);

  const triggerResistance = useCallback(async () => {
    if (prefersReducedMotion) {
      return;
    }

    const spring = PREVIEW_BOUNDARY_SPRING;

    await Promise.all([
      (async () => {
        await animate(frameX, PREVIEW_BOUNDARY_NUDGE_PX, spring);
        await animate(frameX, 0, spring);
      })(),
      (async () => {
        await animate(frameScale, PREVIEW_BOUNDARY_SCALE, spring);
        await animate(frameScale, 1, spring);
      })(),
    ]);
  }, [frameScale, frameX, prefersReducedMotion]);

  return {
    frameX,
    frameScale,
    triggerResistance,
  };
}
