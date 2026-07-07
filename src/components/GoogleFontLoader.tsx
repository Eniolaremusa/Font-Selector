"use client";

import { useEffect } from "react";
import { getGoogleFontsHref } from "@/lib/fontFamilies";

type GoogleFontLoaderProps = {
  family: string;
};

export function GoogleFontLoader({ family }: GoogleFontLoaderProps) {
  useEffect(() => {
    const id = `google-font-${family.replace(/\s+/g, "-").toLowerCase()}`;

    if (document.getElementById(id)) {
      return;
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = getGoogleFontsHref(family);
    document.head.appendChild(link);
  }, [family]);

  return null;
}
