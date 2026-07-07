"use client";

import { LayoutGroup, motion } from "motion/react";
import {
  FONT_CHANGE_CONTROLS_START_MS,
  getSegmentSpring,
  SERIFNESS_ACTIVE_COLOR,
  SERIFNESS_INACTIVE_COLOR,
  SERIFNESS_LABEL_SPRING,
  SERIFNESS_PILL_INSET_PX,
  SERIFNESS_PILL_RADIUS_PX,
  SERIFNESS_CONTAINER_RADIUS_PX,
} from "@/lib/motionConstants";
import type { Serifness } from "@/lib/types";

type SerifnessToggleProps = {
  value: Serifness;
  options: Serifness[];
  choreographyToken?: number;
  onChange: (value: Serifness) => void;
};

export function SerifnessToggle({
  value,
  options,
  choreographyToken = 0,
  onChange,
}: SerifnessToggleProps) {
  const choreographyDelay =
    choreographyToken > 0 ? FONT_CHANGE_CONTROLS_START_MS / 1000 : 0;

  const pillTransition = {
    ...getSegmentSpring(),
    delay: choreographyDelay,
  };

  const labelTransition = {
    ...SERIFNESS_LABEL_SPRING,
    delay: choreographyDelay,
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
      <p className="text-[15px] font-medium tracking-[-0.15px] text-white">
        Serifness
      </p>

      <div
        className="flex h-[32px] w-full items-center border border-[#232121] bg-[#181717]"
        style={{
          borderRadius: SERIFNESS_CONTAINER_RADIUS_PX,
          padding: SERIFNESS_PILL_INSET_PX,
        }}
      >
        <LayoutGroup id="serifness-toggle">
          <div className="relative flex h-full w-full">
            {options.map((option) => {
              const isActive = option === value;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className="relative flex h-full flex-1 items-center justify-center px-3"
                >
                  {isActive ? (
                    <motion.div
                      layoutId="serifness-pill"
                      className="absolute inset-0 bg-[#373535]"
                      style={{ borderRadius: SERIFNESS_PILL_RADIUS_PX }}
                      transition={pillTransition}
                    />
                  ) : null}
                  <motion.span
                    className="relative z-10 text-[13px] font-medium tracking-[-0.13px]"
                    animate={{
                      color: isActive
                        ? SERIFNESS_ACTIVE_COLOR
                        : SERIFNESS_INACTIVE_COLOR,
                    }}
                    transition={labelTransition}
                  >
                    {option}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
