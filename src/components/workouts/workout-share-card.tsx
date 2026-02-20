'use client'

/**
 * WorkoutShareCard — Ultra-simple Strava-style cards
 * Canvas 2D rendering, sin html2canvas. 1080×1920 PNG para Stories.
 */

import { useState } from 'react'
import { Share2, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { WorkoutWithSets } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CW = 1080   // canvas width
const CH = 1920   // canvas height

interface Props { workout: WorkoutWithSets; routineName?: string }

// ─── Templates ────────────────────────────────────────────────────────────────
type TemplateId = 'dark' | 'violet' | 'fire' | 'ocean' | 'glass' | 'white' | 'transparent'

interface Tpl {
  id: TemplateId; label: string
  transparent?: boolean   // true = export PNG with alpha channel, no bg fill
  // preview colours (CSS string for the UI chip thumb)
  thumb: string
  // canvas draw config
  bg1: string; bg2: string; bg3?: string
  glow1?: string; glow2?: string
  text: string; sub: string; accent: string
  pillFill: string; pillStroke: string
  divider: string; footer: string
}

const TEMPLATES: Tpl[] = [
  {
    id:'dark', label:'Dark',
    thumb:'linear-gradient(150deg,#0d0d1a,#120924)',
    bg1:'#0d0d1a', bg2:'#120924', bg3:'#081522',
    glow1:'rgba(139,92,246,0.4)', glow2:'rgba(59,130,246,0.22)',
    text:'#ffffff', sub:'rgba(255,255,255,0.48)', accent:'#a78bfa',
    pillFill:'rgba(255,255,255,0.07)', pillStroke:'rgba(255,255,255,0.11)',
    divider:'rgba(255,255,255,0.10)', footer:'rgba(255,255,255,0.30)',
  },
  {
    id:'violet', label:'Violeta',
    thumb:'linear-gradient(140deg,#7c3aed,#4f46e5,#2563eb)',
    bg1:'#7c3aed', bg2:'#4f46e5', bg3:'#1d4ed8',
    glow1:'rgba(255,255,255,0.13)', glow2:'rgba(167,139,250,0.20)',
    text:'#ffffff', sub:'rgba(255,255,255,0.65)', accent:'#fef08a',
    pillFill:'rgba(255,255,255,0.16)', pillStroke:'rgba(255,255,255,0.22)',
    divider:'rgba(255,255,255,0.16)', footer:'rgba(255,255,255,0.50)',
  },
  {
    id:'fire', label:'Fire',
    thumb:'linear-gradient(140deg,#1c0a00,#7f1d1d,#c2410c)',
    bg1:'#1c0a00', bg2:'#7f1d1d', bg3:'#431407',
    glow1:'rgba(220,38,38,0.42)', glow2:'rgba(249,115,22,0.25)',
    text:'#ffffff', sub:'rgba(255,255,255,0.52)', accent:'#fb923c',
    pillFill:'rgba(255,255,255,0.08)', pillStroke:'rgba(251,146,60,0.30)',
    divider:'rgba(251,146,60,0.22)', footer:'rgba(255,255,255,0.32)',
  },
  {
    id:'ocean', label:'Ocean',
    thumb:'linear-gradient(140deg,#0c4a6e,#0e7490,#0891b2)',
    bg1:'#082f49', bg2:'#0c4a6e', bg3:'#0e7490',
    glow1:'rgba(6,182,212,0.35)', glow2:'rgba(14,116,144,0.20)',
    text:'#ffffff', sub:'rgba(255,255,255,0.55)', accent:'#67e8f9',
    pillFill:'rgba(255,255,255,0.09)', pillStroke:'rgba(103,232,249,0.25)',
    divider:'rgba(103,232,249,0.18)', footer:'rgba(255,255,255,0.35)',
  },
  {
    id:'glass', label:'Glass',
    thumb:'linear-gradient(140deg,#1e1e2e,#16213e)',
    bg1:'#1a1a2e', bg2:'#16213e',
    glow1:'rgba(139,92,246,0.28)', glow2:'rgba(99,102,241,0.18)',
    text:'#ffffff', sub:'rgba(255,255,255,0.50)', accent:'#c4b5fd',
    pillFill:'rgba(255,255,255,0.08)', pillStroke:'rgba(196,181,253,0.22)',
    divider:'rgba(255,255,255,0.12)', footer:'rgba(255,255,255,0.33)',
  },
  {
    id:'white', label:'Blanco',
    thumb:'linear-gradient(135deg,#f8f6ff,#ede9fe)',
    bg1:'#f8f6ff', bg2:'#ddd6fe',
    glow1:'rgba(167,139,250,0.20)',
    text:'#1e1b4b', sub:'rgba(30,27,75,0.52)', accent:'#7c3aed',
    pillFill:'rgba(124,58,237,0.07)', pillStroke:'rgba(124,58,237,0.15)',
    divider:'rgba(124,58,237,0.14)', footer:'rgba(30,27,75,0.38)',
  },
  {
    id:'transparent', label:'Cristal',
    transparent: true,
    // thumb shows checkerboard + frosted panel
    thumb:'repeating-conic-gradient(#c8c8d0 0% 25%,#f0f0f5 0% 50%) 0 0/12px 12px',
    bg1:'transparent', bg2:'transparent',
    text:'#ffffff', sub:'rgba(255,255,255,0.65)', accent:'#c4b5fd',
    pillFill:'rgba(255,255,255,0.12)', pillStroke:'rgba(255,255,255,0.22)',
    divider:'rgba(255,255,255,0.18)', footer:'rgba(255,255,255,0.45)',
  },
]

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function rrect(ctx: CanvasRenderingContext2D, x:number, y:number, w:number, h:number, r:number) {
  ctx.beginPath()
  ctx.moveTo(x+r, y)
  ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r)
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r)
  ctx.closePath()
}

