import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cgdctgeccwsetxqcoqti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZGN0Z2VjY3dzZXR4cWNvcXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODMxNjUsImV4cCI6MjA2NjM1OTE2NX0.xA_lbQuGicI-Kd8mPxFx3LZjv2C4_CAo5W8Qe2LdNo8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 