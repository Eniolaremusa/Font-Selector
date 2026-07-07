"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  SLIDER_DRAG_SPRING,
  SLIDER_SNAP_POINTS,
  SLIDER_SNAP_SPRING,
  SLIDER_THUMB_FADE,
  SLIDER_THUMB_INSET,
  SLIDER_THUMB_WIDTH,
  SURPRISE_CHOREOGRAPHY_TRANSITION,
} from "@/lib/motionConstants";

type TrackLabelsProps = {
  minLabel: string;
  maxLabel: string;
  variant?: "muted" | "active";
};

function TrackLabels({
  minLabel,
  maxLabel,
  variant = "muted",
}: TrackLabelsProps) {
  const labelColor =
    variant === "active" ? "text-white" : "text-[#7d7a79]";

  return (
    <div className="pointer-events-none flex h-[32px] w-full items-center gap-4 px-3">
      <span
        className={`w-[39px] shrink-0 text-[13px] font-medium tracking-[-0.13px] ${labelColor}`}
      >
        {minLabel}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className="size-[3px] shrink-0 rounded-full bg-[#423f3f]"
          />
        ))}
      </div>
      <span
        className={`w-[39px] shrink-0 text-right text-[13px] font-medium tracking-[-0.13px] ${labelColor}`}
      >
        {maxLabel}
      </span>
    </div>
  );
}

type AxisSliderProps = {
  label: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  choreographyToken?: number;
  onChange: (value: number) => void;
  onChoreographyInterrupt?: () => void;
  onCommit?: (value: number) => void;
  labelSemibold?: boolean;
};

function snapValue(value: number): number {
  return SLIDER_SNAP_POINTS.reduce((closest, point) =>
    Math.abs(point - value) < Math.abs(closest - value) ? point : closest,
  );
}

export function AxisSlider({
  label,
  minLabel,
  maxLabel,
  value,
  choreographyToken = 0,
  onChange,
  onChoreographyInterrupt,
  onCommit,
  labelSemibold = false,
}: AxisSliderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const percentMotion = useMotionValue(value);
  const percentSpring = useSpring(
    percentMotion,
    isDragging ? SLIDER_DRAG_SPRING : SLIDER_SNAP_SPRING,
  );
  const fillWidth = useTransform(percentSpring, (v) => `${Math.max(0, Math.min(100, v))}%`);
  const activeTrackWidth = useTransform(percentSpring, (v) => {
    const clamped = Math.max(0, Math.min(100, v));
    return clamped > 0 ? `${(100 / clamped) * 100}%` : "100%";
  });
  const showThumb = isHovered || isDragging;
  const inputValue = dragValue ?? value;
  const choreographyAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (isDragging || choreographyToken > 0) {
      return;
    }

    percentMotion.set(value);
  }, [value, isDragging, choreographyToken, percentMotion]);

  useEffect(() => {
    if (choreographyToken === 0) {
      return;
    }

    choreographyAnimationRef.current?.stop();
    choreographyAnimationRef.current = animate(
      percentMotion,
      value,
      SURPRISE_CHOREOGRAPHY_TRANSITION,
    );

    return () => {
      choreographyAnimationRef.current?.stop();
    };
  }, [choreographyToken, percentMotion, value]);

  const handlePointerDown = () => {
    onChoreographyInterrupt?.();
    choreographyAnimationRef.current?.stop();
    setIsDragging(true);
    setDragValue(value);
  };

  const handleInput = (raw: number) => {
    setDragValue(raw);
    percentMotion.set(raw);
    onChange(raw);
  };

  const handlePointerUp = (raw: number) => {
    const snapped = snapValue(raw);
    setIsDragging(false);
    setDragValue(null);
    percentMotion.set(snapped);
    onChange(snapped);
    onCommit?.(snapped);
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-[6px]">
      <p
        className={`text-[15px] tracking-[-0.15px] text-white ${labelSemibold ? "font-semibold" : "font-medium"}`}
      >
        {label}
      </p>

      <div
        className="relative h-[32px] w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px] border border-[#232121] bg-[#181717]">
          <TrackLabels minLabel={minLabel} maxLabel={maxLabel} />
        </div>

        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-bl-[12px] rounded-br-[8px] rounded-tl-[12px] rounded-tr-[8px] border border-[#232121] bg-[#3a3838]"
          style={{ width: fillWidth }}
        >
          <motion.div className="relative size-full" style={{ width: activeTrackWidth }}>
            <TrackLabels
              minLabel={minLabel}
              maxLabel={maxLabel}
              variant="active"
            />
          </motion.div>

          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-[1px] bg-[#858585]"
            style={{
              left: `max(0px, calc(100% - ${SLIDER_THUMB_INSET + SLIDER_THUMB_WIDTH}px))`,
            }}
            animate={{ opacity: showThumb ? 1 : 0 }}
            transition={SLIDER_THUMB_FADE}
          />
        </motion.div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={inputValue}
          onInput={(event) =>
            handleInput(Number(event.currentTarget.value))
          }
          onChange={(event) =>
            handleInput(Number(event.currentTarget.value))
          }
          onPointerDown={handlePointerDown}
          onPointerUp={(event) => {
            handlePointerUp(Number(event.currentTarget.value));
          }}
          onPointerCancel={(event) => {
            handlePointerUp(Number(event.currentTarget.value));
          }}
          aria-label={label}
          className="absolute inset-0 z-30 m-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
