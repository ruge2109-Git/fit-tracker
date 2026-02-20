/**
 * Friends API Route
 * Handles listing, sending requests, and accepting/rejecting friendships
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditService } from '@/domain/services/audit.service'
import { notifyFriendRequest, notifyFriendAccepted } from '@/lib/notifications/social-notifications'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // Get all friendships for this user, with the other user's nickname
  const { data, error } = await supabase
    .from('friendships')
    .select('id, user_id_1, user_id_2, status, created_at, updated_at')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich with nicknames by fetching the other user's data
  const friendIds = (data || []).map(f => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1)
  const uniqueIds = [...new Set(friendIds)]

  let nickMap: Record<string, string> = {}
  if (uniqueIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, nickname, name')
      .in('id', uniqueIds)
    if (users) {
      nickMap = Object.fromEntries(users.map(u => [u.id, u.nickname || u.name || 'Atleta']))
    }
  }

  const enriched = (data || []).map(f => {
    const friendId = f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
    return {
      ...f,
      friend_id: friendId,
      friend_nickname: nickMap[friendId] || 'Atleta',
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendId } = await req.json()
  if (!friendId) {
    return NextResponse.json({ error: 'Missing friendId' }, { status: 400 })
  }

  if (friendId === user.id) {
    return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
  }

  const { error } = await supabase.from('friendships').insert({
    user_id_1: user.id,
    user_id_2: friendId,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: 'send_friend_request',
    entityType: 'friends',
    details: { friendId },
  }, supabase)

  // Push notification to the target user
  const { data: senderProfile } = await supabase
    .from('users')
    .select('nickname, name')
    .eq('id', user.id)
    .single()
  const senderName = senderProfile?.nickname || senderProfile?.name || 'Un atleta'
  notifyFriendRequest(friendId, senderName).catch(() => {}) // fire & forget

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendshipId, status } = await req.json()
  if (!friendshipId || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Only the recipient (user_id_2) can accept/reject
  const { error } = await supabase
    .from('friendships')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .eq('user_id_2', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: status === 'accepted' ? 'accept_friend_request' : 'reject_friend_request',
    entityType: 'friends',
    entityId: friendshipId,
    details: { status },
  }, supabase)

  // If accepted, notify the sender
  if (status === 'accepted') {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('user_id_1')
      .eq('id', friendshipId)
      .single()
    if (friendship) {
      const { data: accepterProfile } = await supabase
        .from('users')
        .select('nickname, name')
        .eq('id', user.id)
        .single()
      const accepterName = accepterProfile?.nickname || accepterProfile?.name || 'Un atleta'
      notifyFriendAccepted(friendship.user_id_1, accepterName).catch(() => {})
    }
  }

  return NextResponse.json({ success: true })
}
