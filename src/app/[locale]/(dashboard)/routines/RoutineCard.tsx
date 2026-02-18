
import { Routine } from '@/types'
import { ROUTES, ROUTINE_FREQUENCY_OPTIONS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, ChevronRight } from 'lucide-react'

interface RoutineCardProps {
    routine: Routine
    index: number
    router: any // Using specific router type would be better if available
    t: any // Using specific translations type would be better if available
}

export function RoutineCard({ routine, index, router, t }: RoutineCardProps) {
    return (
        <div
            className="group cursor-pointer"
            onClick={() => router.push(ROUTES.ROUTINE_DETAIL(routine.id))}
            style={{ animationDelay: `${index * 30}ms` }}
        >
            <Card className="h-full rounded-2xl border-none bg-accent/5 shadow-sm hover:shadow-md hover:shadow-primary/5 hover:bg-accent/10 transition-all duration-200 overflow-hidden relative border border-transparent hover:border-accent/10">
                {/* Active Indicator - More Discreet */}
                {routine.is_active && (
                    <div className="absolute top-3 right-3 z-10 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}

                <CardHeader className="pt-5 px-5 pb-2">
                    <div className="space-y-1">
                        <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-primary/60 line-clamp-1">
                            {routine.frequency ? ROUTINE_FREQUENCY_OPTIONS.find(opt => opt.value === routine.frequency)?.label : t('template') || 'Template'}
                        </p>
                        <CardTitle className="text-base font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                            {routine.name}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-4">
                    {routine.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                            {routine.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            {routine.scheduled_days && routine.scheduled_days.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5 text-muted-foreground/40" />
                                    <span className="text-[9px] font-bold text-muted-foreground/60">
                                        {routine.scheduled_days.length}d
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                                <span className="text-[9px] font-bold text-muted-foreground/60">
                                    {new Date(routine.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
