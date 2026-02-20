import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const { exerciseId } = await req.json()
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!exerciseId || !apiKey) {
      return NextResponse.json({ error: 'Missing exerciseId or API key' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch last 6 weeks of performance for this specific exercise
    const sixWeeksAgo = new Date()
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)

    const { data: sets, error } = await supabase
      .from('sets')
      .select('weight, reps, workout:workouts(date)')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .gte('workout.date', sixWeeksAgo.toISOString().split('T')[0])
      .order('workout(date)', { ascending: true })

    if (error) throw error

    // Group by week
    const weeklyBest: Record<number, number> = {}
    sets?.forEach((s: any) => {
      const date = new Date(s.workout.date)
      const weekNum = Math.floor((date.getTime() - sixWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const volume = s.weight * s.reps
      if (!weeklyBest[weekNum] || volume > weeklyBest[weekNum]) {
        weeklyBest[weekNum] = volume
      }
    })

    const volumes = Object.values(weeklyBest)
    const isStalled = volumes.length >= 3 && 
                     volumes.slice(-3).every((v, i, arr) => i === 0 || Math.abs(v - arr[i-1]) / arr[i-1] < 0.05)

    if (!isStalled) {
      return NextResponse.json({ stalled: false })
    }

    // It is stalled, get AI advice
    const openai = new OpenAI({ apiKey })
    const { data: exercise } = await supabase.from('exercises').select('name').eq('id', exerciseId).single()

    const prompt = `El usuario se ha estancado en el ejercicio "${exercise?.name}" durante las últimas 3 semanas (variación < 5% en volumen).
    Historial de volumen reciente: ${volumes.join(', ')} kg per week best set.
    
    Proporciona un análisis breve y 3 consejos técnicos para romper el estancamiento (ej: cambiar rango de reps, tempo, deload, o ejercicio variante).
    
    Responde en JSON:
    {
      "analysis": "Breve explicación de por qué ocurre",
      "suggestions": ["Consejo 1", "Consejo 2", "Consejo 3"],
      "type": "deload" | "volume_adjustment" | "technical" | "substitution"
    }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // Optional: Save this as a report
    await supabase.from('ai_reports').insert({
      user_id: user.id,
      type: 'plateau_alert',
      exercise_id: exerciseId,
      content: result
    })

    return NextResponse.json({ stalled: true, ...result })

  } catch (error: any) {
    logger.error('Plateau check error:', error, 'PlateauAPI')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
