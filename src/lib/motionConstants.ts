// Preview text — vertical odometer roll
export const PREVIEW_FONT_SIZE = 48;
export const PREVIEW_LINE_HEIGHT_RATIO = 1.2;
export const PREVIEW_MAX_LINES = 2;

export const PREVIEW_LINE_HEIGHT = Math.ceil(
  PREVIEW_FONT_SIZE * PREVIEW_LINE_HEIGHT_RATIO,
);

// Font-change orchestration — one choreographed moment (~700ms budget).
// Preview tick leads; name resolve and control movement trail with overlap.
export const FONT_CHANGE_BUDGET_MS = 700;

export const FONT_CHANGE_PREVIEW_HOLD_MS = 75;

// Scheduling estimate for preview roll settle (tuned to preview roll spring).
export const FONT_CHANGE_PREVIEW_ROLL_MS = 390;

// Trailing layers begin when preview is ~50% through its roll (40–60% overlap).
export const FONT_CHANGE_TRAIL_OVERLAP_RATIO = 0.5;

export const FONT_CHANGE_NAME_START_MS =
  FONT_CHANGE_PREVIEW_HOLD_MS +
  Math.round(
    FONT_CHANGE_PREVIEW_ROLL_MS * (1 - FONT_CHANGE_TRAIL_OVERLAP_RATIO),
  );

export const FONT_CHANGE_PAIRS_START_MS = FONT_CHANGE_NAME_START_MS + 36;

export const FONT_CHANGE_CONTROLS_START_MS = FONT_CHANGE_NAME_START_MS + 24;

export const FONT_CHANGE_CONTROLS_DURATION_MS =
  FONT_CHANGE_BUDGET_MS - FONT_CHANGE_CONTROLS_START_MS - 24;

// Hold before the roll begins — beat, tick, rest.
export const PREVIEW_ROLL_HOLD_MS = FONT_CHANGE_PREVIEW_HOLD_MS;

// Preview roll — calm odometer transition (tuning pass)
export const PREVIEW_STIFFNESS = 360;
export const PREVIEW_DAMPING = 42;
export const PREVIEW_MASS = 1.25;
export const PREVIEW_SETTLE = 0.12;

// Extra stagger so incoming text follows outgoing — less aggressive overlap.
export const PREVIEW_ROLL_ENTER_OFFSET_MS = 85;

export function getPreviewRollSpring(
  phase: "enter" | "exit" | "center" = "center",
) {
  const base = {
    type: "spring" as const,
    stiffness: PREVIEW_STIFFNESS,
    damping: PREVIEW_DAMPING * (1 + PREVIEW_SETTLE),
    mass: PREVIEW_MASS,
  };

  if (phase === "exit") {
    return {
      ...base,
      stiffness: PREVIEW_STIFFNESS * 0.9,
      mass: PREVIEW_MASS * 1.1,
    };
  }

  if (phase === "enter") {
    return {
      ...base,
      stiffness: PREVIEW_STIFFNESS * 0.82,
      damping: PREVIEW_DAMPING * (1 + PREVIEW_SETTLE * 1.6),
      mass: PREVIEW_MASS * 1.15,
    };
  }

  return base;
}

export const PREVIEW_ROLL_SPRING = getPreviewRollSpring("center");

// Container height ease when sentence line count changes.
export const PREVIEW_HEIGHT_SPRING = {
  type: "spring" as const,
  stiffness: PREVIEW_STIFFNESS * 0.78,
  damping: PREVIEW_DAMPING * (1 + PREVIEW_SETTLE),
  mass: PREVIEW_MASS * 1.05,
};

// Font name — character resolve (split-flap style)
export const NAME_RESOLVE_START_DELAY_MS = FONT_CHANGE_NAME_START_MS;

export const NAME_RESOLVE_TOTAL_DURATION_MS = 450;

export const NAME_RESOLVE_CYCLES_PER_CHAR = 4;
export const NAME_RESOLVE_CHAR_STEP_MS = 14;

export const NAME_RESOLVE_CHARSET =
  " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const NAME_TAB_LINE_HEIGHT = 23;
