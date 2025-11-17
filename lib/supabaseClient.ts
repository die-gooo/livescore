import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zepfcyodzsnommbzaoox.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcGZjeW9kenNub21tYnphb294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzc5MjUsImV4cCI6MjA3ODkxMzkyNX0.C66FXQlygZ1x3fxh1AXT4xO_d4h4CvAEa12AD-97LZA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
