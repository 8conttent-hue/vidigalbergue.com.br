import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.SUPABASE_URL || 'https://uorwocetqyjkpioimrjk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcndvY2V0cXlqa3Bpb2ltcmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzIyMDAsImV4cCI6MjA3MzYwODIwMH0.j38OH0NtpaZbPvtSabtXKuVHxE_wIJLTkTp5YJkhads';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});