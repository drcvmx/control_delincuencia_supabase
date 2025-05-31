import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvariuypmrnkzycehux.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdmFyaXV5cG1ybmt6eWNlaHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMjQyNjMsImV4cCI6MjA2MjcwMDI2M30.teM08mimTCPplPYD0uAXZeFQ-8Zvn7sbGyidZI7D3ow";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdmFyaXV5cG1ybmt6eWNlaHV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzEyNDI2MywiZXhwIjoyMDYyNzAwMjYzfQ.IBPRy6-hOTrLPgzjDkvhgLgwSg4NJ3WD7XO3AxGPqo8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};