import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { affiliateCode, ipAddress, userAgent, referrer, eventType } = body;

    if (!affiliateCode) {
      return NextResponse.json(
        { error: "affiliateCode is required" },
        { status: 400 }
      );
    }

    // Handle different event types
    if (eventType === 'signup') {
      // Track signup conversion
      try {
        // Get current user ID from Convex auth
        const userId = await fetchQuery(api.user.getCurrentUser);
        
        if (!userId?._id) {
          console.error("❌ No user ID found for signup tracking");
          return NextResponse.json({ ok: false, error: "User not authenticated" });
        }

        // Record the conversion
        await fetchMutation(api.affiliates.recordAffiliateConversion, {
          affiliateCode,
          userId: userId._id,
          conversionType: "signup",
        });

        console.log("✅ Affiliate signup conversion tracked:", affiliateCode);
        return NextResponse.json({ ok: true, type: 'signup' });
      } catch (error) {
        console.error("❌ Failed to track signup conversion:", error);
        return NextResponse.json(
          { error: "Failed to track signup conversion" },
          { status: 500 }
        );
      }
    } else {
      // Track click (default behavior)
      await fetchMutation(api.affiliates.trackAffiliateClick, {
        affiliateCode,
        ipAddress,
        userAgent,
        referrer,
      });

      return NextResponse.json({ ok: true, type: 'click' });
    }
  } catch (error) {
    console.error("Affiliate tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track affiliate event" },
      { status: 500 }
    );
  }
}

