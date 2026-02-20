'use client'

/**
 * WorkoutShareCard — Bottom Drawer con 7 templates
 * Usa el Drawer (vaul) existente en lugar de Dialog.
 */

import { useRef, useState, CSSProperties } from 'react'
import { Share2, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer'
import { WorkoutWithSets } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  workout: WorkoutWithSets
  routineName?: string
}

// ── Template registry ─────────────────────────────────────────────────────────
type TemplateId =
  | 'dark' | 'vibrant' | 'glass'
  | 'minimal_dark' | 'minimal_fire' | 'minimal_white' | 'minimal_glass'

interface Template {
  id: TemplateId
  label: string
  thumbGradient: string
  transparent?: boolean
  variant: 'full' | 'minimal'
}

const TEMPLATES: Template[] = [
  { id:'dark',         label:'Dark',      thumbGradient:'linear-gradient(150deg,#0d0d1a,#120924,#081522)', variant:'full' },
  { id:'vibrant',      label:'Gradiente', thumbGradient:'linear-gradient(140deg,#7c3aed,#4f46e5,#2563eb)', variant:'full' },
  { id:'glass',        label:'Glass',     thumbGradient:'repeating-conic-gradient(#d4d4d8 0% 25%,#fff 0% 50%) 0 0/12px 12px', transparent:true, variant:'full' },
  { id:'minimal_dark', label:'Minimal',   thumbGradient:'linear-gradient(135deg,#18181b,#27272a)', variant:'minimal' },
  { id:'minimal_fire', label:'Fire',      thumbGradient:'linear-gradient(135deg,#78350f,#dc2626,#f97316)', variant:'minimal' },
  { id:'minimal_white',label:'Blanco',    thumbGradient:'linear-gradient(135deg,#f8f6ff,#ede9fe)', variant:'minimal' },
  { id:'minimal_glass',label:'Cristal',   thumbGradient:'repeating-conic-gradient(#d4d4d8 0% 25%,#fff 0% 50%) 0 0/12px 12px', transparent:true, variant:'minimal' },
]

