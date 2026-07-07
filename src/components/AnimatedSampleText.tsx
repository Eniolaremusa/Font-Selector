"use client";

import {
  useCallback,
  useEffect,
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
  PREVIEW_CUSTOM_CROSSFADE_TRANSITION,
  PREVIEW_EDIT_ENTER_TRANSITION,
  PREVIEW_EDIT_EXIT_TRANSITION,
  PREVIEW_HEIGHT_EXIT_FADE_MS,
  PREVIEW_HEIGHT_EXIT_FADE_OVERLAP,
  PREVIEW_HEIGHT_EXIT_FADE_TRANSITION,
  PREVIEW_HEIGHT_RESIZE_TRANSITION,
  PREVIEW_LINE_HEIGHT,
  PREVIEW_PLACEHOLDER_TEXT,
  PREVIEW_ROLL_ENTER_OFFSET_MS,
  PREVIEW_ROLL_HOLD_MS,
  getPreviewRollSpring,
} from "@/lib/motionConstants";
import { placeCaretAtEnd, placeCaretAtPoint } from "@/lib/placeCaretAtPoint";
import { PREVIEW_MAX_HEIGHT_PX } from "@/lib/previewTextLimit";
import { useGoogleFontReady } from "@/hooks/useGoogleFontReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { usePreviewBoundaryResistance } from "@/hooks/usePreviewBoundaryResistance";
import { useTextLimit } from "@/hooks/useTextLimit";
import { ENABLE_CUSTOM_TEXT } from "@/lib/previewFeatureFlags";
import type { FontEntry } from "@/lib/types";

const PREVIEW_TEXT_CLASS =
  "line-clamp-2 w-full text-center text-[48px] font-medium leading-[1.2] text-white";

const PREVIEW_EDIT_CLASS =
  "w-full break-words text-center text-[48px] font-medium leading-[1.2] text-white outline-none";

type AnimatedSampleTextProps = {
  font: FontEntry;
  text: string;
  isCustomMode: boolean;
  isEditing: boolean;
  enableRoll: boolean;
  textResetToken: number;
  onStartEdit: (clickPoint: { x: number; y: number }) => void;
  onTextChange: (text: string) => void;
  onEndEdit: (text: string) => void;
};

