import { createClient } from "@supabase/supabase-js";

/**
 * Membuat Supabase client di server menggunakan SUPABASE_URL dan SUPABASE_SECRET_KEY.
 * Digunakan untuk membaca katalog dan detail produk (server-side) tanpa terhalang RLS.
 */
export function createServerClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!rawUrl || !supabaseSecretKey) {
    throw new Error(
      "SUPABASE_URL atau SUPABASE_SECRET_KEY belum diatur di environment variable."
    );
  }

  // Bersihkan URL jika memiliki akhiran /rest/v1 atau trailing slash
  const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createClient(supabaseUrl, supabaseSecretKey.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const getSupabaseServer = createServerClient;
export const createClientServer = createServerClient;

