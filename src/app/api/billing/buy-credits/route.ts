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
    const { userId, packageId } = body;

    if (!userId || !packageId) {
      return NextResponse.json(
        { error: "userId and packageId are required" },
        { status: 400 }
      );
    }

    const creditPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
    
    if (!creditPackage) {
      return NextResponse.json(
        { error: "Invalid package ID" },
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
    // You'll need to create products in Polar for each credit package
    const productIdMap: Record<string, string> = {
      small: process.env.POLAR_CREDITS_10 || "",
      medium: process.env.POLAR_CREDITS_25 || "",
      large: process.env.POLAR_CREDITS_50 || "",
      xlarge: process.env.POLAR_CREDITS_100 || "",
    };

    const productId = productIdMap[packageId];

    if (!productId) {
      console.error(`Product ID not configured for package: ${packageId}`);
      return NextResponse.json(
        { 
          error: "Credit purchase not available yet. Please use subscription for now.",
          info: "Configure POLAR_CREDITS_* environment variables"
        },
        { status: 503 }
      );
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
        packageId,
        type: "credit_purchase",
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