export const NAME_TAB_HORIZONTAL_PADDING = 24;

export function getNameResolveCharStaggerMs(textLength: number): number {
  const cycleDuration =
    NAME_RESOLVE_CYCLES_PER_CHAR * NAME_RESOLVE_CHAR_STEP_MS +
    NAME_RESOLVE_CHAR_STEP_MS;

  if (textLength <= 1) {
    return 0;
  }

  return Math.max(
    10,
    Math.round(
      (NAME_RESOLVE_TOTAL_DURATION_MS - cycleDuration) / (textLength - 1),
    ),
  );
}

export function getNameResolveDurationMs(textLength: number): number {
  const charStagger = getNameResolveCharStaggerMs(textLength);

  return (
    Math.max(textLength - 1, 0) * charStagger +
    NAME_RESOLVE_CYCLES_PER_CHAR * NAME_RESOLVE_CHAR_STEP_MS +
    NAME_RESOLVE_CHAR_STEP_MS
  );
}

// Sliders — fluid drag, physical travel on track click / choreography
export const SLIDER_SNAP_POINTS = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const SLIDER_STIFFNESS = 210;
export const SLIDER_DAMPING = 34;
export const SLIDER_MASS = 1;
export const SNAP_ATTRACTION = 1.25;
export const SETTLE_AMOUNT = 0.14;
export const TRAVEL_DURATION_MULTIPLIER = 1.72;

export const SLIDER_FILL_STIFFNESS = 155;
export const SLIDER_FILL_DAMPING = 32;
export const SLIDER_FILL_MASS = 1.12;

export function getSliderTravelSpring(distance: number) {
  const absDistance = Math.min(Math.abs(distance), 100);
  const travelScale =
    1 +
    (TRAVEL_DURATION_MULTIPLIER - 1) * Math.pow(absDistance / 100, 0.42);

  return {
    type: "spring" as const,
    stiffness: SLIDER_STIFFNESS / travelScale,
    damping: SLIDER_DAMPING * (1 + SETTLE_AMOUNT) + SNAP_ATTRACTION * 3.5,
    mass: SLIDER_MASS * travelScale,
  };
}

export const SLIDER_FILL_SPRING = {
  type: "spring" as const,
  stiffness: SLIDER_FILL_STIFFNESS,
  damping: SLIDER_FILL_DAMPING,
  mass: SLIDER_FILL_MASS,
};

/** @deprecated Use getSliderTravelSpring — kept for any legacy references */
export const SLIDER_SNAP_SPRING = getSliderTravelSpring(20);

export const SLIDER_DRAG_SPRING = {
  type: "spring" as const,
  stiffness: 4000,
  damping: 100,
  mass: 0.5,
};

export const SLIDER_THUMB_FADE = {
  duration: 0.12,
  ease: "easeOut" as const,
};

export const SLIDER_THUMB_WIDTH = 2;
export const SLIDER_THUMB_INSET = 8;

// Serifness segmented control — weighted pill glide
export const SEGMENT_STIFFNESS = 190;
export const SEGMENT_DAMPING = 34;
export const SEGMENT_MASS = 1.08;
export const SEGMENT_SETTLE = 0.15;

export const SERIFNESS_CONTAINER_RADIUS_PX = 12;
export const SERIFNESS_PILL_RADIUS_PX = 8;
export const SERIFNESS_PILL_INSET_PX = 4;

export function getSegmentSpring() {
  return {
    type: "spring" as const,
    stiffness: SEGMENT_STIFFNESS,
    damping: SEGMENT_DAMPING * (1 + SEGMENT_SETTLE),
    mass: SEGMENT_MASS,
  };
}

export const SERIFNESS_PILL_SPRING = getSegmentSpring();

export const SERIFNESS_LABEL_SPRING = {
  type: "spring" as const,
  stiffness: SEGMENT_STIFFNESS * 0.85,
  damping: SEGMENT_DAMPING * (1 + SEGMENT_SETTLE * 0.8),
  mass: SEGMENT_MASS * 0.9,
};

