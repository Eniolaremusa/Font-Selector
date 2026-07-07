"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import {
  BOOKMARK_COLOR_TRANSITION,
  BOOKMARK_HOVER_SCALE,
  BOOKMARK_SAVE_DIP_SPRING,
  BOOKMARK_SAVE_OVERSHOOT_SPRING,
  BOOKMARK_SAVE_ROTATION_OVERSHOOT,
  BOOKMARK_SAVE_SCALE_MIN,
  BOOKMARK_SAVE_SCALE_OVERSHOOT,
  BOOKMARK_SAVE_SETTLE_SPRING,
  BOOKMARK_SAVED_COLOR,
  BOOKMARK_UNSAVED_COLOR,
  BOOKMARK_UNSAVED_SCALE_MIN,
  BOOKMARK_UNSAVE_SPRING,
  HOVER_SETTLE_SPRING,
} from "@/lib/motionConstants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

function BookmarkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 2.5H11.5C12.0523 2.5 12.5 2.94772 12.5 3.5V13.1667L8 10.5L3.5 13.1667V3.5C3.5 2.94772 3.94772 2.5 4.5 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BookmarkButton() {
  const [isSaved, setIsSaved] = useState(false);
  const [iconColor, setIconColor] = useState(BOOKMARK_UNSAVED_COLOR);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isSavedRef = useRef(false);
  const animationTokenRef = useRef(0);
  const scaleControls = useAnimationControls();

  const syncIconColor = useCallback((token: number) => {
    if (token !== animationTokenRef.current) {
      return;
    }

    setIconColor(
      isSavedRef.current ? BOOKMARK_SAVED_COLOR : BOOKMARK_UNSAVED_COLOR,
    );
  }, []);

  const runSaveAnimation = useCallback(
    async (token: number) => {
      setIconColor(BOOKMARK_UNSAVED_COLOR);

      await scaleControls.start({
        scale: BOOKMARK_SAVE_SCALE_MIN,
        rotate: 0,
        transition: BOOKMARK_SAVE_DIP_SPRING,
      });
      if (token !== animationTokenRef.current) {
        return;
      }

      setIconColor(BOOKMARK_SAVED_COLOR);

      await scaleControls.start({
        scale: BOOKMARK_SAVE_SCALE_OVERSHOOT,
        rotate: BOOKMARK_SAVE_ROTATION_OVERSHOOT,
        transition: BOOKMARK_SAVE_OVERSHOOT_SPRING,
      });
      if (token !== animationTokenRef.current) {
        return;
      }

      await scaleControls.start({
        scale: 1,
        rotate: 0,
        transition: BOOKMARK_SAVE_SETTLE_SPRING,
      });

      syncIconColor(token);
    },
    [scaleControls, syncIconColor],
  );

  const runUnsaveAnimation = useCallback(
    async (token: number) => {
      setIconColor(BOOKMARK_UNSAVED_COLOR);

      await scaleControls.start({
        scale: BOOKMARK_UNSAVED_SCALE_MIN,
        rotate: 0,
        transition: BOOKMARK_UNSAVE_SPRING,
      });
      if (token !== animationTokenRef.current) {
        return;
      }

      await scaleControls.start({
        scale: 1,
        rotate: 0,
        transition: BOOKMARK_UNSAVE_SPRING,
      });

      syncIconColor(token);
    },
    [scaleControls, syncIconColor],
  );

  const handleClick = () => {
    const token = animationTokenRef.current + 1;
    animationTokenRef.current = token;

    const nextSaved = !isSavedRef.current;
    isSavedRef.current = nextSaved;
    setIsSaved(nextSaved);

    if (nextSaved) {
      void runSaveAnimation(token);
    } else {
      void runUnsaveAnimation(token);
    }
  };

  return (
    <motion.button
      type="button"
      aria-label={isSaved ? "Unsave font" : "Save font"}
      aria-pressed={isSaved}
      onClick={handleClick}
      initial={false}
      whileHover={
        prefersReducedMotion ? undefined : { scale: BOOKMARK_HOVER_SCALE }
      }
      transition={HOVER_SETTLE_SPRING}
      className="flex size-8 items-center justify-center rounded-full bg-[#232121]"
    >
      <motion.span
        animate={scaleControls}
        initial={{ scale: 1, rotate: 0 }}
        className="flex items-center justify-center"
      >
        <motion.span
          animate={{ color: iconColor }}
          transition={{ color: BOOKMARK_COLOR_TRANSITION }}
          className="flex items-center justify-center"
        >
          <BookmarkIcon />
        </motion.span>
      </motion.span>
    </motion.button>
  );
}
