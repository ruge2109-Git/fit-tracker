import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    
    const mondayISO = monday.toISOString().split('T')[0]

    // 1. Get all public users
    const { data: publicUsers, error: usersError } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('is_public', true)

    if (usersError) throw usersError
    console.log(`[Leaderboard API] Found ${publicUsers?.length || 0} public users`)
    
    if (!publicUsers || publicUsers.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const userIds = publicUsers.map(u => u.id)

    // 2. Get all workouts for these users since Monday
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, user_id')
      .in('user_id', userIds)
      .gte('date', mondayISO)

    if (workoutsError) throw workoutsError
    console.log(`[Leaderboard API] Found ${workouts?.length || 0} workouts since ${mondayISO}`)
    
    if (!workouts || workouts.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const workoutIds = workouts.map(w => w.id)

    // 3. Get all sets for these workouts to calculate volume
    // We fetch in chunks if needed, but for leaderboard usually it's manageable
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('workout_id, weight, reps')
      .in('workout_id', workoutIds)

    if (setsError) throw setsError

    // 4. Aggregate data per user
    const leaderboardMap: Record<string, { volume: number; workouts: Set<string> }> = {}
    
    sets?.forEach(set => {
      const workout = workouts.find(w => w.id === set.workout_id)
      if (!workout) return
      
      const uid = workout.user_id
      if (!leaderboardMap[uid]) {
        leaderboardMap[uid] = { volume: 0, workouts: new Set() }
      }
      
      leaderboardMap[uid].volume += Number(set.weight) * Number(set.reps)
      leaderboardMap[uid].workouts.add(set.workout_id)
    })

    // 5. Format and sort
    const leaderboard = publicUsers
      .map(user => ({
        user_id: user.id,
        nickname: user.nickname || 'Atleta',
        total_volume: Math.round(leaderboardMap[user.id]?.volume || 0),
        workout_count: leaderboardMap[user.id]?.workouts.size || 0
      }))
      .filter(entry => entry.total_volume > 0)
      .sort((a, b) => b.total_volume - a.total_volume)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return NextResponse.json({ data: leaderboard })
  } catch (error: any) {
    console.error('Leaderboard API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
