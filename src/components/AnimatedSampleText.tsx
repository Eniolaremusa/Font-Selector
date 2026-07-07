"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { getFontFamily } from "@/lib/fontFamilies";
import {
  PREVIEW_CURSOR_MAX_ROTATE_DEG,
  PREVIEW_CURSOR_MAX_TRANSLATE_PX,
  PREVIEW_CURSOR_SPRING,
  PREVIEW_CURSOR_TRACKING_BASE_PX,
  PREVIEW_CURSOR_TRACKING_TIGHTEN_PX,
  PREVIEW_EDIT_ENTER_TRANSITION,
  PREVIEW_EDIT_EXIT_TRANSITION,
  PREVIEW_HEIGHT_SPRING,
  PREVIEW_LINE_HEIGHT,
  PREVIEW_PLACEHOLDER_TEXT,
  PREVIEW_ROLL_ENTER_OFFSET_MS,
  PREVIEW_ROLL_HOLD_MS,
  getPreviewRollSpring,
} from "@/lib/motionConstants";
import { placeCaretAtEnd, placeCaretAtPoint } from "@/lib/placeCaretAtPoint";
import { useGoogleFontReady } from "@/hooks/useGoogleFontReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { FontEntry } from "@/lib/types";

const PREVIEW_TEXT_CLASS =
  "line-clamp-2 w-full text-center text-[48px] font-medium leading-[1.2] text-white";

const PREVIEW_EDIT_CLASS =
  "line-clamp-2 w-full text-center text-[48px] font-medium leading-[1.2] text-white outline-none";

type AnimatedSampleTextProps = {
  font: FontEntry;
  text: string;
  isEditing: boolean;
  enableRoll: boolean;
  onStartEdit: (clickPoint: { x: number; y: number }) => void;
  onTextChange: (text: string) => void;
  onEndEdit: (text: string) => void;
};

function getFontStack(targetFont: FontEntry): string {
  const family = getFontFamily(targetFont.id);
  return `"${family}", ${targetFont.serifness === "Serif" ? "serif" : "sans-serif"}`;
}

function getMeasureCacheKey(fontId: string, text: string): string {
  return `${fontId}::${text}`;
}

type PreviewTextDisplayProps = {
  displayText: string;
  previewOpacity: number;
  textStyle: {
    fontFamily: string;
    letterSpacing: string | MotionValue<string>;
  };
  onPreviewClick: (event: React.MouseEvent<HTMLParagraphElement>) => void;
  onStartEdit: (clickPoint: { x: number; y: number }) => void;
  skipNextCaretPlacementRef: React.MutableRefObject<boolean>;
};

function PreviewTextDisplay({
  displayText,
  previewOpacity,
  textStyle,
  onPreviewClick,
  onStartEdit,
  skipNextCaretPlacementRef,
}: PreviewTextDisplayProps) {
  const isEmpty = displayText.trim().length === 0;

  return (
    <motion.p
      role="button"
      tabIndex={0}
      onClick={onPreviewClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          skipNextCaretPlacementRef.current = true;
          onStartEdit({ x: 0, y: 0 });
        }
      }}
      className={`${PREVIEW_TEXT_CLASS} cursor-text`}
      style={{
        fontFamily: textStyle.fontFamily,
        letterSpacing: textStyle.letterSpacing,
        opacity: isEmpty ? previewOpacity * 0.4 : previewOpacity,
      }}
    >
      {isEmpty ? PREVIEW_PLACEHOLDER_TEXT : displayText}
    </motion.p>
  );
}

