import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { deleteCookie, setCookie } from "hono/cookie";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";

import type { JwtVariables } from "hono/jwt";
import { supabase } from "../config/supabase";
import { User } from "../models/User";

type Variables = JwtVariables;

const auth = new Hono<{ Variables: Variables }>();

const hashPassword = (rawPassword: string) => {
  const salt = genSaltSync();
  return hashSync(rawPassword, salt);
};

//Sign Up
auth.post("/signup", async (c) => {
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
    return c.json(error);
  }
  console.log("PASSED");

  return c.json(data);
});

//Login
auth.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (error) {
    return c.json(error);
  }

  if (data.length === 0) {
    return c.json({
      message: "email " + email + " " + "Not found",
    });
  }

  const user = data[0];

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    lastLogin: user.LastLogin,
    exp: Math.floor(Date.now() / 1000) + 60 * 20,
  };

  const secretKey = Bun.env.JWT_SECRET as string;

  const token = await sign(payload, secretKey);

  const match = compareSync(password, user.password);

  if (!match) {
    return c.json({ message: "Error" });
  } else {
    setCookie(c, "auth_token", token, {
      secure: true,
      httpOnly: true,
    });

    await supabase
      .from("data_user")
      .update({ LastLogin: new Date(Date.now()) })
      .eq("email", email)
      .select();

    return c.json({
      message: "Success",
      data: payload,
      token: token,
    });
  }
});

// Logout
auth.delete("/logout", (c) => {
  deleteCookie(c, "auth_token");
  return c.json({ message: "Logout Successfully" }, 200);
});

// auth.use(
//   "/auth/*",
//   jwt({
//     secret: "it-is-very-secret",
//   })
// );

// auth.get("/auth/page", (c) => {
//   const payload = c.get("jwtPayload");
//   return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
// });

export default auth;