function radial(ctx: CanvasRenderingContext2D, cx:number, cy:number, r:number, col:string) {
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r)
  g.addColorStop(0.0, col)
  g.addColorStop(1.0, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0,0,CW,CH)
}

function font(ctx: CanvasRenderingContext2D, px:number, wt='normal', family="Inter,system-ui,sans-serif") {
  ctx.font = `${wt} ${px}px ${family}`
}

function clip(ctx: CanvasRenderingContext2D, txt:string, max:number): string {
  if (ctx.measureText(txt).width <= max) return txt
  while (txt.length && ctx.measureText(txt+'…').width > max) txt = txt.slice(0,-1)
  return txt+'…'
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────
function groupSets(w: WorkoutWithSets) {
  const order: string[] = []; const map: Record<string,{reps:number;weight:number}[]> = {}
  for (const s of w.sets) {
    const n = s.exercise?.name ?? 'Ejercicio'
    if (!map[n]) { map[n]=[]; order.push(n) }
    map[n].push({ reps:s.reps, weight:s.weight })
  }
  return { map, order }
}

async function renderCard(workout: WorkoutWithSets, routineName: string|undefined, tpl: Tpl): Promise<string> {
  await document.fonts.ready

  const c = document.createElement('canvas')
  c.width = CW; c.height = CH
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const P = 100   // padding

  // ─── Case: Transparent (Floating Stats Only) ───────────────────────────────
  if (tpl.transparent) {
    const volume = workout.sets.reduce((s,r) => s + r.weight*r.reps, 0)
    const totalSets = workout.sets.length
    const stats = [
      { label: 'DURACIÓN', value: `${workout.duration}`, unit: 'min' },
      { label: 'SERIES',   value: `${totalSets}`,         unit: 'sets' },
      { label: 'VOLUMEN',  value: `${Math.round(volume / 1000 * 10) / 10}`, unit: 'k kg' },
    ]

    const barW = CW - P * 2
    const barH = 280
    const barY = CH - P * 2 - barH // Position it floating near the bottom
    const pillR = 50

    // Main floating bar (frosted glass)
    rrect(ctx, P, barY, barW, barH, pillR)
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke()

    // Content inside the bar
    const colW = barW / 3
    stats.forEach(({ label, value, unit }, i) => {
      const cx = P + i * colW + colW / 2
      ctx.textAlign = 'center'
      
      // Value
      font(ctx, 80, '900'); ctx.fillStyle = '#fff'
      ctx.fillText(value, cx, barY + 115)
      
      // Unit
      font(ctx, 30, '700'); ctx.fillStyle = tpl.accent
      ctx.fillText(unit, cx, barY + 165)
      
      // Label
      font(ctx, 24, '800'); ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillText(label, cx, barY + 220)
    })

    // Small branding "watermark" inside the pill so it's not totally contextless
    font(ctx, 18, '800'); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.textAlign = 'right'
    ctx.fillText('FITTRACKR', CW - P - 40, barY + 40)

    return c.toDataURL('image/png', 1.0)
  }

  // ─── Case: Standard Templates (Full Design) ────────────────────────────────
  {
    const bg = ctx.createLinearGradient(0,0,CW,CH)
    bg.addColorStop(0, tpl.bg1)
    bg.addColorStop(0.55, tpl.bg2)
    if (tpl.bg3) bg.addColorStop(1, tpl.bg3)
    else         bg.addColorStop(1, tpl.bg2)
    ctx.fillStyle = bg
    ctx.fillRect(0,0,CW,CH)
    if (tpl.glow1) radial(ctx, CW*0.85, -80,  700, tpl.glow1)
    if (tpl.glow2) radial(ctx, CW*0.15, CH+80, 600, tpl.glow2)
  }

  // ── Branding ─────────────────────────────────────────────────────────────────
  const brandY = P + 60
  font(ctx, 38, '700'); ctx.fillStyle = tpl.accent; ctx.textAlign = 'left'
  ctx.fillText('FitTrackr', P, brandY)

  // ── Workout name ──────────────────────────────────────────────────────────────
  font(ctx, 96, '900'); ctx.fillStyle = tpl.text
  const maxTextW = CW - P * 2
  const words = (routineName ?? 'Entrenamiento Libre').split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (ctx.measureText(t).width > maxTextW && cur) { lines.push(cur); cur = w } else cur = t
  }
  if (cur) lines.push(cur)
  const nameY = brandY + 72
  lines.slice(0, 3).forEach((l, i) =>
    ctx.fillText(clip(ctx, l, maxTextW), P, nameY + i * 108)
  )

  // ── Date ─────────────────────────────────────────────────────────────────────
  const dateStr = new Date(workout.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday:'long', day:'numeric', month:'long', year:'numeric',
  })
  const dateY = nameY + Math.min(lines.length, 3) * 108 + 16
  font(ctx, 38, '400'); ctx.fillStyle = tpl.sub
  ctx.fillText(clip(ctx, dateStr, maxTextW), P, dateY)

  // ── Stats (3 large pills) ─────────────────────────────────────────────────────
  const volume = workout.sets.reduce((s,r) => s + r.weight*r.reps, 0)
  const totalSets = workout.sets.length
  const stats = [
    { label: 'DURACIÓN', value: `${workout.duration}`, unit: 'min' },
    { label: 'SERIES',   value: `${totalSets}`,         unit: 'sets' },
    { label: 'VOLUMEN',  value: `${Math.round(volume / 1000 * 10) / 10}`, unit: 'k kg' },
  ]

  const pillW = (maxTextW - 40) / 3
  const pillH = 260
  const pillY = CH / 2 - 80

  stats.forEach(({ label, value, unit }, i) => {
    const sx = P + i * (pillW + 20)
    rrect(ctx, sx, pillY, pillW, pillH, 36)
    ctx.fillStyle = tpl.pillFill; ctx.fill()
    ctx.strokeStyle = tpl.pillStroke; ctx.lineWidth = 2; ctx.stroke()
    ctx.textAlign = 'center'
    font(ctx, 86, '900'); ctx.fillStyle = tpl.text
    ctx.fillText(value, sx + pillW/2, pillY + 140)
    font(ctx, 32, '600'); ctx.fillStyle = tpl.accent
    ctx.fillText(unit, sx + pillW/2, pillY + 190)
    font(ctx, 26, '800'); ctx.fillStyle = tpl.sub
    ctx.fillText(label, sx + pillW/2, pillY + 238)
  })

  // ── Exercise list ────────────────────────────────────────────────────────────
  const { order, map } = groupSets(workout)
  let exY = pillY + pillH + 70
  ctx.textAlign = 'left'
  font(ctx, 32, '700'); ctx.fillStyle = tpl.sub
  ctx.fillText('EJERCICIOS', P, exY); exY += 56
  ctx.fillStyle = tpl.divider; ctx.fillRect(P, exY - 36, maxTextW, 2)

  for (const name of order.slice(0, 8)) {
    const sets = map[name]
    const maxKg = Math.max(...sets.map(s => s.weight))
    font(ctx, 40, '700'); ctx.fillStyle = tpl.text
    ctx.fillText(clip(ctx, name, maxTextW - 220), P, exY + 40)
    ctx.textAlign = 'right'; font(ctx, 38, '800'); ctx.fillStyle = tpl.accent
    ctx.fillText(`${sets.length}×${maxKg > 0 ? ` ${maxKg}kg` : ''}`, CW - P, exY + 40)
    ctx.textAlign = 'left'
    exY += 68
    if (exY > CH - 200) { ctx.fillStyle = tpl.sub; font(ctx,34,'500'); ctx.fillText('+ más…', P, exY); break }
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = CH - P - 20
  ctx.fillStyle = tpl.divider; ctx.fillRect(P, footerY - 40, maxTextW, 2)
  font(ctx, 34, '500'); ctx.fillStyle = tpl.footer; ctx.textAlign = 'left'
  ctx.fillText('fittrackr.app', P, footerY)
  ctx.textAlign = 'right'; font(ctx, 32, '800'); ctx.fillStyle = tpl.accent
  ctx.fillText('#TrainSmart', CW - P, footerY)

  return c.toDataURL('image/png', 1.0)
}

