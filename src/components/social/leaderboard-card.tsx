/**
 * Leaderboard Card - Rediseño Arena
 * Incluye un podio visual para los top 3 atletas.
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Dumbbell, Star, Medal } from 'lucide-react'
import { LeaderboardEntry } from '@/domain/services/stats.service'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface LeaderboardCardProps {
  data: LeaderboardEntry[]
  isLoading?: boolean
}

export function LeaderboardCard({ data, isLoading }: LeaderboardCardProps) {
  const t = useTranslations('social')

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-64 bg-accent/5 rounded-[3rem]" />
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-accent/5 rounded-3xl" />)}
        </div>
      </div>
    )
  }

  const top3 = data.slice(0, 3)
  const rest = data.slice(3)

  return (
    <div className="space-y-8 pb-12">
      {/* Visual Podium Section - Refactored for perfect centering and no clipping */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center w-full pt-16 pb-4 md:gap-4 relative px-2">
          
          {/* Rank 2 */}
          {top3[1] && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 w-[30%] max-w-[100px] -mr-1">
               <Avatar className="h-12 w-12 md:h-20 md:w-20 border-4 border-slate-400/30 rounded-2xl md:rounded-3xl shadow-xl mb-2">
                  <AvatarFallback className="bg-slate-400/10 text-slate-400 font-black italic text-base">
                    {top3[1].nickname?.[0] || 'A'}
                  </AvatarFallback>
               </Avatar>
               <div className="bg-slate-400/5 backdrop-blur-md rounded-t-[1.5rem] p-2 text-center w-full min-h-[130px] border border-white/5 relative overflow-hidden shadow-lg flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-1 opacity-10"><Medal className="h-6 w-6 text-slate-400" /></div>
                  <p className="text-[7px] font-black uppercase text-slate-400 mb-0.5 tracking-tighter opacity-60">ELITE</p>
                  <p className="font-black italic uppercase tracking-tighter truncate w-full text-[10px] mb-1 leading-tight">{top3[1].nickname}</p>
                  <p className="text-lg font-black text-slate-200">{top3[1].total_volume.toLocaleString()}<span className="text-[8px] ml-0.5 opacity-40">KG</span></p>
               </div>
            </div>
          )}

          {/* Rank 1 (Supreme) */}
          {top3[0] && (
            <div className="flex flex-col items-center w-[36%] max-w-[140px] z-10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
               {/* Trophy and Floating elements at the top */}
               <div className="flex flex-col items-center mb-4">
                  <div className="animate-bounce">
                    <Trophy className="h-10 w-10 md:h-12 md:w-12 text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                  </div>
               </div>
               
               <div className="relative mb-2">
                  <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                  <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-amber-500 rounded-[2.5rem] shadow-2xl shadow-amber-500/40 relative z-10">
                     <AvatarFallback className="bg-amber-500/10 text-amber-500 font-black italic text-2xl">
                       {top3[0].nickname?.[0] || 'A'}
                     </AvatarFallback>
                  </Avatar>
               </div>
               <div className="bg-amber-500/10 backdrop-blur-xl rounded-t-[2.5rem] p-4 text-center w-full min-h-[190px] border border-amber-500/30 relative overflow-hidden shadow-[0_-15px_30px_-10px_rgba(245,158,11,0.2)] flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-1.5 opacity-20"><Star className="h-12 w-12 text-amber-500 rotate-12" /></div>
                  <p className="text-[9px] font-black uppercase text-amber-500 mb-1 tracking-widest animate-pulse">CHAMPION</p>
                  <p className="font-black italic uppercase tracking-tighter text-sm truncate w-full mb-1 leading-tight">{top3[0].nickname}</p>
                  <p className="text-3xl font-black text-amber-400 leading-none drop-shadow-sm">{top3[0].total_volume.toLocaleString()}<span className="text-[10px] ml-0.5 font-bold italic opacity-60">KG</span></p>
               </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 w-[30%] max-w-[100px] -ml-1">
               <Avatar className="h-12 w-12 md:h-20 md:w-20 border-4 border-orange-500/30 rounded-2xl md:rounded-3xl shadow-xl mb-2">
                  <AvatarFallback className="bg-orange-500/10 text-orange-500 font-black italic text-base">
                    {top3[2].nickname?.[0] || 'A'}
                  </AvatarFallback>
               </Avatar>
               <div className="bg-orange-500/5 backdrop-blur-md rounded-t-[1.5rem] p-2 text-center w-full min-h-[110px] border border-white/5 relative overflow-hidden shadow-lg flex flex-col justify-center">
                  <p className="text-[7px] font-black uppercase text-orange-500 mb-0.5 tracking-tighter opacity-60">PRO</p>
                  <p className="font-black italic uppercase tracking-tighter truncate w-full text-[10px] mb-1 leading-tight">{top3[2].nickname}</p>
                  <p className="text-lg font-black text-orange-200">{top3[2].total_volume.toLocaleString()}<span className="text-[8px] ml-0.5 opacity-40">KG</span></p>
               </div>
            </div>
          )}
        </div>
      )}

      {/* List Section for the rest */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 px-2 flex items-center gap-2">
           <div className="h-px flex-1 bg-white/5" />
           Challengers
           <div className="h-px flex-1 bg-white/5" />
        </h4>
        {rest.length > 0 && rest.map((entry, index) => (
          <div key={entry.user_id} className="group relative overflow-hidden flex items-center justify-between p-4 bg-accent/2 hover:bg-accent/5 rounded-[1.5rem] border border-white/5 transition-all active:scale-[0.98]">
             <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-background/40 border border-white/5 flex items-center justify-center font-black text-xs italic text-muted-foreground group-hover:text-primary transition-colors">
                  {index + 4}
                </div>
                <div className="flex flex-col">
                   <p className="font-black uppercase italic tracking-tight text-sm group-hover:translate-x-1 transition-transform">{entry.nickname}</p>
                   <p className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-1 opacity-60">
                      <Dumbbell className="h-2.5 w-2.5" />
                      {entry.workout_count} Sesiones
                   </p>
                </div>
             </div>
             <div className="text-right relative">
                <p className="font-black italic text-lg leading-none">{entry.total_volume.toLocaleString()}<span className="text-[8px] ml-1 opacity-30">KG</span></p>
                <p className="text-[7px] font-black uppercase text-primary/40 tracking-tighter">Power Level</p>
             </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <Trophy className="h-16 w-16 mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest italic">Nadie en la Arena todavía...</p>
          </div>
        )}
      </div>
    </div>
  )
}
