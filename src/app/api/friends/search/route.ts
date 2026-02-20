/**
 * Friends Search API Route
 * Search public users by nickname to send friend requests
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('q')
  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  // Search public users by nickname, excluding the current user
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, name')
    .eq('is_public', true)
    .neq('id', user.id)
    .or(`nickname.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
