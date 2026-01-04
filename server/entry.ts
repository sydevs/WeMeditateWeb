import { apply, serve } from "@photonjs/hono";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import type { CmsEnv } from "./cms-context";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startServer();

function startServer() {
  const app = new Hono<CmsEnv>();

  // Enable context storage for AsyncLocalStorage-based config access
  // This MUST be registered before other middleware
  app.use(contextStorage());

  apply(app, []);

  return serve(app, {
    port,
  });
}
