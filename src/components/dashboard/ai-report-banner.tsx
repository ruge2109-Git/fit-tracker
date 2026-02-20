'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export function AiReportBanner() {
  const t = useTranslations('dashboard.aiReport')
  const [report, setReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchLatestReport()
  }, [])

  const fetchLatestReport = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'weekly_summary')
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (data) setReport(data)
    setIsLoading(false)
  }

  if (isLoading || !report) return null

  const content = report.content

  return (
    <Card className="rounded-3xl border-none bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl overflow-hidden mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-sm font-black uppercase tracking-widest">{t('title')}</CardTitle>
          </div>
          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {t('new')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium leading-relaxed opacity-95">
          {content.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase opacity-60 tracking-tighter">{t('improvements')}</h4>
            {content.improvements.slice(0, 2).map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-300" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase opacity-60 tracking-tighter">{t('focus')}</h4>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-amber-300" />
              <span className="font-semibold">{content.focus}</span>
            </div>
          </div>
        </div>

        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full mt-2 bg-white/10 hover:bg-white/20 border-none text-white text-xs font-bold gap-2"
        >
          {t('viewFull')} <ChevronRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  )
}
