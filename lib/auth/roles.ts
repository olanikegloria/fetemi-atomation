/** Single manager account — everyone else is treated as a content creator. */
export const MANAGER_EMAIL = 'olanikegloria2020@gmail.com'

export type AppRole = 'manager' | 'content_creator'

export function getRoleFromEmail(email: string | null | undefined): AppRole {
  const e = (email || '').trim().toLowerCase()
  return e === MANAGER_EMAIL.toLowerCase() ? 'manager' : 'content_creator'
}

/** Where to send the user right after magic-link callback. */
export function getPostLoginPath(_role: AppRole): string {
  return '/dashboard'
}
