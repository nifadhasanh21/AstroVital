// backend/src/config/supabase.ts
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Env Check:', {
  url: supabaseUrl ? '✅ Loaded' : '❌ Missing',
  anonKey: supabaseKey ? '✅ Loaded' : '❌ Missing',
  serviceKey: serviceRoleKey ? '✅ Loaded' : '❌ Missing'
});

// Normal Client (User Authentication)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin Client (RLS Bypass)
// Ei client ta notun sb_secret_ key ke support kore
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    // Notun key format er jonno header ta explicitly set kora holo
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  },
});