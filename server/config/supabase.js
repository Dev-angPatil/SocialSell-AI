// Fix for Supabase Realtime in Node.js < 22
global.WebSocket = require('ws');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in environment variables.');
}

const isConfigured = (key) => key && key !== 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE' && key !== 'YOUR_SUPABASE_ANON_KEY_HERE' && !key.startsWith('YOUR_');

// 1. Service Client (Admin role, bypasses RLS)
const supabase = (supabaseUrl && isConfigured(supabaseServiceKey)) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// 2. Anon Client (Respects RLS, acts as guest/user)
const supabaseAnon = (supabaseUrl && isConfigured(supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

module.exports = {
  supabase,
  supabaseAnon
};
