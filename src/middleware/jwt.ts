import { Context } from "hono";
import { verify } from "hono/jwt";

export const verifyToken = async (c: Context, next: () => Promise<void>) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return c.json({ message: "Authorization token is missing" }, 401);
    }

    const secretKey = Bun.env.JWT_SECRET as string;

    const decoded = await verify(token, secretKey);
    c.set("jwtPayload", decoded);

    // go to the next route handler
    await next();
  } catch (err) {
    return c.json({ message: "Invalid or expired token" }, 401);
  }
};
