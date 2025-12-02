import { internalMutation } from "../_generated/server";

export const migrateAffiliatesToCredits = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Migrate affiliates table
    const affiliates = await ctx.db.query("affiliates").collect();
    
    console.log(`🔄 Migrating ${affiliates.length} affiliate records...`);
    
    for (const affiliate of affiliates) {
      const oldData = affiliate as any;
      
      // Check if already migrated
      if ('creditsPerSignup' in oldData) {
        console.log(`✅ Affiliate ${affiliate._id} already migrated`);
        continue;
      }
      
      // Replace with new schema (this removes old fields automatically)
      await ctx.db.replace(affiliate._id, {
        userId: oldData.userId,
        affiliateCode: oldData.affiliateCode,
        creditsPerSignup: 10, // Default to 10 credits per signup
        totalCreditsEarned: 0, // Reset earnings to 0 (was in USD, now in credits)
        pendingCredits: 0,
        grantedCredits: 0,
        totalClicks: oldData.totalClicks || 0,
        totalSignups: oldData.totalSignups || 0,
        totalPurchases: oldData.totalPurchases || 0,
        isActive: oldData.isActive,
        createdAt: oldData.createdAt,
      });
      
      console.log(`✅ Migrated affiliate ${affiliate._id}`);
    }
    
    // Migrate affiliate_conversions table
    const conversions = await ctx.db.query("affiliate_conversions").collect();
    
    console.log(`🔄 Migrating ${conversions.length} conversion records...`);
    
    for (const conversion of conversions) {
      const oldData = conversion as any;
      
      // Check if already migrated
      if ('creditsEarned' in oldData) {
        console.log(`✅ Conversion ${conversion._id} already migrated`);
        continue;
      }
      
      // Replace with new schema
      await ctx.db.replace(conversion._id, {
        affiliateId: oldData.affiliateId,
        affiliateCode: oldData.affiliateCode,
        userId: oldData.userId,
        conversionType: oldData.conversionType,
        amount: oldData.amount,
        creditsEarned: oldData.conversionType === 'signup' ? 10 : 0,
        status: oldData.status === 'paid' ? 'granted' : 'pending',
        purchaseId: oldData.purchaseId,
        createdAt: oldData.createdAt,
        grantedAt: oldData.paidAt,
      });
      
      console.log(`✅ Migrated conversion ${conversion._id}`);
    }
    
    console.log(`✅ Migration complete! Migrated ${affiliates.length} affiliates and ${conversions.length} conversions`);
    return { affiliates: affiliates.length, conversions: conversions.length };
  },
});

