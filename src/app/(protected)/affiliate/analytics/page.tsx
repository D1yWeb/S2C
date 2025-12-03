'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function AffiliateAnalyticsPage() {
  const analytics = useQuery(api.affiliates.getAffiliateAnalytics, { days: 30 })

  if (analytics === undefined) {
    return (
      <div className="container mx-auto py-36">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto py-36 max-w-2xl">
        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader>
            <CardTitle className="text-white">No Affiliate Account</CardTitle>
            <CardDescription className="text-white/60">
              Create an affiliate account to view analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/affiliate">
              <Button>Go to Affiliate Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-36 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Analytics</h1>
          <p className="text-white/60">Last 30 days performance</p>
        </div>
        <Link href="/affiliate">
          <Button variant="outline" className="border-white/[0.12] text-white hover:bg-white/[0.08]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalClicks}</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalConversions}</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.conversionRate.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Credits Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.affiliate.totalCreditsEarned}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clicks Over Time */}
      <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
        <CardHeader>
          <CardTitle className="text-white">Clicks Over Time</CardTitle>
          <CardDescription className="text-white/60">
            Daily click activity for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversions & Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader>
            <CardTitle className="text-white">Conversions</CardTitle>
            <CardDescription className="text-white/60">
              Daily conversion activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Bar dataKey="conversions" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.12]">
          <CardHeader>
            <CardTitle className="text-white">Daily Credits Earned</CardTitle>
            <CardDescription className="text-white/60">
              Credits earned per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value: number) => `${value} credits`}
                />
                <Bar dataKey="earnings" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

