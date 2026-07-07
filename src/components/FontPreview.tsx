"use client";

import { getFontFamily } from "@/lib/fontFamilies";
import {
  FONT_CHANGE_NAME_START_MS,
  FONT_CHANGE_PAIRS_START_MS,
} from "@/lib/motionConstants";
import type { FontEntry } from "@/lib/types";
import { ENABLE_CUSTOM_TEXT } from "@/lib/previewFeatureFlags";
import { AnimatedFontNameTab } from "./AnimatedFontNameTab";
import { AnimatedSampleText } from "./AnimatedSampleText";
import { BookmarkButton } from "./BookmarkButton";
import { GoogleFontLoader } from "./GoogleFontLoader";
import { ResolvingText } from "./ResolvingText";
import { SurpriseMeButton } from "./SurpriseMeButton";

type FontPreviewProps = {
  font: FontEntry;
  previewText: string;
  isCustomMode: boolean;
  isPreviewEditing: boolean;
  enablePreviewRoll: boolean;
  textResetToken: number;
  onPreviewStartEdit: () => void;
  onPreviewTextChange: (text: string) => void;
  onPreviewEndEdit: (text: string) => void;
  onPreviewReset: () => void;
  onSurpriseMe: () => void;
  onPairsWith?: (fontName: string) => void;
};

export function FontPreview({
  font,
  previewText,
  isCustomMode,
  isPreviewEditing,
  enablePreviewRoll,
  textResetToken,
  onPreviewStartEdit,
  onPreviewTextChange,
  onPreviewEndEdit,
  onPreviewReset,
  onSurpriseMe,
  onPairsWith,
}: FontPreviewProps) {
  const fontFamily = getFontFamily(font.id);

  return (
    <section className="w-full rounded-t-[20px] border border-[#151313] bg-[#0c0b0b] px-8 pb-[72px] pt-8">
      <GoogleFontLoader family={fontFamily} />

      <div className="flex flex-col gap-[72px]">
        <div className="flex items-center justify-between">
          <AnimatedFontNameTab
            fontId={font.id}
            fontName={font.name}
            startDelayMs={FONT_CHANGE_NAME_START_MS}
          />

          <div className="flex items-center gap-3">
            <BookmarkButton />

            <SurpriseMeButton onClick={onSurpriseMe} />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[700px] flex-col items-center gap-3">
          <AnimatedSampleText
            font={font}
            text={previewText}
            isCustomMode={isCustomMode}
            isEditing={isPreviewEditing}
            enableRoll={enablePreviewRoll}
            textResetToken={textResetToken}
            onStartEdit={() => onPreviewStartEdit()}
            onTextChange={onPreviewTextChange}
            onEndEdit={onPreviewEndEdit}
          />

          {ENABLE_CUSTOM_TEXT && isCustomMode && !isPreviewEditing ? (
            <button
              type="button"
              onClick={onPreviewReset}
              className="text-[13px] font-medium tracking-[-0.13px] text-[#7d7a79] transition-colors hover:text-[#948f8e]"
            >
              reset text
            </button>
          ) : null}

          <ResolvingText
            text={font.pairsWith}
            changeKey={font.id}
            startDelayMs={FONT_CHANGE_PAIRS_START_MS}
            interactiveChip
            onTextClick={
              onPairsWith ? () => onPairsWith(font.pairsWith) : undefined
            }
            className="rounded-2xl px-3 py-1.5"
            prefix="Pairs best with"
            prefixClassName="text-[15px] font-medium tracking-[-0.15px] text-[#948f8e]"
            textClassName="text-[15px] font-medium tracking-[-0.15px] text-white"
          />
        </div>
      </div>
    </section>
  );
}
