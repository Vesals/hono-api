import { serve } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import landing from "./routes/landing";
import booksRoute from "./routes/booksRoute";
import auth from "./routes/authentication";
import user from "./routes/user";
import { verifyToken } from "./middleware/jwt";

const app = new Hono().basePath("/api");

app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000"], // frontend url
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 3600,
    credentials: true,
  })
);

app.route("/", landing);
app.route("/auth", auth);

// protect route with middleware
app.use("/user/*", verifyToken);
// app.use("/books/*", verifyToken);

// protected routes
app.route("/user", user);
app.route("/books", booksRoute);

showRoutes(app, { colorize: true });

const port = 8080;
console.log(`Server is running on http://localhost:${port}/api`);

serve({
  fetch: app.fetch,
  port,
});
