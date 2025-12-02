import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate unique affiliate code
function generateAffiliateCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const userPart = userId.slice(-6);
  const random = Math.random().toString(36).substring(2, 8);
  return `${userPart}${timestamp}${random}`.toUpperCase();
}

// Create or get affiliate account
export const getOrCreateAffiliate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has an affiliate account
    const existing = await ctx.db
      .query("affiliates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing;
    }

    // Create new affiliate account
    const affiliateCode = generateAffiliateCode(userId);
    
    const affiliateId = await ctx.db.insert("affiliates", {
      userId,
      affiliateCode,
      creditsPerSignup: 10, // 10 credits per signup
      totalCreditsEarned: 0,
      pendingCredits: 0,
      grantedCredits: 0,
      totalClicks: 0,
      totalSignups: 0,
      totalPurchases: 0,
      isActive: true,
      createdAt: Date.now(),
    });

    return await ctx.db.get(affiliateId);
  },
});

// Reset affiliate account (for migration from old schema)
export const resetAffiliate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find and delete old affiliate
    const oldAffiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (oldAffiliate) {
      await ctx.db.delete(oldAffiliate._id);
      console.log("🗑️ Deleted old affiliate record");
    }

    // Create new affiliate with correct schema
    const affiliateCode = generateAffiliateCode(userId);
    const affiliateId = await ctx.db.insert("affiliates", {
      userId,
      affiliateCode,
      creditsPerSignup: 10,
      totalCreditsEarned: 0,
      pendingCredits: 0,
      grantedCredits: 0,
      totalClicks: 0,
      totalSignups: 0,
      totalPurchases: 0,
      isActive: true,
      createdAt: Date.now(),
    });

    console.log("✅ Created new affiliate record with credits system");
    return await ctx.db.get(affiliateId);
  },
});

// Get affiliate stats
export const getAffiliateStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!affiliate) return null;

    // Get recent clicks (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentClicks = await ctx.db
      .query("affiliate_clicks")
      .withIndex("by_affiliateId", (q) => q.eq("affiliateId", affiliate._id))
      .filter((q) => q.gte(q.field("clickedAt"), thirtyDaysAgo))
      .collect();

    // Get conversions
    const conversions = await ctx.db
      .query("affiliate_conversions")
      .withIndex("by_affiliateId", (q) => q.eq("affiliateId", affiliate._id))
      .collect();

    const pendingConversions = conversions.filter((c) => c.status === "pending");
    const grantedConversions = conversions.filter((c) => c.status === "granted");

    return {
      ...affiliate,
      recentClicksCount: recentClicks.length,
      pendingConversionsCount: pendingConversions.length,
      grantedConversionsCount: grantedConversions.length,
    };
  },
});

// Track affiliate click
export const trackAffiliateClick = mutation({
  args: {
    affiliateCode: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, { affiliateCode, ipAddress, userAgent, referrer }) => {
    // Find affiliate by code
    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_affiliateCode", (q) => q.eq("affiliateCode", affiliateCode))
      .first();

    if (!affiliate || !affiliate.isActive) {
      return { ok: false, error: "Invalid or inactive affiliate code" };
    }

    // Record click
    await ctx.db.insert("affiliate_clicks", {
      affiliateId: affiliate._id,
      affiliateCode,
      ipAddress,
      userAgent,
      referrer,
      clickedAt: Date.now(),
    });

    // Update total clicks
    await ctx.db.patch(affiliate._id, {
      totalClicks: affiliate.totalClicks + 1,
    });

    return { ok: true, affiliateId: affiliate._id };
  },
});

