"use client";

import { useMemo, useRef, useState } from "react";
import { getRandomFont } from "@/lib/getRandomFont";
import {
  findFontByName,
  logMatchDiagnostics,
  matchFont,
} from "@/lib/matchFont";
import type { AxisKey, ControlValues, FontEntry } from "@/lib/types";
import { ENABLE_CUSTOM_TEXT } from "@/lib/previewFeatureFlags";
import { ControlPanel } from "./ControlPanel";
import { FontPreview } from "./FontPreview";

const INITIAL_VALUES: ControlValues = {
  warmth: 78,
  personality: 88,
  structure: 65,
  presence: 72,
  width: 56,
  serifness: "Any",
};

function fontToControlValues(font: FontEntry): ControlValues {
  return {
    warmth: font.warmth,
    personality: font.personality,
    structure: font.structure,
    presence: font.presence,
    width: font.width,
    serifness: font.serifness,
  };
}

function pushRecentAxis(current: AxisKey[], axis: AxisKey): AxisKey[] {
  return [axis, ...current.filter((item) => item !== axis)];
}

export function FontSelector() {
  const [values, setValues] = useState<ControlValues>(INITIAL_VALUES);
  const [committedValues, setCommittedValues] =
    useState<ControlValues>(INITIAL_VALUES);
  const [recentAxes, setRecentAxes] = useState<AxisKey[]>([]);
  const [choreographyToken, setChoreographyToken] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customPreviewText, setCustomPreviewText] = useState("");
  const [isPreviewEditing, setIsPreviewEditing] = useState(false);
  const [textResetToken, setTextResetToken] = useState(0);

  const editBaselineRef = useRef("");

  const committedFont = useMemo(
    () => matchFont(committedValues, recentAxes),
    [committedValues, recentAxes],
  );

  const liveFont = useMemo(
    () => matchFont(values, recentAxes),
    [values, recentAxes],
  );

  const previewFont =
    ENABLE_CUSTOM_TEXT && (isCustomMode || isPreviewEditing)
      ? liveFont
      : committedFont;
  const previewText =
    ENABLE_CUSTOM_TEXT && isCustomMode
      ? customPreviewText
      : committedFont.sentence;
  const enablePreviewRoll =
    !ENABLE_CUSTOM_TEXT || (!isCustomMode && !isPreviewEditing);

  const handleChoreographyInterrupt = () => {
    setChoreographyToken(0);
  };

  const handleAxisChange = (axis: AxisKey, value: number) => {
    setValues((current) => ({ ...current, [axis]: value }));
  };

  const handleAxisCommit = (axis: AxisKey, value: number) => {
    setChoreographyToken(0);
    setValues((current) => {
      const nextValues = { ...current, [axis]: value };
      setCommittedValues(nextValues);
      setRecentAxes((currentAxes) => {
        const nextRecentAxes = pushRecentAxis(currentAxes, axis);
        logMatchDiagnostics(nextValues, nextRecentAxes, axis);
        return nextRecentAxes;
      });
      return nextValues;
    });
  };

  const handleSerifnessChange = (serifness: ControlValues["serifness"]) => {
    setChoreographyToken(0);
    setValues((current) => {
      const next = { ...current, serifness };
      setCommittedValues(next);
      return next;
    });
    setRecentAxes([]);
  };

  const applyFontProgrammatically = (font: FontEntry) => {
    const nextValues = fontToControlValues(font);
    setRecentAxes([]);
    setChoreographyToken((current) => current + 1);
    setValues(nextValues);
    setCommittedValues(nextValues);
  };

  const handleSurpriseMe = () => {
    applyFontProgrammatically(getRandomFont());
  };

  const handlePairsWith = (fontName: string) => {
    const pairedFont = findFontByName(fontName);

    if (!pairedFont) {
      console.warn(`Pairs-with font not found: ${fontName}`);
      return;
    }

    applyFontProgrammatically(pairedFont);
  };

  const handlePreviewStartEdit = () => {
    if (!ENABLE_CUSTOM_TEXT) {
      return;
    }
    const baseline = isCustomMode
      ? customPreviewText
      : committedFont.sentence;
    editBaselineRef.current = baseline;

    if (!isCustomMode) {
      setCustomPreviewText(baseline);
    }

    setIsPreviewEditing(true);
  };

  const handlePreviewTextChange = (text: string) => {
    if (!ENABLE_CUSTOM_TEXT) {
      return;
    }
    setCustomPreviewText(text);

    if (text !== editBaselineRef.current) {
      setIsCustomMode(true);
    }
  };

  const handlePreviewEndEdit = (text: string) => {
    if (!ENABLE_CUSTOM_TEXT) {
      return;
    }
    setIsPreviewEditing(false);

    if (text !== editBaselineRef.current) {
      setIsCustomMode(true);
      setCustomPreviewText(text);
    } else if (!isCustomMode) {
      setCustomPreviewText("");
    }
  };

  const handlePreviewReset = () => {
    if (!ENABLE_CUSTOM_TEXT) {
      return;
    }
    setIsCustomMode(false);
    setCustomPreviewText("");
    setTextResetToken((current) => current + 1);
  };

  return (
    <div className="flex w-full max-w-[800px] flex-col">
      <FontPreview
        font={previewFont}
        previewText={previewText}
        isCustomMode={isCustomMode}
        isPreviewEditing={isPreviewEditing}
        enablePreviewRoll={enablePreviewRoll}
        textResetToken={textResetToken}
        onPreviewStartEdit={handlePreviewStartEdit}
        onPreviewTextChange={handlePreviewTextChange}
        onPreviewEndEdit={handlePreviewEndEdit}
        onPreviewReset={handlePreviewReset}
        onSurpriseMe={handleSurpriseMe}
        onPairsWith={handlePairsWith}
      />

      <ControlPanel
        values={{
          warmth: values.warmth,
          personality: values.personality,
          structure: values.structure,
          presence: values.presence,
          width: values.width,
        }}
        serifness={values.serifness}
        choreographyToken={choreographyToken}
        onChoreographyInterrupt={handleChoreographyInterrupt}
        onAxisChange={handleAxisChange}
        onAxisCommit={handleAxisCommit}
        onSerifnessChange={handleSerifnessChange}
      />
    </div>
  );
}
