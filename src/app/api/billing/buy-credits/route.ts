import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

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

    // Determine credits and price
    let credits: number;
    let price: number;

    if (customCredits && customPrice) {
      // Use custom credits and price from slider
      credits = customCredits;
      price = customPrice;
    } else {
      return NextResponse.json(
        { error: "customCredits and customPrice are required" },
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

    if (!process.env.POLAR_CREDITS_PRODUCT_ID) {
      console.error("POLAR_CREDITS_PRODUCT_ID is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing Polar product ID" },
        { status: 500 }
      );
    }

    // Use a single product ID for all credit purchases
    const productId = process.env.POLAR_CREDITS_PRODUCT_ID;

    const polar = new Polar({
      server: process.env.POLAR_ENV === "sandbox" ? "sandbox" : "production",
      accessToken: process.env.POLAR_ACCESS_TOKEN,
    });

    // Check for affiliate ref in cookies (from middleware)
    const affiliateRef = req.cookies.get('affiliate_ref')?.value;

    // Create checkout with ad-hoc pricing
    // See: https://polar.sh/docs/features/checkout/session#ad-hoc-prices
    const session = await polar.checkouts.create({
      products: [productId],
      amount: Math.round(price * 100), // Override price in cents (e.g., $71.99 = 7199)
      prices: {
        [productId]: [
          {
            amountType: "fixed",
            priceAmount: Math.round(price * 100),
            priceCurrency: "usd",
          }
        ]
      },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?credits=${credits}`,
      metadata: {
        userId,
        credits: credits.toString(),
        price: price.toString(),
        type: "credit_purchase",
        affiliateCode: affiliateRef || undefined,
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
      credits: credits,
      price: price,
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

// Get available credit packages (deprecated - now using dynamic pricing)
export async function GET() {
  return NextResponse.json({ 
    message: "Dynamic pricing enabled",
    minCredits: 1,
    maxCredits: 1000,
  });
}

