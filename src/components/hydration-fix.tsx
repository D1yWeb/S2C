"use client";

import { useEffect } from "react";

/**
 * Component to fix hydration errors caused by browser extensions
 * that inject elements into the DOM (like translation extensions)
 */
export function HydrationFix() {
  useEffect(() => {
    // Remove elements injected by browser extensions that cause hydration errors
    const removeExtensionElements = () => {
      // Common extension IDs that cause hydration issues
      const extensionIds = [
        "extwaiokist", // Translation extensions
        "google_translate_element",
        "goog-gt-tt",
      ];

      extensionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.remove();
        }
      });

      // Also remove elements with specific extension classes
      const extensionSelectors = [
        '[id*="google_translate"]',
        '[class*="goog-te"]',
        '[id*="extwaiokist"]',
      ];

      extensionSelectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (el.parentNode) {
              el.remove();
            }
          });
        } catch {
          // Ignore selector errors
        }
      });
    };

    // Run immediately and also after a short delay
    removeExtensionElements();
    const timeout = setTimeout(removeExtensionElements, 100);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}






