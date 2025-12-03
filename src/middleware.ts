import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Track affiliate clicks via middleware
async function trackAffiliateClick(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  
  if (ref) {
    // Store affiliate code in cookie for 30 days
    const response = NextResponse.next();
    response.cookies.set("affiliate_ref", ref, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
    });

    // Track the click (fire and forget)
    try {
      const trackingUrl = `${request.nextUrl.origin}/api/affiliate/track`;
      fetch(trackingUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateCode: ref,
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          referrer: request.headers.get("referer") || request.nextUrl.href,
        }),
      }).catch((error) => {
        console.error("Failed to track affiliate click:", error);
      });
    } catch (error) {
      console.error("Error tracking affiliate:", error);
    }

    return response;
  }

  return NextResponse.next();
}

export default convexAuthNextjsMiddleware(async (request) => {
  // Track affiliate clicks before auth
  const affiliateResponse = await trackAffiliateClick(request);
  return affiliateResponse;
});

export const config = {
  // Match all paths except static files
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
