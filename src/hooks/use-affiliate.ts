'use client'

import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

/**
 * Hook to handle affiliate conversions on signup and purchase
 */
export const useAffiliateConversion = () => {
  const recordConversion = useMutation(api.affiliates.recordAffiliateConversion)

  const trackSignup = async (userId: Id<'users'>) => {
    try {
      // Check if there's an affiliate ref in cookies
      const affiliateRef = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_ref='))
        ?.split('=')[1]

      if (affiliateRef) {
        await recordConversion({
          affiliateCode: affiliateRef,
          userId,
          conversionType: 'signup',
        })
        console.log('✅ Affiliate signup tracked')
      }
    } catch (error) {
      console.error('Failed to track affiliate signup:', error)
    }
  }

  const trackPurchase = async (userId: Id<'users'>, amount: number, purchaseId?: string) => {
    try {
      // Check if there's an affiliate ref in cookies
      const affiliateRef = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_ref='))
        ?.split('=')[1]

      if (affiliateRef) {
        await recordConversion({
          affiliateCode: affiliateRef,
          userId,
          conversionType: 'purchase',
          amount,
          purchaseId,
        })
        console.log('✅ Affiliate purchase tracked')
      }
    } catch (error) {
      console.error('Failed to track affiliate purchase:', error)
    }
  }

  const trackSubscription = async (userId: Id<'users'>, amount: number, subscriptionId?: string) => {
    try {
      // Check if there's an affiliate ref in cookies
      const affiliateRef = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_ref='))
        ?.split('=')[1]

      if (affiliateRef) {
        await recordConversion({
          affiliateCode: affiliateRef,
          userId,
          conversionType: 'subscription',
          amount,
          purchaseId: subscriptionId,
        })
        console.log('✅ Affiliate subscription tracked')
      }
    } catch (error) {
      console.error('Failed to track affiliate subscription:', error)
    }
  }

  return {
    trackSignup,
    trackPurchase,
    trackSubscription,
  }
}



