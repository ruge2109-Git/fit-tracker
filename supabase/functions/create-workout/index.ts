/**
 * Supabase Edge Function: Create Workout
 * Validates and creates a workout with sets
 * Example of using Edge Functions for business logic
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WorkoutData {
  date: string
  duration: number
  notes?: string
  sets: {
    exercise_id: string
    reps: number
    weight: number
    rest_time?: number
  }[]
}

serve(async (req) => {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const workoutData: WorkoutData = await req.json()

    // Validate input
    if (!workoutData.date || !workoutData.duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: date, duration' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (workoutData.duration <= 0) {
      return new Response(
        JSON.stringify({ error: 'Duration must be positive' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!workoutData.sets || workoutData.sets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one set is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create workout
    const { data: workout, error: workoutError } = await supabaseClient
      .from('workouts')
      .insert({
        user_id: user.id,
        date: workoutData.date,
        duration: workoutData.duration,
        notes: workoutData.notes,
      })
      .select()
      .single()

    if (workoutError) {
      throw workoutError
    }

    // Create sets
    const setsToInsert = workoutData.sets.map((set, index) => ({
      workout_id: workout.id,
      exercise_id: set.exercise_id,
      reps: set.reps,
      weight: set.weight,
      rest_time: set.rest_time,
      set_order: index + 1,
    }))

    const { error: setsError } = await supabaseClient
      .from('sets')
      .insert(setsToInsert)

    if (setsError) {
      // Rollback: delete workout if sets creation failed
      await supabaseClient
        .from('workouts')
        .delete()
        .eq('id', workout.id)

      throw setsError
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        workout_id: workout.id,
        message: 'Workout created successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating workout:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

