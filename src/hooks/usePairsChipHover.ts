"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildHoverPeekSequence } from "@/lib/buildNameResolveSequence";
import {
  PAIRS_HOVER_CHAR_COUNT_MAX,
  PAIRS_HOVER_CHAR_COUNT_MIN,
  PAIRS_HOVER_CHAR_STAGGER_MS,
  PAIRS_HOVER_CHAR_STEP_MS,
  PAIRS_HOVER_DURATION_MS,
} from "@/lib/motionConstants";

function pickRandomIndices(length: number, count: number): number[] {
  if (length === 0) {
    return [];
  }

  const indices = Array.from({ length }, (_, index) => index);

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }

  return indices.slice(0, count);
}

type UsePairsChipHoverOptions = {
  text: string;
  enabled: boolean;
};

export function usePairsChipHover({ text, enabled }: UsePairsChipHoverOptions) {
  const [peekText, setPeekText] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generationRef = useRef(0);
  const hasPlayedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const resetPeek = useCallback(() => {
    generationRef.current += 1;
    clearTimers();
    setPeekText(null);
    hasPlayedRef.current = false;
  }, [clearTimers]);

  const playPeek = useCallback(() => {
    if (!enabled || hasPlayedRef.current || text.length === 0) {
      return;
    }

    hasPlayedRef.current = true;
    clearTimers();

    const generation = generationRef.current + 1;
    generationRef.current = generation;

    const charCount = Math.min(
      text.length,
      PAIRS_HOVER_CHAR_COUNT_MIN +
        Math.floor(
          Math.random() *
            (PAIRS_HOVER_CHAR_COUNT_MAX - PAIRS_HOVER_CHAR_COUNT_MIN + 1),
        ),
    );

    const indices = pickRandomIndices(text.length, charCount);
    const workingChars = text.split("");

    indices.forEach((charIndex, sequenceIndex) => {
      const sequence = buildHoverPeekSequence(text[charIndex] ?? " ");

      sequence.forEach((char, step) => {
        const timer = setTimeout(() => {
          if (generation !== generationRef.current) {
            return;
          }

          workingChars[charIndex] = char;
          setPeekText(workingChars.join(""));
        }, sequenceIndex * PAIRS_HOVER_CHAR_STAGGER_MS + step * PAIRS_HOVER_CHAR_STEP_MS);

        timersRef.current.push(timer);
      });
    });

    const settleTimer = setTimeout(() => {
      if (generation !== generationRef.current) {
        return;
      }

      setPeekText(null);
    }, PAIRS_HOVER_DURATION_MS);

    timersRef.current.push(settleTimer);
  }, [clearTimers, enabled, text]);

  useEffect(() => {
    resetPeek();
  }, [text, resetPeek]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    displayText: peekText,
    onHoverStart: playPeek,
    onHoverEnd: resetPeek,
  };
}
