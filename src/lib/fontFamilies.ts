export const fontFamilyById: Record<string, string> = {
  "jetbrains-mono": "JetBrains Mono",
  "ibm-plex-sans": "IBM Plex Sans",
  inter: "Inter",
  roboto: "Roboto",
  archivo: "Archivo",
  oswald: "Oswald",
  manrope: "Manrope",
  "dm-sans": "DM Sans",
  "source-sans-3": "Source Sans 3",
  "plus-jakarta-sans": "Plus Jakarta Sans",
  outfit: "Outfit",
  "space-grotesk": "Space Grotesk",
  "bricolage-grotesque": "Bricolage Grotesque",
  bitter: "Bitter",
  "roboto-slab": "Roboto Slab",
  "zilla-slab": "Zilla Slab",
  lora: "Lora",
  "libre-baskerville": "Libre Baskerville",
  spectral: "Spectral",
  "cormorant-garamond": "Cormorant Garamond",
  "instrument-serif": "Instrument Serif",
  "playfair-display": "Playfair Display",
  fraunces: "Fraunces",
  caveat: "Caveat",
  "barlow-semi-condensed": "Barlow Semi Condensed",
  "archivo-narrow": "Archivo Narrow",
  karla: "Karla",
  "work-sans": "Work Sans",
  sora: "Sora",
  alegreya: "Alegreya",
  "source-serif-4": "Source Serif 4",
  "crimson-pro": "Crimson Pro",
};

export function getFontFamily(id: string): string {
  return fontFamilyById[id] ?? "Inter";
}

export function getGoogleFontsHref(family: string): string {
  const query = family.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${query}:wght@400;500&display=swap`;
}
