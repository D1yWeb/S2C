"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/redux/store";
import { toast } from "sonner";
import { Loader2, Zap, Copy, ExternalLink, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

// Pricing calculation based on existing packages
const calculatePrice = (credits: number): number => {
  if (credits <= 0) return 0;
  
  // Base price per credit (from small package: $9.99 / 10 = $0.999)
  const basePricePerCredit = 0.999;
  
  // Volume discounts
  if (credits >= 100) {
    // Large volume discount (from xlarge: $59.99 / 100 = $0.5999)
    return Math.round(credits * 0.5999 * 100) / 100;
  } else if (credits >= 50) {
    // Medium volume discount (from large: $34.99 / 50 = $0.6998)
    return Math.round(credits * 0.6998 * 100) / 100;
  } else if (credits >= 25) {
    // Small volume discount (from medium: $19.99 / 25 = $0.7996)
    return Math.round(credits * 0.7996 * 100) / 100;
  } else {
    // Standard price
    return Math.round(credits * basePricePerCredit * 100) / 100;
  }
};

interface BuyCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BuyCreditsDialog: React.FC<BuyCreditsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const user = useAppSelector((state) => state.profile);
  const [credits, setCredits] = useState<number[]>([10]);
  const [inputValue, setInputValue] = useState("10");
  const [loading, setLoading] = useState(false);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);
  
  // Get affiliate stats
  const affiliateStats = useQuery(api.affiliates.getAffiliateStats);
  const createAffiliate = useMutation(api.affiliates.getOrCreateAffiliate);

  const creditsValue = credits[0];
  const price = calculatePrice(creditsValue);
  const pricePerCredit = creditsValue > 0 ? (price / creditsValue).toFixed(3) : "0";

  const handleSliderChange = (value: number[]) => {
    setCredits(value);
    setInputValue(value[0].toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 1000) {
      setCredits([numValue]);
    }
  };

  const handlePurchase = async () => {
    if (!user?.id) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    if (creditsValue < 1) {
      toast.error("Please select at least 1 credit");
      return;
    }

    setLoading(true);

    try {
      // Always send custom credits and price
      const response = await fetch("/api/billing/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          customCredits: creditsValue,
          customPrice: price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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
      setLoading(false);
    }
  };

  const handleCreateAffiliate = async () => {
    try {
      await createAffiliate();
      toast.success("Affiliate account created!");
    } catch (error) {
      toast.error("Failed to create affiliate account");
    }
  };

  const handleCopyAffiliateLink = () => {
    if (!affiliateStats?.affiliateCode) return;
    
    const affiliateLink = `${window.location.origin}?ref=${affiliateStats.affiliateCode}`;
    navigator.clipboard.writeText(affiliateLink);
    setCopiedAffiliate(true);
    toast.success("Affiliate link copied!");
    setTimeout(() => setCopiedAffiliate(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-black/90 border border-white/[0.12] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Buy Credits</DialogTitle>
          <DialogDescription className="text-white/60">
            Choose how many credits you want to purchase. Drag the slider or type
            the amount directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">
                Credits
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={inputValue}
                  onChange={handleInputChange}
                  className="w-20 h-8 text-center bg-white/[0.08] border-white/[0.12] text-white"
                />
                <span className="text-sm text-white/60">credits</span>
              </div>
            </div>
            <Slider
              value={credits}
              onValueChange={handleSliderChange}
              min={1}
              max={1000}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>1</span>
              <span>1000</span>
            </div>
          </div>

          {/* Price Display */}
          <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Total Price</span>
              <span className="text-2xl font-bold text-white">${price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Price per credit</span>
              <span className="text-sm text-white/60">${pricePerCredit}</span>
            </div>
          </div>

          {/* Affiliate Section */}
          {affiliateStats === undefined ? (
            // Loading state
            <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-white/40" />
              </div>
            </div>
          ) : affiliateStats ? (
            // Has affiliate account
            <div className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">
                    Earn Free Credits!
                  </h3>
                  <p className="text-xs text-white/60 mb-3">
                    Get 10 credits for every friend who signs up with your link
                  </p>
                  
                  <div className="flex gap-2">
                    <Input
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${affiliateStats.affiliateCode}`}
                      readOnly
                      className="flex-1 h-8 text-xs bg-white/[0.08] border-white/[0.12] text-white"
                    />
                    <Button
                      onClick={handleCopyAffiliateLink}
                      size="sm"
                      variant="outline"
                      className="h-8 border-white/[0.12] text-white hover:bg-white/[0.08] flex-shrink-0"
                    >
                      {copiedAffiliate ? (
                        "Copied!"
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.08]">
                    <div className="text-xs text-white/60">
                      <span className="text-amber-400 font-medium">{affiliateStats.totalCreditsEarned}</span> credits earned
                    </div>
                    <Link href="/affiliate">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-amber-400 hover:text-amber-300 hover:bg-white/[0.05] p-0 px-2"
                      >
                        View Dashboard
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // No affiliate account - show activation
            <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">
                    Become an Affiliate
                  </h3>
                  <p className="text-xs text-white/60 mb-3">
                    Earn 10 credits for every friend who signs up with your referral link
                  </p>
                  <Button
                    onClick={handleCreateAffiliate}
                    size="sm"
                    variant="outline"
                    className="w-full h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Activate Affiliate Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.12] text-white hover:bg-white/[0.08]"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading || creditsValue < 1}
            variant="outline"
            className="border-white/[0.12] text-white hover:bg-white/[0.08] bg-white/[0.05]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Buy Credits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

