import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { logger } from '@/lib/utils/logger'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    logger.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (!id) {
    logger.error('Webhook payload missing user id')
    return new Response('Missing user id', { status: 400 })
  }

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, image_url } = evt.data
    const rawEmail = email_addresses[0]?.email_address
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim()
    const email = rawEmail ? normalizeEmail(rawEmail) : undefined

    if (email) {
      // 1. Prioriza vínculo por clerkId
      const userByClerkId = await db.query.users.findFirst({
        where: eq(users.clerkId, id),
      })

      // 2. Fallback por email normalizado
      const existingUser = userByClerkId ?? await db.query.users.findFirst({
        where: sql`lower(${users.email}) = ${email}`,
      })

      if (existingUser) {
        // Atualizar usuário existente com o ID do Clerk
        await db.update(users)
          .set({ 
            clerkId: id,
            email,
            name: name || existingUser.name,
            avatar: image_url || existingUser.avatar,
            updatedAt: new Date() 
          })
          .where(eq(users.id, existingUser.id))
      } else if (eventType === 'user.created') {
        // Criar novo usuário se não existir (Clerk gerencia autenticação)
        await db.insert(users).values({
          email,
          clerkId: id,
          name: name || 'Usuário',
          avatar: image_url,
        })
      }
    }
  }

  return new Response('', { status: 200 })
}
