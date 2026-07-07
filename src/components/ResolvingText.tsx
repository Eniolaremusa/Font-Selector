"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { usePairsChipHover } from "@/hooks/usePairsChipHover";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useResolvingText } from "@/hooks/useResolvingText";
import {
  HOVER_SETTLE_SPRING,
  NAME_TAB_HORIZONTAL_PADDING,
  PAIRS_CHIP_BG,
  PAIRS_CHIP_BG_HOVER,
  PAIRS_CHIP_BORDER_HOVER,
  PAIRS_CHIP_LIFT_PX,
} from "@/lib/motionConstants";

type ResolvingTextProps = {
  text: string;
  changeKey: string;
  startDelayMs?: number;
  onTextClick?: () => void;
  interactiveChip?: boolean;
  className?: string;
  textClassName?: string;
  prefix?: ReactNode;
  prefixClassName?: string;
  horizontalPadding?: number;
  lineHeight?: number;
  prefixGap?: number;
};

export function ResolvingText({
  text,
  changeKey,
  startDelayMs,
  onTextClick,
  interactiveChip = false,
  className,
  textClassName,
  prefix,
  prefixClassName,
  horizontalPadding = NAME_TAB_HORIZONTAL_PADDING,
  lineHeight,
  prefixGap = 6,
}: ResolvingTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const resolveState = useResolvingText({ text, changeKey, startDelayMs });
  const resolveText = resolveState.displayText;
  const {
    displayText: peekText,
    onHoverStart,
    onHoverEnd,
  } = usePairsChipHover({
    text: resolveText,
    enabled:
      interactiveChip && !prefersReducedMotion && !resolveState.isResolving,
  });
  const displayText = peekText ?? resolveText;

  const measureRef = useRef<HTMLSpanElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );

  useLayoutEffect(() => {
    if (measureRef.current) {
      setContainerWidth(measureRef.current.offsetWidth + horizontalPadding);
    }
  }, [displayText, prefix, horizontalPadding]);

  const content = (
    <div
      className="overflow-hidden"
      style={lineHeight ? { height: lineHeight } : undefined}
    >
      <span
        ref={measureRef}
        className="inline-flex items-center whitespace-nowrap"
        style={{ gap: prefixGap }}
      >
        {prefix ? <span className={prefixClassName}>{prefix}</span> : null}
        {onTextClick ? (
          <button
            type="button"
            onClick={onTextClick}
            className={`${textClassName} cursor-pointer border-0 bg-transparent p-0`}
          >
            {displayText}
          </button>
        ) : (
          <span className={textClassName}>{displayText}</span>
        )}
      </span>
    </div>
  );

  if (!interactiveChip || prefersReducedMotion) {
    return (
      <div className={className} style={{ width: containerWidth }}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{ width: containerWidth, backgroundColor: PAIRS_CHIP_BG }}
      initial={false}
      whileHover={{
        y: -PAIRS_CHIP_LIFT_PX,
        backgroundColor: PAIRS_CHIP_BG_HOVER,
        boxShadow: `0 0 0 1px ${PAIRS_CHIP_BORDER_HOVER}`,
      }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      transition={HOVER_SETTLE_SPRING}
    >
      {content}
    </motion.div>
  );
}
