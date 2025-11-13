# Credit Purchases Setup Guide

This guide explains how to set up one-time credit purchases without requiring a subscription.

## Overview

Users can now purchase credits in 4 different packages:
- **10 Credits** - $9.99
- **25 Credits** - $19.99 (20% savings)
- **50 Credits** - $34.99 (30% savings)
- **100 Credits** - $59.99 (40% savings)

## Database Structure

### New Tables

1. **credit_purchases** - Tracks individual credit purchases
   - userId, amount, priceUSD, polarOrderId, status, timestamps

2. **user_credits** - Stores user's credit balance from purchases
   - userId, balance, lastUpdated

3. **credits_ledger** - Updated to support purchases (subscriptionId is now optional)
   - Added type: "purchase" for standalone credit purchases

## Setup Instructions

### 1. Create Products in Polar

You need to create 4 one-time payment products in Polar:

1. Go to your Polar dashboard
2. Create a new **Product** (not subscription) for each package:
   - Product 1: "10 Credits" - $9.99
   - Product 2: "25 Credits" - $19.99
   - Product 3: "50 Credits" - $34.99
   - Product 4: "100 Credits" - $59.99

3. For each product, set:
   - Type: **One-time purchase** (not subscription)
   - Price: As listed above
   - Description: Credits for AI-powered design features

### 2. Configure Environment Variables

Add these to your `.env.local`:

```env
# Credit Purchase Product IDs from Polar
POLAR_CREDITS_10=prod_xxxxxxxxxxxxx
POLAR_CREDITS_25=prod_xxxxxxxxxxxxx
POLAR_CREDITS_50=prod_xxxxxxxxxxxxx
POLAR_CREDITS_100=prod_xxxxxxxxxxxxx
```

### 3. Handle Webhooks

The system uses Polar webhooks to confirm purchases. You need to update your webhook handler to process credit purchases:

1. In your Polar dashboard, ensure webhooks are configured to send to `/api/billing/webhook`
2. The webhook handler should detect `type: "credit_purchase"` in metadata
3. When a purchase is confirmed, call `api.credits.purchaseCredits` mutation

Example webhook metadata:
```json
{
  "userId": "user_id_here",
  "credits": "25",
  "packageId": "medium",
  "type": "credit_purchase"
}
```

## How It Works

### Credit Balance System

Credits are now managed from two sources:

1. **Subscription Credits** - Monthly recurring credits from Standard Plan
2. **Purchased Credits** - One-time purchases that never expire

The system automatically:
- Combines both balances when displaying total credits
- Consumes subscription credits first (as they expire monthly)
- Then uses purchased credits (which never expire)

### API Endpoints

#### Purchase Credits
```
POST /api/billing/buy-credits
Body: { userId: string, packageId: "small" | "medium" | "large" | "xlarge" }
Returns: { url: string, credits: number, price: number }
```

#### Get Credit Packages
```
GET /api/billing/buy-credits
Returns: { packages: {...} }
```

### Convex Functions

#### Purchase Credits
```typescript
api.credits.purchaseCredits({
  userId: Id<"users">,
  amount: number,
  priceUSD: number,
  polarOrderId?: string
})
```

#### Get Balance
```typescript
api.credits.getCreditsBalance({
  userId: Id<"users">
})
// Returns total balance (subscription + purchased)
```

#### Consume Credits
```typescript
api.credits.consumeCredits({
  userId: Id<"users">,
  amount: number,
  reason?: string,
  idempotencyKey?: string
})
// Automatically uses subscription credits first, then purchased
```

## User Flow

1. User visits `/billing` page
2. Clicks "Buy Credits Instead" button
3. Redirected to `/billing/buy-credits`
4. Selects a credit package
5. Redirected to Polar checkout
6. Completes payment
7. Webhook confirms purchase
8. Credits are added to user's balance
9. User can use credits immediately

## Testing

### Test Mode

1. Set `POLAR_ENV=sandbox` in your environment
2. Use Polar sandbox products
3. Test purchases with Polar test cards

### Verification

After a purchase:
1. Check `credit_purchases` table for new record
2. Check `user_credits` table for updated balance
3. Check `credits_ledger` for purchase entry
4. Verify navbar shows correct credit balance

## Benefits

- **No Commitment** - Users can buy credits without subscribing
- **Never Expires** - Purchased credits don't expire monthly
- **Flexible** - Users can buy as needed
- **Combined Balance** - Works seamlessly with subscription credits
- **Smart Consumption** - Uses subscription credits first (since they expire)

## Migration Notes

### Existing Users

- Existing subscriptions continue to work as before
- Their subscription credits are managed separately
- They can also purchase additional credits if needed
- Total balance = subscription balance + purchased balance

### New Users

- Can start with just purchasing credits
- No subscription required
- Credits never expire
- Can subscribe later if they want monthly recurring credits

## Support

If users have issues:
1. Check Polar dashboard for payment status
2. Verify webhook was received and processed
3. Check `credit_purchases` table for purchase record
4. Check `credits_ledger` for transaction history
5. Manually grant credits if needed using `api.credits.purchaseCredits`

## Security

- All purchases go through Polar's secure payment system
- Webhook signatures verified (implement in webhook handler)
- Idempotency keys prevent duplicate credits
- All transactions logged in `credits_ledger`

## Future Enhancements

Potential features to add:
- Bulk discounts for larger packages
- Gift credits to other users
- Credit expiration policies (optional)
- Usage analytics and reports
- Automatic top-up when balance is low
- Credit transfer between users

