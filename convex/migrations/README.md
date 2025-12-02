# Database Migrations

## Migrate Affiliates to Credits System

To migrate existing affiliate data from commission-based to credits-based system:

1. Open Convex Dashboard: https://dashboard.convex.dev
2. Go to your project
3. Click on "Functions" in the sidebar
4. Find `migrations:migrateAffiliatesToCredits`
5. Click "Run" (no arguments needed)

Or run via CLI:
```bash
npx convex run migrations/migrate_affiliates_to_credits:migrateAffiliatesToCredits
```

This will:
- Convert `commissionRate` → `creditsPerSignup` (10 credits)
- Convert `totalEarnings` → `totalCreditsEarned` (reset to 0)
- Convert `pendingEarnings` → `pendingCredits` (reset to 0)
- Convert `paidEarnings` → `grantedCredits` (reset to 0)
- Convert conversion `commissionAmount` → `creditsEarned`
- Convert conversion status `paid` → `granted`