// Record affiliate conversion (signup or purchase)
export const recordAffiliateConversion = mutation({
  args: {
    affiliateCode: v.string(),
    userId: v.id("users"),
    conversionType: v.string(), // "signup" | "purchase" | "subscription"
    amount: v.optional(v.number()),
    purchaseId: v.optional(v.string()),
  },
  handler: async (ctx, { affiliateCode, userId, conversionType, amount, purchaseId }) => {
    // Find affiliate by code
    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_affiliateCode", (q) => q.eq("affiliateCode", affiliateCode))
      .first();

    if (!affiliate || !affiliate.isActive) {
      return { ok: false, error: "Invalid or inactive affiliate code" };
    }

    // Don't allow self-referral
    if (affiliate.userId === userId) {
      return { ok: false, error: "Self-referral not allowed" };
    }

    // Calculate credits earned (10 credits per signup)
    const creditsEarned = conversionType === "signup" ? affiliate.creditsPerSignup : 0;

    // Record conversion
    await ctx.db.insert("affiliate_conversions", {
      affiliateId: affiliate._id,
      affiliateCode,
      userId,
      conversionType,
      amount,
      creditsEarned,
      status: "pending", // Will be granted automatically
      purchaseId,
      createdAt: Date.now(),
    });

    // Update affiliate stats
    const updates: any = {
      totalCreditsEarned: affiliate.totalCreditsEarned + creditsEarned,
      pendingCredits: affiliate.pendingCredits + creditsEarned,
    };

    if (conversionType === "signup") {
      updates.totalSignups = affiliate.totalSignups + 1;
    } else if (conversionType === "purchase" || conversionType === "subscription") {
      updates.totalPurchases = affiliate.totalPurchases + 1;
    }

    await ctx.db.patch(affiliate._id, updates);

    // Auto-grant credits for signups
    if (conversionType === "signup" && creditsEarned > 0) {
      try {
        // Grant credits to the affiliate user
        const userCredits = await ctx.db
          .query("user_credits")
          .withIndex("by_userId", (q) => q.eq("userId", affiliate.userId))
          .first();

        if (userCredits) {
          await ctx.db.patch(userCredits._id, {
            balance: userCredits.balance + creditsEarned,
            lastUpdated: Date.now(),
          });
        } else {
          await ctx.db.insert("user_credits", {
            userId: affiliate.userId,
            balance: creditsEarned,
            lastUpdated: Date.now(),
          });
        }

        // Update conversion status to granted
        const conversion = await ctx.db
          .query("affiliate_conversions")
          .withIndex("by_affiliateId", (q) => q.eq("affiliateId", affiliate._id))
          .order("desc")
          .first();
        
        if (conversion) {
          await ctx.db.patch(conversion._id, {
            status: "granted",
            grantedAt: Date.now(),
          });
        }

        // Update affiliate stats
        await ctx.db.patch(affiliate._id, {
          pendingCredits: affiliate.pendingCredits,
          grantedCredits: affiliate.grantedCredits + creditsEarned,
        });
      } catch (error) {
        console.error("Failed to auto-grant credits:", error);
      }
    }

    return { ok: true, creditsEarned };
  },
});

// Get affiliate conversions
export const getAffiliateConversions = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!affiliate) return [];

    let conversionsQuery = ctx.db
      .query("affiliate_conversions")
      .withIndex("by_affiliateId", (q) => q.eq("affiliateId", affiliate._id))
      .order("desc");

    const conversions = await conversionsQuery.collect();

    // Filter by status if provided
    const filtered = status
      ? conversions.filter((c) => c.status === status)
      : conversions;

    // Get user details for each conversion
    const conversionsWithUsers = await Promise.all(
      filtered.slice(0, limit).map(async (conversion) => {
        const user = await ctx.db.get(conversion.userId);
        return {
          ...conversion,
          userEmail: user?.email || "Unknown",
          userName: user?.name || user?.email?.split("@")[0] || "User",
        };
      })
    );

    return conversionsWithUsers;
  },
});

// Get affiliate analytics (time-series data)
export const getAffiliateAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, { days = 30 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!affiliate) return null;

    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get clicks over time
    const clicks = await ctx.db
      .query("affiliate_clicks")
      .withIndex("by_affiliateId", (q) => q.eq("affiliateId", affiliate._id))
      .filter((q) => q.gte(q.field("clickedAt"), startDate))
      .collect();

    // Get conversions over time
    const conversions = await ctx.db
      .query("affiliate_conversions")
      .withIndex("by_affiliateId", (q) => q.eq("affiliateId", affiliate._id))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .collect();

    // Group by day
    const dailyStats: Record<string, { clicks: number; conversions: number; earnings: number }> = {};

    clicks.forEach((click) => {
      const day = new Date(click.clickedAt).toISOString().split("T")[0];
      if (!dailyStats[day]) dailyStats[day] = { clicks: 0, conversions: 0, earnings: 0 };
      dailyStats[day].clicks++;
    });

    conversions.forEach((conversion) => {
      const day = new Date(conversion.createdAt).toISOString().split("T")[0];
      if (!dailyStats[day]) dailyStats[day] = { clicks: 0, conversions: 0, earnings: 0 };
      dailyStats[day].conversions++;
      dailyStats[day].earnings += conversion.creditsEarned;
    });

    // Convert to array and sort by date
    const timeSeriesData = Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      affiliate,
      timeSeriesData,
      totalClicks: clicks.length,
      totalConversions: conversions.length,
      conversionRate: clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0,
    };
  },
});

// Update affiliate settings
export const updateAffiliateSettings = mutation({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { isActive }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const affiliate = await ctx.db
      .query("affiliates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!affiliate) throw new Error("Affiliate account not found");

    const updates: any = {};
    if (isActive !== undefined) updates.isActive = isActive;

    await ctx.db.patch(affiliate._id, updates);

    return { success: true };
  },
});

