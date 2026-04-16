import { createClient } from "@supabase/supabase-js";

// Anon/publishable key é pública por design — seguro no código frontend
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://zvpnygrujxkegtjhznex.supabase.co";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "sb_publishable_jbIoJPpWa8qU6lVONnIYjw_LD_pVsMR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
