const { createClient } = supabase;

const SUPABASE_URL = "https://kgjeekoshzkzqdookxop.supabase.co";
const SUPABASE_KEY = "sb_publishable_rCEdcr5S6hV8erg3xdQvJA_TYdvv9Lt";

export const clienteSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);