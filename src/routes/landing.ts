import { serve } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";

const landing = new Hono();

landing.get("/", (c) => {
  return c.text("Running API v1 - Powered by HonoJS!");
});

export default landing;
