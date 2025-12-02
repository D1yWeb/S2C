import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    
    // Auto-fix missing name by extracting from email
    if (user && (!user.name || user.name.trim() === "") && user.email) {
      const extractedName = user.email.split("@")[0]
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
      
      console.log("⚠️ [User] Missing name, extracted from email:", extractedName);
      
      // Note: We can't modify in a query, but we log it
      // The client-side normalization will handle it
    }
    
    return user;
  },
});

export const updateUserName = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, { name: name.trim() });
    
    console.log("✅ [User] Name updated:", name);
    
    return { success: true, name: name.trim() };
  },
});

//this is for inngest if metadata is missing
export const getUserIdByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    return user?._id ?? null;
  },
});

// Generate upload URL for profile image
export const generateProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Update user profile image
export const updateProfileImage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the URL for the uploaded image
    const imageUrl = await ctx.storage.getUrl(storageId);
    
    if (!imageUrl) {
      throw new Error("Failed to get image URL");
    }

    // Update user with new image
    await ctx.db.patch(userId, { image: imageUrl });
    
    console.log("✅ [User] Profile image updated");
    
    return { success: true, imageUrl };
  },
});

// Get profile image URL
export const getProfileImageUrl = query({
  args: {
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { storageId }) => {
    if (!storageId) return null;
    return await ctx.storage.getUrl(storageId);
  },
});

// Remove profile image
export const removeProfileImage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Remove image from user profile
    await ctx.db.patch(userId, { image: undefined });
    
    console.log("✅ [User] Profile image removed");
    
    return { success: true };
  },
});
