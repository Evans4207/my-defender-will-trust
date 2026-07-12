/**
 * Supabase database types.
 *
 * PLACEHOLDER — regenerate from the live schema once the hosted project is
 * linked and migrations are applied:
 *
 *   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
 *
 * Until then this permissive shape keeps the typed clients compiling.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
