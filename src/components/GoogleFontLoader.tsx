"use client";

import { useEffect } from "react";
import { loadGoogleFont } from "@/lib/loadGoogleFont";

type GoogleFontLoaderProps = {
  family: string;
};

export function GoogleFontLoader({ family }: GoogleFontLoaderProps) {
  useEffect(() => {
    void loadGoogleFont(family);
  }, [family]);

  return null;
}
