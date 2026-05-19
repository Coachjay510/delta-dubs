import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_PLAYERS_SUPABASE_URL
const key = import.meta.env.VITE_PLAYERS_SUPABASE_ANON_KEY

export const supabasePlayers = (url && key) ? createClient(url, key) : null