export const SERIFNESS_ACTIVE_COLOR = "#ffffff";
export const SERIFNESS_INACTIVE_COLOR = "#7d7a79";

// Bookmark — save pop / unsave reverse
export const BOOKMARK_SAVED_COLOR = "#D36359";
export const BOOKMARK_UNSAVED_COLOR = "#7d7a79";

export const BOOKMARK_SAVE_SCALE_MIN = 0.75;
export const BOOKMARK_SAVE_SCALE_OVERSHOOT = 1.3;
export const BOOKMARK_SAVE_ROTATION_OVERSHOOT = 6;
export const BOOKMARK_UNSAVED_SCALE_MIN = 0.92;

export const BOOKMARK_SAVE_DIP_SPRING = {
  type: "spring" as const,
  stiffness: 720,
  damping: 28,
  mass: 0.65,
};

export const BOOKMARK_SAVE_OVERSHOOT_SPRING = {
  type: "spring" as const,
  stiffness: 560,
  damping: 14,
  mass: 0.7,
};

export const BOOKMARK_SAVE_SETTLE_SPRING = {
  type: "spring" as const,
  stiffness: 700,
  damping: 11,
  mass: 0.72,
};

export const BOOKMARK_UNSAVE_SPRING = {
  type: "spring" as const,
  stiffness: 560,
  damping: 34,
  mass: 0.7,
};

export const BOOKMARK_COLOR_TRANSITION = {
  duration: 0.1,
  ease: "easeOut" as const,
};

// Programmatic control choreography — trails preview, fits inside budget.
export const SURPRISE_CHOREOGRAPHY_DURATION =
  FONT_CHANGE_CONTROLS_DURATION_MS / 1000;

export const SURPRISE_CHOREOGRAPHY_EASE: [number, number, number, number] = [
  0.45, 0, 0.55, 1,
];

export const SURPRISE_CHOREOGRAPHY_TRANSITION = {
  duration: SURPRISE_CHOREOGRAPHY_DURATION,
  ease: SURPRISE_CHOREOGRAPHY_EASE,
  delay: FONT_CHANGE_CONTROLS_START_MS / 1000,
};

// Hover microinteractions — calm affordance, never competes with font-change motion.
export const HOVER_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 38,
  mass: 0.75,
};

export const HOVER_SETTLE_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 42,
  mass: 0.85,
};

// Preview — cursor-reactive typography
export const PREVIEW_CURSOR_SPRING = {
  stiffness: 140,
  damping: 22,
  mass: 0.55,
};

export const PREVIEW_CURSOR_MAX_ROTATE_DEG = 1.5;
export const PREVIEW_CURSOR_MAX_TRANSLATE_PX = 3;
export const PREVIEW_CURSOR_TRACKING_BASE_PX = -0.96;
export const PREVIEW_CURSOR_TRACKING_TIGHTEN_PX = 0.9;

// Surprise me button
export const SURPRISE_BUTTON_BG = "#232121";
export const SURPRISE_BUTTON_BG_HOVER = "#2b2929";
export const SURPRISE_BUTTON_LIFT_PX = 1;
export const SURPRISE_BUTTON_SHADOW_HOVER = "0 2px 10px rgba(0, 0, 0, 0.22)";

// Pairs-with chip — miniature character peek
export const PAIRS_CHIP_BG = "#141313";
export const PAIRS_CHIP_BG_HOVER = "#1a1919";
export const PAIRS_CHIP_BORDER_HOVER = "#2a2828";
export const PAIRS_CHIP_LIFT_PX = 1;

export const PAIRS_HOVER_DURATION_MS = 250;
export const PAIRS_HOVER_CHAR_COUNT_MIN = 2;
export const PAIRS_HOVER_CHAR_COUNT_MAX = 3;
export const PAIRS_HOVER_CYCLES = 2;
export const PAIRS_HOVER_CHAR_STEP_MS = 32;
export const PAIRS_HOVER_CHAR_STAGGER_MS = 18;

// Bookmark hover
export const BOOKMARK_HOVER_SCALE = 1.05;
export const BOOKMARK_BG = "#232121";