// ─── Picker chip ──────────────────────────────────────────────────────────────
function Chip({ tpl, active, onClick }: { tpl:Tpl; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} className={cn('flex flex-col items-center gap-1.5 flex-shrink-0 transition-all duration-200', active ? 'scale-105' : 'opacity-55 hover:opacity-80 hover:scale-102')}>
      <div
        style={{ background: tpl.thumb }}
        className={cn('w-12 h-[68px] rounded-2xl border border-border/20', active ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-background' : '')}
      />
      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{tpl.label}</span>
    </button>
  )
}

// ─── Preview card — natural size, no scaling ────────────────────────────────
// This is purely a colour/feel preview. The real render happens on canvas.
function Preview({ workout, routineName, tpl }: { workout:WorkoutWithSets; routineName?:string; tpl:Tpl }) {
  const volume    = workout.sets.reduce((s,r) => s + r.weight*r.reps, 0)
  const totalSets = workout.sets.length
  const { order } = groupSets(workout)

  // Transparent template — minimalist floating pill preview
  if (tpl.transparent) {
    return (
      <div style={{
        borderRadius: 20, overflow: 'hidden', width: '100%',
        background: 'repeating-conic-gradient(#c0c0cc 0% 25%,#f0f0f5 0% 50%) 0 0/14px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 20px', gap: 20
      }}>
        {/* The floating stats bar */}
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          borderRadius: 24,
          padding: '24px 16px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', flexDirection: 'column', gap: 12,
          fontFamily: 'Inter,system-ui,sans-serif', color: '#fff',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize:16, fontWeight:900, textAlign: 'center' }}>Resumen de entrenamiento</div>
          <div style={{ display:'flex', gap:6 }}>
            {[
              { l:'min', v:`${workout.duration}` },
              { l:'series', v:`${totalSets}` },
              { l:'k kg', v:`${Math.round(volume/1000*10)/10}` },
            ].map(({ l,v }) => (
              <div key={l} style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 4px', textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:900 }}>{v}</div>
                <div style={{ fontSize:9, color:tpl.accent, fontWeight:700, textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:9, fontWeight:800, textAlign: 'center', opacity: 0.3, letterSpacing: '0.1em' }}>FITTRACKR</div>
        </div>
        <p style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>Vista previa transparente (Sticker IG)</p>
      </div>
    )
  }

  return (
    <div style={{
      background: `linear-gradient(140deg,${tpl.bg1},${tpl.bg2}${tpl.bg3?`,${tpl.bg3}`:''})`,
      borderRadius: 20,
      padding: '20px 20px 16px',
      color: tpl.text,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      fontFamily: 'Inter,system-ui,sans-serif',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* glow orb */}
      {tpl.glow1 && <div style={{ position:'absolute', top:-50, right:-50, width:160, height:160, borderRadius:'50%', background:`radial-gradient(circle,${tpl.glow1} 0%,transparent 70%)`, pointerEvents:'none' }} />}

      {/* brand */}
      <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:tpl.accent }}>💪 FitTrackr</div>

      {/* name + date row */}
      <div>
        <div style={{ fontSize:20, fontWeight:900, lineHeight:1.15, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
          {routineName ?? 'Entrenamiento Libre'}
        </div>
        <div style={{ fontSize:11, color:tpl.sub, marginTop:3 }}>
          {new Date(workout.date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'long'})}
        </div>
      </div>

      {/* 3 stat pills */}
      <div style={{ display:'flex', gap:8 }}>
        {[
          { l:'Duración', v:`${workout.duration} min` },
          { l:'Series',   v:`${totalSets}` },
          { l:'Volumen',  v:`${Math.round(volume/1000*10)/10}k kg` },
        ].map(({ l,v }) => (
          <div key={l} style={{ flex:1, background:tpl.pillFill, border:`1px solid ${tpl.pillStroke}`, borderRadius:12, padding:'10px 6px', textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:900 }}>{v}</div>
            <div style={{ fontSize:9, color:tpl.sub, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* top exercises */}
      {order.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:tpl.sub }}>Ejercicios</div>
          {order.slice(0,4).map(n => {
            const sets = workout.sets.filter(s => s.exercise?.name===n)
            const mw   = Math.max(...sets.map(s => s.weight))
            return (
              <div key={n} style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, gap:8 }}>
                <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', minWidth:0 }}>{n}</span>
                <span style={{ color:tpl.accent, fontWeight:800, flexShrink:0 }}>{sets.length}× {mw>0?`${mw}kg`:''}</span>
              </div>
            )
          })}
          {order.length > 4 && <div style={{ fontSize:10, color:tpl.sub }}>+ {order.length-4} más</div>}
        </div>
      )}

      {/* footer */}
      <div style={{ borderTop:`1px solid ${tpl.divider}`, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:9, color:tpl.footer }}>fittrackr.app</span>
        <span style={{ fontSize:8, fontWeight:800, color:tpl.accent, textTransform:'uppercase', letterSpacing:'0.08em' }}>#TrainSmart</span>
      </div>
    </div>
  )
}

// ─── Share Drawer ─────────────────────────────────────────────────────────────
export function WorkoutShareDrawer({ workout, routineName, open, onOpenChange }: Props & { open:boolean; onOpenChange:(v:boolean)=>void }) {
  const [selectedId, setSelectedId] = useState<TemplateId>('dark')
  const [copied, setCopied]         = useState(false)
  const [loading, setLoading]       = useState(false)

  const tpl      = TEMPLATES.find(t => t.id===selectedId)!
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('URL copiada')
    })
  }

  const handleDownload = async () => {
    if (loading) return
    setLoading(true)
    try {
      const dataUrl  = await renderCard(workout, routineName, tpl)
      const filename = `fittrackr-${workout.date}-${selectedId}.png`

      if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], filename, { type:'image/png' })
        if (navigator.canShare({ files:[file] })) {
          await navigator.share({ files:[file], title:'Mi entrenamiento — FitTrackr' }); return
        }
      }
      const a=document.createElement('a'); a.download=filename; a.href=dataUrl; a.click()
    } catch(e) {
      console.error('[ShareCard]', e)
      toast.error('Error al generar la imagen')
    } finally { setLoading(false) }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-0 pb-0 outline-none" style={{ maxHeight:'95dvh' }}>
        <DrawerHeader className="px-5 pb-0">
          <DrawerTitle className="text-base font-black text-left">Compartir entrenamiento</DrawerTitle>
        </DrawerHeader>

        {/* Template picker */}
        <div className="flex gap-4 overflow-x-auto px-5 pt-4 pb-2 scrollbar-none">
          {TEMPLATES.map(t => <Chip key={t.id} tpl={t} active={t.id===selectedId} onClick={()=>setSelectedId(t.id)} />)}
        </div>

        {/* Preview — natural height, no scaling, no clipping */}
        <div className="px-5 pt-2">
          <Preview workout={workout} routineName={routineName} tpl={tpl} />
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-2 space-y-2">
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="flex-1 text-xs rounded-xl bg-accent/5 border-border/20 h-9" />
            <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-xl h-9 px-3 flex-shrink-0">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="w-full rounded-xl h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-bold gap-2"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
              : <><Share2 className="h-4 w-4" /> Guardar / Compartir</>
            }
          </Button>
          <p className="text-center text-[10px] text-muted-foreground/40">PNG · 1080×1920 · Stories</p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ─── Trigger ──────────────────────────────────────────────────────────────────
export function WorkoutShareCardButton({ workout, routineName }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="rounded-xl gap-2">
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Compartir</span>
      </Button>
      <WorkoutShareDrawer workout={workout} routineName={routineName} open={open} onOpenChange={setOpen} />
    </>
  )
}
