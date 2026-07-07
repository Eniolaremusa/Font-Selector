"use client";

import { motion } from "motion/react";
import {
  HOVER_SETTLE_SPRING,
  SURPRISE_BUTTON_BG,
  SURPRISE_BUTTON_BG_HOVER,
  SURPRISE_BUTTON_LIFT_PX,
  SURPRISE_BUTTON_SHADOW_HOVER,
} from "@/lib/motionConstants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type SurpriseMeButtonProps = {
  onClick: () => void;
};

export function SurpriseMeButton({ onClick }: SurpriseMeButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl bg-[#232121] px-3 py-1.5 text-[15px] font-medium tracking-[-0.15px] text-white transition-colors duration-150 hover:bg-[#2b2929]"
      >
        Surprise me
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      whileHover={{
        y: -SURPRISE_BUTTON_LIFT_PX,
        backgroundColor: SURPRISE_BUTTON_BG_HOVER,
        boxShadow: SURPRISE_BUTTON_SHADOW_HOVER,
      }}
      transition={HOVER_SETTLE_SPRING}
      className="rounded-2xl px-3 py-1.5 text-[15px] font-medium tracking-[-0.15px] text-white"
      style={{ backgroundColor: SURPRISE_BUTTON_BG }}
    >
      Surprise me
    </motion.button>
  );
}
