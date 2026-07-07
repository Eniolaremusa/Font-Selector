import { getGoogleFontsHref } from "@/lib/fontFamilies";

const PREVIEW_FONT_WEIGHT = 500;
const PREVIEW_FONT_SIZE_PX = 48;

const loadedFamilies = new Set<string>();
const loadingPromises = new Map<string, Promise<void>>();

function getFontLinkId(family: string): string {
  return `google-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
}

export function getPreviewFontSpec(family: string): string {
  return `${PREVIEW_FONT_WEIGHT} ${PREVIEW_FONT_SIZE_PX}px "${family}"`;
}

export function isPreviewFontReady(family: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.fonts.check(getPreviewFontSpec(family));
}

function ensureFontStylesheet(family: string): void {
  const id = getFontLinkId(family);

  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = getGoogleFontsHref(family);
  document.head.appendChild(link);
}

async function ensureFontFace(family: string): Promise<void> {
  const fontSpec = getPreviewFontSpec(family);

  if (!document.fonts.check(fontSpec)) {
    await document.fonts.load(fontSpec);
  }
}

export function loadGoogleFont(family: string): Promise<void> {
  if (loadedFamilies.has(family)) {
    return Promise.resolve();
  }

  const inFlight = loadingPromises.get(family);
  if (inFlight) {
    return inFlight;
  }

  const promise = Promise.resolve()
    .then(() => {
      ensureFontStylesheet(family);
      return ensureFontFace(family);
    })
    .then(() => {
      loadedFamilies.add(family);
    })
    .finally(() => {
      loadingPromises.delete(family);
    });

  loadingPromises.set(family, promise);
  return promise;
}
