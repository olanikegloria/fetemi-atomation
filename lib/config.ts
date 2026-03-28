/** Base URL for n8n webhooks (no trailing slash). Override in Vercel env. */
export function getN8nWebhookBase(): string {
  return (
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE?.replace(/\/$/, '') ||
    'https://cohort2pod2.app.n8n.cloud/webhook'
  )
}

export function n8nWebhookUrl(path: string): string {
  const base = getN8nWebhookBase()
  const p = path.replace(/^\//, '')
  return `${base}/${p}`
}
