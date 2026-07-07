import {
  PREVIEW_LINE_HEIGHT,
  PREVIEW_MAX_LINES,
} from "@/lib/motionConstants";
import { placeCaretAtEnd } from "@/lib/placeCaretAtPoint";

export const PREVIEW_MAX_HEIGHT_PX = PREVIEW_LINE_HEIGHT * PREVIEW_MAX_LINES;

export type SelectionOffsets = {
  start: number;
  end: number;
};

function getOffsetInRoot(
  root: HTMLElement,
  container: Node,
  offset: number,
): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let position = 0;
  let node: Node | null = walker.nextNode();

  while (node) {
    if (node === container) {
      return position + offset;
    }

    position += node.textContent?.length ?? 0;
    node = walker.nextNode();
  }

  return position;
}

export function saveSelectionOffsets(
  root: HTMLElement,
): SelectionOffsets | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }

  return {
    start: getOffsetInRoot(root, range.startContainer, range.startOffset),
    end: getOffsetInRoot(root, range.endContainer, range.endOffset),
  };
}

export function getProposedText(
  currentText: string,
  selection: SelectionOffsets | null,
  insertText: string,
): string {
  if (!selection) {
    return currentText + insertText;
  }

  return (
    currentText.slice(0, selection.start) +
    insertText +
    currentText.slice(selection.end)
  );
}

export function exceedsRenderedLineLimit(element: HTMLElement): boolean {
  return element.scrollHeight > PREVIEW_MAX_HEIGHT_PX + 0.5;
}

export function restoreTextAtEnd(element: HTMLElement, text: string): void {
  element.textContent = text;
  placeCaretAtEnd(element);
}
