/**
 * POST /api/streak/recover — Marca un día como perdonado para la racha (máx. 3 usos por cuenta).
 * Requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.
 */

import { NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  canOfferStreakRecovery,
  computeTrainingStreak,
  getRecoveryCreditsRemaining,
  normalizeRestDays,
} from '@/lib/streak'
import { getTodayColombia } from '@/lib/datetime/colombia'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabaseUser = await createUserClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.warn('StreakRecoverAPI: SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Streak recovery is not available on this server.' },
        { status: 503 }
      )
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const userId = user.id
    const today = getTodayColombia()

    const [
      { data: workoutRows, error: workoutError },
      { data: profile },
      { data: forgivenessRows, error: forgivenessError },
    ] = await Promise.all([
      admin.from('workouts').select('date').eq('user_id', userId).order('date', { ascending: false }),
      admin.from('users').select('rest_days').eq('id', userId).maybeSingle(),
      admin.from('streak_recovery_forgiveness').select('forgiven_date').eq('user_id', userId),
    ])

    if (workoutError) throw workoutError
    if (forgivenessError) throw forgivenessError

    if (!workoutRows?.length) {
      return NextResponse.json({ error: 'No workout history.' }, { status: 400 })
    }

    const uniqueDates = Array.from(new Set(workoutRows.map((w) => w.date)))
    const restDays = normalizeRestDays(profile?.rest_days as string[] | undefined)

    const forgivenessCount = forgivenessRows?.length ?? 0
    const forgivenDates = new Set((forgivenessRows ?? []).map((r) => r.forgiven_date))

    const recoveryCreditsRemaining = getRecoveryCreditsRemaining(forgivenessCount)

    const { streak, lastWorkoutDate, firstMissedDate } = computeTrainingStreak(
      uniqueDates,
      today,
      restDays,
      forgivenDates
    )

    const eligible = canOfferStreakRecovery({
      streak,
      workoutDatesCount: uniqueDates.length,
      recoveryCreditsRemaining,
      firstMissedDate,
      lastWorkoutDate,
      todayStr: today,
    })

    if (!eligible || !firstMissedDate) {
      return NextResponse.json(
        { error: 'Streak recovery is not available for your current state.' },
        { status: 400 }
      )
    }

    const { error: insertError } = await admin.from('streak_recovery_forgiveness').insert({
      user_id: userId,
      forgiven_date: firstMissedDate,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'This day was already recovered.' }, { status: 409 })
      }
      throw insertError
    }

    forgivenDates.add(firstMissedDate)
    const { streak: newStreak } = computeTrainingStreak(uniqueDates, today, restDays, forgivenDates)

    return NextResponse.json({
      ok: true,
      forgivenDate: firstMissedDate,
      newStreak,
      recoveryCreditsRemaining: getRecoveryCreditsRemaining(forgivenessCount + 1),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`StreakRecoverAPI: ${message}`, error instanceof Error ? error : undefined, 'StreakRecoverAPI')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
