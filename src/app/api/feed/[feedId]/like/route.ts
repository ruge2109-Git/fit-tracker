import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const feedId = params.feedId

    // Check if like exists
    const { data: existingLike } = await supabase
      .from('activity_feed_likes')
      .select('id')
      .eq('feed_id', feedId)
      .eq('user_id', user.id)
      .single()

    let liked = false

    if (existingLike) {
      // Unlike
      await supabase
        .from('activity_feed_likes')
        .delete()
        .eq('id', existingLike.id)
    } else {
      // Like
      await supabase
        .from('activity_feed_likes')
        .insert({
          feed_id: feedId,
          user_id: user.id
        })
      liked = true
    }

    // Get new total likes count
    const { count } = await supabase
      .from('activity_feed_likes')
      .select('id', { count: 'exact' })
      .eq('feed_id', feedId)

    return NextResponse.json({ liked, likesCount: count || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
