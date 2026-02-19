import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Simple client for server-side read access (assuming exercises are public read)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { csvText } = await req.json()
    const apiKey = process.env.OPENAI_API_KEY

    if (!csvText || !apiKey) {
      return NextResponse.json(
        { error: 'Missing CSV text or API Key Configuration' },
        { status: 400 }
      )
    }

    // 1. Fetch available exercises (minimize payload to save tokens)
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .order('name')

    if (error) {
      console.error('Error fetching exercises:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exercises reference' },
        { status: 500 }
      )
    }

    // Prepare context for AI
    // We send a simplified list to keep tokens low. 
    // If the list is huge (>1000 items), we might need semantic search first, 
    // but for <500 exercises, this fits in context window of reasonably capable models.
    const exerciseList = exercises?.map(e => ({ id: e.id, n: e.name, m: e.muscle_group })) || []
    
    // 2. Call OpenAI
    const openai = new OpenAI({ apiKey })
    
    const prompt = `
    Analyze the following workout routine text (CSV-like) and map each exercise to the provided database list.
    
    Database Exercises (JSON):
    ${JSON.stringify(exerciseList)}

    Routine input:
    """
    ${csvText}
    """

    Task:
    1. Parse the structure: Day, Exercise Name, Sets, Reps, Rest Time.
    2. For each exercise, find the best match in the Database.
    3. If a clear match exists, use its "id" as "exercise_id".
    4. If no clear match exists, set "exercise_id": null.
    5. Preserve original exercise name in "original_name".
    6. Normalize Day to: monday, tuesday, wednesday, thursday, friday, saturday, sunday.
    7. Clean up Sets (number), Reps (string), Rest (seconds number).
    8. Infer routine name from content if possible.

    Return JSON format:
    {
      "name": "Suggested Routine Name",
      "scheduled_days": ["monday", ...],
      "exercises": [
        {
          "day": "monday",
          "original_name": "...",
          "exercise_id": "uuid" | null,
          "matched_name": "..." | null,
          "target_sets": 3,
          "target_reps": 10,
          "target_rest_time": 60 
        }
      ]
    }
    
    Response MUST be valid JSON only.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use more efficient model
      messages: [
        { role: "system", content: "You are a fitness expert AI. You parse workout routines into structured JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1, // Low temperature for consistent formatting
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) throw new Error('No content from OpenAI')

    const parsedData = JSON.parse(responseContent)

    return NextResponse.json({ routine: parsedData })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
