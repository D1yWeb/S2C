'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Copy, TrendingUp, Users, DollarSign, MousePointerClick, Link as LinkIcon, BarChart3, ArrowLeft, Coins } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useAppSelector } from '@/redux/store'

export default function AffiliatePage() {
  const me = useAppSelector((state) => state.profile)
  const [copied, setCopied] = useState(false)
  const createAffiliate = useMutation(api.affiliates.getOrCreateAffiliate)
  const affiliateStats = useQuery(api.affiliates.getAffiliateStats)
  const conversions = useQuery(api.affiliates.getAffiliateConversions, { limit: 10 })

  const handleCreateAffiliate = async () => {
    try {
      await createAffiliate()
      toast.success('Affiliate account created!')
    } catch (error) {
      toast.error('Failed to create affiliate account')
    }
  }

  const handleCopyLink = () => {
    if (!affiliateStats?.affiliateCode) return
    
    const affiliateLink = `${window.location.origin}?ref=${affiliateStats.affiliateCode}`
    navigator.clipboard.writeText(affiliateLink)
    setCopied(true)
    toast.success('Affiliate link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (affiliateStats === undefined) {
    return (
      <div className="container mx-auto py-36">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!affiliateStats) {
    return (
      <div className="container mx-auto py-36 max-w-2xl">
        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Become an Affiliate</CardTitle>
            <CardDescription className="text-white/70">
              Earn 20% commission on every sale you refer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Get Your Unique Link</h3>
                  <p className="text-white/60 text-sm">
                    Receive a personalized affiliate link to share
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Share with Your Audience</h3>
                  <p className="text-white/60 text-sm">
                    Promote S2C to your network and followers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Earn 10 Credits per Signup</h3>
                  <p className="text-white/60 text-sm">
                    Get 10 credits for every user who signs up through your link
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCreateAffiliate}
              className="w-full"
            >
              Create Affiliate Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const affiliateLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${affiliateStats.affiliateCode}`
  const conversionRate = affiliateStats.totalClicks > 0 
    ? ((affiliateStats.totalPurchases / affiliateStats.totalClicks) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="container mx-auto py-36 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Affiliate Dashboard</h1>
          <p className="text-white/60">Track your referrals and earn credits</p>
        </div>
        <Link href={`/dashboard/${me?.slug || me?.name}`}>
          <Button variant="outline" className="border-white/[0.12] text-white hover:bg-white/[0.08]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{affiliateStats.totalClicks}</div>
            <p className="text-xs text-white/40 mt-1">
              {affiliateStats.recentClicksCount} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{affiliateStats.totalSignups}</div>
            <p className="text-xs text-white/40 mt-1">
              {affiliateStats.totalPurchases} purchases
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{conversionRate}%</div>
            <p className="text-xs text-white/40 mt-1">
              {affiliateStats.totalPurchases} / {affiliateStats.totalClicks} clicks
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Credits Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {affiliateStats.totalCreditsEarned}
            </div>
            <p className="text-xs text-white/40 mt-1">
              {affiliateStats.pendingCredits} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Link */}
      <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
        <CardHeader>
          <CardTitle className="text-white">Your Affiliate Link</CardTitle>
          <CardDescription className="text-white/60">
            Share this link to earn {affiliateStats.creditsPerSignup} credits for each signup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={affiliateLink}
              readOnly
              className="bg-white/[0.08] border-white/[0.12] text-white"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-white/[0.12] text-white hover:bg-white/[0.08] flex-shrink-0"
            >
              {copied ? 'Copied!' : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="font-mono bg-white/[0.08] px-2 py-1 rounded">
              Code: {affiliateStats.affiliateCode}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/affiliate/analytics" className="flex-1">
          <Button variant="outline" className="w-full border-white/[0.12] text-white hover:bg-white/[0.08]">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Recent Conversions */}
      <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
        <CardHeader>
          <CardTitle className="text-white">Recent Conversions</CardTitle>
          <CardDescription className="text-white/60">
            Latest referrals and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!conversions || conversions.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversions yet</p>
              <p className="text-xs mt-1">Share your link to start earning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversions.map((conversion) => (
                <div
                  key={conversion._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.05] border border-white/[0.08]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {conversion.userName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conversion.status === 'granted' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {conversion.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      {conversion.conversionType} • {new Date(conversion.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      +{conversion.creditsEarned} credits
                    </div>
                    <p className="text-xs text-white/40">
                      {conversion.conversionType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

