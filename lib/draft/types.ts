export interface Draft {
  draft_id: string
  angle_label: string
  angle_description: string
  title: string
  body: string
  seo_keywords: string
  word_count: number
  image_url?: string
}

export interface DraftData {
  idea_status: string
  idea_id: string
  drafts: Draft[]
}
