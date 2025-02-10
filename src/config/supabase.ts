import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = Bun.env.SUPABASE_URL as string;
const supabaseKey: string = Bun.env.SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
