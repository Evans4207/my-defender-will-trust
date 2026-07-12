// Provide harmless defaults so modules that validate env at import time don't
// throw during unit tests (real values come from .env.local at runtime).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://placeholder.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "placeholder-anon-key";
process.env.NEXT_PUBLIC_SITE_URL ||= "http://localhost:3000";
