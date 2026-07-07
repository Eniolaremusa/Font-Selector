"use client";

import { LayoutGroup, motion, type Transition } from "motion/react";
import {
  SERIFNESS_ACTIVE_COLOR,
  SERIFNESS_INACTIVE_COLOR,
  SERIFNESS_LABEL_SPRING,
  SERIFNESS_PILL_SPRING,
  SURPRISE_CHOREOGRAPHY_TRANSITION,
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
  const pillTransition: Transition =
    choreographyToken > 0
      ? SURPRISE_CHOREOGRAPHY_TRANSITION
      : SERIFNESS_PILL_SPRING;

  const labelTransition: Transition =
    choreographyToken > 0
      ? SURPRISE_CHOREOGRAPHY_TRANSITION
      : SERIFNESS_LABEL_SPRING;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
      <p className="text-[15px] font-medium tracking-[-0.15px] text-white">
        Serifness
      </p>

      <div className="flex h-[32px] w-full items-center rounded-[12px] border border-[#232121] bg-[#181717] px-1 py-2">
        <LayoutGroup id="serifness-toggle">
          <div className="relative flex w-full gap-1">
            {options.map((option) => {
              const isActive = option === value;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className="relative flex flex-1 items-center justify-center rounded-[8px] px-3 py-1"
                >
                  {isActive ? (
                    <motion.div
                      layoutId="serifness-pill"
                      className="absolute inset-0 rounded-[8px] bg-[#373535]"
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
