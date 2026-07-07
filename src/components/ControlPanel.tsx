"use client";

import type { AxisKey } from "@/lib/types";
import { fontData } from "@/lib/fontData";
import { AxisSlider } from "./AxisSlider";
import { SerifnessToggle } from "./SerifnessToggle";

type ControlPanelProps = {
  values: Record<AxisKey, number>;
  serifness: "Sans" | "Serif" | "Any";
  choreographyToken?: number;
  onChoreographyInterrupt?: () => void;
  onAxisChange: (axis: AxisKey, value: number) => void;
  onAxisCommit?: (axis: AxisKey, value: number) => void;
  onSerifnessChange: (value: "Sans" | "Serif" | "Any") => void;
};

const AXIS_LABELS: Record<AxisKey, string> = {
  warmth: "Warmth",
  personality: "Personality",
  structure: "Structure",
  presence: "Presence",
  width: "Width",
};

const GRID_ORDER: Array<AxisKey | "serifness"> = [
  "warmth",
  "personality",
  "structure",
  "presence",
  "width",
  "serifness",
];

export function ControlPanel({
  values,
  serifness,
  choreographyToken = 0,
  onChoreographyInterrupt,
  onAxisChange,
  onAxisCommit,
  onSerifnessChange,
}: ControlPanelProps) {
  const rows: Array<Array<AxisKey | "serifness">> = [];
  for (let index = 0; index < GRID_ORDER.length; index += 2) {
    rows.push(GRID_ORDER.slice(index, index + 2));
  }

  return (
    <section className="w-full rounded-b-[20px] border border-t-0 border-[#151313] bg-[#0e0d0d] px-8 pb-10 pt-6">
      <div className="flex flex-col gap-4">
        <p className="text-[15px] font-bold uppercase tracking-[-0.15px] text-white">
          Find your font
        </p>

        <div className="h-px w-full bg-[#151313]" />

        <div className="flex flex-col gap-6">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-6">
              {row.map((item) =>
                item === "serifness" ? (
                  <SerifnessToggle
                    key={item}
                    value={serifness}
                    options={fontData.serifnessOptions}
                    choreographyToken={choreographyToken}
                    onChange={onSerifnessChange}
                  />
                ) : (
                  <AxisSlider
                    key={item}
                    label={AXIS_LABELS[item]}
                    minLabel={fontData.axes[item].min}
                    maxLabel={fontData.axes[item].max}
                    value={values[item]}
                    choreographyToken={choreographyToken}
                    onChange={(value) => onAxisChange(item, value)}
                    onChoreographyInterrupt={onChoreographyInterrupt}
                    onCommit={(value) => onAxisCommit?.(item, value)}
                    labelSemibold={item === "warmth"}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
