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

export const FONT_CHANGE_PREVIEW_HOLD_MS = 60;

// Scheduling estimate for preview roll settle (tuned to PREVIEW_ROLL_SPRING).
export const FONT_CHANGE_PREVIEW_ROLL_MS = 300;

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

// Snappy detent spring: fast arrival, small overshoot, quick settle.
export const PREVIEW_ROLL_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 28,
  mass: 0.85,
};

// Container height ease when sentence line count changes.
export const PREVIEW_HEIGHT_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 32,
  mass: 1,
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

// Sliders — fluid drag, mechanical snap on release
export const SLIDER_SNAP_POINTS = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const SLIDER_SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 28,
  mass: 0.85,
};

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

// Serifness toggle — sliding pill indicator
export const SERIFNESS_PILL_SPRING = {
  type: "spring" as const,
  stiffness: 480,
  damping: 30,
  mass: 0.9,
};

export const SERIFNESS_LABEL_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 32,
  mass: 0.8,
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
