import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  subscriptions: defineTable({
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    productId: v.optional(v.string()),
    priceId: v.optional(v.string()),
    planCode: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    seats: v.optional(v.number()),
    metadata: v.optional(v.any()),
    creditsBalance: v.number(),
    creditsGrantPerPeriod: v.number(),
    creditsRolloverLimit: v.number(),
    lastGrantCursor: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_polarSubscriptionId", ["polarSubscriptionId"])
    .index("by_status", ["status"]),
  credits_ledger: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")), // Optional for standalone purchases
    amount: v.number(),
    type: v.string(), // "grant" | "consume" | "adjust" | "purchase"
    reason: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    meta: v.optional(v.any()),
  })
    .index("by_subscriptionId", ["subscriptionId"])
    .index("by_userId", ["userId"])
    .index("by_idempotencyKey", ["idempotencyKey"]),
  credit_purchases: defineTable({
    userId: v.id("users"),
    amount: v.number(), // Number of credits purchased
    priceUSD: v.number(), // Price paid in USD
    polarOrderId: v.optional(v.string()),
    status: v.string(), // "pending" | "completed" | "failed"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_polarOrderId", ["polarOrderId"])
    .index("by_status", ["status"]),
  user_credits: defineTable({
    userId: v.id("users"),
    balance: v.number(), // Total available credits (from subscriptions + purchases)
    lastUpdated: v.number(),
  })
    .index("by_userId", ["userId"]),
  folders: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.optional(v.string()), // Optional color for folder
    createdAt: v.number(),
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    deletedAt: v.optional(v.number()), // Timestamp when deleted
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isDeleted", ["userId", "isDeleted"]),
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    folderId: v.optional(v.id("folders")), // Optional folder assignment
    styleGuide: v.optional(v.string()),
    sketchesData: v.any(), // JSON structure matching Redux shapes state (EntityState<Shape>)
    viewportData: v.optional(v.any()), // JSON structure for viewport state (scale, translate)
    generatedDesignData: v.optional(v.any()), // JSON structure for generated UI components
    thumbnail: v.optional(v.string()), // Base64 or URL for project thumbnail
    moodBoardImages: v.optional(v.array(v.string())), // Array of storage IDs for mood board images (max 5)
    inspirationImages: v.optional(v.array(v.string())), // Array of storage IDs for inspiration images (max 6)
    lastModified: v.number(), // Timestamp for last modification
    createdAt: v.number(), // Project creation timestamp
    isPublic: v.optional(v.boolean()), // For future sharing features
    tags: v.optional(v.array(v.string())), // For future categorization
    projectNumber: v.number(), // Auto-incrementing project number per user
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    deletedAt: v.optional(v.number()), // Timestamp when deleted
  })
    .index("by_userId", ["userId"])
    .index("by_userId_lastModified", ["userId", "lastModified"])
    .index("by_userId_projectNumber", ["userId", "projectNumber"])
    .index("by_folderId", ["folderId"])
    .index("by_public", ["isPublic"])
    .index("by_tags", ["tags"])
    .index("by_userId_isDeleted", ["userId", "isDeleted"]),
  project_counters: defineTable({
    userId: v.id("users"),
    nextProjectNumber: v.number(), // Next available project number for this user
  }).index("by_userId", ["userId"]),
  project_team_members: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.string(), // "viewer" | "editor" | "admin"
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
  })
    .index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"])
    .index("by_projectId_userId", ["projectId", "userId"]),
  affiliates: defineTable({
    userId: v.id("users"),
    affiliateCode: v.string(), // Unique code for the affiliate
    creditsPerSignup: v.number(), // Credits earned per signup (e.g., 10)
    totalCreditsEarned: v.number(), // Total credits earned
    pendingCredits: v.number(), // Credits not yet granted
    grantedCredits: v.number(), // Credits already granted to user
    totalClicks: v.number(), // Total link clicks
    totalSignups: v.number(), // Total signups via link
    totalPurchases: v.number(), // Total purchases via link
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_affiliateCode", ["affiliateCode"])
    .index("by_isActive", ["isActive"]),
  affiliate_clicks: defineTable({
    affiliateId: v.id("affiliates"),
    affiliateCode: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    clickedAt: v.number(),
  })
    .index("by_affiliateId", ["affiliateId"])
    .index("by_affiliateCode", ["affiliateCode"])
    .index("by_clickedAt", ["clickedAt"]),
  affiliate_conversions: defineTable({
    affiliateId: v.id("affiliates"),
    affiliateCode: v.string(),
    userId: v.id("users"), // User who signed up/purchased
    conversionType: v.string(), // "signup" | "purchase" | "subscription"
    amount: v.optional(v.number()), // Purchase/subscription amount in USD
    creditsEarned: v.number(), // Credits earned from this conversion
    status: v.string(), // "pending" | "granted"
    purchaseId: v.optional(v.string()), // Reference to credit_purchases or subscription
    createdAt: v.number(),
    grantedAt: v.optional(v.number()),
  })
    .index("by_affiliateId", ["affiliateId"])
    .index("by_affiliateCode", ["affiliateCode"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
});

export default schema;
