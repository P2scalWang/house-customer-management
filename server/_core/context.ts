import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { UserRow as User } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // In dev mode, if no user is found, try to get the first user from database
  if (!user && process.env.VITE_DISABLE_AUTH === 'true') {
    try {
      const { supabase } = await import("../supabase");
      const { data } = await supabase
        .from("users")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (data) {
        user = {
          id: data.id,
          openId: data.openId ?? data.id?.toString() ?? "dev-user",
          name: data.name,
          email: data.email,
          loginMethod: data.loginMethod,
          role: data.role,
          lastSignedIn: data.lastSignedIn,
        };
      }
    } catch (err) {
      console.warn("[Context] Could not fetch dev user from database:", err);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
