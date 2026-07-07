"use client";

import { useEffect, useState } from "react";
import {
  isPreviewFontReady,
  loadGoogleFont,
} from "@/lib/loadGoogleFont";

export function useGoogleFontReady(family: string): boolean {
  const [ready, setReady] = useState(() => isPreviewFontReady(family));

  useEffect(() => {
    let cancelled = false;

    if (isPreviewFontReady(family)) {
      setReady(true);
      return;
    }

    setReady(false);

    void loadGoogleFont(family)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [family]);

  return ready;
}
