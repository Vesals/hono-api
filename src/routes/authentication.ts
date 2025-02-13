import { Hono } from "hono";
import { sign } from "hono/jwt";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";

import type { JwtVariables } from "hono/jwt";
import { deleteCookie, setCookie } from "hono/cookie";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";

import { supabase } from "../config/supabase";
import { z } from "zod";

type Variables = JwtVariables;

const auth = new Hono<{ Variables: Variables }>();

const schema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
      message:
        "Minimum eight characters, at least one letter, one number and one special character",
    }),
});

auth.use(logger());

const hashPassword = (rawPassword: string) => {
  const salt = genSaltSync();
  return hashSync(rawPassword, salt);
};

//Sign Up
auth.post("/signup", zValidator("json", schema), async (c) => {
  const { name, password, email } = await c.req.json();

  const hashed = hashPassword(password);

  const newUser = {
    name,
    password: hashed,
    email,
    avatar: "",
  };

  const { data, error } = await supabase
    .from("users")
    .insert([newUser])
    .select();

  if (error) {
    console.log(error);
    return c.json(error, 500);
  }

  return c.json({
    message: "Signup successful",
    data: data,
  });
});

//Login

auth.post("/login", zValidator("json", schema), async (c) => {
  const { email, password } = await c.req.json();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (error) {
    return c.json(error, 500);
  }

  if (data.length === 0) {
    return c.json({ message: "Wrong Credential" }, 404); // 404 for not found
  }

  const user = data[0];
  const match = compareSync(password, user.password);

  if (!match) {
    return c.json({ message: "Invalid password" }, 401); // 401 for invalid password
  }

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    lastLogin: user.LastLogin,
    // exp: Math.floor(Date.now() / 1000) + 15, // 15 sec
    exp: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
  };

  const secretKey = Bun.env.JWT_SECRET as string;

  // signing the token
  const token = await sign(payload, secretKey);

  await supabase
    .from("data_user")
    .update({ LastLogin: new Date(Date.now()) })
    .eq("email", email);

  // Set the token in a secure cookie

  setCookie(c, "auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
    maxAge: 60, // in seconds
  });

  return c.json({
    message: "Success",
    data: payload,
    token: token,
  });
});

// Logout
auth.post("/logout", (c) => {
  setCookie(c, "auth_token", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true, // ensures only the server can clear the cookie
  });

  return c.json({ message: "Logged out Successfully" }, 200);
});

// auth.delete("/logout", (c) => {
//   deleteCookie(c, "auth_token");
//   return c.json({ message: "Logged out Successfully" }, 200);
// });

export default auth;
