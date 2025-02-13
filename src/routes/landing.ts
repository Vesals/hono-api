import { Hono } from "hono";

const landing = new Hono();

landing.get("/", (c) => {
  return c.text("Running API v1 - Powered by HonoJS!");
});

export default landing;
