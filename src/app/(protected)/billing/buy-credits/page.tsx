"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

const CREDIT_PACKAGES = [
  {
    id: "small",
    credits: 10,
    price: 9.99,
    name: "Starter",
    description: "Perfect for trying out premium features",
    popular: false,
  },
  {
    id: "medium",
    credits: 25,
    price: 19.99,
    name: "Creator",
    description: "Great for regular users",
    popular: true,
    savings: "Save 20%",
  },
  {
    id: "large",
    credits: 50,
    price: 34.99,
    name: "Professional",
    description: "Best value for power users",
    popular: false,
    savings: "Save 30%",
  },
  {
    id: "xlarge",
    credits: 100,
    price: 59.99,
    name: "Enterprise",
    description: "Maximum credits for teams",
    popular: false,
    savings: "Save 40%",
  },
];

const Page = () => {
  const user = useAppSelector((state) => state.profile);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!user?.id) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    setLoading(packageId);

    try {
      const response = await fetch("/api/billing/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          packageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If credits not available yet, show info message
        if (response.status === 503) {
          toast.info(data.error || "Credit purchases coming soon!");
          return;
        }
        throw new Error(data.error || "Failed to create checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start purchase"
      );
    } finally {
      setLoading(null);
    }
  };

  const getPricePerCredit = (price: number, credits: number) => {
    return (price / credits).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/billing">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Billing
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary/60 rounded-full mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Buy Credits
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Purchase credits one-time with no commitment. Use them whenever you
            need for AI-powered design features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`backdrop-blur-xl bg-white/[0.08] border saturate-150 shadow-xl transition-all hover:scale-105 ${
                pkg.popular
                  ? "border-primary/50 ring-2 ring-primary/20"
                  : "border-white/[0.12]"
              }`}
            >
              <CardHeader className="text-center pb-4">
                {pkg.popular && (
                  <div className="flex items-center justify-center mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-xs font-medium rounded-full"
                    >
                      Most Popular
                    </Badge>
                  </div>
                )}
                {pkg.savings && !pkg.popular && (
                  <div className="flex items-center justify-center mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 text-xs font-medium rounded-full"
                    >
                      {pkg.savings}
                    </Badge>
                  </div>
                )}
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {pkg.name}
                </CardTitle>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    ${pkg.price}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-semibold text-primary">
                    {pkg.credits}
                  </span>
                  <span className="text-muted-foreground text-sm">credits</span>
                </div>
                <CardDescription className="text-muted-foreground text-xs mt-2">
                  ${getPricePerCredit(pkg.price, pkg.credits)} per credit
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center px-6 py-4">
                <p className="text-muted-foreground text-sm">
                  {pkg.description}
                </p>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-4 px-6 pb-6">
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading === pkg.id}
                  className={`w-full rounded-full ${
                    pkg.popular
                      ? "bg-primary hover:bg-primary/90"
                      : "backdrop-blur-xl bg-white/[0.12] border border-white/[0.16] hover:bg-white/[0.16]"
                  }`}
                >
                  {loading === pkg.id ? (
                    "Processing..."
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Purchase Credits
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features section */}
        <div className="max-w-3xl mx-auto">
          <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-center text-xl">
                What You Can Do With Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      AI Code Generation
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Transform sketches into production code
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Style Guide Generation
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Create design systems from mood boards
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Asset Exports
                    </p>
                    <p className="text-muted-foreground text-xs">
                      High-quality exports in multiple formats
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Advanced Processing
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Complex design operations and workflows
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.08]">
                <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Never Expires</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>No Subscription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Instant Access</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;

