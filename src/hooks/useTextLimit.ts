"use client";

import { useCallback, useRef, type RefObject } from "react";
import {
  exceedsRenderedLineLimit,
  getProposedText,
  restoreTextAtEnd,
  saveSelectionOffsets,
} from "@/lib/previewTextLimit";

type UseTextLimitOptions = {
  editableRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onAccept: (text: string) => void;
  onReject: () => void;
};

export function useTextLimit({
  editableRef,
  enabled,
  onAccept,
  onReject,
}: UseTextLimitOptions) {
  const lastValidTextRef = useRef("");

  const setValidText = useCallback((text: string) => {
    lastValidTextRef.current = text;
  }, []);

  const rejectOverflow = useCallback(() => {
    const element = editableRef.current;
    if (!element) {
      return;
    }

    restoreTextAtEnd(element, lastValidTextRef.current);
    onReject();
  }, [editableRef, onReject]);

  const acceptIfWithinLimit = useCallback(
    (candidateText: string) => {
      const element = editableRef.current;
      if (!element) {
        return false;
      }

      element.textContent = candidateText;

      if (exceedsRenderedLineLimit(element)) {
        rejectOverflow();
        return false;
      }

      lastValidTextRef.current = candidateText;
      onAccept(candidateText);
      return true;
    },
    [editableRef, onAccept, rejectOverflow],
  );

  const handleInput = useCallback(() => {
    if (!enabled) {
      return;
    }

    const element = editableRef.current;
    if (!element) {
      return;
    }

    const nextText = element.textContent ?? "";

    if (exceedsRenderedLineLimit(element)) {
      rejectOverflow();
      return;
    }

    lastValidTextRef.current = nextText;
    onAccept(nextText);
  }, [editableRef, enabled, onAccept, rejectOverflow]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }

      event.preventDefault();

      const element = editableRef.current;
      if (!element) {
        return;
      }

      const pasteText = event.clipboardData.getData("text/plain");
      if (!pasteText) {
        return;
      }

      const selection = saveSelectionOffsets(element);
      const proposed = getProposedText(
        element.textContent ?? "",
        selection,
        pasteText,
      );

      acceptIfWithinLimit(proposed);
    },
    [acceptIfWithinLimit, editableRef, enabled],
  );

  const handleCompositionEnd = useCallback(() => {
    handleInput();
  }, [handleInput]);

  return {
    lastValidTextRef,
    setValidText,
    handleInput,
    handlePaste,
    handleCompositionEnd,
  };
}
