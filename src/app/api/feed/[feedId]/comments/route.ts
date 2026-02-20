import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: { feedId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: comments, error } = await supabase
      .from('activity_feed_comments')
      .select('id, user_id, content, created_at')
      .eq('feed_id', params.feedId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with nicknames
    const userIds = [...new Set((comments || []).map(c => c.user_id))]
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

    const enriched = (comments || []).map(c => ({
      ...c,
      nickname: nickMap[c.user_id] || 'Atleta'
    }))

    return NextResponse.json(enriched)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { feedId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await req.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('activity_feed_comments')
      .insert({
        feed_id: params.feedId,
        user_id: user.id,
        content: content.trim()
      })
      .select('id, user_id, content, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user's nickname for the immediate response
    const { data: userData } = await supabase
      .from('users')
      .select('nickname, name')
      .eq('id', user.id)
      .single()

    const enriched = {
      ...data,
      nickname: userData?.nickname || userData?.name || 'Atleta'
    }

    return NextResponse.json(enriched)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
