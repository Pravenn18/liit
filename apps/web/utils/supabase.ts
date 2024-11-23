import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase configuration is missing.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);