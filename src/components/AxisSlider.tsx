"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  FONT_CHANGE_CONTROLS_START_MS,
  getSliderTravelSpring,
  SLIDER_DRAG_SPRING,
  SLIDER_FILL_SPRING,
  SLIDER_SNAP_POINTS,
  SLIDER_THUMB_FADE,
  SLIDER_THUMB_INSET,
  SLIDER_THUMB_WIDTH,
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

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

const DRAG_THRESHOLD_PX = 4;

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

  const thumbPosition = useMotionValue(value);
  const fillPosition = useSpring(
    thumbPosition,
    isDragging ? SLIDER_DRAG_SPRING : SLIDER_FILL_SPRING,
  );

  const fillWidth = useTransform(fillPosition, (v) => `${clampPercent(v)}%`);
  const activeTrackWidth = useTransform(fillPosition, (v) => {
    const clamped = clampPercent(v);
    return clamped > 0 ? `${(100 / clamped) * 100}%` : "100%";
  });

  const showThumb = isHovered || isDragging;
  const inputValue = dragValue ?? value;
  const travelAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const isMountedRef = useRef(false);
  const isDragInteractionRef = useRef(false);
  const pendingTrackValueRef = useRef<number | null>(null);
  const pointerOriginXRef = useRef(0);

  const stopTravel = useCallback(() => {
    travelAnimationRef.current?.stop();
    travelAnimationRef.current = null;
  }, []);

  const travelTo = useCallback(
    (target: number, delay = 0) => {
      stopTravel();

      const from = thumbPosition.get();
      if (Math.abs(from - target) < 0.01) {
        thumbPosition.set(target);
        return;
      }

      travelAnimationRef.current = animate(thumbPosition, target, {
        ...getSliderTravelSpring(target - from),
        delay,
      });
    },
    [stopTravel, thumbPosition],
  );

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      thumbPosition.set(value);
      return;
    }

    if (isDragging) {
      return;
    }

    if (choreographyToken > 0) {
      travelTo(value, FONT_CHANGE_CONTROLS_START_MS / 1000);
      return;
    }

    travelTo(value);
  }, [value, isDragging, choreographyToken, travelTo, thumbPosition]);

  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    onChoreographyInterrupt?.();
    stopTravel();
    isDragInteractionRef.current = false;
    pendingTrackValueRef.current = null;
    pointerOriginXRef.current = event.clientX;
    setIsDragging(true);
    setDragValue(value);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLInputElement>) => {
    if (
      !isDragInteractionRef.current &&
      Math.abs(event.clientX - pointerOriginXRef.current) >= DRAG_THRESHOLD_PX
    ) {
      isDragInteractionRef.current = true;

      if (pendingTrackValueRef.current !== null) {
        thumbPosition.set(pendingTrackValueRef.current);
      }
    }
  };

  const handleInput = (raw: number) => {
    setDragValue(raw);
    onChange(raw);

    if (isDragInteractionRef.current) {
      thumbPosition.set(raw);
      return;
    }

    pendingTrackValueRef.current = raw;
  };

  const handlePointerUp = (raw: number) => {
    const snapped = snapValue(
      isDragInteractionRef.current
        ? raw
        : (pendingTrackValueRef.current ?? raw),
    );

    setIsDragging(false);
    setDragValue(null);
    isDragInteractionRef.current = false;
    pendingTrackValueRef.current = null;
    onChange(snapped);
    onCommit?.(snapped);
    travelTo(snapped);
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
          onPointerMove={handlePointerMove}
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
