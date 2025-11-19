"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/redux/store";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const AutoFixProfileName = () => {
  const profile = useAppSelector((state) => state.profile);
  const updateName = useMutation(api.user.updateUserName);

  useEffect(() => {
    if (!profile) return;

    // Check if name is missing or is "untitled"
    if (!profile.name || profile.name === "untitled" || profile.slug === "untitled") {
      console.log("🔧 [AutoFix] Fixing missing profile name...");
      
      // Extract name from email
      const extractedName = profile.email.split("@")[0]
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");

      // Update name in database
      updateName({ name: extractedName })
        .then(() => {
          console.log("✅ [AutoFix] Profile name updated to:", extractedName);
          // Refresh the page to get updated profile
          window.location.reload();
        })
        .catch((error) => {
          console.error("❌ [AutoFix] Failed to update name:", error);
        });
    }
  }, [profile, updateName]);

  return null; // This component doesn't render anything
};

