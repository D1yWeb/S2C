import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

// Credit packages
const CREDIT_PACKAGES = {
  small: { credits: 10, price: 9.99, name: "10 Credits" },
  medium: { credits: 25, price: 19.99, name: "25 Credits" },
  large: { credits: 50, price: 34.99, name: "50 Credits" },
  xlarge: { credits: 100, price: 59.99, name: "100 Credits" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, packageId, customCredits, customPrice } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Determine which package to use
    let creditPackage;
    if (customCredits && customPrice) {
      // Use custom credits - find the closest package
      const credits = customCredits;
      if (credits <= 10) {
        creditPackage = CREDIT_PACKAGES.small;
      } else if (credits <= 25) {
        creditPackage = CREDIT_PACKAGES.medium;
      } else if (credits <= 50) {
        creditPackage = CREDIT_PACKAGES.large;
      } else {
        creditPackage = CREDIT_PACKAGES.xlarge;
      }
      // Override with custom values
      creditPackage = {
        ...creditPackage,
        credits: credits,
        price: customPrice,
      };
    } else if (packageId) {
      creditPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
      
      if (!creditPackage) {
        return NextResponse.json(
          { error: "Invalid package ID" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "packageId or customCredits is required" },
        { status: 400 }
      );
    }

    // Check for required environment variables
    if (!process.env.POLAR_ACCESS_TOKEN) {
      console.error("POLAR_ACCESS_TOKEN is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing Polar credentials" },
        { status: 500 }
      );
    }

    // For credit purchases, we need a product ID for one-time payments
    // Use environment variables if configured, otherwise use the default product ID
    const DEFAULT_POLAR_CREDITS_PRODUCT_ID = "ed891fd7-4d39-4eae-be85-561852877207";
    
    const productIdMap: Record<string, string> = {
      small: process.env.POLAR_CREDITS_10 || DEFAULT_POLAR_CREDITS_PRODUCT_ID,
      medium: process.env.POLAR_CREDITS_25 || DEFAULT_POLAR_CREDITS_PRODUCT_ID,
      large: process.env.POLAR_CREDITS_50 || DEFAULT_POLAR_CREDITS_PRODUCT_ID,
      xlarge: process.env.POLAR_CREDITS_100 || DEFAULT_POLAR_CREDITS_PRODUCT_ID,
    };

    // Determine which product ID to use based on credits amount
    let productId: string;
    if (creditPackage.credits <= 10) {
      productId = productIdMap.small;
    } else if (creditPackage.credits <= 25) {
      productId = productIdMap.medium;
    } else if (creditPackage.credits <= 50) {
      productId = productIdMap.large;
    } else {
      productId = productIdMap.xlarge;
    }

    const polar = new Polar({
      server: process.env.POLAR_ENV === "sandbox" ? "sandbox" : "production",
      accessToken: process.env.POLAR_ACCESS_TOKEN,
    });

    const session = await polar.checkouts.create({
      products: [productId],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?credits=${creditPackage.credits}`,
      metadata: {
        userId,
        credits: creditPackage.credits.toString(),
        price: creditPackage.price.toString(),
        packageId: packageId || "custom",
        type: "credit_purchase",
        isCustom: customCredits ? "true" : "false",
      },
    });

    if (!session.url) {
      console.error("Polar checkout created but no URL returned");
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      url: session.url,
      credits: creditPackage.credits,
      price: creditPackage.price,
    });
  } catch (error) {
    console.error("Buy credits error details:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = {
      error: "Failed to create credit purchase",
      message: errorMessage,
      details: error,
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}

// Get available credit packages
export async function GET() {
  return NextResponse.json({ packages: CREDIT_PACKAGES });
}

