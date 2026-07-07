import { fontData } from "./fontData";
import type { FontEntry } from "./types";

export function getRandomFont(): FontEntry {
  const index = Math.floor(Math.random() * fontData.fonts.length);
  return fontData.fonts[index]!;
}
