import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../src/constants/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || CONFIG.SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
