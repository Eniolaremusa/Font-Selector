"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { getFontFamily } from "@/lib/fontFamilies";
import {
  PREVIEW_CURSOR_MAX_ROTATE_DEG,
  PREVIEW_CURSOR_MAX_TRANSLATE_PX,
  PREVIEW_CURSOR_SPRING,
  PREVIEW_CURSOR_TRACKING_BASE_PX,
  PREVIEW_CURSOR_TRACKING_TIGHTEN_PX,
  PREVIEW_HEIGHT_SPRING,
  PREVIEW_LINE_HEIGHT,
  PREVIEW_ROLL_HOLD_MS,
  PREVIEW_ROLL_SPRING,
} from "@/lib/motionConstants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { FontEntry } from "@/lib/types";

const PREVIEW_TEXT_CLASS =
  "line-clamp-2 w-full text-center text-[48px] font-medium leading-[1.2] text-white";

type AnimatedSampleTextProps = {
  font: FontEntry;
};

function getFontStack(targetFont: FontEntry): string {
  const family = getFontFamily(targetFont.id);
  return `"${family}", ${targetFont.serifness === "Serif" ? "serif" : "sans-serif"}`;
}

export function AnimatedSampleText({ font }: AnimatedSampleTextProps) {
  const [displayFont, setDisplayFont] = useState(font);
  const [clipHeight, setClipHeight] = useState(PREVIEW_LINE_HEIGHT);

  const measureRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingFontRef = useRef<FontEntry | null>(null);
  const heightByFontIdRef = useRef<Map<string, number>>(new Map());
  const previousFontIdRef = useRef<string | null>(null);
  const displayFontRef = useRef(displayFont);
  const isFirstMountRef = useRef(true);

  const prefersReducedMotion = usePrefersReducedMotion();

  const rotateXTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const rotateYTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const translateXTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const translateYTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const trackingTarget = useSpring(
    PREVIEW_CURSOR_TRACKING_BASE_PX,
    PREVIEW_CURSOR_SPRING,
  );

  const letterSpacing = useTransform(
    trackingTarget,
    (value) => `${value}px`,
  );

  displayFontRef.current = displayFont;

  const resetCursorMotion = useCallback(() => {
    rotateXTarget.set(0);
    rotateYTarget.set(0);
    translateXTarget.set(0);
    translateYTarget.set(0);
    trackingTarget.set(PREVIEW_CURSOR_TRACKING_BASE_PX);
  }, [
    rotateXTarget,
    rotateYTarget,
    trackingTarget,
    translateXTarget,
    translateYTarget,
  ]);

  const sentenceHeight =
    heightByFontIdRef.current.get(displayFont.id) ?? clipHeight;
  const shouldAnimateEnter =
    previousFontIdRef.current !== null &&
    previousFontIdRef.current !== displayFont.id;
  const isTransitioning =
    font.id !== displayFont.id || pendingFontRef.current !== null;

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || isTransitioning || !containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
      const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
      const centerProximity = Math.max(
        0,
        1 - Math.hypot(normalizedX, normalizedY) * 2,
      );

      rotateYTarget.set(
        normalizedX * PREVIEW_CURSOR_MAX_ROTATE_DEG * 2,
      );
      rotateXTarget.set(
        -normalizedY * PREVIEW_CURSOR_MAX_ROTATE_DEG * 2,
      );
      translateXTarget.set(
        normalizedX * PREVIEW_CURSOR_MAX_TRANSLATE_PX * 2,
      );
      translateYTarget.set(
        normalizedY * PREVIEW_CURSOR_MAX_TRANSLATE_PX * 2,
      );
      trackingTarget.set(
        PREVIEW_CURSOR_TRACKING_BASE_PX -
          PREVIEW_CURSOR_TRACKING_TIGHTEN_PX * centerProximity,
      );
    },
    [
      isTransitioning,
      prefersReducedMotion,
      rotateXTarget,
      rotateYTarget,
      trackingTarget,
      translateXTarget,
      translateYTarget,
    ],
  );

  useLayoutEffect(() => {
    const measuredHeight =
      measureRef.current?.offsetHeight ?? PREVIEW_LINE_HEIGHT;
    heightByFontIdRef.current.set(font.id, measuredHeight);

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      previousFontIdRef.current = font.id;
      setDisplayFont(font);
      setClipHeight(measuredHeight);
      return;
    }

    if (font.id === displayFontRef.current.id) {
      setClipHeight(measuredHeight);
      return;
    }

    const currentHeight =
      heightByFontIdRef.current.get(displayFontRef.current.id) ??
      PREVIEW_LINE_HEIGHT;

    if (measuredHeight !== currentHeight) {
      pendingFontRef.current = font;
      setClipHeight(measuredHeight);
      return;
    }

    setDisplayFont(font);
    setClipHeight(measuredHeight);
  }, [font]);

  useLayoutEffect(() => {
    if (isTransitioning) {
      resetCursorMotion();
    }
  }, [isTransitioning, resetCursorMotion]);

  const handleHeightAnimationComplete = () => {
    if (!pendingFontRef.current) {
      return;
    }

    setDisplayFont(pendingFontRef.current);
    pendingFontRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[700px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCursorMotion}
    >
      <motion.div
        style={{
          perspective: 900,
        }}
      >
        <motion.div
          style={{
            rotateX: prefersReducedMotion ? 0 : rotateXTarget,
            rotateY: prefersReducedMotion ? 0 : rotateYTarget,
            x: prefersReducedMotion ? 0 : translateXTarget,
            y: prefersReducedMotion ? 0 : translateYTarget,
            transformStyle: "preserve-3d",
          }}
        >
        <motion.div
          className="relative w-full overflow-hidden"
          animate={{ height: clipHeight }}
          initial={false}
          transition={{ height: PREVIEW_HEIGHT_SPRING }}
          onAnimationComplete={() => handleHeightAnimationComplete()}
        >
          <p
            ref={measureRef}
            className={`${PREVIEW_TEXT_CLASS} pointer-events-none invisible absolute inset-x-0 top-0`}
            style={{
              fontFamily: getFontStack(font),
              letterSpacing: `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`,
            }}
            aria-hidden="true"
          >
            {font.sentence}
          </p>

          <AnimatePresence
            mode="sync"
            initial={false}
            onExitComplete={() => {
              previousFontIdRef.current = displayFont.id;
            }}
          >
            <motion.div
              key={displayFont.id}
              custom={sentenceHeight}
              className="absolute inset-x-0 top-0 flex items-center justify-center"
              style={{ height: sentenceHeight }}
              variants={{
                enter: (height: number) => ({
                  y: height,
                  transition: {
                    ...PREVIEW_ROLL_SPRING,
                    delay: PREVIEW_ROLL_HOLD_MS / 1000,
                  },
                }),
                center: {
                  y: 0,
                  transition: PREVIEW_ROLL_SPRING,
                },
                exit: (height: number) => ({
                  y: -height,
                  transition: PREVIEW_ROLL_SPRING,
                }),
              }}
              initial={shouldAnimateEnter ? "enter" : false}
              animate="center"
              exit="exit"
            >
              <motion.p
                className={PREVIEW_TEXT_CLASS}
                style={{
                  fontFamily: getFontStack(displayFont),
                  letterSpacing: prefersReducedMotion
                    ? `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`
                    : letterSpacing,
                }}
              >
                {displayFont.sentence}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