export function AnimatedSampleText({
  font,
  text,
  isEditing,
  enableRoll,
  onStartEdit,
  onTextChange,
  onEndEdit,
}: AnimatedSampleTextProps) {
  const [displayFont, setDisplayFont] = useState(font);
  const [displayText, setDisplayText] = useState(text);
  const [clipHeight, setClipHeight] = useState(PREVIEW_LINE_HEIGHT);

  const targetFamily = getFontFamily(font.id);
  const isTargetFontReady = useGoogleFontReady(targetFamily);

  const measureRef = useRef<HTMLParagraphElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingFontRef = useRef<FontEntry | null>(null);
  const pendingTextRef = useRef<string | null>(null);
  const heightByKeyRef = useRef<Map<string, number>>(new Map());
  const previousFontIdRef = useRef<string | null>(null);
  const displayFontRef = useRef(displayFont);
  const displayTextRef = useRef(displayText);
  const isFirstMountRef = useRef(true);
  const editCaretRef = useRef<{ x: number; y: number } | null>(null);
  const skipNextCaretPlacementRef = useRef(false);
  const editInitializedRef = useRef(false);

  const prefersReducedMotion = usePrefersReducedMotion();

  const rotateXTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const rotateYTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const translateXTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const translateYTarget = useSpring(0, PREVIEW_CURSOR_SPRING);
  const trackingTarget = useSpring(
    PREVIEW_CURSOR_TRACKING_BASE_PX,
    PREVIEW_CURSOR_SPRING,
  );

  const letterSpacing = useTransform(
    trackingTarget,
    (value) => `${value}px`,
  );

  displayFontRef.current = displayFont;
  displayTextRef.current = displayText;

  const measureText = text.trim().length > 0 ? text : "\u00a0";

  const resetCursorMotion = useCallback(() => {
    rotateXTarget.set(0);
    rotateYTarget.set(0);
    translateXTarget.set(0);
    translateYTarget.set(0);
    trackingTarget.set(PREVIEW_CURSOR_TRACKING_BASE_PX);
  }, [
    rotateXTarget,
    rotateYTarget,
    trackingTarget,
    translateXTarget,
    translateYTarget,
  ]);

  const sentenceHeight =
    heightByKeyRef.current.get(
      getMeasureCacheKey(displayFont.id, displayText),
    ) ?? clipHeight;

  const shouldAnimateEnter =
    enableRoll &&
    previousFontIdRef.current !== null &&
    (previousFontIdRef.current !== displayFont.id ||
      displayTextRef.current !== displayText);

  const isTransitioning =
    enableRoll &&
    (font.id !== displayFont.id ||
      text !== displayText ||
      pendingFontRef.current !== null);

  const previewOpacity =
    displayFont.id !== font.id || isTargetFontReady ? 1 : 0;

  const applyMeasuredHeight = useCallback(
    (targetFont: FontEntry, targetText: string) => {
      const measuredHeight =
        measureRef.current?.offsetHeight ?? PREVIEW_LINE_HEIGHT;
      heightByKeyRef.current.set(
        getMeasureCacheKey(targetFont.id, targetText),
        measuredHeight,
      );
      setClipHeight(measuredHeight);
      return measuredHeight;
    },
    [],
  );

  useLayoutEffect(() => {
    if (!enableRoll) {
      setDisplayFont(font);
      setDisplayText(text);
      applyMeasuredHeight(font, text);
      return;
    }

    if (!isTargetFontReady) {
      return;
    }

    applyMeasuredHeight(font, text);

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      previousFontIdRef.current = font.id;
      setDisplayFont(font);
      setDisplayText(text);
      return;
    }

    const fontChanged = font.id !== displayFontRef.current.id;
    const textChanged = text !== displayTextRef.current;

    if (!fontChanged && !textChanged) {
      return;
    }

    const currentHeight =
      heightByKeyRef.current.get(
        getMeasureCacheKey(displayFontRef.current.id, displayTextRef.current),
      ) ?? PREVIEW_LINE_HEIGHT;

    const nextHeight =
      heightByKeyRef.current.get(getMeasureCacheKey(font.id, text)) ??
      measureRef.current?.offsetHeight ??
      PREVIEW_LINE_HEIGHT;

    if (nextHeight !== currentHeight) {
      pendingFontRef.current = font;
      pendingTextRef.current = text;
      setClipHeight(nextHeight);
      return;
    }

    setDisplayFont(font);
    setDisplayText(text);
  }, [font, text, isTargetFontReady, enableRoll, applyMeasuredHeight]);

  useLayoutEffect(() => {
    if (isTransitioning || isEditing) {
      resetCursorMotion();
    }
  }, [isTransitioning, isEditing, resetCursorMotion]);

  useLayoutEffect(() => {
    if (!isEditing) {
      editInitializedRef.current = false;
      return;
    }

    if (!editableRef.current || editInitializedRef.current) {
      return;
    }

    editInitializedRef.current = true;
    const element = editableRef.current;
    element.textContent = text;
    element.focus();

    if (skipNextCaretPlacementRef.current) {
      skipNextCaretPlacementRef.current = false;
      placeCaretAtEnd(element);
      return;
    }

    const caret = editCaretRef.current;
    if (caret) {
      placeCaretAtPoint(element, caret.x, caret.y);
      editCaretRef.current = null;
    } else {
      placeCaretAtEnd(element);
    }
  }, [isEditing, text]);

  const handleHeightAnimationComplete = () => {
    if (!pendingFontRef.current) {
      return;
    }

    setDisplayFont(pendingFontRef.current);
    setDisplayText(pendingTextRef.current ?? text);
    pendingFontRef.current = null;
    pendingTextRef.current = null;
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLParagraphElement>) => {
    if (isEditing || isTransitioning) {
      return;
    }

    editCaretRef.current = { x: event.clientX, y: event.clientY };
    onStartEdit({ x: event.clientX, y: event.clientY });
  };

  const handleEditableInput = () => {
    onTextChange(editableRef.current?.textContent ?? "");
  };

  const handleEditableBlur = () => {
    skipNextCaretPlacementRef.current = true;
    onEndEdit(editableRef.current?.textContent ?? "");
  };

  const handleEditableKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      editableRef.current?.blur();
    }
  };

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (
        prefersReducedMotion ||
        isTransitioning ||
        isEditing ||
        !containerRef.current
      ) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
      const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
      const centerProximity = Math.max(
        0,
        1 - Math.hypot(normalizedX, normalizedY) * 2,
      );

      rotateYTarget.set(normalizedX * PREVIEW_CURSOR_MAX_ROTATE_DEG * 2);
      rotateXTarget.set(-normalizedY * PREVIEW_CURSOR_MAX_ROTATE_DEG * 2);
      translateXTarget.set(normalizedX * PREVIEW_CURSOR_MAX_TRANSLATE_PX * 2);
      translateYTarget.set(normalizedY * PREVIEW_CURSOR_MAX_TRANSLATE_PX * 2);
      trackingTarget.set(
        PREVIEW_CURSOR_TRACKING_BASE_PX -
          PREVIEW_CURSOR_TRACKING_TIGHTEN_PX * centerProximity,
      );
    },
    [
      isEditing,
      isTransitioning,
      prefersReducedMotion,
      rotateXTarget,
      rotateYTarget,
      trackingTarget,
      translateXTarget,
      translateYTarget,
    ],
  );

  const textStyle = {
    fontFamily: getFontStack(isEditing ? font : displayFont),
    letterSpacing:
      isEditing || prefersReducedMotion
        ? `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`
        : letterSpacing,
  };

  const rollItemKey = `${displayFont.id}::${displayText}`;
  const usePreviewParallax = !isEditing && !prefersReducedMotion;

  const rollVariants = {
    enter: (height: number) => ({
      y: height,
      transition: {
        ...getPreviewRollSpring("enter"),
        delay: (PREVIEW_ROLL_HOLD_MS + PREVIEW_ROLL_ENTER_OFFSET_MS) / 1000,
      },
    }),
    center: {
      y: 0,
      transition: getPreviewRollSpring("center"),
    },
    exit: (height: number) => ({
      y: -height,
      transition: getPreviewRollSpring("exit"),
    }),
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[700px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCursorMotion}
    >
      <motion.div style={usePreviewParallax ? { perspective: 900 } : undefined}>
        <motion.div
          style={
            usePreviewParallax
              ? {
                  rotateX: rotateXTarget,
                  rotateY: rotateYTarget,
                  x: translateXTarget,
                  y: translateYTarget,
                  transformStyle: "preserve-3d",
                }
              : undefined
          }
        >
          <motion.div
            className="relative w-full overflow-hidden"
            animate={{ height: clipHeight }}
            initial={false}
            transition={{ height: PREVIEW_HEIGHT_SPRING }}
            onAnimationComplete={() => handleHeightAnimationComplete()}
          >
            {isTargetFontReady ? (
              <p
                ref={measureRef}
                className={`${PREVIEW_TEXT_CLASS} pointer-events-none invisible absolute inset-x-0 top-0`}
                style={{
                  fontFamily: getFontStack(font),
                  letterSpacing: `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`,
                }}
                aria-hidden="true"
              >
                {measureText}
              </p>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              {isEditing ? (
                <motion.div
                  key="preview-editor"
                  className="absolute inset-x-0 top-0 flex items-center justify-center"
                  style={{ minHeight: clipHeight }}
                  initial={{ opacity: 0.72 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.72 }}
                  transition={PREVIEW_EDIT_EXIT_TRANSITION}
                >
                  <div
                    ref={editableRef}
                    role="textbox"
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    aria-label="Preview text"
                    data-placeholder={PREVIEW_PLACEHOLDER_TEXT}
                    className={`${PREVIEW_EDIT_CLASS} empty:opacity-40 empty:before:pointer-events-none empty:before:text-white empty:before:content-[attr(data-placeholder)]`}
                    style={{
                      fontFamily: textStyle.fontFamily,
                      letterSpacing: `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`,
                      direction: "ltr",
                      unicodeBidi: "plaintext",
                      textAlign: "center",
                    }}
                    onInput={handleEditableInput}
                    onBlur={handleEditableBlur}
                    onKeyDown={handleEditableKeyDown}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview-display"
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.85 }}
                  transition={PREVIEW_EDIT_ENTER_TRANSITION}
                  className="absolute inset-x-0 top-0"
                  style={{ minHeight: clipHeight }}
                >
                  {enableRoll ? (
                    <AnimatePresence
                      mode="sync"
                      initial={false}
                      onExitComplete={() => {
                        previousFontIdRef.current = displayFont.id;
                      }}
                    >
                      <motion.div
                        key={rollItemKey}
                        custom={sentenceHeight}
                        className="absolute inset-x-0 top-0 flex items-center justify-center"
                        style={{ height: sentenceHeight }}
                        variants={rollVariants}
                        initial={shouldAnimateEnter ? "enter" : false}
                        animate="center"
                        exit="exit"
                      >
                        <PreviewTextDisplay
                          displayText={displayText}
                          previewOpacity={previewOpacity}
                          textStyle={textStyle}
                          onPreviewClick={handlePreviewClick}
                          onStartEdit={onStartEdit}
                          skipNextCaretPlacementRef={skipNextCaretPlacementRef}
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div
                      className="flex items-center justify-center"
                      style={{ minHeight: sentenceHeight }}
                    >
                      <PreviewTextDisplay
                        displayText={displayText}
                        previewOpacity={previewOpacity}
                        textStyle={textStyle}
                        onPreviewClick={handlePreviewClick}
                        onStartEdit={onStartEdit}
                        skipNextCaretPlacementRef={skipNextCaretPlacementRef}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
