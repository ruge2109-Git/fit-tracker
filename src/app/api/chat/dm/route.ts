/**
 * Direct Messages API Route
 * GET: Conversation with a specific friend (query ?with=userId)
 * POST: Send a direct message to a friend
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditService } from '@/domain/services/audit.service'
import { notifyDirectMessage } from '@/lib/notifications/social-notifications'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const otherId = url.searchParams.get('with')
  if (!otherId) {
    return NextResponse.json({ error: 'Missing other user id' }, { status: 400 })
  }

  // Verify they are friends (accepted)
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(user_id_1.eq.${user.id},user_id_2.eq.${otherId}),and(user_id_1.eq.${otherId},user_id_2.eq.${user.id})`
    )
    .limit(1)
    .single()

  if (!friendship) {
    return NextResponse.json({ error: 'Not friends' }, { status: 403 })
  }

  // Fetch conversation
  const { data: messages, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, receiver_id, content, created_at')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(messages || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { receiverId, content } = await req.json()
  if (!receiverId || !content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Verify friendship
  const { data: friendship } = await supabase
    .from('friendships')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(user_id_1.eq.${user.id},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${user.id})`
    )
    .limit(1)
    .single()

  if (!friendship) {
    return NextResponse.json({ error: 'Not friends' }, { status: 403 })
  }

  const { error } = await supabase.from('direct_messages').insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content: content.trim(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: 'send_dm',
    entityType: 'chat',
    details: { receiverId, content_length: content.trim().length },
  }, supabase)

  // Push notification to the receiver
  const { data: senderProfile } = await supabase
    .from('users')
    .select('nickname, name')
    .eq('id', user.id)
    .single()
  const senderName = senderProfile?.nickname || senderProfile?.name || 'Alguien'
  notifyDirectMessage(receiverId, senderName, content.trim()).catch(() => {})

  return NextResponse.json({ success: true })
}
