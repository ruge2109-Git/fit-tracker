/**
 * Global Chat API Route
 * GET: Fetch recent messages
 * POST: Send a new message
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditService } from '@/domain/services/audit.service'
import { notifyGlobalChatToFriends } from '@/lib/notifications/social-notifications'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, user_id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich with nicknames
  const userIds = [...new Set((messages || []).map(m => m.user_id))]
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

  const enriched = (messages || []).map(m => ({
    ...m,
    nickname: nickMap[m.user_id] || 'Atleta',
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content } = await req.json()
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  if (content.length > 500) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const { error } = await supabase.from('chat_messages').insert({
    user_id: user.id,
    content: content.trim(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await auditService.logAction({
    userId: user.id,
    action: 'send_message',
    entityType: 'chat',
    details: { channel: 'global', content_length: content.trim().length },
  }, supabase)

  // Notify friends about global chat activity
  const { data: senderProfile } = await supabase
    .from('users')
    .select('nickname, name')
    .eq('id', user.id)
    .single()
  const senderName = senderProfile?.nickname || senderProfile?.name || 'Alguien'

  // Get sender's friends
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id_1, user_id_2')
    .eq('status', 'accepted')
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

  if (friendships && friendships.length > 0) {
    const friendIds = friendships.map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    )
    notifyGlobalChatToFriends(friendIds, senderName, content.trim()).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
