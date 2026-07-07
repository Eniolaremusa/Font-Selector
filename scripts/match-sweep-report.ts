import { AXIS_KEYS, type AxisKey, type ControlValues } from "../src/lib/types";
import {
  matchFont,
  matchFontUnweighted,
  rankFonts,
  rankFontsUnweighted,
} from "../src/lib/matchFont";

const INITIAL_VALUES: ControlValues = {
  warmth: 78,
  personality: 88,
  structure: 65,
  presence: 72,
  width: 56,
  serifness: "Any",
};

const SWEEP_POINTS = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const MID_RANGE_POINTS = SWEEP_POINTS.filter((point) => point >= 30 && point <= 70);

type SweepMode = "unweighted" | "weighted";

function sweepAxis(axis: AxisKey, mode: SweepMode) {
  const fonts = new Set<string>();
  const midRangeFonts = new Set<string>();
  let midRangeChanges = 0;
  let previousMidFont: string | null = null;

  for (const point of SWEEP_POINTS) {
    const values = { ...INITIAL_VALUES, [axis]: point };
    const font =
      mode === "weighted"
        ? matchFont(values, [axis])
        : matchFontUnweighted(values);

    fonts.add(font.name);

    if (point >= 30 && point <= 70) {
      midRangeFonts.add(font.name);
      if (previousMidFont && previousMidFont !== font.name) {
        midRangeChanges += 1;
      }
      previousMidFont = font.name;
    }
  }

  return {
    distinctFonts: fonts.size,
    midRangeDistinctFonts: midRangeFonts.size,
    midRangeChanges,
    fonts: [...fonts].sort(),
  };
}

export function runMatchSweepReport(): void {
  console.log("Match sweep report");
  console.log("Baseline values:", INITIAL_VALUES);
  console.log("");

  for (const axis of AXIS_KEYS) {
    const before = sweepAxis(axis, "unweighted");
    const after = sweepAxis(axis, "weighted");

    console.log(`## ${axis}`);
    console.log(
      `before — full 0–100: ${before.distinctFonts} fonts, mid 30–70: ${before.midRangeDistinctFonts} fonts / ${before.midRangeChanges} changes`,
    );
    console.log(`  fonts: ${before.fonts.join(", ")}`);
    console.log(
      `after  — full 0–100: ${after.distinctFonts} fonts, mid 30–70: ${after.midRangeDistinctFonts} fonts / ${after.midRangeChanges} changes`,
    );
    console.log(`  fonts: ${after.fonts.join(", ")}`);
    console.log("");
  }

  console.log("Width data gap: no fonts with width between 14 (Oswald) and 40 (Caveat).");
  console.log("");

  const sampleValue = 55;
  const sampleValues = { ...INITIAL_VALUES, warmth: sampleValue };
  console.log(`Sample top-3 at warmth=${sampleValue} (weighted, recent=[warmth]):`);
  rankFonts(sampleValues, ["warmth"], 3).forEach((entry, index) => {
    console.log(
      `  ${index + 1}. ${entry.font.name} — ${entry.distance.toFixed(1)}`,
    );
  });
  console.log("");
  console.log(`Sample top-3 at warmth=${sampleValue} (unweighted):`);
  rankFontsUnweighted(sampleValues, 3).forEach((entry, index) => {
    console.log(
      `  ${index + 1}. ${entry.font.name} — ${entry.distance.toFixed(1)}`,
    );
  });
}

runMatchSweepReport();
