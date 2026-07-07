export type AxisKey =
  | "warmth"
  | "personality"
  | "structure"
  | "presence"
  | "width";

export type Serifness = "Sans" | "Serif" | "Any";

export type AxisDefinition = {
  min: string;
  max: string;
};

export type FontEntry = {
  id: string;
  name: string;
  warmth: number;
  personality: number;
  structure: number;
  presence: number;
  width: number;
  serifness: "Sans" | "Serif";
  pairsWith: string;
  sentence: string;
};

export type FontDataset = {
  axes: Record<AxisKey, AxisDefinition>;
  serifnessOptions: Serifness[];
  fonts: FontEntry[];
};

export type ControlValues = Record<AxisKey, number> & {
  serifness: Serifness;
};

export const AXIS_KEYS: AxisKey[] = [
  "warmth",
  "personality",
  "structure",
  "presence",
  "width",
];
