/**
 * Activity Feed API Route
 * GET: Fetch recent public activity from friends
 * POST: Create a new activity event
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditService } from '@/domain/services/audit.service'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get accepted friend IDs
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id_1, user_id_2')
    .eq('status', 'accepted')
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

  const friendIds = (friendships || []).map(f =>
    f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
  )

  // Include own events too
  const allIds = [...friendIds, user.id]

  const { data: feed, error } = await supabase
    .from('activity_feed')
    .select('id, user_id, type, payload, created_at')
    .in('user_id', allIds)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich with nicknames
  const userIds = [...new Set((feed || []).map(f => f.user_id))]
  let nickMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, nickname, name')
      .in('id', userIds)
    if (users) {
      nickMap = Object.fromEntries(users.map(u => [u.id, u.nickname || u.name || 'Atleta']))
    }
  }

  const enriched = (feed || []).map(f => ({
    ...f,
    nickname: nickMap[f.user_id] || 'Atleta',
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, payload } = await req.json()
  if (!type || !payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabase.from('activity_feed').insert({
    user_id: user.id,
    type,
    payload,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: 'create_feed_event',
    entityType: 'feed',
    details: { type, payload },
  }, supabase)

  return NextResponse.json({ success: true })
}
