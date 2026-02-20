import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.log('ENVS: ', process.env)
      console.error('AI Coach — OPENAI_API_KEY is missing in process.env')
    } else {
      console.log('AI Coach — OPENAI_API_KEY found (length:', apiKey.length, ')')
    }

    if (!message || !apiKey) {
      return NextResponse.json({ error: 'Missing message or API key configuration' }, { status: 400 })
    }

    // Get authenticated user from session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // ─── Step 1: Fetch workouts, routines, goals, measurements in parallel ───
    const [
      { data: workouts, error: workoutsError },
      { data: routines, error: routinesError },
      { data: goals, error: goalsError },
      { data: measurements, error: measurementsError },
    ] = await Promise.all([
      supabase
        .from('workouts')
        .select('id, date, duration, notes, routine_id, routine:routines(name)')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30),

      supabase
        .from('routines')
        .select('name, scheduled_days, is_active, frequency')
        .eq('user_id', userId)
        .eq('is_active', true),

      supabase
        .from('goals')
        .select('title, type, target_value, current_value, unit, is_completed, target_date')
        .eq('user_id', userId)
        .eq('is_completed', false),

      supabase
        .from('body_measurements')
        .select('measurement_type, value, unit, measurement_date')
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false })
        .limit(20),
    ])

    // Log any query errors so they're visible in Next.js server logs
    if (workoutsError)    console.error('AI Coach — workouts error:', workoutsError)
    if (routinesError)    console.error('AI Coach — routines error:', routinesError)
    if (goalsError)       console.error('AI Coach — goals error:', goalsError)
    if (measurementsError) console.error('AI Coach — measurements error:', measurementsError)

    // ─── Step 2: Fetch sets using workout IDs ────────────────────────────────
    // Uses correct PostgREST alias syntax: exercise:exercises(...)
    let sets: any[] = []
    const workoutIds = workouts?.map(w => w.id) ?? []

    if (workoutIds.length > 0) {
      const { data: fetchedSets, error: setsError } = await supabase
        .from('sets')
        .select('workout_id, exercise_id, reps, weight, exercise:exercises(name, muscle_group)')
        .in('workout_id', workoutIds)
        .order('created_at', { ascending: false })
        .limit(300)

      if (setsError) {
        // Log but don't fail the whole request
        console.error('AI Coach — sets query error:', setsError)
        // Fallback: fetch sets without join, then enrich with exercise names separately
        const { data: rawSets, error: rawSetsError } = await supabase
          .from('sets')
          .select('workout_id, exercise_id, reps, weight')
          .in('workout_id', workoutIds)
          .limit(300)

        if (!rawSetsError && rawSets && rawSets.length > 0) {
          // Get unique exercise IDs and look them up
          const exerciseIds = [...new Set(rawSets.map(s => s.exercise_id).filter(Boolean))]
          const { data: exerciseData } = await supabase
            .from('exercises')
            .select('id, name, muscle_group')
            .in('id', exerciseIds)

          const exerciseMap = Object.fromEntries((exerciseData || []).map(e => [e.id, e]))
          sets = rawSets.map(s => ({ ...s, exercise: exerciseMap[s.exercise_id] || null }))
        }
      } else {
        sets = fetchedSets ?? []
      }
    }

    // Debug: log what we fetched (remove in production)
    console.log(`AI Coach context — workouts:${workouts?.length ?? 0} sets:${sets.length} routines:${routines?.length ?? 0} goals:${goals?.length ?? 0}`)

    // ─── Build context string ────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const contextParts: string[] = [`Fecha de hoy: ${today}`]

    // Workouts context
    if (workouts && workouts.length > 0) {
      const workoutSummary = workouts.map(w =>
        `- ${w.date}: ${(w.routine as any)?.name || 'Entrenamiento libre'} (${w.duration} min)${w.notes ? ` | "${w.notes}"` : ''}`
      ).join('\n')
      contextParts.push(`\nÚltimos entrenamientos (${workouts.length} en total):\n${workoutSummary}`)

      // Weekly frequency
      const last4Weeks = workouts.filter(w => {
        const d = new Date(w.date)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 28)
        return d >= cutoff
      })
      contextParts.push(`Entrenamientos en las últimas 4 semanas: ${last4Weeks.length}`)
    } else {
      contextParts.push('\nEl usuario NO tiene entrenamientos registrados todavía.')
    }

    // Sets / exercise context — grouped by exercise with progress data
    if (sets.length > 0) {
      const exerciseMap: Record<string, { weights: number[], reps: number[], muscle: string, count: number }> = {}

      for (const s of sets) {
        const ex = s.exercise as any
        const name = ex?.name || 'Ejercicio desconocido'
        const muscle = ex?.muscle_group || 'sin grupo'
        if (!exerciseMap[name]) exerciseMap[name] = { weights: [], reps: [], muscle, count: 0 }
        exerciseMap[name].weights.push(Number(s.weight) || 0)
        exerciseMap[name].reps.push(Number(s.reps) || 0)
        exerciseMap[name].count++
      }

      // Sort by total sets count (most trained first)
      const setLines = Object.entries(exerciseMap)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data]) => {
          const maxW = Math.max(...data.weights)
          const avgReps = Math.round(data.reps.reduce((a, b) => a + b, 0) / data.reps.length)
          const totalSets = data.count
          return `- ${name} (${data.muscle}): ${totalSets} series totales | máx ${maxW}kg × ${avgReps} reps prom.`
        }).join('\n')

      contextParts.push(`\nHistorial por ejercicio (${Object.keys(exerciseMap).length} ejercicios):\n${setLines}`)
    } else if (workouts && workouts.length > 0) {
      contextParts.push('\nEl usuario tiene entrenamientos pero sin series registradas con detalle.')
    }

    // Routines context
    if (routines && routines.length > 0) {
      const routineLines = routines.map(r =>
        `- ${r.name} | frecuencia: ${r.frequency || 'personalizada'} | días: ${r.scheduled_days?.join(', ') || 'sin horario fijo'}`
      ).join('\n')
      contextParts.push(`\nRutinas activas (${routines.length}):\n${routineLines}`)
    } else {
      contextParts.push('\nEl usuario no tiene rutinas activas.')
    }

    // Goals context
    if (goals && goals.length > 0) {
      const goalLines = goals.map(g => {
        const pct = g.target_value > 0
          ? Math.round((g.current_value / g.target_value) * 100)
          : 0
        return `- ${g.title}: ${g.current_value}/${g.target_value} ${g.unit} (${pct}%)${g.target_date ? ` → fecha límite: ${g.target_date}` : ''}`
      }).join('\n')
      contextParts.push(`\nMetas activas (${goals.length}):\n${goalLines}`)
    } else {
      contextParts.push('\nEl usuario no tiene metas activas.')
    }

    // Body measurements context
    if (measurements && measurements.length > 0) {
      // Group by type to show latest per measurement
      const latestByType: Record<string, { value: number; unit: string; date: string }> = {}
      for (const m of measurements) {
        if (!latestByType[m.measurement_type]) {
          latestByType[m.measurement_type] = { value: m.value, unit: m.unit, date: m.measurement_date }
        }
      }
      const measureLines = Object.entries(latestByType)
        .map(([type, d]) => `- ${type}: ${d.value} ${d.unit} (${d.date})`)
        .join('\n')
      contextParts.push(`\nMediciones corporales más recientes:\n${measureLines}`)
    }

    const userContext = contextParts.join('\n')

    // ─── Build system prompt ─────────────────────────────────────────────────
    const systemPrompt = `Eres un coach de fitness personal IA, experto en entrenamiento de fuerza, nutrición y bienestar.
Tienes acceso al historial COMPLETO y REAL del usuario. Usa esos datos siempre que sean relevantes para responder.

DATOS REALES DEL USUARIO:
${userContext}

INSTRUCCIONES CRÍTICAS:
- SIEMPRE cita datos concretos del historial cuando los hay (ej: "En press de banca llevas 8 series a máx 80kg")
- Si el usuario TIENE entrenamientos, NO digas que "no tienes registros" — los datos están arriba
- Si el usuario NO tiene entrenamientos (sección dice "no tiene"), reconócelo honestamente
- Responde en el idioma del usuario (español por defecto)
- Sé directo, concreto y motivador
- Usa los datos numéricos reales, no los inventes
- Máximo 4 párrafos por respuesta
- Usa emojis con moderación

FORMATO DE RESPUESTA — Debes responder SIEMPRE con un JSON válido con esta estructura exacta:
{
  "reply": "tu respuesta completa aquí",
  "suggestions": [
    "pregunta corta de seguimiento 1",
    "pregunta corta de seguimiento 2",
    "pregunta corta de seguimiento 3"
  ]
}
Las suggestions deben ser preguntas o frases cortas (< 8 palabras) que el usuario podría querer preguntar después de leer tu reply. Deben ser naturales y relevantes al contexto de la conversación.`

    const openai = new OpenAI({ apiKey })

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.6,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content || '{}'
    let reply = ''
    let suggestions: string[] = []
    try {
      const parsed = JSON.parse(raw)
      reply = parsed.reply || raw
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
    } catch {
      reply = raw
    }

    return NextResponse.json({ reply, suggestions })

  } catch (error: any) {
    console.error('AI Coach error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
