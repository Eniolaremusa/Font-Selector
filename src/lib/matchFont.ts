import { fontData } from "./fontData";
import { AXIS_KEYS, type AxisKey, type ControlValues, type FontEntry } from "./types";

export const RECENT_AXIS_WEIGHT = 3;
export const PREVIOUS_AXIS_WEIGHT = 1.5;
export const DEFAULT_AXIS_WEIGHT = 1;

export type RankedFont = {
  font: FontEntry;
  distance: number;
};

export function buildAxisWeights(recentAxes: AxisKey[]): Record<AxisKey, number> {
  const weights = Object.fromEntries(
    AXIS_KEYS.map((axis) => [axis, DEFAULT_AXIS_WEIGHT]),
  ) as Record<AxisKey, number>;

  if (recentAxes[0]) {
    weights[recentAxes[0]] = RECENT_AXIS_WEIGHT;
  }

  if (recentAxes[1]) {
    weights[recentAxes[1]] = PREVIOUS_AXIS_WEIGHT;
  }

  return weights;
}

function getCandidatePool(values: ControlValues): FontEntry[] {
  return values.serifness === "Any"
    ? fontData.fonts
    : fontData.fonts.filter((font) => font.serifness === values.serifness);
}

function weightedSquaredDistance(
  values: ControlValues,
  font: FontEntry,
  weights: Record<AxisKey, number>,
): number {
  return AXIS_KEYS.reduce((total, axis) => {
    const delta = values[axis] - font[axis];
    return total + weights[axis] * delta * delta;
  }, 0);
}

function compareCandidates(
  values: ControlValues,
  a: FontEntry,
  b: FontEntry,
  weights: Record<AxisKey, number>,
): number {
  const distanceA = weightedSquaredDistance(values, a, weights);
  const distanceB = weightedSquaredDistance(values, b, weights);

  if (distanceA !== distanceB) {
    return distanceA - distanceB;
  }

  const warmthDeltaA = Math.abs(values.warmth - a.warmth);
  const warmthDeltaB = Math.abs(values.warmth - b.warmth);

  if (warmthDeltaA !== warmthDeltaB) {
    return warmthDeltaA - warmthDeltaB;
  }

  return (
    fontData.fonts.findIndex((font) => font.id === a.id) -
    fontData.fonts.findIndex((font) => font.id === b.id)
  );
}

export function rankFonts(
  values: ControlValues,
  recentAxes: AxisKey[] = [],
  limit = fontData.fonts.length,
): RankedFont[] {
  const weights = buildAxisWeights(recentAxes);
  const pool = getCandidatePool(values);

  return pool
    .map((font) => ({
      font,
      distance: weightedSquaredDistance(values, font, weights),
    }))
    .sort((a, b) => compareCandidates(values, a.font, b.font, weights))
    .slice(0, limit);
}

export function matchFont(
  values: ControlValues,
  recentAxes: AxisKey[] = [],
): FontEntry {
  const ranked = rankFonts(values, recentAxes, 1);
  return ranked[0]?.font ?? getCandidatePool(values)[0];
}

export function findFontByName(name: string): FontEntry | undefined {
  return fontData.fonts.find((font) => font.name === name);
}

export function logMatchDiagnostics(
  values: ControlValues,
  recentAxes: AxisKey[],
  movedAxis: AxisKey,
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const top = rankFonts(values, recentAxes, 3);
  const weights = buildAxisWeights(recentAxes);

  console.group(`[match] ${movedAxis} settle`);
  console.log(
    "axis weights:",
    Object.fromEntries(AXIS_KEYS.map((axis) => [axis, weights[axis]])),
  );
  top.forEach((entry, index) => {
    console.log(
      `${index + 1}. ${entry.font.name} — distance ${entry.distance.toFixed(1)}`,
    );
  });
  console.groupEnd();
}

// Equal-weight baseline used for sweep comparison reports.
export function matchFontUnweighted(values: ControlValues): FontEntry {
  return matchFont(values, []);
}

export function rankFontsUnweighted(
  values: ControlValues,
  limit = fontData.fonts.length,
): RankedFont[] {
  return rankFonts(values, [], limit);
}