type HeightSequencePhase = "idle" | "fade-out" | "resize" | "roll-in";

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

  if (!ENABLE_CUSTOM_TEXT) {
    return (
      <motion.p
        className={PREVIEW_TEXT_CLASS}
        style={{
          fontFamily: textStyle.fontFamily,
          letterSpacing: textStyle.letterSpacing,
          opacity: previewOpacity,
        }}
      >
        {displayText}
      </motion.p>
    );
  }

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
  isCustomMode,
  isEditing,
  enableRoll,
  textResetToken,
  onStartEdit,
  onTextChange,
  onEndEdit,
}: AnimatedSampleTextProps) {
  const customActive = ENABLE_CUSTOM_TEXT && isCustomMode;
  const editingActive = ENABLE_CUSTOM_TEXT && isEditing;

  const [displayFont, setDisplayFont] = useState(font);
  const [displayText, setDisplayText] = useState(text);
  const [clipHeight, setClipHeight] = useState(PREVIEW_LINE_HEIGHT);
  const [heightSequencePhase, setHeightSequencePhase] =
    useState<HeightSequencePhase>("idle");
  const [useTextCrossfade, setUseTextCrossfade] = useState(false);

  const targetFamily = getFontFamily(font.id);
  const isTargetFontReady = useGoogleFontReady(targetFamily);

  const measureRef = useRef<HTMLParagraphElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingFontRef = useRef<FontEntry | null>(null);
  const pendingTextRef = useRef<string | null>(null);
  const pendingHeightRef = useRef<number | null>(null);
  const heightByKeyRef = useRef<Map<string, number>>(new Map());
  const previousFontIdRef = useRef<string | null>(null);
  const displayFontRef = useRef(displayFont);
  const displayTextRef = useRef(displayText);
  const isFirstMountRef = useRef(true);
  const editCaretRef = useRef<{ x: number; y: number } | null>(null);
  const skipNextCaretPlacementRef = useRef(false);
  const editInitializedRef = useRef(false);
  const heightSequencePhaseRef = useRef<HeightSequencePhase>("idle");
  const lastTextResetTokenRef = useRef(textResetToken);
  const useTextCrossfadeRef = useRef(false);

  const prefersReducedMotion = usePrefersReducedMotion();
  const { frameX, frameScale, triggerResistance } =
    usePreviewBoundaryResistance(prefersReducedMotion);
  const { setValidText, handleInput, handlePaste, handleCompositionEnd } =
    useTextLimit({
      editableRef,
      enabled: editingActive,
      onAccept: onTextChange,
      onReject: () => {
        void triggerResistance();
      },
    });

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
  heightSequencePhaseRef.current = heightSequencePhase;
  useTextCrossfadeRef.current = useTextCrossfade;

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
    heightSequencePhase === "idle" &&
    previousFontIdRef.current !== null &&
    (previousFontIdRef.current !== displayFont.id ||
      displayTextRef.current !== displayText);

  const isRollTransitioning =
    enableRoll &&
    !useTextCrossfade &&
    (heightSequencePhase !== "idle" ||
      font.id !== displayFont.id ||
      text !== displayText ||
      pendingFontRef.current !== null);

  const isTransitioning =
    isRollTransitioning ||
    (customActive && !editingActive && font.id !== displayFont.id);

  const previewOpacity =
    displayFont.id !== font.id || isTargetFontReady ? 1 : 0;

  const measureAndCacheHeight = useCallback(
    (targetFont: FontEntry, targetText: string) => {
      const rawHeight =
        measureRef.current?.offsetHeight ?? PREVIEW_LINE_HEIGHT;
      const measuredHeight = Math.min(rawHeight, PREVIEW_MAX_HEIGHT_PX);
      heightByKeyRef.current.set(
        getMeasureCacheKey(targetFont.id, targetText),
        measuredHeight,
      );
      return measuredHeight;
    },
    [],
  );

  const startHeightSequence = useCallback(
    (targetFont: FontEntry, targetText: string, targetHeight: number) => {
      pendingFontRef.current = targetFont;
      pendingTextRef.current = targetText;
      pendingHeightRef.current = targetHeight;
      setHeightSequencePhase("fade-out");
    },
    [],
  );

  const completeHeightResize = useCallback(() => {
    if (!pendingFontRef.current) {
      return;
    }

    setDisplayFont(pendingFontRef.current);
    setDisplayText(pendingTextRef.current ?? text);
    pendingFontRef.current = null;
    pendingTextRef.current = null;
    pendingHeightRef.current = null;
    setHeightSequencePhase("roll-in");
  }, [text]);

  const completeHeightSequence = useCallback(() => {
    setHeightSequencePhase("idle");
    previousFontIdRef.current = displayFontRef.current.id;
  }, []);

  useEffect(() => {
    if (!ENABLE_CUSTOM_TEXT) {
      return;
    }

    if (textResetToken === lastTextResetTokenRef.current) {
      return;
    }

    lastTextResetTokenRef.current = textResetToken;
    setUseTextCrossfade(true);
  }, [textResetToken]);

  useLayoutEffect(() => {
    if (editingActive) {
      setDisplayFont(font);
      setDisplayText(text);
      const measuredHeight = measureAndCacheHeight(font, text);
      setClipHeight(measuredHeight);
      return;
    }

    if (customActive) {
      if (!isTargetFontReady) {
        return;
      }

      const nextHeight = measureAndCacheHeight(font, text);
      setDisplayFont(font);
      setDisplayText(text);
      setClipHeight(nextHeight);
      setHeightSequencePhase("idle");
      return;
    }

    if (!enableRoll) {
      if (!isTargetFontReady) {
        return;
      }

      const nextHeight = measureAndCacheHeight(font, text);
      setDisplayFont(font);
      setDisplayText(text);
      setClipHeight(nextHeight);
      return;
    }

    if (!isTargetFontReady) {
      return;
    }

    const nextHeight = measureAndCacheHeight(font, text);

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      previousFontIdRef.current = font.id;
      setDisplayFont(font);
      setDisplayText(text);
      setClipHeight(nextHeight);
      return;
    }

    const fontChanged = font.id !== displayFontRef.current.id;
    const textChanged = text !== displayTextRef.current;

    if (!fontChanged && !textChanged) {
      return;
    }

    if (useTextCrossfade) {
      setDisplayFont(font);
      setDisplayText(text);
      setClipHeight(nextHeight);
      return;
    }

    if (heightSequencePhaseRef.current !== "idle") {
      const pendingMatches =
        pendingFontRef.current?.id === font.id &&
        pendingTextRef.current === text;

      if (!pendingMatches) {
        startHeightSequence(font, text, nextHeight);
      }
      return;
    }

    const currentHeight =
      heightByKeyRef.current.get(
        getMeasureCacheKey(displayFontRef.current.id, displayTextRef.current),
      ) ?? clipHeight;

    if (nextHeight !== currentHeight) {
      startHeightSequence(font, text, nextHeight);
      return;
    }

    setDisplayFont(font);
    setDisplayText(text);
  }, [
    font,
    text,
    isTargetFontReady,
    enableRoll,
    customActive,
    editingActive,
    useTextCrossfade,
    measureAndCacheHeight,
    startHeightSequence,
    clipHeight,
  ]);

  useEffect(() => {
    if (heightSequencePhase !== "fade-out") {
      return;
    }

    const resizeDelay = Math.round(
      PREVIEW_HEIGHT_EXIT_FADE_MS * PREVIEW_HEIGHT_EXIT_FADE_OVERLAP,
    );

    const resizeTimer = window.setTimeout(() => {
      if (pendingHeightRef.current !== null) {
        setClipHeight(pendingHeightRef.current);
      }
      setHeightSequencePhase("resize");
    }, resizeDelay);

    return () => window.clearTimeout(resizeTimer);
  }, [heightSequencePhase]);

  useLayoutEffect(() => {
    if (isTransitioning || editingActive) {
      resetCursorMotion();
    }
  }, [isTransitioning, editingActive, resetCursorMotion]);

  useLayoutEffect(() => {
    if (!editingActive) {
      editInitializedRef.current = false;
      return;
    }

    if (!editableRef.current || editInitializedRef.current) {
      return;
    }

    editInitializedRef.current = true;
    const element = editableRef.current;
    element.textContent = text;
    setValidText(text);
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
  }, [editingActive, text, setValidText]);

  const handleHeightAnimationComplete = () => {
    if (heightSequencePhaseRef.current === "resize") {
      completeHeightResize();
    }
  };

  const handleRollAnimationComplete = () => {
    if (heightSequencePhaseRef.current === "roll-in") {
      completeHeightSequence();
    }
  };

  const handleCrossfadeComplete = () => {
    if (!useTextCrossfadeRef.current) {
      return;
    }

    setUseTextCrossfade(false);
    previousFontIdRef.current = font.id;
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLParagraphElement>) => {
    if (!ENABLE_CUSTOM_TEXT || editingActive || isRollTransitioning) {
      return;
    }

    editCaretRef.current = { x: event.clientX, y: event.clientY };
    onStartEdit({ x: event.clientX, y: event.clientY });
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
        editingActive ||
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
      editingActive,
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
    fontFamily: getFontStack(editingActive ? font : displayFont),
    letterSpacing:
      editingActive || prefersReducedMotion || customActive
        ? `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`
        : letterSpacing,
  };

  const rollItemKey = `${displayFont.id}::${displayText}`;
  const crossfadeLayerKey = customActive
    ? font.id
    : `${font.id}::${text}`;
  const usePreviewParallax =
    !editingActive && !prefersReducedMotion && !customActive;

  const heightTransition =
    heightSequencePhase === "resize"
      ? PREVIEW_HEIGHT_RESIZE_TRANSITION
      : customActive || useTextCrossfade
        ? PREVIEW_CUSTOM_CROSSFADE_TRANSITION
        : { duration: 0 };

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

  const renderCrossfadeDisplay = () => (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={crossfadeLayerKey}
        className="absolute inset-x-0 top-0 flex items-center justify-center"
        style={{ minHeight: sentenceHeight }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={PREVIEW_CUSTOM_CROSSFADE_TRANSITION}
        onAnimationComplete={(definition) => {
          if (definition === "opacity" && useTextCrossfadeRef.current) {
            handleCrossfadeComplete();
          }
        }}
      >
        <PreviewTextDisplay
          displayText={text}
          previewOpacity={previewOpacity}
          textStyle={{
            fontFamily: getFontStack(font),
            letterSpacing: `${PREVIEW_CURSOR_TRACKING_BASE_PX}px`,
          }}
          onPreviewClick={handlePreviewClick}
          onStartEdit={onStartEdit}
          skipNextCaretPlacementRef={skipNextCaretPlacementRef}
        />
      </motion.div>
    </AnimatePresence>
  );

  const renderRollDisplay = () => {
    if (heightSequencePhase === "fade-out") {
      return (
        <motion.div
          className="absolute inset-x-0 top-0 flex items-center justify-center"
          style={{ height: sentenceHeight }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={PREVIEW_HEIGHT_EXIT_FADE_TRANSITION}
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
      );
    }

    if (heightSequencePhase === "roll-in") {
      return (
        <motion.div
          key={rollItemKey}
          custom={sentenceHeight}
          className="absolute inset-x-0 top-0 flex items-center justify-center"
          style={{ height: sentenceHeight }}
          variants={rollVariants}
          initial="enter"
          animate="center"
          onAnimationComplete={handleRollAnimationComplete}
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
      );
    }

    if (heightSequencePhase === "resize") {
      return null;
    }

    if (useTextCrossfade) {
      return renderCrossfadeDisplay();
    }

    return (
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
    );
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
            transition={{ height: heightTransition }}
            onAnimationComplete={(definition) => {
              if (definition === "height") {
                handleHeightAnimationComplete();
              }
            }}
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
              {editingActive ? (
                <motion.div
                  key="preview-editor"
                  className="absolute inset-x-0 top-0 flex w-full items-center justify-center"
                  style={{ minHeight: clipHeight, x: frameX, scale: frameScale }}
                  initial={{ opacity: 0.72 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.72 }}
                  transition={PREVIEW_EDIT_EXIT_TRANSITION}
                >
                  <motion.div
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
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onCompositionEnd={handleCompositionEnd}
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
                  {ENABLE_CUSTOM_TEXT && (customActive || useTextCrossfade)
                    ? renderCrossfadeDisplay()
                    : enableRoll
                      ? renderRollDisplay()
                      : (
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
                            skipNextCaretPlacementRef={
                              skipNextCaretPlacementRef
                            }
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