// ── Visual tokens per template ────────────────────────────────────────────────
const TOKEN: Record<TemplateId, {
  cardBg:string; text:string; subtext:string; accent:string
  pillBg:string; pillBorder:string; rowBg:string; rowBorder:string
  divider:string; footer:string; glowA?:string; glowB?:string
}> = {
  dark: {
    cardBg:'linear-gradient(150deg,#0d0d1a 0%,#120924 55%,#081522 100%)',
    text:'#fff', subtext:'rgba(255,255,255,0.45)', accent:'#a78bfa',
    pillBg:'rgba(255,255,255,0.06)', pillBorder:'rgba(255,255,255,0.09)',
    rowBg:'rgba(255,255,255,0.04)', rowBorder:'rgba(255,255,255,0.07)',
    divider:'rgba(255,255,255,0.08)', footer:'rgba(255,255,255,0.25)',
    glowA:'rgba(139,92,246,0.35)', glowB:'rgba(59,130,246,0.22)',
  },
  vibrant: {
    cardBg:'linear-gradient(140deg,#7c3aed 0%,#4f46e5 45%,#1d4ed8 100%)',
    text:'#fff', subtext:'rgba(255,255,255,0.65)', accent:'#fef08a',
    pillBg:'rgba(255,255,255,0.15)', pillBorder:'rgba(255,255,255,0.2)',
    rowBg:'rgba(255,255,255,0.10)', rowBorder:'rgba(255,255,255,0.14)',
    divider:'rgba(255,255,255,0.15)', footer:'rgba(255,255,255,0.45)',
    glowA:'rgba(255,255,255,0.12)', glowB:'rgba(167,139,250,0.18)',
  },
  glass: {
    cardBg:'rgba(8,8,18,0.55)',
    text:'#fff', subtext:'rgba(255,255,255,0.5)', accent:'#c4b5fd',
    pillBg:'rgba(255,255,255,0.10)', pillBorder:'rgba(255,255,255,0.16)',
    rowBg:'rgba(255,255,255,0.07)', rowBorder:'rgba(255,255,255,0.11)',
    divider:'rgba(255,255,255,0.12)', footer:'rgba(255,255,255,0.32)',
  },
  minimal_dark: {
    cardBg:'linear-gradient(135deg,#18181b 0%,#1c1c20 100%)',
    text:'#fff', subtext:'rgba(255,255,255,0.42)', accent:'#a78bfa',
    pillBg:'rgba(255,255,255,0.06)', pillBorder:'rgba(255,255,255,0.08)',
    rowBg:'', rowBorder:'',
    divider:'rgba(255,255,255,0.07)', footer:'rgba(255,255,255,0.2)',
    glowA:'rgba(139,92,246,0.2)',
  },
  minimal_fire: {
    cardBg:'linear-gradient(140deg,#1c0a00 0%,#7f1d1d 50%,#431407 100%)',
    text:'#fff', subtext:'rgba(255,255,255,0.5)', accent:'#fb923c',
    pillBg:'rgba(255,255,255,0.08)', pillBorder:'rgba(251,146,60,0.25)',
    rowBg:'', rowBorder:'',
    divider:'rgba(251,146,60,0.2)', footer:'rgba(255,255,255,0.28)',
    glowA:'rgba(220,38,38,0.4)', glowB:'rgba(249,115,22,0.25)',
  },
  minimal_white: {
    cardBg:'linear-gradient(140deg,#f8f6ff 0%,#ede9fe 100%)',
    text:'#1e1b4b', subtext:'rgba(30,27,75,0.5)', accent:'#7c3aed',
    pillBg:'rgba(124,58,237,0.08)', pillBorder:'rgba(124,58,237,0.14)',
    rowBg:'', rowBorder:'',
    divider:'rgba(124,58,237,0.12)', footer:'rgba(30,27,75,0.35)',
  },
  minimal_glass: {
    cardBg:'rgba(8,8,18,0.45)',
    text:'#fff', subtext:'rgba(255,255,255,0.5)', accent:'#c4b5fd',
    pillBg:'rgba(255,255,255,0.10)', pillBorder:'rgba(255,255,255,0.18)',
    rowBg:'', rowBorder:'',
    divider:'rgba(255,255,255,0.12)', footer:'rgba(255,255,255,0.3)',
  },
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function groupSets(w: WorkoutWithSets) {
  const order: string[] = []
  const map: Record<string, { reps:number; weight:number }[]> = {}
  for (const s of w.sets) {
    const n = s.exercise?.name ?? 'Ejercicio'
    if (!map[n]) { map[n]=[]; order.push(n) }
    map[n].push({ reps:s.reps, weight:s.weight })
  }
  return { map, order }
}

const f = (extra: CSSProperties = {}): CSSProperties =>
  ({ fontFamily:"'Inter','Segoe UI',sans-serif", ...extra })

// ── Full card ─────────────────────────────────────────────────────────────────
function FullCard({ workout, routineName, tpl }: { workout:WorkoutWithSets; routineName?:string; tpl:Template }) {
  const tok = TOKEN[tpl.id]
  const { map, order } = groupSets(workout)
  const volume    = workout.sets.reduce((s,r) => s+r.weight*r.reps, 0)
  const totalSets = workout.sets.length
  const dateStr   = new Date(workout.date+'T12:00:00').toLocaleDateString('es-ES',{ weekday:'short', day:'numeric', month:'long', year:'numeric' })

  return (
    <div style={f({ width:390, background:tok.cardBg, borderRadius:28, padding:'30px 26px 24px', color:tok.text, position:'relative', overflow:'hidden' })}>
      {tok.glowA && <div style={{ position:'absolute',top:-80,right:-80,width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${tok.glowA} 0%,transparent 70%)`,pointerEvents:'none' }} />}
      {tok.glowB && <div style={{ position:'absolute',bottom:-50,left:-50,width:160,height:160,borderRadius:'50%',background:`radial-gradient(circle,${tok.glowB} 0%,transparent 70%)`,pointerEvents:'none' }} />}

      <div style={f({ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 })}>
        <div>
          <div style={f({ fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:tok.accent,marginBottom:5 })}>💪 FitTrackr</div>
          <div style={f({ fontSize:21,fontWeight:900,lineHeight:1.15,maxWidth:235 })}>{routineName ?? 'Entrenamiento Libre'}</div>
          <div style={f({ fontSize:11,color:tok.subtext,marginTop:4 })}>{dateStr}</div>
        </div>
        <div style={f({ background:'rgba(255,255,255,0.10)',border:`1px solid ${tok.pillBorder}`,borderRadius:10,padding:'5px 11px',fontSize:11,fontWeight:800,color:tok.text,flexShrink:0 })}>✅ Done</div>
      </div>

      <div style={f({ display:'flex',gap:8,marginBottom:20 })}>
        {[{e:'⏱',v:`${workout.duration}m`},{e:'🔥',v:`${totalSets} sets`},{e:'⚡',v:`${Math.round(volume).toLocaleString()} kg`}].map(({e,v})=>(
          <div key={v} style={f({ flex:1,background:tok.pillBg,border:`1px solid ${tok.pillBorder}`,borderRadius:12,padding:'9px 6px',textAlign:'center' })}>
            <div style={{ fontSize:15,marginBottom:3 }}>{e}</div>
            <div style={f({ fontSize:12,fontWeight:900 })}>{v}</div>
          </div>
        ))}
      </div>

      <div style={f({ display:'flex',flexDirection:'column',gap:6,marginBottom:20 })}>
        {order.map(name=>{
          const sets=map[name]; const maxW=Math.max(...sets.map(s=>s.weight))
          return (
            <div key={name} style={f({ display:'flex',justifyContent:'space-between',alignItems:'center',background:tok.rowBg,border:`1px solid ${tok.rowBorder}`,borderRadius:11,padding:'8px 13px' })}>
              <span style={f({ fontSize:12,fontWeight:700,maxWidth:195,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis' })}>{name}</span>
              <div style={f({ display:'flex',gap:9,flexShrink:0 })}>
                <span style={f({ fontSize:11,color:tok.accent,fontWeight:800 })}>{sets.length}×</span>
                {maxW>0&&<span style={f({ fontSize:11,fontWeight:900 })}>{maxW} kg</span>}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ borderTop:`1px solid ${tok.divider}`,paddingTop:12,display:'flex',justifyContent:'space-between' }}>
        <span style={f({ fontSize:10,color:tok.footer })}>fittrackr.app</span>
        <span style={f({ fontSize:9,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:tok.accent })}>#TrainSmart</span>
      </div>
    </div>
  )
}

// ── Minimal card ──────────────────────────────────────────────────────────────
function MinimalCard({ workout, routineName, tpl }: { workout:WorkoutWithSets; routineName?:string; tpl:Template }) {
  const tok = TOKEN[tpl.id]
  const volume    = workout.sets.reduce((s,r)=>s+r.weight*r.reps,0)
  const totalSets = workout.sets.length
  const { order } = groupSets(workout)
  const dateStr   = new Date(workout.date+'T12:00:00').toLocaleDateString('es-ES',{ day:'numeric',month:'short',year:'numeric' })
  const isFire    = tpl.id==='minimal_fire'

  return (
    <div style={f({ width:390,minHeight:280,background:tok.cardBg,borderRadius:28,padding:'34px 28px 26px',color:tok.text,position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'space-between' })}>
      {tok.glowA && <div style={{ position:'absolute',top:-90,right:-70,width:250,height:250,borderRadius:'50%',background:`radial-gradient(circle,${tok.glowA} 0%,transparent 65%)`,pointerEvents:'none' }} />}
      {tok.glowB && <div style={{ position:'absolute',bottom:-70,left:-50,width:190,height:190,borderRadius:'50%',background:`radial-gradient(circle,${tok.glowB} 0%,transparent 65%)`,pointerEvents:'none' }} />}

      <div style={f({ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24 })}>
        <div style={f({ fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:tok.accent })}>💪 FitTrackr</div>
        <div style={f({ fontSize:11,color:tok.subtext })}>{dateStr}</div>
      </div>

      {isFire ? (
        <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:6,marginBottom:24 }}>
          <div style={f({ fontSize:50,fontWeight:900,lineHeight:1,letterSpacing:'-2px' })}>
            {Math.round(volume).toLocaleString()}
            <span style={f({ fontSize:17,fontWeight:700,marginLeft:5,color:tok.accent })}> kg</span>
          </div>
          <div style={f({ fontSize:13,color:tok.subtext })}>Volumen total · {totalSets} series</div>
          {order[0]&&<div style={f({ fontSize:14,fontWeight:800,color:tok.accent,marginTop:8 })}>🏆 {order[0]}</div>}
        </div>
      ) : (
        <div style={{ flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:18,marginBottom:18 }}>
          <div style={f({ fontSize:28,fontWeight:900,lineHeight:1.1 })}>{routineName ?? 'Entrenamiento Libre'}</div>
          <div style={f({ display:'flex',gap:10 })}>
            {[
              { label:'Duración', value:`${workout.duration} min` },
              { label:'Series',   value:String(totalSets) },
              { label:'Volumen',  value:`${Math.round(volume).toLocaleString()} kg` },
            ].map(({ label,value })=>(
              <div key={label} style={f({ flex:1,background:tok.pillBg,border:`1px solid ${tok.pillBorder}`,borderRadius:14,padding:'11px 7px',textAlign:'center' })}>
                <div style={f({ fontSize:17,fontWeight:900,marginBottom:3 })}>{value}</div>
                <div style={f({ fontSize:9,color:tok.subtext,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' })}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop:`1px solid ${tok.divider}`,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={f({ fontSize:10,color:tok.footer })}>fittrackr.app</span>
        <span style={f({ fontSize:9,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:tok.accent })}>#TrainSmart</span>
      </div>
    </div>
  )
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
function ShareCard(props: { workout:WorkoutWithSets; routineName?:string; tpl:Template }) {
  return props.tpl.variant==='minimal'
    ? <MinimalCard {...props} />
    : <FullCard    {...props} />
}

// ── Selector chip ─────────────────────────────────────────────────────────────
function TemplatePill({ tpl, selected, onClick }: { tpl:Template; selected:boolean; onClick:()=>void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 flex-shrink-0 transition-all duration-200',
        selected ? 'scale-105' : 'opacity-50 hover:opacity-80',
      )}
    >
      <div
        style={{ background:tpl.thumbGradient }}
        className={cn(
          'w-11 h-[62px] rounded-xl border border-border/20',
          selected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-background shadow-lg shadow-violet-500/20' : '',
        )}
      />
      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{tpl.label}</span>
    </button>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────
export function WorkoutShareDrawer({ workout, routineName, open, onOpenChange }: Props & {
  open: boolean
  onOpenChange: (v:boolean) => void
}) {
  const [selectedId, setSelectedId] = useState<TemplateId>('dark')
  const [copied, setCopied]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const cardRefs = useRef<Partial<Record<TemplateId, HTMLDivElement | null>>>({})

  const tpl      = TEMPLATES.find(t=>t.id===selectedId)!
  const shareUrl = typeof window!=='undefined' ? window.location.href : ''

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).then(()=>{
      setCopied(true); setTimeout(()=>setCopied(false),2000)
      toast.success('URL copiada')
    })
  }

  const handleDownload = async () => {
    const el = cardRefs.current[selectedId]
    if (!el||loading) return
    setLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, {
        backgroundColor: tpl.transparent ? null : undefined,
        scale:2.5, useCORS:true, logging:false,
      })
      const dataUrl  = canvas.toDataURL('image/png')
      const filename = `workout-${workout.date}-${selectedId}.png`

      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], filename, { type:'image/png' })
        if (navigator.canShare({ files:[file] })) {
          await navigator.share({ files:[file], title:'Mi entrenamiento', text:shareUrl }); return
        }
      }
      const a = document.createElement('a')
      a.download = filename; a.href = dataUrl; a.click()
    } catch(e) { console.error(e); toast.error('Error al generar la imagen') }
    finally { setLoading(false) }
  }

  const previewScale = tpl.variant==='minimal' ? 0.75 : 0.68
  const previewH     = tpl.variant==='minimal' ? 226   : 320

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-0 pb-0 max-h-[92dvh]">
        <DrawerHeader className="px-5 pb-0">
          <DrawerTitle className="text-base font-black text-left">Compartir entrenamiento</DrawerTitle>
        </DrawerHeader>

        {/* Template carousel */}
        <div className="flex gap-4 overflow-x-auto px-5 pt-4 pb-1 scrollbar-none">
          {TEMPLATES.map(t=>(
            <TemplatePill key={t.id} tpl={t} selected={t.id===selectedId} onClick={()=>setSelectedId(t.id)} />
          ))}
        </div>

        {/* Live preview */}
        <div
          className="flex justify-center overflow-hidden px-4 pt-3"
          style={{ height: previewH }}
        >
          <div style={{ transform:`scale(${previewScale})`, transformOrigin:'center top', willChange:'transform' }}>
            <ShareCard workout={workout} routineName={routineName} tpl={tpl} />
          </div>
        </div>

        {/* Off-screen capture targets */}
        <div style={{ position:'fixed',left:'-9999px',top:0,pointerEvents:'none',zIndex:-1 }}>
          {TEMPLATES.map(t=>(
            <div key={t.id} ref={el=>{ cardRefs.current[t.id]=el }}>
              <ShareCard workout={workout} routineName={routineName} tpl={t} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-3 space-y-2.5">
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="flex-1 text-xs rounded-xl bg-accent/5 border-border/20 h-9" />
            <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl h-9 px-3 flex-shrink-0">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="w-full rounded-xl h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-bold gap-2 text-sm"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
              : <><Share2 className="h-4 w-4" /> Descargar / Compartir</>
            }
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ── Trigger button ────────────────────────────────────────────────────────────
export function WorkoutShareCardButton({ workout, routineName }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={()=>setOpen(true)} className="rounded-xl gap-2">
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Compartir</span>
      </Button>
      <WorkoutShareDrawer workout={workout} routineName={routineName} open={open} onOpenChange={setOpen} />
    </>
  )
}
