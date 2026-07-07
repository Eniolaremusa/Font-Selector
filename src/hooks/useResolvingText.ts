"use client";

import { useEffect, useRef, useState } from "react";
import { buildNameResolveSequence } from "@/lib/buildNameResolveSequence";
import {
  NAME_RESOLVE_CHAR_STEP_MS,
  NAME_RESOLVE_CYCLES_PER_CHAR,
  NAME_RESOLVE_START_DELAY_MS,
  getNameResolveCharStaggerMs,
  getNameResolveDurationMs,
} from "@/lib/motionConstants";

function formatResolvingText(chars: string[], targetLength: number): string {
  return chars.slice(0, targetLength).join("").trimEnd();
}

type UseResolvingTextOptions = {
  text: string;
  changeKey: string;
  startDelayMs?: number;
};

export function useResolvingText({
  text,
  changeKey,
  startDelayMs = NAME_RESOLVE_START_DELAY_MS,
}: UseResolvingTextOptions) {
  const [displayText, setDisplayText] = useState(text);
  const [isResolving, setIsResolving] = useState(false);
  const prevChangeKeyRef = useRef(changeKey);
  const prevTextRef = useRef(text);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    if (prevChangeKeyRef.current === changeKey) {
      setDisplayText(text);
      setIsResolving(false);
      return clearTimers;
    }

    const fromText = prevTextRef.current;
    const toText = text;
    const targetChars = toText.split("");
    const workingChars = fromText.split("");

    while (workingChars.length < targetChars.length) {
      workingChars.push(" ");
    }

    prevChangeKeyRef.current = changeKey;
    prevTextRef.current = text;

    setDisplayText(fromText);
    setIsResolving(true);

    const resolveDuration = getNameResolveDurationMs(targetChars.length);
    const charStagger = getNameResolveCharStaggerMs(targetChars.length);

    const startTimer = setTimeout(() => {
      targetChars.forEach((targetChar, index) => {
        const sequence = buildNameResolveSequence(
          workingChars[index] ?? " ",
          targetChar,
        );

        sequence.forEach((char, step) => {
          const timer = setTimeout(() => {
            workingChars[index] = char;
            setDisplayText(
              formatResolvingText(workingChars, targetChars.length),
            );
          }, index * charStagger + step * NAME_RESOLVE_CHAR_STEP_MS);

          timersRef.current.push(timer);
        });
      });

      const settleTimer = setTimeout(() => {
        setDisplayText(toText);
        setIsResolving(false);
      }, resolveDuration);

      timersRef.current.push(settleTimer);
    }, startDelayMs);

    timersRef.current.push(startTimer);

    return clearTimers;
  }, [changeKey, text, startDelayMs]);

  return { displayText, isResolving };
}
