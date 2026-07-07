"use client";

import { ResolvingText } from "./ResolvingText";
import { NAME_TAB_LINE_HEIGHT } from "@/lib/motionConstants";

type AnimatedFontNameTabProps = {
  fontName: string;
  fontId: string;
  startDelayMs?: number;
};

export function AnimatedFontNameTab({
  fontName,
  fontId,
  startDelayMs,
}: AnimatedFontNameTabProps) {
  return (
    <ResolvingText
      text={fontName}
      changeKey={fontId}
      startDelayMs={startDelayMs}
      className="overflow-hidden rounded-2xl bg-[#232121] px-3 py-1.5"
      textClassName="text-[15px] font-medium leading-[23px] tracking-[-0.15px] text-[#948f8e]"
      lineHeight={NAME_TAB_LINE_HEIGHT}
    />
  );
}
