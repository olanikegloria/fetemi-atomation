import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRoleFromEmail } from '@/lib/auth/roles'

function wordCountFromText(s: string): number {
  const t = s.replace(/\s+/g, ' ').trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> },
) {
  const { draftId } = await context.params
  const id = String(draftId || '').trim()
  if (!id) {
    return NextResponse.json({ error: 'Missing draft id' }, { status: 400 })
  }

  let bodyJson: { idea_id?: string; body?: string; title?: string }
  try {
    bodyJson = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ideaId = String(bodyJson.idea_id || '').trim()
  const body = String(bodyJson.body ?? '')
  const title = String(bodyJson.title ?? '').trim()

  if (!ideaId) {
    return NextResponse.json({ error: 'idea_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (getRoleFromEmail(user.email) !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: row, error: fetchErr } = await supabase
    .from('drafts')
    .select('id, idea_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  if (String(row.idea_id) !== ideaId) {
    return NextResponse.json({ error: 'idea_id does not match draft' }, { status: 400 })
  }

  const wc = wordCountFromText(body)
  const update: Record<string, unknown> = {
    body,
    word_count: wc,
    title: title || 'Untitled',
  }

  const { error: updErr } = await supabase.from('drafts').update(update).eq('id', id)

  if (updErr) {
    return NextResponse.json(
      { error: updErr.message || 'Update failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    draft_id: id,
    word_count: wc,
  })
}
