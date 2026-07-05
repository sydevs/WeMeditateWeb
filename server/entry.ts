import { apply, serve } from '@photonjs/hono'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import type { CmsEnv } from './cms-context'
import { registerApiRoutes } from './api-routes'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

export default startServer()

function startServer() {
  const app = new Hono<CmsEnv>()

  // Enable context storage for AsyncLocalStorage-based config access
  // This MUST be registered before other middleware
  app.use(contextStorage())

  // Same-origin JSON endpoints (client-loaded related content). Registered
  // before Vike's handler so they take precedence over the page catch-all.
  registerApiRoutes(app)

  apply(app, [])

  return serve(app, {
    port,
  })
}
